import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolveProjectIdentity} from '../assets/js/project-identity.mjs';
const root=new URL('../',import.meta.url);
const roles={
 'contacto.html#contact-form':{kind:'commercial',endpoint:'/api/contact'},
 'agenda-asesoria.html#booking-form':{kind:'commercial',endpoint:'/api/booking-create'},
 'comparador-hipotecario.html#lead-form':{kind:'commercial',endpoint:'/api/contact'},
 'comparador-hipotecario.html#simulation-form':{kind:'calculator'},
 'proyectos.html#capacity-form':{kind:'calculator'},
 'proyectos.html#catalog-filters':{kind:'search'},
};
export function inventoryCrmForms(){
 const catalogue=JSON.parse(readFileSync(new URL('data/proyectos.json',root),'utf8'));
 const activePages=new Set(['index.html','contacto.html','agenda-asesoria.html','comparador-hipotecario.html','proyectos.html',...catalogue.map(p=>p.detalleUrl?.replace(/^\//,'').split('#')[0]).filter(Boolean)]);
 const forms=[],destinations={},projects=new Set(),delivered=new Set(),unresolved=[];let links=0;
 for(const file of readdirSync(root).filter(p=>p.endsWith('.html')).sort()){
  const html=readFileSync(new URL(file,root),'utf8');
  for(const match of html.matchAll(/<form\b[^>]*>/gi)){
   const id=match[0].match(/\bid="([^"]+)"/)?.[1]??'';
   forms.push({page:file,id,...(roles[file+'#'+id]??{kind:'unclassified'})});
  }
  if(!activePages.has(file))continue;
  for(const match of html.matchAll(/href="([^"#]+)"/g)){
   const url=new URL(match[1].replaceAll('&amp;','&'),'https://sollahms.cl/');
   if(url.origin!=='https://sollahms.cl'||!['/contacto.html','/agenda-asesoria.html','/comparador-hipotecario.html'].includes(url.pathname))continue;
   links++;destinations[url.pathname]=(destinations[url.pathname]??0)+1;
   const project=url.searchParams.get('proyecto');if(!project)continue;
   projects.add(project);const identity=resolveProjectIdentity(catalogue,project,url.searchParams.get('etapa'));if(identity)delivered.add(identity.bodyProjectSlug);else unresolved.push({page:file,project,stage:url.searchParams.get('etapa')});
  }
 }
 return{commercialForms:forms.filter(f=>f.kind==='commercial').length,forms,activePages:activePages.size,commercialLinks:links,destinations,projectContexts:[...projects].sort(),deliveredProjectContexts:[...delivered].sort(),unresolvedProjectLinks:unresolved};
}
if(process.argv[1]===fileURLToPath(import.meta.url))process.stdout.write(JSON.stringify(inventoryCrmForms(),null,2)+'\n');
