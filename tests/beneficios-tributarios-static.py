from html.parser import HTMLParser
from pathlib import Path
import json,hashlib
class P(HTMLParser):
 def __init__(self):super().__init__();self.nodes=[];self.scripts=[];self.script=False
 def handle_starttag(self,t,a):
  a=dict(a);self.nodes.append((t,a))
  if t=='script' and a.get('type')=='application/ld+json':self.script=True
 def handle_endtag(self,t):
  if t=='script':self.script=False
 def handle_data(self,d):
  if self.script:self.scripts.append(d)
p=P();r=Path(__file__).resolve().parents[1];txt=(r/'beneficios-tributarios-inmobiliarios.html').read_text();p.feed(txt);ids=[a['id'] for t,a in p.nodes if 'id'in a];bad=[]
for t,a in p.nodes:
 for k in ['href','src']:
  v=a.get(k,'')
  if v.startswith('#') and v[1:] not in ids:bad.append(v)
  if v.startswith('/') and not v.startswith('//') and not (r/v.split('#')[0].lstrip('/')).exists():bad.append(v)
assert not bad,bad
assert len(ids)==len(set(ids)), 'Duplicate IDs'
assert sum(t=='h1' for t,a in p.nodes)==1
assert not any(t=='form' for t,a in p.nodes)
assert sum('wa.me/' in a.get('href','') for t,a in p.nodes)==1
j=json.loads(p.scripts[0]);assert len(j['@graph'][1]['mainEntity'])==6
for f in j['@graph'][1]['mainEntity']:assert f['name'] in txt;assert f['acceptedAnswer']['text'] in txt
new=['beneficios-tributarios-inmobiliarios.html','assets/css/beneficios-tributarios.css','assets/js/beneficios-tributarios-engine.mjs','assets/js/beneficios-tributarios.mjs']
for name in new[2:]:
 js=(r/name).read_text()
 for forbidden in ['fetch(', 'localStorage', 'sessionStorage','sendBeacon','XMLHttpRequest']:assert forbidden not in js
out={'h1':1,'uniqueIds':len(ids),'brokenInternalLinks':bad,'forms':0,'whatsappLinks':1,'faqMatchingVisible':6,'newBytes':sum((r/p).stat().st_size for p in new),'newDependencies':0}
(r/'docs/beneficios-tributarios-20261114/static-qa.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
base=json.loads((r/'docs/beneficios-tributarios-20261114/base-manifest.json').read_text())
manifest=base+[dict(file='release/static/'+p,sha=hashlib.sha1((r/p).read_bytes()).hexdigest(),size=(r/p).stat().st_size) for p in new]
(r/'docs/beneficios-tributarios-20261114/preview-manifest.json').write_text(json.dumps(manifest,indent=2))
