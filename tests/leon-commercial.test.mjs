import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {advancedFilterAndSort,defaults,readQuery,writeQuery} from '../assets/js/catalog-filter-engine.mjs';
import {catalogReference,leonCatalogOfferId} from '../assets/js/project-offers.mjs';
import {guideProjectContext} from '../assets/js/mortgage-guide-engine.mjs';
import {brochureSelectionMessage} from '../assets/js/project-brochure.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const projects=read('data/proyectos.json'),facets=read('data/catalog-facets.json'),input=read('docs/leon-commercial-20261030/owner-input.json');
const rows=projects.map(p=>({...p,_facets:facets.projects[p.slug]})),run=s=>advancedFilterAndSort(rows,{...defaults(),...s});
let checks=0;const ck=(value,label)=>{assert.ok(value,label);checks++};
ck(projects.length===131,'inventory unchanged');
for(const [slug,[prices,address,commune,delivery,state]] of Object.entries(input)){
 const p=projects.find(x=>x.slug===slug),f=facets.projects[slug];
 ck(p.precioDesdeUF===Math.min(...Object.values(prices)),slug+' minimum');
 for(const [key,value] of Object.entries({direccion:address,comuna:commune,entrega:delivery,estado:state}))ck(p[key]===value,slug+' '+key);
 ck(p.region===(commune==='Concepción'?'Biobío':'Región Metropolitana'),'region');
 ck(f.states[0]===state,'commercial state');ck(f.purchaseStage.eligible===(state!=='En recepción final'),'educational eligibility');
 for(const [bed,value] of Object.entries(prices)){
  const id=bed+'d',offer=p.commercialOffers.find(o=>o.id===id);
  ck(offer.priceUF===value,'exact authorized price');ck(catalogReference(p,{bedrooms:bed}).value===value,'selected bedroom price');
  ck(leonCatalogOfferId(p,{bedrooms:bed})===id,'public offer identity');
  ck(guideProjectContext('?proyecto='+slug+'&oferta='+id+'&origen=buscador',projects).propertyUf===value,'mortgage price');
  const msg=brochureSelectionMessage({name:p.nombre,developer:p.inmobiliaria,offers:p.commercialOffers},id);
  ck(msg.includes(p.nombre)&&msg.includes('León')&&msg.includes(offer.label),'quote context');
  ck(run({developers:['León'],search:p.nombre,bedrooms:bed,minPriceInput:String(value),maxPriceInput:String(value)}).some(x=>x.slug===slug),'inclusive price boundaries');
  ck(!run({developers:['León'],search:p.nombre,bedrooms:bed,maxPriceInput:String(value-1)}).some(x=>x.slug===slug),'no lower other typology price');
 }
}
const combination={region:'Biobío',commune:'Concepción',developers:['León'],propertyType:'departamento',bedrooms:'2',maxPriceInput:'4000'};
ck(run(combination).map(x=>x.slug).join()==='bcome','requested 2D search');
ck(catalogReference(run(combination)[0],combination).value===3855,'card shows selected 2D UF3855');
ck(run({...combination,bedrooms:'0',maxPriceInput:'3000'}).map(x=>x.slug).join()==='bcome','studio <=3000');
ck(run({...combination,bedrooms:'3'}).length===0,'no nonexistent 3D');
ck(run({...combination,bedrooms:'1',maxPriceInput:'3000'}).length===0,'no studio price for 1D');
ck(run({...combination,bathrooms:'2',areaType:'total',minArea:'50',maxArea:'58'}).length===1,'coherent 2D 2B total');
ck(run({...combination,bathrooms:'3'}).length===0,'unknown bathroom excluded');
ck(run({developers:['León'],bedrooms:'1',maxPriceInput:'10000'}).every(x=>!['condominio-uruguay','jardines-de-ramon-cruz'].includes(x.slug)),'documented 1D without price fails price search');
ck(run({developers:['León'],purchaseModes:['blanco']}).map(x=>x.slug).join()==='condominio-parque-don-lautaro','blanco guide');
ck(run({developers:['León'],purchaseModes:['verde']}).map(x=>x.slug).join()==='bcome','verde guide');
ck(run({developers:['León'],purchaseModes:['inmediata']}).length===0,'reception not legal delivery');
ck(run({developers:['León'],delivery:'inmediata'}).length===3,'reported commercial immediate delivery');
ck(run({developers:['León'],delivery:'2028'}).map(x=>x.slug).join()==='condominio-parque-don-lautaro','delivery year');
ck(run({developers:['León'],amenities:['piscina']}).length===3,'only verified pools');
ck(run({developers:['León'],amenities:['gimnasio']}).map(x=>x.slug).join()==='gregorio-de-la-fuente-a','no image-only gym inference');
for(const bedrooms of ['', '0','1','2','3']){
 const state={developers:['León'],bedrooms,sortOrder:'price-asc'},values=run(state).map(p=>catalogReference(p,state).value).filter(v=>v!==null);
 ck(values.every((v,i)=>!i||v>=values[i-1]),'numeric sort '+bedrooms);
}
const q=writeQuery({...defaults(),...combination},'list');
ck(readQuery('?'+q,{regions:['Biobío'],communes:['Concepción'],developers:['León'],propertyTypes:[{id:'departamento'}]}).state.bedrooms==='2','return filters');
console.log(JSON.stringify({checks,prices:11,projects:5,requestedSearch:run(combination).map(p=>p.slug)}));
