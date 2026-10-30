import copy,json,sys
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1]; B=Path(sys.argv[1]) if len(sys.argv)>1 else R.parent/'leon-current-baseline'
sys.path.insert(0,str(R/'scripts'))
from leon_commercial import apply_leon,sync_facets,guard_import,OWNER_FIELDS,price
from purchase_stage import project_stages
p=json.loads((R/'data/proyectos.json').read_text());old=json.loads((B/'data/proyectos.json').read_text())
f=json.loads((R/'data/catalog-facets.json').read_text());fo=json.loads((B/'data/catalog-facets.json').read_text())
checks=0
def ck(value,label):
 global checks
 assert value,label
 checks+=1
ck([x for x in p if x['inmobiliaria']!='León']==[x for x in old if x['inmobiliaria']!='León'],'other 126 records identical')
ck((R/'vercel.json').read_bytes()==(B/'vercel.json').read_bytes(),'automatic deploy settings unchanged')
for file in ['index.html','guia-hipotecaria.html','cuando-comprar-propiedad.html','assets/js/project-request.mjs','assets/js/project-brochure.mjs','assets/js/mortgage-guide-engine.mjs','data/project-features.json','data/amenities.json','data/leon-plan-surfaces.json','data/brochures-leon.json']:
 ck((R/file).read_bytes()==(B/file).read_bytes(),file+' unchanged')
media=plans=0
for x in p:
 slug=x['slug']
 if x['inmobiliaria']!='León':
  ck(f['projects'][slug]==fo['projects'][slug],slug+' facets unchanged');continue
 before=BeautifulSoup((B/(slug+'.html')).read_text(),'html.parser');raw=(R/(slug+'.html')).read_text();after=BeautifulSoup(raw,'html.parser')
 for selector in ['img','iframe','form','style','link[rel=stylesheet]','[data-amenity-group]','#planos','#galeria']:
  ck([str(e) for e in before.select(selector)]==[str(e) for e in after.select(selector)],slug+' '+selector+' preserved')
 media+=len(after.select('img'));plans+=len(after.select('#planos img'))
 ck(apply_leon(raw,x)==raw,slug+' idempotent fiche generation')
 ck(after.select_one('.ci-market strong').text==price(x['precioDesdeUF']),slug+' header price')
 ck('Desde: consultar precio' not in after.get_text(' ',strip=True),slug+' no stale project price')
 for key in ['features','typologyLabels','variants','assetTypes','propertyTypes']:
  ck(f['projects'][slug][key]==fo['projects'][slug][key],slug+' '+key+' preserved')
 stage=project_stages()[slug];ck(stage['eligible']==f['projects'][slug]['purchaseStage']['eligible'],slug+' regenerated guide eligibility')
 for key in OWNER_FIELDS:
  if key not in x:continue
  incoming={'updates':{key:None},'verifiedFields':[]}
  try: guard_import(x,incoming)
  except ValueError: checks+=1
  else:raise AssertionError('Overwrite accepted: '+slug+'/'+key)
 incoming={'updates':{},'verifiedFields':[]};guard_import(x,incoming)
 for key in OWNER_FIELDS:ck(incoming['updates'].get(key)==x.get(key),slug+' retained '+key)
ck(sync_facets(copy.deepcopy(f),p)==f,'idempotent facet projection')
print(json.dumps({'checks':checks,'otherProjectsPreserved':126,'imagesPreserved':media,'planImagesPreserved':plans,'regeneration':'idempotent','overwriteGuard':'all owner fields blocked'}))
