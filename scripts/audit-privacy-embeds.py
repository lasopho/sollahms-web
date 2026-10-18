#!/usr/bin/env python3
"""Inventory checked-in fiche embeds and compare their tour hosts to the policy.

This reads local source only. It neither navigates to providers nor certifies
network requests, cookies, legal entities, contracts, or the deployed artifact.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


class EmbedParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.embeds = []

    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        urls = []
        if tag == 'iframe' and attrs.get('src'):
            urls.append(('src', attrs['src']))
        if attrs.get('data-embed-src'):
            urls.append(('data-embed-src', attrs['data-embed-src']))
        seen = set()
        for attribute, url in urls:
            parsed = urlsplit(url)
            if parsed.scheme not in {'', 'http', 'https'} or not parsed.hostname or url in seen:
                continue
            seen.add(url)
            self.embeds.append({
                'tag': tag, 'attribute': attribute, 'url': url,
                'host': parsed.hostname,
                'kind': 'map' if parsed.hostname == 'www.google.com' and parsed.path.startswith('/maps') else 'tour',
            })

    handle_startendtag = handle_starttag


class PolicyParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hosts = []
        self.labels = []
        self._host = None
        self._label = []

    def handle_starttag(self, tag, pairs):
        host = dict(pairs).get('data-privacy-tour-host')
        if host:
            self.hosts.append(host)
            self._host, self._label = host, []

    def handle_data(self, data):
        if self._host is not None:
            self._label.append(data)

    def handle_endtag(self, tag):
        if tag == 'span' and self._host is not None:
            self.labels.append((self._host, ''.join(self._label).strip()))
            self._host = None


def inventory(root=ROOT):
    root = Path(root)
    source = (root / 'data/proyectos.json').read_bytes()
    catalogue = json.loads(source)
    slugs = [project['slug'] for project in catalogue]
    if len(set(slugs)) != len(slugs):
        raise ValueError('Duplicate catalogue slugs prevent a trustworthy inventory')
    if any(not isinstance(slug, str) or not slug or any(c not in 'abcdefghijklmnopqrstuvwxyz0123456789-' for c in slug) for slug in slugs):
        raise ValueError('Unsafe fiche slug')
    embeds = []
    for slug in slugs:
        parser = EmbedParser()
        parser.feed((root / (slug + '.html')).read_text())
        embeds.extend({'slug': slug, **record} for record in parser.embeds)
    policy = PolicyParser()
    policy.feed((root / 'privacidad.html').read_text())
    tour_hosts = sorted({record['host'] for record in embeds if record['kind'] == 'tour'})
    disclosed = sorted(set(policy.hosts))
    missing = sorted(set(tour_hosts) - set(disclosed))
    stale = sorted(set(disclosed) - set(tour_hosts))
    duplicates = sorted({host for host in policy.hosts if policy.hosts.count(host) > 1})
    mislabelled = sorted(host for host, label in policy.labels if host != label)
    if len(policy.labels) != len(policy.hosts):
        mislabelled.append('unclosed-disclosure')
    return {
        'schemaVersion': 1,
        'scope': 'tracked-html-source-not-browser-or-deployment',
        'catalogueSha256': hashlib.sha256(source).hexdigest(),
        'ficheCount': len(slugs), 'embedCount': len(embeds),
        'hosts': sorted({record['host'] for record in embeds}),
        'tourHosts': tour_hosts, 'disclosedTourHosts': disclosed,
        'missingTourHosts': missing, 'staleTourHosts': stale,
        'duplicateDisclosures': duplicates, 'mislabelledDisclosures': mislabelled,
        'policyMatchesSource': not (missing or stale or duplicates or mislabelled),
        'embeds': embeds,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    result = inventory(args.root)
    encoded = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if args.output:
        args.output.write_text(encoded)
        print(json.dumps({key: value for key, value in result.items() if key != 'embeds'}, ensure_ascii=False))
    else:
        print(encoded, end='')
    return 0 if result['policyMatchesSource'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
