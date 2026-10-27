# Stronger parallax and project-card hover — 2026-10-26

Baseline production ce3b3c6 / dpl_LqKgXFwDTf9Gz3TzcPAHkh66WaJA; source/evidence 784600b273dc3bbc11f102e58afe666d8971717d. Independent branch codex/strong-parallax-hover-20261026, Git deployments disabled; no main changes.

Parallax covers the same 132 fiches and three homepage photos, plus catalogue card/list photos. The homepage hero remains its approved gradient without a new photograph. Scroll progress uses the actual fixed-header height and a shorter, more visible central traversal. Maximum displacement is ±36px desktop / ±18px mobile, bounded by each image's geometry and source resolution. Fixed overscan is capped at 16% desktop / 12% mobile; images with existing vertical contain margins instead move inside those margins at scale 1, retaining the full composition. Insufficient margins/resolution or unrelated transforms retain a static image.

Homepage and catalogue project images zoom 7% on hover for fine pointers, with a 320ms reversible scale transition. Text, badges, gradients, controls and card geometry do not scale. Scale and translate are separate CSS properties, so pointer entry/exit cannot reset the scroll offset. The existing fade still owns all opacity. Reduced motion, forced colors and print remove new movement and hover zoom. Touch does not require a first tap to trigger hover.

Catalogue filters replace cards; the shared controller registers current media and releases detached observers. No map tiles, logos, placeholders, plan images, forms or financial controls are animated. No provider, framework or external dependency was added.

Preservation checks reverse only resource-version updates on 133 HTML files and the motion resources on the catalogue. Fade script, theme/gradients, B header styles, commercial data, all 132 location records, every photograph/plan, functions and routes remain byte-identical. Frozen build output is checked against all 1,159 SHA-256 hashes before deployment. Automated checks: 34 image-motion, 31 fade, 13 catalogue/map. Browser/candidate/public results are appended after validation. Rollback is the baseline READY deployment through Vercel request_rollback.

## Browser candidate validation
Chrome, 1440×900 and 390×844. Visually inspected Cicarelli I header/gallery, homepage featured cards, catalogue cards and list. No document-level horizontal overflow; the existing local fiche anchor strip remains horizontally scrollable on narrow screens. Catalogue search Cicarelli returns 3/132; switching cards/list/map preserves it; clearing restores 132. Map unmount leaves zero motion frames, and returning registers the current 132 only. Map base tiles failed externally during this preview session; the existing fallback was shown. No map implementation/data changes were made. Opening Cicarelli I from the list and browser Back preserves query and Listado.

Measured Cicarelli gallery at desktop y650: -6.088px; y870: +15.383px; back y650: -6.088px. Mobile y1151: -1.348px; y1311: +9.609px; back: -1.348px. Original desktop gallery maximum was ±3.79px; candidate safe maximum ±16.006px for the sampled photo. Source-specific geometry determines actual range. Homepage and catalogue hover scale changes from 1.16 to 1.2412 (7% multiplication) while translate stays unchanged. Browser mobile viewport uses a desktop fine pointer; physical-touch behavior is governed by the CSS hover/pointer media query, not claimed as a hardware touch test.

Production deployment requested: dpl_8iNWfR2uLFXvpxTLmc8EMBCrapsF, code 86ee62407d3b6de77a95f3c86b992a9000332c04. Pre-publication alias still matched the baseline; main SHA remained 86e200ec191b38af355061e21bc0fc1e549cce3b, project live false and SSO protection all_except_custom_domains.

## Published and verified
Production dpl_8iNWfR2uLFXvpxTLmc8EMBCrapsF is READY and sollahms.cl points to it. Immutable deployment: https://project-wrapp-p2jun178v-lsandoval2-8260s-projects.vercel.app . Published code 86ee62407d3b6de77a95f3c86b992a9000332c04. Frozen build verified 1,159 files, aggregate c8990aa099c7920f0170de566c5f0eb10a65f3bcf4fd603c97e3a28c44ae1f76.

151 public HTTP checks passed, including every fiche, motion assets, catalogue code, preserved theme/fade/B-header, commercial data/locations, branding, contact/collaboration and absence of QA/build manifests. UF endpoint returned official 26/10/2026 value CLP 41,221.08 (still 26 October in Chile at verification). Production runtime error/fatal query returned no matching logs in the 30-minute window.

Real Chrome public Cicarelli gallery scroll positions 650 → 760 → 870 → 760 → 650 produce reversible image translation. Public catalogue hover changes scale to 1.2412 from 1.16 while translate remains 6.658px. The GIF is a sequence of five real browser captures, not a continuous video or a simulated rendering. Other files are labelled preview or public.

### Recovery
Official Vercel request_rollback, team team_A9VNIW2f2K1IJpd2pGdvDmEN, project prj_URomRRU0MAy4etGKP5gWv3Qv4DGH, deployment dpl_LqKgXFwDTf9Gz3TzcPAHkh66WaJA (previous READY production ce3b3c6). No rollback executed because validation passed. Independent branch remains codex/strong-parallax-hover-20261026 with Git deployments false, main false and no merge.
