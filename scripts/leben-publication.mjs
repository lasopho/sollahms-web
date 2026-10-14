// This supplement is only eligible for the user-authorized protected review.
// Existing commercial fields and previous brochure batches are independent.
export const LEBEN_BROCHURE_SLUGS = Object.freeze([
  'edificio-living-town', 'edificio-mood', 'edificio-santo', 'edificio-baum',
  'edificio-suecia', 'parque-germania', 'capitanes', 'edificio-bold',
  'edificio-argomedo', 'edificio-indi', 'edificio-indigo', 'inn-puerto-chico',
]);
export const LEBEN_MANIFEST = 'data/brochures-leben.json';
export const LEBEN_MEDIA_FOLDER = 'leben-preview';
export const LEBEN_REVIEW_PROFILE = 'protected_leben_review';
const hash = /^[a-f0-9]{64}$/;
const requireEvidence = (condition, message) => {
  if (!condition) throw new Error('Leben: ' + message);
};

export function lebenPublication(review) {
  const rights = review.publicationRights;
  requireEvidence(review.protectedPreviewOnly === true && rights?.sourceChannel === 'Leben/user_supplied' &&
    rights.protectedPreview === 'authorized_by_user' && rights.productionPolicy === 'requires_verified_contract_scope' &&
    rights.contractScope?.status === 'pending_contract_scope_verification',
  'the independent protected review permission must not grant public publication');
  return { protectedReview: true, publicWeb: false };
}

export function assertLebenBuildEnvironment(environment) {
  if (environment.VERCEL === '1' && environment.VERCEL_ENV !== 'preview') {
    throw new Error('Leben: this source package is authorized only for a protected Preview deployment');
  }
}

export function validateLebenReview(review) {
  lebenPublication(review);
  const sourcePackage = review.sourcePackage;
  requireEvidence(sourcePackage?.sourceMode === 'regenerated_from_local_originals' && sourcePackage.status === 'reviewed' &&
    sourcePackage.originalPdfCount === 12 && sourcePackage.originalsValidatedBySha256 === 12 && hash.test(sourcePackage.inventorySha256 ?? '') &&
    sourcePackage.instructions?.fileName === 'INSTRUCCIONES_CODEX.md' &&
    hash.test(sourcePackage.instructions.sha256 ?? ''), 'the twelve local originals, regenerated SHA inventory and instructions must be reviewed first');
  requireEvidence(review.schemaVersion === 1 && review.inmobiliaria === 'Leben' &&
    Array.isArray(review.projects) && review.projects.length === 12 &&
    new Set(review.projects.map(record => record.slug)).size === 12 &&
    review.projects.every(record => LEBEN_BROCHURE_SLUGS.includes(record.slug)),
  'the supplement must complement exactly the twelve existing projects');
  const documents = new Map();
  const media = new Map();
  for (const record of review.projects) {
    const sources = record.documents ?? [record.document];
    requireEvidence(Array.isArray(sources) && sources.length === 1 &&
      JSON.stringify(sources[0]) === JSON.stringify(record.document), 'one primary PDF is required for ' + record.slug);
    const document = sources[0];
    requireEvidence(document?.sourceChannel === 'Leben/user_supplied' && hash.test(document.sha256 ?? '') &&
      /^[^/\\]+\.pdf$/i.test(document.fileName ?? '') && Number.isInteger(document.pageCount) && document.pageCount > 0 &&
      !documents.has(document.sha256), 'invalid or duplicate PDF evidence for ' + record.slug);
    documents.set(document.sha256, document);
    requireEvidence(Array.isArray(record.images) && Array.isArray(record.models), 'selection arrays are required for ' + record.slug);
    const prefix = '/assets/propiedades/' + LEBEN_MEDIA_FOLDER + '/' + record.slug + '/';
    for (const asset of [...record.images, ...record.models.map(model => model.plan)]) {
      requireEvidence(asset?.localPath?.startsWith(prefix) &&
        /^[a-z0-9_.-]+\.(?:webp|jpe?g|png)$/i.test(asset.localPath.slice(prefix.length)) &&
        !asset.localPath.includes('..') && !media.has(asset.localPath) && hash.test(asset.sha256 ?? '') &&
        asset.sourceSha256 === document.sha256 && Number.isInteger(asset.sourcePage) &&
        asset.sourcePage >= 1 && asset.sourcePage <= document.pageCount &&
        Number.isInteger(asset.width) && asset.width > 0 && Number.isInteger(asset.height) && asset.height > 0 &&
        asset.visuallyVerified === true && asset.privacySafe === true,
      'selected resource lacks same-project source, review or dimensions: ' + record.slug);
      if (record.images.includes(asset)) requireEvidence(asset.qualityDecision === 'keep' &&
        Number.isInteger(asset.nativeWidth) && asset.nativeWidth >= asset.width &&
        Number.isInteger(asset.nativeHeight) && asset.nativeHeight >= asset.height,
        'an excluded, enlarged or unreviewed photograph cannot be selected: ' + record.slug);
      if (asset.sourceEncodedStream !== undefined) {
        const stream = asset.sourceEncodedStream;
        requireEvidence(stream && Object.keys(stream).sort().join(',') === 'format,resourceName,sha256' &&
          stream.format === 'JPEG' && typeof stream.resourceName === 'string' && /^[A-Za-z0-9_.-]+$/.test(stream.resourceName) &&
          hash.test(stream.sha256 ?? '') && stream.sha256 === asset.sha256 &&
          /\.jpe?g$/i.test(asset.localPath) && asset.extractionMethod === 'pdf_image_object' &&
          hash.test(asset.sourceImageSha256 ?? '') &&
          ['.jpg', '.jpeg'].some(extension => asset.sourceImageName === stream.resourceName + extension) &&
          asset.encoderMethod === 'original_embedded_jpeg_no_reencoding' && asset.encoderQuality === undefined &&
          JSON.stringify(asset.crop) === '[0,0,1,1]' &&
          asset.width === asset.nativeWidth && asset.height === asset.nativeHeight,
        'encoded JPEG evidence must preserve the original stream, complete crop and native dimensions: ' + record.slug);
      }
      media.set(asset.localPath, asset);
    }
    const modelIdentities = new Set();
    for (const model of record.models) {
      const identity = model.sourceSha256 + ':' + model.modelo;
      requireEvidence(typeof model.modelo === 'string' && model.modelo.trim() && !modelIdentities.has(identity) &&
        model.visuallyVerified === true && model.sourceSha256 === document.sha256 &&
        model.pagina_brochure === model.plan.sourcePage && model.sourcePages?.length === 1 &&
        model.sourcePages[0] === model.pagina_brochure && model.plan.sourceSha256 === model.sourceSha256,
      'individual plan evidence is missing or duplicated: ' + record.slug);
      requireEvidence(['vector', 'raster'].includes(model.plan.sourceKind) &&
        (model.plan.sourceKind === 'vector' || Number.isInteger(model.plan.nativeWidth) && model.plan.nativeWidth >= model.plan.width &&
          Number.isInteger(model.plan.nativeHeight) && model.plan.nativeHeight >= model.plan.height),
      'raster plans cannot be enlarged to simulate native quality: ' + record.slug);
      modelIdentities.add(identity);
    }
    if (record.catalogueCover) requireEvidence(record.images.some(image => image.localPath === record.catalogueCover.localPath) &&
      typeof record.catalogueCover.alt === 'string' && record.catalogueCover.alt.trim(),
    'the optional cover must be a selected photograph of the same project');
  }
  requireEvidence(Array.isArray(review.sourceDocuments) && review.sourceDocuments.length === 12 &&
    new Set(review.sourceDocuments.map(document => document.sha256)).size === 12 &&
    review.sourceDocuments.every(document => JSON.stringify(document) === JSON.stringify(documents.get(document.sha256))),
  'the source inventory must bind all twelve PDFs exactly');
  return [...media.values()];
}
