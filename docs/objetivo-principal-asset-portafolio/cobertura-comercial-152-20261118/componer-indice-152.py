#!/usr/bin/env python3
"""Thin documentary composition of existing views; never regenerate their matrices."""
import argparse,collections,hashlib,json
from pathlib import Path

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--docs',type=Path,required=True);ap.add_argument('--artifacts',type=Path,required=True);a=ap.parse_args();d=a.docs;t=a.artifacts
 vpath=d/'aceptacion-comercial-131-20261118/VISTA-COMERCIAL-POR-PROYECTO.json';v=json.loads(vpath.read_text());x=json.loads((t/'COBERTURA-21.json').read_text());comb=json.loads((t/'ANALISIS-COMBINACIONES-152.json').read_text());fields=list(v['summary']['coverageStatesByField']);projects={};count={f:collections.Counter() for f in fields};rescued={('edificio-baum','precio'):'precio',('edificio-santo','precio'):'precio',('inn-puerto-chico','util'):'D_B_util'}
 def add(slug,p,source,group):
  item={'name':p['name'],'developer':p['developer'],'group':group,'view':{'source':source,'pointer':'/projectsBySlug/'+slug},'fields':{},'unknownFieldsInSourceView':[],'supportedValueInOtherPublishedScope':[]}
  for f in fields:
   fact=p['fields'][f];state=fact['documentaryCoverageState'];count[f][state]+=1
   item['fields'][f]={'stateAsIndexed':state,'detail':{'source':source,'pointer':'/projectsBySlug/'+slug+'/fields/'+f},'limitationReasonCodes':fact['limitationReasonCodes']}
   if state=='desconocido':item['unknownFieldsInSourceView'].append(f)
   if (slug,f) in rescued:
    axis=rescued[slug,f];item['supportedValueInOtherPublishedScope'].append({'field':f,'axis':axis,'detail':{'source':'combinations131','pointer':'/projectsBySlug/'+slug+'/layers/published875/combinations/'+axis},'originalDocumentaryStateNotChanged':True,'notOwnerConfirmationOrCrossReferenceJoin':True})
  if group=='expansion21':
   item['numericExactBedroomsUnknown']=p['fields']['dormitorios'].get('numericExactBedroomsUnknown',False);item['sameReferenceTypeUnknown']=p['fields']['tipo_propiedad'].get('exactReferencePropertyType') is None
  projects[slug]=item
 for slug,p in v['projectsBySlug'].items():add(slug,p,'view131','original131')
 assert not(set(projects)&set(x['projectsBySlug']))
 for slug,p in x['projectsBySlug'].items():add(slug,p,'view21','expansion21')
 assert len(projects)==152 and len(fields)==11
 def pin(path,relative):b=path.read_bytes();return {'path':relative,'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'newPrimaryEvidence':False}
 summary={'projects':152,'fieldCells':152*11,'coverageStatesByField':{f:dict(c) for f,c in count.items()},'allFieldCells':dict(sum(count.values(),collections.Counter())),'projectsWithAtLeastOneUnknownInSourceView':sum(bool(p['unknownFieldsInSourceView']) for p in projects.values()),'explicitKnownValueInOtherScopeCells':len(rescued),'unknownCountsAreNotOwnerRequestsOrHistoricalClosures':True,'numericBedroomsUnknownAdditional21':x['summary']['literalStudioExactReferencesWithoutNumericZero'],'amenityDescriptorsAdditional21Projects':x['summary']['filterEligibleAmenityDescriptorProjects'],'historical313Closed':0,'newOwnerQuestions':0}
 result={'schemaVersion':1,'date':'2026-11-18','kind':'INDICE_COMPUESTO_152_SIN_RECONSTRUIR_MATRICES131','productionSHA':comb['productionSHA'],'deploymentId':'dpl_FkyZZgpki5HSpKMRJQFgJE451d3G','sources':{'view131':pin(vpath,'aceptacion-comercial-131-20261118/VISTA-COMERCIAL-POR-PROYECTO.json'),'view21':pin(t/'COBERTURA-21.json','cobertura-comercial-152-20261118/COBERTURA-21.json'),'combinations131':pin(d/'aceptacion-comercial-131-20261118/ANALISIS-COMBINACIONES.json','aceptacion-comercial-131-20261118/ANALISIS-COMBINACIONES.json')},'meaning':{'stateAsIndexed':'Original documented state in its own source/scope; no historical states overwritten.','unknown':'No reusable value in that indexed scope; not proof it never exists elsewhere. Three already-published other-scope values are explicitly linked.','partial':'Source value in limited scope; not a request for complete unit inventory or proof of all filter combinations.','layers':'Published, preparedLeben and local24a are separate; no union or borrowed facts.','noStockOrCurrentValidity':True,'newPrimaryFacts':0,'newTests':0,'matrices131Rewritten':False,'original1993PointersPreserved':True},'summary':summary,'projectsBySlug':projects}
 (t/'INDICE-COBERTURA-152.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
