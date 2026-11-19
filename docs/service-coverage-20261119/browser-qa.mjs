import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const require=createRequire('/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const base='/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-service-coverage-private/candidate/.vercel/output/static';
const out=resolve(import.meta.dirname,'browser');await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--host-resolver-rules=MAP * ~NOTFOUND']});
const receipt={recordedAtUTC:new Date().toISOString(),mode:'Isolated browser; all requests locally fulfilled/blocked; no network continuation',checks:[],screenshots:[],networkRequestsContinued:0,realFormsSubmitted:0,providerRequests:0};
try{
for(const width of [1440,390,320])for(const path of ['/','/agenda-asesoria.html','/contacto.html']){
 const context=await browser.newContext({viewport:{width,height:950},locale:'es-CL',timezoneId:'America/Santiago',serviceWorkers:'block',reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];let posts=0;let provider=0;
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',async route=>{
  const request=route.request();const url=new URL(request.url());
  if(request.method()!=='GET'){posts++;await route.fulfill({status:503,contentType:'application/json',body:'{"ok":false,"error":"local_test_only"}'});return;}
  if(url.origin!=='https://sollahms.cl'){provider++;await route.abort();return;}
  if(url.pathname.startsWith('/api/')){await route.fulfill({status:503,contentType:'application/json',body:'{"ok":false,"error":"local_test_only"}'});return;}
  const file=resolve(base,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));assert.ok(file.startsWith(base+'/'));
  try{await route.fulfill({status:200,contentType:mime[extname(file)]||'application/octet-stream',body:await readFile(file)});}catch{await route.fulfill({status:404,body:'Not found'});}
 });
 await page.goto('https://sollahms.cl'+path,{waitUntil:'networkidle'});
 const reject=page.locator('.site-measurement-banner [data-choice="reject"]');if(await reject.count())await reject.click();
 const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));assert.ok(overflow.scroll<=overflow.client+1,JSON.stringify({path,width,overflow}));
 const canonical=await page.locator('link[rel=canonical]').getAttribute('href');assert.equal(canonical,'https://sollahms.cl'+path);
 assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('form').count(),1);
 const fields=await page.locator('form [name]').evaluateAll(nodes=>nodes.map(n=>n.name));assert.ok(fields.includes('rut'));assert.ok(fields.includes('correo'));assert.ok(fields.includes('telefono'));
 assert.equal(await page.locator('form').evaluate(form=>form.checkValidity()),false);
 let section;
 if(path==='/'){
   section=page.locator('#expertise');assert.ok((await page.locator('main').innerText()).includes('34 comunas de Chile'));
   assert.equal(await page.getByRole('link',{name:'Consulta las comunas donde podemos asesorarte'}).getAttribute('href'),'/agenda-asesoria.html');
 }else{
   section=page.locator('.agenda-coverage');assert.equal(await section.locator('.agenda-region').count(),10);assert.equal(await section.locator('.agenda-region li').count(),34);
   const copy=await section.innerText();assert.ok(copy.includes('Concepción'));assert.ok(copy.includes('San Pedro de la Paz'));assert.ok(!/presencial|distancia|oficinas|sucursales/i.test(copy));
   await section.locator('a[href="#solicitar-asesoria"]').click();assert.equal(new URL(page.url()).hash,'#solicitar-asesoria');
 }
 await section.scrollIntoViewIfNeeded();const screenshot=(path==='/'?'inicio':path.slice(1,-5))+'-'+width+'.png';await section.screenshot({path:resolve(out,screenshot),animations:'disabled'});receipt.screenshots.push('browser/'+screenshot);
 assert.deepEqual(errors,[]);assert.equal(posts,0);assert.equal(provider,0);
 receipt.checks.push({path,width,canonical,formInvalidWithoutInput:true,formPosts:posts,providerRequests:provider,pageErrors:errors,horizontalOverflow:false,passed:true});
 await context.close();
}
receipt.passed=true;
}finally{await browser.close();await writeFile(resolve(import.meta.dirname,'browser-qa.json'),JSON.stringify(receipt,null,2)+'\n');}
console.log(JSON.stringify({passed:receipt.passed,viewportsAndPages:receipt.checks.length,screenshots:receipt.screenshots.length,networkRequestsContinued:0,realFormsSubmitted:0}));
