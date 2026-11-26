#!/usr/bin/env python3
"""Read-only complete source and protection audit for the payment-plan overlay."""
import argparse
import json
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent
sys.path.insert(0, str(DOCS.parent / 'bonos-pie-20261125'))
from release_common import (PROJECT, HOSTS, FUNCTIONS, BRANCH, OUTPUT, api, fetch_all,
    require, read, save, sha, now, manifest_rows, selected_alias, selected_deployment, remote_inventory, validate_project)

BASE = 'dpl_ARisoRo2JVFfigUyeRphXCxtJu32'
PRIVATE = 'functions/api/interno-bonos-pie.func/'
HOSTS = ['sollahms.cl', 'www.sollahms.cl', 'sollhams.cl', 'project-wrapp.vercel.app', 'project-wrapp-lsandoval2-8260s-projects.vercel.app']

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--deployment-id', required=True)
    parser.add_argument('--source-commit', required=True)
    parser.add_argument('--phase', choices=['isolated', 'production'], default='isolated')
    args = parser.parse_args()
    baseline = manifest_rows(read(DOCS / 'baseline-manifest.json'))
    candidate_manifest = read(DOCS / 'candidate-manifest.json')
    candidate = manifest_rows(candidate_manifest)
    require(candidate_manifest['baselineDeployment'] == BASE and len(baseline) == 1741, 'Wrong live baseline')
    expected = {row['path']: row for row in candidate}
    observed = {}
    for path in OUTPUT.rglob('*'):
        require(not path.is_symlink(), 'No artifact symlinks')
        if path.is_file():
            body = path.read_bytes()
            name = path.relative_to(OUTPUT).as_posix()
            observed[name] = {'path': name, 'bytes': len(body), 'sha1': sha(body, 'sha1'), 'sha256': sha(body)}
    require(observed == expected, 'Artifact changed since manifest')
    old = {row['path']: row for row in baseline}
    require(set(old).issubset(expected), 'Existing source removed')
    allowed = {PRIVATE + name for name in ['index.mjs', 'payment-plan.mjs', 'ui/panel.html', 'ui/panel.css', 'ui/payment-ui.js']}
    require(all(path in allowed for path, row in expected.items() if old.get(path) != row), 'Artifact change outside authorized private files')
    for row in baseline:
        if not row['path'].startswith(PRIVATE):
            require(expected.get(row['path']) == row, 'A public route, asset or existing service changed')
    before = fetch_all({'project': '/v9/projects/' + PROJECT, 'deployment': '/v13/deployments/' + args.deployment_id,
                       **{host: '/v4/aliases/' + host for host in HOSTS}})
    settings, env = validate_project(before['project'])
    aliases = [selected_alias(before[host]) for host in HOSTS]
    expected_alias = BASE if args.phase == 'isolated' else args.deployment_id
    require(all(row['deploymentId'] == expected_alias and row['projectId'] == PROJECT for row in aliases), 'Unexpected domain assignment')
    require(aliases[0]['redirect'] is None and aliases[1]['redirect'] == aliases[2]['redirect'] == 'sollahms.cl' and aliases[1]['redirectStatusCode'] == aliases[2]['redirectStatusCode'] == 308 and aliases[3]['redirect'] is None and aliases[4]['redirect'] is None, 'Domain redirects changed')
    deployment = selected_deployment(before['deployment'])
    require(deployment['id'] == args.deployment_id and deployment['target'] == 'production' and deployment['readyState'] == 'READY', 'Candidate not READY Production')
    meta = deployment['meta']
    require(meta['githubCommitSha'] == args.source_commit and meta['githubCommitRef'] == BRANCH and
            meta['githubOrg'] == 'lasopho' and meta['githubRepo'] == 'sollahms-web', 'Reviewed source identity differs')
    require(meta['candidateInventorySHA256'] == candidate_manifest['inventorySHA256'] and meta['baselineDeployment'] == BASE, 'Artifact metadata differs')
    inventory, comparisons = remote_inventory(api('/v6/deployments/' + args.deployment_id + '/files'), candidate, FUNCTIONS)
    after = fetch_all({'project': '/v9/projects/' + PROJECT, **{host: '/v4/aliases/' + host for host in HOSTS}})
    settings_after, env_after = validate_project(after['project'])
    require(settings == settings_after and env == env_after and aliases == [selected_alias(after[h]) for h in HOSTS], 'State changed during audit')
    save(DOCS / 'verification' / (args.phase + '-source-comparisons.json'), comparisons)
    summary = {'passed': True, 'observedAtUTC': now(), 'phase': args.phase, 'methods': ['GET'], 'mutations': 0,
               'deployment': deployment, 'candidateInventorySHA256': candidate_manifest['inventorySHA256'],
               'baselineDeployment': BASE, 'fullInventory': inventory, 'aliases': aliases,
               'projectSettings': settings, 'environmentMetadata': env, 'environmentValuesReadOrStored': False,
               'publicStaticFilesUnchanged': sum(r['path'].startswith('static/') for r in baseline),
               'otherFunctionFilesUnchanged': sum(r['path'].startswith('functions/') and not r['path'].startswith(PRIVATE) for r in baseline),
               'routesByteIdentical': True, 'authenticationAndDataRuntimeRequireSeparateEvidence': True}
    save(DOCS / 'verification' / (args.phase + '-summary.json'), summary)
    print(json.dumps({key: summary[key] for key in ['passed', 'phase', 'candidateInventorySHA256', 'fullInventory', 'publicStaticFilesUnchanged', 'otherFunctionFilesUnchanged']}, indent=2))

if __name__ == '__main__':
    main()
