"""Overlay only the unified footer HTML and its stylesheet on verified production."""
import hashlib
import json
import re
import shutil
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
BASE = Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-service-coverage-private/candidate/.vercel/output')
WORK = ROOT / '.vercel/footer-global-home-20261119'
STAGE = WORK / 'stage'
OUTPUT = STAGE / '.vercel/output'
BASE_PIN = 'f11c8fc8f816db5bf104866fc4f8bc439917674a0d210de90edc3cef3733ce1e'
FOOTER = re.compile(rb'<footer\b[^>]*>.*?</footer>', re.S)
CSS_LINK = re.compile(rb'<link\b[^>]*href=["\x27]/assets/css/corporate-footer\.css(?:\?[^"\x27]*)?["\x27][^>]*>\n?', re.I)
LINK = {'orgId': 'team_A9VNIW2f2K1IJpd2pGdvDmEN', 'projectId': 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH', 'projectName': 'project-wrapp'}
def record(path, body):
    return {'path': path, 'bytes': len(body), 'sha1': hashlib.sha1(body).hexdigest(), 'sha256': hashlib.sha256(body).hexdigest()}
def inventory(directory):
    rows = []
    for file in sorted(directory.rglob('*')):
        assert not file.is_symlink(), 'Symlinks are not accepted in the certified artifact.'
        if file.is_file():
            rows.append(record(file.relative_to(directory).as_posix(), file.read_bytes()))
    return rows
def pin(rows):
    return hashlib.sha256(''.join(f"{r['path']}\t{r['bytes']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda r: r['path'])).encode()).hexdigest()
def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
def main():
    baseline = json.loads((DOCS / 'baseline-manifest.json').read_text())
    expected = sorted(baseline['inventory'], key=lambda r: r['path'])
    assert len(expected) == 1728 and pin(expected) == BASE_PIN
    before = inventory(BASE)
    assert before == expected and pin(before) == BASE_PIN, 'Current source artifact differs from the published certificate.'
    by_path = {r['path']: r for r in before}
    html = [r['path'] for r in before if r['path'].startswith('static/') and r['path'].endswith('.html')]
    assert len(html) == 168
    template = (ROOT / 'templates/corporate-footer.html').read_bytes().strip()
    assert template.startswith(b'<footer') and template.endswith(b'</footer>')
    changes, preservation = [], []
    for path in html:
        original = (BASE / path).read_bytes()
        body = (ROOT / path.removeprefix('static/')).read_bytes()
        old, new = FOOTER.findall(original), FOOTER.findall(body)
        assert len(old) == len(new) == 1 and new[0] == template, 'Footer component differs: ' + path
        assert len(CSS_LINK.findall(body)) == 1 and not CSS_LINK.search(original)
        old_outside = FOOTER.sub(b'', original)
        new_outside = CSS_LINK.sub(b'', FOOTER.sub(b'', body))
        assert old_outside == new_outside, 'Non-footer HTML changed: ' + path
        preservation.append({'path': path, 'outsideFooterSha256': hashlib.sha256(old_outside).hexdigest(),
                             'outsideFooterByteIdentical': True, 'footerSha256': hashlib.sha256(new[0]).hexdigest(),
                             'before': by_path[path], 'after': record(path, body)})
    if STAGE.exists():
        receipt = json.loads((WORK / 'stage-receipt.json').read_text())
        assert receipt['baselineDeployment'] == 'dpl_GCSXniYKZJdHgNbuW3fNtFqBt9Jn' and receipt['stageOutput'] == str(OUTPUT)
        assert json.loads((STAGE / '.vercel/project.json').read_text()) == LINK and not STAGE.is_symlink()
        shutil.rmtree(STAGE)
    shutil.copytree(BASE, OUTPUT)
    save(STAGE / '.vercel/project.json', LINK)
    save(ROOT / '.vercel/project.json', LINK)
    for path in html:
        shutil.copy2(ROOT / path.removeprefix('static/'), OUTPUT / path)
    css = 'static/assets/css/corporate-footer.css'
    shutil.copy2(ROOT / 'assets/css/corporate-footer.css', OUTPUT / css)
    after = inventory(OUTPUT)
    observed = {r['path']: r for r in after}
    assert set(observed) - set(by_path) == {css} and not set(by_path) - set(observed)
    changes = [{'path': path, 'before': by_path.get(path), 'after': row} for path, row in observed.items() if row != by_path.get(path)]
    assert {r['path'] for r in changes} == set(html) | {css}
    identical = [path for path in by_path if by_path[path] == observed[path]]
    assert len(identical) == 1560 and len(after) == 1729
    assert all(observed[p] == by_path[p] for p in by_path if p.startswith('functions/'))
    assert len([p for p in by_path if p.startswith('functions/')]) == 57
    functions = sorted(p.name for p in (OUTPUT / 'functions/api').iterdir() if p.is_dir())
    assert len(functions) == 7
    for path in ['config.json', 'static/data/site-measurement.json', 'static/assets/js/site-measurement.mjs',
                 'static/assets/js/scroll-presence.js', 'static/robots.txt', 'static/sitemap.xml']:
        assert observed[path] == by_path[path], 'Protected runtime changed: ' + path
    assert json.loads((OUTPUT / 'config.json').read_text())['version'] == 3
    assert inventory(BASE) == before, 'Published source was modified.'
    candidate_pin = pin(after)
    result = {'preparedAt': datetime.now(ZoneInfo('America/Santiago')).isoformat(), 'passed': True,
        'baselineDeployment': 'dpl_GCSXniYKZJdHgNbuW3fNtFqBt9Jn', 'baselineInventorySHA256': BASE_PIN,
        'inventorySHA256': candidate_pin, 'files': len(after), 'changedHtmlFiles': 168, 'addedFiles': 1,
        'identicalFiles': len(identical), 'functionFilesIdentical': 57, 'functionBundles': functions,
        'outsideFooterPreservedPages': len(preservation), 'projectFiches': 152, 'sourceArtifactModified': False,
        'stageOutput': str(OUTPUT), 'buildersOrGeneralGeneratorsExecuted': 0}
    save(WORK / 'stage-receipt.json', result)
    save(DOCS / 'stage-receipt.json', result)
    save(DOCS / 'candidate-manifest.json', {**result, 'baselineInventory': before, 'inventory': after,
        'changes': changes, 'identicalPaths': identical, 'htmlPaths': html,
        'footerTemplateSHA256': hashlib.sha256(template).hexdigest()})
    save(DOCS / 'html-preservation.json', {'passed': True, 'pages': preservation,
        'onlyAdditionalHeadMarkup': '/assets/css/corporate-footer.css', 'outsideFooterByteIdentical': True})
    print(json.dumps(result, ensure_ascii=False))
if __name__ == '__main__':
    main()
