# Catalogue cards and list — 2026-10-26

Exact baseline: runtime `13cfd76093972ae6ad7feb3b91ae5e1513078f65`, deployment `dpl_DKfCGLRiFZ3tkymA9dAmvhw3MFSe`, source/evidence `4be08b6975c05c013c5ef32ee485504b69f5ae91`. The catalogue HTML and public data were matched to production hashes before editing. Main remains untouched; manual publication only, branch `codex/catalog-views-20261026` disabled for automatic deployments.

## Scope

Only `/proyectos.html` and its new catalogue CSS/JS modules change at runtime. Heading: ASSET PORTAFOLIO / Catálogo inmobiliario, with the owner's exact description; catalogue SEO descriptions and CollectionPage match. Navigation keeps Asset Portafolio, including its old misspelled footer label. Canonical, destinations and sharing images are preserved.

One active DOM representation of 132 unique public records serves both cards and list. A view switch changes layout only; filtering and sorting use one pure module. Repeat review dates, disclaimers, conditions links, full addresses and internal identity/review annotations are removed from cards, not hidden with CSS. Original records, traceability and all fiche conditions remain exact. Unknown prices read Consultar precio and sort after known positive numeric amounts in both directions. Local/residential selected offers keep their exact decimals and typology label. State and delivery stay separate, with one line for literal duplicate delivery values; reference-stage labels remain when needed.

Primary filters: search/location/maximum UF. Secondary filters: type and state. Applied filters have individual removal and clear actions. Existing residential typologies establish residential filtering when a legacy record lacks tipoActivo; this is a display classification using explicit existing typologies, not a new commercial field. No unsupported house/apartment attributes are inferred. Records without classification remain unclassified.

View preference is only cards/list in localStorage. Entry history retains filters; tab session return state is restricted to public catalogue values. A free-text query is saved to tab storage only if it matches existing public catalogue facts; arbitrary text and all personal/financial fields are excluded. No tracking requests or URL parameters are added. Both browser Back and the fiche return link can retain filters/view. Unavailable storage fails open.

The unchanged shared scroll helper animates the inner `.catalog-card` media/summary group; action and financial areas are separate and static. There is no second animation or nested opacity. A view-layout change triggers the helper's existing resize refresh. Keyboard focus, reduced motion and no-JavaScript visibility remain supported. The static directory is hidden only after a successful dynamic render, so only one catalogue representation is active.

The original financial form, engine and UI module are exact. Financial details remain accessible in a compact disclosure per result, with existing event handlers and calculations. Only the redundant price-review date is omitted from that display. No financial input enters catalogue persistence. All other pages, all functions, lead forms (four required fields), catalogue records, assets, UF, B heroes and shared theme/motion are frozen unchanged.

## Validation

`node --test tests/catalog-views.test.mjs` covers identity/order, numeric sorting, missing/zero prices, lookup, combined filters, typed mixed offers, state/delivery and privacy-bounded persistence. `scripts/build-catalog-presentation.py --check` verifies the accessible directory using the real count rather than a historical inventory. Browser and release evidence are recorded after execution. No claimed conversion effect.

Recovery target: baseline deployment `dpl_DKfCGLRiFZ3tkymA9dAmvhw3MFSe`, through Vercel's authorized rollback mechanism. Never merge main or enable automatic deploys. The frozen artifact manifest is the publication source of truth; no historical full rebuild is used.
