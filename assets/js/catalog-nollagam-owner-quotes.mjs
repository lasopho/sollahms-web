/** Pure Nollagam owner-category references. No model, unit or stock is inferred. */
export const NOLLAGAM_OWNER_SOURCE_PATH='data/nollagam-commercial.json';
const PROJECTS_SOURCE_PATH='data/proyectos.json';
const ownerDeclaration='Tabla proporcionada por el propietario de Sollahms; prevalece sobre campañas del proveedor';
const slugs=new Set(['edificio-liverpool','barrio-zenteno','alto-goycolea','edificio-santa-maria',
  'eleuterio-ramirez','costanera-coquimbo-a','costanera-coquimbo-b']);
const bedroomLabels=new Map([['Estudio',0],['1 dormitorio',1],['2 dormitorios',2],
  ['3 dormitorios',3],['4 dormitorios',4]]);
const unknownAttributes=Object.freeze({propertyType:null,assetType:null,bathrooms:null,typology:null,
  usefulM2:null,totalM2:null,interiorM2:null,terraceM2:null,gardenM2:null,landM2:null,
  privateTerrace:null,privateGarden:null,parkingIncluded:null,parkingAvailable:null,
  storageIncluded:null,storageAvailable:null,state:null,delivery:null});
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)
  &&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const requireValue=(condition,message)=>{if(!condition)throw new TypeError('Nollagam owner quotes: '+message);};
const validPrice=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
function validDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const epoch=Date.parse(value+'T00:00:00Z');
  return Number.isFinite(epoch)&&new Date(epoch).toISOString().slice(0,10)===value;
}
function freeze(value){
  if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}
  return value;
}
function identity(project){
  const result={};
  for(const key of ['slug','nombre','inmobiliaria','comuna','region','direccion']){
    const value=project[key];
    requireValue(value==null||typeof value==='string','invalid identity '+key);
    result[key]=value??null;
  }
  requireValue(result.nombre&&result.inmobiliaria==='Nollagam','unmatched Nollagam identity');
  return result;
}

/**
 * Accept the existing parsed owner source and published identities explicitly.
 * The 17 known prices come only from source.projects[slug].prices. The five
 * other published categories retain null; no project minimum can fill them.
 * checkedOn is the original declared source date, not renewed price validity.
 * This module has no loader or application consumer. The caller owns adoption.
 */
export function createNollagamOwnerQuoteLayer(publishedProjects,ownerSource){
  requireValue(Array.isArray(publishedProjects),'published identities must be an array');
  requireValue(plain(ownerSource)&&plain(ownerSource.projects),'owner source is required');
  requireValue(ownerSource.priceSource===ownerDeclaration,'owner authority declaration is missing');
  requireValue(validDate(ownerSource.checkedOn),'checkedOn must be a valid declared calendar date');
  const sourceSlugs=Object.keys(ownerSource.projects);
  requireValue(sourceSlugs.length===slugs.size&&sourceSlugs.every(slug=>slugs.has(slug)),
    'source must retain the seven existing Nollagam identities');
  const index=new Map();
  publishedProjects.forEach((project,position)=>{
    requireValue(plain(project)&&typeof project.slug==='string','invalid published identity');
    requireValue(!index.has(project.slug),'duplicate published identity '+project.slug);
    index.set(project.slug,{project,position});
  });
  for(const slug of slugs)requireValue(index.has(slug),'missing published identity '+slug);
  const records=publishedProjects.filter(project=>slugs.has(project.slug)).map(project=>{
    const {position}=index.get(project.slug),sourceProject=identity(project);
    const ownerProject=ownerSource.projects[project.slug];
    requireValue(plain(ownerProject)&&plain(ownerProject.prices),'missing owner price categories '+project.slug);
    const ownerPrices=ownerProject.prices,rows=project.preciosPorTipologia;
    requireValue(Array.isArray(rows)&&rows.length>0,'missing published categories '+project.slug);
    for(const [key,value] of Object.entries(ownerPrices)){
      requireValue(/^[0-4]$/.test(key),'unknown owner bedroom category '+key);
      requireValue(value===null||validPrice(value),'owner prices must be positive numbers or explicit null');
    }
    const seen=new Set(),priceParent='/projects/'+project.slug+'/prices';
    const references=rows.map((row,rowIndex)=>{
      requireValue(plain(row)&&bedroomLabels.has(row.tipologia),'unrecognized category label '+project.slug);
      const bedrooms=bedroomLabels.get(row.tipologia),key=String(bedrooms);
      requireValue(!seen.has(key),'duplicate bedroom category '+project.slug+':'+key);seen.add(key);
      const present=Object.hasOwn(ownerPrices,key),price=present?ownerPrices[key]:null;
      // Absence in the owner table cannot authorize a populated legacy price.
      requireValue(present||row.precioDesdeUF===null,'unbacked published category price '+project.slug+':'+key);
      const categoryPointer='/'+position+'/preciosPorTipologia/'+rowIndex;
      return {
        id:'nollagam-owner:'+project.slug+':'+key+'d',label:row.tipologia,
        sourceKind:'owner-supplied',sourcePath:NOLLAGAM_OWNER_SOURCE_PATH,
        sourcePointer:present?priceParent+'/'+key:priceParent,
        sourceDate:ownerSource.checkedOn,sourceDateField:'/checkedOn',
        sourcePresence:present?'category-declared':'category-not-listed',
        missingSourceKey:present?null:key,scope:'typology-not-unit',stock:null,availability:null,
        publishedCategory:{sourcePath:PROJECTS_SOURCE_PATH,sourcePointer:categoryPointer+'/tipologia',
          literal:row.tipologia,...(!present?{unknownPricePointer:categoryPointer+'/precioDesdeUF'}:{})},
        attributes:{...unknownAttributes,bedrooms,priceUF:price},
      };
    });
    requireValue(Object.keys(ownerPrices).every(key=>seen.has(key)),
      'owner category lacks a matching published category '+project.slug);
    return {slug:project.slug,sourceLayer:'nollagam-owner-typology',sourceProject,
      asOf:ownerSource.checkedOn,scope:'owner-typology-not-unit-no-stock',
      projectFacts:{region:sourceProject.region,commune:sourceProject.comuna,developer:sourceProject.inmobiliaria},
      references};
  });
  const references=records.flatMap(record=>record.references);
  return freeze({source:{path:NOLLAGAM_OWNER_SOURCE_PATH,date:ownerSource.checkedOn,dateField:'/checkedOn',
    authority:ownerSource.priceSource,scope:'typology-not-unit',stock:'unconfirmed'},records,
    counts:{projects:records.length,references:references.length,
      priced:references.filter(reference=>validPrice(reference.attributes.priceUF)).length,
      unknownPrice:references.filter(reference=>reference.attributes.priceUF===null).length}});
}
