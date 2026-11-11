import { randomUUID } from 'node:crypto';
import { normalizeAcquisition, UUID } from '../assets/js/acquisition-contract.mjs';

export function requestAcquisition(value, operation, request) {
  // The validated operation token is authoritative; never accept a second, conflicting UUID.
  const tokenId = /^sollahms-v1-\d{13}-(.+)$/.exec(operation?.key || '')?.[1];
  const supplied = value && typeof value === 'object' && !Array.isArray(value) ? value.request_id : null;
  const requestId = tokenId || (typeof supplied === 'string' && UUID.test(supplied) ? supplied : randomUUID());
  const operationTime = Number(/^sollahms-v1-(\d{13})-/.exec(operation?.key || '')?.[1]);
  const acquisition = normalizeAcquisition(value, { requestId, ownOrigin: new URL(request.url).origin,
    ...(Number.isFinite(operationTime) ? { now: operationTime } : {}) });
  return acquisition;
}

// Resend tags permit ASCII letters/digits/_/- (256 characters; 75 tags/email).
// UTF-8 values use reversible base64url chunks, not lossy slugs. Null fields are omitted.
// Decode acq_<field>_<index> chunks in numeric order; request_id stays directly searchable.
export function acquisitionTags(acquisition) {
  const tags = [{ name: 'request_id', value: acquisition.request_id }, { name: 'acquisition_version', value: '1' }];
  for (const [field, value] of Object.entries(acquisition)) {
    if (field === 'request_id' || value === null) continue;
    const encoded = Buffer.from(value, 'utf8').toString('base64url');
    for (let start = 0, index = 0; start < encoded.length; start += 240, index++) tags.push({ name: `acq_${field}_${index}`, value: encoded.slice(start, start + 240) });
  }
  return tags;
}

// Future CRM envelope: same UUID semantics as the prepared crmFormEvent requestId.
// Not connected to either CRM transport; receiver schema migration is a separate task.
export function crmAcquisitionContext(acquisition) {
  return { requestId: acquisition.request_id, acquisition };
}
