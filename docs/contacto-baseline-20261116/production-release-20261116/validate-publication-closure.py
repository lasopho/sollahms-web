"""Close the release from existing evidence; no additional network or browser QA."""
import datetime
import hashlib
import json
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
ID = 'dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w'
HASH = 'de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0'
names = ['production-gate.json', 'promotion-confirmed.json', 'post-promotion-project.json', 'public/verification-summary.json', 'browser/public/acceptance-summary.json', 'visual-public.json']
gate, promoted, project, http, browser, visual = [json.loads((DOCS / name).read_text()) for name in names]
checks = {
    'production_qa_before_promotion': gate['eligibleForPromotion'] and gate['productionQaPassed'] and gate['deploymentId'] == ID,
    'same_tested_id_published': promoted['deploymentId'] == ID and promoted['sameTestedDeploymentPromoted'] and promoted['promoted'] and not promoted['rebuildExecuted'],
    'both_aliases': promoted['aliasesApiVerified'] and {a['alias'] for a in promoted['aliases']} == {'sollahms.cl', 'www.sollahms.cl'} and all(a['deploymentId'] == ID for a in promoted['aliases']),
    'www_308': any(a['alias'] == 'www.sollahms.cl' and a['redirect'] == 'sollahms.cl' and a['redirectStatusCode'] == 308 for a in promoted['aliases']),
    'project_settings_preserved': project['passed'] and all(project['checks'].values()),
    'http_648': http['passed'] and http['expectedProductionId'] == ID and http['candidateInventorySha256'] == HASH and http['completedChecks'] == http['passedChecks'] == http['expectedChecks'] == 648 and http['failedChecks'] == 0,
    'fiches_and_tours': http['preservedFicheSlugs'] == 131 and http['preservedFicheChecks'] == 524 and http['publishedTourUiNodes'] == 0,
    'public_safety': http['safety']['formSubmissions'] == http['safety']['commercialRequests'] == http['safety']['providerWrites'] == 0 and not http['safety']['ufProviderLookup'] and not http['safety']['authHeadersSent'] and not http['safety']['cookiesSentOrStored'],
    'public_browser_five_widths': browser['passed'] and browser['deployment'] == ID and browser['candidateInventorySha256'] == HASH and browser['acceptedCases'] == 5 and set(browser['widths']) == {1440, 1024, 768, 390, 320},
    'public_browser_safety': browser['safety']['domSubmitEvents'] == browser['safety']['actualCommercialRequests'] == browser['safety']['unsafeRequestsAttempted'] == browser['safety']['apiRequestsAttempted'] == 0,
    'processes_closed': browser['runnerClosed'] and browser['profileRemoved'] and not browser['managedProcessesRemaining'] and http['processes']['runnerClosed'] and http['processes']['remainingManagedProcessGroups'] == 0,
    'visual_public': visual['visualPassed'] and visual['deploymentId'] == ID and all(hashlib.sha256((DOCS / r['path']).read_bytes()).hexdigest() == r['sha256'] for r in visual['screenshots']),
}
archives = {}
for name in ['preparation/manifest-sha256.json', 'verification/manifest-sha256.json', 'browser/isolated/MANIFEST-SHA256.json', 'browser/public/MANIFEST-SHA256.json', 'public/manifest-sha256.json']:
    path = DOCS / name
    rows = json.loads(path.read_text())['files']
    valid = True
    for row in rows:
        body = (path.parent / row['path']).read_bytes()
        valid = valid and len(body) == row.get('bytes', row.get('size')) and hashlib.sha256(body).hexdigest() == row['sha256']
    checks['archive_' + name] = valid
    archives[name] = len(rows)
    names.append(name)
failures = [name for name, value in checks.items() if not value]
report = {
    'closedAt': datetime.datetime.now(ZoneInfo('America/Santiago')).isoformat(),
    'completed': not failures, 'deploymentId': ID, 'candidateInventorySha256': HASH,
    'publishedAtSantiago': promoted['domainAssignmentServerAtSantiago'],
    'previousProduction': 'dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5',
    'checks': checks, 'failures': failures, 'archiveEntriesVerified': archives,
    'evidence': [{'path': name, 'sha256': hashlib.sha256((DOCS / name).read_bytes()).hexdigest()} for name in names],
    'newNetworkOrBrowserTests': 0, 'additionalPublicationNeeded': False,
}
(DOCS / 'publication-closure.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k not in ['checks', 'evidence']}, ensure_ascii=False, indent=2))
assert not failures, failures
