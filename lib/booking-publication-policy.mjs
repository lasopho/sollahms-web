// Public reservation endpoints stay closed until a future reviewed code change.
// This handler deliberately ignores request, environment, ledger and providers.
export const requestOnlyBookingHandler = Object.freeze({
  async fetch() {
    return new Response(JSON.stringify({
      ok: false,
      code: 'booking_not_certified',
      mode: 'request-only',
      error: 'Las reservas automáticas no están habilitadas. Puedes solicitar asesoría en /contacto.html; la consulta no confirma una cita.',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  },
});
