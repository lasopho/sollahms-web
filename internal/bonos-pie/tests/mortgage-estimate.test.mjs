import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateMortgageEstimate, calculatePaymentPlan} from '../payment-plan.mjs';

const scenario = overrides => ({principalUf: 3200, annualRatePercentage: 4.5, termYears: 20,
  rateConvention: 'effective', ...overrides});
const calc = overrides => calculateMortgageEstimate(scenario(overrides));
const near = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const hasError = (result, field, code) => assert.ok(result.errors.some(row => row.field === field && (!code || row.code === code)), JSON.stringify(result));

test('fixed payment agrees with an independent known annuity reference', () => {
  const result = calc({principalUf: 100000, annualRatePercentage: 6, termYears: 30, rateConvention: 'nominal'});
  assert.equal(result.ok, true);
  near(result.monthlyPaymentUnroundedUf, 599.5505251527569);
  assert.equal(result.monthlyPaymentUf, 599.55);
  assert.equal(result.months, 360);
  assert.equal(result.interestAndPrincipalOnly, true);
  assert.equal(result.paymentTiming, 'end_of_month');
});

test('annual convention is explicit and distinguishes nominal and effective payments', () => {
  const nominal = calc({annualRatePercentage: 12, rateConvention: 'nominal'});
  const effective = calc({annualRatePercentage: 12, rateConvention: 'effective'});
  near(nominal.monthlyRate, 0.01);
  near((1 + effective.monthlyRate) ** 12, 1.12);
  assert.ok(nominal.monthlyPaymentUf > effective.monthlyPaymentUf);
  assert.equal(calc({principalUf: 860, annualRatePercentage: 4.55, termYears: 25}).monthlyPaymentUf, 4.76);
});

test('explicit zero interest divides capital across months with exact cent rounding', () => {
  for (const rateConvention of ['nominal', 'effective']) {
    const result = calc({principalUf: 3000, annualRatePercentage: 0, termYears: 25, rateConvention});
    assert.equal(result.ok, true);
    assert.equal(result.monthlyRate, 0);
    assert.equal(result.monthlyPaymentUf, 10);
    assert.equal(result.monthlyPaymentUnroundedUf, 10);
    assert.equal(calc({principalUf: 1.26, annualRatePercentage: 0, termYears: 1, rateConvention}).monthlyPaymentUf, 0.11);
  }
});

test('zero financing has zero payment only after all terms are explicitly validated', () => {
  assert.equal(calc({principalUf: 0}).monthlyPaymentUf, 0);
  for (const field of ['annualRatePercentage', 'termYears', 'rateConvention']) {
    const result = calc({principalUf: 0, [field]: undefined});
    assert.equal(result.ok, false);
    hasError(result, field);
  }
});

test('near-zero rates remain stable without cancellation', () => {
  for (const rateConvention of ['nominal', 'effective']) {
    const zero = calc({annualRatePercentage: 0, rateConvention});
    const almost = calc({annualRatePercentage: 0.000001, rateConvention});
    assert.equal(almost.ok, true);
    assert.ok(almost.monthlyPaymentUnroundedUf > zero.monthlyPaymentUnroundedUf);
    near(almost.monthlyPaymentUnroundedUf, zero.monthlyPaymentUnroundedUf, 0.000002);
  }
});

test('higher rates increase the payment and longer terms reduce it', () => {
  const low = calc({annualRatePercentage: 3});
  const high = calc({annualRatePercentage: 6});
  assert.ok(high.monthlyPaymentUf > low.monthlyPaymentUf);
  assert.ok(calc({termYears: 30}).monthlyPaymentUf < calc({termYears: 15}).monthlyPaymentUf);
  assert.ok(calc({principalUf: 3500}).monthlyPaymentUf > calc({principalUf: 3000}).monthlyPaymentUf);
});

test('independent month-by-month amortization clears the unrounded principal', () => {
  for (const principalUf of [0.01, 860, 1846.2, 1_000_000]) {
    for (const termYears of [1, 20, 40]) {
      for (const annualRatePercentage of [0, 0.000001, 4.5, 12]) {
        for (const rateConvention of ['nominal', 'effective']) {
          const result = calc({principalUf, termYears, annualRatePercentage, rateConvention});
          assert.equal(result.ok, true);
          let balance = principalUf;
          for (let month = 0; month < result.months; month++) balance = balance * (1 + result.monthlyRate) - result.monthlyPaymentUnroundedUf;
          near(balance, 0, Math.max(0.00001, principalUf * 1e-9));
          assert.ok(Math.abs(result.monthlyPaymentUf - result.monthlyPaymentUnroundedUf) <= 0.005000001);
        }
      }
    }
  }
});

test('a bonus changes buyer pie but is not subtracted from mortgage capital again', () => {
  const paymentPlan = bonus => calculatePaymentPlan({priceUf: 3000, requiredDownPaymentPercentage: 20,
    developerBonus: {percentage: bonus}, initialPayment: {percentage: 0}, reservationUf: 0,
    reservationTreatment: 'unknown', balloon: {percentage: 0}, installments: 24,
    startMonth: '2027-01', deliveryMonth: '2028-12', scenarioMode: 'simulation'});
  const without = paymentPlan(0), withBonus = paymentPlan(10);
  assert.equal(without.breakdown.financingBalanceUf, 2400);
  assert.equal(withBonus.breakdown.financingBalanceUf, 2400);
  assert.equal(calc({principalUf: without.breakdown.financingBalanceUf}).monthlyPaymentUf,
    calc({principalUf: withBonus.breakdown.financingBalanceUf}).monthlyPaymentUf);
});

test('missing values remain unknown and numeric strings are not silently coerced', () => {
  for (const field of ['principalUf', 'annualRatePercentage', 'termYears']) {
    for (const value of [undefined, null, '', '10', true, [], {}, NaN, Infinity, -Infinity]) {
      const result = calc({[field]: value});
      assert.equal(result.ok, false, field + ':' + String(value));
      hasError(result, field);
      assert.equal(result.monthlyPaymentUf, null);
    }
  }
  for (const value of [undefined, null, '', 'APR', 'NOMINAL', {}, 0]) {
    assert.equal(calc({rateConvention: value}).ok, false);
  }
});

test('unsupported decimal precision, negative values and fractional years are rejected', () => {
  for (const [field, value] of [['principalUf', -1], ['principalUf', 1_000_000.01], ['principalUf', 10.001],
    ['annualRatePercentage', -0.1], ['annualRatePercentage', 100.01], ['annualRatePercentage', 0.0000001],
    ['termYears', 0], ['termYears', 41], ['termYears', 20.5]]) {
    const result = calc({[field]: value});
    assert.equal(result.ok, false);
    hasError(result, field);
  }
});

test('supported boundary cases remain finite and the input is never changed', () => {
  for (const rateConvention of ['nominal', 'effective']) {
    for (const termYears of [1, 40]) {
      const input = Object.freeze(scenario({principalUf: 1_000_000, annualRatePercentage: 100, termYears, rateConvention}));
      const result = calculateMortgageEstimate(input);
      assert.equal(result.ok, true);
      assert.ok(Number.isFinite(result.monthlyPaymentUf));
      assert.ok(result.monthlyPaymentUf > 0);
      assert.deepEqual(result, calculateMortgageEstimate(input));
    }
  }
  for (const input of [undefined, null, [], false, 'scenario', 1]) {
    assert.doesNotThrow(() => calculateMortgageEstimate(input));
    assert.equal(calculateMortgageEstimate(input).ok, false);
  }
});
