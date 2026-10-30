import {metroSummary} from './metro-model.mjs';
export async function showProjectMetro(){
 const slug=location.pathname.split('/').pop().replace(/\.html$/,'');if(!/^[a-z0-9-]+$/.test(slug))return;
 const host=document.getElementById('ubicacion');if(!host)return;
 try{const r=await fetch('/data/project-metro.json',{signal:AbortSignal.timeout(10000)});if(!r.ok)return;const data=await r.json(),row=data.projects?.[slug];if(!row)return;
 const text=metroSummary({_metro:row,direccion:row.address,comuna:row.commune});if(!text)return;
 const section=document.createElement('section');section.className='metro-project-note';section.dataset.scrollStatic='';section.setAttribute('aria-label','Cercanía geográfica al Metro');
 const title=document.createElement('h3');title.textContent='Metro cercano · distancia geográfica';
 const p=document.createElement('p');p.textContent=text.station+' · '+text.lines+' · '+text.distance;
 const note=document.createElement('small');note.textContent=text.note+' Fuente: IDE MINVU y Metro; revisión 30/10/2026.';
 const a=document.createElement('a');a.textContent='Explorar esta estación en el mapa';a.href='/proyectos.html?metro_red=current&metro_estacion='+encodeURIComponent(text.stationId)+'&metro_distancia=1000&vista=map';
 section.append(title,p,note,a);host.append(section);
 if(!document.querySelector('link[href="/assets/css/metro.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/assets/css/metro.css';document.head.insertBefore(css,document.querySelector('link[href*="sollahms-theme.css"]'));}
 }catch{/* Original location and maps remain available. */}
}
