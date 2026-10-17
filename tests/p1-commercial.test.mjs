import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { projectP2File } from './p2-preservation.mjs';
import { projectP1CommercialFile, projectP1CommercialRows, P1_COMMERCIAL_BASELINE, P1_COMMERCIAL_FILES } from './p1-commercial-scope.mjs';
import { restoreLeonRows } from './leon-main-preservation.mjs';
import { restoreLeonRows as publicationRestoreLeonRows, assertLeonCombinedScope } from '../scripts/leon-combined-scope.mjs';
import { verifiedProjectPrice } from '../assets/js/project-finance.mjs';
import { createContactHandler } from '../api/contact.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = path => projectP2File(path, readFileSync(new URL('../' + path, import.meta.url)));
const before = path => execFileSync('git', ['show', P1_COMMERCIAL_BASELINE + ':' + path], { cwd: ROOT, maxBuffer: 8 * 1024 * 1024 });
const json = path => JSON.parse(read(path));
const catalogue = json('data/proyectos.json');
const research = json('data/fichas-proyectos.json');
const pending = ['mapocho-3521-edificio-a', 'froilan-roa-5731-torre-norte', 'froilan-roa-5731-torre-sur', 'edificio-verne'];
const notice = slug => slug === 'edificio-verne'
  ? 'La oferta residencial vigente sigue sin confirmar. Verne Oficinas se presenta por separado como alternativa comercial.'
  : 'La identidad comercial y la oferta vigente de esta etapa siguen sin confirmar. La información del conjunto se muestra por separado.';
const section = (html, id) => html.match(new RegExp('<section id="' + id + '"[^>]*>[\\s\\S]*?</section>'))?.[0];
const walk = element => [element, ...element.children.flatMap(walk)];

test('P1 Verne refreshes the complete official office quote while all 134 catalogue objects stay exact', () => {
  assert.equal(catalogue.length, 134);
  assert.equal(new Set(catalogue.map(row => row.slug)).size, 134);
  assert.deepEqual(read('data/proyectos.json'), before('data/proyectos.json'));
  assert.deepEqual(read('lib/project-context.mjs'), before('lib/project-context.mjs'));
  assert.deepEqual(read('sitemap.xml'), before('sitemap.xml'));
  const context = research.find(row => row.slug === 'edificio-verne').officialContext;
  assert.equal(context.sourceUrl, 'https://norte-verde.cl/proyecto/verne-oficinas/');
  assert.equal(context.checkedAt, '2026-10-17');
  assert.equal(context.scope, 'oficinas');
  const facts = Object.fromEntries(context.facts.map(row => [row.label, row.value]));
  assert.equal(facts['Precio de oficinas'], 'Desde UF 1.705 para Oficina 406, modelo 1O + 1B; confirmar stock y condiciones');
  assert.equal(facts['Modelo detallado 1O + 1B'], '1 privado y 1 baño; 21,00 m² útiles y 21,00 m² totales; terraza 0 m²');
  assert.match(facts['Condiciones del precio'], /no incluye promociones vigentes/);
  assert.match(facts['Condiciones del precio'], /reemplazan parte de ese descuento y no son acumulables/);
  assert.deepEqual(projectP1CommercialFile('data/fichas-proyectos.json', read('data/fichas-proyectos.json')), before('data/fichas-proyectos.json'));
  assert.deepEqual(projectP1CommercialFile('data/registro-fichas.json', read('data/registro-fichas.json')), before('data/registro-fichas.json'));
});

test('P1 four pending fiches disclose their status before the overview and preserve all other HTML bytes and actions', () => {
  for (const project of catalogue) {
    const path = project.slug + '.html';
    const actual = read(path);
    if (!pending.includes(project.slug)) {
      assert.deepEqual(actual, before(path), path);
      continue;
    }
    const html = actual.toString();
    const overview = section(html, 'proyecto');
    assert.equal((html.match(/class="pending-panel commercial-identity-notice" role="note"/g) ?? []).length, 1);
    assert.ok(overview.includes(notice(project.slug)), project.slug);
    assert.ok(overview.indexOf('commercial-identity-notice') < overview.indexOf('class="lead"'));
    assert.deepEqual(projectP1CommercialFile(path, actual), before(path));
    for (const target of ['contacto', 'agenda-asesoria', 'comparador-hipotecario']) {
      assert.ok(html.includes('/' + target + '.html?proyecto=' + project.slug));
    }
    assert.doesNotMatch(section(html, 'caracteristicas'), /UF 1\.705|21,00 m²/);
  }
  const verne = read('edificio-verne.html').toString();
  assert.match(section(verne, 'contexto-oficial'), /UF 1\.705 para Oficina 406/);
  assert.doesNotMatch(verne, /UF 1\.550|Oficina 202|23,19 m²/);
});

test('P1 exact file projections reject unrelated edits, partial quotes, lost notices and altered generator code', () => {
  assert.deepEqual(read('scripts/leon-combined-scope.mjs'), before('scripts/leon-combined-scope.mjs'));
  assert.throws(() => assertLeonCombinedScope(), /Other combined developer records changed: data\/fichas-proyectos.json/);
  for (const path of P1_COMMERCIAL_FILES) {
    const actual = read(path);
    const projected = projectP1CommercialFile(path, actual);
    assert.deepEqual(projected, before(path), path);
    assert.deepEqual(projectP1CommercialFile(path, projected), projected, path);
    assert.throws(() => projectP1CommercialFile(path, Buffer.concat([actual, Buffer.from('\n')])), /Unreviewed P1/);
  }
  for (const [path, find, replacement] of [
    ['edificio-verne.html', 'Oficina 406', 'Oficina 202'],
    ['edificio-verne.html', '21,00 m² útiles', '23,19 m² útiles'],
    ['proyectos.html', notice('edificio-verne'), 'Oferta residencial disponible'],
    ['scripts/build-project-details.py', 'identity_notice(slug) + overview_html', 'overview_html'],
  ]) {
    assert.ok(read(path).toString().includes(find));
    assert.throws(() => projectP1CommercialFile(path, Buffer.from(read(path).toString().replace(find, replacement))), /Unreviewed P1/);
  }
  for (const file of ['data/fichas-proyectos.json', 'data/registro-fichas.json']) {
    // Source correction does not grant permission to alter the release gate.
    assert.throws(() => publicationRestoreLeonRows(json(file), file), /outside its authorized successor scope/);
    assert.doesNotThrow(() => restoreLeonRows(json(file), file));
    const changed = json(file);
    changed.find(row => row.slug !== 'edificio-verne' && row.inmobiliaria !== 'León' && row.slug === 'mapocho-3521').nombre = 'Identidad no autorizada';
    assert.throws(() => restoreLeonRows(changed, file), /outside its authorized successor scope/);
    const partial = json(file);
    const verne = partial.find(row => row.slug === 'edificio-verne');
    if (file === 'data/fichas-proyectos.json') verne.officialContext.facts.find(item => item.label === 'Precio de oficinas').value = 'Desde UF 1.550';
    else verne.contextoOficial.fechaRevision = '2026-10-18';
    assert.throws(() => restoreLeonRows(partial, file), /outside its authorized successor scope/);
    assert.deepEqual(projectP1CommercialRows(projectP1CommercialRows(json(file), file), file), projectP1CommercialRows(json(file), file));
  }
});

test('P1 real fiche generator keeps the same four status notices and coherent office facts without touching other projects', () => {
  const script = `import json,sys,importlib.util
from pathlib import Path
from string import Template
root=Path.cwd();sys.path.insert(0,str(root/'scripts'))
spec=importlib.util.spec_from_file_location('details',root/'scripts/build-project-details.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
projects={p['slug']:p for p in json.loads((root/'data/proyectos.json').read_text())}
records={p['slug']:p for p in json.loads((root/'data/fichas-proyectos.json').read_text())}
print(json.dumps({slug:m.render(projects[slug],records[slug],Template((root/'templates/project-detail.html').read_text()))[0] for slug in sorted(m.PENDING_IDENTITIES)}))`;
  const generated = JSON.parse(execFileSync('python3', ['-c', script], { cwd: ROOT, maxBuffer: 1024 * 1024 }));
  assert.deepEqual(Object.keys(generated).sort(), [...pending].sort());
  for (const slug of pending) {
    assert.equal((generated[slug].match(/commercial-identity-notice/g) ?? []).length, 1);
    assert.ok(section(generated[slug], 'proyecto').includes(notice(slug)));
    assert.doesNotMatch(section(generated[slug], 'caracteristicas'), /UF 1\.705|21,00 m²/);
  }
  assert.match(section(generated['edificio-verne'], 'contexto-oficial'), /UF 1\.705 para Oficina 406/);
  assert.match(section(generated['edificio-verne'], 'contexto-oficial'), /21,00 m² útiles y 21,00 m² totales/);
});

class Element {
  constructor(tag = 'div', text = '', value = '') { this.tagName = tag; this.value = value; this.children = []; this.listeners = {}; this.attributes = {}; this.dataset = {}; this._text = text; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children = []; }
  get options() { return this.children; }
  get valueAsNumber() { return this.value.trim() === '' ? NaN : Number(this.value); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; this._text = ''; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
}
async function catalogueUI() {
  const html = read('proyectos.html').toString();
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(value => value.includes("const grid = document.getElementById('project-grid')"));
  assert.ok(script);
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Element()]));
  const requests = [];
  elements['sort-order'].value = 'original';
  elements['catalog-filters'].reset = () => { for (const id of ['search', 'asset-type', 'region', 'commune', 'state', 'max-price']) elements[id].value = ''; };
  const context = vm.createContext({ document: { getElementById: id => elements[id], createElement: tag => new Element(tag) },
    Intl, Option: class extends Element { constructor(text, value) { super('option', text, value); } },
    fetch: async url => { requests.push(url); assert.equal(url, '/data/proyectos.json'); return { ok: true, json: async () => structuredClone(catalogue) }; },
  });
  vm.runInContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  return { elements, requests };
}

test('P1 live catalogue renders exactly four clear status notices and preserves search, price filtering and detail links', async () => {
  const { elements, requests } = await catalogueUI();
  const grid = elements['project-grid'];
  assert.equal(grid.children.length, 134);
  assert.deepEqual(requests, ['/data/proyectos.json']);
  for (const card of grid.children) {
    const notices = walk(card).filter(node => node.className?.split(/\s+/).includes('commercial-identity-notice'));
    assert.equal(notices.length, pending.includes(card.dataset.project) ? 1 : 0);
    if (notices.length) { assert.equal(notices[0].textContent, notice(card.dataset.project)); assert.equal(notices[0].attributes.role, 'note'); }
    assert.ok(walk(card).some(node => node.href === '/' + card.dataset.project + '.html'));
  }
  elements.search.value = 'edificio-verne'; elements.search.listeners.input();
  assert.equal(grid.children.length, 1); assert.equal(grid.children[0].dataset.project, 'edificio-verne');
  assert.match(grid.children[0].textContent, /La oferta residencial vigente sigue sin confirmar/);
  assert.doesNotMatch(grid.children[0].textContent, /UF 1\.705/);
  elements['max-price'].value = '5000'; elements['max-price'].listeners.input();
  assert.equal(grid.children.length, 0);
  elements['clear-filters'].listeners.click();
  assert.equal(grid.children.length, 134);
});

test('P1 unconfirmed residential identities cannot use either the old or the new office price as a verified project offer', () => {
  for (const slug of pending) {
    const project = catalogue.find(row => row.slug === slug);
    const record = research.find(row => row.slug === slug);
    assert.equal(project.precioDesdeUF, null);
    assert.equal(project.direccion, null);
    assert.deepEqual(project.tipologias, []);
    assert.deepEqual(record.images, []);
    for (const price of [1550, 1705]) {
      assert.equal(verifiedProjectPrice({ ...project, officialContext: { ...record.officialContext, precioDesdeUF: price } }, '2026-10-17'), null);
    }
  }
});

test('P1 simulated contact rejects office-derived residential mortgage values before reading credentials or sending messages', async () => {
  const now = Date.parse('2026-10-17T15:00:00Z');
  let providerCalls = 0, credentialReads = 0;
  const handler = createContactHandler({ projectDataset: catalogue, mortgageDataset: json('data/hipotecario.json'), now: () => now,
    getEnvironment: () => 'test', getApiKey: () => { credentialReads++; return 'synthetic'; },
    fetchImpl: async () => { providerCalls++; throw new Error('No provider call authorized by this simulation'); } });
  for (const slug of pending) for (const price of [1550, 1705]) {
    const response = await handler.fetch(new Request('https://commercial-p1.test.invalid/api/contact', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://commercial-p1.test.invalid' },
      body: JSON.stringify({ nombre: 'Prueba sintética', correo: 'qa@commercial-p1.test.invalid', telefono: '+56900000000',
        mensaje: 'Simulación aislada sin envío.', proyecto: slug, website: '', consent: true, startedAt: now - 5000,
        mortgage: { propertyUf: price, downPaymentPercent: 20, years: 20, annualRatePercent: 4.5, rateConvention: 'effective', bankId: null,
          simulatedAt: new Date(now - 1000).toISOString(), location: 'unknown', propertyValueOrigin: 'catalogue' } }),
    }));
    assert.equal(response.status, 400, slug + ': ' + price);
  }
  assert.equal(providerCalls, 0); assert.equal(credentialReads, 0);
});
