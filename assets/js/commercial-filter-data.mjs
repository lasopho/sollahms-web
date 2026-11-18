/**
 * Optional documentary overlay for the isolated Leben filter experiment.
 * Published project records and the generated public facet index are never rewritten.
 * References describe evidence, not an inventory of available units.
 */
export const COMMERCIAL_EVIDENCE_URL = '/data/commercial-filter-evidence-leben.json';
export const AMENITY_KEY_MAP = Object.freeze({
  piscina: 'pool', gimnasio: 'gym', quinchos: 'barbecue',
  'salon-multiuso': 'multipurposeRoom', cowork: 'cowork',
  bicicleteros: 'bikeParking', lavanderia: 'laundry',
  'areas-verdes': 'greenAreas', 'juegos-infantiles': 'playground',
  'terraza-panoramica': 'commonTerrace', lounge: 'lounge',
  mascotas: 'pets', seguridad: 'security',
});
export const AMENITY_LABELS = Object.freeze({
  pool: 'Piscina', gym: 'Gimnasio', barbecue: 'Quinchos',
  multipurposeRoom: 'Salón multiuso', cowork: 'Cowork',
  bikeParking: 'Bicicleteros', laundry: 'Lavandería',
  greenAreas: 'Áreas verdes', playground: 'Juegos infantiles',
  commonTerrace: 'Terraza panorámica común', lounge: 'Lounge',
  pets: 'Espacios para mascotas', security: 'Seguridad o control de acceso',
});
export const PROPERTY_TYPE_LABELS = Object.freeze({
  departamento: 'Departamento', casa: 'Casa', local: 'Local comercial',
  oficina: 'Oficina', terreno: 'Terreno', duplex: 'Dúplex', estudio: 'Estudio',
});
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const nonnegative = value => finite(value) && value >= 0 ? value : null;
const positive = value => finite(value) && value > 0 ? value : null;
const bool = value => typeof value === 'boolean' ? value : null;
const text = value => typeof value === 'string' && value.trim() ? value : null;
const unique = values => [...new Set(values.filter(Boolean))];

export function canonicalPropertyType(value) {
  const key = String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  return ({ departamento: 'departamento', casa: 'casa', local: 'local',
    'local comercial': 'local', oficina: 'oficina', terreno: 'terreno',
    duplex: 'duplex', estudio: 'estudio' })[key] ?? null;
}

/** A controlled explicit property label can establish use; bedrooms alone cannot. */
export function assetTypeForPropertyType(value) {
  const property = canonicalPropertyType(value);
  if (['departamento', 'casa', 'duplex', 'estudio'].includes(property)) return 'Residencial';
  if (['local', 'oficina'].includes(property)) return 'Comercial';
  return property === 'terreno' ? 'Terreno' : null;
}

function normalizeAttributes(input = {}) {
  const propertyType = canonicalPropertyType(input.propertyType);
  return {
    priceUF: positive(input.priceUF), propertyType,
    assetType: assetTypeForPropertyType(propertyType),
    bedrooms: nonnegative(input.bedrooms), bathrooms: nonnegative(input.bathrooms),
    usefulM2: nonnegative(input.usefulM2), totalM2: nonnegative(input.totalM2),
    terraceM2: nonnegative(input.terraceM2),
    privateTerrace: bool(input.privateTerrace), privateGarden: bool(input.privateGarden),
  };
}

/** Fail closed on malformed overlays: never silently enable a partial or invented dataset. */
export function validateCommercialEvidence(evidence) {
  if (!evidence || evidence.schemaVersion !== 1 || evidence.layer !== 'prepared-local-only'
      || !/^\d{4}-\d{2}-\d{2}$/.test(evidence.asOf ?? '') || !Array.isArray(evidence.projects)) {
    throw new TypeError('Formato de evidencia comercial no válido.');
  }
  const slugs = new Set(), referenceIds = new Set();
  for (const project of evidence.projects) {
    if (!text(project.slug) || slugs.has(project.slug) || !project.projectFacts
        || !Array.isArray(project.references)) throw new TypeError('Proyecto documental no válido o duplicado.');
    slugs.add(project.slug);
    for (const reference of project.references) {
      if (!text(reference.id) || referenceIds.has(reference.id) || !reference.attributes
          || reference.stock !== null || reference.sourceKind === 'project-fact') {
        throw new TypeError('Referencia documental no válida o duplicada.');
      }
      referenceIds.add(reference.id);
    }
  }
  return evidence;
}

export async function loadCommercialEvidence(fetchImpl = globalThis.fetch, url = COMMERCIAL_EVIDENCE_URL) {
  if (typeof fetchImpl !== 'function') throw new TypeError('Se requiere un lector de evidencia.');
  const response = await fetchImpl(url, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error('No se pudo cargar la evidencia comercial preparada.');
  return validateCommercialEvidence(await response.json());
}

/**
 * General property existence gets a separate, type-only administrative reference.
 * It must never lend type, price or areas to a documentary quotation/model.
 */
function propertyFactReferences(slug, facts, sourceDate) {
  return unique((facts.propertyTypes ?? []).map(canonicalPropertyType)).map(propertyType => ({
    id: `project-fact:${slug}:property-type:${propertyType}`,
    sourceKind: 'project-fact', sourceDate, stock: null,
    scope: 'Existencia de tipo de propiedad en el proyecto; sin precio, modelo ni stock.',
    attributes: normalizeAttributes({ propertyType }),
  }));
}

export function buildCommercialRecords(publishedProjects, evidence, _publishedFacets = null) {
  validateCommercialEvidence(evidence);
  if (!Array.isArray(publishedProjects)) throw new TypeError('El catálogo publicado debe ser una lista.');
  const publishedBySlug = new Map(publishedProjects.map(project => [project.slug, project]));
  return evidence.projects.map(prepared => {
    const sourceProject = publishedBySlug.get(prepared.slug);
    if (!sourceProject) throw new Error(`La evidencia no pertenece al catálogo vigente: ${prepared.slug}`);
    const propertyTypes = unique((prepared.projectFacts.propertyTypes ?? []).map(canonicalPropertyType));
    const references = prepared.references.map(reference => ({
      ...reference, attributes: normalizeAttributes(reference.attributes), stock: null,
    }));
    const assetTypes = unique([
      ...propertyTypes.map(assetTypeForPropertyType),
      ...references.map(reference => reference.attributes.assetType),
    ]);
    if (assetTypes.includes('Residencial') && assetTypes.includes('Comercial')) assetTypes.push('Mixto');
    const projectFacts = {
      ...prepared.projectFacts, propertyTypes, assetTypes,
      amenities: Object.fromEntries(Object.entries(prepared.projectFacts.amenities ?? {})
        .filter(([key]) => own(AMENITY_LABELS, key)).map(([key, value]) => [key, bool(value)])),
    };
    return {
      slug: prepared.slug, sourceProject, sourceLayer: 'prepared', asOf: evidence.asOf,
      active: prepared.active !== false, projectFacts,
      references: [...references, ...propertyFactReferences(prepared.slug, projectFacts, evidence.asOf)],
      documentaryReferenceCount: references.length,
      additionalCosts: (evidence.additionalCosts ?? []).filter(cost => cost.slug === prepared.slug)
        .map(cost => ({ ...cost })),
    };
  });
}

/** Only the 12 prepared identities receive an overlay. All public values stay intact. */
export function buildCommercialProjects(publishedProjects, evidence, publishedFacets = null) {
  const records = new Map(buildCommercialRecords(publishedProjects, evidence, publishedFacets)
    .map(record => [record.slug, record]));
  const statuses = new Map((evidence.inactiveOutsidePreparedProjects ?? [])
    .filter(status => text(status.slug) && status.active === false)
    .map(status => [status.slug, status]));
  return publishedProjects.map(project => records.has(project.slug)
    ? { ...project, _commercial: records.get(project.slug) }
    : statuses.has(project.slug) ? { ...project, _commercialStatus: { ...statuses.get(project.slug) } }
      : project);
}
