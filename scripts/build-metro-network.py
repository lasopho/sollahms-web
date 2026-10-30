import json,unicodedata,re,math
from pathlib import Path
R=Path(__file__).resolve().parents[1]; D=R/'docs/metro-20261030'
def read(p):return json.loads(p.read_text())
def fold(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if not unicodedata.combining(c))
official=read(D/'metro-official-stations.json'); raw=read(D/'minvu-stations.json')['features']; lines=read(D/'minvu-lines.json')['features']
renames={'Unión Latinoamericana':'ULA','Moneda':'La Moneda','Cal y Canto':'Puente Cal y Canto','Vespucio':'Vespucio Norte','Irarrázabal':'Irarrázaval','Ricardo Cumming':'Cumming','Bellavista':'Bellavista de La Florida','Colón':'Cristóbal Colón','Bilbao':'Francisco Bilbao','Sótero del Río':'Hospital Sótero del Rio','Plaza Puente Alto':'Plaza de Puente Alto','Viduña Mackenna':'Vicuña Mackenna','Monseñor Eysaguirre':'Monseñor Eyzaguirre','Chile España':'Chile-España','Estación EFE':'Ferrocarril','Riquelme':'El Bosque','Lo Martínez':'Copa Lo Martinez'}
by={}
for o in official:
 name=re.sub(r' L3$','',o['name']);key=fold(name)
 by.setdefault(key,{'name':name,'lines':[],'officialIds':[]})
 by[key]['lines'].append('L'+o['group'].split()[-1].upper());by[key]['officialIds'].append(o['id'])
stations=[]
for f in raw:
 a=f['attributes'];name=renames.get(a['NOMBRE'],a['NOMBRE'])
 if name=='Las Torres' and f['geometry']['y']>-33.4:name='Lo Cruzat'
 v=by.get(fold(name))
 if not v:raise ValueError(name)
 s={'id':'metro-'+v['officialIds'][0].lower(),**v,'lat':round(f['geometry']['y'],6),'lng':round(f['geometry']['x'],6),'status':'operational','coordinateKind':'station-point','source':'minvu','verifiedOn':'2026-10-30'}
 stations.append(s)
assert len(stations)==126 and len(set(s['id'] for s in stations))==126
assert len({fold(s['name']) for s in stations})==126
network=[]
colors={'L1':'#FF0000','L2':'#E6E600','L3':'#732600','L4':'#002673','L4A':'#0070FF','L5':'#00A884','L6':'#E600A9'}
for line in colors:
 paths=[]
 for f in lines:
  if f['attributes']['name'].split(' - ')[0]=='Línea '+line[1:]:paths+=f['geometry']['paths']
 network.append({'id':line,'name':'Línea '+line[1:],'status':'operational','color':colors[line],'paths':paths,'source':'minvu','precision':'cartographic','verifiedOn':'2026-10-30'})
obj={'schemaVersion':1,'checkedOn':'2026-10-30','coverage':'126 ubicaciones de estaciones; 143 registros estación/línea, con combinaciones agrupadas.','method':'geographic','walkingAvailable':False,'sources':{'minvu':{'url':'https://geoide.minvu.cl/server2/rest/services/INFORMACION_EXTERNA/Metro/MapServer','note':'Puntos y geometrías consultados; nombres y operación contrastados con Metro. No son accesos peatonales.'},'metro':{'url':'https://www.metro.cl/','note':'Selector oficial de estaciones por línea, consultado 2026-10-30.'},'dtpm':{'url':'https://www.dtpm.cl/index.php/gtfs-vigente','note':'GTFS vigente desde 03/10/2026; descarga recuperada en el navegador, no incorporada como fuente geométrica.'}},'attribution':'Ubicaciones: IDE MINVU; nombres y líneas: Metro de Santiago. Trazados MINVU con identificadores OSM: © OpenStreetMap contributors, ODbL. Sin afiliación con Metro.','reuseReview':'El servicio MINVU no declara licencia específica. Confirmación de reutilización pendiente antes de producción; preview protegido para revisión. No se reproducen logos ni mapas esquemáticos de Metro.','stations':stations,'lines':network,'future':[{'id':'L7','name':'Línea 7','status':'construction','spatialStatus':'pending','source':'https://www.gob.cl/noticias/avances-linea-7-metro-santiago-nueva-estacion-parque-araucano/','checkedOn':'2026-10-30'},{'id':'L8','name':'Línea 8','status':'planned','spatialStatus':'pending','source':'https://www.bcn.cl/leychile/navegar?idNorma=1224602','checkedOn':'2026-10-30','note':'RCA favorable de mayo de 2026; no se infiere inicio de obras.'},{'id':'L9','name':'Línea 9','status':'construction','spatialStatus':'pending','source':'https://www.gob.cl/noticias/comienzo-obras-linea-9-metro-santiago-trayecto-inicio-operaciones/','checkedOn':'2026-10-30'}]}
(R/'data/metro-geometries.json').write_text(json.dumps({'schemaVersion':1,'lines':obj['lines']},ensure_ascii=False,separators=(',',':'))+'\n')
obj['lines']=[{k:v for k,v in l.items() if k!='paths'} for l in obj['lines']]
(R/'data/metro-network.json').write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n')
print(len(stations),sum(len(s['lines']) for s in stations),[(l['id'],len(l['paths'])) for l in network])
