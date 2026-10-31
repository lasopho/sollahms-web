import fs from 'node:fs';
import assert from 'node:assert/strict';
import {publicWorks,relationshipsFor,distanceLabel} from '../assets/js/urban-works-model.mjs';
const dir='docs/entorno-ronda4-20261031/';
const read=p=>JSON.parse(fs.readFileSync(p));
const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const base=read(dir+'baseline-data.json'),data=structuredClone(base),coverage=read(dir+'baseline-coverage.json');
const works=new Map(data.works.map(w=>[w.id,w]));
const rels=new Map(data.relationships.map(r=>[r.workId+':'+r.projectSlug,r]));
const updatedIds=new Set(),newIds=new Set(),addedRelations=[],reviews=[];
for(const name of ['root','rmrest','south']){
 const batch=read(dir+name+'.json');
 if(batch.locationVerifications){data.research.locationVerifications=batch.locationVerifications;data.research.blockedProjectSlugs=data.research.blockedProjectSlugs.filter(s=>!batch.locationVerifications.some(v=>v.projectSlug===s));}
 for(const w of batch.updatedWorks){assert.ok(works.has(w.id),'Update unknown '+w.id);assert.ok(!updatedIds.has(w.id),'Conflicting work review '+w.id);updatedIds.add(w.id);works.set(w.id,w);}
 for(const w of batch.newWorks){assert.ok(!works.has(w.id),'Duplicate work '+w.id);newIds.add(w.id);works.set(w.id,w);}
 for(const r of batch.relationships){const key=r.workId+':'+r.projectSlug;assert.ok(!rels.has(key),'Duplicate relationship '+key);rels.set(key,r);addedRelations.push(r);}
 reviews.push({batch:name,resolvedPendingIds:batch.resolvedPendingIds,stillPending:batch.stillPending});
}
data.works=[...works.values()];data.relationships=[...rels.values()];
const projects=read('data/proyectos.json'),locations=read('data/project-locations.json');
const runtime={...data,projects,locations};
assert.equal(publicWorks(runtime).length,data.works.length,'Every intended work admitted');
const published=publicWorks(runtime).flatMap(w=>relationshipsFor(runtime,w.id));
assert.equal(published.length,data.relationships.length,'No rejected relationship');
for(const row of coverage.projects){
 row.publishedWorkIds=published.filter(r=>r.projectSlug===row.slug).map(r=>r.workId);
 const verification=data.research.locationVerifications?.find(v=>v.projectSlug===row.slug);if(verification)row.locationReview={...row.locationReview,additionalVerification:verification};
 row.outcome=data.research.blockedProjectSlugs.includes(row.slug)?'location_blocked':row.publishedWorkIds.length?'reviewed_verified':'reviewed_no_verified';
 const additional=addedRelations.filter(r=>r.projectSlug===row.slug).map(r=>r.workId);
 if(additional.length){
  row.supplementaryReview={reviewedOn:data.cutoff,addedWorkIds:additional,sources:additional.flatMap(id=>works.get(id).sources),rationale:addedRelations.filter(r=>r.projectSlug===row.slug).map(r=>r.rationale)};
 }
}
const outcomes={};coverage.projects.forEach(p=>outcomes[p.outcome]=(outcomes[p.outcome]||0)+1);
coverage.outcomes=outcomes;coverage.projectsWithRelationships=outcomes.reviewed_verified;
coverage.supplementaryReviews=reviews;
data.research.projectsWithRelationships=outcomes.reviewed_verified;data.research.outcomes=outcomes;
data.research.supplementaryReview='2026-10-31: fuentes adicionales, coordenadas y asociaciones; ver docs/entorno-ronda4-20261031.';
write('data/urban-development.json',data);write('docs/entorno-20261031/catalog-coverage.json',coverage);
const before=new Set(base.relationships.map(r=>r.projectSlug));
const summary={cutoff:data.cutoff,baseWorks:base.works.length,works:data.works.length,baseRelationships:base.relationships.length,relationships:data.relationships.length,baseProjects:before.size,projects:outcomes.reviewed_verified,newProjectSlugs:[...new Set(addedRelations.map(r=>r.projectSlug))].filter(s=>!before.has(s)),updatedWorkIds:[...updatedIds],newWorkIds:[...newIds],addedRelationships:addedRelations.map(r=>({...r,distance:distanceLabel(published.find(p=>p.workId===r.workId&&p.projectSlug===r.projectSlug))})),reviews};
write(dir+'summary.json',summary);console.log(JSON.stringify({works:summary.works,relationships:summary.relationships,projects:summary.projects,newProjects:summary.newProjectSlugs.length}));
const lines=['# Ampliación de evidencia de entorno','',`Corte: ${data.cutoff}. Preparada para revisión; producción sin cambios.`, '',`Resultado: ${summary.works} obras (${newIds.size} nuevas), ${summary.relationships} relaciones (${addedRelations.length} nuevas) y ${summary.projects} proyectos con asociaciones (${summary.newProjectSlugs.length} adicionales).`, '', '## Relaciones incorporadas', '', '| Proyecto | Obra | Distancia y referencia |','| --- | --- | --- |'];
for(const r of summary.addedRelationships)lines.push(`| ${projects.find(p=>p.slug===r.projectSlug).nombre} | ${works.get(r.workId).name} | ${r.distance} |`);
lines.push('', '## Fuentes adicionales y alcance', '');
for(const id of [...updatedIds,...newIds]){
 const w=works.get(id);lines.push('### '+w.name,'',w.statusDetail||w.description,'');
 for(const s of w.sources)lines.push(`- [${s.title}](${s.url}) — ${s.date||'sin fecha editorial'}.`);
 if(w.geometrySource)lines.push(`- Cartografía: [${w.geometrySource.title}](${w.geometrySource.url}). ${w.geometryLabel}.`);
 lines.push('',...w.uncertainties.map(s=>'- '+s),'');
}
lines.push('## Candidatos no incorporados','', 'Los seis archivos de investigación de esta carpeta conservan las búsquedas, nuevas fuentes y motivos de exclusión. No se han inventado accesos de Metro ni declarado operativos recintos con autorizaciones pendientes. Las geometrías de recintos, tramos o puntos de referencia no son recorridos peatonales ni tiempos de viaje.', '', 'La revisión de los 131 proyectos permanece completa como ciclo documental; no representa un inventario universal de inversiones. Se mantienen los tres bloqueos de ubicación restantes y los datos comerciales originales.', '', 'Vista previa y comprobaciones: [ENTREGA.md](ENTREGA.md).');
fs.writeFileSync(dir+'README.md',lines.join('\n')+'\n');
write('docs/entorno-20261031/verified-relationships.json',published);
const coverageLines=['# Cobertura documental del catálogo','','Corte: 2026-10-31. Incluye ampliación en revisión; producción conserva la versión anterior. La revisión no garantiza identificar todas las inversiones.','','| Proyecto | Región / comuna | Resultado | Obras asociadas |','| --- | --- | --- | --- |'];
for(const row of coverage.projects){const p=projects.find(p=>p.slug===row.slug);coverageLines.push(`| ${p.nombre} | ${row.region} / ${row.commune} | ${row.outcome==='location_blocked'?'Ubicación pendiente':row.publishedWorkIds.length?'Con obras asociadas':'Sin asociación admitida'} | ${row.publishedWorkIds.map(id=>works.get(id).name).join('; ')||'—'} |`)}
fs.writeFileSync('docs/entorno-20261031/COBERTURA.md',coverageLines.join('\n')+'\n');
