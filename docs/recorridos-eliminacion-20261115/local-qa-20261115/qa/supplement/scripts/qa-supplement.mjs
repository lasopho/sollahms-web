// Read-only QA of the deployed fiche interaction surface. Never dispatches submit.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, symlink, lstat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { nativeTransport } from '/private/tmp/sollahms-recorridos-qa/native-transport.mjs';
import {sanitize,captureConsole} from './console-safety.mjs';
const { chromium } = createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const root='/private/tmp/sollahms-recorridos-supplement';
await writeFile(resolve(root,'runner.pid'),String(process.pid)+'\n');
const origin='https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app';
const source=JSON.parse(await readFile('/private/tmp/sollahms-recorridos-qa/data/proyectos.json','utf8'));
const mediaSource=new Map(JSON.parse(await readFile(resolve(root,'source-media-inventory.json'),'utf8')).rows.map(r=>[r.slug,r]));
const slugs=process.env.QA_SLUGS?process.env.QA_SLUGS.split(','):source.map(x=>x.slug);
await mkdir(root,{recursive:true});
try{await lstat(resolve(root,'native-cache'));}catch{await symlink('/private/tmp/sollahms-recorridos-qa/native-cache',resolve(root,'native-cache'),'dir');}
const transport=await nativeTransport({origin,root});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,handleSIGINT:false,handleSIGTERM:false,handleSIGHUP:false,args:['--no-sandbox','--disable-dev-shm-usage']});
let rows=[];
if(process.env.QA_RESUME==='1'){
 try{const previous=JSON.parse(await readFile(resolve(root,'supplement-results.json'),'utf8'));rows=(previous.rows||[]).filter(r=>!interactionFailure(r,true));}
 catch{}
}
const retained=new Map(rows.map(r=>[r.slug,structuredClone(r)]));
const queue=slugs.filter(s=>!retained.has(s)||!retained.get(s).consoleCaptureComplete||retained.get(s).mediaInventory?.unhandledMediaButtons.length);
let stopping=false;
process.on('SIGINT',()=>{stopping=true;});
process.on('SIGTERM',()=>{stopping=true;});
try{
 await Promise.all(Array.from({length:Number(process.env.QA_WORKERS||'1')},async()=>{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
  let blocked=[],intentionalBlocks=[];let mapReads=0;
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if((req.method()==='POST'&&url.origin==='https://maps.googleapis.com'&&url.pathname==='/maps_api_js_slo/log')||(url.hostname==='vercel.live'||url.hostname.endsWith('.vercel.live'))){intentionalBlocks.push({origin:url.origin,path:url.pathname,method:req.method(),reason:url.origin==='https://maps.googleapis.com'?'google-maps-telemetry-privacy':'optional-preview-toolbar'});return route.abort();}
   if(req.method()==='POST'&&((url.origin==='https://maps.googleapis.com'&&/^\/\$rpc\/google\.internal\.maps\.mapsjs\.v1\.MapsJsInternalService\/(?:Get[A-Za-z0-9_]+|InitMapsJwt)$/.test(url.pathname))||(url.origin==='https://places.googleapis.com'&&url.pathname==='/$rpc/google.maps.places.v1.Places/GetPlace'))){mapReads++;return route.continue();}
   if(!['GET','HEAD','OPTIONS'].includes(req.method())){blocked.push({origin:url.origin,path:url.pathname,method:req.method()});return route.abort();}
   try{return await(url.origin===origin?transport.handle(route):route.continue());}catch{blocked.push({origin:url.origin,path:url.pathname,method:req.method(),transportFailed:true});return route.abort().catch(()=>{});}
  });
  const page=await context.newPage();page.setDefaultTimeout(90000);
  while(queue.length&&!stopping){
   try{await lstat(resolve(root,'STOP'));stopping=true;break;}catch{}
   const slug=queue.shift(),errors=[];blocked=[];intentionalBlocks=[];mapReads=0;
   const previous=retained.get(slug),consoleOnly=!!previous;
   const row={...(previous||{slug,width:1440,navigation:[],media:[],forms:[],videos:[]}),blocked,errors,intentionalBlocks,consoleMessages:[],consoleCaptureComplete:false,interactionControlsRetained:consoleOnly,historicalBlockedAuxiliary:previous?.blocked||[]};
   const knownFullscreen=mediaSource.get(slug)?.media.some(m=>m.tag==='iframe'&&m['data-project-embed']==='map'&&m.allow?.includes('fullscreen')&&'allowfullscreen' in m);
   const onError=e=>errors.push(sanitize(e.message));page.on('pageerror',onError);
   const onConsole=m=>{if(['error','warning'].includes(m.type()))row.consoleMessages.push(captureConsole(m,{origin,intentionalBlocks,knownFullscreen}));};page.on('console',onConsole);
   try{
    const response=await page.goto(origin+'/'+slug+'.html',{waitUntil:'domcontentloaded',timeout:90000});row.status=response.status();
    await page.waitForFunction(()=>document.querySelector('#advisory-fields:not(:disabled)'),undefined,{timeout:60000});
    if(consoleOnly){
     const location=page.locator('#ubicacion').first();if(await location.count())await location.scrollIntoViewIfNeeded();await page.waitForTimeout(2500);
    }else{
    await page.evaluate(()=>{for(const i of document.images)i.loading='eager';});
    for(const details of await page.locator('details:has(img)').all())if(await details.getAttribute('open')===null)await details.locator(':scope > summary').first().click();
    for(const a of await page.locator('[data-project-navigation] a[href^="#"]').all()){
     const href=await a.getAttribute('href');await a.click();
     await page.waitForFunction(hash=>location.hash===hash,href,{timeout:5000});
     await page.waitForTimeout(100);
     row.navigation.push(await page.evaluate(hash=>{const e=document.getElementById(hash.slice(1)),r=e?.getBoundingClientRect();return {href:hash,hashMatches:location.hash===hash,targetExists:!!e,visibleAtDestination:!!r&&r.top<innerHeight&&r.bottom>0,ariaCurrent:document.querySelector('[data-project-navigation] a[href="'+hash+'"]')?.getAttribute('aria-current')};},href));
    }
    for(const mode of ['llamada','cotizacion']){
     const button=page.locator('[data-request-mode="'+mode+'"]').first();
     if(!await button.count()){row.forms.push({mode,error:'mode-control-missing'});continue;}
     await button.click();
     try{await page.waitForFunction(m=>document.querySelector('[data-request-mode="'+m+'"]')?.getAttribute('aria-pressed')==='true',mode,{timeout:3000});}catch{}
     row.forms.push(await page.evaluate(mode=>{
      const form=document.querySelector('form[data-project-request]'),time=form?.elements.franja;
      const fields=['nombre','rut','correo','telefono','consent'].map(name=>{const e=form?.elements[name];return {name,exists:!!e,required:!!e?.required,enabled:!!e&&!e.disabled,visible:!!e?.getClientRects().length,empty:e?.type==='checkbox'?!e.checked:e?.value==='',willValidate:e?.willValidate,valueMissing:!!e?.validity.valueMissing,labelled:!!e?.labels?.length};});
      // reportValidity invokes only native validity UI; it does not fire submit.
      const emptyFormRejected=form?form.reportValidity()===false:false;
      return {mode,active:document.querySelector('[data-request-mode="'+mode+'"]')?.getAttribute('aria-pressed'),fields,emptyFormRejected,action:form?.getAttribute('action'),method:form?.method,novalidate:form?.noValidate,preferredTimeVisible:!!time?.getClientRects().length,preferredTimeEnabled:!!time&&!time.disabled,title:document.querySelector('#advisory-form-title')?.textContent.trim(),submitLabel:form?.querySelector('[type=submit]')?.textContent.trim(),consentUnchecked:form?.elements.consent?.checked===false};
     },mode));
    }
    // Confirm CTA intent routing as a user click, preserving every field empty.
    row.ctas=[];
    for(const intent of ['llamada','cotizacion']){
     const link=page.locator('a[data-request-intent="'+intent+'"]:visible').first();if(!await link.count())continue;
     await link.click();
     try{await page.waitForFunction(m=>document.querySelector('[data-request-mode="'+m+'"]')?.getAttribute('aria-pressed')==='true',intent,{timeout:3000});}catch{}
     row.ctas.push({intent,hash:new URL(page.url()).hash,active:await page.locator('[data-request-mode="'+intent+'"]').first().getAttribute('aria-pressed')});
    }
    const groups=[{kind:'gallery',selector:'#galeria a:has(img)'},{kind:'plan',selector:'#planos a:has(img),#modelos a:has(img),a:has(img[alt*="Plano"]),a:has(img[alt*="plano"]),a:has(img[alt*="Planta"]),a:has(img[alt*="planta"])'}];
    for(const group of groups){
     const links=page.locator(group.selector);let openedOne=false;
     for(let i=0;i<await links.count();i++){
      const a=links.nth(i),href=await a.getAttribute('href'),target=await a.getAttribute('target');
      const state=await a.evaluate(async a=>{const image=a.querySelector('img');if(image&&!image.complete)await new Promise(r=>{image.addEventListener('load',r,{once:true});image.addEventListener('error',r,{once:true});setTimeout(r,20000);});return {sameAsDisplayed:!!image&&new URL(a.href).href===new URL(image.currentSrc||image.src).href,displayedDecoded:!!image?.naturalWidth&&image.complete,disabled:a.getAttribute('aria-disabled')==='true'};});
      const item={kind:group.kind,path:new URL(href,page.url()).pathname,target,...state,opened:false,openingRequired:!openedOne||!state.sameAsDisplayed||group.kind==='plan'};
      // Open at least one item per group and every distinct full-size target.
      if(item.openingRequired){
       if(target==='_blank'){
        const [popup]=await Promise.all([page.waitForEvent('popup',{timeout:90000}),a.click({timeout:90000})]);
        try{await popup.waitForLoadState('load',{timeout:90000});item.opened=true;item.finalPath=new URL(popup.url()).pathname;item.destinationMatches=item.finalPath===item.path;item.popupDecoded=await popup.evaluate(()=>[...document.images].some(i=>i.complete&&i.naturalWidth>0));}finally{await popup.close();}
       }else{
        // Cover dialog-backed media without navigation away from the fiche.
        await a.click();const dialog=page.locator('dialog[open],[role=dialog]:visible');item.dialogVisible=await dialog.count()>0;item.opened=item.dialogVisible;
        if(item.dialogVisible){item.popupDecoded=await dialog.locator('img').evaluateAll(els=>els.some(i=>i.complete&&i.naturalWidth>0));await page.keyboard.press('Escape');}
       }
       openedOne=true;
      }
      row.media.push(item);
     }
    }
    row.mediaInventory=await page.evaluate(()=>({galleryImages:document.querySelectorAll('#galeria img').length,planImages:document.querySelectorAll('#planos img,#modelos img,img[alt*="Plano"],img[alt*="plano"],img[alt*="Planta"],img[alt*="planta"]').length,unhandledMediaButtons:[...document.querySelectorAll('#galeria button,#planos button,#modelos button')].map(x=>({text:x.textContent.trim(),label:x.getAttribute('aria-label')})),videoElements:document.querySelectorAll('video,source[type^="video"],iframe[src*="youtube"],iframe[src*="vimeo"],iframe[data-project-embed="video"]').length}));
    row.videos=await page.locator('video,source[type^="video"],iframe[src*="youtube"],iframe[src*="vimeo"],iframe[data-project-embed="video"],a[href*="youtube.com"],a[href*="youtu.be"],a[href*="vimeo.com"],a[href*=".mp4"],a[href*=".webm"],source[src*=".mp4"],source[src*=".webm"]').evaluateAll(els=>els.map(e=>({tag:e.tagName,src:e.getAttribute('src'),href:e.getAttribute('href'),type:e.getAttribute('type')})));
    }
    const compare=page.locator('[data-plan-compare]').first();
    if(await compare.count()){
     const choices=page.locator('[data-compare-plan]'),dialog=page.locator('[data-plan-dialog]').first();
     row.planComparison={present:true,availableChoices:await choices.count(),initialDisabled:await compare.isDisabled()};
     const center=async locator=>{await locator.evaluate(e=>e.scrollIntoView({block:'center',inline:'nearest'}));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForTimeout(80);};
     if(await choices.count()<2){
      if(await choices.count()){await center(choices.nth(0));await choices.nth(0).check();}
      row.planComparison.insufficientSheetsGuarded=await compare.isDisabled()&&await dialog.evaluate(e=>!e.open);
      if(await choices.count()){await center(choices.nth(0));await choices.nth(0).uncheck();}
      row.planComparison.restored=await page.locator('[data-compare-plan]:checked').count()===0&&await compare.isDisabled();
     }else{
     await center(choices.nth(0));await choices.nth(0).check();await center(choices.nth(1));await choices.nth(1).check();
     row.planComparison.selectedTwo=await page.locator('[data-compare-plan]:checked').count()===2;
     row.planComparison.enabledWithTwo=await compare.isEnabled();
     await center(compare);await compare.click();await dialog.waitFor({state:'visible'});
     row.planComparison.dialogOpened=await dialog.evaluate(e=>e.open);
     row.planComparison.imageCount=await dialog.locator('[data-plan-comparison] img').count();
     await dialog.locator('img').evaluateAll(async imgs=>Promise.all(imgs.map(i=>i.complete?null:new Promise(r=>{i.addEventListener('load',r,{once:true});i.addEventListener('error',r,{once:true});setTimeout(r,20000);}))))
     row.planComparison.imagesDecoded=await dialog.locator('img').evaluateAll(imgs=>imgs.length===2&&imgs.every(i=>i.complete&&i.naturalWidth>0));
     await dialog.locator('[data-plan-close]').click();
     row.planComparison.closed=await dialog.evaluate(e=>!e.open);
     await center(choices.nth(0));await choices.nth(0).uncheck();await center(choices.nth(1));await choices.nth(1).uncheck();
     row.planComparison.restored=await page.locator('[data-compare-plan]:checked').count()===0&&await compare.isDisabled();
     }
     row.mediaInventory.unhandledMediaButtons=await page.locator('#galeria button:not([data-plan-compare]):not([data-plan-close]),#planos button:not([data-plan-compare]):not([data-plan-close]),#modelos button:not([data-plan-compare]):not([data-plan-close])').evaluateAll(els=>els.map(e=>({text:e.textContent.trim(),label:e.getAttribute('aria-label')})));
    }
    row.mapEvidenceDelegatedToCore=true;row.readOnlyMapRpc=mapReads;
    row.fieldsUntouched=await page.locator('form[data-project-request]').evaluate(form=>[...form.elements].filter(e=>e.name!=='website'&&['INPUT','TEXTAREA'].includes(e.tagName)).every(e=>e.type==='checkbox'?!e.checked:e.value===''));
    row.consoleCaptureComplete=true;
   }catch(e){row.error=sanitize(e.message);if(/Target page, context or browser has been closed/.test(e.message)){row.interruptedByRunnerStop=true;stopping=true;}}
   const index=rows.findIndex(r=>r.slug===slug);if(index<0)rows.push(row);else rows[index]=row;
   page.off('pageerror',onError);page.off('console',onConsole);
   await writeFile(resolve(root,'supplement-results.json'),JSON.stringify({deployment:'dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi',readOnly:true,submitEventsDispatched:0,rows},null,2)+'\n');
   console.log(JSON.stringify({supplementCompleted:rows.length,last:slug,controlsRetained:consoleOnly,error:row.error||null}));
  }
  await context.close();
 }));
}finally{try{await browser.close();}finally{await transport.close();}}
function knownMapAuxiliary(b){return b.method==='POST'&&((b.origin==='https://maps.googleapis.com'&&/^\/\$rpc\/google\.internal\.maps\.mapsjs\.v1\.MapsJsInternalService\/(?:Get[A-Za-z0-9_]+|InitMapsJwt)$/.test(b.path))||(b.origin==='https://places.googleapis.com'&&b.path==='/$rpc/google.maps.places.v1.Places/GetPlace'));}
function interactionFailure(r,allowPlanComparisonPending=false){return !!(r.error||r.status!==200||r.errors.length||r.blocked.some(b=>!knownMapAuxiliary(b))||!r.fieldsUntouched||r.navigation.length<5||r.forms.length!==2||!r.mediaInventory||r.navigation.some(n=>!n.hashMatches||!n.targetExists||!n.visibleAtDestination)||r.forms.some(f=>f.error||f.active!=='true'||!f.emptyFormRejected||!f.consentUnchecked||f.fields.some(e=>!e.exists||!e.required||!e.enabled||!e.visible||!e.empty||!e.willValidate||!e.valueMissing||!e.labelled)||f.preferredTimeEnabled!==(f.mode==='llamada')||f.preferredTimeVisible!==(f.mode==='llamada'))||r.ctas?.some(c=>c.hash!=='#solicitar-cotizacion'||c.active!=='true')||r.media.some((m,i)=>m.disabled||!m.displayedDecoded||((m.openingRequired??(i===0||m.kind==='plan'||!m.sameAsDisplayed))&&(!m.opened||!m.popupDecoded||m.destinationMatches===false)))||(r.mediaInventory?.unhandledMediaButtons.length&&!(allowPlanComparisonPending&&r.mediaInventory.unhandledMediaButtons.every(b=>['Comparar dos láminas','Cerrar comparación'].includes(b.text))))||(r.planComparison&&(!r.planComparison.initialDisabled||!r.planComparison.restored||(r.planComparison.availableChoices<2?!r.planComparison.insufficientSheetsGuarded:(!r.planComparison.selectedTwo||!r.planComparison.enabledWithTwo||!r.planComparison.dialogOpened||r.planComparison.imageCount!==2||!r.planComparison.imagesDecoded||!r.planComparison.closed))))||r.videos.length);}
const consoleFailure=r=>!r.consoleCaptureComplete||(r.consoleMessages||[]).some(m=>!['expected-privacy-block','expected-preview-toolbar-block','known-browser-parser-warning'].includes(m.category));
const failures=rows.filter(r=>interactionFailure(r)||consoleFailure(r));
const result={deployment:'dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi',pages:slugs.length,completed:rows.length,consoleCompleteFiches:rows.filter(r=>r.consoleCaptureComplete).length,complete:rows.length===slugs.length&&!stopping,interrupted:stopping,failures:failures.map(r=>r.slug),readOnly:true,submitEventsDispatched:0,historicalAuxiliaryMapReadsBlocked:rows.flatMap(r=>[...r.blocked.filter(knownMapAuxiliary),...(r.historicalBlockedAuxiliary||[])].map(b=>({slug:r.slug,...b}))),mapRenderDelegatedToCore524:true,consoleRedaction:'URL queries/fragments/userinfo and token patterns removed; bodies/headers omitted; no argument objects captured',rows};
await writeFile(resolve(root,'supplement-results.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({supplementCompleted:rows.length,failures:failures.length}));
if(failures.length||!result.complete)process.exitCode=1;
