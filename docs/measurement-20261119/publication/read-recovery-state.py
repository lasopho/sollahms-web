"""Selected read-only rollback readiness using existing CLI auth; no live rollback."""
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

CLI = '/Users/luissandoval/.npm-global/bin/vercel'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
PROJECT = 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'
BASE = 'dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH'
ROOT = Path(__file__).resolve().parents[3]
PRIVATE = Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-measurement-private')
calls = []
environment = os.environ.copy()
environment['VERCEL_TELEMETRY_DISABLED'] = '1'


def get(endpoint):
    assert endpoint.startswith(('/v2/user', '/v2/teams/', '/v13/deployments/', '/v9/projects/', '/v6/deployments?'))
    result = subprocess.run([CLI, 'api', endpoint, '--method', 'GET', '--scope', TEAM, '--raw'],
                            capture_output=True, env=environment, cwd=ROOT)
    calls.append({'method': 'GET', 'endpointKind': endpoint.split('?')[0].replace(PROJECT, '{projectId}').replace(TEAM, '{teamId}'),
                  'exitCode': result.returncode, 'observedAtUTC': datetime.now(timezone.utc).isoformat()})
    if result.returncode:
        raise RuntimeError('Read-only CLI request failed; no response body or credentials persisted')
    return json.loads(result.stdout)


deployment = get('/v13/deployments/' + BASE)
project = get('/v9/projects/' + PROJECT + '?rollbackInfo=true')
candidates = get('/v6/deployments?projectId=' + PROJECT + '&rollbackCandidate=true&limit=20')
user = get('/v2/user')['user']
members = get('/v2/teams/' + TEAM + '/members?search=' + quote(user['username']) + '&limit=10')
self_members = [m for m in members.get('members', []) if m.get('uid') == user.get('id') or m.get('uid') == user.get('uid')]
member = self_members[0] if len(self_members) == 1 else {}
candidate = next((d for d in candidates.get('deployments', []) if (d.get('uid') or d.get('id')) == BASE), None)
snapshot = json.loads((PRIVATE / 'approved-production-before.json').read_text())
aliases = snapshot['aliases']
current = all(a['deploymentId'] == BASE for a in aliases) and len(aliases) == 2
ready = deployment.get('readyState') == 'READY' and deployment.get('target') == 'production'
same_project = (deployment.get('projectId') or deployment.get('project', {}).get('id')) == PROJECT
role_ok = member.get('role') == 'OWNER' and member.get('confirmed') is True
candidate_eligible = bool(candidate and candidate.get('isRollbackCandidate') is True)
settings = snapshot['projectSettings']
assert settings['autoAssignCustomDomains'] is False
assert settings['ssoProtection'] == {'deploymentType': 'all_except_custom_domains'}
assert ready and same_project and role_ok and candidate_eligible and current
result = {
    'observedAtUTC': datetime.now(timezone.utc).isoformat(), 'status': 'read_only_preflight_passed',
    'recoveryDeploymentId': BASE, 'readyState': deployment.get('readyState'), 'target': deployment.get('target'),
    'sourceCommit': deployment.get('meta', {}).get('githubCommitSha'), 'sameProject': same_project,
    'deletedAt': deployment.get('deletedAt'), 'softDeleted': deployment.get('softDeleted'),
    'rollbackCandidateListing': {'matched': bool(candidate), 'isRollbackCandidate': candidate.get('isRollbackCandidate') if candidate else None},
    'authenticatedTeamMembership': {'role': member.get('role'), 'confirmed': member.get('confirmed'), 'matchedAuthenticatedCliUser': bool(member)},
    'productionAliasSnapshotAt': snapshot['observedAt'], 'bothAliasesStillBaseInParentSnapshot': current,
    'wwwRedirect': {'to': 'sollahms.cl', 'status': 308}, 'autoAssignCustomDomains': settings['autoAssignCustomDomains'],
    'ssoProtection': settings['ssoProtection'],
    'projectRollbackIntrospectionSucceeded': bool(project.get('id') == PROJECT),
    'cli': {'version': '65.16.0', 'rollbackHelpRead': True,
            'installedSupportCode': '@vercel/cli-support/dist/commands-core.js',
            'writeEndpointObservedButNotCalled': 'POST /v9/projects/{projectId}/rollback/{deploymentId}',
            'statusReadEndpointObserved': 'GET /v9/projects/{projectId}/rollback/aliases?failedOnly=true&limit=20',
            'commandNotExecuted': 'vercel rollback <previous-production-id-or-url> --scope <team>'},
    'officialSources': ['https://vercel.com/docs/cli/rollback', 'https://vercel.com/docs/deployments/rollback-production-deployment'],
    'mechanism': 'Instant routing change to the immediately previous production deployment without rebuilding; preserve/recheck auto-assignment, SSO, aliases and bytes.',
    'eligibilityBoundary': '86B is current Production in the parent snapshot and would become the immediately previous Production if this approved candidate is promoted with no intervening release. Recheck immediately before promotion/rollback.',
    'permissionBoundary': 'Confirmed OWNER membership and successful read-only candidate introspection do not execute or guarantee an action-specific rollback write; no live rehearsal was performed.',
    'readOnlyCalls': calls, 'methods': ['GET'], 'mutations': 0, 'rollbackExecuted': False,
    'secretsOrPersonalAccountDataStored': False,
    'simulationReused': '../release-simulation.json'}
Path(__file__).with_name('recovery-readiness.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': result['status'], 'ready': ready, 'candidate': candidate_eligible, 'owner': role_ok,
                  'readOnlyCalls': len(calls), 'rollbackExecuted': False}))
