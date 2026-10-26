# Approved homepage navigation

The owner requires these exact homepage header menu labels, in this order, on desktop and mobile:

1. `Expertise` → `#expertise` (the homepage services section).
2. `Asset Portafolio` → `/proyectos.html`.
3. `Contacto` → `/contacto.html`.

Preserve the literal spelling `Asset Portafolio` in future improvements; do not translate or rename these labels unless the owner explicitly requests it. Preserve the existing advisory button and destinations. This constraint concerns the homepage header navigation; it does not request renaming body or footer copy.

# Shared visual system
Use the official outlined logo from `assets/branding/sollahms-logo.svg` everywhere; only its exact light contrast adaptation is allowed on dark backgrounds. Preserve the gold period, proportions and accessible name. Follow `docs/brand-identity.md` and `scripts/brand_identity.py`; do not recreate wordmarks with page fonts or append a slogan.

All public pages must load `/assets/css/sollahms-theme.css` after page-specific styles. Preserve the exact palette, roles, shapes and motion rules in `docs/visual-system.md`; use shared tokens instead of adding local color/radius variants. Keep third-party logos and media unchanged.

Public pages also load the deferred `/assets/js/scroll-presence.js` through `scripts/scroll_presence.py`. It provides the approved shared scroll fade without changing layout. Keep forms, navigation, status messages and financial controls static; honor reduced motion, printing and keyboard focus. Include this helper when generating new pages.

# Approved project header B
All live project details use the exact approved Cicarelli B composition through `scripts/project_header_b.py` and `assets/css/project-header-b.css`. Preserve own project images and descriptive alt text; do not generate a visible generic render/brochure caption. Apply this final shared renderer when regenerating a detail page. Preserve the three featured page variants below the header. The owner now also requires `Asset Portafolio` for visible catalogue-section links, breadcrumbs and catalogue H1; do not change prose occurrences or URLs. See `docs/project-header-b-20261026/README.md` for guarded packaging and rollback.
