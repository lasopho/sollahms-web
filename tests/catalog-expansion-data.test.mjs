import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const readJSON = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = readJSON('../data/catalog-expansion-iris-20261118.json');
const baselineBytes = readFileSync(new URL('../data/proyectos.json', import.meta.url));
const baseline = JSON.parse(baselineBytes);
const projects = data.projects;
const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));

test('the expansion adds 21 separate identities while preserving the exact 131 baseline', () => {
  assert.equal(createHash('sha256').update(baselineBytes).digest('hex'), 'aff5a08f8abe9f4bafa2924a29a2f5f79e6a5724767d15f6b4b059dba2e4b59b');
  assert.equal(baseline.length, 131);
  assert.equal(projects.length, 21);
  assert.equal(new Set(projects.map((p) => p.slug)).size, 21);
  assert.equal(projects.filter((p) => p.identity.developer === 'GPR').length, 9);
  assert.equal(projects.some((p) => baseline.some((b) => b.slug === p.slug)), false);
  assert.equal(projects.some((p) => p.slug === 'patio-brasil'), false);
});

test('the public projection contains opaque references and no original unit, model or private archive fields', () => {
  const forbidden = new Set(['unitLabel', 'modelLabel', 'modelLiteralPrefix', 'domEvidence', 'planEvidence', 'floorLabel', 'rawDescription']);
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      assert.equal(forbidden.has(key), false, key);
      visit(child);
    }
  };
  visit(data);
  assert.doesNotMatch(JSON.stringify(data), /\/private\/|\/Users\/|owner-input|comisi[oó]n|broker|honorari/i);
  for (const project of projects) {
    assert.equal(project.exactUnitReferences.length, 1);
    assert.match(project.exactUnitReferences[0].id, /^iris-ref-[a-f0-9]{24}$/);
  }
});

test('each external profile selects its own labelled final price and retains the separate list price', () => {
  for (const project of projects) {
    const ref = project.exactUnitReferences[0];
    assert.equal(ref.sourceKind, 'IRIS_EXACT_UNIT');
    assert.equal(ref.priceField, 'finalPriceUF');
    assert.equal(ref.attributes.priceUF, ref.finalPriceUF);
    assert.equal(typeof ref.listPriceUF, 'number');
    assert.equal(ref.priceValidityConfirmed, false);
    assert.equal(ref.notOffer, true);
    assert.equal(ref.stock, null);
    assert.equal(ref.financialBaselineCompatible, false);
  }
});

test('Compañía 1735 keeps the owner 2D price distinct from the external 2D/2B final price', () => {
  const project = bySlug['compania-1735'];
  const owner = project.ownerReferences[0];
  const external = project.exactUnitReferences[0];
  assert.equal(owner.sourceKind, 'OWNER_EXISTING');
  assert.equal(owner.priceUF, 4550);
  assert.equal(owner.bedrooms, 2);
  assert.equal(owner.bathrooms, null);
  assert.equal(external.listPriceUF, 4550);
  assert.equal(external.finalPriceUF, 3640);
  assert.equal(external.attributes.bedrooms, 2);
  assert.equal(external.attributes.bathrooms, 2);
  assert.equal(owner.sourceDocumentDate, null);
  assert.match(project.identity.historicalNameNote, /1703/);
});

test('Nuevo Vivaceta retains four owner categories without borrowing a studio reference bathroom or areas', () => {
  const project = bySlug['nuevo-vivaceta'];
  assert.equal(project.identity.developer, 'Ecasa');
  assert.deepEqual(project.ownerReferences.map((r) => [r.categoryKey, r.priceUF, r.bedrooms]), [
    ['0', 2050, null], ['1', 2190, 1], ['2', 2600, 2], ['3', 4280, 3],
  ]);
  for (const ref of project.ownerReferences) {
    assert.equal(ref.bathrooms, null);
    assert.equal(ref.usefulM2, null);
    assert.equal(ref.totalM2, null);
    assert.equal(ref.newOwnerConfirmation, false);
  }
  const external = project.exactUnitReferences[0].attributes;
  assert.equal(external.bedrooms, null);
  assert.equal(external.bathrooms, 1);
  assert.equal(external.internalM2, 23.74);
  assert.equal(external.terraceM2, 0);
  assert.match(project.identity.separateIdentityNote, /Ingevec/);
});

test('undefined area labels and bedroom ranges never become typed values or intermediate categories', () => {
  for (const project of projects) {
    assert.equal(project.unclassifiedSurfaceSummary.usefulM2, null);
    assert.equal(project.unclassifiedSurfaceSummary.totalM2, null);
    const ref = project.exactUnitReferences[0];
    assert.equal(ref.attributes.usefulM2, null);
    assert.equal(ref.attributes.totalM2, null);
    assert.equal(ref.attributes.interiorM2, null);
    assert.equal(ref.surfaceEvidence.internalM2.sourceLabel, 'Internos');
    assert.equal(ref.surfaceEvidence.internalM2.explicitlyPrinted, true);
    assert.equal(ref.surfaceEvidence.internalM2.calculated, false);
    assert.equal(project.headerBedroomProfile.correlatedWithPrice, false);
    assert.equal(project.headerBedroomProfile.rangeExpandedToCategories, false);
  }
  assert.equal(bySlug['kiez'].headerBedroomProfile.bedroomsExact, null);
  assert.equal(bySlug['alameda-4719'].headerBedroomProfile.bedroomsExact, null);
  assert.equal(bySlug['compania-1735'].headerBedroomProfile.bedroomsExact, 2);
});

test('media, location and amenities preserve unknowns and use only existing taxonomy descriptors', () => {
  const taxonomy = readJSON('../data/amenities.json');
  const permittedFilters = new Set(taxonomy.filters.filter((f) => f.group === 'amenities').map((f) => f.id));
  assert.equal(bySlug['edificio-botanico'].media.coverPath, null);
  assert.equal(bySlug['edificio-botanico'].media.coverAlt, null);
  assert.equal(projects.filter((p) => p.media.coverPath).length, 20);
  for (const project of projects) {
    assert.equal(project.identity.country, 'Chile');
    assert.equal(project.financialBaselineCompatible, false);
    assert.equal(project.location.latitude, null);
    assert.equal(project.location.longitude, null);
    assert.equal(project.commonAmenities.parkingIncluded, null);
    assert.equal(project.commonAmenities.parkingAvailable, null);
    assert.equal(project.commonAmenities.storageIncluded, null);
    assert.equal(project.commonAmenities.storageAvailable, null);
    assert.equal(project.commonAmenities.sourceNotesDoNotProvideFilterPredicates, true);
    for (const descriptor of project.commonAmenities.descriptors) {
      assert.equal(typeof taxonomy.icons[descriptor.icon], 'string');
      assert.equal(descriptor.filterIds.every((id) => permittedFilters.has(id)), true);
    }
    if (project.media.coverPath) {
      assert.match(project.media.coverPath, /^\/assets\/iris-expansion-20261118\/[a-f0-9]{64}\./);
      assert.equal(typeof project.media.coverAlt, 'string');
    }
  }
});
