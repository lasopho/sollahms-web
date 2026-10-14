import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NORTE_VERDE_SLUGS, NORTE_VERDE_PACKAGER_SHA256, NORTE_VERDE_STYLESHEET_SHA256 } from './norte-verde-publication.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const branch = 'codex/norte-verde-hero-variantes';
const compatibilityRef = 'codex/norte-verde-cartera-definitiva';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const tags = '<link rel="stylesheet" href="/assets/css/norte-verde-hero-variants.css?v=20261014"><script src="/assets/js/norte-verde-hero-variants.js?v=20261014"></script>';
const additions = ['assets/css/norte-verde-hero-variants.css', 'assets/js/norte-verde-hero-variants.js', 'assets/review/norte-verde-hero-variantes.html'];

assert.equal(process.env.VERCEL_ENV, 'preview', 'Norte Verde hero variants are authorized for protected Preview only');
assert.equal(process.env.VERCEL_GIT_COMMIT_REF, branch, 'Norte Verde hero variants require their exact authorized branch');
assert.equal(process.env.SOLLAHMS_BROCHURE_PROFILE, undefined, 'Hero review preserves the original protected Preview content profile');
assert.equal(sha256(await readFile(resolve(root, 'scripts/package-vercel.mjs'))), NORTE_VERDE_PACKAGER_SHA256, 'The original Norte Verde packager must remain unchanged');
assert.equal(sha256(await readFile(resolve(root, 'assets/css/norte-verde.css'))), NORTE_VERDE_STYLESHEET_SHA256, 'The original Norte Verde stylesheet must remain unchanged');

const sources = new Map();
for (const slug of NORTE_VERDE_SLUGS) sources.set(slug + '.html', sha256(await readFile(resolve(root, slug + '.html'))));
const assetEvidence = [];
for (const path of additions) {
  assert.ok((await lstat(resolve(root, path))).isFile(), 'Hero review assets must be regular files: ' + path);
  const bytes = await readFile(resolve(root, path));
  assetEvidence.push({ path, sha256: sha256(bytes), bytes: bytes.length });
}

// Validate the real new branch above, then replay the immutable original
// protected pipeline in a child with its documentary compatibility reference.
// This changes neither the caller's environment nor deployment Git metadata.
const build = spawnSync(process.execPath, [resolve(root, 'scripts/package-vercel.mjs')], {
  cwd: root, env: { ...process.env, VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: compatibilityRef },
  encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
});
if (build.error) throw build.error;
if (build.stdout) process.stdout.write(build.stdout);
if (build.stderr) process.stderr.write(build.stderr);
assert.equal(build.status, 0, 'The original protected Norte Verde package must pass before applying hero variants');

const pages = [];
for (const slug of NORTE_VERDE_SLUGS) {
  const path = slug + '.html';
  assert.equal(sha256(await readFile(resolve(root, path))), sources.get(path), 'Source fiche changed during packaging: ' + path);
  const output = resolve(root, 'dist', path);
  const before = await readFile(output, 'utf8');
  assert.equal(before.split('</head>').length - 1, 1, 'Exactly one head is required: ' + path);
  assert.equal(before.split('class="project-hero nv-hero"').length - 1, 1, 'Only an authorized Norte Verde hero may receive the review assets: ' + path);
  assert.ok(!before.includes('/assets/css/norte-verde-hero-variants.css') && !before.includes('/assets/js/norte-verde-hero-variants.js'), 'Hero variants must be injected exactly once: ' + path);
  const after = before.replace('</head>', tags + '</head>');
  assert.equal(after.replace(tags, ''), before, 'Only the two exact head tags may change the output: ' + path);
  await writeFile(output, after);
  pages.push({ path, beforeSha256: sha256(before), afterSha256: sha256(after) });
}
await mkdir(resolve(root, '.vercel'), { recursive: true });
await writeFile(resolve(root, '.vercel/norte-verde-hero-build.json'), JSON.stringify({
  schemaVersion: 1, baseCommit: '54c43fabee7ce75031a57f88249e17a7fcd8b3f0',
  environment: 'preview', actualBranch: branch, compatibilityPipelineRef: compatibilityRef,
  compatibilityProfile: 'original_protected_preview_default', originalPackagerSha256: NORTE_VERDE_PACKAGER_SHA256,
  originalStylesheetSha256: NORTE_VERDE_STYLESHEET_SHA256, injectedTags: tags, pages, assets: assetEvidence,
  productionAuthorized: false, messagesSent: 0, reservationsCreated: 0,
}, null, 2) + '\n');
console.log(JSON.stringify({ heroVariantProjects: pages.length, environment: 'preview', branch, originalSourceFichesChanged: 0 }));
