import {resolveProjectIdentity} from './project-identity.mjs';
import {loadCatalogExpansion,appendCatalogExpansion} from './catalog-expansion.mjs';

const publicSlug=/^[a-z0-9][a-z0-9-]{0,99}$/;
const reservedSlugs=new Set(['constructor','prototype','__proto__']);
const legacyIdentity=(catalogue,slug)=>catalogue.some(project=>project?.slug===slug
  || project?.inmobiliaria==='Ecasa'&&Array.isArray(project.etapasComerciales)
    &&project.etapasComerciales.some(stage=>stage?.slug===slug));

/** Resolve the existing catalogue first. New context carries identity only. */
export async function resolveAdvisoryProject(catalogue,slug,stage=null,{loadExpansion=loadCatalogExpansion}={}){
  const existing=resolveProjectIdentity(catalogue,slug,stage);
  if(existing)return existing;
  if(!Array.isArray(catalogue)||typeof slug!=='string'||!publicSlug.test(slug)
      ||reservedSlugs.has(slug)||stage!==null||legacyIdentity(catalogue,slug))return null;
  const project=resolveProjectIdentity(appendCatalogExpansion(catalogue,await loadExpansion()),slug);
  if(!project)return null;
  // Do not bring external prices, unit references or stock into the request.
  return Object.fromEntries(['slug','nombre','inmobiliaria','comuna','region','detalleUrl',
    'canonicalSlug','originCommercialSlug','requestedSlug','explicitStage','bodyProjectSlug','contextQuery']
    .map(key=>[key,project[key]]));
}
