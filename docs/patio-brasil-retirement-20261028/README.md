# Patio Brasil retirement — 2026-10-28

Owner-authorized withdrawal of Patio Brasil (Sudamericana, Avenida Brasil 697). Production baseline: commit `894ca8b3d6159de43e35328061ca143ca90674c4`, deployment `dpl_5c9PEZh5zgpi61DV1CgM91SYRHM7`; immutable URL https://project-wrapp-1ho7n63g3-lsandoval2-8260s-projects.vercel.app. Source/evidence parent: `0cfccd155109a029e385b8a98a5f0f7845c4a33d`.

The public catalogue is reduced from 132 to 131. All other catalogue records, fiche HTML, media, CSS, JS, prices and integrations are preserved. Sudamericana retains Novo Catedral. The removed fiche and its records remain in this internal Git archive, excluded from the deployed static files. Original media is retained.

Retirement covers public JSON, map coordinates, the no-JavaScript directory, sitemap, advisory identity, booking identity and the frozen contact function catalogue. No live requests or notifications are sent.

`deployment-files.json` references frozen Vercel CAS files and narrowly scoped overlays. `input-hashes.json` verifies every input file before use. `prepare-output.mjs` invokes `scripts/apply-project-retirements.mjs` to remove exactly one row from the independently frozen server catalogue and prepend one HTTP 410 route while asserting preservation of all existing routes. The build logs record the two transformed hashes and final aggregate. No new dependencies, network calls or environment changes occur during this build.

Main and automatic deployments remain disabled, including `codex/retire-patio-brasil-20261028`. Rollback uses Vercel's official rollback operation to the prior READY production deployment above. Publication and browser evidence will be appended after candidate validation.
