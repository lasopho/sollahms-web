// Evidence contains only an attestation/hash. Contract text stays private.
// Public website use and redistribution of the source repository are distinct
// channels; a protected review is already authorized by the user.
export function brochurePublication(review, site = 'https://sollahms.cl') {
  const rights = review.publicationRights;
  if (rights?.sourceChannel !== 'Yapo/IRIS' ||
      rights.basis !== 'user_contract_attestation' ||
      rights.protectedPreview !== 'authorized_by_user' ||
      rights.individualAssetLicense !== 'not_required_when_contract_covered' ||
      rights.productionPolicy !== 'requires_verified_contract_scope') {
    throw new Error('Brochure review authorization is missing or invalid');
  }
  const scope = rights.contractScope;
  if (scope?.status === 'pending_contract_scope_verification') {
    return { protectedReview: true, publicWeb: false };
  }
  const requiredExclusions = ['contract_documents', 'internal_commercial_information',
    'original_pdfs', 'unapproved_candidates'];
  const documents = review.projects.map(record => record.document.sha256).sort();
  const covered = [...(scope?.coveredDocuments ?? [])].sort();
  if (scope?.status !== 'verified_contract' || !/^[a-f0-9]{64}$/.test(scope.evidenceSha256 ?? '') ||
      !/^\d{4}-\d{2}-\d{2}$/.test(scope.verifiedOn ?? '') ||
      !scope.permittedOrigins?.includes(new URL(site).origin) ||
      !scope.permittedUses?.includes('web_promotion') ||
      !requiredExclusions.every(value => scope.exclusions?.includes(value)) ||
      JSON.stringify(documents) !== JSON.stringify(covered)) {
    throw new Error('Yapo/IRIS contract scope is missing, invalid or does not cover this website and document batch');
  }
  return { protectedReview: true, publicWeb: true };
}
