import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import contact from '../api/contact.mjs';
import { projects } from '../lib/project-context.mjs';
import { normalizeRut, RUT_ERROR } from '../assets/js/rut.mjs';

// All values are synthetic. Every provider call is replaced; no mail is sent.
const validContact = Object.freeze({
  nombre: 'Cliente Prueba', correo: 'qa@contact.test.invalid', telefono: '+56900000000',
  rut: '', mensaje: 'Prueba automatizada sin envío real.', website: '',
});
const validRuts = [
  ['10.000.000-8', '10000000-8'], ['10000000-8', '10000000-8'],
  ['100000008', '10000000-8'], ['1.000.005-K', '1000005-K'],
  ['1000005-k', '1000005-K'], ['1000005K', '1000005-K'],
  [' 1000005-k ', '1000005-K'], ['14-0', '14-0'], ['00000006-k', '6-K'],
];
const invalidRuts = ['10.000.000-1', '10000000-K', '1.000.005-1', '1000005-X', '0-0',
  '00000000-0', '10..000.000-8', '1.00.005-K', '10000000--8', '10 000 000-8',
  '10000000', 'K', '999999999-9', '<script>', '1000005-K\nBcc: other'];

function request(body, raw) {
  return new Request('https://local.test.invalid/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: raw ?? JSON.stringify(body),
  });
}
function provider(t, { status = 200, throws = false, preview = false } = {}) {
  const originalFetch = globalThis.fetch;
  const env = { RESEND_API_KEY: process.env.RESEND_API_KEY, VERCEL_ENV: process.env.VERCEL_ENV };
  process.env.RESEND_API_KEY = 'synthetic-test-key';
  if (preview) process.env.VERCEL_ENV = 'preview';
  else delete process.env.VERCEL_ENV;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://api.resend.com/emails');
    calls.push({ url: String(url), options, body: JSON.parse(options.body) });
    if (throws) throw new Error('Private simulated upstream failure');
    return Response.json({ id: 'simulated-only' }, { status });
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  return calls;
}

test('RUT accepts dotted/plain forms, absent dash, lowercase K and modulo 11 branches', () => {
  for (const [input, expected] of validRuts) assert.equal(normalizeRut(input), expected, input);
  assert.equal(normalizeRut(''), '');
  assert.equal(normalizeRut('   '), '');
  for (const input of [...invalidRuts, null, undefined, 100000008, {}, []]) assert.equal(normalizeRut(input), null);
});

test('backend accepts optional empty/omitted RUT and all supported synthetic formats', async t => {
  const calls = provider(t);
  const { rut, ...omitted } = validContact;
  for (const body of [omitted, validContact, { ...validContact, rut: '   ' }, ...validRuts.map(([rut]) => ({ ...validContact, rut }))]) {
    const result = await contact.fetch(request(body));
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { ok: true });
    assert.equal(calls.at(-1).body.subject, 'Consulta desde Sollahms');
    const email = JSON.stringify(calls.at(-1).body);
    assert.ok(!email.includes('RUT'));
    if (body.rut?.trim()) {
      assert.ok(!email.includes(body.rut.trim()));
      assert.ok(!email.includes(normalizeRut(body.rut)));
    }
  }
});

test('backend rejects invalid RUT before any provider and never echoes the identifier', async t => {
  const calls = provider(t);
  for (const rut of invalidRuts) {
    const result = await contact.fetch(request({ ...validContact, rut }));
    assert.equal(result.status, 400);
    assert.deepEqual(await result.json(), { code: 'invalid_rut', error: RUT_ERROR });
  }
  for (const rut of [null, 100000008, {}, []]) assert.equal((await contact.fetch(request({ ...validContact, rut }))).status, 400);
  assert.equal(calls.length, 0);
});

test('contact rejects malformed/non-object JSON, invalid UTF-8 and oversized bodies before any provider', async t => {
  const calls = provider(t);
  for (const raw of ['{invalid', 'null', '[]', '"string"', new Uint8Array([0xc3, 0x28])]) {
    assert.equal((await contact.fetch(request(null, raw))).status, 400);
  }
  assert.equal((await contact.fetch(request(null, 'x'.repeat(32769)))).status, 413);
  assert.equal(calls.length, 0);
});

test('all 148 projects derive the email subject and internal name from the server catalogue', async t => {
  const calls = provider(t);
  assert.equal(Object.keys(projects).length, 148);
  for (const [slug, project] of Object.entries(projects)) {
    const result = await contact.fetch(request({ ...validContact, proyecto: slug, rut: '1.000.005-K' }));
    assert.equal(result.status, 200);
    assert.deepEqual(await result.json(), { ok: true });
    const email = calls.at(-1).body;
    assert.equal(email.subject, 'Consulta sobre ' + project.name);
    assert.ok(email.text.includes('Proyecto: ' + project.name));
    assert.ok(email.text.includes('Identificador: ' + slug));
    assert.ok(!JSON.stringify(email).includes('1000005-K'));
    assert.ok(!JSON.stringify(email).includes('1.000.005-K'));
  }
  assert.equal(calls.length, 148);
});

test('forged subject/name and unknown, inherited, malformed or whitespace slugs cannot reach the provider', async t => {
  const calls = provider(t);
  for (const proyecto of ['', 'unknown-project', '__proto__', 'constructor', ' distrito-centro ', null, true, 12, [], {}]) {
    assert.equal((await contact.fetch(request({ ...validContact, proyecto }))).status, 400);
  }
  for (const key of ['asunto', 'subject', 'nombreProyecto', 'projectName', '__proto__', 'constructor']) {
    const raw = JSON.stringify(validContact).replace(/}$/, ',"' + key + '":"Identidad inventada"}');
    assert.equal((await contact.fetch(request(null, raw))).status, 400);
  }
  assert.equal(calls.length, 0);
});

test('Preview and honeypot protect against sends with RUT and trusted project context', async t => {
  const calls = provider(t, { preview: true });
  const input = { ...validContact, rut: '1000005-k', proyecto: 'distrito-centro' };
  const result = await contact.fetch(request(input));
  assert.equal(result.status, 503);
  const body = await result.json();
  assert.equal(body.code, 'preview_read_only');
  assert.ok(!JSON.stringify(body).includes(input.rut));
  const honeypot = await contact.fetch(request({ ...input, website: 'bot.test.invalid' }));
  assert.equal(honeypot.status, 200);
  assert.equal(calls.length, 0);
});

test('provider errors preserve a generic response without personal data', async t => {
  const calls = provider(t, { throws: true });
  const response = await contact.fetch(request({ ...validContact, rut: '1000005-K', proyecto: 'box-santiago' }));
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.ok(!JSON.stringify(body).includes('1000005'));
  assert.ok(!JSON.stringify(body).includes('Private simulated'));
  assert.equal(calls.length, 1);
});

const html = await readFile(new URL('../contacto.html', import.meta.url), 'utf8');
const formScript = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/m, '');
class Element {
  constructor(value = '') { this.value = value; this.hidden = false; this.listeners = {}; this.attributes = {}; this.textContent = ''; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  setAttribute(name, value) { this.attributes[name] = value; }
  setCustomValidity(value) { this.validity = value; }
  focus() { this.focused = true; }
}
function frontend({ slug = null, status = 200, code, deferred = false, failCatalogue = false } = {}) {
  const controls = Object.fromEntries(Object.entries(validContact).map(([key, value]) => [key, new Element(value)]));
  const button = new Element();
  const statusText = new Element();
  const context = new Element(); context.hidden = true;
  const error = new Element(); error.hidden = true;
  const agenda = [new Element(), new Element()];
  agenda.forEach(link => { link.href = '/agenda-asesoria.html'; });
  const form = new Element();
  form.elements = controls;
  form.querySelector = () => button;
  form.reset = () => { for (const control of Object.values(controls)) control.value = ''; form.resets = (form.resets || 0) + 1; };
  const elements = { 'contact-form': form, 'form-status': statusText, rut: controls.rut, 'rut-error': error, 'contact-project-context': context };
  const posts = [];
  let release;
  const mockFetch = async (url, options) => {
    if (url === '/data/proyectos.json') {
      if (failCatalogue) throw new Error('Synthetic catalogue failure');
      return { ok: true, json: async () => Object.entries(projects).map(([slug, project]) => ({ slug, nombre: project.name })) };
    }
    assert.equal(url, '/api/contact');
    posts.push({ url, payload: JSON.parse(options.body) });
    if (deferred) await new Promise(resolve => { release = resolve; });
    return { ok: status === 200, json: async () => ({ code, error: code === 'preview_read_only' ? 'La vista previa no envía mensajes reales.' : RUT_ERROR }) };
  };
  class MockFormData { constructor() { this.values = Object.entries(controls).map(([key, control]) => [key, control.value]); } [Symbol.iterator]() { return this.values[Symbol.iterator](); } }
  vm.runInNewContext(formScript, {
    document: { getElementById: id => elements[id], querySelectorAll: () => agenda },
    window: { location: { search: slug === null ? '' : '?proyecto=' + encodeURIComponent(slug) } },
    URLSearchParams, FormData: MockFormData, fetch: mockFetch, normalizeRut, RUT_ERROR,
  });
  return { controls, button, status: statusText, context, error, form, agenda, posts, release: () => release(), submit: () => form.listeners.submit({ preventDefault() {} }) };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('frontend replaces visible subject with an optional RUT and uses POST even without JavaScript', () => {
  assert.ok(!html.includes('id="asunto"'));
  assert.match(html, /<form[^>]*id="contact-form"[^>]*method="post"[^>]*action="\/api\/contact"/);
  assert.match(html, /<label[^>]*for="rut">RUT<\/label>/);
  const input = html.match(/<input[^>]*id="rut"[^>]*>/)[0];
  assert.ok(!input.includes('required'));
  assert.ok(input.includes('aria-describedby="rut-help rut-error"'));
});

test('frontend invalid RUT blocks fetch, gives a clear error and clears it while editing', async () => {
  const ui = frontend();
  ui.controls.rut.value = '10.000.000-1';
  await ui.submit();
  assert.equal(ui.posts.length, 0);
  assert.equal(ui.error.textContent, RUT_ERROR);
  assert.equal(ui.error.hidden, false);
  assert.equal(ui.controls.rut.attributes['aria-invalid'], 'true');
  assert.equal(ui.controls.rut.focused, true);
  ui.controls.rut.listeners.input();
  assert.equal(ui.error.hidden, true);
  assert.equal(ui.controls.rut.validity, '');
});

test('frontend normalizes valid blur/send forms, accepts empty input and keeps identifiers out of URLs', async () => {
  for (const [input, expected] of [...validRuts, ['', '']]) {
    const ui = frontend({ slug: 'distrito-centro' });
    ui.controls.rut.value = input;
    ui.controls.rut.listeners.blur();
    assert.equal(ui.controls.rut.value, expected);
    await ui.submit();
    assert.equal(ui.posts[0].url, '/api/contact');
    assert.equal(ui.posts[0].payload.rut, expected);
    assert.equal(ui.posts[0].payload.proyecto, 'distrito-centro');
    assert.ok(!Object.hasOwn(ui.posts[0].payload, 'asunto'));
    assert.ok(!Object.hasOwn(ui.posts[0].payload, 'nombreProyecto'));
    assert.equal(ui.controls.rut.value, '');
    assert.equal(ui.button.disabled, false);
    assert.equal(ui.error.hidden, true);
  }
});

test('frontend retains all 148 project contexts and both agenda links before and after successful resets', async () => {
  for (const [slug, project] of Object.entries(projects)) {
    const ui = frontend({ slug });
    await settle();
    assert.equal(ui.context.textContent, 'Estás consultando por ' + project.name + '.');
    assert.equal(ui.context.hidden, false);
    assert.ok(ui.agenda.every(link => link.href === '/agenda-asesoria.html?proyecto=' + encodeURIComponent(slug)));
    await ui.submit();
    await ui.submit();
    assert.ok(ui.posts.every(post => post.payload.proyecto === slug));
    assert.equal(ui.context.textContent, 'Estás consultando por ' + project.name + '.');
    assert.equal(ui.form.resets, 2);
  }
});

test('frontend preserves slug even if contextual catalogue fetch fails', async () => {
  const ui = frontend({ slug: 'distrito-centro', failCatalogue: true });
  await settle();
  await ui.submit();
  assert.equal(ui.posts[0].payload.proyecto, 'distrito-centro');
});

test('frontend prevents duplicate requests while sending and recovers button after completion', async () => {
  const ui = frontend({ slug: 'distrito-centro', deferred: true });
  const first = ui.submit();
  await ui.submit();
  assert.equal(ui.posts.length, 1);
  assert.equal(ui.button.disabled, true);
  ui.release();
  await first;
  assert.equal(ui.button.disabled, false);
  assert.equal(ui.form.resets, 1);
});

test('frontend preserves entries on Preview/provider failure and displays server RUT/project errors', async () => {
  for (const [status, code] of [[503, 'preview_read_only'], [502, undefined], [400, 'invalid_rut'], [400, 'invalid_project']]) {
    const ui = frontend({ slug: 'distrito-centro', status, code });
    ui.controls.rut.value = '1000005-k';
    await ui.submit();
    assert.equal(ui.controls.rut.value, '1000005-K');
    assert.equal(ui.controls.mensaje.value, validContact.mensaje);
    assert.equal(ui.form.resets, undefined);
    assert.equal(ui.button.disabled, false);
    if (code === 'invalid_rut') assert.equal(ui.error.textContent, RUT_ERROR);
    else assert.ok(ui.status.textContent.length > 0);
  }
});
