"""One purchase-stage projection from the existing catalogue and its reviewed facts.
No stock/price inventory. Immediate delivery requires explicit current commercial review.
A reported reception process, sold project, conflicting stage or missing proof fails closed.
"""
import json,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def fold(v):return ''.join(c for c in unicodedata.normalize('NFD',str(v or '')).lower() if not unicodedata.combining(c))
def classify(project,facts,reviews):
    status=facts.get('status',{}); key=status.get('key') if status.get('confirmed') else None
    from leon_commercial import authorized
    if authorized(project):
        key={'En blanco':'en-blanco','En verde':'en-verde','En recepción final':'en-recepcion-final'}.get(project['estado'])
    raw=fold(project.get('estado')); proof=status.get('evidence'); ref=project.get('etapaReferenciaSlug')
    row={'mode':None,'eligible':False,'reason':'Etapa pendiente de confirmar','referenceStage':ref}
    if project.get('stageConflict'):
        return {**row,'reason':project['stageConflict']['reason']}
    if 'recepcion' in raw:
        return {**row,'reason':'Recepción final pendiente: no equivale a entrega inmediata'}
    if key in ['vendido','sin-unidades'] or raw in ['vendido','sin unidades disponibles']:
        return {**row,'reason':'Sin oferta disponible confirmada'}
    if key in ['en-blanco','en-verde','en-construccion']:
        return {**row,'mode':'blanco' if key=='en-blanco' else 'verde','eligible':True,'reason':'Etapa respaldada en las fuentes revisadas del catálogo','evidence':proof}
    if key=='inmediata' and facts.get('delivery',{}).get('confirmed') and facts['delivery'].get('immediate'):
        review=reviews.get(project['slug'],{})
        # Review matches the exact source record/stage. Never borrow sibling tower status.
        eligible=review.get('mode')=='inmediata' and review.get('activeCommercialOffer') is True and review.get('referenceStage')==ref and review.get('sourceUrl') and review.get('checkedAt')
        return {**row,'mode':'inmediata','eligible':bool(eligible),'reason':'Oferta comercial activa y entrega inmediata publicadas por la inmobiliaria; confirmar unidad al cotizar' if eligible else 'Estado inmediato documentado; disponibilidad actual pendiente de confirmar',**({'checkedAt':review['checkedAt'],'sourceUrl':review['sourceUrl']} if eligible else {})}
    return row

def project_stages():
    catalog=json.loads((ROOT/'data/proyectos.json').read_text())
    facts=json.loads((ROOT/'docs/advanced-filters-20261029/property-audit.json').read_text())['projects']
    reviews=json.loads((ROOT/'data/purchase-stage-verifications.json').read_text())['reviews']
    return {p['slug']:classify(p,facts[p['slug']],reviews) for p in catalog}
