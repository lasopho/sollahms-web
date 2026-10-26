import { createFormOperation } from './form-operation.mjs';
import { resolveProjectIdentity } from './project-identity.mjs';
import { normalizeRut, RUT_ERROR } from './rut.mjs';
import { bindRutField } from './rut-field.mjs';

/** Use the existing advisory contract; no new destination or provider fields. */
export function composeProjectRequest({values,project,intent,startedAt}) {
  if (!project?.bodyProjectSlug || !/^\/[a-z0-9-]+\.html(?:#etapa-\d+)?$/.test(project.detalleUrl || '')) throw Error('No pudimos identificar el proyecto. Abre la solicitud desde su ficha.');
  if (!['cotizacion','llamada'].includes(intent)) throw Error('Selecciona el tipo de solicitud.');
  const rut=normalizeRut(values.rut??'');if(rut===null)throw Error(RUT_ERROR);
  const medio = intent === 'llamada' ? 'telefono' : values.medio;
  const message = String(values.mensaje || '').trim(), time = String(values.franja || '').trim();
  if (message.length > 1600 || time.length > 100) throw Error('Reduce el mensaje o la preferencia horaria antes de enviar.');
  const lines = ['Solicitud: '+(intent === 'llamada' ? 'Quiero que me llamen' : 'Solicitar cotización'),
    'Ficha de origen: https://sollahms.cl'+project.detalleUrl];
  if (intent === 'llamada' && time) lines.push('Horario preferido (no es una reserva): '+time);
  if (message) lines.push('Mensaje del visitante: '+message);
  const mensaje=lines.join('\n');
  if (mensaje.length>2000) throw Error('Reduce el mensaje antes de enviar.');
  return {nombre:String(values.nombre || '').trim(),...(rut?{rut}:{}),medio,
    ...(medio==='telefono' ? {telefono:String(values.telefono || '').trim()} : {correo:String(values.correo || '').trim()}),
    objetivo:values.objetivo || '',mensaje,consent:values.consent===true,
    website:values.website || '',startedAt,proyecto:project.bodyProjectSlug};
}

export function validateProjectRequest(values,intent) {
  const errors={};
  if (!values.nombre?.trim() || values.nombre.trim().length>100 || /[\u0000-\u001f\u007f]/.test(values.nombre)) errors.nombre='Escribe tu nombre.';
  if(normalizeRut(values.rut??'')===null)errors.rut=RUT_ERROR;
  const medio=intent==='llamada'?'telefono':values.medio;
  if (medio==='correo' && (!/^[^\s@<>(),;:"\\]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9]{2,63}$/i.test(values.correo?.trim() || '') || values.correo.trim().length>254)) errors.correo='Escribe un correo válido, por ejemplo nombre@ejemplo.cl.';
  if (medio==='telefono') {const v=values.telefono?.trim()||'',digits=(v.match(/\d/g)||[]).length;if(!/^[+()\d .-]+$/.test(v)||digits<9||digits>15||v.length>30)errors.telefono='Escribe un teléfono válido con código de país.';}
  if (!['correo','telefono'].includes(medio)) errors.medio='Elige cómo prefieres que te contactemos.';
  if (String(values.mensaje||'').length>1600)errors.mensaje='Usa hasta 1.600 caracteres en tu mensaje.';
  if (values.consent!==true)errors.consent='Autoriza el uso de tus datos para responder la solicitud.';
  return errors;
}

if (typeof document!=='undefined') {
  const form=document.querySelector('form[data-project-request]');
  if(form) initializeProjectRequest(form);
}

function initializeProjectRequest(form) {
  const panel=form.closest('[data-project-slug]'),fields=document.getElementById('advisory-fields'),status=document.getElementById('advisory-status');
  const main=form.closest('main'),header=document.querySelector('body>header');
  const headerSize=()=>{if(header)main.style.setProperty('--pj-header-height',header.getBoundingClientRect().height+'px');};
  headerSize();if(header&&'ResizeObserver' in window)new ResizeObserver(headerSize).observe(header);
  const submit=form.querySelector('button[type=submit]'),modes=panel.querySelectorAll('[data-request-mode]');
  const ids={nombre:'name',rut:'rut',correo:'email',telefono:'phone',mensaje:'message',consent:'consent'};
  const inputs=Object.fromEntries(Object.keys(ids).map(n=>[n,form.elements[n]]));
  const rutField=bindRutField(inputs.rut,document.getElementById('advisory-rut-error'));
  const startedAt=Date.now(),operation=createFormOperation({name:'project-request:'+panel.dataset.projectSlug});
  let intent='cotizacion',quoteChannel='correo',sending=false,completed=false,project=null,catalogue=null;
  let stage=/^#etapa-([1-9]\d?)$/.exec(location.hash)?.[1] ?? null;
  const show=(message,state='error')=>{status.textContent=message;status.dataset.state=state;};
  const error=(name,message)=>{const e=document.getElementById('advisory-'+ids[name]+'-error');if(!e||!inputs[name])return;e.textContent=message;e.hidden=!message;inputs[name].setAttribute('aria-invalid',String(!!message));};
  const values=()=>({...Object.fromEntries(new FormData(form)),consent:inputs.consent.checked});
  const switchChannel=()=>{
    const phone=intent==='llamada'||form.elements.medio.value==='telefono';
    document.getElementById('advisory-email-field').hidden=phone;document.getElementById('advisory-phone-field').hidden=!phone;
    inputs.correo.disabled=phone;inputs.correo.required=!phone;inputs.telefono.disabled=!phone;inputs.telefono.required=phone;
    error('correo','');error('telefono','');
  };
  const setMode=mode=>{
    if(sending||completed)return;
    if(mode==='llamada'&&intent!=='llamada')quoteChannel=form.elements.medio.value;
    intent=mode;
    form.elements.medio.value=mode==='llamada'?'telefono':quoteChannel;
    form.querySelector('.advisory-choice').hidden=mode==='llamada';
    document.getElementById('advisory-time-field').hidden=mode!=='llamada';form.elements.franja.disabled=mode!=='llamada';
    document.getElementById('advisory-form-title').textContent=mode==='llamada'?'Quiero que me llamen':'Solicitar cotización';
    panel.querySelector('.advisory-form-intro').textContent=mode==='llamada'?'Deja tu nombre y teléfono para coordinar una conversación sobre este proyecto. El horario es una preferencia, no una cita confirmada.':'Deja tu nombre y un medio de contacto. Confirmaremos la información necesaria para preparar una respuesta sobre este proyecto.';
    submit.textContent=mode==='llamada'?'Solicitar llamada':'Solicitar cotización';
    modes.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.requestMode===mode)));
    switchChannel();
  };
  const resolve=()=>{
    project=resolveProjectIdentity(catalogue,panel.dataset.projectSlug,stage);
    if(!project)throw Error('No pudimos identificar el proyecto. Conserva tus datos y vuelve a abrir la solicitud desde su ficha.');
    document.getElementById('advisory-project-context').textContent='Tu solicitud sobre '+project.nombre;
  };
  const contextReady=(async()=>{
    const response=await fetch('/data/proyectos.json',{signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw Error('No pudimos cargar el proyecto. Conserva tus datos e intenta nuevamente desde su ficha.');
    catalogue=await response.json();resolve();
  })();
  // Handle rejection now as well as at submit, avoiding an unhandled promise.
  contextReady.catch(()=>{});
  form.querySelectorAll('[name=medio]').forEach(e=>e.addEventListener('change',()=>{quoteChannel=form.elements.medio.value;switchChannel();}));
  for(const [name,input] of Object.entries(inputs))input.addEventListener('input',()=>error(name,''));
  modes.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.requestMode)));
  document.addEventListener('click',event=>{
    const a=event.target.closest('a[data-request-intent]');if(!a)return;
    setMode(a.dataset.requestIntent);
    if(!completed&&!sending)inputs.nombre.focus({preventScroll:true});
  });
  window.addEventListener('hashchange',()=>{
    const requested=/^#etapa-([1-9]\d?)$/.exec(location.hash)?.[1];
    if(requested&&!sending&&!completed){stage=requested;if(catalogue)try{resolve();}catch(e){show(e.message);}}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||completed)return;
    Object.keys(inputs).forEach(n=>error(n,''));
    rutField.validate();
    const entered=values(),invalid=validateProjectRequest(entered,intent);
    if(Object.keys(invalid).length){
      for(const [name,message] of Object.entries(invalid))error(name,message);
      show('Revisa los campos indicados. Aún no se ha enviado tu solicitud.');
      inputs[Object.keys(invalid)[0]]?.focus();return;
    }
    sending=true;submit.disabled=true;submit.textContent='Enviando…';modes.forEach(b=>b.disabled=true);form.setAttribute('aria-busy','true');show('Estamos enviando tu solicitud.','sending');
    try{
      await contextReady;resolve();
      const payload=composeProjectRequest({values:entered,project,intent,startedAt});
      const attempt=await operation.prepare(payload);fields.disabled=true;
      const response=await fetch('/api/advisory',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':attempt.key},body:attempt.body,signal:AbortSignal.timeout(15000)});
      const result=await response.json();
      if(!response.ok){
        if(!attempt.reused&&([400,403,413,415].includes(response.status)||['preview_read_only','contact_configuration_unavailable'].includes(result.code)))operation.discard();
        for(const [name,message] of Object.entries(result.fieldErrors||{}))error(name,message);
        throw Error(result.error||'No pudimos confirmar el envío. Reintenta sin cambiar los datos.');
      }
      if(result.ok!==true||result.providerAccepted!==true||result.deliveryConfirmed!==false)throw Error('No pudimos confirmar el envío. Reintenta sin cambiar los datos o escribe a contacto@sollahms.cl.');
      completed=true;operation.complete();form.reset();show('Solicitud '+(intent==='llamada'?'de llamada':'de cotización')+' aceptada para envío a Sollahms. Este aviso no confirma entrega al buzón, disponibilidad ni una cita. Usaremos el medio elegido para coordinar el siguiente paso.','success');status.focus();
    }catch(e){
      operation.uncertain();show(['TypeError','TimeoutError','SyntaxError'].includes(e.name)?'No pudimos confirmar el envío. Tus datos siguen aquí. Reintenta sin cambiarlos o escribe a contacto@sollahms.cl.':e.message);status.focus();
    }finally{
      sending=false;form.removeAttribute('aria-busy');fields.disabled=completed;submit.disabled=completed;modes.forEach(b=>b.disabled=completed);
      submit.textContent=completed?'Solicitud aceptada':intent==='llamada'?'Solicitar llamada':'Solicitar cotización';
    }
  });
  fields.disabled=false;document.getElementById('advisory-unavailable').hidden=true;switchChannel();
}
