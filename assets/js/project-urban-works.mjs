import {loadUrbanData,publicWorks,relationshipsFor,distanceLabel,statusLabel,safeSource} from './urban-works-model.mjs';
const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export async function showProjectUrbanWorks(){
  const host=document.getElementById('ubicacion');
  if(!host||document.getElementById('entorno-obras'))return;
  const slug=location.pathname.split('/').pop().replace(/\.html$/,'');
  try{
    const data=await loadUrbanData();
    const rows=publicWorks(data).flatMap(work=>relationshipsFor(data,work.id).filter(r=>r.projectSlug===slug).map(relation=>({work,relation}))).sort((a,b)=>a.relation.distanceM-b.relation.distanceM);
    if(!rows.length)return;
    const section=el('section');section.id='entorno-obras';section.className='urban-fiche';section.dataset.scrollStatic='';
    section.append(el('h3','Entorno y obras cercanas'));
    for(const {work,relation} of rows.slice(0,3)){
      const article=el('article');article.className='urban-fiche-card';
      article.append(el('h4',work.name));
      const badge=el('p',statusLabel(work.status)+(work.statusDetail?' · '+work.statusDetail:''));badge.className='urban-fiche-state';
      article.append(badge,el('p',distanceLabel(relation)),el('p',relation.benefit));
      if(work.estimatedEnd)article.append(el('p','Término estimado: '+work.estimatedEnd+'; sujeto a cambios.'));
      const detail=el('details'),summary=el('summary','Fuentes y aspectos a considerar');detail.append(summary);
      detail.append(el('p','Distancia geográfica calculada sobre coordenadas documentadas; no indica recorrido ni tiempo de viaje.'));
      for(const note of [...new Set([...work.cautions,...relation.cautions,...work.uncertainties])])detail.append(el('p',note));
      for(const source of work.sources){if(!safeSource(source.url))continue;const a=el('a',source.title+(source.date?' · '+source.date:''));a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';detail.append(a,el('br'));}
      if(work.geometrySource){const a=el('a','Fuente cartográfica: '+work.geometrySource.title);a.href=work.geometrySource.url;a.target='_blank';a.rel='noopener noreferrer';detail.append(a);}
      article.append(el('small','Información: '+work.informationDate+' · Revisión: '+work.reviewedOn));
      if(work.informationDateBasis)article.append(el('small',work.informationDateBasis));
      const first=work.sources[0];if(safeSource(first.url)){const source=el('a','Fuente: '+first.title);source.href=first.url;source.target='_blank';source.rel='noopener noreferrer';article.append(source);}
      article.append(detail);
      section.append(article);
    }
    const a=el('a','Explorar entorno y desarrollo urbano');a.href='/entorno-desarrollo-urbano.html?proyecto='+encodeURIComponent(slug);section.append(a);
    section.append(el('p','Estas obras pueden modificar el entorno; no garantizan una mayor valorización de la propiedad.'));
    const css=el('link');css.rel='stylesheet';css.href='/assets/css/urban-fiche.css';document.head.insertBefore(css,document.querySelector('link[href*="sollahms-theme.css"]'));
    host.append(section);
    if(location.hash==='#entorno-obras')section.scrollIntoView({block:'start',behavior:'instant'});
  }catch{/* Optional evidence must never block the existing location or quote flow. */}
}
