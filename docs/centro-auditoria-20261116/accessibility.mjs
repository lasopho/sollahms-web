import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {extname,join,resolve} from 'node:path';
import assert from 'node:assert/strict';

const {chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const root=resolve(new URL('../..',import.meta.url).pathname);
const out=join(root,'docs/centro-auditoria-20261116/accessibility');
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.png':'image/png'};
const report={method:'Targeted computed-style WCAG 1.4.3 contrast, ARIA snapshot and keyboard checks in Chrome using local candidate bytes. This is not a complete WCAG certification.',widths:[],mutationsBlocked:[],externalBlocked:[],startedAt:new Date().toISOString()};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
function luminance(c){const values=c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*values[0]+.7152*values[1]+.0722*values[2];}
function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
try{
 const context=await browser.newContext({reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const q=route.request(),u=new URL(q.url());
  if(!['GET','HEAD'].includes(q.method())){report.mutationsBlocked.push({method:q.method(),path:u.pathname});return route.abort();}
  if(u.origin!=='https://sollahms.cl'){report.externalBlocked.push(u.origin);return route.abort();}
  if(u.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{}'});
  try{const path=join(root,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));return route.fulfill({status:200,contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:'Missing local asset'});}
 });
 for(const width of [1440,1024,768,390,320]){
  const page=await context.newPage();await page.setViewportSize({width,height:1000});await page.goto('https://sollahms.cl/centro-orientacion.html');await page.waitForFunction(()=>!document.querySelector('#budget-form fieldset').disabled);await page.evaluate(()=>document.fonts.ready);
  const row={width,contrast:[],keyboard:[]};
  async function contrast(selector,state){
   const c=await page.locator(selector).first().evaluate(el=>{
    const parse=c=>{const v=c.match(/[\d.]+/g).map(Number);return [v[0],v[1],v[2],v.length>3?v[3]:1];};
    const layers=[];let n=el;
    while(n){const bg=parse(getComputedStyle(n).backgroundColor);layers.push(bg);n=n.parentElement;}
    let bg=[255,255,255];
    for(const c of layers.reverse())bg=bg.map((v,i)=>c[i]*c[3]+v*(1-c[3]));
    const cs=getComputedStyle(el),r=el.getBoundingClientRect();return {text:el.textContent.trim(),foreground:parse(cs.color),background:bg,fontSize:cs.fontSize,fontWeight:cs.fontWeight,opacity:cs.opacity,visible:r.width>0&&r.height>0,disabled:el.disabled===true};
   });
   c.selector=selector;c.state=state;c.ratio=Number(ratio(c.foreground,c.background).toFixed(2));c.pass=c.ratio>=4.5&&c.opacity==='1'&&c.visible;assert.ok(c.pass,`${width} ${selector} ${state} contrast=${c.ratio} opacity=${c.opacity}`);row.contrast.push(c);
  }
  for(const selector of ['#budget-point-title','.budget-point-heading .eyebrow','#budget-result>p','#presupuesto .result-panel>.help','.budget-next .button','.budget-next>.help','#budget-form .scenario-group h4'])await contrast(selector,'initial');
  await contrast('#journey-prev','stage 1 disabled');await contrast('#journey-next','stage 1 enabled');
  assert.equal(await page.locator('#journey-prev').getAttribute('disabled'),'');
  await page.locator('#journey-next').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#journey-position').innerText(),'ETAPA 2 DE 6');assert.equal(await page.evaluate(()=>document.activeElement.id),'journey-title');row.keyboard.push('Enter on Siguiente advances to stage 2 and focuses its heading');
  await page.locator('#journey-prev').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#journey-position').innerText(),'ETAPA 1 DE 6');row.keyboard.push('Enter on Anterior returns to stage 1');
  await page.locator('#journey-steps button').last().click();await contrast('#journey-prev','stage 6 enabled');await contrast('#journey-next','stage 6 disabled');
  await page.locator('#journey-prev').focus();await page.keyboard.press('Tab');const active=await page.evaluate(()=>document.activeElement.id);assert.notEqual(active,'journey-next');row.keyboard.push('Disabled terminal Siguiente is skipped by Tab');
  const aria=await page.locator('.journey-layout').ariaSnapshot();assert.match(aria,/button "← Anterior"/);assert.match(aria,/button "Siguiente →" \[disabled\]/);await writeFile(join(out,`journey-stage6-${width}.yml`),aria+'\n');
  await page.locator('#journey-next').screenshot({path:join(out,`next-disabled-${width}.png`)});
  if(width===390)await page.locator('.journey-content').screenshot({path:join(root,'docs/centro-auditoria-20261116/after/recorrido-final-390.png')});
  const empty=await page.locator('#presupuesto .result-panel').screenshot({path:join(out,`point-empty-${width}.png`)});
  await writeFile(join(root,`docs/centro-auditoria-20261116/after/punto-partida-${width}.png`),empty);
  for(const [name,value]of Object.entries({income:2000000,debt:100000,savings:20000000,monthlySavings:200000,horizon:12,uf:40000,down:20,years:25,rate:4.5}))await page.locator(`#budget-form [name="${name}"]`).fill(String(value));
  await page.locator('#budget-form button[type=submit]').click();
  for(const selector of ['#budget-result>h3','#budget-result .big-number','#budget-result .metrics dt','#budget-result .metrics dd','#budget-result .result-note'])await contrast(selector,'calculated');
  await page.locator('#presupuesto .result-panel').screenshot({path:join(out,`point-calculated-${width}.png`)});
  const state=await page.evaluate(()=>{const el=document.querySelector('#budget-result');const box=el.getBoundingClientRect();return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,resultBox:{left:box.left,right:box.right},staticResult:!el.closest('.s-scroll-presence'),staticControl:!document.querySelector('#journey-next').closest('.s-scroll-presence')};});
  assert.equal(state.viewport,state.scrollWidth);assert.ok(state.resultBox.left>=0&&state.resultBox.right<=width);assert.ok(state.staticResult&&state.staticControl);row.layout=state;
  report.widths.push(row);await page.close();
 }
 await context.close();
 const frozen='/private/tmp/sollahms-contacto-baseline-20261116/.vercel/contacto-production-release-20261116/stage/.vercel/output/static';
 const before=await browser.newContext({reducedMotion:'reduce',serviceWorkers:'block'});
 await before.route('**/*',async route=>{
  const q=route.request(),u=new URL(q.url());
  if(!['GET','HEAD'].includes(q.method())||u.origin!=='https://sollahms.cl')return route.abort();
  if(u.pathname.startsWith('/api/'))return route.fulfill({status:503,contentType:'application/json',body:'{}'});
  try{const path=join(frozen,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));return route.fulfill({status:200,contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}catch{return route.fulfill({status:404,body:'Missing frozen asset'});}
 });
 const page=await before.newPage();report.before=[];
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:1000});await page.goto('https://sollahms.cl/centro-orientacion.html');await page.waitForFunction(()=>!document.querySelector('#budget-form fieldset').disabled);await page.evaluate(()=>document.fonts.ready);
  await page.locator('#presupuesto .result-panel').screenshot({path:join(root,`docs/centro-auditoria-20261116/before/punto-partida-${width}.png`)});
  await page.locator('#journey-steps button').last().click();
  const state=await page.locator('#journey-next').evaluate(el=>({text:el.textContent.trim(),color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor,disabled:el.disabled}));
  state.ratio=Number(ratio(state.color.match(/[\d.]+/g).map(Number),state.background.match(/[\d.]+/g).map(Number)).toFixed(2));
  report.before.push({width,terminalNext:state});
  if(width===390)await page.locator('.journey-content').screenshot({path:join(root,'docs/centro-auditoria-20261116/before/recorrido-final-390.png')});
 }
 await before.close();
 assert.deepEqual(report.mutationsBlocked,[]);report.finishedAt=new Date().toISOString();report.status='PASS';
}finally{await browser.close();await writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,widths:report.widths.length,contrastChecks:report.widths.reduce((n,w)=>n+w.contrast.length,0),mutationsBlocked:report.mutationsBlocked.length,output:out}));
