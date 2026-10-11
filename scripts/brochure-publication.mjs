// Evidence contains only an attestation/hash. Contract text stays private.
// Public website use and redistribution of the source repository are distinct
// channels; a protected review is already authorized by the user.
export function brochureSourceDocuments(review) {
  const documents = [];
  for (const record of review.projects ?? []) {
    const sources = record.documents ?? [record.document];
    if (!Array.isArray(sources) || sources.length === 0 ||
        !sources.some(source => source?.sha256 === record.document?.sha256)) {
      throw new Error('Brochure source document batch is missing or invalid');
    }
    for (const source of sources) {
      if (!/^[a-f0-9]{64}$/.test(source?.sha256 ?? '') || documents.includes(source.sha256)) {
        throw new Error('Brochure source document evidence is missing, duplicated or invalid');
      }
      documents.push(source.sha256);
    }
  }
  return documents.sort();
}

export function brochurePublication(review, site = 'https://sollahms.cl') {
  const rights = review.publicationRights;
  if (rights?.sourceChannel !== 'Yapo/IRIS' ||
      rights.basis !== 'user_contract_attestation' ||
      rights.protectedPreview !== 'authorized_by_user' ||
      rights.individualAssetLicense !== 'not_required_when_contract_covered' ||
      rights.productionPolicy !== 'requires_verified_contract_scope') {
    throw new Error('Brochure review authorization is missing or invalid');
  }
  const documents = brochureSourceDocuments(review);
  const scope = rights.contractScope;
  if (scope?.status === 'pending_contract_scope_verification') {
    return { protectedReview: true, publicWeb: false };
  }
  const requiredExclusions = ['contract_documents', 'internal_commercial_information',
    'original_pdfs', 'unapproved_candidates'];
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
