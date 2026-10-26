# Wider scroll fade

Baseline production: dpl_GAqHrVvYcRvwQ7r2iE4xRmdP26m5, code d202670983956dac159a0bd85051ff355c668143, source/evidence f0489c3dbd62c0dbed445ee9d56296ce1037ddfa. Verified through domain alias listing before editing.

The existing shared script now interpolates opacity from 5% to 100%, using the lower 35% of the unobstructed viewport for entry and upper 30% for exit. The central 35% is fully opaque for reading; tall groups retain their visible reading area. The actual fixed/sticky header heights determine the usable viewport. Exit reaches 5% eight pixels before the last edge goes behind the header. Smoothstep remains position-bound, reversible and idle-stable.

No second animation, time tween, DOM wrapper, layout change, blur, zoom or transform was added. Existing grouping, selected-text/keyboard-focus handling, static controls, reduced-motion support and fail-open behavior are preserved. Hover does not cancel opacity.

All 139 public pages use shared version 20261026-3 (132 fichas). Only shared JS/CSS and their cache references change in the deployed site. Data, SEO, media, functions, routing and approved B layout remain unchanged. Automatic deployments are disabled for main and codex/scroll-presence-intense-20261026.

31 behavioral assertions passed using the actual script: boundaries, fixed header, reverse-equivalence, idle stability, keyboard focus, selection, live reduced-motion toggling, fail-open and unsupported observer. Browser and deployment evidence will be recorded before marking this release published.

## Published verification

Production dpl_FiXdAifUNWKapc2kMTG4xvUagN7U, code a7290cba211ac73a7acbf88e2f9af31cf7d27e7c. Vercel API created a protected preview, then a production release with identical frozen files. The dependency-free copy build checks all 1124 SHA-256 values before writing output. Both build logs confirm the same aggregate hash. No environment-dependent compilation or dependency install occurs. deployment-files.json and copy-build.mjs preserve reproducible inputs. Main and this branch retain disabled automatic deployments.

148/148 final public HTTP checks match the candidate, covering all 139 HTML pages, shared files, catalogue, sitemap and UF. The catalogue retains 132 entries. UF is CLP 41,221.08 (SII, 2026-10-26). The earlier baseline scan crossed publication: its nine differing responses match the new candidate; that scan is not a release pass/fail gate.

75 browser observations cover old/new releases, desktop 1440×900 and mobile 390×844, homepage, catalogue, standard/featured fichas, contact, advisory and calculator. Small-step and large-step scrolling was checked forward/reverse. No overflow, nested opacity or animated protected controls. Matched reverse positions have identical opacity. Cursor movement and idle state leave opacity stable. Catalogue filtering returns three Cicarelli projects. Mobile navigation has the approved names. Keyboard focus restores full opacity and a visible outline. No forms were submitted. No browser console errors/warnings or matching production error/fatal logs in the recorded window. Reduced-motion toggling and error/no-observer fallback were tested in the actual-script harness; browser tests used normal device motion settings.

Matched-position comparison: desktop gallery introduction 0.530 → 0.313; mobile entering bedroom row 0.829 → 0.547, exiting address row 0.423 → 0.298. Central rows remain 1.000. Geometry, layout, text and images are unchanged.

GIFs are sequences of real public screenshots, not continuous recordings or FPS measurements. Original frames and DOM geometry/opacity are retained. Playback timing is illustrative; no generated imagery or interpolated frames.

Rollback dpl_GAqHrVvYcRvwQ7r2iE4xRmdP26m5 remains READY. Deployment Protection remains enabled (all_except_custom_domains). No new services or paid dependencies were added.
