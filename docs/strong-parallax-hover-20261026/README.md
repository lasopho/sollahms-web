# Stronger parallax and project-card hover — 2026-10-26

Baseline production ce3b3c6 / dpl_LqKgXFwDTf9Gz3TzcPAHkh66WaJA; source/evidence 784600b273dc3bbc11f102e58afe666d8971717d. Independent branch codex/strong-parallax-hover-20261026, Git deployments disabled; no main changes.

Parallax covers the same 132 fiches and three homepage photos, plus catalogue card/list photos. The homepage hero remains its approved gradient without a new photograph. Scroll progress uses the actual fixed-header height and a shorter, more visible central traversal. Maximum displacement is ±36px desktop / ±18px mobile, bounded by each image's geometry and source resolution. Fixed overscan is capped at 16% desktop / 12% mobile; images with existing vertical contain margins instead move inside those margins at scale 1, retaining the full composition. Insufficient margins/resolution or unrelated transforms retain a static image.

Homepage and catalogue project images zoom 7% on hover for fine pointers, with a 320ms reversible scale transition. Text, badges, gradients, controls and card geometry do not scale. Scale and translate are separate CSS properties, so pointer entry/exit cannot reset the scroll offset. The existing fade still owns all opacity. Reduced motion, forced colors and print remove new movement and hover zoom. Touch does not require a first tap to trigger hover.

Catalogue filters replace cards; the shared controller registers current media and releases detached observers. No map tiles, logos, placeholders, plan images, forms or financial controls are animated. No provider, framework or external dependency was added.

Preservation checks reverse only resource-version updates on 133 HTML files and the motion resources on the catalogue. Fade script, theme/gradients, B header styles, commercial data, all 132 location records, every photograph/plan, functions and routes remain byte-identical. Frozen build output is checked against all 1,159 SHA-256 hashes before deployment. Automated checks: 34 image-motion, 31 fade, 13 catalogue/map. Browser/candidate/public results are appended after validation. Rollback is the baseline READY deployment through Vercel request_rollback.
