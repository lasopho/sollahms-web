"""Validate existing evidence; no network, browsers, builders or commercial calls."""
import datetime
import hashlib
import json
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
DEPLOYMENT = 'dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh'
INVENTORY = 'de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0'
files = ['candidate-manifest.json', 'preservation.json', 'qa/acceptance-summary.json', 'verification/verification-summary.json', 'visual-review.json', 'preview-created.json']
data = {name: json.loads((DOCS / name).read_text()) for name in files}
m, p, q, v, visual, created = (data[name] for name in files)
checks = {}
def check(name, condition):
    checks[name] = bool(condition)

check('candidate_identity', m['outputInventorySha256'] == INVENTORY and m['files'] == 1660)
check('single_approved_html_delta', m['changedFiles'] == 1 and m['identicalFiles'] == 1659 and [c['path'] for c in m['changes']] == ['static/contacto.html'])
check('functions_and_pages', (m['functionBundles'], m['functionFiles'], m['htmlPages']) == (7, 57, 147))
check('preservation20', len(p['checks']) == 20 and all(p['checks'].values()) and p['candidateInventorySha256'] == INVENTORY)
check('qa_five_widths', q['passed'] and q['acceptedCases'] == 5 and set(q['widths']) == {1440, 1024, 768, 390, 320})
check('qa_identity', q['deployment'] == DEPLOYMENT and q['candidateInventorySha256'] == INVENTORY)
check('qa_form_safety', q['safety']['actualCommercialRequestsAllPhases'] == 0 and q['safety']['unsafeRequestsAttemptedAllPhases'] == 0 and q['safety']['acceptanceDomSubmitEvents'] == 0)
check('historical_dom_event_accounted', q['safety']['historicalDiagnosticEmptyDomSubmitEvents'] == 1)
check('qa_processes_closed', q['processes']['runnerClosed'] and q['processes']['profileRemoved'] and q['processes']['remainingManagedProcessGroups'] == 0)
check('remote_api_http', v['passed'] and v['deployment'] == DEPLOYMENT and v['candidate_inventory_sha256'] == INVENTORY and v['http_authenticated_completed'] == 32 and not v['failures'])
check('sso_and_aliases', all(c['pass'] for c in v['checks']) and v['anonymous_sso_control_executed'])
check('creation_preview_only', created['deploymentId'] == DEPLOYMENT and created['state'] == 'created' and created['target'] == 'preview' and created['productionAuthorized'] is False)
check('source_commit', m['sourceCommit'] == v['source_commit'] == created['sourceCommit'])
check('visual_review', visual['visualPassed'] and set(visual['widths']) == {1440, 1024, 768, 390, 320} and all(hashlib.sha256((DOCS / s['path']).read_bytes()).hexdigest() == s['sha256'] for s in visual['screenshots']))

archive_counts = {}
for name in ['recovery/manifest-sha256.json', 'verification/manifest-sha256.json', 'qa/MANIFEST-SHA256.json']:
    manifest_path = DOCS / name
    manifest = json.loads(manifest_path.read_text())
    entries = manifest['files']
    valid = True
    for entry in entries:
        path = manifest_path.parent / entry['path']
        body = path.read_bytes()
        valid = valid and len(body) == entry.get('bytes', entry.get('size')) and hashlib.sha256(body).hexdigest() == entry['sha256']
    archive_counts[name] = len(entries)
    check('archive_' + name, valid)
    files.append(name)

failed = [name for name, passed in checks.items() if not passed]
receipt = {
    'validatedAt': datetime.datetime.now(ZoneInfo('America/Santiago')).isoformat(),
    'deploymentId': DEPLOYMENT, 'result': 'PASS' if not failed else 'FAIL',
    'previewAccepted': not failed, 'candidateInventorySha256': INVENTORY,
    'productionAuthorized': False, 'productionCreationAllowedNow': False, 'promotionAllowedNow': False,
    'productionPreserved': 'dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5',
    'nextStage': 'Separate express owner authorization for Contacto; reconcile again if Production changed.',
    'checks': checks, 'failures': failed, 'archiveEntriesVerified': archive_counts,
    'evidence': [{'path': name, 'sha256': hashlib.sha256((DOCS / name).read_bytes()).hexdigest()} for name in files],
    'newNetworkOrBrowserTests': 0,
}
(DOCS / 'preview-approval.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: value for key, value in receipt.items() if key not in ['evidence', 'checks']}, ensure_ascii=False, indent=2))
assert not failed, failed
