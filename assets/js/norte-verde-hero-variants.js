/* Presentation-only Preview modes. No data, text, storage or form mutations. */
(() => {
  const approved = new Set(['bordevivo','carmen-marin','edificio-ecuador','edif-origen-atacama-3008','edificio-dual-390-lto','edificio-lira-622','edificio-plaza-nova','edificio-san-francisco-1204','edificio-verne','irarrazaval','parque-panama','parque-quinta','playa-penuelas','playa-serena','quintavista','vicuna-mackenna-6896','vista-bulnes']);
  const slug = location.pathname.slice(1).replace(/\.html$/, '');
  if (!approved.has(slug)) return;
  const query = new URLSearchParams(location.search);
  const variant = query.get('encabezado');
  const valid = ['lateral','envolvente','contenida'].includes(variant);
  if (valid) document.documentElement.dataset.nvHeroVariant = variant;
  if (query.get('vista-encabezado') === '1') document.documentElement.dataset.nvHeroReview = '1';
  document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.nv-hero');
    if (!hero) return;
    hero.dataset.nvHeroSlug = slug;
    if (valid) hero.dataset.nvHeroVariant = variant;
    const photo = hero.querySelector('.hero-image');
    if (photo) {
      const updateRatio = () => {
        const width = Number(photo.getAttribute('width')) || photo.naturalWidth;
        const height = Number(photo.getAttribute('height')) || photo.naturalHeight;
        if (width > 0 && height > 0) hero.style.setProperty('--nv-photo-ratio', width / height);
      };
      updateRatio();
      photo.addEventListener('load', updateRatio, { once: true });
    }
    if (valid && photo) {
      photo.addEventListener('error', () => { hero.dataset.nvHeroImageUnavailable = '1'; });
      if (photo.complete && !photo.naturalWidth) hero.dataset.nvHeroImageUnavailable = '1';
    }
    const announce = () => {
      if (window.parent !== window && document.documentElement.dataset.nvHeroReview)
        window.parent.postMessage({ type: 'nv-hero-size', height: Math.ceil(hero.getBoundingClientRect().height) }, location.origin);
    };
    new ResizeObserver(announce).observe(hero);
    announce();
  }, { once: true });
})();
