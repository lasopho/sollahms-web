// Exact certified production bundles, exercised only with in-memory providers.
// No listener, credentials, network call, real message, CRM record or booking.
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(process.argv[2]||'/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-measurement-private/candidate-release/.vercel/output');
const now=Date.parse('2026-11-19T13:00:00Z');
process.env.VERCEL_ENV='production'; // This child process only; no platform change.
let blockedNetworkAttempts=0,mockMailCalls=0,mockCrmCalls=0,syntheticKeyReads=0,bookingProviderCalls=0,ufFixtureCalls=0;
globalThis.fetch=()=>{blockedNetworkAttempts++;throw Error('Network forbidden during local production verification');};
const unexpected=()=>{throw Error('Unexpected provider path');};
const syntheticKey=()=>{syntheticKeyReads++;return 'synthetic-local-placeholder-not-a-credential';};
const mockEmail=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');assert.equal(options.method,'POST');assert.match(options.headers['Idempotency-Key'],/^(contact|advisory|collaboration)\//);mockMailCalls++;return Response.json({id:'synthetic-accepted-only'});};
const mockCrm=async lead=>{assert.equal(lead.consent.accepted,true);assert.equal(lead.email,'qa@example.invalid');assert.equal(typeof lead.requestId,'string');mockCrmCalls++;return {ok:true,persisted:true};};
const options={now:()=>now,getEnvironment:()=> 'production',getApiKey:syntheticKey,getDeliveryMode:()=> 'resend',fetchImpl:mockEmail,persistCrmLead:unexpected,resolveUf:unexpected,callBackend:()=>{bookingProviderCalls++;throw Error('Booking provider forbidden');}};
const load=name=>import(pathToFileURL(join(root,'functions/api',`${name}.func/api/${name}.mjs`)));
async function inventory(dir,base=dir){const rows=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);assert(!e.isSymbolicLink());if(e.isDirectory())rows.push(...await inventory(p,base));else rows.push({path:p.slice(base.length+1),sha256:createHash('sha256').update(await readFile(p)).digest('hex')});}return rows.sort((a,b)=>a.path.localeCompare(b.path));}
const before=await inventory(root),results=[];
const payload={nombre:'Prueba QA Sintética',rut:'1000005-K',correo:'qa@example.invalid',telefono:'+56900000000',mensaje:'Consulta sintética sin envío real.',consent:true,website:'',startedAt:now-5000};
const op=`sollahms-v1-${now-5000}-12345678-1234-4234-8234-123456789abc`;
function request(name,body=payload,{method='POST',origin='https://production.example.invalid',headers={}}={}){return new Request(`https://production.example.invalid/api/${name}`,{method,headers:{'Content-Type':'application/json',Origin:origin,'Idempotency-Key':op,...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})});}
async function verify(label,handler,req,status,expected){const response=await handler.fetch(req);const body=await response.json();assert.equal(response.status,status,label);for(const [key,value]of Object.entries(expected))assert.deepEqual(body[key],value,`${label}/${key}`);assert(!JSON.stringify(body).includes(payload.correo));results.push({test:label,status:response.status,expected,passed:true});return body;}
const contact=await load('contact');
await verify('Production contact/resend reaches mocked acceptance',contact.createContactHandler(options),request('contact'),200,{ok:true,providerAccepted:true,deliveryConfirmed:false});
await verify('Production contact/crm reaches mocked persistence',contact.createContactHandler({...options,getDeliveryMode:()=> 'crm',getApiKey:unexpected,fetchImpl:unexpected,persistCrmLead:mockCrm}),request('contact'),200,{ok:true,persisted:true});
const orientation=await load('orientation-contact');
await verify('Production orientation/resend reaches mocked acceptance',orientation.createOrientationContactHandler(options),request('orientation-contact'),200,{ok:true,providerAccepted:true,deliveryConfirmed:false});
await verify('Production orientation/crm reaches mocked persistence',orientation.createOrientationContactHandler({...options,getDeliveryMode:()=> 'crm',getApiKey:unexpected,fetchImpl:unexpected,persistCrmLead:mockCrm}),request('orientation-contact'),200,{ok:true,persisted:true});
const advisory=await load('advisory');
await verify('Production advisory/resend reaches mocked acceptance',advisory.createAdvisoryHandler(options),request('advisory',{...payload,objetivo:'orientacion',solicitud:'asesoria'}),200,{ok:true,providerAccepted:true,deliveryConfirmed:false});
const collaboration=await load('collaboration');
for(const tipo of ['persona','inmobiliaria'])await verify(`Production collaboration/${tipo} reaches mocked acceptance`,collaboration.createCollaborationHandler(options),request('collaboration',{tipo,correo:payload.correo,telefono:'',consent:true,website:'',startedAt:now-5000}),200,{ok:true,providerAccepted:true,deliveryConfirmed:false});
const providerCountBeforeGuards=mockMailCalls+mockCrmCalls;
await verify('Production contact rejects missing consent',contact.createContactHandler(options),request('contact',{...payload,consent:false}),400,{code:'consent_required'});
await verify('Production contact rejects foreign Origin',contact.createContactHandler(options),request('contact',payload,{origin:'https://foreign.example.invalid'}),403,{});
await verify('Production advisory fails closed on unconfigured channel',advisory.createAdvisoryHandler({...options,getDeliveryMode:()=> 'crm',getApiKey:unexpected,fetchImpl:unexpected}),request('advisory',{...payload,objetivo:'orientacion',solicitud:'asesoria'}),503,{code:'contact_configuration_unavailable'});
assert.equal(mockMailCalls+mockCrmCalls,providerCountBeforeGuards);
for(const name of ['booking-create','booking-availability']){
 const module=await load(name);
 for(const method of ['GET','POST'])await verify(`Production ${name} actual default remains request-only (${method})`,module.default,request(name,{}, {method}),503,{ok:false,code:'booking_not_certified',mode:'request-only'});
}
const uf=await load('uf');
const currentUf={date:'2026-11-19',valueClp:41000,source:{url:'https://www.sii.cl/valores_y_fechas/uf/uf2026.htm',title:'Synthetic fixture, not a live UF measurement',verifiedAt:'2026-11-19'}};
const ufHandler=uf.createUfHandler({now:()=>now,service:{resolve:async()=>{ufFixtureCalls++;return currentUf;}}});
await verify('Production UF handler accepts current fixture and no preview guard',ufHandler,request('uf',{}, {method:'GET'}),200,{uf:currentUf});
await verify('Production UF handler rejects stale fixture',uf.createUfHandler({now:()=>now,service:{resolve:async()=>{ufFixtureCalls++;return {...currentUf,date:'2026-11-18'};}}}),request('uf',{}, {method:'GET'}),503,{code:'uf_unavailable'});
await verify('Production UF handler rejects mutation',ufHandler,request('uf'),405,{});
assert.equal(mockMailCalls,5);assert.equal(mockCrmCalls,2);assert.equal(bookingProviderCalls,0);assert.equal(blockedNetworkAttempts,0);
assert.deepEqual(await inventory(root),before);
const stamp=new Date();
const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZoneName:'longOffset'}).formatToParts(stamp).map(p=>[p.type,p.value]));
const observedAt=`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${parts.timeZoneName.replace('GMT','')}`;
const report={status:'PASS',observedAt,observedAtUTC:stamp.toISOString(),timezone:'America/Santiago',authorizedSHA:'f914590010cf0b4ac930c41a59b648da3be1ab31',method:'Imported exact certified function modules; injected production environment and exclusively in-memory provider functions. Global fetch fails closed. No actual credentials read.',artifact:root,results,tests:results.length,simulatedEnvironment:'production',mockMailCalls,mockCrmCalls,ufFixtureCalls,syntheticKeyReads,realCredentialReads:0,blockedNetworkAttempts,remoteRequests:0,realProviderCalls:0,realFormSubmissions:0,realCrmRecords:0,realReservations:0,bookingProviderCalls,filesUnchanged:before.length,entireArtifactUnchanged:true,productionRoutesDoNotRetainPreviewGuard:true,actualBookingDefaultsRemainRequestOnly:true,limitation:'Local injected-provider verification; does not certify remote environment variable values, provider delivery, CRM availability or live UF. Booking factory remains historical and is not the exported production handler.'};
await writeFile(new URL('./production-runtime-mocks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',tests:results.length,mockMailCalls,mockCrmCalls,realProviderCalls:0,filesUnchanged:before.length}));
