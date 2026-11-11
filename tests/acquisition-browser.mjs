// Run against the exact local frozen candidate, never a production endpoint.
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const work=resolve(process.argv[2]),output=resolve(process.argv[3]);await mkdir(output,{recursive:true});
const refs=new Map(JSON.parse(await readFile(join(work,'source-files.json'),'utf8')).map(x=>[x.file,x]));
const handlers={},sent=[],requests=[],cases=[];
for(const [name,exportName]of [['advisory','createAdvisoryHandler'],['contact','createContactHandler'],['collaboration','createCollaborationHandler'],['orientation-contact','createOrientationContactHandler']]){
 const mod=await import(pathToFileURL(join(work,`release/functions/api/${name}.func/api/${name}.mjs`)));
 handlers['/api/'+name]=mod[exportName]({getEnvironment:()=> 'local-qa',getDeliveryMode:()=> 'resend',getApiKey:()=> 'synthetic-only',persistCrmLead:()=>{throw Error('CRM forbidden');},resolveUf:async()=>null,fetchImpl:async(url,opts)=>{
  assert.equal(url,'https://api.resend.com/emails');const email=JSON.parse(opts.body);assert.equal(email.reply_to,'qa@example.invalid');sent.push({tags:email.tags,key:opts.headers['Idempotency-Key']});return Response.json({id:'synthetic-receipt-'+sent.length});
 }});
}
const server=createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname;
 if(req.method==='POST'){
  assert.ok(handlers[path]);let body='';for await(const chunk of req)body+=chunk;requests.push({path,body:JSON.parse(body)});
  const r=await handlers[path].fetch(new Request('http://'+req.headers.host+path,{method:'POST',headers:req.headers,body}));res.writeHead(r.status,Object.fromEntries(r.headers));res.end(await r.text());return;
 }
 if(path==='/api/uf'){res.writeHead(503,{'Content-Type':'application/json'});res.end('{}');return;}
 const name=path==='/'?'index.html':path.slice(1);const file=join(work,'release/static',name);assert.ok(file.startsWith(join(work,'release/static/')));
 let b;try{b=await readFile(file);}catch{
  const ref=refs.get('release/static/'+name);if(!ref){res.writeHead(404);res.end();return;}
  // Inbound retrieval only, for unchanged public CAS assets absent from the sparse checkout.
  const r=await fetch('https://sollahms.cl/'+name);assert.ok(r.ok);b=Buffer.from(await r.arrayBuffer());assert.equal(createHash('sha1').update(b).digest('hex'),ref.sha,name);await mkdir(resolve(file,'..'),{recursive:true});await writeFile(file,b);
 }
 const type={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2','.jpg':'image/jpeg','.png':'image/png'}[extname(file)]||'application/octet-stream';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(b);
 }catch(e){res.writeHead(500);res.end('Isolated fixture failed');console.error(e.message);}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 for(const [view,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const [path,selector,kind]of [
  ['/','#advisory-form',''],['/contacto.html','#advisory-form',''],['/agenda-asesoria.html','#advisory-form',''],['/centro-orientacion.html','#orientation-contact',''],['/comparador-hipotecario.html','#lead-form','mortgage'],['/trabaja-con-nosotros.html','[data-collaboration-form="inmobiliaria"]','inmobiliaria'],['/trabaja-con-nosotros.html','[data-collaboration-form="persona"]','persona'],
 ]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  await page.goto(base+'/guia-hipotecaria.html?utm_source=chatgpt&utm_medium=referral&utm_campaign=qa&utm_content=guide&utm_term=casa&private=discard',{referer:'https://chatgpt.com/private?secret=discard'});
  await page.waitForFunction(()=>sessionStorage.getItem('sollahms:acquisition:v1'));
  await page.goto(base+path);
  if(kind==='persona'||kind==='inmobiliaria')await page.locator(`[data-collaboration-choice="${kind}"]`).click();
  if(kind==='mortgage'){
   await page.locator('#property').fill('3000');await page.locator('#rate').fill('4.5');await page.locator('#simulation-form button[type=submit]').click();await page.locator('#lead-open').click();
  }
  const form=page.locator(selector);
  for(const [name,value]of [['nombre','QA Persona Sintética'],['rut','1.000.005-K'],['correo','qa@example.invalid'],['telefono','900000000'],['mensaje','Ensayo sintético aislado.']]){const field=form.locator(`[name="${name}"]`);if(await field.count())await field.fill(value);}
  await form.locator('[name="consent"]').check();await page.waitForTimeout(2200);
  const pending=page.waitForResponse(r=>r.request().method()==='POST');await form.locator('button[type=submit]').click();const response=await pending;const result=await response.json();
  assert.equal(response.status(),200,JSON.stringify(result));assert.equal(result.deliveryConfirmed,false);const latest=requests.at(-1).body.acquisition;
  assert.equal(latest.landing_path,'/guia-hipotecaria.html');assert.equal(latest.submission_path,path);assert.equal(latest.referrer_origin,'https://chatgpt.com');assert.equal(latest.utm_source,'chatgpt');assert.equal(latest.utm_campaign,'qa');assert.equal(response.headers()['x-sollahms-request-id'],latest.request_id);assert.equal(sent.at(-1).tags.find(t=>t.name==='request_id').value,latest.request_id);assert.ok(sent.at(-1).key.endsWith(latest.request_id));assert.deepEqual(errors,[]);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
  if(path==='/contacto.html')await page.screenshot({path:join(output,view+'-contact.png'),fullPage:true});
  cases.push({view,path,kind:kind||'advisory',passed:true,requestId:latest.request_id,provider:'isolated synthetic receiver',deliveryConfirmed:false});await context.close();
 }
 // Independent new browser session and storage denial exercise the real loaded modules.
 for(const blocked of [false,true]){
  const context=await browser.newContext();await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());if(blocked)await context.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('blocked');};Storage.prototype.setItem=function(){throw Error('blocked');};});
  const page=await context.newPage();await page.goto(base+'/contacto.html');const form=page.locator('#advisory-form');for(const [n,v]of [['nombre','QA Persona Sintética'],['rut','1.000.005-K'],['correo','qa@example.invalid'],['telefono','900000000']])await form.locator(`[name="${n}"]`).fill(v);await form.locator('[name="consent"]').check();await page.waitForTimeout(2200);const pending=page.waitForResponse(r=>r.request().method()==='POST');await form.locator('button[type=submit]').click();assert.equal((await pending).status(),200);assert.equal(requests.at(-1).body.acquisition.utm_source,null);assert.equal(requests.at(-1).body.acquisition.referrer_origin,null);cases.push({scenario:blocked?'storage blocked':'new session',passed:true});await context.close();
 }
 await writeFile(join(output,'results.json'),JSON.stringify({passed:true,cases,syntheticRequests:requests.length,providerCallsIntercepted:sent.length,realEmailsSent:0,crmCalls:0,productionPosts:0},null,2)+'\n');console.log(JSON.stringify({passed:true,cases:cases.length,syntheticRequests:requests.length,realEmailsSent:0}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
