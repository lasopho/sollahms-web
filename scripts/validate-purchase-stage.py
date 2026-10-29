import json,re,hashlib,sys
from pathlib import Path
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1];B=R.parent/'mortgage-guide-source';D=R/'docs/purchase-stage-20261029'
sys.path.insert(0,str(R/'scripts'))
from purchase_stage_links import apply_stage_project,apply_stage_footer
from purchase_stage import classify
catalog=json.loads((R/'data/proyectos.json').read_text());facets=json.loads((R/'data/catalog-facets.json').read_text())['projects']
assert (R/'data/proyectos.json').read_bytes()==(B/'data/proyectos.json').read_bytes()
protected=['data/fichas-proyectos.json','assets/js/mortgage-guide.mjs','assets/js/mortgage-guide-engine.mjs','assets/js/purchase-capacity-ui.mjs','assets/js/catalog-map.mjs','assets/js/scroll-presence.js','assets/js/image-parallax.js']
for p in protected:assert (R/p).read_bytes()==(B/p).read_bytes(),p
for p in catalog:
 path=p['slug']+'.html';old=(B/path).read_text();new=(R/path).read_text();assert new==apply_stage_project(old,p),path
 soup=BeautifulSoup(new,'html.parser');assert len(soup.select('[data-purchase-stage-link]'))==1;assert len(soup.select('footer [data-purchase-guide-footer]'))==1
 # All original forms, prices, image attributes and motion remain byte-identical after removing only the new blocks.
 for tag in ['header','form','script','figure']:
  assert re.findall(r'<'+tag+r'\b.*?</'+tag+r'>',old,re.S)==re.findall(r'<'+tag+r'\b.*?</'+tag+r'>',new,re.S),(path,tag)
 assert apply_stage_project(new,p)==new,path
pages=json.loads((D/'navigation-pages.json').read_text())
for p in pages:
 s=BeautifulSoup((R/p).read_text(),'html.parser');assert len(s.select('footer [data-purchase-guide-footer]'))==1,p
 assert not s.select('header [data-purchase-guide-footer]'),p
for p in ['cuando-comprar-propiedad.html','guia-hipotecaria.html']:
 s=BeautifulSoup((R/p).read_text(),'html.parser');assert len(s.select('h1'))==1;ids=[x['id'] for x in s.select('[id]')];assert len(ids)==len(set(ids)),p
 assert list(x for x in s.main.children if x.name)[-1]['id']=='fuentes'
 for a in s.select('a[href^="#"]'):assert a['href'][1:] in ids,(p,a['href'])
 for a in s.select('a[href^="/"]'):
  path=a['href'].split('?')[0].split('#')[0];assert (R/('index.html' if path=='/' else path[1:])).exists(),path
s=BeautifulSoup((R/'cuando-comprar-propiedad.html').read_text(),'html.parser');assert len(s.select('.ps-question'))==4;assert len(s.select('.ps-faq'))==8;assert len(s.select('.ps-table tbody tr'))==8
assert not re.search(r'fetch\(|localStorage|sessionStorage|sendBeacon|XMLHttpRequest', (R/'assets/js/purchase-stage-guide.mjs').read_text())
for slug in ['don-tomas','don-rafael','bordevivo','vista-bulnes']:assert facets[slug]['purchaseStage']['eligible'] is False
# Regression: explicit receipt blocks even a positive supplemental immediate claim.
assert not classify({'slug':'x','estado':'En recepción final'}, {'status':{'confirmed':True,'key':'inmediata'},'delivery':{'confirmed':True,'immediate':True}}, {'x':{'mode':'inmediata','activeCommercialOffer':True}})['eligible']
counts={m:sum(v['purchaseStage']['eligible'] and v['purchaseStage']['mode']==m for v in facets.values()) for m in ['blanco','verde','inmediata']}
report={'projects':len(catalog),'footerPages':len(pages),'eligibleModes':counts,'excludedFromGuidedModes':sum(not v['purchaseStage']['eligible'] for v in facets.values()),'pricesAndCatalogUnchanged':True,'allFicheHeadersFormsScriptsFiguresUnchanged':True,'protectedFiles':protected,'newFaqs':8,'comparisonRows':8,'noPersonalDataOrPersistence':True,'allLocalLinksAndAnchorsResolve':True,'sourcesLastBeforeFooter':True}
(D/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(D/'stage-audit.json').write_text(json.dumps({p['slug']:{'name':p['nombre'],'reportedState':p.get('estado'),**facets[p['slug']]['purchaseStage']} for p in catalog},ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
