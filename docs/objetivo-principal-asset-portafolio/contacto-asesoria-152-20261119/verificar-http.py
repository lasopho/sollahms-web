from pathlib import Path
import urllib.request,urllib.error,json,hashlib,datetime
r=Path('/private/tmp/sollahms-contacto-152-20261119');out=r/'release/stage/.vercel/output/static';projects=json.loads((out/'data/catalog-expansion-iris-20261118.json').read_text())['projects'];paths=[p['detailUrl'] for p in projects]+['/contacto.html','/agenda-asesoria.html','/assets/js/advisory.mjs','/assets/js/advisory-project-context.mjs','/proyectos.html','/data/proyectos.json','/data/catalog-expansion-iris-20261118.json','/data/catalog-expansion-locations-20261119.json','/assets/js/catalog.mjs','/assets/js/catalog-map.mjs','/assets/js/site-measurement.mjs','/assets/css/site-measurement.css','/privacidad.html'];rows=[]
for path in paths:
 url='https://sollahms.cl'+path
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'SollahmsReleaseVerification/20261119'}),timeout=30) as res:
  body=res.read();actual=hashlib.sha256(body).hexdigest();expected=hashlib.sha256((out/path.lstrip('/')).read_bytes()).hexdigest();assert res.status==200 and res.geturl()==url and actual==expected,path
  rows.append({'path':path,'status':res.status,'bytes':len(body),'sha256':actual,'matchesPackage':True,'contentType':res.headers.get('Content-Type'),'cacheControl':res.headers.get('Cache-Control')})
try:
 with urllib.request.urlopen('https://sollahms.cl/data/advisory-projects.json',timeout=20) as res:raise AssertionError('server whitelist should not be published')
except urllib.error.HTTPError as e:assert e.code==404
receipt={'verifiedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceCommit':'db45afc2518b354bb14b108172d75d3aacb8d643','deploymentId':'dpl_E4TaPn7ZkLDZ7u93FSMvd9oHsxAp','verdict':'APROBADO','resources':len(rows),'matched':len(rows),'rows':rows,'serverWhitelistStaticHTTPStatus':404,'formsSubmitted':0,'functionsCalled':0,'credentialsUsed':False}
(r/'release/PUBLICACION-HTTP.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'resourcesMatched':len(rows),'serverWhitelistStaticHTTPStatus':404}))
