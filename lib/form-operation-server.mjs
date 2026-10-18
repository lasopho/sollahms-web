import { createHash } from 'node:crypto';

// Resend retains native keys for 24h. Stop web retries an hour earlier.
export const OPERATION_MAX_AGE_MS = 23 * 60 * 60 * 1000;
export function readOperationKey(request, now = Date.now()) {
  const key = request.headers.get('Idempotency-Key');
  if (key === null) return { key: null }; // Preserve the existing API contract.
  const match = /^sollahms-v1-(\d{13})-([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/i.exec(key);
  if (!match || Number(match[1]) > now + 60_000) return { status: 400, error: { code: 'invalid_operation', error: 'Revisa el identificador de la solicitud.' } };
  if (now - Number(match[1]) >= OPERATION_MAX_AGE_MS) return { status: 409, error: { code: 'operation_expired', error: 'El resultado de esta solicitud requiere confirmación con contacto@sollahms.cl antes de volver a enviarla.' } };
  return { key };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
export const operationFingerprint = payload => createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex');

// A bounded, per-process guard only. Google still needs a durable operation
// ledger and an atomic availability/create lock across all backend instances.
export function createOperationLedger({ now = Date.now, maxEntries = 1000 } = {}) {
  const entries = new Map();
  return {
    async run(key, payload, execute) {
      if (!key) return execute();
      const fingerprint = operationFingerprint(payload);
      const existing = entries.get(key);
      if (existing) {
        if (existing.fingerprint !== fingerprint) return { status: 409, body: { ok: false, code: 'operation_conflict', error: 'Esta solicitud ya se inició con otros datos. Confirma su resultado con contacto@sollahms.cl.' } };
        return existing.result;
      }
      // Never evict pending work to admit new operations.
      for (const [id, entry] of entries) if (entry.settled && now() >= entry.expiresAt) entries.delete(id);
      if (entries.size >= maxEntries) return { status: 503, body: { ok: false, code: 'operation_capacity', error: 'No pudimos iniciar la reserva. Inténtalo más tarde.' } };
      // A client clock may be up to 60s ahead. Do not evict a response while
      // that same operation token is still accepted by readOperationKey.
      const tokenTime = Number(/^sollahms-v1-(\d{13})-/i.exec(key)?.[1]);
      const entry = { fingerprint, expiresAt: Math.max(now(), Number.isFinite(tokenTime) ? tokenTime : now()) + OPERATION_MAX_AGE_MS, settled: false };
      entry.result = Promise.resolve().then(execute).catch(() => ({ status: 502, body: { ok: false, code: 'booking_outcome_unknown', error: 'No pudimos confirmar el resultado. No repitas la reserva; escribe a contacto@sollahms.cl para verificarla.' } })).finally(() => { entry.settled = true; });
      entries.set(key, entry);
      return entry.result;
    },
  };
}
