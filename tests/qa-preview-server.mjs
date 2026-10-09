import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AsyncLocalStorage } from 'node:async_hooks';
import booking from '../api/booking-create.mjs';
import availability from '../api/booking-availability.mjs';
import contact from '../api/contact.mjs';

// Local browser QA uses real handlers and a simulated provider. No external fetch is permitted.
const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootIndex = process.argv.indexOf('--root');
const root = resolve(sourceRoot, rootIndex >= 0 ? (process.argv[rootIndex + 1] || '.') : '.');
const port = Number(process.env.SOLLAHMS_QA_PORT || 8897);
const context = new AsyncLocalStorage();
const scenarios = new Set(['success', 'availability_unavailable', 'booking_conflict', 'upstream_error', 'preview_read_only']);
const counters = { requests: 0, availability: 0, booking: 0, contact: 0, simulatedProvider: 0, externalRequests: 0 };
const journal = [];
process.env.VERCEL_ENV = 'local-qa';
process.env.BOOKING_BACKEND_URL = 'https://booking.qa.test.invalid';
process.env.BOOKING_SECRET = 'local-qa-placeholder-secret';
process.env.RESEND_API_KEY = 'local-qa-placeholder-key';
globalThis.fetch = async (url, options = {}) => {
  const target = String(url);
  if (!['https://booking.qa.test.invalid/', 'https://api.resend.com/emails'].includes(target)) throw new Error('QA blocks every external network request');
  counters.simulatedProvider += 1;
  const data = JSON.parse(options.body);
  const scenario = context.getStore() || 'success';
  if (scenario === 'upstream_error') throw new DOMException('Simulated unavailable provider', 'TimeoutError');
  if (data.action === 'availability') return Response.json({ ok: true, available: scenario !== 'availability_unavailable' });
  if (data.action === 'book') {
    if (scenario === 'booking_conflict') return Response.json({ ok: false }, { status: 409 });
    return Response.json({ ok: true, booked: true, available: true });
  }
  return Response.json({ id: 'simulated-email-only' });
};

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
};
function reply(res, status, text, type = 'text/plain; charset=utf-8', extra = {}) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra });
  res.end(text);
}
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  counters.requests += 1;
  try {
    if (url.pathname === '/__qa/status') return reply(res, 200, JSON.stringify({ counters, journal }), types['.json']);
    if (url.pathname === '/__qa/mode') {
      const scenario = url.searchParams.get('scenario');
      if (!scenarios.has(scenario)) return reply(res, 400, 'Escenario inválido.');
      return reply(res, 200, `<!doctype html><html lang="es"><meta charset="utf-8"><title>QA local</title><p>Escenario activo: ${scenario}. Todas las reservas y mensajes son simulados.</p><a href="/agenda-asesoria.html?proyecto=independencia-4745">Agendar Asesoría</a> · <a href="/contacto.html?proyecto=independencia-4745">Consultar proyecto</a></html>`, types['.html'], { 'Set-Cookie': `sollahms-qa=${scenario}; Path=/; HttpOnly; SameSite=Strict` });
    }
    const routes = { '/api/booking-availability': [availability, 'availability'], '/api/booking-create': [booking, 'booking'], '/api/contact': [contact, 'contact'] };
    if (routes[url.pathname]) {
      const [handler, counter] = routes[url.pathname];
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 65536) return reply(res, 413, JSON.stringify({ ok: false, error: 'Solicitud demasiado grande.' }), types['.json']);
        chunks.push(chunk);
      }
      const bytes = Buffer.concat(chunks);
      const incoming = new Request(url, { method: req.method, headers: req.headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body: bytes } : {}) });
      const cookie = /(?:^|;\s*)sollahms-qa=([^;]+)/.exec(req.headers.cookie || '');
      const scenario = scenarios.has(cookie?.[1]) ? cookie[1] : 'success';
      counters[counter] += 1;
      const result = scenario === 'preview_read_only' && counter !== 'availability'
        ? Response.json({ ok: false, code: 'preview_read_only', error: counter === 'booking' ? 'La vista previa no envía reservas reales. Puedes revisar el formulario sin confirmar una asesoría.' : 'La vista previa no envía mensajes reales. Puedes revisar el formulario sin contactar al equipo.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
        : await context.run(scenario, () => handler.fetch(incoming));
      let project = null;
      try { project = JSON.parse(bytes.toString()).proyecto || null; } catch {}
      journal.push({ route: url.pathname, scenario, status: result.status, ...(project ? { proyecto: project } : {}) });
      res.writeHead(result.status, Object.fromEntries(result.headers));
      return res.end(Buffer.from(await result.arrayBuffer()));
    }
    if (!['GET', 'HEAD'].includes(req.method)) return reply(res, 405, 'Método no permitido.');
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/index.html';
    const publicPath = /^\/[a-z0-9-]+\.html$/.test(path) || path.startsWith('/assets/') || ['/data/proyectos.json', '/data/fichas-proyectos.json', '/robots.txt', '/sitemap.xml'].includes(path);
    const local = resolve(root, '.' + path);
    if (!publicPath || !local.startsWith(root + sep) || !(await stat(local)).isFile()) return reply(res, 404, await readFile(resolve(root, '404.html')), types['.html']);
    res.writeHead(200, { 'Content-Type': types[extname(local)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    return res.end(req.method === 'HEAD' ? undefined : await readFile(local));
  } catch {
    return reply(res, 404, 'No encontrado.');
  }
});
server.listen(port, '127.0.0.1', () => console.log(JSON.stringify({ qa: true, url: `http://127.0.0.1:${port}`, scenarios: [...scenarios], externalRequests: 0, root })));
