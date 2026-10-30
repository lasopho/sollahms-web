/** Public, owner-reviewed product references. Never accept a price from the URL. */
export const validOfferPrice = value => typeof value==='number' && Number.isFinite(value) && value>0;
export function publicOffer(project,key){
  if(typeof key!=='string'||!/^(?:[0-9]d|local)$/.test(key))return null;
  return project?.commercialOffers?.find(o=>o.id===key)??null;
}
export function catalogReference(project,state={}){
  if((project.inmobiliaria==='Ecasa'&&project.commercialSource?.date==='2026-10-30'||['AJ Urbana','Sento','León'].includes(project.inmobiliaria)&&project.catalogPricePolicy==='owner-typology')){
    if(project.slug==='plaza-las-condes'&&!state.bedrooms&&!state.typologies?.length)return {value:project.precioDesdeUF,typology:project.precioDesdeTipologia};
    const commercial=state.assetType==='Comercial'||state.propertyType==='local';
    const beds=state.bedrooms,types=state.typologies??[];
    const offers=(project.commercialOffers??[]).filter(o=>(commercial?o.propertyType==='local':o.propertyType!=='local')
      &&(!state.propertyType||o.propertyType===state.propertyType)
      &&(!beds||(beds.endsWith('+')?o.bedrooms>=Number(beds.slice(0,-1)):o.bedrooms===Number(beds)))
      &&(!types.length||types.some(t=>t.split('-')[0]===(o.bedrooms===0?'estudio':o.bedrooms+'d')))
      &&validOfferPrice(o.priceUF));
    const best=offers.reduce((a,b)=>!a||b.priceUF<a.priceUF?b:a,null);
    return {value:best?.priceUF??null,typology:best?.label??null};
  }
  const commercial=state.assetType==='Comercial'||state.propertyType==='local';
  if(project.catalogPricePolicy==='by-product'&&commercial){
    const offer=publicOffer(project,'local');
    return {value:validOfferPrice(offer?.priceUF)?offer.priceUF:null,typology:'Local'};
  }
  return {value:validOfferPrice(project.precioDesdeUF)?project.precioDesdeUF:null,typology:project.precioDesdeTipologia??null};
}
export function selectedPublicContext(search,project){
  const q=new URLSearchParams(search);
  if(q.getAll('oferta').length>1)return null;
  const key=q.get('oferta');
  if(!key)return {offer:null,propertyType:project.tipoActivo==='Comercial'?'local':null};
  const offer=publicOffer(project,key);
  return offer?{offer,propertyType:offer.propertyType}:null;
}

/** Carry only a verified public typology identifier from a León filtered result. */
export function leonCatalogOfferId(project,state={}){
  if(project.inmobiliaria!=='León'||project.catalogPricePolicy!=='owner-typology'||(!state.bedrooms&&!state.typologies?.length))return null;
  const ref=catalogReference(project,state);
  return project.commercialOffers?.find(o=>validOfferPrice(o.priceUF)&&o.priceUF===ref.value&&o.label===ref.typology)?.id??null;
}
