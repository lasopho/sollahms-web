import { getUfStatus } from './mortgage-data.mjs';

export const UF_CLIENT_REFRESH_MS = 15 * 60 * 1000;

/** Accept only a dated, validated official UF. An old snapshot is never current. */
export async function loadOfficialUf({ fallbackUf = null, fetchImpl = (...args) => fetch(...args), now = () => new Date() } = {}) {
  try {
    const response = await fetchImpl('/api/uf', { cache: 'no-store', signal: AbortSignal.timeout(6500) });
    if (!response.ok) throw new Error('Official UF unavailable');
    const body = await response.json();
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !Object.hasOwn(body, 'uf') || !getUfStatus(body.uf, now()).usable) throw new Error('Invalid current official UF');
    return body.uf;
  } catch {
    return getUfStatus(fallbackUf, now()).usable ? fallbackUf : null;
  }
}
