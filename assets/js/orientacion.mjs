import {validateCommercialFields,focusCommercialField} from './commercial-fields.mjs';
import {bindRutField} from './rut-field.mjs';
import { orientBudget, compareQuotes, benefitGuide, CHECKLIST, JOURNEY, cleanChecklist, BENEFIT_REVIEW } from './orientation-engine.mjs';
import { loadOfficialUf } from './official-uf.mjs';
import { chileDate } from './project-finance.mjs';
import { createFormOperation } from './form-operation.mjs';

const $ = id => document.getElementById(id);
const fmt = (value, digits = 2) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: digits }).format(value);
const clp = value => '$' + fmt(value, 0);
const uf = value => fmt(value) + ' UF';
const read = form => Object.fromEntries([...new FormData(form)].map(([k,v]) => [k, k === 'convention' ? v : Number(v)]));
function node(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
function lines(target, title, entries, note) {
  target.replaceChildren(node('h3', title));
  const dl = node('dl', undefined, 'metrics');
  for (const [label,value] of entries) { const row = node('div'); row.append(node('dt',label),node('dd',value)); dl.append(row); }
  target.append(dl); if(note) target.append(node('p',note,'help result-note'));
}
function invalidate(form, target) {
  // Never leave a result looking current after its inputs change.
  form.addEventListener('input', () => target.replaceChildren(node('p', 'Cambiaste los datos. Vuelve a calcular para actualizar el resultado.', 'help')));
}
let officialUf = null;
let manualUf = true;
let ufLoading = false;
const budgetForm = $('budget-form');
const budgetResult = $('budget-result');
async function refreshUf() {
  if(ufLoading) return;
  ufLoading = true;
  $('refresh-uf').disabled = true;
  $('uf-status').textContent = 'Consultando UF oficial…';
  // A manually edited scenario is not overwritten by a late network response.
  const before = $('budget-uf').value;
  officialUf = document.documentElement.dataset.orientationPreview==='true' ? null : await loadOfficialUf();
  if (officialUf && $('budget-uf').value === before) {
    $('budget-uf').value = String(officialUf.valueClp);
    manualUf = false;
    $('uf-status').textContent = `UF oficial SII: ${clp(officialUf.valueClp)} al ${officialUf.date}.`;
    if (budgetResult.dataset.calculated) budgetResult.replaceChildren(node('p','La UF cambió. Vuelve a calcular tu presupuesto.','help'));
  } else if (officialUf) {
    manualUf = true;
    $('uf-status').textContent = 'Se conservó tu UF manual. No es una referencia oficial vigente.';
  } else {
    manualUf = true;
    $('uf-status').textContent = 'UF oficial no disponible. Ingresa una referencia manual o vuelve a consultar.';
  }
  ufLoading = false; $('refresh-uf').disabled = false;
}
$('refresh-uf').addEventListener('click',refreshUf);
$('budget-uf').addEventListener('input',()=>{manualUf=true;$('uf-status').textContent='UF manual para este escenario. No se presenta como UF oficial vigente.';});
invalidate(budgetForm,budgetResult);
budgetForm.addEventListener('submit', event => {
  event.preventDefault(); if(!budgetForm.reportValidity())return;
  try {
    if(officialUf && officialUf.date !== chileDate(new Date())) manualUf=true;
    const input = read(budgetForm), r = orientBudget(input);
    lines(budgetResult, 'Precio máximo referencial', [
      ['Por dividendo',uf(r.maxByPayment)],['Por pie al horizonte',uf(r.maxBySavings)],
      ['Presupuesto mensual financiero',clp(r.monthlyBudget)],['Ahorro al horizonte',uf(r.savingsUf)],
      ['Pie del escenario resultante',uf(r.downUf)],['Dividendo financiero',uf(r.paymentUf)]
    ], `El menor límite determina este resultado (${r.limiting}). No incluye seguros ni gastos. UF ${manualUf ? 'manual' : 'oficial al '+officialUf.date}: ${clp(input.uf)}. Criterio: ${input.burden}%; tasa ${fmt(input.rate,3)}% ${input.convention === 'effective' ? 'efectiva' : 'nominal'} anual, ${input.years} años, pie ${fmt(input.down)}%.`);
    const value = node('strong', uf(r.maxPriceUf), 'big-number');
    budgetResult.insertBefore(value,budgetResult.children[1]);
    if(r.maxPriceUf < 100) budgetResult.append(node('p','El escenario no alcanza el mínimo de 100 UF del simulador. Revisa ahorro, renta y deudas antes de explorar alternativas.','help'));
    budgetResult.dataset.calculated = 'true';
  } catch(error) { budgetResult.replaceChildren(node('p',error.message,'error')); }
});
const quotesForm=$('quotes-form'), quotesResult=$('quotes-result');
invalidate(quotesForm,quotesResult);
quotesForm.addEventListener('submit',event=>{
  event.preventDefault();if(!quotesForm.reportValidity())return;
  try {
    const input=read(quotesForm),r=compareQuotes(input);
    lines(quotesResult,'Comparación financiera en UF',[
      ['Dividendo A',uf(r.a.monthlyPaymentUf)],['Dividendo B',uf(r.b.monthlyPaymentUf)],
      ['Intereses totales A',uf(r.a.totalInterestUf)],['Intereses totales B',uf(r.b.totalInterestUf)],
      ['Suma de dividendos A',uf(r.a.totalPaymentsUf)],['Suma de dividendos B',uf(r.b.totalPaymentsUf)],
      ['Diferencia mensual A − B',uf(r.monthlyDifferenceUf)]
    ], `Escenario: ${uf(input.price)}, pie ${fmt(input.down)}%, ${input.years} años; A ${fmt(input.rateA,3)}%, B ${fmt(input.rateB,3)}%, tasas anuales ${input.convention==='effective'?'efectivas':'nominales'}. La diferencia puede ser negativa. Sin seguros ni gastos, no equivale al costo total ni calcula CAE. No confirma acceso a beneficios.`);
  }catch(error){quotesResult.replaceChildren(node('p',error.message,'error'));}
});
const benefitForm=$('benefit-form'), benefitResult=$('benefit-result');
benefitForm.elements.promise.max=chileDate(new Date());
invalidate(benefitForm,benefitResult);
if(chileDate(new Date())>BENEFIT_REVIEW.reviewUntil) $('benefit-freshness').textContent='La revisión de las reglas ha vencido. Consulta los enlaces oficiales; la orientación automática está suspendida.';
benefitForm.addEventListener('submit',event=>{
  event.preventDefault();if(!benefitForm.reportValidity())return;
  try {
    const data=Object.fromEntries(new FormData(benefitForm));data.price=Number(data.price);
    const result=benefitGuide(data,chileDate(new Date()));
    benefitResult.replaceChildren(node('p',result.message,'result-note'));
  }catch(error){benefitResult.replaceChildren(node('p',error.message,'error'));}
});
const CHECK_KEY='sollahms:orientation-checklist:v1';
let checked=new Set(),remember=false;
function storeChecklist(){
  try { if(remember) localStorage.setItem(CHECK_KEY,JSON.stringify({version:1,ids:[...checked]}));else localStorage.removeItem(CHECK_KEY); }
  catch { remember=false; $('remember-checklist').checked=false;$('check-storage').textContent='No pudimos guardar o borrar las marcas del dispositivo. Esta visita continúa en memoria; puedes borrar el almacenamiento desde tu navegador.'; }
}
function renderChecklist(){
  $('check-items').replaceChildren();
  for(const item of CHECKLIST){
    const label=node('label',undefined,'check-item'), box=node('input');box.type='checkbox';box.value=item.id;box.checked=checked.has(item.id);
    const content=node('span');content.append(node('strong',item.title),node('small',item.detail));label.append(box,content);
    box.addEventListener('change',()=>{if(box.checked)checked.add(item.id);else checked.delete(item.id);updateProgress();if(remember)storeChecklist();});
    $('check-items').append(label);
  }updateProgress();
}
function updateProgress(){$('check-count').textContent=`${checked.size} de ${CHECKLIST.length} puntos revisados`;$('check-progress').value=checked.size;}
try {
  const raw=localStorage.getItem(CHECK_KEY);
  if(raw && raw.length < 2048){ const saved=JSON.parse(raw);if(saved?.version===1){checked=new Set(cleanChecklist(saved.ids));remember=true;$('remember-checklist').checked=true;$('check-storage').textContent='Se recuperaron tus marcas guardadas en este dispositivo. Puedes borrar o desactivar el guardado cuando quieras.';} }
}catch{/* blocked storage leaves all tools usable in memory */}
renderChecklist();
$('remember-checklist').addEventListener('change',()=>{remember=$('remember-checklist').checked;$('check-storage').textContent=remember?'Sólo se guardan identificadores de las marcas, en este navegador. No se envían al servidor.':'Se eliminó el guardado local. Tus marcas de esta visita siguen en memoria.';storeChecklist();});
$('reset-checklist').addEventListener('click',()=>{checked.clear();remember=false;$('remember-checklist').checked=false;$('check-storage').textContent='Marcas borradas; guardado desactivado.';storeChecklist();renderChecklist();});
$('download-checklist').addEventListener('click',()=>{
  const content='Sollahms — Checklist de compra\nOrientación general, no certificación legal.\n\n'+CHECKLIST.map(item=>`[${checked.has(item.id)?'x':' '}] ${item.title}\n${item.detail}`).join('\n\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));const a=node('a');a.href=url;a.download='sollahms-checklist.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
let stage=0;
for(const [i,item] of JOURNEY.entries()){const li=node('li'),button=node('button',item.title);button.type='button';button.addEventListener('click',()=>showStage(i,true));li.append(button);$('journey-steps').append(li);}
function showStage(index,focus=false){
  stage=index;const item=JOURNEY[index];
  $('journey-position').textContent=`ETAPA ${index+1} DE ${JOURNEY.length}`;$('journey-title').textContent=item.title;$('journey-text').textContent=item.text;
  $('journey-action').href=item.href;$('journey-action').textContent=item.action+' →';
  [...$('journey-steps').querySelectorAll('button')].forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  $('journey-prev').disabled=index===0;$('journey-next').disabled=index===JOURNEY.length-1;
  if(focus)$('journey-title').focus();
}
$('journey-prev').addEventListener('click',()=>showStage(Math.max(0,stage-1),true));$('journey-next').addEventListener('click',()=>showStage(Math.min(JOURNEY.length-1,stage+1),true));showStage(0);
const contactForm=$('orientation-contact'),contactStatus=$('contact-status');
const topics={compra:'Mi proceso de compra',presupuesto:'Presupuesto y ahorro',credito:'Crédito hipotecario',beneficios:'Subsidios y FOGAES'};
const operation=createFormOperation({name:'orientation-contact'});
const rutField=bindRutField(contactForm.elements.rut,$('orientation-rut-error'));
const errorIds={nombre:'orientation-name-error',correo:'orientation-email-error',telefono:'orientation-phone-error'};
for(const [name,id]of Object.entries(errorIds))contactForm.elements[name].addEventListener('input',()=>{contactForm.elements[name].setCustomValidity('');contactForm.elements[name].setAttribute('aria-invalid','false');$(id).textContent='';$(id).hidden=true;});
let startedAt=Date.now(),sending=false;
contactForm.addEventListener('submit',async event=>{
  event.preventDefault();if(sending)return;
  if(!rutField.validate()){rutField.focus();return;}
  const data=Object.fromEntries(new FormData(contactForm)),errors=validateCommercialFields(data);
  for(const [name,id]of Object.entries(errorIds)){const message=errors[name]||'';contactForm.elements[name].setCustomValidity(message);contactForm.elements[name].setAttribute('aria-invalid',String(Boolean(message)));$(id).textContent=message;$(id).hidden=!message;}
  if(Object.keys(errors).length){focusCommercialField(contactForm.elements[Object.keys(errors)[0]]);contactForm.reportValidity();return;}
  if(!contactForm.reportValidity())return;
  if(document.documentElement.dataset.orientationPreview==='true'){contactStatus.textContent='Vista previa: el formulario se validó sin enviar mensajes reales.';return;}
  sending=true;const button=contactForm.querySelector('button[type=submit]');button.disabled=true;button.textContent='Enviando…';contactStatus.textContent='';
  try {
    const payload={nombre:data.nombre,rut:rutField.value(),correo:data.correo,telefono:data.telefono,website:data.website,consent:contactForm.elements.consent.checked,startedAt,mensaje:`Centro de Orientación · ${topics[data.topic]||topics.compra}\n${data.mensaje}`};
    const attempt=await operation.prepare(payload);
    const response=await fetch('/api/orientation-contact',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':attempt.key},body:attempt.body,signal:AbortSignal.timeout(15000)});
    const result=await response.json().catch(()=>({}));
    if(!response.ok){if(!attempt.reused&&([400,403,413,415].includes(response.status)||result.code==='preview_read_only'))operation.discard();throw new Error(result.error||'No pudimos confirmar el envío. Reintenta con los mismos datos o escribe a contacto@sollahms.cl.');}
    const persisted=result?.ok===true&&result.persisted===true&&result.providerAccepted===undefined&&result.deliveryConfirmed===undefined;
    const providerAccepted=result?.ok===true&&result.providerAccepted===true&&result.deliveryConfirmed===false&&result.persisted===undefined;
    if(!persisted&&!providerAccepted)throw new Error('No pudimos confirmar el envío. Conserva tus datos al reintentar.');
    operation.complete();contactForm.reset();rutField.clear();startedAt=Date.now();contactStatus.textContent=persisted?'Solicitud registrada correctamente. El equipo responderá a tu correo.':'Solicitud aceptada para envío. La recepción por Sollahms aún no está confirmada.';
  }catch(error){operation.uncertain();contactStatus.textContent=error.name==='TimeoutError'?'No pudimos confirmar el envío a tiempo. Conserva los mismos datos al reintentar.':error.message;}
  finally{sending=false;button.disabled=false;button.textContent='Solicitar orientación →';}
});
// Financial values remain in memory. Refresh provenance on date changes; never silently recalculate.
window.addEventListener('pageshow',()=>{if(officialUf&&officialUf.date!==chileDate(new Date())){manualUf=true;$('uf-status').textContent='La referencia UF pertenece a otro día. Vuelve a consultar o úsala sólo como referencia manual.';budgetResult.replaceChildren(node('p','La fecha de referencia cambió. Vuelve a calcular.','help'));}});
document.querySelectorAll('fieldset[data-interactive]').forEach(fieldset=>{fieldset.disabled=false;});
void refreshUf();
