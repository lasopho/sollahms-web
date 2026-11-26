/**
 * Pure down-payment arithmetic. Amounts are UF, never pesos.
 * All amounts/percentages (including zero) must be supplied explicitly.
 * A percentage in developerBonus, initialPayment or balloon applies to priceUf.
 * `verified` is a caller classification; this function cannot verify a source,
 * unit availability or commercial eligibility.
 */

const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER);
const PERCENT_SCALE = 10000n;
const PERCENT_DENOMINATOR = 100n * PERCENT_SCALE;
const MODES = new Set(['simulation', 'verified']);
const RESERVATION_TREATMENTS = new Set([
  'credited_to_initial', 'credited_to_down_payment', 'additional', 'unknown'
]);
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isBlank = value => value === undefined || value === null || value === '' ||
  (typeof value === 'string' && value.trim() === '');
const uf = cents => Number(cents) / 100;

/**
 * @param {object} input
 * @returns {{ok:boolean, mode:string|null, errors:Array, warnings:Array,
 * assumptions:Array<string>, schedule:Array, breakdown:object|null}}
 */
export function calculatePaymentPlan(input) {
  const errors = [];
  const warnings = [];
  const assumptions = [];
  const mode = isRecord(input) && MODES.has(input.scenarioMode) ? input.scenarioMode : null;
  const error = (field, code, message) => errors.push({field, code, message});
  const warning = (field, code, message) => warnings.push({field, code, message});
  const failed = () => ({ok: false, mode, errors, warnings, assumptions, schedule: [], breakdown: null});

  if (!isRecord(input)) {
    error('input', 'invalid_input', 'Ingresa los campos del plan de pago.');
    return failed();
  }
  if (!mode) error('scenarioMode', 'required_mode', 'Selecciona simulación o condiciones documentadas.');

  function decimal(value, field, precision, maximum, positive = false) {
    if (isBlank(value)) {
      error(field, 'required', 'Falta un valor explícito; ingresa cero si corresponde.');
      return null;
    }
    if (!['string', 'number'].includes(typeof value) ||
        (typeof value === 'number' && !Number.isFinite(value))) {
      error(field, 'invalid_number', 'Ingresa un número finito no negativo.');
      return null;
    }
    const text = String(value).trim();
    if (text.length > 100 || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
      error(field, 'invalid_number', 'Ingresa un número no negativo, con punto decimal.');
      return null;
    }
    const [whole = '', rawFraction = ''] = text.split('.');
    const fraction = rawFraction.replace(/0+$/, '');
    if (fraction.length > precision) {
      error(field, 'precision', `El valor admite hasta ${precision} decimales.`);
      return null;
    }
    const scale = 10n ** BigInt(precision);
    const amount = BigInt(whole || '0') * scale + BigInt(fraction.padEnd(precision, '0') || '0');
    if (amount > maximum || (positive && amount === 0n)) {
      error(field, 'out_of_range', positive ? 'El valor debe ser mayor que cero y estar dentro del rango de cálculo.' : 'El valor está fuera del rango de cálculo.');
      return null;
    }
    return amount;
  }

  const parseUf = (value, field, positive = false) => decimal(value, field, 2, MAX_CENTS, positive);
  const parsePercentage = (value, field) => decimal(value, field, 4, PERCENT_DENOMINATOR);
  const percentageOf = (price, percentage) => (price * percentage + PERCENT_DENOMINATOR / 2n) / PERCENT_DENOMINATOR;

  function amountSpecification(value, field, price) {
    if (!isRecord(value)) {
      error(field, 'required', 'Indica un porcentaje o un monto UF explícito, incluso si es cero.');
      return null;
    }
    const percentagePresent = has(value, 'percentage');
    const amountPresent = has(value, 'amountUf');
    if (percentagePresent === amountPresent) {
      error(field, 'ambiguous_amount', 'Indica solamente porcentaje o monto UF.');
      return null;
    }
    if (percentagePresent) {
      const percentage = parsePercentage(value.percentage, `${field}.percentage`);
      return percentage === null || price === null ? null : percentageOf(price, percentage);
    }
    return parseUf(value.amountUf, `${field}.amountUf`);
  }

  function parseMonth(value, field) {
    if (isBlank(value)) return null;
    if (typeof value !== 'string' || !/^[1-9]\d{3}-(?:0[1-9]|1[0-2])$/.test(value)) {
      error(field, 'invalid_month', 'Indica un mes exacto con formato AAAA-MM.');
      return null;
    }
    return {label: value, index: Number(value.slice(0, 4)) * 12 + Number(value.slice(5)) - 1};
  }
  const monthLabel = index => `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`;

  const price = parseUf(input.priceUf, 'priceUf', true);
  const requiredPercentage = parsePercentage(input.requiredDownPaymentPercentage, 'requiredDownPaymentPercentage');
  const bonus = amountSpecification(input.developerBonus, 'developerBonus', price);
  const initial = amountSpecification(input.initialPayment, 'initialPayment', price);
  const balloon = amountSpecification(input.balloon, 'balloon', price);
  const reservation = parseUf(input.reservationUf, 'reservationUf');
  const treatment = input.reservationTreatment;
  if (!RESERVATION_TREATMENTS.has(treatment)) {
    error('reservationTreatment', 'required_treatment', 'Indica cómo se imputa la reserva, o marca desconocido.');
  }
  if (isRecord(input.balloon) && has(input.balloon, 'paidAt') && input.balloon.paidAt !== 'delivery') {
    error('balloon.paidAt', 'unsupported_timing', 'Este plan admite el cuotón al mes de entrega.');
  }

  let count = null;
  if (isBlank(input.installments)) {
    error('installments', 'required', 'Indica cuántas cuotas mensuales tendrá el plan, incluso si son cero.');
  } else if ((typeof input.installments === 'number' && Number.isInteger(input.installments)) ||
             (typeof input.installments === 'string' && /^\d+$/.test(input.installments.trim()))) {
    count = Number(input.installments);
    if (!Number.isSafeInteger(count) || count < 0 || count > 600) {
      error('installments', 'out_of_range', 'La cantidad de cuotas debe ser un entero entre 0 y 600.');
    }
  } else {
    error('installments', 'invalid_integer', 'La cantidad de cuotas debe ser un entero entre 0 y 600.');
  }
  const start = parseMonth(input.startMonth, 'startMonth');
  const delivery = parseMonth(input.deliveryMonth, 'deliveryMonth');
  if (mode === 'verified' && !delivery && isBlank(input.deliveryMonth)) {
    error('deliveryMonth', 'required_verified_month', 'Para un calendario documentado falta el mes exacto de entrega.');
  }
  if (errors.length) return failed();

  const required = percentageOf(price, requiredPercentage);
  if (bonus > required) {
    error('developerBonus', 'bonus_exceeds_down_payment', 'El bono supera el pie requerido; revisa la unidad y las condiciones aplicables.');
  }
  if (reservation > 0n && treatment === 'unknown') {
    error('reservationTreatment', 'unknown_reservation_treatment', 'Falta definir si la reserva se imputa al inicial, al pie o es adicional.');
  }
  if (treatment === 'credited_to_initial' && reservation > initial) {
    error('reservationUf', 'reservation_exceeds_initial', 'La reserva imputada al inicial supera ese pago inicial.');
  }
  if (errors.length) return failed();

  const buyerDownPayment = required - bonus;
  const reservationCredited = treatment === 'additional' ? 0n : reservation;
  const reservationAdditional = treatment === 'additional' ? reservation : 0n;
  const initialDue = treatment === 'credited_to_initial' ? initial - reservation : initial;
  const installmentPrincipal = buyerDownPayment - initial - balloon -
    (treatment === 'credited_to_down_payment' ? reservation : 0n);
  if (installmentPrincipal < 0n) {
    error('initialPayment', 'payments_exceed_buyer_down_payment', 'El inicial, la reserva imputada y el cuotón superan el pie que paga el comprador.');
  } else if (installmentPrincipal > 0n && count === 0) {
    error('installments', 'unallocated_balance', 'Queda saldo del pie: indica cuotas o ajusta el inicial y el cuotón.');
  } else if (installmentPrincipal > 0n && installmentPrincipal < BigInt(count)) {
    error('installments', 'installment_below_precision', 'La cantidad de cuotas produciría pagos menores que 0,01 UF; reduce las cuotas.');
  }
  const hasMonthlyPayments = installmentPrincipal > 0n && count > 0;
  if (mode === 'verified' && hasMonthlyPayments && !start && isBlank(input.startMonth)) {
    error('startMonth', 'required_verified_month', 'Falta el mes exacto de inicio para el calendario documentado.');
  }
  if (hasMonthlyPayments && start) {
    const lastIndex = start.index + count - 1;
    if (lastIndex > 9999 * 12 + 11) {
      error('startMonth', 'calendar_out_of_range', 'El calendario supera el rango de años admitido.');
    } else if (delivery && lastIndex > delivery.index) {
      error('installments', 'installments_after_delivery', 'La última cuota queda después del mes de entrega; revisa inicio y cantidad de cuotas.');
    }
  }
  const buyerTotal = buyerDownPayment + reservationAdditional;
  if (buyerTotal > MAX_CENTS) error('reservationUf', 'out_of_range', 'El desembolso total supera el rango de cálculo.');
  if (errors.length) return failed();

  if (mode === 'simulation') {
    assumptions.push('Los valores ingresados forman un escenario de simulación; no acreditan condiciones comerciales de una unidad.');
    if (!delivery) warning('deliveryMonth', 'delivery_month_unknown', 'Sin mes exacto de entrega no se puede comprobar el plazo de pago.');
    if (hasMonthlyPayments && !start) warning('startMonth', 'start_month_unknown', 'Las cuotas no tienen meses asignados porque falta el mes de inicio.');
  } else {
    warning('scenarioMode', 'source_validation_external', 'El cálculo concilia montos; la fuente explícita y su aplicación a esta unidad deben validarse en el panel.');
  }
  if (installmentPrincipal === 0n && count > 0) {
    warning('installments', 'no_balance_to_spread', 'No queda saldo para cuotas mensuales; el calendario omite pagos de monto cero.');
  }

  const regular = hasMonthlyPayments ? installmentPrincipal / BigInt(count) : 0n;
  const last = hasMonthlyPayments ? installmentPrincipal - regular * BigInt(count - 1) : 0n;
  if (last !== regular) warning('installments', 'rounding_adjustment', 'La última cuota incorpora el ajuste de centésimas UF para cerrar el total exacto.');
  const schedule = [];
  const add = (kind, cents, month, details = {}) => {
    if (cents > 0n) schedule.push({kind, ...details, month, amountUf: uf(cents), amountCents: Number(cents)});
  };
  add('reservation', reservation, null, {timing: 'reservation'});
  add('initial', initialDue, null, {timing: 'initial'});
  if (hasMonthlyPayments) {
    for (let index = 0; index < count; index++) {
      add('installment', index === count - 1 ? last : regular,
        start ? monthLabel(start.index + index) : null, {number: index + 1, timing: 'monthly'});
    }
  }
  add('balloon', balloon, delivery?.label ?? null, {timing: 'delivery'});

  const cents = {
    priceUf: price, requiredDownPaymentUf: required, developerBonusUf: bonus,
    buyerDownPaymentUf: buyerDownPayment, reservationUf: reservation,
    reservationCreditedUf: reservationCredited, reservationAdditionalUf: reservationAdditional,
    initialPaymentUf: initial, initialDueAfterReservationUf: initialDue,
    balloonUf: balloon, installmentsPrincipalUf: installmentPrincipal,
    installmentUf: regular, lastInstallmentUf: last,
    roundingAdjustmentUf: last - regular, buyerTotalOutlayUf: buyerTotal,
    financingBalanceUf: price - required
  };
  const scheduleTotal = schedule.reduce((sum, row) => sum + BigInt(row.amountCents), 0n);
  if (scheduleTotal !== buyerTotal) {
    error('input', 'reconciliation_failed', 'El calendario no concilia con el total del comprador.');
    return failed();
  }
  return {
    ok: true, mode, errors, warnings, assumptions, schedule,
    breakdown: {
      ...Object.fromEntries(Object.entries(cents).map(([key, value]) => [key, uf(value)])),
      installmentCount: count,
      effectiveInstallmentCount: hasMonthlyPayments ? count : 0,
      firstInstallmentMonth: hasMonthlyPayments ? start?.label ?? null : null,
      lastInstallmentMonth: hasMonthlyPayments && start ? monthLabel(start.index + count - 1) : null,
      deliveryMonth: delivery?.label ?? null,
      reconciled: true
    },
    // Same named components, measured in integer hundredths of UF.
    breakdownCents: Object.fromEntries(Object.entries(cents).map(([key, value]) => [key, Number(value)]))
  };
}

/**
 * Estimated fixed monthly mortgage payment, principal and interest only.
 * The caller supplies the remaining price to finance, not the buyer's pie.
 * All inputs, including the annual-rate convention, must be explicit numbers.
 * This does not include insurance, fees, taxes, CAE/CTC or a credit decision.
 */
export function calculateMortgageEstimate(input) {
  const errors = [];
  const error = (field, code, message) => errors.push({field, code, message});
  const failed = () => ({ok: false, errors, monthlyPaymentUf: null, monthlyPaymentUnroundedUf: null,
    interestAndPrincipalOnly: true});
  if (!isRecord(input)) {
    error('input', 'invalid_input', 'Ingresa capital, tasa anual, plazo y convención de la tasa.');
    return failed();
  }
  function decimal(value, field, precision, maximum) {
    if (isBlank(value)) {
      error(field, 'required', 'Falta un valor explícito; ingresa cero si corresponde.');
      return null;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      error(field, 'invalid_number', 'Ingresa un número finito.');
      return null;
    }
    if (value < 0 || value > maximum) {
      error(field, 'out_of_range', `El valor debe estar entre 0 y ${maximum}.`);
      return null;
    }
    const text = String(value);
    const fraction = (text.split('.')[1] ?? '').replace(/0+$/, '');
    if (!/^\d+(?:\.\d+)?$/.test(text) || fraction.length > precision) {
      error(field, 'precision', `El valor admite hasta ${precision} decimales.`);
      return null;
    }
    return value;
  }
  const principal = decimal(input.principalUf, 'principalUf', 2, 1_000_000);
  const annual = decimal(input.annualRatePercentage, 'annualRatePercentage', 6, 100);
  let years = null;
  if (isBlank(input.termYears)) {
    error('termYears', 'required', 'Indica el plazo del crédito en años.');
  } else if (typeof input.termYears !== 'number' || !Number.isInteger(input.termYears)) {
    error('termYears', 'invalid_integer', 'El plazo debe ser un número entero de años.');
  } else if (input.termYears < 1 || input.termYears > 40) {
    error('termYears', 'out_of_range', 'El plazo debe estar entre 1 y 40 años.');
  } else years = input.termYears;
  const convention = input.rateConvention;
  if (convention !== 'nominal' && convention !== 'effective') {
    error('rateConvention', 'required_convention', 'Indica si la tasa anual es nominal o efectiva.');
  }
  if (errors.length) return failed();

  const months = years * 12;
  const annualFraction = annual / 100;
  const monthlyRate = convention === 'nominal'
    ? annualFraction / 12
    : Math.expm1(Math.log1p(annualFraction) / 12);
  // Stable near a zero rate; no positive-power overflow for long terms.
  const unrounded = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate));
  let payment;
  if (monthlyRate === 0) {
    // At zero interest the cent input is an exact rational division. This
    // preserves half-up rounding for e.g. 1.26 UF / 12 = 0.105 UF.
    const [whole, fraction = ''] = String(principal).split('.');
    const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
    payment = Number((cents + BigInt(months / 2)) / BigInt(months)) / 100;
  } else payment = Math.round((unrounded + Number.EPSILON * unrounded) * 100) / 100;
  if (!Number.isFinite(unrounded) || !Number.isFinite(payment) || payment < 0) {
    error('input', 'calculation_out_of_range', 'El escenario supera el rango del cálculo.');
    return failed();
  }
  return {ok: true, errors, principalUf: principal, annualRatePercentage: annual, termYears: years,
    months, rateConvention: convention, monthlyRate, monthlyPaymentUf: payment,
    monthlyPaymentUnroundedUf: unrounded, interestAndPrincipalOnly: true,
    fixedRate: true, paymentTiming: 'end_of_month', rounding: '0.01 UF'};
}
