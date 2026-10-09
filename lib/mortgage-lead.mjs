import { calculateMortgage, ufToClp } from '../assets/js/mortgage-engine.mjs';
import { compareOffers, getUfStatus, validateDataset } from '../assets/js/mortgage-data.mjs';

const DAY_MS = 86_400_000;
const MORTGAGE_KEYS = ['propertyUf', 'downPaymentPercent', 'years', 'annualRatePercent', 'rateConvention', 'bankId', 'simulatedAt', 'location'];
const UF_FORMAT = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PESO_FORMAT = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export function validFormTiming(startedAt, now = Date.now()) {
  return Number.isSafeInteger(startedAt) && now - startedAt >= 2_000 && now - startedAt <= DAY_MS;
}

function validSimulationTime(value, now) {
  if (typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(value)) return false;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== day) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= now && now - timestamp <= DAY_MS;
}

/** Rebuild the lead from numerical inputs and the checked-in, source-backed dataset. */
export function validateMortgageLead(body, dataset, now = Date.now()) {
  if (body.consent !== true || !validFormTiming(body.startedAt, now)) return { error: 'Acepta el consentimiento y revisa los datos del formulario.' };
  const mortgage = body.mortgage;
  if (!mortgage || typeof mortgage !== 'object' || Array.isArray(mortgage) || Object.keys(mortgage).length !== MORTGAGE_KEYS.length || MORTGAGE_KEYS.some(key => !Object.hasOwn(mortgage, key))) return { error: 'Revisa los datos de la simulación.' };
  if (['propertyUf', 'downPaymentPercent', 'years', 'annualRatePercent'].some(key => typeof mortgage[key] !== 'number' || !Number.isFinite(mortgage[key]))) return { error: 'Revisa los datos de la simulación.' };
  if (!['nominal', 'effective'].includes(mortgage.rateConvention) || !['santiago-metropolitana', 'other', 'unknown'].includes(mortgage.location) || !(mortgage.bankId === null || (typeof mortgage.bankId === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(mortgage.bankId))) || !validSimulationTime(mortgage.simulatedAt, now)) return { error: 'Revisa los datos de la simulación.' };
  if (!validateDataset(dataset).valid) return { unavailable: true, error: 'El comparador no está disponible. Inténtalo más tarde.' };

  let simulation;
  try {
    simulation = calculateMortgage(mortgage);
  } catch {
    return { error: 'Revisa los datos de la simulación.' };
  }

  let selected = null;
  if (mortgage.bankId !== null) {
    selected = compareOffers(mortgage, dataset.offers, new Date(now)).find(result => result.offer.id === mortgage.bankId);
    if (!selected || selected.offer.rateConvention !== mortgage.rateConvention || selected.offer.annualRatePercent !== mortgage.annualRatePercent) return { error: 'La oferta seleccionada ya no coincide con una oferta vigente. Actualiza la simulación.' };
    simulation = selected.simulation;
  }

  const institution = selected ? dataset.institutions.find(item => item.id === selected.offer.institutionId) : null;
  return {
    lead: {
      simulation,
      selected,
      institution,
      uf: getUfStatus(dataset.uf, new Date(now)),
      simulatedAt: mortgage.simulatedAt,
      receivedAt: new Date(now).toISOString(),
      consent: true,
      location: mortgage.location,
    },
  };
}

export function mortgageSummaryLines(lead) {
  const { simulation: s, selected, institution, uf } = lead;
  const money = (value, convert = true) => `${UF_FORMAT.format(value)} UF${uf.usable && convert ? ` (aprox. ${PESO_FORMAT.format(ufToClp(value, uf.valueClp))} a UF del ${uf.date})` : ''}`;
  const lines = [
    'Simulación hipotecaria referencial, recalculada en el servidor',
    `Valor de la propiedad: ${money(s.propertyUf)}`,
    `Pie: ${money(s.downPaymentUf)}`,
    `Monto del crédito: ${money(s.principalUf)}`,
    `Financiamiento: ${UF_FORMAT.format(s.financingPercent)}%`,
    `Plazo: ${s.years} años (${s.months} meses)`,
    `Ubicación: ${lead.location === 'santiago-metropolitana' ? 'Santiago, Región Metropolitana' : lead.location === 'other' ? 'Otra comuna o región' : 'Sin confirmar'}`,
    `Tasa anual: ${UF_FORMAT.format(s.annualRatePercent)}% ${s.rateConvention === 'effective' ? 'efectiva' : 'nominal'}`,
    `Dividendo base mensual: ${money(s.monthlyPaymentUf)}`,
    `Suma de cuotas base: ${money(s.totalPaymentsUf, false)}`,
    `Intereses base: ${money(s.totalInterestUf, false)}`,
    'Las sumas futuras se expresan en UF; su equivalente en pesos depende de la UF de cada fecha de pago.',
  ];
  if (selected) {
    lines.push(`Oferta: ${institution?.name || selected.offer.institutionId} — ${selected.offer.label}`);
    lines.push(`Fuente de la oferta: ${selected.offer.source.title} — ${selected.offer.source.url}`);
    lines.push(`Oferta publicada: ${selected.offer.source.updatedAt}; verificada: ${selected.offer.source.verifiedAt}; vigencia: ${selected.offer.validFrom} a ${selected.offer.validUntil}`);
    if (selected.monthlyInsuranceUf !== null) lines.push(`Seguros mensuales publicados: ${money(selected.monthlyInsuranceUf)}`);
    if (selected.monthlyOtherCostsUf !== null) lines.push(`Otros cargos mensuales publicados: ${money(selected.monthlyOtherCostsUf)}`);
    if (selected.monthlyTotalUf !== null) lines.push(`Cuota mensual con costos publicados: ${money(selected.monthlyTotalUf)}`);
    if (selected.oneTimeFeesUf !== null) lines.push(`Gastos operacionales publicados: ${money(selected.oneTimeFeesUf)}`);
    if (selected.insuranceCoverage) lines.push(`Cobertura de seguros del escenario: ${selected.insuranceCoverage === 'life-fire-earthquake' ? 'desgravamen, incendio y sismo' : selected.insuranceCoverage === 'life-fire' ? 'desgravamen e incendio' : 'sin detalle confirmado'}.`);
    if (selected.costCoverage) lines.push(`Cobertura de gastos del escenario: ${selected.costCoverage === 'cmf-standard-excludes-tax-registry' ? 'la CMF excluye impuestos y aranceles del Conservador de Bienes Raíces' : 'todos los gastos publicados y verificados'}.`);
    if (selected.caeComparable) lines.push(`CAE del escenario publicado: ${UF_FORMAT.format(selected.caePercent)}%`);
    if (selected.totalCostComparable) lines.push(`Costo total del escenario publicado: ${money(selected.totalCostUf, false)}`);
  } else {
    lines.push('Oferta bancaria: sin oferta seleccionada; tasa ingresada para una simulación manual.');
  }
  lines.push('El dividendo base excluye seguros, gastos operacionales y otros cargos no publicados; no constituye aprobación ni cotización bancaria.');
  if (uf.usable) {
    lines.push(`UF de referencia: $${UF_FORMAT.format(uf.valueClp)}; fecha: ${uf.date}; fuente: ${uf.sourceUrl}. Los pesos son aproximados y varían con la UF.`);
  } else {
    lines.push(`Conversión a pesos no disponible: ${uf.message}`);
  }
  lines.push(`Simulación realizada: ${lead.simulatedAt}`);
  lines.push(`Solicitud recibida: ${lead.receivedAt}`);
  lines.push('Consentimiento: la persona autorizó a Sollahms a contactarla y tratar sus datos para gestionar esta solicitud conforme a la política de privacidad.');
  return lines;
}
