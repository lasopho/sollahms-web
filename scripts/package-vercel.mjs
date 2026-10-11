import { cp, mkdir, readFile, readdir, rm, writeFile, access, lstat, realpath } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { brochurePublication } from './brochure-publication.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'dist');
const preview = process.env.VERCEL_ENV === 'preview';
const expectedBranches = new Set(['codex/fichas-proyectos-completas', 'codex/integracion-financiera-sollahms']);
if (preview && process.env.VERCEL_GIT_COMMIT_REF && !expectedBranches.has(process.env.VERCEL_GIT_COMMIT_REF)) {
  throw new Error('Unexpected branch for this review build');
}
const profile = process.env.SOLLAHMS_BROCHURE_PROFILE;
if (profile !== undefined && profile !== 'public-web') throw new Error('Unknown brochure content profile');
const ajReview = JSON.parse(await readFile(join(root, 'data/brochures-aj-urbana.json'), 'utf8'));
const ingevecReview = JSON.parse(await readFile(join(root, 'data/brochures-ingevec.json'), 'utf8'));
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
};
const ingevecSlugs = new Set([...ingevecOldSlugs, ...Object.keys(ingevecAddedDocuments)]);
const ingevecImageCounts = { 'centenario-1':9, 'tocornal':8, 'vivaceta':5,
  'coronel-godoy':6, 'diagonal-paraguay':4, 'el-aromo':4, 'los-lilenes':6,
  'matta-016':11, 'nueva-esmeralda':7, 'vicuna-mackenna-7589':5 };
const ajRights = brochurePublication(ajReview);
const ingevecRights = brochurePublication(ingevecReview);
if (profile === 'public-web' && (!ajRights.publicWeb || !ingevecRights.publicWeb)) {
  throw new Error('Public web content requires verified Yapo/IRIS contract scope for both batches');
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
const candidates = new Set(['los-alerces', 'valle-los-ingleses-iii']);
if (sourceProjects.length !== 148 || new Set(sourceProjects.map(project => project.slug)).size !== 148 ||
    sourceProjects.some(project => candidates.has(project.slug))) {
  throw new Error('The approved catalogue must contain exactly 148 existing projects');
}
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
          documents.some(document => document.pageCount !== evidence[document.sha256][0]) ||
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
            (source[2] !== null && !model.modelo?.startsWith(source[2] === 'Etapa 1' ? 'e1-' : 'e2-'))) {
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
        typeof cover.alt !== 'string' || !cover.alt.trim() || !/render ilustrativo/i.test(cover.alt)) {
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
    project.imagenAlt = cover.alt;
    }
  }
  catalogueOutput = JSON.stringify(projects, null, 2) + '\n';
}

// Static output is an explicit allowlist. API sources and their imports are
// bundled separately by Vercel, never copied into the public directory.
await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'data'), { recursive: true });
const pages = (await readdir(root)).filter(name => name.endsWith('.html'));
if (pages.some(name => candidates.has(name.slice(0, -5)))) {
  throw new Error('Unapproved candidate pages must remain outside the deployment');
}
for (const name of pages) {
  let html = await readFile(join(root, name), 'utf8');
  // Legacy marker names describe the original review blocks. They select
  // content according to contractual coverage, never grant deploy approval.
  for (const batch of ['AJ', 'INGEVEC']) {
    const included = batch === 'AJ' ? ajIncluded : ingevecIncluded;
    const remove = included ? 'PUBLIC' : 'PREVIEW';
    const keep = included ? 'PREVIEW' : 'PUBLIC';
    html = html.replace(new RegExp(`<!--${batch}_${remove}_START-->[\\s\\S]*?<!--${batch}_${remove}_END-->`, 'g'), '');
    html = html.replace(new RegExp(`<!--${batch}_${keep}_(?:START|END)-->`, 'g'), '');
  }
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
    const info = await lstat(source);
    // No symlink can turn a nominal image directory into private content.
    if (info.isSymbolicLink()) throw new Error('Symbolic links are excluded from public assets');
    for (const [folder, included] of [['aj-urbana-preview', ajIncluded], ['ingevec-preview', ingevecIncluded]]) {
      const prefix = 'assets/propiedades/' + folder;
      if (path === prefix || path.startsWith(prefix + '/')) {
        if (!included) return false;
        return info.isDirectory() ? [...selectedMedia].some(file => file.startsWith(source + sep)) : selectedMedia.has(source);
      }
    }
    if (path === 'assets/css/aj-brochure-preview.css') return ajIncluded || ingevecIncluded;
    if (info.isFile() && /\.(?:pdf|zip|docx?|xlsx?|toml|env)$/i.test(path)) return false;
    return true;
  } });
await writeFile(join(output, 'data/proyectos.json'), catalogueOutput);
await cp(join(root, 'data/hipotecario.json'), join(output, 'data/hipotecario.json'));
await cp(join(root, 'sitemap.xml'), join(output, 'sitemap.xml'));
await writeFile(join(output, 'robots.txt'), preview ? 'User-agent: *\nDisallow: /\n' : await readFile(join(root, 'robots.txt'), 'utf8'));
// A private build receipt can be compared across Preview and an offline public
// build. It is deliberately outside dist and contains no contract text.
await mkdir(join(root, '.vercel'), { recursive: true });
await writeFile(join(root, '.vercel/brochure-build-inventory.json'), JSON.stringify({
  catalogueProjects: sourceProjects.length, publicationSource: 'Yapo/IRIS',
  contractualCoverageVerified: ajRights.publicWeb && ingevecRights.publicWeb,
  media: mediaInventory.sort((a, b) => a.path.localeCompare(b.path)),
}, null, 2) + '\n');
console.log(JSON.stringify({ pages: pages.length, publicDataFiles: ['proyectos.json', 'hipotecario.json'], environment: preview ? 'preview' : 'production', noindex: preview, ingevecReviewMedia: ingevecIncluded ? ingevecAssets.length : 0, selectedBrochureMedia: selectedMedia.size, contractualCoverageVerified: ajRights.publicWeb && ingevecRights.publicWeb }));
