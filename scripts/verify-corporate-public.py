"""Read-only public release verification. Never submits a contact request."""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
import hashlib, json, urllib.request, urllib.error

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT/'docs/seo-corporate-20261029'
manifest = json.loads((DOC/'deployment-files.json').read_text())
hashes = json.loads(next(x['data'] for x in manifest if x['file']=='release-hashes.json'))
rows = json.loads(next(x['data'] for x in manifest if x['file']=='release/static/data/proyectos.json'))
corporate = ['index.html','contacto.html','agenda-asesoria.html','guia-hipotecaria.html',
             'comparador-hipotecario.html','cuando-comprar-propiedad.html','trabaja-con-nosotros.html','privacidad.html']
assets = ['assets/css/sollahms-theme.css','assets/js/scroll-presence.js','assets/js/image-parallax.js',
          'assets/css/image-parallax.css','assets/js/project-request.mjs','assets/js/commercial-fields.mjs']
files = corporate + [r['slug']+'.html' for r in rows] + ['proyectos.html','data/proyectos.json','sitemap.xml','robots.txt']
files += [x for x in assets if 'static/'+x in hashes]

def fetch(path, expected=200, sha=None):
    url = 'https://sollahms.cl/'+('' if path=='index.html' else path)
    req = urllib.request.Request(url,headers={'User-Agent':'Sollahms-authorized-release-verification/1.0'})
    try:
        with urllib.request.urlopen(req,timeout=40) as response:
            status=response.status; data=response.read(); headers=response.headers; final=response.url
    except urllib.error.HTTPError as e:
        status=e.code;data=e.read();headers=e.headers;final=e.url
    except Exception as e:
        return {'path':path,'passed':False,'error':str(e)}
    result={'path':path,'status':status,'sha256':hashlib.sha256(data).hexdigest(),'finalUrl':final,
            'xRobotsTag':headers.get('X-Robots-Tag'),'passed':status==expected}
    if sha:
        result['expectedSha256']=sha;result['exactArtifact']=result['sha256']==sha
        result['passed'] &= result['exactArtifact']
    if path in corporate:result['passed'] &= 'noindex' not in headers.get('X-Robots-Tag','').lower()
    if path=='api/uf':
        result['response']=json.loads(data)
        result['passed'] &= result['response']['uf']['date']=='2026-10-29'
    return result

with ThreadPoolExecutor(max_workers=8) as pool:
    futures=[pool.submit(fetch,p,200,hashes['static/'+p]) for p in files]
    futures += [pool.submit(fetch,'api/uf'),pool.submit(fetch,'patio-brasil.html',410),
                pool.submit(fetch,'patio-brasil',410),pool.submit(fetch,'seo-release-check-not-found',404)]
    futures += [pool.submit(fetch,p,405) for p in ['api/contact','api/advisory','api/collaboration']]
    results=[]
    for task in as_completed(futures):
        result=task.result();results.append(result)
        if not result['passed']:print(json.dumps(result,ensure_ascii=False),flush=True)
        elif len(results)%40==0:print(f'{len(results)} HTTP responses checked',flush=True)
report={'checkedAt':datetime.now(timezone.utc).isoformat(),'domain':'https://sollahms.cl/',
        'deployment':'dpl_Atu9RTqZT7ShuPDpmfuK4yGqQxN8','code':'bd59851b736892f3aaa01989b6b3c4c570a0a00d',
        'passed':sum(x['passed'] for x in results),'failed':sum(not x['passed'] for x in results),
        'projectPages':len(rows),'noRealSubmissions':True,'results':sorted(results,key=lambda x:x['path'])}
(DOC/'production-http-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='results'},ensure_ascii=False))
assert report['failed']==0
