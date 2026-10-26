#!/usr/bin/env python3
"""Preserve the published pages while requiring four visible commercial fields."""
from pathlib import Path
from bs4 import BeautifulSoup
import json,subprocess,hashlib
ROOT=Path(__file__).resolve().parents[1]
BASE='0f4338a3d4cfcb99544251af0d79d305829bd709'
checks=0;forms=0;pages=[]
def check(value,label):
 global checks
 assert value,label
 checks+=1
def old(path):return subprocess.check_output(['git','show',BASE+':'+str(path)],cwd=ROOT)
for p in ROOT.glob('*.html'):
 before=BeautifulSoup(old(p.name),'html.parser');after=BeautifulSoup(p.read_bytes(),'html.parser')
 check(str(before.title)==str(after.title),p.name+' title')
 check([str(x) for x in before.select('meta,link[rel=canonical],script[type="application/ld+json"]')]==[str(x) for x in after.select('meta,link[rel=canonical],script[type="application/ld+json"]')],p.name+' metadata')
 check([str(x) for x in before.select('img,iframe')]==[str(x) for x in after.select('img,iframe')],p.name+' media')
 for f in after.select('#advisory-form,#lead-form'):
  r=f.select_one('input[name=rut]');check(r is not None,p.name+' RUT')
  check(r.has_attr('required') and r.get('type')=='text',p.name+' required RUT')
  required=f.select('input[name=nombre],input[name=rut],input[name=correo],input[name=telefono]')
  check([x['name'] for x in required]==['nombre','rut','correo','telefono'],p.name+' four-field order')
  for x in required:
   check(x.has_attr('required') and not x.has_attr('disabled') and not any(a.has_attr('hidden') for a in x.parents if a in f.descendants),p.name+' visible required '+x['name'])
   check(all(after.find(id=i) for i in x.get('aria-describedby','').split()),p.name+' field errors')
  check(not f.select('[name=medio],.advisory-choice'),p.name+' selector removed')
  check('son obligatorios' in f.get_text(),p.name+' required explanation')
  check('Opcional.' not in after.find(id=r['id']+'-help').get_text(),p.name+' RUT help')
  inputs=f.select('input');check(inputs.index(r)==next(i for i,x in enumerate(inputs) if x.get('name')=='nombre')+1,p.name+' order')
  check(after.find('label',attrs={'for':r['id']}).get_text(strip=True)=='RUT',p.name+' label')
  check(all(after.find(id=i) for i in r.get('aria-describedby','').split()),p.name+' help IDs')
  check(f.get('action') in ['/api/advisory','/api/contact'] and f.get('method')=='post',p.name+' existing POST')
  check(f.select_one('input[name=consent]') is not None and not f.select_one('input[name=consent]').has_attr('checked'),p.name+' consent')
  forms+=1;pages.append(p.name)
 check('Evita incluir RUT' not in after.get_text() and 'No necesitas entregar RUT' not in after.get_text(),p.name+' removed copy')
 for selector in ['.ci-hero','.gallery-grid','.brochure-plan-grid','#oferta-comercial','.spec-grid']:
  check([str(x) for x in before.select(selector)]==[str(x) for x in after.select(selector)],p.name+selector)
 if p.name not in pages and p.name!='privacidad.html':check(p.read_bytes()==old(p.name),p.name+' unrelated page exact')
check(forms==136,'136 live commercial forms')
for path in ['data/proyectos.json','data/hipotecario.json','assets/js/scroll-presence.js','assets/css/sollahms-theme.css','assets/css/project-header-b.css','assets/css/project-journey.css','assets/js/mortgage-engine.mjs','assets/js/mortgage-data.mjs','assets/js/form-operation.mjs','assets/js/project-identity.mjs','assets/branding/sollahms-logo.svg','sitemap.xml','robots.txt']:
 check((ROOT/path).read_bytes()==old(path),path+' exact')
v=json.loads((ROOT/'vercel.json').read_text())['git']['deploymentEnabled'];check(v['main'] is False and v['codex/required-commercial-fields-20261026'] is False,'deploy flags')
report={'forms':forms,'checksPassed':checks,'pages':pages,'base':BASE}
(ROOT/'docs/required-commercial-fields-20261026/local-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print({'forms':forms,'checksPassed':checks})
