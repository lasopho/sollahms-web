import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import catalogue from '../data/proyectos.json' with { type: 'json' };
import publishedDataset from '../data/hipotecario.json' with { type: 'json' };
import { evaluateProject, validateCapacityInput, CAPACITY_LIMITS } from '../assets/js/purchase-capacity.mjs';
import { ufToClp } from '../assets/js/mortgage-engine.mjs';
import { validateDataset, getUfStatus } from '../assets/js/mortgage-data.mjs';
import { parseClpAmount, formatClpAmount } from '../assets/js/clp-input.mjs';
import { chileDate } from '../assets/js/project-finance.mjs';
import { writeMortgageHandoff, consumeMortgageHandoff, MORTGAGE_HANDOFF_KEY } from '../assets/js/mortgage-handoff.mjs';

const NOW = Date.parse('2026-10-10T15:00:00Z');
const html = await readFile(new URL('../proyectos.html', import.meta.url), 'utf8');
const script = (await readFile(new URL('../assets/js/purchase-capacity-ui.mjs', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replace('export function initializeCapacitySearch', 'function initializeCapacitySearch');
const fixture = { slug: 'synthetic-property', nombre: 'Proyecto de prueba', precioDesdeUF: 4000,
  verificacion: { fecha: '2026-10-10', fuente: 'https://maestra.cl/proyectos/distrito-centro/', estadoFuente: 'verified', camposVerificados: ['precioDesdeUF'] },
};
const settle = () => new Promise(resolve => setImmediate(resolve));
function storageFixture() {
  const values = new Map(), writes = [];
  return { values, writes, getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); writes.push({ key, value }); },
    removeItem: key => values.delete(key) };
}
class Element {
  constructor(tag = 'div', id = '', value = '') {
    this.tagName = tag.toUpperCase(); this.id = id; this.value = value; this.defaultValue = value;
    this.children = []; this.listeners = {}; this.attributes = {}; this.className = '';
    this.hidden = false; this.disabled = false; this.required = false; this._text = '';
    this.type = 'text'; this.validationMessage = ''; this.selectionStart = 0; this.selectionEnd = 0; this.dataset = {};
  }
  get value() { return this._value; }
  set value(value) { this._value = String(value); }
  get valueAsNumber() { return this.type === 'text' || this.value.trim() === '' ? NaN : Number(this.value); }
  setCustomValidity(message) { this.validationMessage = String(message); }
  checkValidity() { return !this.validationMessage; }
  reportValidity() { return this.checkValidity(); }
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
  select() { this.setSelectionRange(0, this.value.length); }
  get textContent() { return this._text + this.children.map(child => child.textContent ?? String(child)).join(''); }
  set textContent(value) { this._text = String(value); this.children = []; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this._text = ''; this.children = children; }
  insertBefore(child, reference) { const i = this.children.indexOf(reference); if (i < 0) throw new Error('Reference element absent'); this.children.splice(i, 0, child); }
  querySelector(selector) {
    const matches = child => selector.startsWith('.') ? child.className.split(/\s+/).includes(selector.slice(1)) : child.tagName.toLowerCase() === selector;
    for (const child of this.children) { if (matches(child)) return child; const nested = child.querySelector?.(selector); if (nested) return nested; }
    return null;
  }
  focus() { this.focused = true; }
  scrollIntoView(options) { this.scrolled = options; }
}
function event() { return { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }; }
function response(data = publishedDataset, ok = true) { return { ok, json: async () => data }; }

async function frontend({ projects = catalogue, responses = [response()], defer = false, storage = storageFixture() } = {}) {
  let now = NOW;
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const ids = [...html.matchAll(/\bid="(capacity-[^"]+)"/g)].map(match => match[1]);
  const elements = Object.fromEntries(ids.map(id => [id, new Element('div', id)]));
  const defaults = { income: '', complement: 'no', second: '', debt: '', savings: '', monthly: '',
    horizon: '0', 'horizon-custom': '', pie: '20', 'pie-custom': '', years: '25', 'years-custom': '', rate: '', convention: 'effective', criterion: '25' };
  for (const [key, value] of Object.entries(defaults)) {
    const element = elements['capacity-' + key]; element.value = value; element.defaultValue = value;
    const tag = html.match(new RegExp('<(?:input|select)[^>]*id="capacity-' + key + '"[^>]*>'))?.[0] ?? '';
    element.type = tag.match(/\btype="([^"]+)"/)?.[1] ?? 'select';
  }
  elements['capacity-toggle'].setAttribute('aria-expanded', 'false');
  elements['capacity-form'].hidden = true;
  elements['capacity-form'].reset = () => { for (const key of Object.keys(defaults)) elements['capacity-' + key].value = defaults[key]; };
  elements['capacity-form'].checkValidity = () => Object.values(elements).filter(element => element !== elements['capacity-form']).every(element => element.checkValidity());
  elements['capacity-form'].reportValidity = () => elements['capacity-form'].checkValidity();
  let changeCount = 0, release;
  const requests = [];
  const context = vm.createContext({
    document: { getElementById: id => elements[id], createElement: tag => new Element(tag) },
    Date: Clock, Intl, sessionStorage: storage, MORTGAGE_HANDOFF_KEY,
    matchMedia: () => ({ matches: true }),
    validateDataset, validateCapacityInput, CAPACITY_LIMITS, parseClpAmount, formatClpAmount, ufToClp,
    chileDate: instant => chileDate(instant ?? new Clock()),
    getUfStatus: (uf, instant) => getUfStatus(uf, instant ?? new Clock()),
    evaluateProject: (project, input, dataset, instant) => evaluateProject(project, input, dataset, instant ?? new Clock()),
    writeMortgageHandoff: value => writeMortgageHandoff(value, { storage, now }),
    fetch: async (url, options = {}) => {
      assert.equal(url, '/data/hipotecario.json'); assert.equal(options.cache, 'no-store');
      assert.ok(!options.method || options.method === 'GET'); assert.equal(options.body, undefined);
      requests.push({ url, options });
      if (defer && requests.length === 1) await new Promise(resolve => { release = resolve; });
      const next = responses[Math.min(requests.length - 1, responses.length - 1)];
      if (next instanceof Error) throw next;
      return next;
    },
  });
  Object.defineProperty(context, 'localStorage', { get() { throw new Error('Financial search must not use persistent storage'); } });
  vm.runInContext(script, context);
  context.options = { projects, onChange: () => { changeCount++; } };
  const search = vm.runInContext('initializeCapacitySearch(options)', context);
  await settle();
  const field = key => elements['capacity-' + key];
  const set = values => { for (const [key, value] of Object.entries(values)) field(key).value = value; };
  const change = (values, kind = 'input') => {
    set(values);
    for (const key of Object.keys(values)) field(key).listeners[kind]?.({ target: field(key) });
    field('form').listeners[kind]({ target: field(Object.keys(values)[0]) });
  };
  const submit = () => field('form').listeners.submit(event());
  const card = project => {
    const article = new Element('article'); const body = new Element('div'); body.className = 'catalog-card-body';
    const actions = new Element('div'); actions.className = 'catalog-actions'; body.append(actions); article.append(body);
    search.decorateCard(article, project); return article;
  };
  return { elements, field, set, change, submit, search, card, requests, storage,
    changeCount: () => changeCount, release: () => release?.(),
    advance: milliseconds => { now += milliseconds; },
    reset: () => field('reset').listeners.click(event()),
    focus: key => field(key).listeners.focus?.({ target: field(key) }),
    blur: key => field(key).listeners.blur?.({ target: field(key) }),
    toggle: () => field('toggle').listeners.click(event()),
  };
}
const valid = { income: 3500000, savings: 32908992, years: '20', rate: '4.5' };

// These tests exercise the actual closure/rendering and real financial helpers.
// The fake DOM models events and output, not viewport layout or browser validity.
test('optional search leaves all148 catalogue projects and storage untouched until submission, with exact dated UF', async () => {
  const ui = await frontend();
  assert.equal(ui.field('form').hidden, true);
  assert.equal(ui.changeCount(), 0);
  assert.equal(ui.search.sortProjects([...catalogue]).length, 148);
  assert.equal(ui.card(catalogue[0]).querySelector('.capacity-result'), null);
  assert.match(ui.field('uf').textContent, /41\.136,24/);
  assert.match(ui.field('uf').textContent, /2026-10-10/);
  assert.equal(ui.storage.values.size, 0);
  assert.equal(ui.requests.length, 1);
  ui.toggle(); assert.equal(ui.field('form').hidden, false); assert.equal(ui.field('income').focused, true);
});

test('no rate retains148 E results, including115 known prices and33 missing prices, without fake dividends', async () => {
  const ui = await frontend(); ui.set({ ...valid, rate: '' }); await ui.submit();
  assert.match(ui.field('summary').textContent, /Evaluación de 148 proyectos/);
  assert.match(ui.field('summary').textContent, /E: 148/);
  const sorted = ui.search.sortProjects([...catalogue]); assert.equal(sorted.length, 148);
  let priceCount = 0;
  for (const project of sorted) {
    const article = ui.card(project);
    assert.match(article.querySelector('.capacity-badge').textContent, /^E\./);
    const text = article.textContent;
    if (text.includes('Precio desde verificado')) priceCount++;
    assert.ok(!text.includes('Dividendo financiero'));
    assert.equal(article.querySelector('a').href, '/comparador-hipotecario.html?proyecto=' + project.slug);
  }
  assert.equal(priceCount, 115);
  assert.equal(ui.storage.writes.length, 0);
});

test('actual UI inputs and metrics classify A/B/C/D, with stable compatibility ordering', async () => {
  const pending = { ...fixture, slug: 'missing-price', precioDesdeUF: null };
  const cheap = { ...fixture, slug: 'cheap-property', precioDesdeUF: 2000 };
  const expensive = { ...fixture, slug: 'expensive-property', precioDesdeUF: 8000 };
  const projects = [pending, expensive, fixture, cheap];
  const ui = await frontend({ projects });
  for (const [values, expected] of [[valid, 'A'], [{ ...valid, savings: 16454496 }, 'B'], [{ ...valid, income: 2500000 }, 'C'], [{ ...valid, income: 2500000, savings: 16454496 }, 'D']]) {
    ui.change(values); await ui.submit();
    const article = ui.card(fixture);
    assert.match(article.querySelector('.capacity-badge').textContent, new RegExp('^' + expected + '\\.'));
    assert.match(article.textContent, /20,09 UF/); assert.match(article.textContent, /826\.397/);
    assert.match(article.textContent, /Facilidades de pago del pie: pendientes de verificación/);
    assert.match(article.textContent, /Dividendo \+ deudas \/ renta/);
    const categories = ui.search.sortProjects([...projects]).map(project => ui.card(project).querySelector('.capacity-badge').textContent[0]);
    assert.deepEqual(categories, [...categories].sort());
  }
});

test('zero rate and custom periods are accepted; invalid custom periods recover without evaluating', async () => {
  const ui = await frontend({ projects: [fixture] });
  ui.change({ ...valid, rate: 0, years: 'custom', 'years-custom': 7, horizon: 'custom', 'horizon-custom': 6, pie: 'custom', 'pie-custom': 15 });
  assert.equal(ui.field('years-custom').required, true); assert.equal(ui.field('years-custom').disabled, false);
  assert.equal(ui.field('horizon-wrap').hidden, false); await ui.submit();
  assert.match(ui.card(fixture).textContent, /Pie necesario \(15%\)/);
  assert.match(ui.card(fixture).textContent, /40,48 UF/); // 3.400 UF divided by84 months, zero interest.
  ui.change({ 'years-custom': 7.5 }); await ui.submit();
  assert.match(ui.field('error').textContent, /Plazo hipotecario/);
  assert.equal(ui.field('submit').disabled, false);
  assert.equal(ui.card(fixture).querySelector('.capacity-result'), null);
});

test('complement, CLP savings, horizon and debts use actual inputs and clear hidden second income', async () => {
  const ui = await frontend({ projects: [fixture] });
  ui.change({ ...valid, income: 2500000, complement: 'yes', second: 1000000, savings: 32908992 });
  assert.equal(ui.field('second-wrap').hidden, false); assert.equal(ui.field('second').required, true);
  assert.equal(ui.elements['capacity-currency'], undefined); await ui.submit();
  assert.match(ui.card(fixture).querySelector('.capacity-badge').textContent, /^A\./);
  ui.change({ complement: 'no' }, 'change');
  assert.equal(ui.field('second').value, ''); assert.equal(ui.field('second').disabled, true); await ui.submit();
  assert.match(ui.card(fixture).querySelector('.capacity-badge').textContent, /^C\./);
  ui.change({ income: 3500000, debt: 200000 }); await ui.submit();
  assert.match(ui.card(fixture).textContent, /675\.000/);
  assert.match(ui.card(fixture).querySelector('.capacity-badge').textContent, /^C\./);
});

test('unavailable or malformed dataset keeps ordinary catalogue available and retries safely', async () => {
  for (const first of [new Error('Synthetic offline'), response(null), response({ schemaVersion: 1 }), response({}, false), { ok: true, json: async () => { throw new SyntaxError('Synthetic JSON failure'); } }]) {
    const ui = await frontend({ projects: [fixture], responses: [first, response()] });
    assert.match(ui.field('uf').textContent, /Puedes navegar el catálogo normalmente/);
    assert.equal(ui.search.sortProjects([fixture]).length, 1);
    assert.equal(ui.card(fixture).querySelector('.capacity-result'), null);
    ui.set(valid); await ui.submit();
    assert.equal(ui.requests.length, 2); assert.equal(ui.field('submit').disabled, false);
    assert.match(ui.card(fixture).querySelector('.capacity-badge').textContent, /^A\./);
  }
});

test('stale or absent UF yields E and no peso dividend while mortgage UF remains explicit', async () => {
  const stale = structuredClone(publishedDataset); stale.uf.date = '2026-10-09';
  const ui = await frontend({ projects: [fixture], responses: [response(stale)] });
  ui.set(valid); await ui.submit();
  const article = ui.card(fixture);
  assert.match(article.querySelector('.capacity-badge').textContent, /^E\./);
  assert.match(article.textContent, /20,09 UF/); assert.ok(!article.textContent.includes('$'));
  assert.ok(!article.textContent.includes('Dividendo / renta'));
  assert.match(ui.field('uf').textContent, /No tenemos una UF oficial vigente/);
  const absent = structuredClone(publishedDataset); delete absent.uf;
  const invalid = await frontend({ projects: [fixture], responses: [response(absent), response(absent)] });
  invalid.set(valid); await invalid.submit();
  assert.match(invalid.field('error').textContent, /referencia financiera necesita verificación/);
  assert.equal(invalid.card(fixture).querySelector('.capacity-result'), null);
});

test('reset during delayed UF fetch cancels late evaluation and removes only simulator handoff', async () => {
  const storage = storageFixture(); storage.setItem(MORTGAGE_HANDOFF_KEY, 'synthetic previous handoff'); storage.setItem('unrelated-key', 'keep');
  const ui = await frontend({ projects: [fixture], defer: true, storage });
  ui.toggle(); ui.set(valid); const pending = ui.submit();
  assert.equal(ui.field('submit').disabled, true); await ui.submit(); assert.equal(ui.requests.length, 1);
  ui.reset(); assert.equal(ui.field('form').hidden, true);
  assert.equal(storage.getItem(MORTGAGE_HANDOFF_KEY), null); assert.equal(storage.getItem('unrelated-key'), 'keep');
  ui.release(); await pending; await settle();
  assert.equal(ui.field('summary').textContent, ''); assert.equal(ui.field('income').value, '');
  assert.equal(ui.card(fixture).querySelector('.capacity-result'), null); assert.equal(ui.field('submit').disabled, false);
});

test('input and select changes during delayed fetch prevent applying stale captured parameters', async () => {
  for (const kind of ['input', 'change']) {
    const ui = await frontend({ projects: [fixture], defer: true }); ui.set(valid); const pending = ui.submit();
    ui.change({ income: 2500000 }, kind); ui.release(); await pending;
    assert.equal(ui.field('summary').textContent, ''); assert.equal(ui.card(fixture).querySelector('.capacity-result'), null);
    await ui.submit(); assert.match(ui.card(fixture).querySelector('.capacity-badge').textContent, /^C\./);
    assert.equal(ui.requests.length, 1);
  }
});

test('explicit CTA handoff stores only scenario once; income, debts, savings and identity never leave closure', async () => {
  const ui = await frontend({ projects: [fixture] });
  ui.set({ ...valid, income: 4500000, debt: 100000, savings: 49363488, monthly: 400000, horizon: 12 }); await ui.submit();
  const anchor = ui.card(fixture).querySelector('a');
  assert.equal(anchor.href, '/comparador-hipotecario.html?proyecto=synthetic-property');
  const click = event(); anchor.listeners.click(click); assert.equal(click.defaultPrevented, false);
  assert.equal(ui.storage.writes.length, 1);
  const record = JSON.parse(ui.storage.getItem(MORTGAGE_HANDOFF_KEY));
  assert.deepEqual(Object.keys(record.scenario).sort(), ['projectSlug', 'propertyUf', 'downPaymentPercent', 'years', 'annualRatePercent', 'rateConvention', 'propertyValueOrigin'].sort());
  for (const secret of ['income', 'debt', 'savings', 'monthly', 'renta', 'ahorro', 'deudas', 'nombre', 'correo', 'telefono', 'rut']) assert.ok(!Object.keys(record.scenario).some(key => key.toLowerCase().includes(secret)));
  assert.equal(record.scenario.propertyUf, 4000); assert.equal(record.scenario.annualRatePercent, 4.5);
  assert.equal(ui.requests.length, 1); assert.equal(ui.requests[0].options.body, undefined);
  const consumed = consumeMortgageHandoff(fixture.slug, { storage: ui.storage, now: NOW + 1 });
  assert.equal(consumed.projectSlug, fixture.slug); assert.equal(ui.storage.values.size, 0);
  ui.reset(); assert.equal(ui.field('income').value, ''); assert.equal(ui.field('debt').value, ''); assert.equal(ui.field('savings').value, '');
});

test('opening E without a rate clears any older scenario before ordinary simulator navigation', async () => {
  const ui = await frontend({ projects: [fixture] });
  ui.storage.setItem(MORTGAGE_HANDOFF_KEY, 'synthetic previous scenario');
  ui.set({ ...valid, rate: '' }); await ui.submit();
  const anchor = ui.card(fixture).querySelector('a'), click = event(); anchor.listeners.click(click);
  assert.equal(click.defaultPrevented, false); assert.equal(ui.storage.getItem(MORTGAGE_HANDOFF_KEY), null);
});

test('blocked session storage reports transfer failure without leaking private financial inputs', async () => {
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  const ui = await frontend({ projects: [fixture], storage: blocked }); ui.set(valid); await ui.submit();
  const click = event(); ui.card(fixture).querySelector('a').listeners.click(click);
  assert.equal(click.defaultPrevented, true); assert.match(ui.field('error').textContent, /conservar el escenario/);
  assert.equal(ui.requests.length, 1); assert.equal(ui.requests[0].options.body, undefined);
});

test('date refresh recomputes compatibility as E instead of reusing yesterday conversion', async () => {
  const ui = await frontend({ projects: [fixture] }); ui.set(valid); await ui.submit();
  assert.match(ui.card(fixture).querySelector('.capacity-badge').textContent, /^A\./);
  ui.advance(24 * 60 * 60 * 1000); ui.search.sortProjects([fixture]);
  const article = ui.card(fixture);
  assert.match(article.querySelector('.capacity-badge').textContent, /^E\./);
  assert.ok(!article.textContent.includes('$')); assert.match(ui.field('uf').textContent, /No tenemos una UF oficial vigente/);
});


function metricText(article, label) {
  const row = article.querySelector('.capacity-metrics')?.children.find(row => row.children[0].textContent === label);
  return row?.children[1].textContent;
}

test('savings controls are optional CLP text fields, with no currency selector or UF entry', () => {
  assert.ok(!html.includes('id="capacity-currency"'));
  for (const id of ['savings', 'monthly']) {
    const inputTag = html.match(new RegExp('<input[^>]*id="capacity-' + id + '"[^>]*>'))?.[0];
    assert.ok(inputTag, 'Missing savings input');
    assert.match(inputTag, /type="text"/);
    assert.ok(!/\brequired(?:\s|>|=)/.test(inputTag));
    assert.match(inputTag, /inputmode="numeric"/);
  }
});

test('empty current and monthly savings behave as zero and keep all categories available', async () => {
  const ui = await frontend({ projects: [fixture] });
  ui.set({ ...valid, savings: '', monthly: '' }); await ui.submit();
  const article = ui.card(fixture);
  assert.match(article.querySelector('.capacity-badge').textContent, /^B\./);
  assert.match(metricText(article, 'Ahorro actual'), /\$0/); assert.match(metricText(article, 'Ahorro actual'), /0 UF/);
  assert.match(metricText(article, 'Ahorro a 0 meses'), /\$0/); assert.match(metricText(article, 'Ahorro a 0 meses'), /0 UF/);
  assert.equal(metricText(article, 'Tiempo desde el ahorro actual'), 'No calculable sin ahorro mensual');
  assert.equal(ui.field('savings').value, ''); assert.equal(ui.field('monthly').value, '');
  assert.equal(ui.field('submit').disabled, false);
});

test('5m,20m and100m CLP raw, grouped and currency formats preserve exact savings conversion', async () => {
  for (const [amount, grouped, category] of [[5_000_000, '5.000.000', 'B'], [20_000_000, '20.000.000', 'B'], [100_000_000, '100.000.000', 'A']]) {
    for (const value of [String(amount), grouped, '$' + grouped, '$ ' + grouped]) {
      const ui = await frontend({ projects: [fixture] });
      ui.change({ ...valid, savings: value, monthly: '' });
      ui.blur('savings'); assert.equal(ui.field('savings').value, '$' + grouped);
      assert.equal(ui.field('savings').validationMessage, '');
      await ui.submit(); const article = ui.card(fixture);
      assert.match(article.querySelector('.capacity-badge').textContent, new RegExp('^' + category + '\\.'));
      const expected = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(amount / publishedDataset.uf.valueClp) + ' UF';
      assert.ok(metricText(article, 'Ahorro actual').includes(expected));
      assert.ok(metricText(article, 'Ahorro actual').includes('$' + grouped));
      assert.ok(metricText(article, 'Ahorro a 0 meses').includes(expected));
      assert.ok(metricText(article, 'Ahorro a 0 meses').includes('$' + grouped));
      assert.equal(ui.storage.writes.length, 0); assert.equal(ui.requests.length, 1);
    }
  }
});

test('formatted monthly savings preserves horizon and integer months, with current savings independently optional', async () => {
  const ui = await frontend({ projects: [fixture] });
  ui.change({ ...valid, savings: '$20.000.000', monthly: '$5.000.000', horizon: '6' });
  ui.blur('monthly'); assert.equal(ui.field('monthly').value, '$5.000.000'); await ui.submit();
  let article = ui.card(fixture);
  assert.match(article.querySelector('.capacity-badge').textContent, /^A\./);
  assert.equal(metricText(article, 'Tiempo desde el ahorro actual'), '3 meses');
  assert.match(metricText(article, 'Falta para el pie al horizonte'), /\$0/); assert.match(metricText(article, 'Falta para el pie al horizonte'), /0 UF/);
  ui.change({ savings: '', monthly: '$5.000.000' }); await ui.submit();
  article = ui.card(fixture);
  assert.match(article.querySelector('.capacity-badge').textContent, /^B\./);
  assert.equal(metricText(article, 'Tiempo desde el ahorro actual'), '7 meses');
  ui.change({ horizon: '12' }); await ui.submit();
  assert.match(ui.card(fixture).querySelector('.capacity-badge').textContent, /^A\./);
  for (const [amount, grouped, expectedCategory, months] of [[5_000_000, '5.000.000', 'B', 7], [20_000_000, '20.000.000', 'A', 2], [100_000_000, '100.000.000', 'A', 1]]) {
    for (const value of [String(amount), grouped, '$' + grouped]) {
      ui.change({ income: 1_000_000_000, savings: '', monthly: value, horizon: '6' });
      ui.blur('monthly'); assert.equal(ui.field('monthly').value, '$' + grouped); await ui.submit();
      const result = ui.card(fixture);
      assert.ok(result.querySelector('.capacity-badge').textContent.startsWith(expectedCategory + '.'));
      const expectedCash = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount * 6);
      assert.ok(metricText(result, 'Ahorro a 6 meses').includes(expectedCash));
      assert.equal(metricText(result, 'Tiempo desde el ahorro actual'), months + ' meses');
    }
  }
});

test('focus permits digit editing, blur reformats, input errors clear, and reset clears custom validity', async () => {
  const ui = await frontend({ projects: [fixture] });
  ui.change({ ...valid, savings: '$5.000.000' }); ui.blur('savings'); ui.focus('savings');
  assert.equal(ui.field('savings').value, '5000000');
  ui.change({ savings: '-5000000' }); ui.blur('savings');
  assert.ok(ui.field('savings').validationMessage); assert.equal(ui.field('savings').value, '-5000000');
  ui.change({ savings: '20000000' }); assert.equal(ui.field('savings').validationMessage, '');
  ui.blur('savings'); assert.equal(ui.field('savings').value, '$20.000.000');
  ui.change({ monthly: '5,5' }); ui.blur('monthly'); assert.ok(ui.field('monthly').validationMessage);
  ui.reset(); assert.equal(ui.field('monthly').validationMessage, ''); assert.equal(ui.field('savings').validationMessage, '');
  assert.equal(ui.field('monthly').value, ''); assert.equal(ui.field('savings').value, '');
  assert.equal(ui.field('form').hidden, true);
});

test('invalid,negative,decimal,exponent,UF and excessive CLP savings are rejected without coercion', async () => {
  const invalid = ['-5000000', '$-5.000.000', '5.000.000,00', '5,5', '1.5', '5e6', '5M', '100 UF', '5.00.000', 'NaN', 'Infinity', '1000000000001', '9007199254740993'];
  for (const key of ['savings', 'monthly']) {
    for (const value of [...invalid, ...(key === 'monthly' ? ['10000000001'] : [])]) {
      const ui = await frontend({ projects: [fixture] });
      ui.change({ ...valid, [key]: value }); ui.blur(key);
      assert.ok(ui.field(key).validationMessage, key + ': ' + value);
      assert.equal(ui.field(key).value, value);
      await ui.submit();
      assert.equal(ui.card(fixture).querySelector('.capacity-result'), null);
      assert.ok(ui.field('error').textContent || ui.field(key).validationMessage);
      assert.equal(ui.field('submit').disabled, false);
      assert.equal(ui.storage.writes.length, 0); assert.equal(ui.requests.length, 1);
    }
  }
});

test('stale UF cannot turn formatted peso savings into a current UF value or a compatible category', async () => {
  const stale = structuredClone(publishedDataset); stale.uf.date = '2026-10-09';
  const ui = await frontend({ projects: [fixture], responses: [response(stale)] });
  ui.change({ ...valid, savings: '$100.000.000', monthly: '$5.000.000', horizon: '12' }); await ui.submit();
  const article = ui.card(fixture);
  assert.match(article.querySelector('.capacity-badge').textContent, /^E\./);
  assert.equal(metricText(article, 'Ahorro actual'), undefined);
  assert.equal(metricText(article, 'Ahorro a 12 meses'), undefined);
  assert.equal(metricText(article, 'Dividendo / renta'), undefined);
  assert.equal(metricText(article, 'Dividendo financiero'), '20,09 UF');
  assert.match(ui.field('uf').textContent, /No tenemos una UF oficial vigente/);
});
