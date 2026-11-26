"""Verify identity changes against the published public source and current9M artifact and complete artifact."""
import hashlib, importlib.util, json, re
from pathlib import Path
from urllib.parse import urlsplit, unquote
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
DOC=Path(__file__).resolve().parent
PRIVATE=Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-identity-geo-20261125')
BASE=PRIVATE/'baseline-source'
STATIC=PRIVATE/'candidate/.vercel/output/static'
spec=importlib.util.spec_from_file_location('corporate_seo',ROOT/'scripts/corporate_seo.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
checks=[]
def check(name,value):
    checks.append({'name':name,'passed':bool(value)})
    if not value:raise RuntimeError(name)
def blocks(text,tag):return re.findall(r'<'+tag+r'\b.*?</'+tag+r'>',text,re.S)
def graph(text):return json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',text,re.S)[1])
def content_only(text,name):
    if name=='index.html':
        text=re.sub(r'(<details open><summary>¿Qué hace Sollahms\?</summary>).*?(</details>)',r'\1[reviewed identity]\2',text,flags=re.S)
        text=re.sub(r'<script type="application/ld\+json">.*?</script>','[reviewed graph]',text,count=1,flags=re.S)
    else:
        text=re.sub(r'(<section class="advisory-page-heading"><div>.*?<h1>.*?</h1>)<p>.*?</p>',r'\1[reviewed identity]',text,count=1,flags=re.S)
    return text

for name in ['index.html','agenda-asesoria.html','contacto.html']:
    old=(BASE/name).read_text();text=(ROOT/name).read_text()
    check(name+' exact reviewed change boundary',content_only(old,name)==content_only(text,name))
    check(name+' frozen artifact matches source',(STATIC/name).read_bytes()==(ROOT/name).read_bytes())
    for tag in ['header','footer','form','style']:
        check(name+' preserved '+tag,blocks(old,tag)==blocks(text,tag))
    scripts=lambda s:[x for x in blocks(s,'script') if 'application/ld+json' not in x]
    check(name+' executable scripts unchanged',scripts(old)==scripts(text))
    check(name+' one unchanged H1',len(blocks(text,'h1'))==1 and blocks(old,'h1')==blocks(text,'h1'))
    check(name+' metadata and identity idempotent',module.apply_corporate_seo(text,name)==text)
    check(name+' regenerates from published baseline',module.apply_corporate_seo(old,name)==text)
    check(name+' visible official-domain statement','El sitio web oficial de Sollahms es <a href="https://sollahms.cl/">sollahms.cl</a>.' in text)
    check(name+' no personal schema or aliases',not any(k in str(graph(text)) for k in ['sameAs','alternateName','founder','alumniOf','reviewRating']))
    oldids={n['@id'] for n in graph(old)['@graph']};newids={n['@id'] for n in graph(text)['@graph']}
    check(name+' existing entity identifiers preserved',oldids==newids)
    for href in set(re.findall(r'<a\b[^>]*href="([^"]+)"',text))-set(re.findall(r'<a\b[^>]*href="([^"]+)"',old)):
        u=urlsplit(href)
        if u.netloc and u.netloc!='sollahms.cl':raise RuntimeError('New external identity link')
        filename='index.html' if u.path=='/' else (u.path.lstrip('/') or name)
        check(name+' new destination '+href,(STATIC/filename).is_file())
        if u.fragment:check(name+' fragment '+href,bool(re.search(r'\bid=["\']'+re.escape(unquote(u.fragment))+r'["\']',(STATIC/filename).read_text())))

oldgraph={n['@id']:n for n in graph((BASE/'index.html').read_text())['@graph']}
newgraph={n['@id']:n for n in graph((ROOT/'index.html').read_text())['@graph']}
permitted={'Organization':{'description'},'WebSite':{'description'},'Service':{'serviceType','description'}}
for id,node in oldgraph.items():
    fields=permitted.get(node['@type'],set())
    check('graph stable fields '+node['@type'],{k:v for k,v in node.items() if k not in fields}=={k:v for k,v in newgraph[id].items() if k not in fields})
try:module.align_homepage_graph((ROOT/'index.html').read_text(),'x','y',{'Organization':{'sameAs':['https://example.com']}})
except ValueError:check('reject unsupported identity property',True)
else:check('reject unsupported identity property',False)
try:module.apply_corporate_seo('','proyectos.html')
except ValueError:check('catalogue outside renderer scope',True)
else:check('catalogue outside renderer scope',False)
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
oldentries=ET.fromstring((BASE/'sitemap.xml').read_bytes()).findall('s:url',ns);entries=ET.fromstring((ROOT/'sitemap.xml').read_bytes()).findall('s:url',ns)
check('sitemap same144URLs and order',len(entries)==144 and [e.findtext('s:loc',namespaces=ns) for e in entries]==[e.findtext('s:loc',namespaces=ns) for e in oldentries])
changed={'https://sollahms.cl/','https://sollahms.cl/agenda-asesoria.html','https://sollahms.cl/contacto.html'}
for a,b in zip(oldentries,entries):
    url=b.findtext('s:loc',namespaces=ns)
    check('sitemap entry '+url,b.findtext('s:lastmod',namespaces=ns)=='2026-11-25' if url in changed else ET.tostring(a)==ET.tostring(b))
manifest=json.loads((PRIVATE/'candidate-manifest.json').read_text());baseline=json.loads((PRIVATE/'baseline-manifest.json').read_text())
before={r['path']:r for r in baseline['inventory']};after={r['path']:r for r in manifest['inventory']}
check('complete1741file namespace preserved',len(after)==1741 and set(before)==set(after))
check('only four output files changed',{p for p in before if before[p]!=after[p]}=={'static/index.html','static/agenda-asesoria.html','static/contacto.html','static/sitemap.xml'})
check('all68function files and configuration unchanged',sum(p.startswith('functions/') for p in after)==68 and all(before[p]==after[p] for p in after if p.startswith('functions/') or p=='config.json'))
check('robots unchanged',hashlib.sha256((ROOT/'robots.txt').read_bytes()).hexdigest()==after['static/robots.txt']['sha256'])
report={'passed':True,'checks':checks,'sourceBaseline':'2327ed4324b0d56af04d9f6db8f50b4f54ca33b4','publicSourceUnchangedSince':'14d99d8fb286950a211b254f5d738b0abe18217e','candidateInventorySHA256':manifest['inventorySHA256'],'realNetworkRequests':0,'formsSubmitted':0,'scope':'Three corporate pages and sitemap; preservation checks do not optimize excluded pages.'}
(DOC/'content-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':True,'checks':len(checks),'outputFilesChanged':4,'functionsUnchanged':68}))
