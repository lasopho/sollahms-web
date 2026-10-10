import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import { verifiedProjectPrice } from '../assets/js/project-finance.mjs';
import { evaluateProject } from '../assets/js/purchase-capacity.mjs';
import { createContactHandler } from '../api/contact.mjs';
import { projects as trustedContexts } from '../lib/project-context.mjs';
import { assertCommercialBytes, commercialPage } from './commercial-html.mjs';

// This is the scoped successor to the historical integrity audits, whose
// baselines predate the explicitly approved official-source additions.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BASELINE = 'a279744';
const PRESENTATION_BASELINE = '7a2732ae333b6a4d119cc2b651583daacbab8755';
const NOW = Date.parse('2026-10-10T15:00:00Z');
const DATE = '2026-10-10';
const FOCUS = new Set(['mapocho-3521', 'mapocho-3521-edificio-a',
  'froilan-roa-5731-torre-norte', 'froilan-roa-5731-torre-sur', 'edificio-verne', 'irarrazaval']);
// The later brochure additions have independent exact audits. The latest
// commercial presentation is the only extra permitted HTML transformation;
// catalogue objects, research and older media retain their original controls.
const AJ_REVIEW = new Set(['downtown-san-martin', 'edificio-teatinos-750',
  'edificio-vista-amunategui', 'monjitas-690', 'vista-morande']);
// The three supplied Ingevec brochures receive their own exact baseline and
// public-fallback audit in ingevec-brochures.test.mjs.
const INGEVEC_REVIEW = new Set(['centenario-1', 'tocornal', 'vivaceta']);
const CONTEXT_SOURCES = Object.freeze({
  'mapocho-3521-edificio-a': 'https://euroinmobiliaria.cl/proyectos/mapocho-3521',
  'froilan-roa-5731-torre-norte': 'https://euroinmobiliaria.cl/proyectos/froilan-roa-5731',
  'froilan-roa-5731-torre-sur': 'https://euroinmobiliaria.cl/proyectos/froilan-roa-5731',
  'edificio-verne': 'https://norte-verde.cl/proyecto/verne-oficinas/',
});
const PENDING = Object.keys(CONTEXT_SOURCES);
const git = (...args) => execFileSync('git', args, { cwd: ROOT });
const old = (path, ref = BASELINE) => git('show', `${ref}:${path}`);
const current = (path) => readFileSync(resolve(ROOT, path));
const json = (path) => JSON.parse(current(path));
const oldJson = (path) => JSON.parse(old(path));
const catalogue = json('data/proyectos.json');
const beforeCatalogue = oldJson('data/proyectos.json');
const research = json('data/fichas-proyectos.json');
const beforeResearch = oldJson('data/fichas-proyectos.json');
const financial = json('data/hipotecario.json');
const bySlug = (rows) => new Map(rows.map((row) => [row.slug, row]));
const projects = bySlug(catalogue);
const previousProjects = bySlug(beforeCatalogue);
const records = bySlug(research);
const previousRecords = bySlug(beforeResearch);
const clone = (value) => structuredClone(value);
const unchangedFile = (path) => assertCommercialBytes(path, current(path), old(path));
const blobHash = (bytes) => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const tree = (ref, path) => git('ls-tree', '-r', ref, ...(path ? ['--', path] : [])).toString().trim().split('\n').filter(Boolean)
  .map((line) => { const [meta, file] = line.split('\t'); return { file, hash: meta.split(' ')[2] }; });

function localAsset(path) {
  assert.match(path, /^\/assets\/propiedades\/catalogo\/[a-f0-9]{24}\.(?:webp|jpg|png)$/);
  return resolve(ROOT, path.slice(1));
}
function officialUrl(value, expected) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.username + url.password + url.port, '');
  assert.ok(['euroinmobiliaria.cl', 'www.euroinmobiliaria.cl', 'norte-verde.cl'].includes(url.hostname), value);
  if (expected) assert.equal(value.replace(/\/$/, ''), expected.replace(/\/$/, ''));
}
function listFiles(path) {
  return readdirSync(resolve(ROOT, path)).flatMap((name) => {
    const entry = resolve(ROOT, path, name);
    return statSync(entry).isDirectory() ? listFiles(relative(ROOT, entry)) : [relative(ROOT, entry)];
  }).sort();
}

// Small structural reader for the generated static pages; no browser package,
// network call, email delivery or reservation is needed for these assertions.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
function decode(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[a-f0-9]+);/gi, (entity) => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    return named[entity.toLowerCase()] ?? String.fromCodePoint(entity[2].toLowerCase() === 'x'
      ? Number.parseInt(entity.slice(3, -1), 16) : Number.parseInt(entity.slice(2, -1), 10));
  });
}
function page(html) {
  const root = { tag: '', attrs: {}, children: [], start: 0, end: html.length };
  const stack = [root];
  const tokens = /<!--[\s\S]*?-->|<![^>]*>|<\/?([a-z][a-z0-9:-]*)\b[^>]*>|[^<]+|</gi;
  for (const match of html.matchAll(tokens)) {
    const token = match[0];
    if (token.startsWith('<!')) continue;
    if (!match[1]) { stack.at(-1).children.push(decode(token)); continue; }
    const tag = match[1].toLowerCase();
    if (token.startsWith('</')) {
      const index = stack.findLastIndex((node) => node.tag === tag);
      if (index > 0) { stack[index].end = match.index + token.length; stack.length = index; }
      continue;
    }
    const attrs = {};
    for (const attribute of token.slice(tag.length + 1).matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[attribute[1].toLowerCase()] = decode(attribute[2] ?? attribute[3] ?? attribute[4] ?? '');
    }
    const node = { tag, attrs, children: [], start: match.index, end: match.index + token.length };
    stack.at(-1).children.push(node);
    if (!VOID.has(tag) && !token.endsWith('/>')) stack.push(node);
  }
  const all = (node = root) => [node, ...node.children.flatMap((child) => typeof child === 'string' ? [] : all(child))];
  const nodes = all();
  const text = (node) => node.children.map((child) => typeof child === 'string' ? child : text(child)).join('');
  return {
    html, nodes, all, text,
    id: (id) => nodes.filter((node) => node.attrs.id === id),
    raw: (node) => html.slice(node.start, node.end),
    anchors: (node) => all(node).filter((child) => child.tag === 'a')
      .map((child) => [child.attrs.href, text(child).trim()]),
  };
}
const readPage = (slug, baseline = false) => page(baseline
  ? commercialPage(old(`${slug}.html`), slug) : current(`${slug}.html`).toString());
const oneId = (parsed, id) => { const found = parsed.id(id); assert.equal(found.length, 1, id); return found[0]; };
const identity = (parsed, node) => ({ attrs: node.attrs, text: parsed.text(node).replace(/\s+/g, ' ').trim() });

test('fixed baseline: 148 ordered identities, 142 unchanged public objects and only approved presentation changes to 134 other HTML pages', () => {
  assert.match(git('rev-parse', BASELINE).toString(), /^a279744[0-9a-f]{33}\s*$/);
  assert.equal(catalogue.length, 148);
  assert.equal(new Set(catalogue.map((project) => project.slug)).size, 148);
  assert.deepEqual(catalogue.map((project) => project.slug), beforeCatalogue.map((project) => project.slug));
  assert.deepEqual(research.map((record) => record.slug), beforeResearch.map((record) => record.slug));
  const ledger = json('data/registro-fichas.json');
  const oldLedger = bySlug(oldJson('data/registro-fichas.json'));
  assert.deepEqual(ledger.map((row) => row.slug), oldJson('data/registro-fichas.json').map((row) => row.slug));
  let protectedCount = 0;
  for (const project of catalogue) {
    assert.equal(project.detalleUrl, previousProjects.get(project.slug).detalleUrl, project.slug);
    if (FOCUS.has(project.slug)) continue;
    assert.deepEqual(project, previousProjects.get(project.slug), project.slug);
    if (AJ_REVIEW.has(project.slug)) continue;
    assert.deepEqual(records.get(project.slug), previousRecords.get(project.slug), project.slug);
    assert.deepEqual(ledger.find((row) => row.slug === project.slug), oldLedger.get(project.slug), project.slug);
    if (INGEVEC_REVIEW.has(project.slug)) continue;
    protectedCount++;
    unchangedFile(`${project.slug}.html`);
  }
  assert.equal(protectedCount, 134);
});

test('only Mapocho catalogue amenities and explicitly reviewed source/date change; five focus objects remain exact', () => {
  for (const slug of FOCUS) if (slug !== 'mapocho-3521') assert.deepEqual(projects.get(slug), previousProjects.get(slug), slug);
  const project = projects.get('mapocho-3521');
  const previous = previousProjects.get(project.slug);
  assert.equal(project.precioDesdeUF, 2994);
  assert.deepEqual(project.amenities, [...previous.amenities, 'Salón infantil', 'Patio exterior']);
  assert.equal(project.verificacion.fecha, DATE);
  officialUrl(project.verificacion.fuente, CONTEXT_SOURCES['mapocho-3521-edificio-a']);
  const restored = clone(project);
  restored.amenities = previous.amenities;
  restored.verificacion.fecha = previous.verificacion.fecha;
  restored.verificacion.fuente = previous.verificacion.fuente;
  assert.deepEqual(restored, previous);
  assert.deepEqual(verifiedProjectPrice(project, DATE), { valueUf: 2994, date: DATE, source: project.verificacion.fuente });
});

test('four official contexts retain internal provenance and commercial scope notices without exposing research sources or dates', () => {
  for (const slug of PENDING) {
    const record = records.get(slug);
    const context = record.officialContext;
    assert.ok(context, slug);
    assert.deepEqual(Object.keys(context).sort(), ['title', 'name', 'scope', 'checkedAt', 'sourceUrl', 'sourceStatus',
      'limitation', 'facts', 'images', 'mapQuery', 'imageNote', 'mapNote'].sort(), slug);
    assert.equal(context.checkedAt, DATE);
    assert.equal(context.sourceStatus, 'verified');
    assert.equal(context.scope, slug === 'edificio-verne' ? 'oficinas' : 'conjunto_sin_etapa');
    officialUrl(context.sourceUrl, CONTEXT_SOURCES[slug]);
    for (const key of ['title', 'name', 'limitation', 'mapQuery', 'imageNote', 'mapNote']) assert.ok(typeof context[key] === 'string' && context[key].trim(), `${slug}: ${key}`);
    assert.match(context.limitation, /no|pendiente|sin confirmar/i, `${slug}: disclose the scope limitation`);
    assert.ok(Array.isArray(context.facts) && context.facts.length > 0);
    assert.ok(Array.isArray(context.images) && context.images.length > 0);
    const restored = clone(record);
    delete restored.officialContext;
    assert.deepEqual(restored, previousRecords.get(slug), `${slug}: primary research/provenance cannot change through contextual review`);
    const parsed = readPage(slug);
    const expectedPage = page(commercialPage(old(`${slug}.html`, PRESENTATION_BASELINE), slug));
    assert.equal(parsed.html, expectedPage.html, `${slug}: context changes exceed the approved presentation`);
    const section = oneId(parsed, 'contexto-oficial');
    assert.equal(section.tag, 'section');
    const text = parsed.text(section);
    assert.ok(text.includes(context.name), slug);
    assert.equal(parsed.raw(section), expectedPage.raw(oneId(expectedPage, 'contexto-oficial')),
      `${slug}: related alternative, images and map retain their commercial scope notices`);
    assert.ok(!parsed.anchors(section).some(([href]) => href === context.sourceUrl), `${slug}: technical contextual source link must remain internal`);
    assert.equal(parsed.id('fuentes').length, 0, `${slug}: research source section is not public`);
    for (const fact of context.facts) {
      assert.deepEqual(Object.keys(fact).sort(), ['label', 'value']);
      assert.ok(typeof fact.label === 'string' && typeof fact.value === 'string');
      assert.ok(expectedPage.text(oneId(expectedPage, 'contexto-oficial')).includes(fact.label),
        `${slug}: contextual fact label ${fact.label}`);
    }
    const oldPage = readPage(slug, true);
    // Pending stage/product content and its primary location remain distinct
    // from the official aggregate/office reference.
    for (const id of ['project-name', 'proyecto', 'caracteristicas', 'galeria', 'equipamiento', 'recorrido', 'ubicacion']) {
      assert.deepEqual(identity(parsed, oneId(parsed, id)), identity(oldPage, oneId(oldPage, id)), `${slug}: primary ${id} changed`);
    }
    const structured = parsed.nodes.filter((node) => node.tag === 'script' && node.attrs.type === 'application/ld+json');
    const oldStructured = oldPage.nodes.filter((node) => node.tag === 'script' && node.attrs.type === 'application/ld+json');
    assert.deepEqual(structured.map((node) => parsed.raw(node)), oldStructured.map((node) => oldPage.raw(node)), `${slug}: context is not a residential offer`);
    const aside = parsed.nodes.find((node) => node.tag === 'aside');
    assert.ok(parsed.text(aside).includes('Consultar precio'), `${slug}: unverified primary price must remain unavailable`);
    const contextImgs = parsed.all(section).filter((node) => node.tag === 'img');
    assert.equal(contextImgs.length, context.images.length, `${slug}: contextual images count`);
    for (const image of context.images) {
      officialUrl(image.url);
      officialUrl(image.sourceUrl, context.sourceUrl);
      assert.ok(statSync(localAsset(image.localPath)).isFile());
      assert.ok(Number.isInteger(image.width) && image.width > 0 && Number.isInteger(image.height) && image.height > 0);
      assert.ok(image.alt?.trim());
      assert.ok(contextImgs.some((node) => node.attrs.src === image.localPath && node.attrs.alt === image.alt), `${slug}: ${image.localPath}`);
    }
  }
  for (const slug of ['mapocho-3521', 'irarrazaval']) assert.equal(readPage(slug).id('contexto-oficial').length, 0);
});

test('four pending identities cannot borrow office/aggregate prices for A–E, even if contextual facts are passed with the project', () => {
  const input = { incomeClp: 10_000_000, complementIncome: false, secondIncomeClp: 0, debtClp: 0,
    savings: 10_000_000, savingsCurrency: 'CLP', monthlySavingsClp: 1_000_000, horizonMonths: 24,
    downPaymentPercent: 20, years: 20, annualRatePercent: 4.5, rateConvention: 'effective', burdenPercent: 25 };
  assert.equal(catalogue.filter((project) => verifiedProjectPrice(project, DATE)).length, 115);
  for (const slug of PENDING) {
    const project = projects.get(slug);
    for (const key of ['precioDesdeUF', 'direccion', 'estado', 'entrega']) assert.equal(project[key], null, `${slug}: ${key}`);
    assert.equal(project.tipoActivo ?? 'Residencial', 'Residencial');
    assert.equal(project.imagenPrincipal, null);
    assert.deepEqual(records.get(slug).images, []);
    assert.ok(!project.verificacion.camposVerificados.includes('precioDesdeUF'));
    for (const candidate of [project, { ...project, officialContext: records.get(slug).officialContext }]) {
      assert.equal(verifiedProjectPrice(candidate, DATE), null);
      const result = evaluateProject(candidate, input, financial, DATE);
      assert.equal(result.category, 'E');
      assert.equal(result.price, null);
      assert.equal(result.mortgage, null);
    }
  }
});

test('server rejects all three contextual amounts as catalogue prices without contacting an external provider', async () => {
  let calls = 0;
  let keys = 0;
  const handler = createContactHandler({ projectDataset: catalogue, mortgageDataset: financial, now: () => NOW,
    getEnvironment: () => 'test', getApiKey: () => { keys++; return 'synthetic-test-key'; },
    fetchImpl: async () => { calls++; throw new Error('An unverified price must not reach the provider.'); } });
  for (const slug of PENDING) for (const price of [1550, 2994, 3049]) {
    const body = { nombre: 'Prueba de contexto', correo: 'qa@official-context.test.invalid', telefono: '+56900000000',
      mensaje: 'Prueba sintética sin envío real.', proyecto: slug, website: '', consent: true, startedAt: NOW - 5000,
      mortgage: { propertyUf: price, downPaymentPercent: 20, years: 20, annualRatePercent: 4.5,
        rateConvention: 'effective', bankId: null, simulatedAt: new Date(NOW - 1000).toISOString(), location: 'unknown', propertyValueOrigin: 'catalogue' } };
    const response = await handler.fetch(new Request('https://official-context.test.invalid/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://official-context.test.invalid' }, body: JSON.stringify(body),
    }));
    assert.equal(response.status, 400, `${slug}: ${price}`);
  }
  assert.equal(calls, 0);
  assert.equal(keys, 0);
});

test('Mapocho preserves its four images/map/identity and adds only two official gallery photographs', () => {
  const record = records.get('mapocho-3521');
  const previous = previousRecords.get(record.slug);
  assert.equal(record.checkedAt, DATE);
  officialUrl(record.sourceUrl, CONTEXT_SOURCES['mapocho-3521-edificio-a']);
  assert.equal(record.updates.precioDesdeUF, 2994);
  assert.deepEqual(record.updates.amenities, projects.get(record.slug).amenities);
  assert.equal(record.images.length, 6);
  assert.deepEqual(record.images.slice(0, 4), previous.images);
  assert.deepEqual(record.virtualTours, previous.virtualTours);
  assert.deepEqual(record.specs, previous.specs);
  const restored = clone(record);
  for (const key of ['checkedAt', 'sourceUrl', 'sourceNotes', 'sourceEvidence', 'images']) restored[key] = previous[key];
  restored.updates.amenities = previous.updates.amenities;
  assert.deepEqual(restored, previous, 'Mapocho research changed beyond checked facts/photographs');
  const parsed = readPage(record.slug);
  const before = readPage(record.slug, true);
  assert.equal(parsed.raw(oneId(parsed, 'ubicacion')), before.raw(oneId(before, 'ubicacion')));
  assert.equal(parsed.raw(oneId(parsed, 'project-name')), before.raw(oneId(before, 'project-name')));
  const gallery = parsed.all(oneId(parsed, 'galeria')).filter((node) => node.tag === 'img');
  assert.equal(gallery.length, 6);
  for (const image of record.images) assert.ok(gallery.some((node) => node.attrs.src === image.localPath));
});

test('Irarrázaval preserves the map/tour, internal identity evidence and a concise commercial limitation', () => {
  const record = records.get('irarrazaval');
  const previous = previousRecords.get(record.slug);
  assert.deepEqual(record.images, []);
  assert.equal(record.virtualTours.length, 1);
  const tour = record.virtualTours[0];
  const oldTour = previous.virtualTours[0];
  for (const key of ['url', 'provider', 'sourceUrl']) assert.equal(tour[key], oldTour[key]);
  assert.equal(tour.title, 'Visor 360 oficial — contexto por confirmar');
  assert.equal(tour.visualVerification.checkedAt, DATE);
  assert.ok(tour.visualVerification.evidence?.trim());
  assert.ok(tour.visualVerification.limitation?.trim());
  assert.match(tour.visualVerification.screenshot, /^docs\/qa\/(?!.*(?:^|\/)\.\.(?:\/|$)).+\.(?:png|jpe?g|webp)$/);
  assert.equal(sha256(current(tour.visualVerification.screenshot)), tour.visualVerification.screenshotSha256,
    'Irarrázaval visual evidence file must match the recorded hash');
  const disclosed = [record.sourceNotes, tour.verification, tour.visualVerification.evidence, tour.visualVerification.limitation,
    JSON.stringify(record.identityReview ?? {})].join(' ');
  assert.match(disclosed, /2021/);
  assert.match(disclosed, /[áa]lbora/i);
  const parsed = readPage(record.slug);
  const before = readPage(record.slug, true);
  assert.equal(parsed.raw(oneId(parsed, 'ubicacion')), before.raw(oneId(before, 'ubicacion')));
  assert.ok(parsed.html.includes(tour.url));
  assert.equal(parsed.html, commercialPage(old(`${record.slug}.html`, PRESENTATION_BASELINE), record.slug),
    'Irarrázaval: only the approved commercial presentation may change');
  assert.equal(parsed.id('fuentes').length, 0);
  assert.match(parsed.text(oneId(parsed, 'recorrido')), /contexto|referencial/i);
  assert.match(parsed.text(oneId(parsed, 'recorrido')), /confirmar|confirmaci[oó]n/i);
  assert.equal(parsed.nodes.filter((node) => node.tag === 'img').length, before.nodes.filter((node) => node.tag === 'img').length);
  const restored = clone(record);
  for (const key of ['sourceNotes', 'identityReview', 'virtualTours']) {
    if (Object.hasOwn(previous, key)) restored[key] = previous[key]; else delete restored[key];
  }
  assert.deepEqual(restored, previous, 'Irarrázaval changed beyond the tour identity review');
});

test('all 521 integration assets and 509 historical originals retain their hashes; exactly ten new official images have complete provenance', () => {
  const protectedAssets = tree(BASELINE, 'assets');
  assert.equal(protectedAssets.length, 521);
  for (const { file, hash } of protectedAssets) assert.equal(blobHash(current(file)), hash, file);
  const originalAssets = tree('bd42519', 'assets');
  assert.equal(originalAssets.length, 509);
  for (const { file, hash } of originalAssets) assert.equal(blobHash(current(file)), hash, file);
  const manifest = json('data/fuentes-imagenes.json');
  const previous = oldJson('data/fuentes-imagenes.json');
  for (const [url, entry] of Object.entries(previous)) assert.deepEqual(manifest[url], entry, `existing image provenance: ${url}`);
  const added = Object.keys(manifest).filter((url) => !Object.hasOwn(previous, url));
  assert.equal(added.length, 10);
  const usedImages = [...records.get('mapocho-3521').images, ...PENDING.flatMap((slug) => records.get(slug).officialContext.images)];
  const newPaths = new Set();
  for (const url of added) {
    const entry = manifest[url];
    officialUrl(url);
    officialUrl(entry.sourceUrl);
    assert.ok(Object.values(CONTEXT_SOURCES).some((source) => source.replace(/\/$/, '') === entry.sourceUrl.replace(/\/$/, '')), url);
    assert.equal(entry.status, 'downloaded');
    assert.equal(entry.checkedAt, DATE);
    assert.equal(entry.httpStatus, 200);
    assert.ok(Number.isInteger(entry.width) && entry.width > 0 && Number.isInteger(entry.height) && entry.height > 0);
    const bytes = readFileSync(localAsset(entry.localPath));
    assert.equal(bytes.length, entry.bytes);
    assert.equal(sha256(bytes), entry.localSha256);
    assert.match(entry.originalSha256, /^[a-f0-9]{64}$/);
    assert.equal(entry.file, entry.localPath.split('/').at(-1));
    assert.ok(usedImages.some((image) => image.url === url && image.localPath === entry.localPath), `${url}: not tied to an approved context/gallery`);
    newPaths.add(entry.localPath.slice(1));
  }
  assert.equal(newPaths.size, 10);
  const currentAssets = listFiles('assets').filter((file) =>
    !file.startsWith('assets/propiedades/aj-urbana-preview/') &&
    !file.startsWith('assets/propiedades/ingevec-preview/') && file !== 'assets/css/aj-brochure-preview.css');
  const expected = [...protectedAssets.map(({ file }) => file), ...newPaths].sort();
  assert.deepEqual(currentAssets, expected, 'No other asset additions/deletions are authorized');
});

test('project registry, sitemap, financial data/motors and APIs remain byte identical; HTML changes are limited to the approved presentation', () => {
  for (const path of ['lib/project-context.mjs', 'sitemap.xml', 'data/hipotecario.json', 'data/catalogo-original-fichas.json']) unchangedFile(path);
  for (const path of tree(BASELINE, 'api').concat(tree(BASELINE, 'lib')).map(({ file }) => file)) unchangedFile(path);
  for (const { file } of tree(BASELINE, '')) {
    if (/^[^/]+\.html$/.test(file) && !FOCUS.has(file.slice(0, -5)) &&
        !AJ_REVIEW.has(file.slice(0, -5)) && !INGEVEC_REVIEW.has(file.slice(0, -5))) unchangedFile(file);
  }
  assert.equal(Object.keys(trustedContexts).length, 148);
  for (const project of catalogue) assert.deepEqual(trustedContexts[project.slug], { name: project.nombre, url: project.detalleUrl });
  const locations = current('sitemap.xml').toString().match(/<loc>[^<]+<\/loc>/g);
  assert.equal(locations.length, 154);
  assert.equal(new Set(locations).size, 154);
});

test('both menus and consultation/booking/simulation links keep their exact six project identities and no financial URL data', () => {
  const expectedNav = [['/#expertise', 'Expertise'], ['/proyectos.html', 'Asset Portafolio'], ['/contacto.html', 'Contacto']];
  for (const slug of FOCUS) {
    const parsed = readPage(slug);
    const header = parsed.nodes.filter((node) => node.tag === 'header');
    assert.equal(header.length, 1, slug);
    const desktop = parsed.all(header[0]).filter((node) => node.tag === 'div' && node.attrs.class?.split(/\s+/).includes('desktop-nav'));
    const mobile = parsed.all(header[0]).filter((node) => node.tag === 'nav' && node.attrs['aria-label'] === 'Navegación móvil');
    assert.equal(desktop.length, 1); assert.equal(mobile.length, 1);
    assert.deepEqual(parsed.anchors(desktop[0]), expectedNav, `${slug}: desktop`);
    assert.deepEqual(parsed.anchors(mobile[0]), expectedNav, `${slug}: mobile`);
    const anchors = parsed.anchors(parsed.nodes[0]);
    for (const [path, label] of [['/contacto.html', 'Consultar proyecto'], ['/agenda-asesoria.html', 'Agendar Asesoría'], ['/comparador-hipotecario.html', 'Simular crédito hipotecario']]) {
      const actions = anchors.filter(([href, text]) => text === label && new URL(href, 'https://sollahms.cl').pathname === path);
      assert.ok(actions.length > 0, `${slug}: ${label}`);
      if (path === '/comparador-hipotecario.html') assert.equal(actions.length, 1);
      for (const [href] of actions) assert.deepEqual([...new URL(href, 'https://sollahms.cl').searchParams], [['proyecto', slug]], `${slug}: ${label} query`);
    }
  }
});
