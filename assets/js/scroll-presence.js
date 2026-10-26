/* Shared, progressive scroll fade. Content remains visible without JavaScript. */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || !('IntersectionObserver' in window)) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const targets = new Set();
  const visible = new Set();
  const selector = 'h1,h2,h3,p,figure,.catalog-card,.spec-grid>div,.amenity-list>li,.home-seo-steps>li';
  const excluded = 'nav,aside,form,dialog,[role="dialog"],[role="status"],[role="alert"],[aria-live],.advisory-panel,.simulation-grid,.capacity-search,.source-section,[data-scroll-static]';
  let frame = 0;
  let refresh = false;
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };

  function paint(element) {
    if (reduce.matches) { element.style.removeProperty('--s-presence'); return; }
    const rect = element.getBoundingClientRect();
    const height = window.innerHeight;
    if (!rect.height || !height) return;
    // Fade only near the viewport edges; the reading area stays fully opaque.
    const entry = smooth((height - rect.top) / Math.min(120, height * .16));
    const exit = smooth((rect.bottom - 24) / Math.min(100, height * .13));
    const presence = .35 + .65 * Math.min(entry, exit);
    element.style.setProperty('--s-presence', presence.toFixed(3));
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
      paint(entry.target);
    }
  }, { rootMargin: '120px 0px', threshold: 0 });

  function collect() {
    for (const element of targets) {
      if (!element.isConnected) {
        observer.unobserve(element); targets.delete(element); visible.delete(element);
      }
    }
    for (const element of main.querySelectorAll(selector)) {
      if (targets.has(element) || element.closest(excluded)) continue;
      // Never multiply opacity through nested cards, captions or list items.
      if (element.parentElement.closest('.s-scroll-presence')) continue;
      element.classList.add('s-scroll-presence');
      targets.add(element);
      paint(element);
      observer.observe(element);
    }
  }

  function update() {
    frame = 0;
    if (refresh) { refresh = false; collect(); }
    if (reduce.matches) {
      for (const element of targets) element.style.removeProperty('--s-presence');
      return;
    }
    for (const element of visible) paint(element);
  }
  function schedule() { if (!frame) frame = window.requestAnimationFrame(update); }
  collect();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  reduce.addEventListener('change', schedule);
  // The catalogue renders and filters its cards after the initial HTML loads.
  const grid = document.getElementById('project-grid');
  if (grid) new MutationObserver(() => { refresh = true; schedule(); }).observe(grid, { childList: true });
})();
