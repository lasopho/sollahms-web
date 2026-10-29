"""Compare this release with an explicit local checkout of the previous release."""
import argparse,collections,hashlib,json
from pathlib import Path
from bs4 import BeautifulSoup
from project_navigation import price_from
ROOT=Path(__file__).resolve().parents[1]
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--baseline',type=Path,required=True);args=ap.parse_args()
    docs=ROOT/'docs/project-journey-20261029';docs.mkdir(parents=True,exist_ok=True)
    projects=json.loads((ROOT/'data/proyectos.json').read_text());rows=[]
    additions=json.loads((ROOT/'data/project-content-additions.json').read_text())['projects']
    for p in projects:
        path=p['detalleUrl'].lstrip('/');before=(args.baseline/path).read_text();after=(ROOT/path).read_text()
        old=BeautifulSoup(before,'html.parser');new=BeautifulSoup(after,'html.parser')
        inventory=old.select_one('section#unidades')
        if inventory:inventory.decompose()
        for selector in ['.ci-visual img','#galeria img','iframe','body > header','footer']:
            assert [str(x) for x in old.select(selector)]==[str(x) for x in new.select(selector)],(p['slug'],selector)
        oldform=old.select_one('form[data-project-request]');newform=BeautifulSoup(str(new.select_one('form[data-project-request]')),'html.parser').form
        if p['slug']=='plaza-las-condes':newform.select_one('.jn-unit-interest').decompose()
        assert str(oldform)==str(newform),(p['slug'],'form')
        # Images from removed inventory cards remain in the nine general model plans.
        oldsrc={x.get('src') for x in old.select('img')};newsrc={x.get('src') for x in new.select('img')}
        assert oldsrc<=newsrc,(p['slug'],'lost images',oldsrc-newsrc)
        broken=[a['href'] for a in new.select('a[href^="#"]') if len(a['href'])>1 and not new.find(id=a['href'][1:])]
        assert not broken,(p['slug'],'broken anchors',broken)
        row={'slug':p['slug'],'name':p['nombre'],'developer':p['inmobiliaria'],'path':path,'price':p.get('precioDesdeUF'),'priceLabel':price_from(p.get('precioDesdeUF')),'sections':[a.get_text(' ',strip=True) for a in new.select('[data-project-navigation] a')],'addedPlans':len(new.select('.jn-reviewed-plans img')),'addedAmenities':len(additions.get(p['slug'],{}).get('amenities',[])),'addedFinishes':len(additions.get(p['slug'],{}).get('finishes',[])),'equipmentPending':bool(new.select('#equipamiento .missing-note,#equipamiento .pending-panel')),'sha256':hashlib.sha256(after.encode()).hexdigest()}
        rows.append(row)
    unchanged=['data/proyectos.json','data/nollagam-commercial.json','data/plaza-las-condes-verified.json','data/project-locations.json','index.html','assets/js/image-parallax.js','assets/css/image-parallax.css','assets/js/scroll-presence.js','assets/css/sollahms-theme.css']
    for path in unchanged:assert (ROOT/path).read_bytes()==(args.baseline/path).read_bytes(),path
    result={'projects':rows,'summary':{'projects':len(rows),'knownPrices':sum(r['price'] is not None for r in rows),'pendingPrices':sum(r['price'] is None for r in rows),'projectsEnriched':len(additions),'addedPlans':sum(r['addedPlans'] for r in rows),'addedAmenities':sum(r['addedAmenities'] for r in rows),'addedFinishes':sum(r['addedFinishes'] for r in rows),'equipmentPending':sum(r['equipmentPending'] for r in rows),'planMenus':sum('Planos' in r['sections'] for r in rows),'typologyMenus':sum('Tipologías' in r['sections'] for r in rows),'tourMenus':sum('Galería y 360°' in r['sections'] for r in rows),'environmentMenus':sum('Entorno' in r['sections'] for r in rows)},'preserved':{'allPriorGalleryAndCoverImages':True,'allIframes':True,'headersAndFooters':True,'formsExceptPlazaOptionalUnitField':True,'internalAnchorsValid':True,'byteIdenticalFiles':unchanged}}
    (docs/'audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    lines=['# Fichas revisadas y ajustadas','','Las 131 fichas comparten las cinco secciones esenciales. El precio sigue el catálogo de Sollahms; los pendientes no reciben precios históricos ni de campañas externas.','','| Proyecto | Inmobiliaria | Precio desde | Secciones adicionales | Nuevos planos |','|---|---|---|---|---|']
    for r in rows:
        extra=[s for s in r['sections'] if s not in ['Resumen','Características','Galería','Ubicación','Cotización']]
        lines.append(f"| [{r['name']}](https://sollahms.cl/{r['path']}) | {r['developer']} | {r['priceLabel']} | {', '.join(extra) or '—'} | {r['addedPlans'] or '—'} |")
    lines+=['','## Precios pendientes','']+[f"- {r['name']} ({r['developer']})" for r in rows if r['price'] is None]
    lines+=['','## Equipamiento pendiente de respaldo','', 'Estas fichas mantienen características reales del proyecto y un aviso de confirmación; no se les asignan amenities por semejanza o por fotografías.','']+[f"- {r['name']} ({r['developer']})" for r in rows if r['equipmentPending']]
    (docs/'fichas-revisadas.md').write_text('\n'.join(lines)+'\n');print(json.dumps(result['summary']))
if __name__=='__main__':main()
