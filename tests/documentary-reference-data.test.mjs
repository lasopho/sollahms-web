import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  createDocumentaryReferenceLayer, DOCUMENTARY_REVIEW_MODE,
} from '../assets/js/documentary-reference-data.mjs';
import { matchProjectFilters } from '../assets/js/commercial-filter-engine.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const sourceText = read('./fixtures/iris-documentary-15.json');
const fixture = JSON.parse(sourceText);
const published = JSON.parse(read('../data/proyectos.json'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const sourcePin = '3706bac50a2aa70a6d6cb8483f8f13a62615d6f2ce461b82dfe1774601794b71';
const options = { mode: DOCUMENTARY_REVIEW_MODE, sourceGuard: { sha256: sourcePin } };
const create = (catalog = published) => createDocumentaryReferenceLayer(catalog, sourceText, options);
const layer = await create();
const references = layer.records.flatMap(record => record.references);
const byId = id => references.find(reference => reference.id === id);
const evaluate = (record, query) => {
  const result = matchProjectFilters(record, query);
  assert.deepEqual(result.issues, [], 'valid query must not fail through queryIssues');
  return result;
};
// A freshly computed pin here deliberately trusts a malformed fixture, so each
// rejection exercises structural guards separately from the byte-pin guard.
const rejectMutation = async (mutate, message) => {
  const changed = structuredClone(fixture);
  mutate(changed);
  const text = JSON.stringify(changed);
  await assert.rejects(createDocumentaryReferenceLayer(published, text, {
    mode: DOCUMENTARY_REVIEW_MODE, sourceGuard: { sha256: sha256(text) },
  }), message);
};

test('real Iris15 fixture retains its reviewed bytes, 15 IDs and 14 registered identities', () => {
  assert.equal(sha256(sourceText), sourcePin);
  assert.equal(published.length, 131);
  assert.equal(layer.records.length, 14);
  assert.equal(references.length, 15);
  assert.deepEqual(references.map(ref => ref.id), fixture.records.flatMap(record => record.references.map(ref => ref.id)));
  assert.equal(new Set(references.map(ref => ref.id)).size, 15);
  assert.deepEqual(new Set(layer.records.map(record => record.sourceProject.inmobiliaria)),
    new Set(['Euro', 'Maestra', 'Vesant']));
  assert.equal(layer.publicConsumption, false);
  assert.equal(layer.notOffer, true);
  assert.equal(layer.documentary.sourceSHA256, sourcePin);
});

test('all admitted D/B/terrace predicates use a real single reference, including non-Leben identities', () => {
  let positives = 0;
  for (const record of layer.records) {
    for (const reference of record.references) {
      const a = reference.attributes;
      assert.ok(evaluate(record, { propertyType: a.propertyType }).matchedReferenceIds.includes(reference.id));
      if (a.bedrooms === null || a.bathrooms === null) continue;
      const query = { propertyType: a.propertyType, bedrooms: a.bedrooms, bathrooms: a.bathrooms };
      const db = evaluate(record, query);
      assert.ok(db.matches && db.matchedReferenceIds.includes(reference.id));
      assert.ok(db.references.every(ref => ref.attributes.bedrooms === a.bedrooms
        && ref.attributes.bathrooms === a.bathrooms));
      const terrace = evaluate(record, { ...query, surfaceMetric: 'terraza',
        minSurface: a.terraceM2, maxSurface: a.terraceM2 });
      assert.ok(terrace.matches && terrace.matchedReferenceIds.includes(reference.id));
      positives++;
    }
  }
  assert.equal(positives, 14);
});

test('commercial price and unknown canonical metrics fail valid active predicates only', () => {
  for (const record of layer.records) {
    const inactive = evaluate(record, {});
    assert.equal(inactive.matches, true);
    assert.equal(inactive.references.length, record.references.length);
    for (const query of [
      { minPrice: 0, maxPrice: 1000000 },
      { surfaceMetric: 'util', minSurface: 0, maxSurface: 1000000 },
      { surfaceMetric: 'total', minSurface: 0, maxSurface: 1000000 },
      { surfaceMetric: 'interior', minSurface: 0, maxSurface: 1000000 },
      { privateGarden: true }, { privateTerrace: true },
    ]) assert.equal(evaluate(record, query).matches, false);
    record.references.forEach(ref => {
      assert.equal(ref.attributes.priceUF, null);
      assert.equal(ref.stock, null);
      assert.equal(ref.notOffer, true);
      assert.equal(ref.commercialAdoptionAllowed, false);
    });
  }
});

test('Internos and the lot total retain their own metrics with no canonical aliases or inferred zero', () => {
  assert.equal(byId('IRIS-131-R001').attributes.internalM2, 28.68);
  assert.equal(byId('IRIS-131-R001').attributes.terraceM2, 2.08);
  const lotRecord = layer.records.find(record => record.slug === 'reserva-mayor-2');
  const lot = lotRecord.references[0];
  assert.equal(lot.attributes.lotTotalM2, 1500);
  ['totalM2', 'usefulM2', 'interiorM2', 'landM2', 'bedrooms', 'bathrooms']
    .forEach(key => assert.equal(lot.attributes[key], null));
  assert.equal(evaluate(lotRecord, { propertyType: 'terreno' }).matches, true);
  assert.equal(evaluate(lotRecord, { bedrooms: 0 }).matches, false);
  assert.equal(evaluate(lotRecord, { bathrooms: 1 }).matches, false);
});

test('prices, unit labels, descriptions and constraints remain in the documentary channel', () => {
  const first = layer.documentary.byReferenceId['IRIS-131-R001'];
  assert.equal(first.externalPriceMetadata.listUF, 3061.9);
  assert.equal(first.externalPriceMetadata.finalUF, 3000.66);
  assert.equal(first.unitLabel, '235');
  assert.equal(first.literalDescription, '1D+1B (2C / Ka)');
  assert.deepEqual(first.sourceMetrics, fixture.records[0].references[0].sourceMetrics);
  assert.deepEqual(first.constraints, fixture.records[0].references[0].constraints);
  const engineText = JSON.stringify(layer.records);
  for (const token of ['3061.9', '3000.66', 'externalPriceMetadata', 'unitLabel', 'literalDescription', 'constraints']) {
    assert.equal(engineText.includes(token), false, token + ' must not enter engine records');
  }
  for (const record of layer.records) {
    for (const reference of record.references) {
      const metadata = layer.documentary.byReferenceId[reference.id];
      assert.equal(evaluate(record, { text: String(metadata.externalPriceMetadata.listUF) }).matches, false);
    }
    assert.deepEqual(Object.keys(record.sourceProject).sort(),
      ['slug', 'nombre', 'inmobiliaria', 'comuna', 'region'].sort());
    assert.deepEqual(Object.keys(record.projectFacts).sort(), ['region', 'commune', 'developer'].sort());
  }
});

test('Mapocho/Plaza/Diagonal source restrictions stay intact without becoming searchable facts', () => {
  for (const id of ['IRIS-131-R001', 'IRIS-131-R002', 'IRIS-131-R003']) {
    const original = fixture.records.flatMap(record => record.references).find(ref => ref.id === id);
    assert.deepEqual(layer.documentary.byReferenceId[id].constraints, original.constraints);
  }
  assert.match(JSON.stringify(layer.documentary.byReferenceId['IRIS-131-R002'].constraints), /unresolved-building/);
  assert.match(JSON.stringify(layer.documentary.byReferenceId['IRIS-131-R003'].constraints), /Torre B/);
  assert.match(JSON.stringify(layer.documentary.byReferenceId['IRIS-131-R001'].constraints), /435/);
});

test('inputs are unchanged and output has no published/F9 object references or price borrowing', async () => {
  const snapshot = JSON.stringify(published);
  const actual = await create();
  assert.equal(JSON.stringify(published), snapshot);
  assert.equal(sha256(sourceText), sourcePin);
  actual.records.forEach(record => {
    assert.notStrictEqual(record.sourceProject, published.find(project => project.slug === record.slug));
    assert.ok(Object.isFrozen(record) && Object.isFrozen(record.references[0].attributes));
  });
  const changed = structuredClone(published);
  let commercialReads = 0;
  for (const project of changed) {
    project.precioDesdeUF = 1;
    Object.defineProperty(project, '_commercial', { get() {
      commercialReads++;
      return { references: [{ attributes: { priceUF: 1, usefulM2: 999 } }] };
    } });
    Object.defineProperty(project, 'commercialOffers', { get() { commercialReads++; return [{ priceUF: 2 }]; } });
  }
  const fromChanged = await create(changed);
  assert.equal(commercialReads, 0);
  assert.deepEqual(fromChanged.records, actual.records);
});

test('documentary names and raw descriptions cannot enter engine text even in a repinned source', async () => {
  const changed = structuredClone(fixture);
  const token = 'RAW_UNIT_ONLY_235_UF3061_90';
  changed.records[0].name = token;
  changed.records[0].sourceProject.nombre = token;
  changed.records[0].references[0].unitLabel = token;
  changed.records[0].references[0].literalDescription = token;
  const text = JSON.stringify(changed);
  const isolated = await createDocumentaryReferenceLayer(published, text, {
    mode: DOCUMENTARY_REVIEW_MODE, sourceGuard: { sha256: sha256(text) },
  });
  assert.equal(JSON.stringify(isolated.records).includes(token), false);
  assert.equal(evaluate(isolated.records[0], { text: token }).matches, false);
  assert.equal(isolated.documentary.byReferenceId['IRIS-131-R001'].unitLabel, token);
});

test('a genuinely unknown reference type is not borrowed from its published residential project', async () => {
  const changed = structuredClone(fixture);
  changed.records[0].references[0].attributes.propertyType = null;
  const text = JSON.stringify(changed);
  const isolated = await createDocumentaryReferenceLayer(published, text, {
    mode: DOCUMENTARY_REVIEW_MODE, sourceGuard: { sha256: sha256(text) },
  });
  const record = isolated.records[0];
  assert.equal(record.references[0].attributes.propertyType, null);
  assert.equal(record.references[0].attributes.assetType, undefined);
  assert.equal(evaluate(record, { propertyType: 'departamento' }).matches, false);
  assert.equal(evaluate(record, { assetType: 'Residencial' }).matches, false);
  assert.equal(evaluate(record, { bedrooms: 1, bathrooms: 1 }).matches, true);
});

test('explicit local-review mode and a trusted byte pin are mandatory', async () => {
  for (const invalid of [undefined, {}, { mode: 'published' }, { mode: 'local-review' },
    { mode: 'local-review', sourceGuard: { sha256: '0'.repeat(64) } }]) {
    await assert.rejects(createDocumentaryReferenceLayer(published, sourceText, invalid), /mode|guard|SHA-256/);
  }
  await assert.rejects(createDocumentaryReferenceLayer(published, sourceText + ' ', options), /SHA-256 mismatch/);
  await assert.rejects(createDocumentaryReferenceLayer(published, fixture, options), /source text/);
});

for (const [name, mutate, error] of [
  ['public consumption', d => { d.publicConsumption = true; }, /layer/],
  ['commercial adoption', d => { d.records[0].commercialAdoptionAllowed = true; }, /documentary/],
  ['numeric commercial price', d => { d.records[0].references[0].attributes.priceUF = 3061.9; }, /priceUF/],
  ['stock declaration', d => { d.records[0].references[0].stock = 1; }, /stock/],
  ['reference offer flag', d => { d.records[0].references[0].notOffer = false; }, /non-offer/],
  ['commercial source kind', d => { d.records[0].references[0].sourceKind = 'COTIZACION_PROPIETARIO'; }, /source kind/],
  ['source hash mismatch', d => { d.records[0].references[0].sourceSHA256 = '0'.repeat(64); }, /source hash/],
  ['missing source manifest', d => { d.sourcePrimaryManifest = {}; }, /source hash/],
  ['identity mismatch', d => { d.records[0].projectFacts.developer = 'Leben'; }, /identity mismatch/],
  ['foreign slug', d => { d.records[0].slug = 'not-a-published-project'; }, /published slug/],
  ['duplicate slug', d => { d.records[1].slug = d.records[0].slug; }, /published slug/],
  ['cross-project context', d => { d.records[0].slug = 'santa-elena-1670-mbi'; }, /context binding/],
  ['noncanonical identity array index', d => { d.records[0].projectIdentityContext.pointer = '/0122'; }, /context binding/],
  ['sourceProject slug mismatch', d => { d.records[0].sourceProject.slug = 'own'; }, /slug mismatch/],
  ['duplicate reference ID', d => { d.records[1].references[0].id = d.records[0].references[0].id; }, /reference ID/],
  ['commercial sourceProject', d => { d.records[0].sourceProject.precioDesdeUF = 3; }, /sourceProject/],
  ['commercial project facts', d => { d.records[0].projectFacts.priceUF = 3; }, /project facts/],
  ['unadmitted attributes', d => { d.records[0].references[0].attributes.offerPriceUF = 3; }, /attributes/],
  ['unknown property type', d => { d.records[0].references[0].attributes.propertyType = 'residential'; }, /property type/],
  ['numeric string', d => { d.records[0].references[0].attributes.bedrooms = '1'; }, /numeric/],
  ['fractional room count', d => { d.records[0].references[0].attributes.bedrooms = 1.5; }, /integer/],
  ['borrowed useful area', d => { d.records[0].references[0].attributes.usefulM2 = 32; }, /unadmitted/],
  ['internos alias', d => { d.records[0].references[0].attributes.interiorM2 = 28.68; }, /unadmitted/],
  ['calculated total', d => { d.records[0].references[0].attributes.totalM2 = 30.76; }, /unadmitted/],
  ['inferred private terrace', d => { d.records[0].references[0].attributes.privateTerrace = true; }, /unadmitted/],
  ['metric value mismatch', d => { d.records[0].references[0].sourceMetrics[0].valueM2 = 99; }, /metric value/],
  ['metric label substitution', d => { d.records[0].references[0].sourceMetrics[0].sourceLabel = 'Superficie útil'; }, /label/],
  ['metric conversion', d => { d.records[0].references[0].sourceMetrics[0].canonicalInteriorUsefulTotalMapping = 'usefulM2'; }, /conversion/],
  ['lot put on apartment', d => { d.records[4].references[0].attributes.propertyType = 'departamento'; }, /lot total/],
  ['wrong lot subject', d => { d.records[4].references[0].sourceMetrics[0].subject = 'vivienda'; }, /subject/],
  ['observation used as source date', d => { d.records[0].references[0].sourceDate = '2026-11-17'; }, /observation date/],
  ['invalid observation', d => { d.records[0].references[0].observedAtUTC = '2026-02-30T12:00:00Z'; }, /date/],
  ['wrong counts', d => { d.counts.references = 16; }, /counts/],
]) test('rejects ' + name + ' independently of the input pin', async () => rejectMutation(mutate, error));

test('numeric overflow is rejected rather than normalized to unknown, zero or Infinity', async () => {
  const changed = structuredClone(fixture);
  changed.records[0].references[0].attributes.internalM2 = 'OVERFLOW_PLACEHOLDER';
  const text = JSON.stringify(changed).replace('"OVERFLOW_PLACEHOLDER"', '1e400');
  await assert.rejects(createDocumentaryReferenceLayer(published, text, {
    mode: DOCUMENTARY_REVIEW_MODE, sourceGuard: { sha256: sha256(text) },
  }), /numeric/);
});

test('duplicate published identities and the existing F9 commercial layer are rejected', async () => {
  await assert.rejects(create([...published, published[0]]), /published identity/);
  const f9 = read('../data/commercial-filter-evidence-leben.json');
  await assert.rejects(createDocumentaryReferenceLayer(published, f9, {
    mode: DOCUMENTARY_REVIEW_MODE, sourceGuard: { sha256: sha256(f9) },
  }), /documentary layer/);
});
