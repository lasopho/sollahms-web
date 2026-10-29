import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {applyOutputRetirement} from '../scripts/apply-project-retirements.mjs';
import projects from '../data/proyectos.json' with {type:'json'};
import locations from '../data/project-locations.json' with {type:'json'};
import advisory from '../data/advisory-projects.json' with {type:'json'};
import {projects as booking} from '../lib/project-context.mjs';
import {filterAndSort} from '../assets/js/catalog-model.mjs';
import {locateProjects} from '../assets/js/catalog-map-model.mjs';

test('retirement applies to search, all map results and contact contexts, while Sudamericana remains',()=>{
  assert.equal(projects.length,131);
  assert.deepEqual(filterAndSort(projects,{search:'Patio Brasil'}),[]);
  assert.deepEqual(filterAndSort(projects,{search:'Sudamericana'}).map(p=>p.slug),['novo-catedral']);
  assert.ok(!Object.hasOwn(locations.locations,'patio-brasil'));
  assert.ok(!Object.hasOwn(advisory,'patio-brasil'));
  assert.ok(!Object.hasOwn(booking,'patio-brasil'));
  const map=locateProjects(projects,locations);
  assert.equal(map.located.length+map.pending.length,131);
  assert.ok(map.located.some(p=>p.project.slug==='novo-catedral'));
});

test('frozen output retirement preserves other server records and every existing route',t=>{
  const output=mkdtempSync(join(tmpdir(),'sollahms-retire-'));
  t.after(()=>rmSync(output,{recursive:true,force:true}));
  const put=(path,value)=>{const target=join(output,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,typeof value==='string'?value:JSON.stringify(value));};
  const routes=[{src:'/(.*)',headers:{'X-Existing':'preserved'},continue:true},{handle:'filesystem'},{src:'/api/contact',dest:'/api/contact'}];
  const config={version:3,routes,overrides:{'index.html':{path:''}}};
  // Different server facts prove the frozen catalogue is not replaced by public JSON.
  const remaining=projects.map(p=>({...p,serverOnlyFixture:'unchanged'}));
  put('config.json',config);put('static/data/proyectos.json',projects);put('static/410.html','Retirado');
  put('functions/api/contact.func/data/proyectos.json',[...remaining,{slug:'patio-brasil',nombre:'Patio Brasil',inmobiliaria:'Sudamericana',direccion:'Avenida Brasil 697'}]);
  const hashes=applyOutputRetirement(output);
  assert.equal(Object.keys(hashes).length,2);
  const actual=JSON.parse(readFileSync(join(output,'config.json')));
  assert.deepEqual({...actual,routes:actual.routes.slice(1)},config);
  const retired=actual.routes[0],pattern=new RegExp(retired.src);
  assert.equal(retired.status,410);assert.equal(retired.dest,'/410.html');
  for(const path of ['/patio-brasil','/patio-brasil/','/patio-brasil.html','/patio-brasil.html/'])assert.ok(pattern.test(path));
  for(const path of ['/novo-catedral.html','/proyectos.html','/api/contact','/patio-brasil-other.html'])assert.ok(!pattern.test(path));
  assert.deepEqual(JSON.parse(readFileSync(join(output,'functions/api/contact.func/data/proyectos.json'))),remaining);
});
