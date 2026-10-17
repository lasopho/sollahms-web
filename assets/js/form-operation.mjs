const MAX_AGE_MS = 23 * 60 * 60 * 1000;
const pendingMessage = 'Hay una solicitud pendiente de confirmación. Conserva los datos y escribe a contacto@sollahms.cl antes de iniciar otra.';
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
function intentAndTiming(payload) {
  const intent = JSON.parse(JSON.stringify(payload));
  const timing = {};
  if (Object.hasOwn(intent, 'startedAt')) { timing.startedAt = intent.startedAt; delete intent.startedAt; }
  if (intent.mortgage && Object.hasOwn(intent.mortgage, 'simulatedAt')) { timing.simulatedAt = intent.mortgage.simulatedAt; delete intent.mortgage.simulatedAt; }
  return { intent, timing };
}
function replayPayload(payload, timing) {
  return { ...payload, ...(Object.hasOwn(timing, 'startedAt') ? { startedAt: timing.startedAt } : {}),
    ...(payload.mortgage && Object.hasOwn(timing, 'simulatedAt') ? { mortgage: { ...payload.mortgage, simulatedAt: timing.simulatedAt } } : {}) };
}

// Only an opaque key, SHA-256 fingerprint and form timestamps enter sessionStorage.
// Personal fields stay in the form/memory. The key survives a tab reload.
export function createFormOperation({ name, storage, now = Date.now, randomUUID = () => globalThis.crypto.randomUUID(), digest = async text => [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(byte => byte.toString(16).padStart(2, '0')).join('') } = {}) {
  let operation = null;
  let memoryBody = null;
  let storageUnavailable = false;
  if (storage === undefined) {
    try { storage = globalThis.sessionStorage; } catch { storageUnavailable = true; }
    if (!storage) storageUnavailable = true;
  }
  const storageKey = 'sollahms:operation:v1:' + name;
  try {
    const retained = storage?.getItem(storageKey);
    if (retained) {
      operation = JSON.parse(retained);
      if (!operation || typeof operation.key !== 'string' || !Number.isSafeInteger(operation.createdAt) || !/^[a-f0-9]{64}$/.test(operation.fingerprint)
        || !operation.timing || typeof operation.timing !== 'object' || Array.isArray(operation.timing)
        || Object.keys(operation.timing).some(key => !['startedAt', 'simulatedAt'].includes(key))
        || (Object.hasOwn(operation.timing, 'startedAt') && !Number.isSafeInteger(operation.timing.startedAt))
        || (Object.hasOwn(operation.timing, 'simulatedAt') && (typeof operation.timing.simulatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(operation.timing.simulatedAt)))) throw new Error('Invalid operation');
    }
  } catch { storageUnavailable = true; }
  const clear = () => {
    try { storage?.removeItem(storageKey); } catch { storageUnavailable = true; }
    operation = null; memoryBody = null;
  };
  return {
    async prepare(payload, { allowRetry = true } = {}) {
      if (storageUnavailable) throw new Error('No pudimos conservar el identificador de la solicitud. Habilita el almacenamiento de esta pestaña antes de enviarla.');
      const { intent, timing } = intentAndTiming(payload);
      const body = JSON.stringify(payload);
      const fingerprint = await digest(JSON.stringify(stable(intent)));
      if (operation) {
        if (!allowRetry || operation.fingerprint !== fingerprint || now() - operation.createdAt >= MAX_AGE_MS || now() < operation.createdAt) throw new Error(pendingMessage);
        return { key: operation.key, body: memoryBody ?? JSON.stringify(replayPayload(payload, operation.timing)), reused: true };
      }
      const createdAt = now();
      operation = { key: `sollahms-v1-${createdAt}-${randomUUID()}`, createdAt, fingerprint, timing };
      memoryBody = body;
      try { storage?.setItem(storageKey, JSON.stringify(operation)); }
      catch { clear(); storageUnavailable = true; throw new Error('No pudimos conservar el identificador de la solicitud. No se envió.'); }
      return { key: operation.key, body, reused: false };
    },
    complete: clear,
    discard: clear,
    uncertain() { /* Retain the operation; never silently generate a fresh key. */ },
  };
}
