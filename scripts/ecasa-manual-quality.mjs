// Manual publication decisions for this protected Preview only. Original source
// photographs, the frozen quality review, commercial snapshots and plans remain
// untouched; this module only constructs an effective selection and HTML slices.
const BASELINE='fd9f238685ed59e03716ccef10f40ab8b0a9a1c5';
const REMOVE_DOC=new Set(['nucleo-costanera','lamara','edificio-bezanilla','endemico','ferroparque','terratolten',
  'urban-la-florida','aires-la-florida-2','conecta-huechuraba','alto-san-joaquin']);
const LEAVE=new Set(['wayra','lomas-de-puyai','enlace-mackenna']);
const CUMBRES_PANORAMA='/assets/propiedades/ecasa-preview/cumbres-de-penuelas/imagen-02-p03.webp';
const ESPACIO_FACADE='/assets/propiedades/ecasa-preview/espacio-victoria/imagen-01-p01.webp';
const START='<!--ECASA_OFFICIAL_ORIGINALS_START-->',END='<!--ECASA_OFFICIAL_ORIGINALS_END-->';
const MOVED_START='<!--ECASA_MANUAL_FERRO_GALLERY_START-->',MOVED_END='<!--ECASA_MANUAL_FERRO_GALLERY_END-->';
const records=new WeakMap();
const fail=message=>{throw new Error('Ecasa manual quality: '+message);};
const requireValue=(condition,message)=>{if(!condition)fail(message);};
const sameMembers=(a,b)=>a.length===b.length&&new Set(a).size===a.length&&a.every(value=>b.includes(value));
const fingerprint=base=>JSON.stringify(base,(_,value)=>value instanceof Map?[...value]:value instanceof Set?[...value]:value);
const baseScope=base=>requireValue(base?.scope==='ecasa_images_only'&&base.images instanceof Map&&base.images.size===118&&
  base.projects instanceof Map&&base.projects.size===15&&base.planPaths instanceof Set&&base.planPaths.size===74,
  'the frozen 118-image / 74-plan selection is required');
function privateReview(validated) {
  const value=records.get(validated);requireValue(value,'a validated manual review is required');return value;
}
const counts=images=>({keptImages:[...images.values()].filter(image=>image.decision==='keep').length,
  excludedImages:[...images.values()].filter(image=>image.decision==='exclude').length,
  coverOnlyImages:[...images.values()].filter(image=>image.coverOnly).length,
  documentaryGalleryImages:[...images.values()].filter(image=>image.kind==='documentary'&&image.decision==='keep').length,
  documentaryPublishedImages:[...images.values()].filter(image=>image.kind==='documentary'&&(image.decision==='keep'||image.coverOnly)).length});

export function validateEcasaManualQuality(base,policy) {
  baseScope(base);
  requireValue(policy?.schemaVersion===1&&policy.baselineCommit===BASELINE&&policy.scope==='ecasa_manual_images_only'&&
    policy.protectedPreviewOnly===true&&/^\d{4}-\d{2}-\d{2}$/.test(policy.reviewedOn??''),'unrecognized manual scope or baseline');
  requireValue(Array.isArray(policy.projects)&&sameMembers(policy.projects.map(project=>project.slug),[...base.projects.keys()]),
    'all fifteen canonical Ecasa identities must remain intact');
  const projects=new Map(),images=new Map();
  for(const project of structuredClone(policy.projects)) {
    const existing=base.projects.get(project.slug),owned=[...base.images.values()].filter(image=>image.projectSlug===project.slug);
    requireValue(Array.isArray(project.images)&&sameMembers(project.images.map(image=>image.localPath),owned.map(image=>image.localPath)),
      'every original image requires one decision for its own development');
    requireValue(typeof project.instruction==='string'&&project.instruction.trim().length>0,'the explicit manual instruction is required');
    const mode=project.slug==='ferroparque'?'integrate_into_official':project.slug==='alto-san-joaquin'?'retain_development_photo':'unchanged';
    requireValue(project.officialGalleryMode===mode,'official gallery mode is outside the named instruction');
    for(const choice of project.images) {
      requireValue(sameMembers(Object.keys(choice),['localPath','sha256','width','height','originCommercialSlug','kind','decision','coverOnly','reason']),
        'manual choices may contain only the nine reviewed image fields');
      const original=base.images.get(choice.localPath);
      for(const field of ['sha256','width','height','originCommercialSlug','kind'])requireValue(choice[field]===original[field],
        'source metadata or commercial-stage binding changed: '+choice.localPath+'/'+field);
      requireValue(['keep','exclude'].includes(choice.decision)&&typeof choice.coverOnly==='boolean'&&
        typeof choice.reason==='string'&&choice.reason.trim().length>0,'a complete image-only decision is required');
      requireValue(!choice.coverOnly||choice.decision==='exclude','cover-only images must remain absent from galleries');
      requireValue(original.kind!=='official'||choice.decision==='keep'&&!choice.coverOnly,'all 62 original official images remain kept');
      requireValue(original.decision!=='exclude'||choice.decision==='exclude'&&!choice.coverOnly,'the four previously excluded images cannot return');
      if(original.kind==='documentary') {
        if(REMOVE_DOC.has(project.slug))requireValue(choice.decision==='exclude','documentary gallery must be removed for '+project.slug);
        if(LEAVE.has(project.slug))requireValue(choice.decision===original.decision&&choice.coverOnly===original.coverOnly,
          'the three untouched galleries must preserve their original choices');
        if(project.slug==='cumbres-de-penuelas')requireValue(choice.decision===(choice.localPath===CUMBRES_PANORAMA?'exclude':'keep')&&
          !choice.coverOnly,'only the Cumbres panorama is removed');
        if(project.slug==='espacio-victoria')requireValue(choice.decision===(choice.localPath===ESPACIO_FACADE?'exclude':'keep')&&
          !choice.coverOnly,'Espacio keeps living/bedroom and removes only its documentary facade');
      }
      images.set(choice.localPath,{...original,...choice});
    }
    const selected=project.previewCover;
    requireValue(selected===null||typeof selected==='string'&&owned.some(image=>image.localPath===selected),
      'preview cover must be an existing image of its own source development');
    const covers=selected===null?{...existing.covers.preview}:{hero:selected,catalogue:selected};
    for(const path of Object.values(covers)) {
      const image=images.get(path);
      requireValue(path===null||image?.projectSlug===project.slug&&(image.decision==='keep'||image.coverOnly),
        'an excluded cover needs an explicit cover-only exception');
    }
    if(LEAVE.has(project.slug))requireValue(covers.hero===existing.covers.preview.hero&&covers.catalogue===existing.covers.preview.catalogue,
      'untouched project covers must remain exact');
    for(const choice of project.images.filter(image=>image.coverOnly))requireValue(Object.values(covers).includes(choice.localPath),
      'a cover-only exception must have a real hero/catalogue role');
    projects.set(project.slug,{...project,covers});
  }
  requireValue(images.size===118&&[...images.values()].filter(image=>image.kind==='official').length===62&&
    [...images.values()].filter(image=>image.kind==='documentary').length===56,'original source inventory changed');
  const validated={scope:policy.scope,baselineCommit:BASELINE,policy:structuredClone(policy),projects,images,
    summary:{...base.summary,...counts(images)}};
  // Keep the trusted private decision copy separate from caller-visible Maps.
  records.set(validated,{policy:structuredClone(policy),projects:structuredClone(projects),images:structuredClone(images),
    baseFingerprint:fingerprint(base)});
  return validated;
}

export function effectiveEcasaManualQuality(base,validated,{preview=true}={}) {
  const review=privateReview(validated);baseScope(base);
  requireValue(fingerprint(base)===review.baseFingerprint,'the validated base quality review was mutated');
  if(!preview)return base;
  const effective={...base,images:structuredClone(review.images),projects:structuredClone(base.projects),
    aliases:new Map(base.aliases),planPaths:new Set(base.planPaths),planOwners:new Map(base.planOwners),
    manualScope:validated.scope,manualPolicy:structuredClone(review.policy),summary:{...base.summary,...counts(review.images)}};
  for(const [slug,project] of review.projects) {
    const existing=effective.projects.get(slug);
    effective.projects.set(slug,{...existing,covers:{...existing.covers,preview:{...project.covers}}});
  }
  return effective;
}

const VOID=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const decode=value=>value.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>');
function attrs(tag) {
  const result={};for(const match of tag.replace(/^<[a-z][a-z0-9:-]*/i,'').replace(/\/?\s*>$/,'')
    .matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g))
      result[match[1].toLowerCase()]=decode(match[2]??match[3]??match[4]??'');
  return result;
}
function parse(source) {
  const root={tag:'root',attrs:{},children:[],parent:null,start:0,end:source.length},nodes=[],stack=[root];
  const tokens=/<!--[\s\S]*?-->|<(script|style)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<\/?[a-z][a-z0-9:-]*(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  for(const match of source.matchAll(tokens)) {
    const token=match[0];if(token.startsWith('<!--'))continue;
    const tag=/^<\/?([a-z][a-z0-9:-]*)/i.exec(token)[1].toLowerCase();
    if(token.startsWith('</')) {
      const index=stack.findLastIndex(node=>node.tag===tag);
      if(index>0){stack[index].closeStart=match.index;stack[index].end=match.index+token.length;stack.length=index;}
      continue;
    }
    const rawTag=/^<(?:[^>"']|"[^"]*"|'[^']*')+>/.exec(token)[0],node={tag,attrs:attrs(rawTag),rawTag,start:match.index,
      openEnd:match.index+rawTag.length,end:match.index+token.length,closeStart:null,children:[],parent:stack.at(-1)};
    node.parent.children.push(node);nodes.push(node);
    if(tag==='script'||tag==='style')node.closeStart=match.index+token.lastIndexOf('</');
    else if(!VOID.has(tag)&&!rawTag.endsWith('/>')){node.end=source.length;stack.push(node);}
  }
  return {root,nodes};
}
const hasClass=(node,name)=>(node.attrs.class??'').split(/\s+/).includes(name);
const descendants=node=>node.children.flatMap(child=>[child,...descendants(child)]);
function protectedParts(source) {
  return parse(source).nodes.filter(node=>node.tag==='iframe'||node.tag==='dl'||hasClass(node,'aj-model')||
    node.tag==='script'&&node.attrs.type!=='application/ld+json').map(node=>source.slice(node.start,node.end));
}
const escapeAttr=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;');
function setStyle(tag,property,value) {
  const current=attrs(tag).style??'',parts=current.split(';').map(part=>part.trim()).filter(part=>part&&
    part.split(':',1)[0].trim().toLowerCase()!==property);
  parts.push(property+':'+value);
  const attribute=' style="'+escapeAttr(parts.join(';'))+'"';
  return /\sstyle\s*=/i.test(tag)?tag.replace(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,attribute):tag.replace(/\/?\s*>$/,attribute+'>');
}
function edits(source,changes) {
  const sorted=changes.toSorted((a,b)=>a.start-b.start||b.end-a.end);
  for(let i=1;i<sorted.length;i++)requireValue(sorted[i].start>=sorted[i-1].end,'overlapping gallery edits');
  for(const change of sorted.reverse())source=source.slice(0,change.start)+change.text+source.slice(change.end);
  return source;
}
function officialGrid(tree) {
  const gallery=tree.nodes.find(node=>node.tag==='section'&&node.attrs.id==='galeria');
  return gallery&&descendants(gallery).find(node=>hasClass(node,'gallery-grid')&&!hasClass(node,'aj-gallery'));
}
function checkFerroFigure(figure) {
  const images=descendants(figure).filter(node=>node.tag==='img');
  requireValue(images.length===1&&figure.attrs['data-commercial-stage']==='ferroparque'&&
    figure.attrs['data-official-scope']==='development_general'&&
    /^\/assets\/propiedades\/ecasa-official-review\/ferroparque\/[a-z0-9_.-]+\.(?:webp|png|jpe?g)$/i.test(images[0].attrs.src??''),
    'the integrated photograph must retain its already-published FerroParque general origin');
  return images[0];
}

export function transformEcasaManualGallery(source,slug,validated,{preview=true}={}) {
  const review=privateReview(validated),project=review.projects.get(slug);
  if(!preview||!project||!['ferroparque','cumbres-de-penuelas'].includes(slug))return source;
  requireValue(!/<!--ECASA_(?:PUBLIC|PREVIEW)_START-->/.test(source),'resolve content-profile markers before manual gallery layout');
  const before=protectedParts(source);let result=source;
  if(slug==='ferroparque') {
    requireValue(project.officialGalleryMode==='integrate_into_official','FerroParque gallery integration was not instructed');
    const blocks=source.split(START).length-1,moved=source.split(MOVED_START).length-1;
    requireValue(blocks<=1&&blocks===source.split(END).length-1&&moved<=1&&moved===source.split(MOVED_END).length-1&&
      !(blocks&&moved),'inconsistent or duplicate official photograph blocks');
    let tree=parse(source),target=officialGrid(tree);
    requireValue(target,'the first existing official gallery is required');
    if(moved) {
      const start=source.indexOf(MOVED_START),end=source.indexOf(MOVED_END)+MOVED_END.length;
      const figure=tree.nodes.find(node=>node.tag==='figure'&&node.start>start&&node.end<end);
      requireValue(figure&&figure.parent===target,'the moved photograph left its official gallery');checkFerroFigure(figure);
      return source;
    }
    requireValue(blocks===1,'the selected official photograph block is missing');
    const start=source.indexOf(START),end=source.indexOf(END)+END.length;
    requireValue(end>start,'reversed official photograph markers');
    const figures=tree.nodes.filter(node=>node.tag==='figure'&&node.start>start&&node.end<end);
    requireValue(figures.length===1,'exactly one existing development photograph must be integrated');
    checkFerroFigure(figures[0]);
    const original=source.slice(figures[0].start,figures[0].end),figure=original.replace(figures[0].rawTag,
      setStyle(figures[0].rawTag,'grid-column','1/-1'));
    requireValue(!(target.start>=start&&target.end<=end),'the insertion target must be the original official grid');
    result=edits(source,[{start,end,text:''},{start:target.openEnd,end:target.openEnd,text:MOVED_START+figure+MOVED_END}]);
  } else {
    const tree=parse(source),gallery=tree.nodes.find(node=>node.tag==='section'&&node.attrs.id==='galeria');
    requireValue(gallery,'Cumbres gallery is required');
    const grids=descendants(gallery).filter(node=>hasClass(node,'gallery-grid')&&hasClass(node,'aj-gallery'));
    requireValue(grids.length===1,'one documentary Cumbres grid is required');
    const images=descendants(grids[0]).filter(node=>node.tag==='img');
    requireValue(images.length===1,'only the retained Cumbres documentary photograph belongs in this grid');
    const image=review.images.get(images[0].attrs.src);
    requireValue(image?.projectSlug===slug&&image.kind==='documentary'&&image.decision==='keep'&&!image.coverOnly,
      'Cumbres single-photo layout cannot alter an official image, plan or excluded panorama');
    result=edits(source,[{start:grids[0].start,end:grids[0].openEnd,text:setStyle(grids[0].rawTag,'grid-template-columns','minmax(0,1fr)')},
      {start:images[0].start,end:images[0].openEnd,text:setStyle(images[0].rawTag,'aspect-ratio',image.width+'/'+image.height)}]);
  }
  requireValue(JSON.stringify(protectedParts(result))===JSON.stringify(before),'plan, map, specification or runtime fragment changed');
  return result;
}
