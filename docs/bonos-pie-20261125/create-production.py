#!/usr/bin/env python3
"""Read-only preflight by default. --execute explicitly creates one isolated Production.

No promotion, alias change, secret retrieval or token generation is implemented.
After a started/failed/interrupted attempt, inspect Vercel before any retry.
"""
import argparse
import json
import os
import re
import signal
import subprocess
from pathlib import Path
from release_common import (
    DOCS, ROOT, STAGE, OUTPUT, NODE, CLI, ENV, PROJECT, TEAM, SCOPE, BRANCH,
    BASE, BASE_SOURCE, HOSTS, FUNCTIONS, require, read, save, now, sha, git,
    api, fetch_all, selected_alias, validate_project, local_candidate,
    validate_source_and_qa, remote_inventory, selected_deployment,
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true', help='Create one Production without assigning custom domains')
    parser.add_argument('--expected-commit', required=True, help='Full reviewed Git SHA; must equal HEAD')
    args = parser.parse_args()
    if args.execute:
        require(not (DOCS / 'created-by-root-cli.json').exists(),
                'The root task already created this candidate through the CLI; inspect the existing deployment instead of duplicating it')
    require(re.fullmatch(r'[0-9a-f]{40}', args.expected_commit), 'Provide the complete reviewed commit SHA')
    require(git('rev-parse', 'HEAD') == args.expected_commit and git('branch', '--show-current') == BRANCH,
            'Reviewed source commit/branch mismatch')
    require(not git('diff', '--name-only', 'HEAD', '--', 'internal/bonos-pie', 'api/interno-bonos-pie.mjs', 'vercel.json'),
            'Runtime source has uncommitted changes')
    require(read(ROOT / 'vercel.json')['git']['deploymentEnabled'].get(BRANCH) is False,
            'Automatic deployment guard must remain disabled')
    require(git('merge-base', '--is-ancestor', BASE_SOURCE, args.expected_commit) == '', 'Source must include reconciled SEO baseline')
    binding = read(STAGE / '.vercel/project.json')
    require(binding.get('projectId') == PROJECT and binding.get('orgId') == TEAM, 'Stage linked to wrong project/team')
    baseline, candidate, pin = local_candidate()
    runtime, qa = validate_source_and_qa()
    response = fetch_all({'project': '/v9/projects/' + PROJECT,
                          'deployment': '/v13/deployments/' + BASE,
                          **{host: '/v4/aliases/' + host for host in HOSTS}})
    settings, metadata = validate_project(response['project'])
    aliases = [selected_alias(response[host]) for host in HOSTS]
    require(all(row['deploymentId'] == BASE and row['projectId'] == PROJECT for row in aliases),
            'Production advanced or alias points elsewhere; reconcile before creating')
    require(aliases[0]['redirect'] is None and aliases[1]['redirect'] == 'sollahms.cl' and
            aliases[1]['redirectStatusCode'] == 308, 'Existing public redirects changed')
    deployment = selected_deployment(response['deployment'])
    require(deployment['id'] == BASE and deployment['target'] == 'production' and
            deployment['readyState'] == 'READY' and deployment['meta']['githubCommitSha'] == BASE_SOURCE,
            'Current baseline metadata changed')
    remote, _ = remote_inventory(api('/v6/deployments/' + BASE + '/files'), baseline, FUNCTIONS[:-1])
    # Fresh alias read after the complete inventory walk closes the ordinary audit race.
    after = [selected_alias(api('/v4/aliases/' + host)) for host in HOSTS]
    require(aliases == after, 'Aliases changed during preflight')
    preflight = {'observedAtUTC': now(), 'passed': True, 'methods': ['GET'], 'mutations': 0,
        'expectedCommit': args.expected_commit, 'branch': BRANCH, 'baselineDeployment': BASE,
        'baselineSourceCommit': BASE_SOURCE, 'candidateInventorySHA256': pin, 'files': len(candidate),
        'baselineFiles': len(baseline), 'existingPublicFilesUnchanged': True,
        'existingFunctionFilesUnchanged': 57, 'aliases': aliases, 'projectSettings': settings,
        'environmentMetadata': metadata, 'environmentValuesReadOrStored': False,
        'completeRemoteBaseline': remote,
        'runtimeVerificationSHA256': sha((DOCS / 'runtime-verification.json').read_bytes()),
        'syntheticQASHA256': sha((DOCS / 'qa/results.json').read_bytes())}
    save(DOCS / 'preflight-connected.json', preflight)
    if not args.execute:
        print(json.dumps({'passed': True, 'mode': 'read-only-preflight', 'expectedCommit': args.expected_commit,
                          'candidateInventorySHA256': pin, 'files': len(candidate), 'baselineDeployment': BASE}))
        return
    attempt = ROOT / '.vercel/bonos-pie-20261125/production-create-attempt.json'
    record = {'requestedAtUTC': now(), 'state': 'started', 'target': 'production', 'prebuilt': True,
              'skipDomain': True, 'sourceCommit': args.expected_commit, 'branch': BRANCH,
              'baselineDeployment': BASE, 'candidateInventorySHA256': pin, 'files': len(candidate),
              'preflightSHA256': sha((DOCS / 'preflight-connected.json').read_bytes())}
    # Exclusive creation prevents accidental repeated deployments from rerunning this script.
    with attempt.open('x') as handle:
        json.dump(record, handle, indent=2)
    command = [NODE, CLI, 'deploy', '--prebuilt', '--environment=production', '--skip-domain',
        '--project', PROJECT, '--scope', SCOPE, '--yes', '--json',
        '--meta', 'githubCommitSha=' + args.expected_commit, '--meta', 'githubCommitRef=' + BRANCH,
        '--meta', 'githubOrg=lasopho', '--meta', 'githubRepo=sollahms-web',
        '--meta', 'candidateInventorySHA256=' + pin, '--meta', 'baselineDeployment=' + BASE]
    process = subprocess.Popen(command, cwd=STAGE, env=ENV, stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, start_new_session=True)
    try:
        stdout, stderr = process.communicate(timeout=300)
    except BaseException:
        os.killpg(process.pid, signal.SIGTERM)
        try:
            process.communicate(timeout=5)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.communicate(timeout=5)
        record['state'] = 'interrupted-inspect-remote-before-any-retry'
        save(attempt, record)
        raise
    if process.returncode:
        record.update(state='failed-inspect-remote-before-any-retry', exitCode=process.returncode,
                      stdoutBytes=len(stdout), stderrBytes=len(stderr))
        save(attempt, record)
        raise RuntimeError('Creation failed; inspect the remote project before any retry. Raw output omitted.')
    try:
        value = json.loads(stdout)
        deployed = value.get('deployment', value)
        record.update(state='created', completedAtUTC=now(),
            deploymentId=deployed.get('id') or deployed.get('uid') or deployed.get('deploymentId'),
            url=deployed.get('url'), readyState=deployed.get('readyState') or deployed.get('state'),
            reportedTarget=deployed.get('target'))
        require(record['deploymentId'] and record['url'] and record['reportedTarget'] == 'production',
                'Created response incomplete; inspect remote before another attempt')
    except Exception:
        record['state'] = 'response-unconfirmed-inspect-remote-before-any-retry'
        save(attempt, record)
        raise
    save(attempt, record)
    save(DOCS / 'created.json', record)
    print(json.dumps(record, indent=2))


if __name__ == '__main__':
    main()
