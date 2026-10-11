import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import contact from '../api/contact.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

function reply(res, status, text) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}

function requestBody(req) {
  let cleanup;
  const stream = new ReadableStream({
    start(controller) {
      const onData = chunk => { req.pause(); controller.enqueue(new Uint8Array(chunk)); };
      const onEnd = () => { cleanup(); controller.close(); };
      const onError = error => { cleanup(); controller.error(error); };
      cleanup = () => { req.off('data', onData); req.off('end', onEnd); req.off('error', onError); };
      req.on('data', onData);
      req.on('end', onEnd);
      req.on('error', onError);
    },
    pull() { req.resume(); },
    cancel() { cleanup(); req.resume(); },
  });
  return { stream, drain() { cleanup(); req.resume(); } };
}

export const server = createServer(async (req, res) => {
  try {
    const rawPath = (req.url || '/').split('?')[0];
    let pathname;
    try { pathname = decodeURIComponent(rawPath); } catch { return reply(res, 400, 'Ruta inválida.'); }
    if (!pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(segment => segment.startsWith('.'))) return reply(res, 403, 'Ruta no permitida.');

    if (pathname === '/api/contact' || pathname === '/api/contact/') {
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) headers.set(name, value.join(', '));
        else if (value !== undefined) headers.set(name, value);
      }
      const url = `http://127.0.0.1:${port}${pathname}`;
      // Keep the browser's own local hostname so Origin validation matches localhost too.
      const host = headers.get('host');
      const requestUrl = host === `localhost:${port}` ? `http://localhost:${port}${pathname}` : url;
      const options = { method: req.method, headers };
      let sourceBody;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        sourceBody = requestBody(req);
        options.body = sourceBody.stream;
        options.duplex = 'half';
      }
      try {
        const response = await contact.fetch(new Request(requestUrl, options));
        res.writeHead(response.status, Object.fromEntries(response.headers));
        return res.end(Buffer.from(await response.arrayBuffer()));
      } finally {
        sourceBody?.drain();
      }
    }

    if (pathname.startsWith('/api/') || pathname.startsWith('/lib/') || pathname.startsWith('/scripts/') || pathname.startsWith('/tests/') || pathname.startsWith('/docs/')) return reply(res, 404, 'No encontrado.');
    if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, 'Método no permitido.');
    const localPath = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!localPath.startsWith(`${root}${sep}`)) return reply(res, 403, 'Ruta no permitida.');
    let resolved;
    try { resolved = await realpath(localPath); } catch { return reply(res, 404, 'No encontrado.'); }
    const resolvedSegments = relative(root, resolved).split(sep);
    if (!resolved.startsWith(`${root}${sep}`) || resolvedSegments.some(segment => segment.startsWith('.')) || ['api', 'lib', 'scripts', 'tests', 'docs'].includes(resolvedSegments[0]) || !(await stat(resolved)).isFile() || !Object.hasOwn(mimeTypes, extname(resolved))) return reply(res, 404, 'No encontrado.');
    const bytes = await readFile(resolved);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(resolved)], 'Cache-Control': 'no-store', 'Content-Length': bytes.byteLength, 'X-Content-Type-Options': 'nosniff' });
    return res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch {
    reply(res, 500, 'No pudimos procesar la solicitud.');
  }
});

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('PORT inválido.');
  server.listen(port, '127.0.0.1', () => {
    console.log(`Vista local disponible en http://127.0.0.1:${port}`);
    console.log('Los formularios usan el handler real. Sin RESEND_API_KEY devolverán un error de envío.');
  });
}
