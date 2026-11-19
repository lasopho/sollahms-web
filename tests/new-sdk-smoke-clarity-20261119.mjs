import {createRequire} from 'node:module';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const require=createRequire(import.meta.url),{chromium}=require('/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const privateRoot='/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-measurement-private';
const root=privateRoot+'/candidate-release/.vercel/output/static',cache=privateRoot+'/sdk-cache';
const moduleBytes=await readFile(root+'/assets/js/site-measurement.mjs'),configBytes=await readFile(root+'/data/site-measurement.json');
const tag=await readFile(cache+'/clarity-tag-zg5i98wnxm.js'),sdk=await readFile(cache+'/clarity-0.8.80-beta.js');
const sha=data=>createHash('sha256').update(data).digest('hex');
const result={observedAtUTC:new Date().toISOString(),artifactStaticRoot:root,moduleSHA256:sha(moduleBytes),configSHA256:sha(configBytes),
  tagSHA256:sha(tag),sdkSHA256:sha(sdk),providerRequests:0,beaconsSent:0,contactsSent:0,cachedScriptLoads:[],blocked:[],collections:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--disable-background-networking','--disable-sync','--no-first-run']});
try{
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.origin==='https://sollahms.cl'&&req.method()==='GET'){
   if(u.pathname==='/contacto.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><script type="module" src="/assets/js/site-measurement.mjs"></script></head><body><h1>SDK test</h1><form id="advisory-form"><input type="email" value="qa-clarity@example.invalid"><input type="text" value="QA_CLARITY_SYNTHETIC_RUT_1000005K"></form><p>QA_CLARITY_SYNTHETIC_MESSAGE</p></body></html>'});
   if(u.pathname==='/assets/js/site-measurement.mjs')return route.fulfill({contentType:'text/javascript',body:moduleBytes});
   if(u.pathname==='/data/site-measurement.json')return route.fulfill({contentType:'application/json',body:configBytes});
  }
  if(u.href==='https://www.clarity.ms/tag/zg5i98wnxm'){result.cachedScriptLoads.push(u.href);return route.fulfill({contentType:'text/javascript',body:tag});}
  if(u.href==='https://scripts.clarity.ms/0.8.80-beta/clarity.js'){result.cachedScriptLoads.push(u.href);return route.fulfill({contentType:'text/javascript',body:sdk});}
  if(/(?:^|\.)clarity\.ms$/.test(u.hostname)&&u.pathname==='/collect'){
   const bytes=req.postDataBuffer()||Buffer.alloc(0);let text=bytes.toString();let encoding='plain';
   try{if(bytes[0]===0x1f&&bytes[1]===0x8b){text=gunzipSync(bytes).toString();encoding='gzip';}}catch{encoding='undecoded';}
   result.collections.push({method:req.method(),host:u.hostname,path:u.pathname,bytes:bytes.length,encoding,
    markerMatches:['qa-clarity@example.invalid','QA_CLARITY_SYNTHETIC_RUT_1000005K','QA_CLARITY_SYNTHETIC_MESSAGE'].filter(value=>text.includes(value)),action:'locally_fulfilled204_not_sent'});
   return route.fulfill({status:204,body:''});
  }
  result.blocked.push({host:u.hostname,path:u.pathname,method:req.method(),action:'aborted'});return route.abort();
 });
 const page=await context.newPage();page.on('pageerror',error=>result.errors.push(error.message));
 await page.goto('https://sollahms.cl/contacto.html',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.SollahmsMeasurement);await page.waitForTimeout(600);
 result.beforeConsent={sdkLoads:result.cachedScriptLoads.length,collect:result.collections.length,cookies:(await context.cookies()).map(cookie=>cookie.name)};
 await page.evaluate(()=>window.SollahmsMeasurement.choose({analytics:false,replay:false}));await page.waitForTimeout(600);
 result.afterRejection={sdkLoads:result.cachedScriptLoads.length,collect:result.collections.length,cookies:(await context.cookies()).map(cookie=>cookie.name)};
 await page.evaluate(()=>window.SollahmsMeasurement.choose({analytics:false,replay:true}));
 await page.waitForFunction(()=>!!window.clarity?.v,null,{timeout:10000});
 await page.evaluate(()=>{window.__qaClarityConsent=[];window.clarity('metadata',(_n,_e,consent)=>window.__qaClarityConsent.push({analytics_Storage:consent?.analytics_Storage,ad_Storage:consent?.ad_Storage}),false,true,true);});
 await page.locator('input[type=email]').fill('qa-clarity@example.invalid');await page.locator('input[type=text]').fill('QA_CLARITY_SYNTHETIC_RUT_1000005K');
 await page.waitForTimeout(4000);
 result.state=await page.evaluate(()=>({version:window.clarity.v,mask:document.documentElement.getAttribute('data-clarity-mask'),metadataConsent:window.__qaClarityConsent,status:window.SollahmsMeasurement.status()}));
 result.cookies=(await context.cookies()).map(cookie=>({name:cookie.name,domain:cookie.domain,path:cookie.path,expires:cookie.expires,secure:cookie.secure,sameSite:cookie.sameSite}));
 await page.close({runBeforeUnload:true});await new Promise(resolve=>setTimeout(resolve,500));await context.close();
 result.status=result.beforeConsent.sdkLoads===0&&result.afterRejection.sdkLoads===0&&result.state.mask==='True'&&result.state.metadataConsent.some(c=>c.analytics_Storage==='granted'&&c.ad_Storage==='denied')&&result.collections.every(c=>!c.markerMatches.length)?'passed_cached_clarity_sdk':'needs_review';
}catch(error){result.status='needs_review';result.error=String(error.stack).slice(0,1000);}
finally{await browser.close();await writeFile(cache+'/clarity-smoke-receipt.json',JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify(result));
