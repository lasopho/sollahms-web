import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {matchProjectFilters} from '/private/tmp/sollahms-filtros-comerciales-fase10-20261117/assets/js/commercial-filter-engine.mjs';

const datasetPath='/private/tmp/sollahms-iris-normalized-layer.json';
const resultPath='/private/tmp/sollahms-iris-normalized-validation.json';
const registryPath='/private/tmp/sollahms-auditoria-leben-20261116/docs/objetivo-principal-asset-portafolio/REGISTRO-NUEVA-EVIDENCIA-IRIS.json';
const sourcePaths=[
 '/private/tmp/sollahms-filtros-comerciales-fase10-20261117/assets/js/commercial-filter-engine.mjs',
 '/private/tmp/sollahms-filtros-comerciales-fase10-20261117/assets/js/commercial-filter-data.mjs',
];
const hash=body=>crypto.createHash('sha256').update(body).digest('hex');
const datasetBytes=await fs.readFile(datasetPath),layer=JSON.parse(datasetBytes);
const registryBytes=await fs.readFile(registryPath),registry=JSON.parse(registryBytes);
const scriptBytes=await fs.readFile(new URL(import.meta.url));
const sourceBefore=Object.fromEntries(await Promise.all(sourcePaths.map(async path=>[path,hash(await fs.readFile(path))])));
const beforeState=JSON.stringify(layer);
const refs=layer.records.flatMap(record=>record.references);
const failures=[],cases=[],positiveReferenceIds=[];
const check=(condition,label,detail={})=>{cases.push({label,passed:!!condition,...detail});if(!condition)failures.push({label,...detail});};
check(layer.records.length===14&&refs.length===15,'14 records and 15 documentary references');
check(new Set(refs.map(r=>r.id)).size===15&&JSON.stringify(refs.map(r=>r.id).sort())===JSON.stringify(registry.references.map(r=>r.id).sort()),'all stable registry IDs retained');
check(hash(registryBytes)===layer.sourceRegistry.sha256,'registry hash unchanged');
check(refs.every(r=>r.notOffer===true&&r.commercialAdoptionAllowed===false&&r.attributes.priceUF===null&&r.stock===null),'no offers, commercial price or stock admitted');
check(refs.every(r=>r.attributes.usefulM2===null&&r.attributes.totalM2===null&&r.attributes.interiorM2===null),'useful/residential-total/canonical-interior remain unknown');
check(refs.every(r=>r.sourceDocumentDate===null&&r.sourceDate===null&&typeof r.observedAtUTC==='string'),'observation date distinct from unknown source date');
check(refs.filter(r=>r.externalPriceMetadata.listUF>0).length===15,'positive external prices exist only as metadata');
const byQuery={};
const run=(record,name,query,expected)=>{
 const result=matchProjectFilters(record,query);
 const ok=expected(result)&&result.issues.length===0;
 check(ok,name,{slug:record.slug,matchedReferenceIds:result.matchedReferenceIds,issues:result.issues});
 const tally=byQuery[name]??={cases:0,passed:0};tally.cases++;if(ok)tally.passed++;
 return result;
};
for(const record of layer.records){
 run(record,'unknown fields inactive preserve documentary result',{},r=>r.matches&&r.matchedReferenceIds.length===record.references.length);
 run(record,'active commercial price excludes metadata prices',{minPrice:0,maxPrice:1000000},r=>!r.matches&&r.matchedReferenceIds.length===0);
 run(record,'active useful range excludes unknown metric',{surfaceMetric:'util',minSurface:0,maxSurface:1000000},r=>!r.matches);
 run(record,'active total range excludes unknown residential total',{surfaceMetric:'total',minSurface:0,maxSurface:1000000},r=>!r.matches);
 run(record,'active canonical interior excludes literal Internos',{surfaceMetric:'interior',minSurface:0,maxSurface:1000000},r=>!r.matches);
 run(record,'unknown private garden is not a positive',{privateGarden:true},r=>!r.matches);
 run(record,'unknown private terrace is not a positive',{privateTerrace:true},r=>!r.matches);
 for(const reference of record.references){
  const a=reference.attributes;
  run(record,'explicit property type matches same reference',{propertyType:a.propertyType},r=>r.matches&&r.matchedReferenceIds.includes(reference.id));
  if(a.bedrooms!==null&&a.bathrooms!==null){
   const q={propertyType:a.propertyType,bedrooms:a.bedrooms,bathrooms:a.bathrooms};
   const db=run(record,'D and B match an exact source reference',q,r=>r.matches&&r.matchedReferenceIds.includes(reference.id)&&r.references.every(x=>x.attributes.bedrooms===a.bedrooms&&x.attributes.bathrooms===a.bathrooms));
   if(db.matches)positiveReferenceIds.push(reference.id);
   run(record,'D B and terrace share the same reference',{...q,surfaceMetric:'terraza',minSurface:a.terraceM2,maxSurface:a.terraceM2},r=>r.matches&&r.matchedReferenceIds.includes(reference.id)&&r.references.every(x=>x.attributes.terraceM2===a.terraceM2));
   run(record,'price cannot attach to D B reference',{...q,minPrice:0},r=>!r.matches);
   run(record,'external price is absent from searchable offering text',{text:String(reference.externalPriceMetadata.listUF)},r=>!r.matches);
  }
 }
}
const lotRecord=layer.records.find(r=>r.slug==='reserva-mayor-2');
const lot=lotRecord.references[0];
check(lot.attributes.lotTotalM2===1500&&lot.attributes.totalM2===null&&lot.attributes.landM2===null&&lot.attributes.bedrooms===null&&lot.attributes.bathrooms===null,'lot total kept separate; missing D B not zero');
run(lotRecord,'lot appears by its explicit type with D B inactive',{propertyType:'terreno'},r=>r.matches&&r.matchedReferenceIds.includes(lot.id));
run(lotRecord,'unknown lot bedrooms do not become zero',{bedrooms:0},r=>!r.matches);
run(lotRecord,'unknown lot bathrooms do not become one',{bathrooms:1},r=>!r.matches);
check(JSON.stringify(layer)===beforeState,'evaluator did not mutate dataset');
const sourceAfter=Object.fromEntries(await Promise.all(sourcePaths.map(async path=>[path,hash(await fs.readFile(path))])));
check(JSON.stringify(sourceAfter)===JSON.stringify(sourceBefore),'existing evaluator and adapter bytes unchanged');
check(hash(await fs.readFile(datasetPath))===hash(datasetBytes),'dataset file bytes unchanged by validation');
const report={
 schemaVersion:1,kind:'only new isolated Iris15 documentary dataset validation',executedAtUTC:new Date().toISOString(),
 passed:failures.length===0,cases:cases.length,passedCases:cases.filter(c=>c.passed).length,failures,
 dataset:{path:datasetPath,sha256:hash(datasetBytes),records:14,references:15},
 script:{path:new URL(import.meta.url).pathname,sha256:hash(scriptBytes)},
 registry:{path:registryPath,sha256:hash(registryBytes)},
 existingPureEvaluatorSources:sourceBefore,
 byQuery,exactDBReferenceCount:positiveReferenceIds.length,exactDBReferenceIds:positiveReferenceIds,
 issuesNonemptyCases:cases.filter(c=>Array.isArray(c.issues)&&c.issues.length>0).length,
 negativeResultsRequireEmptyIssues:true,
 canonicalContractUsed:{price:{query:['minPrice','maxPrice'],attribute:'priceUF'},useful:{selector:'util',attribute:'usefulM2'},total:{selector:'total',attribute:'totalM2'},interior:{selector:'interior',attribute:'interiorM2'},terrace:{selector:'terraza',attribute:'terraceM2'}},
 schemaLimits:{compatibleWith:'matchProjectFilters record contract only',notLebenCommercialFactoryInput:true,internalM2AndLotTotalM2ArePreservedDocumentaryMetricsNotEngineAliases:true},
 operations:{onlyNewDataset:true,applicationStarted:false,existingTestSuitesRun:false,repositoryTestsModified:false,applicationFilesModified:false,networkRequests:false,publicModeAdded:false,publishedOrOwnerPricesModified:false,PRorPrebuiltModified:false},
 publicConsumption:false,
};
await fs.writeFile(resultPath,JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({passed:report.passed,cases:report.cases,passedCases:report.passedCases,exactDBReferences:positiveReferenceIds.length,datasetSHA256:report.dataset.sha256,scriptSHA256:report.script.sha256,resultPath})+'\n');
if(failures.length)process.exitCode=1;
