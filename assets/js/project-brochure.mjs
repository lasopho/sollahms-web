/** Reusable typology context for the existing Sollahms advisory form. */
const price=value=>'Desde UF '+new Intl.NumberFormat('es-CL',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
export function brochureSelectionMessage(record,key,message=''){
  const text=String(message||''),offer=record?.offers?.find(o=>String(o.bedrooms)===String(key));
  if(!offer)return text;
  return ['Proyecto: '+record.name,'Inmobiliaria: '+record.developer,'Tipología seleccionada: '+offer.label,
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
    const offer=record.offers.find(o=>String(o.bedrooms)===String(key));selected=offer?String(key):null;
    panel.hidden=!offer;label.textContent=offer?offer.label+' · '+(Number.isFinite(offer.priceUF)?price(offer.priceUF):'Consultar valor'):'';
    message.maxLength=1600-brochureSelectionMessage(record,selected,'').length;
  }
  root.addEventListener('click',event=>{
    const action=event.target.closest('[data-brochure-type]');if(action&&!locked())select(action.dataset.brochureType);
    const link=event.target.closest('[data-brochure-plan-group]');if(link){const target=document.getElementById(link.dataset.brochurePlanGroup);if(target?.tagName==='DETAILS')target.open=true;}
  });
  root.querySelector('#pb-clear-selection').addEventListener('click',()=>{if(!locked())select(null);});
  form.addEventListener('formdata',event=>event.formData.set('mensaje',brochureSelectionMessage(record,selected,event.formData.get('mensaje'))));
  form.addEventListener('reset',()=>select(null));
}
if(typeof document!=='undefined'){const root=document.querySelector('[data-project-brochure]');if(root)initializeBrochure(root);}
