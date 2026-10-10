import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import catalogue from '../data/proyectos.json' with { type: 'json' };
import dataset from '../data/hipotecario.json' with { type: 'json' };
import { calculateMortgage } from '../assets/js/mortgage-engine.mjs';
import { validateDataset, getUfStatus, getOfferStatus, compareOffers, sortComparisons } from '../assets/js/mortgage-data.mjs';
import { verifiedProjectPrice, verifiedProjectLocation } from '../assets/js/project-finance.mjs';
import { consumeMortgageHandoff, writeMortgageHandoff, MORTGAGE_HANDOFF_KEY, MORTGAGE_HANDOFF_TTL_MS } from '../assets/js/mortgage-handoff.mjs';

const NOW = Date.parse('2026-10-10T15:00:00Z');
const scenario = { projectSlug: 'distrito-centro', propertyUf: 2715, downPaymentPercent: 20, years: 25, annualRatePercent: 4.5, rateConvention: 'effective', propertyValueOrigin: 'catalogue' };
function memoryStorage() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

test('handoff preserves only an explicit anonymous scenario and consumes it once', () => {
  const storage = memoryStorage();
  assert.equal(writeMortgageHandoff(scenario, { storage, now: NOW }), true);
  const stored = JSON.parse(storage.getItem(MORTGAGE_HANDOFF_KEY));
  assert.deepEqual(Object.keys(stored.scenario), Object.keys(scenario));
  assert.deepEqual(consumeMortgageHandoff('distrito-centro', { storage, now: NOW + 1 }), scenario);
  assert.equal(storage.getItem(MORTGAGE_HANDOFF_KEY), null);
  assert.equal(consumeMortgageHandoff('distrito-centro', { storage, now: NOW + 2 }), null);
});

test('handoff removes wrong-project, expired, future, malformed and extra-key records before rejecting', () => {
  const storage = memoryStorage();
  for (const [slug, at] of [['other-project', NOW], ['distrito-centro', NOW + MORTGAGE_HANDOFF_TTL_MS + 1], ['distrito-centro', NOW - 1]]) {
    writeMortgageHandoff(scenario, { storage, now: NOW });
    assert.equal(consumeMortgageHandoff(slug, { storage, now: at }), null);
    assert.equal(storage.getItem(MORTGAGE_HANDOFF_KEY), null);
  }
  for (const raw of ['{bad', 'null', '[]', 'x'.repeat(4097), JSON.stringify({ version: 1, createdAt: NOW, scenario, income: 1 }), JSON.stringify({ version: 1, createdAt: NOW, scenario: { ...scenario, rut: '10000000-8' } })]) {
    storage.setItem(MORTGAGE_HANDOFF_KEY, raw);
    assert.equal(consumeMortgageHandoff('distrito-centro', { storage, now: NOW }), null);
    assert.equal(storage.getItem(MORTGAGE_HANDOFF_KEY), null);
  }
  writeMortgageHandoff(scenario, { storage, now: NOW });
  assert.deepEqual(consumeMortgageHandoff('distrito-centro', { storage, now: NOW + MORTGAGE_HANDOFF_TTL_MS }), scenario);
});

test('handoff rejects personal/financial filter fields, implicit numbers and mortgage limits without storing them', () => {
  const storage = memoryStorage();
  const invalid = [null, [], {}, { ...scenario, propertyUf: '2715' }, { ...scenario, years: 41 }, { ...scenario, years: 5.5 }, { ...scenario, downPaymentPercent: 0 }, { ...scenario, annualRatePercent: -1 }, { ...scenario, rateConvention: 'other' }, { ...scenario, propertyValueOrigin: 'verified' }, { ...scenario, projectSlug: '../secret' }];
  for (const key of ['renta', 'ahorro', 'deudas', 'income', 'savings', 'debt', 'nombre', 'correo', 'telefono', 'rut', 'bankId']) invalid.push({ ...scenario, [key]: 'private' });
  for (const value of invalid) {
    assert.equal(writeMortgageHandoff(value, { storage, now: NOW }), false);
    assert.equal(storage.values.size, 0);
  }
  assert.equal(writeMortgageHandoff(scenario, { storage: null, now: NOW }), false);
  assert.equal(consumeMortgageHandoff(scenario.projectSlug, { storage: null, now: NOW }), null);
  const blocked = { getItem() { throw new Error('storage blocked'); }, removeItem() { throw new Error('storage blocked'); } };
  assert.equal(writeMortgageHandoff(scenario, { storage: blocked, now: NOW }), false);
  assert.equal(consumeMortgageHandoff(scenario.projectSlug, { storage: blocked, now: NOW }), null);
});

const html = await readFile(new URL('../comparador-hipotecario.html', import.meta.url), 'utf8');
const script = (await readFile(new URL('../assets/js/hipotecario.mjs', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
class Element {
  constructor(id, value = '') {
    this.id = id; this.value = String(value); this.hidden = false; this.disabled = false;
    this.listeners = {}; this.attributes = {}; this.textContent = ''; this.innerHTML = '';
    this.checked = true; this.firstElementChild = { style: {} };
    this.options = ['dividend', 'rate', 'cae', 'totalCost'].map(value => ({ value, disabled: false }));
  }
  get value() { return this.currentValue; }
  set value(value) { this.currentValue = String(value); }
  get selectedOptions() { return this.options.filter(option => option.value === this.value); }
  get valueAsNumber() { return this.value.trim() === '' ? NaN : Number(this.value); }
  get validity() { return { valid: this.value === '' || Number.isFinite(Number(this.value)) || !['property','down','rate','custom-years'].includes(this.id) }; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  replaceChildren() { this.innerHTML = ''; }
  querySelectorAll() { return []; }
  reportValidity() { return this.checked; }
  focus() { this.focused = true; }
  select() {}
  scrollIntoView() {}
  reset() { this.resets = (this.resets || 0) + 1; }
}
const settle = () => new Promise(resolve => setImmediate(resolve));
async function frontend({ slug = 'distrito-centro', search, storage = memoryStorage(), failCatalogue = false, status = 503, deferred = false } = {}) {
  let now = NOW;
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const elements = Object.fromEntries(ids.map(id => [id, new Element(id)]));
  elements['retry-data'] = new Element('retry-data');
  Object.entries({ property: '4000', down: '20', years: '25', 'custom-years': '10', rate: '', convention: 'effective', location: 'unknown', sort: 'dividend', nombre: 'Cliente Prueba', correo: 'qa@comparator.test.invalid', telefono: '+56900000000', comentario: 'Prueba sin envío.', website: '' }).forEach(([id, value]) => elements[id].value = value);
  elements['lead-section'].hidden = true;
  const agenda = [new Element('agenda')];
  const presets = ['10', '15', '20', 'custom'].map(down => { const element = new Element('preset'); element.dataset = { down }; return element; });
  const posts = [];
  let release;
  const context = vm.createContext({
    document: { getElementById: id => elements[id], querySelectorAll: selector => selector === '[data-down]' ? presets : selector === '[data-project-agenda]' ? agenda : [], addEventListener() {}, hidden: false },
    window: { location: { search: search ?? (slug ? '?proyecto=' + encodeURIComponent(slug) : '') }, addEventListener() {} },
    innerWidth: 1440, URL, URLSearchParams, Intl, Date: Clock, AbortSignal, setInterval() {},
    calculateMortgage, validateDataset, getUfStatus, getOfferStatus, compareOffers, sortComparisons, verifiedProjectPrice, verifiedProjectLocation,
    consumeMortgageHandoff: projectSlug => consumeMortgageHandoff(projectSlug, { storage, now }),
    fetch: async (url, options) => {
      if (url === '/data/proyectos.json') {
        if (failCatalogue) throw new Error('Synthetic unavailable catalogue');
        return { ok: true, json: async () => catalogue };
      }
      if (url === '/data/hipotecario.json') return { ok: true, json: async () => dataset };
      assert.equal(url, '/api/contact');
      posts.push(JSON.parse(options.body));
      if (deferred) await new Promise(resolve => { release = resolve; });
      return { ok: status === 200, json: async () => status === 200 ? { ok: true } : { code: 'preview_read_only', error: 'La vista previa no envía mensajes reales.' } };
    },
  });
  vm.runInContext(script, context);
  await settle();
  const invoke = code => vm.runInContext(code, context);
  return { elements, agenda, posts, storage, invoke, release: () => release(), advance: amount => { now += amount; }, input: (id, value) => { elements[id].value = String(value); elements['simulation-form'].listeners.input({ target: elements[id] }); }, submit: () => elements['lead-form'].listeners.submit({ preventDefault() {} }) };
}

test('all148 project origins load exactly115 verified prices, leave33 pending blank and keep agenda/detail context', async () => {
  let verified = 0;
  for (const project of catalogue) {
    const ui = await frontend({ slug: project.slug });
    const price = verifiedProjectPrice(project, new Date(NOW));
    assert.equal(ui.elements['project-name'].textContent, project.nombre);
    assert.equal(ui.elements['project-detail'].href, project.detalleUrl);
    assert.ok(ui.agenda.every(link => link.href === '/agenda-asesoria.html?proyecto=' + encodeURIComponent(project.slug)));
    assert.equal(Number(ui.elements.property.value) || null, price?.valueUf ?? null);
    assert.equal(ui.elements.down.value, '20');
    assert.equal(ui.elements.years.value, '25');
    assert.equal(ui.elements.rate.value, '');
    if (price) { verified++; assert.ok(ui.elements['project-price-origin'].textContent.includes('verificado')); }
    else assert.ok(ui.elements['project-price-origin'].textContent.includes('pendiente de verificación'));
  }
  assert.equal(verified, 115);
  assert.equal(catalogue.length - verified, 33);
});

test('project contact preserves trusted slug and9 mortgage inputs, never sends arbitrary subject/name or RUT', async () => {
  const ui = await frontend();
  ui.input('rate', 4.5);
  ui.invoke('openLead()');
  ui.advance(3000);
  await ui.submit();
  assert.equal(ui.posts.length, 1);
  const body = ui.posts[0];
  assert.equal(body.proyecto, 'distrito-centro');
  assert.equal(body.mortgage.propertyUf, 2715);
  assert.equal(body.mortgage.propertyValueOrigin, 'catalogue');
  assert.equal(body.consent, true);
  assert.equal(Object.keys(body.mortgage).length, 9);
  for (const key of ['asunto', 'subject', 'nombreProyecto', 'rut', 'renta', 'ahorro', 'deudas']) assert.ok(!Object.hasOwn(body, key));
  assert.equal(ui.elements['lead-form'].resets, undefined);
  assert.equal(ui.elements['lead-status'].textContent, 'La vista previa no envía mensajes reales.');
  assert.equal(ui.elements.property.value, '2715');
  assert.equal(ui.elements.rate.value, '4.5');
  assert.equal(ui.elements['lead-submit'].disabled, false);
});

test('editing a price labels visitor origin even if typed back to the published amount; pending projects use own values', async () => {
  for (const slug of ['distrito-centro', 'lomas-de-puyai-3']) {
    const ui = await frontend({ slug });
    ui.input('property', 2715);
    ui.input('rate', 4.5);
    ui.invoke('openLead()'); ui.advance(3000);
    await ui.submit();
    assert.equal(ui.posts[0].proyecto, slug);
    assert.equal(ui.posts[0].mortgage.propertyValueOrigin, 'visitor');
    assert.ok(ui.elements['project-price-origin'].textContent.includes('proporcionado por ti'));
  }
});

test('valid handoff restores custom scenario and consumes storage, while forged catalogue value cannot replace the official one', async () => {
  const storage = memoryStorage();
  const custom = { ...scenario, downPaymentPercent: 15, years: 7, annualRatePercent: 0 };
  writeMortgageHandoff(custom, { storage, now: NOW });
  const ui = await frontend({ storage });
  assert.equal(storage.values.size, 0);
  assert.equal(ui.elements.property.value, '2715');
  assert.equal(ui.elements.down.value, '15');
  assert.equal(ui.elements.years.value, 'custom');
  assert.equal(ui.elements['custom-years'].value, '7');
  assert.equal(ui.elements.rate.value, '0');
  ui.invoke('openLead()'); ui.advance(3000); await ui.submit();
  assert.equal(ui.posts[0].mortgage.years, 7);
  assert.equal(ui.posts[0].mortgage.propertyValueOrigin, 'catalogue');
  writeMortgageHandoff({ ...scenario, propertyUf: 1_000 }, { storage, now: NOW });
  const safe = await frontend({ storage });
  assert.equal(safe.elements.property.value, '2715');
  assert.equal(safe.elements.rate.value, '');
  assert.equal(storage.values.size, 0);
});

test('unknown, duplicate, malformed or unavailable project context cannot inject a name, price or slug', async () => {
  for (const options of [{ slug: 'invented-project' }, { search: '?proyecto=distrito-centro&proyecto=box-santiago' }, { search: '?proyecto=__proto__&price=1&name=Inventado' }, { failCatalogue: true }]) {
    const ui = await frontend(options);
    assert.equal(ui.elements.property.value, '');
    assert.equal(ui.elements['project-name'].textContent, 'Proyecto pendiente de identificación');
    ui.input('property', 4000); ui.input('rate', 4.5);
    ui.invoke('openLead()'); ui.advance(3000); await ui.submit();
    assert.ok(!Object.hasOwn(ui.posts[0], 'proyecto'));
    assert.equal(ui.posts[0].mortgage.propertyValueOrigin, 'visitor');
  }
});

test('changing a selected CMF scenario clears its rate and example never claims catalogue price provenance', async () => {
  const ui = await frontend({ slug: 'edificio-argomedo' });
  ui.elements['verified-scenario'].listeners.click();
  assert.equal(ui.elements.property.value, '4000');
  assert.equal(ui.elements.rate.value, '');
  assert.equal(ui.elements['project-name'].textContent, 'Edificio Argomedo');
  ui.invoke("selectOffer('itau-cmf-3000uf-20-20261009')");
  assert.equal(ui.elements.rate.value, '5.02');
  assert.equal(ui.elements['lead-open'].disabled, false);
  ui.input('down', 20);
  assert.equal(ui.elements.rate.value, '');
  assert.equal(ui.elements['lead-open'].disabled, true);
  ui.input('rate', 4.5);
  ui.invoke('openLead()'); ui.advance(3000); await ui.submit();
  assert.equal(ui.posts[0].mortgage.bankId, null);
  assert.equal(ui.posts[0].mortgage.propertyValueOrigin, 'visitor');
});

test('project geography constrains bank references even when property value or location control is edited', async () => {
  for (const slug of ['distrito-centro', 'inn-puerto-chico', 'edificio-suecia', 'lomas-de-puyai-3']) {
    const ui = await frontend({ slug });
    const project = catalogue.find(item => item.slug === slug);
    assert.equal(ui.elements['verified-scenario'].hidden, true);
    assert.equal(ui.elements.location.disabled, true);
    ui.input('property', 4000);
    ui.elements.down.value = '25';
    ui.elements.years.value = '20';
    ui.elements.location.value = 'santiago-metropolitana';
    ui.invoke('update()');
    ui.invoke("selectOffer('itau-cmf-3000uf-20-20261009')");
    assert.equal(ui.elements.rate.value, '');
    assert.equal(ui.elements['comparison-cards'].innerHTML, '');
    ui.input('rate', 4.5); ui.invoke('openLead()'); ui.advance(3000); await ui.submit();
    assert.equal(ui.posts[0].mortgage.bankId, null);
    assert.equal(ui.posts[0].mortgage.location, verifiedProjectLocation(project, new Date(NOW)));
  }
});

test('foreign query financial values are ignored and an expired catalogue price is removed before use', async () => {
  const ui = await frontend({ search: '?proyecto=distrito-centro&propertyUf=1&name=Inventado&rate=0' });
  assert.equal(ui.elements['project-name'].textContent, 'Distrito Centro');
  assert.equal(ui.elements.property.value, '2715');
  assert.equal(ui.elements.rate.value, '');
  ui.advance(31 * 86_400_000);
  ui.invoke('update()');
  assert.equal(ui.elements.property.value, '');
  assert.equal(ui.elements['lead-open'].disabled, true);
  assert.ok(ui.elements['project-price-origin'].textContent.includes('pendiente de verificación'));
});

test('commercial and land projects keep manual simulation but never acquire housing CMF offers', async () => {
  for (const slug of ['box-santiago', 'reserva-mayor-2']) {
    const ui = await frontend({ slug });
    const project = catalogue.find(item => item.slug === slug);
    assert.equal(ui.elements['project-asset-note'].hidden, false);
    assert.ok(ui.elements['project-asset-note'].textContent.includes(project.tipoActivo));
    assert.equal(ui.elements['verified-scenario'].hidden, true);
    ui.input('property', 4000);
    ui.elements.down.value = '25'; ui.elements.years.value = '20';
    ui.invoke('update()');
    ui.invoke("selectOffer('itau-cmf-3000uf-20-20261009')");
    assert.equal(ui.elements.rate.value, '');
    assert.equal(ui.elements['comparison-cards'].innerHTML, '');
    ui.input('rate', 4.5); ui.invoke('openLead()'); ui.advance(3000); await ui.submit();
    assert.equal(ui.posts[0].proyecto, slug);
    assert.equal(ui.posts[0].mortgage.bankId, null);
    assert.equal(ui.posts[0].mortgage.propertyValueOrigin, 'visitor');
  }
});

test('comparator prevents duplicate contact requests and preserves parameters and fields on errors', async () => {
  const ui = await frontend({ deferred: true });
  ui.input('rate', 4.5); ui.invoke('openLead()'); ui.advance(3000);
  const first = ui.submit();
  await ui.submit();
  assert.equal(ui.posts.length, 1);
  assert.equal(ui.elements['lead-submit'].disabled, true);
  ui.release(); await first;
  assert.equal(ui.elements['lead-form'].resets, undefined);
  assert.equal(ui.elements.nombre.value, 'Cliente Prueba');
  assert.equal(ui.elements.property.value, '2715');
  assert.equal(ui.elements.rate.value, '4.5');
  assert.equal(ui.elements['lead-submit'].disabled, false);
});

test('desktop/mobile navigation contains only required links and contact uses POST fallback', () => {
  const header = html.match(/<header[\s\S]*?<\/header>/)[0];
  assert.equal((header.match(/href="\/proyectos.html"/g) || []).length, 2);
  assert.equal((header.match(/>Asset Portafolio<\/a>/g) || []).length, 2);
  assert.ok(!header.includes('>Proyectos</a>'));
  assert.ok(!header.includes('>Hipotecario</a>'));
  assert.equal((header.match(/href="\/#expertise"/g) || []).length, 2);
  assert.equal((header.match(/href="\/contacto.html"/g) || []).length, 2);
  assert.match(html, /<form id="lead-form" method="post" action="\/api\/contact"/);
  assert.ok(header.includes('Agendar Asesoría'));
});
