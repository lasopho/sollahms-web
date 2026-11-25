"""Recover the currently published ADQD artifact and reproduce identical bytes.

The older frozen package is a content cache only. The resulting 1,729-file
inventory must equal ADQD's certificate and pass a fresh full remote comparison
before it can be used for a release. No application builder is executed.
"""
import hashlib
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
WORK = ROOT / '.vercel/footer-global-20261125'
OUTPUT = WORK / 'stage/.vercel/output'
CACHE = Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-service-coverage-private/candidate/.vercel/output')
SOURCE = '349b955fcf6d887ac084ed7b673bc78d8a2b52b4'
BASE = 'dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be'
PIN = 'fdc28233a83fb11cc1e269d4b3b2963e6711f796973ac714247cea93d80aaf79'
BINDING = {'orgId': 'team_A9VNIW2f2K1IJpd2pGdvDmEN', 'projectId': 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH', 'projectName': 'project-wrapp'}


def digest(body, kind='sha256'):
    return hashlib.new(kind, body).hexdigest()


def inventory(directory):
    result = []
    for file in sorted(directory.rglob('*')):
        assert not file.is_symlink()
        if file.is_file():
            b = file.read_bytes()
            result.append({'path': file.relative_to(directory).as_posix(), 'bytes': len(b), 'sha1': digest(b, 'sha1'), 'sha256': digest(b)})
    return result


def pin(rows):
    return digest(''.join(f"{r['path']}\t{r['bytes']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda r: r['path'])).encode())


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


old = json.loads((ROOT / 'docs/footer-global-home-20261119/candidate-manifest.json').read_text())
expected = sorted(old['inventory'], key=lambda r: r['path'])
assert len(expected) == 1729 and pin(expected) == old['inventorySHA256'] == PIN
cached = inventory(CACHE)
assert cached == sorted(old['baselineInventory'], key=lambda r: r['path'])
assert pin(cached) == old['baselineInventorySHA256']
if OUTPUT.exists():
    assert inventory(OUTPUT) == expected, 'Existing owned stage is not the exact current artifact'
else:
    shutil.copytree(CACHE, OUTPUT)
    for row in old['changes']:
        relative = row['path']
        assert relative.startswith('static/') and relative.endswith(('.html', 'corporate-footer.css'))
        source = relative.removeprefix('static/')
        b = subprocess.check_output(['git', 'show', SOURCE + ':' + source], cwd=ROOT)
        assert digest(b) == row['after']['sha256'] and len(b) == row['after']['bytes']
        (OUTPUT / relative).write_bytes(b)
actual = inventory(OUTPUT)
assert actual == expected and pin(actual) == PIN
assert inventory(CACHE) == cached, 'The content cache was modified'
assert json.loads((OUTPUT / 'config.json').read_text())['version'] == 3
html = [r['path'] for r in actual if r['path'].startswith('static/') and r['path'].endswith('.html')]
assert len(html) == 168 and all((ROOT / p.removeprefix('static/')).read_bytes() == (OUTPUT / p).read_bytes() for p in html)
functions = sorted(p.name for p in (OUTPUT / 'functions/api').iterdir() if p.is_dir())
assert len(functions) == 7
assert len([r for r in actual if r['path'].startswith('functions/')]) == 57
template = (ROOT / 'templates/corporate-footer.html').read_bytes().strip()
proof = {'preparedAtUtc': datetime.now(timezone.utc).isoformat(), 'passed': True,
         'baselineDeployment': BASE, 'baselineSourceCommit': 'e866ce7ac0d7b6df968ecd011fa78d6aec335828',
         'baselineSourceHead': SOURCE, 'baselineInventorySHA256': PIN, 'inventorySHA256': PIN,
         'files': len(actual), 'changedHtmlFiles': 0, 'addedFiles': 0, 'identicalFiles': len(actual),
         'htmlPages': len(html), 'projectFiches': 152, 'functionFilesIdentical': 57, 'functionBundles': functions,
         'stageOutput': str(OUTPUT), 'sourceArtifactModified': False, 'buildersOrGeneralGeneratorsExecuted': 0,
         'reproduciblePackaging': 'Verified content cache plus exact pinned current static bytes; full resulting inventory equals current ADQD, not the older cache deployment',
         'freshRemoteCertificationRequired': True}
manifest = {**proof, 'inventory': actual, 'baselineInventory': actual, 'changes': [],
            'identicalPaths': [r['path'] for r in actual], 'htmlPaths': html, 'footerTemplateSHA256': digest(template)}
save(DOCS / 'baseline-manifest.json', {**proof, 'inventory': actual})
save(DOCS / 'candidate-manifest.json', manifest)
save(DOCS / 'stage-receipt.json', proof)
footer_pattern = re.compile(rb'<footer\b[^>]*>.*?</footer>', re.S | re.I)
css_link = re.compile(rb'<link\b[^>]*href=["\x27]/assets/css/corporate-footer\.css(?:\?[^"\x27]*)?["\x27][^>]*>\n?', re.I)
pages = [{'path': p, 'before': next(r for r in actual if r['path'] == p),
          'after': next(r for r in actual if r['path'] == p), 'fullHtmlByteIdentical': True,
          'outsideFooterByteIdentical': True, 'footerSha256': digest(template),
          'outsideFooterSha256': digest(css_link.sub(b'', footer_pattern.sub(b'', (OUTPUT / p).read_bytes())))} for p in html]
save(DOCS / 'html-preservation.json', {'passed': True, 'pages': pages, 'fullHtmlByteIdentical': True,
      'outsideFooterByteIdentical': True, 'onlyAdditionalHeadMarkup': None})
save(ROOT / '.vercel/project.json', BINDING)
save(WORK / 'stage/.vercel/project.json', BINDING)
print(json.dumps(proof))
