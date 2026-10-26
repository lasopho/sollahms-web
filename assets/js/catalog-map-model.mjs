// Coordinates are admitted only from the separately reviewed location registry.
export const MAP_STATE_KEY='sollahmsCatalogMapV1';
export const validCoordinate=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=-56&&p.lat<=-17&&p.lng>=-76&&p.lng<=-66;
export function locateProjects(projects,registry){
  const located=[],pending=[];
  for(const project of projects){
    const location=registry.locations?.[project.slug];
    if(location?.status==='verified'&&validCoordinate(location)&&location.address===project.direccion&&location.commune===project.comuna)located.push({project,location});
    else pending.push(project);
  }
  return {located,pending};
}
export function locationGroups(located){
  const groups=new Map();
  for(const row of located){
    const key=row.location.lat+','+row.location.lng;
    if(!groups.has(key))groups.set(key,{lat:row.location.lat,lng:row.location.lng,rows:[]});
    groups.get(key).rows.push(row);
  }
  return [...groups.values()];
}
// Connected proximity groups in screen pixels. Individual coordinates never move.
export function clusterLocations(locations,project,radius=46){
  const points=locations.map(p=>project(p)),parents=locations.map((_,i)=>i);
  const root=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)if(Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)<radius)parents[root(j)]=root(i);
  const groups=new Map();
  locations.forEach((location,i)=>{const key=root(i);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(location);});
  return [...groups.values()];
}
export function validMapState(value){
  return !!value&&value.version===1&&validCoordinate(value)&&Number.isInteger(value.zoom)&&value.zoom>=4&&value.zoom<=19
    &&(value.selected===null||typeof value.selected==='string'&&/^[a-z0-9-]{1,100}$/.test(value.selected))
    &&Object.keys(value).length===5;
}
