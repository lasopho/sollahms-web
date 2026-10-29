import concurrent.futures,hashlib,json,urllib.request,urllib.error
from pathlib import Path
R=Path(__file__).resolve().parents[1];D=R/'docs/featured-cards-20261029';manifest={x['file']:x for x in json.load(open(D/'deployment-files.json'))}
paths=['index.html','inn-puerto-chico.html','plaza-las-condes.html','data/proyectos.json','data/catalog-facets.json','proyectos.html','assets/js/scroll-presence.js','assets/css/sollahms-theme.css','assets/js/image-parallax.js','assets/css/image-parallax.css','assets/propiedades/inn-puerto-chico-principal.webp','assets/propiedades/brochures-20261025/plaza-las-condes-01.webp','api/uf','patio-brasil.html','viewport-review.html']
def fetch(p):
 try:
  with urllib.request.urlopen('https://sollahms.cl/'+p,timeout=30) as r:status=r.status;data=r.read()
 except urllib.error.HTTPError as e:status=e.code;data=e.read()
 expected=410 if p=='patio-brasil.html' else 404 if p=='viewport-review.html' else 200
 assert status==expected,(p,status)
 result={'path':p,'status':status}
 item=manifest.get('release/static/'+p)
 if item and 'data' in item:assert data==item['data'].encode(),p;result['exactArtifactBytes']=True
 if p=='api/uf':
  uf=json.loads(data);result['uf']=uf
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:results=list(ex.map(fetch,paths))
(D/'public-checks.json').write_text(json.dumps({'deployment':'dpl_BT3YKrnog5mFZXdmJd8QNSBhcir8','checks':results},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':len(results),'uf':next(x['uf'] for x in results if x['path']=='api/uf')},ensure_ascii=False))
