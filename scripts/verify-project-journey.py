#!/usr/bin/env python3
"""Independent preservation/coverage checks for the reordered project pages."""
from collections import Counter
from pathlib import Path
import json,re,subprocess,sys
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
BASE='a8e9a1ca875be024dd660d903e702037bd81cb5b'
projects=json.loads((ROOT/'data/proyectos.json').read_text());names={p['slug']+'.html' for p in projects}
checks=[]
def check(name,ok):
 checks.append({'check':name,'ok':bool(ok)})
 if not ok:raise AssertionError(name)
def previous(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
for path in sorted(ROOT.glob('*.html')):
 before=previous(path.name);after=path.read_bytes()
 if path.name not in names:
  check(path.name+': unchanged',before==after);continue
 old=BeautifulSoup(before,'html.parser');new=BeautifulSoup(after,'html.parser')
 check(path.name+': metadata preserved',[(m.name,str(m)) for m in old.head.select('meta,title,script[type="application/ld+json"],link[rel="canonical"]')]==[(m.name,str(m)) for m in new.head.select('meta,title,script[type="application/ld+json"],link[rel="canonical"]')])
 check(path.name+': media/alt/srcset preserved',Counter(tuple(i.get(k) for k in ['src','srcset','alt','width','height']) for i in old.select('main img'))==Counter(tuple(i.get(k) for k in ['src','srcset','alt','width','height']) for i in new.select('main img')))
 check(path.name+': embedded maps and tours preserved',Counter(str(i) for i in old.select('iframe'))==Counter(str(i) for i in new.select('iframe')))
 check(path.name+': image and calculator destinations preserved',Counter(a.get('href') for a in old.select('main a[href]') if '/assets/' in a['href'] or '/comparador-' in a['href'])==Counter(a.get('href') for a in new.select('main a[href]') if '/assets/' in a['href'] or '/comparador-' in a['href']))
 check(path.name+': previous anchors retained',{e['id'] for e in old.select('[id]')}<={e['id'] for e in new.select('[id]')})
 ids=[e['id'] for e in new.select('[id]')];check(path.name+': no duplicate ids',len(ids)==len(set(ids)))
 for e in old.select('#proyecto p,#oferta-comercial p,.price-note,.price-commercial-note,.commercial-identity-notice'):
  value=e.get_text(' ',strip=True)
  check(path.name+': commercial text retained '+value[:35],not value or value in new.get_text(' ',strip=True))
 for pattern in [r'UF\s*[\d.,]+',r'\d+(?:[.,]\d+)?\s*m²']:
  check(path.name+': prices/areas retained '+pattern,set(re.findall(pattern,old.get_text(' ',strip=True)))<=set(re.findall(pattern,new.get_text(' ',strip=True))))
 check(path.name+': B identity unchanged',old.select_one('.ci-identity').get_text(' ',strip=True)==new.select_one('.ci-identity').get_text(' ',strip=True))
 check(path.name+': single form uses existing endpoint',len(new.select('form[data-project-request]'))==1 and new.select_one('form[data-project-request]')['action']=='/api/advisory')
 check(path.name+': project bound',new.select_one('[data-project-slug]')['data-project-slug']==path.stem)
 check(path.name+': commercial warnings remain open',Counter(n.get_text(' ',strip=True) for n in new.select('.price-note,.price-commercial-note') if n.find_parent('details')) == Counter(n.get_text(' ',strip=True) for n in old.select('.price-note,.price-commercial-note') if n.find_parent('details')))
 check(path.name+': correct goal choices',[(x.get('value'),x.text) for x in new.select('#advisory-goal option')]==[('','Selecciona si lo tienes claro'),('patrimonio','Aumentar mi patrimonio'),('diversificar','Diversificar mis inversiones'),('propiedad','Una propiedad en particular'),('orientacion','Aún lo estoy definiendo')])
for path in ['data/proyectos.json','data/hipotecario.json','api/advisory.mjs','assets/js/scroll-presence.js','assets/js/advisory.mjs','assets/css/sollahms-theme.css','assets/css/project-header-b.css','assets/css/advisory.css','sitemap.xml','robots.txt']:
 check(path+': exact published bytes',(ROOT/path).read_bytes()==previous(path))
config=json.loads((ROOT/'vercel.json').read_text())['git']['deploymentEnabled'];check('automatic deployments disabled',config['main'] is False and config['codex/project-journey-20261026'] is False)
report={'base':BASE,'projects':len(projects),'checks':checks};out=ROOT/'docs/project-journey-20261026';out.mkdir(exist_ok=True);(out/'local-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'projects':len(projects),'checksPassed':len(checks)}))
