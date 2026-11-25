"""Confirm the actual aliases after promotion; performs scoped GETs only."""
import importlib.util
import json
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('footer_release', HERE / 'verify-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
created = release.read(HERE / 'created.json')
gate_path = HERE / 'verification/gate-summary.json'
gate = release.read(gate_path)
response = release.read(HERE / 'promotion-response.json')
assert gate['passed'] is True and all(row['passed'] is True for row in gate['checks'])
assert gate['deployment']['id'] == created['deploymentId'] == response['deploymentId']
assert gate['candidateInventorySHA256'] == created['candidateInventorySHA256']
assert response['gateSHA256'] == release.sha(gate_path.read_bytes())
assert response['promotionToolCalled'] is True
data = release.fetch_all({host: '/v4/aliases/' + host for host in release.HOSTS})
aliases = [release.selected_alias(data[host]) for host in release.HOSTS]
before = {row['alias']: row for row in release.read(HERE / 'verification/preflight-summary.json')['aliases']}
assert all(row['deploymentId'] == created['deploymentId'] for row in aliases)
assert all(all(row[key] == before[row['alias']][key] for key in ['projectId', 'redirect', 'redirectStatusCode', 'createdAt']) for row in aliases)
proof = {'passed': True, 'confirmedAtUtc': datetime.now(timezone.utc).isoformat(),
         'deploymentId': created['deploymentId'], 'candidateInventorySHA256': created['candidateInventorySHA256'],
         'sourceCommit': created['sourceCommit'], 'baselineDeployment': created['baselineDeployment'],
         'projectId': release.PROJECT, 'teamId': release.TEAM,
         'sameVerifiedDeployment': True, 'rebuild': False, 'aliases': aliases,
         'gateSHA256': response['gateSHA256'], 'networkMethods': ['GET'], 'mutations': 0}
(HERE / 'promotion-confirmed.json').write_text(json.dumps(proof, indent=2) + '\n')
print(json.dumps({'passed': True, 'deploymentId': created['deploymentId'], 'aliasesVerified': len(aliases),
                  'redirectsAndCreationDatesPreserved': True, 'sameVerifiedDeployment': True}))
