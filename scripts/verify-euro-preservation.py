"""Verify the bounded Euro overlay against the previous reviewed source snapshot."""
import json, hashlib
from pathlib import Path
from urllib.parse import urlsplit,unquote
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1];B=R.parent/'purchase-stage-source';D=R/'docs/euro-20261029'
def read(root,path):return json.loads((root/path).read_text())
slugs=set(read(R,'data/euro-commercial.json')['projects'])
report={'scope':sorted(slugs),'checks':{},'pages':[]}
for name in ['proyectos','fichas-proyectos']:
 old={p['slug']:p for p in read(B,'data/'+name+'.json')};new={p['slug']:p for p in read(R,'data/'+name+'.json')}
 assert old.keys()==new.keys() and len(new)==131
 changed={k for k in old if old[k]!=new[k]};assert changed==slugs,(name,changed^slugs)
 report['checks'][name]={'changed':12,'unchanged':119}
oldloc=read(B,'data/project-locations.json')['locations'];newloc=read(R,'data/project-locations.json')['locations']
assert set(oldloc)==set(newloc)
for slug,v in oldloc.items():
 for key in ['lat','lng','latitude','longitude','coordinates']:
  assert v.get(key)==newloc[slug].get(key),(slug,key)
report['checks']['allMapCoordinatesUnchanged']=True
frozen={f['file'].removeprefix('release/static/') for f in read(R,'docs/euro-20261029/deployment-files.json') if f['file'].startswith('release/static/')}
def media(s):return {x.get('src') for x in s.select('img[src],iframe[src]')}
missing=[]
for slug in sorted(slugs):
 old=BeautifulSoup((B/(slug+'.html')).read_text(),'html.parser');s=BeautifulSoup((R/(slug+'.html')).read_text(),'html.parser')
 assert media(old)<=media(s),(slug,'old media removed')
 assert old.select_one('form').attrs==s.select_one('form').attrs
 for name in ['nombre','rut','correo','telefono','consent','website']:
  a=old.select_one('[name="'+name+'"]');b=s.select_one('[name="'+name+'"]');assert a.attrs==b.attrs,(slug,name)
 ids=[e['id'] for e in s.select('[id]')];assert len(ids)==len(set(ids)),(slug,'duplicate ids')
 for id_ in ['resumen','caracteristicas','galeria','ubicacion','solicitar-cotizacion']:assert id_ in ids,(slug,id_)
 for a in s.select('[src],a[href],link[href]'):
  u=a.get('src') or a.get('href');p=urlsplit(u)
  if p.scheme or p.netloc:continue
  path=unquote(p.path).lstrip('/')
  if path and not path.startswith('api/') and not (R/path).exists() and path not in frozen:missing.append((slug,u))
  if u.startswith("#") and p.fragment:assert s.find(id=unquote(p.fragment)),(slug,u)
 assert s.select_one('link[rel="canonical"]')['href']=='https://sollahms.cl/'+slug+'.html'
 assert s.select_one('script[src*="image-parallax"]') and s.select_one('script[src*="scroll-presence"]')
 report['pages'].append({'slug':slug,'oldMediaPreserved':len(media(old)),'formsPreserved':True,'uniqueIds':True,'essentialSections':True})
assert not missing,missing
report['checks']['allLocalLinksAndAssetsResolve']=True
assert (R/'index.html').read_bytes()==(B/'index.html').read_bytes()
report['checks']['homepagePreserved']=True
for p in B.glob('*.html'):
 if p.stem not in slugs and p.name not in ['proyectos.html','contacto.html','agenda-asesoria.html','guia-hipotecaria.html','cuando-comprar-propiedad.html']:
  assert (R/p.name).read_bytes()==p.read_bytes(),p.name
report['checks']['unrelatedPagesPreserved']=True
(D/'preservation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report['checks'],ensure_ascii=False))
