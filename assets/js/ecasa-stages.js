// Preserve the context of former stage URLs using native disclosure controls.
(() => {
  const reveal = () => {
    if (!/^#etapa-[123]$/.test(location.hash)) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    if (target.tagName === 'DETAILS') target.open = true;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  };
  addEventListener('hashchange', reveal);
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', reveal, { once: true });
  else reveal();
})();
