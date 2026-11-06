import { categories, turnstileAction } from '../shared/contact.mjs';

const maxBodyBytes = 65_536;
const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i;
const unavailable = 'Formularz jest chwilowo niedostępny. Skorzystaj z podanego telefonu lub adresu e-mail.';
const deliveryError = 'Nie udało się potwierdzić przyjęcia wiadomości. Spróbuj ponownie lub skontaktuj się telefonicznie.';
const tokenError = 'Weryfikacja antyspamowa nie powiodła się. Spróbuj ponownie.';

export function contactEnabled(env) {
  return env.CONTACT_ENABLED === '1' &&
    [env.CONTACT_FROM, env.CONTACT_TO].every((email) => typeof email === 'string' && email.length <= 254 && emailPattern.test(email)) &&
    /^[\w-]{10,100}$/.test(env.TURNSTILE_SITE_KEY ?? '') &&
    Boolean(env.TURNSTILE_SECRET_KEY && env.RESEND_API_KEY);
}

async function readForm(request) {
  const reader = request.body?.getReader();
  if (!reader) return new URLSearchParams();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let length = 0;
  let content = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBodyBytes) return null;
      content += decoder.decode(value, { stream: true });
    }
    return new URLSearchParams(content + decoder.decode());
  } finally {
    await reader.cancel();
  }
}

const field = (form, key) => form.getAll(key).length === 1 ? form.get(key) : '';
const failure = (status, notice, values) => ({ status, notice, values });

export async function submitContact(request, env) {
  const url = new URL(request.url);
  if (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    return failure(403, 'Odśwież stronę kontaktową i spróbuj ponownie.');
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/x-www-form-urlencoded') {
    return failure(415, 'Nieobsługiwany format formularza.');
  }
  if (Number(request.headers.get('Content-Length')) > maxBodyBytes) {
    return failure(413, 'Przesłane dane są zbyt długie.');
  }
  let form;
  try {
    form = await readForm(request);
  } catch {
    return failure(400, 'Nie udało się odczytać formularza.');
  }
  if (!form) return failure(413, 'Przesłane dane są zbyt długie.');
  if (form.getAll('website').some((value) => value.trim())) return failure(422, tokenError);

  const name = field(form, 'name').trim();
  const email = field(form, 'email').trim();
  const category = field(form, 'category');
  const message = field(form, 'message');
  const consent = field(form, 'consent') === 'yes';
  const values = { name: name.slice(0, 100), email: email.slice(0, 254), category, message: message.slice(0, 4000), consent };
  const errors = [];
  if (!name || name.length > 100 || /[\r\n]/.test(name)) errors.push('Podaj imię (do 100 znaków).');
  if (!emailPattern.test(email) || email.length > 254) errors.push('Podaj poprawny adres e-mail.');
  if (!categories.includes(category)) errors.push('Wybierz kategorię.');
  // Browsers submit textarea line endings as CRLF. Apply maxlength to LF text.
  const normalizedMessage = message.replace(/\r\n?/g, '\n');
  values.message = normalizedMessage.slice(0, 4000);
  if (!normalizedMessage.trim() || normalizedMessage.length > 4000) errors.push('Wpisz wiadomość (do 4000 znaków).');
  if (!consent) errors.push('Potwierdź zgodę dotyczącą polityki prywatności.');
  if (errors.length) return failure(422, errors.join(' '), values);
  if (!contactEnabled(env)) return failure(503, unavailable);

  const token = field(form, 'cf-turnstile-response');
  if (!token || token.length > 2048) return failure(422, tokenError, values);
  try {
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    if (!verification.ok) return failure(503, unavailable, values);
    const result = await verification.json();
    if (result.success !== true || result.hostname !== url.hostname || result.action !== turnstileAction) {
      return failure(422, tokenError, values);
    }
  } catch {
    return failure(503, unavailable, values);
  }

  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const idempotencyKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    const delivery = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'bms-contact-' + idempotencyKey,
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: email,
        subject: 'Formularz BMS Technik – ' + category,
        text: 'Imię: ' + name + '\nE-mail: ' + email + '\nKategoria: ' + category + '\n\n' + normalizedMessage,
      }),
      signal: AbortSignal.timeout(8000),
    });
    await delivery.body?.cancel();
    if (!delivery.ok) return failure(502, deliveryError, values);
    return { status: 200, notice: 'Wiadomość została przyjęta do wysłania. Dziękujemy za kontakt.', sent: true };
  } catch {
    return failure(502, deliveryError, values);
  }
}
