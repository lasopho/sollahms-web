import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, Conflict, validateRecord, presentData } from '../server.mjs';

class MemoryStore {
  rows = new Map();
  sequence = 0;
  async read(key) { return this.rows.has(key) ? structuredClone(this.rows.get(key)) : null; }
  async write(key, value, previous) {
    const actual = this.rows.get(key);
    if ((previous && actual?.etag !== previous) || (!previous && actual)) throw new Conflict();
    const etag = String(++this.sequence);
    this.rows.set(key, { value: structuredClone(value), etag });
    return etag;
  }
}
function setup() {
  const store = new MemoryStore(), messages = [];
  let time = Date.parse('2026-11-25T20:00:00Z');
  const project = { projectId: 'example', name: 'Proyecto de prueba', developer: 'Prueba', commune: 'Santiago', region: 'Metropolitana', publicUrl: 'https://sollahms.cl/example.html' };
  const handler = createHandler({ store, clock: () => time,
    env: { BONOS_AUTH_SECRET: 'synthetic-test-secret-is-at-least-forty-characters', BONOS_ADMIN_EMAIL: 'admin@example.test' },
    inventory: { observedAtUtc: new Date(time).toISOString(), deploymentId: 'synthetic', projects: [project] },
    asset: async file => file.startsWith('panel') ? 'PRIVATE PANEL' : 'LOGIN', sendMail: async value => messages.push(value) });
  async function request(op = '', { method = 'GET', cookie = '', csrf = null, origin = 'https://sollahms.cl', path = '/api/interno-bonos-pie', body = {}, headers = {} } = {}) {
    const req = { method, url: path + (op ? '?' + op : ''), body,
      headers: { cookie, ...(method === 'GET' ? {} : { origin, 'content-type': 'application/json' }),
        ...(csrf ? { 'x-csrf-token': csrf } : {}), ...headers } };
    const res = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(value) { this.body = value ?? ''; } };
    await handler(req, res);
    res.json = () => JSON.parse(res.body);
    res.cookie = name => {
      const values = [res.headers['set-cookie']].flat().filter(Boolean);
      return values.find(value => value.startsWith(name + '='))?.split(';')[0];
    };
    assert.match(res.headers['cache-control'], /no-store/);
    assert.match(res.headers['x-robots-tag'], /noindex/);
    return res;
  }
  async function login() {
    const sent = await request('op=request-code', { method: 'POST' });
    assert.equal(sent.statusCode, 200);
    const challenge = sent.cookie('__Host-sollahms-bonos-challenge');
    const verified = await request('op=verify-code', { method: 'POST', cookie: challenge, body: { code: messages.at(-1).code } });
    assert.equal(verified.statusCode, 200);
    const cookie = verified.cookie('__Host-sollahms-bonos-session');
    const data = await request('op=data', { cookie });
    return { cookie, csrf: data.json().csrfToken, data: data.json(), challenge, code: messages.at(-1).code };
  }
  return { request, login, store, messages, advance(ms) { time += ms; }, time: () => time };
}
const record = () => ({ id: 'example', status: 'conditional', percentage: 20, amountUf: null,
  irisUrl: 'https://iris.yapo.cl/proyecto/1282?operation=Venta', checkedAt: '2026-11-25T19:00:00Z',
  conditions: 'Máximo 20%, sujeto a las unidades participantes.', units: 'No se especifican.', validUntil: null,
  identity: { name: 'Ejemplo', developer: 'Prueba', location: 'Santiago', validated: true },
  evidence: [{ quote: '20% Bono pie Máximo', section: 'Formas de pago', capturedAt: '2026-11-25T19:00:00Z' }] });

test('anonymous visitors cannot read page, data, scripts, or mutate records', async () => {
  const s = setup();
  const page = await s.request('', { path: '/interno/bonos-pie' });
  assert.equal(page.statusCode, 303);
  assert.equal(page.headers.location, '/interno/bonos-pie/acceso');
  assert.equal(page.body, '');
  for (const op of ['op=data', 'op=csv', 'op=asset&file=panel.js', 'op=asset&file=panel.css'])
    assert.equal((await s.request(op)).statusCode, 401);
  assert.equal((await s.request('op=data', { method: 'PUT', body: { expectedVersion: 0, records: [record()] } })).statusCode, 401);
  assert.equal((await s.request('op=asset&file=../server.mjs')).statusCode, 404);
  assert.equal((await s.request('', { path: '/interno/bonos-pie/acceso' })).body, 'LOGIN');
  assert.equal(s.messages.length, 0);
});

test('OTP is server-only, exclusive, expiring and consumed once under concurrency', async () => {
  const s = setup();
  const sent = await s.request('op=request-code', { method: 'POST', body: { email: 'attacker@example.test' } });
  assert.equal(sent.statusCode, 200);
  assert.ok(!sent.body.includes(s.messages[0].code));
  assert.ok(!JSON.stringify([...s.store.rows]).includes(s.messages[0].code));
  assert.match(sent.headers['set-cookie'], /Secure; HttpOnly; SameSite=Strict/);
  const cookie = sent.cookie('__Host-sollahms-bonos-challenge');
  const attempts = await Promise.all([1, 2].map(() => s.request('op=verify-code', { method: 'POST', cookie, body: { code: s.messages[0].code } })));
  assert.equal(attempts.filter(r => r.statusCode === 200).length, 1);
  assert.equal((await s.request('op=verify-code', { method: 'POST', cookie, body: { code: s.messages[0].code } })).statusCode, 401);
});

test('OTP limits attempts, expiry and request volume in persistent storage', async () => {
  const s = setup();
  const sent = await s.request('op=request-code', { method: 'POST' });
  const cookie = sent.cookie('__Host-sollahms-bonos-challenge');
  const wrong = s.messages[0].code === '00000000' ? '99999999' : '00000000';
  for (let i = 0; i < 5; i++) assert.equal((await s.request('op=verify-code', { method: 'POST', cookie, body: { code: wrong } })).statusCode, 401);
  assert.equal((await s.request('op=verify-code', { method: 'POST', cookie, body: { code: s.messages[0].code } })).statusCode, 401);
  assert.equal((await s.request('op=request-code', { method: 'POST' })).statusCode, 429);
  s.advance(61_000);
  const another = await s.request('op=request-code', { method: 'POST' });
  s.advance(600_001);
  assert.equal((await s.request('op=verify-code', { method: 'POST', cookie: another.cookie('__Host-sollahms-bonos-challenge'), body: { code: s.messages.at(-1).code } })).statusCode, 401);
});

test('mutations require origin, JSON, authenticated session and CSRF', async () => {
  const s = setup();
  assert.equal((await s.request('op=request-code', { method: 'POST', origin: 'https://evil.test' })).statusCode, 403);
  assert.equal(s.messages.length, 0);
  const auth = await s.login();
  const input = { expectedVersion: 0, records: [record()] };
  assert.equal((await s.request('op=data', { method: 'PUT', cookie: auth.cookie, body: input })).statusCode, 403);
  assert.equal((await s.request('op=data', { method: 'PUT', cookie: auth.cookie, csrf: auth.csrf, body: input, origin: 'https://evil.test' })).statusCode, 403);
  assert.equal((await s.request('op=data', { method: 'PUT', cookie: auth.cookie, csrf: auth.csrf, body: input, headers: { 'content-type': 'text/plain' } })).statusCode, 415);
  assert.equal((await s.request('op=data', { method: 'PUT', cookie: auth.cookie, csrf: auth.csrf, body: input })).statusCode, 200);
  const data = (await s.request('op=data', { cookie: auth.cookie })).json();
  assert.equal(data.stats.withBonus, 1);
  assert.equal(data.stats.withPercentage, 1);
  assert.equal(data.version, 1);
  assert.equal(data.history.length, 1);
  assert.equal(data.projects[0].irisUrl, 'https://iris.yapo.cl/proyecto/1282');
  assert.equal((await s.request('op=data', { method: 'PUT', cookie: auth.cookie, csrf: auth.csrf, body: input })).statusCode, 409);
});

test('logout revokes the actual server session and sessions expire', async () => {
  const s = setup(), auth = await s.login();
  assert.equal((await s.request('', { path: '/interno/bonos-pie', cookie: auth.cookie })).body, 'PRIVATE PANEL');
  assert.equal((await s.request('op=logout', { method: 'POST', cookie: auth.cookie, csrf: auth.csrf })).statusCode, 200);
  assert.equal((await s.request('op=data', { cookie: auth.cookie })).statusCode, 401);
  const s2 = setup(), auth2 = await s2.login();
  s2.advance(8 * 3600_000 + 1);
  assert.equal((await s2.request('op=data', { cookie: auth2.cookie })).statusCode, 401);
});

test('discounts cannot become bonuses; identities, current evidence and safe Iris URLs are mandatory', () => {
  const valid = record(), project = { id: 'example' }, now = Date.parse('2026-11-25T20:00:00Z');
  assert.equal(validateRecord(valid, project, now).percentage, 20);
  for (const input of [
    { ...valid, evidence: [{ quote: '20% descuento', capturedAt: valid.checkedAt }] },
    { ...valid, status: 'promotion_only' },
    { ...valid, irisUrl: 'https://evil.test/proyecto/1282' },
    { ...valid, identity: { ...valid.identity, validated: false } },
    { ...valid, checkedAt: '2027-01-01T00:00:00Z' },
    { ...valid, percentage: 101 },
  ]) assert.throws(() => validateRecord(input, project, now));
});

test('expired promotions are retained with evidence and excluded from active benefit metrics', () => {
  const state = { version: 1, projects: [{ id: 'example' }, { id: 'pending' }], records: { example: { ...record(), validUntil: '2026-11-24' } } };
  const data = presentData(state, Date.parse('2026-11-25T20:00:00Z'));
  assert.equal(data.projects[0].expired, true);
  assert.equal(data.projects[0].percentage, 20);
  assert.equal(data.stats.withBonus, 0);
  assert.equal(data.stats.pending, 2);
  assert.equal(data.refresh.automaticIris, false);
});
