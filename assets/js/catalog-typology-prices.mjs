import {matchProjectFilters,queryFromCatalogState,normalizeAmenityKey,normalizePropertyType} from './commercial-filter-engine.mjs';

const priced=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
const active=value=>value!==''&&value!==undefined&&value!==null;
const privateIds=new Set(['terraza-privada','jardin-privado']);
const bedroomLabels=new Map([['1 dormitorio',1],['2 dormitorios',2],['3 dormitorios',3],['4 dormitorios',4]]);
const documentedDate=value=>{
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const parsed=Date.parse(value+'T00:00:00Z');
  return Number.isFinite(parsed)&&new Date(parsed).toISOString().slice(0,10)===value;
};

// Existing commercialOffers policies remain authoritative, including each ECasa
// stage. Its summary table must never introduce a second stage price path.
export function hasCatalogTypologyPrices(project){
  const commercial=project.commercialSource;
  return Array.isArray(project.preciosPorTipologia)&&project.preciosPorTipologia.length>0
    &&commercial?.type==='owner-supplied'&&documentedDate(commercial.verifiedOn??commercial.date)
    &&[undefined,'confirmed'].includes(project.priceStatus)&&[undefined,'confirmed'].includes(commercial.priceStatus)
    &&!Object.hasOwn(project,'commercialOffers')
    &&project.catalogPricePolicy!=='owner-typology'
    &&!(project.inmobiliaria==='Ecasa'&&project.commercialSource?.date==='2026-10-30');
}

function source(project){
  const commercial=project.commercialSource??{};
  return {kind:'owner-published-typology',
    date:commercial.verifiedOn??commercial.date??null,
    path:commercial.file??'data/proyectos.json'};
}

function category(label,owner){
  if(label==='Local')return {propertyType:'local',assetType:'Comercial',bedrooms:null,typology:'local'};
  // This exact six-label owner catalogue enum is separate from raw Iris text.
  // A residential category does not establish apartment versus house. Estudio
  // means 0 bedrooms only in this already-published owner enum, never in Iris.
  if(label==='Estudio')return {propertyType:null,assetType:owner?'Residencial':null,
    bedrooms:owner?0:null,typology:owner?'estudio':null};
  const bedrooms=bedroomLabels.get(label);
  return {propertyType:null,assetType:bedrooms&&owner?'Residencial':null,
    bedrooms:bedrooms??null,typology:bedrooms?bedrooms+'d':null};
}

function universalTypeContext(project,attributes){
  if(attributes.propertyType!==null||attributes.assetType!=='Residencial')return null;
  const facets=project._facets??{},declared=facets.propertyTypes??[],types=declared.map(normalizePropertyType);
  if(!types.length||types.some(type=>type===null)||new Set(types).size!==1
    ||!['departamento','casa','duplex','estudio'].includes(types[0])
    ||!facets.assetTypes?.length||facets.assetTypes.some(type=>type!=='Residencial'))return null;
  return {propertyType:{value:types[0],sourcePath:'data/catalog-facets.json',
    sourcePointer:'/projects/'+project.slug+'/propertyTypes',scope:'published-project-universal',
    sourceDate:null,ownerCategoryAssetType:attributes.assetType,noVariantFieldsUsed:true}};
}

export function catalogTypologyRecord(project){
  if(!hasCatalogTypologyPrices(project))return null;
  const provenance=source(project),owner=provenance.kind==='owner-published-typology';
  const amenities={},amenityScopes={};
  for(const feature of project._facets?.features??[]){
    if(privateIds.has(feature.id))continue;
    const key=normalizeAmenityKey(feature.id);amenities[key]=true;
    // A generic project entry does not prove universal entitlement. The pure
    // evaluator requires known residential use unless scope is explicit.
    if(['residential','commercial','all','Residencial','Comercial','Terreno'].includes(feature.scope))amenityScopes[key]=feature.scope;
  }
  return {slug:project.slug,sourceLayer:'published-typology-prices',
    sourceProject:{slug:project.slug,nombre:project.nombre,direccion:project.direccion},
    projectFacts:{region:project.region,commune:project.comuna,developer:project.inmobiliaria,
      assetTypes:project._facets?.assetTypes??[],amenities,amenityScopes},
    references:project.preciosPorTipologia.map((row,index)=>{
      const attributes=category(row.tipologia,owner),context=universalTypeContext(project,attributes);
      return {
      id:'published-typology:'+project.slug+':'+index,label:row.tipologia,
      sourceKind:provenance.kind,sourceDate:provenance.date,
      sourcePath:'data/proyectos.json',sourcePointer:'/preciosPorTipologia/'+index,
      sourceProjectSlug:project.slug,authoritySourcePath:provenance.path,
      scope:'published typology, not a unit',stock:null,
      ...(context?{universalProjectContext:context}:{}),
      attributes:{...attributes,propertyType:context?.propertyType.value??attributes.propertyType,
        priceUF:priced(row.precioDesdeUF)?row.precioDesdeUF:null,
        bathrooms:null,usefulM2:null,totalM2:null,interiorM2:null,terraceM2:null,gardenM2:null,landM2:null,
        privateTerrace:null,privateGarden:null,parkingIncluded:null,parkingAvailable:null,
        storageIncluded:null,storageAvailable:null},
    };})};
}

export function matchCatalogTypologyPrices(project,state={}){
  const record=catalogTypologyRecord(project);if(!record)return null;
  const query=queryFromCatalogState(state);
  // These existing project/stage predicates are evaluated by the catalogue.
  for(const key of ['region','commune','developers','state','delivery'])delete query[key];
  query.features=[];
  const match=matchProjectFilters(record,query);
  // Features and amenities each retain their own AND/OR group. Both must use
  // the same price witness, and scoped features use the same eligibility rules.
  const references=match.references.filter(reference=>matchProjectFilters({...record,references:[reference]},
    {amenities:state.features??[],amenitiesAll:state.featuresAll===true}).matches);
  return {...match,matches:references.length>0,references,matchedReferenceIds:references.map(reference=>reference.id)};
}

function selectingReference(state){
  return ['propertyType','assetType','bedrooms','bathrooms','minPriceInput','maxPriceInput',
    'minArea','maxArea','parking','storage','search'].some(key=>active(state[key]))
    ||['typologies','amenities','features'].some(key=>state[key]?.length);
}

export function catalogTypologyWitness(project,state={},match=project._publishedPriceMatch??matchCatalogTypologyPrices(project,state)){
  const references=match?.references??[];
  if(!selectingReference(state))return references.find(reference=>reference.attributes.priceUF===project.precioDesdeUF
    &&reference.label===project.precioDesdeTipologia)??null;
  const known=references.filter(reference=>priced(reference.attributes.priceUF));
  return known.length?known.reduce((a,b)=>a.attributes.priceUF<=b.attributes.priceUF?a:b):references[0]??null;
}

export function catalogTypologyOffer(project,state={},match=project._publishedPriceMatch??matchCatalogTypologyPrices(project,state)){
  if(!selectingReference(state))return {value:priced(project.precioDesdeUF)?project.precioDesdeUF:null,
    typology:project.precioDesdeTipologia??null,financialBaselineCompatible:true};
  const reference=catalogTypologyWitness(project,state,match);
  const value=reference?.attributes.priceUF??null,typology=reference?.label??null;
  // The capacity programme evaluates the original published project baseline.
  // A matching amount alone cannot make another typology that same scenario.
  return {value,typology,financialBaselineCompatible:priced(value)&&value===project.precioDesdeUF
    &&typeof typology==='string'&&typology===project.precioDesdeTipologia};
}

export function catalogTypologyFeatureIds(project,state={},match=project._publishedPriceMatch??matchCatalogTypologyPrices(project,state)){
  const reference=catalogTypologyWitness(project,state,match);if(!reference)return [];
  return (project._facets?.features??[]).filter(feature=>!privateIds.has(feature.id)
    &&matchProjectFilters({...match.record,references:[reference]},{amenities:[feature.id]}).matches).map(feature=>feature.id);
}
