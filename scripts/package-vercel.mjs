import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'dist');
const preview = process.env.VERCEL_ENV === 'preview';
const expectedBranches = new Set(['codex/fichas-proyectos-completas', 'codex/integracion-financiera-sollahms']);
if (preview && process.env.VERCEL_GIT_COMMIT_REF && !expectedBranches.has(process.env.VERCEL_GIT_COMMIT_REF)) {
  throw new Error('Unexpected branch for this review build');
}

// Card covers use the same local, verified images as the five review galleries.
// Keep the source catalogue byte-identical; only its protected Preview output
// may refer to brochure assets whose public redistribution licence is pending.
const catalogueSource = await readFile(join(root, 'data/proyectos.json'));
let catalogueOutput = catalogueSource;
if (preview) {
  const review = JSON.parse(await readFile(join(root, 'data/brochures-aj-urbana.json'), 'utf8'));
  const slugs = new Set(['downtown-san-martin', 'edificio-teatinos-750', 'edificio-vista-amunategui', 'monjitas-690', 'vista-morande']);
  if (review.publicationRights?.protectedPreview !== 'authorized_by_user' ||
      review.projects.length !== slugs.size || new Set(review.projects.map(record => record.slug)).size !== slugs.size) {
    throw new Error('AJ catalogue cover review authorization is missing or invalid');
  }
  const projects = JSON.parse(catalogueSource);
  for (const record of review.projects) {
    const cover = record.catalogueCover;
    const image = record.images.find(image => image.localPath === cover?.localPath);
    const project = projects.find(project => project.slug === record.slug);
    if (!slugs.has(record.slug) || !project || !image ||
        !cover.localPath.startsWith('/assets/propiedades/aj-urbana-preview/' + record.slug + '/') ||
        !/^\/[a-z0-9/_.-]+\.(?:webp|jpe?g|png)$/i.test(cover.localPath) || cover.localPath.includes('..') ||
        typeof cover.alt !== 'string' || !cover.alt.trim() || !/render ilustrativo/i.test(cover.alt)) {
      throw new Error('Unverified AJ catalogue cover: ' + record.slug);
    }
    const bytes = await readFile(join(root, cover.localPath.slice(1)));
    const fiche = await readFile(join(root, record.slug + '.html'), 'utf8');
    if (createHash('sha256').update(bytes).digest('hex') !== image.sha256 || !fiche.includes(cover.localPath)) {
      throw new Error('AJ catalogue cover does not match its verified gallery: ' + record.slug);
    }
    project.imagenPrincipal = cover.localPath;
    project.imagenAlt = cover.alt;
  }
  catalogueOutput = JSON.stringify(projects, null, 2) + '\n';
}

// Static output is an explicit allowlist. API sources and their imports are
// bundled separately by Vercel, never copied into the public directory.
await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'data'), { recursive: true });
const pages = (await readdir(root)).filter(name => name.endsWith('.html'));
for (const name of pages) {
  let html = await readFile(join(root, name), 'utf8');
  // The user authorized a protected review of supplied brochures. An express
  // public redistribution licence is still pending. Fail closed in every
  // non-preview build, including a future production build of this branch.
  const remove = preview ? 'PUBLIC' : 'PREVIEW';
  const keep = preview ? 'PREVIEW' : 'PUBLIC';
  html = html.replace(new RegExp(`<!--AJ_${remove}_START-->[\\s\\S]*?<!--AJ_${remove}_END-->`, 'g'), '');
  html = html.replace(new RegExp(`<!--AJ_${keep}_(?:START|END)-->`, 'g'), '');
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
  filter: (source) => preview || (!source.includes('/aj-urbana-preview') && !source.endsWith('/aj-brochure-preview.css')) });
await writeFile(join(output, 'data/proyectos.json'), catalogueOutput);
await cp(join(root, 'data/hipotecario.json'), join(output, 'data/hipotecario.json'));
await cp(join(root, 'sitemap.xml'), join(output, 'sitemap.xml'));
await writeFile(join(output, 'robots.txt'), preview ? 'User-agent: *\nDisallow: /\n' : await readFile(join(root, 'robots.txt'), 'utf8'));
console.log(JSON.stringify({ pages: pages.length, publicDataFiles: ['proyectos.json', 'hipotecario.json'], environment: preview ? 'preview' : 'production', noindex: preview }));
