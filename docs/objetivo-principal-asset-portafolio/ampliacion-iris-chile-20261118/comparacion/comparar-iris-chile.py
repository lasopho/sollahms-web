#!/usr/bin/env python3
"""Comparación documental repetible. No navegador, red, Git, motor de filtros ni generadores."""
import argparse
import collections
import difflib
import hashlib
import json
import re
import unicodedata
from pathlib import Path

BASE=Path('/private/tmp/sollahms-referencias-documentales-131-20261117')
A=Path('/private/tmp/sollahms-auditoria-leben-20261116')
R=Path('/private/tmp/sollahms-fuentes-reutilizadas-20261118')
DEFAULT=Path('/private/tmp/sollahms-comparacion-iris-chile-20261118')
DOC='docs/objetivo-principal-asset-portafolio/'
CURRENT_SHA='aff5a08f8abe9f4bafa2924a29a2f5f79e6a5724767d15f6b4b059dba2e4b59b'
CATEGORIES=['YA EXISTE EN SOLLAHMS','POSIBLE DUPLICADO','PROYECTO NUEVO','PROYECTO VENDIDO O NO COMERCIALIZABLE','INFORMACIÓN INSUFICIENTE']
READ_SET={}
JSON_SOURCES={}
LOCATORS=[]

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def norm(s):
    return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',str(s or '')).encode('ascii','ignore').decode().lower()).strip()
def name(s):return re.sub(r'^(?:(?:edificio|edif|condominio) )+','',norm(s))
def address(s):
    s=norm(s)
    s=re.sub(r'\b(?:avenida|avda)\b','av',s)
    s=re.sub(r'\bpasaje\b','pje',s)
    return re.sub(r'^(?:av|calle|pje) ','',s)
def esc(s):return str(s).replace('~','~0').replace('/','~1')
def source(path,commit=None,kind='expediente_existente'):
    p=Path(path); key=str(p)
    READ_SET[key]={'path':key,'sha256':sha(p),'bytes':p.stat().st_size,'commit':commit,'kind':kind}
    if p.suffix=='.json':
        d=json.loads(p.read_text());JSON_SOURCES[key]=d;return d
    return p.read_text()
def locator(path,pointer=None,lines=None):
    d={'source':str(path)}
    if pointer is not None:d['pointer']=pointer;LOCATORS.append((str(path),pointer))
    if lines:d['lines']=lines
    return d
def parse_title(s):
    return re.split(r'\s*-\s*',s,maxsplit=1) if '-' in s else ['',s]
def commune(s):
    m=re.search(r'Comuna\s+([^/,]+)',s or '',flags=re.I)
    return m.group(1).strip() if m else None
def iris_id(s):
    m=re.search(r'(?:proyecto/)(\d+)',str(s or ''))
    return m.group(1) if m else None
def product(s):
    n=norm(s)
    return 'local' if 'local' in n else 'terreno' if 'terreno' in n or 'lote' in n else 'departamento' if 'departamento' in n else 'casa' if 'casa' in n else 'oficina' if 'oficina' in n else None
def resolve(d,p):
    for part in p.split('/')[1:]:
        part=part.replace('~1','/').replace('~0','~')
        d=d[int(part)] if isinstance(d,list) else d[part]
    return d

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--listing',type=Path,default=Path('/private/tmp/sollahms-iris-chile-discovery-20261118/LISTADO-OBSERVADO.json'))
    ap.add_argument('--validations',type=Path,default=Path('/private/tmp/sollahms-iris-chile-discovery-20261118/VALIDACION-FICHAS.json'))
    ap.add_argument('--out',type=Path,default=DEFAULT)
    args=ap.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    listed=source(args.listing,kind='observacion_UI_nueva_no_fuente_comercial_owner')
    validation=source(args.validations,kind='validacion_de_fichas_separada') if args.validations.exists() else {'complete':False,'records':[]}
    catpath=BASE/'data/proyectos.json';cat=source(catpath,'24a11df1a62898a06b408a729bb20ce1b1de4e87','universo_exacto_131')
    assert sha(catpath)==CURRENT_SHA and len(cat)==len({p['slug'] for p in cat})==131
    histpath=A/'data/proyectos.json';hist=source(histpath,'e9e256511987a638072b2ddca827df5acba68c3f','historico_137_no_actual')
    ma_readme=R/'docs/maestra-brochures-20261025/README.md';source(ma_readme,'875bd80ddb650b376cb3dd53af4ffae066fcd48f')
    nv_readme=R/'docs/norte-verde-18-20261026/README.md';source(nv_readme,'875bd80ddb650b376cb3dd53af4ffae066fcd48f')
    ingevec_path=A/'docs/cartera-ingevec-definitiva.md';source(ingevec_path,'e9e256511987a638072b2ddca827df5acba68c3f')
    nv_path=R/'docs/norte-verde-18-20261026/decision-register.json';nv=source(nv_path,'875bd80ddb650b376cb3dd53af4ffae066fcd48f')
    historical_policy_path=args.out/'POLITICAS-HISTORICOS-Y-ALIAS.json'
    if historical_policy_path.exists():source(historical_policy_path,kind='memo_de_punteros_existentes_no_auditoria_nueva')
    agents_path=BASE/'AGENTS.md'
    if agents_path.exists():source(agents_path,'24a11df1a62898a06b408a729bb20ce1b1de4e87','instrucciones_existentes_retiro_PatioBrasil')

    # Identidad de proyecto y etapas declaradas; no se copian precios, áreas ni stock.
    current={p['slug']:(i,p) for i,p in enumerate(cat)}
    identities=[]
    for i,p in enumerate(cat):
        identities.append({'slug':p['slug'],'names':[p['nombre'],p['slug']],'developer':p['inmobiliaria'],'commune':p['comuna'],'address':p.get('direccion'),'locator':locator(catpath,'/'+str(i)),'kind':'proyecto_publicado'})
        for j,r in enumerate(p.get('etapasComerciales',[])):
            identities.append({'slug':p['slug'],'names':[r.get('nombre'),r.get('slug')],'developer':r.get('inmobiliaria',p['inmobiliaria']),'commune':r.get('comuna',p['comuna']),'address':r.get('direccion'),'locator':locator(catpath,'/'+str(i)+'/etapasComerciales/'+str(j)),'kind':'etapa_comercial_declarada','documentationStatus':r.get('verificacion',{}).get('estadoFuente')})
    # Sólo alias respaldados: no normalizar números/etapas arbitrariamente.
    aliases=[
      {'title':'Mirador Mapocho B','developer':'Maestra','commune':'Quinta Normal','slug':'mirador-mapocho','locator':locator(ma_readme,lines=[16,16]),'scope':'Mismo conjunto A/B y PDF idéntico. No asigna modelos a torre ni une ofertas de los IDs1353/1413.'},
      {'title':'Jaridnes de Alvarado B','developer':'Maestra','commune':'Independencia','slug':'jardines-de-alvarado','locator':locator(ma_readme,lines=[15,15]),'scope':'Nombre literal del original duplicado; torresA/B permanecen separadas en sus planos.'},
      {'title':'Vicuña Mackenna 7589 E1','developer':'Ingevec','commune':'La Florida','slug':'vicuna-mackenna-7589','locator':locator(ingevec_path,lines=[20,29]),'scope':'Etapa1 bajo ficha compartida. Precio general no se distribuye entre etapas ni modelos.'},
      {'title':'Vicuña Mackenna 7589 E2','developer':'Ingevec','commune':'La Florida','slug':'vicuna-mackenna-7589','locator':locator(ingevec_path,lines=[21,29]),'scope':'Etapa2 bajo ficha compartida. No unión con etapa1.'},
      {'title':'Playa Peñuelas','developer':'Norte Verde','commune':None,'requiredAddress':'Av. Peñuelas 118','slug':'playa-penuelas','locator':locator(nv_path,'/notes/playa-penuelas'),'scope':'Discrepancia LaSerena/Coquimbo existente, sólo cuando ficha confirmaAv.Peñuelas118; no proyecto nuevo por la comuna de tarjeta. No cambiar dirección publicada.'}
    ]
    # Históricos fuera de131 son candidatos a conciliación, no nuevos ni vendidos por omisión.
    historical=[(i,p) for i,p in enumerate(hist) if p['slug'] not in current]
    assert len(historical)==6
    prior_ids=collections.defaultdict(list)
    registry_path=A/(DOC+'REGISTRO-NUEVA-EVIDENCIA-IRIS.json')
    registry=source(registry_path,'e9e256511987a638072b2ddca827df5acba68c3f')
    for i,r in enumerate(registry['references']):
        iid=iris_id(r.get('sourceURL'))
        if iid:prior_ids[iid].append({'slug':r['slug'],'locator':locator(registry_path,'/references/'+str(i)),'scope':'Asociación Iris documentada previamente; no fuente nueva ni oferta owner.'})
    for f in ['iris-documentary-15.json','iris-documentary-additions-2.json','iris-documentary-r018-vicuna-1103.json']:
        p=BASE/'tests/fixtures'/f;d=source(p,'24a11df1a62898a06b408a729bb20ce1b1de4e87')
        for i,r in enumerate(d['records']):
            for j,ref in enumerate(r['references']):
                iid=iris_id(ref.get('sourceURL',ref.get('sourceId')))
                if iid:prior_ids[iid].append({'slug':r['slug'],'locator':locator(p,'/records/'+str(i)+'/references/'+str(j)),'scope':'ID Iris previamente documentado; no adopta oferta/precio externo.'})
    for p in sorted((A/'docs/catalog-data-completeness-20261116/leben/iris-20261116/proyectos').glob('*.json')):
        d=source(p,'e9e256511987a638072b2ddca827df5acba68c3f');iid=iris_id(d.get('url'))
        if iid:prior_ids[iid].append({'slug':d['slug'],'locator':locator(p,'/url'),'scope':'Consulta Iris existente16Nov; fecha de consulta no es vigencia de oferta.'})

    vr=collections.defaultdict(list)
    for i,r in enumerate(validation.get('records',[])):vr[str(r.get('iris_id'))].append((i,r))
    listing_groups=collections.defaultdict(list)
    for i,r in enumerate(listed['projects']):listing_groups[str(r['iris_id'])].append((i,r))
    rows=[]
    for iid,observations in listing_groups.items():
        ix,r=observations[0];dev,nm=parse_title(r['title']);co=commune(r.get('location'));typ=product(r.get('location'))
        validations=vr.get(iid,[]); vi,v=sorted(validations,key=lambda x:x[1].get('checked_at',''))[-1] if validations else (None,{})
        f=v.get('validation',{});fa=f.get('address');fc=commune(f.get('location')) or co
        fd=next((f[k] for k in ['developer','developer_text','developer_name','inmobiliaria','developer_logo_alt'] if isinstance(f.get(k),str) and f[k].strip()),None)
        developer_evidence='explicit_fiche_field' if fd else None
        if not fd and '-' in (f.get('title') or ''):
            heading_developer,heading_name=parse_title(f['title'])
            if heading_developer.strip() and heading_name.strip():fd=heading_developer;developer_evidence='official_heading_prefix'
        ft=next((f[k] for k in ['property_type','propertyType','product_type','tipo_producto','tipo'] if isinstance(f.get(k),str) and f[k].strip()),None)
        fiche_valid=v.get('status')=='FICHA_VALIDA' and iris_id(f.get('iris_url',v.get('iris_url')))==iid and f.get('no_results') is not True and f.get('loading_indicators',0)==0
        heading_matches=norm(f.get('title'))==norm(r['title'])
        identity_sufficient=bool(fiche_valid and fd and fa and fc and heading_matches and (ft or typ))
        evid=[];found={};reason=[];certainty='INSUFICIENTE';scope=[];address_suggestions=[]
        for hit in prior_ids.get(iid,[]):
            if hit['slug'] in current:found[hit['slug']]='id_iris_previamente_documentado';evid.append(hit['locator']);scope.append(hit['scope'])
        for ident in identities:
            if any(name(x)==name(nm) for x in ident['names'] if x) and norm(dev)==norm(ident['developer']) and norm(co)==norm(ident['commune']):
                found.setdefault(ident['slug'],ident['kind']);evid.append(ident['locator'])
        for alias in aliases:
            if name(nm)==name(alias['title']) and norm(dev)==norm(alias['developer']) and (alias['commune'] is None or norm(co)==norm(alias['commune'])) and (not alias.get('requiredAddress') or (fiche_valid and address(fa)==address(alias['requiredAddress']))):
                found.setdefault(alias['slug'],'alias_documentado');evid.append(alias['locator']);scope.append(alias['scope'])
        # Dirección de ficha es evidencia separada. Nombre por sí solo nunca es identidad suficiente.
        if fiche_valid and fa and not found:
            for ident in identities:
                same_address=address(fa)==address(ident.get('address')) and bool(address(fa))
                same_dev=norm(fd or dev)==norm(ident['developer']) and bool(fd or dev)
                if same_address and same_dev and norm(fc)==norm(ident['commune']):
                    title_numbers=set(re.findall(r'\b\d+\b',name(nm)))
                    original_name=name(current[ident['slug']][1]['nombre'])
                    original_numbers=set(re.findall(r'\b\d+\b',original_name))
                    compatible_numbers=not (title_numbers and original_numbers and title_numbers!=original_numbers)
                    # La similitud jamás confirma identidad: A/B, Norte/Sur eII/III
                    # permanecen discriminadores aunque casi todo el nombre sea igual.
                    address_numbers=set(re.findall(r'\b\d+\b',address(ident.get('address'))))
                    only_address_number_added=(not original_numbers and bool(title_numbers) and title_numbers<=address_numbers and re.sub(r'\b\d+\b','',name(nm)).split()==original_name.split())
                    name_compatible=name(nm)==original_name or only_address_number_added
                    if compatible_numbers and name_compatible:
                        found[ident['slug']]='direccion_ficha_mas_inmobiliaria_comuna';evid.extend([ident['locator'],locator(args.validations,'/records/'+str(vi)+'/validation/address')])
                    else:
                        address_suggestions.append({'slug':ident['slug'],'locator':ident['locator'],'notIdentityProof':True,'reason':'Dirección compartida con nombre o discriminadores diferentes; no declarar identidad ni proyecto nuevo automáticamente.'})
        old=[]
        for hi,h in historical:
            if name(nm) in [name(h['nombre']),name(h['slug'])] and norm(dev)==norm(h['inmobiliaria']) and norm(co)==norm(h.get('comuna')):
                old.append(h['slug']);evid.append(locator(histpath,'/'+str(hi)))
        retired=False;retired_scope=None
        if 'patio-brasil' in old:
            retired=True;retired_scope='PatioBrasil retirado explícitamente; no restaurar. Esto no acredita venta o estado físico.'
            if agents_path.exists():evid.append(locator(agents_path,lines=[64,70]))
        # Retiro comercial autorizado no es declaración de agotamiento del proyecto.
        ingevec_retired={'vespucio capital','serrano capital','brasil','carrera capital','froilan roa','hacienda lo errazuriz'}
        if norm(dev)=='ingevec' and name(nm) in ingevec_retired:
            retired=True;retired_scope='Fuera del alcance comercial autorizado de Sollahms desde11Oct; el documento aclara que no significa agotado/terminado/descontinuado.';evid.append(locator(ingevec_path,lines=[31,45]))
        if old and any(x in nv.get('retired',[]) for x in old):
            retired=True;retired_scope='Retirado del catálogo por instrucción owner26Oct; no afirma stock/venta enIris.';evid.append(locator(nv_path,'/retired'))
        weak=[]
        if not found:
            for ident in identities:
                if norm(dev) and norm(dev)!=norm(ident['developer']):continue
                if norm(co) and norm(co)!=norm(ident['commune']):continue
                score=max(difflib.SequenceMatcher(None,name(nm),name(x)).ratio() for x in ident['names'] if x)
                if score>=0.76:
                    w={'slug':ident['slug'],'similarity':round(score,3),'locator':ident['locator'],'notIdentityProof':True}
                    existing_addr=current[ident['slug']][1].get('direccion')
                    w['addressComparison']='MISMA_DIRECCION' if fiche_valid and fa and address(fa)==address(existing_addr) else 'DIRECCIONES_EXPLICITAS_DISTINTAS' if fiche_valid and fa and existing_addr else 'NO_RESUELTA'
                    w['addressComparisonScope']='Sólo dirección literal de ficha frente a registro existente; no equivalencia de modelos/unidades ni actualización de direcciones.'
                    weak.append(w)
        weak_identity_unresolved=bool(weak) and any(w['addressComparison']!='DIRECCIONES_EXPLICITAS_DISTINTAS' for w in weak)
        missing=[]
        if not fiche_valid:missing.append('Ficha válida por ID, sin pantalla vacía/carga/resultado inexistente.')
        if not fd:missing.append('Atribución explícita de inmobiliaria: prefijo del encabezado oficial o texto/logotipo visible. No deducir por parecido.')
        if not fa:missing.append('Dirección o identificación geográfica específica del proyecto/etapa.')
        if not fc:missing.append('Comuna explícita.')
        if not heading_matches:missing.append('Encabezado de ficha correspondiente a la tarjeta/ID observado; conservar la discrepancia.')
        if not ft and not typ:missing.append('Tipo de producto explícito; no deducir departamento/local/terreno.')
        if retired:
            category=CATEGORIES[3];reason.append(retired_scope);certainty='ALTA_SOBRE_RETIRO_DEL_ALCANCE_SOLL_AHMS_NO_SOBRE_VENTA'
        elif len(found)==1:
            category=CATEGORIES[0];reason.append('Identidad existente respaldada por '+next(iter(found.values()))+'.');certainty='ALTA_ID_O_DIRECCION_O_ALIAS' if any(x in ['id_iris_previamente_documentado','direccion_ficha_mas_inmobiliaria_comuna','alias_documentado'] for x in found.values()) else 'MEDIA_MULTICAMPO_TARJETA'
        elif len(found)>1 or old or address_suggestions or weak_identity_unresolved:
            category=CATEGORIES[1];reason.append('Identidades múltiples o antecedente histórico fuera del universo actual; no incorporar ni declarar vendido automáticamente.')
        elif identity_sufficient and validation.get('complete') is True:
            category=CATEGORIES[2];reason.append('Ficha válida e identidad específica suficiente; no coincide con universo131, etapas declaradas, alias respaldados ni históricos conocidos.');certainty='CANDIDATO_DOCUMENTAL_NO_ADOPCION_COMERCIAL'
        elif weak:
            category=CATEGORIES[1];reason.append('Similitud sin correspondencia de identidad acreditada; sólo prioriza cabecera mínima.')
        else:
            category=CATEGORIES[4];reason.append('No hay correspondencia existente fuerte ni identidad final suficiente para afirmar proyecto nuevo.')
        # Un precio/amenity/área distinto nunca participa en la resolución de identidad.
        diff=[]
        for slug in found:
            ci,p=current[slug]
            if co and norm(co)!=norm(p['comuna']):diff.append('Comuna tarjetaIris difiere de publicada; no cambia identidad/dirección automáticamente.')
            if fa and address(fa)!=address(p.get('direccion')):diff.append('Dirección fichaIris difiere de texto publicado; conservar ambos alcances, no actualizar dirección por esta comparación.')
            active_product='local' if p.get('tipologias')==['Local'] else None
            if active_product and typ and typ!=active_product:diff.append('Misma edificación con producto distinto: ofertaownerLocal frente a referenciaIris'+typ+'. No proyecto nuevo ni préstamo de atributos.')
        row={
          'iris_id':iid,'title':r['title'],'classification':category,'certainty':certainty,'reasons':reason,
          'existingSlugs':sorted(found),'existingMatchKinds':found,'historicalSlugs':old,
          'weakSuggestions':sorted(weak,key=lambda x:-x['similarity'])[:5], 'sameAddressSuggestions':address_suggestions,
          'listingEvidence':[locator(args.listing,'/projects/'+str(i)) for i,_ in observations],
          'identityEvidence':evid,'scopeLimits':scope,'scopeDifferences':sorted(set(diff)),
          'ficheValidation':{'separateFromComparison':True,'status':v.get('status','NO_VALIDACION_RECIBIDA'),'usable':fiche_valid,'cutComplete':validation.get('complete') is True,'evidence':locator(args.validations,'/records/'+str(vi)) if vi is not None else None,'checkedAt':v.get('checked_at'),'headingMatchesObservedListing':heading_matches,'explicitDeveloper':fd,'developerEvidence':developer_evidence,'corporateIdentityNotCertified':True,'explicitAddress':fa,'explicitCommune':fc,'explicitProduct':ft or typ,'identitySufficientForNewCandidate':identity_sufficient,'missingMinimumHeader':missing},
          'newCandidateEligible':category==CATEGORIES[2] and fiche_valid and identity_sufficient and validation.get('complete') is True,
          'commercialAdoptionAuthorized':False,'stockCertified':False,'ownerPricesChanged':False,'generalHeaderNotUsedForCommercialJoins':True,
          'minimumReviewNeeded':len(found)!=1 and not retired and category!=CATEGORIES[2],
          'nextAction':'Conservar correspondencia existente; no revisar unidades para comparar identidad.' if found else 'Conservar retiro documentado sin afirmar vendido ni restaurar.' if retired else 'Validar únicamente cabecera mínima y resolver identidad/etapa, sin explorar unidades ni cotizaciones.' if category!=CATEGORIES[2] else 'Candidato documental para revisión de alcance; no insertar en catálogo, publicar ni adoptar precioIris.'}
        rows.append(row)
        if iid in ['315','1549'] and agents_path.exists():
            row['existingCommercialAntecedentNotNewReceipt']={
              'source':locator(agents_path,lines=[111,112] if iid=='315' else [105,106]),
              'scope':'Precio owner Compañía1735 conservado internamente; no equivale a alta de ficha ni asociación con esta capturaIris.' if iid=='315' else 'Cuatro precios owner NuevoVivacetaECasa ya retenidos; no asociar con IngevecVivaceta ni considerar recepción nueva.',
              'requiresNewOwnerPriceRequest':False,'pricesCopiedOrApplied':False}
    # Una dirección compartida entre supuestos nuevos señala posible duplicación/productos/etapas.
    groups=collections.defaultdict(list)
    for r in rows:
        f=r['ficheValidation']
        if r['newCandidateEligible']:groups[(norm(f['explicitDeveloper']),norm(f['explicitCommune']),address(f['explicitAddress']))].append(r)
    for g,items in groups.items():
        if len(items)>1:
            for r in items:
                r['classification']=CATEGORIES[1];r['newCandidateEligible']=False;r['minimumReviewNeeded']=True
                r['certainty']='IDENTIDAD_VARIANTE_O_ETAPA_PENDIENTE'
                r['nextAction']='Resolver variante/etapa/producto de los IDs que comparten dirección, conservando cada registro y sin sumar proyectos nuevos automáticamente.'
                r['reasons'].append('Otros IDs nuevos comparten desarrollador/comuna/dirección; resolver variante/etapa/producto antes de contar nuevos.');r['sameIdentityAddressIds']=[x['iris_id'] for x in items]
    # Sólo se valida este comparador documental; no se ejecutan pruebas de aplicación certificadas.
    for path,pointer in LOCATORS:resolve(JSON_SOURCES[path],pointer)
    for p,m in READ_SET.items():assert sha(Path(p))==m['sha256'],'Entrada cambió durante lectura; reejecutar con corte estable: '+p
    preserved=[]
    for p in [args.listing,args.validations]:
        if not p.exists():continue
        digest=sha(p);dest=args.out/'inputs'/(p.stem+'-'+digest+p.suffix);dest.parent.mkdir(exist_ok=True)
        if not dest.exists():dest.write_bytes(p.read_bytes())
        assert sha(dest)==digest
        preserved.append({'originalPath':str(p),'preservedPath':str(dest),'sha256':digest,'bytes':dest.stat().st_size})
    result={
      'schemaVersion':1,'kind':'COMPARACION_IRIS_CHILE_CON_UNIVERSO131_NO_ADOPCION_COMERCIAL',
      'listingCut':{'observedAt':listed.get('observed_at'),'complete':listed.get('complete') is True,'uiTotal':listed.get('ui_total'),'uniqueObservedIds':len(rows),'rawObservedCards':len(listed['projects']),'country':listed.get('country'),'stateFilters':listed.get('states_selected')},
      'validationCut':{'complete':validation.get('complete') is True,'rawRecords':len(validation.get('records',[])),'uniqueIds':len(vr),'isSeparateProcess':True},
      'baseline':{'currentProjects':131,'source':locator(catpath),'sha256':CURRENT_SHA,'technicalCommit':'24a11df1a62898a06b408a729bb20ce1b1de4e87','historical137IsNotCurrent':True,'sixHistoricalOnlySlugs':[p['slug'] for _,p in historical]},
      'criteria':{'categories':CATEGORIES,'nameAloneNeverProvesIdentity':True,'strongExisting':['ID Iris previamente asociado a slug con alcance propio.','Nombre específico/números/etapa + desarrollador + comuna únicos.','Alias documentado o etapa expresamente presente en131.','Dirección de ficha + desarrollador + comuna inequívocos.'],'newCandidate':'PROYECTO NUEVO + FICHA_VALIDA + identidad suficiente + corte final de validación; sigue sin autorización de incorporación/publicación.','propertyScope':'Departamento/local/terreno diferentes de una misma edificación no son automáticamente nuevos. Nunca heredan atributos entre productos.','retirement':'Retiro de Sollahms no acredita vendido/agotado enIris. Los seis del histórico137 no se retiran ni restauran por omisión.','prices':'Precios Iris sólo observados, nunca sustituyen precios Sollahms ni acreditan stock.','deduplication':'Una fila porID observado. Variantes/etapas y variosIDs del mismo edificio no se suman como proyectos nuevos.','partialInput':'Un corte parcial no prueba catálogo completo ni ausencia de un proyecto.'},
      'summary':{'classificationCounts':dict(collections.Counter(r['classification'] for r in rows)),'uniqueExisting131SlugsMatched':len({s for r in rows if r['classification']==CATEGORIES[0] for s in r['existingSlugs']}),'currentSlugsWithoutStrongObservedMatchInThisFilteredCut':[p['slug'] for p in cat if p['slug'] not in {s for r in rows if r['classification']==CATEGORIES[0] for s in r['existingSlugs']}],'absenceInFilteredCutDoesNotProveSoldOrUnaudited':True,'observedIdsAreNotDistinctBuildingCount':True,'newCandidateEligible':sum(r['newCandidateEligible'] for r in rows),'minimumReviewIds':[r['iris_id'] for r in rows if r['minimumReviewNeeded']],'noNewOwnerQuestionsCreated':True,'historical313Closed':0},
      'readSet':READ_SET,'preservedInputs':preserved,'records':rows,
      'documentValidation':{'uniqueIds':len(rows),'exactBaseline131':True,'jsonLocatorsResolved':len(LOCATORS),'allReadSourcesUnchangedDuringRun':True,'appTestsOrGeneratorsRun':False,'networkOrBrowserOrGitMutations':False}}
    dest=args.out/'COMPARACION-IRIS-CHILE.json';dest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    minimal={'kind':'REVISION_MINIMA_IDENTIDAD_NO_AUDITORIA_COMERCIAL','listingCut':result['listingCut'],'validationCut':result['validationCut'],'doNotReviewExistingUnits':True,'existingIdsToAvoidUnitExploration':[r['iris_id'] for r in rows if r['classification']==CATEGORIES[0]],'records':[{'iris_id':r['iris_id'],'title':r['title'],'classification':r['classification'],'missingMinimumHeader':r['ficheValidation']['missingMinimumHeader'],'existingSuggestions':r['weakSuggestions'],'historicalSlugs':r['historicalSlugs'],'nextAction':r['nextAction']} for r in rows if r['minimumReviewNeeded']]}
    (args.out/'REVISIONES-MINIMAS-PARA-FICHAS.json').write_text(json.dumps(minimal,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'output':str(dest),'sha256':sha(dest),'summary':result['summary'],'listingCut':result['listingCut'],'validationCut':result['validationCut']},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
