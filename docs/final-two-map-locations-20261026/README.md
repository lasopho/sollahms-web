# Final two catalogue locations — 2026-10-26

Base: production dpl_HphMyTm2PcfiYJdy8CvE41ThKRj1, code 8436c93361c1842f7fb05aa4ec653ccee19bb3f6, evidence/source 96eefe1bcb437816a4d47e0a4b7378b1d108c640. Independent branch codex/final-two-map-locations-20261026; main and all listed Git auto-deployments remain disabled.

## Evidence and scope
- Mirador La Florida: owner explicitly confirms Eugenia 8, La Florida. Sento confirms project identity and street, but does not publish the number; the fiche attributes confirmation to Sollahms, not to Sento. Google Maps manually selected address Eugenia 8 yields the actual !3d/!4d place point -33.5118008,-70.6099463.
- Marina Pacífico: owner, current Euro project page and official brochure pages 1–2 agree on Los Pescadores 5121, Coquimbo. Brochure map identifies the site behind Enjoy. Manually selected Marina Pacífico place yields -29.9476744,-71.2898966. This is not the @ camera center, a street midpoint, the sales office Costanera 5351, Marina Costa, Marina Horizonte or Playa Marina.
- Only two factual point references were manually checked. No Google tiles, photos, reviews, APIs, credentials or bulk extraction are used by the site. Exact source links and precision classifications are in accepted-locations.json. The existing Leaflet/OSM provider configuration and attribution remain intact. Locations remain referential; no metric accuracy or surveyed entrance is promised.
- Rejected Nominatim street results: Eugenia -33.5116100,-70.6093276; Los Pescadores -29.9544365,-71.3005397. Neither result identifies the requested building/number. Bounded OSM checks supplied no more precise matching address.
- Registry grows from 130 to 132, with no pending projects. All original 130 locations remain identical. Mirador address is reflected in shared catalogue, internal research and HTML; old unresolved-number messages removed. Sento regeneration respects the owner's later confirmation.
- Commercial dates, prices, stock, all media, forms, calculators, functions, SEO, visual effects and the concurrent Trabaja con nosotros fixes are unchanged. No real requests submitted, services purchased or new integrations enabled.

## Validation and recovery
28 automated catalogue/location/preservation checks pass. Frozen runtime package: 1,157 files, only 3 changed, 1,154 identical including all functions. Production must still match the recorded baseline before publishing. The previous READY deployment above is the rollback target using Vercel's authorized rollback mechanism. Browser and public verification results are appended after deployment.

Published code **de088c4acc3451413fe053b5176ebc3f14aaef9b**, production **dpl_HmkkoKEyVS7Qe37LHSeNWNLB7F4Q**. Public alias verified after publication. Public JSON and Mirador HTML match candidate bytes; catalogue, Marina fiche and Trabaja con nosotros remain byte-identical. Direct UF endpoint returns 2026-10-26 / CLP 41,221.08 from SII. The Vercel fetch helper adds preview-auth query parameters which the UF endpoint correctly rejects; a plain public GET succeeds. No application protection was changed.

Real Chrome checks: 1440×1000 and 390×844, both new markers, thumbnails, location text, correct fiche navigation, search and map view retained on return, list/map switching, clear-filter count 132/132, no horizontal overflow and no captured browser errors. Production error/fatal logs show none in the inspected window. All published functions retain baseline hashes; no forms were submitted. Screenshots: public-desktop.png (Mirador and all-results count), public-mobile.png (Marina selection and address).

Main remains 86e200ec191b38af355061e21bc0fc1e549cce3b. Project live=false and all_except_custom_domains SSO protection preserved; the new branch is explicitly false in git.deploymentEnabled. Rollback target remains READY. No remaining coordinate omissions in this 132-project catalogue; map references do not claim surveyed access or metre-level precision.
