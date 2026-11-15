import {event,aggregate,TTL,session} from './core.mjs';
import {openStore} from './store.mjs';
import {canonical,receiptFor} from './fixtures.mjs';
import {storageTests} from './browser-tests.mjs';
import {Ownership} from './ownership.mjs';
import {exportData,csv} from './export.mjs';
import {ownershipTests} from './ownership-tests.mjs';
import {previewOnly} from './preview-config.mjs';
const $=id=>document.getElementById(id),uuid=()=>crypto.randomUUID();
const allowed=previewOnly&&(/\.vercel\.app$/.test(location.hostname)||['localhost','127.0.0.1'].includes(location.hostname));
let db,run,state,busy=false;const owner=new Ownership(navigator.locks);const key='sollahms:cta-lab:v1';
const say=text=>{if($('lab-status'))$('lab-status').textContent=text;};
function save(){sessionStorage.setItem(key,JSON.stringify({run,state}));}
function diagnostic(){if($('session-info'))$('session-info').textContent=`Sesión sintética: ${state?.id?.slice(0,8)??'sin sesión'} · CTA: ${state?.cta??'ninguno'} · Lock: ${owner.id===state?.id&&owner.id?'adquirido':'libre'} · Chrome/UA: ${navigator.userAgent}`;}
async function ownership(){
 owner.locks=sessionStorage.getItem('cta-no-locks')==='yes'?null:navigator.locks;
 state=await owner.acquire(state);save();diagnostic();
}
addEventListener('pagehide',()=>owner.release());
addEventListener('pageshow',e=>{if(e.persisted&&run)ownership().catch(error=>say(error.message));});
async function emit(type,options={}){
 if(!run)throw Error('Inicia un recorrido sintético en el panel');
 if(!(await db.all('runs')).some(x=>x.id===run.id)){await owner.release();sessionStorage.removeItem(key);run=null;state=null;diagnostic();throw Error('Cohorte eliminada: inicia otra prueba');}
 state=session(state,Date.now(),uuid);await ownership();
 const r=event(state,type,{run:run.id,now:Date.now(),uuid,...options});state=r.state;save();diagnostic();
 const proof=['advisory_accepted','advisory_delivered'].includes(type)?receiptFor(r.event,type==='advisory_accepted'?'accepted':'delivered'):null;
 await db.enqueue(r.event,proof);if(sessionStorage.getItem('cta-lab-offline')!=='yes')await db.flush();return r.event;
}
async function render(){
 if(!$('metrics'))return;const runs=(await db.all('runs')).sort((a,b)=>a.from-b.from);const current=runs.find(x=>x.id===$('cohort').value)||runs.at(-1);
 $('cohort').replaceChildren(...runs.map(x=>Object.assign(document.createElement('option'),{value:x.id,textContent:x.label})));if(!current){for(const id of ['rates','ctas','period','coverage'])$(id).textContent='Sin datos';$('export').onclick=null;$('export-csv').onclick=null;$('export-content').value='';$('metrics').textContent='Sin eventos. Carga una cohorte sintética o inicia un recorrido de prueba.';return;}$('cohort').value=current.id;
 const ev=(await db.all('events')).map(x=>x.event),queue=(await db.all('queue')).filter(x=>x.e.run===current.id);const m=aggregate(ev,{run:current.id,from:current.from,to:current.to,expected:current.expected,expectedPayloads:current.expectedPayloads,pending:queue.length});
 $('period').textContent=new Date(m.from).toLocaleString('es-CL',{timeZone:'America/Santiago'})+' → '+new Date(m.to).toLocaleString('es-CL',{timeZone:'America/Santiago'})+' · America/Santiago';
 $('coverage').textContent=`${m.coverage}. Muestra: ${m.sample} sesiones. Pendientes: ${m.pending}. No atribuibles: ${m.unattributable}. Eventos faltantes: ${m.missing??'no determinable'}. Secuencias sin respaldo: ${m.broken}.`;
 const names={guide_view:'Visitas únicas a la guía',tax_advisory_click:'Sesiones con clic',agenda_view:'Agenda atribuida',advisory_form_start:'Formularios iniciados',advisory_accepted:'Solicitudes aceptadas',advisory_delivered:'Entregas confirmadas'};
 $('metrics').replaceChildren(...Object.entries(m.counts).map(([k,v])=>{const a=document.createElement('article');const n=document.createElement('strong');n.textContent=v;const p=document.createElement('p');p.textContent=names[k];a.append(n,p);return a;}));
 $('ctas').replaceChildren(...Object.entries(m.clicks).map(([k,v])=>{const p=document.createElement('p');p.textContent=`${k}: ${v} sesiones únicas`;return p;}));
 const labels={ctr:'CTR de la guía',guide_conversion:'Guía → solicitud',click_conversion:'Clic → solicitud',delivery:'Tasa de entrega'};
 $('rates').replaceChildren(...Object.entries(m.rates).map(([k,v])=>{const tr=document.createElement('tr');for(const x of [labels[k],v.numerator,v.denominator,v.value===null?'NO DISPONIBLE':v.value.toFixed(1)+' %']){const td=document.createElement('td');td.textContent=x;tr.append(td);}return tr;}));
 const data=JSON.stringify(exportData(m),null,2);$('export-content').value=data;
 const download=(text,type,name)=>{let u;try{if($('block-export').checked)throw Error('Bloqueo simulado');const a=document.createElement('a');u=URL.createObjectURL(new Blob([text],{type}));a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);say('Descarga solicitada; verifica el archivo. Si Chrome la bloqueó silenciosamente, usa «Descarga bloqueada» o copia el JSON visible. La página no puede confirmar el guardado en disco.');}catch(error){if(u)URL.revokeObjectURL(u);say('No se pudo descargar: '+error.message+'. El JSON agregado sigue disponible para copiar.');}};
 $('export').onclick=()=>download(data,'application/json','cta-sintetico-agregado.json');
 $('export-csv').onclick=()=>download(csv(m),'text/csv;charset=utf-8','cta-sintetico-agregado.csv');

}
async function action(fn){if(busy)return;busy=true;try{await fn();await render();}catch(e){say(e.message+' · No se envió información a servicios externos.');}finally{busy=false;}}
if(!allowed){say('Laboratorio bloqueado fuera del entorno privado.');}else try{
 db=await openStore();const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved?.run&&saved?.state&&(await db.all('runs')).some(x=>x.id===saved.run.id)){run=saved.run;state=saved.state;await ownership();}diagnostic();
 $('refresh')?.addEventListener('click',()=>action(async()=>{diagnostic();}));
 $('lock-test')?.addEventListener('click',()=>action(async()=>say(JSON.stringify(await ownershipTests()))));
 $('download-blocked')?.addEventListener('click',()=>say('Descarga bloqueada o no confirmada. Copia el JSON agregado visible; no se afirma que exista un archivo guardado.'));
 $('selftest')?.addEventListener('click',()=>action(async()=>{const r=await storageTests();say(JSON.stringify(r));}));
 $('start')?.addEventListener('click',()=>action(async()=>{await owner.release();run={id:uuid(),label:'Recorrido manual sintético · cobertura no certificada',from:Date.now(),to:Date.now()+86400000,expected:null};state={id:uuid(),last:Date.now(),seq:0,cta:null};await db.putRun(run);save();await ownership();location.href='/guia.html';}));
 $('join')?.addEventListener('click',()=>action(async()=>{const chosen=(await db.all('runs')).find(x=>x.id===$('cohort').value);if(!chosen||chosen.expected)throw Error('Selecciona una cohorte manual');await owner.release();run=chosen;state={id:uuid(),last:Date.now(),seq:0,cta:null};save();await ownership();location.href='/guia.html';}));
 $('fixture')?.addEventListener('click',()=>action(async()=>{const f=canonical();await db.putRun(f.run);for(const x of f.events)await db.enqueue(x.e,x.proof);await db.flush();$('cohort').value='';say('Cohorte sintética: 3 sesiones, 2 aceptaciones y 1 entrega verificada por fixture.');}));
 $('retry')?.addEventListener('click',()=>action(async()=>{sessionStorage.removeItem('cta-lab-offline');await db.flush();say('Cola conciliada; reintentos deduplicados.');}));
 $('offline')?.addEventListener('click',()=>{sessionStorage.setItem('cta-lab-offline','yes');say('Transporte simulado desconectado. Los eventos quedan en cola local.');});
 $('expire')?.addEventListener('click',()=>{if(state){state.last=Date.now()-TTL;save();}say('Sesión marcada como expirada para la próxima interacción.');});
 $('clear')?.addEventListener('click',()=>action(async()=>{await db.clear();sessionStorage.removeItem(key);sessionStorage.removeItem('cta-lab-offline');await owner.release();run=null;state=null;diagnostic();say('Solo se eliminaron datos sintéticos locales del laboratorio.');}));
 $('cohort')?.addEventListener('change',render);
 if(document.body.dataset.page==='guide'&&run)await emit('guide_view');
 for(const a of document.querySelectorAll('[data-cta]'))a.addEventListener('click',e=>{e.preventDefault();action(async()=>{await emit('tax_advisory_click',{cta:a.dataset.cta});location.href=a.href;});});
 if(document.body.dataset.page==='agenda'){
 if(run)await emit('agenda_view');let started=false,accepted=null;const form=$('synthetic-form');
 const begin=async e=>{if(!e.isTrusted||started||!run)return;started=true;try{await emit('advisory_form_start');}catch(error){started=false;say(error.message);}};
 form.addEventListener('change',begin);form.addEventListener('input',begin);
 form.addEventListener('submit',e=>{e.preventDefault();action(async()=>{if(!$('synthetic-ready').checked){say('Formulario incompleto: sin aceptación ni entrega.');return;}if(!started){say('Interactúa con el control sintético antes de enviar.');return;}if($('outcome').value==='rejected'){say('Proveedor simulado rechazó la solicitud: sin advisory_accepted.');return;}if(accepted){say('Operación sintética ya aceptada; no se crea una solicitud duplicada.');return;}accepted=await emit('advisory_accepted',{request:uuid(),receipt:uuid()});$('deliver').disabled=false;say('Aceptación sintética registrada. NO implica entrega.');});});
 $('deliver').addEventListener('click',()=>action(async()=>{if(!accepted)return;const e={...accepted,id:uuid(),seq:accepted.seq+1,type:'advisory_delivered',receipt:uuid(),at:Date.now()};await db.enqueue(e,receiptFor(e,'delivered'));if(sessionStorage.getItem('cta-lab-offline')!=='yes')await db.flush();$('deliver').disabled=true;say('Entrega sintética respaldada por comprobante de fixture. No se envió correo.');}));
 }
 await render();if(!run&&document.body.dataset.page!=='panel')say('No hay sesión activa. Inicia un recorrido sintético desde el panel.');
}catch(e){say('Captura deshabilitada: '+e.message);}
