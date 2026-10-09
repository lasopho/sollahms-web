import assert from 'node:assert/strict';
import test from 'node:test';
import booking from '../api/booking-create.mjs';
import { projects } from '../lib/project-context.mjs';

const knownSlug = Object.keys(projects)[0];
assert.ok(knownSlug, 'The generated catalogue must contain a known project');
const legacyBody = Object.freeze({
  date: '2030-01-07',
  time: '10:00',
  nombre: 'Cliente',
  apellido: 'Prueba',
  correo: 'qa@booking.test.invalid',
  telefono: '+56900000000',
  website: '',
});
const legacyForwarded = Object.freeze({
  action: 'book',
  date: legacyBody.date,
  time: legacyBody.time,
  nombre: legacyBody.nombre,
  apellido: legacyBody.apellido,
  correo: legacyBody.correo,
  telefono: legacyBody.telefono,
  secret: 'dummy',
});

function mockBackend(t, status = 200, reply = { ok: true, booked: true, available: true }) {
  const previousFetch = globalThis.fetch;
  const previousUrl = process.env.BOOKING_BACKEND_URL;
  const previousSecret = process.env.BOOKING_SECRET;
  const calls = [];
  process.env.BOOKING_BACKEND_URL = 'https://booking.test.invalid';
  process.env.BOOKING_SECRET = 'dummy';
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://booking.test.invalid/');
    assert.equal(options.method, 'POST');
    calls.push(JSON.parse(options.body));
    return new Response(JSON.stringify(reply), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  t.after(() => {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.BOOKING_BACKEND_URL;
    else process.env.BOOKING_BACKEND_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.BOOKING_SECRET;
    else process.env.BOOKING_SECRET = previousSecret;
  });
  return calls;
}

function request(body) {
  return new Request('http://localhost/api/booking-create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('existing callers without a project keep the original backend payload', async t => {
  const calls = mockBackend(t);
  const response = await booking.fetch(request(legacyBody));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, booked: true });
  assert.deepEqual(calls, [legacyForwarded]);
});

test('a known project forwards its trusted catalogue name with its slug', async t => {
  const calls = mockBackend(t);
  const response = await booking.fetch(request({ ...legacyBody, proyecto: knownSlug }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, booked: true });
  assert.deepEqual(calls, [{ ...legacyForwarded, proyecto: knownSlug, nombreProyecto: projects[knownSlug].name }]);
});

test('unknown and inherited project names are rejected without backend requests', async t => {
  const calls = mockBackend(t);
  for (const proyecto of ['proyecto-que-no-existe', '__proto__', 'constructor', '', ` ${knownSlug} `]) {
    const response = await booking.fetch(request({ ...legacyBody, proyecto }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
  assert.deepEqual(calls, []);
});

test('malformed project types are rejected without backend requests', async t => {
  const calls = mockBackend(t);
  for (const proyecto of [null, 42, true, {}, [knownSlug]]) {
    const response = await booking.fetch(request({ ...legacyBody, proyecto }));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
  assert.deepEqual(calls, []);
});

test('adding optional project context does not weaken required fields or accepted keys', async t => {
  const calls = mockBackend(t);
  const missingPhone = { ...legacyBody, proyecto: knownSlug };
  delete missingPhone.telefono;
  const forgedName = { ...legacyBody, proyecto: knownSlug, nombreProyecto: 'Nombre no confiable' };
  for (const body of [missingPhone, forgedName]) {
    const response = await booking.fetch(request(body));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).ok, false);
  }
  assert.deepEqual(calls, []);
});

test('a backend failure remains an error with and without project context', async t => {
  const calls = mockBackend(t, 500, { ok: false });
  for (const body of [legacyBody, { ...legacyBody, proyecto: knownSlug }]) {
    const response = await booking.fetch(request(body));
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { ok: false, error: 'No pudimos completar la reserva. Inténtalo más tarde.' });
  }
  assert.deepEqual(calls, [legacyForwarded, { ...legacyForwarded, proyecto: knownSlug, nombreProyecto: projects[knownSlug].name }]);
});
