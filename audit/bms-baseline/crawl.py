"""Read-only HTTP baseline for bmstechnik.pl. Requires Python 3.10+ and lxml."""

import argparse
from collections import defaultdict
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import hashlib
import heapq
import http.client
import json
import mimetypes
from pathlib import Path
import re
import ssl
import time
from urllib.parse import parse_qs, quote, unquote, urljoin, urlsplit, urlunsplit
from urllib.robotparser import RobotFileParser

from lxml import etree, html


SITE = "https://bmstechnik.pl"
HOSTS = {"bmstechnik.pl", "www.bmstechnik.pl"}
UA = "BMS-Technik-Public-Migration-Audit/1.0"
FONT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
MAX_BODY = 64 * 1024 * 1024
ASSET_EXT = re.compile(r"\.(?:avif|bmp|gif|ico|jpe?g|png|svgz?|tiff?|webp|pdf|docx?|xlsx?|pptx?|zip|rar|7z|css|m?js|map|woff2?|eot|ttf|otf|mp[34]|m4[av]|webm|ogg|mov|wav|webmanifest)(?:$|[?#])", re.I)
STYLE_URL = re.compile(r"""url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)|@import\s+["']([^"']+)["']""", re.I)
REDIRECTS = {301, 302, 303, 307, 308}
INTERNAL_NAV = {"seed", "link", "canonical", "sitemap-entry", "wp-content-link", "wp-attachment", "redirect", "variant", "wp-shortlink", "alternate", "meta-refresh", "probe-alias"}
EXTERNAL_ASSET = {"asset", "css", "js-asset", "media-original", "media-size", "og-asset", "embed-thumbnail"}
SENSITIVE_QUERY = {"nonce", "_wpnonce", "token", "password", "key", "preview_nonce"}
SEEDS = [
    ("/robots.txt", "robots", 0),
    ("/", "seed", 1),
    ("/sitemap.xml", "sitemap", 0),
    ("/wp-sitemap.xml", "sitemap", 0),
    ("/sitemap_index.xml", "probe", 2),
    ("/wp-json/", "api", 3),
    ("/wp-json/wp/v2/pages?per_page=100&_fields=id,slug,link,parent", "api-list", 3),
    ("/wp-json/wp/v2/posts?per_page=100&_fields=id,slug,link", "api-list", 3),
    ("/wp-json/wp/v2/media?per_page=100&_fields=id,slug,link,source_url,media_details,mime_type,alt_text,post", "api-media", 3),
    ("/favicon.ico", "asset", 3),
    ("/audit-bms-baseline-404-check-20261106/", "probe-404", 3),
]
# A single read-only sample of the observed search form and WordPress archive
# aliases derived from the published author, category and month.
EXTRA_PROBES = [
    ("/?s=rekuperacja", "probe-search", "observed GET form; service name as sample input"),
    ("/?author=1", "probe-alias", "public author ID"),
    ("/?cat=1", "probe-alias", "public category ID"),
    ("/?m=202203", "probe-alias", "published month archive"),
    ("/2022/", "probe-alias", "year parent of published month archive"),
]


def utc():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def compact(value):
    return " ".join(value.split())


def absolute(base, value):
    value = value.strip()
    if not value or value.startswith(("#", "data:", "javascript:", "blob:")):
        return None
    try:
        parts = urlsplit(urljoin(base, value))
        if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password:
            return None
        path = quote(parts.path or "/", safe="/%:@!$&'()*+,;=-._~")
        query = quote(parts.query, safe="=&;%:/?+@!$'()*,-._~")
        return urlunsplit((parts.scheme, parts.netloc.lower(), path, query, ""))
    except ValueError:
        return None


def txt(node):
    return compact(" ".join(node.itertext()))


def identify(node):
    return {key: node.get(key) for key in ("id", "class", "role", "aria-label", "data-widget_type") if node.get(key)}


def css_references(content):
    content = re.sub(r"/\*.*?\*/", "", content, flags=re.S)
    for match in STYLE_URL.finditer(content):
        yield next(value for value in match.groups() if value is not None).strip()


def srcset_urls(value):
    # Ordinary and data-URI candidates, with optional w/x descriptors.
    for match in re.finditer(r"(?:^|,)\s*((?:data:[^\s]+)|(?:[^,\s]+))(?:\s+[^,]*)?", value):
        yield match.group(1)


def mime_extension(content_type, url):
    mime = content_type.split(";")[0].lower()
    known = {"text/html": ".html", "text/css": ".css", "text/xml": ".xml", "application/xml": ".xml",
             "application/json": ".json", "application/javascript": ".js", "text/javascript": ".js",
             "image/jpeg": ".jpg", "font/woff2": ".woff2", "image/x-icon": ".ico",
             "application/rss+xml": ".xml", "application/xslt+xml": ".xsl"}
    ext = known.get(mime) or mimetypes.guess_extension(mime) or Path(urlsplit(url).path).suffix
    return ext.lower() if ext and re.fullmatch(r"\.[a-zA-Z0-9]{1,12}", ext) else ".bin"


class Crawl:
    def __init__(self, output, delay):
        self.output = output
        self.delay = delay
        self.urls = {}
        self.edges = []
        self.edge_keys = set()
        self.pages = {}
        self.assets = {}
        self.media = {}
        self.sitemaps = {}
        self.robots = RobotFileParser()
        self.robot_source = None
        self.queue = []
        self.rank = {}
        self.next_time = defaultdict(float)
        self.seq = 0
        self.started = utc()
        self.ssl = ssl.create_default_context()
        self.variants = set()
        self.attempts = 0

    def reference(self, source, value, kind, detail=None, priority=None):
        if not isinstance(value, str):
            return
        url = absolute(source or SITE, value)
        if not url:
            return
        parts = urlsplit(url)
        internal = parts.hostname in HOSTS
        edge_key = (source, url, kind, value, detail)
        if edge_key not in self.edge_keys:
            self.edge_keys.add(edge_key)
            self.edges.append({"source": source, "target": url, "raw": value, "kind": kind, "detail": detail})
        record = self.urls.setdefault(url, {"scope": "internal" if internal else "external", "kinds": [], "attempts": []})
        if kind not in record["kinds"]:
            record["kinds"].append(kind)
        if "http" in record:
            return
        if parts.port not in (None, 80, 443):
            record["skipped"] = "port-out-of-scope"
            return
        if SENSITIVE_QUERY.intersection(key.lower() for key in parse_qs(parts.query, keep_blank_values=True)):
            record["skipped"] = "sensitive-or-preview-query"
            return
        if kind in {"form-action", "runtime-endpoint", "preconnect", "pingback", "embed", "external-link", "schema-reference"}:
            record.setdefault("skipped", "reference-only")
            return
        if not internal and kind not in EXTERNAL_ASSET:
            record.setdefault("skipped", "external-navigation-or-redirect")
            return
        if internal and (parts.path.startswith("/wp-admin/") or parts.path in ("/wp-login.php", "/wp-cron.php", "/xmlrpc.php")):
            record["skipped"] = "wordpress-admin-or-write-capable-endpoint"
            return
        if self.robot_source and internal and not self.robots.can_fetch(UA, url):
            record["skipped"] = "robots.txt"
            return
        record.pop("skipped", None)
        if priority is None:
            priority = 6 if kind in EXTERNAL_ASSET else 2
        if priority < self.rank.get(url, 1000):
            self.rank[url] = priority
            self.seq += 1
            heapq.heappush(self.queue, (priority, self.seq, url))

    def store(self, url, body, content_type):
        digest = hashlib.sha256(body).hexdigest()
        name = f"snapshot/sha256/{digest[:2]}/{digest}{mime_extension(content_type, url)}"
        path = self.output / name
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_bytes(body)
        return {"path": name, "sha256": digest, "bytes": len(body)}

    def get(self, url):
        parts = urlsplit(url)
        group = "bms" if parts.hostname in HOSTS else parts.hostname
        time.sleep(max(0, self.next_time[group] - time.monotonic()))
        is_font_css = parts.hostname == "fonts.googleapis.com"
        user_agent = FONT_UA if is_font_css else UA
        target = parts.path + ("?" + parts.query if parts.query else "")
        conn_type = http.client.HTTPSConnection if parts.scheme == "https" else http.client.HTTPConnection
        extra = {"context": self.ssl} if parts.scheme == "https" else {}
        conn = conn_type(parts.hostname, parts.port, timeout=22, **extra)
        result = {"at_utc": utc(), "request_user_agent": user_agent}
        body = None
        try:
            conn.request("GET", target, headers={"User-Agent": user_agent, "Accept": "*/*", "Accept-Encoding": "identity"})
            response = conn.getresponse()
            headers = defaultdict(list)
            for key, value in response.getheaders():
                headers[key.lower()].append(value)
            result.update(status=response.status, reason=response.reason, headers=dict(headers))
            body = response.read(MAX_BODY + 1)
            if len(body) > MAX_BODY:
                body = None
                result["error"] = "body-exceeds-64-MiB"
            if body:
                result["body"] = self.store(url, body, (headers["content-type"] or [""])[0])
        except (OSError, http.client.HTTPException) as error:
            result["error"] = f"{type(error).__name__}: {error}"
        finally:
            conn.close()
            self.next_time[group] = time.monotonic() + (self.delay if group == "bms" else 1.0)
        self.attempts += 1
        print(f"{self.attempts:04} {result.get('status', 'ERR')} {url} {result.get('error', '')}", flush=True)
        return result, body

    def fetch(self, url):
        record = self.urls[url]
        for retry in range(3):
            result, body = self.get(url)
            record["attempts"].append(result)
            status = result.get("status")
            if retry < 2 and (status in (429, 502, 503, 504) or status is None):
                wait = self.retry_after(result, 20 if status == 429 else 4 * (retry + 1))
                if wait > 600:
                    result["retry_skipped"] = "retry-after-exceeds-600-seconds"
                    break
                print(f"     retry in {wait}s", flush=True)
                time.sleep(wait)
            else:
                break
        record["http"] = result
        if status in REDIRECTS:
            for location in result["headers"].get("location", []):
                target = absolute(url, location)
                record["redirect_to"] = target
                if target and urlsplit(target).hostname not in HOSTS and any(kind in EXTERNAL_ASSET for kind in record["kinds"]):
                    self.reference(url, location, "asset", "HTTP Location", 6)
                else:
                    self.reference(url, location, "redirect", "HTTP Location", self.rank[url])
            return
        if not body:
            return
        headers = result.get("headers", {})
        content_type = (headers.get("content-type") or [""])[0].lower()
        for item in headers.get("link", []):
            self.header_links(url, item)
        for item in headers.get("x-pingback", []):
            self.reference(url, item, "pingback", "HTTP X-Pingback")
        if url == SITE + "/robots.txt" and status == 200:
            self.robot_source = url
            self.robots.parse(body.decode("utf-8-sig", errors="replace").splitlines())
            for match in re.finditer(r"^\s*Sitemap\s*:\s*(\S+)", body.decode("utf-8-sig", errors="replace"), re.M | re.I):
                self.reference(url, match.group(1), "sitemap", "robots.txt", 0)
        elif "text/html" in content_type and record["scope"] == "internal":
            self.parse_html(url, body, status)
        elif 200 <= status < 300:
            if "xml" in content_type:
                self.parse_xml(url, body)
            if "json" in content_type and {"api-media", "api-list"}.intersection(record["kinds"]):
                self.parse_wp(url, body, headers)
            if "json" in content_type and "/oembed/" in urlsplit(url).path:
                try:
                    self.parse_oembed(url, json.loads(body))
                except ValueError as error:
                    record["parse_error"] = str(error)
            if "text/css" in content_type:
                self.parse_css(url, body)
            if "javascript" in content_type or urlsplit(url).path.endswith((".js", ".mjs")):
                self.parse_js(url, body.decode("utf-8", errors="replace"))

    @staticmethod
    def retry_after(result, fallback):
        values = result.get("headers", {}).get("retry-after", [])
        if values:
            try:
                return max(1, int(values[0]))
            except ValueError:
                try:
                    return max(1, int((parsedate_to_datetime(values[0]) - datetime.now(timezone.utc)).total_seconds()) + 1)
                except (ValueError, TypeError, OverflowError):
                    pass
        return fallback

    def header_links(self, url, value):
        for match in re.finditer(r"<([^>]+)>((?:[^,]|,(?!\s*<))*)", value):
            target, attrs = match.groups()
            rel = re.search(r"""(?:^|;)\s*rel\s*=\s*["']?([^;"']+)""", attrs, re.I)
            rel_value = rel.group(1).strip() if rel else ""
            kind = {"shortlink": "wp-shortlink", "canonical": "canonical", "alternate": "alternate",
                    "https://api.w.org/": "api"}.get(rel_value, "link")
            self.reference(url, target, kind, "HTTP Link " + rel_value)

    def parse_xml(self, url, body):
        try:
            doc = etree.fromstring(body, parser=etree.XMLParser(resolve_entities=False, no_network=True))
        except etree.XMLSyntaxError as error:
            self.urls[url]["parse_error"] = str(error)
            return
        local = etree.QName(doc).localname
        if local in ("sitemapindex", "urlset"):
            loc = doc.xpath("/*/*/*[local-name()='loc']/text()")
            self.sitemaps[url] = {"type": local, "entries": loc}
            for target in loc:
                self.reference(url, target, "sitemap" if local == "sitemapindex" else "sitemap-entry", local, 0 if local == "sitemapindex" else 1)
        for pi in doc.getroottree().xpath("/processing-instruction('xml-stylesheet')"):
            match = re.search(r"""href\s*=\s*["']([^"']+)""", pi.text)
            if match:
                self.reference(url, match.group(1), "asset", "xml-stylesheet")
        if local in ("rss", "feed", "RDF"):
            for target in doc.xpath("//*[local-name()='link']/text() | //*[local-name()='link']/@href"):
                self.reference(url, target, "link", "feed link")
            for target in doc.xpath("//*[local-name()='enclosure']/@url | //*[local-name()='thumbnail']/@url | //*[local-name()='content']/@url"):
                self.reference(url, target, "asset", "feed media")
        if local == "svg":
            for target in doc.xpath("//*[local-name()='image' or local-name()='use']/@*[local-name()='href']"):
                self.reference(url, target, "asset", "SVG href")
        if local == "oembed":
            self.parse_oembed(url, {etree.QName(node).localname: node.text for node in doc if isinstance(node.tag, str)})

    def parse_oembed(self, url, data):
        if not isinstance(data, dict):
            return
        self.reference(url, data.get("thumbnail_url"), "embed-thumbnail", "oEmbed thumbnail_url")
        for key in ("author_url", "provider_url"):
            self.reference(url, data.get(key), "link", "oEmbed " + key)
        markup = data.get("html")
        if not markup:
            return
        doc = html.fragment_fromstring(markup, create_parent=True)
        for target in doc.xpath(".//iframe/@src"):
            resolved = absolute(url, target)
            kind = "wp-embed" if resolved and urlsplit(resolved).hostname in HOSTS else "embed"
            self.reference(url, target.split("#", 1)[0], kind, "oEmbed iframe", 4)
        for target in re.findall(r"sourceURL\s*=\s*([^\s*]+)", markup):
            self.reference(url, target, "js-asset", "oEmbed sourceURL")

    def parse_wp(self, url, body, headers):
        try:
            data = json.loads(body)
        except ValueError as error:
            self.urls[url]["parse_error"] = str(error)
            return
        if not isinstance(data, list):
            return
        query = parse_qs(urlsplit(url).query)
        current = int(query.get("page", ["1"])[0])
        pages = int(headers.get("x-wp-totalpages", ["1"])[0])
        if current < pages:
            base = re.sub(r"&page=\d+$", "", url)
            kind = "api-media" if "api-media" in self.urls[url]["kinds"] else "api-list"
            self.reference(url, f"{base}&page={current + 1}", kind, "WordPress collection pagination", 3)
        for item in data:
            if "source_url" in item:
                self.media[str(item["id"])] = item
                source = item["source_url"]
                self.reference(url, item.get("link"), "wp-attachment", f"attachment id {item['id']}", 4)
                self.reference(url, source, "media-original", f"attachment id {item['id']}")
                details = item.get("media_details")
                if not isinstance(details, dict):
                    continue
                if details.get("original_image"):
                    self.reference(url, urljoin(source, details["original_image"]), "media-original", f"unscaled attachment id {item['id']}")
                for name, size in details.get("sizes", {}).items():
                    if isinstance(size, dict):
                        self.reference(url, size.get("source_url") or urljoin(source, size.get("file", "")),
                                       "media-size", f"{item['id']} {name}")
            elif item.get("link"):
                self.reference(url, item["link"], "wp-content-link", f"WordPress id {item['id']}", 1)
                param = "page_id" if "/pages?" in url else "p"
                self.reference(url, f"{SITE}/?{param}={item['id']}", "wp-shortlink", "public WordPress id", 5)
                if item.get("slug") and item["link"] == SITE + "/":
                    self.reference(url, f"{SITE}/{item['slug']}/", "variant", "slug of front page in API", 5)

    def parse_css(self, url, body):
        content = body.decode("utf-8", errors="replace")
        for target in css_references(content):
            self.reference(url, target, "css", "CSS url() or @import")
        for target in re.findall(r"sourceMappingURL\s*=\s*([^\s*]+)", content):
            self.reference(url, target, "css", "sourceMappingURL")

    def parse_js(self, url, content):
        for target in re.findall(r"sourceMappingURL\s*=\s*([^\s*]+)", content):
            self.reference(url, target, "js-asset", "sourceMappingURL")
        for match in re.finditer(r"""["'`]((?:https?://[^"'\s`<>]+|(?:/wp-content/|/wp-includes/|\.\.?/)[^"'\s`<>]+))["'`]""", content):
            value = match.group(1)
            if ASSET_EXT.search(value) and not any(char in value for char in ("{", "}", "$", "\\")):
                self.reference(url, value, "js-asset", "static literal in JavaScript")
        for match in re.finditer(r"""["']([^"'\s]*(?:admin-ajax\.php|/wp-json/|recaptcha/api\.js)[^"'\s]*)["']""", content):
            self.reference(url, match.group(1), "runtime-endpoint", "literal in JavaScript")

    def variants_for(self, url):
        parts = urlsplit(url)
        path = parts.path
        if parts.hostname not in HOSTS or parts.query or path in self.variants or path.startswith(("/wp-", "/feed/")) or re.search(r"\.[^/]+$", path):
            return
        self.variants.update({path, path.rstrip("/"), path.rstrip("/") + "/"})
        candidates = {"/"} if path == "/" else {path.rstrip("/"), path.rstrip("/") + "/"}
        for protocol in ("http", "https"):
            for host in sorted(HOSTS):
                for candidate in sorted(candidates):
                    target = f"{protocol}://{host}{candidate}"
                    if target != url:
                        self.reference(url, target, "variant", "scheme, host and trailing slash matrix", 5)

    def parse_html(self, url, body, status):
        try:
            doc = html.fromstring(body, parser=html.HTMLParser(encoding="utf-8", no_network=True))
        except (ValueError, etree.LxmlError) as error:
            self.urls[url]["parse_error"] = str(error)
            return
        base = urljoin(url, (doc.xpath("//head/base/@href") or [""])[0])

        def add(value, kind, detail, priority=None):
            if not isinstance(value, str):
                return
            if base == url or value.startswith(("#", "data:", "mailto:", "tel:", "javascript:")):
                self.reference(url, value, kind, detail, priority)
            elif resolved := absolute(base, value):
                self.reference(url, resolved, kind, detail, priority)

        title = [txt(n) for n in doc.xpath("//head/title")]
        meta = [{"key": n.get("name") or n.get("property") or n.get("http-equiv") or n.get("itemprop"),
                 "content": n.get("content"), "attributes": dict(n.attrib)} for n in doc.xpath("//head/meta")]
        canonical = []
        alternates = []
        for node in doc.xpath("//link[@href]"):
            rel = node.get("rel", "").lower().split()
            target = node.get("href")
            if "canonical" in rel:
                canonical.append({"raw": target, "url": absolute(base, target)})
                add(target, "canonical", "HTML link")
            elif "alternate" in rel:
                alternates.append(dict(node.attrib))
                add(target, "alternate", node.get("type") or node.get("hreflang") or "HTML link")
            elif "shortlink" in rel:
                add(target, "wp-shortlink", "HTML link")
            elif "pingback" in rel:
                add(target, "pingback", "HTML link")
            elif any(r in rel for r in ("stylesheet", "icon", "apple-touch-icon", "mask-icon", "preload", "modulepreload", "prefetch", "manifest")):
                add(target, "asset", "link " + " ".join(rel))
            elif any(r in rel for r in ("preconnect", "dns-prefetch")):
                add(target, "preconnect", " ".join(rel))
            elif "https://api.w.org/" in rel:
                add(target, "api", "HTML link")
            else:
                add(target, "external-link", "link " + " ".join(rel))
            for value in srcset_urls(node.get("imagesrcset", "")):
                add(value, "asset", "link imagesrcset")
        for item in meta:
            key = (item["key"] or "").lower()
            if key in ("og:image", "og:image:url", "og:image:secure_url", "og:video", "og:video:url", "og:video:secure_url",
                       "og:audio", "og:audio:url", "og:audio:secure_url", "twitter:image", "twitter:image:src", "msapplication-tileimage"):
                add(item["content"], "og-asset", key)
            if key == "refresh" and isinstance(item["content"], str):
                match = re.search(r"url\s*=\s*(.+)", item["content"], re.I)
                if match:
                    add(match.group(1).strip(" '\""), "meta-refresh", "HTML meta refresh")
        links = []
        for node in doc.xpath("//a[@href] | //area[@href]"):
            value = node.get("href")
            target = absolute(base, value)
            link = {"href": value, "url": target, "fragment": urlsplit(urljoin(base, value)).fragment,
                    "text": txt(node), "attributes": identify(node), "rel": node.get("rel"),
                    "download": node.get("download"), "in_nav": bool(node.xpath("ancestor::nav")),
                    "in_footer": bool(node.xpath("ancestor::footer"))}
            links.append(link)
            if target:
                kind = "asset" if ASSET_EXT.search(target) or node.get("download") is not None else "link"
                if urlsplit(target).hostname not in HOSTS and kind != "asset":
                    kind = "external-link"
                add(value, kind, f"<{node.tag} href>")
        for node in doc.xpath("//*"):
            tag = node.tag if isinstance(node.tag, str) else ""
            for key, value in node.attrib.items():
                if key in ("src", "poster", "background", "data-src", "data-lazy-src", "data-original", "data-bg", "data-background-image",
                           "data-full-url", "data-large_image", "data-thumbnail", "data-poster", "data-orig-file", "data-medium-file",
                           "data-large-file", "data-full-image", "data-lazy", "data-image", "data-lazy-background") or (tag == "object" and key == "data"):
                    if tag in ("iframe", "frame", "embed"):
                        kind = "asset" if ASSET_EXT.search(value) else "embed"
                    else:
                        kind = "asset"
                    add(value, kind, f"<{tag} {key}>")
                elif key in ("srcset", "data-srcset", "data-lazy-srcset"):
                    for candidate in srcset_urls(value):
                        add(candidate, "asset", f"<{tag} {key}>")
                elif key == "style":
                    for candidate in css_references(value):
                        add(candidate, "css", f"<{tag} style>")
                elif key in ("href", "xlink:href") and tag in ("image", "use"):
                    add(value, "asset", f"<{tag} {key}>")
                elif key.startswith("data-") and ("wp-content" in value or "wp-includes" in value):
                    self.parse_js(url, value.replace("\\/", "/"))
        for style in doc.xpath("//style/text()"):
            for candidate in css_references(style):
                add(candidate, "css", "inline <style>")
        jsonld = []
        for node in doc.xpath("//script[not(@src)]"):
            content = node.text or ""
            if node.get("type", "").lower().split(";")[0] == "application/ld+json":
                try:
                    data = json.loads(content)
                    jsonld.append({"data": data})
                    self.schema_links(url, data)
                except ValueError as error:
                    jsonld.append({"raw": content, "error": str(error)})
            else:
                self.parse_js(url, content.replace("\\/", "/"))
        microdata = [{"type": n.get("itemtype"), "id": n.get("itemid"), "properties": [
            {"name": p.get("itemprop"), "value": p.get("content") or p.get("href") or p.get("src") or txt(p)}
            for p in n.xpath(".//*[@itemprop]")]} for n in doc.xpath("//*[@itemscope]")]
        rdfa = [dict(n.attrib) for n in doc.xpath("//*[@vocab or @typeof or @about or (@property and not(self::meta))]")]
        headings = [{"level": int(n.tag[1]), "text": txt(n), "id": n.get("id")} for n in doc.xpath("//*[self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6]")]
        landmarks = [{"tag": n.tag, **identify(n), "headings": [txt(h) for h in n.xpath(".//*[self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6]")],
                      "paragraphs": len(n.xpath(".//p")), "images": len(n.xpath(".//img"))}
                     for n in doc.xpath("//header | //main | //nav | //article | //section | //aside | //footer | //*[@role='main']")]
        widgets = [{"type": n.get("data-widget_type"), **identify(n), "text_preview": txt(n)[:250]}
                   for n in doc.xpath("//*[@data-widget_type]")]
        content_nodes = doc.xpath("//main | //*[@role='main']") or doc.xpath("//body")
        if content_nodes:
            content_root = html.fromstring(etree.tostring(content_nodes[0], method="html", encoding="unicode"))
            for node in content_root.xpath(".//script | .//style | .//template | .//noscript | .//header | .//footer | .//nav"):
                node.drop_tree()
            content_text = txt(content_root)
        else:
            content_text = ""
        forms = []
        for form in doc.xpath("//form"):
            method = form.get("method", "get").upper()
            action = form.get("action") or url
            add(action, "form-action", method)
            fields = []
            for n in form.xpath(".//input | .//textarea | .//select | .//button"):
                field_type = n.get("type") or n.tag
                labels = n.xpath("ancestor::label") + (form.xpath(".//label[@for=$id]", id=n.get("id")) if n.get("id") else [])
                fields.append({"tag": n.tag, "type": field_type, "name": n.get("name"), "id": n.get("id"),
                               "label": " ".join(map(txt, labels)), "placeholder": n.get("placeholder"),
                               "required": n.get("required") is not None or n.get("aria-required") == "true",
                               "constraints": {key: n.get(key) for key in ("maxlength", "minlength", "max", "min", "pattern", "autocomplete") if n.get(key) is not None},
                               "value": n.get("value") if field_type != "hidden" else None,
                               "options": [{"value": o.get("value"), "label": txt(o)} for o in n.xpath(".//option")],
                               "text": txt(n) if n.tag == "button" else None})
            forms.append({"action": action, "action_url": absolute(base, action), "method": method,
                          "enctype": form.get("enctype"), "attributes": identify(form), "fields": fields})
        fragments = sorted({n.get("id") for n in doc.xpath("//*[@id]")} | {n.get("name") for n in doc.xpath("//a[@name]")})
        self.pages[url] = {
            "url": url, "status": status, "lang": doc.get("lang"), "title": title, "canonical": canonical,
            "meta_description": [m["content"] for m in meta if (m["key"] or "").lower() == "description"],
            "meta_robots": [m for m in meta if (m["key"] or "").lower() in ("robots", "googlebot", "bingbot", "googlebot-news")],
            "x_robots_tag": self.urls[url]["http"].get("headers", {}).get("x-robots-tag", []),
            "open_graph": [m for m in meta if (m["key"] or "").lower().startswith("og:")],
            "twitter": [m for m in meta if (m["key"] or "").lower().startswith("twitter:")],
            "meta": meta, "alternates": alternates, "structured_data": {"json_ld": jsonld, "microdata": microdata, "rdfa": rdfa},
            "headings": headings, "landmarks": landmarks, "widgets": widgets, "content_text": content_text,
            "content_sha256": hashlib.sha256(content_text.encode()).hexdigest(),
            "links": links, "fragment_targets": fragments, "forms": forms,
            "image_elements": [dict(n.attrib) for n in doc.xpath("//img | //picture/source")],
            "embeds": [dict(n.attrib) for n in doc.xpath("//iframe | //embed | //object | //video | //audio")],
            "body_attributes": identify(doc.xpath("//body")[0]) if doc.xpath("//body") else {},
        }
        if status == 200 and urlsplit(url).hostname in HOSTS and any(kind in INTERNAL_NAV for kind in self.urls[url]["kinds"]):
            if not re.search(r"(?:^|\s)attachment(?:\s|$)", self.pages[url]["body_attributes"].get("class", "")):
                self.variants_for(url)

    def schema_links(self, url, value, key=None):
        if isinstance(value, list):
            for item in value:
                self.schema_links(url, item, key)
        elif isinstance(value, dict):
            for name, item in value.items():
                self.schema_links(url, item, name)
        elif isinstance(value, str) and key in ("url", "contentUrl", "image", "logo", "thumbnailUrl", "embedUrl", "sameAs"):
            if value.startswith(("http://", "https://", "/")):
                kind = "og-asset" if ASSET_EXT.search(value) else "schema-reference"
                self.reference(url, value, kind, "JSON-LD " + key)

    def save(self, complete):
        for url, record in self.urls.items():
            chain = []
            current = url
            seen = set()
            while current and current not in seen:
                seen.add(current)
                hop = self.urls.get(current, {})
                result = hop.get("http", {})
                chain.append({"url": current, "status": result.get("status"), "location": result.get("headers", {}).get("location", []),
                              "error": result.get("error"), "skipped": hop.get("skipped")})
                if "redirect_to" not in hop:
                    break
                current = hop["redirect_to"]
            record["chain"] = chain
            record["redirect_loop"] = bool(current and self.urls.get(current, {}).get("redirect_to") in seen)
            record["final_url"] = chain[-1]["url"]
            record["final_status"] = chain[-1]["status"]
            if not record.get("http") and not record.get("skipped"):
                record["pending"] = True
            else:
                record.pop("pending", None)
        for url, record in self.urls.items():
            result = record.get("http", {})
            mime = (result.get("headers", {}).get("content-type") or [""])[0].split(";")[0]
            upload = urlsplit(url).path.startswith("/wp-content/uploads/")
            if upload or any(kind in EXTERNAL_ASSET for kind in record["kinds"]) or mime.startswith(("image/", "font/", "video/", "audio/")):
                self.assets[url] = {"scope": record["scope"], "kinds": record["kinds"], "mime": mime, "wp_upload": upload,
                                    "status": result.get("status"), "final_url": record["final_url"], "final_status": record["final_status"],
                                    "body": result.get("body"), "error": result.get("error") or record.get("skipped")}
        files = {
            "manifest.json": {"schema_version": 1, "origin": SITE, "started_at_utc": self.started, "updated_at_utc": utc(),
                              "queue_exhausted": complete, "method": "GET", "user_agent": UA,
                              "internal_delay_after_response_seconds": self.delay, "urls": dict(sorted(self.urls.items()))},
            "pages.json": dict(sorted(self.pages.items())),
            "assets.json": dict(sorted(self.assets.items())),
            "references.json": self.edges,
            "discovery.json": {"robots": self.robot_source, "sitemaps": self.sitemaps, "wp_media": self.media,
                               "external_font_css_user_agent": FONT_UA},
        }
        for name, data in files.items():
            temp = self.output / (name + ".tmp")
            temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            temp.replace(self.output / name)

    def resume(self):
        def read(name):
            return json.loads((self.output / name).read_text(encoding="utf-8"))

        manifest = read("manifest.json")
        self.started = manifest["started_at_utc"]
        self.urls = manifest["urls"]
        self.pages = read("pages.json")
        self.edges = read("references.json")
        self.edge_keys = {(e["source"], e["target"], e["kind"], e["raw"], e["detail"]) for e in self.edges}
        discovery = read("discovery.json")
        self.robot_source = discovery["robots"]
        self.sitemaps = discovery["sitemaps"]
        self.media = discovery["wp_media"]
        self.attempts = sum(len(record["attempts"]) for record in self.urls.values())
        if self.robot_source:
            saved = self.urls[self.robot_source]["http"]["body"]["path"]
            self.robots.parse((self.output / saved).read_text(encoding="utf-8-sig").splitlines())
        for edge in self.edges.copy():
            if self.urls[edge["target"]].get("pending"):
                self.reference(edge["source"], edge["raw"], edge["kind"], edge["detail"])
        for url, page in list(self.pages.items()):
            saved = self.urls[url]["http"]["body"]["path"]
            self.parse_html(url, (self.output / saved).read_bytes(), page["status"])
        for url, record in list(self.urls.items()):
            response = record.get("http", {})
            if response.get("status") != 200 or not response.get("body"):
                continue
            mime = (response.get("headers", {}).get("content-type") or [""])[0].lower()
            if "/oembed/" not in urlsplit(url).path and "image/svg+xml" not in mime:
                continue
            body = (self.output / response["body"]["path"]).read_bytes()
            if "json" in mime:
                try:
                    self.parse_oembed(url, json.loads(body))
                except ValueError as error:
                    record["parse_error"] = str(error)
            elif "xml" in mime:
                self.parse_xml(url, body)

    def run(self):
        for path, kind, rank in SEEDS:
            self.reference(None, SITE + path, kind, "initial URL", rank)
        for path, kind, detail in EXTRA_PROBES:
            self.reference(SITE + "/", SITE + path, kind, detail, 4)
        complete = False
        try:
            while self.queue:
                rank, _, url = heapq.heappop(self.queue)
                if rank != self.rank[url] or "http" in self.urls[url]:
                    continue
                if self.robot_source and urlsplit(url).hostname in HOSTS and not self.robots.can_fetch(UA, url):
                    self.urls[url]["skipped"] = "robots.txt"
                    continue
                self.fetch(url)
                if self.attempts % 15 == 0 or self.attempts == 1:
                    self.save(False)
            complete = True
        finally:
            self.save(complete)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--delay", type=float, default=1.65)
    parser.add_argument("--resume", action="store_true", help="continue from the saved manifest in the output directory")
    arguments = parser.parse_args()
    arguments.output.mkdir(parents=True, exist_ok=True)
    crawl = Crawl(arguments.output, arguments.delay)
    if arguments.resume:
        crawl.resume()
    crawl.run()
