// This module contains validation only. Commercial data lives in private storage.
const fail = () => { throw new Error('Invalid private payment-plan dataset'); };
const string = (value, max = 8000) => {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail();
  return value.trim();
};
const number = (value, max = 1_000_000) => {
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) fail();
  return value;
};
const month = value => {
  if (value == null) return null;
  if (typeof value !== 'string' || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(value)) fail();
  return value;
};
const date = value => {
  const match = typeof value === 'string' && /^(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) fail();
  // Date.parse normalizes impossible days (e.g. February 31) into March.
  const daysInMonth = new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate();
  if (Number(match[3]) > daysInMonth) fail();
  return value;
};
const sourceUrl = value => {
  let url;
  try { url = new URL(value); } catch { fail(); }
  if (url.origin !== 'https://iris.yapo.cl' || !/^\/proyecto\/\d+\/?$/.test(url.pathname) || url.username || url.password) fail();
  return url.origin + url.pathname;
};
const evidence = values => {
  if (!Array.isArray(values) || values.length > 20) fail();
  return values.map(value => {
    if (!value || !/^[a-f0-9]{64}$/.test(value.sha256 ?? '')) fail();
    return { quote: string(value.quote, 20000), section: string(value.section ?? '', 200),
      capturedAt: date(value.capturedAt), sha256: value.sha256 };
  });
};
const terms = input => {
  if (!input || typeof input !== 'object') fail();
  // Captured Iris labels do not establish a complete contract or percentage
  // basis. Source rows are references; only explicit user scenarios calculate.
  const result = { verified: false };
  for (const key of ['requiredDownPaymentPercentage', 'developerBonusPercentage', 'initialPercentage', 'balloonPercentage']) result[key] = number(input[key], 100);
  for (const key of ['initialAmountUf', 'reservationUf', 'balloonAmountUf']) result[key] = number(input[key]);
  result.installments = number(input.installments, 600);
  if (result.installments !== null && !Number.isInteger(result.installments)) fail();
  if (!['credited_to_initial', 'credited_to_down_payment', 'additional', 'unknown'].includes(input.reservationTreatment)) fail();
  result.reservationTreatment = input.reservationTreatment;
  result.startMonth = month(input.startMonth);
  result.deliveryMonth = month(input.deliveryMonth);
  return result;
};

export function presentPaymentData(input, inventory) {
  if (!input || input.schemaVersion !== 1 || !Number.isInteger(input.version) || input.version < 0 || !Array.isArray(input.projects) || input.projects.length > 500) fail();
  const known = new Map(inventory.projects.map(p => [p.projectId ?? p.id, p]));
  const seen = new Set();
  const projects = input.projects.map(project => {
    const base = known.get(project.id);
    if (!base || seen.has(project.id) || !Array.isArray(project.units) || project.units.length > 2000) fail();
    seen.add(project.id);
    const delivery = project.delivery;
    if (!delivery || !['month', 'quarter', 'semester', 'year', 'unknown'].includes(delivery.precision) || delivery.futureConfirmed !== true) fail();
    const deliveryMonth = month(delivery.month);
    if (delivery.precision !== 'month' && deliveryMonth !== null) fail();
    const unitIds = new Set();
    return { id: project.id, name: base.name, developer: base.developer, commune: base.commune, region: base.region ?? null,
      delivery: { label: string(delivery.label, 300), month: deliveryMonth, precision: delivery.precision,
        futureConfirmed: true, sourceUrl: sourceUrl(delivery.sourceUrl), checkedAt: date(delivery.checkedAt) },
      conditions: string(project.conditions ?? '', 20000), evidence: evidence(project.evidence),
      units: project.units.map(unit => {
        const id = string(unit.id, 100);
        if (!id || unitIds.has(id)) fail();
        unitIds.add(id);
        const priceUf = number(unit.priceUf);
        if (priceUf === 0) fail();
        return { id, typology: string(unit.typology, 100), priceUf,
          priceLabel: string(unit.priceLabel, 300), priceBasis: string(unit.priceBasis, 300),
          sourceUrl: sourceUrl(unit.sourceUrl), checkedAt: date(unit.checkedAt),
          paymentTerms: terms(unit.paymentTerms), conditions: string(unit.conditions ?? '', 12000), evidence: evidence(unit.evidence) };
      }) };
  });
  return { schemaVersion: 1, version: input.version, updatedAt: input.updatedAt === null ? null : date(input.updatedAt), projects,
    refresh: { automaticIris: false, mode: 'Consulta manual de Iris; filas visibles, sin certificar stock ni vigencia contractual.' } };
}
