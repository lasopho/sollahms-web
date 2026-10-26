"""Apply the reviewed six-project address decisions without commercial changes."""
from pathlib import Path
import json
from urllib.parse import quote_plus
from project_location import apply_project_location

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs/official-project-addresses-20261026'
records=json.loads((DOCS/'reviewed-addresses.json').read_text())
projects=json.loads((ROOT/'data/proyectos.json').read_text())
research=json.loads((ROOT/'data/fichas-proyectos.json').read_text())
locations=json.loads((ROOT/'data/project-locations.json').read_text())
accepted={}
for record in records:
    project=next(p for p in projects if p['slug']==record['slug'])
    fiche=next(p for p in research if p['slug']==record['slug'])
    path=ROOT/(record['slug']+'.html')
    page=path.read_text()
    if record['address']!=project['direccion']:
        old_address=project['direccion'];old_query=project['mapQuery']
        project['direccion']=record['address']
        project['mapQuery']=old_query.replace(old_address,record['address'])
        if old_address in project.get('descripcionLarga',''):
            project['descripcionLarga']=project['descripcionLarga'].replace(old_address,record['address'])
        page=page.replace(old_address,record['address']).replace(quote_plus(old_query),quote_plus(project['mapQuery']))
        for field in ['direccion','mapQuery','descripcionLarga']:
            if field in project:fiche['updates'][field]=project[field]
    evidence={k:record[k] for k in ['source','publisher','checkedOn']}
    if record.get('publicNote'):evidence['publicNote']=record['publicNote']
    project['addressVerification']=evidence
    fiche['addressVerification']=evidence
    fiche['updates']['addressVerification']=evidence
    path.write_text(apply_project_location(page,project))
    if record.get('point'):
        point=dict(record['point'],status='verified',address=project['direccion'],commune=project['comuna'],region=project.get('region'),checkedOn=record['checkedOn'],addressSource=record['source'])
        locations['locations'][project['slug']]=point;accepted[project['slug']]=point
    else:
        locations.setdefault('addressNotes',{})[project['slug']]=record['pendingReason']
locations['checkedOn']='2026-10-26'
locations['precisionNote']='Ubicaciones referenciales. Las referencias de esquina se identifican al seleccionar el proyecto; el acceso puede variar. No se garantiza precisión métrica.'
for name,data in [('data/proyectos.json',projects),('data/fichas-proyectos.json',research),('data/project-locations.json',locations)]:
    (ROOT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(DOCS/'accepted-locations.json').write_text(json.dumps(accepted,ensure_ascii=False,indent=2)+'\n')
pending=[{k:r[k] for k in ['slug','address','source','pendingReason']} for r in records if not r.get('point')]
(DOCS/'pending-locations.json').write_text(json.dumps(pending,ensure_ascii=False,indent=2)+'\n')
config=json.loads((ROOT/'vercel.json').read_text());config['git']['deploymentEnabled']['codex/official-project-addresses-20261026']=False
(ROOT/'vercel.json').write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n')
print({'reviewedFiches':len(records),'newLocations':len(accepted),'mapped':len(locations['locations']),'pending':len(pending)})
