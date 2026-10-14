// Evidence contains only an attestation/hash. Contract text stays private.
// Public website use and redistribution of the source repository are distinct
// channels; a protected review is already authorized by the user.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { restoreSentoRows } from './sento-publication.mjs';

export const BROCHURE_INGEVEC_SLUGS = Object.freeze([
  'centenario-1', 'tocornal', 'vivaceta', 'coronel-godoy', 'diagonal-paraguay',
  'el-aromo', 'los-lilenes', 'matta-016', 'nueva-esmeralda', 'vicuna-mackenna-7589',
  'abdon-cifuentes', 'don-ignacio', 'terrazzo', 'vima', 'los-alerces', 'valle-los-ingleses-iii',
]);
export const BROCHURE_REMOVED_SLUGS = Object.freeze([
  'brasil', 'vespucio-capital', 'edificio-serrano-capital',
  'edificio-carrera-capital', 'edificio-froilan-roa', 'hacienda-lo-errazuriz',
]);
export const BROCHURE_PUBLIC_PAGES = Object.freeze([
  '404.html', 'agenda-asesoria.html', 'comparador-hipotecario.html',
  'contacto.html', 'index.html', 'privacidad.html', 'proyectos.html',
]);
// Historical resources stay in source control. A resource used exclusively
// by a retired project is excluded from public packaging, never deleted.
export const BROCHURE_RETIRED_ASSETS = Object.freeze([
  '/assets/propiedades/catalogo/a563beb6adb19f55406aff15.webp',
  '/assets/propiedades/catalogo/045681ecf683fff01b6c662e.webp',
  '/assets/propiedades/catalogo/ff0e16740bb921f587be6864.webp',
  '/assets/propiedades/catalogo/1c8afdcef4daab70c27ecb01.webp',
  '/assets/propiedades/catalogo/ae7bcf577b09a561c3359867.webp',
  '/assets/propiedades/catalogo/2e0af89ee3298d9791639ae2.webp',
]);
// Canonical fingerprints pin the 128 unaffected catalogue objects from
// 8cdb9bf; the packaged source does not require a .git directory to check them.
const OTHER_CATALOGUE_SHA256 = '22a466f71ae9eaddbf8ed5642cbc5440ed2b9615b8a4abcafccd4c801c27a446';
export const canonicalBrochureValue = value => Array.isArray(value) ? value.map(canonicalBrochureValue) :
  value && typeof value === 'object' ? Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, item]) => [key, canonicalBrochureValue(item)])) : value;
export const brochureFingerprint = value => createHash('sha256')
  .update(JSON.stringify(canonicalBrochureValue(value))).digest('hex');

// Project only the independently approved León successor for historical checks.
// Other developer objects retain their original values and fingerprint checks.
export function restoreLeonRows(rows, file='data/proyectos.json') {
  const baselineUrl=new URL('../data/leon-main-baseline.json',import.meta.url);
  const reviewUrl=new URL('../data/brochures-leon.json',import.meta.url);
  if(!existsSync(baselineUrl)||!existsSync(reviewUrl))return rows;
  const baseline=JSON.parse(readFileSync(baselineUrl)),review=JSON.parse(readFileSync(reviewUrl));
  const originals=baseline.originalRows[file];if(!originals)return rows;
  const slugs=new Set([...baseline.authorizedSlugs,...baseline.retiredSlugs]);
  const actual=rows.filter(p=>slugs.has(p.slug));
  if(brochureFingerprint(actual)===brochureFingerprint(originals))return rows;
  const approved=review[file==='data/proyectos.json'?'catalogue':file==='data/fichas-proyectos.json'?'research':'ledger'];
  if(actual.length!==5||rows.some(p=>baseline.retiredSlugs.includes(p.slug))||actual.some(p=>brochureFingerprint(p)!==brochureFingerprint(approved.find(q=>q.slug===p.slug))))throw new Error('The approved catalogue requires exact León successors');
  const old=new Map(originals.map(p=>[p.slug,p]));const result=rows.map(p=>slugs.has(p.slug)?structuredClone(old.get(p.slug)):p);
  const order=new Map(baseline.catalogueOrder.map((slug,index)=>[slug,index]));
  for(const slug of baseline.retiredSlugs){const index=result.findIndex(p=>order.get(p.slug)>order.get(slug));result.splice(index<0?result.length:index,0,structuredClone(old.get(slug)));}
  return result;
}

export function assertBrochureCatalogue(projects) {
  projects = restoreLeonRows(projects);
  const allowed = new Set(BROCHURE_INGEVEC_SLUGS);
  const slugs = new Set(projects.map(project => project.slug));
  if (projects.length !== 144 || slugs.size !== 144 ||
      !BROCHURE_INGEVEC_SLUGS.every(slug => slugs.has(slug)) ||
      BROCHURE_REMOVED_SLUGS.some(slug => slugs.has(slug)) ||
      projects.some(project => allowed.has(project.slug) && project.inmobiliaria !== 'Ingevec')) {
    throw new Error('The approved catalogue must contain exactly 144 projects with the sixteen authorized Ingevec identities');
  }
  const untouched = restoreSentoRows(projects).filter(project => !allowed.has(project.slug));
  if (untouched.length !== 128 || brochureFingerprint(untouched) !== OTHER_CATALOGUE_SHA256) {
    throw new Error('The 128 projects from other developers must remain unchanged from the approved catalogue');
  }
}

export function brochureSourceDocuments(review) {
  const documents = [];
  for (const record of review.projects ?? []) {
    const sources = record.documents ?? [record.document];
    if (!Array.isArray(sources) || sources.length === 0 ||
        !sources.some(source => source?.sha256 === record.document?.sha256 &&
          source?.fileName === record.document?.fileName && source?.pageCount === record.document?.pageCount &&
          source?.sourceChannel === record.document?.sourceChannel &&
          (source?.etapa ?? null) === (record.document?.etapa ?? null))) {
      throw new Error('Brochure source document batch is missing or invalid');
    }
    for (const source of sources) {
      if (!/^[a-f0-9]{64}$/.test(source?.sha256 ?? '') || documents.includes(source.sha256) ||
          !/^[^/\\]+\.pdf$/i.test(source?.fileName ?? '') ||
          !Number.isInteger(source?.pageCount) || source.pageCount < 1 || source.sourceChannel !== 'Yapo/IRIS') {
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
  const evidence = scope?.evidence;
  const verifiedBasis = evidence?.type === 'official_terms_and_owner_attestation' &&
    evidence.termsUrl === 'https://iris.yapo.cl/terminos-y-condiciones' &&
    /^\d{4}-\d{2}-\d{2}$/.test(evidence.termsUpdatedOn ?? '') &&
    /^[a-f0-9]{64}$/.test(evidence.termsSha256 ?? '') &&
    /^[a-f0-9]{64}$/.test(evidence.liveBundleSha256 ?? '') &&
    evidence.ownerAttestation === 'user_confirmed_yapo_iris_channel_and_sollahms_web_use' &&
    ['Publicidad sobre el Proyecto', 'Entrega de materiales'].every(clause => evidence.clauses?.includes(clause));
  if (scope?.status !== 'verified_contract' || !/^[a-f0-9]{64}$/.test(scope.evidenceSha256 ?? '') ||
      !verifiedBasis ||
      !/^\d{4}-\d{2}-\d{2}$/.test(scope.verifiedOn ?? '') ||
      !scope.permittedOrigins?.includes(new URL(site).origin) ||
      !scope.permittedUses?.includes('web_promotion') ||
      !requiredExclusions.every(value => scope.exclusions?.includes(value)) ||
      JSON.stringify(documents) !== JSON.stringify(covered)) {
    throw new Error('Yapo/IRIS contract scope is missing, invalid or does not cover this website and document batch');
  }
  return { protectedReview: true, publicWeb: true };
}
