# Featured card facts — 2026-10-29

Scope: two homepage cards, INN's useful-area fields, their central records and derived catalogue facets. No redesign, prices, media, forms, SEO, motion or other project changes.

## Evidence and root cause
Plaza's homepage card was a stale static copy although proyectos.json already had Estudio/1D/2D and plaza-las-condes-verified.json had six non-conflicting total plan areas. It now reads those sources: 33.32–83.43 m² total according to reviewed plans. A2/B2/B9/B14/C6/C8; B5/C2/C4 conflicts stay excluded. Source: Sento official project/plan URLs in the existing record and owner brochure Sento - Plaza las Condes(2).pdf, pp6–8. Source hash85ba1584b1f4658b57d26768682cfebff8f4823541625326221657e71e935a6d. These are documented typologies, not availability. The short description uses already-verified ten storeys plus rooftop, pool, Sky Bar and Metro proximity. Owner UF11,073 list price unchanged.

INN lacked normalized areas in both the central fiche and homepage. Existing Leben brochure fc073388049d38820759f4a65fe3cca851066ad2a532530b6edfc5a1f4d37ad6 has no individual model area breakdown. Browser inspection of https://innpuertochico.ileben.cl/ plant selector on2026-10-29 records useful/terrace/total labels and layout pairs. Useful range69.94–135.54 m² approximate (official technical records707/807 and313); all34 currently rendered technical entries reviewed, not an inventory count. No developer prices imported. Some totals contain additional private space; totals with unexplained extras are excluded from filters and no aggregate total is asserted. Raw technical evidence is internal in inn-official-observation.json and the central fiche registry; public facets deduplicate layouts and omit unit identifiers and prices. UF9,816 and original homepage description preserved.

## Regeneration
`python scripts/featured_project_cards.py --check`
`python scripts/build-catalog-facets.py --check`
`python tests/featured-cards.py`
`python scripts/package-featured-cards.py`

The homepage helper is also called by build-catalog-presentation.py; the scoped INN fiche helper is called by project_header_b.py. No parallel database. Four runtime overlays only,1619 package entries unchanged, all function inputs unchanged. Historical full packager and Sento Preview guard remain intact. Branch codex/featured-card-facts-20261029, main untouched and both automatic deployment flags false.

## Release
Baseline/rollback: dpl_Atu9RTqZT7ShuPDpmfuK4yGqQxN8, code bd59851b736892f3aaa01989b6b3c4c570a0a00d; source/evidence HEAD debe70b10d89adff8f249a0c66b41fc7b3840d92. Rollback through authorized Vercel request_rollback(projectId prj_URomRRU0MAy4etGKP5gWv3Qv4DGH, deploymentId baseline, teamId team_A9VNIW2f2K1IJpd2pGdvDmEN). Current release status/evidence to be appended after validation and promotion.
