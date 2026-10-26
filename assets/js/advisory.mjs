import {validateCommercialFields, normalizedCommercialFields, focusCommercialField} from './commercial-fields.mjs';
import { createFormOperation } from './form-operation.mjs';
import { resolveProjectIdentity } from './project-identity.mjs';
import { bindRutField } from './rut-field.mjs?v=20261026-required-1';

const form = document.getElementById('advisory-form');
if (form) {
  const fields = document.getElementById('advisory-fields'), status = document.getElementById('advisory-status');
  const button = form.querySelector('button[type=submit]');
  const inputs = {nombre:form.elements.nombre,rut:form.elements.rut,correo:form.elements.correo,telefono:form.elements.telefono,mensaje:form.elements.mensaje,consent:form.elements.consent};
  const ids = {nombre:'name',rut:'rut',correo:'email',telefono:'phone',mensaje:'message',consent:'consent'};
  const rutField=bindRutField(inputs.rut,document.getElementById('advisory-rut-error'));
  const operation = createFormOperation({name:'advisory'});
  const startedAt = Date.now(); let sending = false, completed = false, project = null, contextError = '';
  const show = (text,state='error') => { status.textContent=text; status.dataset.state=state; };
  const fieldError = (name,message) => { if(!inputs[name])return; const error=document.getElementById('advisory-'+ids[name]+'-error'); error.textContent=message;error.hidden=!message;inputs[name].setAttribute('aria-invalid',String(Boolean(message))); };
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
    rutField.validate();
    for(const [name,message] of Object.entries(validateCommercialFields(Object.fromEntries(new FormData(form)))))fail(name,message);
    if(!inputs.consent.checked)fail('consent','Autoriza el uso de tus datos para responder la solicitud.');
    if(invalid.length){show('Revisa los campos indicados. Aún no se ha enviado tu solicitud.');focusCommercialField(inputs[invalid[0]]);return false;}return true;
  };
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||completed)return;if(!validate())return;
    sending=true;button.disabled=true;button.textContent='Enviando…';form.setAttribute('aria-busy','true');show('Estamos enviando tu solicitud.','sending');
    try {
      await contextReady;if(contextError)throw Error(contextError);
      const data=Object.fromEntries(new FormData(form));data.consent=inputs.consent.checked;data.startedAt=startedAt;
      Object.assign(data,normalizedCommercialFields(data));data.solicitud='asesoria';
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
      completed=true;operation.complete();form.reset();show('Solicitud aceptada para envío a Sollahms. Usaremos tus datos de contacto para conocer tu objetivo y coordinar el siguiente paso. Este aviso no confirma entrega al buzón ni una cita.','success');status.focus();
    }catch(error){operation.uncertain();show(['TypeError','TimeoutError','SyntaxError'].includes(error.name)?'No pudimos confirmar el envío. Tus datos siguen aquí. Reintenta sin cambiarlos o escribe a contacto@sollahms.cl.':error.message);status.focus();}
    finally{sending=false;form.removeAttribute('aria-busy');fields.disabled=completed;button.disabled=completed;button.textContent=completed?'Solicitud enviada':'Solicitar asesoría';}
  });
  fields.disabled=false;document.getElementById('advisory-unavailable').hidden=true;
}
