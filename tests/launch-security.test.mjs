import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import availability from '../api/booking-availability.mjs';
import booking from '../api/booking-create.mjs';

const origin = 'https://sollahms.cl';
function futureSlot() {
  const date = new Date(Date.now() + 7 * 86_400_000);
  while ([0, 6].includes(date.getUTCDay())) date.setUTCDate(date.getUTCDate() + 1);
  return { date: date.toISOString().slice(0, 10), time: '21:30' };
}
function request(route, body, requestOrigin) {
  return new Request(origin + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(requestOrigin === undefined ? {} : { Origin: requestOrigin }) },
    body: JSON.stringify(body),
  });
}

test('reservation and availability reject cross-origin requests before reading their bodies or accessing the provider', async () => {
  const originalFetch = globalThis.fetch;
  let providerCalls = 0;
  globalThis.fetch = async () => { providerCalls += 1; throw new Error('Unexpected provider access'); };
  try {
    for (const [route, handler] of [['/api/booking-create', booking], ['/api/booking-availability', availability]]) {
      for (const deniedOrigin of ['https://unrelated.invalid', 'null', 'https://sollahms.cl.attacker.invalid', 'https://sollahms.cl/']) {
        const incoming = request(route, {}, deniedOrigin);
        const response = await handler.fetch(incoming);
        assert.equal(response.status, 403, route + '/' + deniedOrigin);
        assert.equal(incoming.bodyUsed, false, 'The denied request body must remain unread');
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.deepEqual(await response.json(), { ok: false, error: 'Origen de solicitud no permitido.' });
      }
    }
    assert.equal(providerCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('valid same-origin and origin-less server requests preserve both booking flows using a local fake provider', async () => {
  const originalFetch = globalThis.fetch;
  const originals = Object.fromEntries(['BOOKING_BACKEND_URL', 'BOOKING_SECRET', 'VERCEL_ENV'].map(key => [key, process.env[key]]));
  process.env.BOOKING_BACKEND_URL = 'https://booking-provider.invalid/qa';
  process.env.BOOKING_SECRET = 'local-test-placeholder';
  process.env.VERCEL_ENV = 'production';
  const actions = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(url.href, 'https://booking-provider.invalid/qa');
    const body = JSON.parse(options.body);
    actions.push(body.action);
    return Response.json({ ok: true, available: true, ...(body.action === 'book' ? { booked: true } : {}) });
  };
  try {
    for (const requestOrigin of [origin, undefined]) {
      const slot = futureSlot();
      const available = await availability.fetch(request('/api/booking-availability', slot, requestOrigin));
      assert.equal(available.status, 200);
      assert.deepEqual(await available.json(), { ok: true, available: true });
      const created = await booking.fetch(request('/api/booking-create', {
        ...slot, nombre: 'Prueba', apellido: 'Local', correo: 'qa@example.invalid', telefono: '+56912345678', website: '',
      }, requestOrigin));
      assert.equal(created.status, 200);
      assert.deepEqual(await created.json(), { ok: true, booked: true });
    }
    assert.deepEqual(actions, ['availability', 'book', 'availability', 'book']);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(originals)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('security headers constrain framing, object plugins and base URLs while preserving external virtual tours and existing scripts', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const policy = config.headers.find(rule => rule.source === '/(.*)');
  assert.ok(policy, 'All public pages, media and API paths need the shared headers');
  const headers = new Map(policy.headers.map(item => [item.key.toLowerCase(), item.value]));
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.equal(headers.get('x-frame-options'), 'SAMEORIGIN');
  const csp = headers.get('content-security-policy');
  assert.equal(csp, "base-uri 'self'; object-src 'none'; frame-ancestors 'self'");
  assert.doesNotMatch(csp, /(?:^|;)\s*(?:default-src|frame-src|script-src|connect-src)\b/,
    'The launch policy must not block official third-party viewers, UF loading or the current scripts');
});
