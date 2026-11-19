#!/usr/bin/env python3
"""Offline release/recovery rehearsal using real artifact certificates and fake staging ID.

No deployment CLI, provider SDK, HTTP client or endpoint is used. State changes
exist only in Python memory. This is a model test, never publication authority.
"""
import argparse
import copy
import hashlib
import json
import socket
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = Path('/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c')
BASE_ID = 'dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH'
BASE_CERT = 'c4b1a07527291aa020ebef549aa32f0bb2f2858f9f55312482584f333b14319b'
FAKE_STAGED_ID = 'SIMULATED_STAGED_VALIDATED_MEASUREMENT_ID'


def no_network(*args, **kwargs):
    raise RuntimeError('Network disabled by offline simulation')


socket.socket = no_network
socket.create_connection = no_network


def digest(value):
    return hashlib.sha256(value).hexdigest()


def object_digest(value):
    return digest(json.dumps(value, sort_keys=True, separators=(',', ':')).encode())


def runtime_inventory(directory):
    result = {}
    for path in sorted(directory.rglob('*')):
        if path.is_symlink():
            raise ValueError('Unexpected runtime symlink')
        if path.is_file():
            body = path.read_bytes()
            result[path.relative_to(directory).as_posix()] = {
                'bytes': len(body), 'sha1': hashlib.sha1(body).hexdigest(), 'sha256': digest(body)}
    return result


class Refused(ValueError):
    pass


class OfflineRelease:
    """Compare-and-swap model; all guards run before the one in-memory commit."""
    def __init__(self, snapshot, base_files, release_files, release_cert):
        self.settings = copy.deepcopy(snapshot['projectSettings'])
        self.initial_aliases = {a['alias']: {key: a.get(key) for key in
                                ['deploymentId', 'redirect', 'redirectStatusCode']}
                                for a in snapshot['aliases']}
        self.base_files = base_files
        self.release_files = release_files
        self.release_cert = release_cert
        self.state = {'settings': copy.deepcopy(self.settings), 'aliases': copy.deepcopy(self.initial_aliases),
                      'artifact': {'deploymentId': BASE_ID, 'certificate': BASE_CERT, 'files': base_files}}
        self.commits = 0

    def guards(self, expected_current):
        if self.state['settings'] != self.settings:
            raise Refused('Platform settings advanced; do not overwrite them')
        if self.state['settings'].get('autoAssignCustomDomains') is not False:
            raise Refused('Automatic domain assignment is not false')
        if self.state['settings'].get('ssoProtection') != {'deploymentType': 'all_except_custom_domains'}:
            raise Refused('SSO contract differs')
        if set(self.state['aliases']) != {'sollahms.cl', 'www.sollahms.cl'}:
            raise Refused('Alias set differs')
        for name, alias in self.state['aliases'].items():
            if alias['deploymentId'] != expected_current:
                raise Refused('Production alias advanced; refresh baseline and revalidate')
            expected_redirect = ('sollahms.cl', 308) if name.startswith('www.') else (None, None)
            if (alias['redirect'], alias['redirectStatusCode']) != expected_redirect:
                raise Refused('Canonical/www 308 routing contract differs')

    def promote(self, requested_id, staged, manifest_bytes, observed_files):
        self.guards(BASE_ID)
        if requested_id != FAKE_STAGED_ID or staged['validatedId'] != requested_id:
            raise Refused('Promotion ID must equal the exact validated staged ID')
        if staged['ready'] is not True or staged['environment'] != 'production' or staged['domainsAssigned']:
            raise Refused('Staged readiness/environment/domain isolation differs')
        if digest(manifest_bytes) != self.release_cert:
            raise Refused('Pinned candidate inventory changed after validation')
        for key, value in self.base_files.items():
            if (key == 'config.json' or key.startswith('functions/')) and observed_files.get(key) != value:
                raise Refused('Function or runtime config bytes differ from Production')
        if observed_files != json.loads(manifest_bytes)['files'] or observed_files != self.release_files:
            raise Refused('Artifact bytes differ from the certified candidate inventory')
        next_state = copy.deepcopy(self.state)
        for alias in next_state['aliases'].values():
            alias['deploymentId'] = requested_id
        next_state['artifact'] = {'deploymentId': requested_id, 'certificate': self.release_cert, 'files': observed_files}
        self.state = next_state
        self.commits += 1

    def rollback(self, requested_id, recovery_ready):
        self.guards(FAKE_STAGED_ID)
        if requested_id != BASE_ID or recovery_ready is not True:
            raise Refused('Recovery must use the pinned READY production deployment')
        next_state = copy.deepcopy(self.state)
        for alias in next_state['aliases'].values():
            alias['deploymentId'] = BASE_ID
        next_state['artifact'] = {'deploymentId': BASE_ID, 'certificate': BASE_CERT, 'files': self.base_files}
        self.state = next_state
        self.commits += 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--private-root', type=Path, default=PRIVATE)
    parser.add_argument('--receipt', type=Path, default=ROOT / 'docs/measurement-20261119/release-simulation.json')
    args = parser.parse_args()
    private = args.private_root
    base_manifest = private / 'sollahms-seo-geo-private/candidate-current-inventory.json'
    release_manifest = private / 'sollahms-measurement-private/candidate-release-inventory.json'
    raw_base, raw_release = base_manifest.read_bytes(), release_manifest.read_bytes()
    proof = json.loads((ROOT / 'docs/measurement-20261119/artifact-proof.json').read_text())
    snapshot = json.loads((private / 'sollahms-measurement-private/platform-before-preview.json').read_text())
    assert digest(raw_base) == BASE_CERT == proof['baseInventorySHA256']
    assert digest(raw_release) == proof['candidateInventorySHA256']
    base = runtime_inventory(private / 'sollahms-seo-geo-private/candidate-current/.vercel/output')
    release = runtime_inventory(private / 'sollahms-measurement-private/candidate-release/.vercel/output')
    assert base == json.loads(raw_base)['files'], 'Baseline bytes do not match certificate'
    assert release == json.loads(raw_release)['files'], 'Candidate bytes do not match certificate'
    changed = sorted(k for k in base.keys() & release.keys() if base[k] != release[k])
    added = sorted(release.keys() - base.keys())
    assert changed == sorted(item['path'] for item in proof['changed'])
    assert added == sorted(item['path'] for item in proof['added']) and not base.keys() - release.keys()
    assert (len(base), len(release)) == (1723, 1727)
    protected = {k: v for k, v in base.items() if k == 'config.json' or k.startswith('functions/')}
    assert all(release[k] == v for k, v in protected.items())
    function_roots = {k.split('.func/')[0] for k in protected if k.startswith('functions/') and '.func/' in k}
    assert len(function_roots) == 7
    staged = {'validatedId': FAKE_STAGED_ID, 'ready': True, 'environment': 'production', 'domainsAssigned': False}
    checks = []

    def fresh():
        return OfflineRelease(snapshot, base, release, digest(raw_release))

    def refusal(name, alter):
        model = fresh()
        parameters = {'requested_id': FAKE_STAGED_ID, 'staged': copy.deepcopy(staged),
                      'manifest_bytes': raw_release, 'observed_files': release}
        alter(model, parameters)
        before = object_digest(model.state)
        try:
            model.promote(**parameters)
        except Refused as error:
            assert model.commits == 0 and object_digest(model.state) == before
            checks.append({'name': name, 'passed': True, 'refusedBeforeCommit': True,
                           'stateUnchangedByOperation': True, 'reason': str(error)})
        else:
            raise AssertionError('Unsafe scenario was not refused: ' + name)

    model = fresh()
    initial_state = object_digest(model.state)
    model.promote(FAKE_STAGED_ID, staged, raw_release, release)
    assert {a['deploymentId'] for a in model.state['aliases'].values()} == {FAKE_STAGED_ID}
    assert model.state['artifact']['files'] == release and model.state['settings'] == snapshot['projectSettings']
    checks.append({'name': 'Promote exact validated ID in memory', 'passed': True,
                   'validatedId': FAKE_STAGED_ID, 'promotedId': FAKE_STAGED_ID, 'bothAliasesUseSameId': True})
    model.rollback(BASE_ID, recovery_ready=True)
    assert object_digest(model.state) == initial_state and model.commits == 2
    checks.append({'name': 'Rollback in memory restores pinned 86B bytes and routing', 'passed': True,
                   'recoveryId': BASE_ID, 'restoredFiles': len(base), 'settingsAndRoutingRestored': True})
    refusal('Different promotion ID', lambda model, p: p.update(requested_id='SIMULATED_OTHER_ID'))
    refusal('Inventory changed after validation', lambda model, p: p.update(manifest_bytes=raw_release + b'\n'))

    def altered_function(model, parameters):
        files = copy.deepcopy(release)
        function = next(k for k in sorted(protected) if k.startswith('functions/') and k.endswith('.mjs'))
        files[function]['sha256'] = '0' * 64
        parameters['observed_files'] = files
    refusal('Function bytes changed despite intact inventory certificate', altered_function)

    def advanced_aliases(model, parameters):
        for alias in model.state['aliases'].values():
            alias['deploymentId'] = 'SIMULATED_CONCURRENT_PRODUCTION_ID'
    refusal('Production aliases advanced since snapshot', advanced_aliases)
    refusal('Platform autoAssign setting advanced', lambda model, p: model.state['settings'].update(autoAssignCustomDomains=True))
    refusal('www redirect changed', lambda model, p: model.state['aliases']['www.sollahms.cl'].update(redirectStatusCode=307))
    refusal('Staged environment differs', lambda model, p: p['staged'].update(environment='preview'))
    recovery_model = fresh()
    recovery_model.promote(FAKE_STAGED_ID, staged, raw_release, release)
    for alias in recovery_model.state['aliases'].values():
        alias['deploymentId'] = 'SIMULATED_CONCURRENT_AFTER_PROMOTION_ID'
    before_recovery = object_digest(recovery_model.state)
    try:
        recovery_model.rollback(BASE_ID, recovery_ready=True)
    except Refused as error:
        assert recovery_model.commits == 1 and object_digest(recovery_model.state) == before_recovery
        checks.append({'name': 'Rollback refuses to overwrite a later production deployment', 'passed': True,
                       'refusedBeforeCommit': True, 'stateUnchangedByOperation': True, 'reason': str(error)})
    else:
        raise AssertionError('Rollback overwrote concurrent production')
    receipt = {
        'recordedAtUTC': datetime.now(timezone.utc).isoformat(), 'mode': 'offline in-memory simulation only',
        'productionChanged': False, 'releaseAuthorizedBySimulation': False,
        'networkRequests': 0, 'deploymentCliCommands': 0, 'realPromotions': 0, 'realRollbacks': 0,
        'networkGuard': 'socket/socket.create_connection disabled; no HTTP or subprocess client used',
        'inputEvidence': {'artifactProof': 'artifact-proof.json', 'baseDeployment': BASE_ID,
                          'baseInventorySHA256': digest(raw_base), 'candidateInventorySHA256': digest(raw_release),
                          'baseFiles': len(base), 'candidateFiles': len(release), 'changedFiles': len(changed),
                          'addedFiles': len(added), 'removedFiles': 0, 'unchangedFiles': len(base) - len(changed),
                          'fullArtifactsRehashedLocally': True, 'platformSnapshotAt': snapshot['observedAt']},
        'readinessBoundary': 'Staged READY is a fictional simulation fixture. Recovery 86B READY was reported by the parent read-only check at 12:56 America/Santiago; not re-queried by this script. Real actions require fresh provider verification.',
        'preserved': {'functions': len(function_roots), 'functionFiles': len(protected) - 1,
                      'runtimeConfigByteIdentical': True, 'apex': 'sollahms.cl',
                      'wwwRedirect': {'to': 'sollahms.cl', 'status': 308},
                      'ssoProtection': snapshot['projectSettings']['ssoProtection'],
                      'autoAssignCustomDomains': snapshot['projectSettings']['autoAssignCustomDomains'],
                      'allSettingsComparedExactly': True},
        'passed': all(c['passed'] for c in checks), 'checks': checks,
        'limitations': ['This demonstrates local guard behavior, not Vercel API behavior, recovery eligibility or publication authority.',
                        'Compare-and-swap is modeled in memory; a real control plane can change between read and mutation and needs immediate revalidation.',
                        'No alias, environment, project setting or runtime file was modified.']}
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'passed': receipt['passed'], 'checks': len(checks), 'baseFiles': len(base),
                      'candidateFiles': len(release), 'functions': len(function_roots), 'networkRequests': 0}))


if __name__ == '__main__':
    main()
