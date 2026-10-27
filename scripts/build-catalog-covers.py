#!/usr/bin/env python3
"""Reuse verified local detail photos as catalogue covers. No network or new media."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
projects_path = ROOT / 'data/proyectos.json'
projects = json.loads(projects_path.read_text())
overrides = json.loads((ROOT / 'data/project-cover-overrides.json').read_text())
records = {r['slug']: r for r in json.loads((ROOT / 'data/fichas-proyectos.json').read_text())}
with_photos = 0
for project in projects:
    record = records[project['slug']]
    page = (ROOT / project['detalleUrl'].lstrip('/')).read_text()
    # Keep the four existing principal images already used by their featured pages.
    chosen = overrides.get(project['slug'], {})
    path = chosen.get('path') or project.get('imagenPrincipal')
    alt = chosen.get('alt') or project.get('imagenAlt')
    if not path:
        image = next((i for i in record.get('images', []) if i.get('localPath') and i.get('sourceUrl', '').startswith('https://')), None)
        path = image.get('localPath') if image else None
        alt = image.get('alt') if image else None
    if path:
        assert path.startswith('/assets/propiedades/') and (ROOT / path.lstrip('/')).is_file(), project['slug'] + ': cover file missing'
        assert path in page, project['slug'] + ': cover does not belong to its detail page'
        with_photos += 1
    project['imagenPrincipal'] = path
    project['imagenAlt'] = (alt or 'Fotografía del proyecto ' + project['nombre']) if path else None
projects_path.write_text(json.dumps(projects, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'projects': len(projects), 'officialCovers': with_photos, 'placeholders': len(projects) - with_photos, 'downloads': 0}))
