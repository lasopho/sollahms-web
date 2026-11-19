import {createRequire} from 'node:module';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require = createRequire(import.meta.url);
const {chromium} = require('/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const cacheDir = '/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-measurement-private/sdk-cache';
const sdk = await readFile(cacheDir + '/gtag-G-LTFBQKVNY2.js');
const staticRoot = process.env.SDK_STATIC_ROOT;
const original = await readFile(staticRoot ? staticRoot + '/assets/js/site-measurement.mjs' : new URL('../assets/js/site-measurement.mjs', import.meta.url), 'utf8');
const config = await readFile(staticRoot ? staticRoot + '/data/site-measurement.json' : new URL('../data/site-measurement.json', import.meta.url));
const sha = data => createHash('sha256').update(data).digest('hex');
const globalSet = `window.gtag('set', {send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false, cookie_domain:'none', cookie_expires:60*86400, cookie_update:false, page_location:canonical(), page_referrer:referrer.origin, page_title:'SDK cached test', campaign_id:'', campaign_source:'', campaign_medium:'', campaign_name:'', campaign_term:'', campaign_content:''});\n    `;
const jsLine = "window.gtag('js', new Date(now()));";
const configStart = original.indexOf("    window.gtag('config', config.analytics.measurementId, {");
const configEnd = original.indexOf('\n    try {\n      await loadScript(', configStart);
const configBlock = original.slice(configStart, configEnd);
const variants = [
  ['candidate-verified', original],
  ['candidate-release', original],
  ['baseline', original],
  ['global-set-before-js', original.replace(jsLine, globalSet + jsLine)],
  ['global-set-before-consent', original.replace("window.gtag('consent', 'default', {...DENIED});", globalSet + "window.gtag('consent', 'default', {...DENIED});")],
  ['config-before-js', original.replace(jsLine, '').replace(configBlock, configBlock + '\n    ' + jsLine)],
  ['global-set-no-config', original.replace(jsLine, globalSet + jsLine).replace(configBlock, '')],
  ['default-no-consent', original], ['rejected', original],
].filter(([name]) => !process.env.SDK_VARIANTS || process.env.SDK_VARIANTS.split(',').includes(name));
const markers = ['SDK_PRIVATE_MESSAGE', '1000005-K', '7000000', 'private-conversation', 'qa-sdk@example.invalid'];
const hashedMarkers = ['qa-sdk@example.invalid', '1000005-K', '+56900000000'].map(value => sha(value.trim().toLowerCase()));
const report = {observedAtUTC:new Date().toISOString(), originalModuleSHA256:sha(original), sdkSHA256:sha(sdk), sdkBytes:sdk.length,
  staticRoot:staticRoot || null, configSHA256:sha(config),
  policy:'Cached SDK only; every browser request fulfilled locally or aborted. No route.fetch, no provider request, no collect sent.', beaconsSent:0, providerGETs:0, variants:[]};
const browser = await chromium.launch({headless:true, executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--disable-background-networking','--disable-sync','--no-first-run']});
try {
 for (const [name, moduleText] of variants) for (const dirty of [true, false]) {
  const context = await browser.newContext({serviceWorkers:'block'});
  const result = {name, dirty, requests:[], events:[], errors:[], cachedSDKLoads:0};
  await context.route('**/*', async route => {
   const request=route.request(), url=new URL(request.url());
   if(url.origin==='https://sollahms.cl'&&request.method()==='GET') {
    if(url.pathname==='/contacto.html') return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><script type="module" src="/assets/js/site-measurement.mjs"></script></head><body><h1>SDK test</h1><form id="advisory-form"><input type="email" value="qa-sdk@example.invalid"><input type="text" value="SDK_PRIVATE_MESSAGE"><button>Submit</button></form><a id="external" href="https://example.invalid/file.pdf?message=SDK_PRIVATE_MESSAGE">External</a><div style="height:5000px">Test</div><script>document.addEventListener("submit",e=>e.preventDefault());document.getElementById("external").addEventListener("click",e=>e.preventDefault());</script></body></html>'});
    if(url.pathname==='/assets/js/site-measurement.mjs') return route.fulfill({contentType:'text/javascript',body:moduleText});
    if(url.pathname==='/data/site-measurement.json') return route.fulfill({contentType:'application/json',body:config});
   }
   if(url.origin==='https://www.googletagmanager.com'&&url.pathname==='/gtag/js'&&url.searchParams.get('id')==='G-LTFBQKVNY2') {result.cachedSDKLoads++;return route.fulfill({contentType:'text/javascript',body:sdk});}
   if(/google-analytics\.com$/.test(url.hostname)&&url.pathname.includes('collect')) {
    for(const line of request.postData()?.split('\n') || ['']) {
     const params=new URLSearchParams(url.search); for(const [key,value] of new URLSearchParams(line)) params.set(key,value);
     const text=[...params].map(([key,value])=>key+'='+value).join('&');
     result.events.push({en:params.get('en'),dl:params.get('dl'),dr:params.get('dr'),keys:[...new Set(params.keys())].sort(),markers:markers.filter(marker=>text.includes(marker)),
       hashedIdentityMarkers:hashedMarkers.filter(marker=>text.includes(marker)), identityParameterKeys:[...params.keys()].filter(key=>/^(?:em$|ph$|user_data|sha256|up\.|upn\.|ep\.user_data)/.test(key))});
    }
    return route.fulfill({status:204,body:''});
   }
   result.requests.push({host:url.hostname,path:url.pathname,method:request.method(),action:'aborted'});return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',error=>result.errors.push(error.message));
  const url='https://sollahms.cl/contacto.html'+(dirty?'?rut=1000005-K&mensaje=SDK_PRIVATE_MESSAGE&income=7000000#unsafe':'');
  await page.goto(url,{waitUntil:'domcontentloaded',referer:dirty?'https://chatgpt.com/c/private-conversation?message=SDK_PRIVATE_MESSAGE':'https://www.google.com/'});
  await page.waitForFunction(()=>!!window.SollahmsMeasurement);
  result.beforeConsent={cachedSDKLoads:result.cachedSDKLoads,cookies:(await context.cookies()).map(cookie=>cookie.name),events:result.events.length};
  if(name!=='default-no-consent') await page.evaluate(accepted=>window.SollahmsMeasurement.choose({analytics:accepted,replay:false}),name!=='rejected');
  await page.waitForTimeout(2500);
  result.cookies=(await context.cookies()).map(cookie=>({name:cookie.name,domain:cookie.domain,path:cookie.path,
    expires:cookie.expires,remainingSeconds:Math.round(cookie.expires-Date.now()/1000),sameSite:cookie.sameSite,secure:cookie.secure}));
  result.initialEvents=result.events.length;
  await page.locator('input[type=email]').fill('qa-sdk@example.invalid'); await page.locator('button').filter({hasText:'Submit'}).click();
  await page.locator('#external').click();
  await page.evaluate(()=>{window.scrollTo(0,4500);history.replaceState(null,'','?rut=1000005-K&mensaje=SDK_PRIVATE_MESSAGE&income=7000000#after-history');});
  await page.evaluate(()=>window.SollahmsMeasurement.track('contact_request_accepted',{form_kind:'advisory',acceptance_kind:'provider_accepted'}));
  await page.waitForTimeout(3000);
  if(['candidate-verified','candidate-release'].includes(name)) await page.waitForTimeout(6000);
  await page.waitForTimeout(1000);
  const beforeClose=result.events.length;
  await page.close({runBeforeUnload:true});await new Promise(resolve=>setTimeout(resolve,1000));
  result.pageCloseEvents=result.events.slice(beforeClose).map(event=>event.en);
  result.pageViews=result.events.filter(event=>event.en==='page_view').length;
  result.rawMarkers=result.events.flatMap(event=>event.markers);
  result.allLocationsClean=result.events.every(event=>event.dl==='https://sollahms.cl/contacto.html');
  result.allReferrersClean=result.events.every(event=>event.dr===(dirty?'https://chatgpt.com':'https://www.google.com'));
  result.identityDataDetected=result.events.some(event=>event.hashedIdentityMarkers.length||event.identityParameterKeys.length);
  result.cookieLifetime60Days=result.cookies.filter(cookie=>cookie.name.startsWith('_ga')).every(cookie=>cookie.remainingSeconds>=5183900&&cookie.remainingSeconds<=5184000);
  report.variants.push(result); await context.close();
  console.log(JSON.stringify({name,dirty,events:result.events.map(event=>event.en),pageViews:result.pageViews,rawMarkers:result.rawMarkers,allLocationsClean:result.allLocationsClean}));
 }
} finally {await browser.close();await writeFile(cacheDir+'/'+(process.env.SDK_RECEIPT || 'variants-receipt.json'),JSON.stringify(report,null,2)+'\n');}
