"""Negative controls for the independent, offline launch audit."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest


MODULE = Path(__file__).with_name('audit_public_build.py')
spec = importlib.util.spec_from_file_location('public_build_audit', MODULE)
audit_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit_module)


class PublicBuildAuditTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='sollahms-public-audit-negative-')
        self.base = Path(self.temporary.name)
        self.source, self.public, self.preview = [self.base / p for p in ['source', 'public', 'preview']]
        (self.source / 'data').mkdir(parents=True)
        redirects = [{'source': '/' + slug + suffix, 'destination': '/' + target + '.html#etapa-' + str(stage), 'permanent': True}
                     for slug, (target, stage) in audit_module.LEGACY_TARGETS.items() for suffix in ['', '.html']]
        (self.source / 'vercel.json').write_text(json.dumps({'redirects': redirects}))
        (self.public / 'data').mkdir(parents=True)
        aj = ['downtown-san-martin', 'edificio-teatinos-750', 'edificio-vista-amunategui', 'monjitas-690', 'vista-morande']
        slugs = sorted(audit_module.INGEVEC) + aj + sorted(audit_module.ECASA) + ['other-' + str(n) for n in range(100)]
        catalogue = [{'slug': slug, 'inmobiliaria': 'Ingevec' if slug in audit_module.INGEVEC else 'Ecasa' if slug in audit_module.ECASA else 'Other',
                      'detalleUrl': '/' + slug + '.html', 'imagenPrincipal': '/assets/generic.webp'} for slug in slugs]
        by_slug = {p['slug']: p for p in catalogue}
        references = {slug: [] for slug in slugs}
        for name, batch, folder in [('brochures-aj-urbana.json', aj, 'aj-urbana-preview'),
                                     ('brochures-ingevec.json', sorted(audit_module.INGEVEC), 'ingevec-preview')]:
            records = []
            for index, slug in enumerate(batch):
                prefix = '/assets/propiedades/' + folder + '/' + slug + '/'
                image_count = 107 if folder == 'aj-urbana-preview' and index == 0 else 1
                plan_count = 122 if folder == 'aj-urbana-preview' and index == 0 else 1
                images, models = [], []
                for kind, count in [('image', image_count), ('plan', plan_count)]:
                    for n in range(count):
                        path = prefix + kind + '-' + str(n) + '.webp'
                        payload = ('fixture-' + path).encode()
                        file = self.public / path.lstrip('/')
                        file.parent.mkdir(parents=True, exist_ok=True)
                        file.write_bytes(payload)
                        asset = {'localPath': path, 'sha256': hashlib.sha256(payload).hexdigest()}
                        if kind == 'image': images.append(asset)
                        else: models.append({'plan': asset})
                        references[slug].append(path)
                cover = {'localPath': images[0]['localPath']}
                by_slug[slug]['imagenPrincipal'] = cover['localPath']
                records.append({'slug': slug, 'catalogueCover': cover, 'images': images, 'models': models})
            (self.source / 'data' / name).write_text(json.dumps({'projects': records}))
        (self.public / 'assets/generic.webp').write_bytes(b'generic-fixture-image')
        (self.public / 'data/proyectos.json').write_text(json.dumps(catalogue))
        (self.public / 'data/hipotecario.json').write_text('{}')
        for slug in slugs:
            page = slug + '.html'
            html = '<html><head><link rel="canonical" href="https://sollahms.cl/' + page + '"><meta name="description" content="Fixture"></head><body><h1>' + slug + '</h1>'
            html += '<a href="/proyectos.html">Asset Portafolio</a>'
            html += ''.join('<a href="/' + route + '?proyecto=' + slug + '">Contextual action</a>' for route in ['contacto.html', 'agenda-asesoria.html', 'comparador-hipotecario.html'])
            html += ''.join('<img src="' + path + '">' for path in references[slug]) + '</body></html>'
            stages = {stage for target, stage in audit_module.LEGACY_TARGETS.values() if target == slug}
            html = html.replace('</body>', ''.join('<span id="etapa-' + str(stage) + '"></span>' for stage in sorted(stages)) + '</body>')
            (self.public / page).write_text(html)
        for page in audit_module.PAGES:
            (self.public / page).write_text('<html><head>' + ('<meta name="robots" content="noindex,follow">' if page == '404.html' else '') + '</head><body></body></html>')
        pages = audit_module.PAGES | {s + '.html' for s in slugs}
        urls = ['https://sollahms.cl/' + page for page in pages - {'index.html', '404.html'}] + ['https://sollahms.cl/']
        (self.public / 'sitemap.xml').write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>' + url + '</loc></url>' for url in urls) + '</urlset>')
        (self.public / 'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://sollahms.cl/sitemap.xml\n')
        shutil.copytree(self.public, self.preview)
        for page in pages:
            path = self.preview / page
            text = path.read_text().replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>')
            if page in {'contacto.html', 'agenda-asesoria.html', 'comparador-hipotecario.html'}:
                text = text.replace('<body>', '<body>' + audit_module.NOTICE)
            path.write_text(text)
        (self.preview / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')
        ecasa_records = []
        preview_catalogue = json.loads(json.dumps(catalogue))
        preview_by_slug = {p['slug']: p for p in preview_catalogue}
        for index, slug in enumerate(sorted(audit_module.ECASA)):
            images, models = [], []
            if index == 0:
                for kind in ['image', 'plan']:
                    path = '/assets/propiedades/ecasa-preview/' + slug + '/' + kind + '.webp'
                    payload = ('ecasa-fixture-' + path).encode()
                    file = self.preview / path.lstrip('/')
                    file.parent.mkdir(parents=True, exist_ok=True)
                    file.write_bytes(payload)
                    asset = {'localPath': path, 'sha256': hashlib.sha256(payload).hexdigest(), 'originCommercialSlug': slug}
                    if kind == 'image': images.append(asset)
                    else: models.append({'plan': asset})
            cover = {'localPath': images[0]['localPath'], 'alt': 'Render ilustrativo'} if images else None
            if cover:
                preview_by_slug[slug]['imagenPrincipal'] = cover['localPath']
                preview_by_slug[slug]['imagenAlt'] = cover['alt']
            record = {'slug': slug, 'images': images, 'models': models, 'catalogueCover': cover,
                      'commercialSourceSlugs': [commercial for commercial, target in audit_module.COMMERCIAL_PROJECTS.items() if target == slug]}
            ecasa_records.append(record)
            original = (self.public / (slug + '.html')).read_text()
            refs = ''.join('<img src="' + asset['localPath'] + '">' for asset in images + [model['plan'] for model in models])
            original = original.replace('</body>', '<!--ECASA_PUBLIC_START--><p>Ficha comercial vigente</p><!--ECASA_PUBLIC_END--><!--ECASA_PREVIEW_START-->' + refs + '<!--ECASA_PREVIEW_END--></body>')
            (self.source / (slug + '.html')).write_text(original)
            (self.public / (slug + '.html')).write_text(audit_module.selected_ecasa_html(original, False))
            (self.preview / (slug + '.html')).write_text(audit_module.selected_ecasa_html(original, True).replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>'))
        commercial_sources = []
        for slug, target in audit_module.COMMERCIAL_PROJECTS.items():
            record = next(record for record in ecasa_records if record['slug'] == target)
            commercial_sources.append({'slug': slug, 'projectSlug': target,
                'selectedImagePaths': [asset['localPath'] for asset in record['images'] if asset['originCommercialSlug'] == slug],
                'selectedPlanPaths': [model['plan']['localPath'] for model in record['models'] if model['plan']['originCommercialSlug'] == slug]})
        (self.source / 'data/brochures-ecasa.json').write_text(json.dumps({'schemaVersion': 2, 'projects': ecasa_records,
            'commercialSources': commercial_sources,
            'publicationRights': {'sourceChannel': 'Ecasa/user_supplied', 'protectedPreview': 'authorized_by_user',
                'productionPolicy': 'requires_verified_contract_scope',
                'contractScope': {'status': 'pending_contract_scope_verification'}}}))
        (self.preview / 'data/proyectos.json').write_text(json.dumps(preview_catalogue))

    def tearDown(self):
        self.temporary.cleanup()

    def result(self):
        return audit_module.audit(self.source, self.public, self.preview, protected_review=True)

    def test_complete_protected_review_and_preserved_public_batches_pass(self):
        result = self.result()
        self.assertTrue(result['ok'], result['errors'])
        self.assertEqual(result['counts']['brochureMedia'], 269)
        self.assertEqual(result['counts']['brochurePlans'], 142)
        self.assertEqual(result['counts']['canonicalFiches'], 136)
        self.assertEqual(result['counts']['ecasa'], 15)
        self.assertEqual(result['counts']['ecasaCommercialSources'], 22)
        self.assertEqual(result['counts']['permanentRouteRules'], 16)
        self.assertEqual(result['counts']['ecasaMedia'], 2)
        self.assertFalse(result['ecasaPublicWebParityVerified'])
        self.assertEqual(result['networkRequests'], 0)

    def test_missing_selected_image_is_rejected(self):
        for root in [self.public, self.preview]:
            next(root.glob('assets/propiedades/ingevec-preview/*/image-0.webp')).unlink()
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('Selected brochure image or plan missing' in e for e in result['errors']))

    def test_private_contract_or_candidate_is_rejected(self):
        for root in [self.public, self.preview]:
            (root / 'assets/internal-contract.pdf').write_bytes(b'PRIVATE-TEST-FIXTURE')
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('Private document or candidate leaked' in e for e in result['errors']))

    def test_changed_catalogue_identity_is_rejected(self):
        for root in [self.public, self.preview]:
            path = root / 'data/proyectos.json'
            catalogue = json.loads(path.read_text())
            catalogue[0]['inmobiliaria'] = 'Unrelated'
            path.write_text(json.dumps(catalogue))
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('sixteen approved Ingevec identities' in e for e in result['errors']))

    def test_visible_audit_is_rejected(self):
        page = sorted(audit_module.INGEVEC)[0] + '.html'
        for root in [self.public, self.preview]:
            path = root / page
            path.write_text(path.read_text().replace('</body>', '<h2>Procedencia documental</h2></body>'))
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('audit displayed to visitors' in e for e in result['errors']))

    def test_real_content_difference_is_rejected(self):
        path = self.preview / 'assets/generic.webp'
        path.write_bytes(b'CHANGED-PREVIEW-FIXTURE')
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('Preview/public asset or data differs' in e for e in result['errors']))

    def test_incorrect_canonical_is_rejected(self):
        page = sorted(audit_module.INGEVEC)[0] + '.html'
        for root in [self.public, self.preview]:
            path = root / page
            path.write_text(path.read_text().replace('https://sollahms.cl/' + page, 'https://unrelated.invalid/' + page))
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('Incorrect canonical' in e for e in result['errors']))

    def test_removed_ecasa_identity_is_rejected(self):
        path = self.public / 'data/proyectos.json'
        catalogue = json.loads(path.read_text())
        next(p for p in catalogue if p['inmobiliaria'] == 'Ecasa')['slug'] = 'altos-del-wayra'
        path.write_text(json.dumps(catalogue))
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('15 approved Ecasa developments' in e for e in result['errors']))

    def test_stage_price_change_in_preview_is_rejected(self):
        path = self.preview / 'data/proyectos.json'
        catalogue = json.loads(path.read_text())
        next(p for p in catalogue if p['slug'] == 'alto-san-joaquin')['etapas'] = [{'slug': 'alto-san-joaquin-3', 'precioDesdeUF': 1234}]
        path.write_text(json.dumps(catalogue))
        self.assertTrue(any('commercial data beyond reviewed covers' in e for e in self.result()['errors']))

    def test_changed_ecasa_plan_and_unselected_candidate_are_rejected(self):
        path = next(self.preview.glob('assets/propiedades/ecasa-preview/*/plan.webp'))
        path.write_bytes(b'CHANGED-PLAN')
        (path.parent / 'unselected.webp').write_bytes(b'PRIVATE-CANDIDATE')
        result = self.result()
        self.assertFalse(result['ok'])
        self.assertTrue(any('Selected Ecasa resource bytes changed' in e for e in result['errors']))
        self.assertTrue(any('Unselected candidate or omitted Ecasa' in e for e in result['errors']))

    def test_pending_ecasa_media_cannot_enter_public_output(self):
        path = next(self.preview.glob('assets/propiedades/ecasa-preview/*/image.webp'))
        target = self.public / path.relative_to(self.preview)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
        self.assertTrue(any('public eligibility' in e for e in self.result()['errors']))

    def test_other_developer_rights_cannot_authorize_ecasa(self):
        path = self.source / 'data/brochures-ecasa.json'
        review = json.loads(path.read_text())
        review['publicationRights']['sourceChannel'] = 'Yapo/IRIS'
        path.write_text(json.dumps(review))
        self.assertTrue(any('Independent Ecasa' in e for e in self.result()['errors']))

    def test_official_financial_sources_remain_visible_in_the_comparator(self):
        for root in [self.public, self.preview]:
            path = root / 'comparador-hipotecario.html'
            path.write_text(path.read_text().replace('</body>', '<p>Fuentes oficiales y fecha de verificación de la UF</p></body>'))
        self.assertTrue(self.result()['ok'], self.result()['errors'])

    def test_redirect_loops_wrong_stage_or_temporary_status_are_rejected(self):
        path = self.source / 'vercel.json'
        original = json.loads(path.read_text())
        for key, value in [('destination', original['redirects'][0]['source']), ('destination', '/nucleo-costanera.html#etapa-3'), ('permanent', False), ('statusCode', 302)]:
            rules = json.loads(json.dumps(original))
            rules['redirects'][0][key] = value
            path.write_text(json.dumps(rules))
            self.assertFalse(self.result()['ok'], key)

    def test_consolidation_cannot_redirect_an_unrelated_project(self):
        path = self.source / 'vercel.json'
        configuration = json.loads(path.read_text())
        configuration['redirects'].append({'source': '/other-0.html', 'destination': '/ferroparque.html', 'permanent': True})
        path.write_text(json.dumps(configuration))
        self.assertTrue(any('Unrelated public route redirect' in error for error in self.result()['errors']))

    def test_duplicate_legacy_html_and_missing_target_anchor_are_rejected(self):
        for root in [self.public, self.preview]:
            (root / 'terratolten-1.html').write_text('<h1>Duplicate stage</h1>')
            target = root / 'terratolten.html'
            target.write_text(target.read_text().replace('id="etapa-1"', 'id="wrong-stage"'))
        errors = self.result()['errors']
        self.assertTrue(any('Duplicate HTML fiche' in error for error in errors))
        self.assertTrue(any('redirect anchor is missing' in error for error in errors))

    def test_consolidation_cannot_transfer_media_to_another_development(self):
        path = self.source / 'data/brochures-ecasa.json'
        manifest = json.loads(path.read_text())
        selected = next(record for record in manifest['projects'] if record['images'])
        selected['images'][0]['originCommercialSlug'] = 'terratolten-1'
        path.write_text(json.dumps(manifest))
        self.assertTrue(any('unrelated commercial stage' in error for error in self.result()['errors']))

    def test_commercial_sources_preserve_resources_after_matrix_consolidation(self):
        path = self.source / 'data/brochures-ecasa.json'
        manifest = json.loads(path.read_text())
        selected = next(record for record in manifest['projects'] if record['images'])
        selected['images'].clear()
        selected['catalogueCover'] = None
        path.write_text(json.dumps(manifest))
        self.assertTrue(any('lost or transferred a selected commercial resource' in error for error in self.result()['errors']))

    def test_reviewed_display_alt_is_the_only_catalogue_caption_difference(self):
        path = self.source / 'data/brochures-ecasa.json'
        manifest = json.loads(path.read_text())
        selected = next(record for record in manifest['projects'] if record['catalogueCover'])
        selected['catalogueCover']['displayAlt'] = 'Vista del proyecto · Imagen referencial'
        path.write_text(json.dumps(manifest))
        catalogue_path = self.preview / 'data/proyectos.json'
        catalogue = json.loads(catalogue_path.read_text())
        project = next(project for project in catalogue if project['slug'] == selected['slug'])
        project['imagenAlt'] = selected['catalogueCover']['displayAlt']
        catalogue_path.write_text(json.dumps(catalogue))
        self.assertTrue(self.result()['ok'], self.result()['errors'])
        project['imagenAlt'] = selected['catalogueCover']['alt']
        catalogue_path.write_text(json.dumps(catalogue))
        self.assertFalse(self.result()['ok'])

    def test_terratolten_cover_stage_remains_accredited_and_other_stages_are_rejected(self):
        path = self.source / 'data/brochures-ecasa.json'
        manifest = json.loads(path.read_text())
        matrix = next(record for record in manifest['projects'] if record['slug'] == 'terratolten')
        image_path = '/assets/propiedades/ecasa-preview/terratolten-1/image.webp'
        payload = b'accredited-stage-one-cover'
        asset = {'localPath': image_path, 'sha256': hashlib.sha256(payload).hexdigest(),
                 'originCommercialSlug': 'terratolten-1', 'etapa': 'Etapa 1'}
        matrix['images'].append(asset)
        matrix['catalogueCover'] = {'localPath': image_path, 'alt': 'Vista de Terratoltén 1'}
        commercial = next(record for record in manifest['commercialSources'] if record['slug'] == 'terratolten-1')
        commercial['selectedImagePaths'] = [image_path]
        path.write_text(json.dumps(manifest))
        file = self.preview / image_path.lstrip('/')
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(payload)
        source_page = self.source / 'terratolten.html'
        original = source_page.read_text().replace('<!--ECASA_PREVIEW_START-->', '<!--ECASA_PREVIEW_START--><img src="' + image_path + '">')
        source_page.write_text(original)
        (self.preview / source_page.name).write_text(audit_module.selected_ecasa_html(original, True).replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>'))
        catalogue_path = self.preview / 'data/proyectos.json'
        catalogue = json.loads(catalogue_path.read_text())
        project = next(project for project in catalogue if project['slug'] == 'terratolten')
        project.update({'imagenPrincipal': image_path, 'imagenAlt': matrix['catalogueCover']['alt'], 'imagenEtapa': 'Etapa 1'})
        catalogue_path.write_text(json.dumps(catalogue))
        self.assertTrue(self.result()['ok'], self.result()['errors'])
        asset['etapa'] = 'Etapa 3'
        path.write_text(json.dumps(manifest))
        project['imagenEtapa'] = 'Etapa 3'
        catalogue_path.write_text(json.dumps(catalogue))
        self.assertTrue(any('unaccredited stage' in error for error in self.result()['errors']))

    def test_unauthorized_catalogue_stage_label_is_rejected(self):
        path = self.preview / 'data/proyectos.json'
        catalogue = json.loads(path.read_text())
        project = next(project for project in catalogue if project['slug'] == 'alto-san-joaquin')
        project['imagenEtapa'] = 'Etapa 3'
        path.write_text(json.dumps(catalogue))
        self.assertTrue(any('commercial data beyond reviewed covers' in error for error in self.result()['errors']))

    def visual_fixture(self):
        review = json.loads((self.source / 'data/brochures-ecasa.json').read_text())
        catalogue = json.loads((self.public / 'data/proyectos.json').read_text())
        research = [{'slug': record['slug'], 'etapasComerciales': [{'slug': origin, 'catalogo': {},
                    'investigacion': {'images': []}} for origin in record['commercialSourceSlugs']]}
                    for record in review['projects']]
        projects = []
        for record in review['projects']:
            images = [{**image, 'kind': 'documentary', 'width': image.get('width'), 'height': image.get('height'),
                       'decision': 'keep', 'coverOnly': False, 'reason': 'Reviewed fixture'} for image in record['images']]
            path = images[0]['localPath'] if images else None
            projects.append({'slug': record['slug'], 'images': images, 'covers': {
                'preview': {'hero': path, 'catalogue': path}, 'public': {'hero': None, 'catalogue': None}}})
        return review, research, catalogue, {'projects': projects}

    def test_visual_decisions_cannot_transfer_an_image_to_another_stage(self):
        review, research, catalogue, policy = self.visual_fixture()
        selected = next(record for record in policy['projects'] if record['images'])
        selected['images'][0]['originCommercialSlug'] = 'terratolten-1'
        errors = []
        audit_module.quality_images(review, research, catalogue, policy, {}, lambda condition, message: errors.append(message) if not condition else None)
        self.assertTrue(any('changed source bytes, dimensions or origin' in error for error in errors))

    def test_visual_quality_cannot_exclude_a_plan_as_a_photograph(self):
        review, research, catalogue, policy = self.visual_fixture()
        selected = next(record for record in policy['projects'] if record['images'])
        record = next(record for record in review['projects'] if record['slug'] == selected['slug'])
        plan = record['models'][0]['plan']
        selected['images'].append({**selected['images'][0], 'localPath': plan['localPath'], 'sha256': plan['sha256'], 'decision': 'exclude'})
        errors = []
        audit_module.quality_images(review, research, catalogue, policy, {}, lambda condition, message: errors.append(message) if not condition else None)
        self.assertTrue(any('omitted or added a source image' in error for error in errors))

    def test_visual_cover_does_not_grant_public_brochure_rights(self):
        review, research, catalogue, policy = self.visual_fixture()
        selected = next(record for record in policy['projects'] if record['images'])
        selected['covers']['public']['hero'] = selected['images'][0]['localPath']
        errors = []
        audit_module.quality_images(review, research, catalogue, policy, {}, lambda condition, message: errors.append(message) if not condition else None)
        self.assertTrue(any('ineligible' in error for error in errors))

    def test_reviewed_display_policy_replays_captions_without_changing_prices_or_scripts(self):
        policy = {'schemaVersion': 1, 'captionRules': [{'pattern': r'\s*·\s*Brochure, pág\. 1', 'replacement': ''}],
                  'textRules': [{'pattern': r'\bImágenes del brochure\b', 'replacement': 'Imágenes del proyecto'}]}
        (self.source / 'data/public-caption-policy.json').write_text(json.dumps(policy))
        (self.source / 'scripts').mkdir()
        (self.source / 'scripts/public-fiche-copy.mjs').write_text('// Reviewed consumer fixture')
        for slug in audit_module.ECASA:
            path = self.source / (slug + '.html')
            original = path.read_text().replace('</body>', '<p>UF 2.000</p><h2>Imágenes del brochure</h2><img src="/assets/generic.webp" alt="Fachada · Brochure, pág. 1"><script>const evidence="Brochure, pág. 1";</script></body>')
            path.write_text(original)
            public = audit_module.normalize_fiche_copy(audit_module.selected_ecasa_html(original, False), policy)
            preview = audit_module.normalize_fiche_copy(audit_module.selected_ecasa_html(original, True), policy)
            (self.public / path.name).write_text(public)
            (self.preview / path.name).write_text(preview.replace('</head>', '<meta name="robots" content="noindex, nofollow">\n</head>'))
            self.assertIn('UF 2.000', preview)
            self.assertIn('alt="Fachada"', preview)
            self.assertIn('const evidence="Brochure, pág. 1";', preview)
            self.assertIn('Imágenes del proyecto', preview)
        self.assertTrue(self.result()['ok'], self.result()['errors'])


if __name__ == '__main__':
    unittest.main()
