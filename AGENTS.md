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

# Catalogue map
Keep Tarjetas/Listado/Mapa on the same catalogue filter/order model. Only `data/project-locations.json` entries with verified provenance and matching current address/commune may become markers. Never infer exact locations from a city/street center. Preserve pending projects in full catalogue views. Follow `docs/catalog-map-20261026/README.md`: lazy Leaflet/map resources, exact coordinates, colocated chooser, static controls, explicit viewport changes and bounded provider usage. No client geocoding or visitor location permission.

# Collaboration contact-only exception (2026-10-26)
The owner now requires only email OR phone, plus specific consent, in both Trabaja con nosotros paths. Do not collect name, RUT, company or optional profile data there. The four-field rule still applies to existing project/commercial forms. Keep the collaboration footer link inside the same container as the other footer links, including generated fiches.

# Stronger image motion and card hover
Preserve approved gradients and the existing scroll fade byte-for-byte when adjusting image motion. `image-parallax.js/css` owns image translation and card-only hover scale; other image transforms must stay isolated. Home/project photos and catalogue cards/list rows may move within safe geometry; maps, plans, logos and forms stay static. Keep the current catalogue representation registered after filtering and release removed frames. Honor reduced motion, touch pointers and source resolution. See docs/strong-parallax-hover-20261026.

# Verified cover quality
Preserve data/project-cover-overrides.json through project_cover.py and the catalogue cover builder. These owner-authorized choices reuse higher-quality media already verified for each project. Do not replace them with historical thumbnails. Parallax pixel budgets use the painted image width, excluding contain side margins; never upscale a low-resolution source to force motion.

# Plaza Las Condes verified fiche (2026-10-28)
Apply `scripts/plaza_las_condes.py` after shared generators for this slug only. Preserve the verified project address at Avenida Las Condes 7083, separate sales office, nine plans, unit-specific quote context, and `data/plaza-las-condes-verified.json` provenance. The latest owner instruction requires their supplied list prices: unit 213 = UF 11,119 and unit 313 = UF 11,073. Do not replace these with Sento website campaign prices or calculate discounts. Keep the catalogue/header minimum at UF 11,073. Never infer stock or restore conflicting model surfaces without current evidence.

# Image-label policy (2026-10-28)
The owner requires no visible generic Render referencial / Imagen referencial badges or equivalent image-type captions on any fiche. Use scripts/project_image_labels.py as the final static rendering step, including project-specific overrides and gallery importers. Preserve descriptive scene captions, all alt/ARIA text, source provenance, original media and watermarks, plan information, substantive commercial notices, and motion. Never hide labels with CSS or reclassify a render as a photograph.
