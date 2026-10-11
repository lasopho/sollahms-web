/**
 * Fixed-rate, fully amortizing mortgage mathematics. All amounts remain in UF;
 * insurance, fees and the future UF/CLP exchange value are separate from debt.
 */
export const MORTGAGE_LIMITS = Object.freeze({
  propertyUf: Object.freeze({ min: 100, max: 1_000_000 }),
  downPaymentPercent: Object.freeze({ min: 5, max: 90 }),
  years: Object.freeze({ min: 5, max: 40 }),
  annualRatePercent: Object.freeze({ min: 0, max: 25 }),
});

export class MortgageValidationError extends RangeError {
  constructor(field, message) {
    super(message);
    this.name = 'MortgageValidationError';
    this.field = field;
  }
}

function numberInRange(value, field, { min, max }, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value)
      || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new MortgageValidationError(field, `${field} debe ser ${integer ? 'un entero' : 'un número finito'} entre ${min} y ${max}.`);
  }
}

/**
 * A nominal annual rate convertible monthly uses annual / 12. An effective
 * annual rate uses (1 + annual)^(1/12) - 1. The convention must follow the source:
 * the verified CMF simulator scenario matches effective annual conversion.
 */
export function annualToMonthlyRate(ratePercent, convention = 'nominal') {
  numberInRange(ratePercent, 'annualRatePercent', MORTGAGE_LIMITS.annualRatePercent);
  if (convention !== 'nominal' && convention !== 'effective') {
    throw new MortgageValidationError('rateConvention', 'La convención debe ser nominal o effective.');
  }
  const annualRate = ratePercent / 100;
  return convention === 'nominal'
    ? annualRate / 12
    : Math.expm1(Math.log1p(annualRate) / 12);
}

export function calculateMortgage({ propertyUf, downPaymentPercent, years, annualRatePercent, rateConvention = 'nominal' } = {}) {
  numberInRange(propertyUf, 'propertyUf', MORTGAGE_LIMITS.propertyUf);
  numberInRange(downPaymentPercent, 'downPaymentPercent', MORTGAGE_LIMITS.downPaymentPercent);
  numberInRange(years, 'years', MORTGAGE_LIMITS.years, true);
  const monthlyRate = annualToMonthlyRate(annualRatePercent, rateConvention);
  const downPaymentUf = propertyUf * downPaymentPercent / 100;
  const principalUf = propertyUf - downPaymentUf;
  const months = years * 12;
  // expm1/log1p avoid cancellation for very small interest rates.
  const monthlyPaymentUf = monthlyRate === 0
    ? principalUf / months
    : principalUf * monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate));
  const totalPaymentsUf = monthlyRate === 0 ? principalUf : monthlyPaymentUf * months;
  return {
    propertyUf,
    downPaymentPercent,
    downPaymentUf,
    principalUf,
    financingPercent: 100 - downPaymentPercent,
    years,
    months,
    annualRatePercent,
    rateConvention,
    monthlyRate,
    monthlyPaymentUf,
    totalPaymentsUf,
    totalInterestUf: Math.max(0, totalPaymentsUf - principalUf),
  };
}

/** A dated conversion, not a prediction of future peso payments. */
export function ufToClp(amountUf, ufValueClp) {
  if (typeof amountUf !== 'number' || !Number.isFinite(amountUf) || amountUf < 0) {
    throw new MortgageValidationError('amountUf', 'El monto en UF debe ser finito y no negativo.');
  }
  if (typeof ufValueClp !== 'number' || !Number.isFinite(ufValueClp) || ufValueClp <= 0) {
    throw new MortgageValidationError('ufValueClp', 'El valor de la UF debe ser finito y positivo.');
  }
  return amountUf * ufValueClp;
}

export const currencyToClp = ufToClp;
