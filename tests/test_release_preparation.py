"""Offline failure controls for release preparation; no platform mutations."""
import hashlib
import copy
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

    def test_private_qa_tools_are_verified_without_entering_deployment_source(self):
        data = b'// committed QA tool'
        tools = []
        for name in sorted(release.VERIFICATION_TOOLS):
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            tools.append({'file': name, 'sha256': release.digest(data), 'size': len(data)})
            with self.assertRaisesRegex(ValueError, 'operational directory'):
                release.safe_name(name)
        policy = dict(self.policy, verificationTools=tools)
        with patch.object(release, 'git', return_value=data):
            release.verify_verification_tools(self.root, policy)
        with patch.object(release, 'git', return_value=b'// other commit'), self.assertRaisesRegex(ValueError, 'Git commit'):
            release.verify_verification_tools(self.root, policy)
        tools[0]['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'private receipt'):
            release.verify_verification_tools(self.root, policy)


    def official_archive(self):
        manifest = json.loads((MODULE.parents[1] / release.OFFICIAL_MANIFEST).read_text())
        records = []
        for project in manifest['projects']:
            image = project['images'][0]
            for asset in [image['original'], image]:
                payload = ('fixture:' + asset['localPath']).encode()
                asset['bytes'], asset['sha256'] = len(payload), release.digest(payload)
                records.append((asset['localPath'].lstrip('/'), payload, 'file'))
        manifest_bytes = json.dumps(manifest).encode()
        records.extend([(release.OFFICIAL_MANIFEST, manifest_bytes, 'file'),
                        (release.OFFICIAL_MODULE, b'// synthetic reviewed overlay', 'file')])
        sources, published = release.official_manifest_inventory(manifest)
        archive, policy = self.archive(records)
        policy.update(contentProfile='protected_ecasa_review', officialSourceMedia=4,
            officialPublishedMedia=2, ecasaGalleryImages=116,
            officialOriginals={'manifestSha256': release.digest(manifest_bytes),
                'sourceAssets': [sources[name] for name in sorted(sources)],
                'publishedAssets': [published[name] for name in sorted(published)]})
        return archive, policy

    def test_official_archive_binds_four_private_sources_and_two_published_images(self):
        archive, policy = self.official_archive()
        files = release.verify_archive(archive, policy)
        self.assertEqual(len(files), 6)
        self.assertEqual(len(release.official_policy_inventory(policy, files)), 4)
        self.assertEqual(sum(item['kind'] == 'original' for item in policy['officialOriginals']['sourceAssets']), 2)

    def test_official_archive_rejects_original_publication_and_changed_source_receipts(self):
        archive, original = self.official_archive()
        for mutation in ['publish_original', 'changed_hash', 'missing_source', 'production_profile']:
            policy = copy.deepcopy(original)
            if mutation == 'publish_original':
                policy['officialOriginals']['publishedAssets'][0] = next(item for item in policy['officialOriginals']['sourceAssets'] if item['kind'] == 'original')
            elif mutation == 'changed_hash':
                policy['officialOriginals']['sourceAssets'][0]['sha256'] = '0' * 64
            elif mutation == 'missing_source':
                policy['officialOriginals']['sourceAssets'].pop()
            else:
                policy['contentProfile'] = 'public_web_parity'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                release.verify_archive(archive, policy)

    def test_official_folder_permission_cannot_replace_its_exact_manifest_inventory(self):
        archive, policy = self.official_archive()
        files = release.verify_archive(archive, policy)
        policy.update(approvedAppCommit=self.policy['approvedAppCommit'], trackedSourceFiles=2, privateSourceFiles=4,
                      privateMediaFolders=['ingevec-preview', 'ecasa-preview', release.OFFICIAL_FOLDER])
        tree = b''.join(b'100644 blob ' + files[name]['gitBlob'].encode() + b'\t' + name.encode() + b'\0'
                        for name in [release.OFFICIAL_MANIFEST, release.OFFICIAL_MODULE])
        replies = [policy['approvedAppCommit'].encode() + b'\n', b'sha1\n', tree]
        with patch.object(release, 'git', side_effect=replies):
            self.assertEqual(release.verify_git_reference(self.root, files, policy), 2)
        bad = dict(policy, privateMediaFolders=['ingevec-preview', 'ecasa-preview'])
        with patch.object(release, 'git', side_effect=replies), self.assertRaisesRegex(ValueError, 'exact manifest inventory'):
            release.verify_git_reference(self.root, files, bad)
        bad = dict(policy)
        bad.pop('officialOriginals')
        with patch.object(release, 'git', side_effect=replies), self.assertRaisesRegex(ValueError, 'exact review inventory'):
            release.verify_git_reference(self.root, files, bad)
        private_name = policy['officialOriginals']['sourceAssets'][0]['path'].lstrip('/')
        tracked_private = tree + b'100644 blob ' + files[private_name]['gitBlob'].encode() + b'\t' + private_name.encode() + b'\0'
        replies = [policy['approvedAppCommit'].encode() + b'\n', b'sha1\n', tracked_private]
        with patch.object(release, 'git', side_effect=replies), self.assertRaisesRegex(ValueError, 'outside public Git'):
            release.verify_git_reference(self.root, files, policy)

    def manual_fixture(self):
        checkout = MODULE.parents[1]
        base = json.loads((checkout / release.BASE_QUALITY_MANIFEST).read_text())
        manual = json.loads((checkout / release.MANUAL_MANIFEST).read_text())
        official = json.loads((checkout / release.OFFICIAL_MANIFEST).read_text())
        return base, manual, official

    def manual_archive(self):
        archive, official_policy = self.official_archive()
        with tarfile.open(archive) as bundle:
            records = [(member.name, bundle.extractfile(member).read(), 'file') for member in bundle]
        base, manual, official = self.manual_fixture()
        selection = release.manual_quality_selection(manual, base, official)
        manual_bytes = json.dumps(manual).encode()
        records.extend([(release.BASE_QUALITY_MANIFEST, (MODULE.parents[1] / release.BASE_QUALITY_MANIFEST).read_bytes(), 'file'),
                        (release.MANUAL_MANIFEST, manual_bytes, 'file'),
                        (release.MANUAL_MODULE, b'// private manual consumer fixture', 'file')])
        archive, policy = self.archive(records)
        policy.update({key: value for key, value in official_policy.items() if key not in
                       {'archiveBytes', 'archiveSha256', 'sourceBytes', 'sourceFiles'}})
        policy.update(ecasaPublishedMedia=89, ecasaGalleryImages=72,
            manualQuality={'manifestSha256': release.digest(manual_bytes), 'summary': selection['summary'],
                           'effectiveImages': selection['effectiveImages'], 'projects': selection['projects']})
        return archive, policy

    def test_manual_archive_preserves_frozen_base_and_separates_source_from_publication(self):
        archive, policy = self.manual_archive()
        files = release.verify_archive(archive, policy)
        summary = release.manual_policy_inventory(policy, files)
        self.assertEqual((summary['keptImages'], summary['excludedImages'], summary['coverOnlyImages']), (70, 48, 7))
        self.assertEqual((summary['documentaryGalleryImages'], summary['documentaryPublishedImages']), (8, 15))
        self.assertEqual(policy['ecasaPublishedMedia'], 89)
        self.assertEqual(len(release.official_policy_inventory(policy, files)), 4)

    def test_manual_archive_rejects_changed_receipts_missing_consumer_and_public_profile(self):
        archive, original = self.manual_archive()
        for mutation in ['hash', 'decision', 'count', 'project', 'public']:
            policy = copy.deepcopy(original)
            if mutation == 'hash': policy['manualQuality']['manifestSha256'] = '0' * 64
            elif mutation == 'decision': policy['manualQuality']['effectiveImages'][0]['reason'] = 'unreviewed receipt edit'
            elif mutation == 'count': policy['manualQuality']['summary']['documentaryPublishedImages'] += 1
            elif mutation == 'project': policy['manualQuality']['projects'][0]['previewCover'] = '/assets/unrelated.webp'
            else: policy['contentProfile'] = 'public_web_parity'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): release.verify_archive(archive, policy)
        files = release.verify_archive(archive, original)
        files.pop(release.MANUAL_MODULE)
        with self.assertRaisesRegex(ValueError, 'manifest or consumer'): release.manual_policy_inventory(original, files)

    def test_manual_decisions_cannot_mutate_originals_plans_or_untouched_galleries(self):
        base, original, official = self.manual_fixture()
        for mutation in ['hash', 'origin', 'plan', 'official', 'untouched', 'extra']:
            manual = copy.deepcopy(original)
            if mutation == 'untouched':
                row = next(project for project in manual['projects'] if project['slug'] == 'wayra')['images'][-1]
                row['decision'] = 'exclude'
            else:
                row = manual['projects'][0]['images'][0]
                if mutation == 'hash': row['sha256'] = '0' * 64
                elif mutation == 'origin': row['originCommercialSlug'] = 'ferroparque'
                elif mutation == 'plan': row['localPath'] = '/assets/propiedades/ecasa-preview/lomas-de-puyai-3/plano.webp'
                elif mutation == 'official': row['decision'] = 'exclude'
                else: row['alt'] = 'unapproved caption'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                release.manual_quality_selection(manual, base, official)

    def test_cover_only_must_be_a_real_final_cover_after_official_overlay(self):
        base, manual, official = self.manual_fixture()
        ferro = next(project for project in manual['projects'] if project['slug'] == 'ferroparque')
        row = next(image for image in ferro['images'] if image['kind'] == 'documentary')
        ferro['previewCover'] = row['localPath'];row['coverOnly'] = True
        with self.assertRaisesRegex(ValueError, 'final same-project cover'):
            release.manual_quality_selection(manual, base, official)

    def test_manual_selection_preserves_source_dictionary_and_all_plan_hashes(self):
        base, manual, official = self.manual_fixture()
        selection = release.manual_quality_selection(manual, base, official)
        docs = json.loads((MODULE.parents[1] / 'data/brochures-ecasa.json').read_text())
        originals = {asset['localPath'].lstrip('/'): asset['sha256'] for project in docs['projects']
                     for asset in [*project['images'], *(model['plan'] for model in project['models'])]}
        before = dict(originals); selected = release.manual_published_media(originals, selection)
        plans = {model['plan']['localPath'].lstrip('/'): model['plan']['sha256']
                 for project in docs['projects'] for model in project['models']}
        self.assertEqual(originals, before)
        self.assertEqual(len(originals), 130);self.assertEqual(len(selected), 89)
        self.assertEqual({name: selected[name] for name in plans}, plans)
        excluded = [row for row in selection['effectiveImages'] if row['kind'] == 'documentary' and
                    row['decision'] == 'exclude' and not row['coverOnly']]
        self.assertTrue(all(row['localPath'].lstrip('/') not in selected for row in excluded))

    def owner_fixture(self):
        owner = json.loads((MODULE.parents[1] / release.OWNER_MANIFEST).read_text())
        if owner['schemaVersion'] == 2:
            project = copy.deepcopy(next(project for project in owner['projects'] if project['projectSlug'] == release.OWNER_PROJECT))
            project['conversion']['crop'] = False
            owner = {**{key: owner[key] for key in ['protectedPreviewOnly', 'baselineCommit', 'provenance']},
                     'schemaVersion': 1, 'scope': 'ecasa_owner_cover_only', **project}
        manual = json.loads((MODULE.parents[1] / release.MANUAL_MANIFEST).read_text())
        sources, published = release.owner_manifest_inventory(owner, manual)
        files = {name: {'sha256': item['sha256'], 'size': item['bytes']} for name, item in sources.items()}
        files.update({release.OWNER_MANIFEST: {'sha256': 'f' * 64}, release.OWNER_MODULE: {},
                      owner['supersededCoverOnly']['localPath'].lstrip('/'): {'sha256': owner['supersededCoverOnly']['sha256']}})
        policy = {'contentProfile': 'protected_ecasa_review', 'ownerSourceMedia': 2, 'ownerPublishedMedia': 1,
                  'ownerCover': {'manifestSha256': 'f' * 64, 'projectSlug': release.OWNER_PROJECT, 'provenance': 'user_provided',
                    'sourceAssets': [sources[name] for name in sorted(sources)],
                    'publishedAssets': [published[name] for name in sorted(published)],
                    'supersededCoverOnly': owner['supersededCoverOnly']}}
        return owner, manual, policy, files

    def test_owner_inventory_publishes_only_native_webp_and_requires_preserved_previous_cover(self):
        owner, manual, policy, files = self.owner_fixture()
        inventory = release.owner_policy_inventory(policy, files)
        self.assertEqual(len(inventory), 2)
        self.assertEqual([item['kind'] for item in policy['ownerCover']['publishedAssets']], ['selected'])
        original = owner['original']['localPath'].lstrip('/')
        self.assertEqual(release.safe_name(original, inventory), original)
        with self.assertRaises(ValueError): release.safe_name(original)
        files.pop(owner['supersededCoverOnly']['localPath'].lstrip('/'))
        with self.assertRaisesRegex(ValueError, 'preserved superseded source'): release.owner_policy_inventory(policy, files)

    def test_owner_manifest_rejects_cross_project_supersession_extra_fields_and_changed_native_conversion(self):
        original, manual, _, _ = self.owner_fixture()
        for mutation in ['project', 'superseded', 'lossy', 'resize', 'dimensions', 'extra', 'original_public_path']:
            owner = copy.deepcopy(original)
            if mutation == 'project': owner['projectSlug'] = 'endemico'
            elif mutation == 'superseded': owner['supersededCoverOnly']['localPath'] = '/assets/propiedades/ecasa-preview/lamara/imagen-02-p01.webp'
            elif mutation == 'lossy': owner['conversion']['lossless'] = False
            elif mutation == 'resize': owner['conversion']['resize'] = True
            elif mutation == 'dimensions': owner['selected']['width'] += 1
            elif mutation == 'extra': owner['selected']['precioDesdeUF'] = 1000
            else: owner['original']['localPath'] = owner['selected']['localPath'].replace('.webp', '.png')
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): release.owner_manifest_inventory(owner, manual)

    def test_owner_receipt_cannot_publish_raw_or_bypass_exact_source_allowlist(self):
        _, _, original, files = self.owner_fixture()
        for mutation in ['raw', 'missing', 'hash', 'unreceipted', 'public']:
            policy = copy.deepcopy(original);inventory = copy.deepcopy(files)
            if mutation == 'raw': policy['ownerCover']['publishedAssets'] = [item for item in policy['ownerCover']['sourceAssets'] if item['kind'] == 'original']
            elif mutation == 'missing': inventory.pop(release.OWNER_MODULE)
            elif mutation == 'hash': policy['ownerCover']['sourceAssets'][0]['sha256'] = '0' * 64
            elif mutation == 'unreceipted': policy.pop('ownerCover')
            else: policy['contentProfile'] = 'public_web_parity'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): release.owner_policy_inventory(policy, inventory)

    def test_owner_selection_removes_only_superseded_documentary_cover_and_keeps_source_immutable(self):
        owner, manual, _, _ = self.owner_fixture()
        base = json.loads((MODULE.parents[1] / release.BASE_QUALITY_MANIFEST).read_text())
        official = json.loads((MODULE.parents[1] / release.OFFICIAL_MANIFEST).read_text())
        selection = release.manual_quality_selection(manual, base, official)
        docs = json.loads((MODULE.parents[1] / 'data/brochures-ecasa.json').read_text())
        originals = {asset['localPath'].lstrip('/'): asset['sha256'] for project in docs['projects']
                     for asset in [*project['images'], *(model['plan'] for model in project['models'])]}
        before = dict(originals)
        without_owner = release.manual_published_media(originals, selection)
        with_owner = release.manual_published_media(originals, selection, owner)
        self.assertEqual(originals, before)
        self.assertEqual(len(with_owner), 88)
        self.assertEqual(set(without_owner) - set(with_owner), {release.SUPERSEDED_OWNER_COVER.lstrip('/')})
        self.assertEqual(selection['summary']['coverOnlyImages'], 7)

    def owner_v2_fixture(self):
        legacy, manual, _, _ = self.owner_fixture()
        projects = []
        for index, slug in enumerate(sorted(release.OWNER_PROJECTS)):
            project = {key: copy.deepcopy(legacy[key]) for key in ['original', 'selected', 'conversion']}
            project['projectSlug'] = slug; project['conversion']['crop'] = None
            for kind in ['original', 'selected']:
                project[kind]['localPath'] = project[kind]['localPath'].replace('/edificio-bezanilla/', '/' + slug + '/')
                project[kind]['sha256'] = str(index + 1) * 64
            previous = next(row for row in manual['projects'] if row['slug'] == slug)
            choice = next(row for row in previous['images'] if row['localPath'] == previous['previewCover'])
            project['supersededCoverOnly'] = None if slug == 'espacio-victoria' else {'localPath': choice['localPath'], 'sha256': choice['sha256']}
            projects.append(project)
        owner = {'schemaVersion': 2, 'scope': 'ecasa_owner_covers_only', 'protectedPreviewOnly': True,
                 'baselineCommit': legacy['baselineCommit'], 'provenance': 'user_provided', 'projects': projects}
        return owner, manual

    def test_five_owner_projects_require_exact_cardinality_identity_and_source_namespace(self):
        original, manual = self.owner_v2_fixture()
        sources, published = release.owner_manifest_inventory(original, manual)
        self.assertEqual((len(sources), len(published)), (10, 5))
        for mutation in ['missing', 'duplicate', 'other', 'extra', 'cross_asset']:
            owner = copy.deepcopy(original)
            if mutation == 'missing': owner['projects'].pop()
            elif mutation == 'duplicate': owner['projects'][-1] = copy.deepcopy(owner['projects'][0])
            elif mutation == 'other': owner['projects'][0]['projectSlug'] = 'lamara'
            elif mutation == 'extra': owner['projects'][0]['precioDesdeUF'] = 1000
            else: owner['projects'][0]['selected']['localPath'] = owner['projects'][1]['selected']['localPath']
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): release.owner_manifest_inventory(owner, manual)

    def test_owner_crop_must_be_integer_bounded_native_rectangle_with_matching_output(self):
        original, manual = self.owner_v2_fixture()
        project = original['projects'][0]; project['conversion']['crop'] = {'left': 10, 'top': 20, 'width': 1000, 'height': 700}
        project['selected'].update(width=1000, height=700)
        self.assertEqual(len(release.owner_manifest_inventory(original, manual)[1]), 5)
        for mutation in ['negative', 'fraction', 'boolean', 'bounds', 'zero', 'output', 'resize']:
            owner = copy.deepcopy(original); project = owner['projects'][0]
            if mutation == 'negative': project['conversion']['crop']['left'] = -1
            elif mutation == 'fraction': project['conversion']['crop']['top'] = 1.5
            elif mutation == 'boolean': project['conversion']['crop']['width'] = True
            elif mutation == 'bounds': project['conversion']['crop']['width'] = project['original']['width']
            elif mutation == 'zero': project['conversion']['crop']['height'] = 0
            elif mutation == 'output': project['selected']['height'] += 1
            else: project['conversion']['resize'] = True
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): release.owner_manifest_inventory(owner, manual)

    def test_five_owner_selection_retires_four_cover_only_sources_and_preserves_espacio_gallery(self):
        owner, manual = self.owner_v2_fixture()
        base = json.loads((MODULE.parents[1] / release.BASE_QUALITY_MANIFEST).read_text())
        official = json.loads((MODULE.parents[1] / release.OFFICIAL_MANIFEST).read_text())
        selection = release.manual_quality_selection(manual, base, official)
        docs = json.loads((MODULE.parents[1] / 'data/brochures-ecasa.json').read_text())
        originals = {asset['localPath'].lstrip('/'): asset['sha256'] for project in docs['projects']
                     for asset in [*project['images'], *(model['plan'] for model in project['models'])]}
        old = release.manual_published_media(originals, selection)
        new = release.manual_published_media(originals, selection, owner)
        self.assertEqual(len(new), 85)
        self.assertEqual(set(old)-set(new), {path.lstrip('/') for path in release.OWNER_SUPERSEDED.values()})
        self.assertIn('assets/propiedades/ecasa-preview/espacio-victoria/imagen-03-p01.webp', new)
        self.assertEqual(len(originals), 130)
        self.assertEqual(selection['summary']['coverOnlyImages'], 7)

    def test_five_owner_receipt_rejects_omitted_supersession_raw_publication_and_changed_counts(self):
        owner, manual = self.owner_v2_fixture()
        sources, published = release.owner_manifest_inventory(owner, manual)
        files = {name: {'sha256': item['sha256'], 'size': item['bytes']} for name, item in sources.items()}
        files.update({release.OWNER_MANIFEST: {'sha256': 'f' * 64}, release.OWNER_MODULE: {}})
        files.update({row['localPath'].lstrip('/'): {'sha256': row['sha256']} for row in release.owner_superseded_covers(owner)})
        policy = {'contentProfile': 'protected_ecasa_review', 'ownerSourceMedia': 10, 'ownerPublishedMedia': 5,
                  'ownerCover': {'manifestSha256': 'f' * 64, **release.owner_review_fields(owner),
                    'sourceAssets': [sources[name] for name in sorted(sources)], 'publishedAssets': [published[name] for name in sorted(published)]}}
        self.assertEqual(len(release.owner_policy_inventory(policy, files)), 10)
        for mutation in ['superseded', 'raw', 'count', 'identity']:
            changed = copy.deepcopy(policy)
            if mutation == 'superseded': changed['ownerCover']['supersededCovers'].pop()
            elif mutation == 'raw': changed['ownerCover']['publishedAssets'][0] = next(row for row in changed['ownerCover']['sourceAssets'] if row['kind'] == 'original')
            elif mutation == 'count': changed['ownerPublishedMedia'] = 4
            else: changed['ownerCover']['projectSlugs'][0] = 'lamara'
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): release.owner_policy_inventory(changed, files)


if __name__ == '__main__':
    unittest.main()
