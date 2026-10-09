import { calculateMortgage } from './mortgage-engine.mjs';
import { validateDataset, getUfStatus, getOfferStatus, compareOffers, sortComparisons } from './mortgage-data.mjs';

const $ = id => document.getElementById(id);
const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });
const rateNumber = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 3 });
const ufPeso = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const insuranceNumber = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 4 });
const insuranceLabel = item => item.insuranceCoverage === 'life-fire-earthquake' ? 'Desgravamen, incendio y sismo' : item.insuranceCoverage === 'life-fire' ? 'Desgravamen e incendio' : 'Cobertura por verificar';
const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const sourceLabel = offer => new URL(offer.source.url).hostname === 'cmfchile.cl' || new URL(offer.source.url).hostname.endsWith('.cmfchile.cl') ? 'CMF' : 'institución';
const locationLabel = location => location === 'santiago-metropolitana' ? 'Santiago' : location === 'other' ? 'Otra ubicación de Chile' : 'Ubicación por confirmar';
const uf = value => `${number.format(value)} UF`;
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').reverse().join('/') : 'sin fecha';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
let dataset = null;
let selectedId = null;
let rateOrigin = null;
let simulation = null;
let input = null;
let comparisons = [];
let simulatedAt = null;
let startedAt = Date.now();
let sending = false;
let loading = false;

function readNumber(id) {
  const field = $(id);
  if (field.value.trim() === '' || !field.validity.valid) throw new Error(`Revisa ${field.labels?.[0]?.textContent.trim().toLowerCase() || 'los datos ingresados'}.`);
  return field.valueAsNumber;
}

function readInputs(withRate = true) {
  return {
    propertyUf: readNumber('property'), downPaymentPercent: readNumber('down'),
    years: $('years').value === 'custom' ? readNumber('custom-years') : Number($('years').value),
    annualRatePercent: withRate ? readNumber('rate') : 0,
    rateConvention: $('convention').value, location: $('location').value,
  };
}

function conversion(value, now = new Date()) {
  const status = dataset && getUfStatus(dataset.uf, now);
  return status?.usable ? `${pesos.format(value * status.valueClp)} · UF del ${date(status.date)}` : 'Conversión a pesos pendiente de una UF vigente.';
}

function renderDataStatus() {
  const status = dataset && getUfStatus(dataset.uf, new Date());
  if (!status) {
    $('data-status').innerHTML = 'No pudimos verificar los datos financieros. Puedes simular en UF con tu propia tasa. <button type="button" class="text-button" id="retry-data">Reintentar</button>';
    $('retry-data').addEventListener('click', loadData);
    $('uf-method').textContent = 'Sin una UF vigente verificada, los resultados se muestran únicamente en UF. Puedes continuar simulando y solicitar asesoría.';
    return;
  }
  $('data-status').innerHTML = status.usable
    ? `<span>UF verificada: <strong>${ufPeso.format(status.valueClp)}</strong> · ${date(status.date)}</span>
<a href="${esc(status.sourceUrl)}" target="_blank" rel="noopener">Fuente SII ↗</a>
<span>Resultados orientativos</span>`
    : `<span>${esc(status.message)} Se mantiene la simulación en UF, sin conversión a pesos.</span>
<a href="${esc(status.sourceUrl || 'https://www.sii.cl/valores_y_fechas/uf/uf2026.htm')}" target="_blank" rel="noopener">Consultar fuente ↗</a>`;
  $('uf-method').textContent = status.usable
    ? `UF de ${ufPeso.format(status.valueClp)} al ${date(status.date)}, verificada en SII. Multiplicamos el dividendo en UF por este valor. El resultado no proyecta la variación futura de la UF ni el costo del crédito en pesos.`
    : `La última UF disponible tiene fecha ${date(status.date)}. No la usamos como UF actual ni proyectamos pagos futuros en pesos.`;
}

function renderInstitutions() {
  $('institution-cards').innerHTML = (dataset?.institutions || []).map(bank => {
    const offers = dataset.offers.filter(offer => offer.institutionId === bank.id && getOfferStatus(offer).usable);
    return `<article class="institution-card">
<h3>${esc(bank.name)}</h3>
<p>${esc(bank.notes || bank.limitation || (offers.length ? 'Referencia CMF disponible sólo para el escenario indicado.' : 'Sin una tasa comparable vigente verificada.'))}</p>${bank.maxFinancingPercent ? `<p>Financiamiento publicado: hasta ${esc(bank.maxFinancingPercent)}% (sujeto a condiciones).</p>` : ''}${bank.availableYears?.length ? `<p>Plazos publicados: ${esc(bank.availableYears.join(', '))} años.</p>` : ''}<p>Verificación: ${date(bank.source.verifiedAt)}</p>
<a href="${esc(bank.source.url)}" target="_blank" rel="noopener">Ver información oficial ↗</a>
</article>`;
  }).join('');
}

function renderComparisons() {
  let base;
  try { base = readInputs(false); calculateMortgage(base); } catch {
    comparisons = [];
    $('comparison-status').textContent = 'Revisa el valor de la propiedad, pie y plazo para buscar referencias comparables.';
    $('comparison-cards').replaceChildren();
    $('verified-scenario').hidden = true;
    return;
  }
  comparisons = dataset ? compareOffers(base, dataset.offers, new Date()) : [];
  if (selectedId && !comparisons.some(item => item.offer.id === selectedId)) {
    selectedId = null;
    if (rateOrigin === 'bank') { $('rate').value = ''; rateOrigin = null; }
  }
  let ordered = sortComparisons(comparisons, $('sort').value);
  $('comparison-status').textContent = comparisons.length
    ? `${comparisons.length} referencias CMF aplicables a este escenario. Mutuo no endosable en UF, tasa fija, propiedad en Santiago; no constituyen una aprobación ni una oferta personalizada. Seguros y CAE corresponden a la cobertura indicada en cada tarjeta.`
    : 'No hay tasas bancarias verificadas aplicables a tu escenario. Ingresa una tasa de tu cotización para simular; puedes solicitar asesoría igualmente. La ausencia de un banco aquí no implica que no ofrezca crédito.';
  const usablePreset = dataset?.offers.find(offer => getOfferStatus(offer).usable && offer.source.kind === 'official-scenario');
  $('verified-scenario').hidden = !usablePreset || comparisons.length > 0;
  $('sort').disabled = !comparisons.length;
  for (const option of $('sort').options) {
    if (option.value === 'cae') option.disabled = !comparisons.some(item => item.caeComparable);
    if (option.value === 'totalCost') option.disabled = !comparisons.some(item => item.totalCostComparable);
  }
  if ($('sort').selectedOptions[0]?.disabled) $('sort').value = 'dividend';
  ordered = sortComparisons(comparisons, $('sort').value);
  if ($('sort').value === 'cae' && comparisons.length) $('comparison-status').textContent += ' CAE ordenada dentro de cada grupo de cobertura; los grupos no comparten un ranking.';
  let previousGroup = null;
  $('comparison-cards').innerHTML = ordered.map(item => {
    const bank = dataset.institutions.find(bank => bank.id === item.offer.institutionId);
    const groupHeading = $('sort').value === 'cae' && item.caeGroup !== previousGroup ? `<p class="cae-group-heading">Grupo de CAE: ${esc(insuranceLabel(item))} · ${item.costCoverage === 'cmf-standard-excludes-tax-registry' ? 'excluye impuestos e inscripciones' : 'gastos completos informados'}</p>` : '';
    previousGroup = item.caeGroup;
    return `${groupHeading}<article class="bank-card${selectedId === item.offer.id ? ' selected' : ''}">
<span class="bank-tag">Referencia ${esc(sourceLabel(item.offer))} · tasa fija en UF</span>
<h3>${esc(bank?.name || item.offer.label)}</h3>
<div class="bank-payment">${number.format(item.simulation.monthlyPaymentUf)} <small>UF / mes</small>
</div>
<p class="field-help">Dividendo financiero · ${esc(conversion(item.simulation.monthlyPaymentUf))}</p>
<dl class="bank-meta">
<div>
<dt>Tasa anual ${item.offer.rateConvention === 'effective' ? 'efectiva' : 'nominal'}</dt>
<dd>${rateNumber.format(item.offer.annualRatePercent)}%</dd>
</div>
<div>
<dt>CAE del escenario</dt>
<dd>${item.caeComparable ? `${rateNumber.format(item.caePercent)}%` : 'No comparable'}</dd>
</div>
<div>
<dt>Cobertura de CAE</dt>
<dd>${esc(insuranceLabel(item))}</dd>
</div>
<div>
<dt>Seguros mensuales</dt>
<dd>${item.monthlyInsuranceUf === null ? 'Sin datos' : `${insuranceNumber.format(item.monthlyInsuranceUf)} UF`}</dd>
</div>
<div>
<dt>Con seguros informados</dt>
<dd>${item.monthlyTotalUf === null ? 'No disponible' : uf(item.monthlyTotalUf)}</dd>
</div>
<div>
<dt>Suma de dividendos financieros</dt>
<dd>${uf(item.simulation.totalPaymentsUf)}</dd>
</div>
<div>
<dt>Costo total completo</dt>
<dd>${item.totalCostComparable ? uf(item.totalCostUf) : 'No disponible'}</dd>
</div>
<div>
<dt>Financiamiento del escenario</dt>
<dd>${number.format(item.simulation.financingPercent)}% · ${item.simulation.years} años</dd>
</div>
</dl>
<p class="bank-source">${esc(locationLabel(item.offer.location))} · propiedad ${uf(item.simulation.propertyUf)} · pie ${number.format(100-item.simulation.financingPercent)}%.<br>Actualización del banco: ${date(item.offer.source.updatedAt)}<br>Verificado: ${date(item.offer.source.verifiedAt)} · revisión hasta ${date(item.offer.validUntil)}<br>
<a href="${esc(item.offer.source.url)}" target="_blank" rel="noopener">Ver fuente ${esc(sourceLabel(item.offer))} ↗</a>
</p>
<details class="bank-conditions">
<summary>Condiciones y limitaciones</summary>
<ul>${(item.offer.requirements || []).map(text => `<li>${esc(text)}</li>`).join('')}</ul>
</details>
<button type="button" class="button ${selectedId === item.offer.id ? 'button-gold' : 'button-green'} full" data-offer="${esc(item.offer.id)}" aria-pressed="${selectedId === item.offer.id}">${selectedId === item.offer.id ? 'Alternativa seleccionada' : 'Seleccionar y ver detalle'}</button>
</article>`;
  }).join('');
  $('comparison-cards').querySelectorAll('[data-offer]').forEach(button => button.addEventListener('click', () => selectOffer(button.dataset.offer)));
}

function selectOffer(id) {
  const item = comparisons.find(item => item.offer.id === id);
  if (!item) return;
  selectedId = id;
  rateOrigin = 'bank';
  $('rate').value = item.offer.annualRatePercent;
  $('convention').value = item.offer.rateConvention;
  update();
  $('selected-detail').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderResult() {
  const chosen = simulation && comparisons.find(item => item.offer.id === selectedId);
  $('selected-detail').hidden = !chosen;
  if (chosen) {
    const bank = dataset.institutions.find(bank => bank.id === chosen.offer.institutionId);
    $('detail-title').textContent = `${bank?.name || chosen.offer.label} · escenario verificado`;
    $('detail-content').innerHTML = `<p>Propiedad ${uf(simulation.propertyUf)} · pie ${number.format(input.downPaymentPercent)}% · crédito ${uf(simulation.principalUf)} · ${simulation.years} años · ${input.location === 'santiago-metropolitana' ? 'área metropolitana de Santiago' : input.location === 'other' ? 'otra ubicación de Chile' : 'ubicación por confirmar'}.</p>
<p>Tasa anual ${rateNumber.format(simulation.annualRatePercent)}%, convertida ${simulation.rateConvention === 'effective' ? 'por equivalencia compuesta' : 'dividiendo por 12'}. Dividendo financiero calculado: ${uf(simulation.monthlyPaymentUf)}. ${chosen.monthlyTotalUf === null ? 'No hay un dividendo total verificable.' : `Con los seguros informados: ${uf(chosen.monthlyTotalUf)} (${esc(conversion(chosen.monthlyTotalUf))}).`}</p>
<p>${chosen.oneTimeFeesUf == null ? 'Gastos iniciales no verificados.' : `Gastos iniciales informados: ${uf(chosen.oneTimeFeesUf)}.`} ${chosen.costCoverage === 'cmf-standard-excludes-tax-registry' ? 'La fuente excluye impuestos de timbres y estampillas e inscripciones en el Conservador.' : 'Revisa la cobertura de gastos de la fuente.'} Las primas pueden variar; ${chosen.totalCostComparable ? `costo total informado ${uf(chosen.totalCostUf)}.` : 'no hay un costo total contractual verificado.'}</p>
<p>CAE ${chosen.caeComparable ? `${rateNumber.format(chosen.caePercent)}% publicada para este escenario, con ${esc(insuranceLabel(chosen).toLowerCase())}` : 'no comparable'}. Consulta las condiciones completas y la evaluación personal de la institución.</p>
<p>
<a href="${esc(chosen.offer.source.url)}" target="_blank" rel="noopener">Fuente CMF ↗</a> · banco actualizado ${date(chosen.offer.source.updatedAt)} · verificado ${date(chosen.offer.source.verifiedAt)}.</p>`;
  }
  if (!simulation) {
    $('monthly-uf').innerHTML = '— <span>UF</span>';
    $('monthly-clp').textContent = 'Ingresa una tasa válida para calcular el dividendo.';
    $('result-kind').textContent = 'Completa una tasa o selecciona una alternativa verificada.';
    for (const id of ['result-interest','result-total']) $(id).textContent = '—';
    $('result-insurance').textContent = 'Sin datos verificables';
    $('result-cost').textContent = 'No disponible';
    $('lead-open').disabled = true;
    return;
  }
  const bank = chosen && dataset.institutions.find(bank => bank.id === chosen.offer.institutionId);
  $('result-kind').textContent = chosen ? `Referencia ${sourceLabel(chosen.offer)} · ${bank?.name || chosen.offer.label}` : rateOrigin === 'previous' ? 'Simulación referencial con la tasa del escenario anterior; confirma su vigencia.' : 'Simulación referencial con la tasa ingresada por ti.';
  $('monthly-uf').innerHTML = `${number.format(simulation.monthlyPaymentUf)} <span>UF</span>`;
  $('monthly-clp').textContent = conversion(simulation.monthlyPaymentUf);
  $('result-interest').textContent = uf(simulation.totalInterestUf);
  $('result-total').textContent = uf(simulation.totalPaymentsUf);
  $('result-insurance').textContent = chosen?.monthlyInsuranceUf != null ? `${uf(chosen.monthlyInsuranceUf)} · fuente CMF` : 'Sin datos verificables';
  $('result-cost').textContent = chosen?.totalCostComparable ? `${uf(chosen.totalCostUf)} total informado` : chosen?.oneTimeFeesUf != null ? `${uf(chosen.oneTimeFeesUf)} iniciales · total no disponible` : 'No disponibles';
  $('lead-open').disabled = false;
}

function renderLeadContext() {
  if (!simulation) {
    $('lead-context').textContent = 'Completa una simulación válida para enviar la solicitud.';
    $('lead-submit').disabled = true;
    return;
  }
  $('lead-submit').disabled = sending;
  const chosen = comparisons.find(item => item.offer.id === selectedId);
  const bank = chosen && dataset.institutions.find(bank => bank.id === chosen.offer.institutionId);
  $('lead-context').innerHTML = `<p>
<strong>${uf(simulation.propertyUf)}</strong> · pie ${number.format(input.downPaymentPercent)}% (${uf(simulation.downPaymentUf)})</p>
<p>Crédito ${uf(simulation.principalUf)} · ${simulation.years} años</p>
<p>${bank ? esc(bank.name) : 'Sin banco seleccionado'} · tasa ${rateNumber.format(simulation.annualRatePercent)}% anual ${simulation.rateConvention === 'effective' ? 'efectiva' : 'nominal'}</p>
<p>Dividendo financiero ${uf(simulation.monthlyPaymentUf)} · ${esc(conversion(simulation.monthlyPaymentUf))}</p>
<p>Simulación: ${esc(new Date(simulatedAt).toLocaleString('es-CL', { timeZone: 'America/Santiago' }))}</p>`;
}

function update({ clearSelection = false, showError = false } = {}) {
  if (clearSelection) { selectedId = null; if (rateOrigin === 'bank') rateOrigin = 'previous'; }
  $('simulation-error').hidden = true;
  simulation = null;
  input = null;
  renderDataStatus();
  renderComparisons();
  try {
    const base = readInputs(false);
    const amounts = calculateMortgage(base);
    $('result-property').textContent = uf(amounts.propertyUf);
    $('result-down').textContent = `${uf(amounts.downPaymentUf)} · ${number.format(base.downPaymentPercent)}%`;
    $('result-principal').textContent = `${uf(amounts.principalUf)} · ${number.format(amounts.financingPercent)}%`;
    $('result-rate').textContent = `${base.years} años · tasa por ingresar`;
    $('financing-bar').firstElementChild.style.width = `${base.downPaymentPercent}%`;
    input = readInputs();
    simulation = calculateMortgage(input);
    simulatedAt = new Date().toISOString();
    $('result-rate').textContent = `${simulation.years} años · ${rateNumber.format(simulation.annualRatePercent)}% ${simulation.rateConvention === 'effective' ? 'efectiva' : 'nominal'}`;
  } catch (error) {
    if (showError) { $('simulation-error').textContent = error.message; $('simulation-error').hidden = false; }
    if (!input && !['property','down','custom-years'].every(id => $(id).validity.valid && $(id).value !== '')) {
      for (const id of ['result-property','result-down','result-principal','result-rate']) $(id).textContent = 'Revisa los datos';
    }
  }
  document.querySelectorAll('[data-down]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.down === $('down').value || (button.dataset.down === 'custom' && !['10','15','20'].includes($('down').value)))));
  renderResult();
  if (!$('lead-section').hidden) renderLeadContext();
}

async function loadData() {
  if (loading) return;
  loading = true;
  $('data-status').textContent = 'Consultando la información financiera…';
  try {
    const response = await fetch('/data/hipotecario.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Financial data unavailable');
    const data = await response.json();
    const validation = validateDataset(data);
    if (!validation.valid) throw new Error('Invalid financial data');
    dataset = data;
  } catch { dataset = null; selectedId = null; }
  finally { loading = false; renderInstitutions(); update(); }
}

function openLead() {
  update();
  if (!simulation) return;
  if ($('lead-section').hidden) startedAt = Date.now();
  $('lead-section').hidden = false;
  renderLeadContext();
  $('lead-title').focus({ preventScroll: true });
  $('lead-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('simulation-form').addEventListener('submit', event => { event.preventDefault(); update({ showError: true }); });
$('simulation-form').addEventListener('input', event => { if (sending) return; if (event.target.id === 'rate') rateOrigin = 'user'; update({ clearSelection: true }); });
$('simulation-form').addEventListener('change', event => {
  $('custom-years-field').hidden = $('years').value !== 'custom';
  $('custom-years').required = $('years').value === 'custom';
  update({ clearSelection: true });
});
document.querySelectorAll('[data-down]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.down === 'custom') { $('down').focus(); $('down').select(); return; }
  $('down').value = button.dataset.down;
  update({ clearSelection: true });
}));
$('sort').addEventListener('change', () => update());
$('verified-scenario').addEventListener('click', () => {
  const offer = dataset?.offers.find(offer => getOfferStatus(offer).usable && offer.source.kind === 'official-scenario');
  if (!offer) return;
  const financing = offer.maxFinancingPercent;
  $('property').value = offer.maxPrincipalUf / (financing / 100);
  $('down').value = 100 - financing;
  $('years').value = offer.availableYears[0];
  $('custom-years-field').hidden = true;
  $('custom-years').required = false;
  $('location').value = offer.location === 'any' ? 'unknown' : offer.location;
  $('convention').value = offer.rateConvention;
  selectedId = null;
  update();
  $('comparison-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('lead-open').addEventListener('click', openLead);
$('detail-contact').addEventListener('click', openLead);
$('lead-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (sending) return;
  update({ showError: true });
  if (!simulation || !$('lead-form').reportValidity()) return;
  const phone = $('telefono').value.trim();
  if (!/^[+()\d .-]+$/.test(phone) || (phone.match(/\d/g) || []).length < 9 || (phone.match(/\d/g) || []).length > 15) {
    $('lead-status').textContent = 'Revisa el teléfono: usa entre 9 y 15 dígitos.';
    $('telefono').focus(); return;
  }
  if (Date.now() - startedAt < 2000) { $('lead-status').textContent = 'Espera un momento antes de enviar la solicitud.'; return; }
  if (Date.now() - startedAt > 86400000) startedAt = Date.now() - 3000;
  sending = true;
  $('lead-submit').disabled = true;
  $('lead-submit').textContent = 'Enviando solicitud…';
  $('simulation-form').querySelectorAll('input,select,button').forEach(el => el.disabled = true);
  $('comparison-cards').querySelectorAll('button').forEach(el => el.disabled = true);
  $('lead-status').textContent = '';
  const mortgage = { ...input, bankId: selectedId, simulatedAt };
  try {
    const response = await fetch('/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: $('nombre').value, correo: $('correo').value, telefono: phone, asunto: 'Asesoría hipotecaria', mensaje: $('comentario').value.trim() || 'Solicitud de asesoría hipotecaria.', website: $('website').value, mortgage, consent: $('consent').checked, startedAt }),
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();
    if (!response.ok || body.ok !== true) throw new Error(body.error || 'No pudimos enviar la solicitud. Inténtalo más tarde.');
    $('lead-form').reset();
    startedAt = Date.now();
    $('lead-status').textContent = 'Solicitud enviada correctamente. Sollahms se pondrá en contacto contigo para conversar sobre tu financiamiento.';
  } catch (error) {
    $('lead-status').textContent = error.name === 'TimeoutError' ? 'El envío no pudo confirmarse. Inténtalo más tarde o escribe a contacto@sollahms.cl.' : error.message || 'No pudimos enviar la solicitud. Inténtalo más tarde.';
  } finally {
    sending = false;
    $('lead-submit').disabled = !simulation;
    $('lead-submit').textContent = 'Solicitar asesoría';
    $('simulation-form').querySelectorAll('input,select,button').forEach(el => el.disabled = false);
    $('comparison-cards').querySelectorAll('button').forEach(el => el.disabled = false);
  }
});

const menuButton = $('menu-toggle');
function closeMenu() { $('mobile-menu').hidden = true; menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Abrir menú de navegación'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') === 'true'; $('mobile-menu').hidden = open; menuButton.setAttribute('aria-expanded', String(!open)); menuButton.setAttribute('aria-label', open ? 'Abrir menú de navegación' : 'Cerrar menú de navegación'); });
$('mobile-menu').addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); } });
window.addEventListener('resize', () => { if (innerWidth > 800) closeMenu(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
setInterval(() => { if (!document.hidden && !sending) update(); }, 60000);
loadData();
