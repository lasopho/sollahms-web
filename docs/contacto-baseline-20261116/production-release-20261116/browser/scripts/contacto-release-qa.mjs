import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {nativeTransport} from './native-transport.mjs';
import {managedPids} from './managed-process.mjs';
const REPO='/private/tmp/sollahms-contacto-baseline-20261116';
const BASE=resolve(REPO,'docs/contacto-baseline-20261116/production-release-20261116/browser');
const RUNTIME_BASE=resolve(REPO,'.vercel/contacto-production-release-20261116/browser');
const stageArg=process.argv.indexOf('--phase');
const stage=stageArg>=0?process.argv[stageArg+1]:null;
assert(['isolated','public'].includes(stage),'Explicit --phase isolated or public required');
const DOCS=join(BASE,stage),RUNTIME=join(RUNTIME_BASE,stage);
const target=JSON.parse(await readFile(join(RUNTIME_BASE,'target-'+stage+'.json'),'utf8'));
assert(target.productionReadyConfirmedByRoot&&target.deployment&&target.origin,'Await exact new Production ID and READY confirmation from root');
assert.equal(target.projectId,'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH');
assert.equal(target.target,'production');
assert(/^dpl_[A-Za-z0-9]+$/.test(target.deployment));
assert(!['dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5','dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN','dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh'].includes(target.deployment),'Historical deployments cannot be tested as the new Production');
const origin=new URL(target.origin);assert.equal(origin.protocol,'https:');assert.equal(origin.origin,target.origin);
if(stage==='isolated')assert(origin.hostname.endsWith('.vercel.app'),'Isolated Production requires its exact deployment URL');
if(stage==='public'){
 assert(target.promotionConfirmedByRoot,'Await root confirmation of promotion');
 assert(['https://sollahms.cl','https://www.sollahms.cl'].includes(target.origin),'Exact public Sollahms origin required');
 const prior=JSON.parse(await readFile(join(BASE,'isolated/results.json'),'utf8'));
 assert(prior.passed&&prior.deployment===target.deployment,'Public QA requires PASS isolated QA for this same ID');
}
const manifest=JSON.parse(await readFile(join(REPO,'docs/contacto-baseline-20261116/candidate-manifest.json'),'utf8'));
assert.equal(manifest.outputInventorySha256,'de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0');
assert.equal(manifest.files,1660);assert.equal(manifest.changedFiles,1);assert.equal(manifest.identicalFiles,1659);
const source=await readFile(join(REPO,'contacto.html')),sourceHash=createHash('sha256').update(source).digest('hex');
assert.equal(sourceHash,'02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1');assert.equal(source.length,18655);
const contract=JSON.parse(await readFile(join(REPO,'docs/contacto-baseline-20261116/contacto-source-contract.json'),'utf8'));
assert(Object.values(contract.unchangedContracts).every(Boolean));
await mkdir(DOCS,{recursive:true});await mkdir(join(DOCS,'screenshots'),{recursive:true});await mkdir(join(RUNTIME,'profiles'),{recursive:true});await mkdir(join(RUNTIME,'tmp'),{recursive:true});
const scrub=s=>String(s).replace(/https?:\/\/[^\s"'<>]+/g,v=>{try{const u=new URL(v);return u.origin+u.pathname;}catch{return '[URL]';}}).replace(/\b\d[\d.]{5,}-[\dkK]\b/g,'[REDACTED_RUT]').replace(/\b[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g,'[REDACTED_TOKEN]');
const report={stage,deployment:target.deployment,origin:target.origin,candidateInventorySha256:manifest.outputInventorySha256,sourceContactoSha256:sourceHash,sourceContactoBytes:source.length,widths:[1440,1024,768,390,320],cases:[],navigation:[],console:[],pageErrors:[],resourceFailures:[],blockedExternal:[],blockedUnsafe:[],blockedApi:[],transportErrors:[],formSubmitEvents:0,actualCommercialRequests:0,historicalCacheReuse:0,profileRemoved:false,startedAt:new Date().toISOString()};
const checkpoint=()=>writeFile(join(DOCS,'results.json'),JSON.stringify(report,null,2)+'\n');
let currentWidth=null,stopped=false,context=null,profile=null,transport=null,page=null;
async function phase(name,fn,ms=15000){let timer;await writeFile(join(RUNTIME,'phase.json'),JSON.stringify({stage,deployment:target.deployment,width:currentWidth,phase:name,startedAt:new Date().toISOString(),timeoutMs:ms})+'\n');try{return await Promise.race([fn(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('QA_PHASE_TIMEOUT '+name)),ms);})]);}finally{clearTimeout(timer);}}
async function publicGet(path){
 const url=new URL(path,target.origin);assert.equal(url.origin,target.origin);assert(!url.pathname.startsWith('/api/'));
 const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)});
 const body=Buffer.from(await response.arrayBuffer());
 return {status:response.status,body,bytes:body.length,sha256:createHash('sha256').update(body).digest('hex'),csp:response.headers.get('content-security-policy')};
}
async function readOnlyGet(path){return stage==='isolated'?transport.readOnlyGet(path):publicGet(path);}
const stop=()=>{stopped=true;void context?.close();void transport?.close();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
await writeFile(join(RUNTIME,'pid.json'),JSON.stringify({pid:process.pid,state:'running',stage,deployment:target.deployment})+'\n');
const blockedTooling=new Set();
try{
 if(stage==='isolated')transport=await nativeTransport({origin:target.origin,root:RUNTIME,deployment:target.deployment});
 const access=await phase('exact-contacto-source',()=>readOnlyGet('/contacto.html'),65000);assert.equal(access.status,200);
 assert(access.body.subarray(0,source.length).equals(source),'Served Contacto differs from approved source');
 const suffix=access.body.subarray(source.length),suffixHash=createHash('sha256').update(suffix).digest('hex');
 assert(suffix.length===0||(suffix.length===163&&suffixHash==='8ce47ba7bb69eeb6aafc383d550c6789d0c272a44631a06b0b38ea4140fbd8cc'),'Unknown platform HTML suffix');
 const csp=stage==='isolated'?access.headers['content-security-policy']:access.csp;assert(csp,'CSP must remain present');
 report.access={status:access.status,bytes:access.bytes,sha256:access.sha256,sourcePrefixIdentical:true,platformSuffixBytes:suffix.length,platformSuffixSha256:suffix.length?suffixHash:null,cspPresent:true,authenticatedCli:stage==='isolated',publicDirectHttps:stage==='public'};
 const {chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
 profile=await mkdtemp(join(RUNTIME,'profiles','contacto-'));
 context=await phase('launchChrome',()=>chromium.launchPersistentContext(profile,{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,handleSIGINT:false,handleSIGTERM:false,viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block',env:{PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:join(RUNTIME,'tmp')+'/',LANG:'en_US.UTF-8'},args:['--disable-features=BackForwardCache','--disable-background-timer-throttling','--disable-renderer-backgrounding']}),45000);
 report.browser=context.browser().version();report.node=process.version;
 await context.addInitScript(()=>{window.__qaSubmits=0;document.addEventListener('submit',e=>{window.__qaSubmits++;e.preventDefault();e.stopImmediatePropagation();},true);});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());if(!['http:','https:'].includes(url.protocol))return route.continue();
  const safe={origin:url.origin,path:url.pathname,method:req.method()};
  if(!['GET','HEAD'].includes(req.method())){report.blockedUnsafe.push({...safe,width:currentWidth});return route.abort().catch(()=>{});}
  if(url.origin!==target.origin){const tooling=url.origin==='https://vercel.live'&&url.pathname==='/_next-live/feedback/feedback.js';report.blockedExternal.push({...safe,width:currentWidth,tooling});if(tooling)blockedTooling.add(url.origin+url.pathname);return route.abort().catch(()=>{});}
  if(url.pathname.startsWith('/api/')){report.blockedApi.push({...safe,width:currentWidth});return route.abort().catch(()=>{});}
  if(stage==='public')return route.continue();
  try{return await transport.handle(route);}catch{report.transportErrors.push({...safe,width:currentWidth});return route.abort('failed').catch(()=>{});}
 });
 page=context.pages()[0]||await context.newPage();page.setDefaultTimeout(12000);
 page.on('console',m=>{if(['error','warning'].includes(m.type())){const u=scrub(m.location()?.url||'');report.console.push({width:currentWidth,type:m.type(),url:u,text:scrub(m.text()),intentionalTooling:blockedTooling.has(u)});}});
 page.on('pageerror',e=>report.pageErrors.push({width:currentWidth,message:scrub(e.message)}));
 page.on('requestfailed',r=>{const u=new URL(r.url());report.resourceFailures.push({width:currentWidth,kind:'requestfailed',url:u.origin+u.pathname,error:scrub(r.failure()?.errorText||''),intentionalTooling:blockedTooling.has(u.origin+u.pathname)});});
 page.on('response',r=>{if(r.status()>=400){const u=new URL(r.url());report.resourceFailures.push({width:currentWidth,kind:'http',url:u.origin+u.pathname,status:r.status(),intentionalTooling:blockedTooling.has(u.origin+u.pathname)});}});
 for(const width of report.widths){
  if(stopped)break;currentWidth=width;const row={width,status:'RUNNING'};
  try{
   await phase('viewport',()=>page.setViewportSize({width,height:1000}));await phase('front',()=>page.bringToFront());
   const response=await phase('DOMContentLoaded',()=>page.goto(target.origin+'/contacto.html',{waitUntil:'domcontentloaded',timeout:90000}),95000);assert.equal(response.status(),200);
   await phase('advisory-ready',()=>page.waitForFunction(()=>document.querySelector('#advisory-fields')?.disabled===false,{},{timeout:30000}),32000);
   await phase('fonts',()=>page.evaluate(()=>document.fonts.ready),10000);
   await phase('network-settle',()=>page.waitForLoadState('networkidle',{timeout:15000}),17000);
   await phase('front-paint',()=>page.bringToFront());await new Promise(r=>setTimeout(r,150));

   row.layout=await phase('metrics',()=>page.evaluate(()=>{
    const visible=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
    const bounds=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,width:b.width,height:b.height};};
    const fields=['nombre','rut','correo','telefono'].map(name=>{const e=document.querySelector('#advisory-form [name="'+name+'"]');return {name,required:e.required,enabled:!e.matches(':disabled'),visible:visible(e),empty:e.value==='',...bounds(e),opacity:getComputedStyle(e).opacity};});
    const select=document.getElementById('advisory-goal'),cs=getComputedStyle(select),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=cs.font;
    const header=document.querySelector('header'),footer=document.getElementById('contact-footer'),grid=footer.querySelector('.contact-footer__columns');
    const offscreen=[...document.querySelectorAll('header a,header button,header img,main input:not([type=hidden]):not([name=website]),main select,main textarea,footer a,footer img')].filter(visible).filter(e=>{const b=e.getBoundingClientRect();return b.left< -1||b.right>innerWidth+1;}).map(e=>({tag:e.tagName,id:e.id,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}));
    return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,header:bounds(header),footer:bounds(footer),footerColumns:getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length,fields,offscreen,select:{...bounds(select),fontSize:cs.fontSize,appearance:cs.appearance,opacity:cs.opacity,transform:cs.transform,paddingLeft:cs.paddingLeft,paddingRight:cs.paddingRight,textWidth:ctx.measureText(select.options[0].text).width,availableTextWidth:select.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-(cs.appearance==='none'?0:24)},consent:{required:document.getElementById('advisory-consent').required,checked:document.getElementById('advisory-consent').checked,visible:visible(document.getElementById('advisory-consent'))},footerEmailCount:footer.querySelectorAll('a[href="mailto:contacto@sollahms.cl"]').length,footerWhatsapp:[...footer.querySelectorAll('a[href*="wa.me/"]')].map(a=>a.getAttribute('href')),headerLinks:[...header.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),internalLinks:[...new Set([...document.querySelectorAll('header a[href],footer a[href]')].map(a=>a.getAttribute('href')).filter(h=>h.startsWith('/')))],brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src'))};
   }));
   assert(row.layout.scrollWidth<=width+1);assert.equal(row.layout.offscreen.length,0);assert(row.layout.fields.every(f=>f.required&&f.enabled&&f.visible&&f.empty&&f.opacity==='1'));assert.equal(row.layout.footerColumns,width>=768?3:1);assert.equal(row.layout.footerEmailCount,1);assert.deepEqual(row.layout.footerWhatsapp,['https://wa.me/56948502440']);assert(row.layout.consent.required&&!row.layout.consent.checked&&row.layout.consent.visible);assert(row.layout.select.textWidth<=row.layout.select.availableTextWidth+1);assert.equal(row.layout.select.opacity,'1');assert.equal(row.layout.select.transform,'none');
   if(width===320){assert.equal(row.layout.select.appearance,'auto');assert.equal(row.layout.select.fontSize,'14px');}
   for(const href of ['/#expertise','/proyectos.html','/guia-hipotecaria.html','/contacto.html'])assert(row.layout.headerLinks.includes(href));
   await phase('image-decode',()=>page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));}));assert.equal(await page.locator('img').evaluateAll(els=>els.filter(i=>!i.naturalWidth).length),0);
   await phase('full-screenshot',()=>page.screenshot({path:join(DOCS,'screenshots','contacto-'+width+'.png'),fullPage:true,timeout:12000}),14000);
   await phase('footer-screenshot',()=>page.locator('#contact-footer').screenshot({path:join(DOCS,'screenshots','footer-'+width+'.png'),timeout:12000}),14000);
   await phase('selector-screenshot',()=>page.locator('#advisory-goal').screenshot({path:join(DOCS,'screenshots','selector-'+width+'.png'),timeout:12000}),14000);
   console.log(JSON.stringify({phase:'captures-ready',width,full:join(DOCS,'screenshots','contacto-'+width+'.png'),footer:join(DOCS,'screenshots','footer-'+width+'.png'),selector:join(DOCS,'screenshots','selector-'+width+'.png')}));
   const menu=page.locator('button[aria-controls="mobile-menu"]');row.mobileMenu={visible:await menu.isVisible()};
   if(row.mobileMenu.visible){await phase('menu-open',()=>menu.click());assert.equal(await menu.getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');assert(await menu.evaluate(e=>e===document.activeElement));row.mobileMenu.opensClosesEscapeRestoresFocus=true;}
   const select=page.locator('#advisory-goal');await select.focus();const initial=await select.inputValue();
   const active=()=>page.evaluate(()=>{const e=document.activeElement;return {tag:e?.tagName,id:e?.id,role:e?.getAttribute('role'),text:(e?.textContent||'').trim().slice(0,100)};});
   row.keyboard={method:'native letter typeahead and Tab',focusBefore:await active(),documentHasFocus:await page.evaluate(()=>document.hasFocus()),notCertifiedKeys:['ArrowDown','Home']};
   await page.keyboard.press('d');row.keyboard.letterSelectsExpected=(await select.inputValue())==='diversificar';assert(row.keyboard.letterSelectsExpected);
   await page.keyboard.press('Tab');row.keyboard.firstTab=await active();assert.equal(row.keyboard.firstTab.tag,'SUMMARY');assert.match(row.keyboard.firstTab.text,/Agregar un mensaje/i);
   await page.keyboard.press('Tab');row.keyboard.secondTab=await active();assert.equal(row.keyboard.secondTab.id,'advisory-consent');
   await page.keyboard.press('Shift+Tab');await page.keyboard.press('Shift+Tab');assert(await select.evaluate(e=>e===document.activeElement));row.keyboard.shiftTabRestoresSelect=true;
   await select.selectOption(initial);assert.equal(await select.inputValue(),initial);row.keyboard.restoredInitial=true;row.keyboard.restorationMethod='selectOption initial empty option';
   row.emptyReportValidity=await phase('empty-validity',()=>page.locator('#advisory-form').evaluate(f=>f.reportValidity()));assert.equal(row.emptyReportValidity,false);
   const rut=page.locator('#advisory-rut'),name=page.locator('#advisory-name'),consent=page.locator('#advisory-consent');
    await rut.fill([1,0,0,0,0,0,5].join('')+'0');await name.focus();
    row.rut={invalid:await page.evaluate(()=>{const e=document.getElementById('advisory-rut'),error=document.getElementById('advisory-rut-error');return {ariaInvalid:e.getAttribute('aria-invalid')==='true',errorVisible:!error.hidden&&error.getClientRects().length>0,errorHasText:!!error.textContent.trim(),nativeInvalid:!e.checkValidity()};})};
    assert(row.rut.invalid.ariaInvalid&&row.rut.invalid.errorVisible&&row.rut.invalid.errorHasText&&row.rut.invalid.nativeInvalid);
    await rut.fill([1,0,0,0,0,0,5].join('')+'k');await name.focus();
    row.rut.valid=await page.evaluate(()=>{const e=document.getElementById('advisory-rut'),error=document.getElementById('advisory-rut-error'),v=e.value;return {formatted:/^\d{1,3}(?:\.\d{3})+-[\dK]$/.test(v),ariaValid:e.getAttribute('aria-invalid')==='false',errorHidden:error.hidden,nativeValid:e.checkValidity(),stored:[...Object.values(localStorage),...Object.values(sessionStorage)].some(s=>String(s).includes(v)),urlContainsValue:location.href.includes(v)};});
    assert(row.rut.valid.formatted&&row.rut.valid.ariaValid&&row.rut.valid.errorHidden&&row.rut.valid.nativeValid&&!row.rut.valid.stored&&!row.rut.valid.urlContainsValue);

   await consent.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await new Promise(r=>setTimeout(r,150));
   await consent.check();assert(await consent.isChecked());await consent.uncheck();assert(!await consent.isChecked());
   row.consentToggleRestored=true;row.consentMethod='real click with valid blurred RUT';
   await rut.fill('');assert.equal(await rut.inputValue(),'');row.rut.cleared=true;
   row.submitEvents=await page.evaluate(()=>window.__qaSubmits);assert.equal(row.submitEvents,0);
   row.status='PASS';row.finishedAt=new Date().toISOString();
  }catch(error){row.status='FAIL';row.error=scrub(error.message);}
  row.submitEvents=await page.evaluate(()=>window.__qaSubmits||0).catch(()=>row.submitEvents||0);report.formSubmitEvents+=row.submitEvents;
  report.cases.push(row);await checkpoint();console.log(JSON.stringify({phase:'viewport-complete',stage,width,status:row.status,error:row.error}));
 }
 if(!stopped){
  const links=report.cases.find(r=>r.layout)?.layout.internalLinks||[];
  for(const href of [...new Set(links.map(h=>new URL(h,target.origin).pathname))]){const r=await phase('static-navigation-'+href,()=>readOnlyGet(href),65000);report.navigation.push({path:href,status:r.status,bytes:r.bytes});assert.equal(r.status,200,'Internal navigation failed');}
  const favicon=await phase('favicon-proof',()=>readOnlyGet('/assets/branding/favicon.svg'),65000);
  const expected=await readFile(join(REPO,'assets/branding/favicon.svg'));assert.equal(favicon.status,200);assert(favicon.body.equals(expected));
  report.faviconProof={status:200,bytes:favicon.bytes,sha256:favicon.sha256,sourceIdentical:true};
  report.resourceFailures=report.resourceFailures.map(r=>({...r,navigationCancellation:r.url===target.origin+'/assets/branding/favicon.svg'&&r.error==='net::ERR_ABORTED'}));
 }
}catch(error){report.fatal=scrub(error.message);}
finally{
 if(context){try{await phase('close-browser',()=>context.close(),15000);report.browserClosed=true;}catch{report.browserClosed=false;report.fatal='Browser cleanup did not finish';}}await transport?.close();if(profile&&report.browserClosed){await rm(profile,{recursive:true,force:true});report.profileRemoved=true;}
 process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);report.closedAt=new Date().toISOString();report.managedProcessesRemaining=managedPids();report.stoppedBySignal=stopped;
 report.passed=report.browserClosed===true&&report.profileRemoved&&!stopped&&!report.fatal&&report.cases.length===report.widths.length&&report.cases.every(r=>r.status==='PASS')&&report.pageErrors.length===0&&report.transportErrors.length===0&&report.blockedUnsafe.length===0&&report.blockedApi.length===0&&report.blockedExternal.every(r=>r.tooling)&&report.resourceFailures.every(r=>r.intentionalTooling||(r.navigationCancellation&&report.faviconProof?.sourceIdentical))&&report.console.every(r=>r.intentionalTooling)&&report.formSubmitEvents===0&&report.managedProcessesRemaining.length===0;
 await checkpoint();await writeFile(join(RUNTIME,'pid.json'),JSON.stringify({pid:process.pid,state:report.browserClosed?'closed':'cleanup-incomplete',stage,deployment:target.deployment,browserClosed:report.browserClosed,profileRemoved:report.profileRemoved,managedProcessesRemaining:managedPids()})+'\n');
 console.log(JSON.stringify({passed:report.passed,stage,cases:report.cases.length,submits:report.formSubmitEvents,unsafe:report.blockedUnsafe.length,applicationConsoleErrors:report.console.filter(r=>!r.intentionalTooling).length}));if(!report.passed)process.exitCode=1;
}
