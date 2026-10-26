import {normalizeRut, RUT_ERROR} from './rut.mjs';

// Shared browser/server rules. Syntactic validation only; no identity or credit lookup.
export const REQUIRED_RUT_ERROR='Escribe tu RUT con su dígito verificador (número o K).';
export const COMMERCIAL_ERRORS={
  nombre:'Escribe tu nombre completo. Puedes usar espacios, tildes, guiones y apóstrofes.',
  correo:'Escribe un correo válido, por ejemplo nombre@ejemplo.cl.',
  telefono:'Escribe un teléfono válido: 9 dígitos para Chile o código de país con + para otro país.',
};
export function normalizeName(value) {
  if(typeof value!=='string'||value.length>100||/[\u0000-\u001f\u007f]/.test(value))return null;
  const name=value.trim().replace(/\s+/g,' ');
  return /^[\p{L}\p{M}][\p{L}\p{M} '’ʼ.\-]*$/u.test(name)&&(name.match(/\p{L}/gu)||[]).length>=2?name:null;
}
export function normalizeEmail(value) {
  if(typeof value!=='string')return null;
  const email=value.trim();
  const pattern=/^[^\s@<>(),;:"\\[\].]+(?:\.[^\s@<>(),;:"\\[\].]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  return email.length<=254&&email.split('@')[0].length<=64&&!/[\u0000-\u001f\u007f]/.test(email)&&pattern.test(email)?email:null;
}
export function normalizePhone(value) {
  if(typeof value!=='string')return null;
  const phone=value.trim();
  if(phone.length>30||!/^\+?[\d () .-]+$/.test(phone))return null;
  let compact=phone.replace(/[ () .-]/g,'');
  if(compact.startsWith('00'))compact='+'+compact.slice(2);
  if(!compact.startsWith('+')){
    if(/^[2-9]\d{8}$/.test(compact))compact='+56'+compact;
    else if(/^56[2-9]\d{8}$/.test(compact))compact='+'+compact;
    else return null;
  }
  if(!/^\+[1-9]\d{6,14}$/.test(compact))return null;
  if(compact.startsWith('+56')&&!/^\+56[2-9]\d{8}$/.test(compact))return null;
  return compact;
}
export function validateCommercialFields(values={}) {
  const errors={};
  if(!normalizeName(values.nombre))errors.nombre=COMMERCIAL_ERRORS.nombre;
  const rut=normalizeRut(values.rut??'');
  if(!rut)errors.rut=rut===null?RUT_ERROR:REQUIRED_RUT_ERROR;
  if(!normalizeEmail(values.correo))errors.correo=COMMERCIAL_ERRORS.correo;
  if(!normalizePhone(values.telefono))errors.telefono=COMMERCIAL_ERRORS.telefono;
  return errors;
}
export function normalizedCommercialFields(values) {
  return {nombre:normalizeName(values.nombre),rut:normalizeRut(values.rut??''),correo:normalizeEmail(values.correo),telefono:normalizePhone(values.telefono)};
}
export function focusCommercialField(input) {
  if(!input)return;
  input.focus({preventScroll:true});input.scrollIntoView({block:'center',behavior:'instant'});
}
