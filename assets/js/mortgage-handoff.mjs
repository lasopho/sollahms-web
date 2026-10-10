import { calculateMortgage } from './mortgage-engine.mjs';

// A single explicit simulator transition. No income, savings, debts or personal
// fields are accepted. The destination removes the record before inspecting it.
export const MORTGAGE_HANDOFF_KEY = 'sollahms:mortgage-handoff:v1';
export const MORTGAGE_HANDOFF_TTL_MS = 5 * 60 * 1000;
const KEYS = ['projectSlug', 'propertyUf', 'downPaymentPercent', 'years', 'annualRatePercent', 'rateConvention', 'propertyValueOrigin'];

function storageDefault() {
  try { return globalThis.sessionStorage; } catch { return null; }
}

function checked(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== KEYS.length || KEYS.some(key => !Object.hasOwn(value, key))) return null;
  if (typeof value.projectSlug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(value.projectSlug)
    || !['catalogue', 'visitor'].includes(value.propertyValueOrigin)) return null;
  try { calculateMortgage(value); } catch { return null; }
  return Object.fromEntries(KEYS.map(key => [key, value[key]]));
}

export function writeMortgageHandoff(value, { storage = storageDefault(), now = Date.now() } = {}) {
  try {
    storage?.removeItem(MORTGAGE_HANDOFF_KEY);
    const scenario = checked(value);
    if (!storage || !scenario || !Number.isSafeInteger(now) || now < 0) return false;
    storage.setItem(MORTGAGE_HANDOFF_KEY, JSON.stringify({ version: 1, createdAt: now, scenario }));
    return true;
  } catch { return false; }
}

export function consumeMortgageHandoff(projectSlug, { storage = storageDefault(), now = Date.now() } = {}) {
  try {
    const raw = storage?.getItem(MORTGAGE_HANDOFF_KEY);
    storage?.removeItem(MORTGAGE_HANDOFF_KEY);
    if (!raw || raw.length > 4096 || !Number.isSafeInteger(now)) return null;
    const record = JSON.parse(raw);
    if (!record || typeof record !== 'object' || Array.isArray(record)
      || Object.keys(record).length !== 3 || record.version !== 1
      || !Number.isSafeInteger(record.createdAt) || record.createdAt > now
      || now - record.createdAt > MORTGAGE_HANDOFF_TTL_MS) return null;
    const scenario = checked(record.scenario);
    return scenario?.projectSlug === projectSlug ? scenario : null;
  } catch { return null; }
}
