import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePaymentPlan} from '../payment-plan.mjs';

const scenario = overrides => ({
  priceUf: '3000.00',
  requiredDownPaymentPercentage: '20',
  developerBonus: {percentage: '0'},
  initialPayment: {percentage: '2'},
  reservationUf: '0',
  reservationTreatment: 'unknown',
  balloon: {amountUf: '0'},
  installments: 24,
  startMonth: '2027-01',
  deliveryMonth: '2028-12',
  scenarioMode: 'simulation',
  ...overrides
});
const calculate = overrides => calculatePaymentPlan(scenario(overrides));
const code = (result, expected) => assert.ok(result.errors.some(error => error.code === expected), JSON.stringify(result.errors));
const monthly = result => result.schedule.filter(row => row.kind === 'installment');
function reconciles(result) {
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.breakdown.reconciled, true);
  assert.equal(result.schedule.reduce((sum, row) => sum + row.amountCents, 0), result.breakdownCents.buyerTotalOutlayUf);
  assert.ok(result.schedule.every(row => Number.isSafeInteger(row.amountCents) && row.amountCents > 0));
}

test('24 monthly payments cover the balance after an explicit 2% initial', () => {
  const result = calculate();
  reconciles(result);
  assert.equal(result.breakdown.requiredDownPaymentUf, 600);
  assert.equal(result.breakdown.initialPaymentUf, 60);
  assert.equal(result.breakdown.installmentsPrincipalUf, 540);
  assert.equal(result.breakdown.installmentUf, 22.5);
  assert.equal(result.breakdown.lastInstallmentUf, 22.5);
  assert.equal(monthly(result).length, 24);
});

test('an explicit developer bonus reduces buyer pie, without discounting price or financing balance', () => {
  const result = calculate({developerBonus: {percentage: 10}});
  reconciles(result);
  assert.equal(result.breakdown.priceUf, 3000);
  assert.equal(result.breakdown.requiredDownPaymentUf, 600);
  assert.equal(result.breakdown.developerBonusUf, 300);
  assert.equal(result.breakdown.buyerDownPaymentUf, 300);
  assert.equal(result.breakdown.installmentUf, 10);
  assert.equal(result.breakdown.financingBalanceUf, 2400);
});

test('reservation credited to initial is included once in the buyer cash flow', () => {
  const result = calculate({reservationUf: 10, reservationTreatment: 'credited_to_initial'});
  reconciles(result);
  assert.equal(result.breakdown.initialPaymentUf, 60);
  assert.equal(result.breakdown.initialDueAfterReservationUf, 50);
  assert.equal(result.breakdown.reservationCreditedUf, 10);
  assert.equal(result.breakdown.installmentsPrincipalUf, 540);
  assert.equal(result.breakdown.buyerTotalOutlayUf, 600);
  assert.deepEqual(result.schedule.slice(0, 2).map(row => [row.kind, row.amountUf]), [['reservation', 10], ['initial', 50]]);
});

test('reservation separately credited to pie reduces the monthly balance', () => {
  const result = calculate({reservationUf: 12, reservationTreatment: 'credited_to_down_payment'});
  reconciles(result);
  assert.equal(result.breakdown.initialDueAfterReservationUf, 60);
  assert.equal(result.breakdown.installmentsPrincipalUf, 528);
  assert.equal(result.breakdown.installmentUf, 22);
  assert.equal(result.breakdown.buyerTotalOutlayUf, 600);
});

test('additional reservation raises cash outlay and does not pay off pie', () => {
  const result = calculate({reservationUf: 12, reservationTreatment: 'additional'});
  reconciles(result);
  assert.equal(result.breakdown.reservationAdditionalUf, 12);
  assert.equal(result.breakdown.reservationCreditedUf, 0);
  assert.equal(result.breakdown.installmentsPrincipalUf, 540);
  assert.equal(result.breakdown.buyerTotalOutlayUf, 612);
});

test('reservation may equal the entire initial, leaving no extra initial charge', () => {
  const result = calculate({reservationUf: 60, reservationTreatment: 'credited_to_initial'});
  reconciles(result);
  assert.equal(result.breakdown.initialDueAfterReservationUf, 0);
  assert.equal(result.schedule.some(row => row.kind === 'initial'), false);
});

test('reservation above initial cannot be silently treated as an additional pie payment', () => {
  const result = calculate({reservationUf: 60.01, reservationTreatment: 'credited_to_initial'});
  assert.equal(result.ok, false);
  code(result, 'reservation_exceeds_initial');
});

test('positive reservation with unknown treatment blocks even a simulation', () => {
  const result = calculate({reservationUf: 1});
  assert.equal(result.ok, false);
  code(result, 'unknown_reservation_treatment');
  assert.deepEqual(result.schedule, []);
});

test('zero reservation with unknown treatment is arithmetically unambiguous', () => {
  const result = calculate({reservationUf: 0, reservationTreatment: 'unknown'});
  reconciles(result);
  assert.equal(result.breakdown.reservationCreditedUf, 0);
  assert.equal(result.breakdown.reservationAdditionalUf, 0);
});

test('missing financial conditions stay unknown instead of becoming zero', () => {
  for (const field of ['priceUf', 'requiredDownPaymentPercentage', 'developerBonus', 'initialPayment', 'reservationUf', 'balloon', 'installments']) {
    const input = scenario();
    delete input[field];
    const result = calculatePaymentPlan(input);
    assert.equal(result.ok, false, field);
    assert.ok(result.errors.some(error => error.field === field), field);
  }
});

test('bonus cannot exceed required pie', () => {
  const result = calculate({developerBonus: {percentage: 20.01}});
  assert.equal(result.ok, false);
  code(result, 'bonus_exceeds_down_payment');
});

test('initial, separate reservation and balloon cannot overallocate buyer pie', () => {
  const result = calculate({initialPayment: {amountUf: 400}, reservationUf: 101, reservationTreatment: 'credited_to_down_payment', balloon: {amountUf: 100}});
  assert.equal(result.ok, false);
  code(result, 'payments_exceed_buyer_down_payment');
});

test('zero monthly installments require all pie allocated to upfront payment or balloon', () => {
  const invalid = calculate({installments: 0});
  assert.equal(invalid.ok, false);
  code(invalid, 'unallocated_balance');
  const result = calculate({installments: 0, initialPayment: {amountUf: 100}, balloon: {amountUf: 500}});
  reconciles(result);
  assert.equal(monthly(result).length, 0);
  assert.equal(result.breakdown.installmentUf, 0);
  assert.equal(result.schedule.at(-1).month, '2028-12');
});

test('decimal unit price with reservation, initial and balloon reconciles at N=0', () => {
  const common = {
    priceUf: '2500.15', requiredDownPaymentPercentage: 20,
    developerBonus: {amountUf: 0}, reservationUf: '10.00',
    balloon: {amountUf: '450.00'}, installments: 0,
    startMonth: null, deliveryMonth: '2028-06', scenarioMode: 'verified'
  };
  const included = calculate({...common, initialPayment: {amountUf: '50.03'}, reservationTreatment: 'credited_to_initial'});
  reconciles(included);
  assert.equal(included.breakdown.requiredDownPaymentUf, 500.03);
  assert.equal(included.breakdown.initialDueAfterReservationUf, 40.03);
  assert.deepEqual(included.schedule.map(row => [row.kind, row.amountCents, row.month]), [
    ['reservation', 1000, null], ['initial', 4003, null], ['balloon', 45000, '2028-06']
  ]);
  const separate = calculate({...common, initialPayment: {amountUf: '40.03'}, reservationTreatment: 'credited_to_down_payment'});
  reconciles(separate);
  assert.deepEqual(separate.schedule, included.schedule);
  const wrongDate = calculate({...common, initialPayment: {amountUf: '50.03'}, reservationTreatment: 'credited_to_initial', deliveryMonth: '2028-Q2'});
  assert.equal(wrongDate.ok, false);
  code(wrongDate, 'invalid_month');
});

test('a completely covered pie never generates zero-value monthly charges', () => {
  const result = calculate({developerBonus: {percentage: 20}, initialPayment: {amountUf: 0}});
  reconciles(result);
  assert.deepEqual(result.schedule, []);
  assert.equal(result.breakdown.buyerDownPaymentUf, 0);
  assert.equal(result.breakdown.effectiveInstallmentCount, 0);
  assert.ok(result.warnings.some(warning => warning.code === 'no_balance_to_spread'));
});

test('cent rounding closes the last installment instead of losing a fraction of UF', () => {
  const result = calculate({priceUf: 100, requiredDownPaymentPercentage: 100, initialPayment: {amountUf: 0}, installments: 3});
  reconciles(result);
  assert.deepEqual(monthly(result).map(row => row.amountCents), [3333, 3333, 3334]);
  assert.equal(result.breakdown.roundingAdjustmentUf, 0.01);
  assert.ok(result.warnings.some(warning => warning.code === 'rounding_adjustment'));
});

test('a balance smaller than one cent per monthly payment cannot generate zero payments', () => {
  const result = calculate({priceUf: '0.02', requiredDownPaymentPercentage: 100, initialPayment: {amountUf: 0}, installments: 3});
  assert.equal(result.ok, false);
  code(result, 'installment_below_precision');
  const exact = calculate({priceUf: '0.02', requiredDownPaymentPercentage: 100, initialPayment: {amountUf: 0}, installments: 2});
  reconciles(exact);
  assert.deepEqual(monthly(exact).map(row => row.amountCents), [1, 1]);
});

test('the first month counts and an installment in delivery month is allowed', () => {
  const result = calculate({installments: 3, startMonth: '2027-10', deliveryMonth: '2027-12'});
  reconciles(result);
  assert.deepEqual(monthly(result).map(row => row.month), ['2027-10', '2027-11', '2027-12']);
  assert.equal(result.breakdown.lastInstallmentMonth, '2027-12');
});

test('monthly schedule cannot silently continue after delivery', () => {
  const result = calculate({installments: 4, startMonth: '2027-10', deliveryMonth: '2027-12'});
  assert.equal(result.ok, false);
  code(result, 'installments_after_delivery');
  const earlierDelivery = calculate({installments: 1, startMonth: '2028-01', deliveryMonth: '2027-12'});
  assert.equal(earlierDelivery.ok, false);
  code(earlierDelivery, 'installments_after_delivery');
});

test('month arithmetic crosses December without inventing dates or days', () => {
  const result = calculate({installments: 3, startMonth: '2027-12', deliveryMonth: '2028-02', balloon: {percentage: 1}});
  reconciles(result);
  assert.deepEqual(monthly(result).map(row => row.month), ['2027-12', '2028-01', '2028-02']);
  assert.equal(result.schedule.find(row => row.kind === 'balloon').month, '2028-02');
  assert.equal(result.schedule.find(row => row.kind === 'initial').month, null);
  assert.ok(result.schedule.every(row => !Object.hasOwn(row, 'date')));
});

test('verified mode needs an exact delivery month and a monthly start month', () => {
  const noDelivery = calculate({scenarioMode: 'verified', deliveryMonth: null});
  assert.equal(noDelivery.ok, false);
  code(noDelivery, 'required_verified_month');
  const noStart = calculate({scenarioMode: 'verified', startMonth: null});
  assert.equal(noStart.ok, false);
  code(noStart, 'required_verified_month');
  const quarter = calculate({scenarioMode: 'verified', deliveryMonth: '2028-Q4'});
  assert.equal(quarter.ok, false);
  code(quarter, 'invalid_month');
});

test('simulation can be undated but states its missing calendar and assumptions', () => {
  const result = calculate({startMonth: null, deliveryMonth: null, balloon: {amountUf: 100}});
  reconciles(result);
  assert.ok(result.assumptions.length > 0);
  assert.ok(result.warnings.some(warning => warning.code === 'start_month_unknown'));
  assert.ok(result.warnings.some(warning => warning.code === 'delivery_month_unknown'));
  assert.ok(result.schedule.every(row => row.month === null));
});

test('verified classification never claims to authenticate commercial evidence', () => {
  const result = calculate({scenarioMode: 'verified'});
  reconciles(result);
  assert.ok(result.warnings.some(warning => warning.code === 'source_validation_external'));
  assert.deepEqual(result.assumptions, []);
});

test('percentages apply to unit price, with exact decimal half-up rounding', () => {
  const result = calculate({priceUf: 1, requiredDownPaymentPercentage: '0.5', initialPayment: {amountUf: 0}, installments: 1});
  reconciles(result);
  assert.equal(result.breakdown.requiredDownPaymentUf, 0.01);
  assert.equal(result.breakdown.financingBalanceUf, 0.99);
  const balloon = calculate({balloon: {percentage: 1}});
  reconciles(balloon);
  assert.equal(balloon.breakdown.balloonUf, 30);
  assert.equal(balloon.breakdown.installmentsPrincipalUf, 510);
});

test('UF values cannot silently gain or lose precision and percent inputs have bounded precision', () => {
  code(calculate({priceUf: '3000.001'}), 'precision');
  code(calculate({requiredDownPaymentPercentage: '20.00001'}), 'precision');
  const exact = calculate({priceUf: '3000.0000', requiredDownPaymentPercentage: '20.0000'});
  reconciles(exact);
});

test('bad numeric and structural inputs report errors instead of throwing', () => {
  for (const value of [-1, NaN, Infinity, '3,000', '1e3', true, {}, [], '']) {
    const result = calculate({priceUf: value});
    assert.equal(result.ok, false, String(value));
    assert.equal(result.schedule.length, 0);
  }
  for (const input of [null, undefined, [], 'plan']) {
    assert.equal(calculatePaymentPlan(input).ok, false);
  }
  code(calculate({developerBonus: {percentage: 0, amountUf: 0}}), 'ambiguous_amount');
  code(calculate({balloon: {amountUf: 0, paidAt: 'tomorrow'}}), 'unsupported_timing');
});

test('installment count is explicit and bounded without an arbitrary 24-month cap', () => {
  code(calculate({installments: ''}), 'required');
  for (const value of [1.5, -1, 601, Infinity, true]) assert.equal(calculate({installments: value}).ok, false);
  const result = calculate({installments: '60', startMonth: '2027-01', deliveryMonth: '2031-12'});
  reconciles(result);
  assert.equal(monthly(result).length, 60);
  assert.equal(result.breakdown.lastInstallmentMonth, '2031-12');
});

test('safe integer range is guarded before converting hundredths UF to JSON numbers', () => {
  code(calculate({priceUf: '90071992547409.92'}), 'out_of_range');
  const result = calculate({priceUf: '90071992547409.91', requiredDownPaymentPercentage: 100, initialPayment: {amountUf: '90071992547409.91'}, reservationUf: 1, reservationTreatment: 'additional', installments: 0});
  assert.equal(result.ok, false);
  code(result, 'out_of_range');
  assert.doesNotThrow(() => JSON.stringify(calculate()));
});

test('invalid months and a calendar beyond year 9999 are rejected', () => {
  for (const month of ['2027-00', '2027-13', '2027-1', '2027-01-01', 'Q4 2027', '2027-02T00:00:00Z']) {
    code(calculate({deliveryMonth: month}), 'invalid_month');
  }
  code(calculate({installments: 2, startMonth: '9999-12', deliveryMonth: null}), 'calendar_out_of_range');
});

test('inputs are not mutated and repeated calculation gives identical results', () => {
  const input = scenario({developerBonus: {amountUf: '20.03'}, initialPayment: {amountUf: '60.01'}, balloon: {amountUf: '100.09'}});
  const before = structuredClone(input);
  const first = calculatePaymentPlan(input);
  const second = calculatePaymentPlan(input);
  reconciles(first);
  assert.deepEqual(input, before);
  assert.deepEqual(first, second);
});

test('varied cent balances and payment counts always reconcile without negative payments', () => {
  for (const price of ['1234.56', '3300.10', '9999.99', '10.01']) {
    for (const installments of [1, 2, 3, 7, 24, 120]) {
      const result = calculate({priceUf: price, requiredDownPaymentPercentage: '19.975', developerBonus: {percentage: '3.125'}, initialPayment: {percentage: '1.25'}, balloon: {percentage: '1.1'}, installments, startMonth: '2027-01', deliveryMonth: '2036-12'});
      reconciles(result);
      assert.equal(monthly(result).length, installments);
      assert.ok(result.breakdown.lastInstallmentUf >= result.breakdown.installmentUf);
      assert.equal(result.breakdownCents.requiredDownPaymentUf, result.breakdownCents.buyerDownPaymentUf + result.breakdownCents.developerBonusUf);
      assert.equal(result.breakdownCents.priceUf, result.breakdownCents.requiredDownPaymentUf + result.breakdownCents.financingBalanceUf);
    }
  }
});
