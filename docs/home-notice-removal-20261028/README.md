# Homepage notice removal — 2026-10-28

Removed the complete standalone Leben price-reference paragraph below the three featured homepage cards, including its spacing class. The portfolio CTA keeps its existing 64 px separation. The notice is removed from HTML, not hidden with CSS; no empty wrapper remains.

Only `static/index.html` changed among 1,159 frozen runtime files. All 132 fiches, individual commercial/legal notices, prices, surfaces, availability, data, images, scripts, styles, gradients, parallax, zoom, scroll fade, functions and routing remain byte-identical.

Published code `d881df923bce24085927a72179ade632e03b8e80`, deployment `dpl_8hBjJDaGCkPK8PQ3m8BEQ1izCY8B`, verified on https://sollahms.cl/. Preview and production builds verified every file against the SHA-256 manifest. Eleven public HTTP/hash checks passed, including homepage, catalogue, the three featured fiches, catalogue data and effect resources. Chrome review at 1440×900 and 390×844 confirmed no notice, no empty wrapper, no horizontal overflow, loaded images and correct CTA destination. Desktop screenshot attached. No error/fatal runtime logs found in the new deployment over the checked 15-minute window. No forms sent.

Rollback: previous READY production `dpl_Dsq16PodMDmCnnhH7zBtVY4HHPUZ` (code `77c9807`), available through Vercel request_rollback for project `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`. Main remains `86e200ec191b38af355061e21bc0fc1e549cce3b`. `main:false`, branch deployment disabled and project `live:false` retained; no merge or security changes.
