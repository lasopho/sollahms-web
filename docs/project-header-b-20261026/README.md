# Approved B across project details

132 live catalogue routes, based on production dpl_DAo4ZEDA17geE8cFUn3cbkKCvXF7 and source 5704649e5fe45b4fad1e68b66747e43f20768327.

The shared renderer `scripts/project_header_b.py` uses B from preview code f438e5115142f549322ec0a0fed0ca582d9ed832. Shared CSS retains its grid, panel, sizes, spacing, typography, palette and breakpoints. Preview controls and its combined generic render/brochure caption are omitted; no replacement caption is rendered. Descriptive gallery captions and plan notices remain unchanged. All image URLs, alt text and source manifests are preserved.

Images use contain; portrait images are limited to 300 px high on desktop and 220 px on mobile. This leaves the approved Cicarelli image at its original 360×220 / 280×171 presentation. The three featured templates receive the same scoped container, typography and button base. No new dependencies or runtime JavaScript.

Visible catalogue labels are changed contextually only on catalogue links, breadcrumbs and its H1. SEO title, descriptions, canonical and JSON-LD are byte-identical. Public data, media, functions, forms and all content below the header are preserved; the verification script proves the authorized diff.

Release: run `python scripts/release-project-header-b.py --baseline <exact-previous-package> --destination <fresh-package>`; it verifies identity, media, unchanged metadata/body and the complete artifact hash diff before packaging. Do not regenerate historic records with older publication profiles. Keep main and this branch deploymentEnabled:false. Stage with Vercel --prebuilt --prod --skip-domain, validate, then promote explicitly.

Rollback: old deployment remains READY and was returned as a rollback candidate by the Vercel API. Official Vercel request_rollback (explicit project/team) or `vercel rollback dpl_DAo4ZEDA17geE8cFUn3cbkKCvXF7 --scope lsandoval2-8260s-projects` restores the prior release. Do not change protections. No submissions, reservations or outbound messages are part of validation.
