# Catalogue image coverage and verified cover replacements

Baseline: production 86ee62407d3b6de77a95f3c86b992a9000332c04, READY deployment dpl_8iNWfR2uLFXvpxTLmc8EMBCrapsF. Source/evidence dd44a38303bcaa559fc4add937fb5d3a13845577. Independent branch codex/parallax-coverage-20261027; main and Git deployments remain disabled.

## Causes and changes
Actual painted width of an object-fit:contain image can be smaller than its CSS box. The former pixel-budget calculation incorrectly counted empty side margins as image pixels, suppressing motion in otherwise sufficient portrait/square images. Budget now uses painted width. Small list photos are admitted from 40px; nested branding placeholders remain excluded. Genuine low-resolution photos still keep the static safeguard. Near-fitting landscape photos use the larger safe travel of existing letterbox or approved fixed overscan, avoiding an unnecessary near-static result with sufficient source pixels. No changes to fade, gradients, hover zoom, layout sizes, commercial data, forms, maps, UF or functions.

Four small covers replaced in catalogue and fiche header using existing verified media, with descriptive alt text and generator preservation in project_cover.py and data/project-cover-overrides.json:
- Reserva Mayor 2: 400×300 → 900×600, existing official parcel landscape in its gallery.
- Trinidad III: 636×463 → 960×540 render from its Maestra brochure, page 1, native original 1698×956.
- San Ignacio: 510×510 → 1024×576 official pool photo of San Ignacio 280. Historical 270 brochure remains excluded.
- Jardines de Ramón Cruz: 593×444 → 1600×889 photograph of its common room, brochure page 3.
Full galleries and their previous photos are retained. No pixels generated, no image upscaling, no new binary media published.

## Remaining source limitations
Plaza Cervantes A: 532×399 cover. B: 636×463, all saved gallery alternatives same size. Existing stage-sharing policy is retained, but sharing these files does not increase source quality. Library title search found no Cervantes or Reserva Mayor brochure; San Ignacio matches are the previously excluded 270 document. Official Cervantes I/II brochure exists at https://maestra.cl/wp-content/uploads/2025/08/Brochure_Plaza_Cervantes-I-y-II.pdf but reads failed with HTTP 503 (twice), and web retrieval with 502. No unverified replacement was made. These two may remain static on high-density screens; both keep their valid current images.

## Validation
Read all 132 catalogue cover dimensions in Chrome. At the measured 387×230 cover box and DPR2, original geometry admitted 123; corrected geometry alone admits 127; verified cover replacements admit 130. The two remaining source limitations are the Cervantes stages. This is geometry coverage, not a claim every offscreen lazy image is always animated. Source-resolution safety still applies at other viewport sizes.
40 image-motion checks, 31 unchanged fade checks, 13 catalogue/map checks. Cover tests verify source membership, alt/dimensions, untouched gallery content and generator idempotence. Browser candidate/public results and rollback receipt follow release.

## Browser and release
Final preview dpl_ChaXixZvK6Sawk6BHJZEgS8vgJKC, code 77c9807f0047b1e27294b7fc3f43ae8cf5723598. Chrome 1440×900 and 390×844: all four cover replacements loaded and received motion, filtering and list/cards switches worked, clearing restored 132, fiche navigation and Back retained query/view, no document overflow. Reserva Mayor scroll y350 → y510 → y350: translate 1.201 → 17.900 → 1.201px. Hover still 1.16 → 1.2412. Mobile list thumbnail 84×63 now active.

Published production dpl_Dsq16PodMDmCnnhH7zBtVY4HHPUZ, URL https://project-wrapp-733oo9m0d-lsandoval2-8260s-projects.vercel.app; domain alias verified. Build checks all 1159 artifact hashes, aggregate e1fc3125970fd387eefabd5d73d5b35c88ad0da0b20d2417289b91a42628d96f. Public San Ignacio mobile scroll y719 → y819 → y719: 2.072 → 8.514 → 2.072px; photo 1024×576, no overflow. Runtime error/fatal scan in the 30-minute window returned no matching logs. Main remains 86e200ec191b38af355061e21bc0fc1e549cce3b; project live:false, deployment protection all_except_custom_domains retained.

Recovery: Vercel request_rollback with team team_A9VNIW2f2K1IJpd2pGdvDmEN, project prj_URomRRU0MAy4etGKP5gWv3Qv4DGH, target dpl_8iNWfR2uLFXvpxTLmc8EMBCrapsF. Previous production was verified READY immediately before publication.

155 public HTTP checks passed, including all 132 fiches, catalogue/data, four replacement image resources and UF (CLP 41,221.08 for 2026-10-26, still the current Chilean date). See public-checks.json.
