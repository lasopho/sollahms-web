"""Offline failure controls for release preparation; no platform mutations."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / 'scripts/prepare-release.py'
spec = importlib.util.spec_from_file_location('release_preparation', MODULE)
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleasePreparationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='sollahms-release-controls-')
        self.root = Path(self.temporary.name).resolve()
        self.policy = json.loads(release.REFERENCE.read_text())

    def tearDown(self):
        self.temporary.cleanup()

    def archive(self, records):
        target = self.root / 'source.tgz'
        total = 0
        with tarfile.open(target, 'w:gz') as bundle:
            for name, data, kind in records:
                member = tarfile.TarInfo(name)
                if kind == 'file':
                    member.size = len(data)
                    total += len(data)
                    bundle.addfile(member, io.BytesIO(data))
                else:
                    member.type = tarfile.SYMTYPE if kind == 'symlink' else tarfile.LNKTYPE
                    member.linkname = '/private/contract.pdf'
                    bundle.addfile(member)
        policy = {'archiveBytes': target.stat().st_size,
                  'archiveSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                  'sourceBytes': total, 'sourceFiles': len(records)}
        return target, policy

    def staged(self):
        return {'deploymentId': 'dpl_fixture', 'projectId': self.policy['projectId'],
                'teamId': self.policy['teamId'], 'target': 'production', 'readyState': 'READY',
                'aliases': [], 'archiveSha256': self.policy['archiveSha256'],
                'approvedAppCommit': self.policy['approvedAppCommit'],
                'runtimeEnvironment': 'production', 'systemEnvironmentVerified': True,
                'publicBuildAuditPassed': True, 'providerMocksPassed': True, 'realProviderWrites': 0}

    def test_original_approved_regular_members_pass_without_extracting(self):
        archive, policy = self.archive([('index.html', b'<h1>Test</h1>', 'file'),
                                        ('api/uf.mjs', b'export default {}', 'file')])
        files = release.verify_archive(archive, policy)
        self.assertEqual(set(files), {'index.html', 'api/uf.mjs'})
        self.assertEqual(files['index.html']['sha256'], release.digest(b'<h1>Test</h1>'))
        self.assertFalse((self.root / 'index.html').exists())

    def test_changed_archive_hash_is_rejected(self):
        archive, policy = self.archive([('index.html', b'Test', 'file')])
        policy['archiveSha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'SHA-256'):
            release.verify_archive(archive, policy)

    def test_changed_size_and_incomplete_source_counts_are_rejected(self):
        archive, policy = self.archive([('index.html', b'Test', 'file')])
        for key in ['archiveBytes', 'sourceBytes', 'sourceFiles']:
            bad = dict(policy, **{key: policy[key] + 1})
            with self.subTest(key=key), self.assertRaises(ValueError):
                release.verify_archive(archive, bad)

    def test_paths_cannot_escape_the_archive_or_hide_documents(self):
        for name in ['../contract.html', '/index.html', '.env', 'assets/../index.html',
                     'assets//index.html', 'assets/./index.html', 'assets\\index.html',
                     'docs/contract.txt', 'assets/brochure-candidates/private.webp',
                     'assets/contract.pdf', 'originals/index.html']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                release.safe_name(name)

    def test_duplicate_members_and_symbolic_or_hard_links_are_rejected(self):
        batches = [[('index.html', b'A', 'file'), ('index.html', b'A', 'file')],
                   [('index.html', b'', 'symlink')], [('index.html', b'', 'hardlink')]]
        for records in batches:
            archive, policy = self.archive(records)
            with self.subTest(records=records), self.assertRaises(ValueError):
                release.verify_archive(archive, policy)

    def test_output_must_be_new_and_outside_source(self):
        source = self.root / 'checkout'
        source.mkdir()
        for output in [source, source / 'private-release', self.root]:
            with self.subTest(output=output), self.assertRaises(ValueError):
                release.outside_source(output, source)
        self.assertEqual(release.outside_source(self.root / 'fresh-private', source), (self.root / 'fresh-private').resolve())

    def test_extraction_rechecks_bytes_after_initial_verification(self):
        archive, policy = self.archive([('index.html', b'Test', 'file')])
        files = release.verify_archive(archive, policy)
        files['index.html']['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'changed after verification'):
            release.extract_verified(archive, self.root / 'source', files)

    def test_git_reference_rejects_a_different_approved_blob(self):
        files = {'index.html': {'gitBlob': 'b' * 40}}
        policy = dict(self.policy, trackedSourceFiles=1, privateSourceFiles=0)
        replies = [self.policy['approvedAppCommit'].encode() + b'\n', b'sha1\n',
                   b'100644 blob ' + b'a' * 40 + b'\tindex.html\0']
        with patch.object(release, 'git', side_effect=replies), self.assertRaisesRegex(ValueError, 'differs from approved'):
            release.verify_git_reference(self.root, files, policy)

    def test_git_reference_rejects_unapproved_non_git_sources(self):
        replies = [self.policy['approvedAppCommit'].encode() + b'\n', b'sha1\n', b'']
        with patch.object(release, 'git', side_effect=replies), self.assertRaisesRegex(ValueError, 'non-Git'):
            release.verify_git_reference(self.root, {'api/secret.mjs': {'gitBlob': 'a' * 40}}, self.policy)

    def test_clean_clone_can_recover_private_media_from_archive_without_local_ignored_files(self):
        (self.root / 'index.html').write_bytes(b'Approved')
        files = {'index.html': {'sha256': release.digest(b'Approved')},
                 'assets/propiedades/ingevec-preview/matta-016/cover.webp': {'sha256': 'a' * 64}}
        with patch.object(release, 'git', side_effect=[b'index.html\0', b'', b'']):
            release.verify_worktree(self.root, files, self.policy)
        self.assertFalse((self.root / 'assets').exists())

    def test_current_tracked_changes_and_extra_app_sources_need_new_approval(self):
        for replies in [[b'index.html\0', b'api/new.mjs\n'],
                        [b'index.html\0', b'', b'new-project.html\n']]:
            with self.subTest(replies=replies), patch.object(release, 'git', side_effect=replies), self.assertRaises(ValueError):
                release.verify_worktree(self.root, {}, self.policy)

    def test_missing_changed_or_symbolic_tracked_worktree_files_are_rejected(self):
        files = {'index.html': {'sha256': release.digest(b'Approved')}}
        for content in [None, b'Changed']:
            if content:
                (self.root / 'index.html').write_bytes(content)
            with self.subTest(content=content), patch.object(release, 'git', side_effect=[b'index.html\0', b'', b'']), self.assertRaises(ValueError):
                release.verify_worktree(self.root, files, self.policy)

    def test_correct_sanitized_staged_receipt_passes_without_promotion(self):
        self.assertEqual(release.verify_staged_deployment(self.staged(), self.policy), 'dpl_fixture')

    def test_preview_failed_or_already_aliased_deployments_cannot_pass_as_staged(self):
        for key, value in [('target', 'preview'), ('readyState', 'ERROR'),
                           ('aliases', ['sollahms.cl']), ('aliases', None),
                           ('projectId', 'prj_other'), ('teamId', 'team_other')]:
            with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                release.verify_staged_deployment(dict(self.staged(), **{key: value}), self.policy)

    def test_source_and_system_environment_must_be_verified(self):
        for key, value in [('archiveSha256', '0' * 64), ('approvedAppCommit', '0' * 40),
                           ('runtimeEnvironment', 'preview'), ('systemEnvironmentVerified', False)]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                release.verify_staged_deployment(dict(self.staged(), **{key: value}), self.policy)

    def test_missing_fields_mock_failure_and_real_provider_writes_are_rejected(self):
        for key in self.staged():
            bad = self.staged()
            del bad[key]
            with self.subTest(missing=key), self.assertRaises(ValueError):
                release.verify_staged_deployment(bad, self.policy)
        for key, value in [('publicBuildAuditPassed', False), ('providerMocksPassed', False),
                           ('realProviderWrites', 1)]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                release.verify_staged_deployment(dict(self.staged(), **{key: value}), self.policy)

    def test_packaging_receives_only_local_build_settings_and_no_provider_credentials(self):
        fake = type('Result', (), {'stdout': '{"pages":151}'})()
        with patch.object(release.subprocess, 'run', return_value=fake) as run:
            self.assertEqual(release.build(self.root, '/usr/bin/node', 'production', 'main'), {'pages': 151})
        command = run.call_args.args[0]
        self.assertEqual(command, ['/usr/bin/node', str(self.root / 'scripts/package-vercel.mjs')])
        self.assertEqual(set(run.call_args.kwargs['env']),
                         {'PATH', 'VERCEL_ENV', 'VERCEL_GIT_COMMIT_REF', 'SOLLAHMS_BROCHURE_PROFILE'})
        self.assertNotIn('RESEND_API_KEY', run.call_args.kwargs['env'])

    def test_protected_review_does_not_request_a_public_web_profile(self):
        fake = type('Result', (), {'stdout': '{"pages":150}'})()
        with patch.object(release.subprocess, 'run', return_value=fake) as run:
            release.build(self.root, '/usr/bin/node', 'preview', 'codex/ecasa-cartera-definitiva', public_profile=False)
        self.assertEqual(set(run.call_args.kwargs['env']), {'PATH', 'VERCEL_ENV', 'VERCEL_GIT_COMMIT_REF'})

    def test_protected_ecasa_reference_cannot_authorize_production_staging(self):
        policy = dict(self.policy, contentProfile='protected_ecasa_review')
        with self.assertRaisesRegex(ValueError, 'protected Ecasa review'):
            release.verify_staged_deployment(self.staged(), policy)

    def test_private_ecasa_media_require_an_explicit_folder_policy(self):
        files = {'assets/propiedades/ecasa-preview/ferroparque/cover.webp': {'gitBlob': 'a' * 40}}
        replies = [self.policy['approvedAppCommit'].encode() + b'\n', b'sha1\n', b'']
        with patch.object(release, 'git', side_effect=replies), self.assertRaisesRegex(ValueError, 'non-Git'):
            release.verify_git_reference(self.root, files, self.policy)
        policy = dict(self.policy, privateMediaFolders=['ingevec-preview', 'ecasa-preview'], trackedSourceFiles=0, privateSourceFiles=1)
        with patch.object(release, 'git', side_effect=replies):
            self.assertEqual(release.verify_git_reference(self.root, files, policy), 0)


if __name__ == '__main__':
    unittest.main()
