import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { assertBrochureCatalogue } from '../scripts/brochure-publication.mjs';
import { NORTE_VERDE_SLUGS, NORTE_VERDE_RETIRED_SLUGS, NORTE_VERDE_MANIFEST,
  NORTE_VERDE_DOCUMENTS, NORTE_VERDE_PACKAGER_SHA256, NORTE_VERDE_ECASA_QUALITY_SHA256, NORTE_VERDE_STYLESHEET_SHA256,
  NORTE_VERDE_OTHER_CATALOGUE_SHA256, NORTE_VERDE_OTHER_RESEARCH_SHA256,
  NORTE_VERDE_OTHER_PREVIEW_CATALOGUE_SHA256,
  NORTE_VERDE_OTHER_LEDGER_SHA256, readNorteVerdeBaseline, norteVerdeFingerprint,
  assertNorteVerdeCatalogue, restoreNorteVerdeCatalogue, validateNorteVerdeReview,
  verifyNorteVerdeAssets, verifyNorteVerdeAssetFiles } from '../scripts/norte-verde-publication.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(resolve(ROOT, path));
const json = path => JSON.parse(read(path));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const baseline = readNorteVerdeBaseline();
const independentSlugs = [
  'bordevivo', 'carmen-marin', 'edificio-ecuador', 'edif-origen-atacama-3008',
  'edificio-dual-390-lto', 'edificio-lira-622', 'edificio-plaza-nova',
  'edificio-san-francisco-1204', 'edificio-verne', 'irarrazaval', 'parque-panama',
  'parque-quinta', 'playa-penuelas', 'playa-serena', 'quintavista',
  'vicuna-mackenna-6896', 'vista-bulnes',
];
const otherSlugs = new Set(baseline.otherHtml.map(row => row.path.replace(/\.html$/, '')));
const review = () => json(NORTE_VERDE_MANIFEST);
const catalogue = () => json('data/proyectos.json');
const sourceBytes = asset => Buffer.from('Synthetic extraction: ' + asset.localPath);
function fixture() {
  const projects = independentSlugs.map((slug, index) => {
    const document = { localPath: '/assets/brochures/norte-verde/' + slug + '.pdf', sha256: NORTE_VERDE_DOCUMENTS[slug][0], pageCount: NORTE_VERDE_DOCUMENTS[slug][1] };
    const image = { localPath: '/assets/propiedades/norte-verde/' + slug + '/facade.webp', sha256: sha('image' + index),
      sourceSha256: document.sha256, sourcePage: 1, imageIndex: 0, originalSha256: sha('native' + index), width: 1600, height: 900 };
    const plan = { localPath: '/assets/propiedades/norte-verde/' + slug + '/plan-a.webp', sha256: sha('plan' + index),
      sourceSha256: document.sha256, sourcePage: 3, width: 1400, height: 1000 };
    return { slug, name: 'Proyecto ' + index, location: { address: 'Calle ' + index }, document,
      images: [image], cover: image.localPath, models: [{ label: 'A', bedrooms: 1, bathrooms: 1, sourcePage: 3,
        areas: [{ label: 'Superficie municipal', valueM2: 30 }, { label: 'Superficie construida', valueM2: 32 }], plan }] };
  });
  return { schemaVersion: 1, baseline: structuredClone(baseline), excluded: NORTE_VERDE_RETIRED_SLUGS.map(slug => ({ slug })), projects };
}

test('Norte Verde baseline independently freezes twenty historical projects and 117 untouched developer fiches', () => {
  assert.equal(baseline.commit, 'dfa5b5b73173b246fd29921ad3514fa53e4bf0c4');
  assert.equal(baseline.projects.length, 20); assert.equal(baseline.otherHtml.length, 117);
  assert.deepEqual(NORTE_VERDE_SLUGS, independentSlugs);
  assert.deepEqual(NORTE_VERDE_RETIRED_SLUGS, ['vergara-domeyko', 'atelier-prat-oficinas', 'corrientes-oficinas']);
  const original = path => execFileSync('git', ['show', baseline.commit + ':' + path], { cwd: ROOT });
  const originalProjects = JSON.parse(original('data/proyectos.json'));
  assert.deepEqual(baseline.projects, originalProjects.filter(row => row.inmobiliaria === 'Norte Verde'));
  assert.deepEqual(baseline.catalogueOrder, originalProjects.map(row => row.slug));
  assert.deepEqual(new Set(baseline.otherHtml.map(row => row.path)),
    new Set(originalProjects.filter(row => row.inmobiliaria !== 'Norte Verde').map(row => row.slug + '.html')));
});

test('Norte Verde review rejects missing projects, duplicate identities, foreign PDF bindings and relabelled surfaces', () => {
  assert.equal(validateNorteVerdeReview(fixture()).length, 51);
  const mutations = [
    value => value.projects.pop(),
    value => { value.projects[0].slug = 'vergara-domeyko'; },
    value => { value.projects[0].name = value.projects[1].name; },
    value => { value.projects[0].location.address = value.projects[1].location.address; },
    value => { value.projects[0].document.sha256 = value.projects[1].document.sha256; },
    value => { value.projects[0].images[0].sourceSha256 = value.projects[1].document.sha256; },
    value => { value.projects[0].images[0].sourcePage = 999; },
    value => { value.projects[0].images.push(structuredClone(value.projects[0].images[0])); },
    value => { value.projects[0].images[0].originalSha256 = value.projects[1].images[0].originalSha256; },
    value => { value.projects[0].cover = value.projects[1].cover; },
    value => { value.projects[0].models[0].plan.sourceSha256 = value.projects[1].document.sha256; },
    value => { value.projects[0].models[0].sourcePage = 2; },
    value => { value.projects[0].models[0].areas[0].valueM2 = Number.NaN; },
    value => { value.projects[0].models[0].areas[0].label = ''; },
    value => { value.projects[0].models = []; },
    value => { value.projects[0].images[0].localPath = '/assets/propiedades/norte-verde/other/facade.webp'; },
    value => { value.baseline.otherCatalogueSha256 = 'a'.repeat(64); },
    value => value.excluded.pop(),
  ];
  for (const mutate of mutations) { const value = fixture(); mutate(value); assert.throws(() => validateNorteVerdeReview(value), /Norte Verde:/); }
  const noPlan = fixture(); noPlan.projects[0].models = []; noPlan.projects[0].planPendingNote = 'El PDF no contiene planos legibles.';
  assert.equal(validateNorteVerdeReview(noPlan).length, 50);
});

test('Norte Verde asset verifier refuses corruption and symlink substitutions in a synthetic source package', async () => {
  const value = fixture();
  for (const record of value.projects) {
    for (const asset of [...record.images, ...record.models.map(model => model.plan)]) {
      asset.sha256 = sha(sourceBytes(asset)); asset.sourceSha256 = record.document.sha256;
    }
  }
  const assets = validateNorteVerdeReview(value).filter(asset => asset.kind !== 'document');
  const root = mkdtempSync(resolve(tmpdir(), 'sollahms-norte-verde-'));
  try {
    for (const asset of assets) { const path = resolve(root, asset.localPath.slice(1)); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, sourceBytes(asset)); }
    assert.equal((await verifyNorteVerdeAssetFiles(assets, { root })).length, 34);
    const selected = resolve(root, value.projects[0].images[0].localPath.slice(1));
    writeFileSync(selected, 'Corrupted photo'); await assert.rejects(verifyNorteVerdeAssetFiles(assets, { root }), /SHA-256/);
    rmSync(selected); const substitute = resolve(root, 'substitute.webp'); writeFileSync(substitute, sourceBytes(value.projects[0].images[0]));
    symlinkSync(substitute, selected); await assert.rejects(verifyNorteVerdeAssetFiles(assets, { root }), /real same-workspace file/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('Norte Verde successor permits only seventeen authorized projects while retaining all historical catalogue pins', () => {
  const current = catalogue();
  const approved = new Set(independentSlugs);
  const synthetic = baseline.catalogueOrder.flatMap(slug => {
    if (otherSlugs.has(slug)) return current.filter(row => row.slug === slug);
    return approved.has(slug) ? baseline.projects.filter(row => row.slug === slug) : [];
  });
  assert.equal(synthetic.length, 134); assert.doesNotThrow(() => assertNorteVerdeCatalogue(synthetic));
  assert.doesNotThrow(() => assertBrochureCatalogue(synthetic));
  assert.equal(restoreNorteVerdeCatalogue(synthetic).length, 137);
  for (const mutate of [
    rows => rows.push(structuredClone(rows[0])),
    rows => { rows.find(row => row.inmobiliaria === 'Norte Verde').slug = 'vergara-domeyko'; },
    rows => { rows.find(row => row.inmobiliaria === 'Norte Verde').detalleUrl = '/new-route.html'; },
    rows => { rows.find(row => row.slug === 'parque-germania').precioDesdeUF = 999999; },
  ]) { const rows = structuredClone(synthetic); mutate(rows); assert.throws(() => assertNorteVerdeCatalogue(rows), /Norte Verde:/); }
});

test('Norte Verde update preserves the catalogue, research, ledger and HTML bytes of all 117 other projects', () => {
  for (const [file, expected] of [['data/proyectos.json', NORTE_VERDE_OTHER_CATALOGUE_SHA256],
    ['data/fichas-proyectos.json', NORTE_VERDE_OTHER_RESEARCH_SHA256], ['data/registro-fichas.json', NORTE_VERDE_OTHER_LEDGER_SHA256]]) {
    const others = json(file).filter(row => otherSlugs.has(row.slug));
    assert.equal(others.length, 117, file); assert.equal(norteVerdeFingerprint(others), expected, file);
  }
  for (const row of baseline.otherHtml) assert.equal(sha(read(row.path)), row.sha256, row.path);
});

test('Norte Verde catalogue, sitemap and trusted contexts expose seventeen existing routes and exclude the three retirements', () => {
  const rows = catalogue(); assert.equal(rows.length, 134); assertNorteVerdeCatalogue(rows);
  const records = rows.filter(row => row.inmobiliaria === 'Norte Verde');
  assert.deepEqual(new Set(records.map(row => row.slug)), new Set(independentSlugs));
  const sitemap = read('sitemap.xml').toString();
  const context = read('lib/project-context.mjs').toString();
  for (const slug of NORTE_VERDE_RETIRED_SLUGS) {
    assert.equal(existsSync(resolve(ROOT, slug + '.html')), false, slug);
    assert.ok(!sitemap.includes('/' + slug + '.html')); assert.ok(!context.includes('"' + slug + '"'));
  }
  for (const record of records) {
    assert.equal(record.detalleUrl, '/' + record.slug + '.html');
    assert.ok(existsSync(resolve(ROOT, record.slug + '.html')));
    assert.ok(sitemap.includes('https://sollahms.cl' + record.detalleUrl));
    assert.ok(context.includes('"' + record.slug + '"'));
  }
});

test('Norte Verde fiches cite only supplied PDFs and preserve project-specific consultation and booking links', () => {
  const manifest = review(); validateNorteVerdeReview(manifest);
  const research = new Map(json('data/fichas-proyectos.json').map(row => [row.slug, row]));
  const rows = new Map(catalogue().map(row => [row.slug, row]));
  for (const record of manifest.projects) {
    const data = research.get(record.slug), project = rows.get(record.slug), html = read(record.slug + '.html').toString();
    assert.ok(data.sourceUrl.endsWith(record.document.localPath), record.slug + ': PDF source');
    assert.ok(!html.includes('https://norte-verde.cl/') && !html.includes('norteverde.viewin360.co'), record.slug + ': only documentary source');
    assert.ok(html.includes('href="' + record.document.localPath + '"'), record.slug + ': original brochure');
    assert.ok(html.includes('/contacto.html?proyecto=' + record.slug), record.slug + ': consultation');
    assert.ok(html.includes('/agenda-asesoria.html?proyecto=' + record.slug), record.slug + ': booking');
    for (const field of ['precioDesdeUF', 'entrega', 'estado']) {
      if (!record.commercialEvidence?.[field]) assert.equal(project[field] ?? null, null, record.slug + ': unsupported ' + field);
    }
    assert.ok(html.includes(record.cover), record.slug + ': documented facade');
    assert.ok(data.images.every(image => record.images.some(source => source.localPath === image.localPath)), record.slug + ': no borrowed gallery');
    for (const slug of NORTE_VERDE_RETIRED_SLUGS) assert.ok(!html.includes('/' + slug + '.html'));
  }
});

test('Norte Verde model and gallery markup retains same-project assets and printed municipal versus constructed labels', () => {
  assert.equal(sha(read('scripts/package-vercel.mjs')), NORTE_VERDE_PACKAGER_SHA256, 'frozen successor package code');
  assert.equal(sha(read('scripts/ecasa-image-quality.mjs')), NORTE_VERDE_ECASA_QUALITY_SHA256, 'exact guarded Ecasa catalogue extension');
  assert.equal(sha(read('assets/css/norte-verde.css')), NORTE_VERDE_STYLESHEET_SHA256, 'only the exact reviewed Norte Verde stylesheet is permitted');
  const blocked = spawnSync(process.execPath, [resolve(ROOT, 'scripts/package-vercel.mjs')],
    { cwd: ROOT, env: { ...process.env, VERCEL_ENV: 'production' }, encoding: 'utf8', timeout: 15_000 });
  assert.equal(blocked.error, undefined); assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /Norte Verde update is authorized for Preview only/);
  const manifest = review(); validateNorteVerdeReview(manifest);
  for (const record of manifest.projects) {
    const html = read(record.slug + '.html').toString();
    for (const image of record.images) assert.ok(html.includes(image.localPath), record.slug + ': reviewed image');
    for (const model of record.models) {
      assert.ok(html.includes(model.plan.localPath), record.slug + ': model ' + model.label);
      assert.ok(html.includes(model.label), record.slug + ': model label');
      for (const area of model.areas) assert.ok(html.includes(area.label), record.slug + ': printed surface classification');
      assert.equal(model.plan.sourcePage, model.sourcePage); assert.equal(model.plan.sourceSha256, record.document.sha256);
    }
    if (!record.models.length) assert.ok(html.includes(record.planPendingNote), record.slug + ': plan limitation');
  }
});

test('all Norte Verde original PDFs, native gallery derivatives and plans match the reviewed SHA-256 inventory', async () => {
  const manifest = review(); const assets = await verifyNorteVerdeAssets(manifest, { root: ROOT });
  assert.equal(assets.filter(asset => asset.kind === 'document').length, 17);
  assert.equal(new Set(assets.map(asset => asset.localPath)).size, assets.length);
});

test('Norte Verde deployment package publishes exactly seventeen projects with intact covers, plans and original brochures', async () => {
  const root = resolve(process.env.SOLLAHMS_NV_BUILD_ROOT || resolve(ROOT, 'dist'));
  const manifest = review(); const rows = JSON.parse(readFileSync(resolve(root, 'data/proyectos.json')));
  assert.equal(rows.length, 134); assert.equal(new Set(rows.map(row => row.slug)).size, 134);
  assert.deepEqual(new Set(rows.filter(row => row.inmobiliaria === 'Norte Verde').map(row => row.slug)), new Set(independentSlugs));
  const others = rows.filter(row => row.inmobiliaria !== 'Norte Verde');
  assert.equal(others.length, 117);
  assert.equal(norteVerdeFingerprint(others), NORTE_VERDE_OTHER_PREVIEW_CATALOGUE_SHA256,
    'all117published rows and covers must equal the independently reviewed preceding protected Preview');
  const assets = await verifyNorteVerdeAssets(manifest, { root });
  assert.equal(assets.filter(asset => asset.kind === 'document').length, 17);
  for (const slug of NORTE_VERDE_RETIRED_SLUGS) assert.equal(existsSync(resolve(root, slug + '.html')), false);
  for (const record of manifest.projects) {
    const html = readFileSync(resolve(root, record.slug + '.html')).toString();
    for (const path of [record.cover, record.document.localPath, ...record.models.map(model => model.plan.localPath)]) assert.ok(html.includes(path), record.slug);
    assert.equal(rows.find(row => row.slug === record.slug).imagenPrincipal, record.cover);
  }
});
