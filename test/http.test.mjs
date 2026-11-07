import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { load } from 'cheerio';
import assets from '../audit/bms-baseline/assets.json' with { type: 'json' };
import pages from '../audit/bms-baseline/pages.json' with { type: 'json' };
import discovery from '../audit/bms-baseline/discovery.json' with { type: 'json' };

const origin = 'https://bmstechnik.pl';
const preview = new URL(process.env.BMS_TEST_ORIGIN || 'http://127.0.0.1:8787');
if (['bmstechnik.pl', 'www.bmstechnik.pl'].includes(preview.hostname.replace(/\.$/, ''))) {
  throw new Error('Testy HTTP formularza wymagają odizolowanego podglądu.');
}
const base = preview.origin;
const get = (path, init) => fetch(base + path, { ...init, redirect: 'manual' });
const business = ['/', '/rekuperacja/', '/klimatyzacja/', '/kontakt/', '/polityka-prywatnosci/'];

test('Worker serwuje pięć kanonicznych dokumentów i blokuje indeksację podglądu', async () => {
  for (const path of business) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    assert.match(response.headers.get('x-robots-tag'), /noindex/);
    const $ = load(await response.text());
    const stylesheet = await get($('link[rel="stylesheet"]').attr('href'));
    assert.equal(stylesheet.status, 200);
    assert.equal(stylesheet.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    const preloads = $('link[rel="preload"][as="font"]');
    assert.equal(preloads.length, 3);
    for (const el of preloads.toArray()) {
      assert.equal($(el).attr('crossorigin'), 'anonymous');
      const font = await get($(el).attr('href'));
      assert.equal(font.status, 200);
      assert.match(font.headers.get('content-type'), /^font\/woff2/);
      assert.equal(font.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    }
    assert.equal($('title').text(), pages[origin + path].title[0], path);
    assert.equal($('link[rel=canonical]').attr('href'), origin + path, path);
    if (path !== '/') {
      const alias = await get(path.slice(0, -1) + '?utm_source=test');
      assert.equal(alias.status, 301, path);
      assert.equal(alias.headers.get('location'), base + path + '?utm_source=test', path);
    }
    const head = await get(path, { method: 'HEAD' });
    assert.equal(head.status, 200, path);
    assert.equal(await head.text(), '', path);
  }
  const robots = await get('/robots.txt');
  assert.equal(await robots.text(), 'User-agent: *\nDisallow: /\n');
  const sitemap = await get('/sitemap.xml');
  assert.match(sitemap.headers.get('content-type'), /xml/);
  const $ = load(await sitemap.text(), { xml: true });
  assert.deepEqual($('loc').map((_, el) => $(el).text()).get(), business.map((path) => origin + path));
});

test('Worker zwraca dokładne Location, rzeczywiste 404 i 410', async () => {
  for (const [from, to] of [
    ['/?page_id=2', '/'], ['/?page_id=40&utm_medium=qr', '/rekuperacja/?utm_medium=qr'],
    ['/przykladowa-strona', '/'], ['/wp-sitemap.xml', '/sitemap.xml'],
    ...Object.values(discovery.wp_media).map(({ link, source_url }) => [new URL(link).pathname, new URL(source_url).pathname]),
  ]) {
    const response = await get(from);
    assert.equal(response.status, 301, from);
    assert.equal(response.headers.get('location'), base + to, from);
  }
  for (const path of ['/witaj-swiecie/', '/?p=1', '/?s=rekuperacja', '/wp-json/wp/v2/media', '/rekuperacja/embed/']) {
    assert.equal((await get(path)).status, 410, path);
  }
  for (const path of ['/sitemap_index.xml', '/losowa-sciezka-testowa/', '/?p=9999', '/wp-content/uploads/obraz.jpg']) {
    const response = await get(path);
    assert.equal(response.status, 404, path);
    assert.equal(load(await response.text())('h1').text(), 'Nie znaleziono strony');
  }
  const method = await get('/rekuperacja/', { method: 'POST' });
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'GET, HEAD');
});

test('Worker serwuje wszystkie pliki uploads z MIME i SHA-256 zgodnymi z audytem', async () => {
  const unique = new Map(Object.entries(assets).filter(([, asset]) => asset.wp_upload)
    .map(([url, asset]) => [new URL(url).pathname, asset]));
  assert.equal(unique.size, 247);
  const rows = [...unique];
  for (let i = 0; i < rows.length; i += 8) {
    await Promise.all(rows.slice(i, i + 8).map(async ([path, { mime, body }]) => {
      const response = await get(path);
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get('content-type')?.split(';')[0], mime, path);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.length, body.bytes, path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), body.sha256, path);
    }));
  }
  const wrongCase = '/wp-content/uploads/2022/06/img_20220216_135304-900x460.jpg';
  assert.equal((await get(wrongCase)).status, 404, wrongCase);
});

test('Podgląd bez konfiguracji pokazuje kontakt bezpośredni i odrzuca wysyłkę', async () => {
  const page = await get('/kontakt/');
  assert.match(page.headers.get('cache-control'), /no-store/);
  const $ = load(await page.text());
  assert.equal($('#contact-fields[disabled]').length, 1);
  assert.match($('#form-notice').text(), /formularz jest chwilowo niedostępny/i);
  assert.ok($('a[href="mailto:biuro@bmstechnik.pl"]').length);
  const submit = (fields) => get('/kontakt/', {
    method: 'POST', headers: { Origin: base }, body: new URLSearchParams(fields),
  });
  const invalid = await submit({ name: 'Test' });
  assert.equal(invalid.status, 422);
  assert.match(load(await invalid.text())('#form-notice[role=alert]').text(), /podaj poprawny adres/i);
  const valid = await submit({ name: 'Test', email: 'reply@example.test', category: 'Wentylacja', message: 'Test', consent: 'yes' });
  assert.equal(valid.status, 503);
  assert.match(load(await valid.text())('#form-notice[role=alert]').text(), /formularz jest chwilowo niedostępny/i);
});
