(() => {
    const permittedHosts = new Set(JSON.parse(document.getElementById('project-embed-hosts')?.textContent || '[]'));
    document.querySelectorAll('[data-embed-src]').forEach(loader => {
        loader.addEventListener('click', () => {
            const url = new URL(loader.dataset.embedSrc);
            if (url.protocol !== 'https:' || !permittedHosts.has(url.hostname)) return;
            const frame = document.createElement('iframe');
            frame.src = url.href;
            frame.title = loader.dataset.embedTitle;
            frame.allow = 'fullscreen; xr-spatial-tracking; gyroscope; accelerometer';
            frame.allowFullscreen = true;
            frame.referrerPolicy = 'strict-origin-when-cross-origin';
            loader.parentElement.replaceChildren(frame);
            frame.focus();
        });
    });
})();
