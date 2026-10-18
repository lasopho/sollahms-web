#!/usr/bin/env python3
"""Insert only static alternatives beside existing registered embeds.

This migration deliberately does not regenerate tour sections or research.
"""
import argparse
import json
from pathlib import Path
from project_embed_policy import add_persistent_embed_alternatives

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    projects = json.loads((ROOT / 'data/proyectos.json').read_text())
    slugs = [row['slug'] for row in projects]
    assert len(slugs) == len(set(slugs)), 'Duplicated catalogue identities'
    changed = []
    links = 0
    for slug in slugs:
        path = ROOT / (slug + '.html')
        before = path.read_text()
        after = add_persistent_embed_alternatives(before)
        assert add_persistent_embed_alternatives(after) == after, slug + ': migration is not idempotent'
        links += after.count('data-project-embed-alternative>')
        if before != after:
            changed.append((path, after))
    if args.write:
        for path, after in changed:
            path.write_text(after)
    print(json.dumps({'mode': 'write' if args.write else 'dry-run', 'projects': len(slugs),
                      'changed': len(changed), 'persistentAlternatives': links}))


if __name__ == '__main__':
    main()
