# Corporate SEO — production release, 29 October 2026

## Result

Published the owner-approved SEO content from `bd59851b736892f3aaa01989b6b3c4c570a0a00d` to https://sollahms.cl/.

- Production deployment: `dpl_Atu9RTqZT7ShuPDpmfuK4yGqQxN8`, target `production`, READY.
- Deployment URL: https://project-wrapp-px26n8u8w-lsandoval2-8260s-projects.vercel.app/ (protected).
- Immediate previous production / rollback: `dpl_2ZVBbbzPnRAHfnDeFCaAaywgaDuY`, code `da064d6433d9099af4b3e5df892f4db23997ad5c` (Euro).
- Approved preview: `dpl_3aqTiHXik8wEbFYcQ6NKEpUBeUNU`.
- Failed Git rebuild retained in history: `dpl_43RwRnRz8DDeKDtvQu7Mrqk8Awmj`.
- Branch: `codex/corporate-seo-20261029`; no merge to main. Main remains `86e200ec191b38af355061e21bc0fc1e549cce3b`.
- Final public HTTP checks completed 29 October at 08:06 Chile time (11:06 UTC).

## Exact failure and safe correction

The failed production attempt rebuilt the whole Git tree using the repository's historical `vercel.json` build command, `node scripts/package-vercel.mjs`. At line34, the packager reads the manifest named by `SENTO_MANIFEST`, which is **`data/sento-review.json`**, not `data/brochures-sento.json`. That review has `protectedPreviewOnly: true`. Its presence with `VERCEL_ENV` other than `preview` correctly throws `The Sento update is authorized for Preview only`.

No authorization flag, protected-publication module, review manifest or safeguard was changed. The already approved frozen artifact package is the separate production path: the exact Euro production manifest plus the nine previously reviewed corporate output overlays. It does not contain the historical Sento review inputs or the repository packager, and never invokes them. It introduces no project resources. Existing public Sento pages/media are retained exactly as in prior production; this release does not grant new rights to the historical review batch.

The new `scripts/validate-corporate-release.py` fails closed on any added/removed path or change outside the exact allowlist. It pins both manifests, verifies all inline SHA256 values, checks all131 fiche digests and all frozen CAS references, and rejects mutations to a fiche, catalogue, function, builder and new protected resource. This gate supplements the existing build's complete file hash verification.

## Package identity and preservation

- Approved manifest: `deployment-files.json`, SHA256 `e5169c9928f8f0b3cc02b9318830c7dab28ec17af8f1c9e692b4eefd33c0cf96`.
- Baseline manifest: `../euro-20261029/deployment-files.json`, SHA256 `707780481f1dcb92459beaada96d444567482c37f907e34081b21914c92b066b`.
- Final build aggregate: `a0fc9025ee8d98a3b0d63eaf61755774db744c122549a7bc96de35cd96387147`, identical to the approved preview.
- 1621 runtime files; 1612 unchanged. No added or removed runtime path.
- Exactly eight corporate HTML files plus sitemap changed. Privacy changes are structured metadata only.
- All131 fiche HTML files, catalogue JSON, prices, Euro update, maps, galleries, assets, forms, financial scripts, functions and original routes are preserved.
- `prepare-output.mjs` and `apply-retirements.mjs` are byte-identical to the Euro production builder. Its existing21-record contact-catalogue synchronization and Patio Brasil410 handling are preserved; no new synchronization policy was introduced.
- Both the baseline and preview source-tree listings independently matched all107 source entries exposed by the listing API. Deeper nodes are truncated by that API; the full1621-file SHA256 build gate and public131-fiche comparisons provide the complete applicable artifact verification. File count alone was not used as evidence.

## Staging and release

Used the authenticated official Vercel API with the explicit `files` manifest, `target: production`, empty install command and `node prepare-output.mjs`. No Git source rebuild, environment replacement, dependency installation in the site, or new service was used.

Set project `autoAssignCustomDomains: false` before creating the production candidate. Confirmed READY and all staged checks while `sollahms.cl` still pointed to the Euro deployment. Confirmed the earlier deployment was READY and the rollback API available. Promoted the tested production deployment with `request_promote`, then verified `sollahms.cl`, `www.sollahms.cl` and `sollhams.cl` aliases. The alias failure list was empty.

Project `live:false`, SSO protection `all_except_custom_domains`, and `git.deploymentEnabled.main:false` / working branchfalse were preserved. Temporary share credentials are excluded from this record and the repository.

## Checks actually repeated

- 276 corporate SEO/static checks passed, including canonical, schema identities, metadata, anchors, sitemap, robots, unchanged forms/scripts/images and generator reproducibility.
- 15 educational/financial tests passed, including all72 purchase-stage combinations.
- The test's stylesheet comparison was corrected to inspect link attributes and style text: this session's HTML parser incorrectly nested the following JSON-LD under a legacy closing `</link>` in Trabaja con nosotros. Raw styles and the shipped page were unchanged. This is a test-only correction, not a waived regression.
- Production compilation READY:1621 file hashes verified, exact approved aggregate.
- 12 staged HTTP checks passed: eight pages, sitemap, robots, catalogue and UF.
- **156 public HTTP checks passed**, including all131 fiche hashes, eight corporate files, catalogue/page data, shared motion/form assets, sitemap/robots, UF, two410 routes, unknown404 and405 method guards for contact/advisory/collaboration. Corporate pages have no public noindex response header.
- Fresh desktop Chrome review of all eight staged pages: no horizontal overflow or broken images. Public homepage and contact navigation/form inspected again after promotion.
- Comparator live synthetic calculation:4000UF,20%pie,4%effective annual rate,25years →16.76UF. UFAPI:41,237.01CLP for29October2026, SII provenance.
- Required name/RUT/email/phone plus consent visible, enabled and fully opaque on the public contact form. No real request or email submitted. Actual delivery was not tested; transport code/function artifacts were preserved and GET405 guards confirmed.
- Mobile evidence is **reused**, not claimed as a new mobile run: the approved preview's eight mobile-page checks and final comparator footer capture apply to the identical final artifact digest. The available cloud browser exposes no viewport capability; the local browser connector twice reported no originating browser context.
- Runtime error/fatal log queries returned no matching logs. Browser-console messages from the extension's own `chrome-extension://` metadata channel were distinguished from application errors.

## Recovery

The previous READY production deployment has not been deleted. On a critical regression, use the official `request_rollback` for project `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, team `team_A9VNIW2f2K1IJpd2pGdvDmEN`, deployment `dpl_2ZVBbbzPnRAHfnDeFCaAaywgaDuY`. Verify the apex/www aliases, homepage, contact GET guard, catalogue, UF and Patio410 afterward. No main merge is necessary.

Do not redeploy this release by asking Vercel to rebuild the full Git tree: that intentionally remains blocked by protected review content. Reuse the frozen manifest and unchanged guarded production builder, after checking the current production baseline and scope again.

## Remaining measurement limits

Publication and crawl-access checks do not establish Google/Bing ranking, indexing or AI citations. Search Console/Bing private metrics still require account access; no analytics or paid service was activated. These measurement gaps did not block the authorized release.

Evidence: `production-verification.json`, `production-package-verification.json`, `production-http-verification.json`, `production-browser.json`, `production-desktop.jpg`, and the previously approved mobile evidence in this folder.
