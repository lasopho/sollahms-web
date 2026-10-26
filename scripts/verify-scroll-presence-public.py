#!/usr/bin/env python3
"""Read-only public verification of the scroll release against its exact artifact."""
from pathlib import Path
import argparse,concurrent.futures,hashlib,json,urllib.request,urllib.error
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--output',required=True);args=ap.parse_args();OUT=Path(args.output)
paths={'/'+p.name:200 for p in OUT.glob('*.html')}
paths.update({p:200 for p in ['/','/assets/js/scroll-presence.js','/assets/css/sollahms-theme.css','/assets/css/project-header-b.css','/data/proyectos.json','/data/hipotecario.json','/sitemap.xml','/api/uf']})
paths['/docs/scroll-presence-20261026/package-verification.json']=404
def verify(pair):
    path,expected=pair
    try:
        try: response=urllib.request.urlopen('https://sollahms.cl'+path,timeout=35)
        except urllib.error.HTTPError as error: response=error
        body=response.read();result={'path':path,'status':response.code,'expected':expected,'ok':response.code==expected}
        if expected==200 and path!='/api/uf':
            local=OUT/('index.html' if path=='/' else path[1:])
            result['matchesArtifact']=body==local.read_bytes()
            result['sha256']=hashlib.sha256(body).hexdigest()
            result['ok'] &= result['matchesArtifact']
        if path=='/api/uf': result['uf']=json.loads(body)
        return result
    except Exception as error: return {'path':path,'ok':False,'error':str(error)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    results=list(pool.map(verify,paths.items()))
report={'domain':'https://sollahms.cl','deployment':'dpl_5zih4HpL2dAHqvXimqdSpg17zyuf',
        'codeCommit':'99a49a6797882ab8fdc6527db857d25e2aebf4df',
        'checks':len(results),'passed':sum(x['ok'] for x in results),'results':results}
(ROOT/'docs/scroll-presence-20261026/public-http.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='results'}))
print(json.dumps([x for x in results if not x['ok'] or x['path']=='/api/uf'],ensure_ascii=False))
assert all(x['ok'] for x in results)
