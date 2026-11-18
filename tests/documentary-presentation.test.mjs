import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadLocalDocumentaryReview} from '../assets/js/documentary-local-review.mjs';
import {advancedFilterAndSort,defaults} from '../assets/js/catalog-filter-engine.mjs';
import {documentaryReference,projectOffer,offerPriceLabel,projectFacts,commercialLayerNote} from '../assets/js/catalog-model.mjs';

const reference=(id,attributes)=>({id,attributes});
const legacy={slug:'example',nombre:'Proyecto',precioDesdeUF:11073,estado:'Estado publicado',entrega:'Entrega publicada',tipologias:['3 dormitorios'],
  _facets:{delivery:{label:'Entrega de facetas'},variants:[{areas:{util:99,total:120}}]},
  _commercial:{asOf:'2026-11-16',projectFacts:{state:'Estado F9'}},
  _commercialMatch:{references:[reference('old-quote',{priceUF:9999,bedrooms:3,totalM2:120})]}};
const documentary=(references,byReferenceId={})=>({...structuredClone(legacy),
  _documentaryMatch:{record:{projectFacts:{}},references},_documentaryMetadata:{byReferenceId}});
const facts=project=>Object.fromEntries(projectFacts(project).map(row=>[row.label,row.value]));

test('the actual pinned Plaza loader contract renders a readable scope and separate dates',async()=>{
  const projects=JSON.parse(await readFile(new URL('../data/proyectos.json',import.meta.url),'utf8'));
  const fetchImpl=async path=>({ok:true,text:()=>readFile(new URL('..'+path,import.meta.url),'utf8')});
  const loaded=await loadLocalDocumentaryReview(projects,{location:new URL('http://127.0.0.1:8766/proyectos.html?revision_documental=1'),fetchImpl});
  const matches=advancedFilterAndSort(loaded.projects,{...defaults(),evidenceMode:'documentary',search:'Plaza Las Condes',minPriceInput:'11000',maxPriceInput:'11200',bedrooms:'2',bathrooms:'2',areaType:'util',minArea:'69',maxArea:'70'});
  assert.equal(matches.length,1);
  const note=commercialLayerNote(matches[0]);
  assert.match(note,/Alcance: sólo unidad 213, modelo C7/);
  assert.match(note,/Precio del propietario · 28\/10\/2026/);
  assert.match(note,/Consultada · 17\/11\/2026/);
  assert.doesNotMatch(note,/\[object Object\]|undefined|local-review|drawingIssueDate/);
  assert.equal(projectOffer(matches[0]).value,11119);
  assert.equal(projectOffer(matches[0]).referenceId,'DOC-SENTO-PLC-U213-C7-OBS20261117');
});

test('an identity-only documentary result never borrows published or F9 facts and price',()=>{
  const project=documentary([]);
  assert.equal(projectOffer(project).value,null);
  assert.equal(offerPriceLabel(project),'Sin referencia documental en esta revisión');
  assert.deepEqual(projectFacts(project),[]);
  assert.match(commercialLayerNote(project),/sólo identidad publicada/);
});

test('explicit documentary presentation also fails closed before a match is attached',()=>{
  assert.equal(projectOffer(legacy,{evidenceMode:'documentary'}).value,null);
  assert.deepEqual(projectFacts(legacy,'',{evidenceMode:'documentary'}),[]);
  assert.match(commercialLayerNote(legacy,{evidenceMode:'documentary'}),/sin referencia recibida/);
});

test('an external price remains provenance and cannot become a commercial amount',()=>{
  const project=documentary([reference('iris',{priceUF:null,bedrooms:1,bathrooms:1,internalM2:31.35})],
    {iris:{externalPriceMetadata:{listUF:3333,finalUF:3000},sourceURL:'https://iris.yapo.cl/proyecto/1',observedAtUTC:'2026-11-17T10:00:00Z'}});
  assert.equal(projectOffer(project).value,null);
  assert.equal(offerPriceLabel(project),'Sin precio comercial para esta referencia');
  assert.doesNotMatch(commercialLayerNote(project),/3333|3000|Desde|Cotización Sollahms/);
  assert.match(commercialLayerNote(project),/Fuente Iris.*Consultada · 17\/11\/2026/);
});

test('Internos remains a literal metric and never becomes useful, interior or total',()=>{
  const project=documentary([reference('iris',{priceUF:null,internalM2:31.35,terraceM2:2.84,bedrooms:1,bathrooms:1})]);
  assert.deepEqual(facts(project),{'Tipología de la referencia':'1D / 1B','Superficie de terraza':'2,84 m²','Internos (rótulo de la fuente)':'31,35 m²'});
  assert.ok(!projectFacts(project).some(row=>/útil|total|interior/i.test(row.label)));
});

test('an explicit lot total stays attached to the lot instead of residential total',()=>{
  const project=documentary([reference('lot',{priceUF:null,propertyType:'terreno',lotTotalM2:1500})]);
  assert.deepEqual(facts(project),{'Total del lote':'1.500 m²'});
});

test('a documented zero terrace is displayed and unknown surfaces are omitted',()=>{
  const project=documentary([reference('zero',{priceUF:null,terraceM2:0,usefulM2:null,totalM2:null})]);
  assert.deepEqual(facts(project),{'Superficie de terraza':'0 m²'});
});

test('Plaza213 owner price and exact C7 plan project from their common reference',()=>{
  const project=documentary([reference('plaza213',{priceUF:11119,bedrooms:2,bathrooms:2,usefulM2:69.85,totalM2:83.82,terraceM2:13.97})],
    {plaza213:{unitLabel:'213',modelLabel:'C7',ownerPriceDate:'2026-10-28',observedAtUTC:'2026-11-17T19:00:00Z',sourceURL:'https://iris.yapo.cl/proyecto/269',scope:'Plano exacto de la unidad 213'}});
  assert.equal(projectOffer(project).referenceId,'plaza213');
  assert.equal(projectOffer(project).value,11119);
  assert.equal(projectOffer(project).date,'2026-10-28');
  assert.equal(offerPriceLabel(project),'Referencia propietaria UF 11.119');
  assert.deepEqual(facts(project),{'Tipología de la referencia':'2D / 2B','Superficie útil':'69,85 m²','Superficie total':'83,82 m²','Superficie de terraza':'13,97 m²'});
  assert.match(commercialLayerNote(project),/Unidad 213 · Modelo C7.*Precio del propietario · 28\/10\/2026.*Consultada · 17\/11\/2026.*Plano exacto de la unidad 213/);
  assert.match(commercialLayerNote(project),/Disponibilidad y vigencia por confirmar; no acredita stock/);
  assert.doesNotMatch(offerPriceLabel(project),/Desde|11\.073/);
});

test('a priced reference does not borrow surfaces or source scope from an unpriced one',()=>{
  const project=documentary([reference('owner',{priceUF:4000,bedrooms:2}),reference('other-plan',{priceUF:null,totalM2:90,bathrooms:2})],
    {owner:{unitLabel:'213',ownerPriceDate:'2026-10-28',scope:'Sólo unidad 213'},'other-plan':{unitLabel:'313',scope:'Otra unidad'}});
  assert.equal(documentaryReference(project).id,'owner');
  assert.deepEqual(facts(project),{'Tipología de la referencia':'2D'});
  assert.match(commercialLayerNote(project),/Sólo unidad 213/);
  assert.doesNotMatch(commercialLayerNote(project),/313|Otra unidad/);
});

test('the lowest matching priced reference carries its own facts',()=>{
  const project=documentary([reference('higher',{priceUF:5000,totalM2:90}),reference('lower',{priceUF:4000,usefulM2:60})]);
  assert.equal(projectOffer(project).referenceId,'lower');
  assert.deepEqual(facts(project),{'Superficie útil':'60 m²'});
});

test('unmatched references are never considered for presentation',()=>{
  const project=documentary([reference('matched',{priceUF:null,bedrooms:1})]);
  project._documentaryRecord={references:[reference('unmatched',{priceUF:11119,totalM2:83.82})]};
  assert.equal(projectOffer(project).value,null);
  assert.deepEqual(facts(project),{'Tipología de la referencia':'1D'});
});

test('observation date is not relabeled as a source date',()=>{
  const project=documentary([reference('iris',{priceUF:null})],{iris:{observedAtUTC:'2026-11-17T10:00:00Z',sourceDate:null}});
  assert.match(commercialLayerNote(project),/Consultada · 17\/11\/2026/);
  assert.doesNotMatch(commercialLayerNote(project),/Fecha declarada de fuente/);
});

test('an explicit source date remains distinct from an owner price date',()=>{
  const project=documentary([reference('source',{priceUF:11119})],{source:{ownerPriceDate:'2026-10-28',sourceDate:'2026-11-17'}});
  assert.match(commercialLayerNote(project),/Precio del propietario · 28\/10\/2026.*Fecha declarada de fuente · 17\/11\/2026/);
});

test('source-provided unit prefixes are not duplicated',()=>{
  const project=documentary([reference('iris',{priceUF:null})],{iris:{unitLabel:'Unidad 909A · Piso 9'}});
  assert.match(commercialLayerNote(project),/Referencia documental · Unidad 909A/);
  assert.doesNotMatch(commercialLayerNote(project),/Unidad Unidad/);
});

test('projection does not mutate the source project or references',()=>{
  const project=documentary([reference('iris',{priceUF:null,internalM2:31.35})]);
  const before=JSON.stringify(project);
  projectOffer(project);offerPriceLabel(project);projectFacts(project);commercialLayerNote(project);
  assert.equal(JSON.stringify(project),before);
});

test('leaving documentary mode restores the separate published projection',()=>{
  const project={slug:'published',precioDesdeUF:3000.25,estado:'En verde',tipologias:['1 dormitorio']};
  assert.equal(offerPriceLabel(project,{evidenceMode:'published'}),'Desde UF 3.000,25');
  assert.ok(projectFacts(project).some(row=>row.label==='Estado'&&row.value==='En verde'));
  assert.equal(commercialLayerNote(project),'');
});

test('prepared Leben presentation remains a separate reference channel',()=>{
  const project=structuredClone(legacy);
  assert.equal(projectOffer(project).referenceId,'old-quote');
  assert.equal(offerPriceLabel(project),'Referencia UF 9.999');
  assert.match(commercialLayerNote(project),/16\/11\/2026/);
});
