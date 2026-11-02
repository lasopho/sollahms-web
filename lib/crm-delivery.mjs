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
      return {requestId:event.requestId,state:'received',delivery:'pending'};
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
        return {state:'pending',requestId:item.payload.requestId};
      }
    },
  };
}
