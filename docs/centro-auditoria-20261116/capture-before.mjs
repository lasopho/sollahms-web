import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {extname,join} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const root='/private/tmp/sollahms-contacto-baseline-20261116/.vercel/contacto-production-release-20261116/stage/.vercel/output/static';
const out=new URL('./before/',import.meta.url);await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.png':'image/png'};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report={kind:'exact frozen production bytes; isolated browser requests',production:'dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w',widths:[],pageErrors:[],apiRequestsBlocked:0};
try{
 const context=await browser.newContext({reducedMotion:'reduce'});
 await context.route('**/*',async route=>{const req=route.request(),u=new URL(req.url());if(u.origin!=='https://sollahms.cl'||!['GET','HEAD'].includes(req.method()))return route.abort();if(u.pathname.startsWith('/api/')){report.apiRequestsBlocked++;return route.fulfill({status:503,contentType:'application/json',body:'{}'});}try{const path=join(root,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));await route.fulfill({status:200,contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:'Missing frozen asset'});}});
 const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:1000});await page.goto('https://sollahms.cl/centro-orientacion.html');await page.waitForFunction(()=>!document.querySelector('#budget-form fieldset').disabled);await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:new URL('page-'+width+'.png',out).pathname,fullPage:true});
  for(const [label,id]of [['presupuesto','#presupuesto'],['recorrido','#recorrido']]){await page.locator(id).scrollIntoViewIfNeeded();await page.screenshot({path:new URL(label+'-'+width+'.png',out).pathname});}
  const row=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,prev:{label:document.querySelector('#journey-prev').textContent,color:getComputedStyle(document.querySelector('#journey-prev')).color,background:getComputedStyle(document.querySelector('#journey-prev')).backgroundColor,disabled:document.querySelector('#journey-prev').disabled},result:{color:getComputedStyle(document.querySelector('.result-panel h3')).color,background:getComputedStyle(document.querySelector('.result-panel')).backgroundImage},fadeCount:document.querySelectorAll('.s-scroll-presence').length}));
  await page.locator('#journey-next').click();row.nextExecuted=await page.locator('#journey-position').innerText();await page.locator('#journey-prev').click();row.previousExecuted=await page.locator('#journey-position').innerText();report.widths.push(row);
 }
}finally{await browser.close();await writeFile(new URL('results.json',out),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
