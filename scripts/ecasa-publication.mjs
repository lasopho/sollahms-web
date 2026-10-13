import { createHash } from 'node:crypto';

export const ECASA_SLUGS = Object.freeze([
  'lomas-de-puyai', 'ferroparque', 'edificio-bezanilla', 'endemico',
  'terratolten-1', 'wayra', 'alto-san-joaquin-3', 'enlace-mackenna',
  'ferroparque-2', 'espacio-victoria', 'lamara', 'terratolten-3',
  'lomas-de-puyai-3', 'cumbres-de-penuelas', 'aires-la-florida-2',
  'conecta-huechuraba', 'urban-la-florida', 'alto-san-joaquin',
  'alto-san-joaquin-2', 'nucleo-costanera', 'terratolten-2', 'nucleo-costanera-2',
]);
export const ECASA_RETIRED_SLUGS = Object.freeze([
  'bosquemar', 'altos-del-wayra', 'robles-del-aconcagua', 'el-real', 'edificio-ha-strip-center',
]);
const HASH = /^[a-f0-9]{64}$/;
const requireEvidence = (condition, message) => {
  if (!condition) throw new Error('Ecasa: ' + message);
};

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
  requireEvidence(review.projects?.length === 22 &&
    new Set(review.projects.map(record => record.slug)).size === 22 &&
    ECASA_SLUGS.every(slug => review.projects.some(record => record.slug === slug)), 'the 22 authorized identities are required');
  const paths = new Set();
  for (const record of review.projects) {
    const documents = record.documents ?? (record.document ? [record.document] : []);
    const sources = new Map(documents.map(document => [document.sha256, document]));
    requireEvidence(sources.size === documents.length, 'duplicate source within ' + record.slug);
    for (const document of documents) {
      requireEvidence(document.sourceChannel === 'Ecasa/user_supplied' && HASH.test(document.sha256) && /^[^/\\]+\.pdf$/i.test(document.fileName) &&
        Number.isInteger(document.pageCount) && document.pageCount > 0, 'invalid source for ' + record.slug);
    }
    requireEvidence(Array.isArray(record.images) && Array.isArray(record.models), 'missing inventory for ' + record.slug);
    const modelIds = new Set();
    for (const model of record.models) {
      requireEvidence(typeof model.modelo === 'string' && /^[a-z0-9_.-]+$/i.test(model.modelo) && !modelIds.has(model.modelo), 'ambiguous model for ' + record.slug);
      modelIds.add(model.modelo);
      requireEvidence(model.visuallyVerified === true && model.plan?.sourceSha256 === model.sourceSha256 &&
        model.plan?.sourcePage === model.pagina_brochure, 'model/plan provenance for ' + record.slug);
      for (const key of ['superficie_util_m2', 'terraza_m2', 'superficie_total_m2',
        ...['superficie_interior_m2', 'terraza_cubierta_m2'].filter(key => key in model)]) {
        requireEvidence(model[key] === null || (Number.isFinite(model[key]) && model[key] >= 0), 'invalid area for ' + record.slug);
      }
      requireEvidence(!['precioUF', 'precioDesdeUF', 'stock', 'availability', 'entrega'].some(key => key in model),
        'historical commercial data in model ' + record.slug);
    }
    for (const asset of [...record.images, ...record.models.map(model => model.plan)]) {
      const source = sources.get(asset.sourceSha256);
      requireEvidence(asset.localPath?.startsWith('/assets/propiedades/ecasa-preview/' + record.slug + '/') &&
        /^\/[a-z0-9/_.-]+\.(webp|png|jpe?g)$/i.test(asset.localPath) && !asset.localPath.includes('..') &&
        !paths.has(asset.localPath), 'invalid selected path for ' + record.slug);
      paths.add(asset.localPath);
      requireEvidence(source && Number.isInteger(asset.sourcePage) && asset.sourcePage > 0 && asset.sourcePage <= source.pageCount &&
        HASH.test(asset.sha256) && Number.isInteger(asset.width) && asset.width > 0 &&
        Number.isInteger(asset.height) && asset.height > 0 && asset.privacySafe === true && asset.visuallyVerified === true &&
        asset.assetScope === 'named_development',
        'unreviewed image or plan for ' + record.slug);
    }
    if (record.catalogueCover) requireEvidence(record.images.some(image =>
      image.localPath === record.catalogueCover.localPath), 'cover outside reviewed gallery for ' + record.slug);
  }
  // These sources are ambiguous or absent for the numbered stage. A repeated
  // source hash does not establish stage eligibility.
  for (const slug of ['alto-san-joaquin-2', 'alto-san-joaquin-3', 'nucleo-costanera-2', 'lomas-de-puyai-3',
    'terratolten-2', 'lomas-de-puyai', 'ferroparque-2', 'terratolten-3']) {
    const record = review.projects.find(record => record.slug === slug);
    requireEvidence(record.images.length === 0 && record.models.length === 0,
      'stage-specific evidence remains pending for ' + slug);
  }
  for (const slug of ['ferroparque', 'urban-la-florida']) {
    requireEvidence(review.projects.find(record => record.slug === slug).models.length === 0,
      'individual plans remain pending for ' + slug);
  }
  return review.projects.flatMap(record => [...record.images, ...record.models.map(model => model.plan)]);
}

export const ecasaAssetDigest = bytes => createHash('sha256').update(bytes).digest('hex');
