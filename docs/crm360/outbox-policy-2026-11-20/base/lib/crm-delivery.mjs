import { createHmac } from 'node:crypto';
// Server-only port. No environment lookup, implicit network, timer or activation.
// A durable store must provide atomic put/claim/complete/retry with lease fencing.
export function createCrmDelivery({store,transport,key,now=Date.now}) {
  if(!Buffer.isBuffer(key)||key.length<32||typeof transport!=='function'||['put','claim','complete','retry'].some(k=>typeof store?.[k]!=='function')) throw new Error('Explicit durable storage, signing key and transport required');
  return {
    async receive(event) {
      // Only the durable store may acknowledge reception, never an in-memory map.
      const receipt=await store.put(event.requestId,event);
      if(receipt?.durable!==true) throw new Error('Durable receipt not confirmed');
      if(receipt.state==='failed')throw new Error('CRM delivery requires manual review');
      return {requestId:event.requestId,state:receipt.state==='recorded'?'recorded':'received',delivery:receipt.state==='recorded'?'recorded':'pending'};
    },
    async tick() {
      const item=await store.claim();
      if(!item) return {state:'idle'};
      try {
        const body=JSON.stringify(item.payload), timestamp=String(now());
        const signature='v1='+createHmac('sha256',key).update(timestamp+'.').update(body).digest('hex');
        const response=await transport({body,headers:{'Content-Type':'application/json','X-Sollahms-Timestamp':timestamp,'X-Sollahms-Signature':signature},signal:AbortSignal.timeout(10000)});
        if(response?.requestId!==item.payload.requestId||response?.state!=='recorded') throw new Error('Unconfirmed CRM record');
        if(await store.complete(item.id,item.lease,response)!==true) throw new Error('Lease lost');
        return {state:'recorded',requestId:item.payload.requestId};
      } catch {
        await store.retry(item.id,item.lease,{code:'crm_delivery_unconfirmed'});
        const status=typeof store.status==='function'?await store.status(item.id):null;
        return {state:status?.state==='failed'?'failed':status?.state==='recorded'?'recorded':'pending',requestId:item.payload.requestId};
      }
    },
  };
}

// For an always-on process; start is explicit. Vercel hosts must instead invoke
// tick from an authorized scheduler, using the same PostgreSQL store.
export function createDeliveryWorker({delivery,intervalMs=1000,onFailure=()=>{},setTimer=setTimeout,clearTimer=clearTimeout}={}){
 if(typeof delivery?.tick!=='function'||!Number.isInteger(intervalMs)||intervalMs<100||intervalMs>60000)throw new Error('Explicit delivery and bounded interval required');
 let enabled=false,closed=false,timer=null,running=null;
 const tick=()=>{if(closed)return Promise.reject(new Error('Worker closed'));if(!running)running=delivery.tick().finally(()=>{running=null;});return running;};
 async function loop(){try{await tick();}catch{try{onFailure({code:'crm_worker_failure'});}catch{}}if(enabled&&!closed)timer=setTimer(()=>{timer=null;void loop();},intervalMs);}
 return{runOnce:tick,start(){if(closed)throw new Error('Worker closed');if(!enabled){enabled=true;void loop();}},async close(){closed=true;enabled=false;if(timer!==null)clearTimer(timer);if(running)try{await running;}catch{}}};
}
