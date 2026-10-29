# Visible image-label cleanup — 28 October 2026

Owner-authorized scope: remove generic Render referencial / Imagen referencial
labels and equivalent render-type labels from every live project fiche. No media
retouching, no watermark removal, no commercial changes.

Baseline production: `9ec6f5c9bc77591991d6f867eeede495296ffc6e`,
deployment `dpl_BDoEXZSyZC4kJ6Ctjk42Qy28PcZN`.
Source parent including prior evidence: `5de7c2e1898c03a7ee9e45d99241e769de1100a7`.
Branch: `codex/remove-image-labels-20261028`; main and automatic deployments stay disabled.

Inventory: 132 live fiches within 140 public HTML pages. 33 fiches needed changes:
139 descriptive image captions cleaned and 12 standalone header badges removed.
The other 99 fiches and eight non-fiche HTML pages remain byte-for-byte identical.

`scripts/project_image_labels.py` applies the policy statically, after the shared
header renderer and Plaza override, and in both historical gallery importers.
It preserves useful scene descriptions, alt/ARIA descriptions, source provenance,
image enlargement links, plan labels and substantive separate commercial notices.
No generic disclaimer is replaced by a different visible generic label.
No label is merely hidden with CSS or JavaScript. The removed standalone badges
lose their complete elements; an empty badge group/caption is removed if present.

Validation compares every img/source/picture/iframe/script/style/link/form/head
element, image links, prices and substantive notices with the exact baseline.
All 1,175 output paths remain: 33 HTML files change; the other 1,142 files,
including original media, CSS, JavaScript and API functions, retain their hashes.
Existing motion/contact evidence is reused for these identical resources.

Legal/commercial scope: this removes site-generated generic visual labels only.
Separate substantive notices about plans, conditions, project stage and imagery
are retained, as are original embedded watermarks. It does not certify imagery
as photographs of completed works.

Rollback: the Vercel official request_rollback operation can restore
`dpl_BDoEXZSyZC4kJ6Ctjk42Qy28PcZN` on project
`prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, team `team_A9VNIW2f2K1IJpd2pGdvDmEN`.
The previous immutable deployment is retained and READY. No rollback was executed.

Public release IDs, browser observations and public HTTP verification are recorded
alongside this file after the candidate passes review.
