// Publication selection only. Documentary evidence and commercial snapshots
// remain intact; this module never edits a source file or changes image bytes.
import { naturalCaption } from './public-fiche-copy.mjs';

const BASELINE = '2d34997f8fd82b775c0697b20493674773e7fdc2';
const HASH = /^[a-f0-9]{64}$/;
const LOCAL = /^\/assets\/propiedades\/[a-z0-9/_.-]+\.(?:webp|png|jpe?g)$/i;
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const fail = message => { throw new Error('Ecasa image quality: ' + message); };
const requireValue = (condition, message) => { if (!condition) fail(message); };
const sameMembers = (a,b) => a.length === b.length && new Set(a).size === a.length && a.every(item => b.includes(item));
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const decode = value => value.replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi,entity => {
  const named = {'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '};
  return named[entity.toLowerCase()] ?? String.fromCodePoint(parseInt(entity.slice(2,-1).replace(/^x/i,''),/^&#x/i.test(entity)?16:10));
});
const classes = node => (node.attrs.class ?? '').split(/\s+/);
const hasClass = (node,value) => classes(node).includes(value);
const ancestors = function*(node) { for(let current=node;current;current=current.parent) yield current; };
const descendants = node => node.children.flatMap(child => [child,...descendants(child)]);

function attributes(tag) {
  const result = {};
  const opening = tag.replace(/^<[a-z][a-z0-9:-]*/i,'').replace(/\/?\s*>$/,'');
  for(const match of opening.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return result;
}

// Preserve original byte slices. Only explicitly selected image elements,
// their now-empty gallery wrappers and image metadata are replaced or removed.
function parse(source) {
  const root={tag:'root',attrs:{},children:[],parent:null,start:0,end:source.length},nodes=[],stack=[root];
  const tokens=/<!--[\s\S]*?-->|<(script|style)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<\/?[a-z][a-z0-9:-]*(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  for(const match of source.matchAll(tokens)) {
    const token=match[0];
    if(token.startsWith('<!--')) continue;
    const tag=/^<\/?([a-z][a-z0-9:-]*)/i.exec(token)[1].toLowerCase();
    if(token.startsWith('</')) {
      const index=stack.findLastIndex(node=>node.tag===tag);
      if(index>0) {
        stack[index].closeStart=match.index;stack[index].end=match.index+token.length;stack.length=index;
      }
      continue;
    }
    const rawTag=/^<(?:[^>"']|"[^"]*"|'[^']*')+>/.exec(token)[0];
    const node={tag,attrs:attributes(rawTag),rawTag,start:match.index,openEnd:match.index+rawTag.length,
      end:match.index+token.length,closeStart:null,children:[],parent:stack.at(-1)};
    node.parent.children.push(node);nodes.push(node);
    if(tag==='script'||tag==='style') node.closeStart=match.index+token.lastIndexOf('</');
    else if(!VOID.has(tag)&&!rawTag.endsWith('/>')) { node.end=source.length;stack.push(node); }
  }
  return {root,nodes};
}

function setAttribute(tag,name,value) {
  const pattern=new RegExp('(\\s'+name+'\\s*=\\s*)(?:"[^"]*"|\'[^\']*\'|[^\\s>]+)','i');
  const replacement=' '+name+'="'+esc(value)+'"';
  return pattern.test(tag)?tag.replace(pattern,replacement):tag.replace(/\/?\s*>$/,replacement+'>');
}

function edits(source,changes) {
  const accepted=[];
  for(const change of changes.sort((a,b)=>a.start-b.start||b.end-a.end)) {
    if(accepted.some(prior=>prior.start<=change.start&&prior.end>=change.end)) continue;
    requireValue(!accepted.some(prior=>prior.end>change.start),'overlapping image transformations');
    accepted.push(change);
  }
  let result=source;
  for(const change of accepted.reverse()) result=result.slice(0,change.start)+change.text+result.slice(change.end);
  return result;
}

function imagePath(value) {
  if(typeof value!=='string') return null;
  if(value.startsWith('/')) return value;
  try { const url=new URL(value);return url.hostname==='sollahms.cl'&&LOCAL.test(url.pathname)?url.pathname:value; }
  catch { return value; }
}

export function validateEcasaImageQuality(review,research,catalogue,policy,officialSources) {
  requireValue(policy?.schemaVersion===1&&policy.baselineCommit===BASELINE&&policy.scope==='ecasa_images_only'&&
    /^\d{4}-\d{2}-\d{2}$/.test(policy.reviewedOn??''),'unrecognized review scope or baseline');
  requireValue(Array.isArray(catalogue) && (catalogue.length === 136 || catalogue.length === 137 && catalogue.filter(project => project.slug === 'edificio-nordico').length === 1), 'the 136 canonical projects and authorized Nórdico addition must remain intact');
  const ecasa=catalogue.filter(project=>project.inmobiliaria==='Ecasa');
  requireValue(ecasa.length===15&&Array.isArray(review?.projects)&&review.projects.length===15&&
    Array.isArray(policy.projects)&&policy.projects.length===15,'exactly fifteen Ecasa project selections are required');
  const slugs=ecasa.map(project=>project.slug);
  requireValue(sameMembers(review.projects.map(record=>record.slug),slugs)&&sameMembers(policy.projects.map(record=>record.slug),slugs),
    'quality policy cannot remove or add a project');
  requireValue(officialSources&&typeof officialSources==='object','official image provenance is required');
  const originals=new Map(),projectRecords=new Map(),planPaths=new Set(),planOwners=new Map(),aliases=new Map();
  const records=new Map(research.map(record=>[record.slug,record]));
  for(const record of review.projects) {
    const evidence=records.get(record.slug),project=ecasa.find(project=>project.slug===record.slug);
    requireValue(Array.isArray(evidence?.etapasComerciales),'the original commercial snapshots are required');
    const origins=new Map(evidence.etapasComerciales.map(stage=>[stage.slug,stage]));
    requireValue(sameMembers([...origins.keys()],record.commercialSourceSlugs),'commercial stage inventory changed');
    const stageNumber=origin=> {
      const stage=project.etapasComerciales.find(stage=>stage.slug===origin);
      return Number(stage?.detalleUrl?.split('#etapa-')[1]);
    };
    const displayStage=(origin,image)=> {
      if(typeof image.etapa==='string'&&image.etapa.trim()) return image.etapa;
      const source=origins.get(origin)?.catalogo;
      // The consolidated wrapper's default "1" links a general development;
      // it does not prove its photos are exclusive to the first phase.
      return Number.isInteger(source?.etapa)&&new RegExp('\\s'+source.etapa+'$').test(source.nombre??'')?
        'Etapa '+source.etapa:null;
    };
    const add=image=> {
      requireValue(!originals.has(image.localPath)&&LOCAL.test(image.localPath)&&!image.localPath.includes('..'),
        'duplicate or unsafe image path');
      requireValue(origins.has(image.originCommercialSlug)&&Number.isInteger(image.stageNumber)&&image.stageNumber>0,
        'photograph belongs to another commercial stage');
      originals.set(image.localPath,image);aliases.set(image.localPath,image.localPath);
      if(image.url) aliases.set(image.url,image.localPath);
    };
    for(const stage of evidence.etapasComerciales) for(const image of stage.investigacion.images??[]) {
      const source=officialSources[image.url];
      requireValue(image.localPath?.startsWith('/assets/propiedades/catalogo/')&&source?.status==='downloaded'&&
        source.localPath===image.localPath&&HASH.test(source.localSha256??'')&&
        source.width===image.width&&source.height===image.height,'official image source binding changed');
      add({...image,sha256:source.localSha256,kind:'official',projectSlug:record.slug,originCommercialSlug:stage.slug,
        stageNumber:stageNumber(stage.slug),displayStage:displayStage(stage.slug,image),alt:naturalCaption(image.alt??project.nombre)});
    }
    for(const image of record.images) add({...image,kind:'documentary',projectSlug:record.slug,
      stageNumber:stageNumber(image.originCommercialSlug),displayStage:displayStage(image.originCommercialSlug,image),
      alt:naturalCaption(image.displayCaption??image.caption)});
    for(const model of record.models) {
      requireValue(!planPaths.has(model.plan.localPath),'duplicate plan path');planPaths.add(model.plan.localPath);
      planOwners.set(model.plan.localPath,record.slug);
    }
    projectRecords.set(record.slug,{slug:record.slug,name:project.nombre,multiple:origins.size>1,origins:new Set(origins.keys())});
  }
  requireValue(originals.size===118&&[...originals.values()].filter(image=>image.kind==='official').length===62&&
    [...originals.values()].filter(image=>image.kind==='documentary').length===56&&planPaths.size===74,
    'the original 118 photographs and 74 plans must be retained as evidence');
  const selected=new Map(),projects=new Map();
  for(const project of structuredClone(policy.projects)) {
    const expected=[...originals.values()].filter(image=>image.projectSlug===project.slug);
    requireValue(Array.isArray(project.images)&&sameMembers(project.images.map(image=>image.localPath),expected.map(image=>image.localPath)),
      'image review is incomplete or includes an unrelated resource: '+project.slug);
    for(const choice of project.images) {
      const original=originals.get(choice.localPath);
      requireValue(!planPaths.has(choice.localPath)&&['keep','exclude'].includes(choice.decision)&&typeof choice.coverOnly==='boolean'&&
        typeof choice.reason==='string'&&choice.reason.trim().length>0,'explicit image-only decision is required');
      for(const field of ['sha256','width','height','originCommercialSlug','kind']) requireValue(choice[field]===original[field],
        'quality review changed source evidence: '+choice.localPath+'/'+field);
      requireValue(!choice.coverOnly||choice.decision==='exclude','cover-only images cannot re-enter galleries');
      selected.set(choice.localPath,{...original,...choice});
    }
    requireValue(project.covers&&sameMembers(Object.keys(project.covers),['preview','public']),'both build-profile cover selections are required');
    for(const profile of ['preview','public']) {
      const covers=project.covers[profile];
      requireValue(covers&&sameMembers(Object.keys(covers),['hero','catalogue']),'hero and catalogue choices are required');
      for(const role of ['hero','catalogue']) {
        const path=covers[role],image=selected.get(path);
        requireValue(path===null||(image?.projectSlug===project.slug&&(image.decision==='keep'||image.coverOnly)),
          'cover is excluded or belongs to another project: '+project.slug+'/'+profile+'/'+role);
        requireValue(path===null||profile==='preview'||image.kind==='official','protected documentary image in public cover');
      }
    }
    for(const image of project.images.filter(image=>image.coverOnly)) requireValue(
      Object.values(project.covers).some(covers=>Object.values(covers).includes(image.localPath)),
      'cover-only exception has no explicit cover use: '+image.localPath);
    projects.set(project.slug,{...projectRecords.get(project.slug),...project});
  }
  requireValue(selected.size===118,'every source photograph requires a decision');
  return {scope:'ecasa_images_only',baselineCommit:BASELINE,policy:structuredClone(policy),images:selected,projects,aliases,planPaths,planOwners,
    summary:{reviewedImages:118,officialImages:62,documentaryImages:56,plansPreserved:74,
      keptImages:[...selected.values()].filter(image=>image.decision==='keep').length,
      excludedImages:[...selected.values()].filter(image=>image.decision==='exclude').length,
      coverOnlyImages:[...selected.values()].filter(image=>image.coverOnly).length}};
}

function projectChoice(validated,slug,preview) {
  requireValue(validated?.scope==='ecasa_images_only','validated quality selection is required');
  const project=validated.projects.get(slug);
  if(!project) return null;
  return {...project,covers:project.covers[preview?'preview':'public']};
}

export function selectEcasaPublishedAssets(review,validated,{preview=true}={}) {
  if(!preview) return [];
  const selected=[];
  for(const record of review.projects) {
    const project=projectChoice(validated,record.slug,true),covers=new Set(Object.values(project.covers).filter(Boolean));
    selected.push(...record.images.filter(image=>{
      const choice=validated.images.get(image.localPath);
      return choice.decision==='keep'||(choice.coverOnly&&covers.has(image.localPath));
    }),...record.models.map(model=>model.plan));
  }
  requireValue(selected.filter(asset=>asset.kind==='plan').length===74,'all seventy-four plans must remain published');
  return selected;
}

function protectedFragments(source) {
  const tree=parse(source);
  return tree.nodes.filter(node=>node.tag==='iframe'||hasClass(node,'aj-model')||node.tag==='dl'||
    (node.tag==='script'&&node.attrs.type!=='application/ld+json')).map(node=>source.slice(node.start,node.end));
}

export function transformEcasaImageQuality(source,slug,validated,{preview=true}={}) {
  const project=projectChoice(validated,slug,preview);
  if(!project) return source;
  requireValue(!/<!--ECASA_(?:PUBLIC|PREVIEW)_START-->/.test(source),'resolve publication-profile markers before filtering');
  const before=protectedFragments(source),tree=parse(source),changes=[];
  const findImage=value=>validated.images.get(validated.aliases.get(imagePath(value))??imagePath(value));
  for(const node of tree.nodes.filter(node=>node.tag==='img')) {
    const image=findImage(node.attrs.src);
    if(image) {
      requireValue(image.projectSlug===slug,'image escaped its own development');
      const origin=[...ancestors(node)].find(parent=>parent.attrs['data-commercial-stage'])?.attrs['data-commercial-stage'];
      requireValue(origin===image.originCommercialSlug,'visible photograph has another commercial-stage attribution');
    } else {
      const propertyImage=LOCAL.test(imagePath(node.attrs.src)??'')||[...ancestors(node)].some(parent=>
        hasClass(parent,'gallery-grid')||hasClass(parent,'project-hero'));
      if(propertyImage) requireValue(validated.planOwners.get(imagePath(node.attrs.src))===slug,'unknown property image in '+slug);
    }
  }
  for(const figure of tree.nodes.filter(node=>node.tag==='figure')) {
    const images=descendants(figure).filter(node=>node.tag==='img');
    const chosen=images.map(node=>findImage(node.attrs.src)).filter(Boolean);
    if(!chosen.length) continue;
    requireValue(images.length===1,'image-quality filtering requires an unambiguous single-image figure');
    if(chosen[0].decision==='exclude'||chosen[0].coverOnly) changes.push({start:figure.start,end:figure.end,text:''});
  }
  const heroSection=tree.nodes.find(node=>hasClass(node,'project-hero'));
  requireValue(heroSection,'project hero section is missing');
  const heroes=descendants(heroSection).filter(node=>node.tag==='img'&&hasClass(node,'hero-image'));
  requireValue(heroes.length<=1,'multiple visible hero images');
  const cover=project.covers.hero?validated.images.get(project.covers.hero):null;
  for(const label of descendants(heroSection).filter(node=>hasClass(node,'ecasa-media-label')))
    changes.push({start:label.start,end:label.end,text:''});
  const caption=cover?.alt??'';
  const stageLabel=cover&&project.multiple&&cover.displayStage?
    '<span class="ecasa-media-label">'+esc(cover.displayStage)+' · Imagen referencial</span>':'';
  if(cover) {
    let tag=heroes[0]?.rawTag??'<img class="hero-image" fetchpriority="high" decoding="async">';
    tag=setAttribute(setAttribute(setAttribute(tag,'src',cover.localPath),'alt',caption),'data-commercial-stage',cover.originCommercialSlug);
    for(const field of ['width','height']) if(heroes[0]?.attrs[field]) tag=setAttribute(tag,field,cover[field]);
    if(heroes[0]) changes.push({start:heroes[0].start,end:heroes[0].end,text:tag+stageLabel});
    else {
      const shade=descendants(heroSection).find(node=>hasClass(node,'hero-shade'));
      requireValue(shade,'hero insertion point is missing');changes.push({start:shade.start,end:shade.start,text:tag+stageLabel});
    }
  } else if(heroes[0]) changes.push({start:heroes[0].start,end:heroes[0].end,text:''});
  const heroClasses=classes(heroSection).filter(value=>value&&value!=='hero-without-image');
  if(!cover) heroClasses.push('hero-without-image');
  changes.push({start:heroSection.start,end:heroSection.openEnd,text:setAttribute(heroSection.rawTag,'class',heroClasses.join(' '))});
  for(const node of tree.nodes.filter(node=>node.tag==='meta')) {
    const key=(node.attrs.property??node.attrs.name??'').toLowerCase();
    if(/^og:image(?::(?:alt|width|height|secure_url|url))?$/.test(key)||/^twitter:image(?::alt)?$/.test(key)) {
      if(!cover) changes.push({start:node.start,end:node.end,text:''});
      else {
        const value=key.endsWith(':alt')?caption:key.endsWith(':width')?cover.width:key.endsWith(':height')?cover.height:
          'https://sollahms.cl'+cover.localPath;
        changes.push({start:node.start,end:node.end,text:setAttribute(node.rawTag,'content',value)});
      }
    } else if(key==='twitter:card') changes.push({start:node.start,end:node.end,
      text:setAttribute(node.rawTag,'content',cover?'summary_large_image':'summary')});
  }
  for(const node of tree.nodes.filter(node=>node.tag==='script'&&node.attrs.type==='application/ld+json')) {
    const original=JSON.parse(source.slice(node.openEnd,node.closeStart));
    requireValue(original&&typeof original==='object'&&!Array.isArray(original),'unrecognized project image metadata');
    const updated=structuredClone(original);
    if(cover) updated.image='https://sollahms.cl'+cover.localPath; else delete updated.image;
    if(JSON.stringify(updated)!==JSON.stringify(original)) changes.push({start:node.openEnd,end:node.closeStart,
      text:JSON.stringify(updated).replaceAll('<','\\u003c')});
  }
  let result=edits(source,changes);
  // Prune only empty image groups, their immediately associated image heading,
  // and a gallery section/navigation that has no remaining photographs.
  let current=parse(result),cleanup=[];
  for(const grid of current.nodes.filter(node=>hasClass(node,'gallery-grid'))) {
    if(descendants(grid).some(node=>node.tag==='img')) continue;
    cleanup.push({start:grid.start,end:grid.end,text:''});
    const siblings=grid.parent.children,index=siblings.indexOf(grid),previous=siblings[index-1];
    if(previous&&(hasClass(previous,'aj-gallery-heading')||previous.tag==='h3'&&
      /Imágenes de esta etapa/.test(result.slice(previous.openEnd,previous.closeStart))))
      cleanup.push({start:previous.start,end:previous.end,text:''});
  }
  result=edits(result,cleanup);current=parse(result);cleanup=[];
  const gallery=current.nodes.find(node=>node.attrs.id==='galeria');
  if(gallery&&!descendants(gallery).some(node=>node.tag==='img')) {
    cleanup.push({start:gallery.start,end:gallery.end,text:''});
    for(const node of current.nodes.filter(node=>node.tag==='a'&&node.attrs.href==='#galeria')) cleanup.push({start:node.start,end:node.end,text:''});
  }
  result=edits(result,cleanup);
  requireValue(JSON.stringify(protectedFragments(result))===JSON.stringify(before),'plans, maps, specifications or runtime scripts changed');
  const final=parse(result),allowedCovers=new Set(Object.values(project.covers).filter(Boolean));
  for(const node of final.nodes.filter(node=>node.tag==='img'||node.tag==='a')) {
    const image=findImage(node.attrs[node.tag==='img'?'src':'href']);
    if(!image) continue;
    const hero=[...ancestors(node)].some(parent=>hasClass(parent,'project-hero'));
    requireValue(image.decision==='keep'||(hero&&image.coverOnly&&allowedCovers.has(image.localPath)),
      'excluded photograph survived in published HTML');
    requireValue(!image.coverOnly||hero,'cover-only image survived in a gallery');
  }
  return result;
}

export function applyEcasaCatalogueImageQuality(catalogue,validated,{preview=true,stageImages=true}={}) {
  return catalogue.map(original=> {
    const project=projectChoice(validated,original.slug,preview);
    if(!project) return structuredClone(original);
    const result=structuredClone(original),cover=project.covers.catalogue?validated.images.get(project.covers.catalogue):null;
    result.imagenPrincipal=cover?.localPath??null;
    if(cover) result.imagenAlt=cover.alt; else delete result.imagenAlt;
    delete result.imagenEtapa;
    if(cover&&project.multiple&&cover.displayStage) result.imagenEtapa=cover.displayStage;
    if(stageImages) for(const stage of result.etapasComerciales??[]) {
      const image=validated.images.get(validated.aliases.get(imagePath(stage.imagenPrincipal))??imagePath(stage.imagenPrincipal));
      if(image?.decision==='exclude') {stage.imagenPrincipal=null;delete stage.imagenAlt;delete stage.imagenEtapa;}
    }
    return result;
  });
}

export function ecasaExcludedImagePaths(validated,{preview=true}={}) {
  const covers=new Set([...validated.projects.values()].flatMap(project=>
    Object.values(project.covers[preview?'preview':'public']).filter(Boolean)));
  return new Set([...validated.images.values()].filter(image=>image.decision==='exclude'&&
    !(image.coverOnly&&covers.has(image.localPath))).map(image=>image.localPath));
}
