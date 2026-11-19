"""Read selected publication state through existing Vercel CLI auth.

Never prints or stores tokens, cookies, protection bypasses or env values.
"""
import argparse
import json
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

CLI = '/Users/luissandoval/.npm-global/bin/vercel'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
PROJECT = 'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH'


def get(endpoint):
    process = subprocess.run([CLI, 'api', endpoint, '--scope', TEAM, '--raw'],
                             capture_output=True, check=True)
    return json.loads(process.stdout)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--project-only', action='store_true')
    args = parser.parse_args()
    project = get('/v9/projects/' + PROJECT)
    settings = {key: project.get(key) for key in (
        'id', 'name', 'accountId', 'autoAssignCustomDomains', 'autoExposeSystemEnvs',
        'ssoProtection', 'gitProviderOptions', 'buildCommand', 'outputDirectory',
        'installCommand', 'rootDirectory', 'nodeVersion')}
    settings['productionBranch'] = project.get('link', {}).get('productionBranch')
    aliases = []
    for alias in (() if args.project_only else ('sollahms.cl', 'www.sollahms.cl')):
        raw = get('/v4/aliases/' + alias)
        aliases.append({key: raw.get(key) for key in (
            'alias', 'deploymentId', 'projectId', 'redirect', 'redirectStatusCode', 'updatedAt')})
    report = {'observedAt': datetime.now(ZoneInfo('America/Santiago')).isoformat(),
              'timezone': 'America/Santiago', 'projectSettings': settings,
              'aliases': aliases, 'methods': ['GET'], 'mutations': 0,
              'secretValuesReadOrStored': False}
    if args.output:
        args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
