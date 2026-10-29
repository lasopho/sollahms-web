"""Global coverage, editorial fidelity and SVG contracts; no network required."""
import json,re,sys,unittest
from collections import Counter
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from project_amenities import apply_amenities,render_items,CATALOG,entry

class AmenityTests(unittest.TestCase):
    def test_all_published_fiches_use_shared_component(self):
        projects=json.loads((ROOT/'data/proyectos.json').read_text())
        self.assertEqual(len(projects),131)
        for p in projects:
            raw=(ROOT/p['detalleUrl'].split('#')[0].lstrip('/')).read_text()
            soup=BeautifulSoup(raw,'html.parser')
            with self.subTest(slug=p['slug']):
                self.assertEqual(raw,apply_amenities(raw,p))
                self.assertEqual(len(soup.select('link[href^="/assets/css/project-amenities.css"]')),1)
                self.assertFalse(soup.main.select('.amenity-list,.plc-amenities,.plc-finishes'))
                for li in soup.select('.am-item'):
                    self.assertEqual(len(li.select('svg.am-icon')),1)
                    svg=li.svg
                    self.assertEqual(svg.get('viewbox'),'0 0 24 24')
                    self.assertEqual(svg['stroke-width'],'1.5')
                    self.assertEqual(svg['stroke-linecap'],'round')
                    self.assertEqual(svg['stroke-linejoin'],'round')
                    self.assertEqual(svg['stroke'],'currentColor')
                    self.assertEqual(svg['fill'],'none')
                    self.assertEqual(svg['aria-hidden'],'true')
                    self.assertEqual(svg['focusable'],'false')
                    self.assertTrue(li.select_one('.am-label').get_text(strip=True))
                    self.assertFalse(li.select('img,.material-symbols-outlined'))
                for group in soup.select('.am-grid'):
                    labels=[li.get_text(' ',strip=True) for li in group.select('.am-item')]
                    self.assertEqual(len(labels),len(set(labels)))

    def test_editorial_aliases_and_qualifiers(self):
        for before,after in [('Laundry Room','Lavandería'),('Bike Parking','Bicicleteros'),('Hall','Hall de acceso y lobby'),('Sala E-commerce','E-commerce / Mail Room')]:
            self.assertEqual(entry(before)['label'],after)
        for label in ['Dos piscinas','2 quinchos en azotea','Quinchos; cantidad pendiente de confirmación','Opción de instalar lavadora en departamentos 1D 1B, salvo línea 9.']:
            self.assertEqual(entry(label)['label'],label)

    def test_unknown_amenity_requires_reviewed_mapping(self):
        with self.assertRaisesRegex(ValueError,'reviewed icon'):
            render_items(['Una instalación futura sin mapear'])

    def test_new_project_consumes_same_renderer(self):
        raw='<html><head><link rel="stylesheet" href="/assets/css/sollahms-theme.css"></head><body><main><section class="pj-block" id="equipamiento"><h2>Equipamiento</h2><ul class="amenity-list"><li>Laundry Room</li><li>Bike Parking</li></ul></section></main></body></html>'
        result=apply_amenities(raw,{'slug':'future-example'})
        self.assertEqual(result,apply_amenities(result,{'slug':'future-example'}))
        self.assertIn('Lavandería',result)
        self.assertNotIn('Laundry Room',result)
        self.assertEqual(len(BeautifulSoup(result,'html.parser').select('.am-icon')),2)

    def test_monjitas_consolidation_preserves_conditions(self):
        soup=BeautifulSoup((ROOT/'monjitas-690.html').read_text(),'html.parser')
        groups=soup.select('#equipamiento .am-grid')
        self.assertEqual(len(groups),2)
        text=groups[0].get_text(' ',strip=True)
        self.assertEqual(text.count('Sport bar'),1)
        for value in ['Piscina panorámica templada y terrazas panorámicas','Dos salones gourmet','Quinchos; cantidad pendiente de confirmación','Gimnasio y pilates','Bicicletero con taller','Patio y lavado de mascotas']:
            self.assertIn(value,text)

    def test_plaza_rich_descriptions_remain(self):
        soup=BeautifulSoup((ROOT/'plaza-las-condes.html').read_text(),'html.parser')
        self.assertEqual(len(soup.select('#terminaciones .am-description')),6)
        self.assertIn('según tipología',soup.select_one('#terminaciones').get_text())

if __name__=='__main__':unittest.main()
