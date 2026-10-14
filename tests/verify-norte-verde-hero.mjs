import assert from 'node:assert/strict';
import { readFileSync, readdirSync, lstatSync, realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NORTE_VERDE_SLUGS, NORTE_VERDE_PACKAGER_SHA256, NORTE_VERDE_STYLESHEET_SHA256,
  assertNorteVerdeCatalogue, verifyNorteVerdeAssets } from '../scripts/norte-verde-publication.mjs';

const gitRoot = fileURLToPath(new URL('../', import.meta.url));
const options = { source: gitRoot, public: null, 'baseline-preview': '/private/tmp/norte-verde-deploy/dist', receipt: null };
const args = process.argv.slice(2);
assert.equal(args.length % 2, 0, 'Options require --name value pairs');
for (let index = 0; index < args.length; index += 2) {
  const key = args[index].replace(/^--/, '');
  assert.ok(args[index].startsWith('--') && Object.hasOwn(options, key), 'Unknown verifier option: ' + args[index]);
  options[key] = args[index + 1];
}
const source = realpathSync(resolve(options.source));
const output = realpathSync(resolve(options.public || resolve(source, 'dist')));
const previous = realpathSync(resolve(options['baseline-preview']));
assert.notEqual(output, previous, 'The prior protected Preview must remain an independent preservation reference');
const baseline = '54c43fabee7ce75031a57f88249e17a7fcd8b3f0';
const branch = 'codex/norte-verde-hero-variantes';
const tags = '<link rel="stylesheet" href="/assets/css/norte-verde-hero-variants.css?v=20261014"><script src="/assets/js/norte-verde-hero-variants.js?v=20261014"></script>';
const additions = ['assets/css/norte-verde-hero-variants.css', 'assets/js/norte-verde-hero-variants.js', 'assets/review/norte-verde-hero-variantes.html'];
const sha256 = value => createHash('sha256').update(value).digest('hex');
const read = (root, path) => {
  const file = resolve(root, path);
  assert.ok(file.startsWith(root + '/') && lstatSync(file).isFile() && realpathSync(file) === file, 'Regular in-root file required: ' + file);
  return readFileSync(file);
};
const original = path => execFileSync('git', ['show', baseline + ':' + path], { cwd: gitRoot, maxBuffer: 16 * 1024 * 1024 });
const files = root => {
  const visit = path => readdirSync(path).flatMap(name => {
    const file = resolve(path, name), stat = lstatSync(file);
    assert.ok(!stat.isSymbolicLink(), 'Symbolic output resource: ' + file);
    return stat.isDirectory() ? visit(file) : [relative(root, file)];
  });
  return visit(root).sort();
};

execFileSync('git', ['cat-file', '-e', baseline + '^{commit}'], { cwd: gitRoot });
assert.equal(sha256(read(source, 'scripts/package-vercel.mjs')), NORTE_VERDE_PACKAGER_SHA256);
assert.deepEqual(read(source, 'scripts/package-vercel.mjs'), original('scripts/package-vercel.mjs'));
assert.equal(sha256(read(source, 'assets/css/norte-verde.css')), NORTE_VERDE_STYLESHEET_SHA256);
assert.equal(sha256(read(output, 'assets/css/norte-verde.css')), NORTE_VERDE_STYLESHEET_SHA256);
const configuration = JSON.parse(original('vercel.json'));
configuration.git.deploymentEnabled[branch] = false;
configuration.buildCommand = 'node scripts/package-norte-verde-hero.mjs';
assert.deepEqual(read(source, 'vercel.json'), Buffer.from(JSON.stringify(configuration, null, 2) + '\n'), 'Only the new manual gate and wrapper build command may change Vercel configuration');
const rejectionCases = [
  { environment: 'production', ref: branch, pattern: /protected Preview only/ },
  { environment: 'preview', ref: 'codex/unrelated-hero', pattern: /exact authorized branch/ },
  { environment: 'preview', ref: undefined, pattern: /exact authorized branch/ },
  { environment: 'preview', ref: branch, profile: 'public-web', pattern: /original protected Preview content profile/ },
];
for (const item of rejectionCases) {
  const env = { ...process.env, VERCEL_ENV: item.environment };
  delete env.VERCEL_GIT_COMMIT_REF; delete env.SOLLAHMS_BROCHURE_PROFILE;
  if (item.ref !== undefined) env.VERCEL_GIT_COMMIT_REF = item.ref;
  if (item.profile !== undefined) env.SOLLAHMS_BROCHURE_PROFILE = item.profile;
  const rejected = spawnSync(process.execPath, [resolve(source, 'scripts/package-norte-verde-hero.mjs')], {
    cwd: source, env, encoding: 'utf8', timeout: 15_000,
  });
  assert.equal(rejected.error, undefined); assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, item.pattern, 'The wrapper must reject unauthorized environments before running the base pipeline');
}

const projects = JSON.parse(read(source, 'data/proyectos.json'));
assertNorteVerdeCatalogue(projects);
const known = new Set(NORTE_VERDE_SLUGS);
assert.deepEqual(projects, JSON.parse(original('data/proyectos.json')), 'All134catalogue rows must remain exact');
const tracked = execFileSync('git', ['ls-tree', '-r', baseline, '--', 'data', 'assets'], { cwd: gitRoot, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  .trim().split('\n').filter(Boolean).map(line => {
    const [meta, path] = line.split('\t');
    const [mode, kind, hash] = meta.split(' ');
    assert.equal(kind, 'blob'); assert.notEqual(mode, '120000');
    return { path, hash };
  });
for (const { path, hash } of tracked) {
  const bytes = read(source, path);
  assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), hash, 'Existing source data/asset changed: ' + path);
}
const sourcePages = execFileSync('git', ['ls-tree', '--name-only', baseline], { cwd: gitRoot, encoding: 'utf8' }).trim().split('\n').filter(path => path.endsWith('.html'));
assert.equal(sourcePages.length, 141);
for (const path of sourcePages) assert.deepEqual(read(source, path), original(path), 'Existing source page changed: ' + path);
for (const path of ['sitemap.xml', 'robots.txt', 'lib/project-context.mjs', 'templates/project-detail.html'])
  assert.deepEqual(read(source, path), original(path), 'Existing project route/context/template changed: ' + path);

const review = JSON.parse(read(source, 'data/brochures-norte-verde.json'));
const sourceMedia = await verifyNorteVerdeAssets(review, { root: source });
const outputMedia = await verifyNorteVerdeAssets(review, { root: output });
assert.deepEqual(outputMedia, sourceMedia, 'All original PDF, gallery and plan bindings must remain intact');

const previousFiles = files(previous), currentFiles = files(output);
assert.deepEqual(currentFiles, [...previousFiles, ...additions].sort(), 'Only the three exact hero review assets may extend the prior protected Preview');
let preservedPages = 0, restoredHeroes = 0, preservedAssets = 0;
for (const path of previousFiles) {
  const bytes = read(output, path), before = read(previous, path);
  if (known.has(path.replace(/\.html$/, '')) && path.endsWith('.html')) {
    const html = bytes.toString();
    assert.equal(html.split(tags).length - 1, 1, 'Two exact consecutive head tags are required once: ' + path);
    assert.ok(html.slice(0, html.indexOf('</head>')).includes(tags), 'The review script must run in HEAD without defer: ' + path);
    assert.deepEqual(Buffer.from(html.replace(tags, '')), before, 'The complete previous Norte Verde fiche must be recoverable byte for byte: ' + path);
    restoredHeroes++;
  } else {
    assert.deepEqual(bytes, before, 'Unrelated protected Preview bytes changed: ' + path);
    if (path.startsWith('assets/')) preservedAssets++;
    if (projects.some(project => !known.has(project.slug) && path === project.slug + '.html')) preservedPages++;
  }
}
assert.equal(restoredHeroes, 17); assert.equal(preservedPages, 117);
const assetEvidence = additions.map(path => {
  const bytes = read(source, path);
  assert.deepEqual(read(output, path), bytes, 'New hero resource differs between source and Preview: ' + path);
  return { path, sha256: sha256(bytes), bytes: bytes.length };
});
const comparison = read(output, additions[2]).toString();
assert.match(comparison, /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i, 'The private comparison needs its own noindex declaration');
const buildReceipt = JSON.parse(read(source, '.vercel/norte-verde-hero-build.json'));
assert.equal(buildReceipt.actualBranch, branch); assert.equal(buildReceipt.environment, 'preview');
assert.equal(buildReceipt.compatibilityPipelineRef, 'codex/norte-verde-cartera-definitiva');
assert.equal(buildReceipt.compatibilityProfile, 'original_protected_preview_default');
assert.equal(buildReceipt.originalPackagerSha256, NORTE_VERDE_PACKAGER_SHA256);
assert.equal(buildReceipt.originalStylesheetSha256, NORTE_VERDE_STYLESHEET_SHA256);
assert.equal(buildReceipt.injectedTags, tags); assert.deepEqual(buildReceipt.assets, assetEvidence);
assert.equal(buildReceipt.productionAuthorized, false); assert.equal(buildReceipt.pages.length, 17);
assert.deepEqual(new Set(buildReceipt.pages.map(page => page.path)), new Set(NORTE_VERDE_SLUGS.map(slug => slug + '.html')));
for (const page of buildReceipt.pages) {
  assert.equal(page.beforeSha256, sha256(read(previous, page.path)));
  assert.equal(page.afterSha256, sha256(read(output, page.path)));
}
const receipt = { allPassed: true, baseCommit: baseline, actualBranch: branch, source, output, previousPreview: previous,
  sourcePagesPreserved: sourcePages.length, otherDeveloperPagesPreserved: preservedPages, norteVerdeFichesRecoverable: restoredHeroes,
  catalogueRowsPreserved: projects.length, trackedSourceDataAndAssetsPreserved: tracked.length, priorOutputAssetsPreserved: preservedAssets,
  originalPdfsVerified: sourceMedia.filter(asset => asset.kind === 'document').length,
  galleriesAndPlansVerified: sourceMedia.filter(asset => asset.kind !== 'document').length,
  originalPackagerSha256: NORTE_VERDE_PACKAGER_SHA256, originalStylesheetSha256: NORTE_VERDE_STYLESHEET_SHA256,
  rejectedUnauthorizedBuilds: rejectionCases.length,
  additions: assetEvidence, outsideHeroContentChanged: false, productionAuthorized: false, messagesSent: 0, reservationsCreated: 0 };
if (options.receipt) {
  const path = resolve(options.receipt);
  assert.ok(![source, output, previous].some(root => path === root || path.startsWith(root + '/')), 'Verification receipts must remain outside source and Preview directories');
  mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(receipt, null, 2) + '\n');
}
console.log(JSON.stringify(receipt, null, 2));
