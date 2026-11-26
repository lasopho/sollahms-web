#!/usr/bin/env python3
"""Create one authorized private-panel release, leaving corporate domains unchanged."""
import argparse
import json
import subprocess
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent
sys.path.insert(0, str(DOCS.parent / 'bonos-pie-20261125'))
from release_common import (ROOT, STAGE, OUTPUT, SOURCE, PROJECT, TEAM, SCOPE, BRANCH, NODE, CLI, ENV, HOSTS, FUNCTIONS,
    require, read, save, sha, now, git, fetch_all, api, selected_alias, validate_project, manifest_rows, remote_inventory)
BASE = 'dpl_ARisoRo2JVFfigUyeRphXCxtJu32'
PRIVATE = 'functions/api/interno-bonos-pie.func/'
HOSTS = ['sollahms.cl', 'www.sollahms.cl', 'sollhams.cl', 'project-wrapp.vercel.app', 'project-wrapp-lsandoval2-8260s-projects.vercel.app']

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--expected-commit', required=True)
parser.add_argument('--execute', action='store_true')
args = parser.parse_args()
require(git('rev-parse', 'HEAD') == args.expected_commit and git('branch', '--show-current') == BRANCH, 'Wrong reviewed source')
require(not git('diff', 'HEAD', '--name-only', '--', 'internal/bonos-pie', 'vercel.json'), 'Uncommitted runtime changes')
require(read(ROOT / 'vercel.json')['git']['deploymentEnabled'][BRANCH] is False, 'Automatic deployment must stay off')
binding = read(STAGE / '.vercel/project.json')
require(binding['projectId'] == PROJECT and binding['orgId'] == TEAM, 'Wrong linked stage')
manifest = read(DOCS / 'candidate-manifest.json')
candidate, baseline = manifest_rows(manifest), manifest_rows(read(DOCS / 'baseline-manifest.json'))
require(git('merge-base', '--is-ancestor', manifest['baselineCommit'], args.expected_commit) == '', 'Reviewed source must include current production source')
expected = {r['path']: r for r in candidate}
actual = {}
for path in OUTPUT.rglob('*'):
    require(not path.is_symlink(), 'Symlink in artifact')
    if path.is_file():
        b = path.read_bytes(); name = path.relative_to(OUTPUT).as_posix()
        actual[name] = {'path': name, 'bytes': len(b), 'sha1': sha(b, 'sha1'), 'sha256': sha(b)}
require(actual == expected, 'Manifest no longer matches staged artifact')
prior = {r['path']: r for r in baseline}
require(set(prior).issubset(expected), 'Baseline file removed')
allowed = {PRIVATE + p for p in ['index.mjs', 'payment-plan.mjs', 'ui/panel.html', 'ui/panel.css', 'ui/payment-ui.js']}
require(all(path in allowed for path, row in expected.items() if prior.get(path) != row), 'Change escaped private handler')
runtime = read(DOCS / 'runtime-verification.json')
require(runtime['passed'] and runtime['testsPassed'] >= 45 and runtime['mortgageTestsPassed'] >= 8 and runtime['compiledSmokePassed'] and runtime['candidateInventorySHA256'] == manifest['inventorySHA256'], 'Runtime checks missing')
for row in runtime['sourceFiles']:
    b = (ROOT / row['path']).read_bytes()
    require(len(b) == row['bytes'] and sha(b) == row['sha256'], 'Reviewed source changed after tests')
qa = read(DOCS / 'qa-ui.json')
require(qa.get('passed') and qa.get('syntheticOnly'), 'Synthetic UI checks incomplete')
response = fetch_all({'project': '/v9/projects/' + PROJECT, **{h: '/v4/aliases/' + h for h in HOSTS}})
settings, metadata = validate_project(response['project'])
aliases = [selected_alias(response[h]) for h in HOSTS]
require(all(r['deploymentId'] == BASE and r['projectId'] == PROJECT for r in aliases), 'Production advanced; reconcile first')
require(aliases[0]['redirect'] is None and aliases[1]['redirect'] == aliases[2]['redirect'] == 'sollahms.cl' and aliases[1]['redirectStatusCode'] == aliases[2]['redirectStatusCode'] == 308 and aliases[3]['redirect'] is None and aliases[4]['redirect'] is None, 'Existing domain redirects changed')
full, _ = remote_inventory(api('/v6/deployments/' + BASE + '/files'), baseline, FUNCTIONS)
require(aliases == [selected_alias(api('/v4/aliases/' + h)) for h in HOSTS], 'Aliases changed during preflight')
save(DOCS / 'preflight-connected.json', {'passed': True, 'observedAtUTC': now(), 'sourceCommit': args.expected_commit,
    'candidateInventorySHA256': manifest['inventorySHA256'], 'baselineDeployment': BASE, 'completeRemoteBaseline': full,
    'projectSettings': settings, 'environmentMetadata': metadata, 'aliases': aliases, 'environmentValuesReadOrStored': False})
if not args.execute:
    print(json.dumps({'passed': True, 'mode': 'read-only', 'files': len(candidate)}))
else:
    attempt = DOCS / 'created.json'
    record = {'startedAtUTC': now(), 'state': 'started', 'sourceCommit': args.expected_commit,
        'candidateInventorySHA256': manifest['inventorySHA256'], 'baselineDeployment': BASE,
        'target': 'production', 'skipDomain': True, 'ownerPublicationAuthorization': '../bonos-pie-20261125/authorization.json'}
    with attempt.open('x') as handle: json.dump(record, handle, indent=2)
    command = [NODE, CLI, 'deploy', '--prebuilt', '--environment=production', '--skip-domain', '--project', PROJECT,
        '--scope', SCOPE, '--yes', '--json', '--meta', 'githubCommitSha=' + args.expected_commit, '--meta', 'githubCommitRef=' + BRANCH,
        '--meta', 'githubOrg=lasopho', '--meta', 'githubRepo=sollahms-web', '--meta', 'candidateInventorySHA256=' + manifest['inventorySHA256'],
        '--meta', 'baselineDeployment=' + BASE]
    result = subprocess.run(command, cwd=STAGE, env=ENV, capture_output=True, timeout=300)
    if result.returncode:
        record.update(state='failed-inspect-remote-before-retry', exitCode=result.returncode)
        save(attempt, record)
        raise RuntimeError('Creation failed; inspect remote before retry. Raw response omitted.')
    try:
        value = json.loads(result.stdout); deployed = value.get('deployment', value)
        record.update(state='created', deploymentId=deployed.get('id') or deployed.get('uid') or deployed.get('deploymentId'),
            url=deployed.get('url'), readyState=deployed.get('readyState') or deployed.get('state'), completedAtUTC=now())
        require(record['deploymentId'] and record['url'], 'Incomplete response; inspect remote before retry')
    finally:
        save(attempt, record)
    print(json.dumps(record, indent=2))
