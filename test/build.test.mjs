import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';
import { load } from 'cheerio';
import pages from '../audit/bms-baseline/pages.json' with { type: 'json' };
import assets from '../audit/bms-baseline/assets.json' with { type: 'json' };
import manifest from '../audit/bms-baseline/manifest.json' with { type: 'json' };

const origin = manifest.origin;
const paths = ['/', '/rekuperacja/', '/klimatyzacja/', '/kontakt/', '/polityka-prywatnosci/'];
const fromDist = (path) => new URL('../dist' + path, import.meta.url);
const loadPage = async (path) => load(await readFile(fromDist(path + 'index.html'), 'utf8'));

for (const path of paths) {
  test('HTML ' + path, async () => {
    const $ = await loadPage(path);
    const baseline = pages[origin + path];
    assert.equal($('title').text(), baseline.title[0]);
    assert.deepEqual($('link[rel="canonical"]').map((_, element) => $(element).attr('href')).get(), [origin + path]);
    assert.equal($('html').attr('lang'), baseline.lang);
    assert.equal($('main').length, 1);
    assert.equal($('h1').length, 1);
    assert.ok($('main h1').text().trim());
    assert.ok($('meta[name="description"]').attr('content')?.length > 50);
    assert.doesNotMatch($('meta[name="robots"]').attr('content'), /noindex/);
    assert.equal($('a[href="#tresc"]').length, 1);
    assert.equal($('footer a[href="tel:604959993"]').length, 1);
    assert.ok($('a[href="mailto:biuro@bmstechnik.pl"]').length);
    assert.ok($('a[href="mailto:m.adamek@bmstechnik.pl"]').length);
    assert.match($('footer').text(), /ul\. Szewska 8, 32-043 Skała/);
    assert.match($('footer').text(), /ul\. Sikorki 23\/14, 31-589 Kraków/);
    assert.doesNotMatch($.html(), /http:\/\/bmstechnik\.pl|emailto:|jquery|wpforms|stock-photo/i);
    for (const el of $('img[src], script[src], link[href]').toArray()) {
      const value = $(el).attr('src') ?? $(el).attr('href');
      if (value.startsWith('/')) assert.ok((await stat(fromDist(value))).isFile(), value);
    }
    for (const el of $('img[srcset]').toArray()) {
      for (const item of $(el).attr('srcset').split(',')) {
        const [src] = item.trim().split(/\s+/);
        assert.ok((await stat(fromDist(src))).isFile(), src);
      }
    }
    for (const el of $('a[href^="/"], a[href^="#"]').toArray()) {
      const href = $(el).attr('href');
      const url = new URL(href, origin + path);
      if (url.pathname.startsWith('/wp-content/uploads/')) {
        assert.ok((await stat(fromDist(url.pathname))).isFile(), href);
      } else {
        assert.ok(paths.includes(url.pathname), href);
        if (url.hash) {
          const target = url.pathname === path ? $ : await loadPage(url.pathname);
          assert.ok(target(url.hash).length, href);
        }
      }
    }
  });
}

test('Pięć URL-i w sitemapie; robots wskazuje nową mapę', async () => {
  const xml = await readFile(fromDist('/sitemap.xml'), 'utf8');
  const $ = load(xml, { xml: true });
  assert.deepEqual($('url > loc').map((_, el) => $(el).text()).get(), paths.map((path) => origin + path));
  const robots = await readFile(fromDist('/robots.txt'), 'utf8');
  assert.match(robots, /Sitemap: https:\/\/bmstechnik\.pl\/sitemap\.xml/);
  assert.doesNotMatch(robots, /^Disallow: \/$/m);
});

test('Cały inwentarz uploads zgadza się bajt w bajt ze snapshotem', async () => {
  const rows = Object.entries(assets).filter(([, item]) => item.wp_upload);
  assert.equal(rows.length, 248);
  assert.equal(new Set(rows.map(([url]) => new URL(url).pathname)).size, 247);
  for (const [url, { body }] of rows) {
    const file = await readFile(fromDist(new URL(url).pathname));
    assert.equal(file.length, body.bytes, url);
    assert.equal(createHash('sha256').update(file).digest('hex'), body.sha256, url);
  }
});

test('Zachowano kolejność miniatur i powiększenia obu galerii', async () => {
  for (const path of ['/rekuperacja/', '/klimatyzacja/']) {
    const $ = await loadPage(path);
    const baseline = pages[origin + path];
    const oldImages = baseline.image_elements
      .filter(({ src }) => /(?:IMG_\d+|20220701)_\d+-(?:900x460|270x270)\.jpg$/.test(src))
      .map(({ src }) => new URL(src).pathname);
    assert.equal(oldImages.length, 5);
    assert.deepEqual($('[data-gallery] img').map((_, el) => $(el).attr('src')).get(), oldImages);
    assert.equal($('[data-gallery] img').filter((_, el) => Boolean($(el).attr('alt'))).length, 5);
    assert.equal($('dialog').length, 1);
    if (path === '/klimatyzacja/') {
      const oldTargets = baseline.links.filter(({ href }) => /-1080x(?:1080|810)\.jpg$/.test(href))
        .map(({ href }) => new URL(href).pathname);
      assert.deepEqual($('[data-gallery] a').map((_, el) => $(el).attr('href')).get(), oldTargets);
      assert.equal($('.accordion details').length, 2);
    }
  }
  const home = await loadPage('/');
  assert.equal(home('a[data-photo]').length, 4);
  assert.ok(home('[href="/rekuperacja/"]').length >= 2);
  assert.ok(home('[href="/klimatyzacja/"]').length >= 2);
});

test('Kontakt zachowuje kategorie, zgodę i limit wiadomości', async () => {
  const $ = await loadPage('/kontakt/');
  assert.equal($('#contact-form').attr('method'), 'post');
  assert.equal($('#contact-fields[disabled]').length, 1);
  assert.deepEqual($('#category option').map((_, el) => $(el).attr('value')).get(), [
    '', 'Rekuperacja', 'Klimatyzacja', 'Wentylacja', 'Inna',
  ]);
  assert.equal($('#message').attr('maxlength'), '4000');
  assert.ok($('#name[required], #email[required], #category[required], #message[required], #consent[required]').length === 5);
  assert.equal($('script[src*="turnstile"]').length, 0);
});
