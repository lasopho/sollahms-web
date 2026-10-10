import dataset from '../data/hipotecario.json' with { type: 'json' };
import catalogue from '../data/proyectos.json' with { type: 'json' };
import { normalizeRut, RUT_ERROR } from '../assets/js/rut.mjs';
import { mortgageSummaryLines, validateMortgageLead, validFormTiming } from '../lib/mortgage-lead.mjs';

const MAX_BODY_BYTES = 32_768;
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};
const TEXT_FIELDS = ['nombre', 'correo', 'telefono', 'rut', 'mensaje', 'website', 'proyecto'];
const ALLOWED_FIELDS = [...TEXT_FIELDS, 'mortgage', 'consent', 'startedAt'];

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
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return { body: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch {
    return { invalid: true };
  }
}

function validShape(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !ALLOWED_FIELDS.includes(key))) return false;
  if (TEXT_FIELDS.some(key => body[key] !== undefined && typeof body[key] !== 'string')) return false;
  if (body.website !== undefined && (body.website.length > 200 || /[\u0000-\u001f\u007f]/.test(body.website))) return false;
  if (body.consent !== undefined && typeof body.consent !== 'boolean') return false;
  if (body.startedAt !== undefined && !Number.isSafeInteger(body.startedAt)) return false;
  return body.mortgage === undefined || (body.mortgage !== null && typeof body.mortgage === 'object' && !Array.isArray(body.mortgage));
}

function validate(body, projectIndex) {
  const invalid = { error: 'Revisa los datos del formulario.' };
  const nombre = body.nombre?.trim() || '';
  const correo = body.correo?.trim() || '';
  const telefono = body.telefono?.trim() || '';
  const mensaje = body.mensaje?.trim() || '';
  if (normalizeRut(body.rut ?? '') === null) return { code: 'invalid_rut', error: RUT_ERROR };
  if (!nombre || nombre.length > 100 || /[\u0000-\u001f\u007f]/.test(nombre)) return invalid;
  const emailPattern = /^[^\s@<>(),;:"\\[\].]+(?:\.[^\s@<>(),;:"\\[\].]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  if (!correo || correo.length > 254 || /[\u0000-\u001f\u007f]/.test(correo) || !emailPattern.test(correo)) return invalid;
  if (telefono.length > 30 || /[\u0000-\u001f\u007f]/.test(telefono)) return invalid;
  const hipotecario = body.mortgage !== undefined;
  if (hipotecario && (!/^[+()\d .-]+$/.test(telefono) || (telefono.match(/\d/g) || []).length < 9 || (telefono.match(/\d/g) || []).length > 15)) return invalid;
  if (mensaje.length < (hipotecario ? 1 : 10) || mensaje.length > 5000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(mensaje)) return invalid;
  const hasProject = Object.hasOwn(body, 'proyecto');
  if (hasProject && !Object.hasOwn(projectIndex, body.proyecto)) return { code: 'invalid_project', error: 'Revisa el proyecto de la consulta.' };
  const proyecto = hasProject ? body.proyecto : '';
  const project = hasProject ? projectIndex[proyecto] : null;
  const nombreProyecto = project?.nombre || '';
  const asunto = hipotecario
    ? (nombreProyecto ? 'Asesoría hipotecaria sobre ' + nombreProyecto : 'Asesoría hipotecaria desde Sollahms')
    : (nombreProyecto ? 'Consulta sobre ' + nombreProyecto : 'Consulta desde Sollahms');
  // RUT is validated above and deliberately excluded from the email provider.
  return { fields: { nombre, correo, telefono, asunto, mensaje, proyecto, nombreProyecto }, project };
}

export function createContactHandler({
  mortgageDataset = dataset, projectDataset = catalogue, now = Date.now,
  fetchImpl = (...args) => fetch(...args), getApiKey = () => process.env.RESEND_API_KEY,
  getEnvironment = () => process.env.VERCEL_ENV,
} = {}) {
  // Names and prices come only from the server's checked-in project catalogue.
  const projectIndex = Object.create(null);
  for (const project of projectDataset) {
    if (project && typeof project.slug === 'string' && typeof project.nombre === 'string') projectIndex[project.slug] = project;
  }
  return {
    async fetch(request) {
      if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405, { Allow: 'POST' });
      if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') || '')) return json({ error: 'Formato no admitido.' }, 415);
      const origin = request.headers.get('origin');
      if (origin !== null && origin !== new URL(request.url).origin) return json({ error: 'Origen de solicitud no permitido.' }, 403);
      let parsed;
      try { parsed = await readJson(request); } catch { return json({ error: 'Solicitud inválida.' }, 400); }
      if (parsed.tooLarge) return json({ error: 'Solicitud demasiado grande.' }, 413);
      if (parsed.invalid) return json({ error: 'Solicitud inválida.' }, 400);
      const body = parsed.body;
      if (!validShape(body)) return json({ error: 'Revisa los datos del formulario.' }, 400);
      if (body.website?.trim()) return json({ ok: true }, 200);
      const validated = validate(body, projectIndex);
      if (validated.error) return json(validated, 400);
      const fields = validated.fields;
      const receivedAt = now();
      let mortgageLead = null;
      if (body.mortgage !== undefined) {
        const result = validateMortgageLead(body, mortgageDataset, receivedAt, validated.project);
        if (result.error) return json({ error: result.error }, result.unavailable ? 503 : 400);
        mortgageLead = result.lead;
      } else if (body.startedAt !== undefined && !validFormTiming(body.startedAt, receivedAt)) {
        return json({ error: 'Revisa los datos del formulario.' }, 400);
      }
      // Guard every contact flow before credentials or external provider access.
      if (getEnvironment() === 'preview') return json({ ok: false, code: 'preview_read_only', error: 'La vista previa no envía mensajes reales. Puedes revisar el formulario sin contactar al equipo.' }, 503);
      const key = getApiKey()?.trim();
      if (!key) return json({ error: 'No pudimos enviar el mensaje. Inténtalo más tarde.' }, 503);
      const { nombre, correo, telefono, asunto, mensaje, proyecto, nombreProyecto } = fields;
      const displayTelefono = telefono || 'No informado';
      const summary = mortgageLead ? mortgageSummaryLines(mortgageLead) : [];
      const summaryHtml = summary.length ? `<h2>Resumen hipotecario</h2><p style="white-space: pre-wrap">${escapeHtml(summary.join('\n'))}</p>` : '';
      const projectHtml = proyecto ? `<p><strong>Proyecto:</strong> ${escapeHtml(nombreProyecto)}</p><p><strong>Identificador:</strong> ${escapeHtml(proyecto)}</p>` : '';
      const projectText = proyecto ? `Proyecto: ${nombreProyecto}\nIdentificador: ${proyecto}\n` : '';
      const html = `<!doctype html><html lang="es"><body>
        <h1>Nueva consulta desde Sollahms Web</h1>
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(displayTelefono)}</p>
        ${projectHtml}
        <p><strong>Asunto:</strong> ${escapeHtml(asunto)}</p>
        <p><strong>Mensaje:</strong></p>
        <p style="white-space: pre-wrap">${escapeHtml(mensaje)}</p>
        ${summaryHtml}
      </body></html>`;
      const text = `Nueva consulta desde Sollahms Web\n\nNombre: ${nombre}\nCorreo: ${correo}\nTeléfono: ${displayTelefono}\n${projectText}Asunto: ${asunto}\nMensaje:\n${mensaje}${summary.length ? `\n\n${summary.join('\n')}` : ''}`;
      try {
        const response = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Sollahms Web <formularios@forms.sollahms.cl>', to: ['contacto@sollahms.cl'],
            reply_to: correo, subject: safeSubject(asunto), html, text,
          }),
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error('Email provider rejected request');
        const accepted = await response.json();
        if (!accepted || typeof accepted.id !== 'string' || !accepted.id.trim()) throw new Error('Email provider did not confirm acceptance');
        return json({ ok: true }, 200);
      } catch {
        return json({ error: 'No pudimos enviar el mensaje. Inténtalo más tarde.' }, 502);
      }
    },
  };
}

export default createContactHandler();
