"""GET-only delivery checks; authenticated technical host or public corporate URLs."""
import argparse, concurrent.futures, hashlib, json, re, subprocess
from pathlib import Path
from datetime import datetime, timezone
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError
from urllib.parse import urljoin
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parents[2]
DOC=Path(__file__).resolve().parent
PRIVATE=Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-identity-geo-20261125')
STATIC=PRIVATE/'candidate/.vercel/output/static'
CLI='/Users/luissandoval/.npm-global/bin/vercel'
ORIGIN='https://sollahms.cl'

def require(condition,message):
    if not condition: raise RuntimeError(message)

def technical(url):
    result=subprocess.run([CLI,'curl',url,'--scope','lsandoval2-8260s-projects','--',
        '--silent','--show-error','--max-time','40','--include','--request','GET',
        '--write-out','\nSOLLAHMS_HTTP_STATUS:%{http_code}'],cwd=PRIVATE/'candidate',capture_output=True,timeout=60)
    require(result.returncode==0,'Authenticated GET failed; raw output omitted')
    raw,code=result.stdout.rsplit(b'\nSOLLAHMS_HTTP_STATUS:',1)
    headers={}
    while raw.startswith(b'HTTP/'):
        separator=b'\r\n\r\n' if b'\r\n\r\n' in raw else b'\n\n'
        head,raw=raw.split(separator,1)
        for line in head.decode('latin1').splitlines()[1:]:
            if ':' in line:
                k,v=line.split(':',1)
                if k.lower() in ['content-type','x-robots-tag','cache-control','location']:headers[k.lower()]=v.strip()
    return int(code.strip()),raw,headers,url

def public(url):
    with urlopen(Request(url,headers={'User-Agent':'SollahmsIdentityReleaseVerification/1.0'}),timeout=35) as r:
        return r.status,r.read(),{k:r.headers.get(k) for k in ['content-type','x-robots-tag','cache-control','location']},r.geturl()

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--deployment-id',required=True);parser.add_argument('--source-sha',required=True)
    parser.add_argument('--technical-origin');parser.add_argument('--phase',choices=['staged','public'],required=True);a=parser.parse_args()
    scope=json.loads((ROOT/'docs/seo-measurement/scope-v3.json').read_text())
    paths=['/' if u==ORIGIN+'/' else u.removeprefix(ORIGIN) for u in scope['included_urls']]
    paths+=['/robots.txt','/sitemap.xml','/indexnow-ownership.txt','/assets/branding/sollahms-logo.svg']
    origin=a.technical_origin.rstrip('/') if a.phase=='staged' else ORIGIN
    require(origin.startswith('https://') and (a.phase=='public' or origin.endswith('.vercel.app')),'Unexpected origin')
    fetch=technical if a.phase=='staged' else public
    def check(p):
        url=origin+p;status,body,headers,final=fetch(url)
        expected=(STATIC/('index.html' if p=='/' else p.lstrip('/'))).read_bytes()
        require(status==200 and final==url,'HTTP status or redirect mismatch: '+p)
        require(body==expected,'Frozen candidate bytes mismatch: '+p)
        if a.phase=='public':require(not re.search(r'\b(noindex|nofollow|none)\b',headers.get('x-robots-tag') or '',re.I),'Public header noindex: '+p)
        canonical=None;graphs=0
        if p=='/' or p.endswith('.html'):
            text=body.decode();links=re.findall(r'<link\b(?=[^>]*\brel=["\']canonical["\'])[^>]*>',text,re.I)
            require(len(links)==1,'Canonical count: '+p);canonical=re.search(r'\bhref=["\']([^"\']+)',links[0],re.I)[1]
            require(canonical==ORIGIN+p,'Canonical differs: '+p)
            require(len(re.findall(r'<h1\b',text,re.I))==1,'H1 count: '+p)
            for meta in re.findall(r'<meta\b(?=[^>]*\bname=["\'](?:robots|googlebot|bingbot)["\'])[^>]*>',text,re.I):
                require(not re.search(r'\b(noindex|nofollow|none)\b',meta,re.I),'HTML noindex: '+p)
            for payload in re.findall(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',text,re.S):json.loads(payload);graphs+=1
        if p=='/robots.txt':require(b'User-agent: OAI-SearchBot\nAllow: /' in body,'Search bot permission lost')
        if p=='/sitemap.xml':
            ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};entries=ET.fromstring(body).findall('s:url',ns)
            require(len(entries)==144,'Sitemap URL count changed')
        return {'path':p,'status':status,'bytes':len(body),'sha256':hashlib.sha256(body).hexdigest(),'matchesCandidate':True,'canonical':canonical,'validJSONLDBlocks':graphs,'safeHeaders':headers,'passed':True}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(check,paths))
    redirects=[]
    if a.phase=='public':
        class NoRedirect(HTTPRedirectHandler):
            def redirect_request(self,*args):return None
        for url in ['https://www.sollahms.cl/','https://sollhams.cl/','https://sollahms.cl/index.html','http://sollahms.cl/']:
            try:
                build_opener(NoRedirect).open(Request(url,headers={'User-Agent':'SollahmsIdentityReleaseVerification/1.0'}),timeout=25)
                raise RuntimeError('Expected permanent redirect: '+url)
            except HTTPError as error:
                require(error.code==308 and urljoin(url,error.headers.get('Location') or '')==ORIGIN+'/','Redirect mismatch: '+url)
                redirects.append({'url':url,'status':error.code,'location':error.headers.get('Location'),'resolvedLocation':urljoin(url,error.headers.get('Location') or '')})
    report={'observedAtUTC':datetime.now(timezone.utc).isoformat(),'phase':a.phase,'deploymentId':a.deployment_id,'sourceCommit':a.source_sha,'passed':True,'corporateURLs':12,'checked':len(rows),'rows':rows,'redirects':redirects,'formsSubmitted':0,'applicationAPIsCalled':0,'SDKsExecuted':0,'protectionChanged':False,'rawAuthenticatedBodiesOrHeadersStored':False,'limit':'Delivery and indexability only; no proof of crawl, indexing, AI citation, ranking or commercial results.'}
    (DOC/(a.phase+'-http.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'passed':True,'phase':a.phase,'checked':len(rows),'canonicals':12,'redirects':len(redirects)}))
if __name__=='__main__':main()
