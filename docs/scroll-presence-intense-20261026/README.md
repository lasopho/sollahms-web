# Wider scroll fade

Baseline production: dpl_GAqHrVvYcRvwQ7r2iE4xRmdP26m5, code d202670983956dac159a0bd85051ff355c668143, source/evidence f0489c3dbd62c0dbed445ee9d56296ce1037ddfa. Verified through domain alias listing before editing.

The existing shared script now interpolates opacity from 5% to 100%, using the lower 35% of the unobstructed viewport for entry and upper 30% for exit. The central 35% is fully opaque for reading; tall groups retain their visible reading area. The actual fixed/sticky header heights determine the usable viewport. Exit reaches 5% eight pixels before the last edge goes behind the header. Smoothstep remains position-bound, reversible and idle-stable.

No second animation, time tween, DOM wrapper, layout change, blur, zoom or transform was added. Existing grouping, selected-text/keyboard-focus handling, static controls, reduced-motion support and fail-open behavior are preserved. Hover does not cancel opacity.

All 139 public pages use shared version 20261026-3 (132 fichas). Only shared JS/CSS and their cache references change in the deployed site. Data, SEO, media, functions, routing and approved B layout remain unchanged. Automatic deployments are disabled for main and codex/scroll-presence-intense-20261026.

31 behavioral assertions passed using the actual script: boundaries, fixed header, reverse-equivalence, idle stability, keyboard focus, selection, live reduced-motion toggling, fail-open and unsupported observer. Browser and deployment evidence will be recorded before marking this release published.
