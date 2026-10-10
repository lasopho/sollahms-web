/** Project prices and payment terms are usable only with dated, verified provenance. */
export const PROJECT_PRICE_MAX_AGE_DAYS = 30;
const DAY_MS = 86_400_000;

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function dateEpoch(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const epoch = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(epoch) && new Date(epoch).toISOString().slice(0, 10) === value ? epoch : NaN;
}

export function chileDate(now = new Date()) {
  if (typeof now === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(now)) return Number.isFinite(dateEpoch(now)) ? now : null;
  const instant = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(instant.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function verifiedProvenance(verification, now) {
  if (!plainObject(verification) || verification.estadoFuente !== 'verified'
      || !Array.isArray(verification.camposVerificados)) return null;
  const currentDate = chileDate(now);
  const date = verification.fecha;
  const currentEpoch = dateEpoch(currentDate);
  const verifiedEpoch = dateEpoch(date);
  if (!Number.isFinite(currentEpoch) || !Number.isFinite(verifiedEpoch)
      || verifiedEpoch > currentEpoch || currentEpoch - verifiedEpoch > PROJECT_PRICE_MAX_AGE_DAYS * DAY_MS) return null;
  try {
    const url = new URL(verification.fuente);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    return { date, source: verification.fuente };
  } catch { return null; }
}

/** A catalogue "desde" price is a dated reference, not a guaranteed unit quotation. */
export function verifiedProjectPrice(project, now = new Date()) {
  if (!plainObject(project) || typeof project.precioDesdeUF !== 'number'
      || !Number.isFinite(project.precioDesdeUF) || project.precioDesdeUF <= 0) return null;
  const provenance = verifiedProvenance(project.verificacion, now);
  if (!provenance || !project.verificacion.camposVerificados.includes('precioDesdeUF')) return null;
  return { valueUf: project.precioDesdeUF, ...provenance };
}

export const PAYMENT_TERM_FIELDS = Object.freeze([
  'reservationUf', 'downPaymentInstallments', 'installmentAmountUf', 'balloonUf',
  'deferredDownPaymentUf', 'downPaymentBonusUf', 'deliveryDate',
]);

/**
 * Future project.paymentTerms publication model. Unknown fields stay null.
 * Each displayed term needs its own key in verificacion.camposVerificados;
 * no quantity, payment schedule, benefit or delivery date is inferred.
 */
export function normalizeVerifiedPaymentTerms(terms, now = new Date()) {
  if (!plainObject(terms)) return null;
  const provenance = verifiedProvenance(terms.verificacion, now);
  if (!provenance) return null;
  const result = { ...provenance };
  let known = false;
  for (const field of PAYMENT_TERM_FIELDS) {
    const value = terms[field];
    const verified = terms.verificacion.camposVerificados.includes(field);
    const valid = field === 'deliveryDate'
      ? Number.isFinite(dateEpoch(value))
      : field === 'downPaymentInstallments'
        ? typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 600
        : typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000;
    result[field] = verified && valid ? value : null;
    known ||= result[field] !== null;
  }
  return known ? result : null;
}

/**
 * Conservative CMF geography. A verified region outside Metropolitana is other.
 * Only the verified central Santiago commune is automatically matched; the
 * remaining RM communes require verified metropolitan-scope evidence before
 * they can select the source's "Área Metropolitana de la ciudad de Santiago".
 */
export function verifiedProjectLocation(project, now = new Date()) {
  if (!plainObject(project) || !verifiedProvenance(project.verificacion, now)
      || !project.verificacion.camposVerificados.includes('region')
      || typeof project.region !== 'string' || !project.region.trim()) return 'unknown';
  const normalize = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ');
  const region = normalize(project.region);
  const metropolitan = ['region metropolitana', 'metropolitana', 'region metropolitana de santiago'].includes(region);
  if (!metropolitan) return 'other';
  if (!project.verificacion.camposVerificados.includes('comuna') || typeof project.comuna !== 'string') return 'unknown';
  return normalize(project.comuna) === 'santiago' ? 'santiago-metropolitana' : 'unknown';
}
