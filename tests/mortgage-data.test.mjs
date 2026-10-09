import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compareOffers, getOfferStatus, getUfStatus, sortComparisons, validateDataset } from '../assets/js/mortgage-data.mjs';

const now = '2026-10-09';
const input = { propertyUf: 4000, downPaymentPercent: 25, years: 20, location: 'santiago-metropolitana' };
// Synthetic fixtures are isolated from the production dataset.
const source = { url: 'https://servicios.cmfchile.cl/simuladorhipotecario', title: 'Escenario oficial — fixture de prueba', updatedAt: now, verifiedAt: now, kind: 'official-scenario' };
const baseOffer = {
  id: 'test-a', institutionId: 'test-bank', label: 'Fixture, no oferta comercial', interestType: 'fixed', currency: 'UF', annualRatePercent: 4.5, rateConvention: 'effective', availableYears: [20], minPrincipalUf: 3000, maxPrincipalUf: 3000, minFinancingPercent: 75, maxFinancingPercent: 75, location: 'santiago-metropolitana', requirements: ['Sujeto a evaluación bancaria.'], validFrom: now, validUntil: '2026-10-16', source,
  scenarioCosts: { ...input, monthlyInsuranceUf: 1, monthlyOtherCostsUf: 0, oneTimeFeesUf: 10, caePercent: 5, totalCostUf: null, complete: false, coverage: 'cmf-standard-excludes-tax-registry', insuranceCoverage: 'life-fire-earthquake' },
};
const uf = { date: now, valueClp: 41130.94, source: { url: 'https://www.sii.cl/valores_y_fechas/uf/uf2026.htm', title: 'SII UF', verifiedAt: now } };
const dataset = () => ({ schemaVersion: 1, updatedAt: now, uf: structuredClone(uf), institutions: [{ id: 'test-bank', name: 'Banco de prueba', source: { url: 'https://bank.example.cl/hipotecario', title: 'Banco de prueba', verifiedAt: now } }], offers: [structuredClone(baseOffer)], updatePolicy: { mode: 'verified-manual', description: 'Verificación oficial controlada.' } });

test('dataset de producción tiene fuente UF, instituciones y esquema estricto válidos', async () => {
  const production = JSON.parse(await readFile(new URL('../data/hipotecario.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateDataset(production), { valid: true, errors: [] });
  assert.ok(production.uf.source.url.startsWith('https://www.sii.cl/'));
  for (const offer of production.offers) assert.notEqual(offer.institutionId, 'test-bank');
});

test('cálculos reproducen el escenario publicado CMF y preservan el conflicto Banco de Chile', async () => {
  const production = JSON.parse(await readFile(new URL('../data/hipotecario.json', import.meta.url), 'utf8'));
  const results = compareOffers(input, production.offers, now);
  // Figures transcribed from the source captured on 2026-10-09, not generated
  // from this engine. A different annual-to-monthly convention fails this check.
  const published = new Map([
    ['scotiabank', { financial: '19.04', insuranceInclusive: '20.26', cae: 5.41 }],
    ['itau', { financial: '19.65', insuranceInclusive: '20.54', cae: 5.58 }],
    ['banco-chile', { financial: '19.27', insuranceInclusive: null, cae: 5.10 }],
  ]);
  assert.equal(results.length, 3);
  for (const result of results) {
    const expected = published.get(result.offer.institutionId);
    assert.equal(result.offer.rateConvention, 'effective');
    assert.equal(result.monthlyPaymentUf.toFixed(2), expected.financial);
    assert.equal(result.monthlyTotalUf === null ? null : result.monthlyTotalUf.toFixed(2), expected.insuranceInclusive);
    assert.equal(result.caePercent, expected.cae);
    assert.equal(result.totalCostUf, null);
    assert.equal(result.totalCostComparable, false);
  }
});

test('esquema exige fuentes y fechas independientes, ámbitos y convenciones explícitas', () => {
  assert.deepEqual(validateDataset(dataset()), { valid: true, errors: [] });
  const mutations = [
    (data) => { data.offers[0].unexpected = 1; },
    (data) => { delete data.offers[0].rateConvention; },
    (data) => { delete data.offers[0].source.updatedAt; },
    (data) => { data.offers[0].source.url = 'https://malicious.example/offer'; },
    (data) => { data.offers[0].source.url = 'https://cmfchile.cl.malicious.example/offer'; },
    (data) => { data.offers[0].source.url = 'https://user:secret@servicios.cmfchile.cl/offer'; },
    (data) => { data.offers[0].interestType = 'variable'; },
    (data) => { data.offers[0].currency = 'CLP'; },
    (data) => { data.offers[0].minPrincipalUf = 1000; },
    (data) => { data.offers[0].availableYears.push(30); },
    (data) => { data.offers[0].availableYears = 1; },
    (data) => { data.offers[0].source.verifiedAt = '2026-02-30'; },
    (data) => { data.offers[0].validUntil = '2026-11-01'; },
    (data) => { data.offers[0].institutionId = 'missing'; },
    (data) => { data.offers.push(structuredClone(data.offers[0])); },
    (data) => { data.uf.valueClp = NaN; },
    (data) => { data.uf.source.url = 'https://example.com/uf'; },
    (data) => { data.updatePolicy.mode = 'scraping'; },
    (data) => { data.offers[0].scenarioCosts.complete = true; },
    (data) => { data.offers[0].scenarioCosts.caePercent = -1; },
    (data) => { data.offers[0].scenarioCosts.coverage = 'unknown'; },
  ];
  for (const mutate of mutations) {
    const data = dataset(); mutate(data);
    const result = validateDataset(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  }
  for (const invalid of [null, [], undefined, 'bad', {}, { offers: null }]) assert.equal(validateDataset(invalid).valid, false);
});

test('notas institucionales son opcionales y acotadas; otros campos permanecen estrictos', () => {
  assert.equal(validateDataset(dataset()).valid, true);
  for (const notes of ['Información institucional verificable.', '', 'a'.repeat(600)]) {
    const data = dataset();
    data.institutions[0].notes = notes;
    assert.equal(validateDataset(data).valid, true);
  }
  for (const notes of [null, undefined, 10, false, [], {}, 'a'.repeat(601)]) {
    const data = dataset();
    data.institutions[0].notes = notes;
    const result = validateDataset(data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((message) => message.includes('institutions[0].notes')));
  }
  const unknown = dataset();
  unknown.institutions[0].notes = 'Información institucional verificable.';
  unknown.institutions[0].unknown = 'Campo no permitido.';
  assert.equal(validateDataset(unknown).valid, false);
});

test('UF vigente, antigua, futura o inválida y límite del día chileno', () => {
  assert.equal(getUfStatus(uf, now).usable, true);
  assert.equal(getUfStatus(uf, '2026-10-10').state, 'stale');
  assert.equal(getUfStatus(uf, '2026-10-08').state, 'future');
  assert.equal(getUfStatus({ ...uf, date: '2026-02-30' }, now).state, 'invalid');
  assert.equal(getUfStatus(uf, 'invalid-date').state, 'invalid');
  assert.equal(getUfStatus(null, now).usable, false);
  // UTC 02:00 is still the previous calendar day in Chile in October.
  assert.equal(getUfStatus(uf, new Date('2026-10-10T02:00:00Z')).usable, true);
  assert.equal(getUfStatus(uf, new Date('2026-10-10T04:00:00Z')).state, 'stale');
});

test('vigencia técnica de 7 días y publicación de 30 días no se confunden', () => {
  assert.equal(getOfferStatus(baseOffer, now).usable, true);
  assert.equal(getOfferStatus(baseOffer, '2026-10-16').usable, true);
  assert.equal(getOfferStatus(baseOffer, '2026-10-17').state, 'stale');
  assert.equal(getOfferStatus(baseOffer, '2026-10-08').state, 'future');
  assert.equal(getOfferStatus({ ...baseOffer, source: { ...source, updatedAt: '2026-09-08' } }, now).state, 'stale');
  assert.equal(getOfferStatus({ ...baseOffer, source: { ...source, updatedAt: '2026-09-09' } }, now).usable, true);
  assert.equal(getOfferStatus({ ...baseOffer, annualRatePercent: '4.5' }, now).state, 'invalid');
});

test('escenario CMF nunca se escala a capital, pie, plazo o ubicación diferente', () => {
  assert.equal(compareOffers(input, [baseOffer], now).length, 1);
  for (const patch of [{ propertyUf: 5000 }, { downPaymentPercent: 20 }, { years: 25 }, { location: 'other' }, { location: 'unknown' }]) assert.equal(compareOffers({ ...input, ...patch }, [baseOffer], now).length, 0);
  assert.equal(compareOffers({ propertyUf: 4000, downPaymentPercent: 25, years: 20 }, [baseOffer], now).length, 0);
  assert.equal(compareOffers(input, [baseOffer], '2026-10-17').length, 0);
  assert.deepEqual(compareOffers(input, [], now), []);
  assert.throws(() => compareOffers({ ...input, propertyUf: 0 }, [baseOffer], now));
  assert.throws(() => compareOffers({ ...input, location: 'invalid' }, [baseOffer], now));
});

test('condiciones oficiales con rango respetan monto y LTV; CAE no se extrapola', () => {
  const general = { ...baseOffer, source: { ...source, kind: 'official-terms' }, availableYears: [15, 20, 30], minPrincipalUf: 1000, maxPrincipalUf: 10000, minFinancingPercent: 10, maxFinancingPercent: 90, location: 'any' };
  const [result] = compareOffers({ ...input, propertyUf: 5000, downPaymentPercent: 10, years: 30 }, [general], now);
  assert.ok(result);
  assert.equal(result.totalCostUf, null);
  assert.equal(result.caePercent, null);
  assert.equal(result.monthlyInsuranceUf, null);
  assert.equal(result.monthlyTotalUf, null);
  assert.equal(compareOffers({ ...input, downPaymentPercent: 5 }, [general], now).length, 0);
});

test('seguros, costo contractual y coste financiero son magnitudes distintas', () => {
  const [result] = compareOffers(input, [baseOffer], now);
  assert.equal(result.monthlyPaymentUf, result.simulation.monthlyPaymentUf);
  assert.equal(result.monthlyInsuranceUf, 1);
  assert.equal(result.monthlyTotalUf, result.monthlyPaymentUf + 1);
  assert.equal(result.totalCostUf, null);
  assert.equal(result.totalCostComparable, false);
  assert.equal(result.caePercent, 5);
  assert.equal(result.caeComparable, true);
  const completeOffer = { ...baseOffer, scenarioCosts: { ...baseOffer.scenarioCosts, complete: true, coverage: 'all-known', totalCostUf: 5000 } };
  const [complete] = compareOffers(input, [completeOffer], now);
  assert.equal(complete.totalCostUf, 5000);
  assert.equal(complete.totalCostComparable, true);
  const unknownInsurance = { ...baseOffer, scenarioCosts: { ...baseOffer.scenarioCosts, monthlyInsuranceUf: null } };
  assert.equal(compareOffers(input, [unknownInsurance], now)[0].monthlyTotalUf, null);
});

test('un coste completo inferior a los dividendos financieros no puede publicarse ni compararse', () => {
  const data = dataset();
  const offer = data.offers[0];
  offer.annualRatePercent = 4.63;
  Object.assign(offer.scenarioCosts, { complete: true, coverage: 'all-known', totalCostUf: 4000 });
  // The independent CMF contrast is 19.0354913930 UF × 240 = 4568.51793432 UF.
  // 4000 exceeds the 3000-UF principal, but cannot be the complete credit cost.
  const rejected = validateDataset(data);
  assert.equal(rejected.valid, false);
  assert.ok(rejected.errors.some(message => message.includes('suma de dividendos financieros')));
  assert.equal(getOfferStatus(offer, now).state, 'invalid');
  assert.deepEqual(compareOffers(input, [offer], now), []);

  offer.scenarioCosts.totalCostUf = 5000;
  assert.equal(validateDataset(data).valid, true);
  assert.equal(compareOffers(input, [offer], now)[0].totalCostUf, 5000);

  // With zero interest and no charges, the exact lower bound is the principal.
  offer.annualRatePercent = 0;
  Object.assign(offer.scenarioCosts, { monthlyInsuranceUf: 0, monthlyOtherCostsUf: 0, oneTimeFeesUf: 0, caePercent: 0, totalCostUf: 3000 });
  assert.equal(validateDataset(data).valid, true);
  assert.equal(compareOffers(input, [offer], now)[0].totalCostUf, 3000);
});

test('ranking no muta resultados, pone costes ausentes al final y agrupa cobertura CAE', () => {
  const offers = [
    { ...baseOffer, id: 'high', annualRatePercent: 6, scenarioCosts: { ...baseOffer.scenarioCosts, caePercent: 7 } },
    { ...baseOffer, id: 'fire-only', annualRatePercent: 5, scenarioCosts: { ...baseOffer.scenarioCosts, caePercent: 4, insuranceCoverage: 'life-fire' } },
    { ...baseOffer, id: 'low', annualRatePercent: 3, scenarioCosts: { ...baseOffer.scenarioCosts, caePercent: 5 } },
    { ...baseOffer, id: 'missing', annualRatePercent: 4, scenarioCosts: null },
  ];
  const comparisons = compareOffers(input, offers, now);
  assert.deepEqual(sortComparisons(comparisons, 'dividend').map((row) => row.offer.id), ['low', 'missing', 'fire-only', 'high']);
  assert.deepEqual(sortComparisons(comparisons, 'rate').map((row) => row.offer.id), ['low', 'missing', 'fire-only', 'high']);
  // The cheaper CAE of fire-only cover is not ranked above earthquake cover.
  assert.deepEqual(sortComparisons(comparisons, 'cae').map((row) => row.offer.id), ['low', 'high', 'fire-only', 'missing']);
  assert.deepEqual(sortComparisons(comparisons, 'totalCost').map((row) => row.offer.id), ['high', 'fire-only', 'low', 'missing']);
  assert.deepEqual(comparisons.map((row) => row.offer.id), offers.map((offer) => offer.id));
  const full = compareOffers(input, [
    { ...baseOffer, id: 'expensive', scenarioCosts: { ...baseOffer.scenarioCosts, complete: true, coverage: 'all-known', totalCostUf: 7000 } },
    { ...baseOffer, id: 'cheap', scenarioCosts: { ...baseOffer.scenarioCosts, complete: true, coverage: 'all-known', totalCostUf: 6000 } },
    { ...baseOffer, id: 'none', scenarioCosts: null },
  ], now);
  assert.deepEqual(sortComparisons(full, 'totalCost').map((row) => row.offer.id), ['cheap', 'expensive', 'none']);
  assert.throws(() => sortComparisons(full, 'invalid'));
});

test('orden de tasas usa anual efectiva equivalente cuando la convención difiere', () => {
  const nominal = { ...baseOffer, id: 'nominal', annualRatePercent: 5, rateConvention: 'nominal' };
  const effective = { ...baseOffer, id: 'effective', annualRatePercent: 5.05, rateConvention: 'effective' };
  assert.deepEqual(sortComparisons(compareOffers(input, [nominal, effective], now), 'rate').map((row) => row.offer.id), ['effective', 'nominal']);
});
