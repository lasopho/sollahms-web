"""Regression checks for the scoped SEO overlay; no requests or submissions."""
from pathlib import Path
import json,re,sys,hashlib,subprocess,tempfile
from urllib.parse import urlsplit,unquote
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from corporate_seo import apply_corporate_seo
baseline_temp=tempfile.TemporaryDirectory()
BASE=Path(baseline_temp.name)
PAGES=list(json.loads((ROOT/'data/corporate-seo.json').read_text())['pages'])
checks=[];errors=[]
def check(name,condition):
 checks.append({'check':name,'passed':bool(condition)})
 if not condition:errors.append(name)
manifest=json.loads((ROOT/'docs/euro-20261029/deployment-files.json').read_text())
for item in manifest:
 if item['file'].startswith('release/static/') and 'data' in item:
  target=BASE/item['file'].removeprefix('release/static/');target.parent.mkdir(parents=True,exist_ok=True);target.write_text(item['data'])
paths={x['file'].removeprefix('release/static/') for x in manifest if x['file'].startswith('release/static/')}
forms=lambda s:re.findall(r'<form\b.*?</form>',s,re.S)
scripts=lambda s:[v for v in re.findall(r'<script\b.*?</script>',s,re.S) if 'application/ld+json' not in v]
# A legacy closing </link> may make html.parser attach following JSON-LD to
# a void link element. Compare stylesheet attributes and style text, not that
# parser-created descendant tree; the browser treats link as a void element.
styles=lambda soup:[(x.name,dict(x.attrs),x.string if x.name=='style' else None) for x in soup.select('link[rel=stylesheet],style') if x.get('id')!='corporate-seo-layout']
headings=[];titles=[];descs=[];new_broken=[];existing_broken=[]
for name in PAGES:
 text=(ROOT/name).read_text();old=(BASE/name).read_text();s=BeautifulSoup(text,'html.parser');o=BeautifulSoup(old,'html.parser')
 # Compare the same approved wordmark with its contrast variant corrected only in comparator footer.
 if name=='comparador-hipotecario.html':
  o.select_one('footer .brand img')['src']='/assets/branding/sollahms-logo.svg'
 url='https://sollahms.cl/'+('' if name=='index.html' else name)
 check(name+' canonical',len(s.select('link[rel=canonical]'))==1 and s.select_one('link[rel=canonical]')['href']==url)
 check(name+' h1',len(s.find_all('h1'))==1 and bool(s.h1.get_text(strip=True)))
 check(name+' forms unchanged',forms(old)==forms(text))
 check(name+' scripts unchanged',scripts(old)==scripts(text))
 check(name+' all images unchanged',[str(x) for x in o.find_all('img')]==[str(x) for x in s.find_all('img')])
 check(name+' original styles unchanged',styles(o)==styles(s))
 check(name+' metadata idempotent',apply_corporate_seo(text,name)==text)
 check(name+' no duplicate ids',len(s.select('[id]'))==len({x['id'] for x in s.select('[id]')}))
 check(name+' navigation unchanged',str(o.header)==str(s.header) and str(o.footer)==str(s.footer))
 check(name+' no noindex',not any('noindex' in x.get('content','').lower() for x in s.select('meta[name=robots]')))
 for selector in ['meta[property="og:site_name"]','meta[property="og:image:alt"]','meta[name="twitter:card"]','meta[name="description"]','meta[property="og:title"]']:
  check(name+' '+selector,len(s.select(selector))==1)
 graph=json.loads(s.select_one('script[type="application/ld+json"]').string)['@graph']
 check(name+' entity connected',all(x.get('publisher',{}).get('@id')=='https://sollahms.cl/#organization' for x in graph if name!='index.html'))
 check(name+' graph url',any(x.get('url')==url for x in graph))
 titles.append(s.title.text);descs.append(s.select_one('meta[name=description]')['content'])
 oldlinks={x.get('href') for x in o.select('a[href]')}
 for a in s.select('a[href]'):
  href=a['href'];u=urlsplit(href)
  if u.scheme in ['mailto','tel'] or u.netloc and u.netloc!='sollahms.cl':continue
  p=u.path.lstrip('/') or (name if not u.path else 'index.html')
  if not u.path and u.fragment:p=name
  if href=='/':p='index.html'
  exists=p in paths
  if exists and u.fragment and p.endswith('.html'):
   target=ROOT/p if p in PAGES else BASE/p
   exists=target.exists() and BeautifulSoup(target.read_text(),'html.parser').find(id=unquote(u.fragment)) is not None
  if not exists:(existing_broken if href in oldlinks else new_broken).append({'page':name,'href':href})
check('new links and fragments resolve',not new_broken)
check('unique titles',len(set(titles))==len(PAGES));check('unique descriptions',len(set(descs))==len(PAGES))
for name in ['guia-hipotecaria.html','cuando-comprar-propiedad.html']:
 before=(ROOT/name).read_bytes();script='build-mortgage-guide.py' if name.startswith('guia') else 'build-purchase-stage-guide.py'
 subprocess.run([sys.executable,str(ROOT/'scripts'/script)],check=True,capture_output=True)
 check(name+' generator reproducible',(ROOT/name).read_bytes()==before)
try:apply_corporate_seo((BASE/'proyectos.html').read_text(),'proyectos.html')
except ValueError:check('catalogue rejected by renderer',True)
else:check('catalogue rejected by renderer',False)
oldsm=BeautifulSoup((BASE/'sitemap.xml').read_text(),'xml');newsm=BeautifulSoup((ROOT/'sitemap.xml').read_text(),'xml')
check('sitemap URLs retained',[x.text for x in oldsm.find_all('loc')]==[x.text for x in newsm.find_all('loc')])
for x,y in zip(oldsm.find_all('url'),newsm.find_all('url')):
 if x.loc.text not in ['https://sollahms.cl/'+('' if f=='index.html' else f) for f in PAGES]:check('excluded sitemap '+x.loc.text,str(x)==str(y))
expected_hashes=json.loads(next(x['data'] for x in manifest if x['file']=='release-hashes.json'))
check('robots unchanged',hashlib.sha256((ROOT/'robots.txt').read_bytes()).hexdigest()==expected_hashes['static/robots.txt'])
report={'passed':sum(x['passed'] for x in checks),'failed':len(errors),'checks':checks,'newBrokenLinks':new_broken,'existingBrokenLinks':existing_broken,'sourceBaseline':'da064d6433d9099af4b3e5df892f4db23997ad5c'}
(ROOT/'docs/seo-corporate-20261029/static-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False))
assert not errors,errors
