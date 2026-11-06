import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = resolve(root, 'audit/bms-baseline');
const generated = resolve(root, 'generated');
const publicDir = resolve(generated, 'public');
const readJson = async (name) => JSON.parse(await readFile(resolve(baseline, name + '.json'), 'utf8'));
const [manifest, pages, assets, discovery] = await Promise.all(
  ['manifest', 'pages', 'assets', 'discovery'].map(readJson),
);
const { origin, urls } = manifest;
const businessPaths = ['/', '/rekuperacja/', '/klimatyzacja/', '/kontakt/', '/polityka-prywatnosci/'];
const business = Object.fromEntries(businessPaths.map((path) => {
  const page = pages[origin + path];
  if (urls[origin + path]?.http?.status !== 200 || page.canonical[0]?.url !== origin + path) {
    throw new Error('Brak strony kanonicznej w audycie: ' + path);
  }
  return [path, { title: page.title[0], canonical: page.canonical[0].url }];
}));

const uploads = new Map();
for (const [url, asset] of Object.entries(assets)) {
  if (!asset.wp_upload) continue;
  const path = new URL(url).pathname;
  const hash = asset.body?.sha256;
  if (asset.status !== 200 || urls[url]?.http?.body?.sha256 !== hash || !hash) {
    throw new Error('Brak zgodnych danych zasobu: ' + url);
  }
  if (uploads.has(path) && uploads.get(path).sha256 !== hash) {
    throw new Error('Różna zawartość pod tą samą ścieżką: ' + path);
  }
  uploads.set(path, asset.body);
}

async function writeAsset(path, body) {
  const source = resolve(baseline, body.path);
  const output = resolve(publicDir, '.' + path);
  if (!source.startsWith(baseline + sep) || !output.startsWith(publicDir + sep)) {
    throw new Error('Nieprawidłowa ścieżka zasobu: ' + path);
  }
  const bytes = await readFile(source);
  if (bytes.length !== body.bytes || createHash('sha256').update(bytes).digest('hex') !== body.sha256) {
    throw new Error('Niezgodny snapshot: ' + source);
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, bytes);
}

const fonts = {
  'monda-latin.woff2': 'TK3tWkYFABsmjsphPho.woff2',
  'monda-latin-ext.woff2': 'TK3tWkYFABsmjspvPho7vA.woff2',
  'share-tech.woff2': '7cHtv4Uyi5K0OeZ7bohU8H0JmA.woff2',
};
for (const [name, original] of Object.entries(fonts)) {
  const asset = Object.entries(assets).find(([url]) => url.startsWith('https://fonts.gstatic.com/') && url.endsWith('/' + original));
  await writeAsset('/fonts/' + name, asset[1].body);
}
for (const name of ['monda', 'share-tech']) {
  await copyFile(resolve(root, 'licenses', name + '-OFL.txt'), resolve(publicDir, 'fonts', name + '-OFL.txt'));
}
await Promise.all(Array.from(uploads, ([path, body]) => writeAsset(path, body)));

const attachments = Object.fromEntries(Object.values(discovery.wp_media).map((item) => {
  const path = new URL(item.link).pathname;
  const file = new URL(item.source_url).pathname;
  if (pages[item.link]?.canonical[0]?.url !== item.link || !uploads.has(file)) {
    throw new Error('Załącznik bez zgodnej strony lub pliku: ' + item.link);
  }
  return [path, file];
}));

const redirects = {
  ...attachments,
  '/przykladowa-strona/': '/',
  '/embed/': '/',
  '/wp-sitemap.xml': '/sitemap.xml',
  '/wp-sitemap-posts-page-1.xml': '/sitemap.xml',
};
const retired = new Set([
  '/witaj-swiecie/', '/2022/', '/2022/03/', '/author/ms_admin/',
  '/author/bms_michal/', '/category/bez-kategorii/',
]);
const queryAliases = {};
for (const [url, entry] of Object.entries(urls)) {
  if (!url.startsWith(origin + '/') || !entry.http) continue;
  const source = new URL(url);
  if (entry.http.status === 301 && source.pathname === '/' && source.search) {
    const [key, value] = [...source.searchParams][0];
    const target = new URL(entry.http.headers.location[0]);
    if (target.origin === origin && !target.search) {
      queryAliases[key + '=' + value] = redirects[target.pathname] ?? target.pathname;
    }
  }
  if (entry.http.status === 200 && (
    (source.pathname !== '/embed/' && source.pathname.endsWith('/embed/')) ||
    source.pathname.endsWith('/feed/') ||
    /^\/wp-sitemap-(?:posts-post|taxonomies|users)-/.test(source.pathname)
  )) retired.add(source.pathname);
}
for (const item of Object.values(discovery.wp_media)) {
  queryAliases['attachment_id=' + item.id] = attachments[new URL(item.link).pathname];
}

const galleries = {};
for (const path of ['/rekuperacja/', '/klimatyzacja/']) {
  const page = pages[origin + path];
  const fileLinks = new Set(page.links.map((link) => link.href).filter(Boolean));
  galleries[path] = page.image_elements
    .filter(({ src }) => /\/(?:IMG_\d+|20220701)_\d+-(?:900x460|270x270)\.jpg$/.test(src))
    .map(({ src }) => {
      const thumb = new URL(src).pathname;
      const stem = thumb.replace(/-\d+x\d+\.jpg$/, '');
      const full = [stem + '-1080x1080.jpg', stem + '-1080x810.jpg']
        .find((file) => uploads.has(file) && (path === '/rekuperacja/' || fileLinks.has(origin + file)));
      if (!full) throw new Error('Brak powiększenia: ' + thumb);
      const dimensions = /-(\d+)x(\d+)\.jpg$/.exec(thumb);
      return { thumb, full, width: Number(dimensions[1]), height: Number(dimensions[2]) };
    });
}
if (galleries['/rekuperacja/'].length !== 5 || galleries['/klimatyzacja/'].length !== 5) {
  throw new Error('Niekompletne galerie usług');
}

await writeFile(resolve(generated, 'audit-data.json'), JSON.stringify({
  origin, business, redirects, retired: [...retired], queryAliases, galleries,
}, null, 2) + '\n');
console.log('Snapshot: ' + uploads.size + ' ścieżek mediów, ' + Object.keys(attachments).length + ' załączników.');
