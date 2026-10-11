import { calculateMortgage } from './mortgage-engine.mjs';

export const OFFER_MAX_AGE_DAYS = 7;
export const SOURCE_MAX_AGE_DAYS = 30;
const DAY_MS = 86_400_000;
const INPUT_LOCATIONS = new Set(['santiago-metropolitana', 'other', 'unknown']);
const OFFER_LOCATIONS = new Set(['santiago-metropolitana', 'any']);
const OFFER_KEYS = ['id', 'institutionId', 'label', 'interestType', 'currency', 'annualRatePercent', 'rateConvention', 'availableYears', 'minPrincipalUf', 'maxPrincipalUf', 'minFinancingPercent', 'maxFinancingPercent', 'location', 'requirements', 'validFrom', 'validUntil', 'source', 'scenarioCosts'];
const COST_KEYS = ['propertyUf', 'downPaymentPercent', 'years', 'location', 'monthlyInsuranceUf', 'monthlyOtherCostsUf', 'oneTimeFeesUf', 'caePercent', 'totalCostUf', 'complete', 'coverage', 'insuranceCoverage'];

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function objectKeys(value, keys, path, errors, optionalKeys = []) {
  if (!plainObject(value)) {
    errors.push(`${path}: debe ser un objeto.`);
    return false;
  }
  for (const key of keys) if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: requerido.`);
  for (const key of Object.keys(value)) if (!keys.includes(key) && !optionalKeys.includes(key)) errors.push(`${path}.${key}: campo desconocido.`);
  return true;
}

function finite(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function nonempty(value, max = 400) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function id(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
}

function dateEpoch(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const epoch = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(epoch) && new Date(epoch).toISOString().slice(0, 10) === value ? epoch : NaN;
}

function today(now = new Date()) {
  if (typeof now === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(now)) return Number.isFinite(dateEpoch(now)) ? now : null;
  const instant = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function sourceHost(source) {
  try {
    const url = new URL(source?.url);
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') ? url.hostname.toLowerCase() : null;
  } catch { return null; }
}

function isDomain(host, domain) {
  return typeof host === 'string' && (host === domain || host.endsWith(`.${domain}`));
}

function validateSource(source, path, errors, withKind = false) {
  const keys = withKind ? ['url', 'title', 'updatedAt', 'verifiedAt', 'kind'] : ['url', 'title', 'verifiedAt'];
  if (!objectKeys(source, keys, path, errors)) return;
  if (!sourceHost(source)) errors.push(`${path}.url: requiere una URL HTTPS sin credenciales.`);
  if (!nonempty(source.title)) errors.push(`${path}.title: requerido.`);
  if (!Number.isFinite(dateEpoch(source.verifiedAt))) errors.push(`${path}.verifiedAt: fecha inválida.`);
  if (withKind && !Number.isFinite(dateEpoch(source.updatedAt))) errors.push(`${path}.updatedAt: fecha de publicación inválida.`);
  if (withKind && dateEpoch(source.updatedAt) > dateEpoch(source.verifiedAt)) errors.push(`${path}.updatedAt: publicación posterior a la verificación.`);
  if (withKind && !['official-terms', 'official-scenario'].includes(source.kind)) errors.push(`${path}.kind: sólo condiciones oficiales o escenario oficial.`);
}

function validateUf(uf, path, errors) {
  if (!objectKeys(uf, ['date', 'valueClp', 'source'], path, errors)) return;
  if (!Number.isFinite(dateEpoch(uf.date))) errors.push(`${path}.date: fecha inválida.`);
  if (!finite(uf.valueClp, 1, 1_000_000)) errors.push(`${path}.valueClp: valor inválido.`);
  validateSource(uf.source, `${path}.source`, errors);
  if (!isDomain(sourceHost(uf.source), 'sii.cl') && !isDomain(sourceHost(uf.source), 'cmfchile.cl')) errors.push(`${path}.source: UF requiere fuente oficial SII o CMF.`);
}

function close(a, b) { return Math.abs(a - b) <= Math.max(1e-8, Math.abs(b) * 1e-10); }

function validateCosts(costs, offer, path, errors) {
  if (costs === null) return;
  if (!objectKeys(costs, COST_KEYS, path, errors)) return;
  let simulation;
  try { simulation = calculateMortgage({ ...costs, annualRatePercent: offer.annualRatePercent, rateConvention: offer.rateConvention }); }
  catch { errors.push(`${path}: escenario financiero inválido.`); }
  if (!INPUT_LOCATIONS.has(costs.location)) errors.push(`${path}.location: ubicación inválida.`);
  if (offer.location !== 'any' && costs.location !== offer.location) errors.push(`${path}.location: no coincide con la oferta.`);
  if (simulation && (!(Array.isArray(offer.availableYears) && offer.availableYears.includes(costs.years))
    || simulation.principalUf < offer.minPrincipalUf - 1e-8 || simulation.principalUf > offer.maxPrincipalUf + 1e-8
    || simulation.financingPercent < offer.minFinancingPercent - 1e-8 || simulation.financingPercent > offer.maxFinancingPercent + 1e-8)) errors.push(`${path}: escenario fuera del alcance de la oferta.`);
  for (const key of ['monthlyInsuranceUf', 'monthlyOtherCostsUf', 'oneTimeFeesUf', 'caePercent', 'totalCostUf']) {
    if (costs[key] !== null && !finite(costs[key], 0, key === 'caePercent' ? 100 : 100_000_000)) errors.push(`${path}.${key}: requiere número no negativo o null.`);
  }
  if (typeof costs.complete !== 'boolean') errors.push(`${path}.complete: requiere boolean.`);
  if (!['cmf-standard-excludes-tax-registry', 'all-known'].includes(costs.coverage)) errors.push(`${path}.coverage: cobertura de costes explícita requerida.`);
  if (!['life-fire-earthquake', 'life-fire', 'unknown'].includes(costs.insuranceCoverage)) errors.push(`${path}.insuranceCoverage: cobertura de seguros explícita requerida.`);
  if (costs.complete && costs.coverage !== 'all-known') errors.push(`${path}: sólo all-known puede declarar costes completos.`);
  if (costs.complete && ['monthlyInsuranceUf', 'monthlyOtherCostsUf', 'oneTimeFeesUf', 'totalCostUf'].some((key) => costs[key] === null)) errors.push(`${path}: costes completos requieren seguros, otros costes, gastos y coste total verificados.`);
  if (simulation && costs.totalCostUf !== null && costs.totalCostUf < simulation.principalUf) errors.push(`${path}.totalCostUf: no puede ser inferior al capital.`);
  if (simulation && costs.complete && costs.totalCostUf !== null && costs.totalCostUf < simulation.totalPaymentsUf) errors.push(`${path}.totalCostUf: el coste completo no puede ser inferior a la suma de dividendos financieros.`);
}

function validateOffer(offer, path, errors) {
  if (!objectKeys(offer, OFFER_KEYS, path, errors)) return;
  if (!id(offer.id)) errors.push(`${path}.id: identificador inválido.`);
  if (!id(offer.institutionId)) errors.push(`${path}.institutionId: identificador inválido.`);
  if (!nonempty(offer.label, 180)) errors.push(`${path}.label: requerido.`);
  if (offer.interestType !== 'fixed') errors.push(`${path}.interestType: sólo tasa fija comparable.`);
  if (offer.currency !== 'UF') errors.push(`${path}.currency: sólo UF comparable.`);
  if (!finite(offer.annualRatePercent, 0, 25)) errors.push(`${path}.annualRatePercent: tasa inválida.`);
  if (!['nominal', 'effective'].includes(offer.rateConvention)) errors.push(`${path}.rateConvention: convención explícita requerida.`);
  if (!Array.isArray(offer.availableYears) || offer.availableYears.length === 0
    || offer.availableYears.some((value) => !Number.isInteger(value) || value < 5 || value > 40)
    || new Set(offer.availableYears).size !== offer.availableYears.length) errors.push(`${path}.availableYears: plazos enteros únicos entre 5 y 40.`);
  for (const key of ['minPrincipalUf', 'maxPrincipalUf']) if (!finite(offer[key], 10, 950_000)) errors.push(`${path}.${key}: capital inválido.`);
  if (offer.minPrincipalUf > offer.maxPrincipalUf) errors.push(`${path}: rango de capital invertido.`);
  for (const key of ['minFinancingPercent', 'maxFinancingPercent']) if (!finite(offer[key], 10, 95)) errors.push(`${path}.${key}: financiamiento inválido.`);
  if (offer.minFinancingPercent > offer.maxFinancingPercent) errors.push(`${path}: rango de financiamiento invertido.`);
  if (!OFFER_LOCATIONS.has(offer.location)) errors.push(`${path}.location: alcance geográfico inválido.`);
  if (!Array.isArray(offer.requirements) || offer.requirements.length > 20 || offer.requirements.some((value) => !nonempty(value, 600))) errors.push(`${path}.requirements: condiciones deben ser textos breves.`);
  for (const key of ['validFrom', 'validUntil']) if (!Number.isFinite(dateEpoch(offer[key]))) errors.push(`${path}.${key}: fecha inválida.`);
  if (dateEpoch(offer.validFrom) > dateEpoch(offer.validUntil)) errors.push(`${path}: vigencia invertida.`);
  validateSource(offer.source, `${path}.source`, errors, true);
  if (dateEpoch(offer.validUntil) > dateEpoch(offer.source?.verifiedAt) + OFFER_MAX_AGE_DAYS * DAY_MS) errors.push(`${path}.validUntil: vigencia máxima de ${OFFER_MAX_AGE_DAYS} días desde verificación.`);
  if (offer.source?.kind === 'official-scenario' && (offer.minPrincipalUf !== offer.maxPrincipalUf
    || offer.minFinancingPercent !== offer.maxFinancingPercent || offer.availableYears?.length !== 1)) errors.push(`${path}: escenario oficial exige capital, financiamiento y plazo exactos.`);
  validateCosts(offer.scenarioCosts, offer, `${path}.scenarioCosts`, errors);
}

/** Strict, fail-closed validation for the controlled JSON publication process. */
export function validateDataset(data) {
  const errors = [];
  if (!objectKeys(data, ['schemaVersion', 'updatedAt', 'uf', 'institutions', 'offers', 'updatePolicy'], 'dataset', errors)) return { valid: false, errors };
  if (data.schemaVersion !== 1) errors.push('dataset.schemaVersion: versión no soportada.');
  if (!Number.isFinite(dateEpoch(data.updatedAt))) errors.push('dataset.updatedAt: fecha inválida.');
  validateUf(data.uf, 'dataset.uf', errors);
  const institutions = new Map();
  if (!Array.isArray(data.institutions)) errors.push('dataset.institutions: requiere lista.');
  else data.institutions.forEach((institution, index) => {
    const path = `dataset.institutions[${index}]`;
    if (!objectKeys(institution, ['id', 'name', 'source'], path, errors, ['notes'])) return;
    if (!id(institution.id) || institutions.has(institution.id)) errors.push(`${path}.id: identificador inválido o duplicado.`);
    if (!nonempty(institution.name, 120)) errors.push(`${path}.name: requerido.`);
    if (Object.hasOwn(institution, 'notes') && (typeof institution.notes !== 'string' || institution.notes.length > 600)) errors.push(`${path}.notes: requiere texto de hasta 600 caracteres.`);
    validateSource(institution.source, `${path}.source`, errors);
    institutions.set(institution.id, institution);
  });
  if (!Array.isArray(data.offers)) errors.push('dataset.offers: requiere lista.');
  else {
    const offerIds = new Set();
    data.offers.forEach((offer, index) => {
      const path = `dataset.offers[${index}]`;
      validateOffer(offer, path, errors);
      if (!plainObject(offer)) return;
      if (offerIds.has(offer.id)) errors.push(`${path}.id: duplicado.`);
      offerIds.add(offer.id);
      const institution = institutions.get(offer.institutionId);
      if (!institution) errors.push(`${path}.institutionId: institución desconocida.`);
      else {
        const offerHost = sourceHost(offer.source);
        const institutionHost = sourceHost(institution.source)?.replace(/^www\./, '');
        if (!isDomain(offerHost, 'cmfchile.cl') && !isDomain(offerHost, institutionHost)) errors.push(`${path}.source: debe pertenecer a la CMF o institución.`);
      }
    });
  }
  if (objectKeys(data.updatePolicy, ['mode', 'description'], 'dataset.updatePolicy', errors)) {
    if (data.updatePolicy.mode !== 'verified-manual') errors.push('dataset.updatePolicy.mode: sólo actualización manual verificada.');
    if (!nonempty(data.updatePolicy.description, 2000)) errors.push('dataset.updatePolicy.description: requerido.');
  }
  return { valid: errors.length === 0, errors };
}

/** Only today's UF is suitable for the prominently displayed CLP estimate. */
export function getUfStatus(uf, now = new Date()) {
  const errors = [];
  validateUf(uf, 'uf', errors);
  const current = today(now);
  const base = { usable: false, date: uf?.date ?? null, valueClp: uf?.valueClp ?? null, sourceUrl: uf?.source?.url ?? null };
  if (errors.length || !current) return { ...base, state: 'invalid', message: 'No hay un valor UF oficial válido.' };
  if (dateEpoch(uf.source.verifiedAt) > dateEpoch(current) || dateEpoch(uf.date) > dateEpoch(current)) return { ...base, state: 'future', message: 'La UF tiene una fecha futura; no se usa para convertir a pesos.' };
  if (uf.date < current) return { ...base, state: 'stale', message: `UF del ${uf.date}; requiere actualización para estimar pesos de hoy.` };
  return { ...base, usable: true, state: 'current', message: `UF oficial del ${uf.date}.` };
}

export function getOfferStatus(offer, now = new Date()) {
  const errors = [];
  validateOffer(offer, 'offer', errors);
  const current = today(now);
  if (errors.length || !current) return { usable: false, state: 'invalid', message: 'La alternativa no contiene datos oficiales completos y válidos.' };
  if (dateEpoch(offer.source.verifiedAt) > dateEpoch(current) || dateEpoch(offer.source.updatedAt) > dateEpoch(current) || offer.validFrom > current) return { usable: false, state: 'future', message: 'La alternativa todavía no está vigente.' };
  if (offer.validUntil < current || dateEpoch(current) - dateEpoch(offer.source.verifiedAt) > OFFER_MAX_AGE_DAYS * DAY_MS
    || dateEpoch(current) - dateEpoch(offer.source.updatedAt) > SOURCE_MAX_AGE_DAYS * DAY_MS) return { usable: false, state: 'stale', message: 'La alternativa requiere una nueva verificación de su fuente.' };
  return { usable: true, state: 'current', message: `Fuente verificada el ${offer.source.verifiedAt}.` };
}

/** Eligibility concerns published terms; credit approval remains with the bank. */
export function compareOffers(input, offers, now = new Date()) {
  const inputSimulation = calculateMortgage({ ...input, annualRatePercent: 0, rateConvention: 'nominal' });
  const location = input.location ?? 'unknown';
  if (!INPUT_LOCATIONS.has(location)) throw new RangeError('Ubicación inválida.');
  if (!Array.isArray(offers)) throw new TypeError('Las alternativas deben ser una lista.');
  return offers.filter((offer) => {
    if (!getOfferStatus(offer, now).usable) return false;
    return offer.availableYears.includes(input.years)
      && inputSimulation.principalUf >= offer.minPrincipalUf - 1e-8 && inputSimulation.principalUf <= offer.maxPrincipalUf + 1e-8
      && inputSimulation.financingPercent >= offer.minFinancingPercent - 1e-8 && inputSimulation.financingPercent <= offer.maxFinancingPercent + 1e-8
      && (offer.location === 'any' || offer.location === location);
  }).map((offer) => {
    const simulation = calculateMortgage({ ...input, annualRatePercent: offer.annualRatePercent, rateConvention: offer.rateConvention });
    const costs = offer.scenarioCosts;
    const sameScenario = costs !== null && close(costs.propertyUf, input.propertyUf)
      && close(costs.downPaymentPercent, input.downPaymentPercent) && costs.years === input.years
      && costs.location === location;
    const monthlyInsuranceUf = sameScenario ? costs.monthlyInsuranceUf : null;
    const monthlyOtherCostsUf = sameScenario ? costs.monthlyOtherCostsUf : null;
    const monthlyTotalUf = monthlyInsuranceUf !== null && monthlyOtherCostsUf !== null
      ? simulation.monthlyPaymentUf + monthlyInsuranceUf + monthlyOtherCostsUf : null;
    const totalCostComparable = Boolean(sameScenario && costs.complete && costs.coverage === 'all-known' && costs.totalCostUf !== null);
    const caeComparable = Boolean(sameScenario && costs.caePercent !== null && costs.insuranceCoverage !== 'unknown');
    return {
      offer,
      simulation,
      monthlyPaymentUf: simulation.monthlyPaymentUf,
      monthlyInsuranceUf,
      monthlyOtherCostsUf,
      monthlyTotalUf,
      oneTimeFeesUf: sameScenario ? costs.oneTimeFeesUf : null,
      totalCostUf: totalCostComparable ? costs.totalCostUf : null,
      caePercent: caeComparable ? costs.caePercent : null,
      caeGroup: caeComparable ? `${costs.coverage}:${costs.insuranceCoverage}` : null,
      costCoverage: sameScenario ? costs.coverage : null,
      insuranceCoverage: sameScenario ? costs.insuranceCoverage : null,
      annualEffectiveRatePercent: Math.expm1(simulation.monthlyRate === 0 ? 0 : 12 * Math.log1p(simulation.monthlyRate)) * 100,
      caeComparable,
      totalCostComparable,
    };
  });
}

/** Null cost/CAE values sort last and never masquerade as zero. */
export function sortComparisons(results, key = 'dividend') {
  const getters = {
    dividend: (result) => result.monthlyPaymentUf,
    rate: (result) => result.annualEffectiveRatePercent,
    cae: (result) => result.caeComparable ? result.caePercent : null,
    totalCost: (result) => result.totalCostComparable ? result.totalCostUf : null,
  };
  if (!Object.hasOwn(getters, key)) throw new RangeError('Orden de comparación inválido.');
  if (!Array.isArray(results)) throw new TypeError('Los resultados deben ser una lista.');
  const caeGroups = new Map();
  if (key === 'cae') results.forEach((result) => {
    if (result.caeComparable && result.caeGroup && !caeGroups.has(result.caeGroup)) caeGroups.set(result.caeGroup, caeGroups.size);
  });
  return results.map((result, index) => ({ result, index, value: getters[key](result) }))
    .sort((a, b) => {
      const aValid = finite(a.value);
      const bValid = finite(b.value);
      if (aValid !== bValid) return aValid ? -1 : 1;
      if (key === 'cae' && aValid && bValid && a.result.caeGroup !== b.result.caeGroup) return caeGroups.get(a.result.caeGroup) - caeGroups.get(b.result.caeGroup);
      return aValid ? a.value - b.value || a.index - b.index : a.index - b.index;
    }).map(({ result }) => result);
}
