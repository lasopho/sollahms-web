import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {advancedFilterAndSort,defaults,writeQuery,readQuery} from '../assets/js/catalog-filter-engine.mjs';
import {catalogReference} from '../assets/js/project-offers.mjs';
import {guideProjectContext} from '../assets/js/mortgage-guide-engine.mjs';
import {resolveProjectIdentity} from '../assets/js/project-identity.mjs';
import {brochureSelectionMessage} from '../assets/js/project-brochure.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const catalog=read('data/proyectos.json'),facets=read('data/catalog-facets.json'),input=read('docs/ecasa-commercial-20261030/owner-input.json').records;
const all=catalog.map(p=>({...p,_facets:facets.projects[p.slug]}));let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++};
check(catalog.length===131,'Catalogue cardinality');
let n=0;
for(const p of catalog.filter(x=>x.inmobiliaria==='Ecasa'))for(const t of p.etapasComerciales){
 const expected=input[t.slug];check(expected,'stage identity');
 for(const o of t.commercialOffers){check(o.priceUF===expected.prices[o.id==='local'?'local':String(o.bedrooms)],'exact authorized price');n++;
 const context=guideProjectContext('?proyecto='+t.slug+'&oferta='+o.id,catalog);check(context?.propertyUf===o.priceUF,'financial context '+t.slug+' '+o.id);}
 check(t.entrega===expected.delivery&&t.estado===expected.state,'state and delivery');
 const identity=resolveProjectIdentity(catalog,t.slug);check(identity?.originCommercialSlug===t.slug,'quote identity '+t.slug);
 check(identity?.precioDesdeUF===t.precioDesdeUF,'quote price');
}
check(n===46,'46 existing prices');
const run=s=>advancedFilterAndSort(all,{...defaults(),...s});
const sample=run({developers:['Ecasa'],commune:'La Florida',propertyType:'departamento',bedrooms:'2',maxPriceInput:'4000',amenities:['gimnasio']});
check(sample.some(p=>p.slug==='aires-la-florida-2'),'Aires matches 2D 3600 + gym');
check(!sample.some(p=>p.slug==='urban-la-florida'),'Urban 2D4230 excluded despite 1D3240');
let local=run({developers:['Ecasa'],propertyType:'local'});check(local.length===1&&local[0].slug==='enlace-mackenna','only local');
check(catalogReference(local[0],{propertyType:'local'}).value===4800,'local price');
check(run({developers:['Ecasa'],propertyType:'local',amenities:['gimnasio']}).length===0,'local cannot inherit residential gym');
check(run({developers:['Ecasa'],propertyType:'local',bathrooms:'2'}).length===0,'unknown local bathrooms excluded');
const ferro=run({developers:['Ecasa'],search:'Ferroparque 2',bedrooms:'0',maxPriceInput:'2300'});check(ferro.length===1&&ferro[0]._ecasaStageSlug==='ferroparque-2','stage2 search and price');
const terra=run({developers:['Ecasa'],search:'Terratoltén 2',maxPriceInput:'10000'});check(terra.length===0,'no sibling price for unknown stage');
const sorted=run({developers:['Ecasa'],sortOrder:'price-asc'});const vals=sorted.map(p=>catalogReference(p,{}).value).filter(x=>x!==null);check(vals.every((v,i)=>!i||v>=vals[i-1]),'numeric price sorting');
const same=run({developers:['Ecasa'],bedrooms:'2',minPriceInput:'3500',maxPriceInput:'3600'});check(same.every(p=>{const v=catalogReference(p,{bedrooms:'2'}).value;return v>=3500&&v<=3600}),'bounded typed price');
const st=defaults();Object.assign(st,{developers:['Ecasa'],commune:'La Florida',bedrooms:'2',maxPriceInput:'4000',amenities:['gimnasio']});const options={developers:['Ecasa'],communes:['La Florida'],filters:[{id:'gimnasio',group:'amenities'}]};const q=writeQuery(st,'list');const restored=readQuery('?'+q,options);check(restored.state.bedrooms==='2'&&restored.state.maxPriceInput==='4000'&&restored.state.developers[0]==='Ecasa'&&restored.view==='list','return-state serialization');
const msg=brochureSelectionMessage({name:'Alto San Joaquín',developer:'Ecasa',offers:[{id:'alto-san-joaquin-2--3d',stageName:'Alto San Joaquín 2',label:'3 dormitorios',priceUF:8300,propertyType:'departamento'}]},'alto-san-joaquin-2--3d');check(msg.includes('Alto San Joaquín 2')&&msg.includes('8.300'),'selected stage and typology payload');
console.log(JSON.stringify({checks,prices:n,projects:catalog.length,sample:sample.map(x=>x.nombre)}));
