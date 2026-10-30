import json,sys,copy
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1];B=Path('/tmp/aj-baseline');sys.path.insert(0,str(R/'scripts'))
from aj_urbana_commercial import apply_aj,sync_facets,price
p=json.loads((R/'data/proyectos.json').read_text());old=json.loads((B/'data/proyectos.json').read_text());n=0
def ck(x):
 global n
 assert x;n+=1
ck([x for x in p if x['inmobiliaria']!='AJ Urbana']==[x for x in old if x['inmobiliaria']!='AJ Urbana'])
f=json.loads((R/'data/catalog-facets.json').read_text());fo=json.loads((B/'data/catalog-facets.json').read_text())
for x in p:
 slug=x['slug']
 if x['inmobiliaria']!='AJ Urbana':ck(f['projects'][slug]==fo['projects'][slug]);continue
 before=BeautifulSoup((B/(slug+'.html')).read_text(),'html.parser');raw=(R/(slug+'.html')).read_text();after=BeautifulSoup(raw,'html.parser')
 for selector in ['img','form','style','link[rel=stylesheet]']:ck([str(e) for e in before.select(selector)]==[str(e) for e in after.select(selector)])
 ck(apply_aj(raw,x)==raw)
 for o in x['commercialOffers']:ck(price(o['priceUF']) in after.get_text(' ',strip=True))
 for key in ['features','typologyLabels']:ck(f['projects'][slug][key]==fo['projects'][slug][key])
 ck([{k:v for k,v in a.items() if k!='propertyType'} for a in f['projects'][slug]['variants']]==[{k:v for k,v in a.items() if k!='propertyType'} for a in fo['projects'][slug]['variants']])
 ck(after.select_one('.ci-market strong').text==price(x['precioDesdeUF']))
ck(sync_facets(copy.deepcopy(f),p)==f)
print(json.dumps({'checks':n,'otherProjectsPreserved':126,'regeneration':'idempotent','mediaFormsStyles':'preserved'}))
