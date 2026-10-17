import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createContactHandler } from '../api/contact.mjs';
import { createBookingHandler } from '../api/booking-create.mjs';
import { createOperationLedger, OPERATION_MAX_AGE_MS, readOperationKey } from '../lib/form-operation-server.mjs';
import { createFormOperation } from '../assets/js/form-operation.mjs';
import { P1_IDEMPOTENCY_FILES, P1_IDEMPOTENCY_ASSET, assertP1IdempotencyAsset, restoreP1IdempotencyFile } from './p1-idempotency-preservation.mjs';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import mortgageDataset from '../data/hipotecario.json' with { type: 'json' };

// All providers are injected. This suite never sends mail or creates real bookings.
const NOW = Date.parse('2026-10-17T15:00:00.000Z');
const UUIDS = ['00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002'];
const operationKey = (index = 0, at = NOW) => `sollahms-v1-${at}-${UUIDS[index]}`;
const CONTACT = Object.freeze({ nombre: 'Cliente Simulado', correo: 'qa@form.test.invalid', telefono: '+56900000000', rut: '', mensaje: 'Consulta simulada sin envío real.', website: '' });
const BOOKING = Object.freeze({ date: '2030-01-07', time: '10:00', nombre: 'Cliente', apellido: 'Simulado', correo: 'qa@form.test.invalid', telefono: '+56900000000', website: '' });
const acceptedBooking = () => ({ status: 200, body: { ok: true, booked: true, available: true } });
const acceptedMail = () => new Response(JSON.stringify({ id: 'simulated-mail' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

function request(path, body, key) {
  return new Request(`https://sollahms.test.invalid/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://sollahms.test.invalid', ...(key === undefined ? {} : { 'Idempotency-Key': key }) },
    body: JSON.stringify(body),
  });
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function contactHandler(fetchImpl, overrides = {}) {
  return createContactHandler({ now: () => NOW, getApiKey: () => 'simulated-key', getEnvironment: () => 'test', fetchImpl, ...overrides });
}

function bookingHandler(callBackend, overrides = {}) {
  return createBookingHandler({ now: () => NOW, getEnvironment: () => 'test', callBackend, ...overrides });
}

test('operation headers reject malformed, future and expired keys without inventing a legacy key', () => {
  assert.deepEqual(readOperationKey(request('booking-create', BOOKING), NOW), { key: null });
  assert.deepEqual(readOperationKey(request('booking-create', BOOKING, operationKey()), NOW), { key: operationKey() });
  for (const key of ['invalid-key', 'sollahms-v1-1-not-a-uuid', operationKey(0, NOW + 60_001), operationKey(0, NOW - OPERATION_MAX_AGE_MS - 1)]) {
    const parsed = readOperationKey(request('booking-create', BOOKING, key), NOW);
    assert.ok(parsed.error, key);
    assert.ok([400, 409].includes(parsed.status), key);
  }
});

test('a local operation joins concurrent calls and replays its confirmed result', async () => {
  const ledger = createOperationLedger({ now: () => NOW });
  const gate = deferred();
  let calls = 0;
  const execute = async () => { calls++; await gate.promise; return { status: 200, body: { ok: true } }; };
  const first = ledger.run(operationKey(), { date: BOOKING.date, time: BOOKING.time }, execute);
  const second = ledger.run(operationKey(), { time: BOOKING.time, date: BOOKING.date }, execute);
  gate.resolve();
  assert.deepEqual(await first, { status: 200, body: { ok: true } });
  assert.deepEqual(await second, { status: 200, body: { ok: true } });
  assert.equal(calls, 1);
  assert.deepEqual(await ledger.run(operationKey(), { date: BOOKING.date, time: BOOKING.time }, execute), { status: 200, body: { ok: true } });
  assert.equal(calls, 1);
});

test('an operation key cannot be reused for another payload even while the first call is pending', async () => {
  const ledger = createOperationLedger({ now: () => NOW });
  const gate = deferred();
  let calls = 0;
  const execute = async () => { calls++; await gate.promise; return { status: 200, body: { ok: true } }; };
  const pending = ledger.run(operationKey(), { time: '10:00' }, execute);
  const conflict = await ledger.run(operationKey(), { time: '10:30' }, execute);
  assert.equal(conflict.status, 409);
  assert.equal(conflict.body.code, 'operation_conflict');
  gate.resolve();
  await pending;
  assert.equal(calls, 1);
});

test('a saturated local ledger refuses new operations while preserving the pending reservation', async () => {
  const ledger = createOperationLedger({ now: () => NOW, maxEntries: 1 });
  const gate = deferred();
  let calls = 0;
  const execute = async () => { calls++; await gate.promise; return { status: 200, body: { ok: true } }; };
  const pending = ledger.run(operationKey(), BOOKING, execute);
  const full = await ledger.run(operationKey(1), BOOKING, execute);
  assert.equal(full.status, 503);
  gate.resolve();
  await pending;
  const replay = await ledger.run(operationKey(), BOOKING, execute);
  assert.equal(replay.status, 200);
  assert.equal(calls, 1);
});

test('local responses survive the full valid operation window when the client clock is ahead', async () => {
  for (const uppercase of [false, true]) {
    let clock = NOW;
    let calls = 0;
    const ledger = createOperationLedger({ now: () => clock });
    const token = operationKey(0, NOW + 60_000);
    const futureKey = uppercase ? token.toUpperCase() : token;
    const execute = async () => { calls++; return { status: 200, body: { ok: true } }; };
    await ledger.run(futureKey, BOOKING, execute);
    clock = NOW + OPERATION_MAX_AGE_MS + 1_000;
    await ledger.run(operationKey(1, clock), BOOKING, execute);
    assert.ok(!readOperationKey(request('booking-create', BOOKING, futureKey), clock).error);
    await ledger.run(futureKey, BOOKING, execute);
    assert.equal(calls, 2, 'Admitting another operation must not evict a still-valid successful result');
  }
});

test('concurrent booking requests forward one local operation and replay a successful reservation', async () => {
  const gate = deferred();
  const calls = [];
  const handler = bookingHandler(async payload => { calls.push(payload); await gate.promise; return acceptedBooking(); });
  const first = handler.fetch(request('booking-create', BOOKING, operationKey()));
  const second = handler.fetch(request('booking-create', BOOKING, operationKey()));
  gate.resolve();
  for (const response of await Promise.all([first, second])) {
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, booked: true });
  }
  assert.equal(calls.length, 1);
  assert.ok(!Object.hasOwn(calls[0], 'operationId'), 'Do not change the inaccessible private backend contract');
  const replay = await handler.fetch(request('booking-create', BOOKING, operationKey()));
  assert.equal(replay.status, 200);
  assert.equal(calls.length, 1);
});

test('booking retries retain an uncertain provider outcome without creating another local booking', async () => {
  let calls = 0;
  const handler = bookingHandler(async () => { calls++; return null; });
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await handler.fetch(request('booking-create', BOOKING, operationKey()));
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, 'booking_outcome_unknown');
  }
  assert.equal(calls, 1);
});

test('changed booking details under the same operation are rejected without another provider call', async () => {
  let calls = 0;
  const handler = bookingHandler(async () => { calls++; return acceptedBooking(); });
  assert.equal((await handler.fetch(request('booking-create', BOOKING, operationKey()))).status, 200);
  const conflict = await handler.fetch(request('booking-create', { ...BOOKING, time: '10:30' }, operationKey()));
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).code, 'operation_conflict');
  assert.equal(calls, 1);
});

test('legacy booking callers retain their existing payload and do not acquire a hidden local guarantee', async () => {
  const calls = [];
  const handler = bookingHandler(async payload => { calls.push(payload); return acceptedBooking(); });
  for (let attempt = 0; attempt < 2; attempt++) assert.equal((await handler.fetch(request('booking-create', BOOKING))).status, 200);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], { action: 'book', date: BOOKING.date, time: BOOKING.time, nombre: BOOKING.nombre, apellido: BOOKING.apellido, correo: BOOKING.correo, telefono: BOOKING.telefono });
});

test('independent booking handlers expose the remaining distributed deduplication boundary', async () => {
  const calls = [];
  const provider = async payload => { calls.push(payload); return acceptedBooking(); };
  const handlers = [bookingHandler(provider), bookingHandler(provider)];
  const responses = await Promise.all(handlers.map(handler => handler.fetch(request('booking-create', BOOKING, operationKey()))));
  assert.deepEqual(responses.map(response => response.status), [200, 200]);
  assert.equal(calls.length, 2, 'Each runtime owns its own ledger until the external backend supports atomic idempotency');
  assert.ok(calls.every(payload => !Object.hasOwn(payload, 'operationId')), 'Upstream remains legacy until its contract is verified');
});

test('invalid operation keys and Preview block both providers before any real side effect', async () => {
  let calls = 0;
  const contact = contactHandler(async () => { calls++; return acceptedMail(); });
  const booking = bookingHandler(async () => { calls++; return acceptedBooking(); });
  for (const [handler, path, body] of [[contact, 'contact', CONTACT], [booking, 'booking-create', BOOKING]]) {
    assert.equal((await handler.fetch(request(path, body, 'bad-key'))).status, 400);
    const expired = await handler.fetch(request(path, body, operationKey(0, NOW - OPERATION_MAX_AGE_MS - 1)));
    assert.ok([400, 409].includes(expired.status));
  }
  for (const [handler, path, body] of [[contactHandler(async () => { calls++; return acceptedMail(); }, { getEnvironment: () => 'preview' }), 'contact', CONTACT], [bookingHandler(async () => { calls++; return acceptedBooking(); }, { getEnvironment: () => 'preview' }), 'booking-create', BOOKING]]) {
    const response = await handler.fetch(request(path, body, operationKey()));
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'preview_read_only');
  }
  assert.equal(calls, 0);
});

test('independent contact handlers use the same native Resend key during concurrent submissions and retry', async () => {
  const gate = deferred();
  const started = deferred();
  const calls = [];
  let accepted = 0;
  let inFlight = false;
  let completed = false;
  const provider = async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    const key = new Headers(options.headers).get('Idempotency-Key');
    assert.equal(key, `contact/${operationKey()}`);
    calls.push({ key, body: options.body });
    if (completed) return acceptedMail();
    if (inFlight) return new Response(JSON.stringify({ name: 'concurrent_idempotent_requests', message: 'Concurrent simulated operation' }), { status: 409 });
    inFlight = true;
    started.resolve();
    await gate.promise;
    accepted++;
    completed = true;
    return acceptedMail();
  };
  const firstHandler = contactHandler(provider);
  const secondHandler = contactHandler(provider);
  const first = firstHandler.fetch(request('contact', CONTACT, operationKey()));
  await started.promise;
  const concurrent = await secondHandler.fetch(request('contact', CONTACT, operationKey()));
  assert.equal(concurrent.status, 409);
  const body = await concurrent.json();
  assert.equal(body.code, 'contact_in_progress');
  assert.equal(body.retry, true);
  gate.resolve();
  assert.equal((await first).status, 200);
  assert.equal((await secondHandler.fetch(request('contact', CONTACT, operationKey()))).status, 200);
  assert.equal(accepted, 1);
  assert.equal(calls.length, 3);
  assert.equal(new Set(calls.map(call => call.body)).size, 1);
});

test('contact provider payload conflicts stay visible and cannot be presented as successful mail', async () => {
  const sent = [];
  const provider = async (url, options) => {
    sent.push(options.body);
    if (sent.length === 1) return acceptedMail();
    return new Response(JSON.stringify({ name: 'invalid_idempotent_request', message: 'Payload differs' }), { status: 409 });
  };
  const handler = contactHandler(provider);
  assert.equal((await handler.fetch(request('contact', CONTACT, operationKey()))).status, 200);
  const conflict = await handler.fetch(request('contact', { ...CONTACT, mensaje: 'Otra consulta simulada diferente.' }, operationKey()));
  assert.equal(conflict.status, 409);
  const body = await conflict.json();
  assert.equal(body.code, 'operation_conflict');
  assert.equal(body.retry, false);
});

test('legacy contact retries receive a deterministic opaque native provider key', async () => {
  const keys = [];
  const bodies = [];
  const handler = contactHandler(async (url, options) => {
    keys.push(new Headers(options.headers).get('Idempotency-Key'));
    bodies.push(options.body);
    return acceptedMail();
  });
  for (let attempt = 0; attempt < 2; attempt++) assert.equal((await handler.fetch(request('contact', CONTACT))).status, 200);
  assert.equal(keys[0], keys[1]);
  assert.match(keys[0], /^contact\/legacy\/[a-f0-9]{64}$/);
  assert.ok(!keys[0].includes(CONTACT.correo));
  assert.equal(bodies[0], bodies[1]);
});

test('an uncertain contact response preserves the native provider key for a safe same-data retry', async () => {
  const calls = [];
  const handler = contactHandler(async (url, options) => {
    calls.push({ key: new Headers(options.headers).get('Idempotency-Key'), body: options.body });
    if (calls.length === 1) throw new Error('Simulated loss after provider acceptance');
    return acceptedMail();
  });
  const unknown = await handler.fetch(request('contact', CONTACT, operationKey()));
  assert.equal(unknown.status, 502);
  assert.equal((await unknown.json()).code, 'contact_outcome_unknown');
  assert.equal((await handler.fetch(request('contact', CONTACT, operationKey()))).status, 200);
  assert.deepEqual(calls[0], calls[1]);
});

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
    values,
  };
}

function formOperation(name, storage, overrides = {}) {
  return createFormOperation({ name, storage, now: () => NOW, randomUUID: () => UUIDS[0], digest: async text => createHash('sha256').update(text).digest('hex'), ...overrides });
}

test('contact operations retain the same key and exact in-memory body through uncertain retries and reload', async () => {
  const storage = memoryStorage();
  const operation = formOperation('contact', storage);
  const first = await operation.prepare(CONTACT);
  operation.uncertain();
  const reordered = Object.fromEntries(Object.entries(CONTACT).reverse());
  const retry = await operation.prepare(reordered);
  assert.equal(retry.key, first.key);
  assert.equal(retry.body, first.body);
  assert.equal(first.reused, false);
  assert.equal(retry.reused, true);
  const retained = [...storage.values.values()].join('');
  assert.ok(retained.includes(first.key));
  for (const personal of [CONTACT.nombre, CONTACT.correo, CONTACT.telefono, CONTACT.mensaje]) assert.ok(!retained.includes(personal));
  const reloaded = formOperation('contact', storage);
  assert.equal((await reloaded.prepare(CONTACT)).key, first.key);
});

test('booking operations refuse resubmission after uncertainty including after a tab reload', async () => {
  const storage = memoryStorage();
  const operation = formOperation('booking', storage);
  await operation.prepare(BOOKING, { allowRetry: false });
  operation.uncertain();
  await assert.rejects(operation.prepare(BOOKING, { allowRetry: false }), /pendiente de confirmación/);
  await assert.rejects(formOperation('booking', storage).prepare(BOOKING, { allowRetry: false }), /pendiente de confirmación/);
  await assert.rejects(formOperation('booking', storage).prepare({ ...BOOKING, time: '10:30' }, { allowRetry: false }), /pendiente de confirmación/);
});

test('changed details, expired keys and a backward clock cannot silently create fresh contact operations', async () => {
  const storage = memoryStorage();
  const operation = formOperation('contact', storage);
  const first = await operation.prepare(CONTACT);
  await assert.rejects(operation.prepare({ ...CONTACT, mensaje: 'Datos distintos tras un resultado incierto.' }), /pendiente de confirmación/);
  const expired = formOperation('contact', storage, { now: () => NOW + OPERATION_MAX_AGE_MS });
  await assert.rejects(expired.prepare(CONTACT), /pendiente de confirmación/);
  const backwardClock = formOperation('contact', storage, { now: () => NOW - 1 });
  await assert.rejects(backwardClock.prepare(CONTACT), /pendiente de confirmación/);
  assert.ok([...storage.values.values()][0].includes(first.key));
});

test('confirmed completion or a definitive unsent request explicitly clears the retained operation', async () => {
  const storage = memoryStorage();
  let sequence = 0;
  const operation = formOperation('contact', storage, { randomUUID: () => UUIDS[sequence++ % UUIDS.length] });
  const first = await operation.prepare(CONTACT);
  operation.complete();
  assert.equal(storage.values.size, 0);
  const next = await operation.prepare(CONTACT);
  assert.notEqual(next.key, first.key);
  operation.discard();
  assert.equal(storage.values.size, 0);
});

test('unavailable or corrupt operation storage blocks submission before a replacement key is issued', async () => {
  let generated = 0;
  const randomUUID = () => { generated++; return UUIDS[0]; };
  const unreadable = { getItem() { throw new Error('Simulated denied storage'); } };
  await assert.rejects(formOperation('contact', unreadable, { randomUUID }).prepare(CONTACT), /conservar el identificador/);
  const corrupt = { getItem: () => '{invalid' };
  await assert.rejects(formOperation('contact', corrupt, { randomUUID }).prepare(CONTACT), /conservar el identificador/);
  assert.equal(generated, 0);
  const full = { getItem: () => null, setItem() { throw new Error('Simulated storage quota'); }, removeItem() {} };
  await assert.rejects(formOperation('contact', full, { randomUUID }).prepare(CONTACT), /No se envió/);
});

test('operation age and future-clock boundaries reject expired requests before either provider is called', async () => {
  const oldestAccepted = operationKey(0, NOW - OPERATION_MAX_AGE_MS + 1);
  const firstExpired = operationKey(0, NOW - OPERATION_MAX_AGE_MS);
  const newestAccepted = operationKey(0, NOW + 60_000);
  const firstFuture = operationKey(0, NOW + 60_001);
  for (const key of [oldestAccepted, newestAccepted]) assert.deepEqual(readOperationKey(request('contact', CONTACT, key), NOW), { key });
  assert.equal(readOperationKey(request('contact', CONTACT, firstExpired), NOW).error.code, 'operation_expired');
  assert.equal(readOperationKey(request('contact', CONTACT, firstFuture), NOW).error.code, 'invalid_operation');

  for (const path of ['contact', 'booking-create']) {
    let calls = 0;
    const handler = path === 'contact'
      ? contactHandler(async () => { calls++; return acceptedMail(); })
      : bookingHandler(async () => { calls++; return acceptedBooking(); });
    const payload = path === 'contact' ? CONTACT : BOOKING;
    for (const [key, status, code] of [[firstExpired, 409, 'operation_expired'], [operationKey(0, NOW - OPERATION_MAX_AGE_MS - 1), 409, 'operation_expired'], [firstFuture, 400, 'invalid_operation']]) {
      const response = await handler.fetch(request(path, payload, key));
      assert.equal(response.status, status, path);
      assert.equal((await response.json()).code, code, path);
    }
    assert.equal(calls, 0, path);
    for (const key of [oldestAccepted, newestAccepted]) assert.equal((await handler.fetch(request(path, payload, key))).status, 200, path);
    assert.equal(calls, 2, path);
  }
});

test('mortgage retries and tab reloads retain original form timestamps when the client clock advances', async () => {
  const storage = memoryStorage();
  let clock = NOW;
  const payload = {
    ...CONTACT, consent: true, startedAt: NOW - 5_000,
    mortgage: { propertyUf: 10_000, downPaymentPercent: 25, years: 25, annualRatePercent: 4.5, rateConvention: 'nominal', bankId: null, simulatedAt: new Date(NOW - 1_000).toISOString(), location: 'santiago-metropolitana', propertyValueOrigin: 'visitor' },
  };
  const operation = formOperation('mortgage-contact', storage, { now: () => clock });
  const first = await operation.prepare(payload);
  operation.uncertain();
  clock += 7_000;
  const regenerated = { ...payload, startedAt: clock - 3_000, mortgage: { ...payload.mortgage, simulatedAt: new Date(clock).toISOString() } };
  const retry = await operation.prepare(regenerated);
  assert.equal(retry.key, first.key);
  assert.equal(retry.body, first.body);
  assert.equal(first.reused, false);
  assert.equal(retry.reused, true);
  const reloaded = formOperation('mortgage-contact', storage, { now: () => clock });
  const replay = await reloaded.prepare(regenerated);
  assert.equal(replay.key, first.key);
  assert.equal(replay.reused, true);
  assert.deepEqual(JSON.parse(replay.body), payload);
  const metadata = JSON.parse([...storage.values.values()][0]);
  assert.deepEqual(metadata.timing, { startedAt: payload.startedAt, simulatedAt: payload.mortgage.simulatedAt });
  for (const personal of [CONTACT.nombre, CONTACT.correo, CONTACT.telefono, CONTACT.mensaje]) assert.ok(!JSON.stringify(metadata).includes(personal));
});

test('a changed server UF snapshot preserves the contact operation key and reports a native payload conflict without another acceptance', async () => {
  const financialData = structuredClone(mortgageDataset);
  financialData.uf = { ...financialData.uf, date: '2026-10-17', valueClp: 41_130.94, source: { ...financialData.uf.source, verifiedAt: '2026-10-17' } };
  const payload = {
    ...CONTACT, consent: true, startedAt: NOW - 5_000,
    mortgage: { propertyUf: 10_000, downPaymentPercent: 25, years: 25, annualRatePercent: 4.5, rateConvention: 'nominal', bankId: null, simulatedAt: new Date(NOW - 1_000).toISOString(), location: 'santiago-metropolitana', propertyValueOrigin: 'visitor' },
  };
  const providerPayloads = new Map();
  const calls = [];
  let accepted = 0;
  const handler = contactHandler(async (url, options) => {
    const key = new Headers(options.headers).get('Idempotency-Key');
    calls.push({ key, body: options.body });
    if (providerPayloads.has(key) && providerPayloads.get(key) !== options.body) {
      return new Response(JSON.stringify({ name: 'invalid_idempotent_request', message: 'Simulated provider payload conflict' }), { status: 409 });
    }
    if (!providerPayloads.has(key)) { providerPayloads.set(key, options.body); accepted++; }
    return acceptedMail();
  }, { mortgageDataset: financialData, resolveUf: async () => { assert.fail('The current injected UF fixture must not call an external service'); } });
  assert.equal((await handler.fetch(request('contact', payload, operationKey()))).status, 200);
  financialData.uf.valueClp = 41_131.94;
  const conflict = await handler.fetch(request('contact', payload, operationKey()));
  assert.equal(conflict.status, 409);
  const body = await conflict.json();
  assert.equal(body.ok, false);
  assert.equal(body.code, 'operation_conflict');
  assert.equal(body.retry, false);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].key, calls[1].key);
  assert.notEqual(calls[0].body, calls[1].body);
  assert.match(JSON.parse(calls[0].body).text, /41\.130,94/);
  assert.match(JSON.parse(calls[1].body).text, /41\.131,94/);
  assert.equal(accepted, 1);
});

test('mortgage contact retries preserve the native email body when server time advances without a UF change', async () => {
  const financialData = structuredClone(mortgageDataset);
  financialData.uf = { ...financialData.uf, date: '2026-10-17', valueClp: 41_130.94, source: { ...financialData.uf.source, verifiedAt: '2026-10-17' } };
  const payload = {
    ...CONTACT, consent: true, startedAt: NOW - 5_000,
    mortgage: { propertyUf: 10_000, downPaymentPercent: 25, years: 25, annualRatePercent: 4.5, rateConvention: 'nominal', bankId: null, simulatedAt: new Date(NOW - 1_000).toISOString(), location: 'santiago-metropolitana', propertyValueOrigin: 'visitor' },
  };
  let clock = NOW;
  const calls = [];
  const providerPayloads = new Map();
  let accepted = 0;
  const handler = contactHandler(async (url, options) => {
    const key = new Headers(options.headers).get('Idempotency-Key');
    calls.push({ key, body: options.body });
    if (!providerPayloads.has(key)) {
      providerPayloads.set(key, options.body);
      accepted++;
      throw new Error('Simulated response loss after native provider acceptance');
    }
    if (providerPayloads.get(key) !== options.body) return new Response(JSON.stringify({ name: 'invalid_idempotent_request' }), { status: 409 });
    return acceptedMail();
  }, { mortgageDataset: financialData, now: () => clock, resolveUf: async () => { assert.fail('The injected current UF fixture must stay local'); } });
  const first = await handler.fetch(request('contact', payload, operationKey()));
  assert.equal(first.status, 502);
  assert.equal((await first.json()).code, 'contact_outcome_unknown');
  clock += 2_000;
  const replay = await handler.fetch(request('contact', payload, operationKey()));
  assert.equal(replay.status, 200);
  assert.deepEqual(await replay.json(), { ok: true });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(accepted, 1);
});

test('legacy mortgage retries retain a business-content key across volatile timestamps and do not produce a second acceptance', async () => {
  const financialData = structuredClone(mortgageDataset);
  financialData.uf = { ...financialData.uf, date: '2026-10-17', valueClp: 41_130.94, source: { ...financialData.uf.source, verifiedAt: '2026-10-17' } };
  const payload = {
    ...CONTACT, consent: true, startedAt: NOW - 5_000,
    mortgage: { propertyUf: 10_000, downPaymentPercent: 25, years: 25, annualRatePercent: 4.5, rateConvention: 'nominal', bankId: null, simulatedAt: new Date(NOW - 1_000).toISOString(), location: 'santiago-metropolitana', propertyValueOrigin: 'visitor' },
  };
  let clock = NOW;
  const calls = [];
  const providerPayloads = new Map();
  let accepted = 0;
  const handler = contactHandler(async (url, options) => {
    const key = new Headers(options.headers).get('Idempotency-Key');
    calls.push({ key, body: options.body });
    if (!providerPayloads.has(key)) {
      providerPayloads.set(key, options.body);
      accepted++;
      throw new Error('Simulated legacy response loss after provider acceptance');
    }
    if (providerPayloads.get(key) !== options.body) return new Response(JSON.stringify({ name: 'invalid_idempotent_request' }), { status: 409 });
    return acceptedMail();
  }, { mortgageDataset: financialData, now: () => clock, resolveUf: async () => { assert.fail('Current UF fixture must remain local'); } });
  const first = await handler.fetch(request('contact', payload));
  assert.equal(first.status, 502);
  assert.equal((await first.json()).code, 'contact_outcome_unknown');
  clock += 2_000;
  const regenerated = { ...payload, mortgage: { ...payload.mortgage, simulatedAt: new Date(clock).toISOString() } };
  const retry = await handler.fetch(request('contact', regenerated));
  assert.equal(retry.status, 409);
  assert.equal((await retry.json()).code, 'operation_conflict');
  assert.equal(calls.length, 2);
  assert.match(calls[0].key, /^contact\/legacy\/[a-f0-9]{64}$/);
  assert.equal(calls[0].key, calls[1].key);
  assert.notEqual(calls[0].body, calls[1].body);
  assert.equal(accepted, 1);
});

test('historical preservation projects only the five exact reviewed FUN corrections', () => {
  for (const file of P1_IDEMPOTENCY_FILES) {
    const actual = readFileSync(new URL('../' + file, import.meta.url));
    const baseline = execFileSync('git', ['show', '3866095:' + file], { cwd: new URL('../', import.meta.url) });
    assert.deepEqual(restoreP1IdempotencyFile(file, actual), baseline);
    assert.deepEqual(restoreP1IdempotencyFile(file, baseline), baseline);
  }
  assertP1IdempotencyAsset(readFileSync(new URL('../' + P1_IDEMPOTENCY_ASSET, import.meta.url)));
});

test('historical preservation rejects every foreign change to reviewed FUN files', () => {
  for (const file of P1_IDEMPOTENCY_FILES) {
    const mutated = Buffer.concat([readFileSync(new URL('../' + file, import.meta.url)), Buffer.from('\nForeign change\n')]);
    assert.throws(() => restoreP1IdempotencyFile(file, mutated), /exceeds the exact FUN-001 correction/);
  }
  const unrelated = Buffer.from('Unrelated bytes');
  assert.equal(restoreP1IdempotencyFile('unrelated.txt', unrelated), unrelated);
  assert.throws(() => assertP1IdempotencyAsset(Buffer.from('Foreign asset')), /must match its exact reviewed bytes/);
});
