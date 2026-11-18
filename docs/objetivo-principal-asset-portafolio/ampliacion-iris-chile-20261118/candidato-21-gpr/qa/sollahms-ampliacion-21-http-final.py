import json,hashlib,re,urllib.request
from html.parser import HTMLParser
from pathlib import Path
from datetime import datetime,timezone
T=Path('/private/tmp/sollahms-ampliacion-21-gpr-20261118'); Q=Path('/private/tmp/sollahms-ampliacion-21-qa')
class Parse(HTMLParser):
 def __init__(self): super().__init__();self.ids=set();self.links=[];self.resources=[];self.forms=0;self.h1='';self.inH1=False
 def handle_starttag(self,t,a):
  a=dict(a)
  if a.get('id'): self.ids.add(a['id'])
  if t=='h1': self.inH1=True
  if t=='form': self.forms+=1
  if t=='a': self.links.append(a.get('href',''))
  if t in ['img','script']: self.resources.append(a.get('src',''))
  if t=='link' and a.get('rel')=='stylesheet': self.resources.append(a.get('href',''))
 def handle_endtag(self,t):
  if t=='h1':self.inH1=False
 def handle_data(self,d):
  if self.inH1:self.h1+=d
j=json.loads((T/'data/catalog-expansion-iris-20261118.json').read_text());rows=[]
for p in j['projects']:
 path=p['slug']+'.html'
 with urllib.request.urlopen('http://127.0.0.1:53251/'+path,timeout=15) as r:status=r.status; raw=r.read()
 text=raw.decode(); h=Parse();h.feed(text)
 assert status==200 and h.h1==p['identity']['name'],path
 assert h.forms==0 and 'project-request.mjs' not in text and 'advisory-contact' not in text
 assert p['source']['projectUrl'] in h.links,path
 assert all(x[1:] in h.ids for x in h.links if x.startswith('#') and x!='#'),path
 assert all((T/x.split('?')[0].lstrip('/')).is_file() for x in h.resources if x.startswith('/')),path
 assert '/contacto.html' in h.links and not any(x.startswith('/contacto.html?') for x in h.links)
 assert 'data-catalog-expansion="iris-20261118"' in text
 rows.append({'slug':p['slug'],'irisId':p['source']['projectId'],'status':status,'identity':True,'anchors':True,'localResources':True,'sourceLink':True,'noNewForms':True,'sha256':hashlib.sha256(raw).hexdigest()})
out={'checkedAtUTC':datetime.now(timezone.utc).isoformat(),'kind':'FINAL_HTTP_CONTRACTS_21_NEW_FICHES_ONLY','sourceSHA256':hashlib.sha256((T/'data/catalog-expansion-iris-20261118.json').read_bytes()).hexdigest(),'passed':len(rows),'total':21,'records':rows,'original131NotRetested':True,'formsSubmitted':0}
(Q/'FICHAS-HTTP-Y-CONTRATOS-FINAL.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'HTTPnewFiches':len(rows),'identityAndSource':'PASS','navigationAndLocalAssets':'PASS','noFormsOrNewServices':'PASS'}))
