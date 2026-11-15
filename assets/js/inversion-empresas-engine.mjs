/** Educational split of purchase price, no bank conditions or persistence. */
export function splitCapital(price, percent) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || price > 100000000) throw new RangeError('Ingresa un precio mayor que 0 y de hasta 100.000.000 UF.');
  if (typeof percent !== 'number' || !Number.isFinite(percent) || percent < 0 || percent > 80) throw new RangeError('Ingresa un porcentaje entre 0 y 80.');
  const debt = price * percent / 100;
  return { equity: price - debt, debt };
}
