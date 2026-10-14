import { createHash } from 'node:crypto';

export const ECASA_COMMERCIAL_SLUGS = Object.freeze([
  'lomas-de-puyai', 'ferroparque', 'edificio-bezanilla', 'endemico',
  'terratolten-1', 'wayra', 'alto-san-joaquin-3', 'enlace-mackenna',
  'ferroparque-2', 'espacio-victoria', 'lamara', 'terratolten-3',
  'lomas-de-puyai-3', 'cumbres-de-penuelas', 'aires-la-florida-2',
  'conecta-huechuraba', 'urban-la-florida', 'alto-san-joaquin',
  'alto-san-joaquin-2', 'nucleo-costanera', 'terratolten-2', 'nucleo-costanera-2',
]);
export const ECASA_SLUGS = Object.freeze([
  'lomas-de-puyai', 'ferroparque', 'edificio-bezanilla', 'endemico',
  'terratolten', 'wayra', 'enlace-mackenna', 'espacio-victoria', 'lamara',
  'cumbres-de-penuelas', 'aires-la-florida-2', 'conecta-huechuraba',
  'urban-la-florida', 'alto-san-joaquin', 'nucleo-costanera',
]);
const CONSOLIDATED_PROJECTS = Object.freeze({
  'terratolten-1': 'terratolten', 'terratolten-2': 'terratolten', 'terratolten-3': 'terratolten',
  'lomas-de-puyai-3': 'lomas-de-puyai', 'ferroparque-2': 'ferroparque',
  'alto-san-joaquin-2': 'alto-san-joaquin', 'alto-san-joaquin-3': 'alto-san-joaquin',
  'nucleo-costanera-2': 'nucleo-costanera',
});
export const ECASA_PROJECT_BY_COMMERCIAL_SLUG = Object.freeze(Object.fromEntries(
  ECASA_COMMERCIAL_SLUGS.map(slug => [slug, CONSOLIDATED_PROJECTS[slug] ?? slug])));
const COMMERCIAL_STAGES = Object.freeze({
  'terratolten-1': 'Etapa 1', 'terratolten-2': 'Etapa 2', 'terratolten-3': 'Etapa 3',
  'ferroparque-2': 'Etapa 2', 'alto-san-joaquin-2': 'Etapa 2',
  'alto-san-joaquin-3': 'Etapa 3', 'nucleo-costanera-2': 'Etapa 2',
  'lomas-de-puyai-3': 'Etapa 3', 'aires-la-florida-2': 'Etapa 2',
});
const UNDOCUMENTED_ASSET_ORIGINS = Object.freeze([
  'alto-san-joaquin-2', 'alto-san-joaquin-3', 'nucleo-costanera-2', 'lomas-de-puyai-3',
  'terratolten-2', 'lomas-de-puyai', 'ferroparque-2', 'terratolten-3',
]);
export const ECASA_RETIRED_SLUGS = Object.freeze([
  'bosquemar', 'altos-del-wayra', 'robles-del-aconcagua', 'el-real', 'edificio-ha-strip-center',
]);
const HASH = /^[a-f0-9]{64}$/;
const requireEvidence = (condition, message) => {
  if (!condition) throw new Error('Ecasa: ' + message);
};
const sameMembers = (actual, expected) => Array.isArray(actual) && actual.length === expected.length &&
  new Set(actual).size === actual.length && expected.every(value => actual.includes(value));
const stageFor = slug => COMMERCIAL_STAGES[slug] ?? null;
const sourceDocuments = record => record.documents ?? (record.document ? [record.document] : []);

function validateDocuments(record) {
  const documents = sourceDocuments(record);
  requireEvidence(Array.isArray(documents) && new Set(documents.map(document => document.sha256)).size === documents.length,
    'duplicate source within ' + record.slug);
  for (const document of documents) {
    requireEvidence(document.sourceChannel === 'Ecasa/user_supplied' && HASH.test(document.sha256) &&
      /^[^/\\]+\.pdf$/i.test(document.fileName) && Number.isInteger(document.pageCount) && document.pageCount > 0,
      'invalid source for ' + record.slug);
  }
  return new Map(documents.map(document => [document.sha256, document]));
}

// Ecasa has its own documentary and channel scope. AJ/Ingevec attestations
// cannot grant a public license to this independent batch.
export function ecasaPublication(review) {
  const rights = review.publicationRights;
  requireEvidence(rights?.sourceChannel === 'Ecasa/user_supplied' &&
    rights.protectedPreview === 'authorized_by_user' &&
    rights.productionPolicy === 'requires_verified_contract_scope', 'protected review authorization is missing');
  requireEvidence(rights.contractScope?.status === 'pending_contract_scope_verification',
    'public web scope requires a separately reviewed Ecasa authorization');
  return { protectedReview: true, publicWeb: false };
}

export function validateEcasaReview(review) {
  ecasaPublication(review);
  requireEvidence(review.schemaVersion === 2 &&
    sameMembers(review.projects?.map(record => record.slug), ECASA_SLUGS), 'the 15 project identities are required');
  requireEvidence(sameMembers(review.commercialSources?.map(record => record.slug), ECASA_COMMERCIAL_SLUGS),
    'the 22 commercial source identities are required');
  const commercialSources = new Map(review.commercialSources.map(record => [record.slug, record]));
  const documentMaps = new Map();
  for (const source of review.commercialSources) {
    requireEvidence(source.projectSlug === ECASA_PROJECT_BY_COMMERCIAL_SLUG[source.slug] &&
      source.etapa === stageFor(source.slug) && source.stageScope === 'named_development_only',
      'commercial origin mapping or scope for ' + source.slug);
    documentMaps.set(source.slug, validateDocuments(source));
    for (const key of ['selectedImagePaths', 'selectedPlanPaths']) {
      requireEvidence(Array.isArray(source[key]) && new Set(source[key]).size === source[key].length &&
        source[key].every(path => typeof path === 'string' && path.startsWith('/assets/propiedades/ecasa-preview/' + source.slug + '/')),
        'invalid origin inventory for ' + source.slug);
    }
    if (UNDOCUMENTED_ASSET_ORIGINS.includes(source.slug)) {
      requireEvidence(source.selectedImagePaths.length === 0 && source.selectedPlanPaths.length === 0,
        'stage-specific evidence remains pending for ' + source.slug);
    }
    if (['ferroparque', 'urban-la-florida'].includes(source.slug)) {
      requireEvidence(source.selectedPlanPaths.length === 0, 'individual plans remain pending for ' + source.slug);
    }
  }
  const paths = new Set();
  for (const record of review.projects) {
    validateDocuments(record);
    const origins = review.commercialSources.filter(source => source.projectSlug === record.slug);
    requireEvidence(sameMembers(record.commercialSourceSlugs, origins.map(source => source.slug)) &&
      sameMembers(record.sourceAssetSlugs, origins.filter(source => source.selectedImagePaths.length ||
        source.selectedPlanPaths.length).map(source => source.slug)) && record.stageScope === 'named_development_only',
      'project origin inventory or scope for ' + record.slug);
    requireEvidence(Array.isArray(record.images) && Array.isArray(record.models), 'missing inventory for ' + record.slug);
    const modelIds = new Set();
    for (const model of record.models) {
      requireEvidence(typeof model.modelo === 'string' && /^[a-z0-9_.-]+$/i.test(model.modelo) && !modelIds.has(model.modelo), 'ambiguous model for ' + record.slug);
      modelIds.add(model.modelo);
      requireEvidence(model.visuallyVerified === true && model.plan?.sourceSha256 === model.sourceSha256 &&
        model.plan?.sourcePage === model.pagina_brochure && model.stageScope === 'named_development_only' &&
        model.originCommercialSlug === model.plan?.originCommercialSlug && model.etapa === model.plan?.etapa,
        'model/plan provenance for ' + record.slug);
      for (const key of ['superficie_util_m2', 'terraza_m2', 'superficie_total_m2',
        ...['superficie_interior_m2', 'terraza_cubierta_m2'].filter(key => key in model)]) {
        requireEvidence(model[key] === null || (Number.isFinite(model[key]) && model[key] >= 0), 'invalid area for ' + record.slug);
      }
      requireEvidence(!['precioUF', 'precioDesdeUF', 'stock', 'availability', 'entrega'].some(key => key in model),
        'historical commercial data in model ' + record.slug);
    }
    for (const asset of [...record.images, ...record.models.map(model => model.plan)]) {
      const origin = commercialSources.get(asset.originCommercialSlug);
      const source = documentMaps.get(asset.originCommercialSlug)?.get(asset.sourceSha256);
      requireEvidence(origin && origin.projectSlug === record.slug && asset.etapa === origin.etapa &&
        asset.localPath?.startsWith('/assets/propiedades/ecasa-preview/' + asset.originCommercialSlug + '/') &&
        /^\/[a-z0-9/_.-]+\.(webp|png|jpe?g)$/i.test(asset.localPath) && !asset.localPath.includes('..') &&
        !paths.has(asset.localPath), 'invalid selected path for ' + record.slug);
      paths.add(asset.localPath);
      requireEvidence((asset.kind === 'plan' ? origin.selectedPlanPaths : origin.selectedImagePaths).includes(asset.localPath),
        'asset outside its commercial origin inventory for ' + record.slug);
      requireEvidence(source && Number.isInteger(asset.sourcePage) && asset.sourcePage > 0 && asset.sourcePage <= source.pageCount &&
        HASH.test(asset.sha256) && Number.isInteger(asset.width) && asset.width > 0 &&
        Number.isInteger(asset.height) && asset.height > 0 && asset.privacySafe === true && asset.visuallyVerified === true &&
        asset.assetScope === 'named_development',
        'unreviewed image or plan for ' + record.slug);
      requireEvidence(typeof asset.caption === 'string' && typeof asset.displayCaption === 'string' &&
        !/brochure|documentad|página|\bpág\./i.test(asset.displayCaption), 'invalid display caption for ' + record.slug);
    }
    if (record.catalogueCover) requireEvidence(record.images.some(image =>
      image.localPath === record.catalogueCover.localPath), 'cover outside reviewed gallery for ' + record.slug);
    if (record.hero) requireEvidence(record.images.some(image => image.localPath === record.hero),
      'hero outside reviewed gallery for ' + record.slug);
    for (const key of ['amenities', 'finishes', 'features']) for (const item of record[key] ?? []) {
      const origin = commercialSources.get(item.originCommercialSlug);
      requireEvidence(origin?.projectSlug === record.slug && item.etapa === origin.etapa &&
        record.sourceAssetSlugs.includes(item.originCommercialSlug) &&
        typeof item.label === 'string' && typeof item.displayLabel === 'string' &&
        !/brochure|documentad|página|\bpág\./i.test(item.displayLabel), 'feature origin or display label for ' + record.slug);
    }
  }
  const selected = review.projects.flatMap(record => [...record.images, ...record.models.map(model => model.plan)]);
  const images = review.projects.flatMap(record => record.images), plans = review.projects.flatMap(record => record.models.map(model => model.plan));
  requireEvidence(images.length === 56 && plans.length === 74 && selected.length === 130 &&
    paths.size === 130, 'the 130 reviewed derivatives (56 images and 74 plans) must be retained');
  for (const source of review.commercialSources) {
    requireEvidence(sameMembers(source.selectedImagePaths, images.filter(asset => asset.originCommercialSlug === source.slug).map(asset => asset.localPath)) &&
      sameMembers(source.selectedPlanPaths, plans.filter(asset => asset.originCommercialSlug === source.slug).map(asset => asset.localPath)),
      'commercial source selection differs from retained assets for ' + source.slug);
  }
  return selected;
}

export const ecasaAssetDigest = bytes => createHash('sha256').update(bytes).digest('hex');
