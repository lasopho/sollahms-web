import hashlib,json,sys,unittest
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from crescer_details import apply_crescer
def read(path):return json.loads((ROOT/path).read_text())
class CrescerTests(unittest.TestCase):
    def test_precise_owner_values_and_documented_counts(self):
        expected={'don-tomas':[2360.10,3292.89,3292.89,3292.89],'don-rafael':[2817.14,3668.54,4985.77]}
        for slug,values in expected.items():
            p=next(p for p in read('data/proyectos.json') if p['slug']==slug)
            self.assertEqual([x['precioDesdeUF'] for x in p['preciosPorTipologia']],values)
            self.assertEqual(p['precioDesdeUF'],min(values));self.assertEqual(p['precioDecimales'],2)
            s=BeautifulSoup((ROOT/(slug+'.html')).read_text(),'html.parser')
            self.assertEqual(len(s.select('.pb-plan')),12);self.assertEqual(len(s.select('.pb-offer')),len(values))
            self.assertEqual([x.get_text() for x in s.select('.pj-nav a')],['Resumen','Características','Planos','Galería','Ubicación','Cotización'])
    def test_coherent_models_and_no_invented_surfaces(self):
        facts=read('data/crescer-brochures.json')['projects'];index=read('data/catalog-facets.json')['projects']
        self.assertEqual(sum(m['filterEligible'] for p in facts.values() for m in p['models']),31)
        for v in index['don-tomas']['variants']:
            self.assertNotIn('util',v['areas']);self.assertNotIn('interior',v['areas']);self.assertNotIn('total',v['areas'])
        for v in index['don-rafael']['variants']:
            self.assertNotIn('total',v['areas']);self.assertNotIn('util',v['areas'])
            if v.get('bedrooms')==2:self.assertEqual(v['areas'],{});self.assertEqual(v['bathrooms'],1)
        bad=next(m for m in facts['don-rafael']['models'] if not m['filterEligible'])
        self.assertEqual(bad['page'],12);self.assertEqual(bad['filterAreas'],{})
    def test_full_assets_and_no_cross_project_links(self):
        manifest=read('docs/crescer-20261029/asset-manifest.json')['projects']
        for slug,p in manifest.items():
            s=BeautifulSoup((ROOT/(slug+'.html')).read_text(),'html.parser')
            for a in p['plans']+p['gallery']:
                for asset in [a,a['thumbnail']]:
                    raw=(ROOT/asset['path'][1:]).read_bytes()
                    self.assertEqual(hashlib.sha256(raw).hexdigest(),asset['sha256'])
                self.assertTrue(s.select('a[href="'+a['src']+'"]'))
            self.assertNotIn('/crescer/'+('don-rafael' if slug=='don-tomas' else 'don-tomas')+'/',str(s))
    def test_renderer_is_idempotent_and_unrelated_projects_noop(self):
        for p in read('data/proyectos.json'):
            page=(ROOT/p['detalleUrl'][1:]).read_text()
            self.assertEqual(apply_crescer(page,p),page,p['slug'])
    def test_scoped_catalogue_fiches_and_existing_photos(self):
        base=ROOT.parent/'advanced-filters-source'
        if not base.exists():self.skipTest('Local release baseline not materialized')
        for filename in ['data/proyectos.json','data/fichas-proyectos.json']:
            before={p['slug']:p for p in json.loads((base/filename).read_text())}
            for p in read(filename):
                if p['slug'] not in ['don-tomas','don-rafael']:self.assertEqual(p,before[p['slug']])
        for p in read('data/proyectos.json'):
            path=p['detalleUrl'][1:]
            if p['slug'] not in ['don-tomas','don-rafael']:self.assertEqual((ROOT/path).read_bytes(),(base/path).read_bytes())
            else:
                old=BeautifulSoup((base/path).read_text(),'html.parser');new=BeautifulSoup((ROOT/path).read_text(),'html.parser')
                self.assertEqual(str(old.select_one('.ci-visual')),str(new.select_one('.ci-visual')))
                oldphotos={i['src'] for i in old.select('#galeria img')};newphotos={i['src'] for i in new.select('#galeria img')}
                self.assertTrue(oldphotos<=newphotos)
                self.assertEqual(str(old.select_one('iframe[data-project-embed="map"]')),str(new.select_one('iframe[data-project-embed="map"]')))
                for selector in ['input','textarea','select']:
                    self.assertEqual([str(x) for x in old.select('form '+selector)],[str(x) for x in new.select('form '+selector)])
if __name__=='__main__':unittest.main()
