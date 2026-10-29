/** Nollagam-only commercial context, using the existing advisory contract. */
export function selectedTypologyMessage(record, bedrooms, message='') {
  const text=String(message||'');
  const offer=record?.offers?.find(row=>String(row.bedrooms)===String(bedrooms));
  if(!offer)return text;
  const lines=[`Proyecto: ${record.name}`, 'Inmobiliaria: Nollagam'];
  if(record.building)lines.push(`Edificio: ${record.building}`);
  lines.push(`Tipología seleccionada: ${offer.label}`, offer.priceUF ? `Precio mostrado por tipología: desde UF ${new Intl.NumberFormat('es-CL').format(offer.priceUF)}` : 'Precio mostrado: Consultar valor', 'Precio por tipología; unidad y disponibilidad por confirmar.');
  return lines.join('\n')+'\n'+text;
}
export function initializeNollagam(root) {
  const form=root.querySelector('form[data-project-request]'),json=root.querySelector('#nollagam-commercial');
  if(!form||!json)return;
  const record=JSON.parse(json.textContent),panel=root.querySelector('#nollagam-selection'),label=root.querySelector('#nollagam-selected');
  const message=form.elements.mensaje;let selected=null;
  const locked=()=>form.hasAttribute('aria-busy')||form.querySelector('fieldset').disabled;
  const select=value=>{
    selected=record.offers.some(o=>String(o.bedrooms)===String(value))?String(value):null;
    panel.hidden=selected===null;
    const offer=record.offers.find(o=>String(o.bedrooms)===selected);
    label.textContent=offer?`${offer.label} · ${offer.priceUF?'Desde UF '+new Intl.NumberFormat('es-CL').format(offer.priceUF):'Consultar valor'}${record.building?' · Edificio '+record.building:''}`:'';
    message.maxLength=1600-selectedTypologyMessage(record,selected,'').length;
  };
  root.addEventListener('click',event=>{
    const quote=event.target.closest('[data-nollagam-type]');
    if(quote&&!locked())select(quote.dataset.nollagamType);
    const planLink=event.target.closest('[data-open-plan-group]');
    if(planLink){const group=root.querySelector('#planos-'+planLink.dataset.openPlanGroup);if(group)group.open=true;}
  });
  root.querySelector('#nollagam-clear').addEventListener('click',()=>{if(!locked())select(null);});
  form.addEventListener('formdata',event=>{event.formData.set('mensaje',selectedTypologyMessage(record,selected,event.formData.get('mensaje')));});
  form.addEventListener('reset',()=>select(null));
}
if(typeof document!=='undefined'){const root=document.querySelector('[data-nollagam-detail]');if(root)initializeNollagam(root);}
