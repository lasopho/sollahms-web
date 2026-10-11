import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { brochurePublication, brochureSourceDocuments, assertBrochureCatalogue,
  BROCHURE_INGEVEC_SLUGS, BROCHURE_REMOVED_SLUGS } from '../scripts/brochure-publication.mjs';

const review = JSON.parse(readFileSync(new URL('../data/brochures-ingevec.json', import.meta.url)));
function verifiedFixture() {
  const fixture = structuredClone(review);
  fixture.publicationRights.contractScope = {
    ...fixture.publicationRights.contractScope,
    status: 'verified_contract', evidenceSha256: 'a'.repeat(64),
    verifiedOn: '2026-10-10', permittedOrigins: ['https://sollahms.cl'],
    permittedUses: ['web_promotion'],
    coveredDocuments: brochureSourceDocuments(fixture),
  };
  // Synthetic policy fixture: never writes verified rights to the live manifest.
  return fixture;
}

test('official Chilean terms and the direct owner attestation cover the supplied website material', () => {
  assert.deepEqual(brochurePublication(review), { protectedReview: true, publicWeb: true });
  const scope = review.publicationRights.contractScope;
  assert.match(scope.evidenceSha256, /^[a-f0-9]{64}$/);
  assert.equal(scope.verifiedOn, '2026-10-11');
  assert.deepEqual(scope.permittedOrigins, ['https://sollahms.cl']);
  assert.deepEqual(scope.permittedUses, ['web_promotion']);
  assert.deepEqual(scope.coveredDocuments, brochureSourceDocuments(review));
  assert.deepEqual(scope.evidence, {
    type: 'official_terms_and_owner_attestation',
    termsUrl: 'https://iris.yapo.cl/terminos-y-condiciones',
    termsUpdatedOn: '2023-08-04',
    termsSha256: '99e724e9cee0539229d1dbfc1e7e44c6094f24368ccd4c96bc5f08aed2361853',
    liveBundleSha256: 'ff1798ff2c3b9ff7392c1e322eced52210bab8f7f5a17b2a001114b2ab559ed0',
    ownerAttestation: 'user_confirmed_yapo_iris_channel_and_sollahms_web_use',
    clauses: ['Publicidad sobre el Proyecto', 'Entrega de materiales'],
  });
  assert.equal(review.publicationRights.publicSourceDistribution, 'pending_contract_scope_verification');
  assert.doesNotMatch(JSON.stringify(review.publicationRights), /pending_explicit_license/);
});

test('an unverified owner provenance alone retains only the protected review permission', () => {
  const fixture = structuredClone(review);
  Object.assign(fixture.publicationRights.contractScope, {
    status: 'pending_contract_scope_verification', evidenceSha256: null,
    verifiedOn: null, permittedOrigins: [], permittedUses: [], coveredDocuments: [],
  });
  delete fixture.publicationRights.contractScope.evidence;
  assert.deepEqual(brochurePublication(fixture), { protectedReview: true, publicWeb: false });
});

test('a verified website contract covers the exact document batch without an individual-image licence', () => {
  const fixture = verifiedFixture();
  assert.equal(fixture.projects.length, 16);
  assert.equal(brochureSourceDocuments(fixture).length, 17,
    'Coverage includes all seventeen originals, including both Vicuña stages and the newly promoted documents');
  assert.deepEqual(brochurePublication(fixture), { protectedReview: true, publicWeb: true });
  assert.equal(fixture.publicationRights.publicSourceDistribution, 'pending_contract_scope_verification',
    'Website coverage is not recorded as public repository coverage');
});

test('wrong site, wrong use, missing evidence, partial documents and lifted private exclusions fail closed', () => {
  const mutations = [
    scope => { scope.permittedOrigins = ['https://unrelated.test.invalid']; },
    scope => { scope.permittedUses = ['social_media']; },
    scope => { scope.evidenceSha256 = null; },
    scope => { scope.coveredDocuments.pop(); },
    scope => { scope.coveredDocuments.push(scope.coveredDocuments[0]); },
    scope => { scope.exclusions = []; },
    scope => { scope.status = 'expired_contract'; },
    scope => { delete scope.evidence; },
    scope => { scope.evidence.termsUrl = 'https://unrelated.test.invalid/terms'; },
    scope => { scope.evidence.termsSha256 = null; },
    scope => { scope.evidence.liveBundleSha256 = null; },
    scope => { scope.evidence.ownerAttestation = 'account_signature_independently_verified'; },
    scope => { scope.evidence.clauses = ['Unrelated clause']; },
  ];
  for (const mutate of mutations) {
    const fixture = verifiedFixture();
    mutate(fixture.publicationRights.contractScope);
    assert.throws(() => brochurePublication(fixture), /contract scope/);
  }
});

test('an unauthorized review or removed Yapo/IRIS provenance cannot authorize a deployment', () => {
  for (const field of ['sourceChannel', 'basis', 'protectedPreview', 'individualAssetLicense', 'productionPolicy']) {
    const fixture = verifiedFixture();
    delete fixture.publicationRights[field];
    assert.throws(() => brochurePublication(fixture), /authorization/);
  }
});

test('multi-stage website coverage requires both original documents and never treats the primary source as full coverage', () => {
  const fixture = verifiedFixture();
  const record = fixture.projects[0];
  const second = { ...record.document, sha256: 'b'.repeat(64) };
  record.documents = [record.document, second];
  assert.throws(() => brochurePublication(fixture), /contract scope/);
  fixture.publicationRights.contractScope.coveredDocuments = brochureSourceDocuments(fixture);
  assert.deepEqual(brochurePublication(fixture), { protectedReview: true, publicWeb: true });
  record.documents.pop();
  assert.throws(() => brochurePublication(fixture), /contract scope/);
});

test('missing primary source and duplicate stage documents fail even during a protected review', () => {
  for (const sources of [[], [{ sha256: 'b'.repeat(64) }], [review.projects[0].document, review.projects[0].document],
    [{ ...review.projects[0].document, fileName: 'unrelated.pdf' }],
    [{ ...review.projects[0].document, pageCount: review.projects[0].document.pageCount + 1 }]]) {
    const fixture = structuredClone(review);
    fixture.projects[0].documents = sources;
    assert.throws(() => brochurePublication(fixture), /source document/);
  }
});

test('the final catalogue pins sixteen authorized identities and all 128 unaffected projects without Git at build time', () => {
  const catalogue = JSON.parse(readFileSync(new URL('../data/proyectos.json', import.meta.url)));
  assert.doesNotThrow(() => assertBrochureCatalogue(catalogue));
  assert.equal(BROCHURE_INGEVEC_SLUGS.length, 16);
  assert.equal(BROCHURE_REMOVED_SLUGS.length, 6);
  assert.equal(catalogue.filter(project => project.inmobiliaria !== 'Ingevec').length, 128);
  for (const kind of ['retired-project', 'unknown-project', 'duplicate', 'other-price', 'other-route', 'developer']) {
    const copy = structuredClone(catalogue);
    const position = copy.findIndex(project => project.slug === 'los-alerces');
    const other = copy.find(project => project.inmobiliaria !== 'Ingevec');
    if (kind === 'retired-project') copy[position].slug = BROCHURE_REMOVED_SLUGS[0];
    else if (kind === 'unknown-project') copy[position].slug = 'unapproved-candidate';
    else if (kind === 'duplicate') copy[position] = copy[0];
    else if (kind === 'other-price') other.precioDesdeUF = 999999;
    else if (kind === 'other-route') other.detalleUrl = '/unrelated-project.html';
    else copy[position].inmobiliaria = 'Euroinmobiliaria';
    assert.throws(() => assertBrochureCatalogue(copy), /approved catalogue|128 projects/, kind);
  }
});
