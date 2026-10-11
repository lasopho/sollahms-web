import { createOfficialUfService } from '../lib/official-uf.mjs';
import { chileDate } from '../assets/js/project-finance.mjs';
import { getUfStatus } from '../assets/js/mortgage-data.mjs';

export function createUfHandler({ service = createOfficialUfService(), now = Date.now } = {}) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
  const json = (body, status, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
  return {
    async fetch(request) {
      if (request.method !== 'GET') return json({ error: 'Método no permitido.' }, 405, { Allow: 'GET' });
      // Caller-controlled URLs or dates are deliberately unsupported.
      if (new URL(request.url).search) return json({ error: 'Consulta no admitida.' }, 400);
      try {
        const uf = await service.resolve();
        if (!getUfStatus(uf, new Date(now())).usable) throw new Error('UF is not current');
        return json({ uf }, 200);
      }
      catch { return json({ code: 'uf_unavailable', date: chileDate(new Date(now())), error: 'No pudimos verificar la UF oficial de hoy. Reintenta en un momento; no usamos una UF antigua para convertir pesos.' }, 503, { 'Retry-After': '30' }); }
    },
  };
}
export default createUfHandler();
