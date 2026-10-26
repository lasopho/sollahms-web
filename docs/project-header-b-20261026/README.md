# Approved B across project details

132 live catalogue routes, based on production dpl_DAo4ZEDA17geE8cFUn3cbkKCvXF7 and source 5704649e5fe45b4fad1e68b66747e43f20768327.

The shared renderer `scripts/project_header_b.py` uses B from preview code f438e5115142f549322ec0a0fed0ca582d9ed832. Shared CSS retains its grid, panel, sizes, spacing, typography, palette and breakpoints. Preview controls and its combined generic render/brochure caption are omitted; no replacement caption is rendered. Descriptive gallery captions and plan notices remain unchanged. All image URLs, alt text and source manifests are preserved.

Images use contain; portrait images are limited to 300 px high on desktop and 220 px on mobile. This leaves the approved Cicarelli image at its original 360×220 / 280×171 presentation. The three featured templates receive the same scoped container, typography and button base. No new dependencies or runtime JavaScript.

Visible catalogue labels are changed contextually only on catalogue links, breadcrumbs and its H1. SEO title, descriptions, canonical and JSON-LD are byte-identical. Public data, media, functions, forms and all content below the header are preserved; the verification script proves the authorized diff.

Release: run `python scripts/release-project-header-b.py --baseline <exact-previous-package> --destination <fresh-package>`; it verifies identity, media, unchanged metadata/body and the complete artifact hash diff before packaging. Do not regenerate historic records with older publication profiles. Keep main and this branch deploymentEnabled:false. Stage with Vercel --prebuilt --prod --skip-domain, validate, then promote explicitly.

Rollback: old deployment remains READY and was returned as a rollback candidate by the Vercel API. Official Vercel request_rollback (explicit project/team) or `vercel rollback dpl_DAo4ZEDA17geE8cFUn3cbkKCvXF7 --scope lsandoval2-8260s-projects` restores the prior release. Do not change protections. No submissions, reservations or outbound messages are part of validation.

## Publication
Production promoted to `dpl_35fUyemHC5JeAFyYm4t6DNH1zstm`, code `e0172a21db1ce9622fd1a4a90a62040d4acb6431`, from branch `codex/project-header-b-20261026`. The custom domain was checked before promotion and again afterwards; it points to this deployment. The prior production deployment is still READY.

The final package changes 136 HTML files (132 details plus only authorized catalogue labels in 4 other pages) and adds one shared CSS file. All other 986 artifact files, including every Function, dataset, photo, plan and existing CSS/JS file, are identical.

Browser checks cover standard, photo and featured templates, portrait and low-resolution originals, long names, commercial and mixed use, and sparse galleries. Desktop 1440 and mobile 390 widths: no horizontal page overflow; images load with contain; CTA opens project-specific advisory context; no form was submitted. Search returns the three Cicarelli stages; catalogue total is 132. Public Cicarelli was checked again at both widths after promotion. No browser console errors observed. Runtime error/fatal query from 02:57 to 03:12 UTC returned no matching records.

`public-http.json` records the final direct HTTP checks, hashes and live UF response. `candidate-checks.json` contains protected-candidate verification and representative browser measurements; screenshots include the public result on desktop and mobile.

Final result: 282/282 public checks passed. Live UF: CLP 41,221.08, 2026-10-26, SII. All 132 detail HTML responses and their unique hero assets match the release artifact; root/catalogue/contact/advisory labels, data, sitemap, robots, shared CSS, JS and WhatsApp asset also match. Private provenance/research URLs remain 404. No unresolved release blocker.
