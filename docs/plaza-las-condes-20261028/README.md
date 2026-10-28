# Plaza Las Condes — verified completion, 28 October 2026

Scope: one project. Baseline production code d881df923bce24085927a72179ade632e03b8e80; source/evidence parent d31dcc4849fbdd6b7e5599c24884fce23850b64b. Rollback: READY deployment dpl_8hBjJDaGCkPK8PQ3m8BEQ1izCY8B, project-wrapp-5wkf4fird-lsandoval2-8260s-projects.vercel.app. Main is not modified or merged; project automatic deployment remains disabled and the new branch is explicitly false in vercel.json.

## Verified sources
- Current official project: https://sento.cl/proyectos/plaza-las-condes-7083/ (retrieved 2026-10-28, campaign October 2026). Unit 313: UF 8,858, 20% applied, excludes parking/storage, subject to availability. No stock count or discount on unit 213 is inferred.
- Supplied brochure `Sento - Plaza las Condes(2).pdf`, SHA256 85ba1584b1f4658b57d26768682cfebff8f4823541625326221657e71e935a6d, same as the previously archived brochure. Pages 2/9: building/address/environment; 4: amenities; 5: historical finishes; 6–8: plans. Its June/July 2023 campaign and delivery-year heading do not establish current commercial conditions.
- Google Maps place `ChIJHRm08KfPYpYRwYSH6WoXovA` identifies Sento Plaza Las Condes at Av. Las Condes 7083; verified coordinates -33.4052083, -70.5576861. General Carol Urzúa 7060 is the sales office. Both the fiche map and the single shared catalogue pin use the building identity.
- Official tour https://sento.cl/360-plc/213/. The URL/title mention 213 but its parent page labels one bedroom; the tour is therefore project-referential and not associated with a commercial unit/model. Public response permits framing; integration uses sandbox, no forms/popups/top navigation, lazy loading and a fallback link.

`data/plaza-las-condes-verified.json` retains exact asset URLs/hashes, PDF pages and discrepancy decisions. Five additional renders and nine official plans were downloaded from Sento and optimized without AI generation, enlargement or altered geometry. All seven approved gallery images and the existing hero remain. Duplicate smaller renditions of the same roof views were excluded. One WebP encoder method produced an empty B2 file; it was re-encoded with lossless method 4 and every output was fully decoded before publication.

## Commercial limits retained in the fiche
- Unit 213: final price and availability unconfirmed; “Consultar valor”. Owner-supplied list prices and inconsistent 12% label are not used to calculate prices.
- Unit-specific interior areas 213=69.85 and 313=69.78 m² are owner-supplied and explicitly pending documentary confirmation; they are not total areas with terrace.
- No total stock count; no claimed availability of studio/one-bedroom models. Nine architectural plans do not establish stock.
- B5/C2/C4 surface totals conflict across sources and are withheld. No model-to-213/313 association is invented.
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
