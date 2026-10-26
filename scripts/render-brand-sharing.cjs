/* Deterministic raster exports from the approved vector master.
 * No font substitution or generated imagery. Uses Sharp as an authoring tool,
 * never as a runtime dependency. Preserve the approved square composition:
 * only the former wordmark rectangle changes, all other pixels are exact.
 */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'assets/branding');

(async () => {
  const original = path.join(dir, 'og-sollahms-square-v2.jpg');
  const {data: before, info} = await sharp(original).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const output = Buffer.from(before);
  // Reuse an unmarked portion of the same backdrop within the old logo's
  // rectangle. A 16px join affects only that rectangle, not the rest of the
  // design, tagline or margins. No synthetic building/photo material is used.
  const box = {left:100, top:455, width:1060, height:225};
  for(let y=0;y<box.height;y++) for(let x=0;x<box.width;x++) {
    const mix=Math.min(1, Math.min(x,y,box.width-1-x,box.height-1-y)/16);
    for(let c=0;c<info.channels;c++) {
      const to=((box.top+y)*info.width+box.left+x)*info.channels+c;
      const from=((180+y)*info.width+box.left+x)*info.channels+c;
      output[to]=Math.round(before[to]*(1-mix)+before[from]*mix);
    }
  }
  const logo=await sharp(path.join(dir,'sollahms-logo-light.svg'),{density:144}).resize({width:1022}).png().toBuffer();
  await sharp(output,{raw:info}).composite([{input:logo,left:116,top:466}]).png({compressionLevel:9,adaptiveFiltering:true}).toFile(path.join(dir,'og-sollahms-square-v3.png'));
  const after=await sharp(path.join(dir,'og-sollahms-square-v3.png')).removeAlpha().raw().toBuffer();
  let outsideChanges=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    if(x>=box.left && x<box.left+box.width && y>=box.top && y<box.top+box.height)continue;
    for(let c=0;c<3;c++)if(before[(y*info.width+x)*3+c]!==after[(y*info.width+x)*3+c])outsideChanges++;
  }
  if(outsideChanges)throw new Error('Sharing layout pixels changed outside the logo');
  // Update the older landscape exports too; preserve their separate tagline.
  const svg=fs.readFileSync(path.join(dir,'sollahms-logo-light.svg'),'utf8')
    .replace('width="860" height="162"','x="100" y="202" width="580" height="109.26"');
  const landscape='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#003229"/>'+svg+'<text x="106" y="388" fill="#F7F4ED" font-family="Arial, sans-serif" font-size="42">Inversión inmobiliaria en Chile</text></svg>\n';
  const oldDimensions=await sharp(path.join(dir,'og-sollahms.png')).metadata();
  fs.writeFileSync(path.join(dir,'og-sollahms.svg'),landscape);
  await sharp(Buffer.from(landscape)).resize(oldDimensions.width,oldDimensions.height).png().toFile(path.join(dir,'og-sollahms-next.png'));
  fs.renameSync(path.join(dir,'og-sollahms-next.png'),path.join(dir,'og-sollahms.png'));
  console.log(JSON.stringify({square:info.width+'x'+info.height,changedRegion:box,outsideChanges,landscape:[oldDimensions.width,oldDimensions.height]}));
})();
