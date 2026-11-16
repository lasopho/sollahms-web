"""Validate all certificates, then freshly recheck aliases before promotion."""
import hashlib
import importlib.util
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('footer_remote', DOCS.parent / 'remote-integrity.py')
remote_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(remote_module)
api = remote_module.api
def read(name):
    return json.loads((DOCS / name).read_text())
def save(name, value):
    (DOCS / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
auth, created = read('authorization.json'), read('created.json')
integrity, browser = read('verification/isolated-summary.json'), read('browser/isolated/results.json')
visual = read('browser/isolated/visual-review.json')
assert visual['passed'] and visual['deploymentId'] == created['deploymentId'] and len(visual['images']) == 10
assert auth['explicitAuthorization'] and auth['promotionAuthorized'] and not auth['mergeAuthorized']
assert created['target'] == created['reportedTarget'] == 'production'
assert created['prebuilt'] and created['skipDomain']
assert integrity['passed'] and all(row.get('passed', row.get('pass', False)) for row in integrity['checks'])
assert browser['passed'] and len(browser['cases']) == 10 and all(row['passed'] for row in browser['cases'])
assert browser['widths'] == [1440, 1024, 768, 390, 320]
assert not any(browser[key] for key in ['pageErrors', 'failedResources', 'consoleErrors', 'blockedExternal', 'blockedAPIs', 'blockedMutations'])
assert all(row['commercialSubmits'] == 0 and row['heightRemoved'] == 112 for row in browser['cases'])
deployment = created['deploymentId']
assert integrity['deployment'] == browser['deployment'] == deployment
assert integrity.get('outputInventorySha256', integrity.get('candidateInventorySha256')) == auth['candidateInventorySha256']
assert created['candidateInventorySha256'] == browser['candidateInventorySha256'] == auth['candidateInventorySha256']
assert not (DOCS / 'CREATION-STOPPED.json').exists()
project = api('/v9/projects/' + auth['projectId'])
assert project['id'] == auth['projectId'] and project['accountId'] == auth['teamId']
assert project['ssoProtection']['deploymentType'] == 'all_except_custom_domains'
assert project['autoAssignCustomDomains'] is False and project['previewDeploymentsDisabled'] is True
since = int(datetime.fromisoformat(auth['recordedAt']).timestamp() * 1000)
recent = api('/v6/deployments?projectId=' + auth['projectId'] + '&target=production&since=' + str(since) + '&limit=100')
ids = {row.get('uid', row.get('id')) for row in recent['deployments']}
assert ids == {deployment}, 'A concurrent Production exists; no promotion requested.'
assert not recent.get('pagination', {}).get('next'), 'Concurrent deployment window is incomplete.'
default_domain = api('/v13/deployments/project-wrapp.vercel.app')
assert default_domain['id'] == auth['baselineDeployment'], 'Default domain changed before promotion.'
aliases = []
for host in ['sollahms.cl', 'www.sollahms.cl', 'sollhams.cl']:
    raw = api('/v4/aliases/' + host)
    safe = {'host': host, **{key: raw.get(key) for key in ['deploymentId', 'projectId', 'redirect', 'redirectStatusCode', 'updatedAt']}}
    assert safe['deploymentId'] == auth['baselineDeployment'] and safe['projectId'] == auth['projectId'], 'Concurrent alias change; no promotion requested.'
    assert host == 'sollahms.cl' or (safe['redirect'] == 'sollahms.cl' and safe['redirectStatusCode'] == 308)
    aliases.append(safe)
now = datetime.now(ZoneInfo('America/Santiago')).isoformat()
save('promotion-preflight.json', {'checkedAt': now, 'passed': True, 'deploymentId': deployment,
    'productionDeploymentStillBaseline': True, 'productionAliases': aliases,
    'defaultDomainDeploymentId': default_domain['id'], 'uniqueNewProductionId': list(ids),
    'project': {key: project.get(key) for key in ['id', 'accountId', 'ssoProtection', 'autoAssignCustomDomains', 'previewDeploymentsDisabled', 'nodeVersion']},
    'isolatedBrowserCases': 10, 'isolatedIntegrityChecks': len(integrity['checks']), 'sameVerifiedDeployment': True})
request = {'requestedAt': now, 'deploymentId': deployment, 'projectId': auth['projectId'], 'teamId': auth['teamId'],
    'candidateInventorySha256': auth['candidateInventorySha256'], 'sameVerifiedDeployment': True, 'rebuild': False,
    'authorizationSha256': hashlib.sha256((DOCS / 'authorization.json').read_bytes()).hexdigest(),
    'isolatedSummarySha256': hashlib.sha256((DOCS / 'verification/isolated-summary.json').read_bytes()).hexdigest(),
    'isolatedBrowserSha256': hashlib.sha256((DOCS / 'browser/isolated/results.json').read_bytes()).hexdigest()}
with (DOCS / 'promotion-request.json').open('x') as handle:
    json.dump(request, handle, indent=2)
print(json.dumps({'gate': 'PASS', 'deploymentId': deployment, 'freshAliases': True,
                  'uniqueNewProduction': True, 'browserCases': 10, 'integrityChecks': len(integrity['checks'])}))
