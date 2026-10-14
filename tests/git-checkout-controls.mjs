import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brochurePublication, brochureSourceDocuments, assertBrochureCatalogue,
  BROCHURE_INGEVEC_SLUGS, BROCHURE_REMOVED_SLUGS, BROCHURE_PUBLIC_PAGES } from '../scripts/brochure-publication.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const INTEGRATION = 'codex/integracion-financiera-sollahms';
const TOUR_REVIEW = 'codex/recorridos-validos-144';
const AUTOMATIC_EMBEDS = 'codex/mapas-recorridos-auto';
const MAP_CLEANUP = 'codex/limpieza-mapas-fichas';
const APPROVED_PORTFOLIO = 'e7afe04';
const read = path => readFileSync(resolve(ROOT, path));
const json = path => JSON.parse(read(path));
const git = (...args) => execFileSync('git', args, { cwd: ROOT });
const configuration = json('vercel.json');

function assertManualDeploymentGates(config) {
  assert.deepEqual(config.git?.deploymentEnabled, { main: false, [INTEGRATION]: false, [TOUR_REVIEW]: false, [AUTOMATIC_EMBEDS]: false, [MAP_CLEANUP]: false, 'codex/norte-verde-hero-merge': false },
    'Main, integration and map/tour review branches require the reproducible manual deployment path');
}
function assertSecurityHeaders(config) {
  const global = config.headers?.filter(rule => rule.source === '/(.*)');
  assert.equal(global?.length, 1);
  const headers = new Map(global[0].headers.map(row => [row.key.toLowerCase(), row.value]));
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.equal(headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(headers.get('content-security-policy'), "base-uri 'self'; object-src 'none'; frame-ancestors 'self'");
}

test('manual deployment gates reject missing integration protection, enabled branches and overlapping permissive patterns', () => {
  assertManualDeploymentGates(configuration);
  for (const mutation of [
    config => { delete config.git.deploymentEnabled[INTEGRATION]; },
    config => { delete config.git.deploymentEnabled[TOUR_REVIEW]; },
    config => { config.git.deploymentEnabled[TOUR_REVIEW] = true; },
    config => { delete config.git.deploymentEnabled[AUTOMATIC_EMBEDS]; },
    config => { config.git.deploymentEnabled[AUTOMATIC_EMBEDS] = true; },
    config => { delete config.git.deploymentEnabled[MAP_CLEANUP]; },
    config => { config.git.deploymentEnabled[MAP_CLEANUP] = true; },
    config => { delete config.git.deploymentEnabled['codex/norte-verde-hero-merge']; },
    config => { config.git.deploymentEnabled['codex/norte-verde-hero-merge'] = true; },
    config => { config.git.deploymentEnabled.main = true; },
    config => { config.git.deploymentEnabled[INTEGRATION] = true; },
    config => { config.git.deploymentEnabled['*'] = true; },
    config => { config.git.deploymentEnabled = true; },
  ]) {
    const changed = structuredClone(configuration); mutation(changed);
    assert.throws(() => assertManualDeploymentGates(changed));
  }
});

test('shared security headers reject missing and weakened framing, MIME, referrer and base/object policies', () => {
  assertSecurityHeaders(configuration);
  const policy = configuration.headers.find(rule => rule.source === '/(.*)');
  for (const key of ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Content-Security-Policy']) {
    const changed = structuredClone(configuration);
    const global = changed.headers.find(rule => rule.source === '/(.*)');
    global.headers = global.headers.filter(row => row.key.toLowerCase() !== key.toLowerCase());
    assert.throws(() => assertSecurityHeaders(changed));
  }
  for (const [key, value] of [['X-Frame-Options', 'ALLOWALL'], ['Content-Security-Policy', "frame-ancestors *"], ['X-Content-Type-Options', '']]) {
    const changed = structuredClone(configuration);
    const global = changed.headers.find(rule => rule.source === '/(.*)');
    global.headers.find(row => row.key.toLowerCase() === key.toLowerCase()).value = value;
    assert.throws(() => assertSecurityHeaders(changed));
  }
  assert.ok(policy);
});

test('all 144 catalogue objects and 16 Ingevec identities remain byte-identical to the approved portfolio', () => {
  const catalogue = json('data/proyectos.json');
  assertBrochureCatalogue(catalogue);
  assert.equal(catalogue.length, 144);
  assert.equal(catalogue.filter(project => project.inmobiliaria === 'Ingevec').length, 16);
  assert.deepEqual(read('data/proyectos.json'), git('show', APPROVED_PORTFOLIO + ':data/proyectos.json'));
  assert.deepEqual(read('data/hipotecario.json'), git('show', APPROVED_PORTFOLIO + ':data/hipotecario.json'));
  const changed = structuredClone(catalogue);
  changed.find(project => project.inmobiliaria !== 'Ingevec').nombre += ' changed';
  assert.throws(() => assertBrochureCatalogue(changed));
  const resurrected = structuredClone(catalogue);
  resurrected[0].slug = BROCHURE_REMOVED_SLUGS[0];
  assert.throws(() => assertBrochureCatalogue(resurrected));
});

test('contract and source controls validate the exact 165-resource Ingevec manifest without requiring private image bytes', () => {
  const manifest = json('data/brochures-ingevec.json');
  assert.deepEqual(brochurePublication(manifest), { protectedReview: true, publicWeb: true });
  assert.equal(manifest.projects.length, 16);
  assert.deepEqual(new Set(manifest.projects.map(project => project.slug)), new Set(BROCHURE_INGEVEC_SLUGS));
  assert.equal(brochureSourceDocuments(manifest).length, 17);
  assert.equal(manifest.projects.reduce((total, project) => total + project.images.length, 0), 101);
  assert.equal(manifest.projects.reduce((total, project) => total + project.models.length, 0), 64);
  const paths = manifest.projects.flatMap(project => [...project.images, ...project.models.map(model => model.plan)].map(asset => {
    assert.ok(asset.localPath.startsWith('/assets/propiedades/ingevec-preview/' + project.slug + '/'));
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    return asset.localPath;
  }));
  assert.equal(new Set(paths).size, 165);
  assert.equal(manifest.publicationRights.publicSourceDistribution, 'pending_contract_scope_verification');
  const changed = structuredClone(manifest);
  changed.publicationRights.contractScope.coveredDocuments.pop();
  assert.throws(() => brochurePublication(changed), /contract scope/);
});

test('Git CI never publishes private originals or secretly imports the 165 Ingevec derivatives', () => {
  const paths = git('ls-files', '-z').toString().split('\0').filter(Boolean);
  assert.equal(paths.some(path => path.startsWith('assets/propiedades/ingevec-preview/')), false);
  assert.equal(existsSync(resolve(ROOT, 'assets/propiedades/ingevec-preview')), false,
    'This check is specifically for an ordinary Git checkout, not the private release package');
  assert.equal(paths.some(path => /\.pdf$/i.test(path)), false);
  assert.equal(paths.some(path => /(?:^|\/)(?:brochure-candidates|contratos?|private-input)(?:\/|$)/i.test(path)), false);
});

test('the 144 fiches retain routes, contextual actions and approved image/plan references without visitor audit sections', () => {
  const catalogue = json('data/proyectos.json');
  const pages = git('ls-files', '-z').toString().split('\0').filter(path => /^[^/]+\.html$/.test(path));
  assert.deepEqual(new Set(pages), new Set([...BROCHURE_PUBLIC_PAGES, ...catalogue.map(project => project.slug + '.html')]));
  const manifests = ['data/brochures-aj-urbana.json', 'data/brochures-ingevec.json'].map(json);
  const bySlug = new Map(manifests.flatMap(manifest => manifest.projects.map(project => [project.slug, project])));
  for (const project of catalogue) {
    const html = read(project.slug + '.html').toString();
    const text = html.replace(/<!--[\s\S]*?-->|<head\b[^>]*>[\s\S]*?<\/head>|<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi, '').replace(/<[^>]*>/g, ' ');
    assert.doesNotMatch(text, /Fuentes oficiales|Fecha de verificaci[oó]n|Procedencia documental|evidenceSha256|Yapo\/IRIS|Auditor[ií]a interna/i, project.slug);
    assert.ok(html.includes('/contacto.html?proyecto=' + project.slug), project.slug);
    assert.ok(html.includes('/agenda-asesoria.html?proyecto=' + project.slug), project.slug);
    const review = bySlug.get(project.slug);
    if (review) for (const asset of [...review.images, ...review.models.map(model => model.plan)]) assert.ok(html.includes(asset.localPath), project.slug);
  }
});

function assertIncompleteBuildRejected(environment, partial) {
  const fixture = mkdtempSync(join(tmpdir(), 'sollahms-incomplete-git-ci-'));
  try {
    for (const path of ['scripts/package-vercel.mjs', 'scripts/brochure-publication.mjs', 'data/brochures-aj-urbana.json', 'data/brochures-ingevec.json']) {
      const target = resolve(fixture, path);
      mkdirSync(dirname(target), { recursive: true }); copyFileSync(resolve(ROOT, path), target);
    }
    if (partial) {
      const asset = json('data/brochures-ingevec.json').projects[0].images[0];
      const target = resolve(fixture, asset.localPath.slice(1));
      mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, 'synthetic CI bytes; never a publishable image');
    }
    const env = { ...process.env, VERCEL_ENV: environment, VERCEL_GIT_COMMIT_REF: INTEGRATION, SOLLAHMS_BROCHURE_PROFILE: 'public-web' };
    const result = spawnSync(process.execPath, [resolve(fixture, 'scripts/package-vercel.mjs')], { cwd: fixture, env, encoding: 'utf8', timeout: 15_000 });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0, 'A missing private batch must never be declared a successful public build');
    assert.match(result.stderr, /Incomplete Ingevec contract-covered media batch: reproducible source package required/);
    assert.equal(existsSync(resolve(fixture, 'dist')), false, 'No incomplete static deployment output is created');
    assert.equal(existsSync(resolve(fixture, '.vercel/brochure-build-inventory.json')), false);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
}

test('a Production-profile Git-only source is rejected before output when the 165 covered media are absent', () => {
  assertIncompleteBuildRejected('production', false);
});

test('a Preview-profile source with a simulated partial batch is rejected before output without lifting rights or build guards', () => {
  assertIncompleteBuildRejected('preview', true);
});
