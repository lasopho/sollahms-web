// The owner's five supplied photographs override only their protected covers.
// Original photographs, all galleries, plans and commercial records stay intact.
import { readFile, lstat, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
const BASELINE='04d9628787c825532c3507a15db7f0f2cbb42c4b';
const PREFIX='/assets/propiedades/ecasa-owner-review/';
const NAMES=new Map([
  ['edificio-bezanilla',['web-header-bezanilla-1649x972.png','Fachada de Bezanilla']],
  ['espacio-victoria',['espacio victoria.png','Fachada de Espacio Victoria']],
  ['aires-la-florida-2',['header-aires2-1640x972.png','Fachada de Aires La Florida 2']],
  ['conecta-huechuraba',['header-conecta 1640x972.png','Vista del desarrollo de Conecta Huechuraba']],
  ['urban-la-florida',['web-header-urban-lf-1649x972.png','Fachada de Urban La Florida']],
]);
const trusted=new WeakMap();
const requireValue=(value,message)=>{if(!value)throw new Error('Ecasa owner cover: '+message);};
const keys=(value,expected)=>value&&Object.keys(value).length===expected.length&&expected.every(key=>Object.hasOwn(value,key));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function encoded(bytes) {
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    requireValue(bytes.length>=33&&bytes.toString('ascii',12,16)==='IHDR','invalid PNG header');
    return {format:'png',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
  }
  requireValue(bytes.length>=26&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'&&
    bytes.readUInt32LE(4)+8===bytes.length,'invalid WebP container');
  let dimensions=null,offset=12;
  while(offset+8<=bytes.length) {
    const name=bytes.toString('ascii',offset,offset+4),length=bytes.readUInt32LE(offset+4);
    requireValue(offset+8+length+(length%2)<=bytes.length&&!['ANIM','ANMF','VP8 '].includes(name),'invalid/lossy/animated WebP');
    if(name==='VP8L') {
      requireValue(!dimensions&&length>=5&&bytes[offset+8]===0x2f,'invalid lossless frame');
      const bits=bytes.readUInt32LE(offset+9);
      dimensions={format:'webp',width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
    }
    offset+=8+length+(length%2);
  }
  requireValue(offset===bytes.length&&dimensions,'lossless frame missing'); return dimensions;
}
async function inspect(asset,root,original,slug) {
  const prefix=PREFIX+(original?'originals/':'')+slug+'/';
  requireValue(keys(asset,['localPath','sha256','bytes','width','height',original?'fileName':'alt'])&&
    typeof asset.localPath==='string'&&asset.localPath.startsWith(prefix)&&!asset.localPath.includes('..')&&
    new RegExp('^[a-z0-9_.-]+\\.'+(original?'png':'webp')+'$').test(asset.localPath.slice(prefix.length))&&
    /^[a-f0-9]{64}$/.test(asset.sha256)&&['bytes','width','height'].every(key=>Number.isSafeInteger(asset[key])&&asset[key]>0),
    'unreviewed asset identity or dimensions');
  const path=resolve(root,'.'+asset.localPath),info=await lstat(path),actual=await realpath(path);
  requireValue(info.isFile()&&!info.isSymbolicLink()&&actual.startsWith((await realpath(root))+sep),'asset escapes source tree');
  const bytes=await readFile(path),dimensions=encoded(bytes);
  requireValue(bytes.length===asset.bytes&&hash(bytes)===asset.sha256&&dimensions.width===asset.width&&
    dimensions.height===asset.height&&dimensions.format===(original?'png':'webp'),'asset bytes/hash/native dimensions differ');
  return {path:asset.localPath,sha256:asset.sha256,bytes:asset.bytes,width:asset.width,height:asset.height,kind:original?'original':'selected'};
}
export async function validateOwnerCover(manifest,{root,manualPolicy}) {
  const legacy=manifest?.schemaVersion===1;
  requireValue(keys(manifest,legacy?['schemaVersion','scope','protectedPreviewOnly','baselineCommit','projectSlug','provenance','original','selected','conversion','supersededCoverOnly']:
    ['schemaVersion','scope','protectedPreviewOnly','baselineCommit','provenance','projects'])&&
    [1,2].includes(manifest.schemaVersion)&&manifest.scope===(legacy?'ecasa_owner_cover_only':'ecasa_owner_covers_only')&&
    manifest.protectedPreviewOnly===true&&manifest.baselineCommit===BASELINE&&manifest.provenance==='user_provided','unrecognized owner instruction');
  const projects=legacy?[Object.fromEntries(['projectSlug','original','selected','conversion','supersededCoverOnly'].map(key=>[key,manifest[key]]))]:manifest.projects;
  requireValue(Array.isArray(projects)&&projects.length===(legacy?1:5)&&new Set(projects.map(project=>project.projectSlug)).size===projects.length&&
    projects.every(project=>NAMES.has(project.projectSlug))&&(!legacy||projects[0].projectSlug==='edificio-bezanilla'),'exact supplied project identities required');
  const sourceAssets=[];
  for(const project of projects) {
    requireValue(keys(project,['projectSlug','original','selected','conversion','supersededCoverOnly']),'unexpected project fields');
    const {projectSlug:slug,original,selected,conversion,supersededCoverOnly:former}=project;
    requireValue(keys(conversion,['format','lossless','resize','crop'])&&conversion.format==='webp'&&conversion.lossless===true&&conversion.resize===false,
      'only native lossless conversion/extraction is authorized');
    const crop=legacy&&conversion.crop===false?null:conversion.crop;
    requireValue(crop===null||keys(crop,['left','top','width','height'])&&Object.values(crop).every(value=>Number.isSafeInteger(value))&&
      crop.left>=0&&crop.top>=0&&crop.width>0&&crop.height>0&&crop.left+crop.width<=original.width&&crop.top+crop.height<=original.height,
      'crop escapes original or invents pixels');
    const [fileName,alt]=NAMES.get(slug);
    requireValue(original.fileName===fileName&&selected.alt===alt,'source attribution or selected description changed');
    const old=manualPolicy?.projects?.find(record=>record.slug===slug),previous=old?.images.find(image=>image.localPath===old.previewCover);
    requireValue(previous?.kind==='documentary','original selected source identity missing');
    if(previous.coverOnly)requireValue(keys(former,['localPath','sha256'])&&previous.decision==='exclude'&&former.localPath===previous.localPath&&
      former.sha256===previous.sha256,'only the documented former cover may be superseded');
    else requireValue(former===null&&previous.decision==='keep','gallery photographs cannot be removed as former covers');
    sourceAssets.push(...await Promise.all([inspect(original,root,true,slug),inspect(selected,root,false,slug)]));
    requireValue(selected.width===(crop?.width??original.width)&&selected.height===(crop?.height??original.height),'native source/crop dimensions changed');
  }
  sourceAssets.sort((a,b)=>a.path.localeCompare(b.path));
  const policy=structuredClone(manifest),records=structuredClone(projects);
  const validated={policy:structuredClone(policy),projects:structuredClone(records),sourceAssets:structuredClone(sourceAssets)};
  trusted.set(validated,{policy,projects:records,sourceAssets});return validated;
}
function review(validated) {const value=trusted.get(validated);requireValue(value,'validated owner covers required');return value;}
export function selectPublishedOwnerAssets(validated,{preview=false}={}) {
  return preview?review(validated).projects.map(project=>structuredClone(project.selected)).sort((a,b)=>a.localPath.localeCompare(b.localPath)):[];
}
export function applyOwnerCatalogue(catalogue,validated,{preview=false}={}) {
  if(!preview)return catalogue;
  const projects=review(validated).projects;
  for(const record of projects)requireValue(catalogue.filter(project=>project.slug===record.projectSlug&&project.inmobiliaria==='Ecasa').length===1,
    'canonical source development missing');
  return catalogue.map(project=>{
    const record=projects.find(record=>record.projectSlug===project.slug);
    return record?{...project,imagenPrincipal:record.selected.localPath,imagenAlt:record.selected.alt}:project;
  });
}
const attr=(tag,name,value)=>{
  const pattern=new RegExp('\\b'+name+'=(?:"[^"]*"|\x27[^\x27]*\x27)','i');
  const replacement=name+'="'+esc(value)+'"';
  return pattern.test(tag)?tag.replace(pattern,replacement):tag.replace(/\/?\s*>$/,' '+replacement+'>');
};
export function transformOwnerCover(html,slug,validated,{preview=false}={}) {
  if(!preview)return html;
  const projects=review(validated).projects,record=projects.find(project=>project.projectSlug===slug);
  if(slug!=='proyectos'&&!record)return html;
  const marker='ecasa-owner-cover-framing';
  requireValue(!html.includes('id="'+marker+'"'),'duplicate owner framing');
  let css='';
  if(slug==='proyectos')css=projects.map(project=>{
    const {width,height}=project.selected;
    return '.catalog-card[data-project="'+project.projectSlug+'"] .catalog-cover{aspect-ratio:'+width+'/'+height+'}'+
      '.catalog-card[data-project="'+project.projectSlug+'"] .catalog-cover-image{object-fit:contain;object-position:center}';
  }).join('');
  else {
    const {selected}=record,ratio=selected.width+'/'+selected.height;
    const former=record.supersededCoverOnly?.localPath??null;
    let count=0,priorPath=null;
    html=html.replace(/<img\b[^>]*>/g,tag=>{
      if(!/\bclass="[^"]*\bhero-image\b/.test(tag))return tag;
      priorPath=/\bsrc="([^"]+)"/.exec(tag)?.[1];
      requireValue(priorPath&&(former===null||priorPath===former),'unexpected previous project cover');count++;
      for(const [name,value] of Object.entries({src:selected.localPath,alt:selected.alt,width:selected.width,height:selected.height,
        class:'hero-image ecasa-owner-hero','data-commercial-stage':slug}))tag=attr(tag,name,value);
      return tag;
    });
    requireValue(count===1,'exactly one project hero required');
    const end=html.indexOf('</head>');requireValue(end>=0,'head missing');
    html=html.slice(0,end).replaceAll(priorPath,selected.localPath)+html.slice(end);
    html=html.replace(/(<meta\b[^>]*property="og:image:alt"[^>]*content=")[^"]*(")/g,'$1'+esc(selected.alt)+'$2');
    const portrait=selected.width/selected.height<1.5;
    const frame='.project-hero:has(.ecasa-owner-hero)';
    if(portrait)css=frame+'{display:grid;grid-template-columns:45% 55%;min-height:0;aspect-ratio:auto;align-items:stretch}'+
      '.project-hero .ecasa-owner-hero{position:relative;inset:auto;grid-column:2;grid-row:1;width:100%;height:auto;object-fit:contain;object-position:center;align-self:center;z-index:0}'+
      frame+' .hero-content{grid-column:1;grid-row:1;align-self:center;width:100%;padding-top:40px;padding-bottom:40px}'+frame+' .hero-shade{display:none}';
    else css=frame+'{min-height:0;aspect-ratio:'+ratio+'}.project-hero .ecasa-owner-hero{object-fit:contain;object-position:center}';
    css+='@media(max-width:'+(portrait?'700':'900')+'px){'+frame+'{display:block;aspect-ratio:auto}.project-hero .ecasa-owner-hero{position:relative;inset:auto;width:100%;height:auto;z-index:0}'+
      frame+' .hero-shade{display:none}'+frame+' .hero-content{position:relative;padding-top:28px;padding-bottom:32px}'+frame+' .breadcrumb{margin-bottom:22px}}';
  }
  return html.replace('</head>','<style id="'+marker+'">'+css+'</style>\n</head>');
}
