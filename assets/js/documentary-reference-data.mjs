/**
 * Pinned documentary references for explicit local review only.
 * No transport, public integration, offer factory or published-data mutation.
 */
export const DOCUMENTARY_REVIEW_MODE = 'local-review';
export const DOCUMENTARY_SOURCE_LAYER = 'documentary-local-only-not-offer';

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const slug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const clone = value => JSON.parse(JSON.stringify(value));
const fail = message => { throw new TypeError('Documentary source: ' + message); };
const require = (condition, message) => { if (!condition) fail(message); };
const pointer = value => typeof value === 'string' && /^(?:\/(?:[^~]|~[01])*)*$/.test(value);
const properties = new Set(['departamento', 'casa', 'local', 'oficina', 'terreno', 'duplex', 'estudio']);
const identityKeys = ['slug', 'nombre', 'inmobiliaria', 'comuna', 'region'];
const recordKeys = ['slug', 'name', 'sourceLayer', 'notOffer', 'commercialAdoptionAllowed',
  'sourceProject', 'projectFacts', 'projectIdentityContext', 'references', 'bindingLimit'];
const referenceKeys = ['id', 'sourceKind', 'notOffer', 'commercialAdoptionAllowed', 'stock',
  'sourceId', 'sourceURL', 'sourceFile', 'sourceSHA256', 'sourcePointer', 'sourceRegistryPointer',
  'sourceDocumentDate', 'sourceDate', 'dateKind', 'observedAtUTC', 'scope', 'unitLabel',
  'modelLabel', 'literalDescription', 'modelCodePolicy', 'attributes', 'sourceMetrics',
  'sourceFieldPointers', 'externalPriceMetadata', 'constraints', 'unknownPolicy'];
const nullableOnly = ['priceUF', 'usefulM2', 'totalM2', 'interiorM2', 'landM2', 'gardenM2',
  'privateTerrace', 'privateGarden', 'parkingIncluded', 'parkingAvailable',
  'storageIncluded', 'storageAvailable', 'state', 'delivery'];
const numericKeys = ['bedrooms', 'bathrooms', 'internalM2', 'terraceM2', 'lotTotalM2'];
const attributeKeys = [...nullableOnly, ...numericKeys, 'propertyType'];
const metricRules = {
  internalM2: { label: 'internos', mapping: 'canonicalInteriorUsefulTotalMapping' },
  terraceM2: { label: 'terraza' },
  lotTotalM2: { label: 'totales', mapping: 'canonicalResidentialTotalMapping' },
};

function keys(value, allowed, label) {
  require(object(value) && Object.keys(value).every(key => allowed.includes(key)),
    'unauthorized field in ' + label);
}

function date(value) {
  if (value === null) return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return false;
  const day = value.slice(0, 10), parsed = Date.parse(day + 'T00:00:00.000Z');
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === day
    && Number.isFinite(Date.parse(value));
}

function observed(value) {
  return typeof value === 'string' && value.includes('T') && date(value)
    && /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
}

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

async function sourceJSON(sourceText, options) {
  require(options?.mode === DOCUMENTARY_REVIEW_MODE, 'explicit local-review mode is required');
  require(typeof sourceText === 'string', 'pinned UTF-8 source text is required');
  require(hash(options.sourceGuard?.sha256), 'independent source SHA-256 guard is required');
  require(globalThis.crypto?.subtle, 'WebCrypto is required for the source guard');
  const bytes = new TextEncoder().encode(sourceText);
  const actual = [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes))]
    .map(value => value.toString(16).padStart(2, '0')).join('');
  require(actual === options.sourceGuard.sha256, 'source SHA-256 mismatch');
  let evidence;
  try { evidence = JSON.parse(sourceText); } catch { fail('invalid source JSON'); }
  return { evidence, sha256: actual };
}

function attributes(reference) {
  const input = reference.attributes;
  keys(input, attributeKeys, 'reference attributes');
  require(own(input, 'priceUF') && input.priceUF === null, 'commercial priceUF must be null');
  for (const key of nullableOnly) {
    require(!own(input, key) || input[key] === null, 'unadmitted commercial/metric field: ' + key);
  }
  require(input.propertyType === null || properties.has(input.propertyType),
    'property type must be explicit canonical data or null');
  for (const key of numericKeys) {
    require(!own(input, key) || input[key] === null || number(input[key]), 'invalid numeric field: ' + key);
    if (['bedrooms', 'bathrooms'].includes(key) && input[key] != null) {
      require(Number.isInteger(input[key]), 'room count must be an explicit integer');
    }
  }
  const output = Object.fromEntries(attributeKeys.map(key => [key, input[key] ?? null]));
  require(output.lotTotalM2 === null || output.propertyType === 'terreno',
    'lot total requires an explicit terreno reference');
  require(Array.isArray(reference.sourceMetrics), 'source metrics are required');
  const seen = new Set();
  for (const metric of reference.sourceMetrics) {
    keys(metric, ['sourceLabel', 'subject', 'valueM2', 'storedKey',
      'canonicalInteriorUsefulTotalMapping', 'canonicalResidentialTotalMapping', 'scope'], 'source metric');
    const rule = metricRules[metric.storedKey];
    require(rule && !seen.has(metric.storedKey), 'unknown or duplicate source metric');
    require(text(metric.sourceLabel) && metric.sourceLabel.trim().toLowerCase() === rule.label,
      'metric label cannot be aliased');
    require(number(metric.valueM2) && output[metric.storedKey] === metric.valueM2,
      'metric value does not match its reference');
    if (rule.mapping) require(metric[rule.mapping] === null, 'metric conversion is not admitted');
    if (metric.storedKey === 'lotTotalM2') require(metric.subject === 'lote', 'lot metric subject mismatch');
    seen.add(metric.storedKey);
  }
  for (const key of Object.keys(metricRules)) {
    require((output[key] !== null) === seen.has(key), 'missing or unexpected source metric: ' + key);
  }
  return output;
}

function sourceReference(reference, evidence, ids) {
  keys(reference, referenceKeys, 'reference');
  require(text(reference.id) && /^[A-Za-z0-9][A-Za-z0-9:._-]*$/.test(reference.id)
    && !ids.has(reference.id), 'invalid or duplicate reference ID');
  ids.add(reference.id);
  require(reference.notOffer === true && reference.commercialAdoptionAllowed === false
    && own(reference, 'stock') && reference.stock === null, 'reference must remain a non-offer with null stock');
  require(text(reference.sourceKind) && reference.sourceKind.includes('DOCUMENTARY')
    && reference.sourceKind.endsWith('NOT_OFFER'), 'commercial or administrative source kind is not admitted');
  const source = evidence.sourcePrimaryManifest[reference.sourceFile];
  require(own(evidence.sourcePrimaryManifest, reference.sourceFile) && object(source)
    && hash(reference.sourceSHA256) && reference.sourceSHA256 === source.sha256,
  'reference source hash is not in the pinned manifest');
  require(text(reference.scope) && pointer(reference.sourcePointer)
    && /^\/references\/\d+$/.test(reference.sourceRegistryPointer), 'source scope/pointer is required');
  let url;
  try { url = new URL(reference.sourceURL); } catch { fail('invalid source URL'); }
  require(url.protocol === 'https:' && !url.username && !url.password
    && reference.sourceId === reference.sourceURL, 'invalid documentary source identity');
  require(date(reference.sourceDate) && date(reference.sourceDocumentDate)
    && observed(reference.observedAtUTC) && text(reference.dateKind), 'invalid source/observation date');
  if (reference.dateKind === 'observation-only') {
    require(reference.sourceDate === null && reference.sourceDocumentDate === null,
      'observation date cannot become a source date');
  }
  require(Array.isArray(reference.constraints) && object(reference.sourceFieldPointers)
    && Object.values(reference.sourceFieldPointers).every(pointer), 'documentary constraints/pointers are required');
  const external = reference.externalPriceMetadata;
  keys(external, ['use', 'source', 'listUF', 'finalUF', 'sourceDocumentDate',
    'observedAtUTC', 'notOwnerAuthorization'], 'external price metadata');
  require(external.use === 'provenance_only_not_for_offering_or_commercial_filter'
    && external.notOwnerAuthorization === true, 'external price must remain documentary metadata');
  for (const key of ['listUF', 'finalUF']) {
    require(external[key] === null || number(external[key]) && external[key] > 0,
      'invalid external price metadata');
  }
  require(external.observedAtUTC === reference.observedAtUTC && date(external.sourceDocumentDate),
    'external price date mismatch');
  return {
    id: reference.id, sourceKind: 'documentary-reference-not-offer',
    notOffer: true, commercialAdoptionAllowed: false, stock: null,
    attributes: attributes(reference),
  };
}

/**
 * The SHA-256 pin must come from the reviewed receipt, never from this payload.
 * Returns pure-engine records and a separate documentary channel. The latter is
 * never spread into records, sourceProject, attributes or searchable features.
 * This contract deliberately is not the Leben commercial-overlay factory.
 * Pass the full catalogue in its source order: identity pointers bind each row
 * to its slug. Match IDs resolve to provenance in documentary.byReferenceId.
 */
export async function createDocumentaryReferenceLayer(publishedProjects, sourceText, options) {
  const { evidence, sha256 } = await sourceJSON(sourceText, options);
  require(evidence?.schemaVersion === 1 && evidence.layer === DOCUMENTARY_SOURCE_LAYER
    && evidence.notOffer === true && evidence.commercialAdoptionAllowed === false
    && evidence.publicConsumption === false && Array.isArray(evidence.records)
    && evidence.records.length > 0, 'invalid documentary layer');
  require(object(evidence.sourceRegistry) && hash(evidence.sourceRegistry.sha256)
    && object(evidence.sourcePrimaryManifest) && object(evidence.identityContext)
    && hash(evidence.identityContext.sha256), 'source registry/manifest is required');
  for (const source of Object.values(evidence.sourcePrimaryManifest)) {
    require(object(source) && hash(source.sha256) && Number.isInteger(source.bytes) && source.bytes >= 0,
      'invalid primary source manifest');
  }
  require(evidence.pricePolicy?.priceUF === null && evidence.pricePolicy.allReferencesCommercialPriceNull === true,
    'commercial prices are not admitted by this layer');
  require(Array.isArray(publishedProjects), 'published identities must be a list');
  const published = new Map();
  for (const project of publishedProjects) {
    require(object(project) && slug(project.slug) && !published.has(project.slug)
      && text(project.nombre) && text(project.inmobiliaria), 'invalid or duplicate published identity');
    published.set(project.slug, project);
  }
  const ids = new Set(), slugs = new Set(), records = [];
  const byReferenceId = Object.create(null), bySlug = Object.create(null);
  for (const input of evidence.records) {
    keys(input, recordKeys, 'record');
    require(slug(input.slug) && !slugs.has(input.slug) && published.has(input.slug),
      'unknown or duplicate published slug');
    slugs.add(input.slug);
    require(input.sourceLayer === DOCUMENTARY_SOURCE_LAYER && input.notOffer === true
      && input.commercialAdoptionAllowed === false && text(input.name) && text(input.bindingLimit),
    'record must remain documentary');
    keys(input.sourceProject, identityKeys, 'documentary sourceProject');
    keys(input.projectFacts, ['region', 'commune', 'developer'], 'project facts');
    const project = published.get(input.slug);
    require(input.sourceProject.inmobiliaria === project.inmobiliaria
      && input.projectFacts.developer === project.inmobiliaria
      && input.projectFacts.region === (project.region ?? null)
      && input.projectFacts.commune === (project.comuna ?? null), 'documentary identity mismatch');
    require(!own(input.sourceProject, 'slug') || input.sourceProject.slug === input.slug,
      'documentary sourceProject slug mismatch');
    const identity = input.projectIdentityContext;
    require(identity?.sha256 === evidence.identityContext.sha256
      && identity.source === 'data/proyectos.json' && /^\/(?:0|[1-9]\d*)$/.test(identity.pointer)
      && publishedProjects[Number(identity.pointer.slice(1))]?.slug === input.slug,
    'identity context binding mismatch');
    require(Array.isArray(input.references) && input.references.length > 0, 'documentary references are required');
    const references = input.references.map(reference => {
      const engineReference = sourceReference(reference, evidence, ids);
      byReferenceId[reference.id] = clone(reference);
      return engineReference;
    });
    // Only registered public identity enters the engine; no price, state,
    // amenities, models, raw unit, description or external price can enter here.
    const sourceProject = Object.fromEntries(identityKeys
      .filter(key => project[key] != null).map(key => [key, project[key]]));
    records.push({
      slug: input.slug, name: project.nombre, sourceLayer: DOCUMENTARY_SOURCE_LAYER,
      notOffer: true, commercialAdoptionAllowed: false, sourceProject,
      projectFacts: { region: project.region ?? null, commune: project.comuna ?? null, developer: project.inmobiliaria },
      references,
    });
    bySlug[input.slug] = {
      observedName: input.name, sourceProject: clone(input.sourceProject),
      identityContext: clone(input.projectIdentityContext), bindingLimit: input.bindingLimit,
    };
  }
  require(evidence.counts?.records === records.length && evidence.counts.references === ids.size,
    'documentary counts do not match records');
  return freeze({
    mode: DOCUMENTARY_REVIEW_MODE, notOffer: true, commercialAdoptionAllowed: false,
    publicConsumption: false, records,
    documentary: {
      sourceSHA256: sha256, sourceRegistry: clone(evidence.sourceRegistry),
      sourcePrimaryManifest: clone(evidence.sourcePrimaryManifest),
      metricPolicy: clone(evidence.metricPolicy), bySlug, byReferenceId,
      sourceVerification: 'Input bytes verified against caller pin; primary bytes are not fetched or reread.',
    },
  });
}
