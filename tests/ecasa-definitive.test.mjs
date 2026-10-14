import { assertMergedSource } from './integrated-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { assertBrochureCatalogue, BROCHURE_ECASA_SLUGS, BROCHURE_ECASA_REMOVED_SLUGS } from '../scripts/brochure-publication.mjs';
import { projects as trustedContexts, projectAliases, projectStages } from '../lib/project-context.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const BASELINE='f8e1c848998d5ed9c0eef7cd5f3424b1d908a155';
const read=path=>readFileSync(resolve(ROOT,path));
const json=path=>JSON.parse(read(path));
const before=path=>execFileSync('git',['show',`${BASELINE}:${path}`],{cwd:ROOT});
const originalProjects=JSON.parse(before('data/proyectos.json'));
const originalResearch=JSON.parse(before('data/fichas-proyectos.json'));
const originalLedger=JSON.parse(before('data/registro-fichas.json'));
const catalogue=json('data/proyectos.json'),research=json('data/fichas-proyectos.json'),ledger=json('data/registro-fichas.json');
const oldBySlug=new Map(originalProjects.map(row=>[row.slug,row]));
const privateStages=research.flatMap(row=>row.etapasComerciales??[]);
const privateBySlug=new Map(privateStages.map(row=>[row.slug,row]));
const names={
  'nucleo-costanera':'Núcleo Costanera',wayra:'Edificio Wayra',lamara:'Lamara','edificio-bezanilla':'Bezanilla',
  endemico:'Endémico',terratolten:'Terratoltén','lomas-de-puyai':'Lomas de Puyai',ferroparque:'FerroParque',
  'cumbres-de-penuelas':'Cumbres de Peñuelas','espacio-victoria':'Espacio Victoria','urban-la-florida':'Urban La Florida',
  'aires-la-florida-2':'Aires La Florida 2','enlace-mackenna':'Enlace Mackenna','conecta-huechuraba':'Conecta Huechuraba','alto-san-joaquin':'Alto San Joaquín',
};
const groups={
  'nucleo-costanera':['nucleo-costanera','nucleo-costanera-2'],ferroparque:['ferroparque','ferroparque-2'],
  terratolten:['terratolten-1','terratolten-2','terratolten-3'],'lomas-de-puyai':['lomas-de-puyai','lomas-de-puyai-3'],
  'alto-san-joaquin':['alto-san-joaquin','alto-san-joaquin-2','alto-san-joaquin-3'],
};
const aliasTargets={
  'nucleo-costanera-2':['nucleo-costanera',2],'ferroparque-2':['ferroparque',2],
  'terratolten-1':['terratolten',1],'terratolten-2':['terratolten',2],'terratolten-3':['terratolten',3],
  'lomas-de-puyai-3':['lomas-de-puyai',3],'alto-san-joaquin-2':['alto-san-joaquin',2],'alto-san-joaquin-3':['alto-san-joaquin',3],
};
const retired=['bosquemar','altos-del-wayra','robles-del-aconcagua','el-real','edificio-ha-strip-center'];
const pending=['alto-san-joaquin-2','alto-san-joaquin-3','terratolten-2','nucleo-costanera-2'];
const number=stage=>stage.etapa??(stage.slug==='aires-la-florida-2'?2:1);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

// Independent expected identities; build-time allowlists cannot approve themselves.
test('definitive Ecasa consolidation contains 15 canonical projects, 22 commercial identities and 133 unique projects',()=>{
  assert.equal(catalogue.length,133);assert.equal(new Set(catalogue.map(p=>p.slug)).size,133);
  const ecasa=catalogue.filter(p=>p.inmobiliaria==='Ecasa');assert.equal(ecasa.length,15);
  assert.deepEqual(Object.fromEntries(ecasa.map(p=>[p.slug,p.nombre])),names);
  assert.deepEqual(new Set(BROCHURE_ECASA_SLUGS),new Set(Object.keys(names)));
  assert.deepEqual(new Set(BROCHURE_ECASA_REMOVED_SLUGS),new Set(retired));
  assert.equal(privateStages.length,22);assert.equal(privateBySlug.size,22);
  assert.deepEqual(new Set(privateBySlug.keys()),new Set(originalProjects.filter(p=>p.inmobiliaria==='Ecasa').map(p=>p.slug)));
  assert.equal(catalogue.filter(p=>p.inmobiliaria==='Ingevec').length,16);assertBrochureCatalogue(catalogue);
});

test('all 118 other developers retain exact concurrent-main catalogue, research, ledger and public fiche bytes',()=>{
  const main=path=>execFileSync('git',['show','f66fbec15f1f4b30be3a70e94644a29212402a63:'+path],{cwd:ROOT,maxBuffer:16*1024*1024});
  const keep=new Set(JSON.parse(main('data/proyectos.json')).filter(p=>p.inmobiliaria!=='Ecasa').map(p=>p.slug));assert.equal(keep.size,118);
  for(const path of ['data/proyectos.json','data/fichas-proyectos.json','data/registro-fichas.json'])
    assert.deepEqual(json(path).filter(row=>keep.has(row.slug)),JSON.parse(main(path)).filter(row=>keep.has(row.slug)),path);
  for(const slug of keep)assert.deepEqual(read(slug+'.html'),main(slug+'.html'),slug);
  for(const path of ['data/brochures-aj-urbana.json','data/brochures-ingevec.json'])assert.deepEqual(read(path),before(path),path);
});

test('the five retirements remain absent and eight legacy identities redirect permanently to their canonical stage anchors',()=>{
  for(const rows of [research,ledger]){assert.equal(rows.length,133);assert.deepEqual(new Set(rows.map(row=>row.slug)),new Set(catalogue.map(p=>p.slug)));}
  assert.deepEqual(new Set(Object.keys(trustedContexts)),new Set(catalogue.map(p=>p.slug)));
  const sitemap=read('sitemap.xml').toString(),locations=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  assert.equal(locations.length,139);assert.equal(new Set(locations).size,139);
  const rules=json('vercel.json').redirects??[];
  for(const slug of retired){assert.equal(existsSync(resolve(ROOT,slug+'.html')),false);assert.equal(trustedContexts[slug],undefined);assert.equal(projectAliases[slug],undefined);assert.ok(!sitemap.includes('/'+slug+'.html'));}
  assert.deepEqual(new Set(Object.keys(projectAliases)),new Set(Object.keys(aliasTargets)));
  for(const [old,[canonical,etapa]] of Object.entries(aliasTargets)){
    assert.equal(existsSync(resolve(ROOT,old+'.html')),false,old+': no independent alias fiche');
    assert.ok(!sitemap.includes('/'+old+'.html'));assert.equal(trustedContexts[old],undefined);
    const destination='/'+canonical+'.html#etapa-'+etapa;
    assert.deepEqual(projectAliases[old],{slug:canonical,etapa,stageSlug:old,name:oldBySlug.get(old).nombre,url:destination});
    for(const source of ['/'+old,'/'+old+'.html'])assert.deepEqual(rules.filter(r=>r.source===source),[{source,destination,permanent:true}],source);
    assert.ok(read(canonical+'.html').toString().includes('id="etapa-'+etapa+'"'),destination);
  }
  for(const p of catalogue){assert.ok(sitemap.includes('https://sollahms.cl'+p.detalleUrl));assert.deepEqual(trustedContexts[p.slug],{name:p.nombre,url:p.detalleUrl});
    for(const slug of retired)assert.ok(!read(p.slug+'.html').toString().includes('/'+slug+'.html'));
  }
});

test('22 public and private stage snapshots preserve their own attributes while each canonical quote has an explicit coherent origin',()=>{
  for(const p of catalogue.filter(p=>p.inmobiliaria==='Ecasa')){
    const r=research.find(r=>r.slug===p.slug),audit=ledger.find(r=>r.slug===p.slug);
    const expectedStages=groups[p.slug]??[p.slug];assert.deepEqual(p.etapasComerciales.map(stage=>stage.slug),expectedStages);
    assert.deepEqual(r.etapasComerciales.map(stage=>stage.slug),expectedStages);
    const reference=p.slug==='terratolten'?'terratolten-3':expectedStages[0];assert.equal(p.etapaReferenciaSlug,reference);assert.equal(r.etapaReferenciaSlug,reference);
    const expectedRoot=structuredClone(oldBySlug.get(reference));
    for(const field of ['proyectoMatrizSlug','etapa','etapasRelacionadas'])delete expectedRoot[field];
    Object.assign(expectedRoot,{slug:p.slug,nombre:names[p.slug],detalleUrl:'/'+p.slug+'.html',etapaReferenciaSlug:reference,etapasComerciales:p.etapasComerciales});
    assert.deepEqual(p,expectedRoot,p.slug+': root attributes must have one coherent stage source');
    assert.equal(p.etapas,undefined);assert.equal(p.etapasRelacionadas,undefined);
    for(const stage of p.etapasComerciales){
      const original=oldBySlug.get(stage.slug),n=number(original),url='/'+p.slug+'.html#etapa-'+n;
      assert.deepEqual(stage,{...original,detalleUrl:url});
      const privateStage=privateBySlug.get(stage.slug);
      assert.deepEqual(privateStage.catalogo,original);
      assert.deepEqual(privateStage.investigacion,originalResearch.find(r=>r.slug===stage.slug));
      assert.deepEqual(privateStage.registro,originalLedger.find(r=>r.slug===stage.slug));
      assert.deepEqual(projectStages[stage.slug],{slug:p.slug,etapa:n,stageSlug:stage.slug,name:stage.nombre,url});
      assert.ok(read(p.slug+'.html').toString().includes('id="etapa-'+n+'"'),url);
    }
    assert.equal(audit.recorridosOficiales,r.etapasComerciales.reduce((sum,s)=>sum+s.registro.recorridosOficiales,0));
  }
  const nucleus=privateBySlug.get('nucleo-costanera-2').investigacion.virtualTours[0];
  assert.equal(nucleus.stageVerification.verifiedStageSlug,'nucleo-costanera-2');assert.equal(nucleus.stageVerification.scope,'virtual_tour_only');
  const html=read('nucleo-costanera.html').toString();assert.ok(html.includes(nucleus.url));assert.ok(html.includes('data-commercial-stage="nucleo-costanera-2"'));
});

test('18 existing and four pending Ecasa commercial records stay exact and all financial mathematics, UF and privacy remain unchanged',()=>{
  for(const original of originalProjects.filter(p=>p.inmobiliaria==='Ecasa'))for(const field of ['precioDesdeUF','estado','entrega'])
    assert.deepEqual(privateBySlug.get(original.slug).catalogo[field],original[field],original.slug+': '+field);
  for(const slug of pending)for(const field of ['precioDesdeUF','estado','entrega'])assert.equal(privateBySlug.get(slug).catalogo[field],null);
  for(const path of ['data/hipotecario.json','assets/js/mortgage-engine.mjs','assets/js/project-finance.mjs',
    'assets/js/purchase-capacity.mjs','assets/js/purchase-capacity-ui.mjs','api/uf.mjs','privacidad.html'])assert.deepEqual(read(path),before(path),path);
  assert.equal(catalogue.filter(p=>typeof p.precioDesdeUF==='number'&&p.precioDesdeUF>0).length,103);
  assert.equal(catalogue.filter(p=>p.precioDesdeUF===null).length,30);
  assert.equal(catalogue.find(p=>p.slug==='terratolten').precioDesdeUF,2390);
  assert.equal(privateBySlug.get('terratolten-1').catalogo.precioDesdeUF,null);
  assert.equal(privateBySlug.get('terratolten-2').catalogo.precioDesdeUF,null);
});

test('stage documentation gaps do not invent prices, surfaces, photographs, plans or borrowed tours',()=>{
  for(const slug of pending){const s=privateBySlug.get(slug);assert.deepEqual(s.investigacion.images,[]);
    for(const field of ['utilM2','totalM2','terrenoM2','dormitorios','banos'])assert.equal(s.investigacion.specs[field],null);
    assert.equal(s.catalogo.imagenPrincipal,null);assert.equal(s.catalogo.mapQuery,null);
    if(slug==='nucleo-costanera-2')assert.equal(s.investigacion.virtualTours.length,1);else assert.deepEqual(s.investigacion.virtualTours,[]);
  }
  for(const p of catalogue){const html=read(p.slug+'.html').toString();assert.doesNotMatch(html,/\b(?:undefined|NaN)\b/);
    assert.ok(html.includes('/contacto.html?proyecto='+p.slug));assert.ok(html.includes('/agenda-asesoria.html?proyecto='+p.slug));
  }
});

test('catalogue and exact successor controls reject resurrection, duplicate identities, unrelated mutation and stage-price borrowing',()=>{
  const retiredBase=JSON.parse(execFileSync('git',['show','f1e9bf1715cc99d095a367eba9028a9a1ad2b026:data/proyectos.json'],{cwd:ROOT}));
  const resurrection=structuredClone(catalogue);resurrection.push(retiredBase.find(p=>p.slug===retired[0]));assert.throws(()=>assertBrochureCatalogue(resurrection),/133 projects|approved catalogue/);
  const duplicate=structuredClone(catalogue);duplicate[0]=duplicate[1];assert.throws(()=>assertBrochureCatalogue(duplicate),/133 projects|approved catalogue/);
  const other=structuredClone(catalogue);other.find(p=>p.inmobiliaria!=='Ecasa').precioDesdeUF=999999;assert.throws(()=>assertBrochureCatalogue(other),/118 projects|121 projects|approved catalogue/);
  for(const mutate of [rows=>{rows.find(p=>p.slug==='terratolten').etapasComerciales[1].precioDesdeUF=2390;},
    rows=>{rows.find(p=>p.slug==='terratolten').estado='Entrega inmediata';},rows=>{rows.find(p=>p.slug==='ferroparque').etapasComerciales.pop();}]){
    const rows=structuredClone(catalogue);mutate(rows);
    assert.throws(()=>execFileSync('python3',[resolve(ROOT,'tests/ecasa_scope.py'),'--data','data/proyectos.json'],{cwd:ROOT,input:JSON.stringify(rows),stdio:['pipe','pipe','pipe']}));
  }
});

test('the 15 reviewed canonical Ecasa outputs and eight exact alias routes match the independently pinned consolidation inventory',()=>{
  const reviewed=json('tests/ecasa-reviewed-output.json');assert.equal(reviewed.baselineCommit,BASELINE);
  assert.equal(sha(read('data/brochures-ecasa.json')),reviewed.manifestSha256);
  assertMergedSource('vercel.json',before('vercel.json'));
  assert.deepEqual(new Set(Object.keys(reviewed.htmlSha256)),new Set(Object.keys(names).map(slug=>slug+'.html')));
  for(const [path,digest] of Object.entries(reviewed.htmlSha256))assert.equal(sha(read(path)),digest,path);
});

test('consolidated brochure bindings preserve 17 originals, 15 distinct sources, 22 explicit origins and printed geometry',()=>{
  const review=json('data/brochures-ecasa.json');assert.equal(review.projects.length,15);assert.equal(review.commercialSources.length,22);
  assert.equal(review.sourceDocuments.length,17);assert.equal(new Set(review.sourceDocuments.map(d=>d.sha256)).size,15);
  const bySlug=new Map(review.projects.map(r=>[r.slug,r]));
  for(const slug of [...pending,'lomas-de-puyai-3']){const source=review.commercialSources.find(r=>r.slug===slug);assert.deepEqual(source.selectedImagePaths,[]);assert.deepEqual(source.selectedPlanPaths,[]);}
  const expected=[[17,39.54,4.35,null,43.89,2,1],[18,39.54,7.39,49.36,96.29,2,1],[19,45.9,4.77,null,50.67,2,2],[20,45.9,9,57.57,112.47,2,2],
    [21,64.55,5.92,null,70.47,3,2],[22,64.55,10.8,45.04,120.39,3,2],[23,39.44,3.64,null,43.08,2,1],[24,72.77,7.24,null,80.01,3,2],[25,72.77,13.16,52.14,138.07,3,2]];
  assert.deepEqual(bySlug.get('cumbres-de-penuelas').models.map(m=>[m.pagina_brochure,m.superficie_util_m2,m.terraza_m2,m.terraza_cubierta_m2??null,m.superficie_total_m2,m.dormitorios,m.banos]),expected);
  assert.deepEqual(bySlug.get('endemico').models.map(m=>[m.pagina_brochure,m.superficie_util_m2,m.superficie_interior_m2,m.terraza_m2,m.superficie_total_m2,m.dormitorios,m.banos]),
    [[8,null,72,33,105,2,2],[10,null,84,35,119,3,2],[13,null,102,41,143,3,2],[15,null,119,41,160,4,3]]);
  for(const record of review.projects)for(const model of record.models){const origin=review.commercialSources.find(source=>source.slug===model.originCommercialSlug);
    assert.ok(origin&&origin.projectSlug===record.slug);assert.ok(origin.documents.some(d=>d.sha256===model.sourceSha256));
    assert.equal(model.plan.sourceSha256,model.sourceSha256);assert.equal(model.plan.sourcePage,model.pagina_brochure);
    assert.equal(model.plan.assetScope,'named_development');assert.equal(model.orientacion,null);assert.equal(model.pisos,null);assert.equal(model.approximate,true);
  }
});

test('all 130 selected Ecasa photos and plans preserve their original bytes, origin-stage bindings and enlarged canonical references',()=>{
  const review=json('data/brochures-ecasa.json'),prior=JSON.parse(before('data/brochures-ecasa.json'));
  const original=new Map(prior.projects.flatMap(r=>[...r.images,...r.models.map(m=>m.plan)]).map(asset=>[asset.localPath,asset]));
  const assets=review.projects.flatMap(r=>[...r.images,...r.models.map(m=>m.plan)]);assert.equal(assets.length,130);assert.equal(new Set(assets.map(a=>a.localPath)).size,130);
  for(const record of review.projects){const html=read(record.slug+'.html').toString();
    for(const asset of [...record.images,...record.models.map(m=>m.plan)]){
      assert.equal(sha(read(asset.localPath.slice(1))),asset.sha256);assert.equal(asset.sha256,original.get(asset.localPath).sha256);
      assert.equal(asset.sourceSha256,original.get(asset.localPath).sourceSha256);assert.equal(asset.sourcePage,original.get(asset.localPath).sourcePage);
      assert.ok(html.includes('href="'+asset.localPath+'"'));assert.equal(asset.privacySafe,true);assert.equal(asset.visuallyVerified,true);
      assert.ok(record.commercialSourceSlugs.includes(asset.originCommercialSlug));
    }
  }
});
