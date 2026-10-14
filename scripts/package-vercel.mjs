import { cp, mkdir, readFile, readdir, rm, writeFile, access, lstat, realpath } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { ecasaPublication, validateEcasaReview, ECASA_SLUGS, ECASA_RETIRED_SLUGS } from './ecasa-publication.mjs';
import { naturalCaption, normalizeFicheCopy } from './public-fiche-copy.mjs';
import { validateEcasaImageQuality, selectEcasaPublishedAssets, transformEcasaImageQuality,
  applyEcasaCatalogueImageQuality, ecasaExcludedImagePaths } from './ecasa-image-quality.mjs';
import { brochurePublication, assertBrochureCatalogue, BROCHURE_INGEVEC_SLUGS,
  BROCHURE_REMOVED_SLUGS, BROCHURE_PUBLIC_PAGES, BROCHURE_RETIRED_ASSETS,
  brochureFingerprint } from './brochure-publication.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'dist');
const preview = process.env.VERCEL_ENV === 'preview';
const expectedBranches = new Set(['codex/fichas-proyectos-completas', 'codex/integracion-financiera-sollahms', 'codex/recorridos-validos-144', 'codex/mapas-recorridos-auto', 'codex/limpieza-mapas-fichas', 'codex/ecasa-cartera-definitiva']);
if (preview && process.env.VERCEL_GIT_COMMIT_REF && !expectedBranches.has(process.env.VERCEL_GIT_COMMIT_REF)) {
  throw new Error('Unexpected branch for this review build');
}
const profile = process.env.SOLLAHMS_BROCHURE_PROFILE;
if (profile !== undefined && profile !== 'public-web') throw new Error('Unknown brochure content profile');
const ajReview = JSON.parse(await readFile(join(root, 'data/brochures-aj-urbana.json'), 'utf8'));
const ingevecReview = JSON.parse(await readFile(join(root, 'data/brochures-ingevec.json'), 'utf8'));
const ecasaReview = JSON.parse(await readFile(join(root, 'data/brochures-ecasa.json'), 'utf8'));
const ecasaRights = ecasaPublication(ecasaReview);
const ecasaAssets = validateEcasaReview(ecasaReview);
const ecasaIncluded = preview && ecasaRights.protectedReview;
const ingevecOldSlugs = new Set(['centenario-1', 'tocornal', 'vivaceta']);
const ingevecAddedDocuments = {
  'coronel-godoy': { '86e7bcd761a1037a460ae58c23f3c5f19ab047dde162f46c2f61c5ad38ad1085': [21, [15,16,17,18], null] },
  'diagonal-paraguay': { '4b86d9b13723b7e12edf9b44e7c5616284f2e81b8f7f81d177ca0dfa3bd94f3f': [13, [9,10,11], null] },
  'el-aromo': { '2f5ee0fee2dc93ece339756b705030861a9c7c133b78307327b8d1401baeeefc': [18, [13,14,15], null] },
  'los-lilenes': { '5890a3c98ef2e130f5a91bd30073203314039741cbd68d7a8f10a294c026dda0': [20, [15,16,17], null] },
  'matta-016': { '1718596161846470541f7eb1f103c0dd550b52fc6b8c93507adb2c8b53af07e8': [23, [17,18,19,20], null] },
  'nueva-esmeralda': { 'd5cfa2a624f441173a6ec27c1091c5cff2b7c37e45782d84fbbc866966112e08': [22, [16,17,18,19], null] },
  'vicuna-mackenna-7589': {
    'ded2b0d73122c2160791e4dc1575e18a73dfc784fb397aad313638cab05c8cdc': [13, [9,10,11], 'Etapa 1'],
    'ea21b26f8fc2df546b06faf9eeb8cdafbce76edbb37b0922e8a4cf13acdcfc94': [13, [9,10,11], 'Etapa 2'],
  },
  'los-alerces': { 'c93eaab1b4c5a398c7f49e98614a40781fb01f9428aba6c9fea7d52e2a7882bd': [13, [10,11], null] },
  'valle-los-ingleses-iii': { '509ad7aeaafec2b9e09354505a117aea77efb354a433a0d4eae27b08e6378f08': [13, [8,9,10,11], 'Etapa III'] },
  'abdon-cifuentes': { '790eac34ce7353365f5c765bd8399eeb12845fb31d6e02f6a8ae31e831f293d5': [16, [10,11,12,13], null] },
  'don-ignacio': { '11fd8e276a5b72d6da4832d63f823810ffe1f80c4c83db8a97975cfc2b63961d': [21, [15,16,17,18], null] },
  'terrazzo': { '5c5e880dceb83d6fb0c0a80d78f1e5a51484408c437936811e028364a6c9a685': [18, [10,11,12,13,14,15], null] },
  'vima': { '1a4253e74dba77535e89dbb40790d98cfcc5ed4e693a1858c14de4526278efd9': [17, [12,13,14], null] },
};
const ingevecSlugs = new Set(BROCHURE_INGEVEC_SLUGS);
const ingevecImageCounts = { 'centenario-1':9, 'tocornal':8, 'vivaceta':5,
  'coronel-godoy':6, 'diagonal-paraguay':4, 'el-aromo':4, 'los-lilenes':6,
  'matta-016':11, 'nueva-esmeralda':7, 'vicuna-mackenna-7589':5,
  'abdon-cifuentes':3, 'don-ignacio':8, 'terrazzo':4, 'vima':4,
  'los-alerces':10, 'valle-los-ingleses-iii':7 };
const ajRights = brochurePublication(ajReview);
const ingevecRights = brochurePublication(ingevecReview);
const priorIngevec = ingevecReview.projects.filter(record =>
  ingevecOldSlugs.has(record.slug) || ['coronel-godoy', 'diagonal-paraguay', 'el-aromo',
    'los-lilenes', 'matta-016', 'nueva-esmeralda', 'vicuna-mackenna-7589'].includes(record.slug));
if (priorIngevec.length !== 10 ||
    brochureFingerprint(priorIngevec) !== 'c942007af5a961926e432808624bfdb9536b98009f41b053abdcac1969f8ac48') {
  throw new Error('The ten previously approved Ingevec records must remain unchanged');
}
if (ingevecReview.projects.length !== 16 || new Set(ingevecReview.projects.map(record => record.slug)).size !== 16 ||
    ingevecReview.projects.some(record => !ingevecSlugs.has(record.slug)) ||
    ingevecReview.projects.reduce((count, record) => count + record.models.length, 0) !== 64 ||
    ingevecReview.projects.reduce((count, record) => count + record.images.length, 0) !== 101) {
  throw new Error('The final Ingevec review must contain sixteen authorized projects, 101 images and 64 plans');
}
// Validate documentary bindings even when an ordinary Git build has no
// private derivatives and uses the public fallbacks for all sixteen fichas.
for (const record of ingevecReview.projects) {
  if (ingevecOldSlugs.has(record.slug)) continue; // These immutable rows are pinned above.
  const evidence = ingevecAddedDocuments[record.slug];
  const documents = record.documents ?? [record.document];
  const sources = new Map(documents.map(document => [document.sha256, document]));
  if (!evidence || sources.size !== documents.length ||
      JSON.stringify([...sources.keys()].sort()) !== JSON.stringify(Object.keys(evidence).sort()) ||
      documents.some(document => document.pageCount !== evidence[document.sha256][0] ||
        (document.etapa ?? null) !== evidence[document.sha256][2]) ||
      record.models.length !== Object.values(evidence).reduce((count, row) => count + row[1].length, 0) ||
      record.images.length !== ingevecImageCounts[record.slug]) {
    throw new Error('Ingevec reviewed source document or plan batch changed: ' + record.slug);
  }
  const identities = new Set();
  for (const model of record.models) {
    const source = evidence[model.sourceSha256];
    const identity = model.sourceSha256 + ':' + model.pagina_brochure;
    if (!source || !source[1].includes(model.pagina_brochure) || identities.has(identity) ||
        model.sourcePages?.length !== 1 || model.sourcePages[0] !== model.pagina_brochure ||
        model.plan.sourceSha256 !== model.sourceSha256 || model.plan.sourcePage !== model.pagina_brochure ||
        (model.etapa ?? null) !== source[2] || (model.plan.etapa ?? null) !== source[2] ||
        model.orientacion !== null || model.pisos !== null || !model.visuallyVerified || !model.approximate ||
        (record.slug === 'vicuna-mackenna-7589' && !model.modelo?.startsWith(source[2] === 'Etapa 1' ? 'e1-' : 'e2-'))) {
      throw new Error('Ingevec model source or stage does not match its reviewed plan: ' + record.slug);
    }
    identities.add(identity);
  }
}
if (profile === 'public-web' && (!ajRights.publicWeb || !ingevecRights.publicWeb)) {
  throw new Error('Public web content requires verified Yapo/IRIS contract scope for both batches');
}
if (profile === 'public-web' && !ecasaRights.publicWeb) {
  throw new Error('Ecasa public web content requires its own verified promotional scope');
}
// Content eligibility is independent of Vercel's deployment environment.
// Once contractual coverage is verified, missing media fails the build;
// a future merge cannot silently replace those approved resources.
const ingevecAssets = ingevecReview.projects.flatMap(record => [...record.images, ...record.models.map(model => model.plan)]);
const ingevecPresent = await Promise.all(ingevecAssets.map(async asset => {
  try { await access(join(root, asset.localPath.slice(1))); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}));
if (ingevecRights.publicWeb && !ingevecPresent.every(Boolean)) {
  throw new Error('Incomplete Ingevec contract-covered media batch: reproducible source package required');
}
const ingevecIncluded = ingevecRights.publicWeb || (preview && ingevecPresent.every(Boolean));
const ajIncluded = ajRights.publicWeb || preview;
if (preview && ingevecPresent.some(Boolean) && !ingevecPresent.every(Boolean)) {
  throw new Error('Incomplete Ingevec protected Preview media batch');
}

// Card covers use the same local, verified images as the reviewed galleries.
// Keep commercial and financial source data byte-identical. Override only
// covers whose corresponding image belongs to the selected brochure batch.
const catalogueSource = await readFile(join(root, 'data/proyectos.json'));
let catalogueOutput = catalogueSource;
const sourceProjects = JSON.parse(catalogueSource);
assertBrochureCatalogue(sourceProjects);
const [qualityBytes, researchBytes, officialBytes] = await Promise.all([
  readFile(join(root, 'data/ecasa-image-quality.json')),
  readFile(join(root, 'data/fichas-proyectos.json')),
  readFile(join(root, 'data/fuentes-imagenes.json')),
]);
const baseImageQuality = validateEcasaImageQuality(ecasaReview, JSON.parse(researchBytes), sourceProjects,
  JSON.parse(qualityBytes), JSON.parse(officialBytes));
let imageQuality = baseImageQuality, manualQuality = null, manualOperations = null, manualBytes = null;
try { manualBytes = await readFile(join(root, 'data/ecasa-manual-quality.json')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (manualBytes) {
  manualOperations = await import('./ecasa-manual-quality.mjs');
  manualQuality = manualOperations.validateEcasaManualQuality(baseImageQuality, JSON.parse(manualBytes));
  imageQuality = manualOperations.effectiveEcasaManualQuality(baseImageQuality, manualQuality, { preview: ecasaIncluded });
}
const manualReceipt = manualQuality ? {
  manifestSha256: createHash('sha256').update(manualBytes).digest('hex'),
  summary: { ...manualOperations.effectiveEcasaManualQuality(baseImageQuality, manualQuality, { preview: true }).summary,
    documentaryGalleryImages: JSON.parse(manualBytes).projects.flatMap(project => project.images)
      .filter(image => image.kind === 'documentary' && image.decision === 'keep').length,
    documentaryPublishedImages: JSON.parse(manualBytes).projects.flatMap(project => project.images)
      .filter(image => image.kind === 'documentary' && (image.decision === 'keep' || image.coverOnly)).length },
  effectiveImages: JSON.parse(manualBytes).projects.flatMap(project => project.images.map(image => ({ ...image, projectSlug: project.slug })))
    .sort((a, b) => a.localPath.localeCompare(b.localPath)),
  projects: JSON.parse(manualBytes).projects.map(({ slug, previewCover, officialGalleryMode }) => ({ slug, previewCover, officialGalleryMode }))
    .sort((a, b) => a.slug.localeCompare(b.slug)),
} : null;
const publishedEcasaAssets = selectEcasaPublishedAssets(ecasaReview, imageQuality, { preview: ecasaIncluded });
const publishedEcasaPaths = new Set(publishedEcasaAssets.map(asset => asset.localPath));
const excludedImagePaths = ecasaExcludedImagePaths(imageQuality, { preview: ecasaIncluded });
// The extra original photographs are independent of the frozen brochure and
// quality records. Historical synthetic fixtures have no such sidecar; real
// release preparation requires both this manifest and its four private files.
let officialOriginals = null, officialOperations = null, officialOriginalsBytes = null;
try { officialOriginalsBytes = await readFile(join(root, 'data/ecasa-official-originals.json')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (officialOriginalsBytes) {
  officialOperations = await import('./ecasa-official-originals.mjs');
  officialOriginals = await officialOperations.validateOfficialOriginals(JSON.parse(officialOriginalsBytes), { root });
}
const officialPublished = officialOriginals
  ? officialOperations.selectPublishedOfficialAssets(officialOriginals, { preview: ecasaIncluded }) : [];
const officialPublishedPaths = new Set(officialPublished.map(asset => join(root, asset.localPath.slice(1))));
const officialAssetReceipt = (asset, kind) => ({ path: asset.localPath, sha256: asset.sha256,
  bytes: asset.bytes, width: asset.width, height: asset.height, kind });
const officialReceipt = officialOriginals ? {
  manifestSha256: createHash('sha256').update(officialOriginalsBytes).digest('hex'),
  sourceAssets: [...officialOriginals.originals.values()].map(asset => officialAssetReceipt(asset, 'original'))
    .concat([...officialOriginals.assets.values()].map(asset => officialAssetReceipt(asset, 'selected'))).sort((a, b) => a.path.localeCompare(b.path)),
  publishedAssets: officialPublished.map(asset => officialAssetReceipt(asset, 'selected')).sort((a, b) => a.path.localeCompare(b.path)),
  summary: officialOriginals.summary,
} : null;
// Selection changes publication, never the original files or their evidence.
for (const image of imageQuality.images.values()) {
  const path = join(root, image.localPath.slice(1));
  if (!(await lstat(path)).isFile() || await realpath(path) !== path ||
      createHash('sha256').update(await readFile(path)).digest('hex') !== image.sha256) {
    throw new Error('Ecasa image quality source bytes differ from review: ' + image.localPath);
  }
}
const approvedPages = new Set([...BROCHURE_PUBLIC_PAGES, ...sourceProjects.map(project => project.slug + '.html')]);
const pages = (await readdir(root)).filter(name => name.endsWith('.html'));
if (pages.some(name => !approvedPages.has(name))) {
  throw new Error('Unapproved candidate pages and retired routes must remain outside the deployment');
}
if (sourceProjects.some(project => !pages.includes(project.slug + '.html'))) {
  throw new Error('Every approved catalogue project must have its own public route');
}
const retiredLink = new RegExp('(?:["\\\'/])(?:' + [...BROCHURE_REMOVED_SLUGS, ...ECASA_RETIRED_SLUGS].join('|') + ')\\.html(?:["\\\'?#<]|$)', 'i');
const sitemapSource = await readFile(join(root, 'sitemap.xml'));
if (retiredLink.test(sitemapSource.toString())) throw new Error('The sitemap still contains a retired project route');
const pageSources = new Map(await Promise.all(pages.map(async name => [name, await readFile(join(root, name), 'utf8')])));
for (const [name, html] of pageSources) {
  if (retiredLink.test(html)) throw new Error('A public page still links to a retired project route: ' + name);
}
const retiredExclusiveAssets = new Set(BROCHURE_RETIRED_ASSETS.filter(path =>
  !catalogueSource.toString().includes(path) && ![...pageSources.values()].some(html => html.includes(path)))
  .map(path => path.slice(1)));
const otherProjects = sourceProjects.filter(project => project.inmobiliaria !== 'Ecasa');
const otherReferences = [JSON.stringify(otherProjects), ...otherProjects.map(project => pageSources.get(project.slug + '.html'))];
const exclusiveExcludedImages = new Set([...excludedImagePaths].filter(path => !otherReferences.some(source => source.includes(path))));
const selectedMedia = new Set();
const mediaInventory = [];
if (ajIncluded || ingevecIncluded) {
  const projects = JSON.parse(catalogueSource);
  const batches = [
    { file: 'brochures-aj-urbana.json', folder: 'aj-urbana-preview', name: 'AJ', slugs: new Set(['downtown-san-martin', 'edificio-teatinos-750', 'edificio-vista-amunategui', 'monjitas-690', 'vista-morande']) },
    { file: 'brochures-ingevec.json', folder: 'ingevec-preview', name: 'Ingevec', slugs: ingevecSlugs },
  ];
  for (const batch of batches) {
    if (batch.name === 'Ingevec' ? !ingevecIncluded : !ajIncluded) continue;
    const review = JSON.parse(await readFile(join(root, 'data', batch.file), 'utf8'));
    if (!brochurePublication(review).protectedReview ||
        review.projects.length !== batch.slugs.size || new Set(review.projects.map(record => record.slug)).size !== batch.slugs.size) {
      throw new Error(batch.name + ' catalogue cover review authorization is missing or invalid');
    }
    for (const record of review.projects) {
    if (batch.name === 'Ingevec' && record.images.length !== ingevecImageCounts[record.slug]) {
      throw new Error('Ingevec reviewed image selection changed: ' + record.slug);
    }
    const documents = record.documents ?? [record.document];
    const sources = new Map(documents.map(document => [document.sha256, document]));
    if (documents.some(document => typeof document.fileName !== 'string' ||
        !/^[^/\\]+\.pdf$/i.test(document.fileName) || !Number.isInteger(document.pageCount) || document.pageCount < 1) ||
        sources.size !== documents.length || !sources.has(record.document.sha256)) {
      throw new Error(batch.name + ' source document batch is missing or invalid: ' + record.slug);
    }
    if (batch.name === 'Ingevec' && !ingevecOldSlugs.has(record.slug)) {
      const evidence = ingevecAddedDocuments[record.slug];
      if (!evidence || JSON.stringify([...sources.keys()].sort()) !== JSON.stringify(Object.keys(evidence).sort()) ||
          documents.some(document => document.pageCount !== evidence[document.sha256][0] ||
            (document.etapa ?? null) !== evidence[document.sha256][2]) ||
          record.models.length !== Object.values(evidence).reduce((count, row) => count + row[1].length, 0)) {
        throw new Error('Ingevec reviewed source document or plan batch changed: ' + record.slug);
      }
      const modelSources = new Set();
      for (const model of record.models) {
        const source = evidence[model.sourceSha256];
        const identity = model.sourceSha256 + ':' + model.pagina_brochure;
        if (!source || !source[1].includes(model.pagina_brochure) || modelSources.has(identity) ||
            model.plan.sourceSha256 !== model.sourceSha256 || model.plan.sourcePage !== model.pagina_brochure ||
            (model.etapa ?? null) !== source[2] || (model.plan.etapa ?? null) !== source[2] ||
            (record.slug === 'vicuna-mackenna-7589' && !model.modelo?.startsWith(source[2] === 'Etapa 1' ? 'e1-' : 'e2-'))) {
          throw new Error('Ingevec model source or stage does not match its reviewed plan: ' + record.slug);
        }
        modelSources.add(identity);
      }
    }
    const cover = record.catalogueCover;
    const image = record.images.find(image => image.localPath === cover?.localPath);
    const project = projects.find(project => project.slug === record.slug);
    const prefix = '/assets/propiedades/' + batch.folder + '/' + record.slug + '/';
    if (!batch.slugs.has(record.slug) || !project || !image ||
        !cover.localPath.startsWith(prefix) ||
        !/^\/[a-z0-9/_.-]+\.(?:webp|jpe?g|png)$/i.test(cover.localPath) || cover.localPath.includes('..') ||
        typeof cover.alt !== 'string' || !cover.alt.trim() ||
        !/render ilustrativo|fotograf[ií]a (?:ilustrativa|referencial)/i.test(cover.alt)) {
      throw new Error('Unverified ' + batch.name + ' catalogue cover: ' + record.slug);
    }
    const fiche = await readFile(join(root, record.slug + '.html'), 'utf8');
    // Every asset must belong to this project and match its reviewed bytes.
    // Checking gallery media and plans prevents an unrelated unreviewed asset
    // from entering the preview alongside an otherwise valid card cover.
    for (const asset of [...record.images, ...record.models.map(model => model.plan)]) {
      if (!asset?.localPath?.startsWith(prefix) || asset.localPath.includes('..') ||
          !/^\/[a-z0-9/_.-]+\.(?:webp|jpe?g|png)$/i.test(asset.localPath) || !fiche.includes(asset.localPath)) {
        throw new Error(batch.name + ' asset does not match its verified gallery or plan: ' + record.slug);
      }
      const source = sources.get(asset.sourceSha256);
      if (!source || !Number.isInteger(asset.sourcePage) || asset.sourcePage < 1 || asset.sourcePage > source.pageCount ||
          !/^[a-f0-9]{64}$/.test(asset.sha256 ?? '') || !Number.isInteger(asset.width) || asset.width < 1 ||
          !Number.isInteger(asset.height) || asset.height < 1) {
        throw new Error(batch.name + ' selected media source evidence is invalid: ' + record.slug);
      }
      if (batch.name === 'Ingevec' && record.images.includes(asset) &&
          (!Number.isInteger(asset.imageIndex) || asset.imageIndex < 0 || !/^[a-f0-9]{64}$/.test(asset.originalSha256 ?? '') ||
          (record.slug === 'centenario-1' && [2,3].includes(asset.sourcePage)))) {
        throw new Error('Ingevec selected image source privacy evidence is invalid: ' + record.slug);
      }
      if (batch.name === 'Ingevec' && record.images.includes(asset) && record.slug === 'centenario-1' && asset.sourcePage === 1 &&
          (asset.imageIndex !== 0 || asset.originalSha256 !== '5af64f402e804a3be87a774e56aa8756cd54575136a8ada3c06422502bb7fe8d')) {
        throw new Error('Centenario: only the reviewed bare facade is eligible on page 1');
      }
      const path = join(root, asset.localPath.slice(1));
      const resolved = await realpath(path);
      if (!(await lstat(path)).isFile() || resolved !== path) {
        throw new Error(batch.name + ' selected media must be a regular local file: ' + record.slug);
      }
      const bytes = await readFile(path);
      if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) {
        throw new Error(batch.name + ' catalogue cover or media does not match its verified gallery: ' + record.slug);
      }
      if (selectedMedia.has(path)) throw new Error('Duplicate selected brochure media path');
      selectedMedia.add(path);
      mediaInventory.push({ path: asset.localPath, sha256: asset.sha256, bytes: bytes.length });
    }
    if (batch.name === 'Ingevec' && (record.images.some(asset => !asset.privacySafe || !asset.visuallyVerified) ||
        record.models.some(model => !model.visuallyVerified || model.orientacion !== null || model.pisos !== null ||
          (record.slug === 'centenario-1' && ![10,11,12,13,14].includes(model.pagina_brochure))))) {
      throw new Error('Ingevec media privacy review is missing: ' + record.slug);
    }
    project.imagenPrincipal = cover.localPath;
    project.imagenAlt = naturalCaption(cover.alt);
    }
  }
  catalogueOutput = JSON.stringify(projects, null, 2) + '\n';
}
if (ecasaIncluded) {
  const projects = JSON.parse(catalogueOutput);
  for (const record of ecasaReview.projects) {
    const project = projects.find(project => project.slug === record.slug);
    if (!project || project.inmobiliaria !== 'Ecasa' || !ECASA_SLUGS.includes(record.slug)) {
      throw new Error('Ecasa media identity differs from the authorized catalogue: ' + record.slug);
    }
    const fiche = pageSources.get(record.slug + '.html');
    for (const asset of [...record.images, ...record.models.map(model => model.plan)]) {
      if (!fiche.includes(asset.localPath)) throw new Error('Ecasa selected media is absent from its own fiche: ' + record.slug);
      const path = join(root, asset.localPath.slice(1));
      let bytes;
      try {
        if (!(await lstat(path)).isFile() || await realpath(path) !== path) throw new Error('Nonregular media');
        bytes = await readFile(path);
      } catch {
        throw new Error('Incomplete Ecasa protected Preview media batch: reproducible source package required');
      }
      if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) {
        throw new Error('Ecasa selected media bytes differ from review: ' + record.slug);
      }
      if (publishedEcasaPaths.has(asset.localPath)) {
        selectedMedia.add(path);
        mediaInventory.push({ path: asset.localPath, sha256: asset.sha256, bytes: bytes.length });
      }
    }
    if (record.catalogueCover) {
      project.imagenPrincipal = record.catalogueCover.localPath;
      project.imagenAlt = naturalCaption(record.catalogueCover.displayAlt ?? record.catalogueCover.alt);
      const image = record.images.find(image => image.localPath === record.catalogueCover.localPath);
      if (image.etapa && record.commercialSourceSlugs.length > 1) project.imagenEtapa = image.etapa;
    }
  }
  catalogueOutput = JSON.stringify(projects, null, 2) + '\n';
}

// Static output is an explicit allowlist. API sources and their imports are
// bundled separately by Vercel, never copied into the public directory.
catalogueOutput = JSON.stringify(applyEcasaCatalogueImageQuality(JSON.parse(catalogueOutput), imageQuality,
  { preview: ecasaIncluded }), null, 2) + '\n';
if (officialOriginals) catalogueOutput = JSON.stringify(officialOperations.applyOfficialCatalogue(
  JSON.parse(catalogueOutput), imageQuality, officialOriginals, { preview: ecasaIncluded }), null, 2) + '\n';
await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'data'), { recursive: true });
for (const name of pages) {
  let html = pageSources.get(name);
  // Legacy marker names describe the original review blocks. They select
  // content according to contractual coverage, never grant deploy approval.
  for (const batch of ['AJ', 'INGEVEC', 'ECASA']) {
    const included = batch === 'AJ' ? ajIncluded : batch === 'INGEVEC' ? ingevecIncluded : ecasaIncluded;
    const remove = included ? 'PUBLIC' : 'PREVIEW';
    const keep = included ? 'PREVIEW' : 'PUBLIC';
    html = html.replace(new RegExp(`<!--${batch}_${remove}_START-->[\\s\\S]*?<!--${batch}_${remove}_END-->`, 'g'), '');
    html = html.replace(new RegExp(`<!--${batch}_${keep}_(?:START|END)-->`, 'g'), '');
  }
  if (sourceProjects.some(project => project.slug + '.html' === name)) html = normalizeFicheCopy(html);
  if (sourceProjects.some(project => project.inmobiliaria === 'Ecasa' && project.slug + '.html' === name))
    html = transformEcasaImageQuality(html, name.slice(0, -5), imageQuality, { preview: ecasaIncluded });
  if (officialOriginals) html = officialOperations.transformOfficialOriginals(html, name.slice(0, -5),
    imageQuality, officialOriginals, { preview: ecasaIncluded });
  if (manualQuality) html = manualOperations.transformEcasaManualGallery(html, name.slice(0, -5),
    manualQuality, { preview: ecasaIncluded });
  if (preview) {
    html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
    if (name === 'agenda-asesoria.html' || name === 'contacto.html' || name === 'comparador-hipotecario.html') {
      const notice = '<div role="note" style="padding:14px 24px;background:#003229;color:#fff;text-align:center;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6">Vista previa de revisión. Los formularios no envían mensajes ni crean reservas.</div>';
      html = html.replace(/(<main[^>]*>)/, '$1' + notice);
    }
  }
  await writeFile(join(output, name), html);
}
await cp(join(root, 'assets'), join(output, 'assets'), { recursive: true,
  filter: async source => {
    const path = relative(root, source).split(sep).join('/');
    if (path.includes('/brochure-candidates')) return false;
    if (retiredExclusiveAssets.has(path)) return false;
    if (exclusiveExcludedImages.has('/' + path)) return false;
    const info = await lstat(source);
    // No symlink can turn a nominal image directory into private content.
    if (info.isSymbolicLink()) throw new Error('Symbolic links are excluded from public assets');
    const officialPrefix = 'assets/propiedades/ecasa-official-review';
    if (path === officialPrefix || path.startsWith(officialPrefix + '/')) {
      // Raw downloaded banners, unused candidates and documentary receipts
      // remain private even inside the protected Preview.
      return info.isDirectory() ? [...officialPublishedPaths].some(file => file.startsWith(source + sep))
        : officialPublishedPaths.has(source);
    }
    for (const [folder, included] of [['aj-urbana-preview', ajIncluded], ['ingevec-preview', ingevecIncluded], ['ecasa-preview', ecasaIncluded]]) {
      const prefix = 'assets/propiedades/' + folder;
      if (path === prefix || path.startsWith(prefix + '/')) {
        if (!included) return false;
        return info.isDirectory() ? [...selectedMedia].some(file => file.startsWith(source + sep)) : selectedMedia.has(source);
      }
    }
    if (path === 'assets/css/aj-brochure-preview.css') return ajIncluded || ingevecIncluded || ecasaIncluded;
    if (info.isFile() && /\.(?:pdf|zip|docx?|xlsx?|toml|env)$/i.test(path)) return false;
    return true;
  } });
await writeFile(join(output, 'data/proyectos.json'), catalogueOutput);
await cp(join(root, 'data/hipotecario.json'), join(output, 'data/hipotecario.json'));
await writeFile(join(output, 'sitemap.xml'), sitemapSource);
await writeFile(join(output, 'robots.txt'), preview ? 'User-agent: *\nDisallow: /\n' : await readFile(join(root, 'robots.txt'), 'utf8'));
// A private build receipt can be compared across Preview and an offline public
// build. It is deliberately outside dist and contains no contract text.
await mkdir(join(root, '.vercel'), { recursive: true });
await writeFile(join(root, '.vercel/brochure-build-inventory.json'), JSON.stringify({
  catalogueProjects: sourceProjects.length, publicationSource: 'Yapo/IRIS + Ecasa/user_supplied',
  contractualCoverageVerified: ajRights.publicWeb && ingevecRights.publicWeb && ecasaRights.publicWeb,
  preservedContractualCoverageVerified: ajRights.publicWeb && ingevecRights.publicWeb,
  ecasaContractualCoverageVerified: ecasaRights.publicWeb,
  ecasaReviewMedia: publishedEcasaAssets.length,
  ecasaImageQuality: { policySha256: createHash('sha256').update(qualityBytes).digest('hex'), ...baseImageQuality.summary },
  manualQuality: manualReceipt,
  officialSourceMedia: officialReceipt?.sourceAssets.length ?? 0,
  officialPublishedMedia: officialPublished.length,
  ecasaGalleryImages: ecasaIncluded ? imageQuality.summary.keptImages + officialPublished.length : null,
  officialOriginals: officialReceipt,
  media: mediaInventory.sort((a, b) => a.path.localeCompare(b.path)),
}, null, 2) + '\n');
console.log(JSON.stringify({ pages: pages.length, publicDataFiles: ['proyectos.json', 'hipotecario.json'], environment: preview ? 'preview' : 'production', noindex: preview, ingevecReviewMedia: ingevecIncluded ? ingevecAssets.length : 0, ecasaReviewMedia: publishedEcasaAssets.length, selectedBrochureMedia: selectedMedia.size, imageQuality: imageQuality.summary, officialSourceMedia: officialReceipt?.sourceAssets.length ?? 0, officialPublishedMedia: officialPublished.length, ecasaGalleryImages: ecasaIncluded ? imageQuality.summary.keptImages + officialPublished.length : null, contractualCoverageVerified: ajRights.publicWeb && ingevecRights.publicWeb && ecasaRights.publicWeb, preservedContractualCoverageVerified: ajRights.publicWeb && ingevecRights.publicWeb, ecasaContractualCoverageVerified: ecasaRights.publicWeb }));
