import {validateCollaboration, normalizeCollaboration} from './collaboration-fields.mjs';
import {createFormOperation} from './form-operation.mjs';
import {focusCommercialField} from './commercial-fields.mjs';
const choices=[...document.querySelectorAll('[data-collaboration-choice]')];
function select(kind){
  for(const button of choices){const active=button.dataset.collaborationChoice===kind;button.setAttribute('aria-pressed',String(active));button.querySelector('[data-choice-state]').textContent=active?'Seleccionado':'Elegir esta opción';}
  for(const panel of document.querySelectorAll('[data-collaboration-panel]'))panel.hidden=panel.dataset.collaborationPanel!==kind;
}
choices.forEach(button=>button.addEventListener('click',()=>select(button.dataset.collaborationChoice)));
for(const form of document.querySelectorAll('[data-collaboration-form]')) {
  const kind=form.dataset.collaborationForm, fields=form.querySelector('fieldset'),status=form.querySelector('[role=status]'),button=form.querySelector('[type=submit]'),label=button.textContent;
  const operation=createFormOperation({name:'collaboration-'+kind}),startedAt=Date.now();let sending=false,completed=false;
  const errorFor=name=>document.getElementById(kind+'-'+name+'-error');
  const error=(name,message)=>{const input=form.elements[name],node=errorFor(name);if(!input||!node)return;node.textContent=message;node.hidden=!message;input.setAttribute('aria-invalid',String(Boolean(message)));};
  const show=(text,state='error')=>{status.textContent=text;status.dataset.state=state;};
  for(const input of form.elements)if(input.name)input.addEventListener('input',()=>error(input.name,''));
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||completed)return;
    const raw=Object.fromEntries(new FormData(form));raw.tipo=kind;raw.consent=form.elements.consent.checked;
    for(const input of form.elements)if(input.name)error(input.name,'');
    const errors=validateCollaboration(raw);
    if(Object.keys(errors).length){for(const [name,message]of Object.entries(errors))error(name,message);show('Revisa los campos indicados. Aún no se ha enviado tu solicitud.');const input=form.elements[Object.keys(errors)[0]];input?.closest('details')?.setAttribute('open','');focusCommercialField(input);return;}
    sending=true;button.disabled=true;button.textContent='Enviando…';form.setAttribute('aria-busy','true');show('Estamos enviando tu solicitud.','sending');
    let focusField=null;
    try {
      const data={...normalizeCollaboration(raw),website:raw.website||'',startedAt};
      const attempt=await operation.prepare(data);fields.disabled=true;
      const response=await fetch('/api/collaboration',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':attempt.key},body:attempt.body,signal:AbortSignal.timeout(15000)});
      const result=await response.json();
      if(!response.ok){
        if(!attempt.reused&&([400,403,413,415].includes(response.status)||['preview_read_only','contact_configuration_unavailable'].includes(result.code)))operation.discard();
        for(const [name,message]of Object.entries(result.fieldErrors||{}))error(name,message);
        focusField=form.elements[Object.keys(result.fieldErrors||{})[0]];
        throw Error(result.error||'No pudimos confirmar el envío. Reintenta sin cambiar los datos.');
      }
      if(result.ok!==true||result.providerAccepted!==true||result.deliveryConfirmed!==false)throw Error('No pudimos confirmar el envío. Reintenta sin cambiar los datos o escribe a contacto@sollahms.cl.');
      completed=true;operation.complete();
      show('Solicitud aceptada para envío a Sollahms. Este aviso confirma la aceptación por el servicio de envío; no confirma la entrega al buzón. '+(kind==='inmobiliaria'?'No incorpora proyectos al catálogo ni constituye un acuerdo comercial.':'No garantiza una entrevista ni contratación.'),'success');
    }catch(e){operation.uncertain();show(['TypeError','TimeoutError','SyntaxError','AbortError'].includes(e.name)?'No pudimos confirmar el envío. Tus datos siguen aquí. Reintenta sin cambiarlos o escribe a contacto@sollahms.cl.':e.message);}
    finally{sending=false;form.removeAttribute('aria-busy');fields.disabled=completed;button.disabled=completed;button.textContent=completed?'Aceptada para envío':label;if(focusField){focusField.closest('details')?.setAttribute('open','');focusCommercialField(focusField);}else status.focus();}
  });
  fields.disabled=false;
}
document.getElementById('collaboration-unavailable').hidden=true;
