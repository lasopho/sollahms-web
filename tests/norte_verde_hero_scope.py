"""Undo only the four explicit protected Norte Verde hero packaging edits.
Every historical packaging byte remains checked by the original map scope guard.
"""

EDITS = (("const expectedBranches = new Set(['codex/fichas-proyectos-completas', 'codex/integracion-financiera-sollahms', 'codex/recorridos-validos-144', 'codex/mapas-recorridos-auto', 'codex/limpieza-mapas-fichas']);\n", "const expectedBranches = new Set(['codex/fichas-proyectos-completas', 'codex/integracion-financiera-sollahms', 'codex/recorridos-validos-144', 'codex/mapas-recorridos-auto', 'codex/limpieza-mapas-fichas', 'codex/norte-verde-hero-merge']);\n"), ('', "// This merged prototype is opt-in in its protected review branch only.\n// Main and every other build keep the original output and existing hero.\nconst heroReview = preview && process.env.VERCEL_GIT_COMMIT_REF === 'codex/norte-verde-hero-merge';\nconst heroSlugs = new Set(['bordevivo','carmen-marin','edificio-ecuador','edif-origen-atacama-3008','edificio-dual-390-lto','edificio-lira-622','edificio-plaza-nova','edificio-san-francisco-1204','edificio-verne','irarrazaval','parque-panama','parque-quinta','playa-penuelas','playa-serena','quintavista','vicuna-mackenna-6896','vista-bulnes']);\nconst heroAssets = new Set(['assets/css/norte-verde-hero-variants.css','assets/js/norte-verde-hero-variants.js','assets/review/norte-verde-hero-variantes.html']);\n"), ('', '  if (heroReview && heroSlugs.has(name.replace(/\\.html$/, \'\'))) {\n    if (!/<p class="eyebrow">Norte Verde<\\/p>/.test(html)) throw new Error(\'Hero review scope mismatch: \' + name);\n    html = html.replace(/class="project-hero([^"]*)"/, \'class="project-hero$1 nv-hero"\');\n    html = html.replace(\'</head>\', \'<link rel="stylesheet" href="/assets/css/norte-verde-hero-variants.css?v=20261014"><script src="/assets/js/norte-verde-hero-variants.js?v=20261014"></script></head>\');\n  }\n'), ('', '    if (!heroReview && heroAssets.has(path)) return false;\n'))


def restore_norte_verde_hero_packager(current):
    text = current.decode()
    if "const heroReview =" not in text:
        return current
    for before, after in EDITS:
        assert text.count(after) == 1, 'Norte Verde packaging edit changed'
        text = text.replace(after, before, 1)
    return text.encode()
