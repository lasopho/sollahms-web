import { currentAcquisition } from './acquisition.mjs';
import { normalizeAcquisition } from './acquisition-contract.mjs';
const MAX_AGE_MS = 23 * 60 * 60 * 1000;
const pendingMessage = 'Hay una solicitud pendiente de confirmación. Conserva los datos y escribe a contacto@sollahms.cl antes de iniciar otra.';
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
function intentAndTiming(payload) {
  const intent = JSON.parse(JSON.stringify(payload));
  delete intent.acquisition; // Technical context is frozen with the operation, not business intent.
  const timing = {};
  if (Object.hasOwn(intent, 'startedAt')) { timing.startedAt = intent.startedAt; delete intent.startedAt; }
  if (intent.mortgage && Object.hasOwn(intent.mortgage, 'simulatedAt')) { timing.simulatedAt = intent.mortgage.simulatedAt; delete intent.mortgage.simulatedAt; }
  return { intent, timing };
}
function replayPayload(payload, timing) {
  return { ...payload, ...(Object.hasOwn(timing, 'startedAt') ? { startedAt: timing.startedAt } : {}),
    ...(payload.mortgage && Object.hasOwn(timing, 'simulatedAt') ? { mortgage: { ...payload.mortgage, simulatedAt: timing.simulatedAt } } : {}) };
}

// Only an opaque key, SHA-256 fingerprint, timestamps and bounded acquisition enter sessionStorage.
// Personal fields stay in the form/memory. The key survives a tab reload.
export function createFormOperation({ name, storage, now = Date.now, randomUUID = () => globalThis.crypto.randomUUID(), acquire = currentAcquisition, digest = async text => [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(byte => byte.toString(16).padStart(2, '0')).join('') } = {}) {
  let operation = null;
  let memoryBody = null;
  let corruptRetainedOperation = false;
  if (storage === undefined) {
    try { storage = globalThis.sessionStorage; } catch { /* Use memory in this page. */ }
  }
  const storageKey = 'sollahms:operation:v1:' + name;
  try {
    const retained = storage?.getItem(storageKey);
    if (retained) {
      corruptRetainedOperation = true;
      if (retained.length > 8192) throw new Error('Invalid operation');
      operation = JSON.parse(retained);
      if (!operation || !/^sollahms-v1-\d{13}-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(operation.key) || !Number.isSafeInteger(operation.createdAt) || !/^[a-f0-9]{64}$/.test(operation.fingerprint)
        || !operation.timing || typeof operation.timing !== 'object' || Array.isArray(operation.timing)
        || Object.keys(operation.timing).some(key => !['startedAt', 'simulatedAt'].includes(key))
        || (Object.hasOwn(operation.timing, 'startedAt') && !Number.isSafeInteger(operation.timing.startedAt))
        || (Object.hasOwn(operation.timing, 'simulatedAt') && (typeof operation.timing.simulatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(operation.timing.simulatedAt)))) throw new Error('Invalid operation');
      if (operation.acquisition !== undefined) operation.acquisition = normalizeAcquisition(operation.acquisition, { requestId: operation.key.slice(-36), now: now() });
      if (Number(operation.key.split('-')[2]) !== operation.createdAt) throw new Error('Invalid operation');
      corruptRetainedOperation = false;
    }
  } catch { operation = null; }
  const clear = () => {
    try { storage?.removeItem(storageKey); } catch { /* Memory is still cleared. */ }
    operation = null; memoryBody = null;
  };
  return {
    async prepare(payload, { allowRetry = true } = {}) {
      if (corruptRetainedOperation) throw new Error(pendingMessage);
      const { intent, timing } = intentAndTiming(payload);
      const fingerprint = await digest(JSON.stringify(stable(intent)));
      if (operation) {
        if (!allowRetry || operation.fingerprint !== fingerprint || now() - operation.createdAt >= MAX_AGE_MS || now() < operation.createdAt) throw new Error(pendingMessage);
        const replay = replayPayload(payload, operation.timing);
        delete replay.acquisition;
        if (operation.acquisition !== undefined) replay.acquisition = operation.acquisition;
        return { key: operation.key, body: memoryBody ?? JSON.stringify(replay), reused: true };
      }
      const createdAt = now();
      const requestId = randomUUID();
      let context = null;
      try { context = acquire(requestId); } catch { /* Optional attribution cannot stop a request. */ }
      const acquisition = normalizeAcquisition(context, { requestId, now: createdAt });
      operation = { key: `sollahms-v1-${createdAt}-${requestId}`, createdAt, fingerprint, timing, acquisition };
      const body = JSON.stringify({ ...payload, acquisition });
      memoryBody = body;
      try { storage?.setItem(storageKey, JSON.stringify(operation)); }
      catch { /* Keep the same key/body in memory for retries in this page. */ }
      return { key: operation.key, body, reused: false };
    },
    complete: clear,
    discard: clear,
    uncertain() { /* Retain the operation; never silently generate a fresh key. */ },
  };
}
