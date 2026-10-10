import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, relative, join } from 'node:path';
import { tmpdir } from 'node:os';
import { verifiedProjectPrice } from '../assets/js/project-finance.mjs';
import { evaluateProject } from '../assets/js/purchase-capacity.mjs';
import { createContactHandler } from '../api/contact.mjs';

// This review extends five static pages only. Historical brochure material
// must never overwrite current catalogue, financial or source-verification data.
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BASELINE = '045fe182ef5d2ad2206df303ba74330aa747050d';
const DATE = '2026-10-10';
const NOW = Date.parse('2026-10-10T15:00:00Z');
const ASSETS = '/assets/propiedades/aj-urbana-preview/';
const CSS = 'assets/css/aj-brochure-preview.css';
const SOURCE_DOCUMENTS = {
  'downtown-san-martin': { sha256: 'a5c95f31e3f90b365d0b8edd8340bd6fb7bfdb28172cd30e59dfef854e6643f4', pages: 38, modelPages: [19,20,21,22,23,24,26,27,28,29,30,31,32,33,34,35,36,37,38] },
  'edificio-teatinos-750': { sha256: '119976d9a6cc9045be5c9ccdedd6c293d0ebdc38be7df3065843a29b88c56327', pages: 32, modelPages: Array.from({ length: 15 }, (_, i) => i + 17) },
  'edificio-vista-amunategui': { sha256: '3a80503b8ef2670deb75c7776724f6d6880128a03b1609484cedb43f452893f4', pages: 35, modelPages: Array.from({ length: 19 }, (_, i) => i + 16) },
  'monjitas-690': { sha256: 'da6ede0213e85e675ff7531e0640dc55194e375c1e4822244a459c2a837816b1', pages: 26, modelPages: [24,25] },
  'vista-morande': { sha256: '4e1ac72e7fa333bc944039a50745d935800df80f3d9d8d3f4d01a277207ef628', pages: 43, modelPages: Array.from({ length: 23 }, (_, i) => i + 20) },
};
const SLUGS = Object.keys(SOURCE_DOCUMENTS);
const FOCUS = new Set(SLUGS);
const git = (...args) => execFileSync('git', args, { cwd: ROOT });
const old = (path) => git('show', BASELINE + ':' + path);
const current = (path) => readFileSync(resolve(ROOT, path));
const json = (path) => JSON.parse(current(path));
const catalogue = json('data/proyectos.json');
const research = json('data/fichas-proyectos.json');
const ledger = json('data/registro-fichas.json');
const mortgageData = json('data/hipotecario.json');
const review = json('data/brochures-aj-urbana.json');
const records = new Map(review.projects.map((record) => [record.slug, record]));
const projectFor = (slug) => catalogue.find((project) => project.slug === slug);
const modelFor = (slug, model) => records.get(slug).models.find((row) => row.modelo === model);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const blobHash = (bytes) => createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
const baselineTree = (path = '') => git('ls-tree', '-r', BASELINE, ...(path ? ['--', path] : [])).toString().trim().split('\n').filter(Boolean)
  .map((line) => { const [meta, file] = line.split('\t'); return { file, hash: meta.split(' ')[2] }; });
const unchanged = (file) => assert.ok(current(file).equals(old(file)), file + ': protected bytes changed');
const listFiles = (path) => readdirSync(resolve(ROOT, path)).flatMap((name) => {
  const file = resolve(ROOT, path, name);
  return statSync(file).isDirectory() ? listFiles(relative(ROOT, file)) : [relative(ROOT, file)];
}).sort();
const htmlFor = (slug) => current(slug + '.html').toString();
const reviewBlocks = (html) => [...html.matchAll(/<!--AJ_PREVIEW_START-->([\s\S]*?)<!--AJ_PREVIEW_END-->/g)].map((match) => match[1]).join('\n');
const publicVersion = (html) => html.replace(/<!--AJ_PREVIEW_START-->[\s\S]*?<!--AJ_PREVIEW_END-->/g, '')
  .replace(/<!--AJ_PUBLIC_START-->([\s\S]*?)<!--AJ_PUBLIC_END-->/g, '$1');
const tagAttributes = (html, tag) => [...html.matchAll(new RegExp('<' + tag + '\\b[^>]*>', 'gi'))].map((match) => {
  const attributes = {};
  for (const item of match[0].matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attributes[item[1]] = item[2] ?? item[3];
  return attributes;
});

function assetBytes(path, expectedHash) {
  assert.ok(typeof path === 'string' && path.startsWith(ASSETS), path);
  assert.ok(!path.includes('..') && /^\/[a-z0-9/_.-]+\.(?:webp|png|jpe?g)$/i.test(path), path);
  const bytes = current(path.slice(1));
  assert.equal(sha256(bytes), expectedHash, path + ': asset SHA mismatch');
  return bytes;
}
function imageDimensions(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    const kind = bytes.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
    if (kind === 'VP8L') {
      const bits = bytes.readUInt32LE(21);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
    }
    if (kind === 'VP8 ') return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    for (let offset = 2; offset < bytes.length;) {
      if (bytes[offset] !== 0xff) { offset++; continue; }
      let markerOffset = offset + 1;
      while (bytes[markerOffset] === 0xff) markerOffset++;
      const marker = bytes[markerOffset]; offset = markerOffset + 1;
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = bytes.readUInt16BE(offset);
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
      }
      offset += length;
    }
  }
  assert.fail('Unsupported or unreadable image header');
}
function combinedModelNotes(model, record) {
  return JSON.stringify([model.notes, model.advertencia, model.excepcion, record.warnings]).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Independently checked against the original PDF pages, not generated from the site data.
const PRINTED_MODELS = {
  "downtown-san-martin": [
    ["1", "Estudio", 23.71, null, 23.71, "2 al 16", "Norte", 19],
    ["2", "1 dormitorio / 1 baño", 37.07, 2.86, 39.93, "2 al 16", "Poniente", 20],
    ["3", "1 dormitorio / 1 baño", 35.17, 2.68, 37.87, "2 al 16", "Oriente", 21],
    ["4", "Estudio", 21.3, null, 21.3, "2 al 16", "Oriente", 22],
    ["5", "Estudio", 21.27, null, 21.27, "2 al 16", "Oriente", 23],
    ["6", "Estudio", 21.57, null, 21.57, "2 al 16", "Oriente", 24],
    ["7", "Estudio", 21.4, null, 21.4, "2 al 16", "Oriente", 26],
    ["8", "Estudio", 21.31, null, 21.31, "2 al 16", "Oriente", 27],
    ["9", "1 dormitorio / 1 baño", 34.95, 2.64, 37.59, "2 al 16", "Oriente", 28],
    ["10", "1 dormitorio / 1 baño", 36.76, 2.96, 39.72, "2 al 16", "Poniente", 29],
    ["11", "Estudio", 38.48, null, 38.48, "2 al 16", "Sur", 30],
    ["12", "Estudio", 23.85, null, 23.85, "2 al 16", "Sur", 31],
    ["13", "1 dormitorio / 1 baño", 38.36, 5.28, 43.64, "2 al 16", "Sur", 32],
    ["14", "Estudio", 23.51, null, 23.51, "2 al 16", "Sur", 33],
    ["15", "Estudio", 24.25, null, 24.25, "2 al 16", "Sur", 34],
    ["16", "Estudio", 26.5, null, 26.5, "2 al 16", "Norte", 35],
    ["17", "Estudio", 23.55, null, 23.55, "2 al 16", "Norte", 36],
    ["18", "1 dormitorio / 1 baño", 38.1, 5.58, 43.68, "2 al 16", "Norte", 37],
    ["19", "1 dormitorio / 1 baño", 36.43, null, 36.43, "2 al 16", "Norte", 38],
  ],
  "edificio-teatinos-750": [
    ["1", "Estudio", 26.31, 3.92, 30.23, "2 al 16", "Sur", 17],
    ["2", "Estudio", 27.44, 3.08, 30.52, "2 al 16", "Norte", 18],
    ["3", "Estudio", 22.38, 3.42, 25.8, "2 al 16", "Norte", 19],
    ["4", "1 dormitorio / 1 baño", 29.72, 4.69, 34.68, "2 al 16", "Norte", 20],
    ["5", "1 dormitorio / 1 baño", 36.79, 7.1, 43.89, "2 al 16", "Norte", 21],
    ["6", "1 dormitorio / 1 baño", 35.94, 0.0, 35.94, "2 al 16", "Poniente", 22],
    ["7", "1 dormitorio / 1 baño", 31.64, 4.66, 36.3, "2 al 16", "Oriente", 23],
    ["8", "1 dormitorio / 1 baño", 30.77, 4.94, 35.71, "2 al 16", "Oriente", 24],
    ["9", "1 dormitorio / 1 baño", 27.09, 4.98, 32.07, "2 al 16", "Oriente", 25],
    ["10", "1 dormitorio / 1 baño", 30.44, 4.94, 35.38, "2 al 16", "Oriente", 26],
    ["11", "1 dormitorio / 1 baño", 30.44, 4.94, 35.38, "2 al 16", "Oriente", 27],
    ["12", "1 dormitorio / 1 baño", 30.28, 4.06, 34.34, "2 al 16", "Oriente", 28],
    ["13", "Estudio", 23.41, 0.0, 23.41, "2 al 16", "Poniente", 29],
    ["14", "Estudio", 18.58, 0.0, 18.58, "2 al 16", "Poniente", 30],
    ["15", "Estudio", 17.85, 0.0, 17.85, "2 al 16", "Poniente", 31],
  ],
};

test('AJ review preserves all 148 catalogue objects, all historical research and 143 other fichas exactly', () => {
  assert.equal(git('rev-parse', BASELINE).toString().trim(), BASELINE);
  assert.equal(catalogue.length, 148);
  assert.equal(new Set(catalogue.map((project) => project.slug)).size, 148);
  unchanged('data/proyectos.json');
  unchanged('data/fichas-proyectos.json');
  unchanged('data/registro-fichas.json');
  unchanged('data/fuentes-imagenes.json');
  assert.equal(research.length, 148);
  assert.equal(ledger.length, 148);
  let protectedPages = 0;
  for (const project of catalogue) {
    if (FOCUS.has(project.slug)) continue;
    unchanged(project.slug + '.html');
    protectedPages++;
  }
  assert.equal(protectedPages, 143);
});

test('531 existing assets, API handlers, financial engines and global public pages remain byte identical', () => {
  const assets = baselineTree('assets');
  assert.equal(assets.length, 531);
  for (const { file, hash } of assets) assert.equal(blobHash(current(file)), hash, file);
  for (const prefix of ['api', 'lib']) for (const { file } of baselineTree(prefix)) unchanged(file);
  for (const file of ['data/hipotecario.json', 'data/catalogo-original-fichas.json', 'sitemap.xml', 'robots.txt', 'vercel.json']) unchanged(file);
  for (const { file } of baselineTree()) {
    if (/^[^/]+\.html$/.test(file) && !FOCUS.has(file.slice(0, -5))) unchanged(file);
  }
  assert.deepEqual(listFiles('assets').filter((file) => !file.startsWith(ASSETS.slice(1)) && file !== CSS), assets.map(({ file }) => file).sort());
});

test('five original documents and 78 unique models retain exact identifiers, source pages and original SHA provenance', () => {
  assert.equal(review.reviewDate, DATE);
  assert.equal(review.baseline, BASELINE);
  assert.deepEqual(review.projects.map((record) => record.slug), SLUGS);
  const all = review.projects.flatMap((record) => record.models.map((model) => [record.slug, model]));
  assert.equal(all.length, 78);
  assert.equal(new Set(all.map(([slug, model]) => slug + ':' + model.modelo)).size, 78);
  for (const record of review.projects) {
    const source = SOURCE_DOCUMENTS[record.slug];
    assert.equal(record.name, projectFor(record.slug).nombre);
    assert.equal(record.document.sha256, source.sha256, record.slug);
    assert.equal(record.document.pageCount, source.pages, record.slug);
    assert.match(record.document.fileName, /\.pdf$/i);
    assert.equal(record.models.length, source.modelPages.length, record.slug);
    assert.deepEqual(record.models.map((model) => model.pagina_brochure), source.modelPages, record.slug);
    for (const model of record.models) {
      assert.equal(model.visuallyVerified, true, record.slug + ':' + model.modelo);
      assert.equal(model.approximate, true);
      assert.ok(model.sourcePages.includes(model.pagina_brochure));
      for (const page of model.sourcePages) assert.ok(Number.isInteger(page) && page >= 1 && page <= source.pages);
      assert.ok(['Estudio', '1 dormitorio / 1 baño', '2 dormitorios / 1 baño', '2 dormitorios / 2 baños'].includes(model.tipologia), model.tipologia);
      assert.ok(model.orientacion === null || ['Norte','Sur','Oriente','Poniente','Nororiente','Norponiente','Suroriente','Surponiente','Sur Oriente','SurOriente','Sur y Norte'].includes(model.orientacion), model.orientacion);
      for (const field of ['superficie_util_m2', 'superficie_total_m2']) assert.ok(Number.isFinite(model[field]) && model[field] > 0 && model[field] < 100, field);
      assert.ok(model.terraza_m2 === null || (Number.isFinite(model.terraza_m2) && model.terraza_m2 >= 0 && model.terraza_m2 < 50));
      assert.ok(typeof model.pisos === 'string' && model.pisos.trim());
    }
  }
  assert.deepEqual(modelFor('downtown-san-martin', '6').sourcePages, [24,25]);
});

test('34 independently reviewed models preserve printed values, unknown terraces and documented contradictions', () => {
  const fields = ['modelo','tipologia','superficie_util_m2','terraza_m2','superficie_total_m2','pisos','orientacion','pagina_brochure'];
  for (const [slug, rows] of Object.entries(PRINTED_MODELS)) {
    assert.deepEqual(records.get(slug).models.map((model) => fields.map((field) => model[field])), rows, slug);
  }
  for (const [slug, modelId, printedTotal, mathematicalTotal] of [
    ['downtown-san-martin','3',37.87,37.85], ['edificio-teatinos-750','4',34.68,34.41],
  ]) {
    const record = records.get(slug), model = modelFor(slug, modelId);
    assert.equal(model.superficie_total_m2, printedTotal);
    assert.equal(Number((model.superficie_util_m2 + model.terraza_m2).toFixed(2)), mathematicalTotal);
    assert.match(combinedModelNotes(model, record), /inconsisten|discrepan|no coincide|difiere|verificar|confirmar/i);
  }
  for (const modelId of ['8','9','10','11','12']) {
    assert.match(combinedModelNotes(modelFor('edificio-teatinos-750', modelId), records.get('edificio-teatinos-750')), /piso 2.*(?:sin|no tiene) terraza/i);
  }
  assert.notEqual(modelFor('edificio-teatinos-750','10').plan.localPath, modelFor('edificio-teatinos-750','11').plan.localPath);
  const monjitas = modelFor('monjitas-690', '26');
  assert.match(combinedModelNotes(monjitas, records.get('monjitas-690')), /30[,.]88/);
  assert.match(combinedModelNotes(monjitas, records.get('monjitas-690')), /piso 2/);
  for (const model of ['8','9','10']) assert.equal(modelFor('edificio-vista-amunategui', model).terraza_m2, null);
  assert.equal(modelFor('vista-morande', '13A').orientacion.replace(/\s+/g, '').toLowerCase(), 'suroriente');
  assert.equal(modelFor('vista-morande', '16C').orientacion, 'Sur y Norte');
  for (const model of ['5A','6A','7A','8A','9A','10A','11A','12A','14B','15B']) assert.equal(modelFor('vista-morande', model).terraza_m2, null);
});

test('all 78 plans have readable local images, hashes, source links and unique model-page identification', () => {
  const planPaths = [];
  for (const record of review.projects) {
    const block = reviewBlocks(htmlFor(record.slug));
    assert.ok(block, record.slug + ': missing review section');
    assert.match(block, /brochure|folleto/i);
    assert.match(block, /ilustrativ|aproximad|referencial/i);
    const anchors = tagAttributes(block, 'a');
    const images = tagAttributes(block, 'img');
    for (const model of record.models) {
      const plan = model.plan, bytes = assetBytes(plan.localPath, plan.sha256);
      assert.equal(plan.sourcePage, model.pagina_brochure);
      assert.equal(plan.sourceSha256, SOURCE_DOCUMENTS[record.slug].sha256);
      assert.deepEqual(imageDimensions(bytes), { width: plan.width, height: plan.height }, plan.localPath);
      assert.ok(plan.width >= 1200 && plan.height >= 600, 'Plan must be readable when enlarged');
      const image = images.find((image) => image.src === plan.localPath);
      assert.ok(image, record.slug + ': model ' + model.modelo + ' preview image missing');
      assert.equal(image.loading, 'lazy');
      assert.ok(image.alt?.trim());
      assert.ok(anchors.some((anchor) => anchor.href === plan.localPath), record.slug + ': model ' + model.modelo + ' enlargement link missing');
      planPaths.push(plan.localPath);
    }
  }
  assert.equal(new Set(planPaths).size, 78, 'Duplicated model pages must not produce repeated plan assets');
});

test('33 candidates are reviewed, selected renders have provenance and no existing official photograph is deleted', () => {
  assert.equal(review.projects.reduce((sum, record) => sum + record.imageReview.length, 0), 33);
  assert.deepEqual(review.publicationRights, { protectedPreview: 'authorized_by_user',
    publicRedistribution: 'pending_explicit_license', productionPolicy: 'excluded_until_verified' });
  const referenced = new Set();
  const chosenHashes = new Set();
  for (const record of review.projects) {
    const source = SOURCE_DOCUMENTS[record.slug];
    const block = reviewBlocks(htmlFor(record.slug));
    const images = tagAttributes(block, 'img');
    assert.ok(record.images.length >= 3, record.slug + ': useful project gallery needed');
    for (const image of record.images) {
      const bytes = assetBytes(image.localPath, image.sha256);
      assert.deepEqual(imageDimensions(bytes), { width: image.width, height: image.height });
      // A 958×744 original render is sufficient in a secondary gallery slot.
      // Native image hashes also prohibit artificial enlargement or editing.
      assert.ok(image.width >= 700 && image.height >= 450 && image.width * image.height >= 500_000, image.localPath);
      assert.ok(Number.isInteger(image.sourcePage) && image.sourcePage >= 1 && image.sourcePage <= source.pages);
      assert.equal(image.sourceSha256, source.sha256);
      assert.equal(image.sha256, image.originalSha256, image.localPath + ': supplied image bytes must remain original');
      assert.ok(image.caption?.trim());
      assert.ok(images.some((node) => node.src === image.localPath), image.localPath + ': selected gallery image missing');
      assert.ok(!chosenHashes.has(image.sha256), image.localPath + ': duplicate selected image');
      chosenHashes.add(image.sha256);
      referenced.add(image.localPath.slice(1));
    }
    for (const model of record.models) referenced.add(model.plan.localPath.slice(1));
    const baselineImages = tagAttributes(old(record.slug + '.html').toString(), 'img').map((image) => image.src).filter(Boolean);
    for (const src of baselineImages) assert.ok(htmlFor(record.slug).includes(src), record.slug + ': existing image was removed');
    assert.ok(!record.images.some((image) => /downtown-san-martin_pagina_01_candidato/.test(image.localPath)), 'Context street photograph cannot become Downtown facade');
    if (record.slug === 'downtown-san-martin') assert.ok(!record.images.some((image) =>
      image.originalSha256 === '5d729be36cd3b3c9a167eeb4ae6d5f68a2f9962c6c75e1f752414b7e5e73ef55'),
    'Downtown page 6 repeats the existing official bedroom image and must not be appended again');
  }
  assert.deepEqual(listFiles(ASSETS.slice(1)), [...referenced].sort(), 'Only selected galleries and verified model pages belong in the review asset folder');
});

test('documented equipment has page provenance; five public fallback pages preserve maps, tours, navigation and forms exactly', () => {
  for (const record of review.projects) {
    for (const group of ['amenities','finishes','features']) {
      assert.ok(Array.isArray(record[group]), record.slug + ':' + group);
      for (const item of record[group]) {
        assert.ok(item.label?.trim());
        assert.ok(item.pages.length > 0);
        for (const page of item.pages) assert.ok(Number.isInteger(page) && page >= 1 && page <= record.document.pageCount);
      }
    }
    assert.ok(Array.isArray(record.warnings) && record.warnings.length > 0);
    assert.equal(publicVersion(htmlFor(record.slug)), old(record.slug + '.html').toString(), record.slug + ': review must leave an exact original public fallback');
    for (const [path, label] of [
      ['/contacto.html', 'Consultar proyecto'], ['/agenda-asesoria.html', 'Agendar Asesoría'], ['/comparador-hipotecario.html', 'Simular crédito hipotecario'],
    ]) {
      const actions = tagAttributes(htmlFor(record.slug), 'a').filter((anchor) => anchor.href?.startsWith(path + '?'));
      assert.ok(actions.length > 0, record.slug + ': ' + label);
      for (const anchor of actions) assert.deepEqual([...new URL(anchor.href, 'https://sollahms.cl').searchParams], [['proyecto',record.slug]]);
    }
  }
});

test('brochure models do not create catalogue prices or alter A–E financial classification and verified surface minima', () => {
  const input = { incomeClp: 10_000_000, complementIncome: false, secondIncomeClp: 0, debtClp: 0,
    savings: 100_000_000, savingsCurrency: 'CLP', monthlySavingsClp: 1_000_000, horizonMonths: 24,
    downPaymentPercent: 20, years: 20, annualRatePercent: 4.5, rateConvention: 'effective', burdenPercent: 25 };
  const prior = JSON.parse(old('data/proyectos.json'));
  assert.equal(catalogue.filter((project) => verifiedProjectPrice(project, DATE)).length, 115);
  for (const slug of SLUGS) {
    const project = projectFor(slug);
    assert.equal(project.precioDesdeUF, null, slug);
    assert.equal(verifiedProjectPrice(project, DATE), null, slug);
    assert.equal(project.superficieDesdeM2, prior.find((row) => row.slug === slug).superficieDesdeM2);
    for (const candidate of [project, {...project, brochure: records.get(slug)}]) {
      const result = evaluateProject(candidate, input, mortgageData, DATE);
      assert.equal(result.category, 'E', slug);
      assert.equal(result.price, null);
      assert.equal(result.mortgage, null);
    }
  }
});

test('contact regression rejects synthetic brochure-derived catalogue amounts for all five identities without sending messages', async () => {
  let calls = 0, keys = 0;
  const handler = createContactHandler({ projectDataset: catalogue, mortgageDataset: mortgageData, now: () => NOW,
    getEnvironment: () => 'test', getApiKey: () => { keys++; return 'synthetic-test-key'; },
    fetchImpl: async () => { calls++; throw new Error('An unverified brochure price must not reach a provider.'); } });
  for (const slug of SLUGS) {
    const body = { nombre: 'Prueba de brochure', correo: 'qa@brochure.test.invalid', telefono: '+56900000000',
      mensaje: 'Prueba sintética sin envío real.', proyecto: slug, website: '', consent: true, startedAt: NOW - 5000,
      mortgage: { propertyUf: 3000, downPaymentPercent: 20, years: 20, annualRatePercent: 4.5, rateConvention: 'effective',
        bankId: null, simulatedAt: new Date(NOW - 1000).toISOString(), location: 'unknown', propertyValueOrigin: 'catalogue' } };
    const response = await handler.fetch(new Request('https://brochure.test.invalid/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://brochure.test.invalid' }, body: JSON.stringify(body),
    }));
    assert.equal(response.status, 400, slug);
  }
  assert.equal(calls, 0);
  assert.equal(keys, 0);
});

test('real packaging script publishes AJ review only in Preview and removes its content/assets from a non-Preview build', () => {
  // The temporary fixture runs the actual packaging code twice, sequentially.
  // It cannot overwrite the workspace dist or publish any deployment.
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'sollahms-aj-build-'));
  try {
    for (const folder of ['scripts','data','assets/css','assets/propiedades/aj-urbana-preview','assets/js']) {
      mkdirSync(join(fixtureRoot, folder), { recursive: true });
    }
    copyFileSync(resolve(ROOT, 'scripts/package-vercel.mjs'), join(fixtureRoot, 'scripts/package-vercel.mjs'));
    const protectedAsset = join(fixtureRoot, 'assets/js/unchanged.js');
    writeFileSync(protectedAsset, '/* historical asset */');
    writeFileSync(join(fixtureRoot, CSS), '/* review stylesheet */');
    writeFileSync(join(fixtureRoot, ASSETS.slice(1), 'review.jpg'), 'review-only synthetic asset');
    writeFileSync(join(fixtureRoot, 'data/proyectos.json'), current('data/proyectos.json'));
    writeFileSync(join(fixtureRoot, 'data/hipotecario.json'), current('data/hipotecario.json'));
    writeFileSync(join(fixtureRoot, 'data/brochures-aj-urbana.json'), current('data/brochures-aj-urbana.json'));
    writeFileSync(join(fixtureRoot, 'sitemap.xml'), current('sitemap.xml'));
    writeFileSync(join(fixtureRoot, 'robots.txt'), current('robots.txt'));
    for (const slug of SLUGS) writeFileSync(join(fixtureRoot, slug + '.html'), current(slug + '.html'));
    const script = join(fixtureRoot, 'scripts/package-vercel.mjs');
    const env = { ...process.env, VERCEL_GIT_COMMIT_REF: 'codex/integracion-financiera-sollahms' };
    execFileSync(process.execPath, [script], { cwd: fixtureRoot, env: {...env, VERCEL_ENV: 'preview'}, stdio: 'pipe' });
    for (const slug of SLUGS) {
      const html = readFileSync(join(fixtureRoot, 'dist', slug + '.html'), 'utf8');
      const original = htmlFor(slug);
      const expectedPreview = original.replace(/<!--AJ_PUBLIC_START-->[\s\S]*?<!--AJ_PUBLIC_END-->/g, '')
        .replace(/<!--AJ_PREVIEW_(?:START|END)-->/g, '')
        .replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
      assert.equal(html, expectedPreview, slug + ': Preview must contain exactly one selected gallery and equipment section');
      assert.ok(html.includes('noindex, nofollow'));
      assert.ok(html.includes(ASSETS), slug + ': Preview must show gallery/plan assets');
      for (const block of original.matchAll(/<!--AJ_PUBLIC_START-->([\s\S]*?)<!--AJ_PUBLIC_END-->/g)) {
        assert.ok(!html.includes(block[0]), 'Preview must remove public fallback markers');
      }
      assert.doesNotMatch(html, /<!--AJ_(?:PUBLIC|PREVIEW)_(?:START|END)-->/);
    }
    assert.ok(existsSync(join(fixtureRoot, 'dist', CSS)));
    assert.ok(existsSync(join(fixtureRoot, 'dist', ASSETS.slice(1), 'review.jpg')));
    assert.equal(existsSync(join(fixtureRoot, 'dist/data/brochures-aj-urbana.json')), false, 'Review ledger is not public JSON');
    execFileSync(process.execPath, [script], { cwd: fixtureRoot, env: {...env, VERCEL_ENV: 'production'}, stdio: 'pipe' });
    for (const slug of SLUGS) {
      const html = readFileSync(join(fixtureRoot, 'dist', slug + '.html'), 'utf8');
      assert.equal(html, old(slug + '.html').toString(), slug + ': non-Preview build must retain only the original fiche');
      assert.ok(!html.includes(ASSETS));
      assert.ok(!html.includes('aj-brochure-preview.css'));
      assert.doesNotMatch(html, /<!--AJ_(?:PUBLIC|PREVIEW)_(?:START|END)-->/);
    }
    assert.equal(existsSync(join(fixtureRoot, 'dist', CSS)), false);
    assert.equal(existsSync(join(fixtureRoot, 'dist', ASSETS.slice(1))), false);
    assert.equal(existsSync(join(fixtureRoot, 'dist/data/brochures-aj-urbana.json')), false);
    assert.equal(readFileSync(join(fixtureRoot, 'dist/assets/js/unchanged.js'), 'utf8'), '/* historical asset */');
    assert.ok(readFileSync(join(fixtureRoot, 'dist/data/proyectos.json')).equals(current('data/proyectos.json')));
    const defaultEnvironment = { ...env };
    delete defaultEnvironment.VERCEL_ENV;
    execFileSync(process.execPath, [script], { cwd: fixtureRoot, env: defaultEnvironment, stdio: 'pipe' });
    for (const slug of SLUGS) assert.equal(readFileSync(join(fixtureRoot, 'dist', slug + '.html'), 'utf8'), old(slug + '.html').toString());
    assert.equal(existsSync(join(fixtureRoot, 'dist', ASSETS.slice(1))), false, 'An unspecified environment must also exclude unlicensed review assets');
    assert.throws(() => execFileSync(process.execPath, [script], { cwd: fixtureRoot,
      env: { ...env, VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'codex/unapproved-test-branch' }, stdio: 'pipe' }),
    /Unexpected branch for this review build/, 'Preview builds must reject an unrelated branch');
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
