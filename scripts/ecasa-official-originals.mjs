// An additional protected-Preview selection. The frozen source catalogue,
// documentary manifest, original quality policy and their 118 images stay intact.
import { readFile, lstat, realpath } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { transformEcasaImageQuality, applyEcasaCatalogueImageQuality } from './ecasa-image-quality.mjs';
import { naturalCaption } from './public-fiche-copy.mjs';

const BASELINE='0117cc546cc75183f73cae07c90dd093937a819f';
const SLUGS=['ferroparque','alto-san-joaquin'];
const PREFIX='/assets/propiedades/ecasa-official-review/';
const HASH=/^[a-f0-9]{64}$/;
const records=new WeakMap();
const fail=message=>{throw new Error('Ecasa official originals: '+message);};
const requireValue=(value,message)=>{if(!value)fail(message);};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=bytes=>{let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;};
const positive=value=>Number.isSafeInteger(value)&&value>0;
const equalMembers=(a,b)=>a.length===b.length&&new Set(a).size===a.length&&a.every(value=>b.includes(value));
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const caption=alt=>{
  const value=naturalCaption(alt);
  return /imagen\s+referencial/i.test(value)?value:value+' · Imagen referencial';
};

function localPath(path,slug,original=false) {
  const start=PREFIX+(original?'originals/':'')+slug+'/';
  return typeof path==='string'&&path.startsWith(start)&&
    /^[a-z0-9_.-]+\.(?:webp|png|jpe?g)$/i.test(path.slice(start.length))&&!path.includes('..');
}
function officialUrl(value) {
  try {
    const url=new URL(value);
    return url.origin==='https://ecasa.cl'&&!url.username&&!url.password&&!url.search&&!url.hash&&
      /^\/uploads\/images\/[a-z0-9_./-]+\.(?:png|webp|jpe?g)$/i.test(url.pathname)&&!url.pathname.includes('..');
  } catch {return false;}
}

// Read encoded dimensions without installing a codec in the deployment build.
// Pixel extraction is independently verified during preparation/QA; the build
// binds that receipt to these exact encoded files and their crop geometry.
function dimensions(bytes) {
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    requireValue(bytes.length>=45&&bytes.readUInt32BE(8)===13&&bytes.toString('ascii',12,16)==='IHDR',
      'invalid PNG dimension header');
    const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
    requireValue(bytes[26]===0&&bytes[27]===0&&bytes[28]<=1,'unsupported PNG encoding');
    let offset=8,ended=false,hasData=false;
    while(offset+12<=bytes.length) {
      const length=bytes.readUInt32BE(offset),name=bytes.toString('ascii',offset+4,offset+8);
      requireValue(offset+12+length<=bytes.length&&crc32(bytes.subarray(offset+4,offset+8+length))===bytes.readUInt32BE(offset+8+length),'truncated or corrupt PNG chunk');
      requireValue(!['acTL','fcTL','fdAT'].includes(name)&&!(name==='IHDR'&&offset!==8),'animated or duplicate PNG header');
      if(name==='IDAT')hasData=true;
      if(name==='IEND') {
        requireValue(length===0&&offset+12===bytes.length,'invalid PNG ending');ended=true;break;
      }
      offset+=12+length;
    }
    requireValue(ended&&hasData&&positive(width)&&positive(height),'incomplete PNG image');
    return {format:'png',width,height,lossless:true};
  }
  if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP') {
    requireValue(bytes.length>=26&&bytes.readUInt32LE(4)+8===bytes.length,'invalid WebP container size');
    let offset=12,canvas=null,frame=null;
    while(offset+8<=bytes.length) {
      const name=bytes.toString('ascii',offset,offset+4),length=bytes.readUInt32LE(offset+4);
      requireValue(offset+8+length+(length%2)<=bytes.length,'truncated WebP chunk');
      const data=bytes.subarray(offset+8,offset+8+length);
      requireValue(!['ANIM','ANMF'].includes(name),'animated originals are outside this review');
      if(name==='VP8X') {
        requireValue(length===10&&!canvas&&!(data[0]&2)&&data[1]===0&&data[2]===0&&data[3]===0,'invalid WebP extended header');
        canvas={width:data.readUIntLE(4,3)+1,height:data.readUIntLE(7,3)+1};
      }
      if(name==='VP8L') {
        requireValue(length>=5&&data[0]===0x2f&&!frame,'invalid lossless WebP header');
        const bits=data.readUInt32LE(1);
        requireValue((bits>>>29)===0,'unsupported lossless WebP version');
        frame={width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1,lossless:true};
      }
      if(name==='VP8 ') {
        requireValue(length>=10&&!frame&&data[3]===0x9d&&data[4]===0x01&&data[5]===0x2a,'invalid WebP frame header');
        frame={width:data.readUInt16LE(6)&0x3fff,height:data.readUInt16LE(8)&0x3fff,lossless:false};
      }
      offset+=8+length+(length%2);
    }
    requireValue(offset===bytes.length&&frame&&positive(frame.width)&&positive(frame.height)&&
      (!canvas||canvas.width===frame.width&&canvas.height===frame.height),'inconsistent WebP image dimensions');
    return {format:'webp',...frame};
  }
  if(bytes[0]===0xff&&bytes[1]===0xd8) {
    requireValue(bytes.at(-2)===0xff&&bytes.at(-1)===0xd9,'incomplete JPEG image');
    let offset=2;
    while(offset<bytes.length) {
      requireValue(bytes[offset]===0xff,'invalid JPEG marker');
      while(bytes[offset]===0xff)offset++;
      const marker=bytes[offset++];
      if(marker===0xd9||marker===0xda)break;
      if(marker===0x01||marker>=0xd0&&marker<=0xd7)continue;
      requireValue(offset+2<=bytes.length,'truncated JPEG segment');
      const length=bytes.readUInt16BE(offset);
      requireValue(length>=2&&offset+length<=bytes.length,'truncated JPEG dimensions');
      if([0xc0,0xc1,0xc2].includes(marker)) {
        requireValue(length>=8,'invalid JPEG frame header');
        const height=bytes.readUInt16BE(offset+3),width=bytes.readUInt16BE(offset+5);
        requireValue(positive(width)&&positive(height),'invalid JPEG dimensions');
        return {format:'jpeg',width,height,lossless:false};
      }
      offset+=length;
    }
  }
  fail('unsupported or invalid encoded image');
}

async function asset(root,descriptor) {
  const path=join(root,descriptor.localPath.slice(1));
  try {
    const stat=await lstat(path);
    requireValue(stat.isFile()&&!stat.isSymbolicLink()&&await realpath(path)===path,'symlink or non-file resource');
    const bytes=await readFile(path),native=dimensions(bytes);
    requireValue(positive(descriptor.bytes)&&bytes.length===descriptor.bytes&&HASH.test(descriptor.sha256??'')&&
      hash(bytes)===descriptor.sha256,'selected/original file hash or size differs');
    requireValue(native.width===descriptor.width&&native.height===descriptor.height,'encoded dimensions differ from review');
    const extension=descriptor.localPath.split('.').at(-1).toLowerCase();
    requireValue(native.format===(extension==='jpg'?'jpeg':extension),'image extension differs from encoded format');
    return {bytes,native};
  } catch(error) {
    if(error.message?.startsWith('Ecasa official originals:'))throw error;
    fail('cannot read reviewed asset: '+descriptor.localPath+' ('+error.code+')');
  }
}
function pixelReceipt(image) {
  const receipt=image.processing.pixelIntegrity;
  requireValue(receipt?.method==='sharp-libvips-lossless-extract'&&receipt.identical===true&&
    HASH.test(receipt.originalRectangleRgbaSha256??'')&&receipt.originalRectangleRgbaSha256===receipt.selectedRgbaSha256,
    'lossless extraction pixel receipt is missing or inconsistent');
  return receipt;
}
function rgba(frame,native) {
  requireValue(frame&&frame.width===native.width&&frame.height===native.height&&frame.channels===4&&
    (Buffer.isBuffer(frame.data)||frame.data instanceof Uint8Array)&&frame.data.length===frame.width*frame.height*4,
    'decoder must return exact native 8-bit RGBA pixels');
  return Buffer.from(frame.data);
}
async function verifyPixels(image,original,selected,decoder) {
  const originalData=rgba(await decoder(original.bytes),original.native);
  const selectedData=rgba(await decoder(selected.bytes),selected.native);
  const crop=image.crop??{x:0,y:0,width:image.original.width,height:image.original.height};
  const rectangle=createHash('sha256');
  for(let y=crop.y;y<crop.y+crop.height;y++)rectangle.update(originalData.subarray((y*image.original.width+crop.x)*4,
    (y*image.original.width+crop.x+crop.width)*4));
  const a=rectangle.digest('hex'),b=hash(selectedData);
  requireValue(a===b,'selected pixels differ from the exact original rectangle');
  if(image.processing.format==='webp_lossless') {
    const receipt=pixelReceipt(image);
    requireValue(a===receipt.originalRectangleRgbaSha256&&b===receipt.selectedRgbaSha256,'decoded pixels differ from the reviewed receipt');
  }
}

export async function validateOfficialOriginals(manifest,{root,decodePixels}={}) {
  requireValue(manifest?.schemaVersion===1&&manifest.baselineCommit===BASELINE&&
    manifest.scope==='two_named_ecasa_projects'&&manifest.protectedPreviewOnly===true,
    'unrecognized protected review scope or baseline');
  requireValue(manifest.rights?.status==='pending_explicit_ecasa_authorization'&&manifest.rights.publicWeb===false&&
    manifest.rights.irisYapo===false,'independent Ecasa public authorization remains pending');
  requireValue(Array.isArray(manifest.projects)&&equalMembers(manifest.projects.map(project=>project.slug),SLUGS),
    'only the two named development pages are authorized');
  requireValue(typeof root==='string'&&(!decodePixels||typeof decodePixels==='function'),'asset root and optional decoder are required');
  const base=await realpath(resolve(root)),paths=new Set(),ids=new Set(),projects=new Map(),assets=new Map(),originals=new Map(),sourceOwners=new Map();
  for(const project of manifest.projects) {
    requireValue(project.sourcePageUrl==='https://ecasa.cl/proyecto/'+project.slug,'source page is outside the named development');
    requireValue(Array.isArray(project.images)&&project.images.length>0&&Array.isArray(project.gallery)&&
      new Set(project.gallery).size===project.gallery.length,'explicit unique photograph inventory is required');
    for(const image of project.images) {
      requireValue(/^[a-z0-9_.-]+$/.test(image.id??'')&&!ids.has(project.slug+':'+image.id),'duplicate or unsafe image identity');
      ids.add(project.slug+':'+image.id);
      requireValue(localPath(image.localPath,project.slug)&&localPath(image.original?.localPath,project.slug,true)&&
        !paths.has(image.localPath)&&image.originCommercialSlug===project.slug&&image.scope==='development_general',
        'image must remain bound to its general named development');
      requireValue(!['etapa','stage','precioUF','precioDesdeUF','stock','commission'].some(key=>key in image),
        'stage-exclusive or commercial attributes are not image evidence');
      requireValue(officialUrl(image.original.url)&&typeof image.alt==='string'&&image.alt.trim().length>0&&
        !/[<>$%]|\b(?:uf|renta|rentabilidad|pie|comisi[oó]n|descuento|promo|tasa|subsidio)\b/i.test(image.alt),
        'source URL or caption is unsafe or contains commercial claims');
      requireValue(!/\betapa\b/i.test(image.alt),'general development photograph cannot claim an exclusive stage');
      for(const key of [image.original.url,image.original.sha256,image.sha256]) {
        requireValue(!sourceOwners.has(key)||sourceOwners.get(key)===project.slug,'original or selected photo borrowed from another development');
        sourceOwners.set(key,project.slug);
      }
      requireValue(image.processing?.resize===false&&image.processing.generative===false&&
        ['original','webp_lossless'].includes(image.processing.format),'resizing or generated image processing is forbidden');
      const crop=image.crop;
      requireValue(crop===null||crop&&equalMembers(Object.keys(crop),['x','y','width','height'])&&
        Number.isSafeInteger(crop.x)&&crop.x>=0&&Number.isSafeInteger(crop.y)&&crop.y>=0&&
        positive(crop.width)&&positive(crop.height)&&crop.x+crop.width<=image.original.width&&crop.y+crop.height<=image.original.height,
        'crop must be an exact native pixel rectangle within its original');
      const original=await asset(base,image.original),selected=await asset(base,image);
      requireValue(selected.native.width===(crop?.width??original.native.width)&&
        selected.native.height===(crop?.height??original.native.height),'selected dimensions imply a resize rather than extraction');
      if(image.processing.format==='original')requireValue(crop===null&&selected.bytes.equals(original.bytes),
        'original format requires an unchanged original copy');
      else {
        requireValue(selected.native.format==='webp'&&selected.native.lossless,'selected conversion must be lossless WebP');
        pixelReceipt(image);
      }
      // This known banner contains financial/surface claims in its lower band.
      // A crop may retain only photograph pixels, never any portion of that band.
      if(image.original.url==='https://ecasa.cl/uploads/images/slides/e1e4c9757a005d37065539f9552f5061.webp') {
        requireValue(crop&&(crop.x+crop.width<=980||crop.x>=2626||crop.y+crop.height<=1383||crop.y>=1628),
          'FerroParque commercial banner band must be entirely removed');
      }
      if(decodePixels)await verifyPixels(image,original,selected,decodePixels);
      paths.add(image.localPath);
      const approved=structuredClone(image);
      approved.alt=caption(image.alt);approved.projectSlug=project.slug;
      assets.set(image.localPath,approved);originals.set(image.original.localPath,structuredClone(image.original));
    }
    const owned=project.images.map(image=>image.localPath);
    requireValue(project.previewCover===null||owned.includes(project.previewCover),'cover must belong to this same general development');
    requireValue(project.gallery.every(path=>owned.includes(path)),'gallery contains a borrowed or original private resource');
    projects.set(project.slug,structuredClone(project));
  }
  const validated={scope:manifest.scope,baselineCommit:BASELINE,manifest:structuredClone(manifest),projects,assets,originals,
    summary:{projects:2,images:assets.size,originals:originals.size,publishedImages:[...assets.keys()].filter(path=>
      [...projects.values()].some(project=>project.previewCover===path||project.gallery.includes(path))).length,
    publicWeb:false,plansChanged:0,pixelVerification:decodePixels?'decoded_rgba_verified':'reviewed_receipt_and_encoded_hash_verified'}};
  records.set(validated,{projects,assets});
  return validated;
}
function verified(validated) {
  const record=records.get(validated);
  requireValue(record,'validated official-original review is required');return record;
}
export function selectPublishedOfficialAssets(validated,{preview=true}={}) {
  const {projects,assets}=verified(validated);
  if(!preview)return [];
  return [...assets.values()].filter(image=>{
    const project=projects.get(image.projectSlug);
    return project.previewCover===image.localPath||project.gallery.includes(image.localPath);
  }).map(image=>structuredClone(image));
}
function overlayQuality(baseQuality,validated) {
  requireValue(baseQuality?.scope==='ecasa_images_only'&&baseQuality.images instanceof Map&&baseQuality.projects instanceof Map,
    'validated existing image-quality policy is required');
  const {projects,assets}=verified(validated),overlay={...baseQuality,images:new Map(baseQuality.images),
    projects:new Map(baseQuality.projects),aliases:new Map(baseQuality.aliases)};
  for(const image of assets.values()) {
    overlay.images.set(image.localPath,{...image,kind:'official',decision:'keep',coverOnly:false,stageNumber:1,displayStage:null});
    overlay.aliases.set(image.localPath,image.localPath);
  }
  for(const project of projects.values()) {
    const existing=baseQuality.projects.get(project.slug);
    requireValue(existing?.origins.has(project.slug),'original development binding is absent from the frozen policy');
    overlay.projects.set(project.slug,{...existing,covers:{...existing.covers,preview:project.previewCover?
      {hero:project.previewCover,catalogue:project.previewCover}:{...existing.covers.preview}}});
  }
  return overlay;
}
const START='<!--ECASA_OFFICIAL_ORIGINALS_START-->',END='<!--ECASA_OFFICIAL_ORIGINALS_END-->';
function protectedParts(source) {
  return [...source.matchAll(/<iframe\b[^>]*>[\s\S]*?<\/iframe>|<dl\b[^>]*>[\s\S]*?<\/dl>|<details\b[^>]*class="aj-model"[^>]*>[\s\S]*?<\/details>|<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g)].map(match=>match[0]);
}
export function transformOfficialOriginals(source,slug,baseQuality,validated,{preview=true}={}) {
  const {projects,assets}=verified(validated),project=projects.get(slug);
  if(!preview||!project)return source;
  const before=protectedParts(source),overlay=overlayQuality(baseQuality,validated);
  const blocks=source.split(START).length-1;
  requireValue(blocks<=1&&blocks===source.split(END).length-1,'inconsistent official gallery markers');
  let result=source.replace(new RegExp(START+'[\\s\\S]*?'+END),'');
  if(project.previewCover)result=transformEcasaImageQuality(result,slug,overlay,{preview:true});
  if(project.gallery.length) {
    const gallery=/<section\b[^>]*\bid="galeria"[^>]*>/i.exec(result);
    requireValue(gallery,'existing image gallery insertion point is missing');
    const close=result.indexOf('</section>',gallery.index+gallery[0].length);
    requireValue(close>=0&&!/<section\b/i.test(result.slice(gallery.index+gallery[0].length,close)),
      'ambiguous nested gallery insertion point');
    const single=project.gallery.length===1;
    const figures=project.gallery.map(path=>{
      const image=assets.get(path);
      return '<figure data-commercial-stage="'+esc(slug)+'" data-official-scope="development_general"><a href="'+esc(path)+
        '" target="_blank" rel="noopener noreferrer"><img src="'+esc(path)+'" alt="'+esc(image.alt)+'" width="'+image.width+
        '" height="'+image.height+'" loading="lazy" decoding="async"'+(single?' style="aspect-ratio:'+image.width+'/'+image.height+'"':'')+'></a><figcaption>'+esc(image.alt)+'</figcaption></figure>';
    }).join('');
    const block=START+'<div class="aj-gallery-heading" data-commercial-stage="'+esc(slug)+
      '" data-official-scope="development_general"><h3>Fotografías del desarrollo</h3></div><div class="gallery-grid" data-commercial-stage="'+esc(slug)+
      '" data-official-scope="development_general"'+(single?' style="grid-template-columns:minmax(0,1fr)"':'')+'>'+figures+'</div>'+END;
    result=result.slice(0,close)+block+result.slice(close);
  }
  requireValue(JSON.stringify(protectedParts(result))===JSON.stringify(before),'plan, map, specification or runtime fragment changed');
  // Let the established byte-preserving validator check every new image and its
  // nearest commercial origin after insertion, without changing other content.
  if(project.previewCover)result=transformEcasaImageQuality(result,slug,overlay,{preview:true});
  return result;
}
export function applyOfficialCatalogue(catalogue,baseQuality,validated,{preview=true}={}) {
  const {projects}=verified(validated);
  if(!preview)return structuredClone(catalogue);
  const overlay=overlayQuality(baseQuality,validated);
  overlay.projects=new Map([...overlay.projects].filter(([slug])=>projects.get(slug)?.previewCover));
  return applyEcasaCatalogueImageQuality(catalogue,overlay,{preview:true,stageImages:false});
}
