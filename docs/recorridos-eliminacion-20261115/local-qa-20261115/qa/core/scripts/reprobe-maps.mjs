import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {nativeTransport} from './native-transport.mjs';
import {inspectMedia} from './inspect-media.mjs';
const {chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const root='/private/tmp/sollahms-recorridos-qa',origin='https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app';
const output=resolve(root,'map-reprobe');await mkdir(output,{recursive:true});
const summary=JSON.parse(await readFile(resolve(root,'full-524/acceptance-summary.json'),'utf8'));
const targets=summary.issues.filter(r=>r.reasons.some(x=>x.check==='map-runtime-evidence'||x.check==='map-count'));
const document=JSON.parse(await readFile(resolve(root,'full-524/responsive-qa.json'),'utf8'));
await writeFile(resolve(output,'responsive-before-map-reprobe.json'),JSON.stringify(document,null,2)+'\n');
const transport=await nativeTransport({origin,root});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,handleSIGINT:false,handleSIGTERM:false,args:['--no-sandbox','--disable-features=BackForwardCache']});
let stopped=false;const stop=()=>{stopped=true;void browser.close();void transport.close();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
await writeFile(resolve(output,'pid.json'),JSON.stringify({pid:process.pid,state:'running'})+'\n');
const results=[];
try{
 for(const target of targets){
  if(stopped)break;
  const row=document.results.find(r=>r.slug===target.slug&&r.width===target.width);
  const expected=target.reasons.find(r=>r.check==='map-count')?.expected??row.mapEvidence.length;
  const context=await browser.newContext({viewport:{width:target.width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
  const blocked=[];
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(req.method()==='POST'){
    const p=JSON.parse(await readFile(resolve(root,'read-only-map-rpc-policy.json'),'utf8'));
    if(p.exactReads.some(r=>r.origin===url.origin&&r.path===url.pathname)||(p.allowReadGetMethods&&url.origin===p.mapOrigin&&url.pathname.startsWith(p.mapServicePrefix)&&/^Get[A-Za-z0-9]+$/.test(url.pathname.slice(p.mapServicePrefix.length))))return route.continue();
   }
   if(!['GET','HEAD','OPTIONS'].includes(req.method())){blocked.push({origin:url.origin,path:url.pathname,method:req.method()});return route.abort().catch(()=>{});}
   if(url.origin===origin){try{return await transport.handle(route);}catch{return route.abort('failed').catch(()=>{});}}
   return route.continue();
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);
  try{
   const response=await page.goto(origin+'/'+target.slug+'.html',{waitUntil:'load',timeout:120000});
   if(response.status()!==200||!await page.locator('#project-name').count())throw new Error('Actual fiche did not load');
   const evidence=await inspectMedia(page,{slug:target.slug,width:target.width,output,screenshotMaps:true});
   const passed=evidence.mapEvidence.length===expected&&evidence.mapEvidence.every(m=>m.ready&&!m.errorText&&m.mapWidgets&&(m.canvases||m.decodedTiles));
   const result={slug:target.slug,width:target.width,expected,passed,mapEvidence:evidence.mapEvidence,blockedRequests:blocked,at:new Date().toISOString()};
   results.push(result);
   if(passed){row.previousMapEvidence=row.mapEvidence;row.mapEvidence=result.mapEvidence;row.mapReprobe={passed:true,at:result.at,evidenceFile:resolve(output,'results.json')};}
   console.log(JSON.stringify({slug:target.slug,width:target.width,passed,decodedTiles:result.mapEvidence.map(m=>m.decodedTiles)}));
  }catch(error){if(!stopped)results.push({slug:target.slug,width:target.width,passed:false,error:String(error.message).split('\n')[0]});}
  finally{await context.close().catch(()=>{});await writeFile(resolve(output,'results.json'),JSON.stringify({origin,readOnly:true,results},null,2)+'\n');}
 }
}finally{
 await browser.close().catch(()=>{});await transport.close();process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);await writeFile(resolve(output,'pid.json'),JSON.stringify({pid:process.pid,state:'closed',stopped})+'\n');
}
if(!stopped)await writeFile(resolve(root,'full-524/responsive-qa.json'),JSON.stringify(document,null,2)+'\n');
console.log(JSON.stringify({targets:targets.length,completed:results.length,passed:results.filter(r=>r.passed).length,readOnly:true,commercialSubmissions:0}));
if(stopped||results.length!==targets.length||results.some(r=>!r.passed))process.exitCode=1;

