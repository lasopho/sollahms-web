#!/usr/bin/env python3
"""Overlay scroll-only changes on a hash-verified production build."""
from pathlib import Path
import argparse, hashlib, json, shutil, sys
from scroll_presence import apply_scroll_presence

ROOT = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument('--baseline', required=True)
ap.add_argument('--destination', required=True)
args = ap.parse_args()
base, dest = Path(args.baseline), Path(args.destination)
public = base / '.vercel/output/static'
pages = sorted(p.name for p in public.glob('*.html'))
assert pages
for name in pages:
    old = (public / name).read_text()
    new = (ROOT / name).read_text()
    assert new == apply_scroll_presence(old), name
    assert apply_scroll_presence(new) == new, name
    assert new.count('/assets/js/scroll-presence.js') == 1, name
assert (ROOT / 'data/proyectos.json').read_bytes() == (public / 'data/proyectos.json').read_bytes()
cfg = json.loads((ROOT / 'vercel.json').read_text())
assert cfg['git']['deploymentEnabled']['main'] is False
assert cfg['git']['deploymentEnabled']['codex/scroll-presence-intense-20261026'] is False
assert not dest.exists()
shutil.copytree(base, dest)
overlay = pages + ['assets/css/sollahms-theme.css', 'assets/js/scroll-presence.js']
for path in overlay:
    target = dest / '.vercel/output/static' / path
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / path, target)
shutil.copy2(ROOT / 'vercel.json', dest / 'vercel.json')
(dest / '.vercel/project.json').write_text(json.dumps({
    'projectId':'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH',
    'orgId':'team_A9VNIW2f2K1IJpd2pGdvDmEN', 'projectName':'project-wrapp'
}) + '\n')
def hashes(root):
    return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest()
            for p in root.rglob('*') if p.is_file()}
before = hashes(base / '.vercel/output')
after = hashes(dest / '.vercel/output')
changed = [p for p in before if before[p] != after.get(p)]
added = sorted(set(after) - set(before))
assert not set(before) - set(after)
assert set(changed + added) == {'static/' + p for p in overlay}
assert all(before[p] == after[p] for p in before if not p.startswith('static/'))
report = {'baselineDeployment':'dpl_GAqHrVvYcRvwQ7r2iE4xRmdP26m5',
          'baselineCommit':'d202670983956dac159a0bd85051ff355c668143',
          'pages':pages, 'fichas':len(json.loads((public/'data/proyectos.json').read_text())),
          'contentAndMetadataIdentical':True, 'functionsAndRoutingIdentical':True,
          'catalogueAndMediaIdentical':True, 'changed':changed, 'added':added,
          'unchangedFiles':len(before)-len(changed), 'sha256':after}
docs = ROOT / 'docs/scroll-presence-intense-20261026'
docs.mkdir(parents=True, exist_ok=True)
(docs/'package-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['sha256','pages','changed','added']},indent=2))
print('Pages',len(pages),'changed',len(changed),'added',len(added))
