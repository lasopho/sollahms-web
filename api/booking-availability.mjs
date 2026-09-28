import { callBookingBackend, hasOnlyKeys, json, readJson, validateSlot } from '../lib/booking-server.mjs';

export default {
  async fetch(request) {
    const parsed = await readJson(request);
    if (parsed.error) return parsed.error;
    const body = parsed.body;
    if (!hasOnlyKeys(body, ['date', 'time'])) return json({ ok: false, error: 'Revisa la fecha y hora.' }, 400);
    const slot = validateSlot(body.date, body.time);
    if (!slot) return json({ ok: false, error: 'Elige una fecha y hora futuras de lunes a viernes, entre 09:00 y 21:30.' }, 400);

    const result = await callBookingBackend({ action: 'availability', ...slot });
    if (!result) return json({ ok: false, error: 'No pudimos comprobar la disponibilidad. Inténtalo más tarde.' }, 502);
    if (result.status < 200 || result.status >= 300 || result.body.ok !== true || typeof result.body.available !== 'boolean') {
      return json({ ok: false, error: 'No pudimos comprobar la disponibilidad. Inténtalo más tarde.' }, 502);
    }
    return json({ ok: true, available: result.body.available });
  },
};
