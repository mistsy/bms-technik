import audit from '../generated/audit-data.json' with { type: 'json' };
import { contactEnabled, submitContact } from './contact.mjs';
import { turnstileAction } from '../shared/contact.mjs';

const { origin, business, redirects, queryAliases } = audit;
const apex = new URL(origin).hostname;
const retired = new Set(audit.retired);
const legacyParams = ['page_id', 'p', 'attachment_id', 'author', 'cat', 'm', 's', 'rest_route'];
const staticFiles = new Set(['/sitemap.xml', '/robots.txt']);

function legacyTarget(path, url) {
  if (!['/', '/index.php', '/index.php/'].includes(path)) return {};
  const found = legacyParams.filter((key) => url.searchParams.has(key));
  if (found.length === 0) return {};
  const [key] = found;
  const values = url.searchParams.getAll(key);
  if (found.length !== 1 || values.length !== 1) return { status: 404 };
  if (key === 's' || key === 'rest_route') return { status: 410 };
  const lookup = key + '=' + values[0];
  if (!Object.hasOwn(queryAliases, lookup)) return { status: 404 };
  const target = queryAliases[lookup];
  if (retired.has(target)) return { status: 410 };
  url.searchParams.delete(key);
  return { target };
}

export function route(request) {
  const url = new URL(request.url);
  const read = ['GET', 'HEAD'].includes(request.method);
  const businessHost = url.hostname === apex || url.hostname === 'www.' + apex;
  const targetOrigin = businessHost ? origin : url.origin;
  const badOrigin = url.origin !== targetOrigin;
  const path = url.pathname;
  const withSlash = path.endsWith('/') ? path : path + '/';
  const withoutSlash = path.replace(/\/$/, '');
  const indexPath = path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : withSlash;
  const businessPath = Object.hasOwn(business, indexPath) ? indexPath : undefined;
  const legacy = read ? legacyTarget(path, url) : {};
  const oldPath = Object.hasOwn(redirects, withSlash) ? withSlash : withoutSlash;
  const pathRedirect = Object.hasOwn(redirects, oldPath) ? redirects[oldPath] : undefined;
  const targetPath = legacy.target ?? (read ? pathRedirect : undefined) ?? businessPath ??
    (staticFiles.has(withoutSlash) ? withoutSlash : path);

  if (badOrigin || targetPath !== path || legacy.target || (read && pathRedirect)) {
    const target = new URL(targetOrigin);
    target.pathname = targetPath;
    target.search = url.search;
    return { status: read ? 301 : 308, location: target.href };
  }
  if (legacy.status) return { status: legacy.status };
  if (retired.has(withSlash) || retired.has(withoutSlash) ||
      /^\/(?:wp-json|wp-admin)(?:\/|$)/.test(path) ||
      /^\/(?:wp-login|xmlrpc|wp-cron|wp-comments-post)\.php\/?$/.test(path)) {
    return { status: 410 };
  }
  if (path === '/kontakt/' && request.method === 'POST') return { asset: '/kontakt/index.html', contact: true };
  if (!read) return { status: 405, allow: path === '/kontakt/' ? 'GET, HEAD, POST' : 'GET, HEAD' };
  if (businessPath) return { asset: businessPath + 'index.html', contact: path === '/kontakt/' };
  if (path.endsWith('.html')) return { status: 404 };
  return { asset: path };
}

const previewRobots = 'User-agent: *\nDisallow: /\n';

function headersFor(preview, additional) {
  const headers = new Headers(additional);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (preview) headers.set('X-Robots-Tag', 'noindex, nofollow');
  return headers;
}

function rewriteContact(response, env, result) {
  const enabled = contactEnabled(env) && !result?.sent;
  const rewriter = new HTMLRewriter();
  if (enabled) {
    rewriter.on('#contact-fields', { element: (el) => el.removeAttribute('disabled') });
    rewriter.on('#form-verification', {
      element(el) {
        el.setInnerContent('<div class="cf-turnstile" data-sitekey="' + env.TURNSTILE_SITE_KEY +
          '" data-action="' + turnstileAction + '" data-language="pl" data-size="compact"></div>' +
          '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>', { html: true });
      },
    });
  }
  if (result?.sent) rewriter.on('#contact-form', { element: (el) => el.remove() });
  rewriter.on('#form-notice', {
    element(el) {
      if (result) {
        el.setInnerContent(result.notice);
        if (result.status >= 400) el.setAttribute('role', 'alert');
      } else if (enabled) {
        el.setAttribute('hidden', '');
      }
    },
  });
  if (result?.values && enabled) {
    const { name, email, category, message, consent } = result.values;
    rewriter.on('#name', { element: (el) => el.setAttribute('value', name) });
    rewriter.on('#email', { element: (el) => el.setAttribute('value', email) });
    rewriter.on('#message', { element: (el) => el.setInnerContent(message) });
    rewriter.on('#consent', { element: (el) => { if (consent) el.setAttribute('checked', ''); } });
    rewriter.on('#category option', { element: (el) => {
      if (el.getAttribute('value') === category) el.setAttribute('selected', '');
    } });
  }
  return rewriter.transform(response);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const preview = url.hostname !== apex && url.hostname !== 'www.' + apex;
    const head = request.method === 'HEAD';
    const resolution = route(request);

    if (resolution.location) {
      return new Response(null, { status: resolution.status, headers: headersFor(preview, { Location: resolution.location }) });
    }
    if (preview && resolution.asset === '/robots.txt') {
      return new Response(head ? null : previewRobots, {
        headers: headersFor(preview, { 'Content-Type': 'text/plain; charset=utf-8' }),
      });
    }
    if (resolution.status && resolution.status !== 404) {
      const message = resolution.status === 410 ? 'Ten adres został wycofany.' : 'Niedozwolona metoda.';
      const headers = headersFor(preview, { 'Content-Type': 'text/plain; charset=utf-8' });
      if (resolution.allow) headers.set('Allow', resolution.allow);
      return new Response(head ? null : message, { status: resolution.status, headers });
    }

    const assetURL = new URL(request.url);
    assetURL.pathname = resolution.asset ?? '/404.html';
    const assetRequest = resolution.contact || assetURL.pathname !== url.pathname
      ? new Request(assetURL, { method: head ? 'HEAD' : 'GET' })
      : request;
    let asset = await env.ASSETS.fetch(assetRequest);
    let status = resolution.status ?? asset.status;
    if (!resolution.status && asset.status === 404) {
      await asset.body?.cancel();
      assetURL.pathname = '/404.html';
      asset = await env.ASSETS.fetch(new Request(assetURL, { method: head ? 'HEAD' : 'GET' }));
    }
    const headers = headersFor(preview, asset.headers);
    // Astro fingerprints these URLs. Reuse shared styles/fonts across native
    // page navigations without a validation round trip.
    if (asset.ok && /^\/_astro\/[^/]+\.[\w-]{8}\.(?:css|js|woff2)$/.test(url.pathname)) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    let result;
    if (resolution.contact && status === 200) {
      if (request.method === 'POST') result = await submitContact(request, env);
      status = result?.status ?? status;
      headers.set('Cache-Control', 'private, no-store');
      headers.delete('ETag');
      headers.delete('Content-Length');
    }
    const response = new Response(head ? null : asset.body, { status, headers });
    return resolution.contact && !head && asset.ok ? rewriteContact(response, env, result) : response;
  },
};
