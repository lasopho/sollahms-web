import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import catalogue from '../data/proyectos.json' with { type: 'json' };
import mortgageDataset from '../data/hipotecario.json' with { type: 'json' };
import { createContactHandler } from '../api/contact.mjs';
import { calculateMortgage } from '../assets/js/mortgage-engine.mjs';
import { verifiedProjectPrice, verifiedProjectLocation } from '../assets/js/project-finance.mjs';

// All contact information is synthetic and every email provider is replaced.
const NOW = Date.parse('2026-10-10T15:00:00Z');
const base = { nombre: 'Cliente Integración', correo: 'qa@integration.test.invalid', telefono: '+56900000000', rut: '1000005-K', mensaje: 'Solicitud de asesoría ficticia.', website: '' };
const currentDataset = () => {
  const result = structuredClone(mortgageDataset);
  result.uf.date = '2026-10-10';
  result.uf.source.verifiedAt = '2026-10-10';
  return result;
};
function lead(proyecto, origin = 'visitor', propertyUf = 4000) {
  return { ...base, ...(proyecto === undefined ? {} : { proyecto }), consent: true, startedAt: NOW - 5000,
    mortgage: { propertyUf, downPaymentPercent: 20, years: 20, annualRatePercent: 4.5,
      rateConvention: 'effective', bankId: null, simulatedAt: new Date(NOW - 1000).toISOString(), location: 'unknown', propertyValueOrigin: origin } };
}
function request(body, raw) {
  return new Request('https://integration.test.invalid/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://integration.test.invalid' }, body: raw ?? JSON.stringify(body) });
}
function harness({ projectDataset = catalogue, now = NOW, environment = 'test', provider, financialData = currentDataset() } = {}) {
  const calls = [];
  let keyReads = 0;
  const handler = createContactHandler({
    mortgageDataset: financialData, projectDataset, now: () => now, getEnvironment: () => environment,
    getApiKey: () => { keyReads++; return 'synthetic-test-key'; },
    fetchImpl: async (url, options) => { calls.push({ url, body: JSON.parse(options.body) }); return provider ? provider() : Response.json({ id: 'simulated-only' }); },
  });
  return { handler, calls, keyReads: () => keyReads };
}
const number = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

test('all 148 mortgage contexts derive project name and subject on the server without forwarding RUT', async () => {
  const { handler, calls } = harness();
  assert.equal(catalogue.length, 148);
  for (const project of catalogue) {
    const response = await handler.fetch(request(lead(project.slug)));
    assert.equal(response.status, 200, project.slug);
    assert.deepEqual(await response.json(), { ok: true });
    const email = calls.at(-1).body;
    assert.equal(email.subject, 'Asesoría hipotecaria sobre ' + project.nombre);
    assert.ok(email.text.includes('Proyecto: ' + project.nombre));
    assert.ok(email.text.includes('Identificador: ' + project.slug));
    assert.ok(email.text.includes('Origen del valor: proporcionado por el visitante'));
    assert.ok(!JSON.stringify(email).includes('1000005-K'));
    assert.ok(!JSON.stringify(email).includes('RUT'));
    assert.ok(!JSON.stringify(email.subject).includes('4.000'));
  }
  assert.equal(calls.length, 148);
});

test('115 catalogue prices match verified server provenance and are independently recalculated', async () => {
  const { handler, calls } = harness();
  let priced = 0;
  for (const project of catalogue) {
    const price = verifiedProjectPrice(project, new Date(NOW));
    if (!price) continue;
    priced++;
    const body = lead(project.slug, 'catalogue', price.valueUf);
    const response = await handler.fetch(request(body));
    assert.equal(response.status, 200, project.slug);
    const text = calls.at(-1).body.text;
    assert.ok(text.includes(`Valor de la propiedad: ${number.format(price.valueUf)} UF`));
    assert.ok(text.includes(`Dividendo base mensual: ${number.format(calculateMortgage(body.mortgage).monthlyPaymentUf)} UF`));
    assert.ok(text.includes('Origen del valor: precio desde publicado por la inmobiliaria'));
    assert.ok(text.includes('revisión: ' + price.date));
    assert.ok(text.includes('fuente: ' + price.source));
  }
  assert.equal(priced, 115);
  assert.equal(calls.length, 115);
});

test('33 unpriced projects require a visitor-declared price and cannot borrow another project price', async () => {
  const { handler, calls } = harness();
  let unpriced = 0;
  for (const project of catalogue) {
    if (verifiedProjectPrice(project, new Date(NOW))) continue;
    unpriced++;
    const unavailable = await handler.fetch(request(lead(project.slug, 'catalogue', 4000)));
    assert.equal(unavailable.status, 400);
    assert.equal(calls.length, unpriced - 1);
    assert.equal((await handler.fetch(request(lead(project.slug, 'visitor', 4000)))).status, 200);
    assert.ok(calls.at(-1).body.text.includes('no representa un precio vigente confirmado'));
    assert.ok(!calls.at(-1).body.text.includes('revisión: 2026-10-09'));
  }
  assert.equal(unpriced, 33);
});

test('a visitor may deliberately edit a known catalogue price, and the resulting amount stays labelled as declared', async () => {
  const { handler, calls } = harness();
  const project = catalogue.find(p => verifiedProjectPrice(p, new Date(NOW)));
  const price = project.precioDesdeUF + 100;
  assert.equal((await handler.fetch(request(lead(project.slug, 'visitor', price)))).status, 200);
  assert.ok(calls[0].body.text.includes(`Valor de la propiedad: ${number.format(price)} UF`));
  assert.ok(calls[0].body.text.includes('Origen del valor: proporcionado por el visitante'));
  assert.ok(!calls[0].body.text.includes('Origen del valor: precio desde publicado'));
});

test('forged catalogue prices, missing project and arbitrary subject/name/source/computed results are rejected', async () => {
  const { handler, calls } = harness();
  const project = catalogue.find(p => verifiedProjectPrice(p, new Date(NOW)));
  assert.equal((await handler.fetch(request(lead(project.slug, 'catalogue', project.precioDesdeUF + 1)))).status, 400);
  assert.equal((await handler.fetch(request(lead(undefined, 'catalogue')))).status, 400);
  for (const key of ['asunto', 'subject', 'nombreProyecto', 'priceSource', 'capacity', 'renta', 'ahorro', 'deudas', 'monthlyPaymentUf']) {
    const body = lead(project.slug); body[key] = key === 'capacity' ? { incomeClp: 3000000 } : 'forged';
    assert.equal((await handler.fetch(request(body))).status, 400, key);
  }
  for (const key of ['monthlyPaymentUf', 'name', 'source', 'incomeClp', 'savingsUf', 'consent', '__proto__']) {
    const body = lead(project.slug);
    const mortgage = JSON.parse(JSON.stringify(body.mortgage).replace(/}$/, ',"' + key + '":1}'));
    assert.equal((await handler.fetch(request({ ...body, mortgage }))).status, 400, key);
  }
  for (const propertyValueOrigin of [undefined, null, false, 'official', 'historical']) {
    const body = lead(project.slug); body.mortgage.propertyValueOrigin = propertyValueOrigin;
    assert.equal((await handler.fetch(request(body))).status, 400);
  }
  assert.equal(calls.length, 0);
});

test('historical, future, invalid or unverified project prices cannot be submitted as current catalogue values', async () => {
  const project = structuredClone(catalogue.find(p => verifiedProjectPrice(p, new Date(NOW))));
  for (const mutate of [
    p => { p.verificacion.fecha = '2026-09-09'; },
    p => { p.verificacion.fecha = '2026-10-11'; },
    p => { p.verificacion.fecha = '2026-02-30'; },
    p => { p.verificacion.estadoFuente = 'not_found'; },
    p => { p.verificacion.camposVerificados = p.verificacion.camposVerificados.filter(f => f !== 'precioDesdeUF'); },
    p => { p.verificacion.fuente = 'http://example.invalid'; },
    p => { p.verificacion.fuente = 'https://secret@example.invalid'; },
  ]) {
    const changed = structuredClone(project); mutate(changed);
    const { handler, calls } = harness({ projectDataset: [changed] });
    assert.equal((await handler.fetch(request(lead(changed.slug, 'catalogue', changed.precioDesdeUF)))).status, 400);
    assert.equal(calls.length, 0);
    assert.equal((await handler.fetch(request(lead(changed.slug, 'visitor', changed.precioDesdeUF)))).status, 200);
    assert.ok(calls[0].body.text.includes('proporcionado por el visitante'));
  }
});

test('price freshness permits exactly 30 days, then requires a visitor-declared value', async () => {
  const project = structuredClone(catalogue.find(p => verifiedProjectPrice(p, new Date(NOW))));
  project.verificacion.fecha = '2026-09-10';
  const accepted = harness({ projectDataset: [project] });
  assert.equal((await accepted.handler.fetch(request(lead(project.slug, 'catalogue', project.precioDesdeUF)))).status, 200);
  project.verificacion.fecha = '2026-09-09';
  const expired = harness({ projectDataset: [project] });
  assert.equal((await expired.handler.fetch(request(lead(project.slug, 'catalogue', project.precioDesdeUF)))).status, 400);
  assert.equal(expired.calls.length, 0);
});

test('server catalogue determines price even if an injected browser field is plausible', async () => {
  const project = structuredClone(catalogue.find(p => verifiedProjectPrice(p, new Date(NOW))));
  const browserPrice = project.precioDesdeUF;
  project.precioDesdeUF += 20;
  const { handler, calls } = harness({ projectDataset: [project] });
  assert.equal((await handler.fetch(request(lead(project.slug, 'catalogue', browserPrice)))).status, 400);
  assert.equal((await handler.fetch(request(lead(project.slug, 'catalogue', project.precioDesdeUF)))).status, 200);
  assert.ok(calls[0].body.text.includes(number.format(project.precioDesdeUF) + ' UF'));
});

test('mortgage consent is explicit and cannot be bypassed by a nested boolean or timing mutation', async () => {
  const { handler, calls } = harness();
  for (const consent of [undefined, false, 'true', 1, null]) {
    const body = lead('distrito-centro'); body.consent = consent;
    assert.equal((await handler.fetch(request(body))).status, 400);
  }
  for (const startedAt of [undefined, NOW, NOW + 1, NOW - 1999, NOW - 86400001, '123', null]) {
    const body = lead('distrito-centro'); body.startedAt = startedAt;
    assert.equal((await handler.fetch(request(body))).status, 400);
  }
  assert.equal(calls.length, 0);
});

test('current official bank references still require the exact scenario and are never extrapolated', async () => {
  const { handler, calls } = harness();
  const body = lead(undefined, 'visitor', 4000);
  Object.assign(body.mortgage, { downPaymentPercent: 25, years: 20, location: 'santiago-metropolitana', annualRatePercent: 4.63, bankId: 'scotiabank-cmf-2026-09-10' });
  const offer = mortgageDataset.offers.find(o => o.institutionId === 'scotiabank');
  assert.ok(offer);
  body.mortgage.bankId = offer.id;
  body.mortgage.annualRatePercent = offer.annualRatePercent;
  body.mortgage.rateConvention = offer.rateConvention;
  assert.equal((await handler.fetch(request(body))).status, 200);
  assert.ok(calls[0].body.text.includes('Fuente de la oferta:'));
  for (const mutation of [{ propertyUf: 4001 }, { years: 25 }, { downPaymentPercent: 20 }, { location: 'other' }, { annualRatePercent: offer.annualRatePercent + 1 }]) {
    assert.equal((await handler.fetch(request({ ...body, mortgage: { ...body.mortgage, ...mutation } }))).status, 400);
  }
  assert.equal(calls.length, 1);
});

test('a project cannot acquire a CMF bank scenario by forging its geographic location', async () => {
  const offer = mortgageDataset.offers.find(o => o.institutionId === 'scotiabank');
  const { handler, calls } = harness();
  const projectLead = slug => {
    const body = lead(slug, 'visitor', 4000);
    Object.assign(body.mortgage, { downPaymentPercent: 25, years: 20, location: 'santiago-metropolitana', annualRatePercent: offer.annualRatePercent, rateConvention: offer.rateConvention, bankId: offer.id });
    return body;
  };
  const outside = catalogue.find(p => verifiedProjectLocation(p, new Date(NOW)) === 'other');
  const unknown = catalogue.find(p => verifiedProjectLocation(p, new Date(NOW)) === 'unknown');
  const santiago = catalogue.find(p => verifiedProjectLocation(p, new Date(NOW)) === 'santiago-metropolitana');
  assert.ok(outside && unknown && santiago);
  assert.equal((await handler.fetch(request(projectLead(outside.slug)))).status, 400);
  assert.equal((await handler.fetch(request(projectLead(unknown.slug)))).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await handler.fetch(request(projectLead(santiago.slug)))).status, 200);
  assert.ok(calls[0].body.text.includes('Fuente de la oferta:'));
  // A manual scenario remains available, with declared geography and no bank claim.
  const manual = projectLead(outside.slug); manual.mortgage.bankId = null;
  assert.equal((await handler.fetch(request(manual))).status, 200);
  assert.ok(calls[1].body.text.includes('Ubicación declarada para la simulación:'));
  assert.ok(calls[1].body.text.includes('Oferta bancaria: sin oferta seleccionada'));
});

test('residential CMF references cannot acquire eligibility for verified commercial or land assets', async () => {
  const offer = mortgageDataset.offers.find(o => o.institutionId === 'scotiabank');
  const santiago = catalogue.find(p => verifiedProjectLocation(p, new Date(NOW)) === 'santiago-metropolitana');
  for (const tipoActivo of ['Comercial', 'Terreno']) {
    const project = { ...structuredClone(santiago), tipoActivo };
    const { handler, calls } = harness({ projectDataset: [project] });
    const body = lead(project.slug, 'visitor', 4000);
    Object.assign(body.mortgage, { downPaymentPercent: 25, years: 20, location: 'santiago-metropolitana', annualRatePercent: offer.annualRatePercent, rateConvention: offer.rateConvention, bankId: offer.id });
    const response = await handler.fetch(request(body));
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error.includes('tipo de activo'));
    assert.equal(calls.length, 0);
    body.mortgage.bankId = null;
    assert.equal((await handler.fetch(request(body))).status, 200);
    assert.ok(calls[0].body.text.includes('sin oferta seleccionada'));
  }
});

test('expired UF suspends peso conversion while retaining the consented UF simulation', async () => {
  const data = currentDataset(); data.uf.date = '2026-10-09'; data.uf.source.verifiedAt = '2026-10-09';
  const { handler, calls } = harness({ financialData: data });
  assert.equal((await handler.fetch(request(lead('distrito-centro')))).status, 200);
  const text = calls[0].body.text;
  assert.ok(text.includes('Conversión a pesos no disponible:'));
  assert.ok(!text.includes('(aprox. $'));
  assert.ok(text.includes('Dividendo base mensual:'));
});

test('Preview blocks generic and mortgage requests before credentials or providers, keeping response private', async () => {
  const { handler, calls, keyReads } = harness({ environment: 'preview' });
  for (const body of [base, { ...base, proyecto: 'distrito-centro' }, lead('distrito-centro'), lead('distrito-centro', 'catalogue', catalogue.find(p => p.slug === 'distrito-centro').precioDesdeUF)]) {
    const response = await handler.fetch(request(body));
    assert.equal(response.status, 503);
    const result = await response.json();
    assert.equal(result.code, 'preview_read_only');
    assert.ok(!JSON.stringify(result).includes(base.rut));
    assert.ok(!JSON.stringify(result).includes(base.correo));
    assert.ok(!JSON.stringify(result).includes('2715'));
  }
  assert.equal(keyReads(), 0);
  assert.equal(calls.length, 0);
});

test('RUT validation stays optional and excluded for mortgage; invalid RUT never reaches provider', async () => {
  const { handler, calls } = harness();
  for (const rut of ['', undefined, '10.000.000-8', '1.000.005-k']) {
    const body = lead('distrito-centro'); body.rut = rut;
    assert.equal((await handler.fetch(request(body))).status, 200);
    assert.ok(!JSON.stringify(calls.at(-1).body).includes('RUT'));
    assert.ok(!JSON.stringify(calls.at(-1).body).includes('10000000-8'));
    assert.ok(!JSON.stringify(calls.at(-1).body).includes('1000005-K'));
  }
  for (const rut of ['10.000.000-1', null, 123, '<script>']) {
    const body = lead('distrito-centro'); body.rut = rut;
    const response = await handler.fetch(request(body));
    assert.equal(response.status, 400);
    assert.ok(!(await response.text()).includes('10.000.000'));
  }
  assert.equal(calls.length, 4);
});

test('unconfirmed provider acceptance cannot return success or leak private details', async () => {
  for (const provider of [() => Response.json({}), () => Response.json({ id: '' }), () => Response.json({ id: 5 }), () => Response.json({ error: base.rut }, { status: 400 }), () => { throw new Error(base.correo); }]) {
    const { handler } = harness({ provider });
    const response = await handler.fetch(request(lead('distrito-centro')));
    assert.equal(response.status, 502);
    const text = await response.text();
    assert.ok(!text.includes(base.rut));
    assert.ok(!text.includes(base.correo));
  }
});

test('unknown/prototype project identifiers and financial payloads with malformed encoding are rejected', async () => {
  const { handler, calls } = harness();
  for (const proyecto of ['', '__proto__', 'constructor', 'unknown', ' distrito-centro ', null, 4, {}]) {
    assert.equal((await handler.fetch(request(lead(proyecto)))).status, 400);
  }
  assert.equal((await handler.fetch(request(null, new Uint8Array([0xc3, 0x28])))).status, 400);
  assert.equal((await handler.fetch(request(null, 'x'.repeat(32769)))).status, 413);
  assert.equal(calls.length, 0);
});

test('privacy describes anonymous evaluation and temporary handoff without changing the existing RUT treatment', async () => {
  const html = await readFile(new URL('../privacidad.html', import.meta.url), 'utf8');
  assert.ok(html.includes('La renta individual o complementada, las deudas y el ahorro se evalúan en el navegador'));
  assert.ok(html.includes('máximo de cinco minutos'));
  assert.ok(html.includes('no contiene renta, deudas, ahorro, RUT ni datos de contacto'));
  assert.ok(html.includes('No se utiliza para consultar registros externos ni se incorpora al correo enviado mediante Resend'));
  assert.ok(html.includes('Únicamente cuando autorizas y envías esa solicitud'));
});
