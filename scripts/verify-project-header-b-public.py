#!/usr/bin/env python3
"""Verify the public release byte-for-byte; read-only, no real submissions."""
from pathlib import Path
import argparse,concurrent.futures,hashlib,json,urllib.request,urllib.error
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--output',required=True);ap.add_argument('--deployment',required=True);args=ap.parse_args();OUT=Path(args.output)
m=json.loads((ROOT/'docs/project-header-b-20261026/verification.json').read_text());paths={'/'+p.name:200 for p in OUT.glob('*.html')}
for p in m['projects']: paths[p['image']]=200
paths.update({p:200 for p in ['/','/data/proyectos.json','/data/hipotecario.json','/assets/css/project-header-b.css','/assets/css/sollahms-theme.css','/assets/branding/og-sollahms-square-v2.jpg','/assets/js/project-detail.js','/sitemap.xml','/robots.txt','/api/uf']})
paths.update({p:404 for p in ['/data/fichas-proyectos.json','/docs/project-header-b-20261026/verification.json']})
def verify(pair):
 path,expected=pair
 try:
  try:r=urllib.request.urlopen('https://sollahms.cl'+path,timeout=45)
  except urllib.error.HTTPError as e:r=e
  body=r.read();status=r.code;result={'path':path,'status':status,'expected':expected,'ok':status==expected}
  if expected==200 and path!='/api/uf':
   file=OUT/('index.html' if path=='/' else path[1:]);result['matchesCandidate']=body==file.read_bytes();result['sha256']=hashlib.sha256(body).hexdigest();result['ok'] &= result['matchesCandidate']
  if path=='/api/uf':result['uf']=json.loads(body)
  return result
 except Exception as e:return {'path':path,'ok':False,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(verify,paths.items()))
report={'domain':'https://sollahms.cl','deployment':args.deployment,'reviewedSource':'e0172a21db1ce9622fd1a4a90a62040d4acb6431','checks':len(results),'passed':sum(x['ok'] for x in results),'results':results}
(ROOT/'docs/project-header-b-20261026/public-http.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='results'}));print(json.dumps([x for x in results if not x['ok'] or x['path']=='/api/uf'],ensure_ascii=False))
assert all(x['ok'] for x in results),'Release failed public validation; inspect before claiming success'
