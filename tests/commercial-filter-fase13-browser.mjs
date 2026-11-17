/** Focused F12-03/F12-04 regression: standalone localhost server, no API or external requests. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const checkout=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=process.env.F13_BROWSER_OUTPUT??'/private/tmp/sollahms-fase13/after/browser';
const executablePath=process.env.F13_CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.woff2':'font/woff2'};
const report={checkout,checks:[],transitions:[],pageErrors:[],blockedWrites:[],blockedReads:[],serverWrites:[],screenshots:[]};
const server=createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){report.serverWrites.push(req.method);res.writeHead(405).end();return;}
  const target=path.resolve(checkout,'.'+new URL(req.url,'http://localhost').pathname);
  if(!target.startsWith(checkout+path.sep)){res.writeHead(403).end();return;}
  try{const data=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]??'application/octet-stream'}).end(req.method==='HEAD'?undefined:data);}
  catch{res.writeHead(404).end();}
});
await mkdir(output,{recursive:true});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const base='http://127.0.0.1:'+server.address().port;
report.base=base;
let browser,context,failure;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aU1sAAAAASUVORK5CYII=','base64');
const ready=async page=>{await page.waitForSelector('#project-grid[aria-busy="false"]',{state:'attached'});await page.waitForFunction(()=>!document.getElementById('search').disabled);};
const openFilters=page=>page.evaluate(()=>{document.getElementById('catalog-options').open=true;document.getElementById('catalog-more').open=true;});
const snapshot=page=>page.evaluate(()=>{
  const summary=document.getElementById('capacity-summary');
  return {mode:document.getElementById('evidence-mode').value,count:document.getElementById('project-count').textContent,summary:summary.textContent,summaryVisible:summary.checkVisibility(),summaryHidden:summary.hidden,toggleHidden:document.getElementById('capacity-toggle').hidden,formHidden:document.getElementById('capacity-form').hidden,financeCount:document.querySelectorAll('.capacity-result').length,gridIds:[...document.querySelectorAll('#project-grid [data-project]')].map(node=>node.dataset.project),mapIds:[...new Set([...document.querySelectorAll('#map-project-choice option')].map(node=>node.value).filter(Boolean).concat([...document.querySelectorAll('.catalog-map-pending li a')].map(node=>new URL(node.href).pathname.slice(1,-5))))].sort()};
});
const check=async(name,run)=>{await run();report.checks.push({name,passed:true});console.log('PASS '+name);};
try{
  browser=await chromium.launch({headless:true,executablePath});
  context=await browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block',reducedMotion:'reduce'});
  await context.route('**/*',route=>{
    const request=route.request(),url=new URL(request.url());
    if(!['GET','HEAD'].includes(request.method())){report.blockedWrites.push({method:request.method(),path:url.pathname});return route.abort();}
    // Stub tiles without contacting their provider; all other external reads and the UF API are blocked.
    if(url.hostname==='tile.openstreetmap.org')return route.fulfill({status:200,contentType:'image/png',body:png});
    if(url.origin!==base||url.pathname.startsWith('/api/')){report.blockedReads.push({method:request.method(),origin:url.origin,path:url.pathname});return route.abort();}
    return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',error=>report.pageErrors.push(error.message));
  await page.goto(base+'/proyectos.html',{waitUntil:'domcontentloaded'});await ready(page);
  await page.waitForFunction(()=>!document.getElementById('capacity-toggle').disabled);
  await page.locator('#capacity-toggle').click();
  await page.fill('#capacity-income','2000000');await page.fill('#capacity-rate','4.5');
  await page.locator('#capacity-submit').click();
  await page.waitForFunction(()=>document.getElementById('capacity-summary').textContent.includes('Evaluación de 131 proyectos'));
  const publishedSummary=await page.locator('#capacity-summary').textContent();
  const publishedIds=(await snapshot(page)).gridIds;
  assert.equal(publishedIds.length,131);
  const preparedIds=publishedIds.filter(slug=>slug!=='own');

  for(const view of ['cards','list','map','split'])await check(view+': published → prepared → published restores only the published capacity context',async()=>{
    await page.locator('[data-catalog-view="'+view+'"]').click();
    if(['map','split'].includes(view))await page.waitForSelector('#map-project-choice');
    const before=await snapshot(page);
    assert.equal(before.mode,'published');assert.equal(before.summary,publishedSummary);assert(before.summaryVisible);assert(!before.summaryHidden);assert(!before.toggleHidden);
    if(view==='map')assert.deepEqual(before.gridIds,[]);
    else{assert.deepEqual(before.gridIds,publishedIds);assert.equal(before.financeCount,131);}
    if(['map','split'].includes(view))assert.deepEqual(before.mapIds,[...publishedIds].sort());

    await openFilters(page);await page.selectOption('#evidence-mode','prepared');
    const prepared=await snapshot(page);
    assert.equal(prepared.mode,'prepared');assert.equal(prepared.count,'130 de 131 proyectos');
    assert(prepared.summaryHidden);assert(!prepared.summaryVisible);assert(prepared.toggleHidden);assert(prepared.formHidden);assert.equal(prepared.financeCount,0);
    assert(!await page.locator('.capacity-badge:visible, .catalog-finance:visible').count());
    assert.equal((await page.locator('.capacity-search').innerText()).includes('Orden por compatibilidad'),false);
    if(view==='map')assert.deepEqual(prepared.gridIds,[]);
    else assert.deepEqual([...prepared.gridIds].sort(),[...preparedIds].sort());
    if(['map','split'].includes(view))assert.deepEqual(prepared.mapIds,[...preparedIds].sort());
    if(view==='cards'){
      await page.locator('.capacity-search').scrollIntoViewIfNeeded();
      await page.screenshot({path:output+'/prepared-without-published-summary.png'});report.screenshots.push('prepared-without-published-summary.png');
    }

    await page.selectOption('#evidence-mode','published');
    const restored=await snapshot(page);
    assert.equal(restored.mode,'published');assert.equal(restored.count,'131 proyectos');assert.equal(restored.summary,publishedSummary);
    assert(!restored.summaryHidden);assert(restored.summaryVisible);assert(!restored.toggleHidden);assert(restored.formHidden);
    if(view==='map')assert.deepEqual(restored.gridIds,[]);
    else{assert.deepEqual(restored.gridIds,publishedIds);assert.equal(restored.financeCount,131);}
    if(['map','split'].includes(view))assert.deepEqual(restored.mapIds,[...publishedIds].sort());
    assert.equal(await page.locator('#capacity-income').inputValue(),'2000000');
    assert.equal(await page.locator('#capacity-rate').inputValue(),'4.5');
    report.transitions.push({view,before,prepared,restored});
  });
  // Returning to published preserves the local form values and permits reopening the same scenario.
  await page.locator('#capacity-toggle').click();assert(await page.locator('#capacity-form').isVisible());
  await page.close();

  await check('failed prepared GET visibly explains the public fallback after URL rewrite and closed filters',async()=>{
    const isolated=await context.newPage();isolated.on('pageerror',error=>report.pageErrors.push(error.message));
    await isolated.route('**/data/commercial-filter-evidence-leben.json',route=>route.abort());
    report.fallbackRequestedUrl=base+'/proyectos.html?q=Living+Town&evidencia=prepared&vista=cards';
    await isolated.goto(report.fallbackRequestedUrl,{waitUntil:'domcontentloaded'});await ready(isolated);
    const warning=isolated.locator('#advanced-data-status');
    assert.equal(await isolated.locator('#evidence-mode').inputValue(),'published');
    assert(await isolated.locator('#evidence-mode option[value="prepared"]').isDisabled());
    assert(!new URL(isolated.url()).searchParams.has('evidencia'));
    assert.match(await warning.textContent(),/Las referencias Leben no pudieron cargar\. Se muestran los datos publicados\./);
    assert.equal(await warning.getAttribute('role'),'status');assert.equal(await warning.getAttribute('aria-live'),'polite');
    assert(await warning.isVisible());
    assert.equal(await warning.evaluate(node=>node.closest('details')),null);
    assert.equal(await isolated.locator('#catalog-more').evaluate(node=>node.open),false);
    assert.equal(await isolated.locator('#project-grid [data-project="edificio-living-town"]').count(),1);
    assert.match(await isolated.locator('.catalog-price').innerText(),/Desde UF 2\.812/);
    const warningText=await warning.textContent();
    await isolated.evaluate(()=>{document.getElementById('catalog-more').open=false;document.getElementById('catalog-options').open=false;});
    assert(await warning.isVisible());
    await isolated.locator('[data-catalog-view="list"]').click();assert(await warning.isVisible());
    await isolated.locator('#clear-filters').click();assert(await warning.isVisible());assert.equal(await warning.textContent(),warningText);
    assert.equal(await isolated.locator('#project-grid [data-project]').count(),131);
    await isolated.setViewportSize({width:390,height:1100});
    await isolated.evaluate(()=>document.getElementById('catalog-options').open=false);
    assert(await warning.isVisible());
    await warning.scrollIntoViewIfNeeded();await isolated.screenshot({path:output+'/visible-published-fallback-closed-filters.png'});report.screenshots.push('visible-published-fallback-closed-filters.png');
    report.fallback=await isolated.evaluate(()=>({url:location.href,mode:document.getElementById('evidence-mode').value,warning:document.getElementById('advanced-data-status').textContent,warningVisible:document.getElementById('advanced-data-status').checkVisibility(),warningClosedAncestor:document.getElementById('advanced-data-status').closest('details:not([open])')?.id??null,role:document.getElementById('advanced-data-status').getAttribute('role'),count:document.getElementById('project-count').textContent}));
    await isolated.close();
  });
  await check('no JavaScript errors, writes or unblocked UF requests',async()=>{
    assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.blockedWrites,[]);assert.deepEqual(report.serverWrites,[]);
    assert(report.blockedReads.some(request=>request.path==='/api/uf'));
  });
}catch(error){failure=error;report.failure={message:error.message,stack:error.stack};console.error(error);}
finally{
  await context?.close();await browser?.close();await new Promise(resolve=>server.close(resolve));
  report.serverClosed=!server.listening;
  await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');
}
if(failure)process.exitCode=1;
