import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import projects from '../data/proyectos.json' with {type:'json'};
import registry from '../data/project-locations.json' with {type:'json'};
import {locateProjects,locationGroups,clusterLocations,validMapState} from '../assets/js/catalog-map-model.mjs';
import {filterAndSort,validView} from '../assets/js/catalog-model.mjs';

test('mapping never drops or duplicates a catalogue record; every admitted point matches its source identity',()=>{
 const result=locateProjects(projects,registry);assert.equal(result.located.length+result.pending.length,131);
 assert.equal(new Set([...result.located.map(x=>x.project.slug),...result.pending.map(x=>x.slug)]).size,131);
 assert.ok(result.located.length>20);for(const row of result.located){assert.equal(row.location.status,'verified');assert.equal(row.project.direccion,row.location.address);assert.equal(row.project.comuna,row.location.commune);assert.ok(row.location.source.startsWith('https://'));}
 const fake={locations:{[projects[0].slug]:{status:'verified',lat:-33,lng:-70,address:'different',commune:projects[0].comuna}}};assert.equal(locateProjects([projects[0]],fake).located.length,0);
});
test('same-coordinate towers stay at one true point and remain individually selectable',()=>{
 const same=locationGroups(locateProjects(projects.filter(p=>p.slug.startsWith('costanera-coquimbo-')),registry).located);
 assert.equal(same.length,1);assert.equal(same[0].rows.length,2);assert.equal(same[0].lat,-29.958124);assert.equal(same[0].lng,-71.3109755);
 assert.deepEqual(same[0].rows.map(r=>r.project.slug),['costanera-coquimbo-a','costanera-coquimbo-b']);
});
test('screen clustering combines near points at a wide view, separates on zoom and never mutates their coordinates',()=>{
 const locations=[{lat:1,lng:1,rows:['a']},{lat:1.02,lng:1.02,rows:['b']},{lat:5,lng:5,rows:['c']}],before=JSON.stringify(locations);
 assert.equal(clusterLocations(locations,p=>({x:p.lng*100,y:p.lat*100})).length,2);
 assert.equal(clusterLocations(locations,p=>({x:p.lng*10000,y:p.lat*10000})).length,3);
 assert.equal(JSON.stringify(locations),before);
});
test('map filters and ordering are the same exact catalogue result set',()=>{
 for(const filters of [{search:'Coquimbo'},{commune:'Santiago',maxPriceInput:'3000',sortOrder:'price-asc'},{search:'zz-no-results'},{assetType:'Comercial',sortOrder:'price-desc'}]){
  const filtered=filterAndSort(projects,filters),result=locateProjects(filtered,registry);
  assert.equal(result.located.length+result.pending.length,filtered.length);
  assert.deepEqual(result.located.map(r=>r.project.slug),filtered.filter(p=>registry.locations[p.slug]).map(p=>p.slug));
 }
 assert.equal(validView('map'),true);
});
test('return map state accepts only finite coordinates, zoom and a public project slug',()=>{
 const good={version:1,lat:-33.44,lng:-70.65,zoom:14,selected:'distrito-centro'};assert.equal(validMapState(good),true);
 for(const bad of [{...good,lat:NaN},{...good,lat:35},{...good,zoom:99},{...good,selected:'name@example.com'},{...good,income:2000000}])assert.equal(validMapState(bad),false);
});
test('map code keeps provider access lazy and separate from forms, scrolling and static fallbacks',()=>{
 const html=fs.readFileSync(new URL('../proyectos.html',import.meta.url),'utf8'),ui=fs.readFileSync(new URL('../assets/js/catalog.mjs',import.meta.url),'utf8'),map=fs.readFileSync(new URL('../assets/js/catalog-map.mjs',import.meta.url),'utf8');
 assert.ok(!/<script[^>]+leaflet|<link[^>]+leaflet|tile\.openstreetmap/.test(html));assert.match(ui,/import\('\.\/catalog-map\.mjs(?:\?[^']+)?'\)/);
 assert.ok(html.includes('id="catalog-map" class="catalog-map" data-scroll-static=""'));assert.ok(map.includes('scrollWheelZoom:false'));assert.ok(map.includes('touchZoom:false'));assert.ok(map.includes('keepBuffer:0'));
 assert.ok(!/navigator\.geolocation|nominatim\.openstreetmap|api\/(advisory|contact)/.test(map));assert.ok(ui.includes('Continuar en Listado'));assert.ok(map.includes("tiles.on('tileerror'"));
 assert.ok(!/map\.on\(['"](?:move|moveend)['"].*fitAll/.test(map));
});
