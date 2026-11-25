import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const STATIC='/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-seo-geo-20261125/candidate/.vercel/output/static';
const DOCS='/private/tmp/sollahms-seo-geo-20261125/docs/seo-geo-20261125';
const ORIGIN='https://sollahms.cl';
const pages=['entorno-desarrollo-urbano.html','centro-orientacion.html'];
const widths=[1440,390,320];
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.ico':'image/x-icon'};
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const check=(checks,name,pass,detail)=>checks.push({name,passed:Boolean(pass),...(detail===undefined?{}:{detail})});
const startedAtUTC=new Date().toISOString();
const records=[];const captures=[];let browser;
try{
  browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-sync','--no-first-run','--disable-features=MediaRouter,OptimizationHints']});
  for(const pageName of pages)for(const width of widths)for(const javaScriptEnabled of [true,false]){
    const context=await browser.newContext({viewport:{width,height:1000},javaScriptEnabled,serviceWorkers:'block',locale:'es-CL',timezoneId:'America/Santiago',reducedMotion:'reduce'});
    const traffic=[];const errors=[];const missing=[];const checks=[];
    await context.route('**/*',async route=>{
      const request=route.request();const u=new URL(request.url());const row={method:request.method(),host:u.hostname,path:u.pathname,resourceType:request.resourceType()};
      traffic.push(row);
      if(request.method()!=='GET'){row.result='aborted-non-GET';return route.abort('blockedbyclient');}
      if(u.origin!==ORIGIN){row.result='aborted-external';return route.abort('blockedbyclient');}
      if(u.pathname.startsWith('/api/')){row.result='local-503-fixture';return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Isolated QA fixture; no provider request'})});}
      const filename=path.resolve(STATIC,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
      if(!filename.startsWith(STATIC+path.sep)){row.result='aborted-invalid-path';return route.abort('blockedbyclient');}
      try{const body=await fs.readFile(filename);row.result='fulfilled-static';return route.fulfill({status:200,contentType:mime[path.extname(filename)]??'application/octet-stream',body});}
      catch{row.result='fulfilled-local-404';missing.push(u.pathname);return route.fulfill({status:404,contentType:'text/plain',body:'Local isolated fixture: missing resource'});}
    });
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(ORIGIN+'/'+pageName,{waitUntil:'load',timeout:45000});
    if(javaScriptEnabled){
      await page.waitForFunction(()=>Boolean(window.SollahmsMeasurement),{timeout:12000});
      await page.locator('.site-measurement-banner [data-choice="reject"]').click();
      await page.waitForFunction(()=>window.SollahmsMeasurement.status().analyticsConsented===false&&window.SollahmsMeasurement.status().replayConsented===false);
    }
    check(checks,'canonical-apex-exact',await page.locator('link[rel="canonical"]').count()===1&&await page.locator('link[rel="canonical"]').getAttribute('href')===ORIGIN+'/'+pageName);
    check(checks,'one-main-H1',await page.locator('main h1').count()===1);
    const h1=(await page.locator('main h1').innerText()).replace(/\s+/g,' ').trim();
    const visibleSelectors=pageName.startsWith('entorno')?['.uw-method a[href="/guia-hipotecaria.html"]','.uw-method a[href="/comparador-hipotecario.html"]','.uw-method a[href="/agenda-asesoria.html"]']:['#ruta .section-head a[href="/entorno-desarrollo-urbano.html"]','#asesoria a.text-link[href="/agenda-asesoria.html"]'];
    for(const selector of visibleSelectors){
      const link=page.locator(selector);await link.scrollIntoViewIfNeeded();
      const visibility=await link.evaluate(el=>{const r=el.getBoundingClientRect();let opacity=1,hidden=false;for(let p=el;p;p=p.parentElement){const s=getComputedStyle(p);opacity*=Number(s.opacity);if(s.visibility==='hidden'||s.display==='none')hidden=true;}return {width:r.width,height:r.height,opacity,hidden};});
      check(checks,'HTML-link-visible:'+selector,await link.count()===1&&visibility.width>0&&visibility.height>0&&!visibility.hidden&&visibility.opacity>.95,visibility);
    }
    if(pageName.startsWith('entorno')){
      check(checks,'three-methodology-points',await page.locator('.uw-checklist > li').count()===3);
      if(javaScriptEnabled){
        await page.waitForFunction(()=>document.querySelector('#uw-list')?.getAttribute('aria-busy')==='false'&&document.querySelectorAll('#uw-list .uw-card').length>0);
        const count=await page.locator('#uw-list .uw-card').count();check(checks,'urban-list-loaded',count>0,{cards:count});
        for(const id of ['uw-region','uw-commune','uw-type','uw-state','uw-reset','uw-map-toggle'])check(checks,'control-enabled:'+id,await page.locator('#'+id).isEnabled());
        const value=await page.locator('#uw-region option').evaluateAll(options=>options.find(x=>x.value)?.value??null);
        if(value){await page.locator('#uw-region').selectOption(value);check(checks,'region-filter-updates-local-list',await page.locator('#uw-list .uw-card').count()>0&&new URL(page.url()).searchParams.get('region')===value);await page.locator('#uw-reset').click();check(checks,'reset-restores-local-list',await page.locator('#uw-list .uw-card').count()===count);}
      }else check(checks,'JS-off-filters-disabled-and-explanation-visible',await page.locator('#uw-region').isDisabled()&&await page.locator('noscript').innerText().then(t=>t.includes('Activa JavaScript')));
      check(checks,'map-never-opened',await page.locator('#uw-map-panel').isHidden()&&await page.locator('#uw-map-toggle').getAttribute('aria-expanded')==='false');
    }else{
      const ids=await page.locator('main form').evaluateAll(forms=>forms.map(f=>f.id).sort());check(checks,'four-existing-forms-preserved',JSON.stringify(ids)===JSON.stringify(['benefit-form','budget-form','orientation-contact','quotes-form']));
      for(const id of ids){
        const state=await page.locator('#'+id+' fieldset[data-interactive]').evaluate(el=>({disabled:el.disabled,hasDisabledAttribute:el.hasAttribute('disabled'),controls:[...el.querySelectorAll('input,select,textarea,button')].map(c=>({tag:c.tagName,type:c.type,disabled:c.matches(':disabled')}))}));
        check(checks,'form-controls-state:'+id,javaScriptEnabled?!state.disabled:state.disabled&&state.hasDisabledAttribute&&state.controls.every(c=>c.disabled),state);
      }
    }
    const overflow=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,offenders:[...document.querySelectorAll('main *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&getComputedStyle(el).position!=='fixed';}).slice(0,8).map(el=>({tag:el.tagName,id:el.id,className:String(el.className).slice(0,100),left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)}))}));
    check(checks,'no-global-horizontal-overflow',overflow.documentWidth<=width+1&&overflow.bodyWidth<=width+1,overflow);
    const providerAttempts=traffic.filter(r=>/googletagmanager\.com|google-analytics\.com|clarity\.ms|bing\.com/.test(r.host));
    check(checks,'zero-optional-provider-SDK-or-collection-attempts',providerAttempts.length===0);
    check(checks,'zero-non-GET-requests',traffic.every(r=>r.method==='GET'));
    check(checks,'zero-map-provider-or-tile-requests',!traffic.some(r=>r.host.includes('openstreetmap')||r.path==='/data/map-provider.json'||r.path.includes('/leaflet')));
    check(checks,'zero-missing-local-resources',missing.length===0,missing);
    check(checks,'no-page-JavaScript-errors',errors.length===0,errors);
    if(javaScriptEnabled&&(width===1440||width===390)){
      const selector=pageName.startsWith('entorno')?'.uw-method':width===1440?'#ruta':'#asesoria';
      const filename=`browser-${pageName.replace('.html','')}-${width}-js-on.png`;const target=path.join(DOCS,filename);
      await page.locator(selector).screenshot({path:target,animations:'disabled'});captures.push({path:target,page:pageName,width,javaScriptEnabled,selector,sha256:digest(await fs.readFile(target))});
    }
    const measurement=javaScriptEnabled?await page.evaluate(()=>window.SollahmsMeasurement.status()):null;
    const record={page:pageName,width,javaScriptEnabled,h1,passed:checks.every(c=>c.passed),checks,measurement,trafficSummary:{total:traffic.length,localStatic:traffic.filter(r=>r.result==='fulfilled-static').length,local503Fixtures:traffic.filter(r=>r.result==='local-503-fixture').length,externalAborted:traffic.filter(r=>r.result==='aborted-external').map(({host,path})=>({host,path})),optionalProviderAttempts:providerAttempts.length,realNetworkContinues:0},pageErrors:errors};records.push(record);
    process.stdout.write(JSON.stringify({page:pageName,width,javaScriptEnabled,passed:record.passed,failed:checks.filter(c=>!c.passed).map(c=>c.name)})+'\n');
    await context.close();
  }
  const report={schemaVersion:1,kind:'ISOLATED_BROWSER_QA_SEO_GEO_20261125',startedAtUTC,finishedAtUTC:new Date().toISOString(),browserVersion:browser.version(),staticRoot:STATIC,origin:ORIGIN,plannedCases:12,completedCases:records.length,passedCases:records.filter(r=>r.passed).length,failedCases:records.filter(r=>!r.passed).length,cases:records,captures,routePolicy:'Every context request is intercepted and fulfilled only from the frozen static artifact or an explicit local503 API fixture; every external and non-GET request is aborted. route.continue/route.fetch never used.',accountOrSharedChromeUsed:false,commercialFormsSubmitted:0,optionalProviderSDKRequests:0,realNetworkContinues:0,limitations:['Isolated local browser UI and preserved-tool smoke only; production HTTPS, SSO and deployed byte integrity are separate checks.','Existing external Google Fonts requests are aborted; available local fonts/fallbacks render. No external map, tile or API provider is tested.','Financial/orientation and urban unit suites are not repeated; no financial values or personal data are entered.','No ranking, crawling, indexation, AI citation, real analytics collection or commercial delivery result is inferred.']};
  await fs.writeFile(path.join(DOCS,'browser-qa.json'),JSON.stringify(report,null,2)+'\n');
  if(report.failedCases||report.completedCases!==12)process.exitCode=1;
}catch(error){await fs.writeFile(path.join(DOCS,'browser-qa-error.json'),JSON.stringify({at:new Date().toISOString(),message:error.message,stack:error.stack,completedCases:records},null,2)+'\n');console.error(error.message);process.exitCode=1;}
finally{if(browser)await browser.close();}
