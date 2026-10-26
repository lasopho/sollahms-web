#!/usr/bin/env python3
"""Scope, preservation and source-to-public-media verification for this release."""
from pathlib import Path
import hashlib,json,subprocess
from bs4 import BeautifulSoup
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
BASE='e6e326032e3f1948996ab4408bf68b5c0da0e8fd'
def old(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
report=[]
def check(name,condition):
 report.append({'check':name,'passed':bool(condition)})
 assert condition,name
m=json.loads((ROOT/'docs/maestra-brochures-20261025/manifest.json').read_text())
projects=m['projects'];now=json.loads((ROOT/'data/proyectos.json').read_text());before=json.loads(old('data/proyectos.json'));previous={p['slug']:p for p in before}
check('132 records retained, same order and identities',[p['slug'] for p in now]==[p['slug'] for p in before] and len(now)==132)
check('19 Maestra and 18 Norte Verde retained',sum(p['inmobiliaria']=='Maestra' for p in now)==19 and sum(p['inmobiliaria']=='Norte Verde' for p in now)==18)
for p in now:
 a=dict(p);b=dict(previous[p['slug']])
 for field in ['imagenPrincipal','imagenAlt']:a.pop(field,None);b.pop(field,None)
 check(p['slug']+': all commercial and identity fields preserved',a==b)
 if p['slug'] not in projects:check(p['slug']+': page and full data unchanged',(ROOT/(p['slug']+'.html')).read_bytes()==old(p['slug']+'.html') and p==previous[p['slug']])
protected=['index.html','proyectos.html','sitemap.xml','robots.txt','contacto.html','agenda-asesoria.html','comparador-hipotecario.html','assets/css/sollahms-theme.css','assets/branding/og-sollahms-square-v2.jpg']
for path in protected:check(path+': unchanged',old(path)==(ROOT/path).read_bytes())
seen=set()
for a in m['assets']:
 for media in [a]+([a['thumbnail']] if 'thumbnail' in a else []):
  path=ROOT/media['path'].lstrip('/');check(media['path']+': bytes, dimensions and hash',path.exists() and path.stat().st_size==media['bytes'] and sha(path)==media['sha256'] and Image.open(path).size==(media['width'],media['height']))
 check(a['path']+': duplicate content reuses a shared binary',a['sha256'] not in seen or bool(a.get('sharedContentWith')));seen.add(a['sha256'])
 check(a['path']+': document and page traceable',any(d['key']==a['documentKey'] and d['sha256']==a['sourceSHA256'] and d['pageCount']>=a['page'] for d in m['documents']))
for slug,p in projects.items():
 path=slug+'.html';s=BeautifulSoup((ROOT/path).read_text(),'html.parser');b=BeautifulSoup(old(path),'html.parser')
 check(slug+': title, canonical, metadata and JSON-LD unchanged',[str(x) for x in s.select('title,meta,link[rel=canonical],script[type="application/ld+json"]')]==[str(x) for x in b.select('title,meta,link[rel=canonical],script[type="application/ld+json"]')])
 check(slug+': integrated maps unchanged',[str(x) for x in s.select('iframe')]==[str(x) for x in b.select('iframe')])
 check(slug+': no external Maps box','Abrir en Google Maps' not in s.get_text())
 check(slug+': plan count',len(s.select('#planos .brochure-resource'))==len(p['plans']))
 check(slug+': theme loaded last',s.select('link[rel=stylesheet]')[-1]['href'].startswith('/assets/css/sollahms-theme.css'))
 ids=[x['id'] for x in s.select('[id]')];check(slug+': unique IDs',len(ids)==len(set(ids)))
 for a in p['images']+p['plans']:
  check(slug+': linked '+a['path'],bool(s.select('a[href="'+a['path']+'"]')))
  src=a.get('thumbnail',a)['path'];ims=s.select('img[src="'+src+'"]');check(slug+': meaningful alt '+src,bool(ims) and all(len(i.get('alt',''))>15 for i in ims))
 for a in s.select('a[href^="#"]'):
  check(slug+': valid anchor '+a['href'],a['href']=='#' or a['href'][1:] in ids)
 check(slug+': no repeated gallery image',len([i['src'] for i in s.select('.gallery-grid img,.featured-gallery img')])==len(set(i['src'] for i in s.select('.gallery-grid img,.featured-gallery img'))))
check('Vista Llacolén A has no plan assigned from B',not projects['vista-llacolen-a']['plans'])
check('Jardines 7 unit plans per tower',sum(a['label'].startswith('Torre A · Tipo') for a in projects['jardines-de-alvarado']['plans'])==7 and sum(a['label'].startswith('Torre B · Tipo') for a in projects['jardines-de-alvarado']['plans'])==7)
check('Ambiguous Aldunate pages excluded',not any(a['documentKey']=='02' and a['page']==5 or a['documentKey']=='07' and a['page']==8 for a in m['assets']))
config=json.loads((ROOT/'vercel.json').read_text());check('main and working branch automatic deployments disabled',config['git']['deploymentEnabled']['main'] is False and config['git']['deploymentEnabled']['codex/maestra-brochures-20261025'] is False)
result={'baseline':BASE,'checks':len(report),'passed':sum(r['passed'] for r in report),'results':report}
(ROOT/'docs/maestra-brochures-20261025/local-checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='results'}))
