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
    { file: 'brochures-ingevec.json', folder: 'ingevec-preview', name: 'Ingevec', slugs: new Set(['centenario-1', 'tocornal', 'vivaceta']) },
  ];
  for (const batch of batches) {
    if (batch.name === 'Ingevec' ? !ingevecIncluded : !ajIncluded) continue;
    const review = JSON.parse(await readFile(join(root, 'data', batch.file), 'utf8'));
    if (!brochurePublication(review).protectedReview ||
        review.projects.length !== batch.slugs.size || new Set(review.projects.map(record => record.slug)).size !== batch.slugs.size) {
      throw new Error(batch.name + ' catalogue cover review authorization is missing or invalid');
    }
    for (const record of review.projects) {
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
        record.models.some(model => !model.visuallyVerified ||
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
