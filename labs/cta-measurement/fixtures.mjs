import {event} from './core.mjs';
export function receiptFor(e,kind){return {synthetic:true,source:'fixture-provider-v1',kind,id:e.receipt,request:e.request,session:e.session,run:e.run,cta:e.cta,at:e.at};}
export function canonical(uuid=()=>crypto.randomUUID(),now=Date.now()){
 const run=uuid(),out=[];let clock=now;for(const [i,cta] of ['tax_advisory_header','tax_advisory_main','tax_advisory_footer'].entries()){
 let state=null;const request=uuid();for(const type of ['guide_view','tax_advisory_click','agenda_view','advisory_form_start',...(i===0?[]:['advisory_accepted']),...(i===2?['advisory_delivered']:[])]){
 const result=event(state,type,{run,now:clock++,uuid,cta,request:type.startsWith('advisory_a')||type==='advisory_delivered'?request:null,receipt:['advisory_accepted','advisory_delivered'].includes(type)?uuid():null});state=result.state;out.push({e:result.event,proof:['advisory_accepted','advisory_delivered'].includes(type)?receiptFor(result.event,type==='advisory_accepted'?'accepted':'delivered'):null});
 }}return {run:{id:run,label:'Cohorte sintética certificada · 3 sesiones',from:now,to:clock+1,expected:out.map(x=>x.e.id)},events:out};
}
