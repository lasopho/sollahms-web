"""Read the independently checked, internal 36-plan surface register."""
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTER = ROOT / 'data/leon-plan-surfaces.json'
REGISTER_SHA256 = '0c3465d7e6f2f623378c7e295c2e0f9cf72b586dd60a3c45b18a78985d3400dc'
MANIFEST_SHA256 = '962ed948e818a6c27046657bea5835d54e1e885f88c14775b5567b1c6c3ec28d'

def reviewed_surface_plans(record):
    if not REGISTER.exists():
        return None
    raw = REGISTER.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == REGISTER_SHA256, 'Unreviewed surface register'
    review = json.loads(raw)
    assert review['schemaVersion'] == 1 and review['documentManifestSha256'] == MANIFEST_SHA256
    assert hashlib.sha256((ROOT / 'data/brochures-leon.json').read_bytes()).hexdigest() == MANIFEST_SHA256
    plans = review['plans']
    assert len(plans) == 36 and len({p['id'] for p in plans}) == 36 and len({p['planPath'] for p in plans}) == 36
    selected = [p for p in plans if p['projectSlug'] == record['slug']]
    assert len(selected) == len(record['models'])
    by_path = {p['planPath']: p for p in selected}
    for model in record['models']:
        item = by_path[model['plan']['localPath']]
        assert item['planSha256'] == model['plan']['sha256'] and item['pdf']['page'] == model['sourcePage']
        assert item['pdf']['sha256'] == record['document']['sha256'] and item['officialUrl'] == record['officialUrl']
        assert item['bedrooms'] == model.get('bedrooms') and item['bathrooms'] == model.get('bathrooms')
        assert item['status'] in {'confirmado', 'discrepante', 'pendiente'}
        assert len({a['kind'] for a in item['areas']}) == len(item['areas'])
        assert {'total', 'terrace'} <= {a['kind'] for a in item['areas']}
        assert len({'useful', 'interior'} & {a['kind'] for a in item['areas']}) == 1
        for area in item['areas']:
            assert area['kind'] in {'useful', 'interior', 'terrace', 'garden', 'total'}
            assert area['derived'] is False
            value = area['valueM2']
            assert value is None or type(value) in {float, int} and math.isfinite(value) and value > 0
            if area['applicable'] is False:
                assert value is None, 'Do not convert an absent terrace into numeric zero'
            if value is not None:
                assert item['identityConfirmed'] is True and area['status'] == 'confirmado'
        assert item['complete'] == all(a['valueM2'] is not None or a['applicable'] is False for a in item['areas'])
    return by_path

def room_counts(plan):
    bedrooms, bathrooms = plan['bedrooms'], plan['bathrooms']
    bed_text = 'Estudio' if bedrooms == 0 else str(bedrooms) + ' dormitorio' + ('s' if bedrooms != 1 else '')
    bath_text = 'Baños por confirmar' if bathrooms is None else str(bathrooms) + ' baño' + ('s' if bathrooms != 1 else '')
    return bed_text + ' · ' + bath_text

def surface_value(area):
    if area['applicable'] is False:
        return 'No incluye'
    value = area['valueM2']
    return 'Por confirmar' if value is None else f'{value:.2f}'.replace('.', ',') + ' m²'
