import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const root=resolve(new URL('../../../..',import.meta.url).pathname),outRoot=resolve(new URL('.',import.meta.url).pathname);
const args=process.argv.slice(2),targetPath=args[0];
if(!targetPath)throw new Error('Usage: node qa.mjs /absolute/path/to/target-isolated.json or target-public.json');
const target=JSON.parse(await readFile(targetPath,'utf8'));
const {phase,origin,deployment}=target;
assert(['isolated','public'].includes(phase),'Expected explicit isolated or public phase');
assert(/^dpl_[A-Za-z0-9]+$/.test(deployment),'Exact new Centro deployment ID required');
assert(!['dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w','dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5','dpl_33R4uenGQAt2cSVUGEJC7VsoF9yS'].includes(deployment),'Old production and Preview must never be mistaken for new Production');
if(phase==='public'){assert.equal(origin,'https://sollahms.cl');assert.equal(target.promotionConfirmed,true,'Root must confirm promotion before public checks');}
else{const u=new URL(origin);assert(u.protocol==='https:'&&u.origin===origin&&u.hostname.endsWith('.vercel.app'),'Exact immutable Vercel origin required');}
const out=join(outRoot,phase);await mkdir(out,{recursive:true});
const report={phase,origin,deployment,mode:phase==='public'?'Real public Chrome network responses; no local source fulfillment':'Authenticated real isolatedProduction responses via existing Vercel CLI transport; no local source fulfillment',widths:[],console:[],pageErrors:[],failedResources:[],httpFailures:[],blockedMutations:[],blockedAPIs:[],administrativeToolbarSuppressed:[],blockedExternal:[],ufFixtureRequests:0,contactSubmitEvents:0,activeWidth:null,activeCase:null,startedAt:new Date().toISOString()};
let browser,transport;
function save(){return writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');}
function expectedConsole(e){return e.text.includes('503')&&e.location.url===origin+'/api/uf';}
async function check(page,name,fn){report.activeCase=name;await fn();report.widths.at(-1).cases.push(name);}
async function fill(page,id,values){for(const [key,value]of Object.entries(values)){const e=page.locator(`#${id} [name="${key}"]`);if(await e.evaluate(n=>n.tagName==='SELECT'))await e.selectOption(String(value));else await e.fill(String(value));}}
async function step(page,n){assert.equal(await page.locator('#journey-position').innerText(),`ETAPA ${n} DE 6`);assert.equal(await page.locator('#journey-prev').isDisabled(),n===1);assert.equal(await page.locator('#journey-next').isDisabled(),n===6);assert.equal(await page.locator('#journey-steps [aria-current=step]').count(),1);}
console.log(JSON.stringify({phase,deployment,status:'STARTING'}));
try{
 if(phase==='isolated'){
  const {nativeTransport}=await import('../../native-transport.mjs');
  transport=await nativeTransport({origin,deployment,root:join(root,'.vercel/centro-auditoria-20261116/production-browser')});
 }
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const q=route.request(),u=new URL(q.url());
  if(!['GET','HEAD'].includes(q.method())){report.blockedMutations.push({method:q.method(),path:u.pathname});return route.abort();}
  if(u.origin==='https://vercel.live'&&u.pathname==='/_next-live/feedback/feedback.js'){report.administrativeToolbarSuppressed.push({path:u.pathname,reason:'Administrative deployment toolbar excluded from site QA; no external request forwarded'});return route.fulfill({status:204,contentType:'text/javascript',body:''});}
  if(u.origin!==origin){report.blockedExternal.push({origin:u.origin,path:u.pathname});return route.abort();}
  if(u.pathname==='/api/uf'){report.ufFixtureRequests++;return route.fulfill({status:503,contentType:'application/json',body:'{}'});}
  if(u.pathname.startsWith('/api/')){report.blockedAPIs.push(u.pathname);return route.abort();}
  return transport?transport.handle(route):route.continue();
 });
 await context.addInitScript(()=>{window.__centroContactSubmits=0;document.addEventListener('submit',e=>{if(e.target?.id==='orientation-contact'){window.__centroContactSubmits++;e.preventDefault();e.stopImmediatePropagation();}},true);});
 for(const width of [1440,1024,768,390,320]){
  report.activeWidth=width;report.widths.push({width,cases:[]});await save();
  const page=await context.newPage();await page.setViewportSize({width,height:1000});
  page.on('console',m=>{if(['error','warning'].includes(m.type()))report.console.push({width,type:m.type(),text:m.text(),location:m.location()});});
  page.on('pageerror',e=>report.pageErrors.push({width,message:e.message}));
  page.on('requestfailed',q=>report.failedResources.push({width,url:q.url(),error:q.failure()?.errorText}));
  page.on('response',r=>{if(r.status()>=400)report.httpFailures.push({width,url:r.url(),status:r.status(),expectedFixture:new URL(r.url()).pathname==='/api/uf'});});
  report.activeCase='Load exact delivered page';
  await page.goto(origin+'/centro-orientacion.html',{timeout:120000});
  await page.waitForFunction(()=>!document.querySelector('#budget-form fieldset').disabled,{},{timeout:90000});await page.evaluate(()=>document.fonts.ready);
  console.log(JSON.stringify({phase,width,status:'PAGE_LOADED'}));
  await check(page,'Delivered responsive layout, readable result panel and names',async()=>{
   const state=await page.evaluate(()=>{const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('main,main section,main input,main select,main textarea,main button,main a,footer,header')].filter(e=>visible(e)&&!e.closest('.trap')).filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(e=>({tag:e.tagName,id:e.id})),emptyControls:[...document.querySelectorAll('a,button,summary')].filter(visible).filter(e=>!(e.getAttribute('aria-label')||e.textContent).trim()&&!e.querySelector('img[alt]')).map(e=>e.id),result:{background:getComputedStyle(document.querySelector('.result-panel')).backgroundColor,color:getComputedStyle(document.querySelector('#budget-point-title')).color}};});
   assert.equal(state.viewport,width);assert.equal(state.scrollWidth,width);assert.deepEqual(state.overflow,[]);assert.deepEqual(state.emptyControls,[]);assert.equal(state.result.background,'rgb(255, 255, 255)');assert.equal(state.result.color,'rgb(0, 50, 41)');report.widths.at(-1).layout=state;
  });
  await page.screenshot({path:join(out,`page-${width}.png`),fullPage:true});
  await page.locator('.result-panel').screenshot({path:join(out,`punto-partida-${width}.png`)});
  const input={income:2000000,debt:100000,savings:100000000,monthlySavings:0,horizon:0,uf:40000,burden:25,down:20,years:25,rate:0,convention:'effective'};
  await check(page,'Budget independent zero-rate reference:3750UF',async()=>{await fill(page,'budget-form',input);await page.locator('#budget-form button[type=submit]').click();assert.equal(await page.locator('#budget-result .big-number').innerText(),'3.750 UF');assert.match(await page.locator('#budget-result').innerText(),/UF manual/);});
  await page.locator('.result-panel').screenshot({path:join(out,`resultado-${width}.png`)});
  await check(page,'All six journey stages forward/back preserve scenario and result',async()=>{
   const values=await page.locator('#budget-form').evaluate(f=>[...new FormData(f)]);await step(page,1);
   for(let n=2;n<=6;n++){await page.locator('#journey-next').click();await step(page,n);}
   const next=await page.locator('#journey-next').evaluate(e=>({text:e.textContent.trim(),color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,opacity:getComputedStyle(e).opacity}));assert.equal(next.text,'Siguiente →');assert.equal(next.color,'rgb(75, 96, 89)');assert.equal(next.opacity,'1');report.widths.at(-1).terminalNext=next;
   await page.locator('.journey-content').screenshot({path:join(out,`recorrido-final-${width}.png`)});
   for(let n=5;n>=1;n--){await page.locator('#journey-prev').click();await step(page,n);}
   assert.deepEqual(await page.locator('#budget-form').evaluate(f=>[...new FormData(f)]),values);assert.equal(await page.locator('#budget-result .big-number').innerText(),'3.750 UF');
  });
  await check(page,'Budget reset clears client scenario and result',async()=>{await page.locator('#budget-form button[type=reset]').click();await page.waitForFunction(()=>!document.querySelector('#budget-result .big-number'));assert.equal(await page.locator('#budget-form [name=income]').inputValue(),'');assert.equal(await page.locator('#budget-form [name=rate]').inputValue(),'');assert.equal(await page.locator('#budget-uf').inputValue(),'');assert.match(await page.locator('#budget-result').innerText(),/Completa tu escenario/);});
  await check(page,'Quote calculation and independent reset',async()=>{await fill(page,'quotes-form',{price:3000,down:20,years:25,convention:'nominal',rateA:0,rateB:5});await page.locator('#quotes-form button[type=submit]').click();assert.equal(await page.locator('#quotes-result .metrics dd').first().innerText(),'8 UF');await page.locator('#quotes-form button[type=reset]').click();await page.waitForFunction(()=>document.querySelector('#quotes-result').textContent.includes('Lo que debes pedir por escrito'));assert.equal(await page.locator('#quotes-form [name=rateA]').inputValue(),'');});
  await check(page,'Checklist marks, progress and reset',async()=>{await page.locator('#check-items input').first().check();await page.locator('#check-items input').last().check();assert.equal(await page.locator('#check-progress').getAttribute('value'),'2');await page.locator('#reset-checklist').click();assert.equal(await page.locator('#check-progress').getAttribute('value'),'0');assert.equal(await page.evaluate(()=>localStorage.length),0);});
  if(width<=900)await check(page,'Mobile menu opens and closes by Escape',async()=>{const toggle=page.locator('.menu-toggle');await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');await page.locator('#mobile-menu a[href="/contacto.html"]').focus();await page.keyboard.press('Escape');assert.equal(await toggle.getAttribute('aria-expanded'),'false');});
  await check(page,'Keyboard financial field focus remains visible',async()=>{await page.locator('#budget-form [name=income]').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.name),'debt');assert.equal(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineWidth),'3px');});
  await check(page,'Contact never submitted; no personal or financial values persisted',async()=>{const submits=await page.evaluate(()=>window.__centroContactSubmits);report.contactSubmitEvents+=submits;assert.equal(submits,0);assert.equal(await page.evaluate(()=>localStorage.length),0);assert(!page.url().includes('2000000'));});
  await check(page,'Delivered resources and console have no unexpected failure',async()=>{assert.deepEqual(report.console.filter(e=>e.width===width&&!expectedConsole(e)),[]);assert.deepEqual(report.pageErrors.filter(e=>e.width===width),[]);assert.deepEqual(report.failedResources.filter(e=>e.width===width),[]);assert.deepEqual(report.httpFailures.filter(e=>e.width===width&&!e.expectedFixture),[]);assert.deepEqual(report.blockedMutations,[]);assert.deepEqual(report.blockedAPIs,[]);assert.deepEqual(report.blockedExternal,[]);});
  report.widths.at(-1).passed=true;await page.close();await save();console.log(JSON.stringify({phase,width,status:'PASS',cases:report.widths.at(-1).cases.length}));
 }
 await context.close();report.activeWidth=null;report.activeCase=null;report.unexpectedConsole=report.console.filter(e=>!expectedConsole(e));assert.equal(report.widths.length,5);assert.equal(report.contactSubmitEvents,0);report.passed=true;
}catch(error){report.passed=false;report.failure={message:error.message,stack:error.stack};console.error(JSON.stringify({phase,status:'FAILED',width:report.activeWidth,case:report.activeCase,message:error.message}));throw error;}
finally{await browser?.close();await transport?.close();report.finishedAt=new Date().toISOString();await save();}
console.log(JSON.stringify({phase,deployment,passed:report.passed,widths:report.widths.length,cases:report.widths.reduce((n,w)=>n+w.cases.length,0),contactSubmitEvents:report.contactSubmitEvents,report:join(out,'results.json')}));
