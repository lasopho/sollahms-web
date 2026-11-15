import {Ownership} from './ownership.mjs';
export async function ownershipTests(locks=navigator.locks){
 const out=[],check=(name,ok)=>{out.push({name,ok});if(!ok)throw Error(name);},id=crypto.randomUUID();
 const first=new Ownership(locks),second=new Ownership(locks),third=new Ownership(locks);
 const state={id,last:Date.now(),seq:4,cta:'tax_advisory_main'};
 try{const a=await first.acquire(state),b=await second.acquire({...state});check('colisión de sesión clonada: UUID independiente',a.id!==b.id);check('colisión borra atribución previa',b.cta===null&&b.seq===0);check('lock original permanece',first.id===id);await second.release();check('cerrar segundo propietario no libera primero',first.id===id);await first.release();const c=await third.acquire(state);check('liberación y readquisición',c.id===id);await third.release();const d=await third.acquire(state);check('recarga lógica readquiere mismo lock',d.id===id);let failed=false;try{await new Ownership(null).acquire(state);}catch{failed=true;}check('sin Web Locks falla cerrado',failed);return out;}finally{await Promise.all([first.release(),second.release(),third.release()]);}
}
