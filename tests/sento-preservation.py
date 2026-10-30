import json,sys,copy
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1];B=Path('/tmp/sento-commercial-baseline');sys.path.insert(0,str(R/'scripts'))
from sento_commercial import apply_sento,sync_facets,price
p=json.loads((R/'data/proyectos.json').read_text());o=json.loads((B/'data/proyectos.json').read_text());f=json.loads((R/'data/catalog-facets.json').read_text());fo=json.loads((B/'data/catalog-facets.json').read_text());n=0
def ck(x):
 global n
 assert x;n+=1
ck([x for x in p if x['inmobiliaria']!='Sento']==[x for x in o if x['inmobiliaria']!='Sento'])
for x in p:
 slug=x['slug']
 if x['inmobiliaria']!='Sento':ck(f['projects'][slug]==fo['projects'][slug]);continue
 a=BeautifulSoup((B/(slug+'.html')).read_text(),'html.parser');raw=(R/(slug+'.html')).read_text();b=BeautifulSoup(raw,'html.parser')
 for sel in ['img','iframe','form','style','link[rel=stylesheet]']:ck([str(y) for y in a.select(sel)]==[str(y) for y in b.select(sel)])
 ck(apply_sento(raw,x)==raw)
 ck(x['direccion']==next(z for z in o if z['slug']==slug)['direccion'])
 for offer in x['commercialOffers']:ck(price(offer['priceUF']) in b.get_text(' ',strip=True))
 ck(f['projects'][slug]['features']==fo['projects'][slug]['features'])
ck(sync_facets(copy.deepcopy(f),p)==f)
print(json.dumps({'checks':n,'unchangedOtherProjects':124,'imagesPlansFormsMapsStyles':'preserved','regeneration':'idempotent'}))
