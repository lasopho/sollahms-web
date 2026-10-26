import {normalizeRut,formatRut,RUT_ERROR} from './rut.mjs';

/** Optional RUT; no lookup, storage, tracking or external transmission. */
export function bindRutField(input,error) {
  const clear=()=>{error.textContent='';error.hidden=true;input.setAttribute('aria-invalid','false');input.setCustomValidity('');};
  const validate=()=>{
    const value=normalizeRut(input.value);
    if(value===null){error.textContent=RUT_ERROR;error.hidden=false;input.setAttribute('aria-invalid','true');input.setCustomValidity(RUT_ERROR);return false;}
    clear();input.value=formatRut(value);return true;
  };
  input.addEventListener('input',clear);
  input.addEventListener('blur',validate);
  const focus=()=>{input.focus({preventScroll:true});input.scrollIntoView({block:'center',behavior:'instant'});};
  return {validate,clear,focus,value:()=>normalizeRut(input.value)};
}
