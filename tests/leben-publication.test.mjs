import test from 'node:test';
import { restoreNorteVerdeData } from './norte-verde-preservation.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateLebenReview, lebenPublication, assertLebenBuildEnvironment, LEBEN_BROCHURE_SLUGS } from '../scripts/leben-publication.mjs';
import { assertBrochureCatalogue } from '../scripts/brochure-publication.mjs';

function fixture() {
  const projects = LEBEN_BROCHURE_SLUGS.map((slug, index) => {
    const document = {fileName: slug + '.pdf', sha256: index.toString(16).padStart(64, '0'), pageCount: 4, sourceChannel: 'Leben/user_supplied'};
    const image = {localPath: '/assets/propiedades/leben-preview/' + slug + '/photo.webp', sha256: 'a'.repeat(64),
      sourceSha256: document.sha256, sourcePage: 1, width: 900, height: 600, nativeWidth: 900, nativeHeight: 600,
      visuallyVerified: true, privacySafe: true, qualityDecision: 'keep'};
    const plan = {...image, localPath: image.localPath.replace('photo', 'plan'), sourcePage: 3, sourceKind: 'vector'};
    return {slug, document, documents: [document], images: [image], models: [{modelo: 'A', sourceSha256: document.sha256,
      sourcePages: [3], pagina_brochure: 3, visuallyVerified: true, plan}], catalogueCover: {localPath: image.localPath, alt: 'Fotografía referencial'}};
  });
  return {schemaVersion: 1, inmobiliaria: 'Leben', protectedPreviewOnly: true,
    sourcePackage: {sourceMode: 'regenerated_from_local_originals', inventorySha256: 'c'.repeat(64), status: 'reviewed', originalPdfCount: 12, originalsValidatedBySha256: 12,
      instructions: {fileName: 'INSTRUCCIONES_CODEX.md', sha256: 'd'.repeat(64)}},
    publicationRights: {sourceChannel: 'Leben/user_supplied', protectedPreview: 'authorized_by_user',
      productionPolicy: 'requires_verified_contract_scope', contractScope: {status: 'pending_contract_scope_verification'}},
    projects, sourceDocuments: projects.map(record => record.document)};
}

test('a synthetic reviewed Leben fixture selects only the twelve existing identities and grants protected review', () => {
  const review = fixture();
  assert.equal(validateLebenReview(review).length, 24);
  assert.deepEqual(lebenPublication(review), {protectedReview: true, publicWeb: false});
  assert.ok(!LEBEN_BROCHURE_SLUGS.includes('edificio-nordico'));
  assert.ok(!LEBEN_BROCHURE_SLUGS.includes('own'));
  assert.doesNotThrow(() => assertLebenBuildEnvironment({ VERCEL: '1', VERCEL_ENV: 'preview' }));
  assert.doesNotThrow(() => assertLebenBuildEnvironment({ VERCEL_ENV: 'production' }));
  assert.throws(() => assertLebenBuildEnvironment({ VERCEL: '1', VERCEL_ENV: 'production' }), /protected Preview deployment/);
});

test('missing original review, altered sources, rejected/upscaled media and foreign paths fail closed', () => {
  const mutations = [
    review => {delete review.sourcePackage;},
    review => {review.sourcePackage.originalsValidatedBySha256 = 11;},
    review => {review.sourcePackage.instructions.sha256 = null;},
    review => {review.sourceDocuments.pop();},
    review => {review.projects[0].slug = 'parque-germania-2';},
    review => {review.projects[0].images[0].sourcePage = 5;},
    review => {review.projects[0].images[0].localPath = '/assets/propiedades/leben-preview/other/photo.webp';},
    review => {review.projects[0].images[0].qualityDecision = 'exclude';},
    review => {review.projects[0].images[0].nativeWidth = 400;},
    review => {review.projects[0].models[0].sourcePages = [2, 3];},
    review => {Object.assign(review.projects[0].models[0].plan, {sourceKind: 'raster', nativeHeight: 20});},
    review => {review.publicationRights.contractScope.status = 'verified_contract';},
  ];
  for (const mutate of mutations) {
    const review = fixture(); mutate(review);
    assert.throws(() => validateLebenReview(review), /Leben:/);
  }
});

test('Nórdico can extend the frozen catalogue once without changing any commercial baseline field', () => {
  const catalogue = restoreNorteVerdeData(JSON.parse(readFileSync(new URL('../data/proyectos.json', import.meta.url)))).filter(project => project.slug !== 'edificio-nordico');
  const nordico = {slug: 'edificio-nordico', inmobiliaria: 'Leben', detalleUrl: '/edificio-nordico.html',
    verificacion: {fuente: 'https://nordico.ileben.cl/', estadoFuente: 'verified'}};
  assert.doesNotThrow(() => assertBrochureCatalogue([...catalogue, nordico]));
  assert.throws(() => assertBrochureCatalogue([...catalogue, nordico, nordico]), /Nórdico/);
  const changed = structuredClone(catalogue); changed.find(record => record.slug === 'parque-germania').precioDesdeUF += 1;
  assert.throws(() => assertBrochureCatalogue([...changed, nordico]), /121 projects/);
});
