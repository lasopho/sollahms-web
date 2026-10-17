import { callBookingBackend, hasOnlyKeys, isSlotUnavailable, json, readJson, validatePerson, validateSlot } from '../lib/booking-server.mjs';
import { projects, projectAliases, projectStages } from '../lib/project-context.mjs';
import { createOperationLedger, readOperationKey } from '../lib/form-operation-server.mjs';

export function createBookingHandler({ callBackend = callBookingBackend, now = Date.now, getEnvironment = () => process.env.VERCEL_ENV, ledger = createOperationLedger({ now }) } = {}) {
return {
  async fetch(request) {
    const parsed = await readJson(request);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    const hasProject = Object.hasOwn(body, 'proyecto');
    const requiredKeys = ['date', 'time', 'nombre', 'apellido', 'correo', 'telefono', 'website'];
    const acceptedKeys = hasProject ? [...requiredKeys, 'proyecto'] : requiredKeys;
    if (!hasOnlyKeys(body, acceptedKeys) || typeof body.website !== 'string' || body.website.length > 200) {
      return json({ ok: false, error: 'Revisa los datos de la reserva.' }, 400);
    }
    const project = typeof body.proyecto === 'string' && Object.hasOwn(projects, body.proyecto)
      ? projects[body.proyecto]
      : typeof body.proyecto === 'string' && Object.hasOwn(projectAliases, body.proyecto)
        && Object.hasOwn(projectStages, body.proyecto)
        && projectAliases[body.proyecto].slug === projectStages[body.proyecto].slug
        && projectStages[body.proyecto].stageSlug === body.proyecto
        && Object.hasOwn(projects, projectStages[body.proyecto].slug)
        ? projectStages[body.proyecto] : null;
    if (hasProject && !project) {
      return json({ ok: false, error: 'Revisa el proyecto de la reserva.' }, 400);
    }
    const slot = validateSlot(body.date, body.time, new Date(now()));
    const person = validatePerson(body);
    if (!slot || !person) return json({ ok: false, error: 'Revisa los datos y selecciona un horario válido.' }, 400);
    if (getEnvironment() === 'preview') {
      return json({ ok: false, code: 'preview_read_only', error: 'La vista previa no envía reservas reales. Puedes revisar el formulario sin confirmar una asesoría.' }, 503);
    }
    if (body.website.trim()) return json({ ok: true, booked: true });
    const operation = readOperationKey(request, now());
    if (operation.error) return json({ ok: false, ...operation.error }, operation.status);

    const projectContext = hasProject ? { proyecto: body.proyecto, nombreProyecto: project.name } : {};
    // The private Apps Script contract cannot yet be inspected. Preserve its
    // legacy body exactly; operationId propagation and atomic storage remain
    // blocked together until that backend can be implemented and verified.
    const payload = { action: 'book', ...slot, ...person, ...projectContext };
    const outcome = await ledger.run(operation.key, payload, async () => {
      const result = await callBackend(payload);
      const unknown = { status: 502, body: operation.key
        ? { ok: false, code: 'booking_outcome_unknown', error: 'No pudimos confirmar el resultado. No repitas la reserva; escribe a contacto@sollahms.cl para verificarla.' }
        : { ok: false, error: 'No pudimos completar la reserva. Inténtalo más tarde.' } };
      if (!result) return unknown;
      if (isSlotUnavailable(result)) return { status: 409, body: { ok: false, code: 'slot_unavailable' } };
      if (result.status < 200 || result.status >= 300 || result.body.ok !== true || result.body.booked !== true || result.body.available !== true) return unknown;
      return { status: 200, body: { ok: true, booked: true } };
    });
    return json(outcome.body, outcome.status);
  },
};
}

export default createBookingHandler();
