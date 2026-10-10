import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'dist');
const preview = process.env.VERCEL_ENV === 'preview';
const expectedBranches = new Set(['codex/fichas-proyectos-completas', 'codex/integracion-financiera-sollahms']);
if (preview && process.env.VERCEL_GIT_COMMIT_REF && !expectedBranches.has(process.env.VERCEL_GIT_COMMIT_REF)) {
  throw new Error('Unexpected branch for this review build');
}

// Static output is an explicit allowlist. API sources and their imports are
// bundled separately by Vercel, never copied into the public directory.
await rm(output, { recursive: true, force: true });
await mkdir(join(output, 'data'), { recursive: true });
const pages = (await readdir(root)).filter(name => name.endsWith('.html'));
for (const name of pages) {
  let html = await readFile(join(root, name), 'utf8');
  if (preview) {
    html = html.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>');
    if (name === 'agenda-asesoria.html' || name === 'contacto.html' || name === 'comparador-hipotecario.html') {
      const notice = '<div role="note" style="padding:14px 24px;background:#003229;color:#fff;text-align:center;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6">Vista previa de revisión. Los formularios no envían mensajes ni crean reservas.</div>';
      html = html.replace(/(<main[^>]*>)/, '$1' + notice);
    }
  }
  await writeFile(join(output, name), html);
}
await cp(join(root, 'assets'), join(output, 'assets'), { recursive: true });
await cp(join(root, 'data/proyectos.json'), join(output, 'data/proyectos.json'));
await cp(join(root, 'data/hipotecario.json'), join(output, 'data/hipotecario.json'));
await cp(join(root, 'sitemap.xml'), join(output, 'sitemap.xml'));
await writeFile(join(output, 'robots.txt'), preview ? 'User-agent: *\nDisallow: /\n' : await readFile(join(root, 'robots.txt'), 'utf8'));
console.log(JSON.stringify({ pages: pages.length, publicDataFiles: ['proyectos.json', 'hipotecario.json'], environment: preview ? 'preview' : 'production', noindex: preview }));
