/* Stronger reversible image movement. Opacity and gradients retain their existing owners. */
(() => {
  'use strict';
  const root = document.querySelector('main');
  if (!root || !('IntersectionObserver' in window)) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const contrast = matchMedia('(forced-colors: active)');
  const frames = new Set(root.querySelectorAll('.s-parallax-frame'));
  const near = new Set();
  const entries = new Map();
  const header = document.querySelector('header');
  let pending = 0, measure = true, failed = false;
  const clamp = (x, low, high) => Math.max(low, Math.min(high, x));

  function clear(image) {
    image.removeAttribute('data-parallax-active');
    image.style.removeProperty('--s-image-y');
    image.style.removeProperty('--s-image-scale');
  }
  function geometry(frame) {
    const image = frame.querySelector('img');
    if (!image?.complete || !image.naturalWidth) return null;
    const w = image.clientWidth, h = image.clientHeight;
    if (w < 80 || h < 80) return null;
    const style = getComputedStyle(image);
    const ratio = image.naturalWidth / image.naturalHeight;
    const fit = style.objectFit;
    const inkH = fit === 'cover' ? Math.max(h, w / ratio) : Math.min(h, w / ratio);
    if (style.transform !== 'none') return null;
    const mobile = window.innerWidth <= 680;
    const requested = mobile ? 18 : 36;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    // naturalWidth is density-corrected for responsive srcset; recover the selected
    // resource's pixel width from its w descriptor instead of treating it as a thumbnail.
    const selected = (image.getAttribute('srcset') || '').split(',').map(s => s.trim().split(/\s+/))
      .find(([url, size]) => /\d+w$/.test(size || '') && new URL(url, document.baseURI).href === image.currentSrc);
    const sourceWidth = selected ? parseInt(selected[1], 10) : image.naturalWidth;
    const resolution = Math.min(sourceWidth / w, sourceWidth / ratio / inkH) / pixelRatio;
    // Reuse an existing contain margin first: the whole photograph remains visible.
    // Otherwise reserve a fixed, modest crop; never animate zoom during scrolling.
    const letterbox = fit === 'contain' && h - inkH >= 8;
    const scale = letterbox ? 1 : Math.max(1, Math.min(mobile ? 1.12 : 1.16, resolution));
    const safeMargin = letterbox ? (h - inkH) / 2 : (Math.min(inkH, h) * scale - h) / 2;
    const amplitude = Math.min(requested, safeMargin - .5);
    if (amplitude < 2) return null;
    return { image, amplitude, scale };
  }
  function update() {
    pending = 0;
    if (failed) return;
    try {
      if (reduce.matches || contrast.matches) {
        frames.forEach(f => { const i = f.querySelector('img'); if (i) clear(i); });
        entries.clear(); measure = true; return;
      }
      const writes = [];
      const viewport = window.visualViewport?.height || window.innerHeight;
      const offset = window.visualViewport?.offsetTop || 0;
      const top = offset + Math.min(header?.getBoundingClientRect().height || 0, viewport * .25);
      const usable = Math.max(1, viewport + offset - top);
      for (const frame of near) {
        if (measure || !entries.has(frame)) entries.set(frame, geometry(frame));
        const item = entries.get(frame);
        if (!item) { const img = frame.querySelector('img'); if (img) writes.push(() => clear(img)); continue; }
        const r = frame.getBoundingClientRect();
        if (!r.height || !r.width) continue;
        const progress = clamp((top + usable / 2 - r.top - r.height / 2) / (usable * .2), -1, 1);
        // Direct position mapping: the same scroll position always yields the same image position.
        const y = progress * item.amplitude;
        writes.push(() => {
          item.image.setAttribute('data-parallax-active', '');
          item.image.style.setProperty('--s-image-scale', item.scale.toFixed(5));
          item.image.style.setProperty('--s-image-y', y.toFixed(3) + 'px');
        });
      }
      measure = false;
      writes.forEach(write => write());
    } catch (_) {
      failed = true;
      frames.forEach(f => { const i = f.querySelector('img'); if (i) clear(i); });
    }
  }
  function schedule() { if (!pending && !failed) pending = requestAnimationFrame(update); }
  function refresh() { measure = true; entries.clear(); schedule(); }
  const observer = new IntersectionObserver(records => {
    for (const record of records) {
      if (record.isIntersecting) near.add(record.target); else near.delete(record.target);
    }
    schedule();
  }, { rootMargin: '180px 0px', threshold: 0 });
  for (const frame of frames) {
    observer.observe(frame);
    frame.querySelector('img')?.addEventListener('load', refresh);
  }
  // Catalogue filtering replaces the cards. Release detached media and register only
  // the current representation; map markers and their controls never join this set.
  const catalogue = root.querySelector?.('#project-grid');
  if (catalogue && 'MutationObserver' in window) {
    new MutationObserver(() => {
      const current = new Set(root.querySelectorAll('.s-parallax-frame'));
      for (const frame of frames) if (!current.has(frame)) {
        observer.unobserve(frame); near.delete(frame); entries.delete(frame); frames.delete(frame);
      }
      for (const frame of current) if (!frames.has(frame)) {
        frames.add(frame); observer.observe(frame);
        frame.querySelector('img')?.addEventListener('load', refresh);
      }
      refresh();
    }).observe(catalogue, { childList: true });
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('pageshow', refresh);
  window.visualViewport?.addEventListener('resize', refresh, { passive: true });
  root.addEventListener('toggle', refresh, true);
  reduce.addEventListener('change', refresh);
  contrast.addEventListener('change', refresh);
  document.fonts?.ready.then(refresh);
})();
