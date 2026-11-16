// Composition-only supplement. Map rendering belongs to core524, never this pass.
// This file creates no application data and never activates mail or WhatsApp links.
import { createRequire } from 'node:module';
import { readFile,writeFile,mkdir,lstat,symlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { nativeTransport } from '/private/tmp/sollahms-recorridos-qa/native-transport.mjs';
const {chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const root='/private/tmp/sollahms-recorridos-supplement/header-footer';
const origin='https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app';
const deployment='dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi';
const sourceRoot='/private/tmp/sollahms-recorridos-recovery/output';
const certificate=JSON.parse(await readFile('/private/tmp/sollahms-recorridos-recovery/verification-certified.json','utf8'));
const inventory=new Map(certificate.inventory.map(e=>[e.path,e]));
const catalogue=JSON.parse(await readFile('/private/tmp/sollahms-recorridos-qa/data/proyectos.json','utf8'));
const slugs=process.env.QA_SLUGS?process.env.QA_SLUGS.split(','):catalogue.map(p=>p.slug);
const widths=(process.env.QA_WIDTHS||'1440,768,390,320').split(',').map(Number);
const priority=new Set(['inn-puerto-chico','plaza-las-condes','bcome','nucleo-costanera','bordevivo','distrito-centro']);
const expectedPairs=slugs.flatMap(slug=>widths.map(width=>({slug,width,key:slug+':'+width})));
await mkdir(root,{recursive:true});
await writeFile(resolve(root,'runner.pid'),String(process.pid)+'\n');
try{await lstat(resolve(root,'native-cache'));}catch{await symlink('/private/tmp/sollahms-recorridos-qa/native-cache',resolve(root,'native-cache'),'dir');}
const sourceCache=new Map();
async function sourceFor(slug){
 if(!sourceCache.has(slug)){
  const path='static/'+slug+'.html',record=inventory.get(path),bytes=await readFile(resolve(sourceRoot,path));
  if(!record||record.size!==bytes.length||createHash('sha256').update(bytes).digest('hex')!==record.sha256)throw Error('Recovered source integrity mismatch for '+slug);
  sourceCache.set(slug,{html:bytes.toString('utf8'),sha256:record.sha256});
 }
 return sourceCache.get(slug);
}
function key(r){return r.slug+':'+r.width;}
function pass(r){return r.deployment===deployment&&r.scope==='header-footer-composition'&&!r.error&&Object.values(r.checks||{}).every(Boolean)&&r.checks?.headerPresent&&r.checks?.footerPresent;}
let results=[];
if(process.env.QA_RESUME==='1')try{const old=JSON.parse(await readFile(resolve(root,'header-footer-results.json'),'utf8'));results=(old.results||[]).filter(pass);}catch{}
const done=new Set(results.map(key));
let stopping=false;
for(const signal of ['SIGINT','SIGTERM','SIGHUP'])process.on(signal,()=>{stopping=true;});
const transport=await nativeTransport({origin,root});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,handleSIGINT:false,handleSIGTERM:false,handleSIGHUP:false,args:['--no-sandbox','--disable-dev-shm-usage']});
let current=null;
let loadedSlug=null,loadedStatus=null,documentIsolation=[];
function safeUrl(value){try{const u=new URL(value);return ['http:','https:','file:'].includes(u.protocol)?u.protocol+'//'+u.host+u.pathname:u.protocol+'[omitted]';}catch{return String(value||'').split(/[?#]/,1)[0];}}
function sanitize(value){
 return String(value||'')
  .replace(/https?:\/\/[^\s"'<>]+/gi,url=>safeUrl(url))
  .replace(/\b(?:data|blob):[^\s"'<>]+/gi,'[data/blob URL omitted]')
  .replace(/\bBearer\s+[^\s,;"']+/gi,'Bearer [redacted]')
  .replace(/\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,'[redacted JWT]')
  .replace(/\b(?:github_pat_|ghp_|sk-|sbp_|vercel_|re_)[A-Za-z0-9_-]{12,}\b/g,'[redacted credential]')
  .replace(/\b(?:authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|token|secret|password|cookie|signature|credential)\b["']?\s*[:=]\s*["']?[^\s,;}"']+/gi,label=>label.split(/[:=]/,1)[0]+'=[redacted]')
  .replace(/\b(?:(?:request|response)[_-]?)?(?:body|headers)\b["']?\s*[:=][\s\S]*/gi,'[body/headers payload omitted]')
  .slice(0,2500);
}
function classifyConsole(raw,location,type){
 const urls=[location,...(raw.match(/https?:\/\/[^\s"'<>]+/gi)||[])].filter(Boolean).map(safeUrl);
 const blocked=documentIsolation.find(r=>urls.some(u=>u===r.origin+r.path));
 const loadingMessage=/failed to load|err_failed|err_aborted|blocked|refused|content.security.policy|\bcsp\b|frame|unable to load|could not load|failed to fetch/i.test(raw);
 if(blocked&&(loadingMessage||safeUrl(location)===blocked.origin+blocked.path))return {category:'expected-composition-isolation',reason:blocked.reason};
 if(urls.some(url=>url.startsWith(origin+'/')))return {category:type==='error'?'application-console-error':'application-console-warning',reason:'Application origin; not explained by a deliberate blocked resource'};
 return {category:'unclassified-console-message',reason:'Requires review; not excused by the composition isolation policy'};
}
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
// Retain real styles, fonts and application scripts. Block map documents and
// optional remote toolbar/telemetry so this pass tests only header/footer layout.
await context.route('**/*',async route=>{
 const req=route.request(),url=new URL(req.url()),type=req.resourceType();
 const record={origin:url.origin,path:url.pathname,method:req.method(),type};
 if(!['GET','HEAD','OPTIONS'].includes(req.method())){current?.blockedMutations.push(record);return route.abort();}
 if(url.origin===origin){try{return await transport.handle(route);}catch{current?.transportFailures.push(record);return route.abort().catch(()=>{});}}
 const frameDocument=req.isNavigationRequest()&&req.frame().parentFrame()!==null;
 const optionalToolbar=url.hostname==='vercel.live'||url.hostname.endsWith('.vercel.live');
 const mapResource=/(?:^|\.)(?:googleapis\.com|gstatic\.com)$/.test(url.hostname)&&(/maps|places/.test(url.pathname)||url.hostname.startsWith('maps.')||url.hostname.startsWith('places.'));
 if(frameDocument||optionalToolbar||mapResource||type==='document'){
  const entry={...record,reason:frameDocument?'map-or-external-frame':optionalToolbar?'optional-preview-toolbar':mapResource?'map-resource':'external-document'};
  current?.compositionIsolation.push(entry);documentIsolation.push(entry);
  return route.abort();
 }
 return route.continue();
});
const page=await context.newPage();page.setDefaultTimeout(30000);
page.on('pageerror',e=>current?.pageErrors.push(sanitize(e.message)));
page.on('console',message=>{
 if(!current||!['error','warning'].includes(message.type()))return;
 const raw=message.text(),location=message.location();
 current.consoleMessages.push({type:message.type(),text:sanitize(raw),location:{url:safeUrl(location.url),lineNumber:location.lineNumber,columnNumber:location.columnNumber},...classifyConsole(raw,location.url,message.type())});
});
page.on('response',r=>{const q=r.request(),u=new URL(r.url());if(r.status()>=400&&['stylesheet','font','script'].includes(q.resourceType()))current?.relevantResourceFailures.push({origin:u.origin,path:u.pathname,type:q.resourceType(),status:r.status()});});
page.on('requestfailed',q=>{
 const u=new URL(q.url()),type=q.resourceType();
 if(['stylesheet','font','script'].includes(type)&&!(u.hostname==='vercel.live'||u.hostname.endsWith('.vercel.live'))&&!(/maps|places/.test(u.pathname)&&/(?:googleapis|gstatic)\.com$/.test(u.hostname)))current?.relevantResourceFailures.push({origin:u.origin,path:u.pathname,type,error:q.failure()?.errorText});
});
async function checkpoint(){
 const failures=results.filter(r=>!pass(r));
 await writeFile(resolve(root,'header-footer-results.json'),JSON.stringify({deployment,scope:'header-footer-composition',origin,viewportHeight:1000,expectedPairs:expectedPairs.length,completedPairs:results.length,passedPairs:results.length-failures.length,complete:!stopping&&results.length===expectedPairs.length,interrupted:stopping,joinKey:['deployment','slug','width'],mapRender:'excluded; core524 owns its independent render evidence',externalStylesFontsApplicationScripts:'real GET preserved',consoleCapture:{types:['error','warning'],scope:'events emitted during each slug,width measurement window',redaction:'URL query, fragment, userinfo and credential patterns removed; no argument objects, bodies or headers captured',expectedIsolationKeptSeparate:true},formSubmissions:0,mailOrWhatsappActivations:0,failures:failures.map(key),results},null,2)+'\n');
}
try{
 for(const pair of expectedPairs){
  if(done.has(pair.key))continue;
  try{await lstat(resolve(root,'STOP'));stopping=true;}catch{}
  if(stopping)break;
  const row={deployment,scope:'header-footer-composition',slug:pair.slug,width:pair.width,viewportHeight:1000,checks:{},compositionIsolation:[],blockedMutations:[],transportFailures:[],pageErrors:[],consoleMessages:[],relevantResourceFailures:[]};current=row;
  try{
   const source=await sourceFor(pair.slug);row.certifiedSourceSha256=source.sha256;
   await page.setViewportSize({width:pair.width,height:1000});
   if(loadedSlug!==pair.slug){
    documentIsolation=[];
    const response=await page.goto(origin+'/'+pair.slug+'.html',{waitUntil:'domcontentloaded',timeout:90000});loadedStatus=response.status();loadedSlug=pair.slug;row.navigationMode='new-document';
   }else row.navigationMode='same-document-css-resize';
   row.status=loadedStatus;
   await page.evaluate(async()=>{await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,15000))]);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   await page.evaluate(()=>scrollTo(0,0));
   await page.locator('header img').evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{if(!img.complete)await Promise.race([new Promise(r=>{img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true});}),new Promise(r=>setTimeout(r,15000))]);})));
   const inspect=async(selector,sourceHtml)=>page.evaluate(({selector,sourceHtml})=>{
    const doc=new DOMParser().parseFromString(sourceHtml,'text/html');
    const expected=doc.querySelector(selector),section=document.querySelector(selector);
    const clean=t=>(t||'').replace(/\s+/g,' ').trim();
    const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return !!e.getClientRects().length&&r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
    const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const linkData=e=>({href:e.getAttribute('href'),text:clean(e.textContent),label:e.getAttribute('aria-label')});
    const expectedLinks=expected?[...expected.querySelectorAll('a[href]')].map(linkData):[];
    if(!section)return {present:false,sourcePresent:!!expected,expectedLinks};
    const actions=[...section.querySelectorAll('a[href],button,input:not([type=hidden]),select')].filter(visible).map(e=>({tag:e.tagName,href:e.getAttribute('href'),text:clean(e.textContent),label:e.getAttribute('aria-label'),id:e.id,ariaControls:e.getAttribute('aria-controls'),disabled:!!e.disabled,bounds:rect(e)}));
    const overlaps=[];
    for(let a=0;a<actions.length;a++)for(let b=a+1;b<actions.length;b++){
     const x=actions[a].bounds,y=actions[b].bounds,w=Math.min(x.right,y.right)-Math.max(x.left,y.left),h=Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top);
     if(w>1&&h>1)overlaps.push({first:a,second:b,width:w,height:h});
    }
    const links=[...section.querySelectorAll('a[href]')].map(linkData);
    const imageState=[...section.querySelectorAll('img')].filter(visible).map(e=>({src:e.getAttribute('src'),decoded:e.complete&&e.naturalWidth>0,bounds:rect(e)}));
    const bounds=rect(section);
    return {present:true,sourcePresent:!!expected,bounds,visible:visible(section),boundsWithinViewport:bounds.left>=-1&&bounds.right<=innerWidth+1,expectedLinks,links,sourceLinkInventoryMatches:JSON.stringify(expectedLinks)===JSON.stringify(links),actions,actionsWithinViewport:actions.every(a=>a.bounds.left>=-1&&a.bounds.right<=innerWidth+1),actionOverlaps:overlaps,imageState,scrollWidth:section.scrollWidth,clientWidth:section.clientWidth};
   },{selector,sourceHtml});
   row.header=await inspect('body > header',source.html);
   row.mobileMenu={status:'not-selected-for-functional-check'};
   const button=page.locator('header button[aria-controls="mobile-menu"]').first();
   if(priority.has(pair.slug)&&[768,390,320].includes(pair.width)){
    if(await button.count()&&await button.isVisible()){
     const menu=page.locator('#mobile-menu');
     await button.click();
     await page.waitForFunction(()=>document.querySelector('header button[aria-controls="mobile-menu"]')?.getAttribute('aria-expanded')==='true'&&!!document.querySelector('#mobile-menu')?.getClientRects().length,undefined,{timeout:5000});
     const opened=await menu.evaluate(e=>{const r=e.getBoundingClientRect();const links=[...e.querySelectorAll('a[href]')].map(a=>{const b=a.getBoundingClientRect();return {href:a.getAttribute('href'),text:a.textContent.trim(),left:b.left,right:b.right,width:b.width,visible:!!a.getClientRects().length};});return {visible:!!e.getClientRects().length,bounds:{left:r.left,right:r.right,width:r.width},withinViewport:r.left>=-1&&r.right<=innerWidth+1,links,linksWithinViewport:links.every(a=>a.visible&&a.left>=-1&&a.right<=innerWidth+1)};});
     await page.keyboard.press('Escape');
     await page.waitForFunction(()=>document.querySelector('header button[aria-controls="mobile-menu"]')?.getAttribute('aria-expanded')==='false'&&!document.querySelector('#mobile-menu')?.getClientRects().length,undefined,{timeout:5000});
     row.mobileMenu={status:'tested',opened,closed:!await menu.isVisible(),ariaExpanded:await button.getAttribute('aria-expanded'),focusReturned:await button.evaluate(e=>document.activeElement===e),linksActivated:0};
    }else row.mobileMenu={status:'not-applicable-button-hidden-at-this-width'};
   }
   await page.locator('body > footer').scrollIntoViewIfNeeded();
   await page.locator('header img,footer img').evaluateAll(async imgs=>Promise.all(imgs.map(async img=>{if(!img.complete)await Promise.race([new Promise(r=>{img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true});}),new Promise(r=>setTimeout(r,15000))]);})));
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   row.footer=await inspect('body > footer',source.html);
   row.linkDestinations=[];
   for(const link of [...(row.header.links||[]),...(row.footer.links||[])]){
    const u=new URL(link.href,origin+'/'+pair.slug+'.html');
    if(u.origin!==origin&&!['sollahms.cl','www.sollahms.cl'].includes(u.hostname))continue;
    const path=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname).replace(/^\//,'');
    const exists=inventory.has('static/'+path);
    row.linkDestinations.push({href:link.href,path,exists});
   }
   row.checks={status200:row.status===200,headerPresent:!!row.header.present,footerPresent:!!row.footer.present,headerSourceLinksPreserved:!!row.header.sourceLinkInventoryMatches,footerSourceLinksPreserved:!!row.footer.sourceLinkInventoryMatches,headerWidthFits:!!row.header.boundsWithinViewport,footerWidthFits:!!row.footer.boundsWithinViewport,headerActionsFit:!!row.header.actionsWithinViewport,footerActionsFit:!!row.footer.actionsWithinViewport,headerActionsDoNotOverlap:!row.header.actionOverlaps?.length,footerActionsDoNotOverlap:!row.footer.actionOverlaps?.length,headerHasVisibleActions:row.header.actions?.length>0,footerHasVisibleLinks:row.footer.actions?.length>0,headerFooterImagesDecoded:[...(row.header.imageState||[]),...(row.footer.imageState||[])].every(i=>i.decoded),internalDestinationsExist:row.linkDestinations.every(l=>l.exists),mobileMenuFunctional:row.mobileMenu.status!=='tested'||(row.mobileMenu.opened.visible&&row.mobileMenu.opened.withinViewport&&row.mobileMenu.opened.linksWithinViewport&&row.mobileMenu.closed&&row.mobileMenu.ariaExpanded==='false'&&row.mobileMenu.focusReturned),noCommercialRequests:row.blockedMutations.filter(r=>r.origin===origin).length===0,noUnknownMutations:row.blockedMutations.length===0,noTransportFailure:row.transportFailures.length===0,noApplicationPageError:row.pageErrors.length===0,stylesFontsScriptsLoaded:row.relevantResourceFailures.length===0,noUnclassifiedConsoleErrorOrWarning:row.consoleMessages.every(m=>m.category==='expected-composition-isolation')};
  }catch(e){row.error=sanitize(e.message);if(/Target page, context or browser has been closed/.test(e.message))stopping=true;loadedSlug=null;}
  results.push(row);current=null;await checkpoint();
  console.log(JSON.stringify({headerFooterCompleted:results.length,last:pair.key,passed:pass(row),error:row.error||null}));
 }
}finally{
 current=null;
 await browser.close().catch(()=>{});
 await transport.close();
 await checkpoint();
}
if(stopping||results.length!==expectedPairs.length||results.some(r=>!pass(r)))process.exitCode=1;
