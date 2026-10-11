// Shared by the contact form and its server handler. No external lookup is used.
export const RUT_ERROR = 'Ingresa un RUT válido con su dígito verificador.';

// Canonical body-DV string; empty string means omitted, null means invalid.
export function normalizeRut(value) {
  if (typeof value !== 'string') return null;
  const input = value.trim().toUpperCase();
  if (!input) return '';
  if (input.length > 14 || !/^[0-9.K-]+$/.test(input)) return null;
  const match = /^([0-9.]+)-?([0-9K])$/.exec(input);
  if (!match) return null;
  const rawBody = match[1];
  if (rawBody.includes('.') && !/^\d{1,3}(?:\.\d{3}){1,2}$/.test(rawBody)) return null;
  const digits = rawBody.replaceAll('.', '');
  if (!/^\d{1,8}$/.test(digits)) return null;
  const body = digits.replace(/^0+/, '');
  if (!body) return null;
  let sum = 0;
  let weight = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * weight;
    weight = weight === 7 ? 2 : weight + 1;
  }
  const remainder = 11 - (sum % 11);
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return match[2] === expected ? body + '-' + expected : null;
}
