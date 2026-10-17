import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import vm from 'node:vm';
import { createFormOperation } from '../assets/js/form-operation.mjs';
import { resolveProjectIdentity } from '../assets/js/project-identity.mjs';

// Simulate only the real page script. Every network destination is a local
// double, with reserved .invalid customer addresses and no provider access.
const html = readFileSync(new URL('../agenda-asesoria.html', import.meta.url), 'utf8');
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import[^\n]+\n/gm, '');
class Element {
  constructor(value = '') { this.value = value; this.hidden = false; this.disabled = false; this.listeners = {}; this.attributes = {}; this.textContent = ''; this.classList = { toggle() {} }; }
  addEventListener(name, fn) { (this.listeners[name] ??= []).push(fn); }
  setAttribute(name, value) { this.attributes[name] = value; }
  setCustomValidity(value) { this.validity = value; }
  reportValidity() { return !this.validity; }
  focus() { this.focused = true; }
  async emit(name) { for (const fn of this.listeners[name] ?? []) await fn({ preventDefault() {} }); }
}
function memoryStorage() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; }
function frontend({ storage = memoryStorage(), outcome = 'success' } = {}) {
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Element()]));
  const person = Object.fromEntries(Object.entries({ nombre: 'Cliente', apellido: 'Simulado', correo: 'qa@booking.test.invalid', telefono: '+56900000000', website: '' }).map(([key, value]) => [key, new Element(value)]));
  const form = elements['booking-form']; form.elements = { namedItem: name => person[name] };
  const date = elements['booking-date']; date.value = '2030-01-07';
  const time = elements['booking-time']; time.value = '10:00'; time.options = [{ value: '' }, { value: '10:00' }];
  const posts = [];
  vm.runInNewContext(script, {
    document: { getElementById: id => elements[id] }, window: { location: { search: '' } }, URLSearchParams, Date, Intl, AbortController,
    resolveProjectIdentity,
    createFormOperation: options => createFormOperation({ ...options, storage, randomUUID, digest: text => createHash('sha256').update(text).digest('hex') }),
    fetch: async (url, options) => {
      if (url === '/api/booking-availability') return { ok: true, status: 200, json: async () => ({ ok: true, available: true }) };
      assert.equal(url, '/api/booking-create'); posts.push({ headers: options.headers, body: JSON.parse(options.body) });
      if (outcome === 'lost-response') throw new TypeError('Failed to fetch');
      if (outcome === 'preview') return { ok: false, status: 503, json: async () => ({ ok: false, code: 'preview_read_only', error: 'La vista previa no envía reservas reales.' }) };
      return { ok: true, status: 200, json: async () => ({ ok: true, booked: true }) };
    },
  });
  return { elements, posts, storage, check: () => elements['booking-check'].emit('click'), submit: () => form.emit('submit') };
}

test('agenda confirms a simulated successful booking and preserves its original public response', async () => {
  const ui = frontend(); await ui.check(); await ui.submit();
  assert.equal(ui.posts.length, 1);
  assert.match(ui.posts[0].headers['Idempotency-Key'], /^sollahms-v1-/);
  assert.equal(ui.elements['booking-selector'].hidden, true);
  assert.match(ui.elements['booking-status'].textContent, /Tu asesoría quedó reservada/);
});

test('agenda blocks repeat booking after a lost response in the same tab and after reload', async () => {
  const ui = frontend({ outcome: 'lost-response' }); await ui.check(); await ui.submit();
  assert.equal(ui.posts.length, 1);
  assert.match(ui.elements['booking-status'].textContent, /No la repitas/);
  await ui.submit();
  assert.equal(ui.posts.length, 1);
  assert.match(ui.elements['booking-status'].textContent, /pendiente de confirmación/);
  const reloaded = frontend({ storage: ui.storage }); await reloaded.check(); await reloaded.submit();
  assert.equal(reloaded.posts.length, 0);
  assert.match(reloaded.elements['booking-status'].textContent, /pendiente de confirmación/);
});

test('agenda permits another simulated Preview review after a definitively unsent request', async () => {
  const ui = frontend({ outcome: 'preview' }); await ui.check(); await ui.submit(); await ui.submit();
  assert.equal(ui.posts.length, 2);
  assert.notEqual(ui.posts[0].headers['Idempotency-Key'], ui.posts[1].headers['Idempotency-Key']);
  assert.match(ui.elements['booking-status'].textContent, /vista previa/);
});
