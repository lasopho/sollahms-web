import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const checkout = process.env.F10_TECH_CHECKOUT ?? '/private/tmp/sollahms-filtros-comerciales-fase10-20261117';
const sourcePath = (process.env.F10_AUDIT_CHECKOUT ?? '/private/tmp/sollahms-auditoria-leben-20261116') + '/docs/catalog-data-completeness-20261116/leben/fase9-comercial-20261117/PROYECTOS-APTOS-BUSQUEDA-PARCIAL.json';
const output = process.env.F10_COVERAGE_OUTPUT ?? '/private/tmp/f10-coverage.json';
const { buildCommercialRecords } = await import(pathToFileURL(checkout + '/assets/js/commercial-filter-data.mjs'));
const { matchProjectFilters } = await import(pathToFileURL(checkout + '/assets/js/commercial-filter-engine.mjs'));
const readJSON = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const evidence = readJSON(checkout + '/data/commercial-filter-evidence-leben.json');
const published = readJSON(checkout + '/data/proyectos.json');
const records = buildCommercialRecords(published, evidence);
const numericChoices = (record, key) => [...new Set(record.references.map(ref => ref.attributes[key])
  .filter(value => typeof value === 'number' && Number.isFinite(value)))];
const bedroomsQueries = (record, extra) => numericChoices(record, 'bedrooms').map(bedrooms => ({ bedrooms, ...extra }));
const bedroomsBathroomsQueries = (record, extra) => numericChoices(record, 'bedrooms')
  .flatMap(bedrooms => numericChoices(record, 'bathrooms').map(bathrooms => ({ bedrooms, bathrooms, ...extra })));

const definitions = {
  price: { fields: ['priceUF'], queries: () => [{ minPrice: 0 }] },
  price_and_bedrooms: { fields: ['priceUF', 'bedrooms'], queries: record => bedroomsQueries(record, { minPrice: 0 }) },
  price_bedrooms_bathrooms: { fields: ['priceUF', 'bedrooms', 'bathrooms'], queries: record => bedroomsBathroomsQueries(record, { minPrice: 0 }) },
  bedrooms_bathrooms_useful_total: { fields: ['bedrooms', 'bathrooms', 'usefulM2', 'totalM2'],
    queries: record => bedroomsBathroomsQueries(record, { surfaces: { useful: { min: 0 }, total: { min: 0 } } }) },
  bedrooms_bathrooms_total: { fields: ['bedrooms', 'bathrooms', 'totalM2'],
    queries: record => bedroomsBathroomsQueries(record, { surfaceMetric: 'total', minSurface: 0 }) },
  price_useful: { fields: ['priceUF', 'usefulM2'], queries: () => [{ minPrice: 0, surfaceMetric: 'useful', minSurface: 0 }] },
  price_total: { fields: ['priceUF', 'totalM2'], queries: () => [{ minPrice: 0, surfaceMetric: 'total', minSurface: 0 }] },
  property_type_price: { fields: ['priceUF', 'propertyType'], queries: record => [...new Set(record.references
    .map(ref => ref.attributes.propertyType).filter(Boolean))].map(propertyType => ({ minPrice: 0, propertyType })) },
  pool_gym: { projectFields: ['amenities.pool', 'amenities.gym'], queries: () => [{ amenities: ['pool', 'gym'], amenitiesAll: true }] },
  parking_additional: { projectFields: ['parking.generalAdditional'], queries: () => [{ parking: 'additional' }] },
  parking_available: { projectFields: ['parking.available'], queries: () => [{ parking: 'available' }] },
};

const metrics = {};
const referenceIndex = {};
for (const [name, definition] of Object.entries(definitions)) {
  const projects = [];
  for (const record of records) {
    const matches = definition.queries(record).map(query => ({ query, result: matchProjectFilters(record, query) }))
      .filter(({ result }) => result.matches);
    if (!matches.length) continue;
    const referenceIds = definition.fields ? [...new Set(matches.flatMap(({ result }) => result.matchedReferenceIds))] : [];
    for (const id of referenceIds) {
      const reference = record.references.find(ref => ref.id === id);
      referenceIndex[id] = { slug: record.slug, sourceKind: reference.sourceKind,
        sourceId: reference.sourceId, sourceDate: reference.sourceDate, dateKind: reference.dateKind,
        scope: reference.scope, attributes: reference.attributes, maskedFields: reference.maskedFields,
        conflictIds: reference.conflictIds, sourceFactIds: reference.sourceFactIds, stock: reference.stock };
    }
    const project = { slug: record.slug, referenceIds,
      queries: matches.map(({ query }) => query) };
    if (name === 'pool_gym') project.projectFactSupport = Object.fromEntries(['pool', 'gym']
      .map(key => [key, record.projectFacts.amenityEvidence[key]]));
    if (name.startsWith('parking_')) project.projectFactSupport = record.projectFacts.parking;
    projects.push(project);
  }
  metrics[name] = { projectCount: projects.length, fields: definition.fields,
    projectFields: definition.projectFields,
    referenceCount: [...new Set(projects.flatMap(project => project.referenceIds))].length, projects };
}

const artifact = {
  schemaVersion: 1, executedAt: new Date().toISOString(), evidenceAsOf: evidence.asOf,
  method: 'Real matchProjectFilters; enumerate explicit numeric bedroom/bathroom choices and require a single witness for all active option predicates.',
  scope: { preparedLebenProjects: records.length, publishedProjects: published.length,
    originalDocumentaryReferences: 454, administrativeTypeOnlyReferences: 16,
    newEvidence: 0, documentaryClosures: 0, preservedPendingFields: 313,
    stockCertified: false, globalCatalogueCoverageClaim: false },
  limitations: [
    'Counts show existence of at least one supported reference per project, not complete coverage of every model or query.',
    'The two-metric useful+total case is an API/documentary regression; the local UI selects one metric at a time.',
    'Zero is an explicit numeric fact. Unknown values fail an active predicate and never become zero.',
    'Project amenities and additional parking offers do not establish unit stock, inclusion or commercial entitlement.',
  ],
  reproduction: { script: fileURLToPath(import.meta.url), command: 'node '+fileURLToPath(import.meta.url), output },
  hashes: {
    fixture: { path: 'data/commercial-filter-evidence-leben.json', sha256: sha(checkout + '/data/commercial-filter-evidence-leben.json') },
    f9Source: { path: evidence.source.path, sha256: sha(sourcePath), matchesFixtureProvenance: sha(sourcePath) === evidence.source.sha256 },
    adapter: { path: 'assets/js/commercial-filter-data.mjs', sha256: sha(checkout + '/assets/js/commercial-filter-data.mjs') },
    evaluator: { path: 'assets/js/commercial-filter-engine.mjs', sha256: sha(checkout + '/assets/js/commercial-filter-engine.mjs') },
    reproductionScript: { path: fileURLToPath(import.meta.url), sha256: sha(fileURLToPath(import.meta.url)) },
  },
  metrics, referenceIndex,
};
fs.writeFileSync(output, JSON.stringify(artifact, null, 2) + '\n');
console.log(JSON.stringify({ output, fixtureSHA256: artifact.hashes.fixture.sha256,
  f9SourceSHA256: artifact.hashes.f9Source.sha256,
  metrics: Object.fromEntries(Object.entries(metrics).map(([key, value]) => [key, value.projectCount])) }, null, 2));
