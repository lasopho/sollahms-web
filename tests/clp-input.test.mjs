import test from 'node:test';
import assert from 'node:assert/strict';
import dataset from '../data/hipotecario.json' with { type: 'json' };
import { parseClpAmount, formatClpAmount } from '../assets/js/clp-input.mjs';
import { evaluateProject, validateCapacityInput, CapacityValidationError } from '../assets/js/purchase-capacity.mjs';
import { getUfStatus } from '../assets/js/mortgage-data.mjs';

// Monetary strings represent anonymous synthetic scenarios, never contact data.
const now = '2026-10-10';
const project = {
  slug: 'synthetic-clp-project', nombre: 'Proyecto sintético CLP', precioDesdeUF: 4000,
  verificacion: { fecha: now, fuente: 'https://maestra.cl/proyectos/distrito-centro/',
    estadoFuente: 'verified', camposVerificados: ['nombre', 'precioDesdeUF'] },
};
const baseInput = {
  incomeClp: 5_000_000, complementIncome: false, secondIncomeClp: 0, debtClp: 0,
  savings: 20_000_000, savingsCurrency: 'CLP', monthlySavingsClp: 0, horizonMonths: 0,
  downPaymentPercent: 20, years: 20, annualRatePercent: 4.5, rateConvention: 'effective', burdenPercent: 25,
};
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);
const evaluate = (patch = {}, selectedProject = project, selectedDataset = dataset, date = now) => evaluateProject(selectedProject, { ...baseInput, ...patch }, selectedDataset, date);

test('CLP accepts 5/20/100 million as plain digits or correctly grouped pesos, with optional currency prefix', () => {
  for (const [expected, forms] of [
    [5_000_000, ['5000000', '5.000.000', '$5.000.000', '$ 5.000.000', '  $ 5.000.000  ', '$5000000']],
    [20_000_000, ['20000000', '20.000.000', '$20.000.000', '$ 20.000.000']],
    [100_000_000, ['100000000', '100.000.000', '$100.000.000', '$ 100000000']],
  ]) {
    for (const form of forms) assert.equal(parseClpAmount(form), expected, form);
    assert.equal(formatClpAmount(expected), '$' + String(expected).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  }
});

test('blank optional debt/monthly savings remain zero; required income is separately rejected by the wrapper', () => {
  for (const form of ['', ' ', '\t\n', '0', '$0', '$ 0']) assert.equal(parseClpAmount(form), 0, JSON.stringify(form));
  const input = validateCapacityInput({ ...baseInput,
    debtClp: parseClpAmount(''), monthlySavingsClp: parseClpAmount('  '), secondIncomeClp: parseClpAmount('0'),
  });
  assert.equal(input.debtClp, 0);
  assert.equal(input.monthlySavingsClp, 0);
  assert.equal(input.secondIncomeClp, 0);
  assert.throws(() => validateCapacityInput({ ...baseInput, incomeClp: parseClpAmount('') }), CapacityValidationError);
  assert.throws(() => validateCapacityInput({ ...baseInput, complementIncome: true, secondIncomeClp: parseClpAmount('') }), CapacityValidationError);
  assert.equal(formatClpAmount(0), '$0');
});

test('CLP grouping is validated before numeric conversion; malformed or decimal entries are never truncated', () => {
  for (const form of [
    '5.000.00', '5.00.000', '5000.000', '5..000.000', '.5000000', '5.000.000.', '5 000 000',
    '5,000,000', '5.000.000,50', '5000000,5', '5000000.5', '5.50', '-5.000.000', '+5000000',
    '$-5.000.000', '$$5.000.000', '5.000.000$', '$', '5e6', '5E+6', '0x4c4b40', 'Infinity', 'NaN',
    'cinco millones', '5000000 CLP', 'UF 120', '５００００００', '5_000_000', '5/000/000',
  ]) assert.throws(() => parseClpAmount(form), undefined, form);
});

test('parser only accepts input strings and never silently coerces other types', () => {
  for (const value of [null, undefined, 0, 5_000_000, NaN, Infinity, true, false, [], ['5000000'], {}, { toString: () => '5000000' }]) {
    assert.throws(() => parseClpAmount(value), undefined, typeof value);
  }
});

test('default savings ceiling and custom monthly/income ceiling include equality and reject larger values', () => {
  assert.equal(parseClpAmount('1.000.000.000.000'), 1_000_000_000_000);
  assert.equal(parseClpAmount('$1000000000000'), 1_000_000_000_000);
  assert.throws(() => parseClpAmount('1.000.000.000.001'));
  assert.throws(() => parseClpAmount('1000000000001'));
  const options = { max: 10_000_000_000, label: 'Renta líquida' };
  assert.equal(parseClpAmount('$10.000.000.000', options), 10_000_000_000);
  assert.equal(parseClpAmount('10000000000', options), 10_000_000_000);
  assert.throws(() => parseClpAmount('10.000.000.001', options));
  assert.throws(() => parseClpAmount('10000000001', options));
  assert.equal(parseClpAmount('0', { max: 0 }), 0);
  assert.throws(() => parseClpAmount('1', { max: 0 }));
});

test('safe integer boundary is exact and formatter rejects fractions, negatives, nonfinite values and type coercion', () => {
  assert.equal(parseClpAmount('9007199254740991', { max: Number.MAX_SAFE_INTEGER }), Number.MAX_SAFE_INTEGER);
  assert.equal(parseClpAmount('9.007.199.254.740.991', { max: Number.MAX_SAFE_INTEGER }), Number.MAX_SAFE_INTEGER);
  assert.throws(() => parseClpAmount('9007199254740992', { max: Number.MAX_SAFE_INTEGER }));
  assert.throws(() => parseClpAmount('9007199254740993', { max: Number.MAX_SAFE_INTEGER }));
  assert.equal(formatClpAmount(Number.MAX_SAFE_INTEGER), '$9.007.199.254.740.991');
  for (const value of [-1, 0.5, 5_000_000.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1,
    '5000000', null, undefined, true, [], {}]) assert.throws(() => formatClpAmount(value));
});

test('formatting and parsing round-trip exact peso integers without hidden currency conversion', () => {
  for (const amount of [0, 1, 999, 1000, 5000, 5_000_000, 20_000_000, 100_000_000, 10_000_000_000, 1_000_000_000_000, Number.MAX_SAFE_INTEGER]) {
    const formatted = formatClpAmount(amount);
    assert.match(formatted, /^\$\d{1,3}(?:\.\d{3})*$/);
    assert.equal(parseClpAmount(formatted, { max: Number.MAX_SAFE_INTEGER }), amount);
  }
});

test('formatted input maps to the same A/B/C/D/E categories as numerical CLP under the original wrapper', () => {
  for (const [category, income, savings] of [
    ['A', '$5.000.000', '$100.000.000'], ['B', '$5.000.000', '$5.000.000'],
    ['C', '$1.000.000', '$100.000.000'], ['D', '$1.000.000', '$5.000.000'],
  ]) {
    const input = { incomeClp: parseClpAmount(income, { max: 10_000_000_000 }), savings: parseClpAmount(savings) };
    const result = evaluate(input);
    assert.equal(result.category, category);
    assert.deepEqual(result, evaluate({ incomeClp: Number(income.replace(/[$.]/g, '')), savings: Number(savings.replace(/[$.]/g, '')) }));
    assert.equal(result.assumptions.bankApproval, false);
  }
  assert.equal(evaluate({ savings: parseClpAmount('$20.000.000') }, { ...project, precioDesdeUF: null }).category, 'E');
  assert.equal(evaluate({ annualRatePercent: null }).category, 'E');
});

test('parsed peso savings equal explicit UF savings only when the official dated UF is usable', () => {
  const status = getUfStatus(dataset.uf, now);
  assert.equal(status.usable, true);
  assert.equal(status.date, now);
  assert.equal(status.valueClp, 41136.24);
  assert.equal(status.sourceUrl, 'https://www.sii.cl/valores_y_fechas/uf/uf2026.htm');
  for (const formatted of ['$5.000.000', '$20.000.000', '$100.000.000']) {
    const amount = parseClpAmount(formatted);
    const clpResult = evaluate({ savings: amount });
    const ufResult = evaluate({ savings: amount / status.valueClp, savingsCurrency: 'UF' });
    assert.equal(clpResult.currentSavingsUf, amount / status.valueClp);
    assert.deepEqual(clpResult, ufResult);
  }
  const stale = structuredClone(dataset);
  stale.uf.date = '2026-10-09'; stale.uf.source.verifiedAt = '2026-10-09';
  const result = evaluate({ savings: parseClpAmount('$20.000.000') }, project, stale);
  assert.equal(result.category, 'E');
  assert.equal(result.currentSavingsUf, null);
  assert.equal(result.monthlyPaymentClp, null);
  assert.equal(result.horizonSavingsUf, null);
});

test('peso parsing preserves monthly savings horizons and months needed without changing the financial engine', () => {
  const savings = parseClpAmount('$5.000.000');
  const monthlySavingsClp = parseClpAmount('$2.000.000', { max: 10_000_000_000 });
  for (const horizonMonths of [0, 6, 12, 18, 24, 36]) {
    const result = evaluate({ savings, monthlySavingsClp, horizonMonths });
    assert.equal(result.category, horizonMonths < 14 ? 'B' : 'A');
    near(result.currentSavingsUf, 5_000_000 / dataset.uf.valueClp);
    near(result.horizonSavingsUf, (5_000_000 + 2_000_000 * horizonMonths) / dataset.uf.valueClp);
    near(result.gapUf, Math.max(0, 800 - (5_000_000 + 2_000_000 * horizonMonths) / dataset.uf.valueClp));
    assert.equal(result.monthsToSave, 14);
    assert.equal(result.assumptions.horizonMonths, horizonMonths);
    assert.equal(result.assumptions.savingsGrowthMethod, 'constant-dated-uf-no-yield');
  }
  const optionalZero = evaluate({ savings, monthlySavingsClp: parseClpAmount('') });
  assert.equal(optionalZero.category, 'B');
  assert.equal(optionalZero.monthsToSave, null);
});

test('parsed CLP retains complemented income and optional debts as separate financial inputs', () => {
  const result = evaluate({
    incomeClp: parseClpAmount('$2.000.000', { max: 10_000_000_000 }),
    complementIncome: true, secondIncomeClp: parseClpAmount('$3.000.000', { max: 10_000_000_000 }),
    debtClp: parseClpAmount('$300.000', { max: 10_000_000_000 }), savings: parseClpAmount('$100.000.000'),
  });
  assert.equal(result.category, 'A');
  assert.equal(result.totalIncomeClp, 5_000_000);
  assert.equal(result.monthlyBudgetClp, 950_000);
  near(result.dividendIncomeRatio, result.monthlyPaymentClp / 5_000_000);
  near(result.totalBurdenRatio, (result.monthlyPaymentClp + 300_000) / 5_000_000);
  assert.match(result.assumptions.complementWarning, /cada institución/);
});
