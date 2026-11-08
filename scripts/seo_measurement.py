#!/usr/bin/env python3
"""Medición offline. Sin red, servicios, secretos ni dependencias externas."""
import argparse
import csv
import hashlib
import io
import json
import math
import re
import unicodedata
from datetime import date, datetime, timedelta
from pathlib import Path
from urllib.parse import urlsplit

VERSION = 1

def fail(message):
    raise ValueError(message)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def key(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', text.casefold()) if not unicodedata.combining(c)).strip()

ALIASES = {
    'clicks': ['clicks', 'clics'],
    'impressions': ['impressions', 'impresiones'],
    'ctr': ['ctr', 'click-through rate', 'tasa de clics'],
    'position': ['position', 'posicion', 'average position', 'posicion media', 'avg. position', 'avg. click position', 'average click position'],
    'date': ['date', 'fecha'],
    'page': ['page', 'pages', 'pagina', 'paginas', 'top pages', 'paginas principales', 'url'],
    'query': ['query', 'queries', 'consulta', 'consultas', 'top queries', 'consultas principales', 'keyword', 'palabra clave'],
    'country': ['country', 'countries', 'pais', 'paises'],
    'device': ['device', 'devices', 'dispositivo', 'dispositivos'],
}
LOOKUP = {key(a): field for field, names in ALIASES.items() for a in names}

def number(value, locale, percent=False):
    s = value.strip().replace('\u00a0', '').replace(' ', '')
    if not s or s in {'-', '—', 'N/A'}:
        return None
    marked = s.endswith('%')
    s = s.rstrip('%')
    if locale == 'es':
        s = s.replace('.', '').replace(',', '.')
    else:
        s = s.replace(',', '')
    n = float(s)
    if not math.isfinite(n) or n < 0:
        fail('Número negativo o no finito')
    return n / 100 if marked else n

def iso_day(value):
    # Fechas ambiguas día/mes se convierten explícitamente antes de importar.
    return date.fromisoformat(value).isoformat()

def load_manifest(path):
    m = json.loads(Path(path).read_text())
    required = {'source', 'property', 'report', 'dimension', 'filters', 'country', 'search_type',
                'timezone', 'period_start', 'period_end', 'extracted_at', 'coverage_complete', 'locale', 'origin'}
    if not required <= m.keys():
        fail('Faltan campos de procedencia: ' + ', '.join(sorted(required - m.keys())))
    if m['source'] not in {'google_search_console', 'bing_webmaster_tools'}:
        fail('Fuente no admitida')
    if m['dimension'] not in {'date', 'page', 'query', 'country', 'device'} or m['locale'] not in {'en', 'es'}:
        fail('Dimensión o locale no admitido')
    if m['report'] != 'search_performance' or not isinstance(m['filters'], dict):
        fail('Usar un informe de rendimiento; indexación se registra por separado')
    if m['origin'] not in {'real_export', 'synthetic_test'} or type(m['coverage_complete']) is not bool:
        fail('Origen o cobertura inválidos')
    if not m['property'] or not m['timezone'] or not m['search_type']:
        fail('Propiedad, zona y tipo de búsqueda obligatorios')
    if iso_day(m['period_start']) > iso_day(m['period_end']):
        fail('Periodo invertido')
    if datetime.fromisoformat(m['extracted_at'].replace('Z', '+00:00')).tzinfo is None:
        fail('extracted_at requiere zona horaria')
    return m

def read_csv(path):
    raw = Path(path).read_bytes()
    text = raw.decode('utf-8-sig')
    # Se admiten CSV UTF-8 y TSV; no XLSX/ZIP/UTF-16 silenciosamente.
    dialect = csv.Sniffer().sniff(text[:8192], delimiters=',;\t')
    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    return raw, reader

def import_performance(csv_path, manifest_path):
    m = load_manifest(manifest_path)
    raw, reader = read_csv(csv_path)
    names = reader.fieldnames or []
    if len(names) != len(set(names)):
        fail('Cabeceras duplicadas')
    columns = {name: LOOKUP.get(key(name)) for name in names}
    recognized = [v for v in columns.values() if v]
    if len(recognized) != len(set(recognized)):
        fail('Dos columnas equivalentes')
    needed = {m['dimension'], 'clicks', 'impressions'}
    if not needed <= set(recognized):
        fail('Faltan columnas: ' + ', '.join(sorted(needed - set(recognized))))
    rows, seen, warnings = [], set(), []
    for line, source in enumerate(reader, 2):
        if None in source or any(v is None for v in source.values()):
            fail(f'Fila {line}: número de columnas inválido')
        r = {columns[c]: v.strip() for c, v in source.items() if columns.get(c)}
        dim = m['dimension']
        value = r[dim]
        if not value or value in seen:
            fail(f'Fila {line}: dimensión vacía o duplicada; no sumar exportaciones solapadas')
        seen.add(value)
        if dim == 'date':
            value = iso_day(value)
            if not m['period_start'] <= value <= m['period_end']:
                fail(f'Fila {line}: fecha fuera del periodo')
        if dim == 'page':
            u = urlsplit(value)
            if u.scheme != 'https' or u.hostname not in {'sollahms.cl', 'www.sollahms.cl'} or u.query or u.fragment or u.username or u.password:
                fail(f'Fila {line}: usar URL canónica pública sin parámetros ni datos personales')
        clicks, impressions = number(r['clicks'], m['locale']), number(r['impressions'], m['locale'])
        if clicks is None or impressions is None or int(clicks) != clicks or int(impressions) != impressions:
            fail(f'Fila {line}: clics/impresiones deben ser enteros explícitos')
        if clicks > impressions:
            fail(f'Fila {line}: clics superiores a impresiones')
        position = number(r.get('position', ''), m['locale'])
        if impressions == 0:
            position = None
        if position is not None and position < 1:
            fail(f'Fila {line}: posición media inferior a 1')
        ctr = clicks / impressions if impressions else None
        reported = number(r.get('ctr', ''), m['locale'])
        if reported is not None and (reported > 1 or (ctr is not None and abs(reported - ctr) > 0.001)):
            fail(f'Fila {line}: CTR incompatible; revisar locale y escala')
        rows.append({'dimension_value': value, 'clicks': int(clicks), 'impressions': int(impressions),
                     'ctr': ctr, 'position': position})
    if not rows:
        fail('Archivo sin filas: no convertir ausencia de datos en cero')
    if m['dimension'] != 'date':
        warnings.append('Tabla de dimensiones limitada/anonimizada: no representa necesariamente totales de la propiedad.')
    return {'schema_version': VERSION, 'kind': 'performance_export', 'manifest': m,
            'csv_sha256': digest(raw), 'manifest_sha256': digest(Path(manifest_path).read_bytes()),
            'warnings': warnings, 'rows': rows}

def import_indexation(csv_path, manifest_path):
    m = json.loads(Path(manifest_path).read_text())
    needed = {'source', 'property', 'extracted_at', 'origin', 'report', 'scope', 'coverage_complete'}
    if not needed <= m.keys() or m['source'] not in {'google_search_console', 'bing_webmaster_tools'} or m['report'] != 'indexation':
        fail('Manifiesto de indexación incompleto')
    if m['origin'] not in {'real_export', 'synthetic_test'} or type(m['coverage_complete']) is not bool:
        fail('Origen/cobertura inválido')
    if datetime.fromisoformat(m['extracted_at'].replace('Z', '+00:00')).tzinfo is None:
        fail('extracted_at requiere zona')
    raw, reader = read_csv(csv_path)
    required = {'url', 'status', 'reason', 'last_crawl', 'selected_canonical', 'evidence_reference'}
    if set(reader.fieldnames or []) != required:
        fail('Normalizar cobertura al CSV documentado, conservando export original y hash')
    rows, seen = [], set()
    for r in reader:
        if None in r or any(v is None for v in r.values()):
            fail('Fila de cobertura mal formada')
        u = urlsplit(r['url'])
        if u.scheme != 'https' or u.hostname not in {'sollahms.cl', 'www.sollahms.cl'} or u.query or u.fragment or u.username or u.password:
            fail('URL de cobertura inválida')
        if r['url'] in seen or r['status'] not in {'indexed', 'not_indexed', 'unknown'} or not r['evidence_reference']:
            fail('Estado duplicado, inválido o sin referencia a la exportación/inspección')
        if r['last_crawl']:
            datetime.fromisoformat(r['last_crawl'].replace('Z', '+00:00'))
        seen.add(r['url']);rows.append(r)
    if not rows:
        fail('Cobertura sin filas no es cero indexadas')
    return {'schema_version': VERSION, 'kind': 'indexation_export', 'manifest': m,
            'csv_sha256': digest(raw), 'manifest_sha256': digest(Path(manifest_path).read_bytes()), 'rows': rows,
            'note': 'Estados del motor según export/inspección; nunca derivados de HTTP 200. Listas de ejemplos pueden ser parciales.'}

def scope(m):
    result = {k: m[k] for k in ['source', 'property', 'report', 'dimension', 'filters', 'country', 'search_type', 'timezone', 'origin']}
    result['position_definition'] = m.get('position_definition', 'source_report_default')
    return result

def aggregate(rows):
    clicks = sum(r['clicks'] for r in rows)
    impressions = sum(r['impressions'] for r in rows)
    position_complete = all(r['position'] is not None for r in rows if r['impressions'])
    return {'clicks': clicks, 'impressions': impressions,
            'ctr': clicks / impressions if impressions else None,
            'position': sum(r['position'] * r['impressions'] for r in rows if r['impressions']) / impressions
            if impressions and position_complete else None,
            'position_note': 'Aproximación ponderada desde medias exportadas; sujeta al redondeo del origen.'}

def compare(paths, end):
    records = [json.loads(Path(p).read_text()) for p in paths]
    if not records:
        fail('Falta importación')
    first = scope(records[0]['manifest'])
    rows = {}
    for rec in records:
        if rec.get('kind') != 'performance_export' or scope(rec['manifest']) != first:
            fail('No mezclar fuentes, dimensiones, filtros, zonas ni datos sintéticos/reales')
        if first['dimension'] != 'date' or not rec['manifest']['coverage_complete']:
            fail('Comparaciones requieren serie diaria completa declarada; no sumar consultas/páginas')
        for r in rec['rows']:
            if r['dimension_value'] in rows:
                fail('Fechas solapadas: seleccionar una sola versión del export')
            rows[r['dimension_value']] = r
    last = date.fromisoformat(end)
    result = {'schema_version': VERSION, 'scope': first, 'last_complete_day': end,
              'input_csv_sha256': [r['csv_sha256'] for r in records], 'windows': {}}
    for size in (30, 90):
        start = last - timedelta(days=size - 1)
        previous_start = start - timedelta(days=size)
        current_days = [(start + timedelta(days=i)).isoformat() for i in range(size)]
        previous_days = [(previous_start + timedelta(days=i)).isoformat() for i in range(size)]
        missing = [d for d in previous_days + current_days if d not in rows]
        w = {'current_start': current_days[0], 'current_end': current_days[-1],
             'previous_start': previous_days[0], 'previous_end': previous_days[-1]}
        if missing:
            w.update(status='insufficient_coverage', missing_days=missing, current=None, previous=None, delta=None)
        else:
            a, b = aggregate([rows[d] for d in current_days]), aggregate([rows[d] for d in previous_days])
            delta = {}
            for metric in ('clicks', 'impressions', 'ctr', 'position'):
                now, old = a[metric], b[metric]
                delta[metric] = {'absolute': now - old if now is not None and old is not None else None,
                                 'relative': (now / old - 1) if now is not None and old not in (None, 0) else None}
            w.update(status='measured', current=a, previous=b, delta=delta)
        result['windows'][str(size)] = w
    return result

def ai_summary(path):
    raw, reader = read_csv(path)
    groups, seen = {}, set()
    for r in reader:
        identity = r['run_id']
        if not identity or identity in seen:
            fail('run_id vacío o duplicado')
        seen.add(identity)
        if r['platform'] not in {'chatgpt_search', 'gemini', 'perplexity', 'google_ai_overviews', 'google_ai_mode'}:
            fail('Plataforma desconocida')
        if r['status'] not in {'executed', 'blocked', 'not_run', 'unavailable'}:
            fail('Estado de IA desconocido')
        gkey = (r['platform'], r['prompt_id'], r['prompt_version'], r['country'], r['account_context'], r['mode'])
        g = groups.setdefault(gkey, {'platform': gkey[0], 'prompt_id': gkey[1], 'prompt_version': gkey[2],
                                    'country': gkey[3], 'account_context': gkey[4], 'mode': gkey[5],
                                    'measured_runs': 0, 'unmeasured_runs': 0, 'dates': [],
                                    'mention': 0, 'link': 0, 'citation': 0, 'recommendation': 0})
        if r['status'] != 'executed':
            if any(r.get(f, '') for f in ('mention', 'link', 'citation', 'recommendation')):
                fail('No rellenar resultados para una prueba no ejecutada')
            g['unmeasured_runs'] += 1
            continue
        if not r['observed_at'] or not all(r.get(k) for k in ('country', 'account_context', 'mode', 'model', 'evidence_file', 'evidence_sha256')):
            fail('Prueba ejecutada sin condiciones/evidencia')
        stamp = datetime.fromisoformat(r['observed_at'].replace('Z', '+00:00'))
        if stamp.tzinfo is None:
            fail('Fecha de IA sin zona')
        evidence = Path(path).parent / r['evidence_file']
        if not evidence.is_file() or digest(evidence.read_bytes()) != r['evidence_sha256']:
            fail('Falta respuesta/captura o su hash no coincide')
        flags = {f: r[f] for f in ('mention', 'link', 'citation', 'recommendation')}
        if any(v not in {'0', '1'} for v in flags.values()):
            fail('Resultados deben ser 0 o 1 solo en pruebas ejecutadas')
        if flags['link'] == '1' and not r.get('linked_urls'):
            fail('Enlace sin URL')
        if flags['citation'] == '1' and not r.get('cited_urls'):
            fail('Cita sin URL')
        for f, v in flags.items():
            g[f] += int(v)
        g['dates'].append(stamp.date().isoformat())
        g['measured_runs'] += 1
    for g in groups.values():
        g['distinct_dates'] = len(set(g.pop('dates')))
        g['rates'] = {f: g[f] / g['measured_runs'] if g['measured_runs'] else None
                      for f in ('mention', 'link', 'citation', 'recommendation')}
        g['repeat_sample_complete'] = g['measured_runs'] >= 3 and g['distinct_dates'] >= 3
    return {'schema_version': VERSION, 'observations_sha256': digest(raw), 'groups': list(groups.values()),
            'note': 'Frecuencia en muestra condicionada; no ranking general. Una sola conversación no acredita consistencia.'}

def save(result, target):
    p = Path(target)
    data = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    if p.exists():
        if p.read_text() != data:
            fail('El destino ya contiene otra medición: usar otro nombre para conservar historia')
        return
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open('x') as f:
        f.write(data)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('import-performance');p.add_argument('--csv', required=True);p.add_argument('--manifest', required=True);p.add_argument('--output', required=True)
    p = sub.add_parser('import-indexation');p.add_argument('--csv', required=True);p.add_argument('--manifest', required=True);p.add_argument('--output', required=True)
    p = sub.add_parser('compare');p.add_argument('--input', nargs='+', required=True);p.add_argument('--end', required=True);p.add_argument('--output', required=True)
    p = sub.add_parser('ai-summary');p.add_argument('--csv', required=True);p.add_argument('--output', required=True)
    a = parser.parse_args()
    try:
        if a.command == 'import-performance': result = import_performance(a.csv, a.manifest)
        elif a.command == 'import-indexation': result = import_indexation(a.csv, a.manifest)
        elif a.command == 'compare': result = compare(a.input, a.end)
        else: result = ai_summary(a.csv)
        save(result, a.output)
    except (ValueError, KeyError, OSError, csv.Error) as e:
        parser.exit(2, f'No se importó: {e}\n')
    print(f'Guardado: {a.output}')

if __name__ == '__main__':
    main()
