from pathlib import Path
import json,sys
sys.path.insert(0,'scripts')
from project_location import apply_project_location
root=Path('.')
def read(p):return json.loads((root/p).read_text())
def write(p,x):(root/p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
projects=read('data/proyectos.json'); mirador=next(p for p in projects if p['slug']=='mirador-la-florida')
mirador['direccion']='Eugenia 8';mirador['mapQuery']='Eugenia 8, La Florida, Región Metropolitana, Chile'
mirador['addressVerification']['ownerConfirmed']=True
write('data/proyectos.json',projects)
research=read('data/fichas-proyectos.json');r=next(p for p in research if p['slug']==mirador['slug'])
for k in ['direccion','mapQuery','addressVerification']:r['updates'][k]=mirador[k]
r['addressVerification']=mirador['addressVerification']
r['pendingFields']=[p for p in r['pendingFields'] if not ('dirección postal completa' in p or 'sin numeración' in p)]
write('data/fichas-proyectos.json',research)
page=Path('mirador-la-florida.html').read_text()
page=page.replace('<p>Calle Eugenia, La Florida, Región Metropolitana</p>','<p>Eugenia 8, La Florida, Región Metropolitana</p>')
page=page.replace('<p class="missing-note">La numeración está pendiente de confirmación. Confirma el acceso antes de visitar.</p>','')
Path('mirador-la-florida.html').write_text(apply_project_location(page,mirador))
registry=read('data/project-locations.json')
records=[{
 'slug':'mirador-la-florida','lat':-33.5118008,'lng':-70.6099463,
 'source':'https://www.google.com/maps/place/Eugenia+8,+La+Florida,+Regi%C3%B3n+Metropolitana/@-33.5118008,-70.6099463,17z/data=!4m6!3m5!1s0x9662d071d5cc1b81:0x94161982506d1215!8m2!3d-33.5118008!4d-70.6099463!16s%2Fg%2F11mv_ydh3v',
 'precision':'address_reference',
 'corroboration':'El propietario confirma Eugenia 8 para Mirador La Florida. Sento identifica el proyecto en Calle Eugenia; la ficha pública de la dirección Eugenia 8 en Google Maps proporciona el punto seleccionado (!3d/!4d), consultado manualmente. No se utiliza el centro de la calle ni se atribuye a Sento una numeración que no publica.',
 'ownerConfirmed':True
 },{
 'slug':'marina-pacifico','lat':-29.9476744,'lng':-71.2898966,
 'source':'https://www.google.com/maps/place/Marina+Pac%C3%ADfico/@-29.9643728,-71.3227808,14z/data=!4m10!1m2!2m1!1sLos+Pescadores+5121,+Coquimbo,+Chile!3m6!1s0x9691c90071e5b55b:0x1051b26209fb8827!8m2!3d-29.9476744!4d-71.2898966!16s%2Fg%2F11mksvp_1r',
 'precision':'project_reference',
 'corroboration':'Euro y su brochure Marina Pacífico, páginas 1 y 2, confirman Av. Los Pescadores 5121 y sitúan el edificio detrás de Enjoy. Se contrasta con el lugar Marina Pacífico seleccionado manualmente en Google Maps (!3d/!4d). Se descartan el centro de cámara, el tramo genérico de Los Pescadores, otros edificios Marina y la sala de ventas de Costanera 5351.',
 'brochureSource':'https://euroinmobiliaria.cl/storage/62/Brochure-Marina-pacifico.pdf','brochurePages':[1,2]
 }]
for r in records:
 p=next(p for p in projects if p['slug']==r['slug']); entry={k:v for k,v in r.items() if k!='slug'}
 entry.update(status='verified',address=p['direccion'],commune=p['comuna'],region=p['region'],checkedOn='2026-10-26',addressSource=p['addressVerification']['source'])
 registry['locations'][r['slug']]=entry;registry['addressNotes'].pop(r['slug'],None)
write('data/project-locations.json',registry)
write('docs/final-two-map-locations-20261026/accepted-locations.json',{r['slug']:registry['locations'][r['slug']] for r in records})
v=read('vercel.json');v['git']['deploymentEnabled']['codex/final-two-map-locations-20261026']=False;write('vercel.json',v)
