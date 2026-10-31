import { createContactHandler } from './contact.mjs';
import { validFormTiming } from '../lib/mortgage-lead.mjs';

const fail=(error,status)=>Response.json({ok:false,error},{status,headers:{'Cache-Control':'no-store'}});
/** Consent boundary for the orientation form; transport, origin checks,
 * validation, Preview guard and idempotency remain in the existing handler. */
export function createOrientationContactHandler(options={}) {
  const handler=createContactHandler(options);
  const now=options.now||Date.now;
  return {async fetch(request){
    if(request.method!=='POST')return handler.fetch(request);
    if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type')||''))return fail('Formato no admitido.',415);
    const origin=request.headers.get('origin');
    if(origin!==null&&origin!==new URL(request.url).origin)return fail('Origen de solicitud no permitido.',403);
    const reader=request.body?.getReader();if(!reader)return fail('Solicitud inválida.',400);
    const chunks=[];let size=0;
    try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();return fail('Solicitud demasiado grande.',413);}chunks.push(value);}}
    catch{return fail('Solicitud inválida.',400);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return fail('Solicitud inválida.',400);}
    if(body?.consent!==true||!validFormTiming(body?.startedAt,now()))return fail('Acepta el consentimiento y revisa los datos del formulario.',400);
    // Only the generic contact schema is accepted. Financial context is never collected here.
    if(body.mortgage!==undefined||body.proyecto!==undefined)return fail('Este formulario no admite antecedentes financieros ni de proyectos.',400);
    return handler.fetch(new Request(request.url,{method:request.method,headers:request.headers,body:bytes}));
  }};
}
export default createOrientationContactHandler();
