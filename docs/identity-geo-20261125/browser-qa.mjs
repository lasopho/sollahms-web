import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const STATIC='/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-identity-geo-20261125/candidate/.vercel/output/static';
const DOCS='/private/tmp/sollahms-identity-geo-20261125/docs/identity-geo-20261125';
const ORIGIN='https://sollahms.cl';
const pages=['index.html','agenda-asesoria.html','contacto.html'];
const widths=[1440,390,320];
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.ico':'image/x-icon'};
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const check=(checks,name,pass,detail)=>checks.push({name,passed:Boolean(pass),...(detail===undefined?{}:{detail})});
const normalize=s=>s.replace(/\s+/g,' ').trim();
const startedAtUTC=new Date().toISOString();
const records=[];const captures=[];let browser;
await fs.mkdir(DOCS,{recursive:true});
try{
  browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-sync','--no-first-run','--disable-features=MediaRouter,OptimizationHints']});
  for(const pageName of pages)for(const width of widths)for(const javaScriptEnabled of [true,false]){
    const context=await browser.newContext({viewport:{width,height:1000},javaScriptEnabled,serviceWorkers:'block',locale:'es-CL',timezoneId:'America/Santiago',reducedMotion:'reduce'});
    const traffic=[];const errors=[];const missing=[];const checks=[];
    await context.route('**/*',async route=>{
      const request=route.request();const u=new URL(request.url());const row={method:request.method(),host:u.hostname,path:u.pathname,resourceType:request.resourceType()};traffic.push(row);
      if(request.method()!=='GET'){row.result='aborted-non-GET';return route.abort('blockedbyclient');}
      if(u.origin!==ORIGIN){row.result='aborted-external';return route.abort('blockedbyclient');}
      if(u.pathname.startsWith('/api/')){row.result='local-503-fixture';return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Isolated QA fixture; no provider request'})});}
      const filename=path.resolve(STATIC,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
      if(!filename.startsWith(STATIC+path.sep)){row.result='aborted-invalid-path';return route.abort('blockedbyclient');}
      try{const body=await fs.readFile(filename);row.result='fulfilled-static';return route.fulfill({status:200,contentType:mime[path.extname(filename)]??'application/octet-stream',body});}
      catch{row.result='fulfilled-local-404';missing.push(u.pathname);return route.fulfill({status:404,contentType:'text/plain',body:'Local isolated fixture: missing resource'});}
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const canonical=ORIGIN+(pageName==='index.html'?'/':'/'+pageName);
    await page.goto(canonical,{waitUntil:'load',timeout:45000});
    if(javaScriptEnabled){
      await page.waitForFunction(()=>Boolean(window.SollahmsMeasurement),{timeout:12000});
      await page.locator('.site-measurement-banner [data-choice="reject"]').click();
      await page.waitForFunction(()=>window.SollahmsMeasurement.status().analyticsConsented===false&&window.SollahmsMeasurement.status().replayConsented===false);
    }
    check(checks,'canonical-apex-exact',await page.locator('link[rel="canonical"]').count()===1&&await page.locator('link[rel="canonical"]').getAttribute('href')===canonical);
    check(checks,'one-main-H1',await page.locator('main h1').count()===1);
    const h1=normalize(await page.locator('main h1').innerText());
    const mainText=normalize(await page.locator('main').innerText());
    check(checks,'corporate-brand-and-service-in-main',/Sollahms/.test(mainText)&&/asesor[ií]a inmobiliaria/i.test(mainText));
    if(pageName==='index.html'){
      const faq=page.locator('#preguntas-frecuentes');check(checks,'existing-FAQ-present',await faq.count()===1);
      const identityAnswer=faq.locator('details').filter({has:page.locator('summary').filter({hasText:/Qué hace Sollahms/i})});
      check(checks,'existing-identity-answer-links-official-domain',await identityAnswer.count()===1&&await identityAnswer.locator('a[href="https://sollahms.cl/"]').count()===1);
      // Native details remain usable even when JavaScript is disabled.
      for(const detail of await faq.locator('details').all())if((await detail.getAttribute('open'))===null)await detail.locator('summary').click();
      check(checks,'FAQ-opens-with-and-without-JS',await faq.locator('details:not([open])').count()===0);
      const faqLinks=await faq.locator('a[href]').evaluateAll(links=>links.map(a=>({text:a.textContent,href:a.getAttribute('href')})));
      const localTargets=faqLinks.filter(a=>a.href.startsWith('#'));
      check(checks,'FAQ-local-anchors-resolve',await page.evaluate(targets=>targets.every(a=>Boolean(document.getElementById(decodeURIComponent(a.href.slice(1))))),localTargets),localTargets);
      const requiredLinks=['/agenda-asesoria.html','/contacto.html'];
      check(checks,'FAQ-connects-advisory-and-contact',requiredLinks.every(href=>faqLinks.some(a=>a.href===href)),faqLinks);
    }
    const officialLinks=page.locator('main a[href]').filter({hasText:/sollahms\.cl/i});
    const officialCount=await officialLinks.count();check(checks,'official-domain-visible-in-main',officialCount>0);
    if(officialCount){
      const official=officialLinks.first();await official.scrollIntoViewIfNeeded();
      const href=await official.getAttribute('href');
      check(checks,'official-domain-link-exact',new URL(href,ORIGIN).href===ORIGIN+'/',{href});
      check(checks,'official-domain-readable',await official.isVisible());
      if(javaScriptEnabled){await official.focus();check(checks,'official-link-keyboard-focusable',await official.evaluate(el=>document.activeElement===el));}
    }
    const form=page.locator('main form#advisory-form');
    check(checks,'one-existing-advisory-form',await page.locator('main form').count()===1&&await form.count()===1);
    if(await form.count()){
      check(checks,'form-provider-action-and-method-preserved',await form.getAttribute('action')==='/api/advisory'&&(await form.getAttribute('method')).toLowerCase()==='post');
      const fields=await form.locator('#advisory-fields').evaluate(el=>({disabled:el.disabled,controls:[...el.querySelectorAll('input,select,textarea,button')].map(c=>({type:c.type,name:c.name,disabled:c.matches(':disabled')}))}));
      check(checks,'form-controls-enabled-only-with-JS',javaScriptEnabled?!fields.disabled:fields.disabled&&fields.controls.every(c=>c.disabled),fields);
      for(const id of ['advisory-name','advisory-rut','advisory-email','advisory-phone','advisory-consent'])check(checks,'required-form-control:'+id,await form.locator('#'+id).getAttribute('required')!==null);
      check(checks,'privacy-link-present',await form.locator('a[href="/privacidad.html"]').count()===1);
      if(!javaScriptEnabled)check(checks,'JS-off-contact-fallback-visible',await page.locator('#advisory-unavailable').isVisible()&&await page.locator('#advisory-unavailable a[href="mailto:contacto@sollahms.cl"]').count()===1);
    }
    if(javaScriptEnabled&&width<768){
      const menuButton=page.locator('button[aria-controls="mobile-menu"]');await menuButton.scrollIntoViewIfNeeded();await menuButton.focus();
      await page.keyboard.press('Enter');check(checks,'mobile-menu-keyboard-opens',await menuButton.getAttribute('aria-expanded')==='true'&&await page.locator('#mobile-menu').isVisible());
      await page.keyboard.press('Escape');check(checks,'mobile-menu-Escape-restores-focus',await menuButton.getAttribute('aria-expanded')==='false'&&await menuButton.evaluate(el=>document.activeElement===el));
    }
    const overflow=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,offenders:[...document.querySelectorAll('main *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&getComputedStyle(el).position!=='fixed';}).slice(0,8).map(el=>({tag:el.tagName,id:el.id,className:String(el.className).slice(0,100),left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)}))}));
    check(checks,'no-global-horizontal-overflow',overflow.documentWidth<=width+1&&overflow.bodyWidth<=width+1,overflow);
    const providerAttempts=traffic.filter(r=>/googletagmanager\.com|google-analytics\.com|clarity\.ms|bing\.com/.test(r.host));
    check(checks,'zero-optional-provider-SDK-or-collection-attempts',providerAttempts.length===0);
    check(checks,'zero-non-GET-requests',traffic.every(r=>r.method==='GET'));
    check(checks,'zero-missing-local-resources',missing.length===0,missing);
    check(checks,'no-page-JavaScript-errors',errors.length===0,errors);
    if(javaScriptEnabled&&(width===1440||width===390)){
      const selector=pageName==='index.html'?'#preguntas-frecuentes':'.advisory-page-heading';
      const filename=`browser-${pageName.replace('.html','')}-${width}-js-on.png`;const target=path.join(DOCS,filename);
      const captureElement=page.locator(selector);
      // Tall native FAQ captures must fit below the unchanged sticky header.
      // Verification above retains the declared 1000px viewport height.
      const captureBox=await captureElement.boundingBox();
      await page.setViewportSize({width,height:Math.min(8192,Math.ceil(captureBox.height)+200)});
      await captureElement.scrollIntoViewIfNeeded();await page.evaluate(()=>window.scrollBy(0,-120));
      await captureElement.screenshot({path:target,animations:'disabled'});captures.push({path:target,page:pageName,width,javaScriptEnabled,selector,captureViewportHeight:page.viewportSize().height,sha256:digest(await fs.readFile(target))});
    }
    const measurement=javaScriptEnabled?await page.evaluate(()=>window.SollahmsMeasurement.status()):null;
    const record={page:pageName,width,javaScriptEnabled,h1,passed:checks.every(c=>c.passed),checks,measurement,trafficSummary:{total:traffic.length,localStatic:traffic.filter(r=>r.result==='fulfilled-static').length,local503Fixtures:traffic.filter(r=>r.result==='local-503-fixture').length,externalAborted:traffic.filter(r=>r.result==='aborted-external').map(({host,path})=>({host,path})),optionalProviderAttempts:providerAttempts.length,realNetworkContinues:0},pageErrors:errors};records.push(record);
    process.stdout.write(JSON.stringify({page:pageName,width,javaScriptEnabled,passed:record.passed,failed:checks.filter(c=>!c.passed).map(c=>c.name)})+'\n');
    await context.close();
  }
  const report={schemaVersion:1,kind:'ISOLATED_BROWSER_QA_IDENTITY_GEO_20261125',startedAtUTC,finishedAtUTC:new Date().toISOString(),browserVersion:browser.version(),staticRoot:STATIC,origin:ORIGIN,plannedCases:18,completedCases:records.length,passedCases:records.filter(r=>r.passed).length,failedCases:records.filter(r=>!r.passed).length,cases:records,captures,routePolicy:'Every context request is intercepted and fulfilled only from the frozen static artifact or an explicit local503 API fixture; every external and non-GET request is aborted. route.continue/route.fetch never used.',accountOrSharedChromeUsed:false,commercialFormsSubmitted:0,optionalProviderSDKRequests:0,realNetworkContinues:0,limitations:['Isolated local browser UI and preserved-form smoke only; production HTTPS, SSO and deployed byte integrity are separate checks.','Existing external requests are aborted; available local fonts/fallbacks render. No external map, tile or API provider is tested.','No personal or financial data entered; no forms or measurement provider events sent.','No ranking, crawling, indexation, AI citation, real analytics collection or commercial delivery result is inferred.']};
  await fs.writeFile(path.join(DOCS,'browser-qa.json'),JSON.stringify(report,null,2)+'\n');
  if(report.failedCases||report.completedCases!==18)process.exitCode=1;
}catch(error){await fs.writeFile(path.join(DOCS,'browser-qa-error.json'),JSON.stringify({at:new Date().toISOString(),message:error.message,stack:error.stack,completedCases:records},null,2)+'\n');console.error(error.message);process.exitCode=1;}
finally{if(browser)await browser.close();}
