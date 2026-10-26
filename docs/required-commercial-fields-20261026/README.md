# Four required commercial fields — 2026-10-26

Owner instruction supersedes optional RUT and exclusive email/phone collection. All 136 existing lead forms (132 fiches, home, contact, advisory and mortgage comparator) require Nombre completo → RUT → Correo electrónico → Teléfono. The calculator/search/filter forms are unaffected. The mortgage lead form retains its existing open-after-simulation flow; all four fields appear together when opened.

`commercial-fields.mjs` shares browser/server syntax validation and normalization. Name accepts Unicode letters, accents, spaces, hyphens and apostrophes; no surname-count assumption. RUT uses the existing modulo-11 validator and canonical body-DV; K accepted. Email validation is provider-independent. Chilean nine-digit local numbers gain +56; international numbers use + or 00 and a 7–15 digit international structure. Validation does not verify ownership, reachability, identity or creditworthiness.

Removed channel selection and all show/disable logic for email/phone. Quote/callback intent remains separate. Required disclosure and consent/privacy are aligned. Client errors stay adjacent to controls and focus centrally below fixed navigation; values survive validation/rejection. Optional message/goal/time remain optional. No new recipient, provider, CRM activation, automated booking or financial evaluation. Existing sender/recipient, preview block, origin, size, consent, timing and idempotency protections remain.

## Proven baseline and packaging

Production baseline: `dpl_8xfJsBW1M88w25SGXwXe5gGehz4H`, runtime `34bded6cd287d80f1207780ef1fc0c4f5e125d56`, source/evidence `0f4338a3d4cfcb99544251af0d79d305829bd709`. Both source API handlers matched frozen production SHA-256 before editing. Independent branch `codex/required-commercial-fields-20261026`; main and branch auto deploy false.

Frozen artifact uses the previous release's exact CAS references, replacing only changed public HTML/styles/form scripts, both API handlers, and adding shared validation to static and both function bundles. `candidate-hashes.json` and `deployment-files.json` describe the full production artifact. `copy-build.mjs` verifies all hashes and copies only that artifact to `.vercel/output`. No docs, tests or internal source catalogue are added to public output. Production excludes preview fixtures and retains original function configs and routing/protection.

Protected QA substitutes only the two function entrypoints with `tests/required-commercial-*-fixture.mjs`. They call the actual factories with an isolated in-memory transport and accept only synthetic fixtures containing all four normalized fields. They never use real provider credentials or send a message. Production has the real unchanged configured destination; no public POST is used during verification.

## Checks

- `python scripts/verify-required-commercial-fields.py`: all 136 forms, ordered required visible inputs, no exclusive selector, consent, accessibility/error IDs, preserved metadata/media/hero/gallery/plans/commercial data. Published datasets, financial engine, logo, theme and scroll effect exact.
- `node --test tests/required-commercial-fields.test.mjs tests/commercial-rut.test.mjs tests/project-request.test.mjs`: malformed/missing fields, real-name character coverage, K/dotted/plain RUT, local/international phones, normalization and isolated reception through both APIs, every project/stage context, quote/call intent, anti-abuse and idempotency. Synthetic fixtures only.
- Browser and post-release records are added after execution. No conversion improvement or mailbox delivery is claimed.

Rollback: retain baseline deployment above and use authorized Vercel `request_rollback` with this project if recovery is required. Do not merge main. Main reference remains `86e200ec191b38af355061e21bc0fc1e549cce3b`.

## Published and verified

Production `13cfd76` → `dpl_DKfCGLRiFZ3tkymA9dAmvhw3MFSe`, READY on sollahms.cl. Frozen build verified 1,136 files; 988 unchanged from baseline. 3,852 structural/preservation checks and 22 isolated test groups passed. Browser desktop/mobile results and their limits are recorded in `browser-qa.json`; public HTTP results in `public-checks.json`. No real submissions were sent. The only post-preview change was the contact introduction, checked publicly; all tested form code is identical. Runtime error/fatal scan returned no entries in the recorded window. `release.json` preserves deployment, exact artifact and ready rollback target.
