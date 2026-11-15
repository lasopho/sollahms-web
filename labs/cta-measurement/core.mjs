// Synthetic-only event contract. Never accepts arbitrary client/form properties.
export const TTL=30*60*1000;
export const TYPES=['guide_view','tax_advisory_click','agenda_view','advisory_form_start','advisory_accepted','advisory_delivered'];
export const CTAS=['tax_advisory_header','tax_advisory_main','tax_advisory_footer'];
export const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const fields=['v','synthetic','id','run','session','seq','type','at','cta','request','receipt'];
export function validate(e){
 if(!e||Object.getPrototypeOf(e)!==Object.prototype||Object.keys(e).some(k=>!fields.includes(k))||fields.some(k=>!Object.hasOwn(e,k)))throw Error('Contrato cerrado');
 if(e.v!==1||e.synthetic!==true||![e.id,e.run,e.session].every(x=>UUID.test(x))||!Number.isSafeInteger(e.seq)||e.seq<1||!TYPES.includes(e.type)||!Number.isSafeInteger(e.at)||e.at<0||!(e.cta===null||CTAS.includes(e.cta))||!(e.request===null||UUID.test(e.request))||!(e.receipt===null||UUID.test(e.receipt)))throw Error('Evento inválido');
 if(e.type==='guide_view'&&(e.cta!==null||e.request!==null||e.receipt!==null))throw Error('Vista sin contexto');
 if(e.type==='tax_advisory_click'&&e.cta===null)throw Error('CTA requerido');
 if(['advisory_accepted','advisory_delivered'].includes(e.type)){if(!e.request||!e.receipt)throw Error('Comprobante requerido');}
 else if(e.request!==null||e.receipt!==null)throw Error('Identidad de solicitud prohibida');
 return structuredClone(e);
}
export function session(previous,now,uuid){
 const valid=previous&&UUID.test(previous.id)&&Number.isSafeInteger(previous.last)&&now>=previous.last&&now-previous.last<TTL;
 return valid?{...previous,last:now}:{id:uuid(),last:now,seq:0,cta:null};
}
export function event(state,type,{run,now,uuid,cta=null,request=null,receipt=null}){
 const s=session(state,now,uuid);if(type==='guide_view')cta=null;else if(type==='tax_advisory_click'){if(!CTAS.includes(cta))throw Error('CTA inválido');s.cta=cta;}else cta=s.cta;
 s.seq++;return {state:s,event:validate({v:1,synthetic:true,id:uuid(),run,session:s.id,seq:s.seq,type,at:now,cta,request,receipt})};
}
export function semantic(e){return [e.run,e.session,e.type,e.cta||'',e.request||''].join(':');}
export function reconcile(e,proof){
 validate(e);if(!['advisory_accepted','advisory_delivered'].includes(e.type))return true;
 // proof comes only from the isolated synthetic receipt driver, never HTTP 200 or form data.
 const kind=e.type==='advisory_accepted'?'accepted':'delivered';
 if(!proof||Object.keys(proof).some(k=>!['synthetic','source','kind','id','request','session','run','cta','at'].includes(k))||proof.synthetic!==true||proof.source!=='fixture-provider-v1'||proof.kind!==kind||proof.id!==e.receipt||proof.request!==e.request||proof.session!==e.session||proof.run!==e.run||proof.cta!==e.cta||proof.at!==e.at)throw Error('Comprobante no conciliado');
 return true;
}
export function aggregate(events,{run,from,to,expected=null,pending=0}={}){
 const valid=events.map(validate).filter(e=>e.run===run&&e.at>=from&&e.at<to).sort((a,b)=>a.at-b.at||a.seq-b.seq);
 const seen=new Set(),rows=valid.filter(e=>{const k=semantic(e);if(seen.has(k))return false;seen.add(k);return true;});
 const sessions=new Map();for(const e of rows){if(!sessions.has(e.session))sessions.set(e.session,[]);sessions.get(e.session).push(e);}
 let unattributable=0,broken=0;const counts=Object.fromEntries(TYPES.map(t=>[t,new Set()]));const clicks=Object.fromEntries(CTAS.map(c=>[c,new Set()]));
 for(const [sid,es] of sessions){let guide=false,agenda=false,start=false;const clicked=new Set(),accepted=new Set();
  for(const e of es){const k=e.request||sid;if(e.type==='guide_view'){guide=true;counts.guide_view.add(sid);continue;}
   if(e.type==='tax_advisory_click'){if(!guide){unattributable++;continue;}clicked.add(e.cta);counts.tax_advisory_click.add(sid);clicks[e.cta].add(sid);continue;}
   if(!guide||!e.cta||!clicked.has(e.cta)){unattributable++;continue;}
   if(e.type==='agenda_view'){agenda=true;counts.agenda_view.add(sid);}else if(e.type==='advisory_form_start'&&agenda){start=true;counts.advisory_form_start.add(sid);}else if(e.type==='advisory_accepted'&&start){accepted.add(k);counts.advisory_accepted.add(k);}else if(e.type==='advisory_delivered'&&accepted.has(k)){counts.advisory_delivered.add(k);}else broken++;
  }
 }
 const missing=expected?expected.filter(id=>!valid.some(e=>e.id===id)).length:null;
 const unexpected=expected?valid.filter(e=>!expected.includes(e.id)).length:0;
 const complete=!!expected&&missing===0&&unexpected===0&&pending===0&&broken===0&&unattributable===0;
 const n=Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,v.size]));
 const acceptedSessions=new Set(rows.filter(e=>e.type==='advisory_accepted'&&counts.advisory_accepted.has(e.request)).map(e=>e.session)).size;
 const rate=(numerator,denominator)=>({numerator,denominator,value:complete&&denominator>0?100*numerator/denominator:null});
 return {synthetic:true,from,to,sample:sessions.size,coverage:complete?'Completa: fixture sintético cerrado':'Incompleta o no certificada',missing,unexpected,pending,unattributable,broken,counts:n,clicks:Object.fromEntries(Object.entries(clicks).map(([k,v])=>[k,v.size])),rates:{ctr:rate(n.tax_advisory_click,n.guide_view),guide_conversion:rate(acceptedSessions,n.guide_view),click_conversion:rate(acceptedSessions,n.tax_advisory_click),delivery:rate(n.advisory_delivered,n.advisory_accepted)}};
}
