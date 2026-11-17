import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '/private/tmp/node_modules/playwright/index.mjs';
const checkout='/private/tmp/sollahms-filtros-comerciales-fase10-20261117';
const output='/private/tmp/sollahms-fase12-repros/source-fallback-review';
await mkdir(output,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'};
const server=createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  const target=path.resolve(checkout,'.'+new URL(req.url,'http://localhost').pathname);
  if(!target.startsWith(checkout+'/')){res.writeHead(403).end();return;}
  try{const data=await readFile(target);res.writeHead(200,{'Content-Type':mime[path.extname(target)]??'application/octet-stream'}).end(req.method==='HEAD'?undefined:data);}
  catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(8766,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block',reducedMotion:'reduce'});
const report={checkout,requestedUrl:'http://127.0.0.1:8766/proyectos.html?q=Living+Town&evidencia=prepared',blocked:[],pageErrors:[]};
await context.route('**/*',route=>{
  const request=route.request(),url=new URL(request.url());
  if(!['GET','HEAD'].includes(request.method())||url.origin!=='http://127.0.0.1:8766'||url.pathname.startsWith('/api/')||url.pathname==='/data/commercial-filter-evidence-leben.json'){
    report.blocked.push({method:request.method(),origin:url.origin,path:url.pathname});return route.abort();
  }
  return route.continue();
});
const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));
try{
  await page.goto(report.requestedUrl,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#project-grid[aria-busy="false"]',{state:'attached'});
  await page.waitForFunction(()=>!document.getElementById('search').disabled);
  report.state=await page.evaluate(()=>({url:location.href,mode:document.getElementById('evidence-mode').value,moreOpen:document.getElementById('catalog-more').open,warning:document.getElementById('advanced-data-status').textContent,warningVisible:document.getElementById('advanced-data-status').checkVisibility(),warningClosedAncestor:document.getElementById('advanced-data-status').closest('details:not([open])')?.id,feedbackHidden:document.getElementById('catalog-feedback').hidden,feedback:document.getElementById('catalog-message').textContent,prices:[...document.querySelectorAll('.catalog-price')].map(n=>n.innerText),chips:document.getElementById('applied-filters').textContent}));
  await page.locator('#project-count').scrollIntoViewIfNeeded();await page.screenshot({path:output+'/silent-published-fallback.png'});
  assert.equal(report.state.mode,'published');assert.equal(report.state.moreOpen,false);assert.equal(report.state.warningClosedAncestor,'catalog-more');assert.match(report.state.warning,/no pudieron cargar/);assert.equal(report.state.feedbackHidden,true);assert(!new URL(report.state.url).searchParams.has('evidencia'));
  console.log(JSON.stringify(report.state,null,2));
}finally{
  await writeFile(output+'/report.json',JSON.stringify(report,null,2)+'\n');
  await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));
}
