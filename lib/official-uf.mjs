import { getUfStatus } from '../assets/js/mortgage-data.mjs';
import { chileDate } from '../assets/js/project-finance.mjs';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const UF_CACHE_MS = 60 * 60 * 1000;
export const UF_FAILURE_RETRY_MS = 30 * 1000;
export const UF_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 512 * 1024;

export function officialUfUrl(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date) throw new Error('Invalid UF date');
  return `https://www.sii.cl/valores_y_fechas/uf/uf${date.slice(0, 4)}.htm`;
}
function textOnly(value) {
  // Only the tiny tag set present in the official numeric cells is permitted.
  if (/<(?!\/?(?:strong|b)\b)[^>]*>/i.test(value)) throw new Error('Unexpected UF cell markup');
  return value.replace(/<\/?(?:strong|b)\b[^>]*>/gi, '').replace(/&nbsp;|&#160;/gi, ' ').trim();
}
function pesos(value) {
  const plain = textOnly(value);
  if (!/^\d{1,3}(?:\.\d{3})+,\d{2}$/.test(plain)) throw new Error('Invalid official UF amount');
  const number = Number(plain.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(number) || number < 1000 || number > 1_000_000) throw new Error('Official UF amount out of bounds');
  return number;
}

/** Parse one exact calendar day, and require agreement with SII's annual table. */
export function parseOfficialUfHtml(html, date) {
  const sourceUrl = officialUfUrl(date);
  if (typeof html !== 'string' || Buffer.byteLength(html) > MAX_HTML_BYTES) throw new Error('Official UF response too large');
  const [year, month, day] = date.split('-').map(Number);
  const headings = [...html.matchAll(/<h2\b[^>]*>\s*UF\s+(\d{4})\s*<\/h2>/gi)];
  if (headings.length !== 1 || Number(headings[0][1]) !== year) throw new Error('Official UF year mismatch');
  const blocks = [...html.matchAll(new RegExp(`<div\\b[^>]*\\bid=['"]mes_${MONTHS[month - 1]}['"][^>]*>([\\s\\S]*?)<\\/table>`, 'gi'))];
  if (blocks.length !== 1) throw new Error('Official UF month missing or ambiguous');
  const pairs = [...blocks[0][1].matchAll(/<th\b[^>]*>((?:(?!<\/?t[hd]\b)[\s\S])*?)<\/th>\s*<td\b[^>]*>((?:(?!<\/?t[hd]\b)[\s\S])*?)<\/td>/gi)];
  const found = pairs.filter(pair => textOnly(pair[1]) === String(day));
  if (found.length !== 1) throw new Error('Official UF day missing or ambiguous');
  const valueClp = pesos(found[0][2]);
  const annual = [...html.matchAll(/<table\b[^>]*\bid=['"]table_export['"][^>]*>([\s\S]*?)<\/table>/gi)];
  if (annual.length !== 1) throw new Error('Official UF annual table missing or ambiguous');
  const annualRows = [...annual[0][1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(row => [...row[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)].map(cell => cell[1]));
  const annualDay = annualRows.filter(cells => textOnly(cells[0] ?? '') === String(day));
  if (annualDay.length !== 1 || annualDay[0].length !== 13 || pesos(annualDay[0][month]) !== valueClp) throw new Error('Official UF tables disagree');
  return { date, valueClp, source: { url: sourceUrl, title: `Servicio de Impuestos Internos — valores UF ${year}`, verifiedAt: date } };
}

async function boundedHtml(response) {
  const type = response.headers.get('content-type') || '';
  if (!/^text\/html(?:\s*;|\s*$)/i.test(type)) throw new Error('Invalid official UF content type');
  if (Number(response.headers.get('content-length')) > MAX_HTML_BYTES) throw new Error('Official UF response too large');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty official UF response');
  const chunks = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_HTML_BYTES) { await reader.cancel(); throw new Error('Official UF response too large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/** No API key, user-supplied URL/date, database or paid indicator service. */
export function createOfficialUfService({ fetchImpl = (...args) => fetch(...args), now = Date.now, timeoutMs = UF_TIMEOUT_MS } = {}) {
  let cached = null, pending = null, failed = null;
  async function resolve() {
    const startedAt = now(), date = chileDate(new Date(startedAt));
    if (cached?.uf.date === date && startedAt - cached.fetchedAt < UF_CACHE_MS) return structuredClone(cached.uf);
    if (failed?.date === date && startedAt - failed.at < UF_FAILURE_RETRY_MS) throw new Error('Official UF temporarily unavailable');
    if (pending?.date === date) return pending.promise;
    const current = { date, promise: null };
    current.promise = (async () => {
      const controller = new AbortController();
      let timer;
      try {
        const response = await Promise.race([
          Promise.resolve().then(() => fetchImpl(officialUfUrl(date), { method: 'GET', cache: 'no-store', redirect: 'error', signal: controller.signal, headers: { Accept: 'text/html' } })).then(async response => {
            if (!response.ok || (response.url && response.url !== officialUfUrl(date))) throw new Error('Invalid official UF response');
            return parseOfficialUfHtml(await boundedHtml(response), date);
          }),
          new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('Official UF timeout')); }, timeoutMs); }),
        ]);
        // A request crossing Chilean midnight must never publish yesterday as today.
        if (!getUfStatus(response, new Date(now())).usable) throw new Error('Official UF date changed during request');
        cached = { uf: response, fetchedAt: now() }; failed = null;
        return structuredClone(response);
      } catch (error) { failed = { date, at: now() }; throw error; }
      finally { clearTimeout(timer); if (pending === current) pending = null; }
    })();
    pending = current;
    return current.promise;
  }
  return { resolve };
}
