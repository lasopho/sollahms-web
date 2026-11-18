#!/usr/bin/env python3
"""Compose disjoint 131+21 documentary witnesses; never import or run application code."""
import argparse,collections,datetime,hashlib,json
from pathlib import Path

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--docs',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);args=ap.parse_args();d=args.docs
 oldpath=d/'aceptacion-comercial-131-20261118/ANALISIS-COMBINACIONES.json';rawpath=d/'ampliacion-iris-chile-20261118/candidato-21-gpr/PROYECCION-PUBLICA-21.json'
 old=json.loads(oldpath.read_text());raw=json.loads(rawpath.read_text());axes=old['axisDefinitions'];additions={};counts=collections.Counter()
 def ptr(i,suffix):return {'source':'expansion21','pointer':f'/projects/{i}'+suffix}
 for i,p in enumerate(raw['projects']):
  owner=bool(p['ownerReferences']);id=p['source']['projectId'];refs=[]
  def add(rid,attrs,suffix,policy=None):refs.append({'id':rid,'attributes':attrs,'source':ptr(i,suffix),'pricePolicy':policy})
  if p['externalIris']['projectFromPriceUF'] is not None:add('iris-from:'+id,{'priceUF':None if owner else p['externalIris']['projectFromPriceUF'],'propertyType':p['identity']['propertyType']},'/externalIris','masked-by-owner' if owner else 'external-project-from')
  if p['identity']['propertyType']:add('iris-type:'+id,{'propertyType':p['identity']['propertyType']},'/identity/propertyType')
  if p['headerBedroomProfile']['bedroomsExact'] is not None:add('iris-header:'+id,{'bedrooms':p['headerBedroomProfile']['bedroomsExact']},'/headerBedroomProfile')
  for ri,r in enumerate(p['ownerReferences']):add('owner-category:'+id+':'+str(r['categoryKey']),{'priceUF':r['priceUF'],'bedrooms':r['bedrooms']},f'/ownerReferences/{ri}','owner-existing-typology-no-model')
  for ri,r in enumerate(p['exactUnitReferences']):
   a=dict(r['attributes']);a['priceUF']=None if owner else a['priceUF'];add(r['id'],a,f'/exactUnitReferences/{ri}','masked-by-owner' if owner else 'external-exact-unit')
  combinations={}
  for axis,keys in axes.items():
   witnesses=[r for r in refs if all(r['attributes'].get(k) is not None for k in keys)]
   if witnesses:
    counts[axis]+=1;combinations[axis]={'status':'TESTIGO_ESTATICO_MISMA_REFERENCIA_NO_STOCK','witnessCount':len(witnesses),'witnesses':[{'id':w['id'],'attributes':{k:w['attributes'][k] for k in keys},'source':w['source'],'pricePolicy':w['pricePolicy']} for w in witnesses]}
  additions[p['slug']]={'name':p['identity']['name'],'developer':p['identity']['developer'],'combinations':combinations,'unsupportedAxes':[a for a in axes if a not in combinations],'preparedLeben':False,'documentary24a':False}
 assert len(additions)==21 and not(set(additions)&set(old['projectsBySlug']))
 base=old['summaries']['published875']['supportedProjectCountsByAxis'];total={a:base[a]+counts[a] for a in axes}
 def source(path):b=path.read_bytes();return {'path':str(path.relative_to(d)),'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'newEvidence':False}
 result={'schemaVersion':1,'date':'2026-11-18','kind':'COMPOSICION_ESTATICA_DE_TESTIGOS_131_MAS_21_DISJUNTOS_NO_MOTOR','productionSHA':'d3fb474f08b81a965d2e0eac927adf88671968c0','universe':152,'axisDefinitions':axes,'sources':{'original131':source(oldpath),'expansion21':source(rawpath)},'method':{'original131ReusedWithoutRederivation':True,'original131Layer':'published875','original131Pointer':'/projectsBySlug','expansionContract':'assets/js/catalog-expansion.mjs:123-135 (normalizedReferences), D3','onlyDisjointProjectCountsAdded':True,'preparedOrLocalLayersNeverAdded':True,'appModulesExecuted':0,'testsExecuted':0,'newFacts':0,'ownerPriceNeverJoinedWithIrisUnit':True,'summaryTypeNeverJoinedToUnit':True,'unknownMetricsNotCoerced':True,'scope':'Existence of a same-reference tuple in the admitted static source; not executed searches, all numeric ranges, inventory or current validity.'},'summaries':{'original131':base,'publishedExpansion21':{a:counts[a] for a in axes},'publishedD3_152':total,'preparedLebenUnchangedAndNotAdded':old['summaries']['preparedLeben'],'local24aUnpublishedAndNotAdded':old['summaries']['documentaryLocal24a']},'original131SourcePointers':{s:{'source':'original131','pointer':'/projectsBySlug/'+s+'/layers/published875'} for s in old['projectsBySlug']},'expansion21BySlug':additions,'limits':['Region, commune, delivery and state are project facts within their source scope; amenities additionally require compatible reference type/use.','A tuple does not establish every additional filter or joint range. Use the separately pinned existing acceptance certificates for engine behavior.','Missing active attributes fail closed; inactive unknown attributes do not remove otherwise supported results.','Prices and surface profiles in different references cannot be joined.','Iris prices remain external, and original local24a is not published.']}
 args.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(total,ensure_ascii=False))
if __name__=='__main__':main()
