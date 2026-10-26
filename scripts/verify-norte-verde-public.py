#!/usr/bin/env python3
"""Read-only public release verification. Never submits forms or books appointments."""
from pathlib import Path
import concurrent.futures, hashlib, json, urllib.request, urllib.error

ROOT=Path(__file__).resolve().parents[1]
OUT=Path('/workspace/scratch/2bf2025ce132/nv-deployment/.vercel/output/static')
data=json.loads((ROOT/'data/proyectos.json').read_text())
nv=[p for p in data if p['inmobiliaria']=='Norte Verde']
paths={p['detalleUrl']:200 for p in nv}
paths.update({p['imagenPrincipal']:200 for p in nv})
paths.update({p:200 for p in ['/', '/proyectos.html','/data/proyectos.json','/sitemap.xml','/robots.txt',
 '/assets/js/project-finance.mjs','/assets/js/hipotecario.mjs','/assets/js/purchase-capacity-ui.mjs',
 '/assets/css/sollahms-theme.css','/assets/branding/og-sollahms-square-v2.jpg','/api/uf']})
paths.update({p:404 for p in ['/atelier-prat-oficinas.html','/corrientes-oficinas.html',
 '/atelier-prat-oficinas','/corrientes-oficinas','/docs/norte-verde-18-20261026/baseline-norte-verde.json',
 '/data/fichas-proyectos.json','/visual-qa.html']})
def check(pair):
 path,expected=pair
 try:
  response=urllib.request.urlopen('https://sollahms.cl'+path,timeout=35)
 except urllib.error.HTTPError as e: response=e
 body=response.read();status=response.code
 result={'path':path,'status':status,'expected':expected,'ok':status==expected}
 if expected==200 and path!='/api/uf':
  local=OUT/('index.html' if path=='/' else path[1:])
  result['sha256']=hashlib.sha256(body).hexdigest()
  result['matchesCandidate']=body==local.read_bytes();result['ok'] &= result['matchesCandidate']
 if path=='/api/uf':result['uf']=json.loads(body)
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
 results=list(executor.map(check,paths.items()))
report={'deployment':'dpl_CrKWwLe6pvGgR1VwYt9LQA9Usfjw','codeCommit':'0932c4d23d333e8af87fb7b7e0e56f7620802961',
 'domain':'https://sollahms.cl','checks':len(results),'passed':sum(x['ok'] for x in results),'results':results}
(ROOT/'docs/norte-verde-18-20261026/public-http.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='results'}))
print(json.dumps([x for x in results if not x['ok'] or x['path']=='/api/uf'],ensure_ascii=False))
assert all(x['ok'] for x in results), 'Public release differs from reviewed candidate'
