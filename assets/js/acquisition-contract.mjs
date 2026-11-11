// First-party acquisition v1. No identity fields, full URLs, fragments or free-form objects.
export const UTM_FIELDS = Object.freeze(['utm_source','utm_medium','utm_campaign','utm_content','utm_term']);
export const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const string = (value, max, pattern) => typeof value === 'string' && value.length <= max && pattern.test(value) ? value : null;
export function acquisitionPath(value) {
  if (value === '/index.html') return '/';
  return string(value, 180, /^(?:\/|\/[a-z0-9-]+\.html)$/);
}
export function externalOrigin(value, ownOrigin = 'https://sollahms.cl') {
  if (typeof value !== 'string' || !value || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.origin.length > 180
      || url.origin === ownOrigin || ['sollahms.cl', 'www.sollahms.cl'].includes(url.hostname)) return null;
    return url.origin;
  } catch { return null; }
}
export function utmValue(value) {
  const text = typeof value === 'string' ? value.trim().normalize('NFC') : null;
  // Campaign labels only. Obvious email/phone/RUT strings, URLs, control characters and markup are excluded.
  return string(text, 96, /^[\p{L}\p{M}\p{N} ._~-]+$/u) && !/\d{7}|\d[. -]?\d[. -]?\d[. -]?\d[. -]?\d[. -]?\d[. -]?\d/.test(text) ? text : null;
}
export function normalizeAcquisition(value, { requestId = null, ownOrigin, now = Date.now() } = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const id = requestId ?? source.request_id;
  const captured = typeof source.captured_at === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(source.captured_at) ? Date.parse(source.captured_at) : NaN;
  return {
    request_id: typeof id === 'string' && UUID.test(id) ? id.toLowerCase() : null,
    landing_path: acquisitionPath(source.landing_path),
    submission_path: acquisitionPath(source.submission_path),
    referrer_origin: externalOrigin(source.referrer_origin, ownOrigin),
    ...Object.fromEntries(UTM_FIELDS.map(key => [key, utmValue(source[key])])),
    gclid: string(source.gclid, 160, /^[A-Za-z0-9_-]+$/),
    msclkid: string(source.msclkid, 32, /^[a-f0-9]{32}$/i),
    captured_at: Number.isFinite(captured) && captured <= now + 60_000 && captured >= 0 && new Date(captured).toISOString() === source.captured_at ? source.captured_at : null,
  };
}
