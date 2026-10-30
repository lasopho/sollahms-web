const el=(t,text)=>{const e=document.createElement(t);if(text)e.textContent=text;return e;};
export async function addMetroLayers({L,map,host,projectsLayer,onStation}){
 const response=await fetch('/data/metro-network.json',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('metro layers');const network=await response.json();
 const group=el('details'),summary=el('summary','Capas del mapa · Metro');group.className='metro-map-layers';group.dataset.scrollStatic='';group.append(summary);
 const lines=L.layerGroup(),stations=L.layerGroup();let geometryLoaded=false;
 const notice=el('p');notice.className='metro-note';notice.setAttribute('role','status');
 const addControl=(text,checked,onchange)=>{const label=el('label'),input=el('input');input.type='checkbox';input.checked=checked;label.append(input,document.createTextNode(text));group.append(label);input.addEventListener('change',()=>onchange(input.checked));return input;};
 addControl('Proyectos',true,v=>v?projectsLayer.addTo(map):map.removeLayer(projectsLayer));
 addControl('Estaciones actuales',false,v=>{if(v){stations.addTo(map);notice.textContent=map.getZoom()<11?'Acércate para distinguir las estaciones.':'';}else map.removeLayer(stations);});
 const lineControl=addControl('Líneas actuales',false,async v=>{if(!v){map.removeLayer(lines);return;}try{if(!geometryLoaded){notice.textContent='Cargando trazados…';const r=await fetch('/data/metro-geometries.json',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('geometry');const data=await r.json();for(const l of data.lines)L.polyline(l.paths.map(path=>path.map(([lng,lat])=>[lat,lng])),{color:l.color,weight:3,opacity:.7,interactive:false}).addTo(lines);geometryLoaded=true;}if(lineControl.checked)lines.addTo(map);notice.textContent='Trazados cartográficos; no indican recorridos peatonales.';}catch{lineControl.checked=false;notice.textContent='Los trazados no pudieron cargar. Los proyectos siguen disponibles.';}});
 for(const name of ['Estaciones futuras · pendientes','Líneas futuras · pendientes']){const input=addControl(name,false,()=>{});input.disabled=true;}
 for(const s of network.stations){const icon=L.divIcon({className:'metro-station-marker',html:'<span aria-hidden="true">M</span>',iconSize:[24,24],iconAnchor:[12,12]});const marker=L.marker([s.lat,s.lng],{icon,title:s.name+' · '+s.lines.join('/'),keyboard:true,zIndexOffset:-500});const body=el('div');body.append(el('strong',s.name),el('p',s.lines.join(' / ')),el('p','Punto de estación; acceso peatonal no verificado.'));const b=el('button','Buscar proyectos cerca de esta estación');b.type='button';b.className='catalog-map-button';b.addEventListener('click',()=>onStation(s.id));body.append(b);marker.bindPopup(body,{autoPan:false});marker.addTo(stations);}
 const legend=el('p','● Proyecto  ·  M Estación actual. Las combinaciones se agrupan en una ubicación.');legend.className='metro-note';group.append(legend,notice);
 const sources=el('p',network.attribution);sources.className='metro-note';group.append(sources);host.append(group);
 return {update(){}};
}
