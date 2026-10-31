import json,pathlib,unicodedata
R=pathlib.Path(__file__).resolve().parents[1];D=R/'docs/metro-20261030'
def read(p):return json.loads(p.read_text())
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',s.lower()) if c.isalnum())
n=read(R/'data/metro-network.json');g=read(D/'osm-stations.geojson');by={norm(f['properties']['name']):f for f in g['features']};aliases={'metro-pac':'Presidente Pedro Aguirre Cerda','metro-la':'Unión Latinoamericana'};routes={};nodes={};geoms=[]
for line in ['L1','L2','L3','L4','L4A','L5','L6']:
 x=read(D/('osm-l1-route.json' if line=='L1' else f'osm-{line}-route.json'));es=x['elements'];ns={e['id']:e for e in es if e['type']=='node'};nodes.update(ns);rel=next(e for e in es if e['type']=='relation');assert rel['tags']['route']=='subway';assert rel['tags']['name'].startswith('Línea '+line[1:]+':');routes[line]=rel
 paths=[];ways={e['id']:e for e in es if e['type']=='way'}
 for m in rel['members']:
  if m['type']!='way' or m['role'] not in ('','forward','backward'):continue
  w=ways[m['ref']]
  if w.get('tags',{}).get('railway')!='subway':continue
  path=[[ns[i]['lon'],ns[i]['lat']] for i in w['nodes']];assert len(path)>1;paths.append(path)
 assert paths
 color=rel['tags'].get('colour',next(l['color'] for l in n['lines'] if l['id']==line))
 geoms.append({'id':line,'color':color,'paths':paths,'source':'https://www.openstreetmap.org/relation/'+str(rel['id'])})
for s in n['stations']:
 f=by.get(norm(aliases.get(s['id'],s['name'])))
 if f: s['lng'],s['lat']=f['geometry']['coordinates'];s['osmId']=f['id'];s['coordinateKind']='station-point';s['sourceDate']='2024-06-07'
 else:
  options=[e for e in nodes.values() if norm(e.get('tags',{}).get('name',''))==norm(s['name'])];assert options,s['name'];v=options[0];s['lat']=v['lat'];s['lng']=v['lon'];s['osmId']='node/'+str(v['id']);s['coordinateKind']='rail-stop-point';s['sourceDate']='2026-10-31'
 s['source']='openstreetmap';s['verifiedOn']='2026-10-31'
for l in n['lines']:l['source']='openstreetmap';l['color']=next(g['color'] for g in geoms if g['id']==l['id']);l['verifiedOn']='2026-10-31'
n['checkedOn']='2026-10-31';n['sources']=[{'id':'openstreetmap','url':'https://www.openstreetmap.org/copyright','license':'ODbL-1.0'},{'id':'stations-extract','url':'https://zenodo.org/records/11637462','date':'2024-06-07'},{'id':'official-names','url':'https://www.metro.cl/'}];n['attribution']='© OpenStreetMap contributors · ODbL 1.0. Coordenadas de estaciones: extracción OSM de junio de 2024, contrastada con la red oficial; trazados y puntos complementarios consultados el 31/10/2026. Sin afiliación con Metro.';n['reuseReview']='ODbL-1.0: atribución y datos derivados disponibles bajo la misma licencia';n['license']='https://opendatacommons.org/licenses/odbl/1-0/'
write(R/'data/metro-network.json',n);write(R/'data/metro-geometries.json',{'schemaVersion':1,'license':n['license'],'attribution':'© OpenStreetMap contributors','lines':geoms})
for p in [R/'proyectos.html',R/'assets/js/project-metro.mjs']:
 s=p.read_text().replace('IDE MINVU y Metro; revisión 30/10/2026','OpenStreetMap y Metro; revisión 31/10/2026').replace('coordenadas y trazados: IDE MINVU','coordenadas y trazados: OpenStreetMap (ODbL)').replace('https://geoide.minvu.cl/server2/rest/services/INFORMACION_EXTERNA/Metro/MapServer','https://www.openstreetmap.org/copyright').replace('>IDE MINVU<','>OpenStreetMap · ODbL<');p.write_text(s)
print({'stations':len(n['stations']),'lines':len(geoms),'paths':sum(len(g['paths']) for g in geoms)})
