# Plaza Las Condes — verified completion, 28 October 2026

Scope: one project. Baseline production code d881df923bce24085927a72179ade632e03b8e80; source/evidence parent d31dcc4849fbdd6b7e5599c24884fce23850b64b. Rollback: READY deployment dpl_8hBjJDaGCkPK8PQ3m8BEQ1izCY8B, project-wrapp-5wkf4fird-lsandoval2-8260s-projects.vercel.app. Main is not modified or merged; project automatic deployment remains disabled and the new branch is explicitly false in vercel.json.

## Verified sources
- Current official project: https://sento.cl/proyectos/plaza-las-condes-7083/ (retrieved 2026-10-28, campaign October 2026). Unit 313: UF 8,858, 20% applied, excludes parking/storage, subject to availability. No stock count or discount on unit 213 is inferred.
- Supplied brochure `Sento - Plaza las Condes(2).pdf`, SHA256 85ba1584b1f4658b57d26768682cfebff8f4823541625326221657e71e935a6d, same as the previously archived brochure. Pages 2/9: building/address/environment; 4: amenities; 5: historical finishes; 6–8: plans. Its June/July 2023 campaign and delivery-year heading do not establish current commercial conditions.
- Google Maps place `ChIJHRm08KfPYpYRwYSH6WoXovA` identifies Sento Plaza Las Condes at Av. Las Condes 7083; verified coordinates -33.4052083, -70.5576861. General Carol Urzúa 7060 is the sales office. Both the fiche map and the single shared catalogue pin use the building identity.
- Official tour https://sento.cl/360-plc/213/. The activated viewer explicitly identifies “Depto Tipo C7 (213): 2D+2B”, resolving the misleading one-bedroom label on its parent page. This confirms tour identity but not current commercial availability. Public response permits framing; integration uses sandbox, no forms/popups/top navigation, lazy loading and a fallback link.

`data/plaza-las-condes-verified.json` retains exact asset URLs/hashes, PDF pages and discrepancy decisions. Five additional renders and nine official plans were downloaded from Sento and optimized without AI generation, enlargement or altered geometry. All seven approved gallery images and the existing hero remain. Duplicate smaller renditions of the same roof views were excluded. One WebP encoder method produced an empty B2 file; it was re-encoded with lossless method 4 and every output was fully decoded before publication.

## Commercial limits retained in the fiche
- Unit 213: final price and availability unconfirmed; “Consultar valor”. Owner-supplied list prices and inconsistent 12% label are not used to calculate prices.
- Unit-specific interior areas 213=69.85 and 313=69.78 m² are owner-supplied and explicitly pending documentary confirmation; they are not total areas with terrace.
- No total stock count; no claimed availability of studio/one-bedroom models. Nine architectural plans do not establish stock.
- B5/C2/C4 surface totals conflict across sources and are withheld. None of these nine plans is attributed to 213/313; the separate 360° identifies 213 as C7.
- Elevators, cameras and general security systems were not confirmed and are not advertised. SUM is not added as a separate room without evidence.
- Current official shower specification takes priority over the older brochure's shower tray; scope remains unit-specific.

## Implementation and preservation
Scoped generator `scripts/plaza_las_condes.py`, invoked after shared rendering, and a page-only CSS/module. Unit selection appends context through the existing FormData message field; endpoint, consent, four mandatory fields, protections and receipt semantics remain unchanged. Tests capture receipt in an isolated fake transport; no real messages.

Only this fiche, its two shared catalogue/location records, and the matching address in its existing homepage card change. All 131 other fiches remain byte-identical. Approved B header, hero image, branding, WhatsApp artwork, shared parallax/hover, scroll fade and API function artifacts are retained. Catalogue count stays 132.

Frozen Build Output preserves every untouched artifact by SHA256/CAS SHA1. `candidate-hashes.json` and `deployment-files.json` provide a reproducible payload; source files and private provenance are not added to the public artifact. The new runtime contains 1,175 files, of which 1,155 are unchanged from production; four existing files and sixteen new assets are the runtime delta.

## Validation
97 automated checks passed: 26 contact/catalogue/unit-context, 40 parallax and 31 scroll presence. Source checks cover 132 records, one changed project/pin, all anchors, unique IDs, 12 gallery images, 9 plans, both unit buttons, unchanged form/header/footer and shared assets. Browser, publication and public HTTP evidence are appended after deployment.

## Recovery
Restore the previous READY production deployment using Vercel's authorized rollback mechanism; do not rebuild historical sources or merge main. Recheck the current alias immediately before promotion. Keep authentication and environment protections unchanged.

Browser correction: Google’s query-by-place-ID failed in the legacy embedded viewer (world map). Replaced with the exact verified coordinates; no approximate address geocoding is used.

## Published and publicly verified
Production code **6789a846bd8f94ffc9ec2f5e21b24914a0b233c2**, deployment **dpl_5ef6vUjv93NPNQs9FLYfHzx552jv** (READY), immutable URL https://project-wrapp-5ypi2k0uu-lsandoval2-8260s-projects.vercel.app. The sollahms.cl alias was verified against this deployment.

All **38 public HTTP checks passed**, including byte hashes of every changed runtime file, all 21 distinct gallery/plan assets, unchanged shared motion/contact code, catalogue and representative preserved pages. Images were fully decoded. Internal provenance is not published (404). UF responds for 2026-10-28 with CLP 41,231.70 from the existing SII-backed endpoint. No error/fatal runtime logs were found for this deployment in the observed window.

Real Chrome review covered desktop, 390 px and 320 px widths, existing mobile menu, anchor navigation, plan filters (1/4/4), both unit requests, 12 loaded gallery renders, the active 360° and the corrected Google marker. Public screenshots: `public-desktop.jpg`, `public-units.jpg`, `public-mobile.jpg`. Preview evidence: `preview-tour-identity.jpg`, `preview-map.jpg`. No live forms were submitted. The temporary viewport override was reset.

Build verification: 1,175 runtime files, aggregate f3822799d99afc9c8f439f3593832eb9e0c9d19825cb8b12bfa2bb76cd5b89b8. All 1,155 unchanged production artifacts and existing functions were reused exactly. Main remains 86e200ec191b38af355061e21bc0fc1e549cce3b; project live=false and SSO protections remain enabled. Previous production deployment remains READY and available to the official Vercel rollback operation. See `release.json`, `public-verification.json`, and `browser-validation.json`.
