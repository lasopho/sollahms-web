"""Public corporate GETs only; no browser, forms, provider SDKs or API calls."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request,urlopen,build_opener,HTTPRedirectHandler
from urllib.error import HTTPError
from xml.etree import ElementTree
from datetime import datetime,timezone
from zoneinfo import ZoneInfo
import json,hashlib,re

WORK=Path('/private/tmp/sollahms-cobertura-asesoria-20261119');DOC=WORK/'docs/service-coverage-20261119'
STATIC=Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-service-coverage-private/candidate/.vercel/output/static')
scope=json.loads((WORK/'docs/seo-measurement/scope-v3.json').read_text())
# Explicit positive list: no catalogue, fichas, documentary center or unknown URLs.
paths=['/','/agenda-asesoria.html','/contacto.html','/centro-orientacion.html','/guia-hipotecaria.html','/comparador-hipotecario.html','/cuando-comprar-propiedad.html','/entorno-desarrollo-urbano.html','/inversion-inmobiliaria-empresas.html','/beneficios-tributarios-inmobiliarios.html','/trabaja-con-nosotros.html','/privacidad.html','/robots.txt','/sitemap.xml']
def check(path):
 url='https://sollahms.cl'+path
 with urlopen(Request(url,headers={'User-Agent':'SollahmsReleaseVerification/20261119'}),timeout=25) as response:
  body=response.read();assert response.status==200 and response.geturl()==url,path
  headers={k:response.headers.get(k) for k in ['Content-Type','Cache-Control','X-Robots-Tag']}
 expected=(STATIC/('index.html' if path=='/' else path.lstrip('/'))).read_bytes();assert body==expected,('Public bytes differ',path)
 assert not re.search(r'\b(noindex|nofollow|none)\b',headers['X-Robots-Tag'] or '',re.I),('Public indexing header',path)
 canonical=None
 if path=='/' or path.endswith('.html'):
  text=body.decode();link=re.search(r'<link\b[^>]*\brel=["\']canonical["\'][^>]*>',text,re.I);assert link,path
  canonical=re.search(r'\bhref=["\']([^"\']+)',link.group(0),re.I).group(1);assert canonical==url,path
  meta=re.findall(r'<meta\b[^>]*\bname=["\'](?:robots|googlebot|bingbot)["\'][^>]*>',text,re.I)
  assert all(not re.search(r'\b(noindex|nofollow|none)\b',m,re.I) for m in meta),('HTML indexing directive',path)
 if path=='/sitemap.xml':
  ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};rows=ElementTree.fromstring(body).findall('s:url',ns);assert len(rows)==144
  for entry in rows:
   if entry.findtext('s:loc',namespaces=ns) in ['https://sollahms.cl/','https://sollahms.cl/agenda-asesoria.html','https://sollahms.cl/contacto.html']:assert entry.findtext('s:lastmod',namespaces=ns)=='2026-11-19'
 if path=='/robots.txt':assert b'User-agent: OAI-SearchBot\nAllow: /' in body
 return {'path':path,'status':200,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'matchesCandidate':True,'canonical':canonical,'safeHeaders':headers,'passed':True}
with ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(check,paths))
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,request,fp,code,msg,headers,newurl):return None
try:
 with build_opener(NoRedirect).open(Request('https://www.sollahms.cl/',headers={'User-Agent':'SollahmsReleaseVerification/20261119'}),timeout=25):raise AssertionError('www must redirect')
except HTTPError as error:
 assert error.code==308 and error.headers.get('Location')=='https://sollahms.cl/'
 www={'status':308,'location':error.headers.get('Location')}
record={'verifiedAtUTC':datetime.now(timezone.utc).isoformat(),'timezone':'America/Santiago','deploymentId':'dpl_GCSXniYKZJdHgNbuW3fNtFqBt9Jn','sourceCommit':'d7ad0795a561a9b69999b421fd9eef519adfee26','corporateHTML':12,'resources':14,'matched':14,'passed':True,'rows':rows,'wwwRedirect':www,'realFormSubmissions':0,'applicationAPIsCalled':0,'providerSDKsLoaded':0,'limits':'Public delivery and indexability only; no crawler processing, engine inclusion, AI recommendation or commercial-result conclusion.'}
(DOC/'public-http-verification.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':True,'matched':14,'canonicals':12,'publicNoindex':False,'wwwRedirect':308,'formsSubmitted':0}))
