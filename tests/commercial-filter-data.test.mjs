import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  AMENITY_KEY_MAP, AMENITY_LABELS, assetTypeForPropertyType,
  buildCommercialProjects, buildCommercialRecords, canonicalPropertyType,
  loadCommercialEvidence, validateCommercialEvidence,
} from '../assets/js/commercial-filter-data.mjs';

const readJSON = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const evidence = readJSON('../data/commercial-filter-evidence-leben.json');
const published = readJSON('../data/proyectos.json');
const records = buildCommercialRecords(published, evidence);
const record = slug => records.find(project => project.slug === slug);
const reference = id => records.flatMap(project => project.references).find(ref => ref.id === id);
const documentary = records.flatMap(project => project.references).filter(ref => ref.sourceKind !== 'project-fact');

test('preparation preserves the verified 131 public identities and all public values', () => {
  assert.equal(published.length, 131);
  const original = JSON.stringify(published);
  const prepared = buildCommercialProjects(published, evidence);
  assert.equal(prepared.length, 131);
  assert.deepEqual(prepared.map(project => project.slug), published.map(project => project.slug));
  assert.equal(JSON.stringify(published), original);
  assert.equal(prepared.filter(project => project._commercial).length, 12);
  prepared.forEach((project, index) => {
    const { _commercial, _commercialStatus, ...publicFields } = project;
    assert.deepEqual(publicFields, published[index]);
    if (_commercial) assert.strictEqual(_commercial.sourceProject, published[index]);
    else if (!_commercialStatus) assert.strictEqual(project, published[index]);
  });
});

test('the local projection traces its existing sources and never claims a new closure', () => {
  assert.equal(evidence.layer, 'prepared-local-only');
  assert.equal(evidence.asOf, '2026-11-16');
  assert.equal(evidence.source.sha256, '5fb3b13578a26b5bab725b980876591768d37405316c384855f9b9cc38fcd68a');
  assert.equal(evidence.source.additionalCostsSha256, '6cc68873fa171ffbc09b6dccbdf83b9b979ae1a6c7ae568a584a063784abafc6');
  assert.equal(evidence.documentaryPendingFields, 313);
  assert.equal(evidence.policy.newEvidenceReceived, false);
  assert.equal(evidence.policy.availableUnitInventory, false);
});

test('454 original references retain distinct identities, masks and unknown stock', () => {
  assert.equal(documentary.length, 454);
  assert.equal(new Set(documentary.map(ref => ref.id)).size, 454);
  const counts = Object.fromEntries(Object.keys(evidence.counts)
    .map(kind => [kind, documentary.filter(ref => ref.sourceKind === kind).length]));
  assert.deepEqual(counts, { UNIDAD_UI: 330, PLANO_UNIDAD: 104, COTIZACION_PROPIETARIO: 20 });
  documentary.forEach(ref => {
    assert.equal(ref.stock, null);
    assert.equal(ref.sourceDate, '2026-11-16');
    ref.maskedFields.forEach(field => assert.equal(ref.attributes[field], null));
    if (ref.sourceKind !== 'COTIZACION_PROPIETARIO') assert.equal(ref.attributes.priceUF, null);
  });
});

test('general property facts remain type-only and never fill unknown reference types', () => {
  const administrative = records.flatMap(project => project.references).filter(ref => ref.sourceKind === 'project-fact');
  assert.equal(administrative.length, 16);
  administrative.forEach(ref => {
    ['priceUF', 'bedrooms', 'bathrooms', 'usefulM2', 'totalM2', 'terraceM2', 'privateGarden', 'privateTerrace']
      .forEach(field => assert.equal(ref.attributes[field], null));
  });
  assert.equal(documentary.filter(ref => ref.attributes.propertyType === null).length, 277);
  assert.equal(reference('OWN4-P005').attributes.propertyType, null);
  assert.equal(reference('OWN4-P005').attributes.assetType, null);
  assert.equal(reference('OWN4-P005').attributes.bedrooms, 3);
});

test('conflicting bathroom and bedroom literals remain available only as provenance', () => {
  const living = reference('UI:edificio-living-town:603');
  assert.equal(living.literalAttributes.bathrooms, 2);
  assert.equal(living.attributes.bathrooms, null);
  assert.equal(living.attributes.bedrooms, 2);
  assert.equal(living.attributes.terraceM2, 9.74);
  const mood = reference('UI:edificio-mood:303');
  assert.equal(mood.literalAttributes.bedrooms, 2);
  assert.equal(mood.attributes.bedrooms, null);
  assert.equal(mood.attributes.bathrooms, 2);
  assert.equal(reference('IR-P035').literalAttributes.bedrooms, 1.5);
  assert.equal(reference('IR-P035').attributes.bedrooms, null);
});

test('conflicting numeric terrace does not erase its independently positive existence', () => {
  const bold = reference('UI:edificio-bold:207');
  assert.equal(bold.attributes.terraceM2, null);
  assert.equal(bold.attributes.privateTerrace, true);
});

test('no plan area, garden or price is transferred to linked UI references', () => {
  ['UI:inn-puerto-chico:806', 'UI:inn-puerto-chico:906'].forEach(id => {
    assert.equal(reference(id).attributes.totalM2, null);
    assert.equal(reference(id).attributes.privateGarden, null);
    assert.equal(reference(id).attributes.priceUF, null);
    assert.equal(reference(id).attributes.terraceM2, 26.36);
  });
  assert.equal(reference('UI:capitanes:501').attributes.totalM2, null);
  assert.equal(reference('OWN4-P006').attributes.totalM2, null);
  assert.equal(reference('OWN4-P006').attributes.priceUF, 12608);
});

test('owner quotes preserve decimal prices; Suecia extras cannot become property prices', () => {
  assert.equal(reference('OWN4-P002').attributes.priceUF, 4991.65);
  assert.equal(reference('OWN4-P003').attributes.priceUF, 3753.2);
  assert.equal(reference('OWN4-P011').attributes.priceUF, 8560);
  const suecia = record('edificio-suecia');
  assert.deepEqual(suecia.additionalCosts.map(cost => [cost.concept, cost.priceUF]), [['parking', 510], ['storage', 75]]);
  assert.equal(suecia.references.some(ref => [510, 75].includes(ref.attributes.priceUF)), false);
  assert.equal(suecia.projectFacts.parking.included, false);
  assert.equal(suecia.projectFacts.parking.generalAdditional, true);
  assert.equal(suecia.projectFacts.parking.available, null);
  assert.equal(suecia.projectFacts.storage.available, null);
});

test('Santo and BAUM never regain a historical public price or current historical state', () => {
  ['edificio-santo', 'edificio-baum'].forEach(slug => {
    assert.equal(record(slug).references.some(ref => ref.attributes.priceUF !== null), false);
    assert.equal(record(slug).projectFacts.state, null);
    assert.equal(record(slug).projectFacts.stateEvidence.no_usar_como_actual, true);
  });
  assert.equal(record('edificio-baum').projectFacts.delivery.year, 2028);
  assert.equal(record('edificio-mood').projectFacts.delivery.category, 'immediate');
  assert.equal(record('edificio-mood').projectFacts.delivery.legalDeliveryVerified, null);
});

test('brochure omission remains unknown and does not become absence of a garden or amenity', () => {
  const living = record('edificio-living-town');
  assert.equal(living.projectFacts.amenities.pool, true);
  assert.equal(living.projectFacts.amenities.security, null);
  assert.equal(living.projectFacts.amenityEvidence.security.catalogProposal, false);
  assert.equal(living.projectFacts.amenityEvidence.security.absenceNotProven, true);
  assert.equal(reference('OWN4-P001').attributes.privateGarden, null);
  assert.equal(reference('OWN4-P001').attributes.privateTerrace, null);
});

test('Own receives a dated inactive decision separately from the 12 evidence records', () => {
  const own = buildCommercialProjects(published, evidence).find(project => project.slug === 'own');
  assert.equal(own._commercial, undefined);
  assert.deepEqual(own._commercialStatus, { slug: 'own', state: 'Vendido', sourceId: 'F049', sourceDate: '2026-11-16', active: false });
  assert.equal(records.some(project => project.slug === 'own'), false);
  assert.equal(published.find(project => project.slug === 'own')._commercialStatus, undefined);
});

test('unknown property type never defaults to residential; zero is explicit rather than missing', () => {
  assert.equal(assetTypeForPropertyType(null), null);
  assert.equal(assetTypeForPropertyType('unknown'), null);
  assert.equal(assetTypeForPropertyType('departamento'), 'Residencial');
  assert.equal(assetTypeForPropertyType('Local Comercial'), 'Comercial');
  assert.equal(assetTypeForPropertyType('terreno'), 'Terreno');
  assert.equal(canonicalPropertyType('Local Comercial (leyenda discordante)'), null);
  assert.equal(reference('UI:edificio-living-town:L06').attributes.bathrooms, 0);
  assert.equal(reference('UI:edificio-living-town:L06').attributes.bedrooms, null);
  assert.equal(reference('UI:edificio-living-town:L06').attributes.terraceM2, 0);
  assert.equal(reference('OWN4-P007').attributes.bedrooms, null);
});

test('amenity bridges preserve the existing public identifiers without classifying parking stock', () => {
  assert.equal(AMENITY_KEY_MAP.piscina, 'pool');
  assert.equal(AMENITY_LABELS[AMENITY_KEY_MAP.gimnasio], 'Gimnasio');
  assert.equal(AMENITY_KEY_MAP.estacionamientos, undefined);
  assert.equal(AMENITY_KEY_MAP.bodegas, undefined);
});

test('loading fails closed on failed transport, duplicate references and foreign identities', async () => {
  let requested;
  const loaded = await loadCommercialEvidence(async (url, options) => {
    requested = { url, options };
    return { ok: true, json: async () => evidence };
  });
  assert.strictEqual(loaded, evidence);
  assert.equal(requested.url, '/data/commercial-filter-evidence-leben.json');
  assert.equal(requested.options.cache, 'no-store');
  await assert.rejects(loadCommercialEvidence(async () => ({ ok: false })), /No se pudo/);
  const duplicate = structuredClone(evidence);
  duplicate.projects[0].references.push(duplicate.projects[0].references[0]);
  assert.throws(() => validateCommercialEvidence(duplicate), /duplicada/);
  assert.throws(() => buildCommercialRecords([], evidence), /catálogo vigente/);
  const stock = structuredClone(evidence);
  stock.projects[0].references[0].stock = 1;
  assert.throws(() => validateCommercialEvidence(stock), /Referencia documental/);
});
