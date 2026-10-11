#!/usr/bin/env python3
"""Import a reviewed research batch without assigning unverified historical facts."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIELDS = {'nombre', 'inmobiliaria', 'comuna', 'region', 'direccion', 'estado', 'entrega', 'tipologias', 'precioDesdeUF', 'amenities', 'descripcionLarga', 'superficieDesdeM2', 'mapQuery', 'etapas', 'tipoActivo'}
COMMERCIAL = {'comuna', 'region', 'direccion', 'estado', 'entrega', 'tipologias', 'precioDesdeUF', 'amenities', 'descripcionLarga', 'superficieDesdeM2', 'mapQuery', 'etapas'}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input', type=Path)
    parser.add_argument('--image-cache', type=Path)
    args = parser.parse_args()
    projects = json.loads((ROOT / 'data/proyectos.json').read_text())
    records = json.loads((ROOT / 'data/fichas-proyectos.json').read_text())
    original_path = ROOT / 'data/catalogo-original-fichas.json'
    if not original_path.exists():
        original_path.write_text(json.dumps(projects, ensure_ascii=False, indent=2) + '\n')
    original = {p['slug']: p for p in json.loads(original_path.read_text())}
    incoming = json.loads(args.input.read_text())
    by_slug = {r['slug']: r for r in incoming}
    assert len(incoming) == len(by_slug), 'Duplicate slugs in research batch'
    assert set(by_slug) <= {p['slug'] for p in projects}, 'Research changes catalogue membership'
    asset_manifest = json.loads((args.image_cache / 'manifest.json').read_text()) if args.image_cache else {}
    provenance_path = ROOT / 'data/fuentes-imagenes.json'
    provenance = json.loads(provenance_path.read_text()) if provenance_path.exists() else {}
    destination = ROOT / 'assets/propiedades/catalogo'
    destination.mkdir(parents=True, exist_ok=True)
    for research in incoming:
        assert research.get('checkedAt') == '2026-10-09', 'Explicit review date required'
        assert research.get('sourceStatus') in {'verified', 'unavailable', 'not_found'}, 'Research still in progress'
        assert set(research.get('updates', {})) <= FIELDS, 'Unexpected fields in updates'
        assert isinstance(research.get('verifiedFields'), list)
        research['reviewedOriginal'] = {key: original[research['slug']].get(key) for key in FIELDS if key in original[research['slug']]}
        research['originalImages'] = research.get('images', [])
        if args.image_cache:
            usable = []
            for img in research['originalImages'][:4]:
                cached = asset_manifest.get(img['url'], {})
                if cached.get('status') != 'downloaded':
                    continue
                source = args.image_cache / cached['file']
                if not source.is_file():
                    continue
                shutil.copyfile(source, destination / cached['file'])
                local = dict(img, localPath='/assets/propiedades/catalogo/' + cached['file'], width=cached['width'], height=cached['height'])
                usable.append(local)
                provenance[img['url']] = dict(cached, localSha256=hashlib.sha256(source.read_bytes()).hexdigest(), localPath=local['localPath'], sourceUrl=img['sourceUrl'], checkedAt='2026-10-09')
            research['images'] = usable
            if not usable and research['originalImages']:
                research['pendingFields'] = list(dict.fromkeys(research.get('pendingFields', []) + ['Disponibilidad de fotografías oficiales descargables']))
    for project in projects:
        if project['slug'] not in by_slug:
            continue
        research = by_slug[project['slug']]
        verified = set(research['verifiedFields'])
        updates = research.get('updates', {})
        for key in COMMERCIAL:
            if key in verified:
                project[key] = updates.get(key, original[project['slug']].get(key))
            elif key == 'tipologias' or key == 'amenities':
                project[key] = []
            elif key == 'etapas':
                project.pop(key, None)
            else:
                project[key] = None
        for key in (FIELDS - COMMERCIAL):
            if key in verified and key in updates and updates[key] is not None:
                project[key] = updates[key]
        project['verificacion'] = {'fecha': research['checkedAt'], 'fuente': research.get('sourceUrl'), 'estadoFuente': research['sourceStatus'], 'camposVerificados': research['verifiedFields']}
    records = [by_slug.get(record['slug'], record) for record in records]
    (ROOT / 'data/proyectos.json').write_text(json.dumps(projects, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'data/fichas-proyectos.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    provenance_path.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'batch': len(incoming), 'reviewed': sum(r.get('sourceStatus') != 'research_pending' for r in records), 'localOfficialImages': len(provenance)}))

if __name__ == '__main__':
    main()
