const MAX_RESPONSE_BYTES = 8_192;
const MAX_REQUEST_BYTES = 16_384;
const REQUEST_TIMEOUT_MS = 5_000;
const RECEIPT_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export const WEB_CRM_CONSENT = Object.freeze({
  accepted: true,
  policyVersion: 'sollahms-privacy-20261021',
  purpose: 'contact_request',
  policyPath: '/privacidad.html',
});

function environmentConfig() {
  return {
    url: process.env.CRM_WEB_LEADS_URL,
    token: process.env.CRM_WEB_LEADS_TOKEN,
    allowLocalHttp: ['test', 'development'].includes(process.env.NODE_ENV)
      && process.env.CRM_ALLOW_LOCAL_HTTP === 'true',
  };
}

function destination(config) {
  if (!config || typeof config.url !== 'string' || typeof config.token !== 'string'
      || !/^[A-Za-z0-9_-]{32,256}$/.test(config.token)) return null;
  try {
    const url = new URL(config.url);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash
        || url.pathname !== '/api/web-leads'
        || (url.protocol !== 'https:'
          && !(url.protocol === 'http:' && loopback && config.allowLocalHttp === true))) return null;
    return { url, token: config.token };
  } catch {
    return null;
  }
}

async function boundedJson(response) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(response.headers.get('content-type') || '')) throw new Error('Invalid response');
  const length = response.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_RESPONSE_BYTES)) throw new Error('Invalid response');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Invalid response');
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error('Invalid response');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid response');
  return body;
}

/** Server-only, single-attempt CRM transport. It never sends mail or calls Google. */
export function createCrmLeadClient({
  getConfig = environmentConfig,
  fetchImpl = (...args) => fetch(...args),
} = {}) {
  return async function persistCrmLead(payload) {
    let target;
    try { target = destination(getConfig()); } catch { /* fail closed */ }
    if (!target) return { ok: false, status: 503, code: 'contact_configuration_unavailable' };
    try {
      const requestBody = JSON.stringify(payload);
      if (new TextEncoder().encode(requestBody).byteLength > MAX_REQUEST_BYTES) {
        return { ok: false, status: 413, code: 'contact_request_too_large' };
      }
      const response = await fetchImpl(target.url, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + target.token,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Idempotency-Key': payload.requestId,
        },
        body: requestBody,
        redirect: 'error',
        credentials: 'omit',
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.status === 409) {
        await response.body?.cancel();
        return { ok: false, status: 409, code: 'operation_conflict' };
      }
      if (![200, 201].includes(response.status)) {
        await response.body?.cancel();
        return { ok: false, status: 503, code: 'contact_outcome_unknown' };
      }
      const body = await boundedJson(response);
      if (body.ok !== true || body.persisted !== true || typeof body.duplicate !== 'boolean'
          || !body.receipt || body.receipt.requestId !== payload.requestId
          || typeof body.receipt.leadId !== 'string' || !RECEIPT_ID.test(body.receipt.leadId)
          || typeof body.receipt.receiptId !== 'string' || !RECEIPT_ID.test(body.receipt.receiptId)) {
        throw new Error('Unconfirmed receipt');
      }
      // Keep CRM identifiers and private infrastructure out of the public API.
      return { ok: true, persisted: true };
    } catch {
      return { ok: false, status: 502, code: 'contact_outcome_unknown' };
    }
  };
}
