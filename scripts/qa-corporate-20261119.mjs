/**
 * Offline browser QA for the scoped 19 November corporate overlay.
 * Usage: node scripts/qa-corporate-20261119.mjs BASELINE_STATIC OUTPUT
 * SOLLAHMS_PLAYWRIGHT_MODULE and SOLLAHMS_CHROME can select existing tools.
 * Only local GET/HEAD static content is served. All browser API requests are
 * fixtures; every external request and every server mutation is blocked.
 */
import http from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const repo = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const baseline = path.resolve(process.argv[2] || '');
const output = path.resolve(process.argv[3] || '');
if (!process.argv[2] || !process.argv[3]) throw Error('Provide certified baseline static directory and output directory.');
const { chromium } = createRequire(import.meta.url)(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || '/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const pages = ['centro-orientacion.html', 'entorno-desarrollo-urbano.html', 'inversion-inmobiliaria-empresas.html'];
const widths = [1440, 390, 320];
const mime = { '.html':'text/html', '.mjs':'text/javascript', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.woff2':'font/woff2', '.woff':'font/woff' };
const served = [], blocked = [], serverMutations = [];
await mkdir(output, { recursive: true });
async function start(variant) {
  const server = http.createServer(async (req,res) => {
    try {
      if (!['GET','HEAD'].includes(req.method)) {
        serverMutations.push({variant,method:req.method,path:new URL(req.url,'http://local').pathname});
        res.writeHead(405); return res.end('Static QA: writes disabled');
      }
      const url = new URL(req.url,'http://local');
      let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
      if (relative.startsWith('api/')) { res.writeHead(503,{'Content-Type':'application/json'}); return res.end('{"code":"offline_qa"}'); }
      const root = variant === 'candidate' && pages.includes(relative) ? repo : baseline;
      const dest = path.resolve(root,relative);
      if (!dest.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
      if (!(await stat(dest)).isFile()) { res.writeHead(404); return res.end(); }
      const data = await readFile(dest);
      served.push({variant,path:relative});
      res.writeHead(200,{'Content-Type':mime[path.extname(dest)] || 'application/octet-stream','Cache-Control':'no-store'});
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404);res.end(); }
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {server,url:`http://127.0.0.1:${server.address().port}`};
}
const servers = {baseline:await start('baseline'),candidate:await start('candidate')};
const date = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const fixtureUf = { uf:{date,valueClp:41000,source:{url:'https://www.sii.cl/valores_y_fechas/uf/uf2026.htm',title:'Synthetic offline QA fixture; not measured current UF',verifiedAt:date}} };
const report = {kind:'offline_corporate_browser_qa',checkedAt:new Date().toISOString(),timezone:'America/Santiago',widths,fixtureUf:true,externalRequestsBlocked:true,realProviderCalls:0,visual:[],flows:[],failures:[],preexisting:[]};
const browser = await chromium.launch({headless:true,executablePath:process.env.SOLLAHMS_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--disable-background-networking']});

async function contextFor(width) {
  const context = await browser.newContext({viewport:{width,height:900},locale:'es-CL',timezoneId:'America/Santiago',reducedMotion:'reduce',serviceWorkers:'block'});
  context.setDefaultTimeout(10000);
  await context.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(u.pathname.startsWith('/api/')) {
      blocked.push({kind:'api_fixture',method:req.method(),path:u.pathname});
      if(u.pathname==='/api/uf' && req.method()==='GET') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixtureUf)});
      return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({code:'preview_read_only',error:'Prueba local: ningún mensaje, reserva ni registro real fue enviado.'})});
    }
    if(u.hostname!=='127.0.0.1') {
      blocked.push({kind:'external',method:req.method(),host:u.hostname});
      return route.fulfill({status:204,body:''});
    }
    if(!['GET','HEAD'].includes(req.method())) {
      blocked.push({kind:'mutation',method:req.method(),path:u.pathname});
      return route.fulfill({status:405,body:'Offline QA blocks writes'});
    }
    return route.continue();
  });
  return context;
}
async function load(page,url) {
  await page.goto(url,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(150);
}
function hash(data){return createHash('sha256').update(data).digest('hex');}
async function mobileNavigation(page,width) {
  if(width>=768)return 'desktop';
  const button=page.locator('button[aria-controls="mobile-menu"]');
  if(!await button.count())return 'no_collapsible_navigation_in_existing_page';
  await button.click();
  assert.equal(await button.getAttribute('aria-expanded'),'true');
  assert.equal(await page.locator('#mobile-menu').isVisible(),true);
  assert(await page.locator('#mobile-menu a[href="/contacto.html"]').count()>0);
  await button.click();
  assert.equal(await button.getAttribute('aria-expanded'),'false');
  return 'open_close_contact_link_pass';
}
async function snapshot(page,variant,name,width) {
  await page.evaluate(()=>window.scrollTo(0,0));
  const data=await page.screenshot({path:path.join(output,`${variant}-${width}-${name.replace('.html','')}-top.png`),animations:'disabled'});
  const layout=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelector('h1')?.innerText,bodyText:document.body.innerText,mainVisible:Boolean(document.querySelector('main')?.getBoundingClientRect().height),jsonld:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent))}));
  return {screenshotSha256:hash(data),...layout};
}
async function checkCompany(page,variant,width) {
  await page.locator('.empresa-hero a[href="#asesoria"]').click();
  await page.locator('#asesoria').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(output,`${variant}-${width}-empresa-advisory.png`),animations:'disabled'});
  assert.equal(await page.locator('#asesoria fieldset').evaluate(el=>el.disabled),true);
  assert.equal(await page.locator('#asesoria fieldset input:not(:disabled)').count(),0);
  const fields=await page.locator('#asesoria fieldset').evaluate(el=>el.outerHTML);
  const wa=await page.locator('a[href^="https://wa.me/"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
  assert(wa.every(x=>new URL(x).pathname==='/56948502440'));
  if(variant==='candidate') {
    const cta=page.getByRole('link',{name:'Consultar por una inversión empresarial',exact:true});
    assert.equal(await cta.getAttribute('href'),'/contacto.html#solicitar-asesoria');
    assert.equal(await cta.isVisible(),true);
    await cta.click();
    assert(new URL(page.url()).pathname==='/contacto.html');
    assert.equal(await page.locator('#advisory-fields').isDisabled(),false);
  }
  return {enterpriseFieldsetSha256:hash(fields),whatsapp:wa,newCtaToActiveContact:variant==='candidate'};
}
async function checkCenter(page) {
  const form=page.locator('#budget-form');
  await form.locator('[name="income"]').fill('2000000');
  await form.locator('[name="savings"]').fill('20000000');
  await form.locator('[name="rate"]').fill('4.5');
  await form.locator('[name="uf"]').fill('41000');
  await form.locator('button[type="submit"]').click();
  const budget=await page.locator('#budget-result').innerText();
  assert(budget.includes('Precio máximo referencial'));
  await page.locator('#check-items input[type="checkbox"]').first().check();
  assert((await page.locator('#check-count').innerText()).startsWith('1 de 8'));
  await page.locator('#journey-next').click();
  const journey=await page.locator('#journey-position').innerText();
  assert(journey.startsWith('ETAPA 2 DE'));
  return {budget,checklist:'1 de 8',journey};
}
async function checkUrban(page) {
  await page.waitForFunction(()=>!document.querySelector('#uw-region').disabled);
  const initial=await page.locator('#uw-count').innerText();
  const options=await page.locator('#uw-region option').evaluateAll(es=>es.map(e=>({value:e.value,text:e.textContent})));
  assert(options.length>1);
  await page.locator('#uw-region').selectOption(options[1].value);
  const filtered=await page.locator('#uw-count').innerText();
  await page.locator('#uw-reset').click();
  assert.equal(await page.locator('#uw-count').innerText(),initial);
  return {initial,filtered,resetRestoresCount:true};
}
async function contactFixture(page,formSelector,ids,statusSelector) {
  const form=page.locator(formSelector);
  const required=await form.locator('input[required]').evaluateAll(es=>es.map(e=>e.name));
  for(const name of ['nombre','rut','correo','telefono'])assert(required.includes(name));
  await page.locator(ids.nombre).fill('Persona QA Sintética');
  await page.locator(ids.rut).fill('1000005-K');
  await page.locator(ids.correo).fill('qa@corporate.test.invalid');
  await page.locator(ids.telefono).fill('+56900000000');
  await form.locator('[name="consent"]').check();
  await page.waitForTimeout(2100);
  await form.locator('button[type="submit"]').click();
  await page.waitForFunction(selector=>document.querySelector(selector).textContent.includes('ningún mensaje'),statusSelector);
  assert.equal(await page.locator(ids.nombre).inputValue(),'Persona QA Sintética');
  return {requiredIdentityFieldsPresent:true,provider:'intercepted_read_only_fixture',valuesRetainedAfterFixture:true};
}
try {
 for(const width of widths) {
  const observations={};
  for(const variant of ['baseline','candidate']) {
   const context=await contextFor(width);
   for(const name of pages) {
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try {
      await load(page,`${servers[variant].url}/${name}`);
      const visual=await snapshot(page,variant,name,width);
      observations[`${variant}:${name}`]=visual;
      const navigation=await mobileNavigation(page,width);
      let flow;
      if(name.startsWith('inversion'))flow=await checkCompany(page,variant,width);
      else if(name.startsWith('centro'))flow=await checkCenter(page);
      else flow=await checkUrban(page);
      report.visual.push({variant,width,page:name,screenshotSha256:visual.screenshotSha256,viewport:visual.viewport,scrollWidth:visual.scrollWidth,h1:visual.h1,mainVisible:visual.mainVisible,jsonldCount:visual.jsonld.length,errors,navigation});
      report.flows.push({variant,width,page:name,...flow});
    } catch(error){report.failures.push({variant,width,page:name,error:String(error)});}
    await page.close();
   }
   for(const name of ['agenda-asesoria.html','contacto.html','comparador-hipotecario.html']) {
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try {
      await load(page,`${servers[variant].url}/${name}`);
      const navigation=await mobileNavigation(page,width);
      let flow;
      if(name.startsWith('comparador')) {
        await page.locator('#property').fill('4000');
        await page.locator('#down').fill('20');
        await page.locator('#years').selectOption('20');
        await page.locator('#rate').fill('4.5');
        await page.locator('#simulation-form button[type="submit"]').click();
        const monthlyUf=await page.locator('#monthly-uf').innerText();assert(!monthlyUf.startsWith('—'));
        await page.locator('#lead-open').click();
        flow={monthlyUf,...await contactFixture(page,'#lead-form',{nombre:'#nombre',rut:'#lead-rut',correo:'#correo',telefono:'#telefono'},'#lead-status')};
      } else {
        assert.equal(await page.locator('#advisory-fields').isDisabled(),false);
        flow=await contactFixture(page,'#advisory-form',{nombre:'#advisory-name',rut:'#advisory-rut',correo:'#advisory-email',telefono:'#advisory-phone'},'#advisory-status');
      }
      const layout=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
      const wa=await page.locator('a[href^="https://wa.me/"]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
      assert(wa.length>0 && wa.every(x=>new URL(x).pathname==='/56948502440'));
      report.flows.push({variant,width,page:name,...flow,navigation,layout,errors,whatsappLinksChecked:wa.length,whatsapp:wa});
    }catch(error){report.failures.push({variant,width,page:name,error:String(error)});}
    await page.close();
   }
   await context.close();
  }
  for(const name of pages) {
    const before=observations[`baseline:${name}`],after=observations[`candidate:${name}`];
    if(!before||!after)continue;
    const row={width,page:name,topScreenshotIdentical:before.screenshotSha256===after.screenshotSha256,bodyTextIdentical:before.bodyText===after.bodyText,baselineScrollWidth:before.scrollWidth,candidateScrollWidth:after.scrollWidth};
    if(after.scrollWidth>width+1)report.preexisting.push({...row,issue:'horizontal_overflow',newRegression:after.scrollWidth>before.scrollWidth});
    report.visual.push({comparison:row});
    if(!name.startsWith('inversion'))assert.equal(row.bodyTextIdentical,true,'Metadata edit changed rendered body text');
    assert(after.scrollWidth<=before.scrollWidth,'Candidate introduced horizontal overflow');
  }
 }
 const baselineFlows=report.flows.filter(x=>x.variant==='baseline');
 for(const after of report.flows.filter(x=>x.variant==='candidate')) {
  const before=baselineFlows.find(x=>x.width===after.width&&x.page===after.page);
  if(!before)continue;
  for(const key of ['monthlyUf','budget','initial','filtered','journey','enterpriseFieldsetSha256','whatsapp'])if(before[key]!==undefined)assert.deepEqual(after[key],before[key],`${after.page} ${key} regression`);
 }
 report.serverMutationRequests=serverMutations;
 report.blockedRequestSummary=Object.fromEntries([...new Set(blocked.map(x=>x.kind))].map(kind=>[kind,blocked.filter(x=>x.kind===kind).length]));
 report.mockedPostCounts=Object.fromEntries([...new Set(blocked.filter(x=>x.method==='POST').map(x=>x.path))].map(p=>[p,blocked.filter(x=>x.method==='POST'&&x.path===p).length]));
 report.externalHostsBlocked=[...new Set(blocked.filter(x=>x.kind==='external').map(x=>x.host))];
 assert.equal(serverMutations.length,0);
 report.status=report.failures.length?'FAIL':'PASS';
} catch(error) {report.failures.push({error:String(error)});report.status='FAIL';}
finally {
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();
 await Promise.all(Object.values(servers).map(({server})=>new Promise(resolve=>server.close(resolve))));
}
console.log(JSON.stringify({status:report.status,visual:report.visual.length,flows:report.flows.length,failures:report.failures,preexisting:report.preexisting,report:path.join(output,'report.json')}));
if(report.status!=='PASS')process.exitCode=1;
