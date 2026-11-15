"""Independent preservation audit against the verified production fiche sources."""
import hashlib
import json
import re
import subprocess
import sys
import unittest
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from project_tour_removal import remove_project_tours

BASE = 'c2e1965ced736d46917a1bee286456cb937d58fe'


class RemovalTests(unittest.TestCase):
    def test_all_fiches_preserve_non_tour_content(self):
        records = json.loads((ROOT / 'data/proyectos.json').read_text())
        self.assertEqual(len(records), 131)
        modified, tours, frames, links = [], 0, 0, 0
        evidence = []
        for project in records:
            path = project['slug'] + '.html'
            original = subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT).decode()
            current = (ROOT / path).read_text()
            before, after = [BeautifulSoup(value, 'html.parser') for value in (original, current)]
            tour = before.find(id='recorrido')
            if tour:
                tours += 1
                frames += len(tour.select('iframe'))
                links += len(tour.select('a'))
                # No removed subtree contains protected content.
                self.assertFalse(tour.select('img,video,audio,form'), path)
                tour.decompose()
            self.assertIsNone(after.find(id='recorrido'), path)
            self.assertFalse(after.select('[data-project-embed="tour"],a[href="#recorrido"],.tour-card'), path)
            self.assertNotRegex(current, r'(?i)matterport|tour virtual|virtual tour|recorrido virtual|Galería y 360°')
            # Full serialized subtrees and ordered destinations, independently
            # compared after removing only the original tour in the test DOM.
            for selector in ['img', 'video', 'audio', 'form', 'iframe', 'header', 'footer',
                             'script[type="application/ld+json"]', 'meta', 'title',
                             'link[rel="canonical"]', '[id="planos"]', '[id="modelos"]',
                             '[id="solicitar-cotizacion"]']:
                self.assertEqual([str(x) for x in before.select(selector)],
                                 [str(x) for x in after.select(selector)], path + ': ' + selector)
            old_links = [(x.get('href'), x.get('target'), x.get('rel'))
                         for x in before.select('a[href]') if x.get('href') != '#recorrido']
            new_links = [(x.get('href'), x.get('target'), x.get('rel')) for x in after.select('a[href]')]
            self.assertEqual(old_links, new_links, path + ': all surviving destinations')
            for target in before.select('[id^="etapa-"]'):
                self.assertIsNotNone(after.find(id=target['id']), path)
            self.assertEqual(current, remove_project_tours(current), path + ': idempotence')
            if original != current:
                modified.append(path)
            evidence.append({'file': path, 'modified': original != current,
                             'beforeSha256': hashlib.sha256(original.encode()).hexdigest(),
                             'afterSha256': hashlib.sha256(current.encode()).hexdigest(),
                             'preservedImages': len(after.select('img')),
                             'preservedPlans': len(after.select('#planos img,#modelos img')),
                             'preservedForms': len(after.select('form')),
                             'preservedMapsAndVideos': len(after.select('iframe,video'))})
        self.assertEqual((tours, frames, links), (49, 73, 74))
        (ROOT / 'docs/recorridos-eliminacion-20261115/preservacion.json').write_text(
            json.dumps({'base': BASE, 'inspected': 131, 'modified': len(modified),
                        'tourSectionsRemoved': tours, 'tourIframesRemoved': frames,
                        'tourLinksRemoved': links, 'files': evidence}, ensure_ascii=False, indent=2) + '\n')

    def test_protected_mixed_section_fails_closed(self):
        for tag in ['<img src="photo.jpg">', '<video src="promo.mp4"></video>', '<form></form>']:
            with self.assertRaises(ValueError):
                remove_project_tours('<section id="recorrido">' + tag + '</section>')

    def test_nested_removal_and_stage_redirect(self):
        source = '<section id="caracteristicas"><h2>Características</h2></section><section id="galeria"><img src="photo.jpg"><section id="recorrido"><div id="etapa-2"><section><iframe src="https://my.matterport.com/show"></iframe></section></div></section></section>'
        result = remove_project_tours(source)
        soup = BeautifulSoup(result, 'html.parser')
        self.assertIsNone(soup.find(id='recorrido'))
        self.assertIsNotNone(soup.select_one('#caracteristicas #etapa-2'))
        self.assertEqual(soup.img['src'], 'photo.jpg')

    def test_shared_generator_keeps_gallery_without_tours(self):
        from project_navigation import apply_navigation
        project = json.loads((ROOT / 'data/proyectos.json').read_text())[0]
        original = subprocess.check_output(['git', 'show', BASE + ':' + project['slug'] + '.html'], cwd=ROOT).decode()
        generated = apply_navigation(original, project)
        soup = BeautifulSoup(generated, 'html.parser')
        self.assertFalse(soup.select('#recorrido,.tour-card,[data-project-embed="tour"]'))
        self.assertNotIn('Galería y 360°', generated)
        self.assertTrue(soup.select('#galeria img'))

    def test_legacy_embed_migration_cannot_restore_a_tour(self):
        from project_embed_policy import normalize_page_embeds
        research = {row['slug']: row for row in json.loads((ROOT / 'data/fichas-proyectos.json').read_text())}
        for slug in ['inn-puerto-chico', 'alto-irarrazaval']:
            original = subprocess.check_output(['git', 'show', BASE + ':' + slug + '.html'], cwd=ROOT).decode()
            generated = normalize_page_embeds(original, research[slug], featured=slug == 'inn-puerto-chico')
            self.assertFalse(BeautifulSoup(generated, 'html.parser').select('#recorrido,.tour-card,[data-project-embed="tour"]'))


if __name__ == '__main__':
    unittest.main(verbosity=2)
