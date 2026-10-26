# Shared scroll presence

Production baseline: `dpl_35fUyemHC5JeAFyYm4t6DNH1zstm`, code `e0172a21db1ce9622fd1a4a90a62040d4acb6431`, evidence `59af559`.

The homepage's previous `b2-scroll-presence` animations were overridden by `home-seo.css` and its imperative selectors were empty. Existing decorative diagram motion remains unchanged. The shared progressive script applies a restrained opacity fade near viewport edges, reaching full opacity in the reading area. It never alters positions, colors, typography or image sizes. Approved B remains intact.

Content defaults to visible without JavaScript or IntersectionObserver support. Reduced motion, forced colors, printing, hover and keyboard focus retain full opacity. Forms, navigation, sidebars, financial controls and status messages are excluded. Dynamically rendered catalogue cards are observed after filtering without touching their data or controls.

`scripts/scroll_presence.py` is the idempotent page inclusion helper; both templates and the shared B renderer include it. `scripts/release-scroll-presence.py` checks the complete HTML against the exact baseline allowing only the versioned stylesheet URL and script tag, then overlays those changes. Data, media, functions and routing are byte-identical.

Branch `codex/scroll-fade-20261026` and main retain automatic deployments disabled. Stage the verified output with official Vercel `--prebuilt --prod --skip-domain`, validate, then promote. Rollback target is the production baseline above, using Vercel `request_rollback` scoped to `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH` / `team_A9VNIW2f2K1IJpd2pGdvDmEN`.

Publication and browser results will be recorded separately after verification.
