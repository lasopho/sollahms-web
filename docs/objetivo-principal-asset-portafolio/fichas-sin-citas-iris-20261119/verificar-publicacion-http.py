from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor
import urllib.request,json,hashlib,re,datetime
base=Path(__file__).resolve().parent;root=base/'stage/.vercel/output/static';spec=json.loads((base/'MANIFIESTO-CANDIDATO-SIN-CITAS-IRIS.json').read_text());paths=[p['path'].split('static/',1)[1] for p in spec['onlyChangedPublicFiles']]
class Page(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.text=[];self.links=[];self.ids=[];self.skip=0
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t in ['script','style']:self.skip+=1
  if t=='a':self.links.append(a.get('href',''))
  if a.get('id'):self.ids.append(a['id'])
 def handle_endtag(self,t):
  if t in ['script','style'] and self.skip:self.skip-=1
 def handle_data(self,s):
  if not self.skip:self.text.append(s)
def fetch(rel):
 req=urllib.request.Request('https://sollahms.cl/'+rel,headers={'User-Agent':'Sollahms-fiche-publication-verification/1.0'})
 with urllib.request.urlopen(req,timeout=30) as response:
  body=response.read();status=response.status;url=response.url
 expected=(root/rel).read_bytes();assert status==200 and body==expected,(rel,status,'body mismatch')
 p=Page();p.feed(body.decode());visible=' '.join(p.text);external=[u for u in p.links if urlparse(u).hostname and (urlparse(u).hostname=='iris.yapo.cl' or urlparse(u).hostname.endswith('.yapo.cl'))]
 assert not re.search(r'\biris\b|\byapo\b',visible,re.I) and not external and 'fuentes' not in p.ids,rel
 return {'path':rel,'status':status,'sha256':hashlib.sha256(body).hexdigest(),'bodyMatchesReviewedCandidate':True,'visibleIrisYapoMentions':0,'externalIrisYapoLinks':0,'sourceSectionPresent':False,'finalURL':url}
with ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(fetch,paths))
other=[];data={}
for rel in ['proyectos.html','data/proyectos.json','data/catalog-expansion-iris-20261118.json']:
 with urllib.request.urlopen('https://sollahms.cl/'+rel,timeout=30) as response:body=response.read();assert response.status==200
 assert body==(root/rel).read_bytes(),rel;other.append({'path':rel,'status':200,'sha256':hashlib.sha256(body).hexdigest(),'unchangedFromFky':True})
 if rel.endswith('.json'):data[rel]=json.loads(body)
old=data['data/proyectos.json'];new=data['data/catalog-expansion-iris-20261118.json']['projects'];assert len(old)==131 and len(new)==21 and len({p['slug'] for p in old+new})==152
j={'date':'2026-11-19','verifiedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceSHA':'49312fd708ccd9e319511432e4b657788f5734f9','deploymentId':'dpl_FhxqQpX3EZNDBg2AFPSsK3mJNhwr','fichesVerified':len(rows),'fiches':rows,'unchangedCatalogResources':other,'catalogIdentities':152,'oldIdentities':131,'newIdentities':21,'formsSubmitted':0,'browserOrVisualQAClaimed':False,'existingFilterCertificatesReused':True,'result':'PASS'};(base/'PUBLICACION-HTTP-VERIFICADA.json').write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'result':'PASS','fichesVerified':len(rows),'catalogIdentities':152,'visibleIrisYapo':0,'externalIrisYapoLinks':0}))
