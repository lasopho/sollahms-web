import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { projectP2CatalogueFile } from './p2-catalogue-scope.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(new URL('../' + path, import.meta.url));
const json = path => JSON.parse(read(path));
const html = read('proyectos.html').toString();
const catalogue = json('data/proyectos.json');
const manifest = json('data/brochures-leon.json');
const hash = value => createHash('sha256').update(value).digest('hex');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(value => value.includes("const grid = document.getElementById('project-grid')"));
const map = JSON.parse(script.match(/const coverVariants = ([\s\S]*?);\n    \/\/ CATALOG_COVERS_END/)[1]);
const walk = node => [node, ...node.children.flatMap(walk)];
const byClass = (node, name) => walk(node).filter(child => child.className?.split(/\s+/).includes(name));
class Element {
  constructor(tag = 'div', text = '', value = '') { this.tagName = tag; this.value = value; this.children = []; this.listeners = {}; this.attributes = {}; this.dataset = {}; this._text = text; this.hidden = false; this.disabled = true; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children = []; }
  get options() { return this.children; }
  get valueAsNumber() { return this.value.trim() === '' ? NaN : Number(this.value); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; this._text = ''; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
}
async function ui(data = catalogue, fail = false) {
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], new Element()]));
  const requests = [];
  elements['sort-order'].value = 'original';
  elements['catalog-filters'].reset = () => { for (const id of ['search', 'asset-type', 'region', 'commune', 'state', 'max-price']) elements[id].value = ''; };
  const context = vm.createContext({ document: { getElementById: id => elements[id], createElement: tag => new Element(tag) },
    Intl, Option: class extends Element { constructor(text, value) { super('option', text, value); } },
    fetch: async url => { requests.push(url); assert.equal(url, '/data/proyectos.json'); if (fail) throw new Error('Synthetic offline failure'); return { ok: true, json: async () => structuredClone(data) }; },
  });
  vm.runInContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  return { elements, requests, cards: elements['project-grid'].children };
}

test('P2 catalogue generation is reproducible and preserves all 134 source objects', () => {
  assert.equal(catalogue.length, 134);
  assert.equal(hash(read('data/proyectos.json')), 'f448bad2a9c36bf7b5249ecbb3ec343b5b4e916238b297a91fe9956057688aeb');
  const output = execFileSync('python3', ['-B', 'scripts/build-catalog-presentation.py', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(output), { projects: 134, responsiveCovers: 5, newAssets: 0, downloads: 0, check: true });
});

test('CAT-005 every priced and unpriced card gives its retained review date and qualified detail link', async () => {
  const { cards, requests } = await ui();
  assert.equal(cards.length, 134);
  assert.deepEqual(requests, ['/data/proyectos.json']);
  for (const card of cards) {
    const project = catalogue.find(p => p.slug === card.dataset.project);
    const notes = byClass(card, 'catalog-reference');
    assert.equal(notes.length, 1);
    assert.ok(notes[0].textContent.includes('Referencia revisada el ' + (project.commercialSource?.verifiedOn ?? project.verificacion.fecha) + '.'));
    assert.ok(notes[0].textContent.includes('Información referencial; confirma precio, disponibilidad y condiciones al cotizar.'));
    const link = notes[0].children.find(n => n.tagName === 'a');
    const featured = ['distrito-centro', 'inn-puerto-chico', 'edificio-suecia'].includes(project.slug);
    const target = featured ? 'contenido-principal' : 'proyecto';
    assert.equal(link.href, project.detalleUrl + '#' + target);
    const detailHtml = read(project.detalleUrl.slice(1)).toString();
    assert.ok(detailHtml.includes('id="' + target + '"'), project.slug + ': conditions link target must exist');
    if (featured) {
      assert.match(detailHtml, /<main id="contenido-principal"/);
      assert.match(detailHtml.match(/<main[\s\S]*?<\/main>/)[0], /price-commercial-note/);
    }
    assert.equal(link.attributes['aria-label'], 'Ver condiciones y pendientes de ' + project.nombre);
    if (project.precioDesdeUF === null) assert.doesNotMatch(card.textContent, /Desde UF \d/);
    else assert.ok(card.textContent.includes('Desde UF ' + new Intl.NumberFormat('es-CL').format(project.precioDesdeUF)));
  }
});

test('CAT-005 Sento and Nórdico retain units, discounts and exclusions without treating them as fresh offers', async () => {
  const { cards } = await ui();
  for (const project of catalogue.filter(p => p.inmobiliaria === 'Sento')) {
    const card = cards.find(c => c.dataset.project === project.slug);
    assert.ok(card.textContent.includes(project.commercialSource.note));
    assert.ok(card.textContent.includes(project.commercialSource.verifiedOn));
    if (project.precioDesdeUF !== null) assert.match(card.textContent, /Excluye estacionamiento y bodega; sujeto a disponibilidad/);
  }
  const nordico = cards.find(c => c.dataset.project === 'edificio-nordico');
  assert.match(nordico.textContent, /UF 4\.746 corresponde sólo a unidad 101, 1 dormitorio y 1 baño; excluye estacionamiento y bodega/);
  assert.match(cards.find(c => c.dataset.project === 'jofre-135').textContent, /100% vendido/);
  for (const slug of ['own', 'endemico']) {
    const card = cards.find(c => c.dataset.project === slug);
    if (card) assert.doesNotMatch(card.textContent, /Desde UF \d/);
  }
});

test('CAT-005 uncertain dates and changed quotes cannot inherit a fresh date or Nórdico unit condition', async () => {
  const sample = structuredClone(catalogue.find(p => p.slug === 'edificio-nordico'));
  sample.precioDesdeUF = 5000;
  sample.verificacion.fecha = null;
  const { cards } = await ui([sample]);
  assert.match(cards[0].textContent, /Fecha de revisión pendiente/);
  assert.doesNotMatch(cards[0].textContent, /unidad 101|4\.746/);
});

test('catalogue search, unknown-price filtering, ordering and reset still operate on current data', async () => {
  const { elements } = await ui();
  const grid = elements['project-grid'];
  elements.search.value = 'edificio-verne'; elements.search.listeners.input();
  assert.equal(grid.children.length, 1);
  assert.match(grid.children[0].textContent, /La oferta residencial vigente sigue sin confirmar/);
  elements['max-price'].value = '5000'; elements['max-price'].listeners.input();
  assert.equal(grid.children.length, 0);
  elements['clear-filters'].listeners.click();
  assert.equal(grid.children.length, 134);
  elements['sort-order'].value = 'price-asc'; elements['sort-order'].listeners.change();
  const prices = grid.children.map(c => catalogue.find(p => p.slug === c.dataset.project).precioDesdeUF);
  assert.deepEqual(prices.filter(p => p !== null), catalogue.map(p => p.precioDesdeUF).filter(p => p !== null).sort((a, b) => a - b));
  assert.ok(prices.slice(prices.findIndex(p => p === null)).every(p => p === null));
});

test('PERF-001 five cover source sets exactly match their own reviewed existing images and retain the original', () => {
  assert.equal(Object.keys(map).length, 5);
  for (const [slug, cover] of Object.entries(map)) {
    const row = manifest.projects.find(p => p.slug === slug);
    const project = catalogue.find(p => p.slug === slug);
    const image = row.images.find(i => i.localPath === project.imagenPrincipal);
    assert.equal(cover.localPath, image.localPath);
    assert.equal(cover.width, image.width); assert.equal(cover.height, image.height);
    const sources = [...new Map([...image.variants, image].map(a => [a.localPath, a])).values()].sort((a, b) => a.width - b.width);
    assert.deepEqual(cover.sources, sources.map(({ localPath, width, height }) => ({ localPath, width, height })));
    for (const source of sources) { const data = read(source.localPath.slice(1)); assert.equal(data.length, source.bytes); assert.equal(hash(data), source.sha256); }
  }
  const lautaro = manifest.projects.find(p => p.slug === 'condominio-parque-don-lautaro').images.find(a => a.localPath === map['condominio-parque-don-lautaro'].localPath);
  assert.equal(lautaro.bytes, 1297214);
  assert.equal(lautaro.variants.find(a => a.width === 480).bytes, 71136);
  assert.equal(lautaro.variants.find(a => a.width === 640).bytes, 127774);
});

test('PERF-001 responsive cards keep lazy loading, original src and detail access while other covers keep fallback behavior', async () => {
  const { cards } = await ui();
  let responsive = 0;
  for (const card of cards) {
    const project = catalogue.find(p => p.slug === card.dataset.project);
    const image = byClass(card, 'catalog-cover-image')[0];
    if (!image) { assert.equal(project.imagenPrincipal, null); continue; }
    assert.equal(image.src, project.imagenPrincipal); assert.equal(image.loading, 'lazy'); assert.equal(image.decoding, 'async');
    assert.ok(walk(card).some(n => n.href === project.detalleUrl));
    if (map[project.slug]) {
      responsive++;
      assert.equal(image.srcset, map[project.slug].sources.map(a => a.localPath + ' ' + a.width + 'w').join(', '));
      assert.match(image.sizes, /1280px\) 384px/);
      assert.equal(image.width, map[project.slug].width); assert.equal(image.height, map[project.slug].height);
    } else assert.equal(image.srcset, undefined);
    image.listeners.error();
    assert.equal(byClass(card, 'catalog-cover-placeholder').length, 1);
  }
  assert.equal(responsive, 5);
});

test('PERF-001 a changed project cover cannot borrow variants of the previous photograph', async () => {
  const project = structuredClone(catalogue.find(p => p.slug === 'bcome'));
  project.imagenPrincipal = '/assets/propiedades/catalogo/synthetic-new-cover.webp';
  const { cards } = await ui([project]);
  const image = byClass(cards[0], 'catalog-cover-image')[0];
  assert.equal(image.src, project.imagenPrincipal);
  assert.equal(image.srcset, undefined);
});

test('SEO-001 the initial HTML contains exactly the same 134 public identity links without commercial or private content', () => {
  const directory = html.match(/<details id="catalog-static-directory"[\s\S]*?<\/details>/)[0];
  assert.doesNotMatch(directory, /\bhidden\b|<script|<img|<iframe|\/assets\/|https:\/\/|Desde UF|sourceSha256|\.pdf/);
  assert.match(directory, /<summary>Explorar el listado de fichas de proyectos<\/summary>/);
  const links = [...directory.matchAll(/<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g)];
  assert.equal(links.length, 134);
  assert.deepEqual(links.map(m => m[1]), catalogue.map(p => p.detalleUrl));
  assert.equal(new Set(links.map(m => m[1])).size, 134);
  for (const [index, match] of links.entries()) assert.equal(match[2], catalogue[index].nombre.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;'));
  assert.match(html, /<noscript><p>Puedes explorar las fichas desde el listado siguiente/);
});

test('SEO-001 the static directory remains available after failed fetch and is hidden only after current cards render', async () => {
  const failed = await ui(catalogue, true);
  assert.equal(failed.elements['catalog-static-directory'].hidden, false);
  assert.equal(failed.cards.length, 0);
  assert.match(failed.elements['catalog-message'].textContent, /No pudimos cargar/);
  assert.equal(failed.elements['project-grid'].attributes['aria-busy'], 'false');
  const loaded = await ui();
  assert.equal(loaded.cards.length, 134);
  assert.equal(loaded.elements['catalog-static-directory'].hidden, true);
});

test('P2 exact test-only projection rejects lost identity notices, altered prices, links, srcsets and appended bytes', () => {
  const before = projectP2CatalogueFile('proyectos.html', Buffer.from(html));
  assert.deepEqual(projectP2CatalogueFile('proyectos.html', before), before);
  for (const [from, to] of [
    ['La oferta residencial vigente sigue sin confirmar.', 'Oferta disponible.'],
    ['Desde UF 4.746 corresponde sólo a unidad 101', 'Desde UF 4.000 corresponde a cualquier unidad'],
    ['<li><a href="/alto-buzeta.html">', '<li><a href="/wrong-project.html">'],
    ['foto-01-480.webp', 'foto-02-480.webp'],
  ]) {
    assert.ok(html.includes(from));
    assert.throws(() => projectP2CatalogueFile('proyectos.html', Buffer.from(html.replace(from, to))), /Unreviewed P2/);
  }
  assert.throws(() => projectP2CatalogueFile('proyectos.html', Buffer.from(html + '\n')), /Unreviewed P2/);
});

test('catalogue improvements preserve every publication control and do not convert protected León media into public rights', () => {
  assert.equal(manifest.protectedPreviewOnly, true);
  assert.equal(hash(read('scripts/package-vercel.mjs')), '9316cb44e5f11b4bb2d73c7f559a7d47baffd297c5ddc32b2a29663f54668bc8');
  assert.equal(hash(read('scripts/leon-combined-scope.mjs')), 'a818570a5932968c304bd0a0a341fc3751eeb7684ecee03aa8388358fd2b35e4');
  const packaging = read('scripts/package-vercel.mjs').toString();
  assert.match(packaging, /if\(!preview\)throw new Error\('The León update remains authorized for protected Preview only'\)/);
  assert.match(packaging, /sourceProjects\.map\(project => project\.slug \+ '\.html'\)/);
  const config = json('vercel.json');
  assert.ok(Object.values(config.git.deploymentEnabled).every(enabled => enabled === false));
});
