import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('leben_release', ROOT / 'scripts/prepare-release.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


def fixture():
    projects = []
    for index, slug in enumerate(sorted(release.LEBEN_SLUGS)):
        document = {'fileName': slug + '.pdf', 'sha256': format(index, '064x'), 'pageCount': 4, 'sourceChannel': 'Leben/user_supplied'}
        image = {'localPath': '/assets/propiedades/leben-preview/' + slug + '/photo.webp', 'sha256': hashlib.sha256(b'photo').hexdigest(),
                 'sourceSha256': document['sha256'], 'sourcePage': 1, 'width': 900, 'height': 600, 'nativeWidth': 900, 'nativeHeight': 600,
                 'visuallyVerified': True, 'privacySafe': True, 'qualityDecision': 'keep'}
        projects.append({'slug': slug, 'document': document, 'images': [image], 'models': []})
    return {'schemaVersion': 1, 'inmobiliaria': 'Leben', 'protectedPreviewOnly': True,
            'sourcePackage': {'sourceMode': 'regenerated_from_local_originals', 'status': 'reviewed',
                              'originalPdfCount': 12, 'originalsValidatedBySha256': 12, 'inventorySha256': 'a' * 64,
                              'instructions': {'fileName': 'INSTRUCCIONES_CODEX.md', 'sha256': 'b' * 64}},
            'publicationRights': {'sourceChannel': 'Leben/user_supplied', 'protectedPreview': 'authorized_by_user',
                                  'productionPolicy': 'requires_verified_contract_scope',
                                  'contractScope': {'status': 'pending_contract_scope_verification'}},
            'projects': projects, 'sourceDocuments': [project['document'] for project in projects]}


class LebenReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)

    def tearDown(self):
        self.temporary.cleanup()

    def archive(self, manifest=None):
        manifest = manifest or fixture()
        records = {release.LEBEN_MANIFEST: json.dumps(manifest).encode(), release.LEBEN_MODULE: b'// synthetic consumer'}
        selected = release.leben_manifest_inventory(manifest)
        records.update({name: b'photo' for name in selected})
        archive = self.root / 'source.tgz'
        with tarfile.open(archive, 'w:gz') as output:
            for name, data in records.items():
                item = tarfile.TarInfo(name); item.size = len(data)
                output.addfile(item, io.BytesIO(data))
        policy = {'contentProfile': 'protected_leben_review', 'archiveBytes': archive.stat().st_size,
                  'archiveSha256': release.digest(archive.read_bytes()), 'sourceFiles': len(records),
                  'sourceBytes': sum(len(data) for data in records.values()), 'lebenReviewMedia': len(selected),
                  'lebenReview': {'manifestSha256': release.digest(records[release.LEBEN_MANIFEST]),
                                 'assets': [{**selected[name], 'bytes': len(records[name])} for name in sorted(selected)]}}
        return archive, policy

    def test_exact_private_selection_without_original_pdf_or_zip(self):
        archive, policy = self.archive()
        files = release.verify_archive(archive, policy)
        self.assertEqual(len(release.leben_policy_inventory(policy, files)), 12)
        self.assertFalse(any(name.endswith(('.pdf', '.zip')) for name in files))

    def test_private_folder_permission_does_not_grant_extra_media_or_production(self):
        archive, original = self.archive()
        for mutation in ['production', 'omitted', 'hash', 'unreviewed']:
            policy = copy.deepcopy(original)
            if mutation == 'production': policy['contentProfile'] = 'public_web_parity'
            elif mutation == 'omitted': policy['lebenReview']['assets'].pop()
            elif mutation == 'hash': policy['lebenReview']['assets'][0]['sha256'] = '0' * 64
            else: policy.pop('lebenReview')
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                release.verify_archive(archive, policy)
        with self.assertRaisesRegex(ValueError, 'protected Leben review'):
            release.verify_staged_deployment({}, original)

    def test_project_pdf_binding_and_native_quality_cannot_be_changed(self):
        for mutation in ['foreign_source', 'upscale', 'duplicate', 'missing_originals']:
            manifest = fixture()
            if mutation == 'foreign_source': manifest['projects'][0]['images'][0]['sourceSha256'] = 'f' * 64
            elif mutation == 'upscale': manifest['projects'][0]['images'][0]['width'] = 1500
            elif mutation == 'duplicate': manifest['projects'][1]['slug'] = manifest['projects'][0]['slug']
            else: manifest['sourcePackage']['originalsValidatedBySha256'] = 11
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                release.leben_manifest_inventory(manifest)

    def test_selected_private_derivatives_cannot_be_tracked_in_public_git(self):
        archive, policy = self.archive()
        files = release.verify_archive(archive, policy)
        policy.update(approvedAppCommit='a' * 40, trackedSourceFiles=2, privateSourceFiles=12,
                      privateMediaFolders=[release.LEBEN_FOLDER])
        names = [release.LEBEN_MANIFEST, release.LEBEN_MODULE]
        tree = b''.join(b'100644 blob ' + files[name]['gitBlob'].encode() + b'\t' + name.encode() + b'\0' for name in names)
        replies = [policy['approvedAppCommit'].encode() + b'\n', b'sha1\n', tree]
        with patch.object(release, 'git', side_effect=replies):
            self.assertEqual(release.verify_git_reference(self.root, files, policy), 2)
        private_name = policy['lebenReview']['assets'][0]['path'].lstrip('/')
        tree += b'100644 blob ' + files[private_name]['gitBlob'].encode() + b'\t' + private_name.encode() + b'\0'
        replies = [policy['approvedAppCommit'].encode() + b'\n', b'sha1\n', tree]
        with patch.object(release, 'git', side_effect=replies), self.assertRaisesRegex(ValueError, 'outside public Git'):
            release.verify_git_reference(self.root, files, policy)


if __name__ == '__main__':
    unittest.main()
