"""Reproduce individually reviewed map-only additions from cached provenance."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs/catalog-address-pins-20261026'
projects={p['slug']:p for p in json.loads((ROOT/'data/proyectos.json').read_text())}
registry=json.loads((ROOT/'data/project-locations.json').read_text())
geocodes=json.loads((DOCS/'structured-geocoding.json').read_text())
broker=json.loads((DOCS/'broker-location-evidence.json').read_text())
review={}
def add(slug,lat,lng,source,precision,note,site_address=None):
    p=projects[slug]
    entry={'status':'verified','lat':lat,'lng':lng,'address':p.get('direccion'),
           'commune':p['comuna'],'region':p.get('region'),'checkedOn':'2026-10-26',
           'source':source,'precision':precision,'corroboration':note}
    if site_address:entry['siteAddress']=site_address
    registry['locations'][slug]=entry;review[slug]=entry

# Explicitly reviewed number/street matches; no automatic first-result acceptance.
osm_choices={'edificio-indi':0,'edificio-suecia':0,'edificio-santo':0,
    'playa-serena':0,'jofre-135':0,'carmen-marin':1,'centenario-1':0,
    'curico-77':0,'san-ignacio':0,'angamos':0,'jardines-de-ramon-cruz':0}
for slug,index in osm_choices.items():
    result=geocodes[slug]['results'][index]
    assert result['address'].get('house_number')
    note='Calle y número documentados coinciden; punto de dirección de OpenStreetMap. Es una referencia del inmueble, sin precisión métrica garantizada.'
    if slug=='playa-serena':note+=' Se selecciona el edificio de departamentos, no los comercios del mismo número.'
    if slug=='centenario-1':note+=' Edificio Centenario identificado por nombre y número 1151; se descarta el punto de broker en otra comuna. La etiqueta administrativa de OSM difiere de la comuna comercial; no se modifica esta última.'
    if slug=='carmen-marin':note+=' Se descarta el homónimo de Maipú.'
    add(slug,float(result['lat']),float(result['lon']),f"https://www.openstreetmap.org/{result['osm_type']}/{result['osm_id']}",
        'building_center' if result['type']=='apartments' else 'address_estimate',note)

for slug,evidence in broker.items():
    add(slug,evidence['lat'],evidence['lng'],evidence['source'],'project_reference',evidence['review'],evidence.get('siteAddress'))

for slug,evidence in json.loads((DOCS/'additional-location-evidence.json').read_text()).items():
    add(slug,evidence['lat'],evidence['lng'],evidence['source'],'project_reference',evidence['review'])

add('reserva-mayor-2',-36.790843,-72.949394,
    'https://www.vesant.cl/proyectos/reserva-mayor-2','project_reference',
    'Coordenada propia de Vesant, clave coordenadas del proyecto Reserva Mayor 2; no se confunde con los puntos de interés cercanos. No requiere inventar una numeración postal.')
registry['checkedOn']='2026-10-26'
registry['precisionNote']='Ubicaciones referenciales del edificio o conjunto; el acceso puede variar. No se garantiza precisión métrica.'
(ROOT/'data/project-locations.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
(DOCS/'accepted-locations.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
pending=[{'slug':p['slug'],'project':p['nombre'],'address':p.get('direccion'),'commune':p['comuna']} for p in projects.values() if p['slug'] not in registry['locations']]
(DOCS/'pending-locations.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2)+'\n')
print({'total':len(projects),'mapped':len(registry['locations']),'new':len(review),'pending':len(pending)})
