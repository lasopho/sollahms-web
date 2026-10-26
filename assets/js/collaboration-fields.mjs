import {validateCommercialFields, normalizedCommercialFields} from './commercial-fields.mjs';
export const COLLABORATION_TYPES={inmobiliaria:'Colaboración con inmobiliaria',persona:'Postulación de persona'};
export const COLLABORATION_SOURCE='https://sollahms.cl/trabaja-con-nosotros.html';
const limits={empresa:160,zona:200,mensaje:2000,area:120,ciudad:120};
const forbidden=/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
export function normalizeOptionalUrl(value='') {
  if(typeof value!=='string')return null;
  const text=value.trim();if(!text)return '';
  if(text.length>500||/[\s\u0000-\u001f\u007f]/.test(text))return null;
  try{const url=new URL(text);return ['https:','http:'].includes(url.protocol)&&url.hostname.includes('.')&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
export function validateCollaboration(values={}) {
  const errors=validateCommercialFields(values);
  if(!Object.hasOwn(COLLABORATION_TYPES,values.tipo))errors.tipo='Selecciona cómo quieres colaborar.';
  if(values.tipo==='inmobiliaria') {
    if(errors.rut)errors.rut='Escribe el RUT de la empresa y revisa su dígito verificador (número o K).';
    if(typeof values.empresa!=='string'||values.empresa.trim().length<2)errors.empresa='Escribe el nombre de la inmobiliaria.';
  }
  for(const [key,max] of Object.entries(limits))if(values[key]!==undefined&&(typeof values[key]!=='string'||values[key].length>max||forbidden.test(values[key])||(key!=='mensaje'&&/[\r\n\t]/.test(values[key]))))errors[key]=`Usa hasta ${max.toLocaleString('es-CL')} caracteres válidos.`;
  for(const key of ['sitio','enlace'])if(normalizeOptionalUrl(values[key])===null)errors[key]='Escribe un enlace completo que comience con https:// o http://, sin usuario ni contraseña.';
  if(values.consent!==true)errors.consent='Autoriza el uso de tus datos para atender esta solicitud.';
  return errors;
}
export function normalizeCollaboration(values) {
  const data={...normalizedCommercialFields(values),tipo:values.tipo,consent:values.consent};
  for(const key of values.tipo==='inmobiliaria'?['empresa','sitio','zona','mensaje']:['area','ciudad','mensaje','enlace'])data[key]=['sitio','enlace'].includes(key)?normalizeOptionalUrl(values[key]):(values[key]||'').trim();
  return data;
}
export function collaborationLines(data) {
  const lines=['Tipo de solicitud: '+COLLABORATION_TYPES[data.tipo],'Página de origen: '+COLLABORATION_SOURCE,'Nombre completo: '+data.nombre];
  if(data.tipo==='inmobiliaria')lines.push('Inmobiliaria: '+data.empresa,'RUT de la empresa: '+data.rut);
  else lines.push('RUT de la persona: '+data.rut);
  lines.push('Correo electrónico: '+data.correo,'Teléfono: '+data.telefono);
  const labels=data.tipo==='inmobiliaria'?{sitio:'Sitio web',zona:'Comunas o regiones',mensaje:'Colaboración propuesta'}:{area:'Área de interés',ciudad:'Ciudad o comuna',mensaje:'Presentación o experiencia',enlace:'LinkedIn, portafolio o CV'};
  for(const [key,label]of Object.entries(labels))lines.push(label+': '+(data[key]||'No informado'));
  lines.push('Consentimiento: autorizado para '+(data.tipo==='inmobiliaria'?'revisar la propuesta y contactar sobre una posible colaboración comercial.':'revisar la postulación espontánea y contactar sobre el interés en trabajar o colaborar.')+' Sin autorización de marketing.');
  return lines;
}
