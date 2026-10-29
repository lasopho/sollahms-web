import collections,json,sys,unittest
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from project_navigation import apply_navigation,price_from,valid_plans
from project_amenities import apply_amenities

class NavigationTests(unittest.TestCase):
    def test_all_projects_have_the_five_real_sections_in_relative_order(self):
        projects=json.loads((ROOT/'data/proyectos.json').read_text())
        self.assertEqual(len(projects),131)
        for p in projects:
            raw=(ROOT/p['detalleUrl'].lstrip('/')).read_text();s=BeautifulSoup(raw,'html.parser')
            with self.subTest(slug=p['slug']):
                self.assertEqual(len(s.select('[data-project-navigation]')),1)
                links=s.select('[data-project-navigation] a');names=[a.get_text(' ',strip=True) for a in links]
                gallery='Galería y 360°' if 'Galería y 360°' in names else 'Galería'
                positions=[names.index(n) for n in ['Resumen','Características',gallery,'Ubicación','Cotización']]
                self.assertEqual(positions,sorted(positions));self.assertEqual(names[-1],'Cotización')
                self.assertNotIn('Unidades',names)
                ids=[n['id'] for n in s.select('[id]')];self.assertEqual(len(ids),len(set(ids)))
                for a in links:self.assertIsNotNone(s.find(id=a['href'][1:]))
                self.assertTrue(s.select_one('#resumen h1'));self.assertTrue(s.select_one('#resumen .ci-visual img'))
                self.assertTrue(s.select_one('#resumen .jn-summary-description'))
                self.assertTrue(s.select_one('#resumen a[data-request-intent="cotizacion"]'))
                self.assertEqual(s.select_one('.ci-market strong').get_text(' ',strip=True),price_from(p.get('precioDesdeUF')))
                self.assertTrue(s.select('#caracteristicas dt,#caracteristicas .am-item'))
                self.assertTrue(s.select('#galeria img'))
                if 'Planos' in names:self.assertTrue(valid_plans(s.find(id=links[names.index('Planos')]['href'][1:])))
                self.assertEqual(raw,apply_navigation(apply_amenities(raw,p),p))

    def test_plaza_has_interest_in_quote_instead_of_public_inventory(self):
        s=BeautifulSoup((ROOT/'plaza-las-condes.html').read_text(),'html.parser')
        self.assertFalse(s.select('.plc-unit,[data-plaza-unit]'))
        self.assertTrue(s.select_one('form #plc-unit-interest'))
        self.assertNotIn('11.119',s.get_text(' ',strip=True))
        self.assertIn('Desde UF 11.073',s.get_text(' ',strip=True))
        source=json.loads((ROOT/'data/plaza-las-condes-verified.json').read_text())
        self.assertEqual({str(u['number']):u['priceUF'] for u in source['units']},{'213':11119,'313':11073})

    def test_documented_additions_and_reviewed_plans(self):
        data=json.loads((ROOT/'data/project-content-additions.json').read_text())['projects']
        self.assertEqual(len(data),11);count=0
        for slug,record in data.items():
            soup=BeautifulSoup((ROOT/(slug+'.html')).read_text(),'html.parser')
            self.assertTrue(soup.select('#equipamiento .am-item'))
            self.assertFalse(soup.select('#equipamiento .missing-note'))
            expected=BeautifulSoup(record['plansHtml'],'html.parser')
            self.assertEqual([i['src'] for i in soup.select('#planos img')],[i['src'] for i in expected.select('img')])
            for image in expected.select('img'):self.assertTrue((ROOT/image['src'].lstrip('/')).is_file())
            count+=len(expected.select('img'))
        self.assertEqual(count,72)

    def test_known_and_pending_price_contract(self):
        projects=json.loads((ROOT/'data/proyectos.json').read_text())
        self.assertEqual(sum(p.get('precioDesdeUF') is None for p in projects),38)
        self.assertEqual(price_from(None),'Desde: consultar precio')
        self.assertEqual(price_from(2784),'Desde UF 2.784')
        self.assertEqual(price_from(2784.5),'Desde UF 2.784,5')
        self.assertEqual(price_from(float('nan')),'Desde: consultar precio')

if __name__=='__main__':unittest.main()
