import {openStore} from './store.mjs';import {canonical} from './fixtures.mjs';import {aggregate} from './core.mjs';
export async function storageTests(){
 const name='cta-synthetic-selftest-'+crypto.randomUUID(),results=[];let db=await openStore(name);const f=canonical();
 const check=(name,ok)=>{results.push({name,ok});if(!ok)throw Error(name);};
 try{
 await db.putRun(f.run);await Promise.all(f.events.map(x=>db.enqueue(x.e,x.proof)));check('concurrencia: cola completa',(await db.all('queue')).length===15);
 db.close();db=await openStore(name);check('reinicio: cola persistida',(await db.all('queue')).length===15);
 await Promise.all([db.flush(),db.flush(),db.flush()]);check('flush concurrente: 15 eventos sin duplicados',(await db.all('events')).length===15);check('cola confirmada vacía',(await db.all('queue')).length===0);
 for(const x of f.events)await db.enqueue(x.e,x.proof);await db.flush();check('reintentos deduplicados',(await db.all('events')).length===15);
 db.close();db=await openStore(name);check('reinicio: eventos persistidos',(await db.all('events')).length===15);
 const m=aggregate((await db.all('events')).map(x=>x.event),{run:f.run.id,from:f.run.from,to:f.run.to,expected:f.run.expected,expectedPayloads:f.run.expectedPayloads});check('conciliación persistida: 50% entrega',m.rates.delivery.value===50);
 let rejected=false;try{await db.enqueue({...f.events[0].e,correo:'dato-prohibido'});}catch{rejected=true;}check('PII rechazada antes de almacenamiento',rejected);
 let conflict=false;try{await db.enqueue({...f.events[0].e,at:f.events[0].e.at+1});}catch{conflict=true;}check('ID confirmado alterado rechazado',conflict);
 const peer=await openStore(name);await db.clear();await db.putRun(f.run);
 await Promise.all(f.events.flatMap(x=>[db.enqueue(x.e,x.proof),peer.enqueue(x.e,x.proof)]));check('dos conexiones: una fila por ID',(await db.all('queue')).length===15);
 let interrupted=false;try{await db.flush({abortAfter:1});}catch{interrupted=true;}check('interrupción durante flush hace rollback',interrupted&&(await peer.all('events')).length===0&&(await peer.all('queue')).length===15);
 db.close();db=await openStore(name);await Promise.all([db.flush(),peer.flush()]);check('recuperación de operación interrumpida',(await db.all('events')).length===15);
 await peer.clear();let stale=false;try{await db.enqueue(f.events[0].e);}catch{stale=true;}check('borrado invalida otras conexiones',stale);peer.close();
 await db.clear();check('eliminación local completa',(await db.all('events')).length===0&&(await db.all('runs')).length===0);
 return results;
 }finally{db.close();indexedDB.deleteDatabase(name);}
}
