import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const args=process.argv.slice(2),option=(name,fallback)=>{const at=args.indexOf(name);return at<0?fallback:args[at+1];};
const isolated=args.includes('--isolated'),publicMode=args.includes('--public');
assert(isolated!==publicMode,'Choose exactly one of --isolated or --public');
const phase=isolated?'isolated':'public',root=resolve(new URL('../../../../',import.meta.url).pathname);
const docs=join(root,'docs/footer-sin-frase-20261116'),out=resolve(option('--out',new URL('./'+phase+'/',import.meta.url).pathname));
const baseline=resolve(option('--baseline','/private/tmp/sollahms-centro-audit-20261116/.vercel/centro-production-release-20261116/stage/.vercel/output/static'));
const origin=option('--origin',null),deployment=option('--deployment',null);
assert(/^dpl_[A-Za-z0-9]+$/.test(deployment||''),'Exact newly created Production --deployment ID is required');
assert(!['dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR','dpl_8Jtg46E1zuPUUd1fhEdcKTu6GUAF','dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w','dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5','dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN','dpl_33R4uenGQAt2cSVUGEJC7VsoF9yS'].includes(deployment),'Prior baseline/Preview deployment cannot be mistaken for new Production');
if(publicMode)assert.equal(origin,'https://sollahms.cl','Public phase must use canonical HTTPS origin');
else{const u=new URL(origin);assert(u.protocol==='https:'&&u.origin===origin&&u.hostname.endsWith('.vercel.app'),'Isolated phase requires exact immutable HTTPS Vercel origin');}
const transportRoot=resolve(option('--transport-root',join(root,'.vercel/footer-sin-frase-20261116/production-browser/'+phase)));
const widths=[1440,1024,768,390,320],pages=['index.html','proyectos.html'];
const phrase=/precision[\s\p{P}\p{S}]*transparency[\s\p{P}\p{S}]*strategy/iu;
const hash=x=>createHash('sha256').update(x).digest('hex');
const certificatePath=join(docs,'local/results.json'),certificateBody=await readFile(certificatePath),certificate=JSON.parse(certificateBody);
assert.equal(hash(certificateBody),'06bf13c1d44bfa50a71cc8fe9bb6b8e8e53ca03afb3b5211ae1fca5ed959734f','Local baseline certificate changed');
assert(certificate.passed&&certificate.cases.length===20&&certificate.cases.every(c=>c.passed),'Completed local baseline matrix is required');
const manifest=JSON.parse(await readFile(join(docs,'candidate-manifest.json'),'utf8'));
assert.equal(manifest.baselineDeployment,'dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR');
assert.equal(manifest.outputInventorySha256,'aabc92d6a5c7c8d345d9a3cc7dd4f45a7fd11c8385c752ddf45e5a2d0f649549');
const expectedFooters=new Map(),baselineFooters=new Map(),fontCache=new Map(),targetCache=new Map();
const extractFooter=html=>{const matches=html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi);assert.equal(matches?.length,1,'Exactly one footer is required');return matches[0];};
const sloganWrapper='<div class="max-w-7xl mx-auto px-8 mt-16 pt-8 border-t border-slate-200">\n<p class="text-[10px] text-slate-400 font-mono tracking-widest text-center">PRECISION • TRANSPARENCY • STRATEGY</p>\n</div>\n';
for(const file of pages){
 const change=manifest.changes.find(c=>c.path==='static/'+file);assert(change);
 const baselineBody=await readFile(join(baseline,file)),sourceBody=await readFile(join(root,file));
 assert.equal(hash(baselineBody),change.before.sha256,'HWs baseline bytes changed: '+file);
 assert.equal(hash(sourceBody),change.after.sha256,'Certified candidate source changed: '+file);
 const oldFooter=extractFooter(baselineBody.toString()),sourceFooter=extractFooter(sourceBody.toString());
 assert(oldFooter.includes(sloganWrapper),'Exact exclusive slogan wrapper absent from baseline');
 assert.equal(sourceFooter,oldFooter.replace(sloganWrapper,''),'Candidate changed footer beyond exclusive slogan wrapper');
 expectedFooters.set(file,sourceFooter);
 for(const width of widths){const before=certificate.cases.find(c=>c.mode==='before'&&c.file===file&&c.width===width),after=certificate.cases.find(c=>c.mode==='after'&&c.file===file&&c.width===width);assert(before&&after);assert.equal(before.footer.normalizedHash,after.footer.normalizedHash);baselineFooters.set(file+'-'+width,{before:before.footer,after:after.footer});}
}
await mkdir(out,{recursive:true});
const report={startedAt:new Date().toISOString(),phase,origin,deployment,mode:isolated?'Authenticated real isolated Production responses via Vercel CLI; no local static fulfillment':'Real public HTTPS Chrome responses with certificate verification; no local static fulfillment',baselineDeployment:manifest.baselineDeployment,candidateInventorySha256:manifest.outputInventorySha256,localCertificateSha256:hash(certificateBody),baselineChromeReplayed:false,widths,pages,cases:[],pageErrors:[],failedResources:[],consoleErrors:[],expectedFixtureConsole:[],fontResources:[],administrativeToolbarSuppressed:[],blockedExternal:[],apiFixtures:[],blockedAPIs:[],blockedMutations:[],requests:[],targets:[],passed:false};
let browser,transport,context;
async function createContext(){
 const context=await browser.newContext({reducedMotion:'reduce',serviceWorkers:'block',ignoreHTTPSErrors:false});
 await context.addInitScript(()=>{window.__footerQACommercialSubmits=0;document.addEventListener('submit',event=>{window.__footerQACommercialSubmits++;event.preventDefault();event.stopImmediatePropagation();},true);});
 await context.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url());
  if(!['GET','HEAD'].includes(request.method())){report.blockedMutations.push({path:u.pathname,method:request.method()});return route.abort();}
  if(u.origin==='https://vercel.live'&&u.pathname==='/_next-live/feedback/feedback.js'){
   report.administrativeToolbarSuppressed.push({path:u.pathname,reason:'Exact administrative deployment toolbar excluded from site QA; no platform setting changed'});
   return route.fulfill({status:204,contentType:'text/javascript',body:''});
  }
  if(u.origin!==origin){
   if(['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)&&u.protocol==='https:'){
    if(!fontCache.has(u.href))fontCache.set(u.href,(async()=>{const response=await route.fetch({timeout:60000});assert(response.ok(),'Font resource failed '+u.hostname);const body=await response.body();report.fontResources.push({url:u.href,status:response.status(),bytes:body.length,sha256:hash(body),readOnly:true,tlsVerification:true});return {status:response.status(),headers:response.headers(),body};})());
    return route.fulfill(await fontCache.get(u.href));
   }
   report.blockedExternal.push({origin:u.origin,path:u.pathname});return route.abort();
  }
  if(u.pathname==='/api/uf'){report.apiFixtures.push({path:u.pathname,status:503,reason:'Explicit unavailable UF fixture; no real API/provider request'});return route.fulfill({status:503,contentType:'application/json',body:'{}'});}
  if(u.pathname.startsWith('/api/')){report.blockedAPIs.push(u.pathname);return route.abort();}
  return isolated?transport.handle(route):route.continue();
 });
 return context;
}
async function footerSnapshot(page){
 return page.locator('footer').evaluate(footer=>{
  const phrase=/precision[\s\p{P}\p{S}]*transparency[\s\p{P}\p{S}]*strategy/iu;
  const clone=footer.cloneNode(true);
  const matches=[...clone.querySelectorAll('*')].filter(e=>phrase.test(e.textContent)&&![...e.children].some(c=>phrase.test(c.textContent)));
  for(const e of matches){const parent=e.parentElement;e.remove();if(parent!==clone&&!parent.textContent.trim()&&!parent.querySelector('img,svg,a,button,input'))parent.remove();}
  const normalized=clone.outerHTML.replace(/>\s+</g,'><').replace(/\s+/g,' ').trim();
  const rect=footer.getBoundingClientRect(),style=getComputedStyle(footer),grid=footer.firstElementChild.getBoundingClientRect();
  const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  const overflow=[footer,...footer.querySelectorAll('*')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.trim().slice(0,80)}));
  const emptyContainers=[...footer.querySelectorAll('div,p,ul,li,address')].filter(e=>!e.textContent.trim()&&!e.querySelector('img,svg,video,canvas,input,button')).map(e=>({tag:e.tagName,cls:e.className}));
  const links=[...footer.querySelectorAll('a')].map(a=>({href:a.getAttribute('href'),text:(a.getAttribute('aria-label')||a.textContent).trim(),target:a.getAttribute('target'),rel:a.getAttribute('rel')}));
  const logos=[...footer.querySelectorAll('img')].map(e=>({src:e.getAttribute('src'),alt:e.getAttribute('alt'),width:e.getAttribute('width'),height:e.getAttribute('height'),loaded:e.complete&&e.naturalWidth>0}));
  return {normalized,phraseCount:matches.length,text:clone.textContent.replace(/\s+/g,' ').trim(),links,logos,overflow,emptyContainers,footerChildren:footer.children.length,footerFades:footer.querySelectorAll('.s-scroll-presence').length,rect:{width:rect.width,height:rect.height},grid:{left:grid.left,right:grid.right,width:grid.width},style:{paddingTop:style.paddingTop,paddingBottom:style.paddingBottom,background:style.backgroundColor,fontFamily:style.fontFamily},documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,tailwindLoaded:[...document.styleSheets].some(x=>x.href?.includes('index.tailwind.css')),fontsLoaded:document.fonts.status};
 });
}

async function validateTargets(snapshot,context,file){
 const targets=[];
 for(const link of snapshot.links){
  if(!link.href)continue;
  const url=new URL(link.href,new URL(file==='index.html'?'/':'/'+file,origin));
  if(url.origin!==origin){if(url.hostname==='wa.me'){assert.equal(url.pathname,'/56948502440');assert(url.searchParams.get('text')?.trim());targets.push({href:link.href,type:'WhatsApp deep link',validated:true,networkRequestSent:false});}continue;}
  assert(!url.pathname.startsWith('/api/'),'Footer destination must be static');
  const key=url.origin+url.pathname+url.search;
  if(!targetCache.has(key))targetCache.set(key,(async()=>{
   let body,status;
   if(isolated){const response=await transport.readOnlyGet(url.pathname+url.search);body=response.body;status=response.status;}
   else{const response=await context.request.get(key,{timeout:90000,failOnStatusCode:false,maxRedirects:0,ignoreHTTPSErrors:false});body=await response.body();status=response.status();}
   assert.equal(status,200,'Delivered footer destination failed '+key);
   const value={url:key,status,bytes:body.length,sha256:hash(body),source:isolated?'authenticated exact deployment GET':'public HTTPS GET with TLS verification'};report.targets.push(value);return {...value,body};
  })());
  const response=await targetCache.get(key);
  if(url.hash){const html=response.body.toString(),id=decodeURIComponent(url.hash.slice(1));assert(html.includes('id="'+id+'"')||html.includes("id='"+id+"'"),'Missing delivered footer anchor '+url.href);}
  targets.push({href:link.href,type:'delivered internal static target',validated:true,status:response.status});
 }
 return targets;
}

async function motionCheck(page){
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.waitForFunction(()=>document.querySelectorAll('main .s-scroll-presence').length>0,{},{timeout:5000});
 const selector=await page.locator('main .catalog-card.s-scroll-presence').count()?'main .catalog-card.s-scroll-presence':'main .s-scroll-presence';
 const candidates=await page.locator(selector).evaluateAll(nodes=>nodes.map((e,index)=>{const r=e.getBoundingClientRect();return {index,top:r.top+scrollY,height:r.height};}).filter(x=>x.top>800&&x.top<document.documentElement.scrollHeight-1200&&x.height>5&&x.height<800));
 assert(candidates.length,'No measurable editorial fade group');
 const chosen=candidates[Math.floor(candidates.length/2)],probe=await page.locator(selector).nth(chosen.index).elementHandle();
 assert(probe,'Editorial fade node disappeared');
 async function sample(position){
  // Keep the actual node through recollection and lazy-image loads. Recalculate its
  // geometry after scrolling instead of reusing an index or stale document Y.
  for(let attempt=0;attempt<5;attempt++){
   await probe.evaluate((e,position)=>{
    const r=e.getBoundingClientRect();
    const fixed=[...document.querySelectorAll('header,nav')].filter(n=>['fixed','sticky'].includes(getComputedStyle(n).position)).map(n=>n.getBoundingClientRect()).filter(r=>r.top<=1&&r.height<innerHeight/2);
    const inset=Math.max(0,...fixed.map(r=>r.bottom));
    const target=position==='reading'?innerHeight/2:inset+20;
    const point=position==='reading'?r.top+r.height/2:r.bottom;
    scrollTo({top:scrollY+point-target,behavior:'instant'});
   },position);
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const state=await probe.evaluate((e,position)=>{
    const r=e.getBoundingClientRect(),fixed=[...document.querySelectorAll('header,nav')].filter(n=>['fixed','sticky'].includes(getComputedStyle(n).position)).map(n=>n.getBoundingClientRect()).filter(r=>r.top<=1&&r.height<innerHeight/2);
    const inset=Math.max(0,...fixed.map(r=>r.bottom)),target=position==='reading'?innerHeight/2:inset+20,point=position==='reading'?r.top+r.height/2:r.bottom;
    return {opacity:Number(getComputedStyle(e).opacity),presence:e.style.getPropertyValue('--s-presence'),rect:r.toJSON(),target,point,positionError:Math.abs(point-target),scrollY,active:document.activeElement.tagName,tag:e.tagName,cls:e.className,text:e.textContent.trim().slice(0,100),groupRegistered:e.classList.contains('s-scroll-presence')};
   },position);
   if(state.positionError<2&&state.groupRegistered&&((position==='reading'&&state.opacity>.95)||(position==='edge'&&state.opacity<.9)))return state;
   await page.waitForTimeout(100);
  }
  throw new Error('Fade geometry/opacity did not settle: '+position+' '+JSON.stringify(await probe.evaluate(e=>({opacity:getComputedStyle(e).opacity,presence:e.style.getPropertyValue('--s-presence'),rect:e.getBoundingClientRect().toJSON(),scrollY,cls:e.className}))));
 }
 const readingState=await sample('reading'),edgeState=await sample('edge');
 assert(readingState.opacity>.95,'Reading opacity should be full');assert(edgeState.opacity<readingState.opacity,'Fade should change near viewport edge');
 assert.equal(await page.locator('footer .s-scroll-presence').count(),0);
 assert.equal(await page.locator('.s-scroll-presence .s-scroll-presence').count(),0);
 await probe.dispose();
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);assert.equal(await page.locator('.s-scroll-presence').count(),0);
 return {readingOpacity:readingState.opacity,edgeOpacity:edgeState.opacity,readingState,edgeState,footerStatic:true,noNestedFades:true,reducedMotionVisible:true};
}
try{
 if(isolated){const {nativeTransport}=await import('../../../centro-auditoria-20261116/native-transport.mjs');transport=await nativeTransport({origin,deployment,root:transportRoot});}
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 context=await createContext();
 for(const file of pages)for(const width of widths){
  const row={phase,mode:'after',file,width,passed:false},page=await context.newPage();await page.setViewportSize({width,height:1000});
  page.on('pageerror',error=>report.pageErrors.push({file,width,message:error.message}));
  page.on('console',message=>{if(message.type()==='error'){const entry={file,width,message:message.text(),url:message.location().url};if(entry.url===origin+'/api/uf'&&entry.message.includes('503'))report.expectedFixtureConsole.push(entry);else report.consoleErrors.push(entry);}});
  page.on('requestfailed',request=>report.failedResources.push({file,width,url:request.url(),error:request.failure()?.errorText}));
  page.on('response',response=>{const url=new URL(response.url());if(url.origin===origin&&!url.pathname.startsWith('/api/'))report.requests.push({file,width,url:response.url(),status:response.status(),source:isolated?'authenticated deployment response':'real public Chrome HTTPS response'});if(response.status()>=400&&response.url()!==origin+'/api/uf')report.failedResources.push({file,width,url:response.url(),status:response.status()});});
  try{
   const response=await page.goto(new URL(file==='index.html'?'/':'/'+file,origin).href,{waitUntil:'networkidle',timeout:120000});assert.equal(response.status(),200,'Application HTML must be delivered');
   const htmlBody=await response.body(),footerRaw=extractFooter(htmlBody.toString());
   assert.equal(footerRaw,expectedFooters.get(file),'Delivered footer bytes differ from exact certified candidate');
   row.delivered={url:response.url(),status:response.status(),htmlSha256:hash(htmlBody),footerSha256:hash(footerRaw),footerBytesExactlyCertified:true,htmlBytes:htmlBody.length};
   if(publicMode){const tls=await response.securityDetails();assert(tls&&/^TLS/.test(tls.protocol),'Public navigation must have verified HTTPS security details');row.delivered.tls={...tls,certificateVerificationEnabled:true};}
   if(file==='proyectos.html')await page.waitForFunction(()=>document.querySelectorAll('#project-grid > *').length>0,{},{timeout:15000});
   await page.evaluate(()=>document.fonts.ready);await page.locator('footer').scrollIntoViewIfNeeded();await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(200);
   await page.locator('footer img').evaluateAll(images=>Promise.all(images.map(img=>img.decode().catch(()=>{}))));
   const snapshot=await footerSnapshot(page);row.footer={...snapshot,normalizedHash:hash(snapshot.normalized)};delete row.footer.normalized;
   assert.equal(snapshot.tailwindLoaded,true);assert.equal(snapshot.fontsLoaded,'loaded');assert.notEqual(snapshot.style.background,'rgba(0, 0, 0, 0)');assert.equal(snapshot.documentWidth,width);assert.deepEqual(snapshot.overflow,[]);assert.deepEqual(snapshot.emptyContainers,[]);assert.equal(snapshot.footerFades,0);assert(snapshot.logos.length&&snapshot.logos.every(x=>x.loaded));
   const old=baselineFooters.get(file+'-'+width);
   assert.equal(snapshot.phraseCount,0);assert(!phrase.test(await page.locator('body').textContent()));assert.equal(snapshot.footerChildren,1,'Empty slogan wrapper must be removed');
   assert.equal(hash(snapshot.normalized),old.before.normalizedHash,'Footer DOM differs from HWs baseline minus exclusive slogan wrapper');
   assert.deepEqual(snapshot.links,old.before.links);assert.deepEqual(snapshot.logos,old.before.logos);assert.deepEqual(snapshot.style,old.before.style);assert.deepEqual(snapshot.grid,old.before.grid);assert(snapshot.rect.height<old.before.rect.height,'Slogan-only spacer must disappear');assert.deepEqual(snapshot.rect,old.after.rect,'Delivered footer dimensions differ from certified candidate');row.heightRemoved=old.before.rect.height-snapshot.rect.height;
   row.targets=await validateTargets(snapshot,context,file);
   await mkdir(join(out,'after'),{recursive:true});const screenshot=file.replace('.html','')+'-'+width+'.png';await page.locator('footer').screenshot({path:join(out,'after',screenshot)});row.screenshot='after/'+screenshot;
   row.motion=await motionCheck(page);
   const whatsapp=page.locator('footer a[href^="https://wa.me/"]').first();
   await whatsapp.evaluate(a=>a.addEventListener('click',event=>{event.preventDefault();window.__footerWhatsappActivated=a.getAttribute('href');},{once:true}));
   await whatsapp.click();assert.equal(await page.evaluate(()=>window.__footerWhatsappActivated),await whatsapp.getAttribute('href'));
   row.whatsapp={pointerActivation:true,validDeepLink:true,externalNavigationPrevented:true,messagesSent:0};
   row.commercialSubmits=await page.evaluate(()=>window.__footerQACommercialSubmits);assert.equal(row.commercialSubmits,0);
   row.passed=true;
  }catch(error){row.error={message:error.message,stack:error.stack};throw error;}
  finally{report.cases.push(row);await writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');await page.close();}
  console.log(JSON.stringify({phase,file,width,passed:row.passed}));
 }
 assert.equal(report.cases.length,10);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.failedResources,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.blockedMutations,[]);assert.deepEqual(report.blockedAPIs,[]);assert.deepEqual(report.blockedExternal,[]);report.passed=true;
}catch(error){report.failure={message:error.message,stack:error.stack};process.exitCode=1;}
finally{await context?.close();await browser?.close();await transport?.close();report.finishedAt=new Date().toISOString();await writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({phase,deployment,passed:report.passed,cases:report.cases.length,errors:report.pageErrors.length,failedResources:report.failedResources.length,output:join(out,'results.json')}));}
