import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { brochurePublication } from '../scripts/brochure-publication.mjs';

const review = JSON.parse(readFileSync(new URL('../data/brochures-ingevec.json', import.meta.url)));
function verifiedFixture() {
  const fixture = structuredClone(review);
  fixture.publicationRights.contractScope = {
    ...fixture.publicationRights.contractScope,
    status: 'verified_contract', evidenceSha256: 'a'.repeat(64),
    verifiedOn: '2026-10-10', permittedOrigins: ['https://sollahms.cl'],
    permittedUses: ['web_promotion'],
    coveredDocuments: fixture.projects.map(record => record.document.sha256),
  };
  // Synthetic policy fixture: never writes verified rights to the live manifest.
  return fixture;
}

test('Yapo/IRIS provenance replaces individual licences without fabricating contractual verification', () => {
  assert.deepEqual(brochurePublication(review), { protectedReview: true, publicWeb: false });
  assert.equal(review.publicationRights.contractScope.evidenceSha256, null);
  assert.equal(review.publicationRights.publicSourceDistribution, 'pending_contract_scope_verification');
  assert.doesNotMatch(JSON.stringify(review.publicationRights), /pending_explicit_license/);
});

test('a verified website contract covers the exact document batch without an individual-image licence', () => {
  const fixture = verifiedFixture();
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
