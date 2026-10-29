/** Bounded public journey context, carried by the existing contact message. No storage. */
import {publicOffer} from './project-offers.mjs?v=20261029-euro-1';
const origins={catalogo:'Catálogo',buscador:'Buscador avanzado',ficha:'Ficha de proyecto','guia-hipotecaria':'Guía hipotecaria',simulador:'Simulador educativo','guia-etapas':'Guía de etapas de compra'};
export function publicOrigin(search,fallback='ficha'){
  const q=new URLSearchParams(search);return q.getAll('origen').length===1&&Object.hasOwn(origins,q.get('origen'))?q.get('origen'):fallback;
}
export function originLine(origin){return 'Origen de la consulta: '+(origins[origin]??origins.ficha);}
export function adviceContext(project,search,message=''){
  const q=new URLSearchParams(search),key=q.getAll('oferta').length===1?q.get('oferta'):null,offer=publicOffer(project,key);
  const lines=[originLine(publicOrigin(search,'guia-hipotecaria'))];
  if(project){lines.push('Proyecto: '+project.nombre,'Inmobiliaria: '+project.inmobiliaria,'Identificador: '+project.slug);
    if(offer)lines.push('Producto: '+offer.label+' · '+(offer.propertyType==='local'?'Local comercial':'Departamento'));
    const value=offer?offer.priceUF:project.precioDesdeUF;
    lines.push('Precio desde mostrado: '+(typeof value==='number'&&Number.isFinite(value)?'UF '+new Intl.NumberFormat('es-CL',{maximumFractionDigits:2}).format(value):'Consultar precio')+'. No es un precio de unidad.');
  }
  if(message)lines.push(String(message));return lines.join('\n');
}
