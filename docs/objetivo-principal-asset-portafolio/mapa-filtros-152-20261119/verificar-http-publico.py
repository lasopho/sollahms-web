from pathlib import Path
import urllib.request,json,hashlib,datetime
r=Path('/private/tmp/sollahms-mapa-21-20261119');out=r/'release/stage/.vercel/output/static';rows=[]
paths=['/proyectos.html','/assets/js/catalog.mjs','/assets/js/catalog-map.mjs','/assets/js/catalog-expansion-locations.mjs','/data/catalog-expansion-locations-20261119.json','/data/catalog-expansion-iris-20261118.json','/data/proyectos.json','/data/project-locations.json','/data/project-metro.json','/data/metro-network.json','/condominio-reserva-santa-clara.html','/compania-1735.html']
for path in paths:
 u='https://sollahms.cl'+path
 with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'SollahmsReleaseVerification/20261119'}),timeout=30) as response:
  body=response.read();actual=hashlib.sha256(body).hexdigest();expected=hashlib.sha256((out/path.lstrip('/')).read_bytes()).hexdigest();assert response.status==200 and response.geturl()==u and actual==expected,path
  rows.append({'path':path,'status':response.status,'bytes':len(body),'sha256':actual,'matchesPackage':True,'contentType':response.headers.get('Content-Type'),'cacheControl':response.headers.get('Cache-Control')})
res={'verifiedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'host':'sollahms.cl','sourceCommit':'0a0b7c70c7de8f5db8b122ae8a4d6664773180ba','deploymentId':'dpl_8MyM5t9vQukSLaBkNRq4sTzGsSPV','verdict':'APROBADO','checked':len(rows),'matched':len(rows),'rows':rows,'functionsCalled':0,'formsSubmitted':0,'credentialsUsed':False}
(r/'release/PUBLICACION-HTTP-MAPA.json').write_text(json.dumps(res,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'httpMatched':len(rows),'sourceCommit':res['sourceCommit']}))
