import {createCollaborationHandler} from './collaboration.mjs';
// Protected isolated transport: this module can never call a real provider.
const seen=new Map();
export default createCollaborationHandler({getEnvironment:()=> 'production',getDeliveryMode:()=> 'resend',getApiKey:()=> 'synthetic-only',fetchImpl:async(url,opts)=>{
 const e=JSON.parse(opts.body);
 if(url!=='https://api.resend.com/emails'||(e.reply_to&&e.reply_to!=='qa@example.invalid')||(!e.reply_to&&!e.text.includes('+56900000000'))||!e.text.includes('Página de origen: https://sollahms.cl/trabaja-con-nosotros.html')||e.to.join()!=='contacto@sollahms.cl')return Response.json({}, {status:400});
 const key=opts.headers['Idempotency-Key'];if(seen.has(key)&&seen.get(key)!==opts.body)return Response.json({name:'invalid_idempotent_request'},{status:409});seen.set(key,opts.body);
 return Response.json({id:'synthetic-collaboration-reception-only'});
}});
