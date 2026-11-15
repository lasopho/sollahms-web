// An owner holds one real Web Lock per active synthetic tab session.
export class Ownership {
 constructor(locks,uuid=()=>crypto.randomUUID()){this.locks=locks;this.uuid=uuid;this.id=null;this.unlock=null;this.done=null;}
 async release(){this.unlock?.();if(this.done)await this.done;this.id=null;this.unlock=null;this.done=null;}
 async claim(id){
  let acquired,rejected;const ready=new Promise((yes,no)=>{acquired=yes;rejected=no;});
  this.done=this.locks.request('cta-lab:'+id,{ifAvailable:true},async lock=>{if(!lock){acquired(false);return;}this.id=id;const held=new Promise(r=>this.unlock=r);acquired(true);await held;}).catch(error=>{rejected(error);});
  return ready;
 }
 async acquire(state){
  if(!this.locks?.request)throw Error('Web Locks no disponible: captura deshabilitada');
  if(this.id===state.id)return state;
  await this.release();if(await this.claim(state.id))return state;
  await this.release();const fresh={id:this.uuid(),last:state.last,seq:0,cta:null};
  if(!await this.claim(fresh.id))throw Error('No se pudo aislar la sesión');return fresh;
 }
}
