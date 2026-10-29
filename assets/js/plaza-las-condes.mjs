/** Project-only unit context, carried by the existing message field and endpoint. */
export function withSelectedUnit(message, unit) {
  const text=String(message || '');
  const value=String(unit??'').trim();
  if(!/^[A-Za-z0-9][A-Za-z0-9 -]{0,15}$/.test(value))return text;
  return `Unidad de interés: ${value}. Indicada por el visitante; existencia y disponibilidad por confirmar.\n${text}`;
}

export function initializePlaza(root) {
  const form=root.querySelector('form[data-project-request]');
  if(!form)return;
  let selected='';
  const panel=root.querySelector('#plc-unit-context'),label=root.querySelector('#plc-unit-selected');
  const interest=root.querySelector('#plc-unit-interest');
  const message=form.elements.mensaje;
  const select=unit=>{
    const value=String(unit??'').trim();
    selected=/^[A-Za-z0-9][A-Za-z0-9 -]{0,15}$/.test(value)?value:'';
    if(panel)panel.hidden=!selected;
    if(label)label.textContent=selected?`Unidad de interés: ${selected}. Se confirmará al cotizar.`:'';
    message.maxLength=1600-withSelectedUnit('',selected).length;
  };
  root.addEventListener('click',event=>{
    const unit=event.target.closest('[data-plaza-unit]');
    if(unit && !form.querySelector('fieldset').disabled && !form.hasAttribute('aria-busy'))select(unit.dataset.plazaUnit);
  });
  root.querySelector('#plc-unit-clear')?.addEventListener('click',()=>{
    if(!form.hasAttribute('aria-busy')){select('');if(interest)interest.value='';}
  });
  interest?.addEventListener('input',()=>{
    if(!form.hasAttribute('aria-busy')&&!form.querySelector('fieldset').disabled){
      const valid=!interest.value.trim()||/^[A-Za-z0-9][A-Za-z0-9 -]{0,15}$/.test(interest.value.trim());
      interest.setCustomValidity(valid?'':'Usa hasta 16 letras, números, espacios o guiones.');
      select(interest.value);
    }
  });
  // FormData is constructed by the existing request module. No second submit handler.
  form.addEventListener('formdata',event=>{
    event.formData.set('mensaje',withSelectedUnit(event.formData.get('mensaje'),selected));
  });
  form.addEventListener('reset',()=>select(''));
  const filter=root.querySelector('#plc-plan-filter'),plans=[...root.querySelectorAll('[data-plan-type]')];
  if(!filter)return;
  filter.closest('.plc-plan-controls').hidden=false;
  filter.addEventListener('change',()=>{
    let count=0;
    for(const plan of plans){plan.hidden=!!filter.value&&plan.dataset.planType!==filter.value;if(!plan.hidden)count++;}
    root.querySelector('#plc-plan-count').textContent=`${count} plano${count===1?'':'s'}`;
  });
}
if(typeof document!=='undefined'){
  const root=document.querySelector('.plaza-detail');
  if(root)initializePlaza(root);
}
