#!/usr/bin/env python3
"""Prepare only the isolated 21-project JSON from pinned, existing evidence.

This script never runs historical generators, fetches a source, changes the
131-project baseline, or copies original owner documents into public output.
"""
import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path

SLUGS={
 '299':'alameda-4719','315':'compania-1735','1549':'nuevo-vivaceta',
 '1556':'condominio-altos-del-penon','1557':'condominio-reserva-santa-clara',
 '1558':'condominio-hacienda-santa-clara','1559':'condominio-plaza-nos',
 '1560':'condominio-sendero-santa-clara','1561':'terrazas-del-mirador',
 '1562':'altos-del-mirador','1563':'condominio-hacienda-junquillar',
 '1566':'condominio-hacienda-volcanes','1573':'kiez','1575':'centro-santa-ana',
 '1579':'edificio-ambar-urbano','1582':'espacio-v','1585':'edificio-botanico',
 '1586':'balmaceda','1588':'prat','1589':'vicuna-mackenna-capital','1590':'mirador-capital'}
ATTRIBUTES=['propertyType','priceUF','bedrooms','bathrooms','usefulM2','totalM2','interiorM2','internalM2','terraceM2']
BASELINE_SHA256='aff5a08f8abe9f4bafa2924a29a2f5f79e6a5724767d15f6b4b059dba2e4b59b'

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def norm(s):return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',str(s or '')).encode('ascii','ignore').decode().lower()).strip()
def canonical_region(literal):
    # Only the new Iris aliases observed in this expansion; baseline rows stay untouched.
    return {'de los lagos':'Los Lagos','del biobio':'Biobío'}.get(norm(literal),literal)
def load(path):return json.loads(Path(path).read_text())
def price_uf(literal):
    m=re.search(r'UF\s*([0-9][0-9.,]*)',literal or '')
    return float(m.group(1).replace('.','').replace(',','.')) if m else None
def exact_bedrooms(literal):
    m=re.fullmatch(r'\s*([1-9][0-9]*)\s+dormitorios?\s*',literal or '',flags=re.I)
    return int(m.group(1)) if m else None
def source_date(candidate):return candidate.get('generalHeaderCheckedAtUTC') or candidate['checkedAtUTC']
def safe_text(value):
    # Do not spread a raw owner/unit row or unreviewed internal commercial text.
    if value is not None:
        assert isinstance(value,str)
        assert not re.search(r'comisi[oó]n|broker|honorari|/private/|/Users/|owner-input|\.csv|docs/',value,re.I)
    return value
def public_media(item,repo):
    if item is None:return None
    path=item['path'];assert path.startswith('/assets/iris-expansion-20261118/') and '..' not in path
    local=repo/path.lstrip('/');assert local.is_file() and sha(local)==item['sha256'] and local.stat().st_size==item['bytes']
    return path
def common_unknowns():
    return {'bathrooms':None,'usefulM2':None,'totalM2':None,'interiorM2':None,'terraceM2':None,
            'parkingIncluded':None,'parkingAvailable':None,'storageIncluded':None,'storageAvailable':None,'stock':None}
def project_units(raw):
    if raw is None:return {}
    if isinstance(raw.get('projectsByIrisId'),dict):return raw['projectsByIrisId']
    if isinstance(raw.get('referencesByIrisId'),dict):return raw['referencesByIrisId']
    if isinstance(raw.get('exactUnitReferences'),list):
        grouped={}
        for row in raw['exactUnitReferences']:
            grouped.setdefault(str(row['irisProjectId']),[]).append(row)
        return grouped
    raise ValueError('Unit source must be explicitly grouped by Iris project ID.')
def public_unit(ref,project_id,url):
    attrs={k:ref.get('attributes',{}).get(k) for k in ATTRIBUTES}
    assert attrs['bedrooms'] is None or isinstance(attrs['bedrooms'],int)
    assert attrs['bathrooms'] is None or isinstance(attrs['bathrooms'],int)
    for key in ATTRIBUTES:
        if key not in ['propertyType','bedrooms','bathrooms']:
            assert attrs[key] is None or isinstance(attrs[key],(int,float))
    # Unit/model/raw labels stay in the source archive. The client sees an opaque key.
    private_identity=json.dumps({'project':project_id,'unit':ref.get('unitLabel'),'model':ref.get('modelLabel'),
                                 'observed':ref.get('observedAtUTC'),'sourceKey':ref.get('id')},sort_keys=True,ensure_ascii=False)
    opaque='iris-ref-'+hashlib.sha256(private_identity.encode()).hexdigest()[:24]
    metrics={}
    for key,item in ref.get('surfaceEvidence',{}).items():
        if key not in ['usefulM2','totalM2','interiorM2','internalM2','terraceM2']:continue
        if not item.get('explicitlyPrinted') or item.get('calculated') is not False:continue
        assert attrs[key]==item['valueM2']
        label=safe_text(item.get('sourceLabel'))
        metrics[key]={'sourceLabel':label,'valueM2':item['valueM2'],'unit':'m²','explicitlyPrinted':True,'calculated':False}
    for key in ['usefulM2','totalM2','interiorM2','internalM2','terraceM2']:
        if attrs[key] is not None:assert key in metrics,'Typed metric needs its own explicit label.'
    price_kind=ref.get('priceKind')
    assert price_kind in ['finalPrice','listPrice']
    price_field='finalPriceUF' if price_kind=='finalPrice' else 'listPriceUF'
    assert attrs['priceUF']==ref[price_field]
    return {'id':opaque,'sourceKind':'IRIS_EXACT_UNIT','sourceURL':url,'observedAtUTC':ref['observedAtUTC'],
            'sourceDocumentDate':ref.get('sourceDocumentDate'),'scope':'exact-reference','notOffer':True,'stock':None,
            'priceField':price_field,'priceKind':price_kind,'listPriceUF':ref.get('listPriceUF'),'finalPriceUF':ref.get('finalPriceUF'),
            'priceValidityConfirmed':False,'attributes':attrs,'surfaceEvidence':metrics,'financialBaselineCompatible':False}

def amenities_descriptors(literals,taxonomy):
    # Exact, accent/case-normalized matches only. No new icon/filter taxonomy.
    lookup={}
    for item in taxonomy['labels']:
        lookup.setdefault(norm(item['source']),item)
        lookup.setdefault(norm(item['label']),item)
    descriptors=[];notes=[];seen=set()
    filters={x['id']:x for x in taxonomy['filters']}
    for literal in literals:
        for segment in re.split(r'[.;]+',literal):
            segment=segment.strip()
            if not segment:continue
            item=lookup.get(norm(segment))
            if item:
                ids=[x for x in item.get('filterIds',[]) if filters.get(x,{}).get('group')=='amenities']
                # General project text never grants a private space or price inclusion.
                if norm(item['label']) in seen:continue
                assert item['icon'] in taxonomy['icons']
                descriptors.append({'label':item['label'],'filterIds':ids,'icon':item['icon']})
                seen.add(norm(item['label']))
            elif not re.search(r'cocina|cl[oó]set|ventana|t[eé]rmic|energ[ií]a|dormitorio|suite|walk|piso',segment,re.I):
                if segment not in notes:notes.append(safe_text(segment))
    return descriptors,notes

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--proposal',type=Path,required=True)
    parser.add_argument('--validations',type=Path,required=True)
    parser.add_argument('--owner-ecasa',type=Path,required=True)
    parser.add_argument('--owner-sento',type=Path,required=True)
    parser.add_argument('--media-map',type=Path,required=True)
    parser.add_argument('--cover-review',type=Path,required=True)
    parser.add_argument('--unit-references',type=Path)
    parser.add_argument('--baseline',type=Path,default=Path('data/proyectos.json'))
    parser.add_argument('--taxonomy',type=Path,default=Path('data/amenities.json'))
    parser.add_argument('--output',type=Path,default=Path('data/catalog-expansion-iris-20261118.json'))
    parser.add_argument('--receipt',type=Path)
    args=parser.parse_args();repo=Path(__file__).resolve().parents[1]
    inputs={'proposal':args.proposal,'validations':args.validations,'ownerEcasa':args.owner_ecasa,
            'ownerSento':args.owner_sento,'mediaMap':args.media_map,'coverReview':args.cover_review,
            'baseline':args.baseline,'taxonomy':args.taxonomy}
    if args.unit_references:inputs['unitReferences']=args.unit_references
    pins={k:{'path':str(p.resolve()),'sha256':sha(p),'bytes':p.stat().st_size} for k,p in inputs.items()}
    proposal=load(args.proposal);validations=load(args.validations);baseline=load(args.baseline)
    ecasa=load(args.owner_ecasa);sento=load(args.owner_sento);media=load(args.media_map)['projectsByIrisId']
    cover_review=load(args.cover_review)['projectsByIrisId'];taxonomy=load(args.taxonomy)
    units=project_units(load(args.unit_references) if args.unit_references else None)
    assert len(baseline)==len({x['slug'] for x in baseline})==131
    assert sha(args.baseline)==BASELINE_SHA256,'The protected baseline changed; reconcile before preparing an expansion.'
    assert validations['complete'] is True
    valid_by_id={str(x['iris_id']):x for x in validations['records']}
    assert len(proposal['candidates'])==21 and {str(x['iris_id']) for x in proposal['candidates']}==set(SLUGS)
    assert len(set(SLUGS.values()))==21 and not set(SLUGS.values())&{x['slug'] for x in baseline}
    developer_names={norm(x['inmobiliaria']):x['inmobiliaria'] for x in baseline}
    projects=[];details=[]
    for ci,c in enumerate(proposal['candidates']):
        iid=str(c['iris_id']);slug=SLUGS[iid];v=valid_by_id[iid]
        assert c['ficheStatus']=='FICHA_VALIDA' and v['status']=='FICHA_VALIDA'
        assert c['comparisonClassification']=='PROYECTO NUEVO'
        raw=c['commercialReferenceIris'];url=c['iris_url'];header_date=source_date(c)
        display_name=re.split(r'\s*-\s*',c['namePublishedIris'],maxsplit=1)[-1]
        if iid=='315':display_name='Compañía 1735'
        developer=developer_names.get(norm(c['developerPublishedIris']),c['developerPublishedIris'])
        region=canonical_region(c['regionPublishedIris'])
        exact_d=exact_bedrooms(raw.get('bedroomsSummaryLiteral'))
        owner_refs=[];owner_record=None;owner_pointer=None
        if iid=='1549':owner_record=ecasa['records']['nuevo-vivaceta'];owner_pointer='/records/nuevo-vivaceta'
        if iid=='315':owner_record=sento['pending']['compania-1735'];owner_pointer='/pending/compania-1735'
        if owner_record:
            for key,amount in owner_record['prices'].items():
                label='Estudio' if key=='0' else str(int(key))+' dormitorio'+('s' if int(key)!=1 else '')
                owner_refs.append({'categoryKey':key,'label':label,'priceUF':amount,'bedrooms':None if key=='0' else int(key),
                  'bathrooms':None,'usefulM2':None,'totalM2':None,'interiorM2':None,'terraceM2':None,
                  'sourceKind':'OWNER_EXISTING','sourceLabel':'Sollahms','sourceContextDate':'2026-10-30',
                  'sourceDocumentDate':None,'dateKind':'existing-owner-record-context','stock':None,
                  'scope':'owner-typology-category','modelAssociation':None,'unitAssociation':None,
                  'newOwnerConfirmation':False,'financialBaselineCompatible':False})
        property_type=c['propertyTypePublishedIris'];assert property_type in ['departamento','casa']
        amenity_literals=[safe_text(x) for x in raw.get('amenitiesGeneralPublishedIris',[])]
        descriptors,source_notes=amenities_descriptors(amenity_literals,taxonomy)
        resources=media.get(iid,{})
        unit_source=units.get(iid,[])
        if isinstance(unit_source,dict):unit_source=unit_source.get('exactUnitReferences',[])
        assert len(unit_source)<=1,'This scope allows one reference per new project, not an inventory.'
        unit_refs=[public_unit(x,iid,url) for x in unit_source]
        cover_path=public_media(resources.get('cover'),repo)
        visual=cover_review.get(iid,{})
        if cover_path:assert visual.get('assetSHA256')==resources['cover']['sha256']
        project={
          'slug':slug,
          'identity':{'name':display_name,'developer':developer,'commune':c['communePublishedIris'],
             'region':region,'address':c['addressPublishedIris'],'country':'Chile','propertyType':property_type},
          'source':{'kind':'IRIS','projectId':iid,'projectUrl':url,'originalProjectTitle':c['namePublishedIris'],
             'observedAtUTC':c['checkedAtUTC'],'sourceDocumentDate':None,'developerAttribution':'official-heading-prefix',
             'originalRegion':c['regionPublishedIris']},
          'projectFacts':{'propertyType':property_type,'developer':developer,'region':region,
             'commune':c['communePublishedIris'],'state':owner_record.get('state') if owner_record else None,
             'stateSourceKind':'OWNER_EXISTING' if owner_record else None,
             'deliveryLiteral':owner_record.get('delivery') if owner_record else raw.get('deliveryListingLiteral'),
             'deliverySourceKind':'OWNER_EXISTING' if owner_record else 'IRIS_LISTING',
             'legalDeliveryCertified':False,'stock':None},
          'externalIris':{'projectFromPriceUF':price_uf(raw.get('priceLabel')),'priceLabel':safe_text(raw.get('priceLabel')),
             'priceScope':raw.get('priceScope'),'sourceURL':url,'observedAtUTC':header_date,'sourceDocumentDate':None,
             'notOwnerPrice':True,'correlatedWithBedroomOrSurfaceSummary':False,'stock':None},
          'headerBedroomProfile':{'literal':safe_text(raw.get('bedroomsSummaryLiteral')),'bedroomsExact':exact_d,
             'bathrooms':None,'sourceURL':url,'observedAtUTC':header_date,'scope':'project-summary',
             'correlatedWithPrice':False,'rangeExpandedToCategories':False},
          'unclassifiedSurfaceSummary':{'literal':safe_text(raw.get('surfaceSummaryUnclassified')),
             'usefulM2':None,'totalM2':None,'interiorM2':None,'terraceM2':None,'sourceURL':url,'observedAtUTC':header_date},
          'commonAmenities':{'literals':[x['label'] for x in descriptors],'descriptors':descriptors,
             'sourceNotes':source_notes,'sourceNotesDoNotProvideFilterPredicates':True,'propertyTypeScope':property_type,'scope':'project-general',
             'sourceURL':url,'observedAtUTC':header_date,'privateOrUnitAssignment':False,
             'parkingIncluded':None,'parkingAvailable':None,'storageIncluded':None,'storageAvailable':None},
          'ownerReferences':owner_refs,'exactUnitReferences':unit_refs,
          'media':{'coverPath':cover_path,'coverAlt':safe_text(visual.get('alt')) if cover_path else None,
             'logoPath':public_media(resources.get('developerLogo'),repo),'logoAlt':'Logo de '+developer+' publicado por Iris.' if resources.get('developerLogo') else None},
          'location':{'latitude':None,'longitude':None,'mapQuery':c['addressPublishedIris']+', '+c['communePublishedIris']+', Chile'},
          'detailUrl':'/'+slug+'.html','financialBaselineCompatible':False,
          'unclassifiedSummaryDoesNotProvideTypedAreas':True}
        if iid=='315':project['identity']['historicalNameNote']='El antecedente comercial también cita Compañía 1703; no se presume equivalencia de numeraciones.'
        if iid=='1549':project['identity']['separateIdentityNote']='Nuevo Vivaceta de Ecasa es una identidad distinta de Vivaceta de Ingevec.'
        projects.append(project)
        details.append({'irisId':iid,'slug':slug,'proposalPointer':'/candidates/'+str(ci),
                        'validationRecordIndex':next(i for i,x in enumerate(validations['records']) if str(x['iris_id'])==iid),
                        'originalRegion':c['regionPublishedIris'],'projectedRegion':region,
                        'ownerSourcePointer':owner_pointer,'ownerReferenceCount':len(owner_refs),
                        'exactUnitReferenceCount':len(unit_refs),'privateUnitLabelsNotExported':True,
                        'privateUnitReferenceMapping':[{'publicOpaqueId':pub['id'],'rawReferenceId':raw_ref.get('id'),
                           'unitLabel':raw_ref.get('unitLabel'),'modelLabel':raw_ref.get('modelLabel'),
                           'observedAtUTC':raw_ref['observedAtUTC']} for pub,raw_ref in zip(unit_refs,unit_source)]})
    result={'schemaVersion':1,'kind':'CATALOG_EXPANSION_IRIS_CHILE_LOCAL_CANDIDATE','asOf':'2026-11-18',
            'country':'Chile','projects':projects,'policy':{'availableStockCertified':False,'financialBaselineCompatible':False,
            'referencesMayBeJoined':False,'ownerPricesOverrideExternalIrisForOwnerSource':True,
            'unclassifiedAreaIsNotUsefulOrTotal':True,'studioDoesNotImplyNumericZero':True}}
    serialized=json.dumps(result,ensure_ascii=False,indent=2)+'\n'
    assert len(projects)==21 and sum(p['identity']['developer']=='GPR' for p in projects)==9
    assert sum(len(p['ownerReferences']) for p in projects)==5
    assert all(not p['financialBaselineCompatible'] for p in projects)
    assert not re.search(r'/private/|/Users/|owner-input|\.csv|comisi[oó]n|broker|honorari',serialized,re.I)
    for k,p in inputs.items():assert sha(p)==pins[k]['sha256'],'Source changed while preparing data: '+k
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(serialized)
    receipt={'kind':'PUBLIC_WHITELIST_PROJECTION_FROM_EXISTING_AND_AUTHORIZED_IRIS_EVIDENCE','sources':pins,
             'output':{'path':str(args.output.resolve()),'sha256':sha(args.output),'bytes':args.output.stat().st_size},
             'records':details,'baseline131Unchanged':sha(args.baseline)==pins['baseline']['sha256'],
             'ownerContextEvidence':{'path':'AGENTS.md','sha256':sha(repo/'AGENTS.md'),
                 'sections':['ECasa commercial synchronization (2026-10-30)','Sento owner commercial overlay (2026-10-30)'],
                 'meaning':'Context date of existing owner instructions; source document dates remain null.'},
             'newOwnerReceiptOrConfirmation':False,'networkOrGitMutations':False}
    if args.receipt:args.receipt.parent.mkdir(parents=True,exist_ok=True);args.receipt.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'projects':len(projects),'gpr':9,'ownerReferences':5,'exactUnitReferences':sum(len(p['exactUnitReferences']) for p in projects),
                      'covers':sum(p['media']['coverPath'] is not None for p in projects),'logos':sum(p['media']['logoPath'] is not None for p in projects),
                      'outputSHA256':sha(args.output)},ensure_ascii=False))

if __name__=='__main__':main()
