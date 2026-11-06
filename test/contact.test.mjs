import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contactEnabled, submitContact } from '../worker/contact.mjs';

const site = 'https://bmstechnik.pl';
const contact = site + '/kontakt/';
const validFields = {
  name: 'Test',
  email: 'reply@example.test',
  category: 'Wentylacja',
  message: 'Zapytanie testowe',
  consent: 'yes',
  'cf-turnstile-response': 'test-token',
};
const bindings = {
  CONTACT_ENABLED: '1',
  CONTACT_FROM: 'from@example.test',
  CONTACT_TO: 'to@example.test',
  TURNSTILE_SITE_KEY: 'site-key-for-test',
  TURNSTILE_SECRET_KEY: 'fixture-turnstile',
  RESEND_API_KEY: 'fixture-resend',
};
const post = (fields = {}, origin = site) => new Request(contact, {
  method: 'POST',
  headers: { Origin: origin },
  body: new URLSearchParams({ ...validFields, ...fields }),
});

test('Brak konfiguracji lub flagi blokuje wysyłkę', async (t) => {
  const outbound = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Nieoczekiwane żądanie'); });
  assert.equal(contactEnabled(bindings), true);
  assert.equal(contactEnabled({ ...bindings, CONTACT_TO: '' }), false);
  assert.equal((await submitContact(post(), {})).status, 503);
  assert.equal((await submitContact(post(), { ...bindings, CONTACT_ENABLED: '0' })).status, 503);
  assert.equal(outbound.mock.callCount(), 0);
});

test('Walidacja i honeypot odrzucają dane przed żądaniem do dostawcy', async (t) => {
  const outbound = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Nieoczekiwane żądanie'); });
  for (const fields of [
    { name: '   ' }, { email: 'zly-adres' }, { category: 'Nieznana' }, { message: 'x'.repeat(4001) },
    { message: ' ' }, { consent: '' }, { website: 'bot' }, { 'cf-turnstile-response': '' },
  ]) {
    assert.equal((await submitContact(post(fields), bindings)).status, 422);
  }
  assert.equal((await submitContact(post({ message: 'x'.repeat(70_000) }), bindings)).status, 413);
  assert.equal((await submitContact(post({}, 'https://example.test'), bindings)).status, 403);
  assert.equal((await submitContact(new Request(contact, {
    method: 'POST', headers: { Origin: site }, body: '{}',
  }), bindings)).status, 415);
  assert.equal(outbound.mock.callCount(), 0);
});

test('Turnstile sprawdza success, action, host i nie pozwala wysłać przy powtórzeniu tokenu', async (t) => {
  let response = { success: true, hostname: 'www.bmstechnik.pl', action: 'contact' };
  const outbound = t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    return Response.json(response);
  });
  assert.equal((await submitContact(post(), bindings)).status, 422);
  response = { success: true, hostname: 'bmstechnik.pl', action: 'other' };
  assert.equal((await submitContact(post(), bindings)).status, 422);
  response = { success: false, 'error-codes': ['timeout-or-duplicate'] };
  assert.equal((await submitContact(post(), bindings)).status, 422);
  assert.equal(outbound.mock.callCount(), 3);
});

test('Sprawdzony formularz przekazuje wiadomość tylko do ustawionego odbiorcy', async (t) => {
  const message = 'Ą'.repeat(3998) + '\r\n' + 'Ż';
  let verified = false;
  const outbound = t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      assert.equal(init.body.get('response'), 'test-token');
      verified = true;
      return Response.json({ success: true, hostname: 'bmstechnik.pl', action: 'contact' });
    }
    assert.equal(verified, true);
    assert.equal(url, 'https://api.resend.com/emails');
    assert.match(init.headers['Idempotency-Key'], /^bms-contact-[a-f0-9]{64}$/);
    const sent = JSON.parse(init.body);
    assert.equal(sent.from, bindings.CONTACT_FROM);
    assert.deepEqual(sent.to, [bindings.CONTACT_TO]);
    assert.equal(sent.reply_to, 'reply@example.test');
    assert.equal(sent.subject, 'Formularz BMS Technik – Wentylacja');
    assert.ok(sent.text.endsWith(message.replace('\r\n', '\n')));
    return Response.json({ id: 'fixture' });
  });
  const result = await submitContact(post({ message }), bindings);
  assert.equal(result.status, 200);
  assert.equal(result.sent, true);
  assert.equal(outbound.mock.callCount(), 2);
});

test('Awaria Turnstile i błąd dostawcy poczty mają osobne odpowiedzi', async (t) => {
  let turnstileUp = false;
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.startsWith('https://challenges.cloudflare.com/')) {
      if (!turnstileUp) return new Response(null, { status: 503 });
      return Response.json({ success: true, hostname: 'bmstechnik.pl', action: 'contact' });
    }
    return new Response(null, { status: 500 });
  });
  assert.equal((await submitContact(post(), bindings)).status, 503);
  turnstileUp = true;
  const result = await submitContact(post(), bindings);
  assert.equal(result.status, 502);
  assert.equal(result.values.message, validFields.message);
});
