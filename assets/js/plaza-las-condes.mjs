/** Project-only unit context, carried by the existing message field and endpoint. */
export function withSelectedUnit(message, unit) {
  const text=String(message || '');
  if(!['213','313'].includes(String(unit)))return text;
  return `Unidad de interés: ${unit}.\n${text}`;
}

export function initializePlaza(root) {
  const form=root.querySelector('form[data-project-request]');
  if(!form)return;
  let selected='';
  const panel=root.querySelector('#plc-unit-context'),label=root.querySelector('#plc-unit-selected');
  const message=form.elements.mensaje;
  const select=unit=>{
    selected=['213','313'].includes(unit)?unit:'';
    panel.hidden=!selected;
    label.textContent=selected?`Tu solicitud incluirá Plaza Las Condes · Unidad ${selected}`:'';
    message.maxLength=1600-withSelectedUnit('',selected).length;
  };
  root.addEventListener('click',event=>{
    const unit=event.target.closest('[data-plaza-unit]');
    if(unit && !form.querySelector('fieldset').disabled && !form.hasAttribute('aria-busy'))select(unit.dataset.plazaUnit);
  });
  root.querySelector('#plc-unit-clear').addEventListener('click',()=>{
    if(!form.hasAttribute('aria-busy'))select('');
  });
  // FormData is constructed by the existing request module. No second submit handler.
  form.addEventListener('formdata',event=>{
    event.formData.set('mensaje',withSelectedUnit(event.formData.get('mensaje'),selected));
  });
  form.addEventListener('reset',()=>select(''));
  const filter=root.querySelector('#plc-plan-filter'),plans=[...root.querySelectorAll('[data-plan-type]')];
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
