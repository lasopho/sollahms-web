const pesos = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

/** Whole Chilean pesos only. Never strip invalid characters into a valid amount. */
export function parseClpAmount(value, { max = 1_000_000_000_000, label = 'Monto' } = {}) {
  const invalid = () => new RangeError(`${label}: ingresa pesos enteros y no negativos, por ejemplo $5.000.000.`);
  if (typeof value !== 'string') throw invalid();
  const text = value.trim();
  if (!text) return 0;
  if (!/^\$?\s*(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(text)) throw invalid();
  const amount = Number(text.replace(/^\$\s*/, '').replace(/\./g, ''));
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > max) {
    throw new RangeError(`${label}: ingresa un monto entre $0 y ${formatClpAmount(max)}.`);
  }
  return amount;
}

export function formatClpAmount(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('El monto debe ser un número entero de pesos no negativos.');
  return '$' + pesos.format(value);
}
