import {calculateGuide,parseGuideNumber,guideProjectContext} from './mortgage-guide-engine.mjs?v=20261029-euro-1';
import {loadOfficialUf,UF_CLIENT_REFRESH_MS} from './official-uf.mjs';
import {getUfStatus} from './mortgage-data.mjs';
const number=new Intl.NumberFormat('es-CL',{minimumFractionDigits:2,maximumFractionDigits:2});
const pesos=new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0});
const labels={insuranceUf:'seguros mensuales',monthlyFeesUf:'otros cargos mensuales',upfrontFeesUf:'gastos iniciales'};
export function initGuide(root){
  const $=id=>root.querySelector('#'+id),fields=['propertyUf','downValue','annualRatePercent','years','insuranceUf','monthlyFeesUf','upfrontFeesUf'];
  let uf=null,last=null,project=null,refreshing=false,contextRequest=0;
  function dirty(){last=null;$('gh-results').hidden=true;$('gh-empty').hidden=false;$('gh-empty').textContent='Ingresa tus supuestos y calcula para ver el escenario. No necesitas entregar datos personales.';$('gh-status').textContent='';}
  function clearErrors(){for(const name of fields){$('gh-'+name).removeAttribute('aria-invalid');$('gh-'+name+'-error').textContent='';}$('gh-error').hidden=true;}
  function formatAmount(value){return 'UF '+number.format(value);}
  function currentUf(){return uf&&getUfStatus(uf,new Date()).usable?uf:null;}
  function amount(id,value){
    const target=$(id);target.querySelector('[data-uf]').textContent=value===null?'Sin informar':formatAmount(value);
    const current=currentUf();target.querySelector('[data-clp]').textContent=value!==null&&current?pesos.format(value*current.valueClp)+' a la UF indicada':value===null?'No se supone costo cero.':'Conversión a pesos pendiente de UF vigente.';
  }
  function render(result,moveFocus=false){
    for(const a of root.querySelectorAll('[data-guide-advice]')){const url=new URL(a.href,location.origin);url.searchParams.set('origen','simulador');a.href=url.pathname+url.search+url.hash;}
    $('gh-empty').hidden=true;$('gh-results').hidden=false;
    amount('gh-payment',result.monthlyBaseUf);amount('gh-payment-insurance',result.monthlyWithInsuranceUf);amount('gh-down-result',result.downPaymentUf);amount('gh-principal-result',result.principalUf);
    amount('gh-interest-result',result.totalInterestUf);amount('gh-total-base',result.totalBaseUf);amount('gh-initial-result',result.initialKnownUf);amount('gh-total-known',result.totalKnownCreditUf);
    $('gh-known-label').textContent=result.missingCosts.length?'Subtotal del crédito con costos informados':'Total modelado del crédito';
    $('gh-initial-note').textContent=result.upfrontFeesUf===null?'Sólo pie; faltan gastos iniciales.':'Pie más gastos iniciales informados.';
    $('gh-cost-note').textContent=(result.missingCosts.length?'Faltan '+result.missingCosts.map(k=>labels[k]).join(', ')+'. Los montos desconocidos no están incluidos. ':'Incluye capital, intereses y los costos ingresados. ')+'No es una CAE ni un CTC contractual. Seguros y cargos mensuales se mantienen constantes en UF sólo para este ejercicio.';
    $('gh-financing-result').textContent=number.format(result.financingPercent)+'% de financiamiento · '+number.format(result.downPaymentPercent)+'% de pie';
    $('gh-rate-note').textContent=number.format(result.annualRatePercent)+'% anual '+(result.rateConvention==='nominal'?'nominal convertible mensualmente':'efectiva')+' · '+result.years+' años · '+result.months+' cuotas. Tasa constante durante todo el plazo; sin gracia ni capitalización de gastos. '+(result.principalUf===0?'Este escenario no requiere crédito.':'Los porcentajes simulados no representan financiamiento aprobado.');
    const total=result.downPaymentUf+result.principalUf;const bar=$('gh-down-bar');bar.style.width=(result.downPaymentUf/total*100)+'%';$('gh-finance-bar').style.width=(result.principalUf/total*100)+'%';
    const body=$('gh-schedule');body.replaceChildren();
    for(const row of result.schedule){const tr=document.createElement('tr');for(const [i,value] of [row.year,row.principalUf,row.interestUf,row.balanceUf].entries()){const cell=document.createElement(i===0?'th':'td');if(i===0)cell.scope='row';cell.textContent=i===0?String(value):number.format(value);tr.append(cell);}body.append(tr);}
    $('gh-status').textContent='Escenario calculado: dividendo base '+formatAmount(result.monthlyBaseUf)+' mensuales. Referencial, sin evaluación bancaria.';
    if(moveFocus){$('gh-results').focus({preventScroll:true});$('gh-results').scrollIntoView({block:'start'});}
  }
  function calculate(){
    clearErrors();last=null;const input={downMode:$('gh-downMode').value,rateConvention:$('gh-rateConvention').value};
    try{
      for(const field of fields)input[field]=parseGuideNumber($('gh-'+field).value,field,{optional:Object.hasOwn(labels,field),decimals:['annualRatePercent','downValue'].includes(field)?4:2});
      last=calculateGuide(input);render(last,true);
    }catch(error){
      $('gh-results').hidden=true;$('gh-empty').hidden=false;$('gh-error').hidden=false;$('gh-error').textContent=error.message||'Revisa los datos ingresados.';
      const field=fields.includes(error.field)?error.field:null;if(field){$('gh-'+field).setAttribute('aria-invalid','true');$('gh-'+field+'-error').textContent=error.message;const disclosure=$('gh-'+field).closest('details');if(disclosure)disclosure.open=true;$('gh-'+field).focus();}else $('gh-error').focus();
    }
  }
  function modeChanged(){
    const mode=$('gh-downMode').value;$('gh-down-label').textContent=mode==='uf'?'Monto del pie · UF':mode==='financing'?'Financiamiento solicitado · %':'Pie · %';
    // Clear the old unit so 20 UF cannot silently become a 20% down payment.
    $('gh-downValue').value='';dirty();
  }
  for(const field of fields)$('gh-'+field).addEventListener('input',()=>{dirty();$('gh-'+field).removeAttribute('aria-invalid');$('gh-'+field+'-error').textContent='';});
  $('gh-downMode').addEventListener('change',modeChanged);$('gh-rateConvention').addEventListener('change',dirty);$('gh-calculate').addEventListener('click',calculate);
  $('gh-inputs').addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.tagName==='INPUT'){event.preventDefault();calculate();}});
  $('gh-example').addEventListener('click',()=>{
    // Explicit opt-in example, never a default offer or an altered catalogue price.
    contextRequest++;project=null;$('gh-propertyUf').readOnly=false;$('gh-propertyUf').disabled=false;$('gh-project').hidden=true;$('gh-project-remove').hidden=true;
    for(const link of root.querySelectorAll('[data-guide-advice]'))link.href='/contacto.html?origen=guia-hipotecaria#solicitar-asesoria';
    for(const [key,value] of Object.entries({propertyUf:'4000',downValue:'20',annualRatePercent:'4',years:'20',insuranceUf:'',monthlyFeesUf:'',upfrontFeesUf:''}))$('gh-'+key).value=value;
    $('gh-downMode').value='percent';$('gh-down-label').textContent='Pie · %';$('gh-rateConvention').value='nominal';$('gh-example-note').hidden=false;calculate();
  });
  function detachProject(){contextRequest++;project=null;$('gh-propertyUf').readOnly=false;$('gh-propertyUf').disabled=false;$('gh-project').hidden=true;$('gh-project-remove').hidden=true;$('gh-propertyUf').readOnly=false;$('gh-propertyUf').value='';for(const a of root.querySelectorAll('[data-guide-advice]'))a.href='/contacto.html?origen=guia-hipotecaria#solicitar-asesoria';dirty();}
  $('gh-project-remove').addEventListener('click',detachProject);
  $('gh-reset').addEventListener('click',()=>{detachProject();for(const name of fields)$('gh-'+name).value='';$('gh-downMode').value='percent';$('gh-down-label').textContent='Pie · %';$('gh-rateConvention').value='nominal';$('gh-example-note').hidden=true;clearErrors();$('gh-propertyUf').focus();});
  async function refreshUf(){
    if(refreshing)return;refreshing=true;$('gh-refresh-uf').disabled=true;
    uf=await loadOfficialUf();const current=currentUf();
    $('gh-uf-value').textContent=current?number.format(current.valueClp)+' pesos por UF':'UF vigente no disponible';
    $('gh-uf-date').textContent=current?'Valor del '+current.date.split('-').reverse().join('/')+' · Servicio de Impuestos Internos.':'Puedes calcular en UF. Reintenta para obtener la conversión a pesos; no se usa un valor antiguo.';
    $('gh-uf-source').href=current?.source.url||'https://www.sii.cl/valores_y_fechas/uf/uf2026.htm';
    if(last)render(last);refreshing=false;$('gh-refresh-uf').disabled=false;
  }
  $('gh-refresh-uf').addEventListener('click',refreshUf);refreshUf();
  setInterval(()=>{if(!document.hidden)refreshUf();},UF_CLIENT_REFRESH_MS);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshUf();});
  if(new URLSearchParams(location.search).has('proyecto')){
    const request=++contextRequest;
    $('gh-project').hidden=false;$('gh-project').textContent='Comprobando el precio publicado del proyecto…';$('gh-propertyUf').disabled=true;
    fetch('/data/proyectos.json',{cache:'no-store',signal:AbortSignal.timeout(6500)}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(rows=>{
      if(request!==contextRequest)return;project=guideProjectContext(location.search,rows);if(!project)throw Error();
      $('gh-project').textContent=project.name+' · '+project.developer+(project.typology?' · '+project.typology:'')+'. '+(project.propertyUf===null?'Precio desde por consultar; puedes crear un escenario propio.':'Precio desde vigente de Sollahms. No identifica el precio de una unidad ni asegura financiamiento.');
      if(project.propertyUf!==null){$('gh-propertyUf').value=String(project.propertyUf);$('gh-propertyUf').readOnly=true;$('gh-project-remove').hidden=false;}
      for(const a of root.querySelectorAll('[data-guide-advice]'))a.href='/contacto.html?proyecto='+encodeURIComponent(project.slug)+(project.offerId?'&oferta='+encodeURIComponent(project.offerId):'')+'&origen=guia-hipotecaria#solicitar-asesoria';
    }).catch(()=>{if(request!==contextRequest)return;$('gh-project').textContent='No pudimos comprobar ese proyecto. No se incorporó ningún precio de la URL; puedes ingresar un escenario propio.';}).finally(()=>{$('gh-propertyUf').disabled=false;});
  }
}
if(typeof document!=='undefined'){const root=document.querySelector('[data-mortgage-guide]');if(root)initGuide(root);}
