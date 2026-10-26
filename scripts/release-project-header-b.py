#!/usr/bin/env python3
"""Verify the authorized diff and overlay it on the exact production artifact."""
from pathlib import Path
import argparse,hashlib,json,re,shutil
from bs4 import BeautifulSoup
from PIL import Image
from project_header_b import apply_header,catalog_labels,CSS
ROOT=Path(__file__).resolve().parents[1]
ap=argparse.ArgumentParser();ap.add_argument('--baseline',required=True);ap.add_argument('--destination',required=True);args=ap.parse_args()
base=Path(args.baseline);dest=Path(args.destination);public=base/'.vercel/output/static'
docs=ROOT/'docs/project-header-b-20261026';docs.mkdir(parents=True,exist_ok=True)
projects=json.loads((public/'data/proyectos.json').read_text())
assert (public/'data/proyectos.json').read_bytes()==(ROOT/'data/proyectos.json').read_bytes()
paths=[p['detalleUrl'].lstrip('/') for p in projects]
assert len(paths)==len(set(paths))
rows=[]
def without_hero(s):
 main=re.search(r'<main\b[^>]*>',s)
 m=re.search(r'<section\b[^>]*>.*?</section>',s[main.end():],re.S)
 return s[:main.end()+m.start()]+'<!-- header -->'+s[main.end()+m.end():]
for p,path in zip(projects,paths):
 old=(public/path).read_text();new=(ROOT/path).read_text()
 a,b=BeautifulSoup(old,'html.parser'),BeautifulSoup(new,'html.parser')
 hero=b.select_one('.ci-hero');assert hero and len(b.select('.ci-hero'))==1
 assert hero.h1.get_text()==p['nombre'] and len(b.select('h1'))==1
 assert not hero.select('figcaption')
 assert 'Render referencial · Brochure Maestra' not in b.get_text(' ',strip=True)
 assert apply_header(new,p)==new
 assert hero.select_one('.ci-advisory')['href']=='/agenda-asesoria.html?proyecto='+p['slug']
 # All remaining HTML, including JSON-LD and functional markup, must be identical.
 norm=without_hero(new).replace(' data-project-header="b"','').replace(f'<link rel="stylesheet" href="{CSS}">\n','')
 assert norm==catalog_labels(without_hero(old)),path
 oldimg=a.select_one('main > section img');img=hero.select_one('img')
 row={'slug':p['slug'],'path':path,'metadataAndBodyPreserved':True,'ctaVerified':True}
 if oldimg:
  assert img['src']==oldimg['src'] and img.get('alt')==oldimg.get('alt')
  assert img.get('srcset')==oldimg.get('srcset')
  image=public/img['src'].lstrip('/');w,h=Image.open(image).size
  assert w>=360,'Avoid desktop upscaling: '+path
  row.update(image=img['src'],width=w,height=h,alt=img['alt'],sha256=hashlib.sha256(image.read_bytes()).hexdigest())
 else: assert hero.select_one('.ci-no-image');row['missingImage']=True
 rows.append(row)
changed=[]
for f in public.glob('*.html'):
 new=(ROOT/f.name).read_text();old=f.read_text()
 if f.name not in paths:
  expected=catalog_labels(old)
  if f.name=='proyectos.html':expected=expected.replace('>Catálogo inmobiliario</h1>','>Asset Portafolio</h1>')
  assert new==expected,f.name
 if new!=old:changed.append(f.name)
 assert not any(a.get_text(' ',strip=True) in ['Proyectos','Todos los proyectos','Ver proyectos','Explorar proyectos','← Volver al catálogo de proyectos'] for a in BeautifulSoup(new,'html.parser').select('a[href="/proyectos.html"]'))
assert not dest.exists()
shutil.copytree(base,dest)
overlay=changed+['assets/css/project-header-b.css']
for path in overlay:
 target=dest/'.vercel/output/static'/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/path,target)
shutil.copy2(ROOT/'vercel.json',dest/'vercel.json')
def hashes(r):return {str(p.relative_to(r)):hashlib.sha256(p.read_bytes()).hexdigest() for p in r.rglob('*') if p.is_file()}
before=hashes(base/'.vercel/output');after=hashes(dest/'.vercel/output')
actual=[p for p in before if before[p]!=after.get(p)];added=[p for p in after if p not in before]
assert not (set(before)-set(after))
assert set(actual+added)=={'static/'+x for x in overlay}
assert all(before[p]==after[p] for p in before if p.startswith('functions/'))
config=json.loads((ROOT/'vercel.json').read_text());assert config['git']['deploymentEnabled']['main'] is False and config['git']['deploymentEnabled']['codex/project-header-b-20261026'] is False
report={'baselineDeployment':'dpl_DAo4ZEDA17geE8cFUn3cbkKCvXF7','sourceCommit':'5704649e5fe45b4fad1e68b66747e43f20768327','approvedBCommit':'f438e5115142f549322ec0a0fed0ca582d9ed832','fichas':len(rows),'publicHtml':len(list(public.glob('*.html'))),'changed':actual,'added':added,'unchangedFiles':len(before)-len(actual),'functionsIdentical':True,'catalogueIdentical':True,'noRemovedFiles':True,'projects':rows,'sha256':after}
(docs/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['projects','sha256','changed','added']},ensure_ascii=False));print('Changed',len(actual),'added',len(added))
