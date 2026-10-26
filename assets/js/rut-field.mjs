import {normalizeRut,formatRut,RUT_ERROR} from './rut.mjs';
import {REQUIRED_RUT_ERROR} from './commercial-fields.mjs';

/** RUT follows the field required attribute; no lookup, storage, tracking or external transmission. */
export function bindRutField(input,error) {
  const clear=()=>{error.textContent='';error.hidden=true;input.setAttribute('aria-invalid','false');input.setCustomValidity('');};
  const validate=()=>{
    const value=normalizeRut(input.value);
    if(value===null||(input.required&&!value)){const message=value===null?RUT_ERROR:REQUIRED_RUT_ERROR;error.textContent=message;error.hidden=false;input.setAttribute('aria-invalid','true');input.setCustomValidity(message);return false;}
    clear();input.value=formatRut(value);return true;
  };
  input.addEventListener('input',clear);
  input.addEventListener('blur',validate);
  const focus=()=>{input.focus({preventScroll:true});input.scrollIntoView({block:'center',behavior:'instant'});};
  return {validate,clear,focus,value:()=>normalizeRut(input.value)};
}
