// QA artifact only. No credentials, provider transport or persistent storage.
import {createAdvisoryHandler} from './advisory.mjs';
const attempts = new Set();
const handler = createAdvisoryHandler({getApiKey:()=> 'synthetic-only',getDeliveryMode:()=> 'resend',getEnvironment:()=> 'production',fetchImpl:async(_url,options)=>{
  const email=JSON.parse(options.body);
  if(!email.text.includes('Nombre: QA Sintetica') || (email.reply_to && email.reply_to!=='qa@example.invalid') || (!email.reply_to && !email.text.includes('Teléfono: +56 9 0000 0000'))) return Response.json({}, {status:400});
  if(email.text.includes('QA_RETRY')&&!attempts.has(options.headers['Idempotency-Key'])) {attempts.add(options.headers['Idempotency-Key']);throw Error('Synthetic uncertain outcome');}
  return Response.json({id:'synthetic-no-message-sent'});
}});
export default handler;
