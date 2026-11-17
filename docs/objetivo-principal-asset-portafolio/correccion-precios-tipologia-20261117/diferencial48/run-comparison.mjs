import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {advancedFilterAndSort as original,defaults as originalDefaults} from './baseline/assets/js/catalog-filter-engine.mjs';
import {catalogReference as originalOffer} from './baseline/assets/js/project-offers.mjs';
import {advancedFilterAndSort as candidate,defaults} from '/private/tmp/sollahms-referencias-documentales-131-20261117/assets/js/catalog-filter-engine.mjs';
import {projectOffer as candidateOffer} from '/private/tmp/sollahms-referencias-documentales-131-20261117/assets/js/catalog-model.mjs';
import {hasCatalogTypologyPrices} from '/private/tmp/sollahms-referencias-documentales-131-20261117/assets/js/catalog-typology-prices.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const projects=JSON.parse(read('./baseline/data/proyectos.json'));
const facets=JSON.parse(read('./baseline/data/catalog-facets.json')).projects;
const eligible=projects.map(project=>({...project,_facets:facets[project.slug]})).filter(hasCatalogTypologyPrices);
const cases=[];
for(const project of eligible){
  const types=project._facets.propertyTypes;
  const queries=types.map(propertyType=>({kind:'typed-property',query:{propertyType,minPriceInput:'1'}}));
  for(const type of types)queries.push({kind:'property-text',query:{search:type==='local'?'Local':'Departamento',minPriceInput:'1'}});
  for(const {kind,query} of queries){
    const oldState={...originalDefaults(),...query},newState={...defaults(),...query};
    const baselineRows=original([project],oldState),baselineCount=baselineRows.length;
    const candidateRows=candidate([project],newState);
    const baselineOffer=baselineRows.length?originalOffer(baselineRows[0],oldState):null;
    const offer=candidateRows.length?candidateOffer(candidateRows[0],newState):null;
    cases.push({kind,project:project.slug,propertyTypes:types,universalContext:types.length===1,
      query,baselineCount,candidateCount:candidateRows.length,baselineOffer,
      candidateOffer:offer?{value:offer.value,typology:offer.typology}:null,
      changedDisplayedPrice:baselineOffer&&offer?baselineOffer.value!==offer.value:false,
      difference:baselineCount===candidateRows.length?'same':candidateRows.length>baselineCount?'added':'lost',
      candidateWitnesses:candidateRows.flatMap(row=>row._publishedPriceMatch?.references??[])
        .map(reference=>({id:reference.id,label:reference.label,priceUF:reference.attributes.priceUF,
          propertyType:reference.attributes.propertyType,universalProjectContext:reference.universalProjectContext??null}))});
  }
}
const result={date:'2026-11-17',scope:'Delta QA of20 eligible projects:24 typed-property/minPrice1 queries plus24 property-text/minPrice1 queries, including both labels of4mixed projects. Not a data audit or global certification.',
  baselineCommit:'165f918aba402a0eb3313c85e144af2b4a7e8651',baselineCodeUnedited:true,
  scriptSHA256:createHash('sha256').update(read('./run-comparison.mjs')).digest('hex'),
  projects:eligible.length,queries:cases.length,universalQueries:cases.filter(row=>row.kind==='typed-property'&&row.universalContext).length,
  typedPropertyQueries:cases.filter(row=>row.kind==='typed-property').length,propertyTextQueries:cases.filter(row=>row.kind==='property-text').length,
  changedDisplayedPrices:cases.filter(row=>row.changedDisplayedPrice).length,
  counts:{same:cases.filter(row=>row.difference==='same').length,added:cases.filter(row=>row.difference==='added').length,lost:cases.filter(row=>row.difference==='lost').length},cases};
writeFileSync(new URL('./comparison-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({projects:result.projects,queries:result.queries,universalQueries:result.universalQueries,typedPropertyQueries:result.typedPropertyQueries,propertyTextQueries:result.propertyTextQueries,counts:result.counts,changedDisplayedPrices:result.changedDisplayedPrices,differences:cases.filter(row=>row.difference!=='same'||row.changedDisplayedPrice)},null,2));
