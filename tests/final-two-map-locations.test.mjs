import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {locateProjects} from '../assets/js/catalog-map-model.mjs';
import {beforeFinalLocations,beforeFinalLocationHtml} from './helpers/final-location-baseline.mjs';
const base='96eefe1bcb437816a4d47e0a4b7378b1d108c640';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const old=p=>execFileSync('git',['show',base+':'+p],{encoding:'utf8'});
const projects=read('data/proyectos.json'),registry=read('data/project-locations.json');
test('132 verified, unique map records cover the entire unchanged catalogue',()=>{
 const result=locateProjects(projects,registry);assert.equal(result.located.length,132);assert.equal(result.pending.length,0);
 assert.equal(new Set(result.located.map(r=>r.project.slug)).size,132);
 assert.deepEqual(Object.keys(registry.locations).sort(),projects.map(p=>p.slug).sort());
 assert.deepEqual(beforeFinalLocations(projects),JSON.parse(old('data/proyectos.json')));
 for(const [slug,point] of Object.entries(JSON.parse(old('data/project-locations.json')).locations))assert.deepEqual(registry.locations[slug],point);
});
test('selected-place coordinates match reviewed addresses, not camera or street centers',()=>{
 const accepted=read('docs/final-two-map-locations-20261026/accepted-locations.json');
 for(const [slug,point] of Object.entries(accepted)){
  assert.deepEqual(registry.locations[slug],point);
  assert.ok(point.source.includes('!3d'+point.lat+'!4d'+point.lng));
  assert.equal(point.address,projects.find(p=>p.slug===slug).direccion);
 }
 assert.equal(accepted['mirador-la-florida'].address,'Eugenia 8');
 assert.equal(accepted['marina-pacifico'].address,'Av. Los Pescadores 5121');
 assert.notEqual(accepted['marina-pacifico'].lng,-71.3005397);
 assert.deepEqual(registry.addressNotes,{});
});
test('fiches preserve media, forms, SEO and commercial information with only Mirador address corrected',()=>{
 for(const project of projects){const page=fs.readFileSync(project.slug+'.html','utf8');assert.equal(beforeFinalLocationHtml(page,project.slug),old(project.slug+'.html'),project.slug);}
 const page=fs.readFileSync('mirador-la-florida.html','utf8');
 assert.match(page,/Dirección confirmada por Sollahms/);assert.doesNotMatch(page,/numeración está pendiente/);
});
test('Sento regeneration keeps the owner-confirmed address and removes obsolete uncertainty',()=>{
 execFileSync('python',['-c',`import ast,copy,json,sys;from pathlib import Path
sys.path.insert(0,'scripts');from sento_fiche import commercial_map_note
source=Path('scripts/apply-sento.py').read_text();tree=ast.parse(source)
# Exercise the actual generator address branch without regenerating historical commercial records.
main=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='main')
loop=next(n for n in main.body if isinstance(n,ast.For) and ast.unparse(n.target)=='record')
branch=next(n for n in loop.body if isinstance(n,ast.If) and ast.unparse(n.test)=='slug in approved_addresses')
p=next(p for p in json.loads(Path('data/proyectos.json').read_text()) if p['slug']=='mirador-la-florida')
r={'slug':p['slug'],'location':{},'pending':['Página actual publica únicamente Calle Eugenia, La Florida, sin numeración; no inventar número.','Conservar otros pendientes']}
ns={'slug':p['slug'],'record':r,'approved_addresses':{p['slug']:p}}
exec(compile(ast.Module(body=[branch],type_ignores=[]),'generator-address','exec'),ns)
assert r['location']['address']=='Eugenia 8';assert r['pending']==['Conservar otros pendientes']
assert 'sin numeración' not in commercial_map_note(r)
`]);
});
