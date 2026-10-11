import test from 'node:test';
import assert from 'node:assert/strict';
import { createOfficialUfService, officialUfUrl, parseOfficialUfHtml, UF_CACHE_MS, UF_FAILURE_RETRY_MS } from '../lib/official-uf.mjs';
import { createUfHandler } from '../api/uf.mjs';
import { loadOfficialUf } from '../assets/js/official-uf.mjs';
import { getUfStatus } from '../assets/js/mortgage-data.mjs';
import { chileDate } from '../assets/js/project-finance.mjs';

const NOW = Date.parse('2026-10-11T15:00:00Z');
const DATE = '2026-10-11';
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
// Minimal official table structure; values independently transcribed from SII.
function html(date = DATE, amount = '41.141,53') {
  const [year, month, day] = date.split('-').map(Number);
  return `<h2 class="title">UF ${year}</h2><div class='meses' id='mes_${MONTHS[month - 1]}'><table><tbody><tr><th colspan='6'><h2>${MONTHS[month - 1]}</h2></th></tr><tr><th><strong>${day}</strong></th><td>${amount}</td></tr></tbody></table></div><table id="table_export"><tbody><tr><th>${day}</th>${Array.from({ length: 12 }, (_, i) => `<td>${i === month - 1 ? amount : '&nbsp;'}</td>`).join('')}</tr></tbody></table>`;
}
const response = value => new Response(value, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
const uf = (date = DATE) => parseOfficialUfHtml(html(date), date);
const request = (url = 'https://sollahms.cl/api/uf', method = 'GET') => new Request(url, { method });

test('SII exact Chilean decimal/day/month/year and annual table agree', () => {
  assert.equal(uf().valueClp, 41141.53);
  assert.equal(uf().date, DATE);
  assert.equal(uf().source.url, 'https://www.sii.cl/valores_y_fechas/uf/uf2026.htm');
  assert.equal(uf().source.verifiedAt, DATE);
  assert.equal(getUfStatus(uf(), DATE).usable, true);
  assert.equal(officialUfUrl('2027-01-01'), 'https://www.sii.cl/valores_y_fechas/uf/uf2027.htm');
});
test('strict parser rejects ambiguous tables, wrong year/month/day, missing values and injected markup', () => {
  const base = html();
  const malformed = [base.replace('UF 2026', 'UF 2025'), base.replace('mes_octubre', 'mes_septiembre'), base.replace('<strong>11', '<strong>10'), base + base,
    base.replace('41.141,53', ''), base.replace('41.141,53', '41141.53'), base.replace('41.141,53', '41,141.53'), base.replace('41.141,53', '41.141,530'),
    base.replace('41.141,53', '<script>41141.53</script>'), base.replace('41.141,53', '0,00'), base.replace('41.141,53', '999.999.999,00'),
    base.replace('</tbody></table></div>', '<tr><th>11</th><td>41.141,53</td></tr></tbody></table></div>'),
    base.replace('id="table_export"', 'id="wrong_table"'), base.replace(/41\.141,53(?=[\s\S]*$)/, '41.000,00')];
  for (const source of malformed) assert.throws(() => parseOfficialUfHtml(source, DATE));
  for (const date of ['2026-02-30', '2026-13-11', 'now', '../2026', null]) assert.throws(() => parseOfficialUfHtml(base, date));
});
test('bounded streaming refuses oversized, non-HTML, redirect and invalid UTF-8 sources', async () => {
  for (const result of [new Response(html(), { headers: { 'Content-Type': 'application/json' } }), new Response('x'.repeat(512 * 1024 + 1), { headers: { 'Content-Type': 'text/html' } }),
    new Response(html(), { headers: { 'Content-Type': 'text/html', 'Content-Length': '600000' } }), new Response(new Uint8Array([255]), { headers: { 'Content-Type': 'text/html' } }), new Response('Moved', { status: 302, headers: { Location: 'https://bad.example' } })]) {
    const service = createOfficialUfService({ now: () => NOW, fetchImpl: async () => result });
    await assert.rejects(service.resolve());
  }
});
test('single-flight and same-day cache preserve official source allowlist and no paid credentials', async () => {
  let count = 0, release; const calls = [];
  const service = createOfficialUfService({ now: () => NOW, fetchImpl: async (url, options) => { count++; calls.push({ url, options }); await new Promise(resolve => { release = resolve; }); return response(html()); } });
  const pending = Array.from({ length: 10 }, () => service.resolve());
  await Promise.resolve(); assert.equal(count, 1); release();
  const results = await Promise.all(pending);
  for (const result of results) assert.deepEqual(result, uf());
  assert.deepEqual(await service.resolve(), uf()); assert.equal(count, 1);
  assert.equal(calls[0].url, officialUfUrl(DATE)); assert.equal(calls[0].options.redirect, 'error');
  assert.deepEqual(calls[0].options.headers, { Accept: 'text/html' });
  results[0].valueClp = 1; assert.equal((await service.resolve()).valueClp, 41141.53);
});
test('success cache expires and a fetch error never makes stale UF current', async () => {
  let now = NOW, calls = 0;
  const service = createOfficialUfService({ now: () => now, fetchImpl: async () => { calls++; if (calls === 2) throw new Error('Offline'); return response(html(chileDate(new Date(now)))); } });
  await service.resolve(); now += UF_CACHE_MS; await assert.rejects(service.resolve()); assert.equal(calls, 2);
  now += UF_FAILURE_RETRY_MS; assert.equal((await service.resolve()).date, DATE); assert.equal(calls, 3);
});
test('timeout aborts, releases concurrency and recovers after short failure cooldown', async () => {
  let now = NOW, calls = 0, signal;
  const service = createOfficialUfService({ now: () => now, timeoutMs: 10, fetchImpl: async (_, options) => { calls++; signal = options.signal; if (calls === 1) return new Promise(() => {}); return response(html()); } });
  await assert.rejects(service.resolve(), /timeout/); assert.equal(signal.aborted, true);
  await assert.rejects(service.resolve()); assert.equal(calls, 1);
  now += UF_FAILURE_RETRY_MS;
  assert.deepEqual(await service.resolve(), uf()); assert.equal(calls, 2);
});
test('empty/invalid upstream data recovers without poisoning the successful cache', async () => {
  let now = NOW, calls = 0;
  const service = createOfficialUfService({ now: () => now, fetchImpl: async () => response(++calls === 1 ? '<html>Error temporal</html>' : html()) });
  await assert.rejects(service.resolve()); now += UF_FAILURE_RETRY_MS;
  assert.equal((await service.resolve()).valueClp, 41141.53);
});
test('America/Santiago midnight, DST and year boundary invalidate previous-date cache', async () => {
  for (const [before, after] of [['2026-10-12T02:59:59Z', '2026-10-12T03:00:00Z'], ['2026-07-12T03:59:59Z', '2026-07-12T04:00:00Z'], ['2027-01-01T02:59:59Z', '2027-01-01T03:00:00Z']]) {
    let now = Date.parse(before); const dates = [];
    const service = createOfficialUfService({ now: () => now, fetchImpl: async url => { dates.push(url); return response(html(chileDate(new Date(now)))); } });
    const first = await service.resolve(); now = Date.parse(after); const next = await service.resolve();
    assert.notEqual(first.date, next.date); assert.equal(dates.length, 2); assert.equal(getUfStatus(first, new Date(now)).usable, false); assert.equal(getUfStatus(next, new Date(now)).usable, true);
    if (next.date === '2027-01-01') assert.ok(dates[1].endsWith('uf2027.htm'));
  }
});
test('a request crossing midnight fails closed and the new day can recover immediately', async () => {
  let now = Date.parse('2026-10-12T02:59:59Z'); let calls = 0;
  const service = createOfficialUfService({ now: () => now, fetchImpl: async () => { const date = chileDate(new Date(now)); calls++; now += 2000; return response(html(date)); } });
  await assert.rejects(service.resolve(), /date changed/);
  assert.equal((await service.resolve()).date, '2026-10-12'); assert.equal(calls, 2);
});
test('public endpoint is read-only, rejects arbitrary dates/URLs, uncacheable and exposes no upstream error details', async () => {
  let calls = 0; const handler = createUfHandler({ now: () => NOW, service: { resolve: async () => { calls++; return uf(); } } });
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) assert.equal((await handler.fetch(request(undefined, method))).status, 405);
  for (const query of ['?date=2026-10-12', '?url=https://bad.example', '?']) if (query !== '?') assert.equal((await handler.fetch(request('https://sollahms.cl/api/uf' + query))).status, 400);
  assert.equal(calls, 0);
  const result = await handler.fetch(request()); assert.equal(result.status, 200); assert.equal(result.headers.get('Cache-Control'), 'private, no-store'); assert.deepEqual(await result.json(), { uf: uf() });
  const bad = createUfHandler({ now: () => NOW, service: { resolve: async () => { throw new Error('INTERNAL_PRIVATE_DETAIL'); } } });
  const failed = await bad.fetch(request()); assert.equal(failed.status, 503); assert.equal(failed.headers.get('Retry-After'), '30'); assert.ok(!(await failed.text()).includes('INTERNAL_PRIVATE_DETAIL'));
});
test('endpoint refuses stale/future/invalid values even from an injected resolver', async () => {
  for (const value of [uf('2026-10-10'), uf('2026-10-12'), { ...uf(), valueClp: 0 }, { ...uf(), source: { ...uf().source, url: 'https://sii.cl.bad.example/uf' } }]) {
    const handler = createUfHandler({ now: () => NOW, service: { resolve: async () => value } });
    assert.equal((await handler.fetch(request())).status, 503);
  }
});
test('client loads official current UF without bank references and never transmits income or savings', async () => {
  const calls = []; const result = await loadOfficialUf({ now: () => new Date(NOW), fetchImpl: async (url, options) => { calls.push({ url, options }); return new Response(JSON.stringify({ uf: uf() })); } });
  assert.deepEqual(result, uf()); assert.equal(calls.length, 1); assert.equal(calls[0].url, '/api/uf'); assert.equal(calls[0].options.body, undefined); assert.equal(calls[0].options.cache, 'no-store');
});
test('client blocks stale, future, malformed and foreign UF and recovers on a new request', async () => {
  for (const body of [{ uf: uf('2026-10-10') }, { uf: uf('2026-10-12') }, { uf: uf(), secret: 1 }, { uf: { ...uf(), source: { ...uf().source, url: 'https://thirdparty.example' } } }, {}, null]) {
    assert.equal(await loadOfficialUf({ now: () => new Date(NOW), fetchImpl: async () => new Response(JSON.stringify(body)), fallbackUf: uf('2026-10-10') }), null);
  }
  let good = false;
  const fetchImpl = async () => { if (!good) throw new Error('Temporary network failure'); return new Response(JSON.stringify({ uf: uf() })); };
  assert.equal(await loadOfficialUf({ now: () => new Date(NOW), fetchImpl }), null); good = true;
  assert.deepEqual(await loadOfficialUf({ now: () => new Date(NOW), fetchImpl }), uf());
});
test('client accepts a verified same-day snapshot during outages, but cannot carry it across midnight', async () => {
  const fetchImpl = async () => { throw new Error('Offline'); };
  assert.deepEqual(await loadOfficialUf({ now: () => new Date(NOW), fetchImpl, fallbackUf: uf() }), uf());
  assert.equal(await loadOfficialUf({ now: () => new Date('2026-10-12T03:00:00Z'), fetchImpl, fallbackUf: uf() }), null);
});

test('a synchronous fetch failure cannot leave a permanent in-flight lock', async () => {
  let now = NOW, calls = 0;
  const service = createOfficialUfService({ now: () => now, fetchImpl: () => { calls++; if (calls === 1) throw new Error('Synchronous network failure'); return Promise.resolve(response(html())); } });
  await assert.rejects(service.resolve()); now += UF_FAILURE_RETRY_MS;
  assert.equal((await service.resolve()).valueClp, 41141.53); assert.equal(calls, 2);
});
