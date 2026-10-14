"""Git-only negative fixtures for the offline independent Ecasa auditor.

The fixture uses the 92 versioned selected resources and the 62 previously
versioned official images. It never reads original PNG/PDFs or other private
brochure asset trees. Shared context hashes are replaced only inside the unit
fixture; the production auditor retains its literal reviewed pins.
"""
from contextlib import contextmanager
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    'ecasa_independent_audit_under_test', ROOT / 'tests/audit_ecasa_independent.py')
AUDITOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUDITOR)


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def put(root, name, value):
    path = root / name.lstrip('/')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(value)
    return path


def preview_html(text):
    return text.replace('</head>', AUDITOR.NOINDEX + '</head>').replace(
        '<body>', '<body>' + AUDITOR.NOTICE)


class EcasaIndependentAuditTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory(prefix='sollahms-ecasa-audit-fixture-')
        base = Path(cls.temporary.name)
        cls.roots = {name: base / name for name in (
            'source', 'public', 'preview', 'production-source',
            'production-public', 'approved-preview')}
        for root in cls.roots.values():
            root.mkdir()
        source = cls.roots['source']
        cls.manifest = json.loads((ROOT / 'data/ecasa-publication-candidate.json').read_text())
        cls.selected = cls.manifest['selectedResources']
        cls.catalogue = json.loads((ROOT / 'data/proyectos.json').read_text())
        cls.other_slug = next(row['slug'] for row in cls.catalogue if row['inmobiliaria'] != 'Ecasa')
        for name in AUDITOR.FROZEN_INPUTS:
            put(source, name, (ROOT / name).read_bytes())
        put(source, 'data/ecasa-publication-candidate.json', json_bytes(cls.manifest))
        for name in ['proyectos.json', 'fichas-proyectos.json', 'registro-fichas.json']:
            value = (ROOT / 'data' / name).read_bytes()
            put(source, 'data/' + name, value)
            put(cls.roots['production-source'], 'data/' + name, value)
        for name in AUDITOR.CORE:
            value = (ROOT / name).read_bytes()
            put(source, name, value)
            put(cls.roots['production-source'], name, value)
        cls.context_pins = {}
        for name, pin in AUDITOR.CONTEXT.items():
            after = ('Synthetic reviewed context after: ' + name + '\n').encode()
            before = None if pin['beforeSha256'] is None else (
                'Synthetic production context before: ' + name + '\n').encode()
            put(source, name, after)
            if before is not None:
                put(cls.roots['production-source'], name, before)
            cls.context_pins[name] = {
                'beforeSha256': sha256(before) if before is not None else None,
                'afterSha256': sha256(after)}
        manual = json.loads((ROOT / 'data/ecasa-manual-quality.json').read_text())
        official = json.loads((ROOT / 'data/ecasa-official-originals.json').read_text())
        galleries = {slug: [] for slug in AUDITOR.ECASA}
        image_paths = {row['localPath'] for row in cls.selected}
        for project in manual['projects']:
            for image in project['images']:
                if image['kind'] == 'official':
                    image_paths.add(image['localPath'])
                if image['decision'] == 'keep' and not image.get('coverOnly'):
                    galleries[project['slug']].append(image)
        for project in official['projects']:
            galleries[project['slug']].extend(project['images'])
        assert sum(map(len, galleries.values())) == 72
        assert len(cls.selected) == 92
        # Only selected/versioned inputs are read. Raw PNG/PDF originals are absent.
        for path in sorted(image_paths):
            value = (ROOT / path.lstrip('/')).read_bytes()
            for name in ['source', 'public', 'preview', 'approved-preview']:
                put(cls.roots[name], path, value)
        cls.plan = next(row for row in cls.selected if row['kind'] == 'plan')
        cls.gallery = next((slug, image) for slug in sorted(galleries)
                           for image in galleries[slug])
        for row in cls.catalogue:
            slug = row['slug']
            if slug not in AUDITOR.ECASA:
                text = '<html><head><title>' + slug + '</title></head><body><main>' + slug + '</main></body></html>'
                for name in ['source', 'production-source', 'production-public', 'public', 'approved-preview']:
                    put(cls.roots[name], slug + '.html', text.encode())
                put(cls.roots['preview'], slug + '.html', preview_html(text).encode())
                continue
            rows = [item for item in cls.selected if item['projectSlug'] == slug]
            hero = next((item for item in rows if item['kind'] == 'owner_cover'), None)
            if hero is None:
                hero = next((item for item in rows if item['kind'] in {
                    'documentary_photo', 'official_photo'}), galleries[slug][0])
            parts = ['<html><head><title>' + slug + '</title></head><body>',
                     '<header id="hero" data-commercial-stage="' + hero['originCommercialSlug'] + '">',
                     '<img class="hero-image" src="' + hero['localPath'] + '"></header>',
                     '<section id="galeria"><div class="gallery-grid">']
            for image in galleries[slug]:
                parts.append('<figure data-commercial-stage="' + image['originCommercialSlug'] + '">'
                             '<img src="' + image['localPath'] + '"></figure>')
            parts.append('</div></section><section id="modelos">')
            for index, item in enumerate(row for row in rows if row['kind'] == 'plan'):
                parts.append('<article id="plan-' + str(index) + '" data-commercial-stage="'
                             + item['originCommercialSlug'] + '"><a class="aj-plan-link" href="'
                             + item['localPath'] + '"><img src="' + item['localPath'] + '"></a></article>')
            parts.append('</section></body></html>')
            text = ''.join(parts)
            for name in ['source', 'public', 'approved-preview']:
                put(cls.roots[name], slug + '.html', text.encode())
            put(cls.roots['preview'], slug + '.html', preview_html(text).encode())
        for name in ['public', 'preview', 'approved-preview', 'production-public']:
            put(cls.roots[name], 'data/proyectos.json', json_bytes(cls.catalogue))
            put(cls.roots[name], 'data/hipotecario.json', (ROOT / 'data/hipotecario.json').read_bytes())
            put(cls.roots[name], 'robots.txt', b'User-agent: *\nAllow: /\n')
        put(cls.roots['preview'], 'robots.txt', b'User-agent: *\nDisallow: /\n')
        index = '<html><head><title>Fixture</title></head><body><main>Index</main></body></html>'
        for name in ['public', 'approved-preview']:
            put(cls.roots[name], 'index.html', index.encode())
            put(cls.roots[name], 'assets/runtime-stub.mjs', b'export const fixture = true;\n')
        put(cls.roots['preview'], 'index.html', preview_html(index).encode())
        put(cls.roots['preview'], 'assets/runtime-stub.mjs', b'export const fixture = true;\n')
        cls.private_path = sorted(AUDITOR.source_assets(source) - {
            row['localPath'] for row in cls.selected})[0]
        assert len(AUDITOR.source_assets(source) - {row['localPath'] for row in cls.selected}) == 52

    @classmethod
    def tearDownClass(cls):
        cls.temporary.cleanup()

    def setUp(self):
        self.context_patch = patch.object(AUDITOR, 'CONTEXT', self.context_pins)
        self.context_patch.start()
        self.addCleanup(self.context_patch.stop)

    def audit(self):
        return AUDITOR.audit(*(self.roots[name] for name in (
            'source', 'public', 'preview', 'production-source',
            'production-public', 'approved-preview')))

    @contextmanager
    def changes(self, replacements):
        previous = {path: path.read_bytes() if path.exists() else None for path in replacements}
        try:
            for path, value in replacements.items():
                path.parent.mkdir(parents=True, exist_ok=True)
                if value is None:
                    path.unlink()
                else:
                    path.write_bytes(value)
            yield
        finally:
            for path, value in previous.items():
                if path.is_symlink() or path.exists():
                    path.unlink()
                if value is not None:
                    path.write_bytes(value)

    def all_outputs(self, name, value):
        return {self.roots[root] / name.lstrip('/'): value for root in
                ['public', 'preview', 'approved-preview']}

    def changed_html(self, slug, transform):
        replacements = {}
        for name in ['public', 'preview', 'approved-preview']:
            path = self.roots[name] / (slug + '.html')
            replacements[path] = transform(path.read_text()).encode()
        return replacements

    def test_positive_git_fixture_preserves_121_projects_92_resources_and_22_origins(self):
        report = self.audit()
        self.assertTrue(report['passed'])
        self.assertEqual((report['sourceOtherProjects'], report['outputOtherProjects']), (121, 121))
        self.assertEqual((report['selectedResources'], report['galleryImages'], report['plans']), (92, 72, 74))
        self.assertEqual(report['privateResourcesExcluded'], 52)
        self.assertEqual(len({row['slug'] for row in self.catalogue if row['inmobiliaria'] == 'Ecasa'}), 15)
        stages = [stage for row in self.catalogue if row['inmobiliaria'] == 'Ecasa'
                  for stage in row.get('etapasComerciales', [])]
        self.assertEqual(len(stages), 22)
        self.assertFalse(report['productionActionAuthorized'])
        self.assertFalse(report['mergeActionAuthorized'])

    def test_non_ecasa_source_records_cannot_change(self):
        for name in ['proyectos.json', 'fichas-proyectos.json', 'registro-fichas.json']:
            with self.subTest(dataset=name):
                path = self.roots['source'] / 'data' / name
                rows = json.loads(path.read_text())
                row = next(row for row in rows if row['slug'] == self.other_slug)
                row['unreviewedMutation'] = True
                with self.changes({path: json_bytes(rows)}):
                    with self.assertRaisesRegex(AssertionError, 'Other SOURCE records changed'):
                        self.audit()

    def test_non_ecasa_output_records_and_image_alt_cannot_change(self):
        for field, value in [('imagenAlt', 'Unapproved alternate description'), ('precioDesdeUF', 1)]:
            with self.subTest(field=field):
                path = self.roots['public'] / 'data/proyectos.json'
                rows = json.loads(path.read_text())
                next(row for row in rows if row['slug'] == self.other_slug)[field] = value
                with self.changes({path: json_bytes(rows)}):
                    with self.assertRaisesRegex(AssertionError, 'Other OUTPUT catalogue records changed'):
                        self.audit()

    def test_non_ecasa_output_html_must_remain_exact(self):
        path = self.roots['public'] / (self.other_slug + '.html')
        with self.changes({path: path.read_bytes().replace(b'</main>', b'Unapproved body</main>')}):
            with self.assertRaisesRegex(AssertionError, 'Other public OUTPUT fiche changed'):
                self.audit()

    def test_selected_hashes_are_checked_against_source_and_approved_bytes(self):
        row = self.plan
        for name in ['source', 'approved-preview', 'public', 'preview']:
            with self.subTest(tree=name):
                path = self.roots[name] / row['localPath'].lstrip('/')
                with self.changes({path: path.read_bytes() + b'not-reviewed'}):
                    with self.assertRaisesRegex(AssertionError, 'Selected resource bytes changed|Approved local image bytes changed'):
                        self.audit()
        manifest_path = self.roots['source'] / 'data/ecasa-publication-candidate.json'
        manifest = json.loads(manifest_path.read_text())
        changed = next(item for item in manifest['selectedResources'] if item['localPath'] == row['localPath'])
        value = (self.roots['public'] / row['localPath'].lstrip('/')).read_bytes() + b'coordinated-unreviewed'
        changed['sha256'], changed['bytes'] = sha256(value), len(value)
        replacements = {manifest_path: json_bytes(manifest)}
        replacements.update({self.roots[name] / row['localPath'].lstrip('/'): value
                             for name in ['public', 'preview', 'approved-preview']})
        with self.changes(replacements):
            with self.assertRaisesRegex(AssertionError, 'Selected resource bytes changed'):
                self.audit()

    def test_selected_assets_cannot_borrow_another_stage_even_if_layouts_match(self):
        row = self.plan
        wrong = next(slug for slug in AUDITOR.ECASA if slug != row['originCommercialSlug'])
        fragment = 'data-commercial-stage="' + row['originCommercialSlug'] + '"><a class="aj-plan-link" href="' + row['localPath']
        changed = fragment.replace(row['originCommercialSlug'], wrong, 1)
        def transform(text):
            self.assertIn(fragment, text)
            return text.replace(fragment, changed)
        with self.changes(self.changed_html(row['projectSlug'], transform)):
            with self.assertRaisesRegex(AssertionError, 'Selected resource attributed to another stage/project'):
                self.audit()

    def test_gallery_and_plan_counts_cannot_change_in_coordinated_output(self):
        slug, image = self.gallery
        fragments = [(slug, '<img src="' + image['localPath'] + '">'),
                     (self.plan['projectSlug'], '<img src="' + self.plan['localPath'] + '">')]
        for slug, fragment in fragments:
            with self.subTest(removed=fragment):
                def transform(text):
                    self.assertIn(fragment, text)
                    return text.replace(fragment, '', 1)
                with self.changes(self.changed_html(slug, transform)):
                    with self.assertRaisesRegex(AssertionError, 'Approved72 photographs/74 plans changed'):
                        self.audit()

    def test_private_raw_documents_data_and_symlinks_are_rejected(self):
        cases = [(self.private_path, 'Private original/unselected resource exposed'),
                 ('private/brochure.pdf', 'Private document/raw original exposed'),
                 ('data/fichas-proyectos.json', 'Private data exposed')]
        for path, message in cases:
            with self.subTest(exposure=path):
                with self.changes(self.all_outputs(path, b'private fixture, never public')):
                    with self.assertRaisesRegex(AssertionError, message):
                        self.audit()
        symlink = self.roots['public'] / 'assets/link.webp'
        try:
            symlink.symlink_to(self.roots['public'] / self.plan['localPath'].lstrip('/'))
            with self.assertRaisesRegex(AssertionError, 'Symlink in audited tree'):
                self.audit()
        finally:
            symlink.unlink(missing_ok=True)

    def test_release_authorization_and_profile_differences_are_restricted(self):
        manifest_path = self.roots['source'] / 'data/ecasa-publication-candidate.json'
        manifest = json.loads(manifest_path.read_text())
        manifest['actionAuthorization']['production'] = True
        with self.changes({manifest_path: json_bytes(manifest)}):
            with self.assertRaisesRegex(AssertionError, 'Content cannot authorize release actions'):
                self.audit()
        public_index = self.roots['public'] / 'index.html'
        preview_index = self.roots['preview'] / 'index.html'
        preview_robots = self.roots['preview'] / 'robots.txt'
        preview_runtime = self.roots['preview'] / 'assets/runtime-stub.mjs'
        cases = [
            ({public_index: public_index.read_text().replace('</head>', AUDITOR.NOINDEX + '</head>').encode()},
             'Public unexpectedly noindex'),
            ({preview_index: preview_index.read_text().replace(AUDITOR.NOINDEX, '').encode()},
             'Preview noindex missing'),
            ({preview_robots: b'User-agent: *\nAllow: /\n'}, 'Preview robots must block indexing'),
            ({preview_runtime: b'export const fixture = false;\n'}, 'Unexpected profile asset/data difference')]
        for replacements, message in cases:
            with self.subTest(rejected=message):
                with self.changes(replacements):
                    with self.assertRaisesRegex(AssertionError, message):
                        self.audit()


if __name__ == '__main__':
    unittest.main()
