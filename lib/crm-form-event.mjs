import {verifiedProjectPrice} from '../assets/js/project-finance.mjs';
export function crmFormEvent({request,operation,fields,project,mortgage,kind='contact'}){
 if(!operation?.key)throw new Error('CRM delivery requires a stable form operation');
 const match=/^sollahms-v1-(\d{13})-([a-f0-9-]{36})$/i.exec(operation.key);if(!match)throw new Error('Invalid form operation');
 const attribution={form:kind};
 const ref=request.headers.get('referer');
 if(ref){let source;try{source=new URL(ref);}catch{}if(source?.origin==='https://sollahms.cl'){
 attribution.page=source.origin+source.pathname;
 for(const [query,key] of [['utm_source','utmSource'],['utm_medium','utmMedium'],['utm_campaign','utmCampaign'],['utm_content','utmContent'],['utm_term','utmTerm']]){const value=source.searchParams.get(query);if(value)attribution[key]=value.slice(0,500);}
 }}
 const event={version:1,requestId:match[2].toLowerCase(),occurredAt:new Date(Number(match[1])).toISOString(),source:'sollahms_web',type:kind==='booking'||kind==='mortgage'?'advisory':fields.proyecto?'project':'general',person:{name:fields.nombre.trim(),email:fields.correo.trim().toLowerCase(),...(fields.telefono?{phone:fields.telefono}: {})},message:fields.mensaje??'',attribution,consent:{respond:true}};
 if(fields.proyecto)event.project={slug:fields.proyecto,...(fields.nombreProyecto?{name:fields.nombreProyecto}:{}),...(typeof project?.inmobiliaria==='string'?{developer:project.inmobiliaria}:{}),...(typeof project?.comuna==='string'?{commune:project.comuna}:{}),...(typeof project?.region==='string'?{region:project.region}:{})};
 if(kind==='mortgage'&&mortgage)event.declaredFinancing=Object.fromEntries(['propertyUf','downPaymentPercent','years','annualRatePercent','rateConvention','bankId','location'].filter(k=>Object.hasOwn(mortgage,k)).map(k=>[k,mortgage[k]]));
 if(event.project){const price=verifiedProjectPrice(project,new Date(Number(match[1])));if(price)event.project.priceUf=price.valueUf;if(typeof project?.tipologia==='string')event.project.typology=project.tipologia;}
 return event;
}
