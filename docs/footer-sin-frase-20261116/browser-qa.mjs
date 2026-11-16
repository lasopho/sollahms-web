import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const args=process.argv.slice(2),option=(name,fallback)=>{const at=args.indexOf(name);return at<0?fallback:args[at+1];};
const root=resolve(option('--static','.'));
const baseline=resolve(option('--baseline','/private/tmp/sollahms-centro-audit-20261116/.vercel/centro-production-release-20261116/stage/.vercel/output/static'));
const out=resolve(option('--out','/private/tmp/sollahms-footer-qa-20261116/results'));
const origin=option('--origin','https://sollahms.cl');
const deployment=option('--remote-deployment',option('--deployment',null));
const transportModule=option('--transport',deployment?new URL('../centro-auditoria-20261116/native-transport.mjs',import.meta.url).pathname:null);
const transportRoot=option('--transport-root',new URL('../../.vercel/footer-sin-frase-20261116/remote-transport/',import.meta.url).pathname);
const widths=option('--widths','1440,1024,768,390,320').split(',').map(Number),pages=option('--pages','index.html,proyectos.html').split(',');
const phrase=/precision[\s\p{P}\p{S}]*transparency[\s\p{P}\p{S}]*strategy/iu;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.pdf':'application/pdf'};
await mkdir(out,{recursive:true});
const report={startedAt:new Date().toISOString(),root,baseline,origin,deployment,mode:transportModule?'authenticated remote responses rendered in Chrome':'local exact output bytes rendered in Chrome',widths,pages,cases:[],pageErrors:[],failedResources:[],consoleErrors:[],expectedFixtureConsole:[],fontResources:[],blockedExternal:[],apiFixtures:[],blockedMutations:[],requests:[],passed:false};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
let transport;
if(transportModule){assert(deployment,'--deployment is required with --transport');const {nativeTransport}=await import(resolve(transportModule));transport=await nativeTransport({origin,deployment,root:transportRoot});}
const hash=x=>createHash('sha256').update(x).digest('hex');
const baselineFooters=new Map(),fontCache=new Map();

async function contextFor(directory,remote=false){
 const context=await browser.newContext({reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url());
  if(!['GET','HEAD'].includes(request.method())){report.blockedMutations.push({path:u.pathname,method:request.method()});return route.abort();}
  if(u.origin!==origin){
   if(['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)&&u.protocol==='https:'){
    if(!fontCache.has(u.href))fontCache.set(u.href,(async()=>{const response=await route.fetch({timeout:60000});assert(response.ok(),'Font resource failed '+u.hostname);const body=await response.body();report.fontResources.push({url:u.href,status:response.status(),bytes:body.length,sha256:hash(body),readOnly:true});return {status:response.status(),headers:response.headers(),body};})());
    return route.fulfill(await fontCache.get(u.href));
   }
   report.blockedExternal.push({origin:u.origin,path:u.pathname});return route.abort();
  }
  if(u.pathname.startsWith('/api/')){report.apiFixtures.push(u.pathname);return route.fulfill({status:503,contentType:'application/json',body:'{}'});}
  if(remote)return transport.handle(route);
  const rel=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname),path=resolve(directory,'.'+rel);
  assert(path.startsWith(directory+'/'),'Resource escaped static directory');
  try{const body=await readFile(path);report.requests.push({mode:directory===baseline?'before':'after',path:u.pathname,status:200,bytes:body.length});return route.fulfill({status:200,contentType:types[extname(path)]||'application/octet-stream',body});}
  catch(error){report.failedResources.push({path:u.pathname,mode:directory===baseline?'before':'after',message:error.code});return route.fulfill({status:404,body:'Missing static resource'});}
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

async function validateTargets(snapshot,directory,file){
 const targets=[];
 for(const link of snapshot.links){
  if(!link.href)continue;
  const url=new URL(link.href,new URL('/'+file,origin));
  if(url.origin!==origin){if(url.hostname==='wa.me'){assert.equal(url.pathname,'/56948502440');assert(url.searchParams.get('text')?.trim());targets.push({href:link.href,type:'WhatsApp deep link',validated:true,networkRequestSent:false});}continue;}
  const path=join(directory,decodeURIComponent(url.pathname==='/'?'index.html':url.pathname.slice(1)));
  assert((await stat(path)).isFile(),'Missing footer destination '+url.pathname);
  if(url.hash){const html=await readFile(path,'utf8'),id=decodeURIComponent(url.hash.slice(1));assert(html.includes('id="'+id+'"')||html.includes("id='"+id+"'"),'Missing anchor '+url.href);}
  targets.push({href:link.href,type:'internal static target',validated:true});
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
 for(const mode of ['before','after']){
  const directory=mode==='before'?baseline:root,context=await contextFor(directory,mode==='after'&&!!transport);
  for(const file of pages)for(const width of widths){
   const row={mode,file,width,passed:false},page=await context.newPage();await page.setViewportSize({width,height:1000});
   page.on('pageerror',error=>report.pageErrors.push({mode,file,width,message:error.message}));
   page.on('console',message=>{if(message.type()==='error'){const entry={mode,file,width,message:message.text(),url:message.location().url};if(entry.url&&new URL(entry.url).pathname.startsWith('/api/')&&entry.message.includes('503'))report.expectedFixtureConsole.push(entry);else report.consoleErrors.push(entry);}});
   page.on('requestfailed',request=>report.failedResources.push({mode,file,width,path:new URL(request.url()).pathname,error:request.failure()?.errorText}));
   page.on('response',response=>{if(response.status()>=400&&!new URL(response.url()).pathname.startsWith('/api/'))report.failedResources.push({mode,file,width,path:new URL(response.url()).pathname,status:response.status()});});
   try{
    await page.goto(new URL(file==='index.html'?'/':'/'+file,origin).href,{waitUntil:'networkidle',timeout:90000});
    if(file==='proyectos.html')await page.waitForFunction(()=>document.querySelectorAll('#project-grid > *').length>0,{},{timeout:15000});
    await page.evaluate(()=>document.fonts.ready);await page.locator('footer').scrollIntoViewIfNeeded();await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await page.waitForTimeout(200);
    await page.locator('footer img').evaluateAll(images=>Promise.all(images.map(img=>img.decode().catch(()=>{}))));
    const snapshot=await footerSnapshot(page);row.footer={...snapshot,normalizedHash:hash(snapshot.normalized)};delete row.footer.normalized;
    assert.equal(snapshot.tailwindLoaded,true);assert.notEqual(snapshot.style.background,'rgba(0, 0, 0, 0)');assert.equal(snapshot.documentWidth,width);assert.deepEqual(snapshot.overflow,[]);assert.deepEqual(snapshot.emptyContainers,[]);assert.equal(snapshot.footerFades,0);assert(snapshot.logos.length&&snapshot.logos.every(x=>x.loaded));
    row.targets=await validateTargets(snapshot,directory,file);
    if(mode==='before'){assert.equal(snapshot.phraseCount,1);baselineFooters.set(file+'-'+width,snapshot);}
    else{
     assert.equal(snapshot.phraseCount,0);assert(!phrase.test(await page.locator('body').textContent()));assert.equal(snapshot.footerChildren,1,'The empty slogan wrapper must be removed');
     const old=baselineFooters.get(file+'-'+width);assert.equal(snapshot.normalized,old.normalized,'Footer changed beyond slogan wrapper removal');assert.deepEqual(snapshot.links,old.links);assert.deepEqual(snapshot.logos,old.logos);assert.deepEqual(snapshot.style,old.style);assert.deepEqual(snapshot.grid,old.grid);assert(snapshot.rect.height<old.rect.height,'Slogan-only spacer should disappear');row.heightRemoved=old.rect.height-snapshot.rect.height;
    }
    const screenshot=file.replace('.html','')+'-'+width+'.png';await mkdir(join(out,mode),{recursive:true});await page.locator('footer').screenshot({path:join(out,mode,screenshot)});row.screenshot=mode+'/'+screenshot;
    row.motion=await motionCheck(page);
    if(mode==='after'){
     const whatsapp=page.locator('footer a[href^="https://wa.me/"]').first();
     await whatsapp.evaluate(a=>a.addEventListener('click',event=>{event.preventDefault();window.__footerWhatsappActivated=a.getAttribute('href');},{once:true}));
     await whatsapp.click();assert.equal(await page.evaluate(()=>window.__footerWhatsappActivated),await whatsapp.getAttribute('href'));
     row.whatsapp={pointerActivation:true,validDeepLink:true,externalNavigationPrevented:true,messagesSent:0};
    }
    row.passed=true;
   }catch(error){row.error={message:error.message,stack:error.stack};throw error;}
   finally{report.cases.push(row);await writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');await page.close();}
   console.log(JSON.stringify({mode,file,width,passed:row.passed}));
  }
  await context.close();
 }
 assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.failedResources,[]);assert.deepEqual(report.consoleErrors,[]);assert.deepEqual(report.blockedMutations,[]);assert.deepEqual(report.blockedExternal,[]);report.passed=true;
}catch(error){report.failure={message:error.message,stack:error.stack};process.exitCode=1;}
finally{await browser.close();await transport?.close();report.finishedAt=new Date().toISOString();await writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,errors:report.pageErrors.length,failedResources:report.failedResources.length,output:join(out,'results.json')}));}
