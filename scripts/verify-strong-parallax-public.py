"""Read-only public verification of the exact parallax release and preserved controls."""
from pathlib import Path
import concurrent.futures,hashlib,json,urllib.request,urllib.error
root=Path(__file__).resolve().parents[1];docs=root/'docs/strong-parallax-hover-20261026'
expected=json.loads((docs/'candidate-hashes.json').read_text())
projects=json.loads((root/'data/proyectos.json').read_text())
paths=['index.html']+[p['detalleUrl'].lstrip('/') for p in projects]+[
 'assets/css/image-parallax.css','assets/js/image-parallax.js','assets/js/catalog.mjs',
 'assets/css/sollahms-theme.css','assets/js/scroll-presence.js','assets/css/project-header-b.css',
 'proyectos.html','contacto.html','agenda-asesoria.html','trabaja-con-nosotros.html',
 'data/proyectos.json','data/project-locations.json','assets/js/catalog-map.mjs',
 'assets/branding/og-sollahms-square-v3.png','assets/branding/sollahms-logo.svg',
 'api/uf','__parallax-qa.html','release-hashes.json']
def check(path):
 url='https://sollahms.cl/'+('' if path=='index.html' else path)
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Sollahms-Release-Verification/1.0'}),timeout=30) as r:
   data=r.read();status=r.status
 except urllib.error.HTTPError as e:data=e.read();status=e.code
 except Exception as e:return {'path':path,'ok':False,'error':str(e)}
 row={'path':path,'status':status}
 if path in ['__parallax-qa.html','release-hashes.json']:row['ok']=status==404
 elif path=='api/uf':
  try:row['uf']=json.loads(data);row['ok']=status==200 and bool(row['uf'])
  except Exception:row['ok']=False
 else:
  row['sha256']=hashlib.sha256(data).hexdigest();row['ok']=status==200 and row['sha256']==expected['static/'+path]
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(check,paths))
(docs/'public-checks.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checks':len(results),'passed':sum(r['ok'] for r in results),'failed':[r for r in results if not r['ok']],'uf':next(r for r in results if r['path']=='api/uf')},ensure_ascii=False,indent=2))
assert all(r['ok'] for r in results)
