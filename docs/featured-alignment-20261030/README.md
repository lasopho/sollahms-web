# Featured labels and alignment — published 2026-10-30

Only public runtime index.html changed. All three featured cards use Tipologías / Superficie / Precio. Values, descriptions, images, CTA links, scripts, forms, metadata and all other runtime artifacts unchanged. Scoped CSS subgrid aligns corresponding rows; mobile uses expandable rows without truncation. The shared featured-card renderer calls featured_card_layout.py to retain this after regeneration.

Verified Chrome responsive widths1440,768,390. At1440 all three card heights743px, price tops817.492px and CTA tops897.492px. At390 all three heights772px, relative price tops618px and CTA tops698px, no clipped text/horizontal overflow. At768 all three heights921px, no card overflow. Public homepage checked byte-for-byte and live DOM alignment/labels confirmed. No errors/fatal logs found. No form submissions. Viewport reset.

Code d4a3a0e091382fa4f5da220180838d66b5db312b. Production dpl_HPaQBecKrnrZ25qAnZ2ifMzt9rT7; verified sollahms.cl. Rollback dpl_BT3YKrnog5mFZXdmJd8QNSBhcir8. Main unchanged86e200ec191b38af355061e21bc0fc1e549cce3b. main/branch codex/featured-card-alignment-20261030 automatic deployments false.1625 package entries retained; only index.html plus integrity hash/branch config changed. Protection and frozen builder unchanged.
