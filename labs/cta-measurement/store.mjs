import {validate,reconcile,semantic,fingerprint,UUID} from './core.mjs';
export function openStore(name='sollahms-cta-synthetic-v1'){
 return new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('queue',{keyPath:'id'});const ev=db.createObjectStore('events',{keyPath:'id'});ev.createIndex('semantic','semantic',{unique:true});db.createObjectStore('runs',{keyPath:'id'});};req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(new Store(req.result));});
}
class Store{
 constructor(db){this.db=db;}
 tx(names,fn){return new Promise((resolve,reject)=>{const tx=this.db.transaction(names,'readwrite');let result,error;const fail=e=>{error=e;tx.abort();};tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(error||tx.error||Error('Transacción rechazada'));try{fn(tx,x=>result=x,fail);}catch(e){fail(e);}});}
 putRun(run){
 const labels=['Cohorte sintética certificada · 3 sesiones','Recorrido manual sintético · cobertura no certificada'];
 if(Object.keys(run).some(k=>!['id','label','from','to','expected','expectedPayloads'].includes(k))||!UUID.test(run.id)||!labels.includes(run.label)||!Number.isSafeInteger(run.from)||!Number.isSafeInteger(run.to)||run.to<=run.from)throw Error('Cohorte inválida');
 if(run.expected!==null){if(!Array.isArray(run.expected)||!run.expected.every(id=>UUID.test(id)))throw Error('Manifiesto inválido');for(const [id,text] of Object.entries(run.expectedPayloads||{})){const e=JSON.parse(text);validate(e);if(e.id!==id||e.run!==run.id||fingerprint(e)!==text)throw Error('Manifiesto alterado');}}
 return this.tx(['runs'],tx=>tx.objectStore('runs').put(run));
 }
 async all(name){return new Promise((resolve,reject)=>{const r=this.db.transaction(name).objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 enqueue(e,proof=null){
 validate(e);reconcile(e,proof);
 return this.tx(['queue','events','runs'],(tx,done,fail)=>{
  const q=tx.objectStore('queue'),events=tx.objectStore('events'),runs=tx.objectStore('runs');
  const rr=runs.get(e.run);rr.onsuccess=()=>{if(!rr.result){fail(Error('Cohorte eliminada: inicia otra prueba'));return;}
   const existing=events.get(e.id);existing.onsuccess=()=>{if(existing.result){if(fingerprint(existing.result.event)!==fingerprint(e))fail(Error('ID reutilizado con contenido distinto'));return;}
    const queued=q.get(e.id);queued.onsuccess=()=>{if(queued.result&&fingerprint(queued.result.e)!==fingerprint(e)){fail(Error('ID reutilizado con contenido distinto'));return;}q.put({id:e.id,e,proof});};
   };
  };
 });
 }
 flush({abortAfter=null}={}){return this.tx(['events','queue','runs'],(tx,done,fail)=>{
 const q=tx.objectStore('queue'),s=tx.objectStore('events');let accepted=0;const cur=q.openCursor();
 cur.onsuccess=()=>{const c=cur.result;if(!c){done(accepted);return;}try{
  const {e,proof}=c.value;validate(e);reconcile(e,proof);const k=semantic(e);const existing=s.index('semantic').get(k);
  existing.onsuccess=()=>{if(!existing.result){s.add({id:e.id,semantic:k,event:e,proof});accepted++;}
   q.delete(e.id);if(abortAfter!==null&&accepted>=abortAfter){fail(Error('Interrupción sintética: rollback'));return;}c.continue();};
 }catch(e){fail(e);}};
 });}
 clear(){return this.tx(['queue','events','runs'],tx=>{for(const n of ['queue','events','runs'])tx.objectStore(n).clear();});}
 close(){this.db.close();}
}
