import { calculateMortgage, MORTGAGE_LIMITS, ufToClp } from './mortgage-engine.mjs';
import { getUfStatus } from './mortgage-data.mjs';
import { verifiedProjectPrice, normalizeVerifiedPaymentTerms } from './project-finance.mjs';

/** Exploration assumptions; none of these are universal bank approval rules. */
export const CAPACITY_LIMITS = Object.freeze({
  incomeClp: Object.freeze({ min: 1, max: 10_000_000_000 }),
  debtClp: Object.freeze({ min: 0, max: 10_000_000_000 }),
  savingsClp: Object.freeze({ min: 0, max: 1_000_000_000_000 }),
  savingsUf: Object.freeze({ min: 0, max: 1_000_000 }),
  monthlySavingsClp: Object.freeze({ min: 0, max: 10_000_000_000 }),
  horizonMonths: Object.freeze({ min: 0, max: 600 }),
});

export class CapacityValidationError extends RangeError {
  constructor(field, message) {
    super(message);
    this.name = 'CapacityValidationError';
    this.field = field;
  }
}

function checkedNumber(value, field, label, limits, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value)
      || value < limits.min || value > limits.max || (integer && !Number.isInteger(value))) {
    throw new CapacityValidationError(field, `${label}: ingresa ${integer ? 'un número entero' : 'un monto numérico'} entre ${limits.min} y ${limits.max}.`);
  }
  return value;
}

/** Returns normalized numeric inputs; no personal identity or persistence is needed. */
export function validateCapacityInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new CapacityValidationError('input', 'Completa los parámetros de la búsqueda financiera.');
  }
  if (typeof input.complementIncome !== 'boolean') {
    throw new CapacityValidationError('complementIncome', 'Selecciona si deseas complementar renta.');
  }
  if (!['CLP', 'UF'].includes(input.savingsCurrency)) {
    throw new CapacityValidationError('savingsCurrency', 'Selecciona ahorro en pesos chilenos o UF.');
  }
  if (!['nominal', 'effective'].includes(input.rateConvention)) {
    throw new CapacityValidationError('rateConvention', 'Selecciona la convención nominal o efectiva de la tasa anual.');
  }
  if (![25, 30].includes(input.burdenPercent)) {
    throw new CapacityValidationError('burdenPercent', 'Selecciona el criterio referencial de 25% o 30%.');
  }
  const secondIncomeClp = input.secondIncomeClp ?? 0;
  checkedNumber(secondIncomeClp, 'secondIncomeClp', 'Renta de la segunda persona', {
    min: input.complementIncome ? 1 : 0, max: CAPACITY_LIMITS.incomeClp.max,
  });
  const annualRatePercent = input.annualRatePercent ?? null;
  if (annualRatePercent !== null) checkedNumber(annualRatePercent, 'annualRatePercent', 'Tasa anual', MORTGAGE_LIMITS.annualRatePercent);
  return {
    incomeClp: checkedNumber(input.incomeClp, 'incomeClp', 'Renta líquida individual', CAPACITY_LIMITS.incomeClp),
    complementIncome: input.complementIncome,
    secondIncomeClp: input.complementIncome ? secondIncomeClp : 0,
    debtClp: checkedNumber(input.debtClp ?? 0, 'debtClp', 'Cuotas de deudas mensuales', CAPACITY_LIMITS.debtClp),
    savings: checkedNumber(input.savings ?? 0, 'savings', 'Ahorro disponible', input.savingsCurrency === 'UF' ? CAPACITY_LIMITS.savingsUf : CAPACITY_LIMITS.savingsClp),
    savingsCurrency: input.savingsCurrency,
    monthlySavingsClp: checkedNumber(input.monthlySavingsClp ?? 0, 'monthlySavingsClp', 'Ahorro mensual', CAPACITY_LIMITS.monthlySavingsClp),
    horizonMonths: checkedNumber(input.horizonMonths ?? 0, 'horizonMonths', 'Horizonte de compra en meses', CAPACITY_LIMITS.horizonMonths, true),
    downPaymentPercent: checkedNumber(input.downPaymentPercent, 'downPaymentPercent', 'Porcentaje de pie', MORTGAGE_LIMITS.downPaymentPercent),
    years: checkedNumber(input.years, 'years', 'Plazo hipotecario en años', MORTGAGE_LIMITS.years, true),
    annualRatePercent,
    rateConvention: input.rateConvention,
    burdenPercent: input.burdenPercent,
  };
}

/**
 * One mortgage engine, two explicit constraints: savings at the chosen horizon
 * and a monthly exploration budget (income × criterion − existing debt quotas).
 * Project categories describe this scenario only; they are not approval scores.
 */
export function evaluateProject(project, rawInput, dataset, now = new Date()) {
  const input = validateCapacityInput(rawInput);
  const price = verifiedProjectPrice(project, now);
  const ufStatus = getUfStatus(dataset?.uf, now);
  const totalIncomeClp = input.incomeClp + input.secondIncomeClp;
  const monthlyBudgetClp = Math.max(0, totalIncomeClp * input.burdenPercent / 100 - input.debtClp);
  const result = {
    category: 'E', reason: '', price, mortgage: null,
    totalIncomeClp, monthlyBudgetClp,
    monthlyPaymentClp: null, downPaymentClp: null,
    currentSavingsUf: input.savingsCurrency === 'UF' ? input.savings : null,
    availableSavingsUf: input.savingsCurrency === 'UF' ? input.savings : null,
    horizonSavingsUf: null, gapUf: null, currentGapUf: null,
    monthsToSave: null, ratio: null, dividendIncomeRatio: null,
    burdenRatio: null, totalBurdenRatio: null,
    paymentCompatible: null, savingsCompatible: null,
    monthlyInsuranceUf: null, monthlyOtherCostsUf: null, oneTimeFeesUf: null,
    paymentTerms: normalizeVerifiedPaymentTerms(project?.paymentTerms, now),
    ufStatus, assumptions: {
      burdenPercent: input.burdenPercent,
      budgetMethod: 'income-times-criterion-minus-debt',
      horizonMonths: input.horizonMonths,
      savingsGrowthMethod: 'constant-dated-uf-no-yield',
      complementedIncome: input.complementIncome,
      complementWarning: input.complementIncome ? 'Complementar renta depende de los requisitos y evaluación de cada institución.' : null,
      insuranceAndFeesIncluded: false,
      bankApproval: false,
    },
  };
  if (!price) {
    result.reason = 'No hay un precio desde con fuente verificada y revisión vigente para este proyecto.';
    return result;
  }
  if (input.annualRatePercent === null) {
    result.reason = 'Ingresa una tasa anual y su convención para evaluar este escenario; no se presume una tasa bancaria.';
    return result;
  }
  try {
    result.mortgage = calculateMortgage({
      propertyUf: price.valueUf, downPaymentPercent: input.downPaymentPercent,
      years: input.years, annualRatePercent: input.annualRatePercent,
      rateConvention: input.rateConvention,
    });
  } catch {
    result.reason = 'El precio verificado queda fuera del rango admitido por el motor hipotecario.';
    return result;
  }
  if (!ufStatus.usable) {
    result.reason = `${ufStatus.message} No se puede comparar el dividendo con renta en pesos ni proyectar el ahorro con una conversión vigente.`;
    return result;
  }
  const ufValueClp = ufStatus.valueClp;
  const mortgage = result.mortgage;
  result.monthlyPaymentClp = ufToClp(mortgage.monthlyPaymentUf, ufValueClp);
  result.downPaymentClp = ufToClp(mortgage.downPaymentUf, ufValueClp);
  result.currentSavingsUf = input.savingsCurrency === 'UF' ? input.savings : input.savings / ufValueClp;
  result.availableSavingsUf = result.currentSavingsUf;
  result.horizonSavingsUf = result.currentSavingsUf + input.monthlySavingsClp * input.horizonMonths / ufValueClp;
  result.currentGapUf = Math.max(0, mortgage.downPaymentUf - result.currentSavingsUf);
  result.gapUf = Math.max(0, mortgage.downPaymentUf - result.horizonSavingsUf);
  result.monthsToSave = result.currentGapUf === 0 ? 0
    : input.monthlySavingsClp === 0 ? null
      : Math.ceil(ufToClp(result.currentGapUf, ufValueClp) / input.monthlySavingsClp);
  result.ratio = result.dividendIncomeRatio = result.monthlyPaymentClp / totalIncomeClp;
  result.burdenRatio = result.totalBurdenRatio = (result.monthlyPaymentClp + input.debtClp) / totalIncomeClp;
  result.paymentCompatible = result.monthlyPaymentClp <= monthlyBudgetClp;
  result.savingsCompatible = result.horizonSavingsUf >= mortgage.downPaymentUf;
  if (result.paymentCompatible && result.savingsCompatible) {
    result.category = 'A';
    result.reason = 'El pie al horizonte y el dividendo financiero cumplen los parámetros seleccionados; seguros, gastos y evaluación bancaria están pendientes.';
  } else if (result.paymentCompatible) {
    result.category = 'B';
    result.reason = 'El dividendo financiero cumple el presupuesto mensual referencial, pero falta ahorro para el pie al horizonte seleccionado.';
  } else if (result.savingsCompatible) {
    result.category = 'C';
    result.reason = 'El pie al horizonte está cubierto, pero el dividendo financiero supera el presupuesto mensual; explora renta complementada u otros parámetros.';
  } else {
    result.category = 'D';
    result.reason = 'En el escenario seleccionado faltan ahorro para el pie y presupuesto mensual para el dividendo financiero.';
  }
  return result;
}
