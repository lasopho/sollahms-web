#!/usr/bin/env python3
"""Filtros SEO/GEO offline v2; conserva importaciones y observaciones originales.

El registro es una lista positiva exacta. Solo se retiran fragmentos al clasificar
URL; cualquier query, alias de host, esquema o ruta desconocida queda fuera.
Los hashes garantizan integridad local, no autenticidad del informe del motor.
"""
import argparse
import copy
import csv
import importlib.util
import json
import tempfile
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

_spec = importlib.util.spec_from_file_location(
    'seo_measurement_legacy', Path(__file__).with_name('seo_measurement.py'))
legacy = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(legacy)

SCOPE_FILTER_ID = 'seo_measurement_scope_id'
SCOPE_FILTER_HASH = 'seo_measurement_scope_sha256'
CONTEXTS = {'corporate', 'project_only', 'none', 'unclear'}


def canonical_candidate(value):
    """No normaliza alias, parámetros ni rutas; un fragmento no cambia página."""
    if not isinstance(value, str) or value != value.strip():
        return None
    u = urlsplit(value)
    if u.scheme != 'https' or u.netloc != 'sollahms.cl' or u.query:
        return None
    return urlunsplit((u.scheme, u.netloc, u.path, '', ''))


def load_scope(path):
    raw = Path(path).read_bytes()
    scope = json.loads(raw)
    if scope.get('scope_version') != 2 or not isinstance(scope.get('scope_id'), str) or not scope['scope_id']:
        legacy.fail('Registro de alcance v2 inválido')
    seen = set()
    for field in ('included_urls', 'excluded_project_urls', 'technical_noncontent_urls'):
        urls = scope.get(field)
        if not isinstance(urls, list) or len(urls) != len(set(urls)):
            legacy.fail('Lista de URL ausente o duplicada: ' + field)
        for url in urls:
            if canonical_candidate(url) != url or url in seen:
                legacy.fail('URL no canónica o categorías solapadas en el registro')
            seen.add(url)
    if not scope['included_urls']:
        legacy.fail('El alcance requiere una lista positiva no vacía')
    return scope, legacy.digest(raw)


def scope_label(scope, sha):
    return {'scope_id': scope['scope_id'], 'scope_sha256': sha}


def classify(url, scope):
    candidate = canonical_candidate(url)
    for field, category in (('included_urls', 'included'),
                            ('excluded_project_urls', 'excluded_project'),
                            ('technical_noncontent_urls', 'technical_noncontent')):
        if candidate is not None and candidate in scope[field]:
            return category
    return 'unknown'


def load_record(path):
    raw = Path(path).read_bytes()
    record = json.loads(raw)
    if record.get('schema_version') != legacy.VERSION or not isinstance(record.get('manifest'), dict) or not isinstance(record.get('rows'), list):
        legacy.fail('Usar una importación normalizada del sistema existente')
    if record['manifest'].get('source') not in {'google_search_console', 'bing_webmaster_tools'}:
        legacy.fail('Fuente no admitida')
    for field in ('csv_sha256', 'manifest_sha256'):
        if not isinstance(record.get(field), str) or len(record[field]) != 64:
            legacy.fail('Falta hash de procedencia: ' + field)
    return record, legacy.digest(raw)


def segment(input_path, scope_path):
    scope, sha = load_scope(scope_path)
    record, input_sha = load_record(input_path)
    kind = record.get('kind')
    if kind == 'performance_export' and record['manifest'].get('dimension') == 'page':
        field = 'dimension_value'
    elif kind == 'indexation_export':
        field = 'url'
    else:
        legacy.fail('Segmentar solo tablas por página o estados de indexación; nunca sumar páginas como serie diaria')
    result = {k: copy.deepcopy(record[k]) for k in
              ('schema_version', 'kind', 'manifest', 'csv_sha256', 'manifest_sha256', 'warnings', 'note') if k in record}
    counts = {k: 0 for k in ('included', 'excluded_project', 'technical_noncontent', 'unknown')}
    selected, unknown = [], set()
    for row in record['rows']:
        category = classify(row[field], scope)
        counts[category] += 1
        if category == 'included':
            selected.append(copy.deepcopy(row))
        elif category == 'unknown':
            unknown.add(row[field])
    result.update(rows=selected, measurement_scope=scope_label(scope, sha),
                  normalized_input_sha256=input_sha,
                  selection={'row_counts': counts, 'unknown_urls': sorted(unknown),
                             'coverage': 'partial_page_table',
                             'metrics_status': 'rows_only' if selected else 'unknown',
                             'native_scoped_total': False,
                             'daily_comparison_eligible': False})
    result['scope_note'] = ('Tabla filtrada y potencialmente parcial: no acredita totales nativos del alcance. '
                            'No sumar sus filas para construir series diarias ni sustituir datos ausentes por cero.')
    return result


def bind_daily(input_path, scope_path, proof_path):
    scope, sha = load_scope(scope_path)
    record, input_sha = load_record(input_path)
    if record.get('kind') != 'performance_export' or record['manifest'].get('dimension') != 'date':
        legacy.fail('La vinculación requiere una serie diaria normalizada')
    proof_raw = Path(proof_path).read_bytes()
    proof = json.loads(proof_raw)
    if proof.get('method') != 'native_exact_allowlist' or proof.get('reviewed_by_operator') is not True:
        legacy.fail('Falta revisión humana de un filtro nativo con la lista positiva exacta')
    for field in ('source', 'property'):
        if proof.get(field) != record['manifest'].get(field):
            legacy.fail('La procedencia del justificante no coincide: ' + field)
    urls = proof.get('included_urls')
    if not isinstance(urls, list) or len(urls) != len(set(urls)) or set(urls) != set(scope['included_urls']):
        legacy.fail('El filtro nativo debe incluir exactamente las URL positivas del registro')
    if not isinstance(proof.get('evidence_file'), str) or not proof['evidence_file']:
        legacy.fail('Falta evidencia original del filtro nativo')
    evidence = (Path(proof_path).resolve().parent / proof['evidence_file']).resolve()
    if not evidence.is_file() or legacy.digest(evidence.read_bytes()) != proof.get('evidence_sha256'):
        legacy.fail('Evidencia ausente o hash del justificante incorrecto')
    result = copy.deepcopy(record)
    label = scope_label(scope, sha)
    if 'measurement_scope' in result and result['measurement_scope'] != label:
        legacy.fail('La importación ya declara otro alcance')
    filters = result['manifest'].get('filters')
    if not isinstance(filters, dict):
        legacy.fail('La importación no conserva sus filtros originales')
    for key, value in ((SCOPE_FILTER_ID, scope['scope_id']), (SCOPE_FILTER_HASH, sha)):
        if key in filters and filters[key] != value:
            legacy.fail('Filtro de alcance incompatible')
        filters[key] = value
    result.update(measurement_scope=label,
                  scope_binding={'method': proof['method'], 'reviewed_by_operator': True,
                                 'normalized_input_sha256': input_sha,
                                 'proof_sha256': legacy.digest(proof_raw),
                                 'evidence_file': str(evidence),
                                 'evidence_sha256': proof['evidence_sha256'],
                                 'note': 'Integridad local y declaración del operador; el hash no autentica la exportación ni su filtro.'})
    return result


def compare(input_paths, end, scope_path):
    scope, sha = load_scope(scope_path)
    label = scope_label(scope, sha)
    if not input_paths:
        legacy.fail('Falta serie diaria vinculada')
    for path in input_paths:
        record, _ = load_record(path)
        binding = record.get('scope_binding', {})
        filters = record['manifest'].get('filters', {})
        if (record.get('measurement_scope') != label or
                filters.get(SCOPE_FILTER_ID) != scope['scope_id'] or
                filters.get(SCOPE_FILTER_HASH) != sha or
                binding.get('method') != 'native_exact_allowlist' or
                binding.get('reviewed_by_operator') is not True):
            legacy.fail('Serie global, alcance distinto o vinculación nativa no revisada; no restar fichas')
    result = legacy.compare(input_paths, end)
    result['measurement_scope'] = label
    result['note'] = 'Comparación del alcance con filtro nativo revisado; conserva las reglas originales de cobertura de 30/90 días.'
    return result


def eligible_urls(value, scope):
    return [url.strip() for url in value.split('|')
            if url.strip() and classify(url.strip(), scope) == 'included']


def ai_summary(csv_path, scope_path):
    scope, sha = load_scope(scope_path)
    prompts = scope.get('ai_prompt_ids')
    if (not isinstance(prompts, list) or not prompts or
            any(not isinstance(prompt, str) or not prompt.strip() for prompt in prompts) or
            len(prompts) != len(set(prompts))):
        legacy.fail('El alcance de IA requiere identificadores de consultas registrados, no vacíos ni duplicados')
    # Valida primero las observaciones y evidencia originales, sin modificarlas.
    legacy.ai_summary(csv_path)
    raw, reader = legacy.read_csv(csv_path)
    names = reader.fieldnames or []
    required = {'prompt_version', 'measurement_scope_id', 'mention_context', 'recommendation_context'}
    if not required <= set(names) or len(names) != len(set(names)):
        legacy.fail('La matriz v2 requiere versión, alcance y contextos explícitos')
    rows, unknown = [], {}
    for original in reader:
        if None in original or any(v is None for v in original.values()):
            legacy.fail('Fila de IA mal formada')
        if original['prompt_version'] != '2' or original['measurement_scope_id'] != scope['scope_id']:
            legacy.fail('No mezclar el protocolo histórico v1 ni otro alcance con v2')
        if original['prompt_id'] not in prompts:
            legacy.fail('Consulta de IA no registrada en el protocolo corporativo v2')
        row = dict(original)
        if row['status'] == 'executed':
            group_key = tuple(row[k] for k in ('platform', 'prompt_id', 'prompt_version', 'country', 'account_context', 'mode'))
            counters = unknown.setdefault(group_key, {flag: 0 for flag in ('mention', 'recommendation', 'link', 'citation')})
            for flag in ('mention', 'recommendation'):
                context = row[flag + '_context']
                if context not in CONTEXTS:
                    legacy.fail('Contexto corporativo de IA ausente o no admitido')
                if context == 'unclear':
                    counters[flag] += 1
                row[flag] = '1' if row[flag] == '1' and context == 'corporate' else '0'
            for flag, field in (('link', 'linked_urls'), ('citation', 'cited_urls')):
                references = [url.strip() for url in row.get(field, '').split('|') if url.strip()]
                selected = eligible_urls(row.get(field, ''), scope)
                if row[flag] == '1' and not selected and any(classify(url, scope) == 'unknown' for url in references):
                    counters[flag] += 1
                row[field] = ' | '.join(selected)
                row[flag] = '1' if row[flag] == '1' and selected else '0'
            row['evidence_file'] = str((Path(csv_path).resolve().parent / row['evidence_file']).resolve())
        rows.append(row)
    # La copia efímera solo cambia contexto/URL elegibles; siempre apunta a la
    # evidencia original, cuyo hash el validador existente vuelve a comprobar.
    with tempfile.TemporaryDirectory(prefix='sollahms-scope-') as tmp:
        derived = Path(tmp) / 'scoped.csv'
        with derived.open('w', newline='', encoding='utf-8') as handle:
            writer = csv.DictWriter(handle, fieldnames=names)
            writer.writeheader()
            writer.writerows(rows)
        result = legacy.ai_summary(derived)
    for group in result['groups']:
        group_key = tuple(group[k] for k in ('platform', 'prompt_id', 'prompt_version', 'country', 'account_context', 'mode'))
        counts = unknown.get(group_key, {flag: 0 for flag in ('mention', 'recommendation', 'link', 'citation')})
        group['unknown_context_runs'] = {flag: counts[flag] for flag in ('mention', 'recommendation')}
        group['unknown_reference_runs'] = {flag: counts[flag] for flag in ('link', 'citation')}
        group['classified_runs'] = {}
        for flag in ('mention', 'recommendation', 'link', 'citation'):
            denominator = group['measured_runs'] - counts[flag]
            group['classified_runs'][flag] = denominator
            group['rates'][flag] = group[flag] / denominator if denominator else None
        group['repeat_sample_complete'] = (group['repeat_sample_complete'] and not any(counts.values()))
    return {'schema_version': 2, 'kind': 'scoped_ai_summary',
            'original_csv_sha256': legacy.digest(raw),
            'measurement_scope': scope_label(scope, sha), 'groups': result['groups'],
            'note': ('Frecuencias condicionadas del protocolo v2, no ranking general. Solo menciones y recomendaciones '
                     'corporativas y URL incluidas. Contexto unclear o referencias positivas sin URL clasificable no equivalen '
                     'a ausencia y se excluyen del denominador correspondiente; pruebas no ejecutadas no puntúan.')}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for command in ('segment', 'bind-daily', 'compare', 'ai-summary'):
        p = sub.add_parser(command)
        p.add_argument('--scope', required=True)
        p.add_argument('--output', required=True)
        if command == 'ai-summary':
            p.add_argument('--csv', required=True)
        else:
            p.add_argument('--input', required=True, nargs='+' if command == 'compare' else None)
        if command == 'bind-daily':
            p.add_argument('--proof', required=True)
        if command == 'compare':
            p.add_argument('--end', required=True)
    args = parser.parse_args()
    try:
        if args.command == 'segment':
            result = segment(args.input, args.scope)
        elif args.command == 'bind-daily':
            result = bind_daily(args.input, args.scope, args.proof)
        elif args.command == 'compare':
            result = compare(args.input, args.end, args.scope)
        else:
            result = ai_summary(args.csv, args.scope)
        legacy.save(result, args.output)
    except (ValueError, KeyError, TypeError, OSError, csv.Error) as error:
        parser.exit(2, f'No se procesó el alcance: {error}\n')
    print(f'Guardado: {args.output}')


if __name__ == '__main__':
    main()
