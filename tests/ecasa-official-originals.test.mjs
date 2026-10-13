import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateEcasaImageQuality, transformEcasaImageQuality, applyEcasaCatalogueImageQuality } from '../scripts/ecasa-image-quality.mjs';
import { normalizeFicheCopy } from '../scripts/public-fiche-copy.mjs';
import { validateOfficialOriginals, selectPublishedOfficialAssets, transformOfficialOriginals, applyOfficialCatalogue } from '../scripts/ecasa-official-originals.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const BASELINE='0117cc546cc75183f73cae07c90dd093937a819f';
const PREFIX='/assets/propiedades/ecasa-official-review/';
const read=path=>readFileSync(join(ROOT,path));
const json=path=>JSON.parse(read(path));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const catalogue=json('data/proyectos.json');
const quality=validateEcasaImageQuality(json('data/brochures-ecasa.json'),json('data/fichas-proyectos.json'),catalogue,
  json('data/ecasa-image-quality.json'),json('data/fuentes-imagenes.json'));
const review=json('data/brochures-ecasa.json');
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=data=>{let crc=0xffffffff;for(const byte of data)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;};
function chunk(type,data) {
  const length=Buffer.alloc(4),body=Buffer.concat([Buffer.from(type),data]),crc=Buffer.alloc(4);
  length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(body));return Buffer.concat([length,body,crc]);
}
function png(data,width,height) {
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  const rows=[];for(let y=0;y<height;y++)rows.push(Buffer.from([0]),data.subarray(y*width*4,(y+1)*width*4));
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]);
}
function fixture() {
  const root=mkdtempSync(join(tmpdir(),'ecasa-official-originals-')),frames=new Map();
  const pixels=offset=>{
    const data=Buffer.alloc(32*16*4);
    for(let y=0;y<16;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4;data[i]=(x*7+offset)%256;data[i+1]=y*13;data[i+2]=(x+y)*5;data[i+3]=255;}
    return data;
  };
  const store=(path,bytes,width,height,data)=>{
    const full=join(root,path.slice(1));mkdirSync(dirname(full),{recursive:true});writeFileSync(full,bytes);
    frames.set(hash(bytes),{width,height,channels:4,data:Buffer.from(data)});
    return {localPath:path,sha256:hash(bytes),width,height,bytes:bytes.length};
  };
  const originalPixels=pixels(0),crop={x:4,y:3,width:16,height:8},selectedPixels=Buffer.concat(Array.from({length:8},(_,y)=>
    originalPixels.subarray(((y+3)*32+4)*4,((y+3)*32+20)*4)));
  // Genuine lossless WebP fixture produced from the native PNG pixel rectangle;
  // embedded bytes keep Git-only structural tests independent of codec packages.
  const selectedBytes=Buffer.from('UklGRjAAAABXRUJQVlA4TCQAAAAvD8ABALmM6H/sIgrf/wCRts0MTMf8qzw6/wHMC0ZiAhpWuQM=','base64');
  const original=store(PREFIX+'originals/ferroparque/source.png',png(originalPixels,32,16),32,16,originalPixels);
  original.url='https://ecasa.cl/uploads/images/diapositivas/test-fixture-ferro.png';
  const selected=store(PREFIX+'ferroparque/native-living.webp',selectedBytes,16,8,selectedPixels);
  const image={id:'native-living',...selected,alt:'Living del desarrollo',originCommercialSlug:'ferroparque',scope:'development_general',
    original,crop,processing:{resize:false,generative:false,format:'webp_lossless',pixelIntegrity:{method:'sharp-libvips-lossless-extract',
      originalRectangleRgbaSha256:hash(selectedPixels),selectedRgbaSha256:hash(selectedPixels),identical:true}}};
  const altoPixels=pixels(41),altoBytes=png(altoPixels,32,16);
  const altoOriginal=store(PREFIX+'originals/alto-san-joaquin/source.png',altoBytes,32,16,altoPixels);
  altoOriginal.url='https://ecasa.cl/uploads/images/diapositivas/test-fixture-alto.png';
  const alto={id:'native-living',...store(PREFIX+'alto-san-joaquin/native-living.png',altoBytes,32,16,altoPixels),
    alt:'Living y terraza · Imagen referencial',originCommercialSlug:'alto-san-joaquin',scope:'development_general',
    original:altoOriginal,crop:null,processing:{resize:false,generative:false,format:'original'}};
  const manifest={schemaVersion:1,baselineCommit:BASELINE,scope:'two_named_ecasa_projects',protectedPreviewOnly:true,
    rights:{status:'pending_explicit_ecasa_authorization',publicWeb:false,irisYapo:false},projects:[
      {slug:'ferroparque',sourcePageUrl:'https://ecasa.cl/proyecto/ferroparque',images:[image],previewCover:image.localPath,gallery:[image.localPath]},
      {slug:'alto-san-joaquin',sourcePageUrl:'https://ecasa.cl/proyecto/alto-san-joaquin',images:[alto],previewCover:alto.localPath,gallery:[alto.localPath]},
    ]};
  const decodePixels=async bytes=>{const frame=frames.get(hash(bytes));assert.ok(frame,'fixture decoder received an unknown encoded image');return {...frame,data:Buffer.from(frame.data)};};
  return {root,manifest,frames,decodePixels,image,alto,cleanup:()=>rmSync(root,{recursive:true,force:true})};
}
async function withFixture(run){const value=fixture();try{return await run(value);}finally{value.cleanup();}}
const reject=(f,mutate,options={})=>{const changed=structuredClone(f.manifest);mutate(changed);return assert.rejects(
  validateOfficialOriginals(changed,{root:f.root,...options}),/Ecasa official originals:/);};
const projected=slug=>normalizeFicheCopy(read(slug+'.html').toString().replace(/<!--ECASA_PUBLIC_START-->[\s\S]*?<!--ECASA_PUBLIC_END-->/g,'')
  .replace(/<!--ECASA_(?:PUBLIC|PREVIEW)_(?:START|END)-->/g,''));
const fragments=html=>[...html.matchAll(/<iframe\b[^>]*>[\s\S]*?<\/iframe>|<dl\b[^>]*>[\s\S]*?<\/dl>|<details\b[^>]*class="aj-model"[^>]*>[\s\S]*?<\/details>|<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/g)].map(match=>match[0]);
const fingerprint=value=>JSON.stringify(value,(_,item)=>item instanceof Map?[...item]:item instanceof Set?[...item]:item);

test('official originals validate exact encoded files and restrict publication to two protected development galleries',async()=>withFixture(async f=>{
  const before=structuredClone(f.manifest),validated=await validateOfficialOriginals(f.manifest,{root:f.root});
  assert.deepEqual(f.manifest,before);
  assert.deepEqual(validated.summary,{projects:2,images:2,originals:2,publishedImages:2,publicWeb:false,plansChanged:0,
    pixelVerification:'reviewed_receipt_and_encoded_hash_verified'});
  const assets=selectPublishedOfficialAssets(validated);
  assert.equal(assets.length,2);assert.ok(assets.every(image=>image.scope==='development_general'&&image.alt.includes('Imagen referencial')));
  assert.ok(assets.every(image=>!image.localPath.includes('/originals/')));
  assert.deepEqual(selectPublishedOfficialAssets(validated,{preview:false}),[]);
  assert.throws(()=>selectPublishedOfficialAssets({...validated}),/validated official-original review/);
}));

test('independent authorization, baseline, canonical identities and exact source pages fail closed',async()=>withFixture(async f=>{
  for(const mutate of [m=>m.baselineCommit='f'.repeat(40),m=>m.schemaVersion=2,m=>m.scope='all_ecasa',m=>m.protectedPreviewOnly=false,
    m=>m.rights.publicWeb=true,m=>m.rights.irisYapo=true,m=>m.rights.status='yapo_authorized',m=>m.projects.pop(),
    m=>m.projects[1].slug='alto-san-joaquin-2',m=>m.projects[0].sourcePageUrl='https://ecasa.cl/proyecto/ferroparque-2'])await reject(f,mutate);
}));

test('unsafe URLs, private-original publication and borrowed project or stage bindings are rejected',async()=>withFixture(async f=>{
  for(const mutate of [m=>m.projects[0].images[0].localPath=PREFIX+'ferroparque/../photo.webp',
    m=>m.projects[0].images[0].original.localPath=PREFIX+'originals/alto-san-joaquin/source.png',
    m=>m.projects[0].images[0].originCommercialSlug='ferroparque-2',m=>m.projects[0].images[0].scope='etapa_2',
    m=>m.projects[0].images[0].etapa=2,m=>m.projects[0].images[0].alt='Living Etapa 2',
    m=>m.projects[0].images[0].alt='Desde UF 2000',m=>m.projects[0].images[0].alt='<script>alert(1)</script>',
    m=>m.projects[0].images[0].original.url='https://another.example/images/photo.png',
    m=>m.projects[0].images[0].original.url='https://ecasa.cl/uploads/images/photo.png?width=2000',
    m=>m.projects[0].images[0].original.url='https://user:pass@ecasa.cl/uploads/images/photo.png',
    m=>m.projects[0].gallery=[m.projects[0].images[0].original.localPath],
    m=>m.projects[0].previewCover=m.projects[1].previewCover])await reject(f,mutate);
  await reject(f,m=>{m.projects[1].images[0].original.url=m.projects[0].images[0].original.url;});
}));

test('missing, symlinked, corrupted and geometrically inconsistent file evidence cannot build',async()=>withFixture(async f=>{
  for(const mutate of [m=>m.projects[0].images[0].sha256='a'.repeat(64),m=>m.projects[0].images[0].bytes++,
    m=>m.projects[0].images[0].width++,m=>m.projects[0].images[0].original.height++,
    m=>m.projects[0].images[0].original.localPath=PREFIX+'originals/ferroparque/missing.png'])await reject(f,mutate);
  const path=join(f.root,f.image.localPath.slice(1)),bytes=readFileSync(path);
  rmSync(path);symlinkSync(join(f.root,f.image.original.localPath.slice(1)),path);
  await assert.rejects(validateOfficialOriginals(f.manifest,{root:f.root}),/symlink or non-file/);
  rmSync(path);writeFileSync(path,bytes);
  const raw=join(f.root,f.alto.original.localPath.slice(1)),source=readFileSync(raw),bad=Buffer.from(source);bad[40]^=1;writeFileSync(raw,bad);
  await assert.rejects(validateOfficialOriginals(f.manifest,{root:f.root}),/corrupt PNG chunk/);
}));

test('only native extraction or unchanged copies are accepted; resize, synthesis and lossy conversion are forbidden',async()=>withFixture(async f=>{
  for(const mutate of [m=>m.projects[0].images[0].processing.resize=true,m=>m.projects[0].images[0].processing.generative=true,
    m=>m.projects[0].images[0].processing.format='webp_lossy',m=>m.projects[0].images[0].processing.format='original',
    m=>m.projects[0].images[0].crop.x=-1,m=>m.projects[0].images[0].crop.x=0.5,m=>m.projects[0].images[0].crop.height=20,
    m=>m.projects[0].images[0].crop.width=15,m=>m.projects[0].images[0].crop=null,
    m=>m.projects[1].images[0].crop={x:0,y:0,width:32,height:16}])await reject(f,mutate);
  await reject(f,m=>{m.projects[0].images[0].original.url='https://ecasa.cl/uploads/images/slides/e1e4c9757a005d37065539f9552f5061.webp';
    m.projects[0].images[0].crop={x:980,y:1383,width:16,height:8};});
}));

test('lossless pixel receipts are mandatory and the optional decoder verifies every exact crop byte',async()=>withFixture(async f=>{
  for(const mutate of [m=>delete m.projects[0].images[0].processing.pixelIntegrity,m=>m.projects[0].images[0].processing.pixelIntegrity.identical=false,
    m=>m.projects[0].images[0].processing.pixelIntegrity.method='upscale',m=>m.projects[0].images[0].processing.pixelIntegrity.selectedRgbaSha256='f'.repeat(64)])await reject(f,mutate);
  const validated=await validateOfficialOriginals(f.manifest,{root:f.root,decodePixels:f.decodePixels});
  assert.equal(validated.summary.pixelVerification,'decoded_rgba_verified');
  await reject(f,m=>{m.projects[0].images[0].crop.x++;},{decodePixels:f.decodePixels});
  await assert.rejects(validateOfficialOriginals(f.manifest,{root:f.root,decodePixels:async bytes=>{
    const frame=await f.decodePixels(bytes);if(frame.width===16)frame.data[0]^=1;return frame;
  }}),/selected pixels differ/);
  await assert.rejects(validateOfficialOriginals(f.manifest,{root:f.root,decodePixels:async bytes=>({...await f.decodePixels(bytes),channels:3})}),/8-bit RGBA/);
}));

test('Preview overlay adds natural galleries and coherent covers idempotently while preserving all protected fragments',async()=>withFixture(async f=>{
  const validated=await validateOfficialOriginals(f.manifest,{root:f.root}),beforeQuality=fingerprint(quality);
  for(const project of catalogue) {
    const source=projected(project.slug),base=project.inmobiliaria==='Ecasa'?transformEcasaImageQuality(source,project.slug,quality):source;
    const after=transformOfficialOriginals(base,project.slug,quality,validated);
    assert.deepEqual(fragments(after),fragments(base),project.slug);
    assert.equal(transformOfficialOriginals(base,project.slug,quality,validated,{preview:false}),base,project.slug+': public');
    const own=f.manifest.projects.find(record=>record.slug===project.slug);
    if(!own){assert.equal(after,base,project.slug+': unaffected canonical');continue;}
    assert.equal(transformOfficialOriginals(after,project.slug,quality,validated),after,project.slug+': idempotent');
    assert.equal((after.match(/Fotografías del desarrollo/g)??[]).length,1);
    assert.ok(after.includes('src="'+own.previewCover+'"'));
    assert.ok(after.includes('content="https://sollahms.cl'+own.previewCover+'"'));
    assert.equal(JSON.parse(after.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]).image,'https://sollahms.cl'+own.previewCover);
    const block=after.split('<!--ECASA_OFFICIAL_ORIGINALS_START-->')[1].split('<!--ECASA_OFFICIAL_ORIGINALS_END-->')[0];
    assert.ok(block.includes('data-commercial-stage="'+project.slug+'"'));assert.ok(block.includes('data-official-scope="development_general"'));
    assert.ok(block.includes('Imagen referencial'));assert.ok(!/Etapa [123]|brochure|documentad|\/originals\//.test(block));
    assert.ok(block.includes('style="grid-template-columns:minmax(0,1fr)"'));
    const selected=own.images.find(image=>image.localPath===own.gallery[0]);
    assert.ok(block.includes('style="aspect-ratio:'+selected.width+'/'+selected.height+'"'));
    assert.ok(!after.includes('<span class="ecasa-media-label">Etapa 1'));
    for(const model of review.projects.find(record=>record.slug===project.slug).models)assert.ok(after.includes(model.plan.localPath));
  }
  assert.equal(fingerprint(quality),beforeQuality);assert.equal(quality.images.size,118);assert.equal(quality.planPaths.size,74);
}));

test('catalogue override changes only two display covers and preserves every commercial price and all 22 stage snapshots',async()=>withFixture(async f=>{
  const validated=await validateOfficialOriginals(f.manifest,{root:f.root}),base=applyEcasaCatalogueImageQuality(catalogue,quality),before=structuredClone(base);
  const after=applyOfficialCatalogue(base,quality,validated);
  assert.deepEqual(base,before);assert.deepEqual(applyOfficialCatalogue(base,quality,validated,{preview:false}),base);
  let changed=0;
  for(let i=0;i<base.length;i++) {
    const expected=f.manifest.projects.find(record=>record.slug===base[i].slug);
    if(!expected){assert.deepEqual(after[i],base[i]);continue;}
    changed++;assert.equal(after[i].imagenPrincipal,expected.previewCover);assert.equal(after[i].imagenEtapa,undefined);
    const a=structuredClone(after[i]),b=structuredClone(base[i]);for(const key of ['imagenPrincipal','imagenAlt','imagenEtapa']){delete a[key];delete b[key];}
    assert.deepEqual(a,b);assert.deepEqual(after[i].etapasComerciales,base[i].etapasComerciales);
  }
  assert.equal(changed,2);assert.equal(after.length,136);assert.equal(after.filter(record=>record.inmobiliaria!=='Ecasa').length,121);
  assert.equal(after.filter(record=>Number.isFinite(record.precioDesdeUF)&&record.precioDesdeUF>0).length,106);
  assert.deepEqual(after.flatMap(record=>record.etapasComerciales??[]),base.flatMap(record=>record.etapasComerciales??[]));
}));

test('original catalogue, snapshots, quality policy, source HTML and 74 plan bindings remain byte exact',()=>{
  for(const path of ['data/proyectos.json','data/fichas-proyectos.json','data/registro-fichas.json','data/fuentes-imagenes.json',
    'data/ecasa-image-quality.json','data/brochures-ecasa.json','data/brochures-aj-urbana.json','data/brochures-ingevec.json','sitemap.xml','vercel.json',
    ...catalogue.map(project=>project.slug+'.html')])
    assert.deepEqual(read(path),execFileSync('git',['show',BASELINE+':'+path],{cwd:ROOT,maxBuffer:8*1024*1024}),path);
  assert.equal(json('data/fichas-proyectos.json').flatMap(project=>project.etapasComerciales??[]).length,22);
  assert.equal(review.projects.flatMap(project=>project.models).length,74);
});

test('null cover and sparse gallery never erase existing images or publish unselected private originals',async()=>withFixture(async f=>{
  const changed=structuredClone(f.manifest);changed.projects[0].previewCover=null;changed.projects[0].gallery=[];
  const validated=await validateOfficialOriginals(changed,{root:f.root}),base=transformEcasaImageQuality(projected('ferroparque'),'ferroparque',quality);
  assert.equal(transformOfficialOriginals(base,'ferroparque',quality,validated),base);
  assert.equal(selectPublishedOfficialAssets(validated).length,1);
  const data=applyEcasaCatalogueImageQuality(catalogue,quality);assert.deepEqual(applyOfficialCatalogue(data,quality,validated).find(p=>p.slug==='ferroparque'),data.find(p=>p.slug==='ferroparque'));
  await reject(f,m=>m.projects[0].gallery.push(m.projects[0].gallery[0]));
  await reject(f,m=>m.projects[0].images.push(structuredClone(m.projects[0].images[0])));
  assert.throws(()=>transformOfficialOriginals(base.replace('id="galeria"','id="other"'),'ferroparque',quality,
    {...validated}),/validated official-original review/);
}));

const privateRelease=process.env.SOLLAHMS_OFFICIAL_ORIGINALS_RELEASE==='1';
test('real private official originals decode to exact native rectangles and retain frozen evidence', {skip:!privateRelease},async()=>{
  const require=createRequire(import.meta.url),sharp=require(process.env.SOLLAHMS_SHARP_MODULE||'sharp');
  const manifest=json('data/ecasa-official-originals.json'),before=JSON.stringify(manifest);
  const decodePixels=async bytes=>{
    const {data,info}=await sharp(bytes).ensureAlpha().raw({depth:'uchar'}).toBuffer({resolveWithObject:true});
    return {data,width:info.width,height:info.height,channels:info.channels};
  };
  const validated=await validateOfficialOriginals(manifest,{root:ROOT,decodePixels});
  assert.deepEqual(validated.summary,{projects:2,images:2,originals:2,publishedImages:2,publicWeb:false,plansChanged:0,pixelVerification:'decoded_rgba_verified'});
  assert.equal(JSON.stringify(manifest),before);assert.equal(selectPublishedOfficialAssets(validated).length,2);
  for(const record of manifest.projects) {
    const source=transformEcasaImageQuality(projected(record.slug),record.slug,quality),after=transformOfficialOriginals(source,record.slug,quality,validated);
    assert.deepEqual(fragments(after),fragments(source));
    assert.ok(after.includes(record.previewCover));assert.ok(!after.includes('/ecasa-official-review/originals/'));
    assert.ok(!/33 A 54|1\.600\.000|TE APOYAMOS/.test(after));
  }
});
