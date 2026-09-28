import { callBookingBackend, hasOnlyKeys, isSlotUnavailable, json, readJson, validatePerson, validateSlot } from '../lib/booking-server.mjs';

export default {
  async fetch(request) {
    const parsed = await readJson(request);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    if (!hasOnlyKeys(body, ['date', 'time', 'nombre', 'apellido', 'correo', 'telefono', 'website']) || typeof body.website !== 'string' || body.website.length > 200) {
      return json({ ok: false, error: 'Revisa los datos de la reserva.' }, 400);
    }
    const slot = validateSlot(body.date, body.time);
    const person = validatePerson(body);
    if (!slot || !person) return json({ ok: false, error: 'Revisa los datos y selecciona un horario válido.' }, 400);
    if (body.website.trim()) return json({ ok: true, booked: true });

    const result = await callBookingBackend({ action: 'book', ...slot, ...person });
    if (!result) return json({ ok: false, error: 'No pudimos completar la reserva. Inténtalo más tarde.' }, 502);
    if (isSlotUnavailable(result)) return json({ ok: false, code: 'slot_unavailable' }, 409);
    if (result.status < 200 || result.status >= 300 || result.body.ok !== true || result.body.booked !== true || result.body.available !== true) {
      return json({ ok: false, error: 'No pudimos completar la reserva. Inténtalo más tarde.' }, 502);
    }
    return json({ ok: true, booked: true });
  },
};
