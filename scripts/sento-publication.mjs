import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { restoreLeonRows, projectLeonFile } from './leon-combined-scope.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const SENTO_SLUGS = Object.freeze(['angamos', 'curico-77', 'domeyko-2055', 'jofre-135', 'mirador-la-florida', 'plaza-las-condes', 'san-ignacio']);
export const SENTO_MANIFEST = 'data/sento-review.json';
export const SENTO_DOCUMENTS = Object.freeze({
  'curico-77': ['4aced7cd07f11a65a02885a83b134c09338e82b58e7acf0df14ef1897c3bcdf8', 17],
  'domeyko-2055': ['01451ac31ac2441997e341d1ae91e27954a0b0a6862adcc4223678edc4ad3a7b', 6],
  'jofre-135': ['c55b58c468201c8b252c2148666203039109dd1d39bc98bdd2501a4cd00a1dd0', 6],
  'mirador-la-florida': ['8d591a6572948c1fc17466727c500b2c573d371027625d59c0624055ab946199', 22],
  'plaza-las-condes': ['85ba1584b1f4658b57d26768682cfebff8f4823541625326221657e71e935a6d', 9],
  'san-ignacio': ['cc8e7cdfb6f68fc1e375ef71c8ddaf85f614d50ff8a6b5d3494c2d6806a69a5f', 6],
});
// One exact official replacement provides the complete A4 diagram that the
// brochure's stock band obscures. This never authorizes a different project,
// code, URL or source image through a mutable review.
export const SENTO_OFFICIAL_PLAN_IMAGE = Object.freeze({
  slug: 'mirador-la-florida', code: 'A4',
  sourceUrl: 'https://sento.cl/wp-content/uploads/2025/10/PLANTAS-MIRADOR_A4.jpg',
  sha256: 'da3d35c85d17f27503a47c0176445f287ab75f39442bb28ec9c83af17e779741',
  sourcePage: 18,
});
const PLAN_AUDIT_DIGESTS = Object.freeze({
  'data/sento-plan-audit-pdf.json': '4eff4766ed0a523028787fab5d2be2e372453579a8f4e28840039821759c2ee8',
  'data/sento-plan-audit-angamos.json': 'b52d42bc6567614503812e21b5c537d1d2fa4a6ea9305bb8fea3f09a0c5e24ae',
});
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonical(item)])) : value;
export const sentoFingerprint = value => digest(JSON.stringify(canonical(value)));
const baselineBytes = readFileSync(resolve(ROOT, 'data/sento-baseline.json'));
assert.equal(digest(baselineBytes), '78fa927b17b0d7cda3f58744f6ba8c134a0b8cd36306b250cfd92af4e01d4d19', 'Sento: independent baseline changed');
export const sentoBaseline = JSON.parse(baselineBytes);
const mergeBaselineBytes = readFileSync(resolve(ROOT, 'data/sento-main-baseline.json'));
assert.equal(digest(mergeBaselineBytes), 'b97c7de6fded5cc25ed726192e9a0de1ef5c6a68e016b5afe63bb9a332557326', 'Sento: independent main baseline changed');
export const sentoMainBaseline = JSON.parse(mergeBaselineBytes);
// Independent union boundary: the approved 005f7da Leben/Ecasa source has
// exactly 130 non-Sento rows. Only the seven pinned Sento rows may extend it.
export const sentoCombinedBaseline = Object.freeze({
  sourceCommit: '005f7da40025b67b9aa73d661cb5cf4da87dbeef', catalogueCount: 137,
  otherRowsSha256: Object.freeze({
    'data/proyectos.json': '534292377fb483c695421f83e51a9be6a53bed21a1793f51d5916d6751019ec6',
    'data/fichas-proyectos.json': 'c71d67f2cff46e8834e227014eea57697f68c66b279526185ced3323d2653468',
    'data/registro-fichas.json': 'de8427be072e9ee2927900a36042787c94b1a6eabcb16bae0b9f297f97c80969',
  }),
  originalSharedSha256: Object.freeze({
    'scripts/package-vercel.mjs': 'ffe69f84887c61d4b8992779eb46a42efca2f7db2caafc18e9ac02ea2eca788e',
    'scripts/brochure-publication.mjs': '2a1981c8deabe915f589a3b8344601b8e52678ffa8f7623049c3df68f72adaf2',
    'vercel.json': '50a9f60d8995a79b09cd63253d4fea4add1bc4c41f151a28a88e93cf6bcec797',
  }),
});
function assertForeignSentoRows(rows, file) {
  const expected = rows.length === sentoCombinedBaseline.catalogueCount ? sentoCombinedBaseline : sentoMainBaseline;
  assert.equal(rows.length, expected.catalogueCount, 'Sento: unreviewed catalogue composition');
  assert.equal(sentoFingerprint(rows.filter(row => !SENTO_SLUGS.includes(row.slug))), expected.otherRowsSha256[file],
    'Sento: another main developer changed outside the exact reviewed composition');
}
function assertProjectedShared(file, bytes) {
  assert.ok([sentoMainBaseline.originalSharedFiles[file].sha256, sentoCombinedBaseline.originalSharedSha256[file]].includes(digest(bytes)),
    'Sento: shared bytes changed outside the exact reviewed union: ' + file);
}
const optionalReview = () => {
  if (!existsSync(resolve(ROOT, SENTO_MANIFEST))) return null;
  const bytes = readFileSync(resolve(ROOT, SENTO_MANIFEST));
  assert.equal(digest(bytes), 'e44ae176a8fe3384ba33df0306e0a97594fc2a1c692aa423310e9b4b6a1bea5f', 'Sento: validated Preview review changed');
  return JSON.parse(bytes);
};
const approvedHtml = Object.freeze({
  'angamos.html': '5921af48e73609d102d13186f3d15281e17b255ca442ddc3371ecb855e13bcf3',
  'curico-77.html': 'e901b0be1c42d747ec0d452d1da699663567f4ac3a7e24e12afbf35ca4220dd1',
  'domeyko-2055.html': '35bdc47bd418989b100b0ea717b7ea2dd0f28ebe4bb19aea7d599fae6aec681d',
  'jofre-135.html': '50b8145aa50a1eb0071a8afc136a871d429fa08e479a03bd6c613c276bf386df',
  'mirador-la-florida.html': 'a65bdc9678aa8f009f326ddf5ce43921d06ae9b8f7f7f435d03bada15c132ed7',
  'plaza-las-condes.html': '284267bf313b28e89d365bc9ca3d5000e203e2e1b680e7631c24e825367cb9d0',
  'san-ignacio.html': 'aae00dbd858bd9282086ff168a85f7fe14a7d04469bb273de6dade0fd1ce943c',
});

// Historical developer audits retain their original pins. Only the seven
// independently bound Sento successor rows may be projected to their originals.
export function restoreSentoRows(rows, file = 'data/proyectos.json') {
  const original = sentoBaseline.originalRows[file];
  if (!original || !SENTO_SLUGS.every(slug => rows.some(row => row.slug === slug))) return rows;
  const review = optionalReview();
  const current = file === 'data/proyectos.json' ? review?.catalogue : review?.[file === 'data/fichas-proyectos.json' ? 'research' : 'ledger'];
  return rows.map(row => {
    if (!SENTO_SLUGS.includes(row.slug)) return row;
    const old = original.find(value => value.slug === row.slug);
    const approved = current?.find(value => value.slug === row.slug);
    assert.ok(sentoFingerprint(row) === sentoFingerprint(old) || approved && sentoFingerprint(row) === sentoFingerprint(approved), 'Sento: unapproved successor row ' + row.slug);
    return structuredClone(old);
  });
}
export function restoreSentoContexts(contexts) {
  const originals = new Map(sentoBaseline.originalRows['data/proyectos.json'].map(row => [row.slug, { name: row.nombre, url: row.detalleUrl }]));
  const review = optionalReview();
  return Object.fromEntries(Object.entries(contexts).map(([slug, value]) => {
    if (!originals.has(slug)) return [slug, value];
    const old = originals.get(slug), row = review?.catalogue.find(row => row.slug === slug);
    assert.ok(sentoFingerprint(value) === sentoFingerprint(old) || row && sentoFingerprint(value) === sentoFingerprint({ name: row.nombre, url: row.detalleUrl }), 'Sento: unapproved project context ' + slug);
    return [slug, structuredClone(old)];
  }));
}
export function projectSentoFile(file, value) {
  value = projectLeonFile(file, value);
  if (file === 'scripts/brochure-publication.mjs') {
    const projected = Buffer.from(value.toString().replace("import { restoreSentoRows } from './sento-publication.mjs';\n", '').replace('restoreSentoRows(projects).filter', 'projects.filter'));
    assertProjectedShared(file, projected);
    return projected;
  }
  if (file === 'scripts/norte-verde-publication.mjs') {
    return Buffer.from(value.toString().replace("import { restoreSentoRows } from './sento-publication.mjs';\n", '')
      .replaceAll('restoreSentoRows(projects)', 'projects'));
  }
  if (file === 'scripts/package-vercel.mjs') {
    const projected = Buffer.from(value.toString()
      .replace("import { assertSentoCatalogue, verifySentoAssets, SENTO_MANIFEST } from './sento-publication.mjs';\n", '')
      .replace("  if (process.env.VERCEL_GIT_COMMIT_REF !== 'codex/sento-cartera-documentada') throw new Error('Unexpected branch for this review build');", "  throw new Error('Unexpected branch for this review build');")
      .replace(/let sentoReview = null;[\s\S]*?const sentoPaths = new Set\(sentoAssets\.map\(asset => join\(root, asset\.localPath\.slice\(1\)\)\)\);\n/, '')
      .replace('if (sentoReview) assertSentoCatalogue(sourceProjects, sentoReview);\n', '')
      .replace(/    if \(path\.startsWith\('assets\/brochures\/sento'\)[\s\S]*?sentoPaths\.has\(source\);\n    }\n/, '')
      .replace(/^  sentoProjects: sentoReview\?\.projects\.length[^\n]*\n/m, ''));
    assertProjectedShared(file, projected);
    return projected;
  }
  if (SENTO_SLUGS.includes(file.replace(/\.html$/, '')) && file.endsWith('.html')) {
    const approved = optionalReview()?.projects.find(row => row.slug + '.html' === file);
    assert.ok(approved, 'Sento: missing reviewed fiche');
    const original = execFileSync('git', ['show', sentoMainBaseline.sourceCommit + ':' + file], { cwd: ROOT });
    assert.ok(digest(value) === approvedHtml[file] || digest(value) === digest(original), 'Sento: unreviewed fiche change');
    return original;
  }
  if (sentoBaseline.originalRows[file]) {
    const restored = restoreSentoRows(JSON.parse(value), file);
    assertForeignSentoRows(restored, file);
    return Buffer.from(JSON.stringify(restored, null, 2) + '\n');
  }
  if (file === 'lib/project-context.mjs') {
    return Buffer.from(value.toString().replace(/(export const projects = Object\.freeze\()([\s\S]*?)(\);)/,
      (_, start, data, end) => start + JSON.stringify(restoreSentoContexts(JSON.parse(data)), null, 2) + end));
  }
  if (file === 'vercel.json') {
    const data = JSON.parse(value);
    if (Object.hasOwn(data.git?.deploymentEnabled ?? {}, 'codex/sento-cartera-documentada')) {
      assert.equal(data.git.deploymentEnabled['codex/sento-cartera-documentada'], false);
      assert.equal(data.git.deploymentEnabled.main, false);
      const multiline = ',\n      "codex/sento-cartera-documentada": false';
      const compact = ', "codex/sento-cartera-documentada": false';
      const text = value.toString();
      const addition = text.includes(multiline) ? multiline : compact;
      assert.equal(text.split(addition).length, 2, 'Sento: only its literal disabled gate may be projected');
      const projected = Buffer.from(text.replace(addition, ''));
      assertProjectedShared(file, projected);
      return projected;
    }
  }
  return value;
}
export function assertSentoCatalogue(rows, review = optionalReview()) {
  rows = restoreLeonRows(rows);
  assert.ok(review && review.schemaVersion === 1 && review.protectedPreviewOnly === true, 'Sento: reviewed Preview source is required');
  assertForeignSentoRows(rows, 'data/proyectos.json');
  if (rows.length === sentoCombinedBaseline.catalogueCount) {
    assert.equal(rows.filter(row => row.inmobiliaria === 'Ecasa').length, 15, 'Sento: combined catalogue must preserve fifteen Ecasa projects');
    assert.equal(rows.filter(row => row.slug === 'edificio-nordico' && row.inmobiliaria === 'Leben').length, 1, 'Sento: combined catalogue must preserve Nórdico once');
  }
  assert.equal(new Set(rows.map(row => row.slug)).size, rows.length, 'Sento: duplicate project');
  assert.deepEqual(rows.filter(row => row.inmobiliaria === 'Sento').map(row => row.slug).sort(), [...SENTO_SLUGS], 'Sento: exact seven identities required');
  assert.equal(sentoFingerprint(rows.filter(row => SENTO_SLUGS.includes(row.slug))), sentoFingerprint(review.catalogue), 'Sento: catalogue differs from reviewed sources');
  for (const row of review.catalogue) {
    assert.equal(row.detalleUrl, '/' + row.slug + '.html');
    assert.equal(row.superficieDesdeM2, null, 'Sento: documentary plans cannot imply available minimum');
    assert.ok(row.precioDesdeUF === null || row.commercialSource?.verifiedOn === '2026-10-13' && row.commercialSource?.sourceUrl?.startsWith('https://sento.cl/proyectos/'), 'Sento: price must have a current official source');
  }
  return rows;
}
export function sentoAssets(review) {
  const assets = review.projects.flatMap(record => {
    const photos = record.images.flatMap(image => [image, ...Object.values(image.variants ?? {}).flat(), ...(image.original?.localPath ? [image.original] : [])]);
    return [...(record.document ? [record.document] : []), ...photos, ...record.models.flatMap(model => [model.plan, ...Object.values(model.plan.variants ?? {}).flat()])];
  });
  return [...new Map(assets.map(asset => [asset.localPath, asset])).values()];
}
export function historicalSentoAssetFiles(files) {
  const assets = new Map(sentoAssets(optionalReview()).map(asset => [asset.localPath.slice(1), asset]));
  const stylesheet = 'assets/css/sento.css';
  return files.filter(file => {
    const expected = file === stylesheet ? '388d11aff6bc78ba8787b3af3bf4b33e8f7928cce98d15b8765c2fa7bd262574' : assets.get(file)?.sha256;
    if (!expected) return true;
    assert.equal(digest(readFileSync(resolve(ROOT, file))), expected, 'Sento: unreviewed historical resource exclusion');
    return false;
  });
}
export function verifySentoAssets(review, { root = ROOT } = {}) {
  if (review.planAuditCheckedOn) {
    const evidence = new Map();
    for (const [file, sha256] of Object.entries(PLAN_AUDIT_DIGESTS)) {
      const bytes = readFileSync(resolve(ROOT, file));
      assert.equal(digest(bytes), sha256, 'Sento: independent plan audit changed');
      for (const model of JSON.parse(bytes).models) evidence.set(model.slug + ':' + model.code, model);
    }
    assert.equal(evidence.size, 45);
    const fields = ['label', 'kind', 'valueM2', 'publishable', 'sourceRef'];
    const boundAreas = areas => areas.map(area => Object.fromEntries(fields.map(field => [field, area[field]])));
    for (const record of review.projects) for (const model of record.models) {
      const source = evidence.get(record.slug + ':' + model.code);
      assert.ok(source && source.originalLabel === model.label, 'Sento: plan audit code/project mismatch');
      assert.equal(model.bedrooms, source.bedrooms, 'Sento: unverified bedroom count');
      assert.equal(model.bathrooms, source.bathrooms, 'Sento: unverified bathroom count');
      assert.deepEqual(boundAreas(model.areas), boundAreas(source.areas), 'Sento: unverified or recalculated plan surface');
    }
  }
  assert.deepEqual(review.projects.map(record => record.slug).sort(), [...SENTO_SLUGS]);
  assert.equal(review.projects.filter(record => record.document).length, 6);
  const assets = sentoAssets(review), seen = new Set();
  for (const record of review.projects) {
    const prefix = '/assets/propiedades/sento/' + record.slug + '/';
    const originals = SENTO_DOCUMENTS[record.slug];
    if (originals) assert.deepEqual([record.document?.sha256, record.document?.pageCount], originals, 'Sento: independently supplied PDF changed');
    const names = new Set(), photos = new Set();
    for (const photo of record.images) {
      assert.ok(photo.localPath.startsWith(prefix) && !photos.has(photo.localPath), 'Sento: duplicate or foreign gallery photo'); photos.add(photo.localPath);
      if (originals) assert.ok(photo.sourceSha256 === originals[0] && Number.isInteger(photo.sourcePage) && photo.sourcePage >= 1 && photo.sourcePage <= originals[1], 'Sento: photo belongs to another PDF');
      for (const variant of Object.values(photo.variants ?? {}).flat()) assert.ok(variant.localPath.startsWith(prefix) && variant.width <= photo.width, 'Sento: invalid responsive photo');
    }
    for (const model of record.models) {
      assert.ok(model.label && !names.has(model.label) && model.plan?.localPath?.startsWith(prefix) && model.plan.visuallyVerified, 'Sento: duplicate or foreign model'); names.add(model.label);
      if (originals && model.plan.extractionMethod === 'official_original_image') {
        const pinned = SENTO_OFFICIAL_PLAN_IMAGE;
        assert.equal(record.slug, pinned.slug, 'Sento: unapproved official plan project');
        assert.equal(model.code || model.label, pinned.code, 'Sento: unapproved official plan code');
        assert.equal(model.plan.sourceUrl, pinned.sourceUrl, 'Sento: unapproved official plan URL');
        assert.equal(model.plan.original?.sha256, pinned.sha256, 'Sento: unapproved official original');
        assert.equal(model.plan.sourceSha256, pinned.sha256, 'Sento: official source binding changed');
        assert.equal(model.plan.brochureEvidence?.sourceSha256, originals[0], 'Sento: missing same-project brochure evidence');
        assert.equal(model.plan.brochureEvidence?.sourcePage, pinned.sourcePage, 'Sento: brochure comparison page changed');
        assert.equal(model.sourcePage, pinned.sourcePage, 'Sento: model comparison page changed');
        assert.equal(model.plan.sourceProjectSlug, pinned.slug);
        assert.equal(model.plan.sourceCode, pinned.code);
      } else if (originals) assert.ok(model.plan.sourceSha256 === originals[0] && model.plan.sourcePage === model.sourcePage && Number.isInteger(model.sourcePage) && model.sourcePage >= 1 && model.sourcePage <= originals[1], 'Sento: plan belongs to another PDF or page');
      for (const variant of Object.values(model.plan.variants ?? {}).flat()) assert.ok(variant.localPath.startsWith(prefix) && variant.width <= model.plan.width, 'Sento: invalid responsive plan');
    }
    assert.ok(record.images.some(image => image.localPath === record.cover && image.kind === 'facade'), 'Sento: cover must be a reviewed facade');
    assert.ok(record.models.length && record.models.every(model => model.areas.length && model.areas.every(area => area.label && (area.valueM2 === null || Number.isFinite(area.valueM2) && (area.valueM2 > 0 || area.valueM2 === 0 && area.kind === 'terrace' && area.absenceConfirmed === true && area.sourceRef)))), 'Sento: missing or invalid printed plan areas');
    assert.ok(record.images.every(image => image.visuallyVerified === true), 'Sento: visual photo review required');
  }
  for (const asset of assets) {
    assert.ok(asset?.localPath && /^\/assets\/(?:propiedades|brochures)\/sento\/[a-z0-9/._-]+$/.test(asset.localPath) && !asset.localPath.includes('..') && /^[a-f0-9]{64}$/.test(asset.sha256), 'Sento: invalid asset inventory');
    assert.ok(!seen.has(asset.localPath)); seen.add(asset.localPath);
    const path = resolve(root, asset.localPath.slice(1));
    assert.ok(lstatSync(path).isFile() && realpathSync(path) === path, 'Sento: symlink or nonregular asset');
    const bytes = readFileSync(path);
    assert.equal(digest(bytes), asset.sha256, 'Sento: resource differs from reviewed original ' + asset.localPath);
    if (asset.bytes != null) assert.equal(bytes.length, asset.bytes);
    if (!path.endsWith('.pdf')) assert.ok(asset.width > 0 && asset.height > 0, 'Sento: missing encoded dimensions');
  }
  return assets;
}
