(() => {
    let permittedHosts;
    try {
        const hosts = JSON.parse(document.getElementById('project-embed-hosts')?.textContent || '[]');
        permittedHosts = new Set(Array.isArray(hosts) ? hosts : []);
    } catch {
        permittedHosts = new Set();
    }

    const secureUrl = value => {
        try {
            const url = new URL(value);
            return url.protocol === 'https:' && !url.username && !url.password ? url : null;
        } catch {
            return null;
        }
    };

    document.querySelectorAll('iframe[data-project-embed]').forEach(frame => {
        const source = secureUrl(frame.getAttribute('src'));
        const fallback = secureUrl(frame.dataset.embedFallback);
        const shell = frame.closest('.project-embed');
        const adjacent = shell?.nextElementSibling;
        const alternative = adjacent?.matches?.('p[data-project-embed-alternative]') ? adjacent : null;
        const staticLink = alternative?.querySelector('a');
        const staticUrl = secureUrl(staticLink?.getAttribute('href'));
        const approvedAlternative = Boolean(fallback && staticUrl && staticUrl.href === fallback.href
            && permittedHosts.has(staticUrl.hostname));
        if (alternative && !approvedAlternative) alternative.remove();
        const showFallback = () => {
            const shell = frame.closest('.project-embed');
            if (!shell || !fallback || !permittedHosts.has(fallback.hostname)) return;
            // Do not recreate the removed Google Maps action box on an error.
            // The published address remains available outside the failed frame.
            if (frame.dataset.projectEmbed === 'map') {
                shell.remove();
                return;
            }
            // The static alternative is available even when a blocked frame
            // emits no error. Do not create a duplicate after a real error.
            if (approvedAlternative) {
                shell.remove();
                return;
            }
            const panel = document.createElement('p');
            panel.className = 'project-embed-fallback';
            const link = document.createElement('a');
            link.href = fallback.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Abrir experiencia externa ↗';
            panel.append(link);
            shell.replaceWith(panel);
        };
        if (!source || !permittedHosts.has(source.hostname)) {
            // Generated markup is validated before publication. Avoid keeping
            // an unexpected source if the page or host configuration is edited.
            frame.closest('.project-embed')?.remove();
            alternative?.remove();
            return;
        }
        // Native loading="lazy" owns scheduling: no click, timer, src swap or
        // IntersectionObserver is needed. Cross-origin load does not establish
        // visual success; browsers also do not reliably emit iframe errors for
        // CSP/X-Frame-Options failures. The adjacent static link needs neither.
        frame.addEventListener('error', showFallback, { once: true });
    });
})();
