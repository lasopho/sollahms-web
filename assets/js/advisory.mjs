import { createFormOperation } from './form-operation.mjs';
import { resolveProjectIdentity } from './project-identity.mjs';

const form = document.getElementById('advisory-form');
if (form) {
  const fields = document.getElementById('advisory-fields'), status = document.getElementById('advisory-status');
  const button = form.querySelector('button[type=submit]');
  const inputs = {nombre:form.elements.nombre,correo:form.elements.correo,telefono:form.elements.telefono,mensaje:form.elements.mensaje,consent:form.elements.consent};
  const ids = {nombre:'name',correo:'email',telefono:'phone',mensaje:'message',consent:'consent'};
  const operation = createFormOperation({name:'advisory'});
  const startedAt = Date.now(); let sending = false, completed = false, project = null, contextError = '';
  const show = (text,state='error') => { status.textContent=text; status.dataset.state=state; };
  const fieldError = (name,message) => { if(!inputs[name])return; const error=document.getElementById('advisory-'+ids[name]+'-error'); error.textContent=message;error.hidden=!message;inputs[name].setAttribute('aria-invalid',String(Boolean(message))); };
  const switchChannel = () => {
    const phone = form.elements.medio.value === 'telefono';
    document.getElementById('advisory-email-field').hidden=phone;document.getElementById('advisory-phone-field').hidden=!phone;
    inputs.correo.disabled=phone;inputs.correo.required=!phone;inputs.telefono.disabled=!phone;inputs.telefono.required=phone;
    fieldError('correo','');fieldError('telefono','');
  };
  form.querySelectorAll('[name=medio]').forEach(input=>input.addEventListener('change',switchChannel));
  Object.entries(inputs).forEach(([name,input])=>input.addEventListener('input',()=>fieldError(name,'')));
  const query=new URLSearchParams(location.search);
  const contextReady=(async()=>{
    if(!query.has('proyecto')) return;
    try {
      if(query.getAll('proyecto').length!==1||query.getAll('etapa').length>1)throw Error();
      const response=await fetch('/data/proyectos.json',{signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw Error();
      project=resolveProjectIdentity(await response.json(),query.get('proyecto'),query.get('etapa'));
      if(!project)throw Error();
      const label=document.getElementById('advisory-project-context');label.textContent='Tu consulta sobre '+project.nombre;label.hidden=false;
      document.querySelectorAll('a[href="/agenda-asesoria.html"],a[href="/contacto.html"]').forEach(a=>{a.href+=project.contextQuery;});
    }catch {contextError='No pudimos identificar el proyecto. Vuelve a abrir la consulta desde su ficha.';show(contextError);}
  })();
  const validate=()=>{
    Object.keys(inputs).forEach(name=>fieldError(name,''));let invalid=[];
    const fail=(name,message)=>{fieldError(name,message);invalid.push(name);};
    if(!inputs.nombre.value.trim())fail('nombre','Escribe tu nombre.');
    if(form.elements.medio.value==='correo'&&(!inputs.correo.value.trim()||!inputs.correo.validity.valid||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputs.correo.value.trim())))fail('correo','Escribe un correo válido, por ejemplo nombre@ejemplo.cl.');
    if(form.elements.medio.value==='telefono') {const value=inputs.telefono.value.trim(),count=(value.match(/\d/g)||[]).length;if(!/^[+()\d .-]+$/.test(value)||count<9||count>15)fail('telefono','Escribe un teléfono válido con código de país.');}
    if(!inputs.consent.checked)fail('consent','Autoriza el uso de tus datos para responder la solicitud.');
    if(invalid.length){show('Revisa los campos indicados. Aún no se ha enviado tu solicitud.');inputs[invalid[0]].focus();return false;}return true;
  };
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||completed)return;if(!validate())return;
    sending=true;button.disabled=true;button.textContent='Enviando…';form.setAttribute('aria-busy','true');show('Estamos enviando tu solicitud.','sending');
    try {
      await contextReady;if(contextError)throw Error(contextError);
      const data=Object.fromEntries(new FormData(form));data.consent=inputs.consent.checked;data.startedAt=startedAt;
      if(project)data.proyecto=project.bodyProjectSlug;
      const attempt=await operation.prepare(data);
      // Freeze inputs until the result arrives, without losing their values on failure.
      fields.disabled=true;
      const response=await fetch('/api/advisory',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':attempt.key},body:attempt.body,signal:AbortSignal.timeout(15000)});
      const result=await response.json();
      if(!response.ok){
        if(!attempt.reused&&([400,403,413,415].includes(response.status)||['preview_read_only','contact_configuration_unavailable'].includes(result.code)))operation.discard();
        for(const [name,message] of Object.entries(result.fieldErrors||{}))fieldError(name,message);
        throw Error(result.error||'No pudimos confirmar el envío. Reintenta sin cambiar los datos.');
      }
      if(result.ok!==true||result.providerAccepted!==true||result.deliveryConfirmed!==false)throw Error('No pudimos confirmar el envío. Reintenta sin cambiar los datos o escribe a contacto@sollahms.cl.');
      completed=true;operation.complete();form.reset();show('Solicitud aceptada para envío a Sollahms. Usaremos el medio elegido para conocer tu objetivo y coordinar el siguiente paso. Este aviso no confirma entrega al buzón ni una cita.','success');status.focus();
    }catch(error){operation.uncertain();show(['TypeError','TimeoutError','SyntaxError'].includes(error.name)?'No pudimos confirmar el envío. Tus datos siguen aquí. Reintenta sin cambiarlos o escribe a contacto@sollahms.cl.':error.message);status.focus();}
    finally{sending=false;form.removeAttribute('aria-busy');fields.disabled=completed;button.disabled=completed;button.textContent=completed?'Solicitud enviada':'Solicitar asesoría';}
  });
  fields.disabled=false;document.getElementById('advisory-unavailable').hidden=true;switchChannel();
}
