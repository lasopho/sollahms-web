import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,readdir,rename} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
const {chromium}=createRequire('/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright');
const args=process.argv.slice(2),opt=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const QA=resolve(import.meta.dirname),ROOT=resolve(QA,'../../..');
const BASELINE='/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-service-coverage-private/candidate/.vercel/output/static';
const diagnose=args.includes('--diagnose'),smoke=args.includes('--smoke'),captureBaseline=args.includes('--capture-baseline'),mode=opt('--mode','local'),origin=opt('--origin','https://sollahms.cl'),deployment=opt('--deployment',null),staticRoot=resolve(opt('--static',BASELINE)),out=resolve(opt('--out',join(QA,mode)));
assert(['local','isolated','public'].includes(mode));if(diagnose)assert(smoke,'Diagnostics are restricted to the family smoke test');
if(mode==='public')assert.equal(origin,'https://sollahms.cl');
if(mode==='isolated'){assert(/^dpl_[A-Za-z0-9]+$/.test(deployment||''));assert(new URL(origin).hostname.endsWith('.vercel.app'));}
const widths=[1440,1024,768,390,320],HEIGHT=1000,hash=data=>createHash('sha256').update(data).digest('hex');
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.ico':'image/x-icon'};
const apiFixture={status:503,contentType:'application/json',body:'{"code":"footer_qa_read_only","fixture":true}'};
const rawCache=new Map(),fontCache=new Map(),networkCache=new Map();
const report={startedAt:new Date().toISOString(),mode,origin,deployment,staticRoot,baselineStatic:BASELINE,captureBaseline,widths,height:HEIGHT,cases:[],pageErrors:[],ownResourceFailures:[],unexpectedConsole:[],expectedFixtureConsole:[],expectedStatusConsole:[],blockedMutations:[],unexpectedExternal:[],blockedMetrics:[],mapFixtures:[],apiFixtures:[],fontResources:[],networkResources:[],consent:[],preexistingOutsideFooterOverflow:[],motion:[],templateComparisons:[],screenshots:[],passed:false};
await mkdir(captureBaseline?QA:out,{recursive:true});
if(!captureBaseline){try{const previous=JSON.parse(await readFile(join(out,'results.json'),'utf8'));if(!previous.passed){await mkdir(join(out,'attempts'),{recursive:true});await writeFile(join(out,'attempts','failed-'+Date.now()+'.json'),JSON.stringify(previous,null,2)+'\n');}}catch(error){if(error.code!=='ENOENT')throw error;}}
let saveQueue=Promise.resolve();
function saveReport(){const body=JSON.stringify(report,null,2)+'\n';saveQueue=saveQueue.then(async()=>{const temporary=join(out,'results.pending.json');await writeFile(temporary,body);await rename(temporary,join(out,'results.json'));});return saveQueue;}
let browser,context,manifest;
const ownNetworkSemaphore={active:0,waiters:[]};
async function acquire(){while(ownNetworkSemaphore.active>=4)await new Promise(r=>ownNetworkSemaphore.waiters.push(r));ownNetworkSemaphore.active++;}
function release(){ownNetworkSemaphore.active--;ownNetworkSemaphore.waiters.shift()?.();}
async function readCached(path){if(!rawCache.has(path))rawCache.set(path,readFile(path));return rawCache.get(path);}
async function localRead(url,base=staticRoot){const relative=url.pathname==='/__footer-global-not-found-20261119__'?'/404.html':url.pathname==='/patio-brasil'?'/410.html':url.pathname==='/'?'/index.html':url.pathname;const path=resolve(base,'.'+decodeURIComponent(relative));assert(path.startsWith(base+'/'));return {status:['/410.html','/patio-brasil'].includes(url.pathname)?410:['/404.html','/__footer-global-not-found-20261119__'].includes(url.pathname)?404:200,contentType:mime[extname(path)]||'application/octet-stream',body:await readCached(path)};}
function command(file,argv){return new Promise((resolve,reject)=>{
 const env={...process.env,PATH:'/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'};
 for(const key of ['NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VC_DEBUG','VERCEL_LOG_LEVEL','VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID'])delete env[key];
 const child=spawn(file,argv,{cwd:ROOT,env,stdio:['ignore','pipe','pipe']});const chunks=[];let bytes=0;const timer=setTimeout(()=>child.kill('SIGKILL'),75000);
 child.stdout.on('data',body=>{bytes+=body.length;if(bytes>32*1024*1024)child.kill('SIGKILL');chunks.push(body);});child.stderr.resume();
 child.on('error',error=>{clearTimeout(timer);reject(error);});child.on('close',(code,signal)=>{clearTimeout(timer);if(code!==0)return reject(new Error('Bounded read-only HTTP transport failed; exit='+code+' signal='+signal));resolve(Buffer.concat(chunks));});
});}
async function remoteRead(url){
 assert(url.origin===origin&&!url.pathname.startsWith('/api/'));
 const key=url.href;if(!networkCache.has(key))networkCache.set(key,(async()=>{
  await acquire();try{
   const curl=['--silent','--show-error','--max-time','60','--connect-timeout','15','--proto','=https','--request','GET','--include','--header','Accept-Encoding: identity','--write-out','\n__SOLLAHMS_HTTP_META__%{http_code}\t%{ssl_verify_result}\t%{url_effective}\n'];
   const raw=mode==='isolated'?await command('/Users/luissandoval/.npm-global/bin/vercel',['curl',url.pathname+url.search,'--deployment',deployment,'--scope','lsandoval2-8260s-projects','--',...curl]):await command('/usr/bin/curl',['-q',...curl,url.href]);
   const marker=Buffer.from('\n__SOLLAHMS_HTTP_META__'),at=raw.lastIndexOf(marker);assert(at>=0,'Missing TLS verification receipt');const [statusRaw,sslRaw,effective]=raw.subarray(at+marker.length).toString().trim().split('\t');
   const status=Number(statusRaw);assert.equal(Number(sslRaw),0,'TLS certificate verification failed');
   const payload=raw.subarray(0,at);let start=0,headers={};
   while(payload.subarray(start,start+5).toString()==='HTTP/'){
    let end=payload.indexOf(Buffer.from('\r\n\r\n'),start),gap=4;if(end<0){end=payload.indexOf(Buffer.from('\n\n'),start);gap=2;}assert(end>=0,'Malformed HTTP response headers');
    const lines=payload.subarray(start,end).toString().split(/\r?\n/);headers={};for(const line of lines.slice(1)){const colon=line.indexOf(':');if(colon>0){const name=line.slice(0,colon).toLowerCase();if(['content-type','content-security-policy','x-content-type-options','referrer-policy','permissions-policy','x-frame-options','cache-control','location'].includes(name))headers[name]=line.slice(colon+1).trim();}}
    start=end+gap;
   }
   const body=payload.subarray(start),expected=await localRead(url);assert.equal(status,expected.status,'Unexpected delivered HTTP status '+url.pathname);
   const suffix=Buffer.from('<script async data-explicit-opt-in="true" data-deployment-id="'+deployment+'" src="https://vercel.live/_next-live/feedback/feedback.js"></script>');
   const exact=body.equals(expected.body),knownToolbar=expected.contentType==='text/html'?body.equals(Buffer.concat([expected.body,suffix])):false;
   assert(exact||knownToolbar,'Delivered bytes differ from certified candidate: '+url.pathname);
   assert(!headers.location,'Unexpected redirect: '+url.pathname);
   report.networkResources.push({url:url.origin+url.pathname,path:url.pathname,status,bytes:body.length,sha256:hash(body),expectedSHA256:hash(expected.body),sourceByteExact:exact,knownAdministrativeToolbarOnly:knownToolbar&&!exact,TLSVerified:true,sslVerifyResult:Number(sslRaw),source:mode==='isolated'?'Authenticated Vercel CLI GET from exact deployment':'Anonymous real public HTTPS GET via system curl',effectiveOrigin:new URL(effective).origin});
   return {status,headers,body};
  }finally{release();}
 })());return networkCache.get(key);
}

async function makeContext(){
 const c=await browser.newContext({viewport:{width:1440,height:HEIGHT},locale:'es-CL',timezoneId:'America/Santiago',serviceWorkers:'block',reducedMotion:'no-preference',ignoreHTTPSErrors:false});
 await c.addInitScript(()=>{window.__footerQASubmits=0;document.addEventListener('submit',e=>{window.__footerQASubmits++;e.preventDefault();e.stopImmediatePropagation();},true);});
 await c.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(!['GET','HEAD'].includes(req.method())){report.blockedMutations.push({url:u.origin+u.pathname,method:req.method()});return route.abort();}
  if(u.origin==='https://vercel.live'&&u.pathname==='/_next-live/feedback/feedback.js')return route.fulfill({status:204,contentType:'text/javascript',body:''});
  if(/(?:^|\.)(?:google-analytics\.com|googletagmanager\.com|clarity\.ms|clarity\.com)$/.test(u.hostname)){report.blockedMetrics.push({host:u.hostname,path:u.pathname});return route.fulfill({status:204,body:''});}
  if(u.hostname==='www.google.com'&&u.pathname.startsWith('/maps')&&req.isNavigationRequest()&&req.frame().parentFrame()){
   report.mapFixtures.push({path:u.pathname,reason:'Embedded map isolated for footer geometry QA; original iframe src and markup remain unchanged; live maps not verified'});
   return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><head><title>Isolated map fixture for footer QA</title></head><body></body></html>'});
  }
  if(['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)){
   if(!fontCache.has(u.href))fontCache.set(u.href,(async()=>{const response=await route.fetch({timeout:60000});assert(response.ok(),'Font GET failed');const body=await response.body();report.fontResources.push({url:u.href,status:response.status(),sha256:hash(body),bytes:body.length,TLSVerified:true});return {status:response.status(),headers:response.headers(),body};})());
   return route.fulfill(await fontCache.get(u.href));
  }
  if(u.origin!==origin){report.unexpectedExternal.push({host:u.hostname,path:u.pathname});return route.abort();}
  if(u.pathname.startsWith('/api/')){report.apiFixtures.push({path:u.pathname,method:req.method()});return route.fulfill(apiFixture);}
  try{return route.fulfill(captureBaseline||mode==='local'?await localRead(u,captureBaseline?BASELINE:staticRoot):await remoteRead(u));}
  catch(error){report.ownResourceFailures.push({url:u.pathname,code:error.code||error.message});return route.fulfill({status:404,body:'Missing certified static QA resource'});}
 });
 return c;
}
async function snapshot(page){return page.locator('footer').evaluate(footer=>{
 const norm=text=>(text||'').replace(/\s+/g,' ').trim();
 const canonicalHref=href=>{if(!href)return null;const base=new URL(location.pathname,'https://sollahms.cl');return new URL(href,base).href;};
 const f=footer.getBoundingClientRect(),rect=e=>{const r=e.getBoundingClientRect();return {x:r.x-f.x,y:r.y-f.y,width:r.width,height:r.height};};
 const styleKeys=['filter','transform','objectFit','objectPosition','verticalAlign','alignSelf','listStyleType','fontVariantLigatures','fontFeatureSettings','display','position','boxSizing','color','backgroundColor','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','textAlign','textDecorationLine','textUnderlineOffset','marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderRadius','opacity','gridTemplateColumns','columnGap','rowGap','alignItems','justifyContent','maxWidth','width','height','overflowWrap'];
 const describe=e=>{if(!e)return null;const s=getComputedStyle(e);return {tag:e.tagName,text:norm(e.textContent),href:e.tagName==='A'?canonicalHref(e.getAttribute('href')):null,rect:rect(e),style:Object.fromEntries(styleKeys.map(k=>[k,s[k]]))};};
 const grid=footer.querySelector('.sollahms-footer__columns')||footer.firstElementChild,columns=[...grid.children];
 const links=[...footer.querySelectorAll('a')],image=footer.querySelector('img'),copyright=footer.querySelector('.sollahms-footer__copyright')||footer.querySelector('p'),about=footer.querySelector('.sollahms-footer__about')||footer.querySelectorAll('p')[1],address=footer.querySelector('address'),headings=[...footer.querySelectorAll('h2')];
 const nodes={footer,grid,'brand.column':columns[0],'sections.column':columns[1],'legal.column':columns[2],brand:image?.closest('a'),image,copyright,about,address,'sections.heading':headings[0],'legal.heading':headings[1]};
 links.forEach((e,i)=>nodes['link.'+i]=e);
 const semantic={text:norm(footer.textContent),links:links.map(a=>({text:norm(a.getAttribute('aria-label')||a.textContent),href:canonicalHref(a.getAttribute('href')),target:a.getAttribute('target'),rel:a.getAttribute('rel')})),headings:headings.map(h=>norm(h.textContent)),image:image?{src:image.getAttribute('src'),alt:image.getAttribute('alt'),width:image.getAttribute('width'),height:image.getAttribute('height'),loaded:image.complete&&image.naturalWidth>0,accessibleName:image.closest('a')?.getAttribute('aria-label')}:null};
 const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
 const overflow=[footer,...footer.querySelectorAll('*')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(e=>({tag:e.tagName,text:norm(e.textContent).slice(0,100),cls:e.className}));
 const emptyContainers=[...footer.querySelectorAll('div,p,li,ul,address')].filter(e=>!norm(e.textContent)&&!e.querySelector('img,svg')).map(e=>e.tagName);
 const opacityChain=[];for(let e=footer;e;e=e.parentElement)opacityChain.push({tag:e.tagName,opacity:getComputedStyle(e).opacity,fade:e.classList.contains('s-scroll-presence')});
 const hitTests=links.map(a=>{const all=[...a.getClientRects()],r=all.find(r=>r.width>1&&r.height>1)||a.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=y>=0&&y<innerHeight?document.elementFromPoint(x,y):null;return {href:a.getAttribute('href'),inViewport:y>=0&&y<innerHeight,hit:!!hit&&(a===hit||a.contains(hit)),covering:hit&&!a.contains(hit)?{tag:hit.tagName,cls:hit.className}:null};});
 return {semantic,nodes:Object.fromEntries(Object.entries(nodes).map(([key,e])=>[key,describe(e)])),allElements:[footer,...footer.querySelectorAll('*')].map((e,index)=>({index,tag:e.tagName,cls:e.className,...describe(e)})),footerRect:{width:f.width,height:f.height},documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,overflow,emptyContainers,opacityChain,hitTests,footerFades:footer.querySelectorAll('.s-scroll-presence').length,fontsStatus:document.fonts.status};
});}
async function rejectOptional(page,file){
 if(origin!=='https://sollahms.cl')return;
 if(!await page.locator('script[src*="site-measurement.mjs"]').count())return;
 await page.waitForFunction(()=>!!window.SollahmsMeasurement,{},{timeout:10000});
 const reject=page.locator('.site-measurement-banner [data-choice="reject"]');if(await reject.isVisible())await reject.click();
 const state=await page.evaluate(()=>({status:window.SollahmsMeasurement.status(),consent:JSON.parse(localStorage.getItem('sollahms.measurement-consent.v1')),sdkScripts:[...document.scripts].map(s=>s.src).filter(s=>/googletagmanager|clarity\.ms|google-analytics/.test(s))}));
 assert.equal(state.status.analyticsConsented,false);assert.equal(state.status.replayConsented,false);assert.equal(state.status.analyticsActive,false);assert.equal(state.status.replayStarted,false);assert.deepEqual(state.sdkScripts,[]);report.consent.push({file,...state});
}
async function settleFooter(page,width){
 await page.setViewportSize({width,height:HEIGHT});await page.mouse.move(0,0);await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await page.locator('footer img').evaluateAll(images=>Promise.all(images.map(img=>img.decode().catch(()=>{}))));
 await page.waitForTimeout(100);
}
async function attach(page,file){
 page.on('pageerror',e=>report.pageErrors.push({file,message:e.message}));
 page.on('requestfailed',r=>{const u=new URL(r.url());if(u.origin===origin&&!u.pathname.startsWith('/api/'))report.ownResourceFailures.push({file,url:u.pathname,error:r.failure()?.errorText});});
 page.on('response',r=>{const u=new URL(r.url());if(r.status()>=400&&u.origin===origin&&!u.pathname.startsWith('/api/')&&!['/404.html','/410.html','/patio-brasil','/__footer-global-not-found-20261119__'].includes(u.pathname))report.ownResourceFailures.push({file,url:u.pathname,status:r.status()});});
 page.on('console',m=>{if(m.type()!=='error')return;const entry={file,message:m.text(),url:m.location().url};if(entry.url&&new URL(entry.url).pathname.startsWith('/api/')&&entry.message.includes('503'))report.expectedFixtureConsole.push(entry);else if((entry.url===origin+'/__footer-global-not-found-20261119__'&&entry.message.includes('404'))||(entry.url===origin+'/patio-brasil'&&entry.message.includes('410')))report.expectedStatusConsole.push(entry);else report.unexpectedConsole.push(entry);});
}
const footerPattern=/<footer\b[^>]*>[\s\S]*?<\/footer>/g;
function replaceFooter(body){return body.replace(footerPattern,'').replace(/<link\b[^>]*href=["']\/assets\/css\/corporate-footer\.css(?:\?[^"']*)?["'][^>]*>\n?/gi,'');}
function normalizeFont(value){return value.replaceAll('"','').replaceAll("'",'').split(',')[0].trim().replace(/^Sollahms Footer Inter$/,'Inter');}
function compareSnapshots(current,reference,{original=false,width}={}){
 const semantic=value=>({...value,text:value.text.replace(/\s/g,'')});
 assert.deepEqual(semantic(current.semantic),semantic(reference.semantic),'Footer semantics differ from certified homepage');
 const differences=[];let maxRectDelta=0,stylesCompared=0;
 for(const [name,expected]of Object.entries(reference.nodes)){
  const actual=current.nodes[name];assert(actual&&expected,'Missing footer descriptor '+name);
  if(['copyright','about','sections.heading','legal.heading'].includes(name)||name.startsWith('link.'))assert.equal(actual.text,expected.text,'Footer text differs: '+name);
  for(const key of ['x','y','width','height']){
   let target=expected.rect[key];if(original&&name==='footer'&&key==='height'&&width<1024)target+=48;
   const delta=Math.abs(actual.rect[key]-target);maxRectDelta=Math.max(maxRectDelta,delta);if(delta>.08)differences.push({node:name,kind:'geometry',property:key,actual:actual.rect[key],expected:target});
  }
  const properties=['filter','transform','objectFit','objectPosition','verticalAlign','alignSelf','listStyleType','fontVariantLigatures','fontFeatureSettings','color','backgroundColor','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','textDecorationLine','textUnderlineOffset','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderRadius','opacity','display'];
  for(const key of properties){if(expected.style[key]===undefined)continue;let target=expected.style[key];if(original&&name==='footer'&&key==='paddingBottom'&&width<1024)target='80px';stylesCompared++;if(actual.style[key]!==target)differences.push({node:name,kind:'style',property:key,actual:actual.style[key],expected:target});}
  stylesCompared++;if(normalizeFont(actual.style.fontFamily)!==normalizeFont(expected.style.fontFamily))differences.push({node:name,kind:'font',actual:actual.style.fontFamily,expected:expected.style.fontFamily});
 }
 assert.deepEqual(differences,[],'Footer presentation differs: '+JSON.stringify(differences.slice(0,12)));
 return {homepageSemanticsMatch:true,homepageGeometryMatch:true,fontStylesMatch:true,nodesCompared:Object.keys(reference.nodes).length,stylePropertiesCompared:stylesCompared,maxRectDelta,safeAreaComparedToOriginal:original&&width<1024?48:0};
}
async function checkLinks(page,file){
 const links=await page.locator('footer a').evaluateAll(nodes=>nodes.map(a=>({href:a.getAttribute('href'),name:(a.getAttribute('aria-label')||a.textContent).trim()})));
 assert.equal(links.length,11);
 for(const link of links){const url=new URL(link.href,'https://sollahms.cl'+(file==='index.html'?'/':'/'+file));if(url.origin!=='https://sollahms.cl')continue;const local=await readCached(join(staticRoot,url.pathname==='/'?'index.html':url.pathname.slice(1)));if(url.hash){const id=decodeURIComponent(url.hash.slice(1));assert(local.toString().includes('id="'+id+'"')||local.toString().includes("id='"+id+"'"),'Invalid footer anchor '+link.href);}}
 const whatsapp=page.locator('footer a[href^="https://wa.me/"]');await whatsapp.evaluate(a=>a.addEventListener('click',event=>{event.preventDefault();window.__footerQAWhatsapp=a.getAttribute('href');},{once:true}));await whatsapp.click();assert.equal(await page.evaluate(()=>window.__footerQAWhatsapp),await whatsapp.getAttribute('href'));
 return {anchorsAndDestinationsValidated:11,whatsappPointerActivation:true,externalWhatsappNavigation:false,messagesSent:0};
}
async function motionSample(page,file){
 if(!await page.locator('script[src*="scroll-presence.js"]').count())return {file,notApplicable:'Page has no preexisting scroll helper'};
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>dispatchEvent(new Event('resize')));await page.waitForTimeout(100);
 const selector='main .s-scroll-presence:is(.catalog-card,.ci-identity,.ci-details,figure,.amenity-list,.journey,details:not([open]),.home-seo-steps>li,.spec-grid>div)';
 const candidates=await page.locator(selector).evaluateAll(nodes=>nodes.map((e,index)=>{const r=e.getBoundingClientRect();return {index,top:r.top+scrollY,height:r.height};}).filter(x=>x.top>700&&x.top<document.documentElement.scrollHeight-900&&x.height>5&&x.height<800));
 if(!candidates.length)return {file,notApplicable:'No preexisting editorial fade group with independently positionable geometry; footer opacity tested separately'};
 const probe=await page.locator(selector).nth(candidates[Math.floor(candidates.length/2)].index).elementHandle();
 async function sample(edge){for(let i=0;i<5;i++){await probe.evaluate((e,edge)=>{const r=e.getBoundingClientRect(),inset=Math.max(0,...[...document.querySelectorAll('header,nav')].filter(n=>['fixed','sticky'].includes(getComputedStyle(n).position)).map(n=>n.getBoundingClientRect()).filter(r=>r.top<=1&&r.height<innerHeight/2).map(r=>r.bottom));scrollTo({top:scrollY+(edge?r.bottom:r.top+r.height/2)-(edge?inset+20:innerHeight/2),behavior:'instant'});},edge);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const opacity=await probe.evaluate(e=>Number(getComputedStyle(e).opacity));if(edge?opacity<.9:opacity>.95)return opacity;await page.waitForTimeout(100);}throw Error('Existing editorial motion did not settle: '+file+' '+JSON.stringify(await probe.evaluate(e=>({cls:e.className,tag:e.tagName,rect:e.getBoundingClientRect().toJSON(),opacity:getComputedStyle(e).opacity,presence:e.style.getPropertyValue('--s-presence'),open:e.hasAttribute('open')}))));}
 const reading=await sample(false),edge=await sample(true);assert(reading>.95&&edge<.9&&edge<reading);assert.equal(await page.locator('footer .s-scroll-presence').count(),0);await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>dispatchEvent(new Event('resize')));await page.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches&&document.querySelectorAll('.s-scroll-presence').length===0,{},{timeout:5000});await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>dispatchEvent(new Event('resize')));await probe.dispose();return {file,readingOpacity:reading,edgeOpacity:edge,reducedMotionVisible:true,footerStatic:true};
}
async function runMatrix(){
 const baseline=JSON.parse(await readFile(join(QA,'baseline-home.json'),'utf8'));assert(baseline.passed&&baseline.widths.length===5);
 manifest=JSON.parse(await readFile(join(QA,'../candidate-manifest.json'),'utf8'));assert.equal(manifest.files,1729);assert.equal(manifest.changedHtmlFiles,168);report.inventorySHA256=manifest.inventorySHA256;report.artifactPin=manifest.inventorySHA256;report.footerCSSSHA256=hash(await readCached(join(staticRoot,'assets/css/corporate-footer.css')));report.expectedCases=smoke?15:840;report.transport=mode==='local'?'Exact candidate static bytes rendered in Chrome; no local server':'Real remote first-party HTTPS GETs fetched with TLS verification and cached per exact URL in memory, then rendered in Chrome; no local source fulfillment. Google map iframes are explicit nonnetworking fixtures.';
 const inter='assets/fonts/home/inter-latin-variable.woff2',logo='assets/branding/sollahms-logo.svg';for(const path of [inter,logo])assert.equal(hash(await readCached(join(staticRoot,path))),hash(await readCached(join(BASELINE,path))),'Protected footer identity/font resource changed');
 report.footerFont={path:inter,sha256:hash(await readCached(join(staticRoot,inter))),alias:'Sollahms Footer Inter',sameBytesAsOriginalHomepage:true};report.logo={path:logo,sha256:hash(await readCached(join(staticRoot,logo))),sameBytesAsOriginalHomepage:true};
 const all=(await readdir(staticRoot)).filter(f=>f.endsWith('.html')).sort();assert.equal(all.length,168);const familyExamples=new Map();for(const file of all){const before=(await readCached(join(BASELINE,file))).toString(),family=(before.match(/<footer\b[^>]*>/)||[])[0];if(!familyExamples.has(family))familyExamples.set(family,file);}
 const files=smoke?[...new Set(['index.html','edificio-bold.html','404.html','410.html',...familyExamples.values()])]:['index.html',...all.filter(f=>f!=='index.html')];report.expectedCases=files.length*5;report.selectedPages=files;report.previousFooterFamilies=familyExamples.size;
 const preservation={};for(const file of all){const before=(await readCached(join(BASELINE,file))).toString(),after=(await readCached(join(staticRoot,file))).toString();assert.equal((before.match(footerPattern)||[]).length,1);assert.equal((after.match(footerPattern)||[]).length,1);assert.equal(replaceFooter(after),replaceFooter(before),'Content outside footer changed: '+file);const mainBefore=before.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||null,mainAfter=after.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||null;assert.equal(mainAfter,mainBefore);preservation[file]={outsideFooterSHA256:hash(replaceFooter(before)),mainSHA256:mainBefore?hash(mainBefore):null,mainByteIdentical:true,outsideFooterByteIdentical:true};}
 report.sourcePreservation={pages:168,outsideFooterByteIdentical:true,mainByteIdentical:true};
 report.existingMotionResources=[];for(const path of ['assets/js/scroll-presence.js','assets/css/sollahms-theme.css','assets/js/image-parallax.js','assets/css/image-parallax.css']){const actual=hash(await readCached(join(staticRoot,path))),expected=hash(await readCached(join(BASELINE,path)));assert.equal(actual,expected,'Existing motion resource changed');report.existingMotionResources.push({path,sha256:actual,byteIdenticalToBaseline:true});}report.existingMotionPreservedByHashes=true;report.motionScope='Homepage reading/edge/reduced-motion at five widths; footer and ancestor opacity checked in every case; other main content and existing motion resources preserved by exact hashes, without new behavioral claims.';
 const references=new Map(),families=new Set();
 await mkdir(join(out,'footers'),{recursive:true});
 async function runPage(file){
  const source=await readCached(join(staticRoot,file)),before=await readCached(join(BASELINE,file)),family=(before.toString().match(/<footer\b[^>]*>/)||[])[0]||'unknown';
  const pageContext=origin==='https://sollahms.cl'&&source.toString().includes('site-measurement.mjs')?await makeContext():context;const page=await pageContext.newPage();await attach(page,file);const response=await page.goto(origin+(file==='index.html'?'/':file==='404.html'?'/__footer-global-not-found-20261119__':file==='410.html'?'/patio-brasil':'/'+file),{waitUntil:'networkidle',timeout:120000});assert.equal(response.status(),file==='404.html'?404:file==='410.html'?410:200);await rejectOptional(page,file);
  for(const width of widths){
   const row={file,width,passed:false,sourceSHA256:hash(source),...preservation[file]};
   try{
    await settleFooter(page,width);const current=await snapshot(page);
    assert.equal(current.viewport,width);assert.deepEqual(current.overflow,[],'Footer overflows viewport');assert.deepEqual(current.emptyContainers,[]);assert.equal(current.footerFades,0);assert(current.semantic.image?.loaded);assert.equal(current.fontsStatus,'loaded');assert(current.opacityChain.every(x=>x.opacity==='1'&&!x.fade),'Footer or ancestor is faded');
    const original=baseline.widths.find(x=>x.width===width);
    if(file==='index.html'){row.originalHomepageComparison=compareSnapshots(current,original,{original:true,width});references.set(width,current);}
    row.comparison=compareSnapshots(current,references.get(width),{width});
    const badHits=current.hitTests.filter(x=>x.inViewport&&!x.hit);assert.deepEqual(badHits,[],'Footer link is covered: '+JSON.stringify(badHits));
    row.links=await checkLinks(page,file);await settleFooter(page,width);
    const shot=join(out,'footers',file.replace(/\.html$/,'')+'-'+width+'.png');await page.locator('footer').screenshot({path:shot,animations:'disabled'});row.screenshot={path:shot,sha256:hash(await readFile(shot))};
    row.footer={width:current.footerRect.width,height:current.footerRect.height,semanticSHA256:hash(JSON.stringify(current.semantic)),footerOpacity:'1',footerOverflow:false,emptyContainers:0,pointerHitTestsPassed:current.hitTests.length,footerNodes:current.allElements.length};
    row.commercialSubmits=await page.evaluate(()=>window.__footerQASubmits);assert.equal(row.commercialSubmits,0);row.passed=true;
   }catch(error){row.error={message:error.message,stack:error.stack};if(!diagnose)throw error;}
   finally{report.cases.push(row);}
  }
  if(file==='index.html'){for(const width of widths){await settleFooter(page,width);report.motion.push({width,family,...await motionSample(page,file)});}}
  await page.waitForLoadState('networkidle',{timeout:30000});await page.close();if(pageContext!==context)await pageContext.close();await saveReport();console.log(JSON.stringify({file,cases:report.cases.length,passed:report.cases.filter(x=>x.passed).length}));
 }
 // The homepage establishes immutable reference snapshots before independent pages run.
 await runPage(files[0]);
 const workers=Number(opt('--workers',mode==='local'?'1':'3'));assert(Number.isInteger(workers)&&workers>=1&&workers<=3);report.pageConcurrency=workers;report.httpMaxConcurrency=4;
 let next=1,firstError=null;
 await Promise.all(Array.from({length:workers},async()=>{while(next<files.length&&!firstError){const file=files[next++];try{await runPage(file);}catch(error){firstError??=error;}}}));
 if(firstError)throw firstError;
 assert.equal(new Set(report.cases.map(c=>c.file+' '+c.width)).size,report.expectedCases,'Every page and viewport must be covered exactly once');
 assert.equal(report.cases.length,report.expectedCases);assert(report.cases.every(c=>c.passed));assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.ownResourceFailures,[]);assert.deepEqual(report.unexpectedConsole,[]);assert.deepEqual(report.blockedMutations,[]);assert.deepEqual(report.blockedMetrics,[]);assert.deepEqual(report.unexpectedExternal,[]);report.passed=true;
}

try{
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking','--disable-component-update','--disable-sync']});
 context=await makeContext();
 if(captureBaseline){
  const page=await context.newPage();await attach(page,'index.html');await page.goto(origin+'/',{waitUntil:'networkidle',timeout:90000});await rejectOptional(page,'index.html');
  const baseline={baselineDeployment:'dpl_GCSXniYKZJdHgNbuW3fNtFqBt9Jn',baselineInventorySHA256:'f11c8fc8f816db5bf104866fc4f8bc439917674a0d210de90edc3cef3733ce1e',capturedAt:new Date().toISOString(),timeZone:'America/Santiago',sourceStatic:BASELINE,homeSha256:hash(await readFile(join(BASELINE,'index.html'))),widths:[],pageErrors:[],networkPolicy:'Local exact baseline bytes only; optional metrics rejected in a fresh ephemeral context; no providers or commercial writes'};
  await mkdir(join(QA,'baseline-home'),{recursive:true});
  for(const width of widths){await settleFooter(page,width);const s=await snapshot(page);const path=join(QA,'baseline-home','home-'+width+'.png');await page.locator('footer').screenshot({path,animations:'disabled'});baseline.widths.push({width,...s,screenshot:resolve(path),screenshotSHA256:hash(await readFile(path))});console.log(JSON.stringify({width,height:s.footerRect.height,footerBackground:s.nodes.footer.style.backgroundColor,logo:s.nodes.image.rect,copyright:s.nodes.copyright.style,links:s.semantic.links.length}));}
  baseline.pageErrors=report.pageErrors;assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.ownResourceFailures,[]);assert.deepEqual(report.unexpectedConsole,[]);assert.deepEqual(report.blockedMutations,[]);assert.deepEqual(report.blockedMetrics,[]);assert.deepEqual(report.unexpectedExternal,[]);baseline.passed=true;
  await writeFile(join(QA,'baseline-home.json'),JSON.stringify(baseline,null,2)+'\n');report.passed=true;await page.close();
 }else await runMatrix();
}catch(error){report.failure={message:error.message,stack:error.stack};process.exitCode=1;console.error(error.message);}
finally{await context?.close();await browser?.close();report.finishedAt=new Date().toISOString();if(!captureBaseline)await saveReport();console.log(JSON.stringify({passed:report.passed,captureBaseline,cases:report.cases.length}));}
