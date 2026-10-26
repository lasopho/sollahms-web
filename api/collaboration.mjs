import {validateCollaboration, normalizeCollaboration, collaborationLines, COLLABORATION_TYPES} from '../assets/js/collaboration-fields.mjs';
import { readOperationKey } from '../lib/form-operation-server.mjs';


const allowed = new Set(['tipo','correo','telefono','consent','website','startedAt']);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const escape = value => value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const uncertain = () => json({ ok: false, code: 'contact_outcome_unknown', error: 'No pudimos confirmar el envío. Tus datos siguen aquí. Reintenta sin cambiarlos o escribe a contacto@sollahms.cl para verificar la solicitud.' }, 502);

export function createCollaborationHandler({ fetchImpl = (...args) => fetch(...args), now = Date.now,
  getApiKey = () => process.env.RESEND_API_KEY, getDeliveryMode = () => process.env.CONTACT_DELIVERY_MODE,
  getEnvironment = () => process.env.VERCEL_ENV } = {}) {
  return { async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
    if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') || '')) return json({ error: 'Formato no admitido.' }, 415);
    const origin = request.headers.get('origin');
    if (origin !== null && origin !== new URL(request.url).origin) return json({ error: 'Origen no permitido.' }, 403);
    if (Number(request.headers.get('content-length')) > 16384) return json({ error: 'Reduce el mensaje e inténtalo nuevamente.' }, 413);
    let body;
    try {
      const reader = request.body?.getReader(); if (!reader) return json({ error: 'Revisa el formulario.' }, 400);
      let size = 0; const chunks = [];
      while (true) { const {done,value} = await reader.read(); if (done) break; size += value.length; if (size > 16384) { await reader.cancel(); return json({ error: 'Reduce el mensaje e inténtalo nuevamente.' }, 413); } chunks.push(value); }
      const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
      body = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
    } catch { return json({ error: 'No pudimos leer la solicitud. Revisa el formulario.' }, 400); }
    if (!body || Array.isArray(body) || typeof body !== 'object' || Object.keys(body).some(k => !allowed.has(k)) || Object.entries(body).some(([k,v]) => !['consent','startedAt'].includes(k) && typeof v !== 'string')) return json({ error: 'Revisa los datos del formulario.' }, 400);
    if (body.website?.trim()) return json({ error: 'No pudimos validar la solicitud.' }, 400);
    const errors=validateCollaboration(body);
    if (Object.keys(errors).length) return json({ error: 'Revisa los campos indicados.', fieldErrors: errors }, 400);
    if (!Number.isSafeInteger(body.startedAt) || now() - body.startedAt < 2000 || now() - body.startedAt > 86_400_000) return json({ error: 'Revisa tus datos y vuelve a enviar. Si la página lleva abierta más de un día, copia tu mensaje antes de actualizarla.' }, 400);
    if (getEnvironment() === 'preview') return json({ code: 'preview_read_only', error: 'La vista previa no envía solicitudes reales.' }, 503);
    const operation = readOperationKey(request, now());
    if (operation.error) return json(operation.error, operation.status);
    if (!operation.key) return json({ error: 'No pudimos identificar la solicitud. Actualiza la página antes de enviarla.' }, 400);
    // Same authorized channel, sender and recipient as the existing contact flow.
    // Fail closed if a different channel is configured; this endpoint cannot activate CRM.
    if (getDeliveryMode() !== 'resend' || !getApiKey()?.trim()) return json({ code:'contact_configuration_unavailable', error:'El formulario no está disponible. Conserva tu mensaje o escribe a contacto@sollahms.cl.' }, 503);
    const data=normalizeCollaboration(body), lines=collaborationLines(data);
    const subject=COLLABORATION_TYPES[data.tipo];
    const email={from:'Sollahms Web <formularios@forms.sollahms.cl>',to:['contacto@sollahms.cl'],...(data.correo?{reply_to:data.correo}:{}),subject,text:lines.join('\n'),html:'<!doctype html><html lang="es"><body><h1>'+subject+'</h1><p style="white-space:pre-wrap">'+escape(lines.join('\n'))+'</p></body></html>'};
    try {
      const response = await fetchImpl('https://api.resend.com/emails', {method:'POST',headers:{Authorization:'Bearer '+getApiKey().trim(),'Content-Type':'application/json','Idempotency-Key':'collaboration/'+operation.key},body:JSON.stringify(email),signal:AbortSignal.timeout(10_000)});
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
export default createCollaborationHandler();
