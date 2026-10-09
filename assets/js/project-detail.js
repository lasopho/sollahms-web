(() => {
    const button = document.querySelector('.menu-toggle');
    const menu = document.getElementById('mobile-menu');
    const close = () => {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Abrir menú de navegación');
    };
    button?.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        menu.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
        button.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    });
    menu?.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && button?.getAttribute('aria-expanded') === 'true') {
            close();
            button.focus();
        }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 900 && button) close(); });
    // Only load third-party content when the visitor chooses to open it.
    document.querySelectorAll('[data-embed-src]').forEach(loader => {
        loader.addEventListener('click', () => {
            const url = new URL(loader.dataset.embedSrc);
            if (url.protocol !== 'https:' || !['my.matterport.com', 'www.google.com', 'www.youtube.com', 'player.vimeo.com'].includes(url.hostname)) return;
            const frame = document.createElement('iframe');
            frame.src = url.href;
            frame.title = loader.dataset.embedTitle;
            frame.allow = 'fullscreen; xr-spatial-tracking; gyroscope; accelerometer';
            frame.allowFullscreen = true;
            frame.referrerPolicy = 'strict-origin-when-cross-origin';
            const shell = loader.parentElement;
            shell.replaceChildren(frame);
            frame.focus();
        });
    });
})();
