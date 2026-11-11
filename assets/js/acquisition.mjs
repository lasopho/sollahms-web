import { normalizeAcquisition, UTM_FIELDS, externalOrigin } from './acquisition-contract.mjs';

export const ACQUISITION_KEY = 'sollahms:acquisition:v1';
// Tab-session scope, without a visitor ID or a network request. Storage is optional.
export function createAcquisitionSession({ storage, location, referrer = '', now = Date.now } = {}) {
  let first = null;
  try {
    const raw = storage?.getItem(ACQUISITION_KEY);
    if (raw && raw.length <= 4096) {
      const saved = JSON.parse(raw);
      if (saved?.version === 1) first = normalizeAcquisition(saved.context, { ownOrigin: location.origin, now: now() });
      if (!first?.landing_path || !first?.captured_at) first = null;
    }
  } catch { /* Malformed/unavailable storage cannot disable a form. */ }
  if (!first) {
    try {
      const query = new URLSearchParams(location.search);
      const initial = Object.fromEntries([...UTM_FIELDS, 'gclid', 'msclkid'].map(key => [key, query.getAll(key).length === 1 ? query.get(key) : null]));
      first = normalizeAcquisition({ ...initial, landing_path: location.pathname,
        referrer_origin: externalOrigin(referrer, location.origin), captured_at: new Date(now()).toISOString() }, { ownOrigin: location.origin, now: now() });
      // Submission and request identity belong to a particular operation, never the session.
      const { request_id, submission_path, ...context } = first;
      storage?.setItem(ACQUISITION_KEY, JSON.stringify({ version: 1, context }));
    } catch { /* In-memory acquisition remains available if storage is blocked. */ }
  }
  return { snapshot(submissionPath, requestId) {
    try { return normalizeAcquisition({ ...first, submission_path: submissionPath }, { requestId, ownOrigin: location.origin, now: now() }); }
    catch { return null; }
  } };
}

let browserSession = null;
try {
  if (typeof document !== 'undefined' && typeof location !== 'undefined') {
    let storage; try { storage = window.sessionStorage; } catch { /* optional */ }
    browserSession = createAcquisitionSession({ storage, location, referrer: document.referrer });
  }
} catch { /* Attribution must never break page initialization. */ }
export function currentAcquisition(requestId) {
  try { return browserSession?.snapshot(location.pathname, requestId) ?? null; }
  catch { return null; }
}
