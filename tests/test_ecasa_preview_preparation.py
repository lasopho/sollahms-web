"""Controls for the protected-only Ecasa transport reference; no platform calls."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1] / 'scripts/prepare-ecasa-preview.py'
spec = importlib.util.spec_from_file_location('ecasa_preview_preparation', MODULE)
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class EcasaPreviewPreparationTests(unittest.TestCase):
    def setUp(self):
        self.commit = '1' * 40
        self.metadata = {'target': 'preview', 'contentProfile': 'protected_ecasa_review',
            'reviewCommit': self.commit, 'catalogueProjects': 143, 'ecasaProjects': 22,
            'branch': 'codex/ecasa-cartera-definitiva', 'archive': {'sha256': 'a' * 64, 'size': 100},
            'sourceFileCount': 2, 'sourceBytes': 200, 'selectedBrochureMedia': [],
            'chunks': [{'file': '.vercel/source.tgz.part1', 'sha': 'b' * 40, 'size': 100}]}
        self.platform = {'projectId': 'prj_fixture', 'teamId': 'team_fixture', 'teamSlug': 'fixture',
                         'projectName': 'fixture-project', 'productionOrigin': 'https://sollahms.cl'}
        self.files = {'index.html': {}, 'assets/propiedades/ecasa-preview/ferroparque/cover.webp': {}}

    def reference(self, metadata=None):
        with patch.object(preview.release, 'git', return_value=b'index.html\0'):
            return preview.make_reference(metadata or self.metadata, self.platform, self.files, self.commit)

    def test_reference_pins_committed_source_without_granting_publication(self):
        reference = self.reference()
        self.assertEqual(reference['preparedCommitForReview'], self.commit)
        self.assertEqual(reference['trackedSourceFiles'], 1)
        self.assertEqual(reference['privateSourceFiles'], 1)
        self.assertEqual(reference['preservedBrochureMedia'], 269)
        self.assertFalse(reference['publicationAuthorized'])
        self.assertFalse(reference['integrationAuthorized'])
        self.assertEqual(reference['ecasaPublicWebRights'], 'pending_contract_scope_verification')

    def test_production_target_wrong_commit_and_wrong_identity_count_are_rejected(self):
        for key, value in [('target', 'production'), ('reviewCommit', '2' * 40),
                           ('catalogueProjects', 144), ('ecasaProjects', 23), ('contentProfile', 'public_web_parity')]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.reference(dict(self.metadata, **{key: value}))

    def test_request_template_is_explicit_preview_and_has_no_production_alias(self):
        reference = self.reference()
        request = preview.preview_request(reference, self.metadata)
        self.assertEqual(request['teamId'], self.platform['teamId'])
        self.assertEqual(request['requestBody']['target'], 'preview')
        self.assertEqual(request['requestBody']['project'], self.platform['projectId'])
        self.assertEqual(request['requestBody']['gitMetadata']['commitSha'], self.commit)
        self.assertFalse(request['requestBody']['gitMetadata']['dirty'])
        self.assertNotIn('alias', request['requestBody'])
        self.assertNotIn('productionOrigin', request['requestBody'])
        self.assertNotIn('env', request['requestBody'])

    def test_derivative_selection_cannot_cross_stage_directories_or_duplicate_paths(self):
        manifests = {name: {'projects': []} for name in preview.MANIFEST_FOLDERS}
        record = {'slug': 'ferroparque', 'images': [{'localPath': '/assets/propiedades/ecasa-preview/ferroparque/cover.webp', 'sha256': 'a' * 64}], 'models': []}
        manifests['brochures-ecasa.json']['projects'].append(record)
        self.assertEqual(len(preview.manifest_media(manifests)), 1)
        record['images'].append(dict(record['images'][0]))
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            preview.manifest_media(manifests)
        record['images'].pop()
        record['images'][0]['localPath'] = '/assets/propiedades/ecasa-preview/ferroparque-2/cover.webp'
        with self.assertRaisesRegex(ValueError, 'another project'):
            preview.manifest_media(manifests)


if __name__ == '__main__':
    unittest.main()
