#!/usr/bin/env python3
"""Verify an isolated or promoted Production with complete authenticated GETs only.

No secret endpoints, authentication bypasses, data imports, token/session creation,
deployment creation, domain assignment or promotion are implemented.
"""
import argparse
import json
import re
from release_common import (
    DOCS, PROJECT, BASE, HOSTS, FUNCTIONS, BRANCH, require, read, save, sha, now,
    api, fetch_all, local_candidate, validate_source_and_qa, validate_project,
    selected_alias, selected_deployment, remote_inventory,
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--deployment-id', required=True)
    parser.add_argument('--source-commit', required=True)
    parser.add_argument('--phase', choices=['isolated', 'production'], default='isolated')
    args = parser.parse_args()
    require(re.fullmatch(r'dpl_[A-Za-z0-9]+', args.deployment_id) and args.deployment_id != BASE,
            'Explicit candidate deployment ID required')
    require(re.fullmatch(r'[0-9a-f]{40}', args.source_commit), 'Full source commit SHA required')
    baseline, candidate, pin = local_candidate()
    runtime, qa = validate_source_and_qa()
    response = fetch_all({'project': '/v9/projects/' + PROJECT,
        'deployment': '/v13/deployments/' + args.deployment_id,
        **{host: '/v4/aliases/' + host for host in HOSTS}})
    project_settings, metadata = validate_project(response['project'])
    aliases_before = [selected_alias(response[host]) for host in HOSTS]
    deployment = selected_deployment(response['deployment'])
    require(deployment['id'] == args.deployment_id and deployment['readyState'] == 'READY' and
            deployment['target'] == 'production', 'Candidate is not a READY Production deployment')
    require(response['deployment'].get('projectId', PROJECT) == PROJECT, 'Deployment belongs to wrong project')
    require(deployment['meta']['githubCommitSha'] == args.source_commit and
            deployment['meta']['githubCommitRef'] == BRANCH and
            deployment['meta']['githubOrg'] == 'lasopho' and deployment['meta']['githubRepo'] == 'sollahms-web',
            'Published source identity differs from the reviewed commit')
    require(deployment['meta']['candidateInventorySHA256'] == pin and
            deployment['meta']['baselineDeployment'] == BASE, 'Candidate artifact/baseline metadata differs')
    expected_alias = BASE if args.phase == 'isolated' else args.deployment_id
    require(all(alias['deploymentId'] == expected_alias and alias['projectId'] == PROJECT for alias in aliases_before),
            'Aliases do not match the expected ' + args.phase + ' state')
    require(aliases_before[0]['redirect'] is None and aliases_before[1]['redirect'] == 'sollahms.cl' and
            aliases_before[1]['redirectStatusCode'] == 308, 'Existing public redirects changed')
    full_tree = api('/v6/deployments/' + args.deployment_id + '/files')
    inventory, comparisons = remote_inventory(full_tree, candidate, FUNCTIONS)
    # Full source-UID evidence ties every old static/function source to the local
    # baseline. No selected-file sampling or truncated MCP output is accepted.
    by_path = {row['path']: row for row in comparisons}
    old_static = [row for row in baseline if row['path'].startswith('static/')]
    old_functions = [row for row in baseline if row['path'].startswith('functions/')]
    require(all(by_path[row['path']]['remoteUid'] == row['sha1'] for row in old_static), 'Public production files changed')
    require(len(old_functions) == 57 and all(by_path[row['path']]['remoteUid'] == row['sha1'] for row in old_functions),
            'Existing public function sources changed')
    refreshed = fetch_all({'project': '/v9/projects/' + PROJECT,
                          **{host: '/v4/aliases/' + host for host in HOSTS}})
    settings_after, metadata_after = validate_project(refreshed['project'])
    aliases_after = [selected_alias(refreshed[host]) for host in HOSTS]
    require(aliases_after == aliases_before, 'Aliases changed during the complete remote audit')
    require(project_settings == settings_after and metadata == metadata_after, 'Project settings/environment metadata changed during audit')
    directory = DOCS / 'verification'
    save(directory / (args.phase + '-source-comparisons.json'), comparisons)
    summary = {'observedAtUTC': now(), 'phase': args.phase, 'passed': True,
        'methods': ['GET'], 'mutations': 0, 'rawProviderResponsesStored': False,
        'environmentValuesReadOrStored': False, 'authBypassCreated': False,
        'deployment': deployment, 'aliasesBefore': aliases_before, 'aliasesAfter': aliases_after,
        'projectSettings': project_settings, 'environmentMetadata': metadata,
        'candidateInventorySHA256': pin, 'baselineDeployment': BASE,
        'fullInventory': inventory, 'existingPublicStaticFilesUnchanged': len(old_static),
        'existingFunctionFilesUnchanged': len(old_functions), 'originalRoutesPreserved': True,
        'configSHA256': next(row['sha256'] for row in candidate if row['path'] == 'config.json'),
        'sourceComparisonsSHA256': sha((directory / (args.phase + '-source-comparisons.json')).read_bytes()),
        'runtimeVerificationSHA256': sha((DOCS / 'runtime-verification.json').read_bytes()),
        'syntheticQASHA256': sha((DOCS / 'qa/results.json').read_bytes()),
        'authenticationBoundary': 'This proves deployment/source preservation. Real OTP, private Blob data and anonymous HTTP behavior require separate runtime evidence.'}
    save(directory / (args.phase + '-summary.json'), summary)
    print(json.dumps({'passed': True, 'phase': args.phase, 'deploymentId': args.deployment_id,
                      'sourceCommit': args.source_commit, 'candidateInventorySHA256': pin,
                      'filesMatched': inventory['matched'], 'registeredFunctions': inventory['functionBundles'],
                      'existingPublicStaticFilesUnchanged': len(old_static), 'existingFunctionFilesUnchanged': 57,
                      'aliasesRemainOn': expected_alias, 'settingsAndEnvironmentMetadataUnchanged': True,
                      'summary': str(directory / (args.phase + '-summary.json'))}, indent=2))


if __name__ == '__main__':
    main()
