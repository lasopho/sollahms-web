/** Local, read-only browser QA. Run with F10_BASE_URL and optional F10_BROWSER_OUTPUT. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const base=process.env.F10_BASE_URL??'http://127.0.0.1:8765';
const output=process.env.F10_BROWSER_OUTPUT??'/private/tmp/f10-browser';
const executablePath=process.env.F10_CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const origin=new URL(base).origin;
const report={base,viewports:[],checks:[],pageErrors:[],blockedWrites:[]};
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath});
const context=await browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block',reducedMotion:'reduce'});
const transparentPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aU1sAAAAASUVORK5CYII=','base64');
await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(!['GET','HEAD'].includes(request.method())){report.blockedWrites.push({method:request.method(),path:url.pathname});return route.abort();}
  if(url.hostname==='tile.openstreetmap.org')return route.fulfill({status:200,contentType:'image/png',body:transparentPng});
  if(['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))return route.continue();
  if(url.origin!==origin||url.pathname.startsWith('/api/'))return route.abort();
  return route.continue();
});
const page=await context.newPage();
page.on('pageerror',error=>report.pageErrors.push(error.message));
const openFilters=async()=>page.evaluate(()=>{document.getElementById('catalog-options').open=true;document.getElementById('catalog-more').open=true;});
const ready=async()=>{await page.waitForSelector('#project-grid[aria-busy="false"]',{state:'attached'});await page.waitForFunction(()=>!document.getElementById('search').disabled);await page.evaluate(()=>document.fonts.ready.then(()=>true));};
const ids=async()=>page.locator('#project-grid [data-project]').evaluateAll(nodes=>nodes.map(node=>node.dataset.project));
const waitIds=async expected=>page.waitForFunction(wanted=>JSON.stringify([...document.querySelectorAll('#project-grid [data-project]')].map(node=>node.dataset.project))===JSON.stringify(wanted),expected);
const reset=async()=>{await page.locator('#clear-filters').click();await openFilters();await page.locator('[data-catalog-view="cards"]').click();await page.waitForFunction(()=>document.querySelectorAll('#project-grid [data-project]').length===131);};
const prepared=async()=>{await openFilters();await page.selectOption('#evidence-mode','prepared');};
const check=async(name,run)=>{await run();report.checks.push({name,passed:true});console.log('PASS '+name);};
let failure;
try{
  await page.goto(base+'/proyectos.html',{waitUntil:'domcontentloaded'});await ready();report.fonts=await page.evaluate(()=>[...document.fonts].map(font=>({family:font.family,status:font.status})));
  await check('published catalogue retains all 131 identities',async()=>assert.equal((await ids()).length,131));
  await check('responsive controls and no horizontal overflow at five widths',async()=>{
    for(const width of [1440,1024,768,390,320]){
      await page.setViewportSize({width,height:1100});await openFilters();
      await page.locator('#catalog-filters').scrollIntoViewIfNeeded();
      const result=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,primaryIds:[...document.querySelectorAll('.cf-primary select')].map(node=>node.id),metricChoices:[...document.getElementById('area-type').options].map(option=>option.value)}));
      assert(result.scrollWidth<=width+1,JSON.stringify(result));assert(result.bodyWidth<=width+1,JSON.stringify(result));
      assert(result.primaryIds.includes('bathrooms'));assert(!result.primaryIds.includes('delivery'));assert.deepEqual(result.metricChoices,['','util','total']);
      assert(await page.locator('#bathrooms').isVisible());assert(await page.locator('#parking').isVisible());
      await page.screenshot({path:output+'/filters-'+width+'.png'});report.viewports.push({...result,screenshot:'filters-'+width+'.png'});
    }
    await page.setViewportSize({width:1440,height:1100});
  });
  await check('keyboard focus remains visible and new controls have accessible labels',async()=>{
    await page.bringToFront();await page.locator('#search').focus();await page.waitForFunction(()=>document.activeElement.id==='search');await page.keyboard.press('Tab');
    const focus=await page.evaluate(()=>{const node=document.activeElement,style=getComputedStyle(node);return {id:node.id,visible:node.matches(':focus-visible'),outlineWidth:parseFloat(style.outlineWidth),outlineStyle:style.outlineStyle};});
    assert.equal(focus.id,'region');assert(focus.visible);assert(focus.outlineWidth>=2);assert.notEqual(focus.outlineStyle,'none');
    for(const id of ['bathrooms','area-type','evidence-mode','parking','storage'])assert(await page.locator('#'+id).evaluate(node=>[...node.labels].some(label=>label.textContent.trim().length>0)));
  });
  await check('prepared layer retains 130 identities and distinguishes published remainder',async()=>{
    await reset();await prepared();await page.waitForFunction(()=>document.querySelectorAll('#project-grid [data-project]').length===130);
    assert.match(await page.locator('#evidence-mode-help').innerText(),/otros proyectos conservan sus datos publicados/);
    assert(await page.locator('#capacity-toggle').isHidden());
    assert(!(await ids()).includes('own'));
  });
  await check('price + 1D + 1B uses the matching Living Town UF 3949 quotation',async()=>{
    await page.fill('#search','Living Town');await page.fill('#max-price','3949');await page.selectOption('#bedrooms','1');await page.selectOption('#bathrooms','1');
    await waitIds(['edificio-living-town']);
    const card=page.locator('[data-project="edificio-living-town"]');
    assert.match(await card.locator('.catalog-price').innerText(),/Referencia UF 3\.949/);
    assert.match(await card.innerText(),/16\/11\/2026/);
    assert(!await card.locator('.capacity-result').count());
    assert.match(await card.innerText(),/Cotización Sollahms de referencia/);assert(!/Superficie (útil|total)/.test(await card.innerText()));
    await card.scrollIntoViewIfNeeded();await card.screenshot({path:output+'/living-matched-reference.png'});
  });
  await check('card, list, map and split preserve the same filtered identity',async()=>{
    const expected=await ids();
    await page.locator('[data-catalog-view="list"]').click();assert.deepEqual(await ids(),expected);
    await page.locator('[data-catalog-view="map"]').click();await page.waitForSelector('#map-project-choice');
    const mapped=await page.evaluate(()=>[...new Set([...document.querySelectorAll('#map-project-choice option')].map(node=>node.value).filter(Boolean).concat([...document.querySelectorAll('.catalog-map-pending li a')].map(node=>new URL(node.href).pathname.slice(1,-5))))].sort());
    assert.deepEqual(mapped,[...expected].sort());
    if(await page.locator('#map-project-choice option[value="edificio-living-town"]').count()){
      await page.selectOption('#map-project-choice','edificio-living-town');assert.match(await page.locator('#map-project-detail').innerText(),/Referencia UF 3\.949/);
    }
    await page.locator('[data-catalog-view="split"]').click();await waitIds(expected);
    await page.locator('[data-catalog-view="cards"]').click();await waitIds(expected);
  });
  await check('URL restore, removable chip and reset keep filter state coherent',async()=>{
    const query=new URL(page.url()).searchParams;assert.equal(query.get('evidencia'),'prepared');assert.equal(query.get('dormitorios'),'1');assert.equal(query.get('banos'),'1');assert.equal(query.get('precio_max'),'3949');
    await page.reload({waitUntil:'domcontentloaded'});await ready();await waitIds(['edificio-living-town']);
    assert.equal(await page.locator('#evidence-mode').inputValue(),'prepared');
    await page.locator('#applied-filters button[aria-label="Quitar filtro Baños: 1 baño"]').click();assert.equal(await page.locator('#bathrooms').inputValue(),'');
    await reset();assert.equal(await page.locator('#evidence-mode').inputValue(),'published');assert.equal(await page.locator('#area-type').inputValue(),'');
  });
  await check('area range requires explicit useful or total metric',async()=>{
    await page.fill('#min-area','10');await waitIds([]);assert.match(await page.locator('#filter-range-error').innerText(),/métrica/);
    await page.selectOption('#area-type','util');await page.waitForFunction(()=>document.getElementById('filter-range-error').hidden);await reset();
  });
  await check('a quotation cannot borrow a surface from another documentary reference',async()=>{
    await prepared();await page.fill('#search','Living Town');await page.fill('#max-price','3949');await page.selectOption('#bedrooms','1');await page.selectOption('#bathrooms','1');await waitIds(['edificio-living-town']);
    await page.selectOption('#area-type','total');await page.fill('#max-area','200');await waitIds([]);
    assert.match(await page.locator('#catalog-message').innerText(),/No encontramos coincidencias/);await reset();
  });
  await check('an unpriced surface reference displays its own pending price',async()=>{
    await prepared();await page.fill('#search','Edificio Mood');await page.selectOption('#bedrooms','1');await page.selectOption('#bathrooms','1');await page.selectOption('#area-type','util');await page.fill('#min-area','31.16');await page.fill('#max-area','31.16');await waitIds(['edificio-mood']);
    const card=page.locator('[data-project="edificio-mood"]');assert.match(await card.locator('.catalog-price').innerText(),/Precio de esta referencia por confirmar/);assert.match(await card.innerText(),/31,16 m²/);
    assert(!/Referencia UF/.test(await card.locator('.catalog-price').innerText()));await card.screenshot({path:output+'/mood-unpriced-surface-reference.png'});await reset();
  });
  await check('unknown property is retained without a type filter and excluded when selected',async()=>{
    await page.fill('#search','Alto Buzeta');await waitIds(['alto-buzeta']);await page.selectOption('#property-type','departamento');await waitIds([]);await reset();
  });
  await check('mixed Indi does not lend a local price or unknown bathroom count to a dwelling',async()=>{
    await prepared();await page.fill('#search','Edificio Indi');await page.selectOption('#property-type','local');await page.fill('#max-price','8560');await waitIds(['edificio-indi']);
    await page.selectOption('#bedrooms','1');await waitIds([]);
    await page.selectOption('#property-type','');await page.fill('#max-price','3544');await waitIds(['edificio-indi']);
    await page.selectOption('#bathrooms','1');await waitIds([]);await reset();
  });
  await check('region changes clear a commune that no longer belongs to the selected region',async()=>{
    await page.selectOption('#region','Región Metropolitana');await page.selectOption('#commune','Santiago');await page.selectOption('#region','Biobío');assert.equal(await page.locator('#commune').inputValue(),'');
    assert.deepEqual(await page.locator('#commune option').evaluateAll(options=>options.map(option=>option.value)),['','Concepción']);await reset();
  });
  await check('failed evidence load disables prepared mode and restores published state',async()=>{
    const isolated=await context.newPage();isolated.on('pageerror',error=>report.pageErrors.push(error.message));
    await isolated.route('**/data/commercial-filter-evidence-leben.json',route=>route.abort());
    await isolated.goto(base+'/proyectos.html?evidencia=prepared',{waitUntil:'domcontentloaded'});
    await isolated.waitForSelector('#project-grid[aria-busy="false"]',{state:'attached'});await isolated.waitForFunction(()=>!document.getElementById('search').disabled);report.failedEvidenceState=await isolated.evaluate(()=>({count:document.querySelectorAll('#project-grid [data-project]').length,message:document.getElementById('catalog-message').textContent,warning:document.getElementById('advanced-data-status').textContent,view:document.getElementById('project-grid').dataset.view,mode:document.getElementById('evidence-mode').value}));
    await isolated.locator('#catalog-more').evaluate(node=>node.open=true);assert.equal(await isolated.locator('#evidence-mode').inputValue(),'published');assert(await isolated.locator('#evidence-mode option[value="prepared"]').isDisabled());assert.match(await isolated.locator('#advanced-data-status').innerText(),/no pudieron cargar/);
    assert.equal(await isolated.locator('#project-grid [data-project]').count(),131);await isolated.close();
  });
  await check('no JavaScript exceptions or write requests',async()=>{assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.blockedWrites,[]);});
}catch(error){failure=error;report.failure={message:error.message,stack:error.stack};console.error(error);}
finally{await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');await context.close();await browser.close();}
if(failure)process.exitCode=1;
