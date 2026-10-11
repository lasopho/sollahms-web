import test from 'node:test';
import assert from 'node:assert/strict';
import { annualToMonthlyRate, calculateMortgage, MORTGAGE_LIMITS, MortgageValidationError, ufToClp } from '../assets/js/mortgage-engine.mjs';

const scenario = { propertyUf: 4000, downPaymentPercent: 20, years: 20, annualRatePercent: 4.5, rateConvention: 'effective' };
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('pie, capital y financiamiento conservan el valor de la propiedad', () => {
  for (const downPaymentPercent of [10, 15, 20, 25, 35.7, 90]) {
    const result = calculateMortgage({ ...scenario, downPaymentPercent });
    near(result.downPaymentUf, scenario.propertyUf * downPaymentPercent / 100);
    near(result.principalUf + result.downPaymentUf, result.propertyUf);
    assert.equal(result.financingPercent, 100 - downPaymentPercent);
  }
});

test('convención nominal mensual y efectiva anual se convierten explícitamente', () => {
  near(annualToMonthlyRate(12, 'nominal'), 0.01);
  near((1 + annualToMonthlyRate(12, 'effective')) ** 12, 1.12);
  assert.notEqual(annualToMonthlyRate(12, 'nominal'), annualToMonthlyRate(12, 'effective'));
  assert.equal(annualToMonthlyRate(0, 'nominal'), 0);
  assert.equal(annualToMonthlyRate(0, 'effective'), 0);
});

test('contraste independiente contra anualidad conocida y resultado publicado CMF', () => {
  const result = calculateMortgage(scenario);
  const rate = (1.045 ** (1 / 12)) - 1;
  const expected = 3200 * rate * (1 + rate) ** 240 / ((1 + rate) ** 240 - 1);
  near(result.monthlyPaymentUf, expected);
  const cmf = calculateMortgage({ propertyUf: 860 / 0.75, downPaymentPercent: 25, years: 25, annualRatePercent: 4.55, rateConvention: 'effective' });
  near(cmf.monthlyPaymentUf, 4.759575190387893, 0.000001);
  assert.equal(cmf.monthlyPaymentUf.toFixed(2), '4.76');
  // Nominal conversion does not reproduce the observed CMF scenario.
  assert.equal(calculateMortgage({ ...scenario, propertyUf: 860 / 0.75, downPaymentPercent: 25, years: 25, annualRatePercent: 4.55, rateConvention: 'nominal' }).monthlyPaymentUf.toFixed(2), '4.80');
});

test('amortización iterativa independiente liquida el capital y concilia intereses', () => {
  for (const propertyUf of [100, 1500, 10000, 1_000_000]) {
    for (const downPaymentPercent of [5, 10, 20, 90]) {
      for (const years of [5, 15, 25, 40]) {
        for (const annualRatePercent of [0, 0.000001, 4.5, 25]) {
          for (const rateConvention of ['nominal', 'effective']) {
            const result = calculateMortgage({ propertyUf, downPaymentPercent, years, annualRatePercent, rateConvention });
            let balance = result.principalUf;
            let interests = 0;
            for (let month = 0; month < result.months; month += 1) {
              const interest = balance * result.monthlyRate;
              interests += interest;
              balance -= result.monthlyPaymentUf - interest;
            }
            near(balance, 0, Math.max(0.0001, result.principalUf * 1e-8));
            near(interests, result.totalInterestUf, Math.max(0.0001, result.principalUf * 1e-8));
            assert.ok(Number.isFinite(result.monthlyPaymentUf) && result.monthlyPaymentUf > 0);
          }
        }
      }
    }
  }
});

test('tasa cero y casi cero son estables, sin división por cero', () => {
  const result = calculateMortgage({ ...scenario, annualRatePercent: 0 });
  near(result.monthlyPaymentUf, result.principalUf / result.months);
  assert.equal(result.totalPaymentsUf, result.principalUf);
  assert.equal(result.totalInterestUf, 0);
  near(calculateMortgage({ ...scenario, annualRatePercent: 1e-12 }).monthlyPaymentUf, result.monthlyPaymentUf, 1e-8);
});

test('más plazo reduce dividendo pero aumenta intereses; más tasa aumenta ambos', () => {
  const short = calculateMortgage({ ...scenario, years: 15 });
  const long = calculateMortgage({ ...scenario, years: 30 });
  assert.ok(long.monthlyPaymentUf < short.monthlyPaymentUf);
  assert.ok(long.totalInterestUf > short.totalInterestUf);
  const lowRate = calculateMortgage({ ...scenario, annualRatePercent: 3 });
  const highRate = calculateMortgage({ ...scenario, annualRatePercent: 6 });
  assert.ok(lowRate.monthlyPaymentUf < highRate.monthlyPaymentUf);
  assert.ok(lowRate.totalInterestUf < highRate.totalInterestUf);
  near(highRate.totalPaymentsUf, highRate.monthlyPaymentUf * highRate.months);
  near(highRate.totalInterestUf, highRate.totalPaymentsUf - highRate.principalUf);
});

test('conversión UF/CLP mantiene decimales y no estima valores UF futuros', () => {
  near(ufToClp(10.5, 41130.94), 431874.87, 1e-7);
  assert.equal(ufToClp(0, 41130.94), 0);
  for (const value of [null, undefined, '41130.94', 0, -1, Infinity, NaN]) assert.throws(() => ufToClp(1, value), MortgageValidationError);
  for (const value of [null, undefined, '1', -1, Infinity, NaN]) assert.throws(() => ufToClp(value, 41130.94), MortgageValidationError);
});

test('rechaza datos faltantes, no finitos, tipos implícitos, límites y plazos fraccionarios', () => {
  assert.throws(() => calculateMortgage(), MortgageValidationError);
  for (const field of Object.keys(MORTGAGE_LIMITS)) {
    for (const value of [undefined, null, '', '10', NaN, Infinity, -Infinity, MORTGAGE_LIMITS[field].min - 1, MORTGAGE_LIMITS[field].max + 1]) {
      assert.throws(() => calculateMortgage({ ...scenario, [field]: value }), (error) => error instanceof MortgageValidationError && error.field === field);
    }
  }
  assert.throws(() => calculateMortgage({ ...scenario, years: 20.5 }), MortgageValidationError);
  assert.throws(() => calculateMortgage({ ...scenario, rateConvention: 'APR' }), MortgageValidationError);
});
