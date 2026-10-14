"""Controls for the protected-only Ecasa transport reference; no platform calls."""
import importlib.util
import copy
import json
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
            'reviewCommit': self.commit, 'catalogueProjects': 136, 'ecasaProjects': 15,
            'ecasaCommercialEntries': 22, 'ecasaLegacyRoutes': 8,
            'branch': 'codex/ecasa-cartera-definitiva', 'archive': {'sha256': 'a' * 64, 'size': 100},
            'sourceFileCount': 2, 'sourceBytes': 200,
            'selectedBrochureMedia': [{'path': '/assets/fixture-' + str(index), 'sha256': 'd' * 64} for index in range(395)],
            'sourceBrochureMedia': 399, 'ecasaSourceMedia': 130, 'ecasaPublishedMedia': 126,
            'imageQuality': {'reviewedImages': 118, 'keptImages': 114, 'excludedImages': 4, 'plansPreserved': 74},
            'verificationTools': [{'file': name, 'sha256': 'c' * 64, 'size': 12} for name in sorted(preview.release.VERIFICATION_TOOLS)],
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
        self.assertEqual(reference['verificationTools'], self.metadata['verificationTools'])
        self.assertEqual(reference['sourceBrochureMedia'], 399)
        self.assertEqual(reference['ecasaPublishedMedia'], 126)

    def test_missing_or_unrelated_private_qa_selection_is_rejected(self):
        for tools in [[], self.metadata['verificationTools'][:-1],
                      [*self.metadata['verificationTools'][:-1], {'file': 'tests/unrelated.mjs', 'sha256': 'c' * 64, 'size': 12}]]:
            with self.subTest(tools=tools), self.assertRaisesRegex(ValueError, 'three private QA'):
                self.reference(dict(self.metadata, verificationTools=tools))

    def test_publication_selection_does_not_remove_original_archive_evidence(self):
        originals = {path.lstrip('/'): 'a' * 64 for path in preview.VISUAL_EXCLUDED}
        originals['assets/propiedades/ecasa-preview/terratolten-1/plano.webp'] = 'b' * 64
        quality = {'projects': [{'images': [{'localPath': path, 'decision': 'exclude', 'coverOnly': False}
                                           for path in preview.VISUAL_EXCLUDED]}]}
        selected = preview.published_media(originals, quality)
        self.assertEqual(len(originals), 5)
        self.assertEqual(selected, {'assets/propiedades/ecasa-preview/terratolten-1/plano.webp': 'b' * 64})
        quality['projects'][0]['images'][0]['localPath'] = '/assets/propiedades/ecasa-preview/terratolten-1/plano.webp'
        with self.assertRaisesRegex(ValueError, 'unreviewed image exclusion'):
            preview.published_media(originals, quality)

    def test_production_target_wrong_commit_and_wrong_identity_count_are_rejected(self):
        for key, value in [('target', 'production'), ('reviewCommit', '2' * 40),
                           ('catalogueProjects', 143), ('ecasaProjects', 22), ('ecasaCommercialEntries', 21),
                           ('ecasaLegacyRoutes', 7), ('contentProfile', 'public_web_parity')]:
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
        record = {'slug': 'ferroparque', 'commercialSourceSlugs': ['ferroparque'], 'images': [{'localPath': '/assets/propiedades/ecasa-preview/ferroparque/cover.webp', 'sha256': 'a' * 64, 'originCommercialSlug': 'ferroparque'}], 'models': []}
        manifests['brochures-ecasa.json']['projects'].append(record)
        self.assertEqual(len(preview.manifest_media(manifests)), 1)
        record['images'].append(dict(record['images'][0]))
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            preview.manifest_media(manifests)
        record['images'].pop()
        record['images'][0]['localPath'] = '/assets/propiedades/ecasa-preview/ferroparque-2/cover.webp'
        with self.assertRaisesRegex(ValueError, 'another project'):
            preview.manifest_media(manifests)

    def test_terratolten_keeps_the_reviewed_stage_one_asset_namespace(self):
        manifests = {name: {'projects': []} for name in preview.MANIFEST_FOLDERS}
        path = '/assets/propiedades/ecasa-preview/terratolten-1/cover.webp'
        record = {'slug': 'terratolten', 'commercialSourceSlugs': ['terratolten-1', 'terratolten-2', 'terratolten-3'],
                  'images': [{'localPath': path, 'sha256': 'a' * 64, 'originCommercialSlug': 'terratolten-1'}], 'models': []}
        manifests['brochures-ecasa.json']['projects'].append(record)
        self.assertEqual(preview.manifest_media(manifests), {path.lstrip('/'): 'a' * 64})
        record['images'][0]['originCommercialSlug'] = 'ferroparque'
        with self.assertRaisesRegex(ValueError, 'another project'):
            preview.manifest_media(manifests)

    def official_metadata(self):
        manifest = json.loads((MODULE.parents[1] / 'data/ecasa-official-originals.json').read_text())
        sources, published = preview.release.official_manifest_inventory(manifest)
        metadata = copy.deepcopy(self.metadata)
        metadata.update(officialSourceMedia=4, officialPublishedMedia=2, ecasaGalleryImages=116,
            officialOriginals={'manifestSha256': 'e' * 64,
                'sourceAssets': [sources[name] for name in sorted(sources)],
                'publishedAssets': [published[name] for name in sorted(published)], 'summary': {'publicWeb': False}})
        self.files.update({name: {'sha256': item['sha256'], 'size': item['bytes']} for name, item in sources.items()})
        self.files[preview.release.OFFICIAL_MANIFEST] = {'sha256': 'e' * 64}
        return metadata

    def test_official_reference_transports_originals_without_publishing_them(self):
        reference = self.reference(self.official_metadata())
        self.assertIn('ecasa-official-review', reference['privateMediaFolders'])
        self.assertEqual(reference['officialSourceMedia'], 4)
        self.assertEqual(reference['officialPublishedMedia'], 2)
        self.assertEqual(reference['ecasaGalleryImages'], 116)
        self.assertEqual(reference['selectedBrochureMedia'], 395)
        self.assertEqual(reference['imageQuality']['keptImages'], 114)
        self.assertFalse(reference['publicationAuthorized'])

    def test_official_reference_rejects_omitted_sources_changed_bytes_and_original_publication(self):
        original = self.official_metadata()
        for mutation in ['missing', 'changed', 'published_original', 'changed_gallery_count']:
            metadata = copy.deepcopy(original)
            if mutation == 'missing':
                metadata['officialOriginals']['sourceAssets'].pop()
            elif mutation == 'changed':
                metadata['officialOriginals']['sourceAssets'][0]['sha256'] = '0' * 64
            elif mutation == 'published_original':
                original_asset = next(item for item in metadata['officialOriginals']['sourceAssets'] if item['kind'] == 'original')
                metadata['officialOriginals']['publishedAssets'][0] = original_asset
            else:
                metadata['ecasaGalleryImages'] = 117
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                self.reference(metadata)

    def manual_metadata(self):
        metadata = self.official_metadata()
        root = MODULE.parents[1]
        base = json.loads((root / preview.release.BASE_QUALITY_MANIFEST).read_text())
        policy = json.loads((root / preview.release.MANUAL_MANIFEST).read_text())
        official = json.loads((root / preview.release.OFFICIAL_MANIFEST).read_text())
        selection = preview.release.manual_quality_selection(policy, base, official)
        metadata.update(ecasaPublishedMedia=89, ecasaGalleryImages=72,
            selectedBrochureMedia=metadata['selectedBrochureMedia'][:358],
            manualQuality={'manifestSha256': 'f' * 64, 'summary': selection['summary'],
                           'effectiveImages': selection['effectiveImages'], 'projects': selection['projects']})
        self.files[preview.release.MANUAL_MANIFEST] = {'sha256': 'f' * 64}
        self.files[preview.release.MANUAL_MODULE] = {'sha256': '0' * 64}
        return metadata

    def test_manual_reference_separates_base_review_from_effective_publication(self):
        reference = self.reference(self.manual_metadata())
        self.assertEqual(reference['selectedBrochureMedia'], 358)
        self.assertEqual(reference['ecasaPublishedMedia'], 89)
        self.assertEqual(reference['ecasaGalleryImages'], 72)
        self.assertEqual(reference['sourceBrochureMedia'], 399)
        self.assertEqual(reference['ecasaSourceMedia'], 130)
        self.assertEqual(reference['imageQuality']['keptImages'], 114)
        self.assertEqual(reference['manualQuality']['summary']['keptImages'], 70)
        self.assertFalse(reference['publicationAuthorized'])

    def test_manual_reference_cannot_reuse_historical_publication_counts(self):
        original = self.manual_metadata()
        for key, value in [('ecasaPublishedMedia', 126), ('ecasaGalleryImages', 116),
                           ('selectedBrochureMedia', self.metadata['selectedBrochureMedia'])]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                self.reference(dict(original, **{key: value}))

    def owner_metadata(self):
        metadata = self.manual_metadata()
        owner = json.loads((MODULE.parents[1] / preview.release.OWNER_MANIFEST).read_text())
        if owner['schemaVersion'] == 2:
            project = copy.deepcopy(next(project for project in owner['projects'] if project['projectSlug'] == preview.release.OWNER_PROJECT))
            project['conversion']['crop'] = False
            owner = {**{key: owner[key] for key in ['protectedPreviewOnly', 'baselineCommit', 'provenance']},
                     'schemaVersion': 1, 'scope': 'ecasa_owner_cover_only', **project}
        manual = json.loads((MODULE.parents[1] / preview.release.MANUAL_MANIFEST).read_text())
        sources, published = preview.release.owner_manifest_inventory(owner, manual)
        self.files.update({name: {'sha256': item['sha256'], 'size': item['bytes']} for name, item in sources.items()})
        self.files.update({preview.release.OWNER_MANIFEST: {'sha256': '9' * 64}, preview.release.OWNER_MODULE: {},
            owner['supersededCoverOnly']['localPath'].lstrip('/'): {'sha256': owner['supersededCoverOnly']['sha256']}})
        metadata.update(ecasaPublishedMedia=88, selectedBrochureMedia=metadata['selectedBrochureMedia'][:-1],
            ownerSourceMedia=2, ownerPublishedMedia=1,
            ownerCover={'manifestSha256': '9' * 64, 'projectSlug': preview.release.OWNER_PROJECT, 'provenance': 'user_provided',
                'sourceAssets': [sources[name] for name in sorted(sources)],
                'publishedAssets': [published[name] for name in sorted(published)],
                'supersededCoverOnly': owner['supersededCoverOnly']})
        return metadata

    def test_owner_reference_transports_raw_and_superseded_source_without_counting_them_as_publication(self):
        reference = self.reference(self.owner_metadata())
        self.assertEqual(reference['selectedBrochureMedia'], 357)
        self.assertEqual(reference['ecasaPublishedMedia'], 88)
        self.assertEqual(reference['ecasaGalleryImages'], 72)
        self.assertEqual(reference['manualQuality']['summary']['coverOnlyImages'], 7)
        self.assertEqual(reference['ownerPublishedMedia'], 1)
        self.assertIn(preview.release.OWNER_FOLDER, reference['privateMediaFolders'])
        self.assertEqual(reference['sourceBrochureMedia'], 399)
        self.assertFalse(reference['publicationAuthorized'])

    def test_owner_reference_rejects_stale_publication_count_and_raw_selected_asset(self):
        original = self.owner_metadata()
        for mutation in ['count', 'raw']:
            metadata = copy.deepcopy(original)
            if mutation == 'count': metadata['ecasaPublishedMedia'] = 89
            else: metadata['ownerCover']['publishedAssets'] = [row for row in metadata['ownerCover']['sourceAssets'] if row['kind'] == 'original']
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): self.reference(metadata)

    def test_five_owner_reference_keeps_frozen_summary_and_separates_four_superseded_covers(self):
        metadata = self.manual_metadata()
        owner = json.loads((MODULE.parents[1] / preview.release.OWNER_MANIFEST).read_text())
        manual = json.loads((MODULE.parents[1] / preview.release.MANUAL_MANIFEST).read_text())
        if owner['schemaVersion'] == 1:
            projects = []
            for slug in sorted(preview.release.OWNER_PROJECTS):
                project = {key: copy.deepcopy(owner[key]) for key in ['original', 'selected', 'conversion']}
                project['projectSlug'] = slug;project['conversion']['crop'] = None
                for kind in ['original', 'selected']:
                    project[kind]['localPath'] = project[kind]['localPath'].replace('/edificio-bezanilla/', '/' + slug + '/')
                previous = next(row for row in manual['projects'] if row['slug'] == slug)
                choice = next(row for row in previous['images'] if row['localPath'] == previous['previewCover'])
                project['supersededCoverOnly'] = None if slug == 'espacio-victoria' else {'localPath': choice['localPath'], 'sha256': choice['sha256']}
                projects.append(project)
            owner = {'schemaVersion': 2, 'scope': 'ecasa_owner_covers_only', 'protectedPreviewOnly': True,
                     'baselineCommit': owner['baselineCommit'], 'provenance': 'user_provided', 'projects': projects}
        sources, published = preview.release.owner_manifest_inventory(owner, manual)
        self.files.update({name: {'sha256': item['sha256'], 'size': item['bytes']} for name, item in sources.items()})
        self.files.update({preview.release.OWNER_MANIFEST: {'sha256': '9' * 64}, preview.release.OWNER_MODULE: {}})
        self.files.update({row['localPath'].lstrip('/'): {'sha256': row['sha256']} for row in preview.release.owner_superseded_covers(owner)})
        metadata.update(ecasaPublishedMedia=85, selectedBrochureMedia=metadata['selectedBrochureMedia'][:354],
            ownerSourceMedia=10, ownerPublishedMedia=5,
            ownerCover={'manifestSha256': '9' * 64, **preview.release.owner_review_fields(owner),
                'sourceAssets': [sources[name] for name in sorted(sources)], 'publishedAssets': [published[name] for name in sorted(published)]})
        reference = self.reference(metadata)
        self.assertEqual(reference['selectedBrochureMedia'], 354)
        self.assertEqual(reference['ownerPublishedMedia'], 5)
        self.assertEqual(reference['ecasaPublishedMedia'], 85)
        self.assertEqual(reference['ecasaGalleryImages'], 72)
        self.assertEqual(reference['manualQuality']['summary']['documentaryPublishedImages'], 15)
        self.assertEqual(len(reference['ownerCover']['supersededCovers']), 4)
        metadata['ecasaPublishedMedia'] = 88
        with self.assertRaises(ValueError): self.reference(metadata)


if __name__ == '__main__':
    unittest.main()
