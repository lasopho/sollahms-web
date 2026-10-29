/** Public, owner-reviewed product references. Never accept a price from the URL. */
export const validOfferPrice = value => typeof value==='number' && Number.isFinite(value) && value>0;
export function publicOffer(project,key){
  if(typeof key!=='string'||!/^(?:[0-9]d|local)$/.test(key))return null;
  return project?.commercialOffers?.find(o=>o.id===key)??null;
}
export function catalogReference(project,state={}){
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
