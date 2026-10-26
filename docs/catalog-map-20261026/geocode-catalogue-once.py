import json,urllib.request,urllib.parse,pathlib,hashlib,re,time,unicodedata
root=pathlib.Path('/workspace/scratch/2bf2025ce132/map-source');cache=root.parent/'map-source-cache'/'geocoding';cache.mkdir(exist_ok=True)
projects=json.loads((root/'data/proyectos.json').read_text()); results=[];used={};consecutive=0
for p in projects:
 address=p.get('direccion') or '';q=p.get('mapQuery')
 if not q or not re.search(r'\d',address):continue
 key=hashlib.sha256(q.encode()).hexdigest();file=cache/(key+'.json')
 if key in used:continue
 if file.exists():data=json.loads(file.read_text())
 else:
  url='https://nominatim.openstreetmap.org/search?'+urllib.parse.urlencode({'q':q,'format':'jsonv2','addressdetails':1,'countrycodes':'cl','limit':5})
  req=urllib.request.Request(url,headers={'User-Agent':'SollahmsCatalogueLocationReview/1.0 (+https://sollahms.cl/contacto.html)','Accept-Language':'es'})
  start=time.monotonic()
  try:
   response=urllib.request.urlopen(req,timeout=15);rows=json.loads(response.read());data={'query':q,'checkedOn':'2026-10-26','results':rows};consecutive=0
  except Exception as e:data={'query':q,'checkedOn':'2026-10-26','results':[],'error':str(e)};consecutive+=1
  file.write_text(json.dumps(data,ensure_ascii=False,indent=2))
  time.sleep(max(0,1.2-(time.monotonic()-start)))
 used[key]=True;results.append({'slug':p['slug'],'query':q,'file':key+'.json','results':len(data['results']),'error':data.get('error')})
 (cache/'index.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
 print(json.dumps(results[-1],ensure_ascii=False),flush=True)
 if consecutive>=10:print('Stopped after repeated service errors; cached progress preserved.',flush=True);break
