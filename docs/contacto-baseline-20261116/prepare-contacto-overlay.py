"""Copy verified deployed bytes and replace the single approved Contacto file.

No builder, generator, dependency install, environment pull or deployment runs here.
"""
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.vercel/contacto-baseline-20261116'
BASE = WORK / 'baseline/output'
STAGE = WORK / 'preview'
OUTPUT = STAGE / '.vercel/output'
DOCS = Path(__file__).resolve().parent
BASE_HASH = 'f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0'
CONTACT_HASH = '02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1'
CERT = ROOT / 'docs/recorridos-eliminacion-20261115/local-qa-20261115/qa/supplement/inputs/verification-certified.json'

def digest(data, algorithm='sha256'):
    return hashlib.new(algorithm, data).hexdigest()

def canonical(rows):
    payload = ''.join(f"{r['path']}\t{r['size']}\t{r['sha256']}\n" for r in sorted(rows, key=lambda r: r['path']))
    return digest(payload.encode())

def verify(folder, rows):
    paths = {p.relative_to(folder).as_posix() for p in folder.rglob('*') if p.is_file()}
    assert paths == {r['path'] for r in rows}, 'Unexpected or missing artifact path'
    for r in rows:
        path = folder / r['path']
        assert not path.is_symlink(), 'Symlinks are not permitted'
        data = path.read_bytes()
        assert (len(data), digest(data, 'sha1'), digest(data)) == (r['size'], r['sha1'], r['sha256']), r['path']

cert = json.loads(CERT.read_text())
rows = cert['inventory']
assert cert['outputInventorySha256'] == BASE_HASH == canonical(rows)
assert len(rows) == 1660
verify(BASE, rows)
assert json.loads((BASE / 'config.json').read_text())['version'] == 3
contact = (ROOT / 'contacto.html').read_bytes()
assert digest(contact) == CONTACT_HASH and len(contact) == 18655
if not OUTPUT.exists():
    shutil.copytree(BASE, OUTPUT)
    (OUTPUT / 'static/contacto.html').write_bytes(contact)
else:
    assert (OUTPUT / 'static/contacto.html').read_bytes() == contact, 'Never overwrite an existing deployment candidate'
candidate = []
changes = []
for row in rows:
    r = dict(row)
    data = (OUTPUT / r['path']).read_bytes()
    r.update(size=len(data), sha1=digest(data, 'sha1'), sha256=digest(data))
    if r != row:
        changes.append({'path': r['path'], 'before': row, 'after': r})
    candidate.append(r)
assert [r['path'] for r in changes] == ['static/contacto.html']
verify(OUTPUT, candidate)
project = {'projectId': 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH', 'orgId': 'team_A9VNIW2f2K1IJpd2pGdvDmEN', 'projectName': 'project-wrapp'}
(STAGE / '.vercel/project.json').write_text(json.dumps(project) + '\n')
report = {
    'baselineDeployment': 'dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5',
    'baselineInventorySha256': BASE_HASH,
    'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
    'approvedContactoCommit': '967d556730e20ef86bae6ecee11ec6152434c8ae',
    'outputInventorySha256': canonical(candidate),
    'files': len(candidate), 'changedFiles': 1, 'identicalFiles': 1659,
    'functionFiles': sum(r['path'].startswith('functions/') for r in candidate),
    'functionBundles': len({r['path'].split('.func/', 1)[0] for r in candidate if r['path'].startswith('functions/')}),
    'htmlPages': sum(r['path'].startswith('static/') and r['path'].endswith('.html') for r in candidate),
    'changes': changes, 'inventory': candidate,
    'targetAuthorized': 'preview', 'productionAuthorized': False,
    'buildsExecuted': 0, 'generatorsExecuted': 0,
}
assert report['functionFiles'] == 57 and report['functionBundles'] == 7
(DOCS / 'candidate-manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k not in ['inventory', 'changes']}, ensure_ascii=False, indent=2))
