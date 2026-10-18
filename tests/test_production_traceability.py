"""Offline OPS-01/OPS-02 controls; never call providers or change remote rules."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('production_traceability', ROOT / 'scripts/production-traceability.py')
trace = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trace)


class ProductionTraceabilityTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='sollahms-ops-controls-')
        self.parent = Path(self.temporary.name)
        self.root = self.parent / 'checkout'
        self.root.mkdir()
        self.git('init', '--quiet')
        for path in trace.GUARDS:
            target = self.root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text('fixture\n')
        (self.root / 'vercel.json').write_text(json.dumps({'git': {'deploymentEnabled': {'main': False}}}))
        (self.root / 'data').mkdir()
        (self.root / trace.CATALOGUE).write_text(json.dumps([{'slug': 'one'}]))
        (self.root / 'index.html').write_text('before\n')
        self.source = self.save('Source declared by metadata')
        (self.root / trace.CATALOGUE).write_text(json.dumps([{'slug': 'one'}, {'slug': 'two'}]))
        (self.root / 'index.html').write_text('after\n')
        self.base = self.save('Audited main fixture')
        self.metadata = {
            'schemaVersion': 1, 'observedAt': '2026-10-17T03:17:34Z',
            'alias': {'hostname': 'sollahms.cl', 'deploymentId': 'dpl_fixture',
                      'projectId': 'prj_fixture', 'url': 'fixture.vercel.app'},
            'deployment': {'id': 'dpl_fixture', 'projectId': 'prj_fixture', 'url': 'fixture.vercel.app',
                           'target': 'production', 'readyState': 'READY', 'source': 'cli',
                           'repository': 'lasopho/sollahms-web', 'declaredCommitSha': self.source,
                           'declaredCommitRef': 'main'},
            'remoteMain': {'sha': self.base, 'protected': False},
        }

    def tearDown(self):
        self.temporary.cleanup()

    def git(self, *args):
        return subprocess.check_output(['git', '-c', 'user.name=Offline Fixture',
                                        '-c', 'user.email=fixture@example.test', *args], cwd=self.root).decode().strip()

    def save(self, message):
        self.git('add', '.')
        self.git('-c', 'core.hooksPath=/dev/null', 'commit', '--quiet', '-m', message)
        return self.git('rev-parse', 'HEAD')

    def receipt(self, metadata=None):
        metadata = self.metadata if metadata is None else metadata
        return trace.create_receipt(self.root, self.base, metadata, json.dumps(metadata).encode())

    def test_real_git_diff_and_sha256_never_certify_deployed_bytes(self):
        receipt, baseline, source = self.receipt()
        self.assertEqual(receipt['gitFilesDifferent'], 2)
        self.assertEqual(receipt['declaredGitCatalogueCount'], 1)
        self.assertEqual(receipt['baseGitCatalogueCount'], 2)
        self.assertEqual(baseline['files']['index.html']['sha256'], hashlib.sha256(b'after\n').hexdigest())
        self.assertEqual(source['files']['index.html']['sha256'], hashlib.sha256(b'before\n').hexdigest())
        self.assertTrue(all(row['unchangedFromBase'] for row in receipt['publicationGuards']))
        self.assertTrue(receipt['workingMainGitDeploymentDisabled'])
        self.assertFalse(receipt['artifactBytesVerified'])
        self.assertEqual(receipt['deploymentsCreated'], 0)
        self.assertTrue(receipt['status'].startswith('BLOCKED'))

    def test_working_publication_control_mutation_is_visible_without_rewriting_it(self):
        changed = b'{"git":{"deploymentEnabled":{"main":true}}}\n'
        (self.root / 'vercel.json').write_bytes(changed)
        receipt, _, _ = self.receipt()
        guard = next(row for row in receipt['publicationGuards'] if row['path'] == 'vercel.json')
        self.assertFalse(guard['unchangedFromBase'])
        self.assertFalse(receipt['workingMainGitDeploymentDisabled'])
        self.assertEqual((self.root / 'vercel.json').read_bytes(), changed)

    def test_inconsistent_alias_deployment_or_project_is_rejected(self):
        for key in ['deploymentId', 'projectId', 'url']:
            metadata = copy.deepcopy(self.metadata)
            metadata['alias'][key] = 'different'
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, 'mismatch'):
                self.receipt(metadata)

    def test_sha_inputs_cannot_be_options_refs_or_unknown_commits(self):
        for value in ['HEAD', '--help', 'a' * 39, self.base.upper(), '0' * 40]:
            with self.subTest(value=value), self.assertRaises((ValueError, subprocess.CalledProcessError)):
                trace.commit(self.root, value)

    def test_output_cannot_overwrite_checkout_git_evidence_or_another_worktree(self):
        sibling = self.parent / 'other-checkout'
        self.git('worktree', 'add', '--quiet', '--detach', str(sibling), self.source)
        for output in [self.root / 'receipt', self.root / '.git' / 'receipt', self.parent, sibling / 'receipt']:
            with self.subTest(output=output), self.assertRaises(ValueError):
                trace.output_outside_repository(self.root, output)
        good = self.parent / 'new-evidence'
        self.assertEqual(trace.output_outside_repository(self.root, good), good.resolve())
        self.assertFalse(good.exists())

    def test_incomplete_wrong_scope_and_nonproduction_metadata_is_rejected(self):
        for field, value in [('target', 'preview'), ('readyState', 'ERROR'), ('repository', 'other/repo')]:
            metadata = copy.deepcopy(self.metadata)
            metadata['deployment'][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.receipt(metadata)
        for metadata in [{}, [], dict(self.metadata, observedAt='2026-10-17'), dict(self.metadata, schemaVersion=2),
                         dict(self.metadata, remoteMain={'sha': self.base})]:
            with self.subTest(metadata=metadata), self.assertRaises(ValueError):
                self.receipt(metadata)

    def test_receipt_filters_unrelated_metadata_and_preserves_checkout(self):
        before = self.git('status', '--porcelain')
        metadata = copy.deepcopy(self.metadata)
        metadata['unrelatedPrivateData'] = 'synthetic-canary-do-not-copy'
        metadata['deployment']['unrelatedPrivateData'] = 'synthetic-canary-do-not-copy'
        receipt, _, _ = self.receipt(metadata)
        self.assertNotIn('synthetic-canary-do-not-copy', json.dumps(receipt))
        self.assertEqual(before, self.git('status', '--porcelain'))

    def test_ruleset_proposal_simulates_required_review_ci_identity_and_freshness(self):
        proposal = json.loads((ROOT / 'docs/proposals/main-ruleset.json').read_text())
        self.assertEqual(proposal['conditions']['ref_name'], {'include': ['refs/heads/main'], 'exclude': []})
        self.assertEqual(proposal['bypass_actors'], [])
        rules = {rule['type']: rule.get('parameters', {}) for rule in proposal['rules']}
        self.assertTrue({'deletion', 'non_fast_forward', 'pull_request', 'required_status_checks'} <= set(rules))
        required = rules['required_status_checks']['required_status_checks']
        self.assertEqual(required, [{'context': 'Git checkout regression', 'integration_id': 15368}])
        self.assertTrue(rules['required_status_checks']['strict_required_status_checks_policy'])
        self.assertEqual(rules['pull_request']['required_approving_review_count'], 1)
        self.assertTrue(rules['pull_request']['dismiss_stale_reviews_on_push'])
        self.assertTrue(rules['pull_request']['require_last_push_approval'])
        self.assertTrue(rules['pull_request']['required_review_thread_resolution'])

        def simulated_accepts(*, pull_request=True, approvals=1, approved_latest=True,
                              up_to_date=True, resolved_threads=True, checks=None):
            checks = checks if checks is not None else [('Git checkout regression', 15368, 'success')]
            return (pull_request and approvals >= rules['pull_request']['required_approving_review_count']
                    and approved_latest and up_to_date and resolved_threads
                    and all((row['context'], row['integration_id'], 'success') in checks for row in required))

        self.assertTrue(simulated_accepts())
        for inputs in [{'pull_request': False}, {'approvals': 0}, {'approved_latest': False},
                       {'up_to_date': False}, {'resolved_threads': False}, {'checks': []},
                       {'checks': [('Git checkout regression', 8329, 'success')]},
                       {'checks': [('Git checkout regression', 15368, 'failure')]}]:
            with self.subTest(inputs=inputs):
                self.assertFalse(simulated_accepts(**inputs))


if __name__ == '__main__':
    unittest.main()
