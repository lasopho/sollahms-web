/** Reusable typology context for the existing Sollahms advisory form. */
const price=value=>'Desde UF '+new Intl.NumberFormat('es-CL',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
export function brochureSelectionMessage(record,key,message=''){
  const text=String(message||''),offer=record?.offers?.find(o=>String(o.id??o.bedrooms)===String(key));
  if(!offer)return text;
  return ['Proyecto: '+(offer.stageName??record.name),'Inmobiliaria: '+record.developer,'Tipología seleccionada: '+offer.label,
    'Tipo de propiedad: '+(offer.propertyType==='local'?'Local comercial':offer.propertyType==='casa'?'Casa':'Departamento'),
    'Precio mostrado por tipología: '+(Number.isFinite(offer.priceUF)?price(offer.priceUF):'Consultar valor'),
    'Referencia por tipología; unidad, inclusiones y disponibilidad por confirmar.'].join('\n')+'\n'+text;
}
export function initializeBrochure(root){
  const form=root.querySelector('form[data-project-request]'),json=root.querySelector('#project-brochure-data');
  if(!form||!json)return;
  const record=JSON.parse(json.textContent),panel=root.querySelector('#pb-selection'),label=root.querySelector('#pb-selected'),message=form.elements.mensaje;
  let selected=null;
  const locked=()=>form.hasAttribute('aria-busy')||form.querySelector('fieldset').disabled;
  function select(key){
    const offer=record.offers.find(o=>String(o.id??o.bedrooms)===String(key));selected=offer?String(key):null;
    panel.hidden=!offer;label.textContent=offer?(offer.stageName?offer.stageName+' · ':'')+offer.label+' · '+(Number.isFinite(offer.priceUF)?price(offer.priceUF):'Consultar valor'):'';
    message.maxLength=Math.min(1400,1600-brochureSelectionMessage(record,selected,'').length);
  }
  root.addEventListener('click',event=>{
    const action=event.target.closest('[data-brochure-type]');if(action&&!locked())select(action.dataset.brochureType);
    const link=event.target.closest('[data-brochure-plan-group]');if(link){const target=document.getElementById(link.dataset.brochurePlanGroup);if(target?.tagName==='DETAILS')target.open=true;}
  });
  root.querySelector('#pb-clear-selection').addEventListener('click',()=>{if(!locked())select(null);});
  form.addEventListener('formdata',event=>event.formData.set('mensaje',brochureSelectionMessage(record,selected,event.formData.get('mensaje'))));
  form.addEventListener('reset',()=>select(null));
  const incoming=new URLSearchParams(location.search).get('oferta');if(incoming)select(incoming);
  const filter=root.querySelector('[data-plan-filter]');
  if(filter)filter.addEventListener('change',()=>{
    for(const card of root.querySelectorAll('[data-plan-bedrooms]'))card.hidden=!!filter.value&&!card.dataset.planBedrooms.split(' ').includes(filter.value);
  });
  const compare=root.querySelector('[data-plan-compare]'),dialog=root.querySelector('[data-plan-dialog]');
  if(compare&&dialog){
    const selectedPlans=new Map(),status=root.querySelector('[data-plan-compare-status]');
    for(const control of root.querySelectorAll('[data-compare-plan]'))control.addEventListener('change',()=>{
      if(control.checked&&selectedPlans.size===2){control.checked=false;status.textContent='Puedes comparar dos láminas a la vez. Quita una selección para elegir otra.';return;}
      if(control.checked)selectedPlans.set(control.dataset.comparePlan,control);else selectedPlans.delete(control.dataset.comparePlan);
      compare.disabled=selectedPlans.size!==2;status.textContent=selectedPlans.size+' de 2 láminas seleccionadas.';
    });
    compare.addEventListener('click',()=>{
      const area=dialog.querySelector('[data-plan-comparison]');area.replaceChildren();
      for(const control of selectedPlans.values()){
        const card=control.closest('[data-plan-bedrooms]'),figure=document.createElement('figure'),caption=document.createElement('figcaption'),img=document.createElement('img');
        caption.textContent=card.querySelector('h3').textContent;img.src=card.querySelector('[data-plan-full]').href;img.alt=card.querySelector('img').alt;figure.append(caption,img);area.append(figure);
      }
      dialog.showModal();
    });
    dialog.querySelector('[data-plan-close]').addEventListener('click',()=>dialog.close());
  }
}
if(typeof document!=='undefined'){const root=document.querySelector('[data-project-brochure]');if(root)initializeBrochure(root);}
