import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '/private/tmp/node_modules/playwright/index.mjs';

const checkout='/private/tmp/sollahms-filtros-comerciales-fase10-20261117';
const output='/private/tmp/sollahms-fase12-repros/ui-transition-review';
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpeg':'image/jpeg','.jpg':'image/jpeg','.woff2':'font/woff2'};
await mkdir(output,{recursive:true});
const server=createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  const target=path.resolve(checkout,'.'+new URL(req.url,'http://localhost').pathname);
  if(!target.startsWith(checkout+'/')){res.writeHead(403).end();return;}
  try{const data=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]??'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(8766,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block',reducedMotion:'reduce'});
const report={checkout,base:'http://127.0.0.1:8766',blocked:[],pageErrors:[],screenshots:[]};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aU1sAAAAASUVORK5CYII=','base64');
await context.route('**/*',route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.hostname==='tile.openstreetmap.org')return route.fulfill({status:200,contentType:'image/png',body:png});
  if(!['GET','HEAD'].includes(request.method())||url.origin!==report.base||url.pathname.startsWith('/api/')){
    report.blocked.push({method:request.method(),origin:url.origin,path:url.pathname});return route.abort();
  }
  return route.continue();
});
const page=await context.newPage();
page.on('pageerror',e=>report.pageErrors.push(e.message));
const ready=async()=>{await page.waitForSelector('#project-grid[aria-busy="false"]',{state:'attached'});await page.waitForFunction(()=>!document.getElementById('search').disabled);};
const snapshot=()=>page.evaluate(()=>({url:location.href,mode:document.getElementById('evidence-mode').value,count:document.getElementById('project-count').textContent,summary:document.getElementById('capacity-summary').textContent,summaryVisible:!!document.getElementById('capacity-summary').getBoundingClientRect().height,toggleHidden:document.getElementById('capacity-toggle').hidden,formHidden:document.getElementById('capacity-form').hidden,financeCount:document.querySelectorAll('.capacity-result').length,items:[...document.querySelectorAll('#project-grid [data-project]')].map(n=>({slug:n.dataset.project,text:n.innerText})),mapOptions:[...document.querySelectorAll('#map-project-choice option')].map(n=>n.value),pending:[...document.querySelectorAll('.catalog-map-pending li')].map(n=>n.innerText)}));
const screenshot=async name=>{await page.screenshot({path:output+'/'+name+'.png',fullPage:false});report.screenshots.push(name+'.png');};
try{
  await page.goto(report.base+'/proyectos.html?q=Own&inmobiliaria=Leben&comuna=%C3%91u%C3%B1oa',{waitUntil:'domcontentloaded'});await ready();
  await page.waitForFunction(()=>!document.getElementById('capacity-toggle').disabled);
  assert.equal(await page.locator('[data-project="own"]').count(),1);
  await page.locator('#project-count').scrollIntoViewIfNeeded();
  report.ownPublished=await snapshot();await screenshot('own-published');
  await page.evaluate(()=>document.getElementById('catalog-more').open=true);
  await page.selectOption('#evidence-mode','prepared');
  await page.waitForFunction(()=>document.querySelectorAll('#project-grid [data-project]').length===0);
  report.ownPrepared=await snapshot();
  await page.locator('#project-count').scrollIntoViewIfNeeded();await screenshot('own-prepared');

  await page.goto(report.base+'/proyectos.html?q=Living+Town',{waitUntil:'domcontentloaded'});await ready();
  await page.waitForFunction(()=>!document.getElementById('capacity-toggle').disabled);
  await page.locator('#capacity-toggle').click();await page.fill('#capacity-income','2000000');
  await page.fill('#capacity-rate','4.5');
  await page.locator('#capacity-submit').click();
  await page.waitForFunction(()=>document.getElementById('capacity-summary').textContent.includes('Evaluación'));
  report.capacityPublished=await snapshot();
  await page.evaluate(()=>document.getElementById('catalog-more').open=true);
  await page.selectOption('#evidence-mode','prepared');
  await page.waitForFunction(()=>document.getElementById('capacity-toggle').hidden);
  assert.equal(await page.locator('.capacity-result').count(),0);
  assert.match(await page.locator('#capacity-summary').innerText(),/Evaluación de 131 proyectos/);
  report.capacityPrepared=await snapshot();
  await page.locator('#capacity-summary').scrollIntoViewIfNeeded();await screenshot('prepared-stale-capacity-summary');

  await page.fill('#search','');
  await page.waitForFunction(()=>document.querySelectorAll('#project-grid [data-project]').length===130);
  report.allPrepared=await snapshot();
  assert.match(report.allPrepared.summary,/131 proyectos/);
  for(const view of ['list','map','split']){
    await page.locator('[data-catalog-view="'+view+'"]').click();
    if(view==='map')await page.waitForSelector('#map-project-choice');
    report[view]=await snapshot();
  }
  console.log(JSON.stringify({ownPublished:report.ownPublished.items.map(i=>i.text),ownPreparedCount:report.ownPrepared.count,capacityPrepared:report.capacityPrepared.summary,allPrepared:report.allPrepared.count,pageErrors:report.pageErrors,report:output+'/report.json'},null,2));
}finally{
  await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');
  await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));
}
