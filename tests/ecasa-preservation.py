import json,sys,hashlib
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1];B=Path('/tmp/ecasa-baseline');sys.path.insert(0,str(R/'scripts'));import ecasa_commercial as e
read=lambda p:json.loads(p.read_text());projects=read(R/'data/proyectos.json');old=read(B/'data/proyectos.json');checks=0
assert len(projects)==len(old)==131
for p,o in zip(projects,old):
 if p['inmobiliaria']!='Ecasa':assert p==o;checks+=1;continue
 for key in ['slug','nombre','direccion','comuna','region','amenities','superficieDesdeM2','imagenPrincipal','imagenAlt','detalleUrl']:
  assert p.get(key)==o.get(key),(p['slug'],key);checks+=1
 path=p['slug']+'.html';before=(B/path).read_text();after=(R/path).read_text();a=BeautifulSoup(before,'html.parser');b=BeautifulSoup(after,'html.parser')
 for selector in ['img','iframe','form','style']:
  assert [str(x) for x in a.select(selector)]==[str(x) for x in b.select(selector)],(path,selector);checks+=1
 assert e.apply_ecasa(after,p)==after,(path,'regeneration');checks+=1
 for stage in p['etapasComerciales']:
  for offer in stage['commercialOffers']:assert e.price(offer['priceUF']) in b.get_text();checks+=1
 assert b.select_one('.ci-market strong').get_text()==e.price(p['precioDesdeUF']);checks+=1
index=read(R/'data/catalog-facets.json');prior=read(B/'data/catalog-facets.json')
for p in projects:
 if p['inmobiliaria']!='Ecasa':assert index['projects'][p['slug']]==prior['projects'][p['slug']];checks+=1
assert e.sync_facets(index,projects)==index;checks+=1
print(json.dumps({'checks':checks,'projects':len(projects),'ecasaFiches':15,'otherProjectsUnchanged':116,'regeneration':'idempotent','allImagesFormsStylesPreserved':True}))
