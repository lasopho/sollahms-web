import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {matchProjectFilters,filterCommercialProjects,queryFromCatalogState} from '../assets/js/commercial-filter-engine.mjs';
import {buildCommercialRecords,buildCommercialProjects} from '../assets/js/commercial-filter-data.mjs';
import {advancedFilterAndSort,defaults,rangeIssue,readQuery,writeQuery,matchedLabels} from '../assets/js/catalog-filter-engine.mjs';

const evidence=JSON.parse(await readFile(new URL('../data/commercial-filter-evidence-leben.json',import.meta.url),'utf8'));
const published=evidence.projects.map(project=>({slug:project.slug,nombre:project.slug,precioDesdeUF:1,region:project.projectFacts.region,comuna:project.projectFacts.commune,inmobiliaria:'Leben'}));
const records=buildCommercialRecords(published,evidence);
const bySlug=new Map(records.map(record=>[record.slug,record]));
const record=(references=[],projectFacts={})=>({slug:'test',sourceProject:{nombre:'Proyecto de prueba'},sourceLayer:'prepared',projectFacts,references});
const ref=(id,attributes)=>({id,sourceKind:'test',stock:null,attributes});
const matches=(slug,query={},id=null)=>{
  const source=bySlug.get(slug);
  assert.ok(source,'Proyecto de escenario existente: '+slug);
  if(id)assert.ok(source.references.some(reference=>reference.id===id),'Referencia existente: '+id);
  return matchProjectFilters(id?{...source,references:source.references.filter(reference=>reference.id===id)}:source,query).matches;
};

// The 32 F9 checks become executable against the actual prepared projection.
// They retain the original IDs and contradictory-field masks.
for(const source of records)test('F9: '+source.slug+' conserva atributos inactivos',()=>assert.equal(matchProjectFilters(source,{}).matches,true));
const f9Cases=[
 ['Living precio+D+B','edificio-living-town',{maxPrice:4000,bedrooms:1,bathrooms:1},true],
 ['Living otra cotización 2D2B','edificio-living-town',{maxPrice:5000,bedrooms:2,bathrooms:2},true],
 ['Living603 conserva D2','edificio-living-town',{bedrooms:2},true,'UI:edificio-living-town:603'],
 ['Living603 no concilia B2','edificio-living-town',{bathrooms:2},false,'UI:edificio-living-town:603'],
 ['Mood D1B1 útil+total','edificio-mood',{bedrooms:1,bathrooms:1,surfaces:{useful:{min:30},total:{max:40}}},true],
 ['Mood precio no presta útil','edificio-mood',{maxPrice:4000,bedrooms:1,bathrooms:1,surfaceMetric:'useful',minSurface:30},false],
 ['Mood303 conserva B2','edificio-mood',{bathrooms:2},true,'UI:edificio-mood:303'],
 ['Mood303 no concilia D2','edificio-mood',{bedrooms:2},false,'UI:edificio-mood:303'],
 ['Cap501 conserva D3B3 y T18,45','capitanes',{bedrooms:3,bathrooms:3,surfaces:{terrace:{min:18.45,max:18.45}}},true,'UI:capitanes:501'],
 ['Cap501 no presta total109,01','capitanes',{surfaceMetric:'total',minSurface:109.01,maxSurface:109.01},false,'UI:capitanes:501'],
 ['Bold608 conserva D2B2','edificio-bold',{bedrooms:2,bathrooms:2},true,'UI:edificio-bold:608'],
 ['Bold608 no concilia T3,71','edificio-bold',{surfaces:{terrace:{min:3.71,max:3.71}}},false,'UI:edificio-bold:608'],
 ['Bold608 conserva terraza privada','edificio-bold',{privateTerrace:true},true,'UI:edificio-bold:608'],
 ['INN806 conserva D2B2T26,36','inn-puerto-chico',{bedrooms:2,bathrooms:2,surfaces:{terrace:{min:26.36,max:26.36}}},true,'UI:inn-puerto-chico:806'],
 ['INN806 no presta total135,86','inn-puerto-chico',{surfaceMetric:'total',minSurface:135.86,maxSurface:135.86},false,'UI:inn-puerto-chico:806'],
 ['INN precio2D no presta jardín','inn-puerto-chico',{maxPrice:11000,bedrooms:2,privateGarden:true},false],
 ['Nórdico precio1D no presta patio','edificio-nordico',{maxPrice:5382,privateGarden:true},false],
 ['Nórdico D1B1 útil+total','edificio-nordico',{bedrooms:1,bathrooms:1,surfaces:{useful:{min:1},total:{min:1}}},true],
 ['Santo conserva precio desconocido','edificio-santo',{maxPrice:999999},false],
 ['BAUM no convierte Internos en útil','edificio-baum',{surfaceMetric:'useful',minSurface:1},false],
];
assert.equal(records.length+f9Cases.length,32);
for(const [name,slug,query,expected,id] of f9Cases)test('F9: '+name,()=>assert.equal(matches(slug,query,id),expected));

test('454 referencias documentales y costes adicionales no son stock ni precios de inmueble',()=>{
  const documentary=records.flatMap(project=>project.references.filter(reference=>reference.sourceKind!=='project-fact'));
  assert.equal(documentary.length,454);
  assert.ok(documentary.every(reference=>reference.stock===null));
  assert.equal(evidence.additionalCosts.length,2);
  assert.equal(documentary.filter(reference=>reference.sourceKind==='COTIZACION_PROPIETARIO').length,20);
});

test('precio y todos los atributos de opción necesitan una única referencia',()=>{
  const source=record([ref('quote',{priceUF:3949,bedrooms:1,bathrooms:1}),ref('plan',{bedrooms:1,bathrooms:1,usefulM2:40,totalM2:44,privateGarden:true})]);
  assert.equal(matchProjectFilters(source,{maxPrice:4000,bedrooms:1,bathrooms:1}).matches,true);
  assert.equal(matchProjectFilters(source,{maxPrice:4000,surfaceMetric:'useful',minSurface:30}).matches,false);
  assert.equal(matchProjectFilters(source,{maxPrice:4000,privateGarden:true}).matches,false);
  assert.deepEqual(matchProjectFilters(source,{bedrooms:1,bathrooms:1,surfaceMetric:'total',minSurface:40}).matchedReferenceIds,['plan']);
});

test('null, undefined, texto numérico y vacío no se convierten en cero',()=>{
  for(const value of [null,undefined,'', '0']){
    const source=record([ref('unknown',{bedrooms:value,bathrooms:value,usefulM2:value,priceUF:value})]);
    assert.equal(matchProjectFilters(source,{}).matches,true);
    for(const query of [{bedrooms:0},{bathrooms:0},{surfaceMetric:'useful',minSurface:0},{maxPrice:1}])assert.equal(matchProjectFilters(source,query).matches,false);
  }
  assert.equal(matchProjectFilters(record([ref('literal-zero',{bedrooms:0,bathrooms:0,usefulM2:0})]),{bedrooms:0,bathrooms:0,surfaceMetric:'useful',minSurface:0,maxSurface:0}).matches,true);
});

test('desconocido no hereda Residencial y los productos mixtos conservan su referencia',()=>{
  const source=record([ref('residential',{propertyType:'departamento',priceUF:5000,bedrooms:2}),ref('local',{propertyType:'local',priceUF:2000}),ref('unknown',{priceUF:1000,bedrooms:1})],{assetTypes:['Residencial','Comercial','Mixto']});
  assert.equal(matchProjectFilters(source,{assetType:'Residencial',bedrooms:1}).matches,false);
  assert.deepEqual(matchProjectFilters(source,{propertyType:'Local comercial',maxPrice:2500}).matchedReferenceIds,['local']);
  assert.equal(matchProjectFilters(source,{propertyType:'local',bedrooms:2}).matches,false);
  assert.equal(matchProjectFilters(source,{assetType:'Mixto'}).matches,true);
  assert.equal(matchProjectFilters(record([ref('land',{propertyType:'terreno',priceUF:2000})]),{assetType:'Terreno',maxPrice:3000}).matches,true);
  assert.equal(matchProjectFilters(record([ref('unknown',{})]),{assetType:'Residencial'}).matches,false);
});

test('superficie requiere métrica explícita y no convierte total, interior o terraza en útil',()=>{
  const source=record([ref('plan',{interiorM2:40,totalM2:45,terraceM2:5})]);
  assert.equal(matchProjectFilters(source,{minSurface:1}).matches,false);
  assert.ok(matchProjectFilters(source,{minSurface:1}).issues.length);
  assert.equal(matchProjectFilters(source,{surfaceMetric:'useful',minSurface:1}).matches,false);
  assert.equal(matchProjectFilters(source,{surfaceMetric:'total',minSurface:45,maxSurface:45}).matches,true);
  assert.equal(matchProjectFilters(source,{surfaceMetric:'useful'}).matches,true);
  assert.equal(matchProjectFilters(source,{surfaceMetric:'total',minSurface:46,maxSurface:45}).matches,false);
  assert.equal(matchProjectFilters(source,{maxPrice:'abc'}).matches,false);
});

test('región, comuna, estado, entrega y amenities se combinan sin completar datos desconocidos',()=>{
  const source=record([ref('one',{})],{region:'Región Metropolitana',commune:'Santiago',developer:'Leben',state:'Recepción final',delivery:{category:'estimated',year:2027,semester:2},amenities:{pool:true,gym:true,greenAreas:null}});
  assert.equal(matchProjectFilters(source,{region:'Región Metropolitana',commune:'Santiago',state:'Recepción final',delivery:{year:2027,semester:2},amenities:['pool','gym'],amenitiesAll:true}).matches,true);
  assert.equal(matchProjectFilters(source,{commune:'Ñuñoa'}).matches,false);
  assert.equal(matchProjectFilters(source,{delivery:'inmediata'}).matches,false);
  assert.equal(matchProjectFilters(source,{amenities:['greenAreas']}).matches,false);
  assert.equal(matchProjectFilters(source,{amenities:['greenAreas','pool']}).matches,true);
  assert.equal(matchProjectFilters(source,{amenities:['greenAreas','pool'],amenitiesAll:true}).matches,false);
});

test('estado y entrega de etapas distintas no se cruzan',()=>{
  const source=record([ref('verde',{state:'En verde',delivery:{category:'estimated',year:2027}}),ref('recepcion',{state:'Recepción final',delivery:{category:'immediate'}})]);
  assert.equal(matchProjectFilters(source,{state:'En verde',delivery:'immediate'}).matches,false);
  assert.deepEqual(matchProjectFilters(source,{state:'Recepción final',delivery:'immediate'}).matchedReferenceIds,['recepcion']);
  assert.equal(matchProjectFilters(record([ref('rf',{})],{state:'Recepción final'}),{delivery:'immediate'}).matches,false);
});

test('terraza y jardín privados no son amenities comunes ni se prestan a locales',()=>{
  const source=record([ref('local',{propertyType:'local'}),ref('apartment',{propertyType:'departamento',privateTerrace:true})],{assetTypes:['Residencial','Comercial','Mixto'],amenities:{pool:true,gym:true,commonTerrace:true}});
  assert.equal(matchProjectFilters(source,{amenities:['commonTerrace']}).matches,true);
  assert.equal(matchProjectFilters(source,{privateGarden:true}).matches,false);
  assert.equal(matchProjectFilters(source,{propertyType:'local',amenities:['gym']}).matches,false);
  assert.equal(matchProjectFilters(source,{propertyType:'departamento',amenities:['gym'],privateTerrace:true}).matches,true);
  const universal={...source,projectFacts:{...source.projectFacts,amenityScopes:{gym:'all'}}};
  assert.equal(matchProjectFilters(universal,{propertyType:'local',amenities:['gym']}).matches,true);
  assert.equal(matches('edificio-indi',{propertyType:'local',amenities:['gym']}),false);
});

test('oferta adicional de estacionamiento/bodega no significa incluido ni disponible',()=>{
  const source=record([ref('one',{priceUF:5000,bedrooms:1})],{parking:{generalAdditional:true,included:false,available:null},storage:{generalAdditional:true,included:false,available:null}});
  assert.equal(matchProjectFilters(source,{parking:'additional',storage:'additional',maxPrice:6000}).matches,true);
  assert.equal(matchProjectFilters(source,{parking:'included'}).matches,false);
  assert.equal(matchProjectFilters(source,{storage:'available'}).matches,false);
  const scoped=record([ref('one',{bedrooms:1,parkingIncluded:true}),ref('two',{bedrooms:2,parkingAvailable:true})]);
  assert.equal(matchProjectFilters(scoped,{bedrooms:2,parking:'included'}).matches,false);
  assert.equal(matchProjectFilters(scoped,{bedrooms:1,parking:'included'}).matches,true);
});

test('una clasificación de proyecto no presta tipo a una cotización',()=>{
  const source=record([ref('project-fact:type',{propertyType:'departamento'}),ref('quote',{priceUF:4000,bedrooms:1})],{assetTypes:['Residencial']});
  assert.equal(matchProjectFilters(source,{propertyType:'departamento'}).matches,true);
  assert.equal(matchProjectFilters(source,{propertyType:'departamento',maxPrice:5000}).matches,false);
});

test('rangos inclusivos, opciones 4+/3+ y tipologías mantienen semántica de consulta',()=>{
  const source=record([ref('one',{bedrooms:4,bathrooms:3,totalM2:100})]);
  assert.equal(matchProjectFilters(source,{bedrooms:'4+',bathrooms:'3+',surfaceMetric:'total',minSurface:100,maxSurface:100}).matches,true);
  assert.equal(matchProjectFilters(source,{typologies:['4d-3b']}).matches,true);
  assert.equal(matchProjectFilters(record([ref('studio',{bedrooms:null,bathrooms:1})]),{typologies:['estudio-1b']}).matches,false);
});

test('evaluación pura conserva registros, consultas y valores originales',()=>{
  const source=record([ref('one',{priceUF:5000,bedrooms:1})],{region:'R'}),query={maxPrice:6000,bedrooms:1};
  const before=JSON.stringify({source,query});
  filterCommercialProjects([source],query);
  assert.equal(JSON.stringify({source,query}),before);
});

test('wrapper usa evidencia sólo en modo preparado y conserva el registro publicado',()=>{
  const cloned=buildCommercialProjects(published,evidence),living=cloned.find(project=>project.slug==='edificio-living-town');
  const before=JSON.stringify(living);
  assert.equal(advancedFilterAndSort([living],{...defaults(),maxPriceInput:'4000',bedrooms:'1',bathrooms:'1'}).length,0);
  const [result]=advancedFilterAndSort([living],{...defaults(),evidenceMode:'prepared',maxPriceInput:'4000',bedrooms:'1',bathrooms:'1'});
  assert.ok(result._commercialMatch.references.every(reference=>reference.attributes.priceUF<=4000&&reference.attributes.bedrooms===1&&reference.attributes.bathrooms===1));
  assert.equal(result.precioDesdeUF,1);
  assert.notEqual(result,living);
  assert.equal(JSON.stringify(living),before);
});

test('Own sigue en la entrada y se excluye sólo de la oferta preparada',()=>{
  const own={slug:'own',nombre:'Own',precioDesdeUF:null,_commercialStatus:{active:false}};
  assert.equal(advancedFilterAndSort([own],defaults()).length,1);
  assert.equal(advancedFilterAndSort([own],{...defaults(),evidenceMode:'prepared'}).length,0);
});

test('el modo preparado no hereda modalidad legal publicada de otra fecha',()=>{
  const source=record([ref('quote',{priceUF:4000})],{state:'En blanco',delivery:{category:'immediate'}});
  const project={slug:'purchase',_commercial:source,_facets:{purchaseStage:{eligible:true,mode:'verde'}}};
  assert.equal(advancedFilterAndSort([project],{...defaults(),evidenceMode:'prepared'}).length,1);
  assert.equal(advancedFilterAndSort([project],{...defaults(),evidenceMode:'prepared',state:'En blanco',purchaseModes:['verde']}).length,0);
  assert.equal(advancedFilterAndSort([project],{...defaults(),evidenceMode:'prepared',purchaseModes:['inmediata']}).length,0);
});

test('regresión publicada: desconocido no pasa Residencial en un proyecto mixto',()=>{
  const project={slug:'mixed',_facets:{assetTypes:['Mixto','Residencial','Comercial'],variants:[{propertyType:null,bedrooms:1},{propertyType:'local'}]}};
  assert.equal(advancedFilterAndSort([project],{...defaults(),assetType:'Residencial',bedrooms:'1'}).length,0);
  assert.equal(advancedFilterAndSort([project],{...defaults(),bedrooms:0}).length,0);
  assert.equal(advancedFilterAndSort([{...project,_facets:{variants:[{bedrooms:0}]}}],{...defaults(),bedrooms:0}).length,1);
});

test('regresión publicada: precio de oferta no toma baños/superficie de otro modelo',()=>{
  const project={slug:'owner',precioDesdeUF:5000,catalogPricePolicy:'owner-typology',commercialOffers:[{id:'1d',propertyType:'departamento',priceUF:5000,bedrooms:1}],_facets:{propertyTypes:['departamento'],assetTypes:['Residencial'],variants:[{propertyType:'departamento',bedrooms:1,bathrooms:1,areas:{util:40}}]}};
  assert.equal(advancedFilterAndSort([project],{...defaults(),maxPriceInput:'5500',bedrooms:'1'}).length,1);
  assert.equal(advancedFilterAndSort([project],{...defaults(),maxPriceInput:'5500',bedrooms:'1',bathrooms:'1'}).length,0);
  assert.equal(advancedFilterAndSort([project],{...defaults(),maxPriceInput:'5500',areaType:'util',minArea:'30'}).length,0);
  assert.equal(advancedFilterAndSort([project],{...defaults(),bedrooms:'1',bathrooms:'1',areaType:'util',minArea:'30'}).length,1);
  assert.equal(project.precioDesdeUF,5000);
});

test('precio global conserva precio solo pero no inventa correspondencia con dormitorios',()=>{
  const project={slug:'global',precioDesdeUF:3000,_facets:{propertyTypes:['departamento'],assetTypes:['Residencial'],variants:[{propertyType:'departamento',bedrooms:2}]}};
  assert.equal(advancedFilterAndSort([project],{...defaults(),maxPriceInput:'3500'}).length,1);
  assert.equal(advancedFilterAndSort([project],{...defaults(),maxPriceInput:'3500',propertyType:'departamento'}).length,1);
  assert.equal(advancedFilterAndSort([project],{...defaults(),maxPriceInput:'3500',bedrooms:'2'}).length,0);
});

test('métrica explícita, modo de evidencia y extras sobreviven URL saneada',()=>{
  assert.equal(defaults().areaType,'');
  assert.ok(rangeIssue({...defaults(),minArea:'0'}));
  assert.equal(rangeIssue({...defaults(),areaType:'total',minArea:'0'}),'');
  const state={...defaults(),areaType:'total',minArea:'30',evidenceMode:'prepared',parking:'additional',storage:'available'};
  const restored=readQuery('?'+writeQuery(state),{}).state;
  assert.equal(restored.evidenceMode,'prepared');
  assert.equal(restored.parking,'additional');
  assert.equal(restored.storage,'available');
  assert.equal(restored.areaType,'total');
  assert.equal(restored.minArea,'30');
  assert.equal(readQuery('?evidencia=inventada&estacionamiento=stock',{}).state.evidenceMode,'published');
  assert.equal(queryFromCatalogState({...defaults(),bedrooms:'0',amenities:['terraza-panoramica']}).bedrooms,'0');
  assert.deepEqual(queryFromCatalogState({amenities:['terraza-panoramica']}).amenities,['commonTerrace']);
});

test('etiquetas preparadas provienen de hechos y referencias coincidentes',()=>{
  const source=record([ref('quote',{priceUF:5000,bedrooms:1})],{amenities:{pool:true}});
  const project={slug:'labels',_facets:{features:[{id:'piscina',label:'Piscina'},{id:'gimnasio',label:'Gimnasio'},{id:'jardin-privado',label:'Jardín privado'}]},_commercialMatch:matchProjectFilters(source,{maxPrice:6000})};
  assert.deepEqual(matchedLabels(project,{amenities:['piscina','gimnasio'],features:['jardin-privado']}),['Piscina']);
});
