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
})();
