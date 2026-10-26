# Visible, position-bound scroll presence

Baseline: dpl_5zih4HpL2dAHqvXimqdSpg17zyuf / code 99a49a6797882ab8fdc6527db857d25e2aebf4df / evidence ddfe6a4. Reconstructed exact production artifact: all 1124 SHA-256 hashes match its stored manifest. Public JS and shared CSS also matched before editing.

Shared files remain assets/js/scroll-presence.js and assets/css/sollahms-theme.css. Opacity ranges from .10 to 1 using a smoothstep over the lower/upper 25% of the unobstructed viewport. Exit reaches .10 8px before the block's last edge passes behind the fixed header. The middle stays opaque. No time tween: identical geometry produces identical opacity in either scroll direction and while stopped.

Semantic groups: identity/location, heading + introductory paragraphs (same opacity without new layout wrappers), figures, cards, label/value pairs and steps. Only one opacity level per descendant chain. Long text/list sections split into manageable blocks. No per-word/line animation. Existing data and DOM structure remain unchanged. Homepage card rules explicitly supersede older forced-opacity CSS. Generic hover no longer cancels the fade; keyboard focus, active controls, open details and selected text remain fully visible.

Forms, navigation, sidebars, live status and the entire mortgage workspace stay static. Reduced-motion or unsupported IntersectionObserver leaves all content opaque; exceptions fail open. The JS batches geometry reads before opacity writes, observes only nearby groups and requests no continuous idle frames. No new dependencies, transforms, blur or zoom.

31 automated behavioral assertions passed using the actual script in an isolated DOM harness: boundary values, header inset, reverse equivalence, idle stability, focus, selection, live reduced-motion toggling, failure fallback and unsupported observer. Real browser verification follows on the staged candidate. No-JavaScript defaults and reduced-motion CSS also preserve visibility. Reference: MDN requestAnimationFrame and prefers-reduced-motion documentation checked 2026-10-26.

Release via the existing guarded overlay script, with source-only changes to cache-version references in all 139 public HTML pages. All media, 132 ficha contents/layout, commercial data, functions, routing, SEO and WhatsApp stay identical. Stage --prebuilt --prod --skip-domain; validate then explicitly promote. Preserve prior deployment READY as rollback. Main and codex/scroll-presence-strong-20261026 auto deployments remain false.
