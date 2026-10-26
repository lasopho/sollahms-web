/* Position-bound opacity: 5% at the edges, 100% in the reading zone.
   No transforms, timers, wrappers or hidden-by-default content. */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || !('IntersectionObserver' in window)) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const excluded = 'header,nav,aside,form,dialog,[role="dialog"],[role="status"],[role="alert"],[aria-live],[data-scroll-static],.advisory-panel,.workspace,.simulation-grid,.capacity-search,.source-section,.catalog-filters,#project-count,#catalog-message';
  const blocks = 'body.home-fluid-b2 main>section:nth-of-type(2)>div,.ci-identity,.ci-details,figure,.catalog-card,#portfolio .grid>div,.home-seo-steps>li,#expertise [class*="gap-y-16"]>div,.featured-intro,.spec-grid>div,.featured-facts .space-y-1,.amenity-list,.advisory-next>li,.journey,details';
  const text = 'h1,h2,h3,h4,p,blockquote,address';
  const ownership = new Map();
  const visible = new Set();
  const dirty = new Set();
  let groups = [], headers = [], frame = 0, recollect = false, disabled = false;
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const x = clamp(n); return x * x * (3 - 2 * x); };

  function opacityAt(rect, top, bottom) {
    const height = Math.max(1, bottom - top);
    // Wider ramps make the fade visible before content reaches either edge.
    // Keep the middle 35% fully opaque; tall groups retain their reading area.
    const entry = smooth((bottom - rect.top) / (height * .35));
    const exit = smooth((rect.bottom - top - 8) / Math.max(1, height * .30 - 8));
    return .05 + .95 * Math.min(entry, exit);
  }
  function viewport() {
    const visual = window.visualViewport;
    let top = visual ? visual.offsetTop : 0;
    const bottom = visual ? top + visual.height : window.innerHeight;
    const rects = headers.map(e => e.getBoundingClientRect()).sort((a,b) => a.top-b.top);
    for (const r of rects) {
      if (r.height && r.height < (bottom-top)*.5 && r.top <= top+1 && r.bottom > top) top = r.bottom;
    }
    return { top, bottom: Math.max(top+1,bottom) };
  }
  function unavailable(e) {
    return e.closest(excluded) || e.querySelector(excluded) ||
      e.closest('.s-scroll-presence') || e.querySelector('.s-scroll-presence');
  }
  function add(elements) {
    const roots = elements.filter(e => e && !unavailable(e));
    if (!roots.length) return;
    const group = { roots, opacity: null };
    groups.push(group); dirty.add(group);
    for (const e of roots) {
      e.classList.add('s-scroll-presence');
      ownership.set(e,group); observer.observe(e);
    }
  }
  function clear() {
    observer.disconnect();
    for (const e of ownership.keys()) {
      e.classList.remove('s-scroll-presence'); e.style.removeProperty('--s-presence');
    }
    ownership.clear(); visible.clear(); dirty.clear(); groups=[];
  }
  function collect() {
    clear();
    if (reduce.matches) return;
    headers=Array.from(document.querySelectorAll('header,nav')).filter(e =>
      ['fixed','sticky'].includes(getComputedStyle(e).position));
    // Coherent cards, title/location groups, figures and label/value pairs.
    for (const e of main.querySelectorAll(blocks)) {
      if (unavailable(e)) continue;
      if (e.matches('.amenity-list') && e.getBoundingClientRect().height > window.innerHeight*.55) {
        for (let i=0; i<e.children.length; i+=3) add(Array.from(e.children).slice(i,i+3));
      } else add([e]);
    }
    // Group headings and introductory copy without changing the layout DOM.
    for (const h of main.querySelectorAll('h1,h2,h3,h4')) {
      if (unavailable(h)) continue;
      const roots=[h], previous=h.previousElementSibling;
      if (previous && previous.matches('p,span') && previous.textContent.trim().length < 90 && !unavailable(previous)) roots.unshift(previous);
      let next=h.nextElementSibling;
      while (next && next.matches('p') && !unavailable(next)) {
        const a=roots[0].getBoundingClientRect(), b=next.getBoundingClientRect();
        if (b.bottom-a.top > window.innerHeight*.6) break;
        roots.push(next); next=next.nextElementSibling;
      }
      add(roots);
    }
    for (const e of main.querySelectorAll(text)) if (!unavailable(e)) add([e]);
    for (const e of main.querySelectorAll('img')) if (!unavailable(e)) add([e]);
  }
  function read(group, view, selection) {
    const active=document.activeElement;
    if (active && active!==document.body && active!==document.documentElement &&
        group.roots.some(e => e.contains(active) || active.contains(e))) return 1;
    if (selection && group.roots.some(e => selection.intersectsNode(e))) return 1;
    let top=Infinity, bottom=-Infinity;
    for (const e of group.roots) {
      const r=e.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      top=Math.min(top,r.top); bottom=Math.max(bottom,r.bottom);
    }
    return Number.isFinite(top) ? opacityAt({top,bottom},view.top,view.bottom) : 1;
  }
  function update() {
    frame=0;
    if (disabled) return;
    try {
      if (recollect) { recollect=false; collect(); }
      if (reduce.matches) { clear(); return; }
      const view=viewport();
      const selected=window.getSelection();
      const range=selected && !selected.isCollapsed && selected.rangeCount ? selected.getRangeAt(0) : null;
      const work=new Set(dirty);
      for (const e of visible) { const group=ownership.get(e); if (group) work.add(group); }
      // Geometry reads precede opacity writes; idle pages request no new frames.
      const values=Array.from(work,g=>[g,read(g,view,range).toFixed(3)]);
      dirty.clear();
      for (const [group,value] of values) {
        if (value===group.opacity) continue;
        group.opacity=value;
        for (const e of group.roots) e.style.setProperty('--s-presence',value);
      }
    } catch (_) { disabled=true; clear(); } // Fail open: keep everything visible.
  }
  function schedule() { if (!frame && !disabled) frame=window.requestAnimationFrame(update); }
  function refresh() { recollect=true; schedule(); }
  const observer=new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
      const group=ownership.get(entry.target); if (group) dirty.add(group);
    }
    schedule();
  },{rootMargin:'160px 0px',threshold:0});
  refresh();
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',refresh,{passive:true});
  window.addEventListener('pageshow',refresh);
  window.visualViewport?.addEventListener('resize',refresh,{passive:true});
  window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  document.addEventListener('focusin',schedule);
  document.addEventListener('focusout',schedule);
  document.addEventListener('selectionchange',schedule);
  main.addEventListener('load',schedule,true);
  main.addEventListener('toggle',schedule,true);
  reduce.addEventListener('change',refresh);
  document.fonts?.ready.then(refresh);
  const grid=document.getElementById('project-grid');
  if (grid) new MutationObserver(refresh).observe(grid,{childList:true});
})();
