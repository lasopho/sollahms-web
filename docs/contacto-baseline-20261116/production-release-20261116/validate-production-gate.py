"""Read existing certified evidence before promoting the same isolated Production."""
import datetime
import hashlib
import json
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
DEPLOYMENT = 'dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w'
INVENTORY = 'de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0'
names = ['authorization.json', 'preflight-native.json', 'preparation/stage-receipt.json', 'created.json', 'verification/verification-summary.json', 'verification/gate-summary.json', 'browser/isolated/acceptance-summary.json', 'visual-isolated.json']
a, pre, stage, created, v, compact, q, visual = [json.loads((DOCS / name).read_text()) for name in names]
checks = {
    'owner_authorized': a['explicitAuthorization'] and a['productionCreationAuthorized'] and a['promotionAuthorizedAfterIsolatedQaPass'],
    'preflight_passed': pre['passed'] and all(pre['checks'].values()),
    'exact_stage': stage['passed'] and stage['copied_files'] == 1660 and stage['candidate_inventory_sha256'] == INVENTORY and stage['all_path_size_sha1_sha256_match'],
    'single_contacto_delta': stage['runtime_delta_vs_by_uhr'] == ['static/contacto.html'] and stage['identical_to_by_uhr'] == 1659 and stage['tour_changes_preserved'] == 66,
    'created_isolated_production': created['deploymentId'] == DEPLOYMENT and created['target'] == 'production' and created['skipDomain'] and created['state'] == 'created' and created['reportedEnvironment'] == 'production',
    'remote_api_http': v['passed'] and v['deployment'] == DEPLOYMENT and v['candidate_inventory_sha256'] == INVENTORY and v['http_authenticated_completed'] == 32 and not v['failures'] and all(row['pass'] for row in v['checks']),
    'sources_functions_aliases': compact['all_checks_passed'] and compact['api_sources_verified'] == 1660 and compact['registered_lambdas'] == 7 and compact['public_domains_still_by_uhr'] and compact['isolated_aliases_after'] == [],
    'sso': compact['anonymous_sso']['status'] == 302 and compact['anonymous_sso']['location_host'] == 'vercel.com' and compact['anonymous_sso']['ssl_verify_result'] == 0,
    'source_sha': v['source_commit'] == created['sourceCommit'] == '534bf362b8960e275f5b8b42b5c786027906a4cb',
    'responsive_qa': q['passed'] and q['deployment'] == DEPLOYMENT and q['candidateInventorySha256'] == INVENTORY and q['acceptedCases'] == 5 and set(q['widths']) == {1440, 1024, 768, 390, 320},
    'no_commercial_operations': q['safety']['actualCommercialRequests'] == 0 and q['safety']['domSubmitEvents'] == 0 and q['safety']['unsafeRequestsAttempted'] == 0 and not v['real_forms_submitted'] and not v['uf_provider_lookup_attempted'],
    'processes_closed': q['runnerClosed'] and q['profileRemoved'] and not q['managedProcessesRemaining'] and not v['active_own_process_groups'],
    'visual': visual['visualPassed'] and visual['deploymentId'] == DEPLOYMENT and all(hashlib.sha256((DOCS / r['path']).read_bytes()).hexdigest() == r['sha256'] for r in visual['screenshots']),
}
archive_counts = {}
for name in ['preparation/manifest-sha256.json', 'verification/manifest-sha256.json', 'browser/isolated/MANIFEST-SHA256.json']:
    path = DOCS / name
    rows = json.loads(path.read_text())['files']
    good = True
    for row in rows:
        body = (path.parent / row['path']).read_bytes()
        good = good and len(body) == row.get('bytes', row.get('size')) and hashlib.sha256(body).hexdigest() == row['sha256']
    checks['archive_' + name] = good
    archive_counts[name] = len(rows)
    names.append(name)
failures = [name for name, passed in checks.items() if not passed]
receipt = {
    'validatedAt': datetime.datetime.now(ZoneInfo('America/Santiago')).isoformat(),
    'deploymentId': DEPLOYMENT, 'target': 'production', 'candidateInventorySha256': INVENTORY,
    'productionAuthorized': True, 'productionQaPassed': not failures, 'eligibleForPromotion': not failures,
    'sameTestedDeploymentOnly': True, 'baselineDeploymentId': a['baselineDeployment'],
    'requiresFreshAliasAndConcurrencyCheck': True, 'checks': checks, 'failures': failures,
    'archiveEntriesVerified': archive_counts,
    'evidence': [{'path': name, 'sha256': hashlib.sha256((DOCS / name).read_bytes()).hexdigest()} for name in names],
    'newNetworkOrBrowserTests': 0,
}
(DOCS / 'production-gate.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: v for k, v in receipt.items() if k not in ['checks', 'evidence']}, ensure_ascii=False, indent=2))
assert not failures, failures
