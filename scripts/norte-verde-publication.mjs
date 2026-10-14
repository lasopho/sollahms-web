import { createHash } from 'node:crypto';
import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const NORTE_VERDE_SLUGS = Object.freeze([
  'bordevivo', 'carmen-marin', 'edificio-ecuador', 'edif-origen-atacama-3008',
  'edificio-dual-390-lto', 'edificio-lira-622', 'edificio-plaza-nova',
  'edificio-san-francisco-1204', 'edificio-verne', 'irarrazaval', 'parque-panama',
  'parque-quinta', 'playa-penuelas', 'playa-serena', 'quintavista',
  'vicuna-mackenna-6896', 'vista-bulnes',
]);
export const NORTE_VERDE_RETIRED_SLUGS = Object.freeze([
  'vergara-domeyko', 'atelier-prat-oficinas', 'corrientes-oficinas',
]);
export const NORTE_VERDE_MANIFEST = 'data/brochures-norte-verde.json';
export const NORTE_VERDE_PACKAGER_SHA256 = '2725cc7297f3601d97a0bebd94c1ab2204ea1a4451428de9be3f45959ed43c97';
export const NORTE_VERDE_ECASA_QUALITY_SHA256 = 'ba4619fab8592583b42c6e6468e0ed11e7a02f26bd8bd245dd4590a753de5e69';
export const NORTE_VERDE_STYLESHEET_SHA256 = '6751bd4aaae873c44a7135df46178c7a834de0a266fbf8db847d458380a913b7';
// Independently read from the seventeen supplied originals, before generating
// the publication manifest. A renamed or borrowed PDF cannot approve itself.
export const NORTE_VERDE_DOCUMENTS = Object.freeze({
  'bordevivo': ['a03d8cfd168820d42920846b85eb7fee023feaf6277118661f5b480cfac040a6', 25],
  'carmen-marin': ['7fe99d4c2c4adde49670b8a849a7d800fc473655a1568b4c27fd1735e5950951', 16],
  'edificio-ecuador': ['9e8e5d5e8eb1657ac0de438dae88581d3bdda1f11f1c636e84df139091ba345b', 8],
  'edif-origen-atacama-3008': ['a498c413854ec372475692f7fde9a208cf1d9d8d0ea8a89a37445a3ebf497d8a', 10],
  'edificio-dual-390-lto': ['0e29ce7b9f49f96b57bf1ccaabae759cbf379a5cdd9aabc00bffd19139db5233', 15],
  'edificio-lira-622': ['b0838a91b908c1c84e844a7c053a7bc7b34edd933b2af4e57abcd7aeec88b691', 14],
  'edificio-plaza-nova': ['b6179e82cd769e9480274642092e7c64d5a61d5b21cfdebba96fee52d450ca2b', 16],
  'edificio-san-francisco-1204': ['060a1e709069e01439b93f85c292e1481b2380667065b23f71e2e41c6841319d', 11],
  'edificio-verne': ['f532853b33840d2d53b80175219fe85bb66295d8dbfcb513c6b0b84addc0ee69', 20],
  'irarrazaval': ['e8919b2e367d1884098ed11f244786bf8f4fefbac2355bc1fd57717261f0d2d2', 15],
  'parque-panama': ['15a75e8590a12a3154b65472fab63a4d113515b2bcee1d5b2c9bcdeb3f253c11', 9],
  'parque-quinta': ['71586591136ea9ce406658f36b73ec3c7e50609d5c667b6efc6f5f7a94bf5b3c', 17],
  'playa-penuelas': ['96405c2b508095ed236a8b3135dc1b1fc7b0d01ce28a117854afbca1dced2ead', 8],
  'playa-serena': ['66e3bcb903fceb214a2835c3e5d522f9203849974ef806b02c8f8c69897e8320', 22],
  'quintavista': ['b7526e1c5032730958cfd2d3eed3128ba7e3df5052de811920f955343ab05900', 10],
  'vicuna-mackenna-6896': ['17f3c20e370f40019c3ceda6d9345c4f55bcdfdd5a8e0455ebc11a6f6770379f', 13],
  'vista-bulnes': ['9fcfe8660c212aaa39fe4f89511fdfe7e371d4fb98d17260be6327a4fc8c6b83', 23],
});
export const NORTE_VERDE_BASELINE_SHA256 = '2874865cb1ba9f323c1ed669eb673548776877d34927e21fd83887beaea3ec23';
export const NORTE_VERDE_OTHER_CATALOGUE_SHA256 = '88df5b3adfbad85f23e99c556c2140493939e29ee37bec4378774b10fb6760f4';
// Independently fingerprinted from the preceding protected Leben Preview,
// whose approved Ecasa/Leben card-cover projections differ from raw source.
export const NORTE_VERDE_OTHER_PREVIEW_CATALOGUE_SHA256 = 'a1d04b9c18592a82666343cf836f8eccd448e85c43fe1e8ed40557be11f791f1';
export const NORTE_VERDE_OTHER_RESEARCH_SHA256 = '4cdf9a50ccf52e7557708a19e0443fc06fd247349820f00b71c82585726cbf43';
export const NORTE_VERDE_OTHER_LEDGER_SHA256 = '0b816adcdeaab2747b36c7253a03d37581ab83d6226eaf8d300b53ca68baacf3';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const HASH = /^[a-f0-9]{64}$/;
const requireEvidence = (value, message) => { if (!value) throw new Error('Norte Verde: ' + message); };
const digest = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonical(item)])) : value;
export const norteVerdeFingerprint = value => digest(JSON.stringify(canonical(value)));
const sameMembers = (actual, expected) => Array.isArray(actual) && actual.length === expected.length &&
  new Set(actual).size === actual.length && expected.every(value => actual.includes(value));
const text = value => typeof value === 'string' && value.trim().length > 0;
const positive = value => Number.isInteger(value) && value > 0;
const identity = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

export function readNorteVerdeBaseline() {
  const bytes = readFileSync(new URL('../data/norte-verde-baseline.json', import.meta.url));
  requireEvidence(digest(bytes) === NORTE_VERDE_BASELINE_SHA256, 'frozen historical baseline bytes changed');
  return JSON.parse(bytes);
}

export function assertNorteVerdeCatalogue(projects) {
  requireEvidence(Array.isArray(projects), 'catalogue must be an array');
  const nordico = projects.filter(project => project.slug === 'edificio-nordico');
  // The historical Nórdico guard exercises its verified minimal identity.
  // Its exact full data remains mandatory in the actual successor catalogue.
  const minimallyVerifiedNordico = nordico.length === 1 && nordico[0].inmobiliaria === 'Leben' &&
    nordico[0].detalleUrl === '/edificio-nordico.html' && nordico[0].verificacion?.fuente === 'https://nordico.ileben.cl/' &&
    nordico[0].verificacion?.estadoFuente === 'verified';
  requireEvidence(projects.length === 134 && new Set(projects.map(project => project.slug)).size === 134 && minimallyVerifiedNordico,
    'catalogue must contain 134 unique projects and one verified Nórdico identity');
  const approved = projects.filter(project => project.inmobiliaria === 'Norte Verde');
  requireEvidence(sameMembers(approved.map(project => project.slug), NORTE_VERDE_SLUGS), 'exactly 17 authorized Norte Verde identities are required');
  requireEvidence(!projects.some(project => NORTE_VERDE_RETIRED_SLUGS.includes(project.slug)), 'retired Norte Verde identities must stay absent');
  requireEvidence(approved.every(project => project.detalleUrl === '/' + project.slug + '.html' && text(project.nombre)), 'authorized routes must preserve their existing slugs');
  for (const field of ['nombre', 'direccion']) {
    const values = approved.map(project => project[field]).filter(text).map(identity);
    requireEvidence(new Set(values).size === values.length, 'duplicate authorized ' + field);
  }
  const others = projects.filter(project => project.inmobiliaria !== 'Norte Verde');
  requireEvidence(others.length === 117 && norteVerdeFingerprint(others) === NORTE_VERDE_OTHER_CATALOGUE_SHA256,
    'all 117 other developers must remain byte-equivalent to the frozen catalogue');
  return projects;
}

// Reconstruct all twenty historical Norte Verde rows and their original order
// before applying existing Ecasa/Ingevec/Nórdico guards. No prior pin changes.
export function restoreNorteVerdeCatalogue(projects) {
  const baseline = readNorteVerdeBaseline();
  const bySlug = new Map(projects.filter(project => project.inmobiliaria !== 'Norte Verde').map(project => [project.slug, project]));
  for (const project of baseline.projects) bySlug.set(project.slug, structuredClone(project));
  requireEvidence(bySlug.size === 137, 'historical catalogue restoration lost a project');
  return baseline.catalogueOrder.map(slug => bySlug.get(slug));
}

export function validateNorteVerdeReview(review) {
  const baseline = readNorteVerdeBaseline();
  requireEvidence(review?.schemaVersion === 1 && sameMembers(review.projects?.map(record => record.slug), NORTE_VERDE_SLUGS),
    'the exact seventeen original-brochure projects are required');
  requireEvidence(review.baseline?.commit === baseline.commit &&
    review.baseline.otherCatalogueSha256 === NORTE_VERDE_OTHER_CATALOGUE_SHA256 &&
    review.baseline.otherResearchSha256 === NORTE_VERDE_OTHER_RESEARCH_SHA256 &&
    review.baseline.otherLedgerSha256 === NORTE_VERDE_OTHER_LEDGER_SHA256 &&
    norteVerdeFingerprint(review.baseline.otherHtml) === norteVerdeFingerprint(baseline.otherHtml), 'independent preservation evidence changed');
  requireEvidence(sameMembers(review.excluded?.map(record => record.slug), NORTE_VERDE_RETIRED_SLUGS), 'the three retired identities must be recorded');
  const names = new Set(), addresses = new Set(), sourceHashes = new Set(), paths = new Set(), imageHashes = new Set(), originalImageHashes = new Set(), planHashes = new Set(), assets = [];
  const approve = (asset, prefix, kind) => {
    requireEvidence(asset && typeof asset.localPath === 'string' && asset.localPath.startsWith(prefix) &&
      /^[a-z0-9/._-]+\.(?:webp|png|jpe?g|pdf)$/.test(asset.localPath.slice(1)) &&
      !asset.localPath.includes('..') && !paths.has(asset.localPath) && HASH.test(asset.sha256), 'unsafe, duplicated or unhashed ' + kind + ' path');
    requireEvidence(kind === 'document' ? asset.localPath.endsWith('.pdf') : !asset.localPath.endsWith('.pdf') && positive(asset.width) && positive(asset.height),
      'encoded dimensions or source format missing for ' + kind);
    paths.add(asset.localPath); assets.push({ ...asset, kind });
  };
  for (const record of review.projects) {
    requireEvidence(text(record.name) && !names.has(identity(record.name)), 'missing or duplicate project name');
    names.add(identity(record.name));
    const address = record.location?.address;
    if (text(address)) { requireEvidence(!addresses.has(identity(address)), 'duplicate project address'); addresses.add(identity(address)); }
    const document = record.document;
    requireEvidence(document && HASH.test(document.sha256) && !sourceHashes.has(document.sha256) && positive(document.pageCount), 'missing, repeated or invalid original PDF');
    const original = NORTE_VERDE_DOCUMENTS[record.slug];
    requireEvidence(document.sha256 === original[0] && document.pageCount === original[1], 'original PDF differs from the independently inspected project source');
    sourceHashes.add(document.sha256);
    approve(document, '/assets/brochures/norte-verde/', 'document');
    requireEvidence(document.localPath === '/assets/brochures/norte-verde/' + record.slug + '.pdf', 'original brochure belongs to another project');
    requireEvidence(Array.isArray(record.images) && record.images.length > 0 && Array.isArray(record.models), 'photo/plan inventories must be explicit');
    const nativeImages = new Set();
    for (const image of record.images) {
      requireEvidence(image.sourceSha256 === document.sha256 && positive(image.sourcePage) && image.sourcePage <= document.pageCount &&
        Number.isInteger(image.imageIndex) && image.imageIndex >= 0 && HASH.test(image.originalSha256), 'image is not bound to its own original PDF');
      const key = image.sourcePage + ':' + image.imageIndex;
      requireEvidence(!nativeImages.has(key) && !imageHashes.has(image.sha256) && !originalImageHashes.has(image.originalSha256), 'repeated native/gallery photograph');
      nativeImages.add(key); imageHashes.add(image.sha256); originalImageHashes.add(image.originalSha256);
      approve(image, '/assets/propiedades/norte-verde/' + record.slug + '/', 'image');
    }
    requireEvidence(record.images.some(image => image.localPath === record.cover), 'cover must belong to this project gallery');
    const modelIds = new Set();
    for (const model of record.models) {
      requireEvidence(text(model.label) && !modelIds.has(model.label) && positive(model.sourcePage) && model.sourcePage <= document.pageCount,
        'missing, repeated or foreign model identity');
      modelIds.add(model.label);
      requireEvidence((model.bedrooms === null || Number.isInteger(model.bedrooms) && model.bedrooms >= 0) &&
        (model.bathrooms === null || positive(model.bathrooms)), 'undocumented rooms must be explicitly null');
      requireEvidence(Array.isArray(model.areas) && model.areas.every(area => text(area.label) &&
        (area.valueM2 === null || typeof area.valueM2 === 'number' && Number.isFinite(area.valueM2) && area.valueM2 >= 0)), 'printed surface labels and values must be preserved');
      requireEvidence(model.plan?.sourceSha256 === document.sha256 && model.plan.sourcePage === model.sourcePage, 'plan belongs to another PDF or model page');
      requireEvidence(!planHashes.has(model.plan.sha256), 'repeated extracted plan');
      planHashes.add(model.plan.sha256);
      approve(model.plan, '/assets/propiedades/norte-verde/' + record.slug + '/', 'plan');
    }
    requireEvidence(record.models.length > 0 || text(record.planPendingNote), 'missing plans require a documented limitation');
  }
  return assets;
}

export async function verifyNorteVerdeAssetFiles(assets, { root = ROOT } = {}) {
  const resolvedRoot = realpathSync(root);
  for (const asset of assets) {
    requireEvidence(typeof asset.localPath === 'string' && /^\/assets\/[a-z0-9/._-]+$/.test(asset.localPath) &&
      !asset.localPath.includes('..') && HASH.test(asset.sha256), 'invalid asset verification inventory');
    const path = resolve(resolvedRoot, asset.localPath.slice(1));
    const stat = lstatSync(path);
    requireEvidence(stat.isFile() && !stat.isSymbolicLink() && realpathSync(path) === path, 'asset must be a real same-workspace file: ' + asset.localPath);
    requireEvidence(digest(readFileSync(path)) === asset.sha256, 'asset SHA-256 differs from the reviewed PDF extraction: ' + asset.localPath);
  }
  return assets;
}

export async function verifyNorteVerdeAssets(review, options) {
  return verifyNorteVerdeAssetFiles(validateNorteVerdeReview(review), options);
}
