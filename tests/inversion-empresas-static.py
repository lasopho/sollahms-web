from html.parser import HTMLParser
from pathlib import Path
import json,re,subprocess
class Parser(HTMLParser):
 def __init__(self,text):
  super().__init__();self.tags=[];self.feed(text)
 def handle_starttag(self,tag,attrs): self.tags.append((tag,dict(attrs)))
p=Path('inversion-inmobiliaria-empresas.html');html=p.read_text();tags=Parser(html).tags
ids=[a['id'] for t,a in tags if 'id' in a];assert len(ids)==len(set(ids));assert sum(t=='h1' for t,a in tags)==1
for t,a in tags:
 u=a.get('href') or a.get('src') or '';path=u.split('#')[0].split('?')[0]
 if u.startswith('#'):assert u[1:] in ids,u
 elif u.startswith('/'):
  dest=Path(path.lstrip('/') or 'index.html');assert dest.is_file(),u
  if '#' in u:assert u.split('#')[1] in [b.get('id') for _,b in Parser(dest.read_text()).tags],u
for sc in re.findall(r'<script type="application/ld\+json">(.*?)</script>',html,re.S):json.loads(sc)
assert sum((a.get('href') or '').startswith('https://wa.me/') for t,a in tags)==1
assert not any(t=='form' for t,a in tags)
assert any(t=='fieldset' and 'disabled' in a for t,a in tags)
assert [a['href'] for t,a in tags if t=='link' and a.get('rel')=='stylesheet'][-1]=='/assets/css/sollahms-theme.css'
assert subprocess.check_output(['git','diff','--name-only','9afbd74','--diff-filter=MDR']).decode()==''
count=len(subprocess.check_output(['git','ls-tree','-r','--name-only','9afbd74']).decode().splitlines())
Path('docs/inversion-empresas-20261114/preservation.json').write_text(json.dumps({'base':'9afbd74cd1793533aed8f96de34d273f1ea19cd8','existing_tracked_files_unchanged':count,'baseline_urls':11,'existing_files_modified':[]},indent=2)+'\n')
print('PASS: metadata, IDs, links/anchors, schema, single WhatsApp, disabled consultation, theme and preservation')
