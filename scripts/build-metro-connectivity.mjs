import fs from 'node:fs';
import {geographicMeters} from '../assets/js/metro-model.mjs';
import {locateProjects} from '../assets/js/catalog-map-model.mjs';
const load=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const projects=load('data/proyectos.json'),locations=load('data/project-locations.json'),network=load('data/metro-network.json');
if(network.schemaVersion!==1||!network.stations.length)throw Error('Metro source required');
const located=locateProjects(projects,locations),rows={};
for(const {project:p,location:l} of located.located){
 if(!/Metropolitana/i.test(p.region))continue;
 rows[p.slug]={status:'verified-geographic',address:p.direccion,commune:p.comuna,lat:l.lat,lng:l.lng,locationSource:l.source,checkedOn:network.checkedOn,walkingStatus:'pending-access-and-route',connections:network.stations.map(s=>({stationId:s.id,name:s.name,lines:s.lines,status:s.status,geographicM:Math.round(geographicMeters(l,s)),source:s.source,route:null})).filter(c=>c.geographicM<=5000).sort((a,b)=>a.geographicM-b.geographicM).filter((c,i)=>i===0||c.geographicM<=1000)};
}
const result={schemaVersion:1,checkedOn:network.checkedOn,method:'haversine-station-point',walkingAvailable:false,coverage:{catalogue:projects.length,geolocated:located.located.length,rm:projects.filter(p=>/Metropolitana/i.test(p.region)).length,associated:Object.keys(rows).length},projects:rows};
fs.writeFileSync(new URL('../data/project-metro.json',import.meta.url),JSON.stringify(result)+'\n');
console.log(JSON.stringify(result.coverage));
