import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {advancedFilterAndSort,defaults,writeQuery,readQuery} from '../assets/js/catalog-filter-engine.mjs';
import {catalogReference} from '../assets/js/project-offers.mjs';import {guideProjectContext} from '../assets/js/mortgage-guide-engine.mjs';import {brochureSelectionMessage} from '../assets/js/project-brochure.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));const all=read('data/proyectos.json'),f=read('data/catalog-facets.json'),input=read('docs/aj-urbana-20261030/owner-input.json');let n=0;const ck=(v,m)=>{assert.ok(v,m);n++};const rows=all.map(p=>({...p,_facets:f.projects[p.slug]}));const run=x=>advancedFilterAndSort(rows,{...defaults(),...x});
ck(all.length===131,'131 preserved');
for(const [slug,[prices,address,delivery,state]] of Object.entries(input)){
 const p=all.find(x=>x.slug===slug);ck(p.direccion===address,'address');ck(p.entrega===delivery,'delivery');ck(p.estado===state,'state');ck(p.precioDesdeUF===Math.min(...Object.values(prices)),'minimum');
 for(const [beds,value] of Object.entries(prices)){
  const o=p.commercialOffers.find(x=>x.id===beds+'d');ck(o.priceUF===value,'exact decimal');ck(catalogReference(p,{bedrooms:beds}).value===value,'typed price');ck(guideProjectContext('?proyecto='+slug+'&oferta='+o.id,all).propertyUf===value,'simulator');ck(brochureSelectionMessage({name:p.nombre,developer:p.inmobiliaria,offers:p.commercialOffers},o.id).includes(o.label),'quote context');
 }
 ck(f.projects[slug].states[0]===state,'facet state');ck(f.projects[slug].purchaseStage.eligible===(state==='En verde'),'educational state');
}
const s={developers:['AJ Urbana'],commune:'Santiago',propertyType:'departamento',bedrooms:'0',maxPriceInput:'2700'};
ck(run(s).length===4,'requested combination');ck(!run({...s,bedrooms:'1'}).length,'no studio price for 1D');ck(run({...s,minPriceInput:'2596.2',maxPriceInput:'2596.2'})[0]?.slug==='edificio-vista-amunategui','exact decimal boundaries');ck(run({developers:['AJ Urbana'],bedrooms:'2',maxPriceInput:'4000'}).length===1,'Morande unknown excluded');
const sorted=run({developers:['AJ Urbana'],sortOrder:'price-asc'}).map(p=>p.precioDesdeUF);ck(sorted.every((p,i)=>!i||p>=sorted[i-1]),'numeric order');
const q=writeQuery({...defaults(),...s},'list');ck(readQuery('?'+q,{developers:['AJ Urbana'],communes:['Santiago'],propertyTypes:[{id:'departamento'}]}).state.maxPriceInput==='2700','return state');
console.log(JSON.stringify({checks:n,prices:10,projects:5,requestedSearch:run(s).map(x=>x.slug)}));
