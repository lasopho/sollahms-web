"""Shared feature edits drive the fiche renderer and the search projection."""
import copy,json,sys,unittest
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
import project_amenities as am
class SharedFeatureTests(unittest.TestCase):
    def test_all_current_fiches_match_central_groups(self):
        for p in json.loads((ROOT/'data/proyectos.json').read_text()):
            raw=(ROOT/p['detalleUrl'].lstrip('/')).read_text()
            self.assertEqual(am.apply_amenities(raw,p),raw,p['slug'])
            self.assertIn(p['slug'],am.FEATURE_REGISTRY)

    def test_reviewed_edit_renders_and_resolves_filter_id(self):
        slug='future-example';old=am.FEATURE_REGISTRY.get(slug)
        try:
            am.FEATURE_REGISTRY[slug]={'groups':[{'sectionId':'equipamiento','ordinal':0,'kind':'amenities','items':[{'label':'Laundry Room','filterEligible':True,'source':{'file':'verified-brochure.pdf','page':4}}]}]}
            page='<html><head><link rel="stylesheet" href="/assets/css/sollahms-theme.css"></head><body><main><section class="pj-block" id="equipamiento"><h2>Equipamiento</h2><p class="pending-panel">Pendiente</p></section></main></body></html>'
            rendered=am.apply_amenities(page,{'slug':slug});soup=BeautifulSoup(rendered,'html.parser')
            self.assertEqual(soup.select_one('.am-label').text,'Lavandería');self.assertFalse(soup.select('.pending-panel'))
            item=am.project_feature_groups(slug)[0]['items'][0]
            self.assertEqual(am.entry(item['label'])['filterIds'],['lavanderia'])
            self.assertEqual(rendered,am.apply_amenities(rendered,{'slug':slug}))
        finally:
            if old is None:am.FEATURE_REGISTRY.pop(slug,None)
            else:am.FEATURE_REGISTRY[slug]=old

    def test_filter_registry_is_semantic_not_icon_inference(self):
        self.assertNotEqual(am.entry('Family Room')['filterIds'],['salon-multiuso'])
        known={f['id'] for f in am.CATALOG['filters']}
        for row in am.CATALOG['labels']:self.assertTrue(set(row['filterIds'])<=known)
if __name__=='__main__':unittest.main()
