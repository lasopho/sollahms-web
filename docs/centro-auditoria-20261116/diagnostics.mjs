import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {extname,join,resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const root=resolve(new URL('../..',import.meta.url).pathname),origin='https://sollahms.cl';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.png':'image/png'};
const report={method:'Narrow local candidate diagnostics in isolated Chrome at 390px; all network requests fulfilled from candidate bytes, UF replaced by intentional503, nonGET/HEAD and external requests blocked. Existing functional matrix not repeated.',console:[],pageErrors:[],resourceFailures:[],httpFailures:[],mutationsBlocked:[],externalBlocked:[],anchors:[],startedAt:new Date().toISOString()};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
async function contextFor(javaScriptEnabled){
 const c=await browser.newContext({javaScriptEnabled,reducedMotion:'reduce',serviceWorkers:'block',viewport:{width:390,height:1000}});
 await c.route('**/*',async route=>{
  const q=route.request(),u=new URL(q.url());
  if(!['GET','HEAD'].includes(q.method())){report.mutationsBlocked.push({method:q.method(),path:u.pathname});return route.abort();}
  if(u.origin!==origin){report.externalBlocked.push(u.origin);return route.abort();}
  if(u.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{}'});
  try{const path=join(root,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));return route.fulfill({status:200,contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:'Missing local candidate asset'});}
 });return c;
}
try{
 const context=await contextFor(true),page=await context.newPage();
 page.on('console',message=>{if(['error','warning'].includes(message.type()))report.console.push({type:message.type(),text:message.text(),location:message.location()});});
 page.on('pageerror',e=>report.pageErrors.push(e.message));
 page.on('requestfailed',q=>report.resourceFailures.push({url:q.url(),error:q.failure()?.errorText}));
 page.on('response',r=>{if(r.status()>=400)report.httpFailures.push({url:r.url(),status:r.status(),expectedFixture:new URL(r.url()).pathname==='/api/uf'});});
 await page.addInitScript(()=>{
  window.__diagnosticShifts=[];
  if(PerformanceObserver.supportedEntryTypes.includes('layout-shift'))new PerformanceObserver(list=>{for(const e of list.getEntries())window.__diagnosticShifts.push({value:e.value,hadRecentInput:e.hadRecentInput,startTime:e.startTime,sources:(e.sources||[]).map(s=>({node:s.node?.id||s.node?.tagName||null,previousRect:{x:s.previousRect.x,y:s.previousRect.y,width:s.previousRect.width,height:s.previousRect.height},currentRect:{x:s.currentRect.x,y:s.currentRect.y,width:s.currentRect.width,height:s.currentRect.height}}))});}).observe({type:'layout-shift',buffered:true});
 });
 await page.goto(origin+'/centro-orientacion.html');await page.waitForFunction(()=>!document.querySelector('#budget-form fieldset').disabled);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(750);
 report.initialLayout=await page.evaluate(()=>{const entries=window.__diagnosticShifts||[];return {supported:PerformanceObserver.supportedEntryTypes.includes('layout-shift'),observation:'Initial navigation through fonts.ready plus750ms before interactions; not a field CoreWebVitals measurement.',fonts:[...document.fonts].filter(x=>x.status==='loaded').map(x=>({family:x.family,status:x.status})),fontReady:document.fonts.status,entries,initialShiftSum:entries.filter(x=>!x.hadRecentInput).reduce((s,e)=>s+e.value,0)};});
 const count=await page.locator('a[href^="#"]').count();
 for(let i=0;i<count;i++){
  const a=page.locator('a[href^="#"]').nth(i),href=await a.getAttribute('href');
  if(href==='#')continue;
  await page.evaluate(()=>{history.replaceState(null,'',location.pathname);scrollTo(0,0);});
  if(await a.evaluate(e=>e.classList.contains('skip'))){await a.focus();await a.press('Enter');}else await a.click();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const row=await page.evaluate(href=>{const e=document.getElementById(decodeURIComponent(href.slice(1))),r=e?.getBoundingClientRect(),h=document.querySelector('header').getBoundingClientRect();return {href,hash:location.hash,targetExists:!!e,targetTop:r?.top,headerBottom:h.bottom,clearOfStickyHeader:r?r.top>=h.bottom-1:false};},href);
  row.label=(await a.innerText()).trim();assert.equal(row.hash,href);assert.ok(row.targetExists&&row.clearOfStickyHeader,JSON.stringify(row));report.anchors.push(row);
 }
 report.unexpectedConsole=report.console.filter(x=>!(x.text.includes('503')&&x.location.url===origin+'/api/uf'));
 assert.deepEqual(report.unexpectedConsole,[]);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.resourceFailures,[]);assert.deepEqual(report.httpFailures.filter(x=>!x.expectedFixture),[]);await context.close();
 const nojs=await contextFor(false),fallback=await nojs.newPage();await fallback.goto(origin+'/centro-orientacion.html');
 const noScriptText=await fallback.locator('noscript').innerText();
 const disabled=await fallback.locator('fieldset[disabled][data-interactive]').count();
 const sections=await fallback.locator('main section[id]').evaluateAll(nodes=>nodes.map(e=>e.id));
 const navigation=await fallback.locator('.section-nav a').evaluateAll(nodes=>nodes.map(e=>({text:e.textContent.trim(),href:e.getAttribute('href')})));
 assert.equal(disabled,4);assert.match(noScriptText,/Activa JavaScript/);assert.equal(sections.length,8);assert.equal(navigation.length,6);await fallback.locator('.section-nav a[href="#preguntas"]').click();assert.match(fallback.url(),/#preguntas$/);assert.ok(await fallback.locator('#preguntas').isVisible());
 report.noJavaScript={disabledForms:disabled,explanation:noScriptText.trim(),staticSections:sections,navigation,nativeSectionLinkExecuted:'#preguntas',limits:'Interactive calculator results, generated checklist and journey details require JavaScript and remain inactive. On mobile the header menu requires JavaScript; section navigation, advisory link, Contacto fallback and footer links remain available. No claim that dynamic tools work without JavaScript.'};
 assert.ok(await fallback.locator('noscript a[href="/contacto.html"]').isVisible());
 await nojs.close();assert.deepEqual(report.mutationsBlocked,[]);report.status='PASS';report.finishedAt=new Date().toISOString();
}finally{await browser.close();await writeFile(join(root,'docs/centro-auditoria-20261116/diagnostics.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,anchors:report.anchors.length,unexpectedConsole:report.unexpectedConsole?.length,unexpectedHTTP:report.httpFailures.filter(x=>!x.expectedFixture).length,initialShiftSum:report.initialLayout?.initialShiftSum,noJavaScriptForms:report.noJavaScript?.disabledForms}));
