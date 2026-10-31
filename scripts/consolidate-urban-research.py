"""Consolidate completed documentary batches; never mark unreviewed projects complete."""
import json
from pathlib import Path
from collections import Counter
R=Path(__file__).resolve().parents[1]
D=R/'docs/entorno-20261031'
read=lambda p:json.loads(p.read_text())
write=lambda p,x:p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
projects=read(R/'data/proyectos.json')
by_slug={p['slug']:p for p in projects}
coverage=[]
pending=[]
data=read(R/'data/urban-development.json')
works={w['id']:w for w in data['works']}
relations={(r['workId'],r['projectSlug']):r for r in data['relationships']}
for batch in ['south','regions','center','rmsouth','rmrest']:
 c=read(D/f'coverage-{batch}.json')
 assert c['reviewedOn']==data['cutoff'],batch
 for record in c['projects']:
  assert record['slug'] in by_slug,record['slug']
  assert record['outcome'] in ['reviewed_verified','reviewed_no_verified','location_blocked'],record
  assert record['queries'] and record['sources'] and record['rationale'] and record['locationReview'],record['slug']
  assert all(s.get('url','').startswith('https://') for s in record['sources']),record['slug']
  coverage.append({**record,'batch':batch,'reviewedOn':c['reviewedOn']})
 pack=read(D/f'candidate-{batch}.json')
 for w in pack['works']:
  if w['id'] in works and works[w['id']]!=w:
   raise ValueError('Explicit review needed for revised existing work: '+w['id'])
  works[w['id']]=w
 for r in pack['relationships']:
  key=(r['workId'],r['projectSlug'])
  if key in relations and relations[key]!=r:raise ValueError('Explicit review needed for relationship '+str(key))
  relations[key]=r
 pending.extend({'batch':batch,**p} if isinstance(p,dict) else {'batch':batch,'description':p} for p in pack['pending'])
counts=Counter(r['slug'] for r in coverage)
assert set(counts)==set(by_slug),{'missing':list(set(by_slug)-set(counts)),'extra':list(set(counts)-set(by_slug))}
assert all(n==1 for n in counts.values()),'Duplicate reviews'
location_audit=read(D/'location-review.json')
assert location_audit['total']==len(projects)
blocked=sorted(set(location_audit['blockedProjectSlugs'])|{r['slug'] for r in coverage if r['outcome']=='location_blocked'})
assert not any(r['projectSlug'] in blocked for r in relations.values()),'Blocked project has public relationship'
data['works']=list(works.values());data['relationships']=list(relations.values())
for row in coverage:
 p=by_slug[row['slug']]
 row.update(name=p['nombre'],region=p['region'],commune=p['comuna'])
 row['publishedWorkIds']=[r['workId'] for r in relations.values() if r['projectSlug']==row['slug']]
 row['outcome']='location_blocked' if row['slug'] in blocked else 'reviewed_verified' if row['publishedWorkIds'] else 'reviewed_no_verified'
coverage.sort(key=lambda x:(x['region'],x['commune'],x['name']))
summary={'totalProjects':len(projects),'reviewedProjects':len(coverage),'blockedProjectSlugs':blocked,'projectsWithRelationships':sum(bool(r['publishedWorkIds']) for r in coverage),'outcomes':dict(Counter(r['outcome'] for r in coverage)),'method':'Búsqueda documental por comuna y sector, evaluación individual de dirección y candidatos. No equivale a un inventario universal de inversiones ni a una inspección de terreno.'}
data['research']=summary
data['coverage']='Catálogo revisado documentalmente; asociaciones limitadas a evidencia territorial suficiente.'
write(R/'data/urban-development.json',data)
write(D/'catalog-coverage.json',{'cutoff':data['cutoff'],**summary,'projects':coverage,'pendingCandidates':pending})
labels={'reviewed_verified':'Con obras asociadas','reviewed_no_verified':'Sin asociación admitida','location_blocked':'Ubicación pendiente'}
lines=['# Cobertura documental del catálogo','', 'Corte: '+data['cutoff']+'. Cada fila corresponde a una revisión individual; no encontrar una asociación no acredita ausencia de inversiones.', '', '| Proyecto | Región / comuna | Resultado | Obras asociadas |', '| --- | --- | --- | --- |']
for r in coverage:
 lines.append('| '+r['name']+' | '+r['region']+' / '+r['commune']+' | '+labels[r['outcome']]+' | '+('; '.join(works[i]['name'] for i in r['publishedWorkIds']) or '—')+' |')
lines += ['', 'Consultas, fuentes, justificación individual y candidatos pendientes: [registro completo](catalog-coverage.json).']
(D/'COBERTURA.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(summary,ensure_ascii=False,indent=2))
