"""Read-only native preflight. Never persist project environment values."""
import datetime
import hashlib
import json
import os
import subprocess
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[2]
NODE = '/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin/node'
CLI = '/Users/luissandoval/.npm-global/bin/vercel'
env = dict(os.environ)
env['PATH'] = str(Path(NODE).parent) + ':/Users/luissandoval/.npm-global/bin:/usr/bin:/bin'
for key in ['NODE_OPTIONS', 'NODE_DEBUG', 'DEBUG', 'VERCEL_DEBUG', 'VC_DEBUG', 'VERCEL_LOG_LEVEL']:
    env.pop(key, None)
def run(args):
    p = subprocess.run(args, cwd=ROOT, env=env, capture_output=True, timeout=55, check=True)
    return p.stdout.decode().strip()

project = json.loads(run([NODE, CLI, 'api', '/v9/projects/prj_URomRRU0MAy4etGKP5gWv3Qv4DGH', '--method', 'GET', '--scope', 'lsandoval2-8260s-projects']))
target = project.get('targets', {}).get('production', {})
raw_sso = project.get('ssoProtection') or {}
sso = {'enabled': bool(raw_sso) and raw_sso.get('enabled', True) is not False, 'deploymentType': raw_sso.get('deploymentType')}
config = json.loads((ROOT / 'vercel.json').read_text())
rules = config.get('git', {}).get('deploymentEnabled', {})
result = {
    'checkedAt': datetime.datetime.now(ZoneInfo('America/Santiago')).isoformat(),
    'project': {key: project.get(key) for key in ['id', 'name', 'accountId', 'nodeVersion', 'autoAssignCustomDomains', 'previewDeploymentsDisabled', 'paused']},
    'ssoProtection': sso,
    'productionTarget': {key: target.get(key) for key in ['id', 'url', 'target', 'readyState']},
    'gitIntegration': {key: project.get('link', {}).get(key) for key in ['type', 'productionBranch', 'repo']},
    'repositoryAutomaticDeploymentRules': {key: rules.get(key) for key in ['main', 'codex/contacto-baseline-productivo-20261116', 'codex/eliminar-recorridos-global-20261115']},
    'sourceConfigSha256': hashlib.sha256((ROOT / 'vercel.json').read_bytes()).hexdigest(),
    'localHead': run(['git', 'rev-parse', 'HEAD']),
    'runtimeGitClean': not bool(run(['git', 'diff', 'HEAD', '--', 'contacto.html', 'vercel.json'])),
    'node': run([NODE, '--version']), 'cli': run([NODE, CLI, '--version']), 'whoami': run([NODE, CLI, 'whoami']),
    'settingsModified': False, 'credentialsPrinted': False,
    'rawSsoEnabledKeyPresent': 'enabled' in raw_sso,
}
checks = {
    'projectTeam': result['project']['id'] == 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH' and result['project']['accountId'] == 'team_A9VNIW2f2K1IJpd2pGdvDmEN',
    'sso': sso['enabled'] and sso['deploymentType'] == 'all_except_custom_domains',
    'baseline': result['productionTarget']['id'] == 'dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5',
    'automaticRules': all(value is False for value in result['repositoryAutomaticDeploymentRules'].values()),
    'source': result['localHead'] == '534bf362b8960e275f5b8b42b5c786027906a4cb' and result['runtimeGitClean'],
    'toolsIdentity': result['node'] == 'v24.22.3' and result['cli'] == '65.16.0' and result['whoami'] == 'lsandoval2-8260',
}
result.update(checks=checks, passed=all(checks.values()))
(DOCS / 'preflight-native.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
assert result['passed'], 'Native preflight failed; do not create Production.'
