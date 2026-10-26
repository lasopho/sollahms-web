import json,urllib.request,urllib.parse,pathlib,concurrent.futures,re,hashlib,html,time
from bs4 import BeautifulSoup
root=pathlib.Path('/workspace/scratch/2bf2025ce132/map-source'); cache=root.parent/'map-source-cache'
projects=json.loads((root/'data/proyectos.json').read_text()); sources={x['slug']:x for x in json.loads((root/'data/fichas-proyectos.json').read_text())}
def inspect(p):
 slug=p['slug'];url=sources[slug].get('sourceUrl');path=cache/(slug+'.html')
 if not url:return {'slug':slug,'status':'no-official-url'}
 try:
  if not path.exists():
   req=urllib.request.Request(url,headers={'User-Agent':'SollahmsCatalogueReview/1.0 (+https://sollahms.cl/contacto.html)'})
   path.write_bytes(urllib.request.urlopen(req,timeout=16).read())
  data=path.read_bytes();s=BeautifulSoup(data.decode(errors='replace'),'html.parser');points=[]
  for tag in s.select('iframe[src],a[href]'):
   u=tag.get('src') or tag.get('href') or ''; parsed=urllib.parse.urlparse(html.unescape(u));qs=urllib.parse.parse_qs(parsed.query)
   for key in ['q','ll','query','destination']:
    v=qs.get(key,[''])[0].strip()
    m=re.fullmatch(r'(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)',v)
    if m:
     lat,lon=map(float,m.groups())
     if -56<lat<-17 and -76<lon<-66:points.append({'lat':lat,'lng':lon,'selector':tag.name+'['+('src' if tag.name=='iframe' else 'href')+']','parameter':key,'provider':parsed.hostname,'context':tag.parent.get_text(' ',strip=True)[:220]})
  for script in s.select('script[type="application/ld+json"]'):
   try:
    obj=json.loads(script.string or script.text)
    def walk(v):
     if isinstance(v,dict):
      if 'latitude' in v and 'longitude' in v:
       lat,lon=float(v['latitude']),float(v['longitude'])
       if -56<lat<-17 and -76<lon<-66:points.append({'lat':lat,'lng':lon,'selector':'JSON-LD geo'})
      for a in v.values():walk(a)
     elif isinstance(v,list):
      for a in v:walk(a)
    walk(obj)
   except (ValueError,TypeError):pass
  return {'slug':slug,'source':url,'status':'read','sha256':hashlib.sha256(data).hexdigest(),'title':s.title.get_text() if s.title else '', 'points':points,'address':p.get('direccion'),'commune':p.get('comuna'),'region':p.get('region')}
 except Exception as e:return {'slug':slug,'source':url,'status':'unavailable','error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 results=[]
 for result in ex.map(inspect,projects):
  results.append(result)
  (cache/'official-audit.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
  print(json.dumps({'slug':result['slug'],'status':result['status'],'points':len(result.get('points',[]))}),flush=True)
