# Catalogue map — 2026-10-26

Baseline production: `dpl_6NyvfFF8TH3734zmPLLKbkpCoTP6`, code `1302c57b14b596253fc35964632a8204ecad9847`, exact source/evidence `06a87c59b0e8c77596e50f18644a8e41fd49eea1`. Work branch `codex/catalog-map-20261026`; main and automatic deployments remain disabled. Rollback uses the retained baseline through Vercel request_rollback. No merge, provider purchase, commercial submission, identity lookup or new reception destination.

## Architecture and visual decisions

Tarjetas, Listado and Mapa share the exact filtered/sorted project array. Only one representation is active. The map is a dynamic import; Leaflet, its styles, verified location registry, provider configuration and tiles load only when Mapa is selected. Failure leaves an explicit route back to the complete list. All original source records, fiche pages, commercial forms, financial engines, media, SEO/sharing and shared fade remain frozen unchanged.

The map is static relative to the approved page fade (`data-scroll-static`). A subdued base layer separates geography from green location markers. Clusters show counts. Selection uses gold plus an outline, a different center shape, aria-pressed and a textual status. One selected project panel presents consistent facts and one primary Ver ficha link. The native project selector provides full keyboard access in the same ordering as the catalogue. Same-coordinate towers remain at the true coordinate with a chooser; there is no spiderfying or geographic jitter. Screen-space clustering changes only the group symbol, never individual coordinates.

Initial bounds fit verified results. Later filter/view changes preserve map position; Mostrar todos los resultados is explicit. Choosing a project in the selector explicitly focuses its location. Session state contains only viewport coordinates, zoom and a public project slug; no personal or financial inputs. No visitor geolocation is requested. Wheel zoom, double-click zoom, inertia and animations are disabled. On mobile, dragging is off until explicitly enabled; page scrolling remains available. Mobile project details sit below the map, not over locations or navigation.

## Source and location policy

`location-audit.json` records one decision for every catalogue entry. Published coordinates are either project-specific coordinates authored on the developer's official page or a unique geocoding match for the verified street, number and commune. Map camera centers, street/commune centers and unresolved multiple matches are not admitted. A runtime identity guard excludes stale coordinates when address or commune no longer matches the catalogue. No new commercial facts are inferred.

The location source is the developer's HTML, not data extracted from the Google Maps service. Only explicit coordinate parameters authored by the developer and tied to the named project are used; third-party API keys are neither copied nor stored in the public registry. Shared-project points identify the development/location, not a precise interior unit.

The geocoding review is a one-time small batch, one process/thread/machine, maximum one request per 1.2 seconds, application-specific User-Agent, public project addresses only, cached results, no autocomplete or runtime geocoding. The reviewer rejects missing house numbers, incorrect communes and ambiguous matches. Coordinates derived from OpenStreetMap have ODbL attribution and source object URLs in the publicly available registry.

## Provider, cost and resilience

Leaflet 1.9.4 is vendored and pinned to the SHA-256 values on its official download page; BSD-2-Clause license retained. No account, API key, paid tier, trial or contract was activated. Base tiles use the standard HTTPS OpenStreetMap service, which is best-effort and has limited capacity, not an unlimited commercial SLA. Browser cache headers are respected; Referer is retained; no proxy, bulk tile download, prefetch, offline feature or background map loading. `keepBuffer:0` restricts requests to the viewed map. Tile URL is in `data/map-provider.json`; a replacement must be reviewed for terms/costs. Base-layer failure shows a message while the project selector/fiches and other views remain available.

Official documentation reviewed 2026-10-26:
- https://leafletjs.com/download.html
- https://leafletjs.com/reference.html
- https://operations.osmfoundation.org/policies/tiles/
- https://operations.osmfoundation.org/policies/nominatim/
- https://osmfoundation.org/wiki/Terms_of_Use
- https://www.openstreetmap.org/copyright

Validation: `node --test tests/catalog-views.test.mjs tests/catalog-map.test.mjs`; frozen artifact hash/preservation checks; browser desktop/mobile tasks and release evidence follow. Geocoding review progress is cached and recoverable; never treat an incomplete review as final coverage.
