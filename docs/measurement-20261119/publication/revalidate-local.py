"""Read-only local revalidation of the authorized prebuilt release; no network."""
import hashlib
import importlib.util
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[3]
PRIVATE = Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c')
APPROVED = 'f914590010cf0b4ac930c41a59b648da3be1ab31'
BASE_SHA = 'c4b1a07527291aa020ebef549aa32f0bb2f2858f9f55312482584f333b14319b'
CANDIDATE_SHA = '0348f6339b2fe315afb94076abdcca7cc0791a663c5fe639457ec5791040c1fe'
sha = lambda data: hashlib.sha256(data).hexdigest()
spec = importlib.util.spec_from_file_location('packager', ROOT / 'scripts/prepare-measurement-review.py')
packager = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packager)
base_raw = (PRIVATE / 'sollahms-seo-geo-private/candidate-current-inventory.json').read_bytes()
candidate_raw = (PRIVATE / 'sollahms-measurement-private/candidate-release-inventory.json').read_bytes()
assert sha(base_raw) == BASE_SHA and sha(candidate_raw) == CANDIDATE_SHA
before = packager.inventory(PRIVATE / 'sollahms-seo-geo-private/candidate-current/.vercel/output')
after = packager.inventory(PRIVATE / 'sollahms-measurement-private/candidate-release/.vercel/output')
assert before == json.loads(base_raw)['files'] and after == json.loads(candidate_raw)['files']
changed = {k for k in before.keys() & after.keys() if before[k] != after[k]}
added, removed = after.keys() - before.keys(), before.keys() - after.keys()
assert changed == packager.CHANGED and added == packager.ADDED and not removed
assert (len(before), len(after), len(changed), len(added)) == (1723, 1727, 17, 4)
for relative in changed | added:
    source = relative.removeprefix('static/')
    approved_bytes = subprocess.check_output(['git', 'show', APPROVED + ':' + source], cwd=ROOT)
    assert sha(approved_bytes) == after[relative]['sha256'] == sha((ROOT / source).read_bytes()), source
protected = {k for k in before if k == 'config.json' or k.startswith('functions/')}
assert all(before[k] == after[k] for k in protected)
function_files = {k for k in protected if k.startswith('functions/')}
assert len(function_files) == 57
assert len({k.split('.func/')[0] for k in function_files}) == 7
scope = json.loads((ROOT / 'docs/seo-measurement/scope-v3.json').read_text())
fiches = scope['excluded_project_urls']
assert len(fiches) == 152
excluded = set(fiches + scope.get('excluded_strategy_urls', []))
for url in excluded:
    key = 'static' + urlsplit(url).path
    assert key in before and before[key] == after[key], key
assert before['static/robots.txt'] == after['static/robots.txt']
before_xml = (PRIVATE / 'sollahms-seo-geo-private/candidate-current/.vercel/output/static/sitemap.xml').read_bytes()
after_xml = (PRIVATE / 'sollahms-measurement-private/candidate-release/.vercel/output/static/sitemap.xml').read_bytes()
# The packager already has the exact one-document sitemap guard; independently compare its actual changed lines.
before_lines, after_lines = before_xml.splitlines(), after_xml.splitlines()
assert len(before_lines) == len(after_lines)
xml_changes = [(a, b) for a, b in zip(before_lines, after_lines) if a != b]
assert len(xml_changes) == 1
assert b'https://sollahms.cl/privacidad.html' in xml_changes[0][0]
assert xml_changes[0][0].replace(b'2026-10-25', b'2026-11-19') == xml_changes[0][1]
simulation_path = ROOT / 'docs/measurement-20261119/release-simulation.json'
simulation = json.loads(simulation_path.read_text())
assert simulation['passed'] and len(simulation['checks']) == 10
assert simulation['inputEvidence']['baseInventorySHA256'] == BASE_SHA
assert simulation['inputEvidence']['candidateInventorySHA256'] == CANDIDATE_SHA
result = {
    'observedAtUTC': datetime.now(timezone.utc).isoformat(), 'status': 'passed',
    'approvedRuntimeCommit': APPROVED, 'workingHead': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
    'baseDeployment': 'dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH',
    'baseInventorySHA256': BASE_SHA, 'candidateInventorySHA256': CANDIDATE_SHA,
    'baseFiles': len(before), 'candidateFiles': len(after), 'modifiedFiles': len(changed),
    'addedFiles': len(added), 'removedFiles': len(removed), 'unchangedFiles': len(before)-len(changed),
    'allArtifactBytesRehashed': True, 'authorizedOverlaySourceFilesCheckedAgainstCommit': len(changed | added),
    'functionsByteIdentical': 7, 'functionFilesByteIdentical': len(function_files), 'runtimeConfigByteIdentical': True,
    'excludedFichesByteIdentical': len(fiches), 'allRegisteredStrategyExclusionsByteIdentical': True,
    'robotsByteIdentical': True, 'sitemapOnlyPrivacyLastmodChanged': True,
    'moduleSHA256': after['static/assets/js/site-measurement.mjs']['sha256'],
    'measurementConfigSHA256': after['static/data/site-measurement.json']['sha256'],
    'simulationReused': {'file': '../release-simulation.json', 'sha256': sha(simulation_path.read_bytes()), 'checksPassed': 10, 'rerun': False},
    'networkRequests': 0, 'realProviderCalls': 0, 'realSubmissions': 0, 'productionChanged': False,
    'limits': ['This is local artifact/source verification; it does not certify a future remote deployment or promotion.',
               'The baseline provides unchanged runtime bytes; the authorized commit supplies the bounded 21-file overlay.']}
out = Path(__file__).with_name('local-revalidation.json')
out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': result['status'], 'files': len(after), 'overlay': len(changed | added), 'functions': 7, 'fiches': len(fiches)}))
