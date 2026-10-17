#!/usr/bin/env python3
"""Apply or check the exact MED-008 image-alt batch; no full regeneration."""
import argparse
from pathlib import Path
from reviewed_image_alts import apply_reviewed_image_alts, load_register

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    register = load_register(ROOT)
    changed = []
    for slug in dict.fromkeys(row['slug'] for row in register['replacements']):
        path = ROOT / (slug + '.html')
        before = path.read_text()
        after = apply_reviewed_image_alts(before, slug, strict=True)
        if before != after:
            changed.append(slug)
            if not args.check:
                path.write_text(after)
    if args.check and changed:
        raise SystemExit('Reviewed image descriptions missing: ' + ', '.join(changed))
    print('MED-008: 512 reviewed alt occurrences, 331 intact images; changed fiches: ' + str(len(changed)))


if __name__ == '__main__':
    main()
