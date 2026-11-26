const endpoint = '/api/interno-bonos-pie';
const $ = id => document.getElementById(id);
const state = { projects: [], project: null, unit: null, dirty: true, result: null, calculate: null, calculateMortgage: null, mortgageResult: null, mortgagePrincipalSource: 'manual', loading: false };
const fmt = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentFmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 4 });
const mortgageRateFmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 6 });
const dateFmt = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'America/Santiago' });
const monthFmt = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const fields = ['price', 'down-payment', 'bonus', 'bonus-kind', 'reservation', 'reservation-treatment', 'initial', 'initial-kind', 'installments', 'start-month', 'delivery-month', 'balloon', 'balloon-kind'];
const fieldNames = { priceUf: 'Precio', requiredDownPaymentPercentage: 'Pie requerido', developerBonus: 'Bono inmobiliario', initialPayment: 'Pago inicial', reservationUf: 'Reserva', reservationTreatment: 'Tratamiento de la reserva', balloon: 'Cuotón', installments: 'Número de cuotas', startMonth: 'Mes de inicio', deliveryMonth: 'Mes de entrega' };
const paymentNames = { reservation: 'Reserva', initial: 'Pago inicial', installment: 'Cuota', balloon: 'Cuotón a la entrega' };
const treatmentNames = { credited_to_initial: 'Se descuenta del pago inicial', credited_to_down_payment: 'Se descuenta del pie', additional: 'Adicional al pie', unknown: 'Sin verificar' };
const text = value => value == null ? '' : Array.isArray(value) ? value.map(text).filter(Boolean).join('\n') : typeof value === 'object' ? Object.entries(value).map(([key, val]) => `${key}: ${text(val)}`).join('\n') : String(value);
const numeric = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
const fold = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL').trim();
const monthValid = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const uf = value => numeric(value) === null ? 'Sin verificar' : `${fmt.format(value)} UF`;
const pct = value => numeric(value) === null ? 'Sin verificar' : `${percentFmt.format(value)} %`;
function el(tag, className = '', value) { const node = document.createElement(tag); node.className = className; if (value !== undefined) node.textContent = text(value); return node; }
function option(value, label) { const node = el('option', '', label); node.value = value; return node; }
function date(value) { if (!value) return 'Sin verificar'; const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00-03:00` : value); return Number.isNaN(parsed.getTime()) ? 'Sin verificar' : dateFmt.format(parsed); }
function month(value) { return monthValid(value) ? monthFmt.format(new Date(`${value}-01T12:00:00Z`)) : 'Mes sin verificar'; }
function safeLink(value, label) { try { const url = new URL(value); if (url.protocol !== 'https:' || url.username || url.password) return null; const node = el('a', '', label); node.href = url.href; node.target = '_blank'; node.rel = 'noopener noreferrer'; return node; } catch { return null; } }
function status(message, kind = '') { $('payment-status').textContent = message; $('payment-status').className = `notice${kind ? ` ${kind}` : ''}`; $('payment-status').hidden = !message; }
function readNumber(id) { const input = $(`payment-${id}`); return input.value.trim() === '' ? null : Number(input.value); }
function setNumber(id, value) { $(`payment-${id}`).value = numeric(value) === null ? '' : String(value); }
function setComponent(id, percentage, amountUf) { const useAmount = numeric(amountUf) !== null; $(`payment-${id}-kind`).value = useAmount ? 'amountUf' : 'percentage'; setNumber(id, useAmount ? amountUf : percentage); }
function readComponent(id) { return { [$(`payment-${id}-kind`).value]: readNumber(id) }; }
function clearMortgageResult() { state.mortgageResult = null; $('mortgage-result').hidden = true; $('mortgage-validation').hidden = true; $('mortgage-validation').replaceChildren(); for (const id of ['principal', 'rate', 'years', 'convention']) $(`mortgage-${id}`).removeAttribute('aria-invalid'); }
function updateMortgageControls() { $('mortgage-calculate').disabled = !state.calculateMortgage; $('mortgage-use-balance').disabled = !state.result; }
function hideResult() { state.result = null; clearMortgageResult(); if (state.mortgagePrincipalSource === 'plan') { $('mortgage-principal').value = ''; state.mortgagePrincipalSource = 'manual'; $('mortgage-principal-source').textContent = 'El plan cambió. Vuelve a calcularlo para usar su saldo o ingresa un monto de crédito independiente.'; } updateMortgageControls(); $('payment-results').hidden = true; $('payment-validation').hidden = true; $('payment-validation').replaceChildren(); }
function updateFormMode() {
  const sourced = state.unit && !state.dirty;
  $('payment-form-title').textContent = sourced ? 'Condiciones de la unidad' : 'Simulación personalizada';
  $('payment-form-context').textContent = sourced ? 'Valores de la fuente consultada. Los campos sin información permanecen «Sin verificar». Si cambias un valor, el resultado será una simulación.' : 'Ingresa los valores que quieras evaluar. Un campo vacío significa «Sin verificar»; escribe 0 cuando corresponda.';
  $('payment-restore').disabled = !state.unit;
  $('payment-calculate').disabled = !state.calculate;
  updateMortgageControls();
  updateMonthAction();
}
function monthCount() { const start = $('payment-start-month').value, delivery = $('payment-delivery-month').value; if (!monthValid(start) || !monthValid(delivery)) return null; const [sy, sm] = start.split('-').map(Number), [dy, dm] = delivery.split('-').map(Number); const count = (dy - sy) * 12 + dm - sm + 1; return count > 0 && count <= 600 ? count : null; }
function updateMonthAction() { const count = monthCount(); $('payment-use-months').disabled = count === null; $('payment-use-months').textContent = count === null ? 'Usar una cuota por mes, desde el inicio hasta la entrega' : `Usar ${count} cuota${count === 1 ? '' : 's'}: una por mes hasta la entrega`; }
function blankForm() { for (const field of fields) { const node = $(`payment-${field}`); node.value = field.endsWith('-kind') ? 'percentage' : field === 'reservation-treatment' ? 'unknown' : ''; } state.dirty = true; hideResult(); updateFormMode(); }
function restoreSource() {
  if (!state.unit) { blankForm(); return; }
  const unit = state.unit, terms = unit.paymentTerms || {};
  setNumber('price', unit.priceUf); setNumber('down-payment', terms.requiredDownPaymentPercentage);
  setComponent('bonus', terms.developerBonusPercentage, terms.developerBonusAmountUf);
  setNumber('reservation', terms.reservationUf);
  $('payment-reservation-treatment').value = Object.hasOwn(treatmentNames, terms.reservationTreatment) ? terms.reservationTreatment : 'unknown';
  setComponent('initial', terms.initialPercentage, terms.initialAmountUf);
  setComponent('balloon', terms.balloonPercentage, terms.balloonAmountUf);
  setNumber('installments', terms.installments);
  $('payment-start-month').value = monthValid(terms.startMonth) ? terms.startMonth : '';
  const exactDelivery = monthValid(terms.deliveryMonth) ? terms.deliveryMonth : state.project?.delivery?.precision === 'month' && monthValid(state.project.delivery.month) ? state.project.delivery.month : '';
  $('payment-delivery-month').value = exactDelivery;
  state.dirty = false; hideResult(); updateFormMode();
}
function sourcePair(label, value) { const node = el('div'); node.append(el('dt', '', label), el('dd', '', value)); return node; }
function renderSource() {
  const project = state.project, unit = state.unit, box = $('payment-source-summary'); box.replaceChildren();
  if (!project) { box.append(el('p', '', 'Selecciona un proyecto y una unidad para revisar sus condiciones. También puedes crear una simulación personalizada.')); renderEvidence(); return; }
  const title = el('div', 'payment-source-heading'); title.append(el('h3', '', project.name || 'Proyecto sin nombre'), el('span', `payment-mode${project.delivery?.futureConfirmed ? ' verified' : ''}`, project.delivery?.futureConfirmed ? 'Entrega futura informada' : 'Entrega sin verificar'));
  const detail = el('p', 'payment-meta', [project.developer, project.commune].filter(Boolean).join(' · ')); box.append(title, detail);
  const grid = el('dl', 'payment-source-grid');
  grid.append(sourcePair('Entrega informada', project.delivery?.label || (project.delivery?.precision === 'month' ? month(project.delivery.month) : 'Sin verificar')));
  grid.append(sourcePair('Mes exacto de entrega', project.delivery?.precision === 'month' ? month(project.delivery.month) : 'Sin verificar'));
  grid.append(sourcePair('Consulta de entrega', date(project.delivery?.checkedAt)));
  if (unit) {
    const terms = unit.paymentTerms || {};
    grid.append(sourcePair('Unidad / tipología', [unit.id, unit.typology].filter(Boolean).join(' · ') || 'Sin verificar'), sourcePair('Precio', uf(unit.priceUf)));
    grid.append(sourcePair('Referencia del precio', [unit.priceLabel, unit.priceBasis].filter(Boolean).join(' · ') || 'Sin verificar'));
    grid.append(sourcePair('Pie requerido', pct(terms.requiredDownPaymentPercentage)), sourcePair('Bono de esta unidad', numeric(terms.developerBonusAmountUf) !== null ? uf(terms.developerBonusAmountUf) : pct(terms.developerBonusPercentage)), sourcePair('Reserva', uf(terms.reservationUf)));
    grid.append(sourcePair('Tratamiento de reserva', treatmentNames[terms.reservationTreatment] || 'Sin verificar'), sourcePair('Inicial total', numeric(terms.initialAmountUf) !== null ? uf(terms.initialAmountUf) : pct(terms.initialPercentage)), sourcePair('Cuotón', numeric(terms.balloonAmountUf) !== null ? uf(terms.balloonAmountUf) : pct(terms.balloonPercentage)));
    grid.append(sourcePair('Cuotas informadas', numeric(terms.installments) === null ? 'Sin verificar' : String(terms.installments)), sourcePair('Primera cuota', month(terms.startMonth)), sourcePair('Consulta de la unidad', date(unit.checkedAt)));
  } else { grid.append(sourcePair('Unidades / tipologías', Array.isArray(project.units) && project.units.length ? 'Selecciona una referencia para revisar sus valores.' : 'Sin unidades verificadas en la fuente.'));
  }
  box.append(grid); renderEvidence();
}
function appendEvidenceGroup(container, heading, data, sourceUrl, checkedAt, conditions) {
  const group = el('div', 'payment-evidence-group'); group.append(el('h4', '', heading));
  const source = safeLink(sourceUrl, 'Abrir fuente consultada ↗'); if (source) group.append(source);
  group.append(el('p', 'payment-meta', `Consulta: ${date(checkedAt)}`));
  if (text(conditions)) group.append(el('p', 'payment-evidence-copy', text(conditions)));
  const evidence = Array.isArray(data) ? data : [];
  for (const item of evidence) { const record = typeof item === 'string' ? { quote: item } : item || {}; const quote = record.quote || record.text || record.description; if (quote) group.append(el('blockquote', '', quote)); const details = [record.section, record.capturedAt ? `Registro: ${date(record.capturedAt)}` : ''].filter(Boolean).join(' · '); if (details) group.append(el('p', 'payment-meta', details)); const link = safeLink(record.sourceUrl || record.url, 'Ver respaldo ↗'); if (link) group.append(link); }
  if (!source && !text(conditions) && !evidence.length) group.append(el('p', 'payment-meta', 'Sin respaldo específico verificado.'));
  container.append(group);
}
function renderEvidence() {
  const box = $('payment-evidence-content'); box.replaceChildren();
  const project = state.project, unit = state.unit;
  if (!project) { box.append(el('p', '', 'Selecciona un proyecto para consultar su respaldo.')); return; }
  appendEvidenceGroup(box, 'Proyecto y entrega', project.evidence, project.delivery?.sourceUrl || project.sourceUrl, project.delivery?.checkedAt || project.checkedAt, project.conditions);
  if (unit) appendEvidenceGroup(box, 'Unidad y condiciones de pago', unit.evidence, unit.sourceUrl, unit.checkedAt, unit.conditions);
  box.append(el('p', 'payment-meta', 'Las condiciones y consultas corresponden a sus fechas de registro. Los campos sin evidencia permanecen sin verificar.'));
}
function populateUnits(preserve = false) {
  const project = state.project, units = Array.isArray(project?.units) ? project.units : [], previous = preserve ? $('payment-unit').value : '';
  const typology = $('payment-typology').value;
  $('payment-unit').replaceChildren(option('', units.length ? 'Seleccionar unidad o tipología' : 'Sin unidades verificadas'));
  units.forEach((unit, index) => { if (typology && text(unit.typology) !== typology) return; const label = [unit.id, unit.typology].filter(Boolean).join(' · ') || 'Referencia sin identificar'; $('payment-unit').append(option(String(index), `${label} · ${uf(unit.priceUf)}`)); });
  if ([...$('payment-unit').options].some(item => item.value === previous)) $('payment-unit').value = previous;
  $('payment-unit').disabled = !units.length;
  state.unit = $('payment-unit').value === '' ? null : units[Number($('payment-unit').value)] || null;
}
function chooseProject() {
  const id = $('payment-project').value; state.project = id === '' ? null : state.projects[Number(id)] || null;
  const types = [...new Set((Array.isArray(state.project?.units) ? state.project.units : []).map(unit => text(unit.typology)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  $('payment-typology').replaceChildren(option('', 'Todas las tipologías'), ...types.map(value => option(value, value)));
  populateUnits(); renderSource(); blankForm();
}
function filterProjects(preserve = true, resetSelection = true) {
  const previous = preserve ? $('payment-project').value : '', search = fold($('payment-search').value), futureOnly = $('payment-delivery-filter').value === 'future';
  const filtered = state.projects.map((project, index) => ({ project, index })).filter(({ project }) => (!futureOnly || project.delivery?.futureConfirmed === true) && (!search || fold([project.name, project.developer, project.commune].join(' ')).includes(search)));
  $('payment-project').replaceChildren(option('', filtered.length ? 'Seleccionar proyecto' : 'Sin proyectos con estos filtros'), ...filtered.map(({ project, index }) => option(String(index), [project.name || 'Proyecto sin nombre', project.commune].filter(Boolean).join(' · '))));
  if ([...$('payment-project').options].some(item => item.value === previous)) $('payment-project').value = previous;
  $('payment-project-count').textContent = `${filtered.length} de ${state.projects.length} proyectos · La entrega y los términos de pago se verifican por separado.`;
  if (resetSelection && ($('payment-project').value !== previous || !preserve)) chooseProject();
}
function buildInput() { return { priceUf: readNumber('price'), requiredDownPaymentPercentage: readNumber('down-payment'), developerBonus: readComponent('bonus'), initialPayment: readComponent('initial'), reservationUf: readNumber('reservation'), reservationTreatment: $('payment-reservation-treatment').value, balloon: readComponent('balloon'), installments: readNumber('installments'), startMonth: $('payment-start-month').value || null, deliveryMonth: $('payment-delivery-month').value || null, scenarioMode: state.unit && !state.dirty && state.project?.delivery?.futureConfirmed === true && state.unit.paymentTerms?.verified === true ? 'verified' : 'simulation' }; }
function messageText(value) { return typeof value === 'string' ? value : value?.message || text(value); }
function renderValidation(errors) {
  const box = $('payment-validation'); box.replaceChildren(el('strong', '', 'Revisa los datos para calcular el plan.'));
  const list = el('ul'); for (const error of errors) { const name = fieldNames[error.field?.split('.')[0]]; list.append(el('li', '', `${name ? `${name}: ` : ''}${messageText(error)}`)); } box.append(list); box.hidden = false;
  for (const id of fields) $(`payment-${id}`).removeAttribute('aria-invalid');
  const map = { priceUf: 'price', requiredDownPaymentPercentage: 'down-payment', developerBonus: 'bonus', initialPayment: 'initial', reservationUf: 'reservation', reservationTreatment: 'reservation-treatment', balloon: 'balloon', installments: 'installments', startMonth: 'start-month', deliveryMonth: 'delivery-month' };
  for (const error of errors) { const name = error.field?.split('.')[0]; if (map[name]) $(`payment-${map[name]}`).setAttribute('aria-invalid', 'true'); }
}
function breakdownPair(label, value) { const node = el('div'); node.append(el('dt', '', label), el('dd', '', uf(value))); return node; }
function renderResult(result, input) {
  const b = result.breakdown, verified = input.scenarioMode === 'verified', title = [state.project?.name, state.unit?.id, state.unit?.typology].filter(Boolean).join(' · ');
  $('payment-mode').textContent = verified ? 'Cálculo con datos de fuente' : 'Simulación'; $('payment-mode').className = `payment-mode${verified ? ' verified' : ''}`;
  $('payment-result-context').textContent = `${title || 'Escenario personalizado'}${verified ? '' : ' · Valores definidos para este escenario.'}`;
  const highlights = $('payment-highlights'); highlights.replaceChildren();
  const effectiveCount = b.effectiveInstallmentCount ?? input.installments;
  for (const [label, value, help] of [['Cuota mensual', b.installmentUf, effectiveCount ? `${effectiveCount} cuota${effectiveCount === 1 ? '' : 's'} · última: ${uf(b.lastInstallmentUf)}` : 'Sin saldo para distribuir en cuotas'], ['Pago inicial por desembolsar', b.initialDueAfterReservationUf, 'Después de imputar la reserva, si corresponde'], ['Cuotón a la entrega', b.balloonUf, month(input.deliveryMonth)]]) { const card = el('article', 'payment-highlight'); card.append(el('p', '', label), el('strong', '', uf(value)), el('span', '', help)); highlights.append(card); }
  $('payment-breakdown').replaceChildren(...[
    ['Precio de la unidad', b.priceUf], ['Pie total requerido', b.requiredDownPaymentUf], ['Bono inmobiliario', b.developerBonusUf], ['Pie a cargo del comprador', b.buyerDownPaymentUf], ['Reserva', b.reservationUf], ['Reserva imputada al pie / inicial', b.reservationCreditedUf], ['Reserva adicional', b.reservationAdditionalUf], ['Pago inicial total', b.initialPaymentUf], ['Saldo distribuido en cuotas', b.installmentsPrincipalUf], ['Desembolso total del comprador', b.buyerTotalOutlayUf], ['Saldo del precio por financiar', b.financingBalanceUf]
  ].map(([label, value]) => breakdownPair(label, value)));
  const assumptions = $('payment-assumptions'); assumptions.replaceChildren(el('h4', '', verified ? 'Criterios del cálculo' : 'Supuestos de la simulación'));
  const list = el('ul');
  if (!verified) { list.append(el('li', '', 'Los valores ingresados son un escenario local; no acreditan una oferta o plan aprobado para la unidad.')); for (const [field, value] of [['Precio', uf(input.priceUf)], ['Pie requerido', pct(input.requiredDownPaymentPercentage)], ['Bono', input.developerBonus.amountUf === undefined ? pct(input.developerBonus.percentage) : uf(input.developerBonus.amountUf)], ['Reserva', `${uf(input.reservationUf)} · ${treatmentNames[input.reservationTreatment]}`], ['Inicial', input.initialPayment.amountUf === undefined ? pct(input.initialPayment.percentage) : uf(input.initialPayment.amountUf)], ['Cuotón', input.balloon.amountUf === undefined ? pct(input.balloon.percentage) : uf(input.balloon.amountUf)], ['Calendario', `${input.installments} cuotas, ${month(input.startMonth)} a ${month(input.deliveryMonth)}`]]) list.append(el('li', '', `${field}: ${value}`)); }
  for (const assumption of result.assumptions || []) list.append(el('li', '', messageText(assumption)));
  for (const warning of result.warnings || []) list.append(el('li', 'payment-warning', messageText(warning)));
  if (!list.childNodes.length) list.append(el('li', '', 'Porcentajes sobre el precio de la unidad. Importes redondeados a centésimas de UF.'));
  assumptions.append(list);
  const rows = $('payment-schedule-rows'); rows.replaceChildren();
  for (const item of result.schedule || []) { const row = el('tr'); const kind = `${paymentNames[item.kind] || 'Pago'}${item.kind === 'installment' ? ` ${item.number}` : ''}`; for (const [label, value] of [['Pago', kind], ['Mes', month(item.month)], ['Monto (UF)', fmt.format(item.amountUf)]]) { const td = el('td', '', value); td.dataset.label = label; row.append(td); } rows.append(row); }
  state.result = { result, input, context: title || 'Escenario personalizado', verified }; $('payment-results').hidden = false;
  $('mortgage-principal').value = String(b.financingBalanceUf);
  state.mortgagePrincipalSource = 'plan';
  $('mortgage-principal-source').textContent = `Saldo del precio por financiar del plan: ${uf(b.financingBalanceUf)}. Puedes cambiar el monto para evaluar otro crédito.`;
  updateMortgageControls();
}
function calculate(event) {
  event?.preventDefault(); hideResult(); for (const id of fields) $(`payment-${id}`).removeAttribute('aria-invalid');
  if (!state.calculate) { status('No se pudo cargar el cálculo. Recarga los planes para volver a intentarlo.', 'error'); return; }
  try { const input = buildInput(), result = state.calculate(input); if (!result.ok) { renderValidation(result.errors || []); return; } renderResult(result, input); }
  catch { renderValidation([{ message: 'No se pudo calcular este escenario. Revisa los valores y vuelve a intentarlo.' }]); }
}
function csvCell(value) { const cell = text(value); return `"${(/^[\s]*[=+@\-\t\r]/.test(cell) ? "'" : '') + cell.replace(/"/g, '""')}"`; }
function readMortgageNumber(id) { const value = $(`mortgage-${id}`).value; return value.trim() === '' ? null : Number(value); }
function calculateMortgage(event) {
  event?.preventDefault(); clearMortgageResult();
  if (!state.calculateMortgage) return;
  const input = { principalUf: readMortgageNumber('principal'), annualRatePercentage: readMortgageNumber('rate'), termYears: readMortgageNumber('years'), rateConvention: $('mortgage-convention').value };
  const result = state.calculateMortgage(input);
  if (!result.ok) {
    const fields = { principalUf: ['principal', 'Monto del crédito'], annualRatePercentage: ['rate', 'Tasa anual'], termYears: ['years', 'Plazo'], rateConvention: ['convention', 'Tipo de tasa'] };
    const box = $('mortgage-validation'), list = el('ul'); box.replaceChildren(el('strong', '', 'Completa los datos para estimar el dividendo.'));
    for (const error of result.errors || []) { const field = fields[error.field]; if (field) $(`mortgage-${field[0]}`).setAttribute('aria-invalid', 'true'); list.append(el('li', '', `${field ? `${field[1]}: ` : ''}${messageText(error)}`)); }
    box.append(list); box.hidden = false; return;
  }
  $('mortgage-monthly').textContent = result.monthlyPaymentUf === 0 && result.monthlyPaymentUnroundedUf > 0 ? 'Menos de 0,01 UF' : uf(result.monthlyPaymentUf);
  const convention = input.rateConvention === 'nominal' ? 'nominal anual, dividida entre 12' : 'efectiva anual, con su equivalente mensual';
  const fromPlan = state.result && state.mortgagePrincipalSource === 'plan' && input.principalUf === state.result.result.breakdown.financingBalanceUf;
  $('mortgage-result-context').textContent = `${uf(input.principalUf)} de crédito · tasa ${mortgageRateFmt.format(input.annualRatePercentage)} % ${convention} · ${input.termYears} años (${result.months} pagos mensuales).${fromPlan ? ' Monto tomado del saldo por financiar del plan.' : ' Monto personalizado, independiente del plan de pago.'}`;
  state.mortgageResult = { input, result }; $('mortgage-result').hidden = false;
}
function exportSchedule() {
  if (!state.result) return;
  const { result, input, context, verified } = state.result;
  const unitLabel = value => Object.hasOwn(value, 'amountUf') ? 'UF' : '% del precio';
  const rows = [['Tipo de cálculo', verified ? 'Cálculo con datos de fuente' : 'Simulación'], ['Referencia', context], ['Precio UF', input.priceUf], ['Pie requerido % del precio', input.requiredDownPaymentPercentage], ['Bono', unitLabel(input.developerBonus), Object.values(input.developerBonus)[0]], ['Reserva UF', input.reservationUf, treatmentNames[input.reservationTreatment]], ['Inicial', unitLabel(input.initialPayment), Object.values(input.initialPayment)[0]], ['Cuotón', unitLabel(input.balloon), Object.values(input.balloon)[0]], ['Cuotas solicitadas', input.installments], ['Mes de inicio', input.startMonth || 'Sin verificar'], ['Mes de entrega', input.deliveryMonth || 'Sin verificar'], [], ['Pago', 'Número', 'Mes', 'Monto UF']];
  for (const item of result.schedule || []) rows.push([paymentNames[item.kind] || 'Pago', item.number ?? '', item.month || 'Sin verificar', Number(item.amountUf).toFixed(2)]);
  if (state.mortgageResult) {
    const mortgage = state.mortgageResult;
    rows.push([], ['Dividendo estimado - simulación'], ['Monto del crédito UF', mortgage.input.principalUf], ['Tasa anual %', mortgage.input.annualRatePercentage], ['Tipo de tasa anual', mortgage.input.rateConvention === 'nominal' ? 'Nominal (anual / 12)' : 'Efectiva (equivalencia mensual)'], ['Plazo años', mortgage.input.termYears], ['Pagos mensuales', mortgage.result.months], ['Dividendo mensual UF - capital e intereses', mortgage.result.monthlyPaymentUf], ['No incluye seguros ni gastos. No constituye oferta ni aprobación bancaria.']);
  }
  rows.push([], ['Supuestos']); for (const assumption of result.assumptions || []) rows.push([messageText(assumption)]); for (const warning of result.warnings || []) rows.push([messageText(warning)]);
  const blob = new Blob(['\ufeff', rows.map(row => row.map(csvCell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), url = URL.createObjectURL(blob), anchor = el('a'); anchor.href = url; anchor.download = 'sollahms-plan-de-pago.csv'; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function loadData() {
  if (state.loading) return; state.loading = true; $('payment-reload').disabled = true; status('Cargando información de entrega y unidades…');
  const projectId = state.project?.id, unitId = state.unit?.id, wasDirty = state.dirty;
  const formValues = Object.fromEntries(fields.map(field => [field, $(`payment-${field}`).value]));
  try {
    const response = await fetch(`${endpoint}?op=payment-data`, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
    if (response.status === 401) { state.projects = []; state.project = null; state.unit = null; blankForm(); renderSource(); $('payment-project').replaceChildren(option('', 'Sesión terminada')); window.location.replace('/metadatos'); return; }
    if (!response.ok) throw new Error('data'); const data = await response.json(); if (!Array.isArray(data.projects)) throw new Error('data');
    state.projects = data.projects; filterProjects(false, false); state.project = null; state.unit = null;
    $('payment-typology').replaceChildren(option('', 'Todas las tipologías')); populateUnits();
    const index = projectId == null ? -1 : state.projects.findIndex(project => project.id === projectId);
    if (index >= 0 && [...$('payment-project').options].some(item => item.value === String(index))) {
      $('payment-project').value = String(index); state.project = state.projects[index];
      const types = [...new Set((state.project.units || []).map(unit => text(unit.typology)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')); $('payment-typology').replaceChildren(option('', 'Todas las tipologías'), ...types.map(value => option(value, value))); populateUnits();
      const unitIndex = unitId == null ? -1 : (state.project.units || []).findIndex(unit => unit.id === unitId); if (unitIndex >= 0) { $('payment-unit').value = String(unitIndex); state.unit = state.project.units[unitIndex]; } renderSource();
    }
    if (wasDirty) { for (const [field, value] of Object.entries(formValues)) $(`payment-${field}`).value = value; state.dirty = true; hideResult(); } else restoreSource();
    renderSource();
    status(state.projects.length ? `Información privada cargada${data.updatedAt ? ` · actualización: ${date(data.updatedAt)}` : ''}. Los datos no confirmados se muestran como «Sin verificar».` : 'Aún no hay proyectos con información de entrega. Puedes crear una simulación personalizada.');
    try { const engine = await import('/api/interno-bonos-pie?op=asset&file=payment-plan.mjs'); if (typeof engine.calculatePaymentPlan !== 'function' || typeof engine.calculateMortgageEstimate !== 'function') throw new Error('engine'); state.calculate = engine.calculatePaymentPlan; state.calculateMortgage = engine.calculateMortgageEstimate; } catch { status('La información está disponible, pero no se pudo cargar el cálculo. Recarga los planes para volver a intentarlo.', 'error'); }
  } catch { status('No pudimos cargar los planes de pago. Intenta recargar los planes.', 'error'); }
  finally { state.loading = false; $('payment-reload').disabled = false; updateFormMode(); }
}
$('payment-search').addEventListener('input', () => filterProjects());
$('payment-delivery-filter').addEventListener('change', () => filterProjects());
$('payment-project').addEventListener('change', chooseProject);
$('payment-typology').addEventListener('change', () => { populateUnits(); renderSource(); blankForm(); });
$('payment-unit').addEventListener('change', () => { const units = state.project?.units || []; state.unit = $('payment-unit').value === '' ? null : units[Number($('payment-unit').value)] || null; renderSource(); restoreSource(); });
$('payment-form').addEventListener('input', () => { state.dirty = true; hideResult(); updateFormMode(); });
$('payment-form').addEventListener('change', () => { state.dirty = true; hideResult(); updateFormMode(); });
$('payment-form').addEventListener('submit', calculate);
$('payment-restore').addEventListener('click', restoreSource);
$('payment-new').addEventListener('click', () => { blankForm(); $('payment-price').focus(); });
$('payment-use-months').addEventListener('click', () => { const count = monthCount(); if (count === null) return; $('payment-installments').value = String(count); state.dirty = true; hideResult(); updateFormMode(); });
$('payment-reload').addEventListener('click', loadData);
$('payment-export').addEventListener('click', exportSchedule);
$('mortgage-form').addEventListener('submit', calculateMortgage);
$('mortgage-form').addEventListener('input', event => { clearMortgageResult(); if (event.target.id === 'mortgage-principal') { state.mortgagePrincipalSource = 'manual'; $('mortgage-principal-source').textContent = 'Monto personalizado para este escenario; no depende del plan de pago.'; } });
$('mortgage-form').addEventListener('change', clearMortgageResult);
$('mortgage-use-balance').addEventListener('click', () => { if (!state.result) return; $('mortgage-principal').value = String(state.result.result.breakdown.financingBalanceUf); state.mortgagePrincipalSource = 'plan'; $('mortgage-principal-source').textContent = `Saldo del precio por financiar del plan: ${uf(state.result.result.breakdown.financingBalanceUf)}. Puedes cambiar el monto para evaluar otro crédito.`; clearMortgageResult(); });
$('logout').addEventListener('click', () => { state.projects = []; state.project = null; state.unit = null; blankForm(); for (const id of ['principal', 'rate', 'years', 'convention']) $(`mortgage-${id}`).value = ''; renderSource(); $('payment-project').replaceChildren(option('', 'Sesión terminada')); $('payment-unit').replaceChildren(option('', 'Sin unidades')); });
updateFormMode(); loadData();
