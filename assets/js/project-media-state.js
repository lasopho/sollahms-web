/* A failed local image stays a documented pending input, never a replacement. */
(() => {
    const failures = new Map();
    const imageState = new WeakMap();
    const linkState = new WeakMap();
    // Existing public Indi hero, already selected by the same catalogue entry.
    // It is never copied to another project or substituted into an image src.
    const publicHeroPair = { page: null, preview: null, public: null };
    const localAsset = value => {
        try {
            const url = new URL(value, document.baseURI);
            return url.origin === window.location.origin && url.pathname.startsWith('/assets/propiedades/')
                ? url.href : null;
        } catch { return null; }
    };
    const stopUnavailableLink = event => { event.preventDefault(); event.stopPropagation(); };
    function preferExistingPublicHero(image, state) {
        if (window.location.pathname !== publicHeroPair.page
            || localAsset(image.getAttribute('src')) !== localAsset(publicHeroPair.preview)) return;
        const preview = image.closest('section');
        const publicSection = preview?.nextElementSibling;
        const publicImage = publicSection?.querySelector('img.hero-image');
        if (preview?.getAttribute('data-leben-header') !== 'edificio-indi'
            || !publicSection?.classList.contains('project-hero') || !publicImage
            || localAsset(publicImage.getAttribute('src')) !== localAsset(publicHeroPair.public)) return;
        const reveal = () => {
            if (!imageState.has(image) || !publicImage.complete || publicImage.naturalWidth === 0) return;
            if (!state.hero) state.hero = { preview, publicSection, previewHidden: preview.hidden, publicHidden: publicSection.hidden };
            preview.hidden = true;
            preview.setAttribute('data-project-media-hero-pending', 'true');
            publicSection.hidden = false;
        };
        const publicUnavailable = () => {
            if (!imageState.has(image) || !state.hero) return;
            // A later public-image failure returns to the explicit pending
            // preview state; it cannot leave a hidden, empty header behind.
            preview.hidden = state.hero.previewHidden;
            preview.removeAttribute('data-project-media-hero-pending');
            publicSection.hidden = state.hero.publicHidden;
        };
        publicImage.addEventListener('load', reveal);
        publicImage.addEventListener('error', publicUnavailable);
        state.publicImage = publicImage;
        state.publicLoad = reveal;
        state.publicError = publicUnavailable;
        reveal();
    }
    function updateLinks(url, unavailable) {
        document.querySelectorAll('a[href]').forEach(link => {
            if (localAsset(link.getAttribute('href')) !== url) return;
            if (unavailable && !linkState.has(link)) {
                linkState.set(link, { disabled: link.getAttribute('aria-disabled'), tab: link.getAttribute('tabindex') });
                link.setAttribute('aria-disabled', 'true');
                link.setAttribute('tabindex', '-1');
                link.classList.add('project-media-unavailable-link');
                link.addEventListener('click', stopUnavailableLink, true);
                // PROJECT_MEDIA_AUXCLICK_DISABLE_START
                link.addEventListener('auxclick', stopUnavailableLink, true);
                // PROJECT_MEDIA_AUXCLICK_DISABLE_END
            } else if (!unavailable && linkState.has(link)) {
                const previous = linkState.get(link);
                for (const [key, value] of [['aria-disabled', previous.disabled], ['tabindex', previous.tab]]) {
                    if (value === null) link.removeAttribute(key); else link.setAttribute(key, value);
                }
                link.classList.remove('project-media-unavailable-link');
                link.removeEventListener('click', stopUnavailableLink, true);
                // PROJECT_MEDIA_AUXCLICK_RESTORE_START
                link.removeEventListener('auxclick', stopUnavailableLink, true);
                // PROJECT_MEDIA_AUXCLICK_RESTORE_END
                linkState.delete(link);
            }
        });
    }
    function unavailable(image) {
        const url = localAsset(image.currentSrc || image.getAttribute('src'));
        if (!url || imageState.has(image)) return;
        const notice = document.createElement('p');
        notice.className = 'project-media-pending';
        notice.setAttribute('role', 'note');
        const plan = /(?:plano|planta)/i.test(image.getAttribute('alt') || '') || /\/plano[^/]*\./i.test(url);
        notice.textContent = plan ? 'Plano pendiente de incorporación.' : 'Imagen pendiente de incorporación.';
        const hero = image.classList.contains('hero-image') || image.classList.contains('property-hero-image');
        let host = image.parentElement;
        if (hero) {
            const section = image.closest('section');
            host = section?.querySelector('.hero-content, .leben-hero-content')
                || section?.querySelector('h1')?.parentElement || section || host;
            notice.classList.add('project-media-pending-hero');
        }
        const state = { url, notice, hidden: image.hidden };
        imageState.set(image, state);
        image.hidden = true;
        image.setAttribute('data-project-media-unavailable', 'true');
        host.append(notice);
        if (!failures.has(url)) failures.set(url, new Set());
        failures.get(url).add(image);
        updateLinks(url, true);
        if (hero) preferExistingPublicHero(image, state);
    }
    function available(image) {
        const previous = imageState.get(image);
        if (!previous || image.naturalWidth === 0) return;
        image.hidden = previous.hidden;
        image.removeAttribute('data-project-media-unavailable');
        previous.notice.remove();
        if (previous.publicImage) {
            previous.publicImage.removeEventListener('load', previous.publicLoad);
            previous.publicImage.removeEventListener('error', previous.publicError);
        }
        if (previous.hero) {
            previous.hero.preview.hidden = previous.hero.previewHidden;
            previous.hero.preview.removeAttribute('data-project-media-hero-pending');
            previous.hero.publicSection.hidden = previous.hero.publicHidden;
        }
        imageState.delete(image);
        const pending = failures.get(previous.url);
        pending.delete(image);
        if (!pending.size) { failures.delete(previous.url); updateLinks(previous.url, false); }
    }
    document.querySelectorAll('img[src]').forEach(image => {
        if (!localAsset(image.getAttribute('src'))) return;
        image.addEventListener('error', () => unavailable(image));
        image.addEventListener('load', () => available(image));
        // A lazy image without a selected request is not evidence of absence.
        if (image.complete && image.currentSrc && image.naturalWidth === 0) unavailable(image);
    });
})();
