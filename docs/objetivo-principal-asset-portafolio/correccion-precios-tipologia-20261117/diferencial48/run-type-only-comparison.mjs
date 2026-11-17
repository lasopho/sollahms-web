import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {advancedFilterAndSort as original,defaults as originalDefaults} from './baseline/assets/js/catalog-filter-engine.mjs';
import {advancedFilterAndSort as candidate,defaults} from '/private/tmp/sollahms-referencias-documentales-131-20261117/assets/js/catalog-filter-engine.mjs';
import {hasCatalogTypologyPrices} from '/private/tmp/sollahms-referencias-documentales-131-20261117/assets/js/catalog-typology-prices.mjs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const projects=JSON.parse(read('./baseline/data/proyectos.json'));
const facets=JSON.parse(read('./baseline/data/catalog-facets.json')).projects;
const eligible=projects.map(project=>({...project,_facets:facets[project.slug]})).filter(hasCatalogTypologyPrices);
const cases=[];
for(const project of eligible){
  const types=project._facets.propertyTypes;
  for(const propertyType of types){
    const query={propertyType,minPriceInput:'1'};
    const baselineCount=original([project],{...originalDefaults(),...query}).length;
    const candidateRows=candidate([project],{...defaults(),...query});
    cases.push({project:project.slug,propertyTypes:types,universalContext:types.length===1,
      query,baselineCount,candidateCount:candidateRows.length,
      difference:baselineCount===candidateRows.length?'same':candidateRows.length>baselineCount?'added':'lost',
      candidateWitnesses:candidateRows.flatMap(row=>row._publishedPriceMatch?.references??[])
        .map(reference=>({id:reference.id,label:reference.label,priceUF:reference.attributes.priceUF,
          propertyType:reference.attributes.propertyType,universalProjectContext:reference.universalProjectContext??null}))});
  }
}
const result={date:'2026-11-17',scope:'Delta QA of20 eligible projects; universal published property type plus minPrice1, and explicit types of mixed projects. Not a data audit or global certification.',
  baselineCommit:'165f918aba402a0eb3313c85e144af2b4a7e8651',baselineCodeUnedited:true,
  scriptSHA256:createHash('sha256').update(read('./run-comparison.mjs')).digest('hex'),
  projects:eligible.length,queries:cases.length,universalQueries:cases.filter(row=>row.universalContext).length,
  counts:{same:cases.filter(row=>row.difference==='same').length,added:cases.filter(row=>row.difference==='added').length,lost:cases.filter(row=>row.difference==='lost').length},cases};
writeFileSync(new URL('./comparison-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({projects:result.projects,queries:result.queries,universalQueries:result.universalQueries,counts:result.counts,differences:cases.filter(row=>row.difference!=='same')},null,2));
