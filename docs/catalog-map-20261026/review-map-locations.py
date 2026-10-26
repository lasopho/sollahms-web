from pathlib import Path
import json,re,unicodedata,hashlib,collections,math
root=Path('/workspace/scratch/2bf2025ce132/map-source');cache=root.parent/'map-source-cache';docs=root/'docs/catalog-map-20261026';projects=json.loads((root/'data/proyectos.json').read_text());sources={p['slug']:p for p in json.loads((root/'data/fichas-proyectos.json').read_text())};official={p['slug']:p for p in json.loads((cache/'official-audit.json').read_text())}
def norm(s):return re.sub(r'[^a-z0-9 ]','',unicodedata.normalize('NFKD',str(s).replace('´',"'").replace('’',"'")).encode('ascii','ignore').decode().lower())
def street(s):
 s=re.split(r'\b(?:esquina|esq)\b|,',norm(s))[0];s=re.sub(r'\b\d+\b',' ',s)
 return [t for t in s.split() if t not in ['calle','avenida','av','avda','pasaje','pje','n','no','numero','del','de','la','el','los','las','o']]
locations={};audit=[];known={norm(p['comuna']) for p in projects}|{'la granja','san ramon','san miguel','recoleta','lo prado','cerro navia','san pedro de la paz','talcahuano','hualpen'}
for p in projects:
 slug=p['slug'];o=official.get(slug,{});address=p.get('direccion');q=p.get('mapQuery');source=sources[slug];points=o.get('points',[]);chosen=None;reason='No se obtuvo un punto con dirección y comuna suficientemente verificadas.';evidence={}
 if len(points)==1:
  # Manually reviewed project-specific authored coordinates; never map camera centers or geocoder viewport centers.
  chosen=points[0];evidence={'method':'official-published-location','url':o['source'],'htmlSha256':o['sha256'],'selector':chosen['selector'],'parameter':chosen.get('parameter'),'coordinateEvidence':{'lat':chosen['lat'],'lng':chosen['lng']},'scope':'Ubicación publicada por la inmobiliaria para el proyecto/conjunto; no identifica la posición interior de una unidad.'}
 else:
  file=cache/'geocoding'/(hashlib.sha256(q.encode()).hexdigest()+'.json') if q else None
  if file and file.exists():
   geo=json.loads(file.read_text());nums=re.findall(r'\b\d+\b',address or '');number=str(int(nums[-1])) if nums else None;tokens=street(address);accepted=[]
   for row in geo['results']:
    a=row.get('address',{});n=a.get('house_number','');n=str(int(n)) if str(n).isdigit() else n
    commune=norm(p['comuna']);suburbs=[norm(a[k]) for k in ['suburb','city_district','town','municipality','village'] if a.get(k) and norm(a[k]) in known]
    cityok=(commune in suburbs) if suburbs else commune in [norm(v) for v in a.values()]
    road=street(a.get('road',''));streetok=bool(tokens) and all(t in road for t in tokens)
    if n==number and cityok and streetok and row.get('address',{}).get('country_code')=='cl':accepted.append(row)
   if slug=='independencia-4745':accepted=[r for r in accepted if norm(r.get('name'))=='edificio independencia 4745']
   if len(accepted)==1:
    row=accepted[0];chosen={'lat':float(row['lat']),'lng':float(row['lon'])};evidence={'method':'verified-address-geocode','url':'https://www.openstreetmap.org/'+row['osm_type']+'/'+str(row['osm_id']),'officialAddressSource':source.get('sourceUrl') or source.get('sourceDocument'), 'query':q,'responseSha256':hashlib.sha256(file.read_bytes()).hexdigest(),'addressMatched':row['address'],'resultName':row.get('name',''),'scope':'Número, calle y comuna coinciden con la dirección publicada. No se admite centro de comuna ni centro de calle.'}
   elif len(accepted)>1:reason='Más de una coincidencia de calle, número y comuna; coordenada pendiente de desambiguación.'
   elif geo.get('error'):reason='La consulta de ubicación no respondió; dirección conservada y coordenadas pendientes.'
  if not address:reason='Falta una dirección o coordenada exacta verificada para este proyecto.'
 if chosen:
  entry={'status':'verified','lat':chosen['lat'],'lng':chosen['lng'],'address':address,'commune':p['comuna'],'region':p.get('region'),'checkedOn':'2026-10-26','source':evidence.get('url')}
  locations[slug]=entry;audit.append({'slug':slug,'nombre':p['nombre'],'status':'verified',**entry,'evidence':evidence})
 else:audit.append({'slug':slug,'nombre':p['nombre'],'status':'pending','address':address,'commune':p['comuna'],'reason':reason,'source':source.get('sourceUrl')})
public={'version':1,'checkedOn':'2026-10-26','attribution':'Geocodificación parcial © OpenStreetMap contributors, ODbL 1.0; coordenadas oficiales según fuentes por proyecto.','locations':locations}
(root/'data/project-locations.json').write_text(json.dumps(public,ensure_ascii=False,indent=2)+'\n');(docs/'location-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'verified':len(locations),'pending':len(projects)-len(locations),'methods':collections.Counter(x.get('evidence',{}).get('method') for x in audit if x['status']=='verified'),'regions':collections.Counter(x['region'] for x in locations.values())},ensure_ascii=False))
for x in audit:
 if x['status']=='verified':print(x['slug'],x['lat'],x['lng'],x['evidence']['method'])
