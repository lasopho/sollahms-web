#!/usr/bin/env python3
"""Capture before/staged/after evidence with scoped authenticated GETs only.

No deploy, promote, rollback, alias or settings mutation, login, bypass generation,
secret endpoint, raw provider persistence, or real business event is implemented.
"""
import argparse
import json
import re
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from release_common import (
    DOCS, PRIVATE, BASE, BASE_SOURCE, BASE_PIN, PROJECT, TEAM, BRANCH, HOSTS,
    api, fetch_all, require, read, save, now, sha, selected_deployment,
    validate_project, aliases_for, alias_configuration, baseline_rows,
    local_candidate, remote_inventory, complete_alias_listing,
)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--phase', choices=['before', 'staged', 'after'], required=True)
    parser.add_argument('--deployment-id')
    parser.add_argument('--source-commit', '--source-sha', dest='source_commit')
    args = parser.parse_args()
    if args.phase != 'before':
        require(bool(re.fullmatch(r'dpl_[A-Za-z0-9]+', args.deployment_id or '')) and args.deployment_id != BASE,
                'Explicit candidate deployment ID required')
        require(bool(re.fullmatch(r'[0-9a-f]{40}', args.source_commit or '')), 'Full source commit required')
    target = BASE if args.phase == 'before' else args.deployment_id
    endpoints = {'project': '/v9/projects/' + PROJECT + '?rollbackInfo=true',
                 'deployment': '/v13/deployments/' + target,
                 **{host: '/v4/aliases/' + host for host in HOSTS}}
    if args.phase == 'before':
        endpoints.update({'team': '/v2/teams/' + TEAM,
                          'rollbackEligibility': '/v7/deployments?projectId=' + PROJECT +
                              '&limit=100&target=production&sha=' + BASE_SOURCE,
                          'aliasListing': '/v4/aliases?projectId=' + PROJECT + '&limit=100'})
    data = fetch_all(endpoints)
    settings, metadata = validate_project(data['project'])
    aliases = aliases_for(data)
    deployment = selected_deployment(data['deployment'])
    require(deployment['id'] == target and deployment['readyState'] == 'READY' and
            deployment['target'] == 'production' and deployment['prebuilt'] is True,
            'Expected READY prebuilt Production deployment required')
    require(deployment['projectId'] == PROJECT and deployment['ownerId'] == TEAM, 'Wrong deployment project/team')
    report = {'observedAtUTC': now(), 'timezone': 'America/Santiago', 'phase': args.phase,
              'methods': ['GET'], 'mutations': 0, 'rawProviderResponsesStored': False,
              'environmentValuesReadOrStored': False, 'authBypassCreated': False,
              'baselineDeployment': BASE, 'baselineSourceCommit': BASE_SOURCE,
              'deployment': deployment, 'aliasesBefore': aliases,
              'projectSettings': settings, 'environmentMetadata': metadata,
              'automaticBranchDeploymentGuard': {'branch': BRANCH, 'enabled': False}}
    if args.phase == 'before':
        require(all(row['deploymentId'] == BASE for row in aliases), 'Production advanced; reconcile before continuing')
        require(deployment['meta']['githubCommitSha'] == BASE_SOURCE and
                deployment['meta']['candidateInventorySHA256'] == BASE_PIN, 'Baseline source/pin changed')
        listed_names, alias_pages = complete_alias_listing(data['aliasListing'])
        require(set(HOSTS).issubset(listed_names), 'One managed alias missing from current listing')
        role = (data['team'].get('membership') or {}).get('role')
        require(role == 'OWNER', 'Owner role not confirmed by current team metadata')
        eligible_rows = data['rollbackEligibility'].get('deployments')
        require(isinstance(eligible_rows, list), 'Rollback-candidacy metadata missing')
        baseline_eligibility = [row for row in eligible_rows if (row.get('id') or row.get('uid')) == BASE]
        require(len(baseline_eligibility) == 1 and
                isinstance(baseline_eligibility[0].get('isRollbackCandidate'), bool),
                'Explicit current baseline rollback eligibility not available')
        inventory = remote_inventory(api('/v6/deployments/' + BASE + '/files'), baseline_rows())
        last = data['project'].get('lastRollbackTarget')
        recovery = {'checkedAtUTC': now(), 'rollbackTarget': BASE, 'targetReady': True,
                    'targetProduction': True, 'targetPrebuilt': True,
                    'isRollbackCandidate': baseline_eligibility[0]['isRollbackCandidate'], 'ownerRoleConfirmed': True,
                    'eligibilitySource': 'GET /v7/deployments filtered by project/Production/baseline SHA',
                    'eligibilitySchemaReference': 'https://github.com/vercel/sdk/blob/main/docs/models/deployments.md',
                    'rollbackInfoReadSucceeded': 'lastRollbackTarget' in data['project'],
                    'lastRollbackTargetIsBaseline': isinstance(last, dict) and (last.get('id') or last.get('uid')) == BASE,
                    'noRealRollbackExecuted': True, 'networkMethods': ['GET'],
                    'privatePrincipalOrSecretsStored': False, 'writePermissionTestedByRollback': False,
                    'limitation': 'Read-only eligibility/role do not execute a future recovery; recheck immediate state before any mutation.'}
        report.update(fullInventory=inventory, recoveryReadiness=recovery,
                      managedAliasListing={'selectedManagedAliases': len(HOSTS),
                                           'projectAliasesListed': len(listed_names),
                                           'metadataPages': alias_pages,
                                           'completeListing': True})
        save('recovery-readiness.json', recovery)
    else:
        before = read(DOCS / 'production-before.json')
        require(settings == before['projectSettings'] and metadata == before['environmentMetadata'],
                'Frozen project settings/environment metadata changed')
        require(alias_configuration(aliases) == alias_configuration(before['aliasesBefore']),
                'Alias configuration or creation date changed')
        rows, pin = local_candidate()
        require(deployment['meta']['githubCommitSha'] == args.source_commit and
                deployment['meta']['githubCommitRef'] == BRANCH and
                deployment['meta']['githubOrg'] == 'lasopho' and deployment['meta']['githubRepo'] == 'sollahms-web',
                'Candidate source identity differs')
        require(deployment['meta']['candidateInventorySHA256'] == pin and
                deployment['meta']['baselineDeployment'] == BASE, 'Candidate metadata pin/baseline differs')
        report.update(candidateInventorySHA256=pin,
                      inventoryManifestFileSHA256=sha((PRIVATE / 'candidate-manifest.json').read_bytes()),
                      fullInventory=remote_inventory(api('/v6/deployments/' + target + '/files'), rows),
                      projectSettingsUnchanged=True, environmentMetadataMatchesFrozenExpectedState=True,
                      aliasConfigurationsAndCreationDatesPreserved=True)
        if args.phase == 'staged':
            require(aliases == before['aliasesAfter'], 'Aliases changed before promotion')
            require(all(row['deploymentId'] == BASE for row in aliases), 'Isolated candidate must not own aliases')
            require(deployment['productionUrl'] is None, 'Candidate already has a production URL')
            report['liveAliasesRemainOnBaseline'] = True
        else:
            staged = read(DOCS / 'staged-verification.json')
            require(staged.get('passed') and staged['deployment']['id'] == target and
                    staged['deployment']['meta']['githubCommitSha'] == args.source_commit and
                    staged['candidateInventorySHA256'] == pin, 'Promoted ID/source differs from the validated candidate')
            require(all(row['deploymentId'] == target for row in aliases), 'Five aliases must point to validated ID')
            t0 = datetime.fromtimestamp(aliases[0]['updatedAt'] / 1000, timezone.utc)
            report.update(sameVerifiedDeploymentPromoted=True,
                          t0AmericaSantiago=t0.astimezone(ZoneInfo('America/Santiago')).isoformat(),
                          t0UTC=t0.isoformat())
    # A second read catches ordinary concurrent alias/configuration changes.
    refreshed = fetch_all({'project': '/v9/projects/' + PROJECT,
                           **{host: '/v4/aliases/' + host for host in HOSTS}})
    after_settings, after_metadata = validate_project(refreshed['project'])
    after_aliases = aliases_for(refreshed)
    require(after_aliases == aliases and after_settings == settings and after_metadata == metadata,
            'Aliases/settings/environment metadata changed during audit')
    report.update(aliasesAfter=after_aliases, passed=True)
    name = {'before': 'production-before.json', 'staged': 'staged-verification.json',
            'after': 'production-after.json'}[args.phase]
    save(name, report)
    print(json.dumps({'phase': args.phase, 'passed': True, 'deploymentId': target,
                      'matchedFiles': report['fullInventory']['matched'], 'registeredFunctions': 8,
                      'managedAliases': len(HOSTS), 'environmentMetadataEntries': len(metadata),
                      't0AmericaSantiago': report.get('t0AmericaSantiago'), 'evidence': str(DOCS / name)}))


if __name__ == '__main__':
    main()
