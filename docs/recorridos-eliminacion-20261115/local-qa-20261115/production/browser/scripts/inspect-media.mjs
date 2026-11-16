// Supplemental interactions. This module never submits a form.
import { resolve } from 'node:path';
export async function inspectMedia(page,{slug,width,output,screenshotMaps=false,supplemental=false}) {
 const gallerySection=page.locator('#galeria').first();
 let galleryPaint=[];
 if(await gallerySection.count()) {
  await gallerySection.scrollIntoViewIfNeeded();
  await Promise.race([page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))),new Promise(r=>setTimeout(r,500))]);
  await page.waitForTimeout(150);
  galleryPaint=await gallerySection.locator('img').evaluateAll(images=>images.map(image=>{
   const box=image.getBoundingClientRect();let opacity=1,hidden=false;
   for(let e=image;e&&e!==document.body;e=e.parentElement){const s=getComputedStyle(e);opacity*=Number(s.opacity);hidden ||= s.visibility==='hidden'||s.display==='none';}
   return {src:new URL(image.currentSrc||image.src,location.href).pathname,decoded:image.complete&&image.naturalWidth>0,width:box.width,height:box.height,intersectsViewport:box.top<innerHeight&&box.bottom>0,effectiveOpacity:opacity,hidden};
  }));
 }
 const navigation=[];
 if(supplemental)for(const link of await page.locator('[data-project-navigation] a[href^="#"]').all()){
  const href=await link.getAttribute('href');
  await link.click();
  const target=page.locator(href).first(),box=await target.boundingBox();
  navigation.push({href,exists:await target.count()>0,positioned:!!box&&box.y<1000&&box.y+box.height>0});
 }
 const gallery=[];
 if(supplemental)for(const selector of ['#galeria a:has(img)','#planos a:has(img),#modelos a:has(img)']){
  const link=page.locator(selector).first();
  if(!await link.count())continue;
  const href=await link.getAttribute('href');
  const target=await link.getAttribute('target');
  if(target==='_blank'){
   const popupPromise=page.waitForEvent('popup',{timeout:10000});
   await link.click();
   const popup=await popupPromise;
   await popup.waitForLoadState('load',{timeout:30000});
   const ok=await popup.evaluate(()=>document.images.length>0&&[...document.images].some(x=>x.complete&&x.naturalWidth>0));
   gallery.push({kind:selector.startsWith('#galeria')?'gallery':'plan',path:new URL(href,page.url()).pathname,opened:true,imageDecoded:ok});
   await popup.close();
  }else gallery.push({kind:selector.startsWith('#galeria')?'gallery':'plan',path:new URL(href,page.url()).pathname,opened:false,imageDecoded:false});
 }
 const maps=[];
 let index=0;
 for(const element of await page.locator('iframe[data-project-embed="map"],#ubicacion iframe').all()){
  await page.bringToFront();
  const ancestors=await element.locator('xpath=ancestor::details').all();
  for(const parent of ancestors)if(await parent.getAttribute('open')===null)await parent.locator(':scope > summary').click();
  await element.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const handle=await element.elementHandle(),frame=await handle.contentFrame();
  // Google can complete the iframe document before its lazy tile requests finish.
  // This bounded readiness wait is used by targeted re-probes; the running core
  // keeps its original evidence and is not silently changed.
  if(frame)await frame.waitForFunction(()=>[...document.querySelectorAll('canvas')].some(c=>c.width>0&&c.height>0)
    || [...document.images].some(i=>i.complete&&i.naturalWidth>=128&&i.naturalHeight>=128),null,{timeout:10000}).catch(()=>{});
  await Promise.race([page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))),new Promise(r=>setTimeout(r,500))]);
  await page.waitForTimeout(150);
  let state={ready:false};
  try{if(frame)state=await frame.evaluate(()=>{
   const body=document.body,text=body?.innerText||'',canvases=[...document.querySelectorAll('canvas')].filter(x=>x.width>0&&x.height>0);
   const images=[...document.images].filter(x=>x.complete&&x.naturalWidth>0),tiles=images.filter(x=>x.naturalWidth>=128&&x.naturalHeight>=128);
   return {ready:document.readyState==='complete',title:document.title,urlOrigin:location.origin,mapWidgets:document.querySelectorAll('.gm-style,[role="application"]').length,canvases:canvases.length,decodedImages:images.length,decodedTiles:tiles.length,errorText:/refused to connect|unable to load|problem loading|se ha producido un error|no se puede cargar/i.test(text),textLength:text.length};
  });}catch{state={ready:false,inspectionError:true};}
  const box=await element.boundingBox();
  const row={index,srcOrigin:new URL(await element.getAttribute('src'),page.url()).origin,hasTitle:!!await element.getAttribute('title'),geometry:box?{width:box.width,height:box.height}:null,...state};
  if(screenshotMaps){const path=resolve(output,'map-'+slug+'-'+width+'-'+index+'.png');await element.screenshot({path});row.screenshot=path;}
  maps.push(row);index++;
 }
 const videos=await page.locator('video,iframe[data-project-embed="video"],iframe[src*="youtube"],iframe[src*="vimeo"]').evaluateAll(els=>els.map(el=>({tag:el.tagName,srcOrigin:(()=>{try{return new URL(el.getAttribute('src'),location.href).origin}catch{return null}})(),title:el.getAttribute('title'),nativeReady:el.tagName==='VIDEO'?el.readyState:null,controls:el.tagName==='VIDEO'?el.controls:null,playbackTested:false})));
 const formModes=[];
 if(supplemental)for(const mode of ['llamada','cotizacion']){
  const button=page.locator('[data-request-mode="'+mode+'"]').first();
  if(!await button.count())continue;
  await button.click();
  formModes.push(await page.evaluate(mode=>{
   const controls=['nombre','rut','correo','telefono'].map(name=>{const e=document.querySelector('form [name="'+name+'"]');const b=e?.getBoundingClientRect();return {name,exists:!!e,visible:!!e?.getClientRects().length,enabled:!!e&&!e.disabled,required:!!e?.required,width:b?.width||0,left:b?.left||0,right:b?.right||0};});
   return {mode,active:document.querySelector('[data-request-mode="'+mode+'"]')?.getAttribute('aria-pressed'),controls,consentPresent:!!document.querySelector('form input[type="checkbox"][required]')};
  },mode));
 }
 const layout=await page.evaluate(()=>{
  const entries=[...document.querySelectorAll('main h1,main h2,main h3,main input:not([type=hidden]):not([name=website]),main select,main textarea,main button')].filter(x=>x.getClientRects().length);
  const offscreen=entries.filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1)}).map(e=>({tag:e.tagName,id:e.id,left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right)}));
  return {offscreenControlsOrHeadings:offscreen};
 });
 return {galleryPaint,navigationInteractions:navigation,mediaLinks:gallery,mapEvidence:maps,videoEvidence:videos,formModes,layout};
}

