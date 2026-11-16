"""Inspect the recovered certified bytes; never generates or modifies site files."""
import hashlib,json,re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse

ROOT=Path('/private/tmp/sollahms-recorridos-supplement')
OUT=Path('/private/tmp/sollahms-recorridos-recovery/output')
REPO=Path('/private/tmp/sollahms-recorridos-20261115-work')
CERT=Path('/private/tmp/sollahms-recorridos-recovery/verification-certified.json')
catalog=json.loads(Path('/private/tmp/sollahms-recorridos-qa/data/proyectos.json').read_text())
inventory={x['path']:x for x in json.loads(CERT.read_text())['inventory']}
url_pattern=re.compile(r'(?:https?://|/)[^\s"<>\x27]+',re.I)
video_kind=re.compile(r'youtube\.com|youtu\.be|vimeo\.com|\.(?:mp4|webm)(?:[?#]|$)',re.I)
def video_urls(text):return sorted(set(x for x in url_pattern.findall(text) if video_kind.search(x)))

class Media(HTMLParser):
 def __init__(self):super().__init__();self.media=[];self.links=[];self.forms=[];self.tags={}
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t in ['iframe','video','source','embed','object']:self.media.append({'tag':t,**a})
  if t=='a' and a.get('href'):self.links.append(a['href'])
  if t=='form':self.forms.append({'action':a.get('action'),'method':a.get('method'),'id':a.get('id')})
  self.tags[t]=self.tags.get(t,0)+1

rows=[];missing=[]
for item in catalog:
 path='static/'+item['slug']+'.html';p=OUT/path
 if not p.is_file():missing.append(path);continue
 data=p.read_bytes();e=inventory[path];assert len(data)==e['size'] and hashlib.sha256(data).hexdigest()==e['sha256'],path
 s=data.decode();parser=Media();parser.feed(s)
 rows.append({'slug':item['slug'],'path':path,'sha256':e['sha256'],'media':parser.media,'videoReferences':video_urls(s),'forms':parser.forms,'imageCount':parser.tags.get('img',0),'tourNodes':len(re.findall(r'data-project-embed=["\x27]tour|id=["\x27]recorrido|class=["\x27]tour-card',s))})
research=json.loads((REPO/'data/sento-official-research.json').read_text())
internal=[{'slug':p.get('slugExistente'),'references':p.get('recursos',{}).get('videosIframes',[])} for p in research.get('proyectos',[]) if p.get('recursos',{}).get('videosIframes')]
data_video=[]
for path,e in inventory.items():
 if path.startswith('static/data/') and path.endswith('.json'):
  p=OUT/path
  if not p.is_file():missing.append(path);continue
  b=p.read_bytes();assert hashlib.sha256(b).hexdigest()==e['sha256'],path
  matches=video_urls(b.decode())
  if matches:data_video.append({'path':path,'videoReferences':matches})
result={'deployment':'dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi','sourceCommit':'16480969f0647c0e6df97053d49199b979e17c83','expectedFiches':len(catalog),'inspectedExactFiches':len(rows),'missing':missing,'videoReferencesInPublishedFiches':sum(len(r['videoReferences']) for r in rows),'videoMediaTagsInPublishedFiches':sum(len([m for m in r['media'] if m['tag'] in ['video','source','embed','object'] or m.get('data-project-embed')=='video']) for r in rows),'runtimeDataVideoReferences':data_video,'preservedInternalResearchVideoReferences':internal,'researchFileDeployed':('static/data/sento-official-research.json' in inventory),'beforeRemovalGithubEvidence':[
 {'slug':'curico-77','baseCommit':'c2e1965ced736d46917a1bee286456cb937d58fe','blobSha':'1d96081c83765f50d187bc9966eb48f603f04e64','videoReferences':0},
 {'slug':'domeyko-2055','baseCommit':'c2e1965ced736d46917a1bee286456cb937d58fe','blobSha':'0cf88d7a7e1c9fc64783603d249167e2e94d1816','videoReferences':0},
 {'slug':'mirador-la-florida','baseCommit':'c2e1965ced736d46917a1bee286456cb937d58fe','blobSha':'e756fcee0188f21f2817b282ee84203f27fe32ca','videoReferences':0},
 {'slug':'san-ignacio','baseCommit':'c2e1965ced736d46917a1bee286456cb937d58fe','blobSha':'e9f1bbbd862b12882510e55688fe0ddc465ee6ab','videoReferences':0}
 ],'rows':rows}
ROOT.mkdir(exist_ok=True)
(ROOT/'source-media-inventory.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['rows','beforeRemovalGithubEvidence','preservedInternalResearchVideoReferences','missing']},ensure_ascii=False))
assert not missing, 'Recovery is incomplete; inventory must be rerun after certified files are materialized.'
assert len(rows)==131
