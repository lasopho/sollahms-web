import test from 'node:test';
import assert from 'node:assert/strict';
import dataset from '../data/hipotecario.json' with { type: 'json' };
import { createContactHandler } from '../api/contact.mjs';
import { calculateMortgage } from '../assets/js/mortgage-engine.mjs';

const NOW = Date.parse('2026-10-09T15:00:00.000Z');
const baseContact = { nombre: 'Ana Pérez', correo: 'ana@example.com', telefono: '+56 9 1234 5678', rut: '', mensaje: 'Solicito asesoría para mi financiamiento.', website: '' };
function lead(overrides = {}) {
  return {
    ...baseContact,
    consent: true,
    startedAt: NOW - 5_000,
    mortgage: { propertyUf: 10_000, downPaymentPercent: 25, years: 25, annualRatePercent: 4.5, rateConvention: 'nominal', bankId: null, simulatedAt: new Date(NOW - 1_000).toISOString(), location: 'santiago-metropolitana', propertyValueOrigin: 'visitor' },
    ...overrides,
  };
}

function request(body, headers = {}) {
  return new Request('https://sollahms.cl/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://sollahms.cl', ...headers }, body: JSON.stringify(body) });
}

function fixtureDataset() {
  const result = structuredClone(dataset);
  result.uf = { ...result.uf, date: '2026-10-09', valueClp: 41_130.94, source: { ...result.uf.source, verifiedAt: '2026-10-09' } };
  result.institutions = [{ id: 'fixture-bank', name: 'Banco de prueba', source: { url: 'https://www.cmfchile.cl/', title: 'Institución ficticia para pruebas', verifiedAt: '2026-10-09' } }];
  result.offers = [{
    id: 'fixture-offer', institutionId: result.institutions[0].id, label: 'Escenario oficial de prueba', interestType: 'fixed', currency: 'UF',
    annualRatePercent: 4.5, rateConvention: 'nominal', availableYears: [25], minPrincipalUf: 7_500, maxPrincipalUf: 7_500,
    minFinancingPercent: 75, maxFinancingPercent: 75, validFrom: '2026-10-09', validUntil: '2026-10-09', location: 'santiago-metropolitana', requirements: ['Sujeto a evaluación crediticia.'],
    source: { url: 'https://servicios.cmfchile.cl/simuladorhipotecario', title: 'Fuente oficial de prueba', updatedAt: '2026-10-09', verifiedAt: '2026-10-09', kind: 'official-scenario' },
    scenarioCosts: { propertyUf: 10_000, downPaymentPercent: 25, years: 25, location: 'santiago-metropolitana', monthlyInsuranceUf: 1, monthlyOtherCostsUf: 0, oneTimeFeesUf: 1, caePercent: 4.7, totalCostUf: 13_000, complete: true, coverage: 'all-known', insuranceCoverage: 'life-fire-earthquake' },
  }];
  return result;
}

function harness({ mortgageDataset = fixtureDataset(), key = 'test-resend-key', provider = () => new Response(JSON.stringify({ id: 'accepted-test-email' }), { status: 200, headers: { 'Content-Type': 'application/json' } }) } = {}) {
  const sent = [];
  const handler = createContactHandler({
    mortgageDataset, now: () => NOW, getApiKey: () => key, getEnvironment: () => 'test',
    fetchImpl: async (url, options) => { sent.push({ url, options, payload: JSON.parse(options.body) }); return provider(); },
  });
  return { handler, sent };
}

test('mortgage Request reaches mock Resend with recalculated amounts, trusted UF, consent and configured recipient', async () => {
  const { handler, sent } = harness();
  const body = lead();
  const response = await handler.fetch(request(body));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(sent.length, 1);
  const { url, options, payload } = sent[0];
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(options.headers.Authorization, 'Bearer test-resend-key');
  assert.deepEqual(payload.to, ['contacto@sollahms.cl']);
  assert.equal(payload.from, 'Sollahms Web <formularios@forms.sollahms.cl>');
  assert.equal(payload.reply_to, 'ana@example.com');
  assert.equal(payload.subject, 'Asesoría hipotecaria desde Sollahms');
  const payment = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(calculateMortgage(body.mortgage).monthlyPaymentUf);
  assert.ok(payload.text.includes(`Dividendo base mensual: ${payment} UF`));
  assert.ok(payload.text.includes('41.130,94'));
  assert.ok(payload.text.includes('fecha: 2026-10-09'));
  assert.ok(payload.text.includes('Consentimiento:'));
  assert.ok(payload.text.includes('fuente: https://'));
  assert.ok(payload.text.includes('tasa ingresada para una simulación manual'));
  assert.match(payload.text, /Suma de cuotas base: [\d.,]+ UF\n/);
  assert.match(payload.text, /Intereses base: [\d.,]+ UF\n/);
  assert.ok(payload.text.includes('depende de la UF de cada fecha de pago'));
});

test('all user-provided mail values are escaped, and subject has no control characters or angle brackets', async () => {
  const { handler, sent } = harness();
  const response = await handler.fetch(request(lead({ nombre: 'Ana <b> & "Pérez"', mensaje: '<script>alert("x")</script> & asesoría' })));
  assert.equal(response.status, 200);
  assert.ok(sent[0].payload.html.includes('Ana &lt;b&gt; &amp; &quot;Pérez&quot;'));
  assert.ok(sent[0].payload.html.includes('&lt;script&gt;'));
  assert.ok(!sent[0].payload.html.includes('<script>'));
  assert.ok(!/[<>\u0000-\u001f\u007f]/.test(sent[0].payload.subject));
});

test('accepts a current selected offer only when numerical inputs and rate match its published scenario', async () => {
  const { handler, sent } = harness();
  const body = lead(); body.mortgage.bankId = 'fixture-offer';
  assert.equal((await handler.fetch(request(body))).status, 200);
  assert.ok(sent[0].payload.text.includes('Fuente oficial de prueba'));
  assert.ok(sent[0].payload.text.includes('Seguros mensuales publicados: 1,00 UF'));
  assert.ok(sent[0].payload.text.includes('CAE del escenario publicado: 4,70%'));
  assert.ok(sent[0].payload.text.includes('Otros cargos mensuales publicados: 0,00 UF'));
  assert.ok(sent[0].payload.text.includes('Gastos operacionales publicados: 1,00 UF'));
  assert.ok(sent[0].payload.text.includes('desgravamen, incendio y sismo'));
  assert.match(sent[0].payload.text, /Costo total del escenario publicado: 13.000,00 UF\n/);
});

test('CMF costs explicitly retain exclusions, and unknown insurance or incomplete costs cannot acquire CAE or total-cost claims', async () => {
  const mortgageDataset = fixtureDataset();
  Object.assign(mortgageDataset.offers[0].scenarioCosts, { complete: false, coverage: 'cmf-standard-excludes-tax-registry', insuranceCoverage: 'unknown', totalCostUf: null });
  const { handler, sent } = harness({ mortgageDataset });
  const body = lead(); body.mortgage.bankId = 'fixture-offer';
  assert.equal((await handler.fetch(request(body))).status, 200);
  assert.ok(sent[0].payload.text.includes('excluye impuestos y aranceles del Conservador'));
  assert.ok(!sent[0].payload.text.includes('CAE del escenario publicado:'));
  assert.ok(!sent[0].payload.text.includes('Costo total del escenario publicado:'));
});

test('rejects missing consent, invalid phones, malformed mortgage values and client-computed dividends', async () => {
  const cases = [
    lead({ consent: false }), lead({ consent: 'true' }), lead({ consent: undefined }),
    lead({ telefono: '' }), lead({ telefono: '12345678' }), lead({ telefono: '1234567890123456' }), lead({ telefono: 'abcdefghij' }),
    lead({ mortgage: {} }), lead({ mortgage: [] }), lead({ mortgage: null }),
  ];
  for (const mutation of [
    { propertyUf: '10000' }, { years: 0 }, { annualRatePercent: -1 }, { rateConvention: 'custom' }, { location: 'wrong' },
    { monthlyPaymentUf: 1 }, { bankId: 'fixture-bank' }, { bankId: 'fixture-offer', annualRatePercent: 3 },
    { bankId: 'fixture-offer', years: 20 }, { bankId: 'fixture-offer', location: 'other' },
    { simulatedAt: '2026-02-30T00:00:00Z' }, { simulatedAt: '2026-10-09T24:00:00Z' },
    { simulatedAt: new Date(NOW + 1_000).toISOString() }, { simulatedAt: new Date(NOW - 86_400_001).toISOString() },
  ]) {
    const body = lead(); body.mortgage = { ...body.mortgage, ...mutation }; cases.push(body);
  }
  for (const body of cases) {
    const { handler, sent } = harness();
    const response = await handler.fetch(request(body));
    assert.equal(response.status, 400, JSON.stringify(body));
    assert.equal(sent.length, 0);
  }
});

test('rejects future, too-fast or expired form starts; permits timing boundary', async () => {
  for (const startedAt of [NOW + 1, NOW, NOW - 1_999, NOW - 86_400_001, '123', undefined]) {
    const { handler, sent } = harness();
    assert.equal((await handler.fetch(request(lead({ startedAt })))).status, 400);
    assert.equal(sent.length, 0);
  }
  const { handler } = harness();
  assert.equal((await handler.fetch(request(lead({ startedAt: NOW - 2_000 })))).status, 200);
});

test('honeypot absorbs spam without contacting the provider; cross-origin requests are rejected', async () => {
  const { handler, sent } = harness({ key: undefined });
  assert.equal((await handler.fetch(request(lead({ website: 'spam.example' })))).status, 200);
  assert.equal((await handler.fetch(request(lead(), { Origin: 'https://evil.example' }))).status, 403);
  assert.equal((await handler.fetch(request(lead(), { Origin: 'null' }))).status, 403);
  assert.equal(sent.length, 0);
});

test('rejects oversized, invalid JSON, wrong method and content type, objects instead of text and unknown fields', async () => {
  const { handler, sent } = harness();
  assert.equal((await handler.fetch(new Request('https://sollahms.cl/api/contact'))).status, 405);
  assert.equal((await handler.fetch(request(lead(), { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await handler.fetch(request(lead(), { 'Content-Length': '999999' }))).status, 413);
  assert.equal((await handler.fetch(request(lead({ mensaje: 'x'.repeat(40_000) })))).status, 413);
  assert.equal((await handler.fetch(new Request('https://sollahms.cl/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' }))).status, 400);
  for (const body of [null, [], 'text', lead({ nombre: {} }), lead({ correo: [] }), lead({ website: {} }), lead({ website: 'x'.repeat(201) }), lead({ unknown: {} })]) {
    assert.equal((await handler.fetch(request(body))).status, 400);
  }
  assert.equal(sent.length, 0);
});

test('no key, Resend rejection, network failure or unconfirmed acceptance can report a successful delivery', async () => {
  const missing = harness({ key: '' });
  assert.equal((await missing.handler.fetch(request(lead()))).status, 503);
  assert.equal(missing.sent.length, 0);
  for (const provider of [
    () => new Response('{}', { status: 401 }),
    () => { throw new Error('offline'); },
    () => new Response('{}', { status: 200 }),
    () => new Response('invalid', { status: 200 }),
  ]) {
    const { handler } = harness({ provider });
    assert.equal((await handler.fetch(request(lead()))).status, 502);
  }
});

test('expired or mismatched offers are rejected, metadata-only bank ids cannot be submitted', async () => {
  const expired = fixtureDataset(); expired.offers[0].validUntil = '2026-10-08';
  const metadata = fixtureDataset(); metadata.offers = [];
  for (const mortgageDataset of [expired, metadata]) {
    const { handler, sent } = harness({ mortgageDataset });
    const body = lead(); body.mortgage.bankId = 'fixture-offer';
    const response = await handler.fetch(request(body));
    assert.ok(response.status === 400 || response.status === 503);
    assert.equal(sent.length, 0);
  }
});

test('a stale UF preserves the UF summary and suppresses peso conversion', async () => {
  const stale = fixtureDataset(); stale.uf.date = '2026-10-08'; stale.uf.source.verifiedAt = '2026-10-08';
  const { handler, sent } = harness({ mortgageDataset: stale });
  assert.equal((await handler.fetch(request(lead()))).status, 200);
  assert.ok(sent[0].payload.text.includes('Conversión a pesos no disponible:'));
  assert.ok(!sent[0].payload.text.includes('(aprox. $'));
});

test('contacto.html preserves optional phone and RUT, derives its subject and requires no mortgage consent', async () => {
  const { handler, sent } = harness();
  const body = { ...baseContact, telefono: '', rut: '' };
  assert.equal((await handler.fetch(request(body))).status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].payload.subject, 'Consulta desde Sollahms');
  assert.ok(sent[0].payload.text.includes('Teléfono: No informado'));
  assert.ok(!sent[0].payload.text.includes('Consentimiento:'));
  assert.ok(!sent[0].payload.text.includes('Simulación hipotecaria'));
});

test('mortgage comments may be short while the legacy contact form retains its minimum length', async () => {
  const { handler, sent } = harness();
  assert.equal((await handler.fetch(request(lead({ mensaje: 'Hola' })))).status, 200);
  assert.equal((await handler.fetch(request({ ...baseContact, mensaje: 'Hola' }))).status, 400);
  assert.equal(sent.length, 1);
  assert.ok(sent[0].payload.text.includes('Mensaje:\nHola'));
});
