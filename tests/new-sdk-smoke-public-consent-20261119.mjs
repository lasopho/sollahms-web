import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const privateRoot='/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-measurement-private/sdk-cache';
const google=await readFile(privateRoot+'/gtm-version2-20261119/gtag-G-LTFBQKVNY2.js');
const clarityTag=await readFile(privateRoot+'/clarity-tag-zg5i98wnxm.js'),claritySDK=await readFile(privateRoot+'/clarity-0.8.80-beta.js');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(sha(google),'f076a4977e78d63cde568168dc77fb6821e2f5fff68a82efae5242184d511ce2');
const receipt={observedAtUTC:new Date().toISOString(),url:'https://sollahms.cl/',status:'running',
  publicationT0:'2026-11-19T14:07:21.935-03:00',profile:'new ephemeral Chrome context, no user profile',
  policy:'Only necessary GETs on production apex reach network, no redirects/auth/cookies. Every external request is cached SDK fulfillment, local204 collect, or abort. No forms or commercial CTAs used.',
  googleSDKCacheSHA256:sha(google),publicGETs:[],cachedSDKLoads:[],interceptedCollections:[],blockedRequests:[],consoleErrors:[],pageErrors:[],phases:[],beaconsSent:0,contactsSent:0};
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--disable-background-networking','--disable-sync','--no-first-run']});
try{
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  const publicPath=url.pathname==='/'||url.pathname==='/data/site-measurement.json'||/^\/assets\/.*\.(?:css|js|mjs|woff2?)$/.test(url.pathname);
  if(url.origin==='https://sollahms.cl'&&request.method()==='GET'&&publicPath){
   const headers={...request.headers(),cookie:''};delete headers.authorization;
   const response=await route.fetch({maxRedirects:0,timeout:15000,headers});
   const body=await response.body();
   receipt.publicGETs.push({path:url.pathname,status:response.status(),bytes:body.length,sha256:sha(body)});
   if(response.status()!==200)return route.abort();
   if(url.pathname==='/')assert.ok(body.toString().includes('/assets/js/site-measurement.mjs'),'Published measurement installation must exist; do not test old86B');
   if(url.pathname==='/assets/js/site-measurement.mjs')assert.equal(sha(body),'15388b73d792cb2796bdefc5807826793922bc9760a8bdefda7be0411503ed89');
   if(url.pathname==='/data/site-measurement.json')assert.equal(sha(body),'302c12004cdd37b76fa5fb91889a04dbe7b9ed95cfc0cac8697530ad15e39902');
   const responseHeaders={...response.headers()};delete responseHeaders['set-cookie'];
   return route.fulfill({status:response.status(),headers:responseHeaders,body});
  }
  if(url.href==='https://www.googletagmanager.com/gtag/js?id=G-LTFBQKVNY2'){receipt.cachedSDKLoads.push({provider:'google',url:url.href});return route.fulfill({contentType:'text/javascript',body:google});}
  if(url.href==='https://www.clarity.ms/tag/zg5i98wnxm'){receipt.cachedSDKLoads.push({provider:'clarity-tag',url:url.href});return route.fulfill({contentType:'text/javascript',body:clarityTag});}
  if(url.href==='https://scripts.clarity.ms/0.8.80-beta/clarity.js'){receipt.cachedSDKLoads.push({provider:'clarity-sdk',url:url.href});return route.fulfill({contentType:'text/javascript',body:claritySDK});}
  if(/(?:^|\.)(?:google-analytics\.com|analytics\.google\.com|clarity\.ms)$/.test(url.hostname)&&url.pathname.includes('collect')){
   const params=new URLSearchParams(url.search);for(const [key,value]of new URLSearchParams(request.postData()||''))if(['en','dl','dr'].includes(key))params.set(key,value);
   receipt.interceptedCollections.push({host:url.hostname,path:url.pathname,method:request.method(),event:params.get('en'),location:params.get('dl'),referrer:params.get('dr'),bodyBytes:request.postDataBuffer()?.length||0,action:'locally_fulfilled204_not_sent'});
   return route.fulfill({status:204,body:''});
  }
  receipt.blockedRequests.push({host:url.hostname,path:url.pathname,method:request.method(),type:request.resourceType(),action:'aborted'});return route.abort();
 });
 const page=await context.newPage();page.on('pageerror',error=>receipt.pageErrors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')receipt.consoleErrors.push(message.text().slice(0,250));});
 const cookieNames=async()=> (await context.cookies()).filter(c=>/^_ga(?:_|$)|^_clck$|^_clsk$/.test(c.name)).map(c=>c.name);
 const consent=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sollahms.measurement-consent.v1')));
 const ready=()=>page.waitForFunction(()=>!!window.SollahmsMeasurement,null,{timeout:15000});
 const configure=async()=>{await page.locator('.site-measurement-launcher').click();await page.locator('dialog.site-measurement-dialog').waitFor({state:'visible'});};
 const save=()=>page.getByRole('button',{name:'Guardar preferencias',exact:true}).click();
 await page.goto('https://sollahms.cl/',{waitUntil:'domcontentloaded',timeout:30000});await ready();
 await page.locator('.site-measurement-banner').waitFor({state:'visible'});await page.waitForTimeout(500);
 const initial={name:'default',bannerVisible:await page.locator('.site-measurement-banner').isVisible(),sdkLoads:receipt.cachedSDKLoads.length,cookies:await cookieNames(),collect:receipt.interceptedCollections.length};
 assert.equal(initial.sdkLoads,0);assert.equal(initial.cookies.length,0);assert.equal(initial.collect,0);receipt.phases.push(initial);
 await page.getByRole('button',{name:'Rechazar ambas',exact:true}).click();await page.waitForTimeout(400);
 const rejected={name:'reject',consent:await consent(),sdkLoads:receipt.cachedSDKLoads.length,cookies:await cookieNames(),collect:receipt.interceptedCollections.length};
 assert.equal(rejected.consent.analytics,false);assert.equal(rejected.consent.replay,false);assert.equal(rejected.sdkLoads,0);assert.equal(rejected.cookies.length,0);assert.equal(rejected.collect,0);receipt.phases.push(rejected);
 await configure();await page.locator('dialog input[name=analytics]').check();await page.locator('dialog input[name=replay]').uncheck();await save();
 await page.waitForTimeout(8000);
 const googleEvents=receipt.interceptedCollections.filter(c=>c.host.endsWith('google-analytics.com'));
 const analytics={name:'analytics-only',consent:await consent(),sdkLoads:[...receipt.cachedSDKLoads],googlePageViews:googleEvents.filter(c=>c.event==='page_view').length,collections:googleEvents,cookies:await cookieNames(),state:await page.evaluate(()=>window.SollahmsMeasurement.status())};
 assert.equal(analytics.googlePageViews,1);assert.ok(googleEvents.every(c=>c.location==='https://sollahms.cl/'&&!c.referrer));
 assert.equal(receipt.cachedSDKLoads.filter(c=>c.provider.startsWith('clarity')).length,0);assert.equal(analytics.consent.analytics,true);assert.equal(analytics.consent.replay,false);receipt.phases.push(analytics);
 await configure();await page.locator('dialog input[name=analytics]').uncheck();
 const priorSDKs=receipt.cachedSDKLoads.length;
 await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:20000}),save()]);await ready();await page.waitForTimeout(500);
 const withdrawn={name:'withdraw-analytics-reloaded',consent:await consent(),newSDKLoads:receipt.cachedSDKLoads.length-priorSDKs,cookies:await cookieNames(),state:await page.evaluate(()=>window.SollahmsMeasurement.status())};
 assert.equal(withdrawn.consent.analytics,false);assert.equal(withdrawn.consent.replay,false);assert.equal(withdrawn.newSDKLoads,0);assert.equal(withdrawn.cookies.length,0);assert.equal(withdrawn.state.analyticsActive,false);receipt.phases.push(withdrawn);
 await configure();await page.locator('dialog input[name=analytics]').uncheck();await page.locator('dialog input[name=replay]').check();await save();
 await page.waitForFunction(()=>!!window.clarity?.v,null,{timeout:10000});
 await page.evaluate(()=>{window.__qaPublicClarity=[];window.clarity('metadata',(_n,_e,c)=>window.__qaPublicClarity.push({analytics_Storage:c?.analytics_Storage,ad_Storage:c?.ad_Storage}),false,true,true);});
 await page.waitForTimeout(3500);
 const replay={name:'replay-only',consent:await consent(),state:await page.evaluate(()=>({mask:document.documentElement.getAttribute('data-clarity-mask'),consent:window.__qaPublicClarity,gaType:typeof window.gtag,status:window.SollahmsMeasurement.status()})),cookies:await cookieNames()};
 assert.equal(replay.consent.analytics,false);assert.equal(replay.consent.replay,true);assert.equal(replay.state.mask,'True');assert.equal(replay.state.gaType,'undefined');assert.ok(replay.state.consent.some(c=>c.analytics_Storage==='granted'&&c.ad_Storage==='denied'));receipt.phases.push(replay);
 await configure();await page.locator('dialog input[name=replay]').uncheck();
 const priorReplaySDKs=receipt.cachedSDKLoads.length;
 await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:20000}),save()]);await ready();
 const replayWithdrawn={name:'withdraw-replay-reloaded',consent:await consent(),newSDKLoads:receipt.cachedSDKLoads.length-priorReplaySDKs,cookies:await cookieNames()};
 assert.equal(replayWithdrawn.consent.replay,false);assert.equal(replayWithdrawn.newSDKLoads,0);assert.equal(replayWithdrawn.cookies.length,0);receipt.phases.push(replayWithdrawn);
 receipt.status='passed_public_installation_and_consent_with_cached_sdks';await context.close();
}catch(error){receipt.status='failed';receipt.error=String(error.stack).slice(0,1800);}
finally{await browser.close();receipt.limits=['Real public homepage HTML/CSS/JS/config and its CSP were exercised, while SDK bytes were substituted from the verified caches.','This does not demonstrate real Google/Microsoft collection or dashboard receipt. All measurement beacons were locally fulfilled204; no form or commercial CTA was used.','Images, remote fonts, APIs and unrelated external network were aborted; this is a consent installation check, not full visual/function regression.'];await writeFile(new URL('../docs/measurement-20261119/publication/public-consent-verification.json',import.meta.url),JSON.stringify(receipt,null,2)+'\n');}
console.log(JSON.stringify({status:receipt.status,publicGETs:receipt.publicGETs.length,cachedSDKLoads:receipt.cachedSDKLoads.length,blockedCollections:receipt.interceptedCollections.length,beaconsSent:0,phases:receipt.phases.map(p=>p.name),error:receipt.error}));
if(receipt.status==='failed')process.exitCode=1;
