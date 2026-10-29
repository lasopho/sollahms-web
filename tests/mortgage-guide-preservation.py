import json,re,hashlib,sys
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1];B=R.parent/'crescer-source';sys.path.insert(0,str(R/'scripts'));from guide_navigation import apply_guide_navigation
pages=json.loads((R/'docs/mortgage-guide-20261029/navigation-pages.json').read_text());projects={p['slug']:p for p in json.loads((R/'data/proyectos.json').read_text())}
def strip_nav(s):
 s=re.sub(r'<(?:header|footer)\b.*?</(?:header|footer)>','',s,flags=re.S);return s.replace('<link rel="stylesheet" href="/assets/css/guide-navigation.css?v=20261029-1">\n','')
for name in pages:
 before=(B/name).read_text();after=(R/name).read_text();assert strip_nav(before)==strip_nav(after),name
 assert apply_guide_navigation(after,projects.get(Path(name).stem))==after,name
 soup=BeautifulSoup(after,'html.parser');assert soup.header.select('[data-guide-nav]') and soup.footer.select('[data-guide-nav]'),name
 for node in soup.select('header [data-guide-nav], footer [data-guide-nav]'):assert node.text=='Guía hipotecaria'
 for li in soup.select('footer li'):assert not li.find('li'),name
for folder in ['data','api','lib']:
 for path in (B/folder).rglob('*'):
  if path.is_file():assert path.read_bytes()==(R/path.relative_to(B)).read_bytes(),path
for n in ['assets/js/advisory.mjs','assets/js/project-request.mjs','assets/js/mortgage-engine.mjs','assets/js/official-uf.mjs','assets/js/catalog.mjs','assets/css/sollahms-theme.css']:assert (R/n).read_bytes()==(B/n).read_bytes(),n
s=BeautifulSoup((R/'guia-hipotecaria.html').read_text(),'html.parser');ids=[n['id'] for n in s.select('[id]')];assert len(ids)==len(set(ids));assert len(s.select('#aprende details'))==12;assert not s.select('form');assert s.select_one('#gh-annualRatePercent')['value']==''
for control in s.select('input,select'):assert s.find('label',attrs={'for':control['id']}),control
for a in s.select('a[href^="#"]'):assert a['href'][1:] in ids,a
for tag in s.select('script[src],link[rel=stylesheet],img[src]'):
 u=tag.get('src',tag.get('href')).split('?')[0];assert (R/u.lstrip('/')).exists(),u
js=(R/'assets/js/mortgage-guide.mjs').read_text();assert not any(x in js for x in ['localStorage','sessionStorage','sendBeacon',"method:'POST'",'document.cookie'])
base={f['file']:f for f in json.loads((R/'docs/crescer-20261029/deployment-files.json').read_text())};new={f['file']:f for f in json.loads((R/'docs/mortgage-guide-20261029/deployment-files.json').read_text())}
for k,v in base.items():
 if k.startswith('release/functions/') or k in ['prepare-output.mjs','apply-retirements.mjs','release/config.json'] or k.startswith('release/static/data/'):assert new[k]==v,k
print(json.dumps({'navigationPages':len(pages),'fichesMainByteIdentical':len(projects),'existingDataApiLibUnchanged':True,'frozenFunctionsUnchanged':True,'guideModules':12,'uniqueIds':len(ids),'controlsLabeled':True,'noCalculatorPersistence':True}))
