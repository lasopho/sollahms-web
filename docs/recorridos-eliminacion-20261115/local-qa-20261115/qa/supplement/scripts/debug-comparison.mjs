import{createRequire}from'node:module';import{writeFile}from'node:fs/promises';import{nativeTransport}from'/private/tmp/sollahms-recorridos-qa/native-transport.mjs';
const{chromium}=createRequire(import.meta.url)('/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
const origin='https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app',root='/private/tmp/sollahms-recorridos-supplement';
const transport=await nativeTransport({origin,root});const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results={};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',async route=>{const q=route.request(),u=new URL(q.url());if(!['GET','HEAD','OPTIONS'].includes(q.method())||u.hostname==='vercel.live'||(q.isNavigationRequest()&&q.frame().parentFrame()))return route.abort();return u.origin===origin?transport.handle(route):route.continue();});
 const page=await context.newPage();await page.goto(origin+'/independencia-4745.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#advisory-fields:not(:disabled)'));
 await page.evaluate(()=>{window.__comparisonClicks=[];document.addEventListener('click',e=>window.__comparisonClicks.push({tag:e.target.tagName,id:e.target.id,plan:e.target.getAttribute('data-compare-plan'),checked:e.target.checked,prevented:e.defaultPrevented}),true);});
 const input=page.locator('[data-compare-plan]').first();
 async function state(){return input.evaluate(e=>{const r=e.getBoundingClientRect(),target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {checked:e.checked,disabled:e.disabled,bounds:{left:r.left,top:r.top,width:r.width,height:r.height},hit:{tag:target?.tagName,id:target?.id,cls:target?.className},active:document.activeElement?.tagName,status:document.querySelector('[data-plan-compare-status]')?.textContent,buttonDisabled:document.querySelector('[data-plan-compare]')?.disabled,clicks:window.__comparisonClicks};});}
 results.before=await state();
 await input.evaluate(e=>e.scrollIntoView({block:'center'}));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.waitForTimeout(200);
 results.centered=await state();await page.screenshot({path:root+'/comparison-centered.png'});
 await input.click();await page.waitForTimeout(100);results.afterClick=await state();
 if(!await input.isChecked()){await input.focus();await input.press('Space');await page.waitForTimeout(100);results.afterKeyboard=await state();}
 if(await input.isChecked()){await page.locator('[data-compare-plan]').nth(1).evaluate(e=>e.scrollIntoView({block:'center'}));await page.locator('[data-compare-plan]').nth(1).click();results.afterSecond=await state();}
 await writeFile(root+'/comparison-debug.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
}finally{await browser.close();await transport.close();}
