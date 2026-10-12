#!/usr/bin/env python3
"""Migrate only catalogue HTML embeds; never write research or global outputs."""
import argparse
import json
from pathlib import Path
from project_embed_policy import FEATURED, normalize_page_embeds

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='Write the scoped HTML changes; default is a dry run')
    parser.add_argument('--slugs', help='Optional comma-separated existing project identifiers')
    args = parser.parse_args()
    projects = json.loads((ROOT / 'data/proyectos.json').read_text())
    research = {record['slug']: record for record in json.loads((ROOT / 'data/fichas-proyectos.json').read_text())}
    slugs = {project['slug'] for project in projects}
    assert len(slugs) == len(projects) and slugs == set(research), 'Catalogue/research coverage differs'
    selected = set(args.slugs.split(',')) if args.slugs else slugs
    assert selected <= slugs, 'Unknown project identifier'
    changes = []
    maps = tours = fallbacks = tour_pages = 0
    for slug in sorted(selected):
        path = ROOT / (slug + '.html')
        before = path.read_text()
        after = normalize_page_embeds(before, research[slug], featured=slug in FEATURED)
        assert normalize_page_embeds(after, research[slug], featured=slug in FEATURED) == after, slug + ': not idempotent'
        maps += after.count('data-project-embed="map"')
        tours += after.count('data-project-embed="tour"')
        fallbacks += after.count('class="project-embed-fallback"')
        tour_pages += 'id="recorrido"' in after
        if before != after:
            changes.append((path, after))
    # Validate every page before writing any page.
    if args.write:
        for path, after in changes:
            path.write_text(after)
    print(json.dumps({'mode': 'write' if args.write else 'dry-run', 'projects': len(selected),
                      'changed': len(changes), 'maps': maps, 'tourPages': tour_pages,
                      'automaticTours': tours, 'externalAlternatives': fallbacks}, ensure_ascii=False))


if __name__ == '__main__':
    main()
