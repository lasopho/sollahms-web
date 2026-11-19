import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {createHash} from 'node:crypto';

// Entirely local browser QA: every browser request is fulfilled/blocked, never continued.
const require = createRequire('/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium} = require('playwright');
const root = resolve(import.meta.dirname, '..');
const supplement = process.argv.includes('--supplement');
const verified = process.argv.includes('--verified');
const release = process.argv.includes('--release');
const configured = release || verified || process.argv.includes('--configured');
const staticRoot = process.env.SOLLAHMS_MEASUREMENT_STATIC || '/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-measurement-private/'+(release?'candidate-release':verified?'candidate-verified':configured?'candidate-final':'candidate-v3')+'/.vercel/output/static';
const outDir = resolve(root, 'docs/measurement-20261119');
const consentKey = 'sollahms.measurement-consent.v1';
const shipped = JSON.parse(await readFile(resolve(staticRoot, 'data/site-measurement.json')));
const ready = {...shipped, enabled:true, analytics:{...shipped.analytics, enabled:true, measurementId:'G-TEST123456', enhancedMeasurementVerifiedDisabled:true}, replay:{...shipped.replay, enabled:true, projectId:'test12345', strictMaskingVerified:true}};
const mime = {'.html':'text/html', '.mjs':'text/javascript', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.woff2':'font/woff2'};
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run', '--host-resolver-rules=MAP * ~NOTFOUND']});
const receipt = {createdAt:new Date().toISOString(), mode:'isolated local browser, no real provider/API requests', browser:await browser.version(), framework:'Playwright (installed runtime; Puppeteer unavailable)', sourceStatic:staticRoot, configShipped:{enabled:shipped.enabled, analyticsEnabled:shipped.analytics.enabled, replayEnabled:shipped.replay.enabled, blankIds:!shipped.analytics.measurementId&&!shipped.replay.projectId}, runtimeSha256:createHash('sha256').update(await readFile(resolve(staticRoot,'assets/js/site-measurement.mjs'))).digest('hex'), checks:[], screenshots:[], limitations:['Provider SDK bodies are local nonnetworking mocks; the configured revocation case creates synthetic first-party cookies. Does not certify provider collection/redaction, account settings, CSP headers, delivery, CRM receipt or qualified leads.','Form inputs are synthetic; local API fixtures never send mail or persist leads.','Reload is tested as browser navigation, not as proof that a real SDK cannot send a final unload request.']};
async function test(name, fn) {try {const detail=await fn();receipt.checks.push({name,passed:true,...(detail||{})});console.log('PASS '+name);}catch(error){receipt.checks.push({name,passed:false,error:error.message});console.log('FAIL '+name+': '+error.message);}}
async function fixture({path='/contacto.html', config=ready, width=1440, height=1000, host='sollahms.cl', saved, providerCookies=false, apiResult={ok:true,providerAccepted:true,deliveryConfirmed:false}}={}) {
  const context=await browser.newContext({viewport:{width,height}, serviceWorkers:'block'});
  const log={sdk:[],config:0,api:[],externalBlocked:[],navigations:0,errors:[]};
  await context.addInitScript(({consentKey,saved})=>{window.__measurementEvents=[];window.addEventListener('sollahms:measurement',e=>window.__measurementEvents.push(e.detail));if(saved&&!localStorage.getItem(consentKey))localStorage.setItem(consentKey,JSON.stringify(saved));},{consentKey,saved});
  await context.route('**/*', async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.hostname==='www.googletagmanager.com'||url.hostname==='www.clarity.ms') {
      const provider=url.hostname==='www.clarity.ms'?'clarity':'ga4';
      log.sdk.push({provider,tagId:provider==='ga4'?url.searchParams.get('id'):url.pathname.split('/').pop(),documentPath:new URL(request.frame().url()).pathname});
      const cookie=provider==='ga4'?'_ga=synthetic':'_clck=synthetic';
      return route.fulfill({status:200,contentType:'text/javascript',body:'window.__localSDKMocks=(window.__localSDKMocks||0)+1;'+(providerCookies?`document.cookie=${JSON.stringify(cookie+'; Path=/; Secure; SameSite=Lax')};`:'')});
    }
    if(url.hostname!==host){log.externalBlocked.push({origin:url.origin,resourceType:request.resourceType()});return route.fulfill({status:204,body:''});}
    if(url.pathname==='/data/site-measurement.json'){log.config++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(config)});}
    if(url.pathname.startsWith('/api/')){
      if(request.method()==='POST'){log.api.push({path:url.pathname,method:'POST'});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(apiResult)});}
      return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Synthetic unavailable reference; no network"}'});
    }
    let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return route.fulfill({status:400,body:''});}
    const file=resolve(staticRoot,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(staticRoot+'/'))return route.fulfill({status:403,body:''});
    try {return route.fulfill({status:200,contentType:mime[extname(file)]||'application/octet-stream',body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
  });
  const page=await context.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>log.errors.push(e.message));page.on('framenavigated',frame=>{if(frame===page.mainFrame())log.navigations++;});
  await page.goto('https://'+host+path,{waitUntil:'networkidle'});
  if(host==='sollahms.cl'&&!path.startsWith('/proyectos'))await page.waitForFunction(()=>!!window.SollahmsMeasurement);
  return {context,page,log,close:()=>context.close()};
}
async function choose(page,analytics,replay){await page.evaluate(({analytics,replay})=>window.SollahmsMeasurement.choose({analytics,replay}),{analytics,replay});await page.waitForTimeout(80);}
async function open(page){await page.locator('.site-measurement-launcher').click();await assert.equal(await page.locator('dialog').evaluate(e=>e.open),true);}
async function fillCommercial(page,form){for(const [name,value] of Object.entries({nombre:'Ensayo Sintetico',rut:'12.345.678-5',correo:'qa@example.invalid',telefono:'912345678',mensaje:'Consulta sintetica local sin envio real.'})){const input=page.locator(`${form} [name="${name}"]`);if(await input.count()){await input.evaluate(el=>{let details=el.closest('details');while(details){details.open=true;details=details.parentElement?.closest('details');}});await input.fill(value);}}await page.locator(`${form} [name=consent]`).check();}

try {
  if (!supplement && !configured) {
  for(const width of [1440,390,320])await test('disabled UI / no overflow '+width,async()=>{
    const f=await fixture({config:shipped,width,height:900});try{
      assert.equal(f.log.sdk.length,0);assert.equal(await f.page.locator('.site-measurement-banner').isVisible(),false);
      await open(f.page);assert.equal(await f.page.locator('input[name=analytics]').isDisabled(),true);assert.equal(await f.page.locator('input[name=replay]').isDisabled(),true);
      const dimensions=await f.page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth,dialog:document.querySelector('dialog').getBoundingClientRect().toJSON()}));
      assert.ok(dimensions.doc<=dimensions.viewport+1,JSON.stringify(dimensions));assert.ok(dimensions.dialog.left>=0&&dimensions.dialog.right<=dimensions.viewport+1);
      if(width===390){const filename='browser-disabled-390.png';await f.page.screenshot({path:resolve(outDir,filename)});receipt.screenshots.push(filename);}
      await f.page.keyboard.press('Escape');assert.equal(await f.page.locator('dialog').evaluate(e=>e.open),false);
      assert.equal(await f.page.evaluate(()=>document.activeElement.classList.contains('site-measurement-launcher')),true);
      return {viewport:width,providerRequests:f.log.sdk.length,pageErrors:f.log.errors};
    }finally{await f.close();}
  });
  await test('ready, unanswered and rejection load no SDK',async()=>{const f=await fixture();try{assert.equal(f.log.sdk.length,0);await f.page.locator('[data-choice=reject]').first().click();assert.equal(f.log.sdk.length,0);assert.equal(await f.page.evaluate(()=>window.dataLayer),undefined);return {providerRequests:0};}finally{await f.close();}});
  await test('independent unchecked UI: Analytics only and sanitized page_view',async()=>{const f=await fixture({path:'/contacto.html?email=synthetic%40example.invalid#synthetic'});try{await f.page.locator('[data-choice=configure]').click();assert.equal(await f.page.locator('input[name=analytics]').isChecked(),false);assert.equal(await f.page.locator('input[name=replay]').isChecked(),false);await f.page.locator('input[name=analytics]').check();await f.page.locator('[data-choice=save]').click();await f.page.waitForFunction(()=>window.SollahmsMeasurement.status().analyticsActive);assert.deepEqual(f.log.sdk.map(x=>x.provider),['ga4']);const q=await f.page.evaluate(()=>window.dataLayer.map(x=>[...x]));const p=q.filter(x=>x[0]==='event'&&x[1]==='page_view');assert.equal(p.length,1);assert.equal(p[0][2].page_location,'https://sollahms.cl/contacto.html');assert.ok(!JSON.stringify(q).includes('synthetic'));return {providerRequests:1,pageViews:1};}finally{await f.close();}});
  await test('Replay only, root masked before SDK; withdrawal reloads and prevents restart',async()=>{const f=await fixture();try{await open(f.page);await f.page.locator('input[name=replay]').check();await f.page.locator('[data-choice=save]').click();await f.page.waitForFunction(()=>window.__localSDKMocks===1);assert.deepEqual(f.log.sdk.map(x=>x.provider),['clarity']);assert.equal(await f.page.locator('html').getAttribute('data-clarity-mask'),'True');const before=f.log.navigations;await open(f.page);await Promise.all([f.page.waitForNavigation({waitUntil:'networkidle'}),f.page.locator('dialog [data-choice=reject]').click()]);await f.page.waitForFunction(()=>!!window.SollahmsMeasurement);assert.equal(f.log.navigations,before+1);assert.equal(f.log.sdk.length,1);assert.equal(await f.page.evaluate(()=>window.SollahmsMeasurement.status().replayConsented),false);return {providerRequests:1,reloaded:true};}finally{await f.close();}});
  const saved={version:ready.consentVersion,analytics:true,replay:true,updatedAt:Date.now()-1000,expiresAt:Date.now()+3600000};
  for(const path of ['/comparador-hipotecario.html','/guia-hipotecaria.html','/cuando-comprar-propiedad.html','/centro-orientacion.html','/beneficios-tributarios-inmobiliarios.html'])await test('Clarity forbidden on financial tool '+path,async()=>{const f=await fixture({path,saved});try{await f.page.waitForFunction(()=>window.SollahmsMeasurement.status().analyticsActive);assert.deepEqual(f.log.sdk.map(x=>x.provider),['ga4']);return {providerRequests:1,clarityRequests:0};}finally{await f.close();}});
  await test('Preview guard returns before config fetch and UI mount',async()=>{const f=await fixture({host:'project-wrapp-synthetic.vercel.app'});try{assert.equal(f.log.config,0);assert.equal(f.log.sdk.length,0);assert.equal(await f.page.locator('.site-measurement').count(),0);return {configRequests:0,providerRequests:0};}finally{await f.close();}});
  await test('rejecting analytics leaves real advisory controller functional with local accepted API',async()=>{const f=await fixture();try{await choose(f.page,false,false);await f.page.waitForFunction(()=>!document.querySelector('#advisory-fields').disabled);await fillCommercial(f.page,'#advisory-form');await f.page.locator('#advisory-form button[type=submit]').click();await f.page.waitForFunction(()=>document.querySelector('#advisory-status').dataset.state==='success');assert.equal(f.log.api.length,1);assert.equal(f.log.sdk.length,0);const ev=await f.page.evaluate(()=>window.__measurementEvents);assert.equal(ev.length,1);assert.equal(ev[0].parameters.acceptance_kind,'provider_accepted');return {mockApiRequests:1,providerRequests:0,syntheticAcknowledgementOnly:true};}finally{await f.close();}});
  await test('unconfirmed advisory response produces no accepted event',async()=>{const f=await fixture({apiResult:{ok:true}});try{await choose(f.page,true,false);await fillCommercial(f.page,'#advisory-form');await f.page.locator('#advisory-form button[type=submit]').click();await f.page.waitForFunction(()=>document.querySelector('#advisory-status').textContent.includes('No pudimos confirmar'));assert.equal(f.log.api.length,1);const events=await f.page.evaluate(()=>window.dataLayer.map(x=>[...x]).filter(x=>x[0]==='event'&&x[1]==='contact_request_accepted'));assert.equal(events.length,0);return {mockApiRequests:1,acceptedEvents:0};}finally{await f.close();}});
  await test('real orientation controller emits only local accepted acknowledgement',async()=>{const f=await fixture({path:'/centro-orientacion.html'});try{await choose(f.page,true,false);await fillCommercial(f.page,'#orientation-contact');await f.page.locator('#orientation-contact button[type=submit]').click();await f.page.waitForFunction(()=>document.querySelector('#contact-status').textContent.startsWith('Solicitud aceptada'));const events=await f.page.evaluate(()=>window.dataLayer.map(x=>[...x]).filter(x=>x[0]==='event'&&x[1]==='contact_request_accepted'));assert.equal(f.log.api.length,1);assert.equal(events.length,1);assert.equal(events[0][2].form_kind,'orientation');return {mockApiRequests:1,acceptedEvents:1};}finally{await f.close();}});
  await test('real collaboration controller emits only local accepted acknowledgement',async()=>{const f=await fixture({path:'/trabaja-con-nosotros.html'});try{await choose(f.page,true,false);await f.page.locator('[data-collaboration-choice=inmobiliaria]').click();const form=f.page.locator('[data-collaboration-form=inmobiliaria]');await form.locator('[name=correo]').fill('qa@example.invalid');await form.locator('[name=consent]').check();await form.locator('button[type=submit]').click();await f.page.waitForFunction(()=>document.querySelector('[data-collaboration-form=inmobiliaria] [role=status]').dataset.state==='success');const events=await f.page.evaluate(()=>window.dataLayer.map(x=>[...x]).filter(x=>x[0]==='event'&&x[1]==='contact_request_accepted'));assert.equal(f.log.api.length,1);assert.equal(events.length,1);assert.equal(events[0][2].form_kind,'collaboration_company');return {mockApiRequests:1,acceptedEvents:1};}finally{await f.close();}});
  } else if (supplement) {
    receipt.supplements='browser-receipt.json';
    receipt.supplementNote='Only changed behavior tested on v3; earlier 16 checks remain explicitly identified with v2 SHA and were not rerun.';
    receipt.configSha256=createHash('sha256').update(await readFile(resolve(staticRoot,'data/site-measurement.json'))).digest('hex');
    await test('Entorno blocks replay before and after its real filter changes URL',async()=>{
      const f=await fixture({path:'/entorno-desarrollo-urbano.html'});try{
        await choose(f.page,false,true);
        await f.page.waitForFunction(()=>!document.querySelector('#uw-region').disabled&&document.querySelector('#uw-region').options.length>1);
        assert.equal(f.log.sdk.length,0);
        await f.page.locator('#uw-region').selectOption({index:1});
        await f.page.waitForFunction(()=>new URL(location.href).searchParams.has('region'));
        assert.equal(f.log.sdk.length,0);
        assert.equal(await f.page.evaluate(()=>window.SollahmsMeasurement.status().replayStarted),false);
        assert.equal(await f.page.evaluate(()=>typeof window.clarity),'undefined');
        return {providerRequests:0,urlParametersObserved:['region'],realUrbanFilterOperated:true};
      }finally{await f.close();}
    });
    await test('trusted tool input emits one fixed kind; programmatic events and raw values are excluded',async()=>{
      const f=await fixture({path:'/guia-hipotecaria.html'});try{
        await choose(f.page,true,false);await f.page.waitForFunction(()=>window.SollahmsMeasurement.status().analyticsActive);
        await f.page.locator('#gh-example').click();
        await f.page.locator('#gh-propertyUf').evaluate(el=>el.dispatchEvent(new Event('input',{bubbles:true})));
        assert.equal(await f.page.evaluate(()=>window.dataLayer.filter(x=>x[0]==='event'&&x[1]==='tool_interaction').length),0);
        await f.page.locator('#gh-propertyUf').focus();await f.page.keyboard.press('Meta+A');await f.page.keyboard.type('5432');await f.page.keyboard.press('Tab');
        await f.page.locator('#gh-annualRatePercent').focus();await f.page.keyboard.press('Meta+A');await f.page.keyboard.type('4.15');await f.page.keyboard.press('Tab');
        const events=await f.page.evaluate(()=>window.dataLayer.map(x=>[...x]).filter(x=>x[0]==='event'&&x[1]==='tool_interaction'));
        assert.equal(events.length,1);assert.equal(events[0][2].tool_kind,'mortgage_guide');
        assert.deepEqual(Object.keys(events[0][2]).sort(),['page_location','page_referrer','page_title','send_to','source_group','tool_kind']);
        assert.ok(!JSON.stringify(events).includes('5432'));assert.ok(!JSON.stringify(events).includes('4.15'));
        return {trustedKeyboardUsed:true,programmaticEvents:0,toolEvents:1,toolKind:'mortgage_guide',rawValuesSerialized:false};
      }finally{await f.close();}
    });
    await test('standalone mortgage guide still calculates with analytics rejected',async()=>{
      const f=await fixture({path:'/guia-hipotecaria.html'});try{
        await choose(f.page,false,false);await f.page.locator('#gh-example').click();
        await f.page.locator('#gh-propertyUf').focus();await f.page.keyboard.press('Meta+A');await f.page.keyboard.type('3500');
        await f.page.locator('#gh-calculate').click();
        assert.equal(await f.page.locator('#gh-results').isVisible(),true);
        assert.equal(await f.page.locator('#gh-propertyUf').inputValue(),'3500');
        assert.equal(f.log.sdk.length,0);assert.equal(await f.page.evaluate(()=>typeof window.dataLayer),'undefined');
        return {calculated:true,providerRequests:0,analyticsRejected:true};
      }finally{await f.close();}
    });
  } else if (release) {
    receipt.supplements=['browser-verified-receipt.json'];
    receipt.supplementNote='One focused smoke after adding SameSite=Lax;Secure; prior eight browser cases and unit checks retain separate receipts. Mock does not certify actual provider cookie creation or runtime SDK behavior.';
    receipt.configSha256=createHash('sha256').update(await readFile(resolve(staticRoot,'data/site-measurement.json'))).digest('hex');
    await test('release consent gate, actual GA4 ID, global/destination Secure flags and withdrawal',async()=>{
      const f=await fixture({config:shipped});try{
        assert.equal(f.log.sdk.length,0);assert.equal((await f.context.cookies()).length,0);
        assert.equal(await f.page.evaluate(()=>typeof window.dataLayer),'undefined');
        await f.page.locator('.site-measurement-banner [data-choice=configure]').click();
        await f.page.locator('input[name=analytics]').check();await f.page.locator('[data-choice=save]').click();
        await f.page.waitForFunction(()=>window.SollahmsMeasurement.status().analyticsActive);
        assert.deepEqual(f.log.sdk.map(x=>({provider:x.provider,tagId:x.tagId})),[{provider:'ga4',tagId:'G-LTFBQKVNY2'}]);
        const q=await f.page.evaluate(()=>window.dataLayer.map(x=>[...x]));
        const idx=q.findIndex(x=>x[0]==='set'&&typeof x[1]==='object'&&x[1].send_page_view===false);
        assert.ok(idx>=0&&idx<q.findIndex(x=>x[0]==='js')&&idx<q.findIndex(x=>x[0]==='consent'&&x[1]==='update'));
        assert.deepEqual(q[idx][1],q.find(x=>x[0]==='config')[2]);assert.equal(q[idx][1].cookie_flags,'SameSite=Lax;Secure');
        assert.equal(q[idx][1].cookie_expires,60*86400);assert.equal(q[idx][1].cookie_domain,'none');assert.equal(q[idx][1].cookie_update,false);
        assert.equal(q.filter(x=>x[0]==='event'&&x[1]==='page_view').length,1);
        await open(f.page);await Promise.all([f.page.waitForNavigation({waitUntil:'networkidle'}),f.page.locator('dialog [data-choice=reject]').click()]);
        await f.page.waitForFunction(()=>!!window.SollahmsMeasurement);
        assert.equal(f.log.sdk.length,1);assert.equal(await f.page.evaluate(()=>window.SollahmsMeasurement.status().analyticsConsented),false);
        return {preConsentSdkRequests:0,preConsentCookies:0,mockSdkRequests:1,correctPublicId:true,globalSettingsBeforeGrantAndJs:true,globalAndDestinationSettingsIdentical:true,cookieFlags:'SameSite=Lax;Secure',reloadedWithoutRestart:true};
      }finally{await f.close();}
    });
  } else if (configured) {
    receipt.supplements=['browser-receipt.json','browser-supplement-receipt.json'];
    if (verified) receipt.supplements.push('browser-configured-receipt.json');
    receipt.supplementNote='Only final enabled configuration/UI/provider selection/revocation/Preview gates retested. Earlier v2/v3 receipts retain their own runtime/config state.';
    if (verified) receipt.supplementNote+=' Regression rerun after adding global settings before grant/js/SDK; real SDK evaluation remains separate.';
    receipt.configSha256=createHash('sha256').update(await readFile(resolve(staticRoot,'data/site-measurement.json'))).digest('hex');
    receipt.publicTagIds={analytics:shipped.analytics.measurementId,replay:shipped.replay.projectId};
    assert.equal(shipped.enabled,true);assert.equal(shipped.analytics.enabled,true);assert.equal(shipped.replay.enabled,true);
    assert.equal(shipped.analytics.measurementId,'G-LTFBQKVNY2');assert.equal(shipped.replay.projectId,'zg5i98wnxm');
    for (const width of [1440,390,320]) await test('enabled actual configuration banner/dialog '+width,async()=>{
      const f=await fixture({config:shipped,width,height:900});try{
        assert.equal(f.log.sdk.length,0);assert.equal((await f.context.cookies()).length,0);
        assert.equal(await f.page.locator('.site-measurement-banner').isVisible(),true);
        for(const choice of ['accept','reject','configure'])assert.equal(await f.page.locator(`.site-measurement-banner [data-choice=${choice}]`).isVisible(),true);
        let bounds=await f.page.locator('.site-measurement-banner').evaluate(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:innerWidth,doc:document.documentElement.scrollWidth}));
        assert.ok(bounds.left>=0&&bounds.right<=bounds.width+1&&bounds.doc<=bounds.width+1,JSON.stringify(bounds));
        if(width===390){const filename=verified?'browser-verified-banner-390.png':'browser-enabled-banner-390.png';await f.page.screenshot({path:resolve(outDir,filename)});receipt.screenshots.push(filename);}
        await f.page.locator('.site-measurement-banner [data-choice=configure]').click();
        for(const name of ['analytics','replay']){const input=f.page.locator(`input[name=${name}]`);assert.equal(await input.isDisabled(),false);assert.equal(await input.isChecked(),false);}
        bounds=await f.page.locator('dialog').evaluate(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:innerWidth,doc:document.documentElement.scrollWidth}));
        assert.ok(bounds.left>=0&&bounds.right<=bounds.width+1&&bounds.doc<=bounds.width+1,JSON.stringify(bounds));
        if(width===320){const filename=verified?'browser-verified-dialog-320.png':'browser-enabled-dialog-320.png';await f.page.screenshot({path:resolve(outDir,filename)});receipt.screenshots.push(filename);}
        await f.page.keyboard.press('Escape');assert.equal(await f.page.locator('dialog').evaluate(e=>e.open),false);
        assert.equal(await f.page.evaluate(()=>document.activeElement.dataset.choice),'configure');
        assert.equal(f.log.sdk.length,0);assert.equal((await f.context.cookies()).length,0);
        return {viewport:width,providerRequests:0,cookies:0,unpremarkedIndependentOptions:true};
      }finally{await f.close();}
    });
    await test('reject actual enabled providers creates no SDK or provider cookies',async()=>{
      const f=await fixture({config:shipped});try{await f.page.locator('.site-measurement-banner [data-choice=reject]').click();assert.equal(f.log.sdk.length,0);assert.equal((await f.context.cookies()).length,0);const c=await f.page.evaluate(key=>JSON.parse(localStorage.getItem(key)),consentKey);assert.equal(c.analytics,false);assert.equal(c.replay,false);assert.equal(await f.page.evaluate(()=>typeof window.gtag),'undefined');assert.equal(await f.page.evaluate(()=>typeof window.clarity),'undefined');return {providerRequests:0,cookies:0};}finally{await f.close();}
    });
    await test('select Analytics only uses correct actual public measurement ID with local SDK mock',async()=>{
      const f=await fixture({config:shipped});try{await f.page.locator('[data-choice=configure]').click();await f.page.locator('input[name=analytics]').check();await f.page.locator('[data-choice=save]').click();await f.page.waitForFunction(()=>window.SollahmsMeasurement.status().analyticsActive);assert.deepEqual(f.log.sdk.map(x=>({provider:x.provider,tagId:x.tagId})),[{provider:'ga4',tagId:'G-LTFBQKVNY2'}]);assert.equal(await f.page.evaluate(()=>typeof window.clarity),'undefined');const q=await f.page.evaluate(()=>window.dataLayer.map(x=>[...x]));assert.equal(q.filter(x=>x[0]==='event'&&x[1]==='page_view').length,1);assert.equal(q.find(x=>x[0]==='config')[1],'G-LTFBQKVNY2');if(verified){const global=q.findIndex(x=>x[0]==='set'&&typeof x[1]==='object'&&x[1].send_page_view===false);assert.ok(global>=0);assert.ok(global<q.findIndex(x=>x[0]==='js'));assert.ok(global<q.findIndex(x=>x[0]==='consent'&&x[1]==='update'));assert.deepEqual(q[global][1],q.find(x=>x[0]==='config')[2]);assert.equal(q[global][1].page_location,'https://sollahms.cl/contacto.html');assert.equal(q[global][1].cookie_expires,60*86400);assert.equal(q[global][1].cookie_update,false);}return {providerRequests:1,provider:'ga4',actualPublicTagIdVerified:true,...(verified?{globalSettingsBeforeGrantAndJs:true,globalAndDestinationSettingsIdentical:true}:{})};}finally{await f.close();}
    });
    await test('select Replay only uses correct actual public project ID with local SDK mock',async()=>{
      const f=await fixture({config:shipped});try{await f.page.locator('[data-choice=configure]').click();await f.page.locator('input[name=replay]').check();await f.page.locator('[data-choice=save]').click();await f.page.waitForFunction(()=>window.__localSDKMocks===1);assert.deepEqual(f.log.sdk.map(x=>({provider:x.provider,tagId:x.tagId})),[{provider:'clarity',tagId:'zg5i98wnxm'}]);assert.equal(await f.page.evaluate(()=>typeof window.gtag),'undefined');assert.equal(await f.page.locator('html').getAttribute('data-clarity-mask'),'True');return {providerRequests:1,provider:'clarity',actualPublicTagIdVerified:true};}finally{await f.close();}
    });
    await test('accept both actual IDs then withdraw: removes synthetic cookies and reloads without restarting SDK',async()=>{
      const f=await fixture({config:shipped,providerCookies:true});try{await f.page.locator('.site-measurement-banner [data-choice=accept]').click();await f.page.waitForFunction(()=>window.__localSDKMocks===2);assert.deepEqual(f.log.sdk.map(x=>x.tagId).sort(),['G-LTFBQKVNY2','zg5i98wnxm'].sort());assert.deepEqual((await f.context.cookies()).map(x=>x.name).sort(),['_clck','_ga']);const before=f.log.navigations;await open(f.page);await Promise.all([f.page.waitForNavigation({waitUntil:'networkidle'}),f.page.locator('dialog [data-choice=reject]').click()]);await f.page.waitForFunction(()=>!!window.SollahmsMeasurement);assert.equal(f.log.navigations,before+1);assert.equal(f.log.sdk.length,2);assert.equal((await f.context.cookies()).length,0);const c=await f.page.evaluate(()=>window.SollahmsMeasurement.status());assert.equal(c.analyticsConsented,false);assert.equal(c.replayConsented,false);return {mockSdkRequests:2,syntheticCookiesDeleted:true,reloaded:true,providerRestarts:0};}finally{await f.close();}
    });
    await test('actual enabled configuration remains unreachable from Preview guard',async()=>{
      const f=await fixture({config:shipped,host:'project-wrapp-synthetic.vercel.app'});try{assert.equal(f.log.config,0);assert.equal(f.log.sdk.length,0);assert.equal(await f.page.locator('.site-measurement').count(),0);assert.equal((await f.context.cookies()).length,0);return {configRequests:0,providerRequests:0,cookies:0};}finally{await f.close();}
    });
  }
} finally {await browser.close();receipt.passed=receipt.checks.every(x=>x.passed);receipt.summary={passed:receipt.checks.filter(x=>x.passed).length,total:receipt.checks.length};await mkdir(outDir,{recursive:true});await writeFile(resolve(outDir,release?'browser-release-receipt.json':verified?'browser-verified-receipt.json':configured?'browser-configured-receipt.json':supplement?'browser-supplement-receipt.json':'browser-receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt.summary));}
if(!receipt.passed)process.exitCode=1;
