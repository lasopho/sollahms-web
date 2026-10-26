import {normalizeEmail, normalizePhone, COMMERCIAL_ERRORS} from './commercial-fields.mjs';
export const COLLABORATION_TYPES={inmobiliaria:'Colaboración con inmobiliaria',persona:'Postulación de persona'};
export const COLLABORATION_SOURCE='https://sollahms.cl/trabaja-con-nosotros.html';
export function validateCollaboration(values={}) {
  const errors={};
  if(!Object.hasOwn(COLLABORATION_TYPES,values.tipo))errors.tipo='Selecciona cómo quieres colaborar.';
  const correo=typeof values.correo==='string'?values.correo.trim():values.correo;
  const telefono=typeof values.telefono==='string'?values.telefono.trim():values.telefono;
  if(!correo&&!telefono)errors.correo='Escribe un correo electrónico o un teléfono para que podamos contactarte. Basta con uno de los dos.';
  if(correo&&!normalizeEmail(correo))errors.correo=COMMERCIAL_ERRORS.correo;
  if(telefono&&!normalizePhone(telefono))errors.telefono=COMMERCIAL_ERRORS.telefono;
  if(values.consent!==true)errors.consent='Autoriza el uso de tu contacto para atender esta solicitud.';
  return errors;
}
export function normalizeCollaboration(values) {
  return {tipo:values.tipo,correo:values.correo?.trim()?normalizeEmail(values.correo):'',telefono:values.telefono?.trim()?normalizePhone(values.telefono):'',consent:values.consent};
}
export function collaborationLines(data) {
  return ['Tipo de solicitud: '+COLLABORATION_TYPES[data.tipo],'Página de origen: '+COLLABORATION_SOURCE,'Correo electrónico: '+(data.correo||'No informado'),'Teléfono: '+(data.telefono||'No informado'),'Consentimiento: autorizado para '+(data.tipo==='inmobiliaria'?'contactar sobre una posible colaboración comercial con su inmobiliaria.':'contactar sobre su interés en trabajar o colaborar con Sollahms.')+' Sin autorización de marketing.'];
}
