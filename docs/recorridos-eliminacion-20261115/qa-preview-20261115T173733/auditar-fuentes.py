"""Read-only Vercel source audit. This does not certify browser delivery or UI."""
import base64
import collections
import datetime
import hashlib
import json
import os
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from zoneinfo import ZoneInfo

from bs4 import BeautifulSoup

ROOT = Path('/workspace/sollahms-web')
OUT = Path(__file__).resolve().parent
WORK = Path('/workspace/work/qa-preview-final')
DEPLOYMENT = 'dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF'
TEAM = 'team_A9VNIW2f2K1IJpd2pGdvDmEN'
BASE = ROOT / 'docs/recorridos-eliminacion-20261115'


def get_api(path):
    request = urllib.request.Request('https://api.vercel.com' + path,
        headers={'Authorization': 'Bearer ' + os.environ['VERCEL_TOKEN']})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def flatten(nodes, parent=''):
    result = []
    for node in nodes:
        path = '/'.join(filter(None, [parent, node['name']]))
        if 'children' in node:
            result.extend(flatten(node['children'], path))
        else:
            result.append({'file': path, 'sha1': node['uid'], 'mode': node['mode']})
    return result


def main():
    tree = get_api(f'/v6/deployments/{DEPLOYMENT}/files?teamId={TEAM}')
    files = flatten(tree)
    actual = {row['file']: row for row in files}
    candidate = json.loads((BASE / 'candidate-manifest.json').read_text())
    production = json.loads((BASE / 'production-manifest.json').read_text())
    expected = {'src/' + row['file'][8:]: row for row in candidate}
    assert len(actual) == len(files) == len(expected) == 1660
    assert set(actual) == set(expected), 'Deployment paths differ'
    assert all(actual[path]['sha1'] == row['sha'] for path, row in expected.items()), 'Deployment content differs'
    assert all(row['mode'] & 0o170000 == 0o100000 for row in files), 'Unexpected source type'
    unchanged = sum(a == b for a, b in zip(candidate, production))
    assert unchanged == 1594
    function_files = [row for row in files if row['file'].startswith('src/functions/')]
    bundles = sorted({row['file'].split('.func/')[0] + '.func' for row in function_files})
    projects = json.loads((ROOT / 'data/proyectos.json').read_text())
    assert len(projects) == 131
    source_dir = WORK / 'downloaded-fiches'
    source_dir.mkdir(exist_ok=True)

    def inspect(project):
        name = project['slug'] + '.html'
        entry = actual['src/static/' + name]
        payload = get_api(f'/v8/deployments/{DEPLOYMENT}/files/{entry["sha1"]}?teamId={TEAM}')
        content = base64.b64decode(payload['data'])
        assert hashlib.sha1(content).hexdigest() == entry['sha1'], name
        assert content == (ROOT / name).read_bytes(), name + ': repository mismatch'
        (source_dir / name).write_bytes(content)
        text = content.decode()
        soup = BeautifulSoup(text, 'html.parser')
        tours = soup.select('#recorrido,.tour-card,[data-project-embed="tour"],a[href="#recorrido"]')
        assert not tours, name
        assert not re.search(r'recorrido virtual|tour virtual|virtual tour|matterport|Galería y 360°', text, re.I), name
        assert soup.select_one('#galeria img'), name
        assert soup.select_one('header') and soup.select_one('footer'), name
        ids = [node['id'] for node in soup.select('[id]')]
        assert len(ids) == len(set(ids)), name + ': duplicate IDs'
        navigation = soup.select('[data-project-navigation] a[href^="#"]')
        assert all(soup.find(id=link['href'][1:]) for link in navigation), name + ': broken navigation'
        forms = soup.select('form')
        assert forms, name + ': missing contact form'
        return {'file': name, 'sha1': entry['sha1'], 'sourceMatchesRepository': True,
                'tours': 0, 'images': len(soup.select('img')), 'galleryImages': len(soup.select('#galeria img')),
                'plans': len(soup.select('#planos img,#modelos img')),
                'promotionalVideos': len(soup.select('video,iframe[src*="youtube"],iframe[src*="vimeo"]')),
                'mapFrames': len(soup.select('iframe[data-project-embed="map"]')),
                'forms': len(forms),
                'whatsapp': [link['href'] for link in soup.select('a[href*="wa.me/"]')],
                'navigationTargetsExist': True,
                'browserExecutionVerified': False}

    with ThreadPoolExecutor(max_workers=6) as executor:
        fiches = list(executor.map(inspect, projects))
    result = {'checkedAt': datetime.datetime.now(ZoneInfo('America/Santiago')).isoformat(),
              'deployment': DEPLOYMENT, 'deploymentRuntimeCommit': 'c97bfa5aba80329f18e3db8058ec5c3fada80cc4',
              'method': 'Authenticated read-only source API; SHA1 comparison with frozen candidate',
              'sourceFiles': len(files), 'matchingCandidateFiles': len(files),
              'unchangedProductionFiles': unchanged, 'changedProductionFiles': 1660 - unchanged,
              'functionFiles': len(function_files), 'functionBundles': bundles,
              'fichesInspected': len(fiches), 'sourceAuditPassed': True,
              'remoteBrowserFichesInspected': 0, 'remoteResponsiveChecks': 0,
              'historicalLocalResponsiveChecks': 393, 'new320pxCheckCompleted': False,
              'formsSubmitted': 0, 'files': fiches}
    (OUT / 'fuentes-fichas.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    (OUT / 'manifiesto-fuentes-verificado.json').write_text(json.dumps(files, indent=2) + '\n')
    print(json.dumps({key: value for key, value in result.items() if key != 'files'}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
