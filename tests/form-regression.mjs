import assert from 'node:assert/strict';
import test from 'node:test';
import booking from '../api/booking-create.mjs';
import availability from '../api/booking-availability.mjs';
import contact from '../api/contact.mjs';
import { validateSlot, validatePerson } from '../lib/booking-server.mjs';
import { projects } from '../lib/project-context.mjs';

// Every network request is replaced; these tests never create reservations or emails.
const validBooking = {
  date: '2030-01-07', time: '10:00', nombre: 'Cliente', apellido: 'Prueba',
  correo: 'qa@form.test.invalid', telefono: '+56900000000', website: '',
};
const validContact = {
  nombre: 'Cliente Prueba', correo: 'qa@form.test.invalid', telefono: '+56900000000',
  rut: '', mensaje: 'Mensaje de prueba sin envío real.', website: '',
};

function isolate(t, response = { status: 200, body: { ok: true, available: true, booked: true } }) {
  const previousFetch = globalThis.fetch;
  const previousEnv = Object.fromEntries(['BOOKING_BACKEND_URL', 'BOOKING_SECRET', 'RESEND_API_KEY', 'VERCEL_ENV'].map(key => [key, process.env[key]]));
  delete process.env.VERCEL_ENV;
  process.env.BOOKING_BACKEND_URL = 'https://booking.test.invalid';
  process.env.BOOKING_SECRET = 'test-secret-only';
  process.env.RESEND_API_KEY = 'test-api-key-only';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    assert.ok(['https://booking.test.invalid/', 'https://api.resend.com/emails'].includes(String(url)), 'Unexpected network destination');
    calls.push({ url: String(url), options, body: JSON.parse(options.body) });
    if (response.error) throw response.error;
    return new Response(response.raw ?? JSON.stringify(response.body), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  };
  t.after(() => {
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  return calls;
}

function request(body, { method = 'POST', type = 'application/json', raw, headers = {} } = {}) {
  return new Request('https://preview.test.invalid/api/form', {
    method, headers: { 'Content-Type': type, ...headers },
    ...(method !== 'GET' ? { body: raw ?? JSON.stringify(body) } : {}),
  });
}

async function assertResult(handler, input, expectedStatus, expectedBody) {
  const response = await handler.fetch(input);
  assert.equal(response.status, expectedStatus);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(response.headers.get('Content-Type'), /application\/json/);
  const body = await response.json();
  if (expectedBody) assert.deepEqual(body, expectedBody);
  assert.ok(!JSON.stringify(body).includes('test-secret-only'));
  assert.ok(!JSON.stringify(body).includes('test-api-key-only'));
  return body;
}

test('both booking APIs and contact reject non-POST and non-JSON requests without network calls', async t => {
  const calls = isolate(t);
  for (const [handler, body] of [[booking, validBooking], [availability, { date: validBooking.date, time: validBooking.time }], [contact, validContact]]) {
    const response = await handler.fetch(request(body, { method: 'GET' }));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Allow'), 'POST');
    await assertResult(handler, request(body, { type: 'text/plain' }), 415);
  }
  assert.equal(calls.length, 0);
});

test('booking APIs reject malformed, non-object, oversized and invalid UTF-8 requests', async t => {
  const calls = isolate(t);
  for (const handler of [booking, availability]) {
    for (const raw of ['{invalid', 'null', '[]', '"string"', new Uint8Array([0xc3, 0x28])]) await assertResult(handler, request(null, { raw }), 400);
    await assertResult(handler, request(null, { raw: 'x'.repeat(8193) }), 413);
    await assertResult(handler, request({}, { headers: { 'Content-Length': '8193' } }), 413);
  }
  assert.equal(calls.length, 0);
});

test('slot validation respects Chile local time, business days and half-hour boundaries', () => {
  const summerNow = new Date('2026-10-09T13:15:00Z'); // Friday 10:15 in Santiago.
  assert.deepEqual(validateSlot('2026-10-09', '10:30', summerNow), { date: '2026-10-09', time: '10:30' });
  assert.equal(validateSlot('2026-10-09', '10:00', summerNow), null);
  assert.equal(validateSlot('2026-10-10', '10:00', summerNow), null);
  assert.equal(validateSlot('2026-10-11', '10:00', summerNow), null);
  assert.equal(validateSlot('2026-10-12', '08:30', summerNow), null);
  assert.equal(validateSlot('2026-10-12', '22:00', summerNow), null);
  assert.equal(validateSlot('2026-10-12', '10:15', summerNow), null);
  assert.equal(validateSlot('2026-02-30', '10:00', summerNow), null);
  assert.deepEqual(validateSlot('2026-10-12', '21:30', summerNow), { date: '2026-10-12', time: '21:30' });
  const winterNow = new Date('2026-07-10T14:15:00Z'); // Friday 10:15 in Santiago.
  assert.deepEqual(validateSlot('2026-07-10', '10:30', winterNow), { date: '2026-07-10', time: '10:30' });
  assert.equal(validateSlot('2026-07-10', '10:00', winterNow), null);
});

test('invalid dates, slots and forged availability fields cannot reach the provider', async t => {
  const calls = isolate(t);
  for (const body of [{ date: '2030-01-06', time: '10:00' }, { date: '2030-02-30', time: '10:00' }, { date: '2030-01-07', time: '08:30' }, { date: '2030-01-07', time: '21:45' }, { date: 20300107, time: '10:00' }, { date: validBooking.date, time: validBooking.time, available: true }]) await assertResult(availability, request(body), 400);
  assert.equal(calls.length, 0);
});

test('availability forwards only a validated slot and returns only the boolean result', async t => {
  const calls = isolate(t, { status: 200, body: { ok: true, available: false, customerEmail: 'private@test.invalid' } });
  await assertResult(availability, request({ date: validBooking.date, time: validBooking.time }), 200, { ok: true, available: false });
  assert.deepEqual(calls[0].body, { action: 'availability', date: validBooking.date, time: validBooking.time, secret: 'test-secret-only' });
});

test('all 148 project slugs forward the trusted catalogue name without exposing it in responses', async t => {
  const calls = isolate(t);
  assert.equal(Object.keys(projects).length, 148);
  for (const [slug, project] of Object.entries(projects)) {
    await assertResult(booking, request({ ...validBooking, proyecto: slug }), 200, { ok: true, booked: true });
    assert.equal(calls.at(-1).body.proyecto, slug);
    assert.equal(calls.at(-1).body.nombreProyecto, project.name);
  }
  assert.equal(calls.length, 148);
});

test('person validation rejects header injection, markup, malformed email and phone', async t => {
  const calls = isolate(t);
  for (const field of [{ nombre: '<script>' }, { apellido: 'Prueba\r\nBcc: otro' }, { correo: 'qa@test.invalid\r\nBcc: otro' }, { correo: 'not-email' }, { telefono: '123' }, { telefono: '1234567<script>' }]) {
    assert.equal(validatePerson({ ...validBooking, ...field }), null);
    await assertResult(booking, request({ ...validBooking, ...field }), 400);
  }
  assert.equal(calls.length, 0);
});

test('honeypots complete silently without sending a reservation or email', async t => {
  const calls = isolate(t);
  await assertResult(booking, request({ ...validBooking, website: 'bot.example' }), 200, { ok: true, booked: true });
  await assertResult(contact, request({ ...validContact, website: 'bot.example' }), 200, { ok: true });
  assert.equal(calls.length, 0);
});

test('booking races report an unavailable slot for both provider conflict conventions', async t => {
  const calls = isolate(t, { status: 409, body: { ok: false, privateDetail: 'conflict' } });
  await assertResult(booking, request(validBooking), 409, { ok: false, code: 'slot_unavailable' });
  assert.equal(calls.length, 1);
});

test('a provider false availability is also reported as a booking conflict', async t => {
  isolate(t, { status: 200, body: { ok: true, booked: false, available: false } });
  await assertResult(booking, request(validBooking), 409, { ok: false, code: 'slot_unavailable' });
});

test('missing configuration and unsafe backend URLs fail without outgoing requests', async t => {
  const calls = isolate(t);
  for (const url of ['', 'http://booking.test.invalid', 'https://name:password@booking.test.invalid', 'invalid-url']) {
    process.env.BOOKING_BACKEND_URL = url;
    await assertResult(availability, request({ date: validBooking.date, time: validBooking.time }), 502);
    await assertResult(booking, request(validBooking), 502);
  }
  process.env.RESEND_API_KEY = '';
  await assertResult(contact, request(validContact), 503);
  assert.equal(calls.length, 0);
});

test('provider non-JSON responses cannot be treated as successful bookings', async t => {
  isolate(t, { status: 200, raw: '<html>Upstream failed</html>' });
  await assertResult(availability, request({ date: validBooking.date, time: validBooking.time }), 502);
  await assertResult(booking, request(validBooking), 502);
});

test('provider timeout is handled by each form without leaking its exception', async t => {
  isolate(t, { error: new DOMException('Internal provider address', 'TimeoutError') });
  for (const [handler, body] of [[booking, validBooking], [availability, { date: validBooking.date, time: validBooking.time }], [contact, validContact]]) {
    const result = await assertResult(handler, request(body), 502);
    assert.ok(!JSON.stringify(result).includes('Internal provider address'));
  }
});

test('contact rejects invalid fields and oversize bodies without an email request', async t => {
  const calls = isolate(t);
  for (const field of [{ nombre: 'Prueba\r\nOtra' }, { correo: 'invalid' }, { rut: '10.000.000-1' }, { mensaje: 'corto' }, { telefono: '1'.repeat(31) }]) await assertResult(contact, request({ ...validContact, ...field }), 400);
  await assertResult(contact, request(null, { raw: 'x'.repeat(32769) }), 413);
  assert.equal(calls.length, 0);
});

test('project consultation escapes message markup and keeps email credentials server-side', async t => {
  const calls = isolate(t);
  await assertResult(contact, request({ ...validContact, nombre: 'Prueba <b>texto</b>', proyecto: 'distrito-centro', mensaje: '<script>alert("test")</script> & texto' }), 200, { ok: true });
  const email = calls[0].body;
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.deepEqual(email.to, ['contacto@sollahms.cl']);
  assert.equal(email.reply_to, validContact.correo);
  assert.equal(email.subject, 'Consulta sobre Distrito Centro');
  assert.ok(email.html.includes('&lt;script&gt;'));
  assert.ok(!email.html.includes('<script>'));
  assert.ok(!email.html.includes('<b>texto</b>'));
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-api-key-only');
});


test('Vercel Preview cannot send real reservations or contact messages even with configured credentials', async t => {
  const calls = isolate(t);
  process.env.VERCEL_ENV = 'preview';
  for (const [handler, body] of [[booking, validBooking], [contact, validContact]]) {
    const result = await assertResult(handler, request(body), 503);
    assert.equal(result.ok, false);
    assert.equal(result.code, 'preview_read_only');
    assert.match(result.error, /La vista previa no envía/);
  }
  assert.equal(calls.length, 0);
});

test('Vercel Production retains valid form behavior against the simulated provider', async t => {
  const calls = isolate(t);
  process.env.VERCEL_ENV = 'production';
  await assertResult(booking, request(validBooking), 200, { ok: true, booked: true });
  await assertResult(contact, request(validContact), 200, { ok: true });
  assert.equal(calls.length, 2);
});

test('oversized booking provider responses fail safely', async t => {
  isolate(t, { status: 200, raw: JSON.stringify({ ok: true, booked: true, available: true, padding: 'x'.repeat(16384) }) });
  await assertResult(booking, request(validBooking), 502);
  await assertResult(availability, request({ date: validBooking.date, time: validBooking.time }), 502);
});
