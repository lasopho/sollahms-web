#!/usr/bin/env python3
"""Read-only catalogue audit; writes independent evidence and 39-model proposals."""
import hashlib
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from pathlib import Path

from PIL import Image
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / 'docs/qa/sento-final'
OUT = QA / 'plan-pdf-pages'
OUT.mkdir(parents=True, exist_ok=True)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def read(path):
    return json.loads((ROOT / path).read_text())


def file_proof(path):
    return {'localPath': str(path.relative_to(ROOT)), 'sha256': sha(path.read_bytes()), 'bytes': path.stat().st_size}


brochures = read('data/brochures-sento.json')
review = read('data/sento-review.json')
current = read('docs/qa/sento-final/plan-pdf-sources/capture.json')
old = read('data/sento-official-research.json')
replacements = read('docs/qa/sento-final/plan-crops/manifest.json')
cp = {p['slug']: p for p in current['projects']}
op = {p['slugExistente']: p for p in old['proyectos']}
rp = {p['slug']: p for p in review['projects']}
native_updates = {(r['slug'], r['code']): r for r in replacements['planReplacements'] if r['extractionMethod'] == 'pdf_image_object'}
assert len(native_updates) == 5

# Render the complete relevant source pages, rather than relying only on extracted crops.
jobs = []
documents = {}
for p in brochures['projects']:
    slug = p['slug']
    pdf = ROOT / p['document']['localPath'].lstrip('/')
    assert sha(pdf.read_bytes()) == p['document']['sha256']
    reader = PdfReader(pdf)
    assert len(reader.pages) == p['document']['pageCount']
    documents[slug] = {**p['document'], 'sourceRef': f'brochure:{slug}', 'version': 'User-supplied brochure; current commerce not implied.'}
    for page in sorted({m['sourcePage'] for m in p['models']}):
        jobs.append((slug, pdf, reader, page))
jof_pdf = ROOT / cp['jofre-135']['linkedPdfs'][0]['localPath']
jobs.append(('jofre-official-linked', jof_pdf, PdfReader(jof_pdf), 5))


def render(job):
    slug, pdf, reader, page = job
    folder = OUT / slug
    folder.mkdir(exist_ok=True)
    prefix = folder / f'page-{page:02d}'
    png = prefix.with_suffix('.png')
    text = prefix.with_suffix('.txt')
    subprocess.run(['pdftoppm', '-scale-to', '1800', '-f', str(page), '-l', str(page), '-singlefile', '-png', str(pdf), str(prefix)], check=True, capture_output=True, timeout=60)
    text.write_text(reader.pages[page-1].extract_text() or '')
    im = Image.open(png)
    return {'slug': slug, 'sourcePage': page, 'sourceSha256': sha(pdf.read_bytes()),
            'render': {**file_proof(png), 'width': im.width, 'height': im.height},
            'textExtraction': file_proof(text), 'method': 'Poppler pdftoppm full page, max side 1800, no crop'}


with ThreadPoolExecutor(max_workers=2) as executor:
    rendered = list(executor.map(render, jobs))
page_proofs = {(r['slug'], r['sourcePage']): r for r in rendered}
(OUT / 'render-ledger.json').write_text(json.dumps({'schemaVersion': 1, 'checkedOn': '2026-10-14', 'pages': rendered}, ensure_ascii=False, indent=2)+'\n')

# The offered Jofré PDF contains exactly the same encoded plan image objects as the supplied PDF.
jof_user = PdfReader(ROOT / documents['jofre-135']['localPath'].lstrip('/'))
jof_link = PdfReader(jof_pdf)
equality = []
for code, original_index in [('A1', 0), ('B27', 1), ('C1', 2), ('D1', 3)]:
    orig = list(jof_user.pages[4].images)[original_index]
    hits = [(i, image) for i, image in enumerate(jof_link.pages[4].images) if sha(image.data) == sha(orig.data)]
    assert len(hits) == 1
    index, image = hits[0]
    assert image.image.size == orig.image.size
    equality.append({'slug': 'jofre-135', 'code': code, 'suppliedPage': 5, 'suppliedImageIndex': original_index,
                     'officialPage': 5, 'officialImageIndex': index,
                     'encodedImageSha256': sha(orig.data), 'encodedBytesIdentical': True,
                     'width': orig.image.width, 'height': orig.image.height,
                     'officialPdfSha256': cp['jofre-135']['linkedPdfs'][0]['sha256']})

sources = []
for p in current['projects']:
    sources.append({'id': f'official-page:{p["slug"]}', 'kind': 'current_official_project_page', **p['html'], 'checkedOn': current['verifiedOn']})
    for card in p['planCards']:
        sources.append({'id': f'official:{p["slug"]}:{card["code"]}', 'kind': 'current_official_code_specific_plan_card',
                        'projectSlug': p['slug'], 'code': card['code'], 'sourceUrl': p['officialUrl'],
                        'officialTitle': card['officialTitle'], 'officialCategory': card['category'],
                        'printedHtmlFields': card['printedHtmlFields'], 'cardHtmlSha256': card['cardHtmlSha256'],
                        'cardSourceLocalPath': card['cardSourceLocalPath'], 'cardByteOffset': card['cardByteOffset'],
                        'nativeImage': card['image'], 'checkedOn': current['verifiedOn']})
    for pdf in p['linkedPdfs']:
        sources.append({'id': f'official-linked-pdf:{p["slug"]}', 'kind': 'official_page_linked_pdf', **pdf})
for slug, document in documents.items():
    sources.append({'id': document['sourceRef'], 'kind': 'user_supplied_brochure', **document})

rows = []
blocked = {('plaza-las-condes', 'B5'), ('plaza-las-condes', 'C2')}
for p in brochures['projects']:
    slug = p['slug']
    cards = {c['code']: c for c in cp[slug]['planCards']}
    repo_models = {m['label']: m for m in rp[slug]['models']}
    for n, m in enumerate(p['models']):
        code = m['label']
        card = cards.get(code)
        repo = repo_models[code]
        plan = ROOT / repo['plan']['localPath'].lstrip('/')
        assert sha(plan.read_bytes()) == repo['plan']['sha256']
        assert m['plan']['sha256'] == repo['plan']['sha256']
        assert repo['sourcePage'] == m['sourcePage']
        assert repo['bedrooms'] == m['bedrooms'] and repo['bathrooms'] == m['bathrooms']
        total = m['areas'][0]['valueM2']
        brochure_ref = f'brochure:{slug}'
        ref = f'official:{slug}:{code}' if card else brochure_ref
        allowed = card is not None and (slug, code) not in blocked
        replacement = native_updates.get((slug, code))
        mismatch = card is not None and Decimal(str(card['totalM2'])) != Decimal(str(total))
        discrepancies = []
        if card:
            assert card['bathroomsField'] == m['bathrooms']
            if m['bedrooms'] == 0:
                assert card['category'] == 'estudio'
                if card['bedroomsField'] != 0:
                    discrepancies.append({'kind': 'numeric_studio_bedrooms_field', 'officialValue': card['bedroomsField'],
                                           'retainedBedrooms': 0, 'reason': 'Printed brochure identifies Estudio; current page categorizes this exact code under Estudio. Its numeric Dormitorios field says 1; do not reclassify as a separate bedroom.'})
            else:
                assert card['bedroomsField'] == m['bedrooms']
        if mismatch:
            discrepancies.append({'kind': 'brochure_vs_current_total', 'brochureTotalM2': total,
                                   'currentHtmlTotalM2': card['totalM2'], 'acceptedCurrentFields': allowed,
                                   'reason': 'Different source versions are recorded separately; no rounding or inferred reconciliation.'})
        if (slug, code) in blocked:
            other_ref = 'official:plaza-las-condes:B2' if code == 'B5' else 'official:curico-77:C2'
            other_card = next(c for p2 in current['projects'] for c in p2['planCards'] if f'official:{p2["slug"]}:{c["code"]}' == other_ref)
            assert (card['usefulM2'], card['terraceM2'], card['totalM2']) == (other_card['usefulM2'], other_card['terraceM2'], other_card['totalM2'])
            discrepancies.append({'kind': 'unreliable_current_area_fields', 'blockedSourceRef': ref, 'identicalTupleSourceRef': other_ref,
                                   'officialTuple': {'usefulM2': card['usefulM2'], 'terraceM2': card['terraceM2'], 'totalM2': card['totalM2']},
                                   'reason': 'Exact numeric tuple repeats a different plan card and contradicts this code-specific brochure total, although the drawing matches this model. All three current numeric area fields are excluded; no subtraction or borrowed areas.'})
        if not card:
            discrepancies.append({'kind': 'exact_code_not_offered_currently', 'code': code,
                                   'reason': 'D2 is absent from all ten current Curicó plan cards. No current linked PDF offered; only its explicitly printed brochure total is confirmed. Missing terrace is not zero.'})
        if (slug, code) == ('curico-77', 'C2-1'):
            discrepancies.append({'kind': 'unexplained_source_asterisk', 'sourceText': card['printedHtmlFields']['Terraza'],
                                   'reason': 'Current field expressly labels *41.01 as Terraza. No explanation of the asterisk was established; do not split it into a garden or infer any additional area.'})
        if replacement:
            discrepancies.append({'kind': 'image_embeds_superseded_total', 'replacementRef': replacement['id'],
                                   'reason': 'Current repository image contains the brochure editorial total. Use the proposed full original diagram object before publishing the new official area tuple.'})
        if (slug, code) == ('mirador-la-florida', 'A4'):
            discrepancies.append({'kind': 'historical_image_band', 'replacementRef': 'mirador-la-florida:A4',
                                   'reason': 'Brochure has a central AGOTADO band. It is historical, not current stock evidence; current exact-code native source is offered separately with its comparison limitation.'})
        areas = []
        for label, kind, field, source_field in [('Superficie útil', 'useful', 'usefulM2', 'Superficie útil'),
                                                  ('Terraza', 'terrace', 'terraceM2', 'Terraza'),
                                                  ('Superficie total', 'total', 'totalM2', 'Superficie total')]:
            value = card[field] if allowed else total if kind == 'total' else None
            source_ref = ref if allowed else brochure_ref if kind == 'total' else None
            areas.append({'label': label, 'kind': kind, 'valueM2': value, 'publishable': value is not None,
                          'sourceRef': source_ref, 'sourcePage': None if allowed else m['sourcePage'],
                          'sourceField': source_field if allowed else m['areas'][0]['label'] if kind == 'total' else None,
                          'sourceText': card['printedHtmlFields'][source_field] if allowed else str(total) if kind == 'total' else None,
                          'sourceMatchedCode': code if value is not None else None,
                          'publicationRequiresPlanReplacement': replacement['id'] if replacement else None})
        arithmetic = None
        if allowed:
            valid_sum = Decimal(str(card['usefulM2'])) + Decimal(str(card['terraceM2'])) == Decimal(str(card['totalM2']))
            assert valid_sum
            arithmetic = {'matchesDeclaredTotal': True, 'diagnosticOnly': True, 'totalNeverRecalculatedForPublication': True}
        sheet = QA / 'plan-pdf-pairs' / f'{slug}-{n//3+1:02d}.jpg'
        assert sheet.exists()
        eq = next((e for e in equality if e['code'] == code), None) if slug == 'jofre-135' else None
        rows.append({'slug': slug, 'code': code, 'originalLabel': m['label'], 'bedrooms': m['bedrooms'], 'bathrooms': m['bathrooms'],
                     'displayTypology': ('Estudio' if m['bedrooms'] == 0 else f'{m["bedrooms"]} dormitorio' + ('s' if m['bedrooms'] > 1 else '')) + f' · {m["bathrooms"]} baño' + ('s' if m['bathrooms'] > 1 else ''),
                     'sourcePage': m['sourcePage'], 'areas': areas, 'otherAreas': [], 'consumerNotes': [],
                     'brochureVersion': {'sourceRef': brochure_ref, 'sourcePage': m['sourcePage'], 'code': code,
                                          'bedrooms': m['bedrooms'], 'bathrooms': m['bathrooms'], 'printedAreas': m['areas'],
                                          'usefulM2': None, 'terraceM2': None, 'totalM2': total,
                                          'onlyTotalExplicitlyPrinted': True, 'pageProof': page_proofs[(slug, m['sourcePage'])]},
                     'currentOfficialVersion': {'sourceRef': ref, 'code': card['code'], 'usefulM2': card['usefulM2'], 'terraceM2': card['terraceM2'],
                                                'totalM2': card['totalM2'], 'numericBedroomsField': card['bedroomsField'], 'category': card['category'],
                                                'areaFieldsAccepted': allowed} if card else None,
                     'matchEvidence': {'exactProjectAndCode': card is not None, 'matchingBedroomsOnlyUsed': False,
                                       'visualDrawingComparison': 'Reviewed exact-code native official image alongside supplied brochure drawing: perimeter, bath count and position, kitchen, living/bedroom partitions and terrace position match. Rotation, furnishings or drawing style may differ; not a claim of pixel equality.' if card else 'Reviewed complete supplied D2 drawing and printed code; no current exact-code counterpart exists.',
                                       'pairSheet': file_proof(sheet), 'sourceCardRef': ref if card else None,
                                       'nativeOfficialImage': card['image'] if card else None,
                                       'repositoryPlanPath': repo['plan']['localPath'], 'repositorySha256': repo['plan']['sha256'],
                                       'sourceSha256': p['document']['sha256'], 'repositorySourcePage': repo['plan']['sourcePage'],
                                       'brochureImageExtraction': {k: v for k, v in repo['plan'].items() if k in ('extractionMethod', 'imageIndex', 'originalSha256', 'crop', 'alphaBounds', 'nativeWidth', 'nativeHeight')},
                                       'officialPdfEncodedObjectEquality': eq,
                                       'typologySource': 'Code-specific brochure prints Estudio or the dormitorio/baño combination. Current exact-code category and bathroom numeric field corroborate the count where available. For brochure-only Curicó D2, the drawing shows one bathroom; no number of square metres is inferred from it.',
                                       'roomGeometryUsedForAreaInference': False, 'differentProjectOrBorrowedCode': False},
                     'discrepancies': discrepancies, 'arithmetic': arithmetic,
                     'publication': {'fullCurrentTupleVerified': allowed, 'onlyBrochureTotalVerified': not allowed,
                                     'safeWithCurrentRepositoryPlan': replacement is None,
                                     'requiredPlanReplacementRef': replacement['id'] if replacement else None,
                                     'omitUnknownAreaRows': True, 'availabilityNotInferred': True},
                     'completeness': {'brochureExplicitNumericAreaCount': 1, 'currentAcceptedAreaCount': 3 if allowed else 0,
                                      'additionalExplicitM2LabelsFound': 0, 'unknownAreaValuesRemainNull': not allowed,
                                      'linearDimensionsNeverConvertedToAreas': True, 'terraceAbsenceOnlyExplicitZero': allowed and card['terraceM2'] == 0}})

commercial = []
for slug, p in cp.items():
    before = op[slug]['comercial']
    state_before = before['estado']
    sold_before = before['vendido100Porcentaje']
    changed_price = p['observedPriceFromUF'] != before['precioDesdeUF']
    same_state = state_before.casefold() in [s.casefold() for s in p['observedStateTokens']] and sold_before == ('100% vendido' in p['observedStateTokens'])
    assert not changed_price and same_state
    commercial.append({'slug': slug, 'sourceUrl': p['officialUrl'], 'previousCheckedOn': op[slug]['verificadoFecha'],
                       'currentCheckedOn': current['verifiedOn'], 'previousPriceFromUF': before['precioDesdeUF'],
                       'observedPriceFromUF': p['observedPriceFromUF'], 'previousState': state_before,
                       'observedStateTokens': p['observedStateTokens'], 'observedChange': False,
                       'sourceRef': f'official-page:{slug}', 'promotionsPublished': False, 'commercialDataMutation': False})

extras = [{'slug': p['slug'], 'code': c['code'], 'sourceRef': f'official:{p["slug"]}:{c["code"]}', 'notAddedToRequestedInventory': True}
          for p in current['projects'] for c in p['planCards'] if not any(r['slug'] == p['slug'] and r['code'] == c['code'] for r in rows)]
summary = {'requestedProjects': 6, 'requestedModels': len(rows), 'currentOfficialCardsCaptured': sum(len(p['planCards']) for p in current['projects']),
           'exactCodeCurrentMatches': sum(r['currentOfficialVersion'] is not None for r in rows),
           'coherentCurrentAreaTuplesVerified': sum(r['publication']['fullCurrentTupleVerified'] for r in rows),
           'modelsWithBrochureTotalOnly': sum(r['publication']['onlyBrochureTotalVerified'] for r in rows),
           'unreliableCurrentCardAreaTuplesExcluded': len(blocked),
           'missingExactCurrentCode': 1, 'coherentSourceVersionTotalDifferences': sum(r['publication']['fullCurrentTupleVerified'] and r['brochureVersion']['totalM2'] != r['currentOfficialVersion']['totalM2'] for r in rows),
           'totalAreaDisagreementsIncludingBlockedCards': sum(any(d['kind'] == 'brochure_vs_current_total' for d in r['discrepancies']) for r in rows),
           'existingImagesWithContradictoryPrintedTotal': len(native_updates), 'proposedOriginalDiagramReplacements': len(native_updates),
           'cleanOfficialMiradorA4Proposal': 1, 'explicitZeroTerraceModels': [f'{r["slug"]}:{r["code"]}' for r in rows if r['completeness']['terraceAbsenceOnlyExplicitZero']],
           'additionalOfficialCodesNotAdded': len(extras), 'brochurePagesRendered': len(rendered)-1, 'offeredPdfPlanPagesRendered': 1,
           'officialPdfsOfferedByThesePages': sum(len(p['linkedPdfs']) for p in current['projects'])}
assert len(rows) == 39 and len({(r['slug'], r['code']) for r in rows}) == 39
assert summary['coherentCurrentAreaTuplesVerified'] == 36 and summary['modelsWithBrochureTotalOnly'] == 3
assert summary['coherentSourceVersionTotalDifferences'] == 15 and summary['totalAreaDisagreementsIncludingBlockedCards'] == 17
audit = {'schemaVersion': 1, 'checkedOn': current['verifiedOn'], 'internalOnly': True, 'scope': '39 existing plans from six supplied Sento brochures; Angamos audited separately.',
         'models': rows, 'sources': sources, 'summary': summary, 'planReplacements': replacements['planReplacements'],
         'planReplacementsManifest': file_proof(QA / 'plan-crops/manifest.json'),
         'commercialRecheck': commercial, 'extraOfficialCodesNotIntegrated': extras,
         'identityGuidance': [{'slug': 'jofre-135', 'suppliedName': 'Jofré 135', 'currentOfficialName': 'Jofré 157',
                               'sameDevelopmentEvidence': 'Current official project page links a brochure with the four identical encoded code-specific drawing objects. Preserve differentiated names by source; no new listing.', 'encodedObjectMatches': equality},
                              {'slug': 'san-ignacio', 'suppliedName': 'San Ignacio 270', 'currentOfficialName': 'San Ignacio 280',
                               'sameDevelopmentEvidence': 'Previously verified project facade, supplied270 map/current280 page270 map, code-specific floor layouts. Current exact A3/B1/D1 images match those three brochure drawings. Preserve differentiated addresses by source; no new listing.'}],
         'publicationGuidance': ['Use only areas with non-null verified valueM2. Omit unknown rows; never render missing-data placeholders.',
                                 'For five conflicting embedded totals, apply the proposed full native diagram before the coherent current official tuple.',
                                 'Never combine current useful/terrace values with a historical brochure total. No sums or averages generate a published area.',
                                 'Curicó D2, Plaza B5 and Plaza C2 retain only their explicitly printed brochure total; no terrace absence or current availability inferred.',
                                 'Public catalogue identities, all seven existing model inventories and code-specific source ownership remain pinned.',
                                 'Jofré A1 and San A3 have terrace0 explicitly in current official fields. All other unknown terrace fields remain null.',
                                 'No price or historical AGOTADO band establishes current model stock.'],
         'limitations': ['The five other project pages currently offer no PDF download link. Their current numeric fields come from code-specific official HTML, supported by native drawings.',
                         'Curicó D2 has no current exact-code image/card; no replacement code, similar bedroom count or derived area was substituted.',
                         'Plaza B5 and C2 area fields exactly repeat different cards and contradict the supplied model total; their useful and terrace remain unverified.',
                         'Curicó C2-1 terrace source has an unexplained leading asterisk; its number is kept under the explicit source label, without a garden split.',
                         'Mirador A4 historical band prevents comparison of the covered central pixels; the clean official exact-code alternative is matched by total and visible layout.',
                         'All six brochures print only a total area for these39codes. No additional numerical useful/interior/garden areas were found on their full plan pages.',
                         'Fresh official captures verify exposed sources, not the validity of copied/mismatched official numeric data. Suspect fields remain excluded.'],
         'verification': {'unique39ModelInventory': True, 'providedPdfsByteHashesVerified': True, 'existingRepositoryPlanHashesVerified': True,
                          'sourcePageAndCodeOwnershipPreserved': True, 'all39PlansVisuallyCompared': True,
                          'currentFieldsNeverDerivedFromGeometry': True, 'brochureTotalsNeverMixedWithCurrentSubareas': True,
                          'coherentTriplesCheckedWithDecimalDiagnosticOnly': True, 'allSixCommercialSnapshotsUnchanged': True,
                          'originalWorkspaceModified': False, 'publicReviewOrRendererModified': False,
                          'capturedSourceManifest': file_proof(QA / 'plan-pdf-sources/capture.json'),
                          'fullPageRenderLedger': file_proof(OUT / 'render-ledger.json')}}
(ROOT / 'data/sento-plan-audit-pdf.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(summary, ensure_ascii=False))
