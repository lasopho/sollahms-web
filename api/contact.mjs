const MAX_BODY_BYTES = 32_768;
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function json(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function safeSubject(value) {
  return value.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function readJson(request) {
  const declaredLength = Number(request.headers.get('content-length'));
  if (declaredLength > MAX_BODY_BYTES) return { tooLarge: true };

  const reader = request.body?.getReader();
  if (!reader) return { invalid: true };

  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return { tooLarge: true };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { body: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch {
    return { invalid: true };
  }
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const fields = ['nombre', 'correo', 'telefono', 'asunto', 'mensaje', 'website'];
  if (fields.some(field => body[field] !== undefined && typeof body[field] !== 'string')) return null;

  const nombre = body.nombre?.trim() || '';
  const correo = body.correo?.trim() || '';
  const telefono = body.telefono?.trim() || '';
  const asunto = body.asunto?.trim() || '';
  const mensaje = body.mensaje?.trim() || '';

  if (!nombre || nombre.length > 100 || /[\u0000-\u001f\u007f]/.test(nombre)) return null;
  const emailPattern = /^[^\s@<>(),;:"\\[\].]+(?:\.[^\s@<>(),;:"\\[\].]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  if (!correo || correo.length > 254 || /[\u0000-\u001f\u007f]/.test(correo) || !emailPattern.test(correo)) return null;
  if (telefono.length > 30 || /[\u0000-\u001f\u007f]/.test(telefono)) return null;
  if (asunto.length > 120 || /[\u0000-\u001f\u007f]/.test(asunto)) return null;
  if (mensaje.length < 10 || mensaje.length > 5000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(mensaje)) return null;

  return { nombre, correo, telefono, asunto, mensaje };
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return json({ error: 'Método no permitido.' }, 405, { Allow: 'POST' });
    }
    if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') || '')) {
      return json({ error: 'Formato no admitido.' }, 415);
    }

    let parsed;
    try {
      parsed = await readJson(request);
    } catch {
      return json({ error: 'Solicitud inválida.' }, 400);
    }
    if (parsed.tooLarge) return json({ error: 'Solicitud demasiado grande.' }, 413);
    if (parsed.invalid) return json({ error: 'Solicitud inválida.' }, 400);

    const body = parsed.body;
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.website === 'string' && body.website.trim()) {
      return json({ ok: true }, 200);
    }

    const fields = validate(body);
    if (!fields) return json({ error: 'Revisa los datos del formulario.' }, 400);

    const key = process.env.RESEND_API_KEY;
    if (!key) return json({ error: 'No pudimos enviar el mensaje. Inténtalo más tarde.' }, 503);

    const { nombre, correo, telefono, asunto, mensaje } = fields;
    const displayTelefono = telefono || 'No informado';
    const displayAsunto = asunto || 'Sin asunto';
    const html = `<!doctype html><html lang="es"><body>
      <h1>Nueva consulta desde Sollahms Web</h1>
      <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
      <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
      <p><strong>Teléfono:</strong> ${escapeHtml(displayTelefono)}</p>
      <p><strong>Asunto:</strong> ${escapeHtml(displayAsunto)}</p>
      <p><strong>Mensaje:</strong></p>
      <p style="white-space: pre-wrap">${escapeHtml(mensaje)}</p>
    </body></html>`;
    const text = `Nueva consulta desde Sollahms Web\n\nNombre: ${nombre}\nCorreo: ${correo}\nTeléfono: ${displayTelefono}\nAsunto: ${displayAsunto}\nMensaje:\n${mensaje}`;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Sollahms Web <formularios@forms.sollahms.cl>',
          to: ['contacto@sollahms.cl'],
          reply_to: correo,
          subject: `Contacto Sollahms: ${safeSubject(displayAsunto)}`,
          html,
          text,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error('Email provider rejected request');
      return json({ ok: true }, 200);
    } catch {
      return json({ error: 'No pudimos enviar el mensaje. Inténtalo más tarde.' }, 502);
    }
  },
};
