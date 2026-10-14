import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const sourceRoot=fileURLToPath(new URL('../',import.meta.url));
const option=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const root=resolve(option('--build',sourceRoot+'dist'));
const base=option('--base',process.env.SOLLAHMS_HEADER_QA_URL || 'http://127.0.0.1:8917'), origin = new URL(base).origin;
const output=resolve(option('--output','/private/tmp/sollahms-leben-headers-qa'));
const before = JSON.parse(await readFile(option('--before')));
const baselineCatalogueBytes=await readFile(option('--before-catalogue',resolve(before.source.build,'data/proyectos.json')));
const baselineCatalogue=JSON.parse(baselineCatalogueBytes);
let sentoReview=null;
try { sentoReview=JSON.parse(await readFile(sourceRoot+'data/sento-review.json')); }
catch(error){if(error.code!=='ENOENT')throw error;}
const config = JSON.parse(await readFile(sourceRoot+'data/leben-headers.json'));
const catalogueBytes = await readFile(resolve(root, 'data/proyectos.json'));
const catalogue = JSON.parse(catalogueBytes), projects = catalogue.filter(project => project.inmobiliaria === 'Leben');
const expected = ['edificio-indi','edificio-baum','inn-puerto-chico','edificio-suecia','capitanes','parque-germania','edificio-argomedo','edificio-mood','edificio-indigo','edificio-santo','edificio-living-town','edificio-bold','own','edificio-nordico'];
if (catalogue.length !== 137 || projects.length !== 14 || expected.some(slug => projects.filter(project => project.slug === slug).length !== 1)) throw new Error('Baseline catalogue inventory mismatch.');
const contexts = ['desktop','tablet','mobile'].flatMap(name => [1,2].map(dpr => ({name:name+'-dpr'+dpr,dpr,width:name==='desktop'?1440:name==='tablet'?768:390,height:name==='desktop'?1000:name==='tablet'?1024:844})));
const views = [], checks = [], requests = { fontGets:0, isolatedProviders:0, httpFailures:[], blockedWrites:[] };
const check = (passed,label) => checks.push({passed:!!passed,label});
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(output,{recursive:true});
if(sha256(baselineCatalogueBytes)!==before.source.catalogueSha256)throw new Error('Immutable baseline catalogue changed.');
const sentoSlugs=new Set(sentoReview?.catalogue.map(row=>row.slug)??[]);
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonical(item)])):value;
const fingerprint=rows=>sha256(JSON.stringify(canonical(rows)));
const preserved=catalogue.filter(row=>!sentoSlugs.has(row.slug));
const previous=baselineCatalogue.filter(row=>!sentoSlugs.has(row.slug));
const sentoExact=!sentoReview||sentoSlugs.size===7&&fingerprint(catalogue.filter(row=>sentoSlugs.has(row.slug)))===fingerprint(sentoReview.catalogue);
check(fingerprint(preserved)===fingerprint(previous)&&sentoExact,'Catalogue unchanged outside seven independently approved Sento successors');
const source = {commit:process.env.SOLLAHMS_HEADER_QA_COMMIT||'working-tree',build:root,catalogueSha256:sha256(catalogueBytes),projectCount:137,lebenCount:14,ecasaCount:catalogue.filter(project=>project.inmobiliaria==='Ecasa').length,inventory:projects.map(project=>({slug:project.slug,nombre:project.nombre,estado:project.estado,catalogueCover:project.imagenPrincipal}))};
const save = async completed => { const report={base,completed,source,contexts,views,checks,requests,failures:checks.filter(check=>!check.passed),limitations:'Only GET/HEAD. Actual Google fonts allowed; providers isolated for layout. No live-provider claim. After uses one shared header; body and catalogue checked against the recorded baseline. DPR source coverage is measured, not assumed.'};await writeFile(output+'/report.next.json',JSON.stringify(report,null,2)+'\n');await rename(output+'/report.next.json',output+'/report.json'); };
function inspect() {
  const title=document.querySelector('h1'),hero=title.closest('section'),image=hero.querySelector('img'),header=document.querySelector('header');
  const rect=node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,bottom:r.bottom,right:r.right};};
  const style=node=>{const s=getComputedStyle(node);return{fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,color:s.color,position:s.position};};
  const shade=hero.querySelector('.leben-hero-shade'),content=hero.querySelector('.leben-hero-content');
  let geometry=null;
  if(image){const b=image.getBoundingClientRect(),s=getComputedStyle(image),w=image.naturalWidth,h=image.naturalHeight,fit=s.objectFit;
    const scale=fit==='contain'?Math.min(b.width/w,b.height/h):Math.max(b.width/w,b.height/h),dw=w*scale,dh=h*scale;
    const parts=s.objectPosition.split(/\s+/),offset=(value,diff)=>value.endsWith('%')?parseFloat(value)*diff/100:parseFloat(value)||0;
    const ox=offset(parts[0],b.width-dw),oy=offset(parts[1],b.height-dh),left=Math.max(0,-ox/scale),top=Math.max(0,-oy/scale),right=Math.min(w,(b.width-ox)/scale),bottom=Math.min(h,(b.height-oy)/scale);
    geometry={path:new URL(image.currentSrc||image.src).pathname,naturalWidth:w,naturalHeight:h,decoded:image.complete&&w>0,alt:image.alt,fit,objectPosition:s.objectPosition,filter:s.filter,bounds:rect(image),drawing:{width:dw,height:dh,x:b.x+ox,y:b.y+oy},visible:{left:left/w,top:top/h,right:right/w,bottom:bottom/h},croppedFraction:1-(right-left)*(bottom-top)/(w*h),scaleCss:scale,scaleTimesDpr:scale*devicePixelRatio};}
  const clone=document.querySelector('main').cloneNode(true);clone.querySelector('h1').closest('section').remove();
  const normalize=value=>value.replace(/\s+/g,' ').trim();
  const bodies={text:normalize(clone.textContent),links:[...clone.querySelectorAll('a[href]')].map(a=>({href:a.getAttribute('href'),text:normalize(a.textContent),target:a.target,rel:a.rel})),images:[...clone.querySelectorAll('img')].map(i=>({path:new URL(i.src).pathname,alt:i.alt,width:i.getAttribute('width'),height:i.getAttribute('height'),loading:i.loading})),frames:[...clone.querySelectorAll('iframe')].map(f=>({src:f.getAttribute('src'),title:f.title,loading:f.loading,referrerPolicy:f.referrerPolicy,allow:f.allow})),tables:[...clone.querySelectorAll('table')].map(t=>normalize(t.textContent))};
  const photoRatio=geometry.naturalWidth/geometry.naturalHeight;
  const horizontal=innerWidth>600;
  const textRight=rect(content).right;
  const solidBoundary=rect(hero).width*parseFloat(hero.style.getPropertyValue('--leben-solid'))/100;
  const contentSolid=horizontal ? textRight<=solidBoundary+1 : rect(title).top >= rect(image).bottom;
  return{contentSolid, sharedComponent:hero.classList.contains('leben-project-hero'),corporateBackground:getComputedStyle(hero).backgroundColor,orientation:horizontal?'right':'bottom',
    imageUndistorted:Math.abs(geometry.drawing.width/geometry.drawing.height-photoRatio)<.001,
    viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},heading:title.textContent.trim(),header:rect(header),hero:rect(hero),image:geometry,title:{bounds:rect(title),style:style(title)},content:content?{bounds:rect(content),style:style(content)}:null,shade:shade?{display:getComputedStyle(shade).display,gradient:getComputedStyle(shade).backgroundImage,bounds:rect(shade)}:null,fontLoaded:document.fonts.check('800 48px Manrope'),oneHeading:document.querySelectorAll('h1').length===1,titleVisibleInitially:rect(title).top>=rect(header).bottom&&rect(title).bottom<=innerHeight,overflow:document.documentElement.scrollWidth-innerWidth,body:bodies};
}
let browser;
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const viewport of contexts){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:viewport.dpr});
    await context.route('**/*',async route=>{
      const request=route.request(),url=new URL(request.url());
      if(!['GET','HEAD'].includes(request.method())){requests.blockedWrites.push({method:request.method(),path:url.pathname});return route.abort();}
      if(url.origin===origin){
        if(!process.env.VERCEL_OIDC_TOKEN)return route.continue();
        for(let attempt=0;attempt<2;attempt++){
          try {const response=await route.fetch({headers:{...request.headers(),'x-vercel-trusted-oidc-idp-token':process.env.VERCEL_OIDC_TOKEN},maxRedirects:0,timeout:60000});return await route.fulfill({response});}
          catch(error){
            if(attempt===0&&/ETIMEDOUT|ECONNRESET|timed out/i.test(error.message))continue;
            requests.httpFailures.push({path:url.pathname,error:'Exact-origin GET transport failed after bounded retry'});
            return route.abort();
          }
        }
      }
      if(['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)){requests.fontGets++;return route.continue();}
      requests.isolatedProviders++;if(request.isNavigationRequest())return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Provider isolated for baseline QA</title>'});return route.abort();
    });
    context.on('response',response=>{const url=new URL(response.url());if(url.origin===origin&&response.status()>=400)requests.httpFailures.push({path:url.pathname,status:response.status()});});
    for(const project of projects){const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));const response=await page.goto(base+project.detalleUrl,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>[...document.querySelectorAll('link[rel="stylesheet"]')].filter(link=>new URL(link.href).origin===location.origin).every(link=>link.sheet));
      const image=page.locator('h1').locator('xpath=ancestor::section[1]').locator('img').first();if(await image.count())await image.evaluate(image=>image.decode());
      await page.evaluate(()=>document.fonts.ready);await page.waitForLoadState('networkidle');const evidence=await page.evaluate(inspect);
      check(response.status()===200,viewport.name+' '+project.slug+' HTTP200');check(evidence.heading===project.nombre&&evidence.oneHeading,viewport.name+' '+project.slug+' exact unique heading');check(evidence.viewport.width===viewport.width&&evidence.viewport.height===viewport.height&&evidence.viewport.dpr===viewport.dpr,viewport.name+' '+project.slug+' actual viewport/DPR');check(!errors.length&&evidence.overflow<=2&&evidence.fontLoaded,viewport.name+' '+project.slug+' loaded font/no script error/overflow');
      const original=before.views.find(view=>view.slug===project.slug&&view.context===viewport.name);
      const row=config.projects.find(row=>row.slug===project.slug);
      check(sha256(JSON.stringify(evidence.body))===original.bodySha256,viewport.name+' '+project.slug+' body links/images/frames/tables intact');
      check(evidence.sharedComponent&&evidence.corporateBackground==='rgb(0, 50, 41)'&&evidence.contentSolid&&(evidence.orientation==='right' ? evidence.shade.gradient.startsWith('linear-gradient(to right,') : /^linear-gradient\((?:(?:to bottom|180deg), )?rgba?\(/.test(evidence.shade.gradient)),viewport.name+' '+project.slug+' continuous gradient and solid text surface');
      check(evidence.imageUndistorted&&evidence.image.path===row.image.localPath&&evidence.image.naturalWidth===row.image.width&&evidence.image.naturalHeight===row.image.height&&evidence.image.scaleCss<=1.01,viewport.name+' '+project.slug+' accepted original image without distortion or CSS enlargement');
      const filename=viewport.name+'-'+project.slug+'.png';await page.screenshot({path:output+'/'+filename});const bodySha256=sha256(JSON.stringify(evidence.body));views.push({context:viewport.name,slug:project.slug,screenshot:filename,scriptErrors:errors,bodySha256,...evidence});await save(false);await page.close();
    }
    await context.unrouteAll({behavior:'ignoreErrors'});await context.close();
  }
}catch(error){check(false,'Baseline QA stopped: '+error.message);}finally{if(browser)await browser.close();}
const completed=views.length===84&&checks.every(check=>check.passed)&&!requests.httpFailures.length&&!requests.blockedWrites.length;await save(completed);console.log(JSON.stringify({views:views.length,checks:checks.length,failures:checks.filter(check=>!check.passed).length,httpFailures:requests.httpFailures.length,blockedWrites:requests.blockedWrites.length,completed,report:output+'/report.json'}));if(!completed)process.exitCode=1;
