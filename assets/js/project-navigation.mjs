/** Progressive enhancement only: native anchors and the full menu work without JS. */
export function activeSection(positions, threshold) {
  let active=0;
  positions.forEach((top,index)=>{if(top<=threshold)active=index;});
  return active;
}

if(typeof document!=='undefined') {
  const nav=document.querySelector('[data-project-navigation]');
  if(nav) {
    const main=nav.closest('main'),header=document.querySelector('body>header'),scroller=nav.firstElementChild;
    const links=[...nav.querySelectorAll('a[href^="#"]')];
    const targets=links.map(link=>document.getElementById(link.hash.slice(1)));
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let scheduled=false,active=-1;
    const update=()=>{
      scheduled=false;
      const headerHeight=header?.getBoundingClientRect().height||0,navHeight=nav.getBoundingClientRect().height;
      main.style.setProperty('--pj-header-height',headerHeight+'px');
      main.style.setProperty('--pj-nav-height',navHeight+'px');
      const index=activeSection(targets.map(t=>t?.getBoundingClientRect().top??Infinity),headerHeight+navHeight+32);
      if(index===active)return;
      active=index;
      links.forEach((link,i)=>i===index?link.setAttribute('aria-current','location'):link.removeAttribute('aria-current'));
      const item=links[index]?.getBoundingClientRect(),viewport=scroller.getBoundingClientRect();
      if(item&&(item.left<viewport.left||item.right>viewport.right)) {
        const offset=item.left<viewport.left?item.left-viewport.left-16:item.right-viewport.right+16;
        scroller.scrollBy({left:offset,behavior:reduced.matches?'auto':'smooth'});
      }
    };
    const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}};
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('hashchange',schedule);
    if('ResizeObserver' in window){const observer=new ResizeObserver(schedule);observer.observe(nav);if(header)observer.observe(header);}
    update();
  }
}

// Optional central Metro facts: preserve native fiche navigation and all commercial content.
if(typeof document!=='undefined'){
 const locationSection=document.getElementById('ubicacion');
 if(locationSection&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();import('./project-metro.mjs').then(m=>m.showProjectMetro()).catch(()=>{});}},{rootMargin:'300px'});observer.observe(locationSection);}
}
