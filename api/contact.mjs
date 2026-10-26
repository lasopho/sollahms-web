import dataset from '../data/hipotecario.json' with { type: 'json' };
import catalogue from '../data/proyectos.json' with { type: 'json' };
import {validateCommercialFields, normalizedCommercialFields} from '../assets/js/commercial-fields.mjs';
import { mortgageSummaryLines, validateMortgageLead, validFormTiming } from '../lib/mortgage-lead.mjs';
import { createOfficialUfService } from '../lib/official-uf.mjs';
import { getUfStatus } from '../assets/js/mortgage-data.mjs';
import { resolveProjectIdentity } from '../assets/js/project-identity.mjs';
import { operationFingerprint, readOperationKey } from '../lib/form-operation-server.mjs';
import { createCrmLeadClient, WEB_CRM_CONSENT } from '../lib/crm-lead-client.mjs';
// CONTACT_PUBLIC_CATALOGUE_IMPORT_START
import { projectPublicSafeCatalogue } from '../lib/public-project-view.mjs';
// CONTACT_PUBLIC_CATALOGUE_IMPORT_END

const officialUf = createOfficialUfService();
const persistWebCrmLead = createCrmLeadClient();

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
  const fieldErrors=validateCommercialFields(body);
  if(Object.keys(fieldErrors).length)return {...invalid,fieldErrors};
  const {nombre,rut,correo,telefono}=normalizedCommercialFields(body);
  const mensaje=body.mensaje?.trim()||'';
  const hipotecario=body.mortgage!==undefined;
  if (mensaje.length < (hipotecario ? 1 : 10) || mensaje.length > 5000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(mensaje)) return invalid;
  const hasProject = Object.hasOwn(body, 'proyecto');
  if (hasProject && !Object.hasOwn(projectIndex, body.proyecto)) return { code: 'invalid_project', error: 'Revisa el proyecto de la consulta.' };
  const proyecto = hasProject ? body.proyecto : '';
  const project = hasProject ? projectIndex[proyecto] : null;
  const nombreProyecto = project?.nombre || '';
  const asunto = hipotecario
    ? (nombreProyecto ? 'Asesoría hipotecaria sobre ' + nombreProyecto : 'Asesoría hipotecaria desde Sollahms')
    : (nombreProyecto ? 'Consulta sobre ' + nombreProyecto : 'Consulta desde Sollahms');
  // Required identification supplied with specific consent, never a lookup.
  return { fields: { nombre, rut, correo, telefono, asunto, mensaje, proyecto, nombreProyecto }, project };
}

export function createContactHandler({
  mortgageDataset = dataset, projectDataset = catalogue, now = Date.now,
  fetchImpl = (...args) => fetch(...args), getApiKey = () => process.env.RESEND_API_KEY,
  getEnvironment = () => process.env.VERCEL_ENV,
  resolveUf = () => officialUf.resolve(),
  // CONTACT_EXPLICIT_CHANNEL_START
  getDeliveryMode = () => process.env.CONTACT_DELIVERY_MODE,
  // CONTACT_EXPLICIT_CHANNEL_END
  persistCrmLead = persistWebCrmLead,
} = {}) {
  // Names and prices come only from the server's checked-in project catalogue.
  const projectIndex = Object.create(null);
  for (const project of projectDataset) {
    const identity = resolveProjectIdentity(projectDataset, project?.slug);
    if (identity) projectIndex[project.slug] = identity;
  }
  // Canonical roots win slug collisions. Numbered aliases use only their own
  // public snapshots, so a missing stage price cannot inherit a parent quote.
  for (const project of projectDataset) {
    if (project?.inmobiliaria !== 'Ecasa' || !Array.isArray(project.etapasComerciales)) continue;
    for (const stage of project.etapasComerciales) {
      if (!stage || Object.hasOwn(projectIndex, stage.slug)) continue;
      const identity = resolveProjectIdentity(projectDataset, stage.slug);
      if (identity) projectIndex[stage.slug] = identity;
    }
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
      const deliveryMode = getDeliveryMode();
      if (!['crm', 'resend'].includes(deliveryMode)) return json({ ok: false, code: 'contact_configuration_unavailable', error: 'El formulario no está disponible. Inténtalo más tarde.' }, 503);
      if (body.website?.trim()) return deliveryMode === 'crm'
        ? json({ ok: false, error: 'Revisa los datos del formulario.' }, 400)
        : json({ ok: true }, 200);
      const validated = validate(body, projectIndex);
      if (validated.error) return json(validated, 400);
      // CONTACT_ALL_CHANNEL_CONSENT_START
      if (body.consent !== true) return json({ ok: false, code: 'consent_required', error: 'Autoriza el tratamiento de tus datos para responder esta solicitud.' }, 400);
      // CONTACT_ALL_CHANNEL_CONSENT_END
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
      const operation = readOperationKey(request, receivedAt);
      if (operation.error) return json(operation.error, operation.status);
      if (deliveryMode === 'crm') {
        if (!operation.key) return json({ ok: false, code: 'invalid_operation', error: 'Revisa el identificador de la solicitud.' }, 400);
        const digits = (fields.telefono.match(/\d/g) || []).length;
        if (fields.telefono && (!/^[+()\d .-]+$/.test(fields.telefono) || digits < 7 || digits > 15)) return json({ ok: false, code: 'invalid_phone', error: 'Revisa el teléfono de contacto.' }, 400);
        const project = validated.project;
        const crmLead = {
          requestId: operation.key,
          kind: mortgageLead ? 'mortgage' : 'contact',
          name: fields.nombre,
          email: fields.correo,
          phone: fields.telefono,
          message: fields.mensaje + (fields.rut ? '\nRUT proporcionado para identificación y continuidad de la evaluación: '+fields.rut : ''),
          projectRef: project ? {
            slug: fields.proyecto,
            name: project.nombre,
            canonicalSlug: project.canonicalSlug,
            commercialSlug: project.originCommercialSlug,
            detailPath: project.detalleUrl,
          } : null,
          consent: { ...WEB_CRM_CONSENT },
        };
        if (mortgageLead) {
          // A deterministic UF-only snapshot needs no provider lookup. Receipt
          // time belongs to CRM storage, never to the idempotent request body.
          const summary = mortgageSummaryLines({ ...mortgageLead,
            uf: { usable: false, message: 'Se conservan valores en UF, sin consulta externa.' },
          }).filter(line => !line.startsWith('Solicitud recibida: ')).join('\n');
          if (summary.length > 4_000) return json({ ok: false, error: 'Revisa los datos de la simulación.' }, 400);
          crmLead.mortgage = { summary };
        }
        let stored;
        try { stored = await persistCrmLead(crmLead); } catch { /* preserve an uncertain operation */ }
        if (stored?.ok !== true || stored.persisted !== true) {
          if (stored?.status === 413 && stored.code === 'contact_request_too_large') return json({ ok: false,
            code: 'contact_request_too_large', error: 'La solicitud es demasiado extensa. Reduce el mensaje antes de enviarla.',
          }, 413);
          const conflict = stored?.status === 409;
          return json({ ok: false,
            code: conflict ? 'operation_conflict'
              : stored?.code === 'contact_configuration_unavailable' ? stored.code : 'contact_outcome_unknown',
            error: conflict
              ? 'Esta solicitud requiere confirmación antes de cambiar los datos. Conserva el mismo identificador.'
              : 'No pudimos confirmar el registro. Conserva los mismos datos al reintentar o escribe a contacto@sollahms.cl.',
          }, conflict ? 409 : stored?.status === 503 ? 503 : 502);
        }
        return json({ ok: true, persisted: true }, 200);
      }
      const key = getApiKey()?.trim();
      if (!key) return json({ error: 'No pudimos enviar el mensaje. Inténtalo más tarde.' }, 503);
      // The server owns CLP conversion too; a visitor never supplies a UF rate.
      // A same-day verified snapshot is safe. If stale, fetch today's official UF.
      if (mortgageLead && !mortgageLead.uf.usable) {
        try { mortgageLead.uf = getUfStatus(await resolveUf(), new Date(now())); }
        catch { mortgageLead.uf = getUfStatus(null, new Date(now())); }
      }
      const { nombre, correo, telefono, rut, asunto, mensaje, proyecto, nombreProyecto } = fields;
      const displayTelefono = telefono || 'No informado';
      // Keep the provider payload stable on a keyed retry. Transport receipt
      // time changes on every POST; the form's operation time does not.
      const summary = mortgageLead ? mortgageSummaryLines(mortgageLead).map(line => operation.key && line.startsWith('Solicitud recibida: ')
        ? 'Solicitud iniciada en el formulario: ' + new Date(Number(operation.key.split('-')[2])).toISOString() : line) : [];
      const summaryHtml = summary.length ? `<h2>Resumen hipotecario</h2><p style="white-space: pre-wrap">${escapeHtml(summary.join('\n'))}</p>` : '';
      const projectHtml = proyecto ? `<p><strong>Proyecto:</strong> ${escapeHtml(nombreProyecto)}</p><p><strong>Identificador:</strong> ${escapeHtml(proyecto)}</p>` : '';
      const projectText = proyecto ? `Proyecto: ${nombreProyecto}\nIdentificador: ${proyecto}\n` : '';
      const html = `<!doctype html><html lang="es"><body>
        <h1>Nueva consulta desde Sollahms Web</h1>
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        ${rut ? '<p><strong>RUT:</strong> '+escapeHtml(rut)+'</p>' : ''}
        <p><strong>Correo:</strong> ${escapeHtml(correo)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(displayTelefono)}</p>
        ${projectHtml}
        <p><strong>Asunto:</strong> ${escapeHtml(asunto)}</p>
        <p><strong>Mensaje:</strong></p>
        <p style="white-space: pre-wrap">${escapeHtml(mensaje)}</p>
        ${summaryHtml}
      </body></html>`;
      const text = `Nueva consulta desde Sollahms Web\n\nNombre: ${nombre}\n${rut ? 'RUT: '+rut+'\n' : ''}Correo: ${correo}\nTeléfono: ${displayTelefono}\n${projectText}Asunto: ${asunto}\nMensaje:\n${mensaje}${summary.length ? `\n\n${summary.join('\n')}` : ''}`;
      const email = {
        from: 'Sollahms Web <formularios@forms.sollahms.cl>', to: ['contacto@sollahms.cl'],
        reply_to: correo, subject: safeSubject(asunto), html, text,
      };
      // Provider-owned storage deduplicates across serverless instances. Legacy
      // callers get a business-content key for 24h; changing receipt time or UF
      // may safely conflict, but must never create a fresh key and another mail.
      const legacyMortgage = body.mortgage ? { ...body.mortgage } : null;
      if (legacyMortgage) delete legacyMortgage.simulatedAt;
      const idempotencyKey = operation.key ? 'contact/' + operation.key
        : 'contact/legacy/' + operationFingerprint({ fields, mortgage: legacyMortgage, consent: body.consent ?? null });
      try {
        const response = await fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
          body: JSON.stringify(email),
          signal: AbortSignal.timeout(10_000),
        });
        if (response.status === 409) {
          const conflict = await response.json().catch(() => ({}));
          if (conflict.name === 'concurrent_idempotent_requests') return json({ ok: false, code: 'contact_in_progress', retry: true, error: 'La solicitud está en curso. Espera un momento y vuelve a confirmar con los mismos datos.' }, 409, { 'Retry-After': '2' });
          return json({ ok: false, code: 'operation_conflict', retry: false, error: 'El resultado de esta solicitud requiere confirmación con contacto@sollahms.cl antes de volver a enviarla.' }, 409);
        }
        if (!response.ok) throw new Error('Email provider rejected request');
        const accepted = await response.json();
        if (!accepted || typeof accepted.id !== 'string' || !accepted.id.trim()) throw new Error('Email provider did not confirm acceptance');
        // CONTACT_PROVIDER_ACCEPTANCE_START
        return json({ ok: true, providerAccepted: true, deliveryConfirmed: false }, 200);
        // CONTACT_PROVIDER_ACCEPTANCE_END
      } catch {
        return json({ code: 'contact_outcome_unknown', error: 'No pudimos confirmar el envío. Conserva los mismos datos al reintentar o escribe a contacto@sollahms.cl.' }, 502);
      }
    },
  };
}

// CONTACT_PUBLIC_CATALOGUE_DEFAULT_START
// Public facts stay restricted even when no build-profile variable is present.
export default createContactHandler({ projectDataset: projectPublicSafeCatalogue(catalogue) });
// CONTACT_PUBLIC_CATALOGUE_DEFAULT_END
