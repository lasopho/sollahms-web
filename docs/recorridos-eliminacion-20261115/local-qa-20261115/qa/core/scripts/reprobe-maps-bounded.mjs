import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {nativeTransport} from './native-transport.mjs';
const {chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const root='/private/tmp/sollahms-recorridos-qa',origin='https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app',output=resolve(process.env.QA_MAP_OUTPUT||resolve(root,'map-reprobe-bounded'));
await mkdir(output,{recursive:true});
const summary=JSON.parse(await readFile(resolve(root,'full-524/acceptance-summary.json'),'utf8')),doc=JSON.parse(await readFile(resolve(root,'full-524/responsive-qa.json'),'utf8'));
const targets=summary.issues.filter(r=>r.reasons.some(x=>['map-runtime-evidence','map-count'].includes(x.check)));
await writeFile(resolve(output,'responsive-before.json'),JSON.stringify(doc,null,2)+'\n');
const transport=await nativeTransport({origin,root}),browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,handleSIGINT:false,handleSIGTERM:false,args:['--no-sandbox','--disable-features=BackForwardCache']});
let stopped=false,activeTarget=null;
const stop=()=>{stopped=true;void browser.close();void transport.close();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
await writeFile(resolve(output,'pid.json'),JSON.stringify({pid:process.pid,state:'running'})+'\n');
async function phase(name,operation,ms=20000){
 const started=Date.now();await writeFile(resolve(output,'phase.json'),JSON.stringify({target:activeTarget,phase:name,timeoutMs:ms,startedAt:new Date(started).toISOString()})+'\n');
 let timer;
 try{return await Promise.race([operation(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('NODE_PHASE_TIMEOUT '+name+' '+ms+'ms')),ms);})]);}
 finally{clearTimeout(timer);}
}
function mapRead(url,policy){return policy.exactReads.some(p=>p.origin===url.origin&&p.path===url.pathname)||(policy.allowReadGetMethods&&url.origin===policy.mapOrigin&&url.pathname.startsWith(policy.mapServicePrefix)&&/^Get[A-Za-z0-9]+$/.test(url.pathname.slice(policy.mapServicePrefix.length)));}
function mapState(){
 const text=document.body?.innerText||'';
 const imgs=[...document.images].filter(i=>i.complete&&i.naturalWidth>0);
 const animated=[...document.querySelectorAll('*')].filter(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return b.width>0&&b.height>0&&b.top>=0&&b.top<130&&b.left>=0&&b.left<300&&s.visibility!=='hidden'&&Number(s.opacity)>0.01&&s.animationName&&s.animationName!=='none';}).map(e=>({tag:e.tagName,animation:getComputedStyle(e).animationName}));
 return {ready:document.readyState==='complete',visibility:document.visibilityState,mapWidgets:document.querySelectorAll('.gm-style,[role=application]').length,canvases:[...document.querySelectorAll('canvas')].filter(c=>c.width>0&&c.height>0).length,decodedImages:imgs.length,decodedTiles:imgs.filter(i=>i.naturalWidth>=128&&i.naturalHeight>=128).length,errorText:/refused to connect|unable to load|problem loading|se ha producido un error|no se puede cargar/i.test(text),textLength:text.length,topLeftAnimations:animated};
}
function ownedDescendants(){
 const rows=execFileSync('ps',['-ax','-o','pid=,ppid=,comm='],{encoding:'utf8'}).split('\n').map(line=>line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/)).filter(Boolean).map(m=>({pid:Number(m[1]),ppid:Number(m[2]),comm:m[3]}));
 const ids=new Set([process.pid]);let changed=true;while(changed){changed=false;for(const r of rows)if(ids.has(r.ppid)&&!ids.has(r.pid)){ids.add(r.pid);changed=true;}}
 return rows.filter(r=>r.pid!==process.pid&&ids.has(r.pid));
}
async function forceOwnChildrenOnly(){
 const owned=ownedDescendants();await writeFile(resolve(output,'forced-own-cleanup.json'),JSON.stringify({ownerPid:process.pid,ownedProcesses:owned},null,2)+'\n');
 for(const r of owned.reverse())try{process.kill(r.pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}
 await new Promise(r=>setTimeout(r,500));
 const current=execFileSync('ps',['-ax','-o','pid=,comm='],{encoding:'utf8'});
 for(const r of owned){const match=current.split('\n').find(line=>new RegExp('^\\s*'+r.pid+'\\s+').test(line));if(match&&match.trim().endsWith(r.comm))try{process.kill(r.pid,'SIGKILL');}catch(e){if(e.code!=='ESRCH')throw e;}}
}
const results=[];
try{
 for(const target of targets){
  if(stopped)break;activeTarget={slug:target.slug,width:target.width};
  const row=doc.results.find(r=>r.slug===target.slug&&r.width===target.width),expected=target.reasons.find(r=>r.check==='map-count')?.expected??row.mapEvidence.length;
  const context=await browser.newContext({viewport:{width:target.width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
  const policy=JSON.parse(await readFile(resolve(root,'read-only-map-rpc-policy.json'),'utf8')),pending=new Map(),rpc=[],blocked=[];
  const page=await context.newPage();page.setDefaultTimeout(10000);
  page.on('request',r=>{const u=new URL(r.url());if(mapRead(u,policy)&&r.method()==='POST'){const entry={origin:u.origin,path:u.pathname,method:r.method(),status:null,startedAt:new Date().toISOString()};pending.set(r,entry);rpc.push(entry);}});
  page.on('response',r=>{const entry=pending.get(r.request());if(entry)entry.status=r.status();});
  page.on('requestfinished',r=>{const entry=pending.get(r);if(entry){entry.finished=true;pending.delete(r);}});
  page.on('requestfailed',r=>{const entry=pending.get(r);if(entry){entry.failed=true;pending.delete(r);}});
  await context.route('**/*',async route=>{
   const r=route.request(),url=new URL(r.url());
   if(r.method()==='POST'&&mapRead(url,policy))return route.continue();
   if(!['GET','HEAD','OPTIONS'].includes(r.method())){blocked.push({origin:url.origin,path:url.pathname,method:r.method()});return route.abort().catch(()=>{});}
   if(url.origin===origin){try{return await transport.handle(route);}catch{return route.abort('failed').catch(()=>{});}}
   return route.continue();
  });
  let result={...activeTarget,expected,passed:false,rpc,blocked};
  try{
   const response=await phase('DOMContentLoaded',()=>page.goto(origin+'/'+target.slug+'.html',{waitUntil:'domcontentloaded',timeout:45000}),50000);
   if(response.status()!==200)throw new Error('Unexpected fiche HTTP '+response.status());
   await phase('bringToFront',()=>page.bringToFront(),5000);
   result.mainVisibility=await phase('visibility',()=>page.evaluate(()=>document.visibilityState),5000);
   const elements=await phase('findMaps',()=>page.locator('iframe[data-project-embed=map],#ubicacion iframe').all(),5000),maps=[];
   for(let index=0;index<elements.length;index++){
    const element=elements[index];
    const ancestors=await phase('ancestorDisclosures',()=>element.locator('xpath=ancestor::details').all(),5000);
    for(const disclosure of ancestors){
     if(await disclosure.getAttribute('open')===null){
      await phase('openAncestorDisclosure',()=>disclosure.locator(':scope > summary').click({timeout:10000}),12000);
      if(await disclosure.getAttribute('open')===null)throw new Error('Ancestor disclosure did not open');
      (result.disclosuresOpened ||= []).push(await disclosure.getAttribute('id'));
     }
    }
    await phase('scrollMap',()=>element.scrollIntoViewIfNeeded({timeout:8000}),10000);
    await phase('frontMap',()=>page.bringToFront(),5000);
    const handle=await phase('mapHandle',()=>element.elementHandle(),5000),frame=await phase('mapFrame',()=>handle.contentFrame(),5000);
    if(!frame)throw new Error('Map frame unavailable');
    await phase('tileReadiness',()=>frame.waitForFunction(()=>[...document.querySelectorAll('canvas')].some(c=>c.width&&c.height)||[...document.images].some(i=>i.complete&&i.naturalWidth>=128&&i.naturalHeight>=128),null,{timeout:15000}),18000);
    await phase('rpcQuiescence',async()=>{const start=Date.now();let quiet=0;while(Date.now()-start<12000){await page.waitForTimeout(250);quiet=pending.size===0?quiet+1:0;if(quiet>=4)return;}},14000);
    await phase('spinnerSettle',()=>frame.waitForFunction(()=>![...document.querySelectorAll('*')].some(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return b.width>0&&b.height>0&&b.top>=0&&b.top<130&&b.left>=0&&b.left<300&&s.visibility!=='hidden'&&Number(s.opacity)>0.01&&s.animationName&&s.animationName!=='none';}),null,{timeout:10000}),12000).catch(error=>{result.spinnerWaitError=String(error.message).split('\n')[0];});
    await phase('frontCapture',()=>page.bringToFront(),5000);
    const state=await phase('inspectMap',()=>frame.evaluate(mapState),5000);
    const box=await phase('geometry',()=>element.boundingBox(),5000);
    const screenshot=resolve(output,'map-'+target.slug+'-'+target.width+'-'+index+'.png');
    await phase('screenshot',()=>element.screenshot({path:screenshot,timeout:12000}),15000);
    maps.push({index,srcOrigin:new URL(await element.getAttribute('src'),page.url()).origin,title:await element.getAttribute('title'),hasTitle:!!await element.getAttribute('title'),geometry:box?{width:box.width,height:box.height}:null,...state,screenshot});
   }
   result.mapEvidence=maps;result.pendingRpc=[...pending.values()];
   result.passed=maps.length===expected&&maps.every(m=>m.ready&&m.visibility==='visible'&&!m.errorText&&m.mapWidgets&&(m.canvases||m.decodedTiles)&&!m.topLeftAnimations.length)&&!result.pendingRpc.length&&rpc.every(r=>!r.failed&&r.status>=200&&r.status<400);
   if(result.passed){row.previousMapEvidence=row.mapEvidence;row.mapEvidence=maps;row.mapReprobe={passed:true,at:new Date().toISOString(),evidenceFile:resolve(output,'results.json')};}
  }catch(error){result.error=String(error.message).split('\n')[0];result.pendingRpc=[...pending.values()];}
  finally{
   if(!stopped){results.push({...result,at:new Date().toISOString()});await writeFile(resolve(output,'results.json'),JSON.stringify({origin,readOnly:true,results},null,2)+'\n');console.log(JSON.stringify({slug:target.slug,width:target.width,passed:result.passed,error:result.error,pendingRpc:result.pendingRpc?.length,spinnerWaitError:result.spinnerWaitError}));}
   await phase('closeContext',()=>context.close(),10000).catch(()=>{});
  }
 }
}finally{
 await phase('closeBrowser',()=>browser.close(),15000).catch(()=>forceOwnChildrenOnly());await transport.close();process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);await writeFile(resolve(output,'pid.json'),JSON.stringify({pid:process.pid,state:'closed',stopped})+'\n');
}
if(!stopped)await writeFile(resolve(root,'full-524/responsive-qa.json'),JSON.stringify(doc,null,2)+'\n');
console.log(JSON.stringify({targets:targets.length,completed:results.length,passed:results.filter(r=>r.passed).length,readOnly:true,commercialSubmissions:0}));
if(stopped||results.length!==targets.length||results.some(r=>!r.passed))process.exitCode=1;

