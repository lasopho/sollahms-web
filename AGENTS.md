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
All live project details use the exact approved Cicarelli B composition through `scripts/project_header_b.py` and `assets/css/project-header-b.css`. Preserve own project images and descriptive alt text; do not generate a visible generic render/brochure caption. Apply this final shared renderer when regenerating a detail page. Preserve the three featured page variants below the header. The owner now also requires `Asset Portafolio` for visible catalogue-section links and breadcrumbs; do not change prose occurrences or URLs. See `docs/project-header-b-20261026/README.md` for guarded packaging and rollback.
# Project fiche journey (2026-10-26)

- Preserve the shared fiche organization in `scripts/project_journey.py`, invoked by `project_header_b.py` and the Sento/León generators. It supersedes the older featured-fiche layout while retaining its media and data.
- Keep `Solicitar cotización` primary, `Quiero que me llamen` secondary, and local informational navigation tertiary. Contact must remain associated with the current verified project/stage.
- Use `templates/project-contact.html` and `assets/js/project-request.mjs` with the unchanged advisory endpoint and consent. Never activate a provider, CRM or new destination as a side effect of regeneration.
- Do not add opacity to controls or nest fades. Preserve the approved shared scroll implementation and B hero.
- See `docs/project-journey-20261026/README.md` and run its preservation and isolated-contact checks when changing these components.

# Required commercial identification (2026-10-26)
The owner's current instruction supersedes the optional RUT/single-channel flow. All commercial lead forms require four always-visible fields in this order: Nombre completo, RUT, Correo electrónico, Teléfono. Keep quote/call intent; never hide or disable a contact field by intent. Use `commercial-fields.mjs` in browser and server, and `rut-field.mjs` for RUT presentation. Preserve consent, destination, anti-abuse and idempotency protections. Keep personal data out of URLs, analytics, technical logs and public error messages. No identity/credit lookups or automatic eligibility decisions. See `docs/required-commercial-fields-20261026/README.md`.

# Catalogue presentation (2026-10-26)
The catalogue eyebrow is ASSET PORTAFOLIO; H1 is Catálogo inmobiliario. Keep Asset Portafolio in navigation. `catalog.mjs` renders one set of items for Tarjetas/Listado using `catalog-model.mjs`; preserve filters, numeric sorting, unknown prices, typed local/residential offers and view preference. No repetitive review/reference blocks on cards; commercial conditions remain in fiches and source records. Shared scroll effect applies to the inner `.catalog-card` group; actions/financial controls stay outside it and static. `build-catalog-presentation.py` maintains the no-JavaScript directory. Do not restore historical inline catalogue code.
