# Patio Brasil retirement — 2026-10-28

Owner-authorized withdrawal of Patio Brasil (Sudamericana, Avenida Brasil 697). Production baseline: commit `894ca8b3d6159de43e35328061ca143ca90674c4`, deployment `dpl_5c9PEZh5zgpi61DV1CgM91SYRHM7`; immutable URL https://project-wrapp-1ho7n63g3-lsandoval2-8260s-projects.vercel.app. Source/evidence parent: `0cfccd155109a029e385b8a98a5f0f7845c4a33d`.

The public catalogue is reduced from 132 to 131. All other catalogue records, fiche HTML, media, CSS, JS, prices and integrations are preserved. Sudamericana retains Novo Catedral. The removed fiche and its records remain in this internal Git archive, excluded from the deployed static files. Original media is retained.

Retirement covers public JSON, map coordinates, the no-JavaScript directory, sitemap, advisory identity, booking identity and the frozen contact function catalogue. No live requests or notifications are sent.

`deployment-files.json` references frozen Vercel CAS files and narrowly scoped overlays. `input-hashes.json` verifies every input file before use. `prepare-output.mjs` invokes `scripts/apply-project-retirements.mjs` to remove exactly one row from the independently frozen server catalogue and prepend one HTTP 410 route while asserting preservation of all existing routes. The build logs record the two transformed hashes and final aggregate. No new dependencies, network calls or environment changes occur during this build.

Main and automatic deployments remain disabled, including `codex/retire-patio-brasil-20261028`. Rollback uses Vercel's official rollback operation to the prior READY production deployment above. Publication and browser evidence are recorded below.

## Published and verified

Production `dpl_6Yh7q2ATzax3TghU559bpi3vqarG` serves https://sollahms.cl from code `b81f4214c09fbb1f2e1ac6107b72ff50a588286f`. Preview `dpl_4zrxMPn1fux69rsSN1YPm1xF5iNa` and production produced identical aggregate SHA256 `bc56530856d55c6f7c3f70964ca937e336f597ffb3108c15a868f990431366a9` across 1175 runtime files. 1165 existing files are byte-identical; 9 are narrowly modified, the retired HTML is removed and 410.html added.

25 isolated tests passed. Chrome desktop and 390×844 mobile review covered Tarjetas/Listado/Mapa, empty Patio Brasil search, Sudamericana retaining Novo Catedral, filters, price ordering (48 results at maximum UF 3000), clearing back to 131, opening Novo Catedral and returning with map context, and the 410 page catalogue link. No overflow or visible image failures were observed.

27 public HTTP checks passed, including six 410 URL variants, exact hashes of catalogue/map/sitemap and representative untouched pages/assets, UF, and existing read-only API responses. The booking endpoint's deliberate `503 booking_not_certified` was compared with the prior production and confirmed identical: automatic reservations remain off. The verifier's initial assumption of 405 was corrected without changing application behavior. No forms, messages, bookings or emails were sent. No runtime error/fatal logs were found in the verification window.

Public screenshots: desktop-sudamericana.jpg (Tarjetas) and mobile-sudamericana.jpg (Listado); candidate-retired-mobile.jpg is the identical candidate's mobile 410 layout. The 131 remaining fiche HTML files and their catalogue data were compared byte-for-byte/deep equality with the baseline, while all root public HTML was scanned for retired links. Photos, animations, forms and commercial facts are unchanged.

The live domain and build receipt are in release.json; individual public responses and hashes are in public-verification.json. Return HTTP 410 signals permanent withdrawal; search engine removal timing is not measured or guaranteed. Historical records are deliberately retained only in Git/internal archives, not public catalogue feeds.
