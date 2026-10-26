import projects from '../data/advisory-projects.json' with { type: 'json' };
import { readOperationKey } from '../lib/form-operation-server.mjs';
import { normalizeRut, RUT_ERROR } from '../assets/js/rut.mjs';

const goals = { '': 'Sin especificar', patrimonio: 'Aumentar mi patrimonio', diversificar: 'Diversificar mis inversiones', propiedad: 'Una propiedad en particular', orientacion: 'Aún lo estoy definiendo' };
const allowed = new Set(['nombre', 'rut', 'medio', 'correo', 'telefono', 'objetivo', 'mensaje', 'consent', 'website', 'startedAt', 'proyecto']);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const escape = value => value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const uncertain = () => json({ ok: false, code: 'contact_outcome_unknown', error: 'No pudimos confirmar el envío. Tus datos siguen aquí. Reintenta sin cambiarlos o escribe a contacto@sollahms.cl para verificar la solicitud.' }, 502);

export function createAdvisoryHandler({ fetchImpl = (...args) => fetch(...args), now = Date.now,
  getApiKey = () => process.env.RESEND_API_KEY, getDeliveryMode = () => process.env.CONTACT_DELIVERY_MODE,
  getEnvironment = () => process.env.VERCEL_ENV, projectIndex = projects } = {}) {
  return { async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
    if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') || '')) return json({ error: 'Formato no admitido.' }, 415);
    const origin = request.headers.get('origin');
    if (origin !== null && origin !== new URL(request.url).origin) return json({ error: 'Origen no permitido.' }, 403);
    if (Number(request.headers.get('content-length')) > 8192) return json({ error: 'Reduce el mensaje e inténtalo nuevamente.' }, 413);
    let body;
    try {
      const reader = request.body?.getReader(); if (!reader) return json({ error: 'Revisa el formulario.' }, 400);
      let size = 0; const chunks = [];
      while (true) { const {done,value} = await reader.read(); if (done) break; size += value.length; if (size > 8192) { await reader.cancel(); return json({ error: 'Reduce el mensaje e inténtalo nuevamente.' }, 413); } chunks.push(value); }
      const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
      body = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
    } catch { return json({ error: 'No pudimos leer la solicitud. Revisa el formulario.' }, 400); }
    if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).some(k => !allowed.has(k)) || Object.entries(body).some(([k,v]) => !['consent','startedAt'].includes(k) && typeof v !== 'string')) return json({ error: 'Revisa los datos del formulario.' }, 400);
    if (body.website?.trim()) return json({ error: 'No pudimos validar la solicitud.' }, 400);
    const nombre = (body.nombre || '').trim(), correo = (body.correo || '').trim(), telefono = (body.telefono || '').trim(), mensaje = (body.mensaje || '').trim();
    const objetivo = body.objetivo || '', medio = body.medio;
    const errors = {};
    if (!nombre || nombre.length > 100 || /[\u0000-\u001f\u007f]/.test(nombre)) errors.nombre = 'Escribe tu nombre.';
    const rut=normalizeRut(body.rut??'');
    if(rut===null)errors.rut=RUT_ERROR;
    if (!['correo','telefono'].includes(medio)) errors.medio = 'Elige cómo prefieres que te contactemos.';
    if (medio === 'correo' && (!/^[^\s@<>(),;:"\\]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]{2,63}$/i.test(correo) || correo.length > 254 || /[\u0000-\u001f\u007f]/.test(correo))) errors.correo = 'Escribe un correo válido, por ejemplo nombre@ejemplo.cl.';
    if (medio === 'telefono' && (!/^[+()\d .-]+$/.test(telefono) || telefono.length > 30 || (telefono.match(/\d/g)||[]).length < 9 || (telefono.match(/\d/g)||[]).length > 15)) errors.telefono = 'Escribe un teléfono válido con código de país.';
    // Only the chosen contact channel is collected, never a hidden second value.
    if ((medio === 'correo' && telefono) || (medio === 'telefono' && correo)) return json({ error: 'Envía sólo el medio de contacto elegido.' }, 400);
    if (!Object.hasOwn(goals, objetivo)) errors.objetivo = 'Revisa el objetivo seleccionado.';
    if (mensaje.length > 2000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(mensaje)) errors.mensaje = 'Usa hasta 2.000 caracteres en tu mensaje.';
    if (body.consent !== true) errors.consent = 'Autoriza el uso de tus datos para responder la solicitud.';
    if (Object.keys(errors).length) return json({ error: 'Revisa los campos indicados.', fieldErrors: errors }, 400);
    if (!Number.isSafeInteger(body.startedAt) || now() - body.startedAt < 2000 || now() - body.startedAt > 86_400_000) return json({ error: 'Revisa tus datos y vuelve a enviar. Si la página lleva abierta más de un día, copia tu mensaje antes de actualizarla.' }, 400);
    if (body.proyecto !== undefined && !Object.hasOwn(projectIndex, body.proyecto)) return json({ code: 'invalid_project', error: 'No pudimos identificar el proyecto. Abre nuevamente la consulta desde su ficha.' }, 400);
    if (getEnvironment() === 'preview') return json({ code: 'preview_read_only', error: 'La vista previa no envía solicitudes reales.' }, 503);
    const operation = readOperationKey(request, now());
    if (operation.error) return json(operation.error, operation.status);
    if (!operation.key) return json({ error: 'No pudimos identificar la solicitud. Actualiza la página antes de enviarla.' }, 400);
    // Same authorized channel, sender and recipient as the existing contact flow.
    // Fail closed if a different channel is configured; this endpoint cannot activate CRM.
    if (getDeliveryMode() !== 'resend' || !getApiKey()?.trim()) return json({ code:'contact_configuration_unavailable', error:'El formulario no está disponible. Conserva tu mensaje o escribe a contacto@sollahms.cl.' }, 503);
    const lines = ['Solicitud de asesoría desde Sollahms', '', 'Nombre: '+nombre, 'Medio preferido: '+(medio === 'correo' ? 'Correo electrónico' : 'Llamada telefónica'), (medio === 'correo' ? 'Correo: '+correo : 'Teléfono: '+telefono), 'Objetivo: '+goals[objetivo]];
    if(rut)lines.splice(3,0,'RUT: '+rut);
    if (body.proyecto) lines.push('Proyecto: '+projectIndex[body.proyecto], 'Identificador: '+body.proyecto);
    lines.push('Mensaje: '+(mensaje || 'Sin mensaje adicional.'), '', 'Consentimiento: autorizado para responder esta solicitud y, si se proporcionó RUT, identificar al interesado y dar continuidad a la evaluación solicitada conforme a la política de privacidad. Sin autorización de marketing.', 'Esta solicitud no reserva una propiedad ni confirma una cita.');
    const email = { from:'Sollahms Web <formularios@forms.sollahms.cl>', to:['contacto@sollahms.cl'], subject:'Solicitud de asesoría desde Sollahms', text:lines.join('\n'), html:'<!doctype html><html lang="es"><body><h1>Solicitud de asesoría</h1><p style="white-space:pre-wrap">'+escape(lines.slice(2).join('\n'))+'</p></body></html>', ...(medio === 'correo' ? {reply_to:correo} : {}) };
    try {
      const response = await fetchImpl('https://api.resend.com/emails', {method:'POST',headers:{Authorization:'Bearer '+getApiKey().trim(),'Content-Type':'application/json','Idempotency-Key':'advisory/'+operation.key},body:JSON.stringify(email),signal:AbortSignal.timeout(10_000)});
      if (response.status === 409) {
        const result = await response.json().catch(()=>({}));
        return json({ ok:false, code:result.name === 'concurrent_idempotent_requests' ? 'contact_in_progress' : 'operation_conflict', error:result.name === 'concurrent_idempotent_requests' ? 'La solicitud sigue en curso. Espera un momento y reintenta sin cambiar los datos.' : 'Confirma esta solicitud con contacto@sollahms.cl antes de volver a enviarla.' },409);
      }
      if (!response.ok) return uncertain();
      const accepted = await response.json();
      if (typeof accepted?.id !== 'string' || !accepted.id.trim()) return uncertain();
      return json({ok:true,providerAccepted:true,deliveryConfirmed:false});
    } catch { return uncertain(); }
  }};
}
export default createAdvisoryHandler();
