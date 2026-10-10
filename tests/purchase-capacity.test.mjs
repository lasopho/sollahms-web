import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluateProject, validateCapacityInput, CapacityValidationError } from '../assets/js/purchase-capacity.mjs';
import { chileDate, verifiedProjectPrice, normalizeVerifiedPaymentTerms, verifiedProjectLocation } from '../assets/js/project-finance.mjs';
import { compareOffers, getOfferStatus } from '../assets/js/mortgage-data.mjs';

const now = '2026-10-10';
const source = 'https://maestra.cl/proyectos/distrito-centro/';
const project = { slug: 'synthetic-project', nombre: 'Proyecto de prueba', precioDesdeUF: 4000, verificacion: {
  fecha: now, fuente: source, estadoFuente: 'verified', camposVerificados: ['nombre', 'precioDesdeUF'],
} };
const dataset = { uf: { date: now, valueClp: 41136.24, source: {
  url: 'https://www.sii.cl/valores_y_fechas/uf/uf2026.htm', title: 'SII UF oficial', verifiedAt: now,
} } };
const baseInput = {
  incomeClp: 3_500_000, complementIncome: false, secondIncomeClp: 0, debtClp: 0,
  savings: 800, savingsCurrency: 'UF', monthlySavingsClp: 0, horizonMonths: 0,
  downPaymentPercent: 20, years: 20, annualRatePercent: 4.5, rateConvention: 'effective', burdenPercent: 25,
};
const evaluate = (patch = {}, projectPatch = {}, data = dataset, date = now) => evaluateProject({ ...project, ...projectPatch }, { ...baseInput, ...patch }, data, date);
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) <= tolerance, `${a} ≠ ${b}`);

// Independent monthly balance iteration; not a second production engine.
function independentPayment(principal, annualRatePercent, years, convention) {
  const rate = convention === 'effective' ? (1 + annualRatePercent / 100) ** (1 / 12) - 1 : annualRatePercent / 1200;
  let low = 0; let high = principal * (1 + rate);
  for (let step = 0; step < 90; step++) {
    const payment = (low + high) / 2;
    let balance = principal;
    for (let month = 0; month < years * 12; month++) balance = balance * (1 + rate) - payment;
    if (balance > 0) low = payment; else high = payment;
  }
  return (low + high) / 2;
}

test('precio exige campo explícitamente contrastado, fuente HTTPS y fecha verificable no histórica', () => {
  assert.deepEqual(verifiedProjectPrice(project, now), { valueUf: 4000, date: now, source });
  for (const price of [null, undefined, 0, -1, Infinity, NaN, '4000']) assert.equal(verifiedProjectPrice({ ...project, precioDesdeUF: price }, now), null);
  for (const patch of [
    { estadoFuente: 'not_found' }, { camposVerificados: ['nombre'] },
    { fecha: '2026-10-11' }, { fecha: '2026-09-09' }, { fecha: '2026-02-30' },
    { fuente: 'http://maestra.cl/proyecto' }, { fuente: 'https://user:password@maestra.cl/proyecto' },
    { fuente: '/proyecto' }, { fuente: 'https://maestra.cl:8080/proyecto' },
  ]) assert.equal(verifiedProjectPrice({ ...project, verificacion: { ...project.verificacion, ...patch } }, now), null);
  assert.equal(verifiedProjectPrice(null, now), null);
  assert.equal(verifiedProjectPrice(project, 'invalid'), null);
  assert.ok(verifiedProjectPrice({ ...project, verificacion: { ...project.verificacion, fecha: '2026-09-10' } }, now));
});

test('fechas siguen Chile, no el día UTC ni fechas calendario inválidas', () => {
  assert.equal(chileDate(new Date('2026-10-11T02:00:00Z')), '2026-10-10');
  assert.equal(chileDate(new Date('2026-10-11T04:00:00Z')), '2026-10-11');
  assert.equal(chileDate('2026-02-30'), null);
  assert.equal(chileDate('invalid'), null);
});

test('148 proyectos conservados: sólo 115 precios verificados participan; 33 quedan E', async () => {
  const projects = JSON.parse(await readFile(new URL('../data/proyectos.json', import.meta.url), 'utf8'));
  assert.equal(projects.length, 148);
  const known = projects.filter((p) => verifiedProjectPrice(p, now));
  assert.equal(known.length, 115);
  for (const p of projects) {
    const result = evaluateProject(p, baseInput, dataset, now);
    if (!verifiedProjectPrice(p, now)) {
      assert.equal(result.category, 'E'); assert.equal(result.price, null); assert.equal(result.mortgage, null);
    } else {
      assert.notEqual(result.category, 'E'); assert.equal(result.price.valueUf, p.precioDesdeUF);
      assert.equal(result.price.source, p.verificacion.fuente);
    }
  }
});

test('A/B/C/D son restricciones explicables y exclusivas, incluidas las dos fricciones simultáneas', () => {
  const a = evaluate();
  assert.equal(a.category, 'A'); assert.equal(a.paymentCompatible, true); assert.equal(a.savingsCompatible, true);
  const b = evaluate({ savings: 400 });
  assert.equal(b.category, 'B'); assert.equal(b.gapUf, 400); assert.equal(b.monthsToSave, null);
  const c = evaluate({ incomeClp: 2_500_000 });
  assert.equal(c.category, 'C'); assert.equal(c.paymentCompatible, false); assert.equal(c.savingsCompatible, true);
  const d = evaluate({ savings: 400, incomeClp: 2_500_000 });
  assert.equal(d.category, 'D'); assert.equal(d.paymentCompatible, false); assert.equal(d.savingsCompatible, false);
  assert.equal(d.assumptions.bankApproval, false);
});

test('complementa renta sólo si se selecciona Sí, conserva advertencia institucional y no identidad', () => {
  assert.equal(evaluate({ incomeClp: 2_500_000, secondIncomeClp: 1_000_000 }).category, 'C');
  const result = evaluate({ incomeClp: 2_500_000, complementIncome: true, secondIncomeClp: 1_000_000 });
  assert.equal(result.category, 'A'); assert.equal(result.totalIncomeClp, 3_500_000);
  assert.match(result.assumptions.complementWarning, /cada institución/);
  assert.throws(() => evaluate({ complementIncome: true, secondIncomeClp: 0 }), CapacityValidationError);
});

test('deudas reducen presupuesto conservador y muestran dos ratios distintos sin política bancaria', () => {
  const result = evaluate({ debtClp: 200_000 });
  assert.equal(result.category, 'C'); assert.equal(result.monthlyBudgetClp, 675_000);
  near(result.dividendIncomeRatio, result.monthlyPaymentClp / 3_500_000);
  near(result.totalBurdenRatio, (result.monthlyPaymentClp + 200_000) / 3_500_000);
  assert.equal(evaluate({ debtClp: 4_000_000 }).monthlyBudgetClp, 0);
  assert.equal(result.assumptions.budgetMethod, 'income-times-criterion-minus-debt');
});

test('criterio30% cambia escenario de búsqueda, sin insinuar aprobación o porcentaje estadístico', () => {
  assert.equal(evaluate({ incomeClp: 3_000_000 }).category, 'C');
  const result = evaluate({ incomeClp: 3_000_000, burdenPercent: 30 });
  assert.equal(result.category, 'A'); assert.equal(result.monthlyBudgetClp, 900_000);
  assert.equal(result.assumptions.burdenPercent, 30);
  assert.equal(Object.hasOwn(result, 'approvalProbability'), false);
});

test('anualidad coincide con amortización independiente para pies, plazos y convenciones', () => {
  for (const downPaymentPercent of [10, 15, 20, 90]) for (const years of [5, 15, 20, 25, 30, 40]) for (const rateConvention of ['effective', 'nominal']) {
    const result = evaluate({ downPaymentPercent, years, rateConvention, annualRatePercent: 4.5 });
    const principal = 4000 * (1 - downPaymentPercent / 100);
    near(result.mortgage.monthlyPaymentUf, independentPayment(principal, 4.5, years, rateConvention), 1e-7);
    near(result.mortgage.downPaymentUf + result.mortgage.principalUf, 4000);
  }
  // This independently recorded fixture also protects dated UF conversion.
  const result = evaluate();
  near(result.mortgage.monthlyPaymentUf, 20.089257090229005);
  near(result.monthlyPaymentClp, 826396.5010853619);
  assert.equal(result.downPaymentClp, 32908992);
});

test('tasa cero es válida, tasa ausente produce E y ninguna referencia CMF se presume universal', () => {
  const zero = evaluate({ annualRatePercent: 0 });
  near(zero.mortgage.monthlyPaymentUf, 3200 / 240);
  assert.notEqual(zero.category, 'E');
  for (const annualRatePercent of [undefined, null]) {
    const result = evaluate({ annualRatePercent });
    assert.equal(result.category, 'E'); assert.equal(result.mortgage, null); assert.match(result.reason, /tasa/);
  }
});

test('UF/CLP representan el mismo ahorro; el horizonte proyecta sólo ahorro lineal sin rendimiento', () => {
  const clp = evaluate({ savings: 32908992, savingsCurrency: 'CLP' });
  assert.equal(clp.category, 'A'); assert.equal(clp.currentSavingsUf, 800);
  const monthly = 100 * dataset.uf.valueClp;
  for (const horizonMonths of [0, 6, 12, 18, 24, 36]) {
    const result = evaluate({ savings: 200, monthlySavingsClp: monthly, horizonMonths });
    near(result.horizonSavingsUf, 200 + 100 * horizonMonths);
    assert.equal(result.category, horizonMonths < 6 ? 'B' : 'A');
    assert.equal(result.monthsToSave, 6);
  }
  assert.equal(evaluate({ savings: 800, monthlySavingsClp: 0 }).monthsToSave, 0);
  assert.equal(evaluate({ savings: 799, monthlySavingsClp: 0 }).monthsToSave, null);
});

test('tiempo ahorra techo de meses desde hoy; gap indicado corresponde al horizonte seleccionado', () => {
  const result = evaluate({ savings: 200, monthlySavingsClp: 100 * dataset.uf.valueClp, horizonMonths: 2 });
  assert.equal(result.currentGapUf, 600); assert.equal(result.gapUf, 400); assert.equal(result.monthsToSave, 6);
  assert.equal(evaluate({ savings: 201, monthlySavingsClp: 100 * dataset.uf.valueClp }).monthsToSave, 6);
  assert.equal(evaluate({ savings: 199, monthlySavingsClp: 100 * dataset.uf.valueClp }).monthsToSave, 7);
});

test('fronteras exactamente iguales cumplen ambos criterios, sin banda arbitraria de tolerancia', () => {
  const { monthlyPaymentClp } = evaluate();
  const equal = evaluate({ incomeClp: monthlyPaymentClp / .25, savings: 800 });
  assert.equal(equal.category, 'A'); assert.equal(equal.gapUf, 0);
  assert.equal(evaluate({ incomeClp: monthlyPaymentClp / .25 - 1 }).category, 'C');
  assert.equal(evaluate({ savings: 799.999999 }).category, 'B');
});

test('UF vencida, futura, inválida o ausente impiden clasificación y conversiones actuales', () => {
  for (const uf of [undefined, null, { ...dataset.uf, date: '2026-10-09' }, { ...dataset.uf, date: '2026-10-11' }, { ...dataset.uf, valueClp: NaN }, { ...dataset.uf, source: { ...dataset.uf.source, url: 'https://example.invalid/uf' } }]) {
    const result = evaluate({}, {}, { uf });
    assert.equal(result.category, 'E'); assert.equal(result.monthlyPaymentClp, null); assert.equal(result.downPaymentClp, null);
    assert.equal(result.ratio, null); assert.equal(result.horizonSavingsUf, null);
    assert.ok(result.mortgage); // UF mathematics stays possible, without a peso claim.
  }
  const tomorrow = evaluate({}, {}, dataset, '2026-10-11');
  assert.equal(tomorrow.category, 'E'); assert.equal(tomorrow.ufStatus.state, 'stale');
  assert.equal(evaluate({ savings: 1_000_000, savingsCurrency: 'CLP' }, {}, {}).currentSavingsUf, null);
});

test('entrada inválida se rechaza con campo y explicación, sin coerción ni infinidades', () => {
  const patches = [
    { incomeClp: 0 }, { incomeClp: -1 }, { incomeClp: '3500000' }, { incomeClp: NaN }, { incomeClp: Infinity },
    { complementIncome: 'yes' }, { complementIncome: true, secondIncomeClp: -1 },
    { debtClp: -1 }, { savings: -1 }, { savingsCurrency: 'USD' }, { monthlySavingsClp: -1 },
    { horizonMonths: -1 }, { horizonMonths: 6.5 }, { horizonMonths: 601 },
    { downPaymentPercent: 0 }, { downPaymentPercent: 95 }, { years: 4 }, { years: 41 }, { years: 20.5 },
    { annualRatePercent: -1 }, { annualRatePercent: 26 }, { annualRatePercent: '' },
    { burdenPercent: 26 }, { rateConvention: 'APR' },
  ];
  for (const patch of patches) assert.throws(() => validateCapacityInput({ ...baseInput, ...patch }), (error) => error instanceof CapacityValidationError && error.field && error.message.length > 15);
  for (const input of [null, [], undefined]) assert.throws(() => validateCapacityInput(input), CapacityValidationError);
});

test('rangos extremos admitidos producen resultados finitos y no modifican los parámetros originales', () => {
  const input = { ...baseInput, incomeClp: 10_000_000_000, debtClp: 10_000_000_000, savings: 1_000_000,
    monthlySavingsClp: 10_000_000_000, horizonMonths: 600, downPaymentPercent: 90, years: 40, annualRatePercent: 25 };
  const original = structuredClone(input);
  const result = evaluateProject(project, input, dataset, now);
  assert.deepEqual(input, original);
  for (const field of ['monthlyPaymentClp', 'downPaymentClp', 'horizonSavingsUf', 'gapUf', 'ratio']) assert.ok(Number.isFinite(result[field]));
  assert.equal(result.monthlyBudgetClp, 0); assert.equal(result.category, 'C');
});

test('modelo de condiciones del pie mantiene desconocidos y exige procedencia campo por campo', () => {
  assert.equal(normalizeVerifiedPaymentTerms(undefined, now), null);
  assert.equal(evaluate().paymentTerms, null);
  const terms = { reservationUf: 10, downPaymentInstallments: 12, installmentAmountUf: 30, balloonUf: 430,
    deferredDownPaymentUf: 0, downPaymentBonusUf: 0, deliveryDate: '2028-06-01',
    verificacion: { fecha: now, fuente: source, estadoFuente: 'verified', camposVerificados: ['reservationUf', 'downPaymentInstallments', 'deliveryDate'] } };
  const normalized = normalizeVerifiedPaymentTerms(terms, now);
  assert.equal(normalized.reservationUf, 10); assert.equal(normalized.downPaymentInstallments, 12);
  assert.equal(normalized.deliveryDate, '2028-06-01');
  for (const field of ['installmentAmountUf', 'balloonUf', 'deferredDownPaymentUf', 'downPaymentBonusUf']) assert.equal(normalized[field], null);
  assert.equal(normalizeVerifiedPaymentTerms({ ...terms, verificacion: { ...terms.verificacion, fecha: '2026-09-01' } }, now), null);
  assert.equal(normalizeVerifiedPaymentTerms({ ...terms, verificacion: { ...terms.verificacion, camposVerificados: [] } }, now), null);
  assert.equal(normalizeVerifiedPaymentTerms({ ...terms, reservationUf: -1, downPaymentInstallments: 1.5, deliveryDate: '2028-02-30' }, now), null);
});

test('sin seguros/gastos verificados no se muestran como cero ni entran al presupuesto', () => {
  const result = evaluate();
  for (const field of ['monthlyInsuranceUf', 'monthlyOtherCostsUf', 'oneTimeFeesUf']) assert.equal(result[field], null);
  assert.equal(result.assumptions.insuranceAndFeesIncluded, false);
});

test('referencias CMF conservan escenario y fechas; cambio de monto, pie, plazo o ubicación no extrapola', async () => {
  const published = JSON.parse(await readFile(new URL('../data/hipotecario.json', import.meta.url), 'utf8'));
  assert.equal(published.uf.date, now); assert.equal(published.uf.valueClp, 41136.24);
  const exact = { propertyUf: 4000, downPaymentPercent: 25, years: 20, location: 'santiago-metropolitana' };
  const results = compareOffers(exact, published.offers, now);
  assert.equal(results.length, 3);
  for (const patch of [{ propertyUf: 4001 }, { downPaymentPercent: 20 }, { years: 25 }, { location: 'other' }, { location: 'unknown' }]) {
    assert.equal(compareOffers({ ...exact, ...patch }, published.offers, now).length, 0);
  }
  const scotia = published.offers.find((offer) => offer.institutionId === 'scotiabank');
  assert.equal(scotia.source.verifiedAt, '2026-10-09'); assert.equal(scotia.source.updatedAt, '2026-09-10');
  assert.equal(getOfferStatus(scotia, '2026-10-11').state, 'stale');
});


test('ubicación CMF no confunde toda Región Metropolitana con área urbana confirmada', () => {
  const place = { ...project, region: 'Región Metropolitana', comuna: 'Santiago', verificacion: { ...project.verificacion, camposVerificados: ['region', 'comuna'] } };
  assert.equal(verifiedProjectLocation(place, now), 'santiago-metropolitana');
  for (const comuna of ['Las Condes', 'Lo Barnechea', 'Lampa', 'Melipilla', 'Colina', 'San Bernardo']) assert.equal(verifiedProjectLocation({ ...place, comuna }, now), 'unknown');
  assert.equal(verifiedProjectLocation({ ...place, region: 'Ñuble', comuna: 'Chillán' }, now), 'other');
  assert.equal(verifiedProjectLocation({ ...place, verificacion: { ...place.verificacion, camposVerificados: ['comuna'] } }, now), 'unknown');
  assert.equal(verifiedProjectLocation({ ...place, verificacion: { ...place.verificacion, fecha: '2026-09-01' } }, now), 'unknown');
  assert.equal(verifiedProjectLocation(null, now), 'unknown');
});
