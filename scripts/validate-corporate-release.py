"""Fail-closed allowlist for the owner-approved corporate SEO artifact.

This never invokes or weakens the historical protected-review packager.
It validates the frozen production inputs plus nine exact approved overlays.
"""
from pathlib import Path
import copy, hashlib, json

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/seo-corporate-20261029'
BASE = ROOT / 'docs/euro-20261029/deployment-files.json'
CANDIDATE = DOC / 'deployment-files.json'
BASE_SHA256 = '707780481f1dcb92459beaada96d444567482c37f907e34081b21914c92b066b'
CANDIDATE_SHA256 = 'e5169c9928f8f0b3cc02b9318830c7dab28ec17af8f1c9e692b4eefd33c0cf96'
PAGES = ['index.html', 'contacto.html', 'agenda-asesoria.html',
         'guia-hipotecaria.html', 'comparador-hipotecario.html',
         'cuando-comprar-propiedad.html', 'trabaja-con-nosotros.html', 'privacidad.html']
ALLOWED = {'release/static/' + x for x in PAGES + ['sitemap.xml']}
digest = lambda b: hashlib.sha256(b).hexdigest()

def indexed(entries):
    result = {}
    for item in entries:
        path = item['file']
        assert path not in result, 'Duplicate package path'
        assert not path.startswith('/') and '..' not in Path(path).parts, 'Unsafe package path'
        assert ('data' in item) != ('sha' in item), 'Ambiguous artifact bytes'
        result[path] = item
    return result

def validate(base_entries, candidate_entries):
    base, candidate = indexed(base_entries), indexed(candidate_entries)
    assert base.keys() == candidate.keys(), 'Unapproved added or removed artifact'
    changed = {p for p in base if base[p] != candidate[p]}
    assert changed == ALLOWED | {'release-hashes.json', 'vercel.json'}, 'Unexpected release change'
    oldhash = json.loads(base['release-hashes.json']['data'])
    newhash = json.loads(candidate['release-hashes.json']['data'])
    assert oldhash.keys() == newhash.keys()
    assert set(newhash) == {p.removeprefix('release/') for p in candidate if p.startswith('release/')}
    for path, item in candidate.items():
        if path.startswith('release/'):
            relative = path.removeprefix('release/')
            if 'data' in item:
                assert digest(item['data'].encode()) == newhash[relative], 'Inline digest mismatch: ' + path
            if path not in ALLOWED:
                assert item == base[path] and newhash[relative] == oldhash[relative], 'Frozen artifact changed'
    for path in ALLOWED:
        assert candidate[path]['data'] == (ROOT / path.removeprefix('release/static/')).read_text(), 'Approved source differs'
    assert base['prepare-output.mjs'] == candidate['prepare-output.mjs']
    assert base['apply-retirements.mjs'] == candidate['apply-retirements.mjs']
    config = json.loads(candidate['vercel.json']['data'])
    assert config['buildCommand'] == 'node prepare-output.mjs' and config['installCommand'] == ''
    assert config['git']['deploymentEnabled']['main'] is False
    assert config['git']['deploymentEnabled']['codex/corporate-seo-20261029'] is False
    forbidden = ['scripts/package-vercel.mjs', 'data/sento-review.json', 'data/brochures-sento.json']
    assert all(p not in candidate and 'release/static/' + p not in candidate for p in forbidden)
    rows = json.loads(candidate['release/static/data/proyectos.json']['data'])
    assert len(rows) == len({row['slug'] for row in rows}) == 131
    fiche_hashes = {}
    for row in rows:
        path = 'static/' + row['slug'] + '.html'
        assert newhash[path] == oldhash[path], 'Project HTML changed'
        fiche_hashes[row['slug']] = newhash[path]
    sento = [row['slug'] for row in rows if row.get('inmobiliaria') == 'Sento']
    euro = [row['slug'] for row in rows if row.get('inmobiliaria') == 'Euro']
    return {'runtimeFiles': len(newhash), 'unchangedRuntimeFiles': len(newhash)-len(ALLOWED),
            'changedRuntimePaths': sorted(ALLOWED), 'unchangedProjectSha256': fiche_hashes,
            'sentoProjectsUnchanged': sento, 'euroProjectsUnchanged': euro,
            'addedPaths': [], 'removedPaths': [], 'functionsAndRoutesUnchanged': True,
            'productionBuilderUnchanged': True, 'restrictedReviewInputsAbsent': True}

if __name__ == '__main__':
    assert digest(BASE.read_bytes()) == BASE_SHA256, 'Unrecognized baseline manifest'
    assert digest(CANDIDATE.read_bytes()) == CANDIDATE_SHA256, 'Unrecognized approved manifest'
    baseline, candidate = json.loads(BASE.read_text()), json.loads(CANDIDATE.read_text())
    report = validate(baseline, candidate)
    attacks = []
    for label, path in [('fiche', 'release/static/plaza-las-condes.html'),
                        ('catalogue', 'release/static/data/proyectos.json'),
                        ('function', next(x['file'] for x in candidate if x['file'].startswith('release/functions/'))),
                        ('builder', 'prepare-output.mjs')]:
        mutated = copy.deepcopy(candidate)
        target = next(x for x in mutated if x['file'] == path)
        target['data'] = (target.get('data') or '') + ' UNAPPROVED'
        try: validate(baseline, mutated)
        except (AssertionError, KeyError): attacks.append(label)
        else: raise AssertionError('Gate accepted unauthorized ' + label)
    try: validate(baseline, candidate + [{'file':'release/static/private-review.jpg', 'data':'unapproved'}])
    except AssertionError: attacks.append('new protected resource')
    else: raise AssertionError('Gate accepted new resource')
    report.update({'rejectedMutations': attacks, 'baselineManifestSha256': BASE_SHA256,
                   'candidateManifestSha256': CANDIDATE_SHA256, 'passed': True})
    (DOC/'production-package-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k != 'unchangedProjectSha256'}, ensure_ascii=False))
