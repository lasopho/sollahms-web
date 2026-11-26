import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../server.mjs';
import { presentPaymentData } from '../payment-data.mjs';

const inventory = { projects: [{ projectId: 'example', name: 'Ejemplo', developer: 'Prueba', commune: 'Santiago' }] };
const evidence = [{ quote: 'Entrega: 2do semestre 2028', section: 'Ficha', capturedAt: '2026-11-25T20:00:00Z', sha256: 'a'.repeat(64) }];
const sample = () => ({ schemaVersion: 1, version: 1, updatedAt: '2026-11-25T20:00:00Z', projects: [{
  id: 'example', delivery: { label: '2do semestre 2028', precision: 'semester', month: null, futureConfirmed: true,
    sourceUrl: 'https://iris.yapo.cl/proyecto/999999?token=discard', checkedAt: '2026-11-25T20:00:00Z' },
  conditions: '1% Upfront · 9% Pie en cuotas', evidence, units: [{ id: '101', typology: '1D1B', priceUf: 2500,
    priceLabel: 'UF 2.500', priceBasis: 'Precio final observado', sourceUrl: 'https://iris.yapo.cl/proyecto/999999',
    checkedAt: '2026-11-25T20:00:00Z', paymentTerms: { reservationTreatment: 'unknown' }, conditions: '', evidence }] }] });

test('payment data keeps unknown terms and delivery precision; strips secrets and untrusted names', () => {
  const input = sample();
  input.projects[0].name = 'Untrusted';
  input.projects[0].sourcePath = '/private/source.txt';
  input.secret = 'NEVER SERVE';
  const result = presentPaymentData(input, inventory);
  assert.equal(result.projects[0].name, 'Ejemplo');
  assert.equal(result.projects[0].delivery.month, null);
  assert.equal(result.projects[0].units[0].paymentTerms.initialPercentage, null);
  assert.equal(result.projects[0].units[0].paymentTerms.balloonAmountUf, null);
  assert.equal(result.projects[0].delivery.sourceUrl, 'https://iris.yapo.cl/proyecto/999999');
  assert.ok(!JSON.stringify(result).includes('NEVER SERVE'));
  assert.ok(!JSON.stringify(result).includes('/private/source'));
});

test('payment data rejects unknown identities, duplicate units, invented exact dates and invalid numbers', () => {
  const mutate = [
    value => { value.projects[0].id = 'other'; },
    value => { value.projects[0].units.push(structuredClone(value.projects[0].units[0])); },
    value => { value.projects[0].delivery.month = '2028-12'; },
    value => { value.projects[0].units[0].priceUf = -1; },
    value => { value.projects[0].units[0].paymentTerms.initialPercentage = 101; },
    value => { value.projects[0].delivery.sourceUrl = 'https://evil.test/proyecto/1'; },
  ];
  for (const change of mutate) { const value = sample(); change(value); assert.throws(() => presentPaymentData(value, inventory)); }
});

test('source timestamps require a real calendar date and an explicit timezone', () => {
  for (const timestamp of ['2026-02-29T12:00:00Z', '2026-02-31T12:00:00Z', '2026-04-31T12:00:00Z', '2026-11-25T24:00:00Z', '2026-11-25T12:00:00']) {
    const input = sample();
    input.projects[0].units[0].checkedAt = timestamp;
    assert.throws(() => presentPaymentData(input, inventory), timestamp);
  }
  const input = sample();
  input.updatedAt = '2028-02-29T12:00:00.123-03:00';
  assert.equal(presentPaymentData(input, inventory).updatedAt, input.updatedAt);
});

test('complete numeric terms and injected verification cannot certify commercial conditions', () => {
  const input = sample();
  input.projects[0].delivery = {...input.projects[0].delivery, precision: 'month', month: '2028-12'};
  input.projects[0].units[0].paymentTerms = {
    verified: true, requiredDownPaymentPercentage: 20, developerBonusPercentage: 10,
    initialPercentage: 1, initialAmountUf: null, reservationUf: 0,
    reservationTreatment: 'credited_to_initial', balloonPercentage: 0,
    balloonAmountUf: null, installments: 24, startMonth: '2027-01', deliveryMonth: '2028-12'
  };
  const result = presentPaymentData(input, inventory);
  assert.equal(result.projects[0].units[0].paymentTerms.verified, false);
});

test('new API and modules require the actual admin session and remain private with no-store', async () => {
  const rows = new Map();
  let sequence = 0;
  const store = {
    async read(key) { return rows.has(key) ? structuredClone(rows.get(key)) : null; },
    async write(key, value) { rows.set(key, { value, etag: String(++sequence) }); },
  };
  rows.set('payment-plans.json', { value: sample(), etag: '0' });
  let code;
  const handler = createHandler({ store, inventory,
    env: { BONOS_AUTH_SECRET: 'synthetic-secret-for-payment-data-over-forty-characters', BONOS_ADMIN_EMAIL: 'admin@example.test' },
    sendMail: async value => { code = value.code; }, asset: async () => 'protected-module' });
  async function request(query, method = 'GET', cookie = '', body = {}) {
    const req = { url: '/api/interno-bonos-pie?' + query, method, body,
      headers: { cookie, origin: 'https://sollahms.cl', 'content-type': 'application/json' } };
    const res = { headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(value) { this.body = value; } };
    await handler(req, res);
    assert.match(res.headers['cache-control'], /no-store/);
    assert.match(res.headers['x-robots-tag'], /noindex/);
    return res;
  }
  for (const op of ['op=payment-data', 'op=asset&file=payment-ui.js', 'op=asset&file=payment-plan.mjs'])
    assert.equal((await request(op)).statusCode, 401);
  const sent = await request('op=request-code', 'POST', '', { email: 'admin@example.test' });
  const challenge = sent.headers['set-cookie'].split(';')[0];
  const logged = await request('op=verify-code', 'POST', challenge, { code });
  const cookie = logged.headers['set-cookie'][0].split(';')[0];
  const data = await request('op=payment-data', 'GET', cookie);
  assert.equal(data.statusCode, 200);
  assert.equal(JSON.parse(data.body).projects.length, 1);
  assert.equal((await request('op=asset&file=payment-plan.mjs', 'GET', cookie)).body, 'protected-module');
  assert.equal((await request('op=asset&file=payment-ui.js', 'GET', cookie)).statusCode, 200);
  assert.equal((await request('op=payment-data', 'PUT', cookie, sample())).statusCode, 403);
  assert.equal(rows.get('payment-plans.json').etag, '0');
});
