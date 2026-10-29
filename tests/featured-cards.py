import copy,hashlib,json,re,sys
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1];sys.path.insert(0,str(R/'scripts'))
from featured_project_cards import apply_home,apply_fiche,facts
B=R/'docs/seo-corporate-20261029/deployment-files.json'
if not B.exists():B=R.parent/'seo-corporate-source/docs/seo-corporate-20261029/deployment-files.json'
m={x['file']:x for x in json.loads(B.read_text())}
old=lambda p:m['release/static/'+p]['data']
new=lambda p:(R/p).read_text()
checks=[]
def check(name,ok):
 assert ok,name
 checks.append(name)
a=json.loads(old('data/proyectos.json'));b=json.loads(new('data/proyectos.json'))
check('131 unchanged identities',len(a)==len(b)==131 and [p['slug'] for p in a]==[p['slug'] for p in b])
check('all prices unchanged',[p.get('precioDesdeUF') for p in a]==[p.get('precioDesdeUF') for p in b])
for x,y in zip(a,b):
 if x['slug']=='plaza-las-condes':y=copy.deepcopy(y);y.pop('descripcionCorta');y.pop('descripcionCortaFuente')
 check('catalogue unchanged '+x['slug'],x==y)
check('authorized prices',next(p for p in b if p['slug']=='plaza-las-condes')['precioDesdeUF']==11073 and next(p for p in b if p['slug']=='inn-puerto-chico')['precioDesdeUF']==9816)
a=json.loads(old('data/catalog-facets.json'));b=json.loads(new('data/catalog-facets.json'))
check('only INN filter facts changed',[k for k in a['projects'] if a['projects'][k]!=b['projects'][k]]==['inn-puerto-chico'])
for v in b['projects']['inn-puerto-chico']['variants']:
 check('no inventory or price in model',not any(k in v for k in ['price','priceUF','stock','unit','id']))
check('useful range',facts()['inn-puerto-chico']['surface']=='69,94–135,54 m²')
check('total range',facts()['plaza-las-condes']['surface']=='33,32–83,43 m²')
check('home regenerated from baseline',apply_home(old('index.html'))==new('index.html'))
check('home idempotent',apply_home(new('index.html'))==new('index.html'))
check('fiche regenerated from baseline',apply_fiche(old('inn-puerto-chico.html'),{'slug':'inn-puerto-chico'})==new('inn-puerto-chico.html'))
check('fiche idempotent',apply_fiche(new('inn-puerto-chico.html'),{'slug':'inn-puerto-chico'})==new('inn-puerto-chico.html'))
check('Plaza fiche untouched',old('plaza-las-condes.html')==new('plaza-las-condes.html'))
for path in ['index.html','inn-puerto-chico.html']:
 a=BeautifulSoup(old(path),'html.parser');b=BeautifulSoup(new(path),'html.parser')
 for selector in ['head','img','script','form','nav','iframe','a']:
  check(path+' preserves '+selector,[str(x) for x in a.select(selector)]==[str(x) for x in b.select(selector)])
check('no home placeholders',not re.search('Consultar (tipologías|superficie)',new('index.html')))
b=json.load(open(R/'data/fichas-proyectos.json'))
check('other research preserved',hashlib.sha256(json.dumps([x for x in b if x['slug']!='inn-puerto-chico'],ensure_ascii=False,sort_keys=True).encode()).hexdigest()=='d335f5a84302a0efd6773f09cf7bcb5e4aa8bc3ff113980763a7cdd4cc8dd5fd')
check('Sento protection intact',"if (sentoReview && !preview) throw new Error('The Sento update is authorized for Preview only')" in new('scripts/package-vercel.mjs'))
result={'passed':len(checks),'checks':checks,'note':'Static/source checks; browser observations recorded separately. No requests submitted.'}
(R/'docs/featured-cards-20261029/tests.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':len(checks)}))
