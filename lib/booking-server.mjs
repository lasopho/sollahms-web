const MAX_BODY_BYTES = 8_192;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const EMAIL = /^[^\s@<>(),;:"\\[\].]+(?:\.[^\s@<>(),;:"\\[\].]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const CHILE_TIME = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Santiago',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export async function readJson(request) {
  if (request.method !== 'POST') return { error: json({ ok: false, error: 'Método no permitido.' }, 405, { Allow: 'POST' }) };
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') || '')) {
    return { error: json({ ok: false, error: 'Formato no admitido.' }, 415) };
  }

  const length = request.headers.get('content-length');
  if (length && Number(length) > MAX_BODY_BYTES) return { error: json({ ok: false, error: 'Solicitud demasiado grande.' }, 413) };

  try {
    const reader = request.body?.getReader();
    if (!reader) return { error: json({ ok: false, error: 'Solicitud inválida.' }, 400) };
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return { error: json({ ok: false, error: 'Solicitud demasiado grande.' }, 413) };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid JSON object');
    return { body };
  } catch {
    return { error: json({ ok: false, error: 'Solicitud inválida.' }, 400) };
  }
}

export function hasOnlyKeys(body, keys) {
  return Object.keys(body).every(key => keys.includes(key)) && keys.every(key => Object.hasOwn(body, key));
}

export function validateSlot(date, time, now = new Date()) {
  if (typeof date !== 'string' || typeof time !== 'string') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:09|1\d|20|21):(?:00|30)$/.test(time)) return null;

  const [year, month, day] = date.split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== day) return null;
  const weekday = calendarDate.getUTCDay();
  if (weekday === 0 || weekday === 6) return null;

  const parts = Object.fromEntries(CHILE_TIME.formatToParts(now).map(part => [part.type, part.value]));
  const todayAndTime = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  if (`${date}T${time}` <= todayAndTime) return null;
  return { date, time };
}

export function validatePerson(body) {
  const fields = ['nombre', 'apellido', 'correo', 'telefono'];
  if (fields.some(key => typeof body[key] !== 'string')) return null;
  const nombre = body.nombre.trim().replace(/ +/g, ' ');
  const apellido = body.apellido.trim().replace(/ +/g, ' ');
  const correo = body.correo.trim();
  const telefono = body.telefono.trim();
  if ([nombre, apellido].some(value => !value || value.length > 100 || CONTROL_CHARACTERS.test(value) || /[<>]/.test(value))) return null;
  if (!correo || correo.length > 254 || CONTROL_CHARACTERS.test(correo) || !EMAIL.test(correo)) return null;
  if (!/^[+()\d .-]{7,30}$/.test(telefono) || (telefono.match(/\d/g) || []).length < 7) return null;
  return { nombre, apellido, correo, telefono };
}

export async function callBookingBackend(data) {
  const rawUrl = process.env.BOOKING_BACKEND_URL;
  const secret = process.env.BOOKING_SECRET;
  if (!rawUrl || !secret) return null;

  let url;
  try {
    url = new URL(rawUrl);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
  } catch {
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...data, secret }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    const text = await response.text();
    if (text.length > 16_384) return null;
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    return { status: response.status, body };
  } catch {
    return null;
  }
}

export function isSlotUnavailable(result) {
  return result.status === 409 || (result.body.ok === true && result.body.booked === false && result.body.available === false);
}
