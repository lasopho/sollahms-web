import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import review from '../data/brochures-ecasa.json' with { type: 'json' };
import research from '../data/fichas-proyectos.json' with { type: 'json' };

const PREFIX='/assets/propiedades/ecasa-preview/';
const VOID=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const decode=value=>value.replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[0-9a-f]+|\d+);/gi,entity=>{
  const named={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&nbsp;':' '};
  return named[entity.toLowerCase()]??String.fromCodePoint(parseInt(entity.slice(2,-1).replace(/^x/i,''),/^&#x/i.test(entity)?16:10));
});
const hasClass=(node,name)=>(node.attrs.class??'').split(/\s+/).includes(name);
const closest=(node,predicate)=>{for(let current=node;current;current=current.parent)if(predicate(current))return current;return null;};
const scope=node=>closest(node,current=>Object.hasOwn(current.attrs,'data-commercial-stage'))?.attrs['data-commercial-stage'];
const text=node=>decode(node.children.map(child=>typeof child==='string'?child:text(child)).join(' ')).replace(/\s+/g,' ').trim();

// Small structural parser for generated, explicitly closed source markup.
// It keeps ancestry rather than matching a neighbouring stage annotation.
function dom(source){
  const body=source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]??source;
  const clean=body.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
  const root={tag:'body',attrs:{},children:[],parent:null},stack=[root],nodes=[];
  for(const token of clean.match(/<\/?[a-z][a-z0-9:-]*(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+|</gi)??[]){
    if(!token.startsWith('<')||token==='<'){stack.at(-1).children.push(token);continue;}
    const tag=/^<\/?([a-z][a-z0-9:-]*)/i.exec(token)[1].toLowerCase();
    if(token.startsWith('</')){
      const index=stack.findLastIndex(node=>node.tag===tag);
      if(index>0)stack.length=index;
      continue;
    }
    const attrs={};
    const content=token.replace(/^<[a-z][a-z0-9:-]*/i,'').replace(/\/?\s*>$/,'');
    for(const match of content.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)){
      attrs[match[1].toLowerCase()]=decode(match[2]??match[3]??match[4]??'');
    }
    const node={tag,attrs,children:[],parent:stack.at(-1)};
    node.parent.children.push(node);nodes.push(node);
    if(!VOID.has(tag)&&!token.endsWith('/>'))stack.push(node);
  }
  return{root,nodes};
}

function auditMedia(source,record){
  const tree=dom(source),assets=[...record.images,...record.models.map(model=>model.plan)];
  const selected=new Map(assets.map(asset=>[asset.localPath,asset])),seen=new Set(),issues=[];
  for(const node of tree.nodes.filter(node=>['img','a'].includes(node.tag))){
    const path=node.attrs[node.tag==='img'?'src':'href'];
    if(!path?.startsWith(PREFIX))continue;
    const asset=selected.get(path);
    if(!asset){issues.push('Unreviewed media '+path);continue;}
    if(scope(node)!==asset.originCommercialSlug)issues.push(path+': scope '+scope(node)+' differs from '+asset.originCommercialSlug);
    if(node.tag==='img')seen.add(path);
  }
  for(const path of selected.keys())if(!seen.has(path))issues.push('Missing image '+path);
  return{tree,seen,issues};
}

test('all 62 valid previous official photographs remain visible in Preview under their own original stage',()=>{
  const officialUrl=value=>{
    try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443');}
    catch{return false;}
  };
  let checked=0,stages=0;
  for(const record of review.projects){
    const source=readFileSync(new URL('../'+record.slug+'.html',import.meta.url),'utf8')
      .replace(/<!--ECASA_PUBLIC_START-->[\s\S]*?<!--ECASA_PUBLIC_END-->/g,'');
    const tree=dom(source),original=research.find(project=>project.slug===record.slug);
    for(const stage of original.etapasComerciales){
      stages++;
      for(const image of stage.investigacion.images){
        if(!officialUrl(image.url)||!officialUrl(image.sourceUrl))continue;
        const path=image.localPath?.startsWith('/assets/propiedades/catalogo/')?image.localPath:image.url;
        const nodes=tree.nodes.filter(node=>node.tag==='img'&&node.attrs.src===path);
        assert.ok(nodes.length,stage.slug+': official image missing from Preview '+path);
        for(const node of nodes){
          assert.equal(scope(node),stage.slug,stage.slug+': official image attributed to another stage');
          if(!hasClass(node,'hero-image'))assert.ok(closest(node,parent=>parent.tag==='a'&&parent.attrs.href===path),stage.slug+': official gallery image enlargement');
        }
        checked++;
      }
    }
    for(const node of tree.nodes.filter(node=>node.tag==='img')){
      assert.ok(!node.attrs.src?.startsWith('data:'),record.slug+': data-URI excluded');
      assert.ok(!/^(?:file:|\/Users\/|\/private\/)|\.pdf(?:$|[?#])/i.test(node.attrs.src??''),record.slug+': private original excluded');
    }
  }
  assert.equal(stages,22);assert.equal(checked,62);
});

test('all 130 selected gallery, hero and enlarged-plan references bind to their nearest original commercial stage',()=>{
  const selected=new Set();let models=0,images=0;
  for(const record of review.projects){
    const source=readFileSync(new URL('../'+record.slug+'.html',import.meta.url),'utf8');
    const audit=auditMedia(source,record);assert.deepEqual(audit.issues,[],record.slug);
    audit.seen.forEach(path=>selected.add(path));images+=record.images.length;
    const modelNodes=audit.tree.nodes.filter(node=>node.tag==='details'&&hasClass(node,'aj-model'));
    assert.equal(modelNodes.length,record.models.length,record.slug+': model inventory');
    assert.equal(new Set(modelNodes.map(node=>node.attrs.id)).size,modelNodes.length,record.slug+': unique model IDs');
    for(const model of record.models){
      const link=audit.tree.nodes.find(node=>node.tag==='a'&&hasClass(node,'aj-plan-link')&&node.attrs.href===model.plan.localPath);
      assert.ok(link,model.plan.localPath);
      const panel=closest(link,node=>hasClass(node,'aj-model'));
      assert.equal(scope(panel),model.originCommercialSlug);
      assert.match(panel.attrs.id,/^modelo-[a-z0-9_.-]+$/);
      assert.equal(link.attrs.target,'_blank');
      assert.ok((link.attrs.rel??'').includes('noopener'));
      assert.equal(link.children.find(node=>typeof node!=='string'&&node.tag==='img')?.attrs.src,model.plan.localPath);
      models++;
    }
    if(record.hero){
      const hero=audit.tree.nodes.find(node=>node.tag==='img'&&hasClass(node,'aj-hero'));
      assert.equal(hero.attrs.src,record.hero);
      assert.equal(scope(hero),record.images.find(image=>image.localPath===record.hero).originCommercialSlug);
    }
  }
  assert.equal(selected.size,130);assert.equal(images,56);assert.equal(models,74);
});

test('changing only a DOM stage annotation cannot lend the same reviewed media bytes to another stage',()=>{
  const record=review.projects.find(record=>record.slug==='terratolten');
  const source=readFileSync(new URL('../terratolten.html',import.meta.url),'utf8');
  const changed=source.replaceAll('data-commercial-stage="terratolten-1"','data-commercial-stage="terratolten-3"');
  assert.ok(auditMedia(changed,record).issues.some(issue=>issue.includes('scope terratolten-3 differs from terratolten-1')));
  const unreviewed=source.replace('</body>','<img src="'+PREFIX+'terratolten-1/private-capture.png" data-commercial-stage="terratolten-1"></body>');
  assert.ok(auditMedia(unreviewed,record).issues.some(issue=>issue.startsWith('Unreviewed media')));
});

test('the fifteen visible fiches use natural captions while retaining explicit reference cautions for selected models',()=>{
  for(const record of review.projects){
    const tree=dom(readFileSync(new URL('../'+record.slug+'.html',import.meta.url),'utf8'));
    assert.doesNotMatch(text(tree.root),/(?:según|segun|according to)\s+(?:el |the )?(?:brochure|folleto)/i,record.slug);
    for(const node of tree.nodes){
      if(node.tag==='figcaption')assert.doesNotMatch(text(node),/brochure|folleto|\bpág(?:ina|\.)\s*\d|extraíd[oa]\s+del/i,record.slug);
      for(const key of ['alt','aria-label'])if(node.attrs[key])assert.doesNotMatch(node.attrs[key],/brochure|folleto|\bpág(?:ina|\.)\s*\d/i,record.slug+': '+key);
    }
    if(record.models.length){
      const caution=tree.nodes.find(node=>hasClass(node,'aj-scope'));
      assert.ok(caution&&/referenciales/i.test(text(caution))&&/disponibilidad/i.test(text(caution)),record.slug+': model caution');
    }
  }
});

test('Terratoltén labels its first-stage media separately from the third-stage quote and keeps undocumented stages out of visible panels',()=>{
  const source=readFileSync(new URL('../terratolten.html',import.meta.url),'utf8'),tree=dom(source);
  const quoted=tree.nodes.filter(node=>['dd','strong'].includes(node.tag)&&/\bUF\s+2[.\s]?390\b/.test(text(node)));
  assert.equal(quoted.length,2);
  for(const node of quoted){
    assert.notEqual(scope(node),'terratolten-1');assert.notEqual(scope(node),'terratolten-2');
    if(scope(node))assert.equal(scope(node),'terratolten-3');
    else assert.match(text(closest(node,parent=>hasClass(parent,'price-block'))),/Precio desde · Etapa 3/);
  }
  const hero=tree.nodes.find(node=>node.tag==='img'&&hasClass(node,'aj-hero'));
  assert.equal(scope(hero),'terratolten-1');
  assert.ok(tree.nodes.some(node=>hasClass(node,'ecasa-media-label')&&text(node)==='Etapa 1 · Imagen referencial'));
  for(const [root,origin,number] of [['terratolten','terratolten-2',2],['alto-san-joaquin','alto-san-joaquin-2',2],
    ['alto-san-joaquin','alto-san-joaquin-3',3],['lomas-de-puyai','lomas-de-puyai-3',3]]){
    const pending=dom(readFileSync(new URL('../'+root+'.html',import.meta.url),'utf8'));
    assert.equal(pending.nodes.filter(node=>node.attrs['data-commercial-stage']===origin).length,0,origin+': no invented visible panel');
    const anchor=pending.nodes.find(node=>node.attrs.id==='etapa-'+number);
    assert.ok(anchor);assert.equal(anchor.tag,'span');assert.equal(text(anchor),'');
  }
});
