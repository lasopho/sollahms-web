import {orient,choices,labels,catalogUrl} from './purchase-stage-engine.mjs?v=20261029-1';
const $=id=>document.getElementById(id),form=$('ps-form'),result=$('ps-result');
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const answers=()=>Object.fromEntries(Object.keys(choices).map(key=>[key,form.querySelector('input[name="'+key+'"]:checked')?.value??'']));
const risk={blanco:['Puede implicar una espera más larga y cambios antes de escriturar.','Verifica especificaciones, fecha contractual, protección de anticipos y condiciones del saldo.'],verde:['La obra puede atrasarse y el financiamiento definitivo puede cambiar.','Verifica avance actual, calendario del pie, fecha comprometida y condición de financiamiento.'],inmediata:['El pie y los gastos pueden ser más próximos; todavía existen trámites de compra.','Confirma la unidad disponible, habilitación legal aplicable, revisión física, escritura y entrega efectiva.']};
function update(){const a=answers(),n=Object.keys(choices).filter(k=>choices[k].includes(a[k])).length;$('ps-progress').value=n;$('ps-progress-label').textContent=n+' de 4';result.hidden=true;$('ps-error').hidden=true;$('ps-status').textContent=n+' de 4 preguntas respondidas.';}
form.addEventListener('submit',event=>{
  event.preventDefault();const a=answers(),r=orient(a);
  if(!r){$('ps-error').textContent='Responde las cuatro preguntas para obtener una orientación.';$('ps-error').hidden=false;const key=Object.keys(choices).find(k=>!choices[k].includes(a[k]));form.querySelector('input[name="'+key+'"]').focus();return;}
  $('ps-error').hidden=true;$('ps-result-title').textContent=r.conditional?'Entrega inmediata, con condiciones por resolver':r.modes.length===1?labels[r.modes[0]]:'Más de una alternativa puede acomodarse a ti';
  $('ps-reasons').replaceChildren(...r.reasons.map(t=>el('p',t)));
  $('ps-warnings').replaceChildren(...r.warnings.map(t=>el('p',t,'ps-warning')));
  $('ps-context').textContent=r.context;
  $('ps-result-cards').replaceChildren(...r.modes.map(mode=>{const card=el('article',null,'ps-result-card');card.append(el('h4',labels[mode]),el('p',risk[mode][0]),el('p',risk[mode][1]));const link=el('a','Revisar ventajas y riesgos');link.href='#'+mode;link.setAttribute('aria-label','Revisar ventajas y riesgos de '+labels[mode].toLowerCase());card.append(link);return card;}));
  $('ps-projects').href=catalogUrl(r.modes);result.hidden=false;$('ps-result-title').focus();result.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});$('ps-status').textContent='Orientación disponible. '+r.modes.map(m=>labels[m]).join(', ')+'.';
});
form.addEventListener('change',update);
form.addEventListener('reset',()=>{queueMicrotask(()=>{update();form.querySelector('input').focus();});});
$('ps-edit').addEventListener('click',()=>{form.querySelector('input').focus();form.scrollIntoView({block:'start'});});
form.querySelectorAll('fieldset,button').forEach(e=>e.disabled=false);update();
