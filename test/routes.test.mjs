import assert from 'node:assert/strict';
import { test } from 'node:test';
import { route } from '../worker/index.mjs';
import manifest from '../audit/bms-baseline/manifest.json' with { type: 'json' };
import discovery from '../audit/bms-baseline/discovery.json' with { type: 'json' };

const origin = manifest.origin;
const paths = ['/', '/rekuperacja/', '/klimatyzacja/', '/kontakt/', '/polityka-prywatnosci/'];
const redirect = (location, status = 301) => ({ status, location });
const get = (url) => route(new Request(url));
const at = (path) => get(origin + path);
const media = Object.values(discovery.wp_media);
const attachments = new Map(media.map(({ link, source_url }) => [link, source_url]));

test('Macierz HTTPS, www, końcowego ukośnika i index.html', () => {
  for (const path of paths) {
    const variants = path === '/' ? ['/', '/index.html'] : [path, path.slice(0, -1), path + 'index.html'];
    for (const protocol of ['http:', 'https:']) {
      for (const hostname of ['bmstechnik.pl', 'www.bmstechnik.pl']) {
        for (const variant of variants) {
          const url = protocol + '//' + hostname + variant;
          assert.deepEqual(get(url + '?utm_source=druk'), url === origin + path
            ? { asset: path + 'index.html', contact: path === '/kontakt/' }
            : redirect(origin + path + '?utm_source=druk'), url);
        }
      }
    }
  }
  assert.deepEqual(route(new Request('http://www.bmstechnik.pl/kontakt', { method: 'POST' })),
    redirect(origin + '/kontakt/', 308));
  assert.deepEqual(at('/robots.txt/'), redirect(origin + '/robots.txt'));
  assert.deepEqual(at('/sitemap.xml/'), redirect(origin + '/sitemap.xml'));
});

test('Wszystkie 31 stron załączników kierują w jednym kroku do właściwego pliku', () => {
  assert.equal(attachments.size, 31);
  for (const { link, source_url, id } of media) {
    const path = new URL(link).pathname;
    assert.deepEqual(at(path), redirect(source_url));
    assert.deepEqual(get('http://www.bmstechnik.pl' + path.slice(0, -1) + '?x=1'), redirect(source_url + '?x=1'));
    assert.deepEqual(at('/?attachment_id=' + id), redirect(source_url));
    assert.deepEqual(get(source_url), { asset: new URL(source_url).pathname });
  }
});

test('Historyczne aliasy manifestu mają zachowany cel lub jawną politykę wycofania', () => {
  const retiredAliases = new Set(['author=1', 'cat=1', 'm=202203', 'p=1']);
  let matched = 0;
  for (const [url, { http }] of Object.entries(manifest.urls)) {
    if (!url.startsWith(origin + '/?') || http?.status !== 301) continue;
    matched++;
    const alias = new URL(url).search.slice(1);
    const [target] = http.headers.location;
    if (retiredAliases.has(alias)) {
      assert.deepEqual(get(url), { status: 410 }, url);
    } else {
      const destination = attachments.get(target) ?? target;
      assert.deepEqual(get(url), redirect(destination), url);
      assert.deepEqual(at('/index.php?' + alias + '&utm_campaign=a'), redirect(destination + '?utm_campaign=a'), url);
    }
  }
  assert.ok(matched >= 40);
  for (const path of ['/przykladowa-strona/', '/embed/']) {
    assert.deepEqual(at(path), redirect(origin + '/'));
  }
  for (const path of ['/wp-sitemap.xml', '/wp-sitemap-posts-page-1.xml']) {
    assert.deepEqual(at(path), redirect(origin + '/sitemap.xml'));
  }
});

test('Odkryte widoki osadzania, feedy i REST mają odpowiedzi 410', () => {
  let embeds = 0;
  for (const [url, { http }] of Object.entries(manifest.urls)) {
    if (!url.startsWith(origin + '/') || !http) continue;
    const path = new URL(url).pathname;
    if (path.endsWith('/embed/') && http.status === 200) {
      assert.deepEqual(get(url), { status: 410 }, url);
      embeds++;
    }
    if ((path.endsWith('/feed/') && http.status === 200) || path.startsWith('/wp-json/')) {
      assert.deepEqual(get(url), { status: 410 }, url);
    }
  }
  assert.equal(embeds, 36);
  for (const path of ['/witaj-swiecie/', '/2022/', '/2022/03/', '/category/bez-kategorii/',
    '/author/ms_admin/', '/author/bms_michal/', '/?s=rekuperacja', '/?rest_route=%2Fwp%2Fv2', '/wp-admin/admin-ajax.php']) {
    assert.deepEqual(at(path), { status: 410 }, path);
  }
  for (const path of ['/?p=999999', '/?page_id=40&page_id=43', '/?s=a&p=40', '/?attachment_id=0']) {
    assert.deepEqual(at(path), { status: 404 }, path);
  }
});

test('Podgląd zachowuje host, nierozpoznana ścieżka trafia do obsługi 404', () => {
  const local = 'http://127.0.0.1:8787';
  assert.deepEqual(get(local + '/rekuperacja'), redirect(local + '/rekuperacja/'));
  assert.deepEqual(get(local + '/?page_id=43'), redirect(local + '/klimatyzacja/'));
  assert.deepEqual(at('/sitemap_index.xml'), { asset: '/sitemap_index.xml' });
  assert.deepEqual(at('/nieznana/'), { asset: '/nieznana/' });
  assert.deepEqual(at('/nieznana/index.html'), { status: 404 });
  assert.deepEqual(route(new Request(origin + '/', { method: 'POST' })), { status: 405, allow: 'GET, HEAD' });
});
