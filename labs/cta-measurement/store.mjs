import {validate,reconcile,semantic} from './core.mjs';
export function openStore(name='sollahms-cta-synthetic-v1'){
 return new Promise((resolve,reject)=>{const req=indexedDB.open(name,1);req.onupgradeneeded=()=>{const db=req.result;db.createObjectStore('queue',{keyPath:'id'});const ev=db.createObjectStore('events',{keyPath:'id'});ev.createIndex('semantic','semantic',{unique:true});db.createObjectStore('runs',{keyPath:'id'});};req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(new Store(req.result));});
}
class Store{
 constructor(db){this.db=db;}
 tx(names,fn){return new Promise((resolve,reject)=>{const tx=this.db.transaction(names,'readwrite');let result;tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(tx.error||Error('Transacción fallida'));try{fn(tx,x=>result=x);}catch(e){tx.abort();reject(e);}});}
 putRun(run){return this.tx(['runs'],tx=>tx.objectStore('runs').put(run));}
 async all(name){return new Promise((resolve,reject)=>{const r=this.db.transaction(name).objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 enqueue(e,proof=null){validate(e);reconcile(e,proof);return this.tx(['queue'],tx=>{const s=tx.objectStore('queue'),r=s.get(e.id);r.onsuccess=()=>{if(r.result&&JSON.stringify(r.result.e)!==JSON.stringify(e)){tx.abort();return;}s.put({id:e.id,e,proof});};});}
 flush(){return this.tx(['events','queue'],(tx,done)=>{const q=tx.objectStore('queue'),s=tx.objectStore('events');let accepted=0;const cur=q.openCursor();cur.onsuccess=()=>{const c=cur.result;if(!c){done(accepted);return;}const {e,proof}=c.value;validate(e);reconcile(e,proof);const k=semantic(e);const existing=s.index('semantic').get(k);existing.onsuccess=()=>{if(!existing.result){s.add({id:e.id,semantic:k,event:e,proof});accepted++;}q.delete(e.id);c.continue();};};});}
 clear(){return this.tx(['queue','events','runs'],tx=>{for(const n of ['queue','events','runs'])tx.objectStore(n).clear();});}
 close(){this.db.close();}
}
