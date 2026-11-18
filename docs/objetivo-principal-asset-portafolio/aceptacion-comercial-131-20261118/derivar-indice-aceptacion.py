#!/usr/bin/env python3
"""Conciliar expedientes existentes; no consulta, auditoría primaria ni edición Git/app."""
import collections
import hashlib
import json
from pathlib import Path

A = Path('/private/tmp/sollahms-auditoria-leben-20261116')
T = Path('/private/tmp/sollahms-referencias-documentales-131-20261117')
R = Path('/private/tmp/sollahms-fuentes-reutilizadas-20261118')
OUT = Path('/private/tmp/sollahms-aceptacion-131-20261118')
DOC = 'docs/objetivo-principal-asset-portafolio/'
REG = {}
POINTERS = []
EXISTING_INDEX = OUT / 'INDICE-ACEPTACION-POR-PROYECTO.json'
EXPECTED_SOURCES = json.loads(EXISTING_INDEX.read_text())['sources'] if EXISTING_INDEX.exists() else {}

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def escape(s): return str(s).replace('~', '~0').replace('/', '~1')
def read(root, rel, commit=None, kind='fuente_existente_leida'):
    key = rel
    p = root / rel
    if key in EXPECTED_SOURCES:
        assert sha(p)==EXPECTED_SOURCES[key]['sha256'], 'Fuente cambió; preservar corte existente y conciliar: '+rel
    if key not in REG:
        REG[key] = {'repositoryPath': rel, 'localPath': str(p), 'sha256': sha(p),
                    'bytes': p.stat().st_size, 'commit': commit, 'kind': kind,
                    'freshPrimaryAudit': False}
    return json.loads(p.read_text()) if p.suffix == '.json' else p.read_text()
def loc(rel, pointer='', scope=None):
    v = {'source': rel, 'pointer': pointer}
    if scope: v['scope'] = scope
    if rel.endswith('.json'): POINTERS.append((rel, pointer))
    return v
def project_rows(d):
    v = d.get('projects', d.get('proyectos', []))
    return [('/projects/' + escape(k), r, k) for k, r in v.items()] if isinstance(v, dict) else [('/projects/' + str(i), r, r.get('slug')) for i, r in enumerate(v)]
def date(d):
    return next((d[k] for k in ['reviewDate','reviewedOn','checkedOn','reviewedAt','auditDate','date'] if d.get(k)), None) or (d.get('source', {}).get('date') if isinstance(d.get('source'),dict) else None)
def trim_scope(r):
    keys = ['stageScope','scope','applicability','surfacePolicy','commercialFieldsPolicy','commercialPolicy','availability','pending','warnings','conflicts','unknowns','unresolved','issues','sourceNotes','historicalOnly','limitations','priceScope','confirmationNotes']
    return {k:r[k] for k in keys if r.get(k) not in [None,[],{},'']}

catalog_rel = 'data/proyectos.json'
cat = read(T, catalog_rel, '165f918aba402a0eb3313c85e144af2b4a7e8651', 'catalogo_publicado_existente')
class_rel = DOC+'CLASIFICACION-COMERCIAL-131.json'
cls = read(A,class_rel,'e9e256511987a638072b2ddca827df5acba68c3f')
inventory_rel = DOC+'INVENTARIO-DE-FUENTES.json'
inventory = read(A,inventory_rel,'e9e256511987a638072b2ddca827df5acba68c3f')
criteria_rel = DOC+'CRITERIO-DE-ACEPTACION-Y-BLOQUEOS.json'
criteria = read(A,criteria_rel,'e9e256511987a638072b2ddca827df5acba68c3f')
read(A,DOC+'CONTROL-DE-AVANCE.md','e9e256511987a638072b2ddca827df5acba68c3f')
read(A,DOC+'INTERVENCIONES-PROPIETARIO.json','e9e256511987a638072b2ddca827df5acba68c3f')
read(A,DOC+'CANDIDATO-SUPLEMENTO-DOCUMENTAL-LOCAL.json','e9e256511987a638072b2ddca827df5acba68c3f')
euro_rel = DOC+'EURO-FUENTES-Y-ALCANCES.json'
euro = read(A,euro_rel,'e9e256511987a638072b2ddca827df5acba68c3f')
class_by_slug = {p['slug']:(i,p) for i,p in enumerate(cls['proyectos'])}
assert len(cat)==131 and len({p['slug'] for p in cat})==131
assert set(class_by_slug)=={p['slug'] for p in cat}
rows = {}
for i,p in enumerate(cat):
    ci,c = class_by_slug[p['slug']]
    rows[p['slug']] = {
      'slug':p['slug'],'name':p['nombre'],'developer':p['inmobiliaria'],
      'identity':loc(catalog_rel,'/'+str(i),'Identidad publicada; no constituye auditoría comercial primaria.'),
      'currentPublishedProductContext':{'typologies':p.get('tipologias'), 'priceSource':p.get('commercialSource',p.get('verificacion')), 'doNotBorrowResidentialFactsForLocal':True},
      'historicalNineFieldClassification':{
        'source':loc(class_rel,'/proyectos/'+str(ci)), 'cut':cls.get('fecha'),
        'states':{k:v['estado'] for k,v in c['campos'].items()},
        'meaning':'Clasificación estructurada existente, copiada sin cambios. Confirmado es el estado de su evidencia y alcance, no una certificación nueva de todas las consultas.',
        'sourceScopesAndEvidenceRemainAt':loc(class_rel,'/proyectos/'+str(ci)+'/campos')},
      'existingReviews':[], 'existingQueryWitnesses':[], 'additionalLocalDocumentaryReferences':[],
      'acceptance':{'globalStatus':'NO_CERTIFICADO_GLOBALMENTE','stock':'NO_CERTIFICADO','allCombinations':'NO_CERTIFICADAS','unknownFieldsPermitSupportedPartialQueries':True},
      'remainingWork':[], 'ownerQuestionAutomaticallyRequired':False
    }
    if p.get('verificacion'):
        rows[p['slug']]['existingReviews'].append({
          **loc(catalog_rel,'/'+str(i)+'/verificacion'), 'kind':'verificacion_publicada_existente',
          'date':p['verificacion'].get('fecha'), 'verifiedFields':p['verificacion'].get('camposVerificados'),
          'scope':'Registro publicado de identidad/campos indicados; fecha histórica propia. No prueba una revisión nueva de filtros ni stock.'})
    rows[p['slug']]['existingQueryWitnesses'].append({
      **loc(catalog_rel,'/'+str(i)), 'kind':'resumen_publicado_de_proyecto_no_modelo',
      'layer':'published','date':p.get('verificacion',{}).get('fecha'),
      'fieldsPresent':[k for k in ['precioDesdeUF','tipologias','tipoActivo','tiposActivos','estado','entrega','amenities'] if p.get(k) is not None],
      'contract':'Hechos publicados sólo con su alcance. El resumen no acredita precio+D/B+superficie por unidad. superficieDesdeM2 genérica no es útil ni total.'})
    for field in ['commercialOffers','preciosPorTipologia','etapasComerciales']:
        value=p.get(field)
        if isinstance(value,list):
            for j,v in enumerate(value):
                rows[p['slug']]['existingQueryWitnesses'].append({
                  **loc(catalog_rel,'/'+str(i)+'/'+field+'/'+str(j)),
                  'kind':'oferta_comercial_o_etapa_publicada_existente','layer':'published-owner' if p.get('commercialSource',{}).get('type')=='owner-supplied' else 'published',
                  'date':p.get('commercialSource',{}).get('verifiedOn',p.get('verificacion',{}).get('fecha')),
                  'literalFields':list(v) if isinstance(v,dict) else [],
                  'contract':'Precio y atributos sólo dentro de este registro; no combinar con otra oferta/etapa/plano por similitud de precio o tipología.'})

fiche_rel='data/fichas-proyectos.json'
fiches=read(T,fiche_rel,'165f918aba402a0eb3313c85e144af2b4a7e8651')
for i,r in enumerate(fiches):
    if r['slug'] not in rows: continue
    rows[r['slug']]['existingReviews'].append({**loc(fiche_rel,'/'+str(i)), 'kind':'investigacion_oficial_por_ficha_existente',
      'date':r.get('checkedAt'), 'verifiedFields':r.get('verifiedFields'), 'sourceURL':r.get('sourceUrl'),
      'scope':'Campos verificados, notas y especificaciones de esta ficha; no testigo unitario automático para precio+D/B+área.'})
    for key in ['variants','models','commercialOffers','preciosPorTipologia','etapasComerciales']:
        value=r.get(key,r.get('updates',{}).get(key))
        if isinstance(value,list):
            base='/'+str(i)+('/' if key in r else '/updates/')+key
            for j,v in enumerate(value):
                rows[r['slug']]['existingQueryWitnesses'].append({**loc(fiche_rel,base+'/'+str(j)), 'kind':'registro_individual_de_ficha_existente', 'layer':'published-source-research', 'date':r.get('checkedAt'),
                  'literalFields':list(v) if isinstance(v,dict) else [],'contract':'Mantener atributos sólo dentro de este registro y sus límites; no equivalencia inferida con precios/modelos de otra fuente.'})

# Reutilización de revisiones específicas materializadas, sin elevarlas a vigencia comercial nueva.
data_files = ['brochures-aj-urbana.json','brochures-ecasa.json','brochures-ingevec.json','brochures-leben.json','brochures-leon.json','brochures-sento.json','euro-brochures.json','nollagam-brochures.json','crescer-brochures.json','euro-commercial.json','nollagam-commercial.json','crescer-commercial.json','commercial-filter-evidence-leben.json']
for filename in data_files:
    rel='data/'+filename; d=read(T,rel,'165f918aba402a0eb3313c85e144af2b4a7e8651')
    for pointer,r,slug in project_rows(d):
        if slug not in rows: continue
        commercial = filename in ['euro-commercial.json','nollagam-commercial.json','crescer-commercial.json']
        prepared = filename=='commercial-filter-evidence-leben.json'
        review={**loc(rel,pointer), 'kind':('instruccion_comercial_owner_existente' if commercial else 'capa_preparada_Leben_existente' if prepared else 'revision_documental_de_modelos_existente'),
          'date':date(d), 'scope':'Sólo los modelos/documentos/etapas y hechos declarados en este registro; no stock actual ni correspondencia automática precio-plano.',
          'modelOrVariantCount':len(r.get('models',r.get('variants',[]))),
          'explicitScopeAndLimits':trim_scope(r)}
        if r.get('document'): review['primaryDocumentAt']=loc(rel,pointer+'/document')
        if r.get('source'): review['primarySourceAt']=loc(rel,pointer+'/source')
        if r.get('source_sha256'): review['primaryDocumentSHA256']=r['source_sha256']
        if r.get('page_count'): review['primaryPageCount']=r['page_count']
        if filename=='nollagam-brochures.json':
            review.update({'date':None,'dateNote':'Este JSON no declara fecha de revisión; no inventada.', 'allSourcePagesReviewed':d['all_pages_reviewed'],'availabilityPolicy':d['availability']})
        rows[slug]['existingReviews'].append(review)
        # El puntero al testigo preserva etiquetas y cifras originales sin homogeneizar áreas.
        for key in ['models','variants','references','prices']:
            witnesses=r.get(key)
            if isinstance(witnesses,(list,dict)):
                items=witnesses.items() if isinstance(witnesses,dict) else enumerate(witnesses)
                for k,w in items:
                    rows[slug]['existingQueryWitnesses'].append({
                      **loc(rel,pointer+'/'+key+'/'+escape(k)),
                      'kind':'referencia_preparada_Leben' if prepared else 'cotizacion_owner_por_tipologia' if commercial else 'modelo_documental_existente',
                      'layer':'prepared-documentary-not-stock' if prepared else 'owner-commercial' if commercial else 'documentary-model-not-stock',
                      'date':w.get('sourceDate',date(d)) if isinstance(w,dict) else date(d),
                      'literalFields':list(w) if isinstance(w,dict) else [],
                      'contract':'Mantener el precio/atributos propios de este único testigo y sus máscaras/elegibilidad. No unir por igualdad de UF, D/B, nombre de modelo o superficie; preservar útil/interior/Internos/total y etapas separados.'})

# Fuentes específicas publicadas: sus registros exactos, no una auditoría adicional.
for filename, key in [('purchase-stage-verifications.json','reviews'),('leon-plan-surfaces.json','plans')]:
    rel='data/'+filename; d=read(T,rel,'165f918aba402a0eb3313c85e144af2b4a7e8651')
    v=d[key]
    for k,r in (v.items() if isinstance(v,dict) else enumerate(v)):
        slug=r.get('slug',r.get('projectSlug',r.get('project'))) if isinstance(r,dict) else None
        if slug in rows:
            rows[slug]['existingReviews'].append({**loc(rel,'/'+key+'/'+escape(k)), 'kind':'verificacion_especifica_existente','date':date(d),'scope':d.get('scope'), 'methodology':d.get('methodology',d.get('policy'))})
for filename,slug in [('plaza-las-condes-verified.json','plaza-las-condes'),('sento-angamos.json','angamos')]:
    rel='data/'+filename;d=read(T,rel,'165f918aba402a0eb3313c85e144af2b4a7e8651')
    rows[slug]['existingReviews'].append({**loc(rel), 'kind':'verificacion_especifica_existente','date':date(d),'scope':d.get('sourcePolicy','Datos owner y contraste oficial de esta ficha; no asociación a cada unidad.')})

# Inventario distingue fuentes documentales existentes no materializadas/leídas aquí.
for rel,m in inventory['fuentes_existentes'].items():
    if rel in REG or rel in ['data/proyectos.json','data/fichas-proyectos.json','data/catalog-facets.json','data/project-features.json']: continue
    for slug in m.get('slugs',[]):
        if slug in rows:
            rows[slug]['existingReviews'].append({
              **loc(inventory_rel,'/fuentes_existentes/'+escape(rel)), 'kind':'fuente_especifica_inventariada_no_releida',
              'repositoryPathOfExistingSource':rel,'knownSHA256':m.get('sha256'),'knownCommit':m.get('commit'),
              'declaredReviewMetadata':m.get('marcas_de_revision_existentes'),
              'scope':m.get('naturaleza_y_limite'), 'contentReadHere':False,
              'acceptanceContribution':'Puntero real al expediente, sin afirmar contenido nuevo ni auditoría completa por su mera existencia.'})

# Dos expedientes históricos recuperados byte exactos; no recepción nueva del propietario.
ma_rel='docs/maestra-brochures-20261025/manifest.json';ma=read(R,ma_rel,'875bd80ddb650b376cb3dd53af4ffae066fcd48f','expediente_existente_recuperado_byte_exacto')
nv_rel='docs/norte-verde-18-20261026/decision-register.json';nv=read(R,nv_rel,'875bd80ddb650b376cb3dd53af4ffae066fcd48f','expediente_existente_recuperado_byte_exacto')
read(R,'docs/maestra-brochures-20261025/README.md','875bd80ddb650b376cb3dd53af4ffae066fcd48f','expediente_existente_recuperado_byte_exacto')
read(R,'docs/norte-verde-18-20261026/README.md','875bd80ddb650b376cb3dd53af4ffae066fcd48f','expediente_existente_recuperado_byte_exacto')
for slug,r in ma['projects'].items():
    if slug not in rows: continue
    rows[slug]['existingReviews'].append({**loc(ma_rel,'/projects/'+escape(slug)), 'kind':'revision_visual_brochure_Maestra_20261025_existente','date':ma['date'],
      'planReferences':len(r.get('plans',[])), 'imageReferences':len(r.get('images',[])),
      'scope':'Planos históricos según torre/etapa impresa; A/B/C de etapas no se deduce de letras de modelo. Sin alterar precios, entregas, disponibilidad ni amenidades.',
      'limitsAt':{'source':'docs/maestra-brochures-20261025/README.md','section':'Identificación y criterio; Duplicados exactos; Discrepancias y decisiones'},
      'sourceDocuments':sorted({x.get('sourceSHA256') for x in r.get('plans',[])+r.get('images',[]) if x.get('sourceSHA256')})})
    for i,plan in enumerate(r.get('plans',[])):
        rows[slug]['existingQueryWitnesses'].append({**loc(ma_rel,'/projects/'+escape(slug)+'/plans/'+str(i)),
          'kind':'plano_historico_identificado_Maestra','layer':'documentary-model-not-stock','date':ma['date'],'literalLabel':plan.get('label'),
          'sourceDocumentSHA256':plan.get('sourceSHA256'),'sourcePage':plan.get('page'),
          'contract':'Sólo plano/torre/etapa indicado. No asigna precio ni stock; vista compartida deLlacolénA no es plano deA. Los rótulos impresos se conservan sin homologación de métricas.'})
for i,slug in enumerate(nv['active']):
    rows[slug]['existingReviews'].append({**loc(nv_rel,'/active/'+str(i)), 'kind':'conciliacion_comercial_owner_NorteVerde_20261026_existente','date':nv['date'],
      'scope':'Precio/estado/entrega owner del producto publicado, no stock ni superficies de otro producto. Mantener separado Local/departamentos y ofertas mixtas.',
      'notes':nv['notes'].get(slug,[]),'withheld': [x for x in nv['withheld'] if x['slug']==slug],
      'detailAt':{'source':'docs/norte-verde-18-20261026/README.md','section':'Criterios comerciales; Identidades y discrepancias'}})

# Cada Euro tiene un expediente específico adicional, conservando cohortes diferentes.
for i,r in enumerate(euro['projects']):
    rows[r['slug']]['existingReviews'].append({**loc(euro_rel,'/projects/'+str(i)), 'kind':'conciliacion_de_fuentes_Euro_existente','date':euro.get('fecha',euro.get('date')),
      'cohort':r.get('cohort'), 'scope':'Fuentes por proyecto, precios owner y referencias documentales separados; no equivalente a stock ni vínculo automático precio-modelo-área.',
      'knownConflictsAt':loc(euro_rel,'/projects/'+str(i)+'/knownConflicts'),
      'unknownsAt':loc(euro_rel,'/projects/'+str(i)+'/unknowns')})

leben_rel='docs/catalog-data-completeness-20261116/leben/fase9-comercial-20261117/PROYECTOS-APTOS-BUSQUEDA-PARCIAL.json'
leben=read(A,leben_rel,'e9e256511987a638072b2ddca827df5acba68c3f')
for i,r in enumerate(leben['proyectos']):
    if r['slug'] not in rows: continue
    rows[r['slug']]['existingReviews'].append({**loc(leben_rel,'/proyectos/'+str(i)),
      'kind':'conciliacion_comercial_esencial_Leben_existente','date':'2026-11-17',
      'scope':'Aptitud de consultas parciales con capacidad por una misma referencia y combinaciones no aseguradas explícitas. Preguntas históricas no se reactivan; prevalecen respuestas posteriores.',
      'partialSearchDataSuitableAtThisCut':r['apto_datos_busqueda_parcial'],
      'doesNotCertifyRuntimeFiltersOrStock':r['no_certifica_filtros_implementados_o_stock']})
    rows[r['slug']]['existingQueryWitnesses'].append({**loc(leben_rel,'/proyectos/'+str(i)+'/capacidad_por_una_misma_referencia'),
      'kind':'contrato_combinaciones_por_referencia_Leben_existente','layer':'documentary-prepared-not-stock','date':'2026-11-17',
      'unionsNotAccreditedAt':loc(leben_rel,'/proyectos/'+str(i)+'/combinaciones_aun_no_aseguradas'),
      'contract':'Aplicar capacidad sólo dentro de una misma referencia compatible; las respuestas owner posteriores, incluidoMood, conservan prioridad. No contar como prueba nueva ni stock.'})

# Capa local19/18: punteros explícitos, nunca reemplazo de los nueve estados históricos.
for filename in ['iris-documentary-15.json','iris-documentary-additions-2.json','iris-documentary-r018-vicuna-1103.json','plaza-213-reference.json']:
    rel='tests/fixtures/'+filename; d=read(T,rel,'24a11df1a62898a06b408a729bb20ce1b1de4e87','proyeccion_local_documental_no_oferta')
    records=d.get('records',[d.get('record',{})])
    for i,r in enumerate(records):
        for j,ref in enumerate(r['references']):
            pointer=('/records/'+str(i) if 'records' in d else '/record')+'/references/'+str(j)
            attrs=ref.get('attributes',{})
            rows[r['slug']]['additionalLocalDocumentaryReferences'].append({
              **loc(rel,pointer),'referenceId':ref['id'], 'scope':ref.get('scope',r.get('bindingLimit','Sólo unidad213/modeloC7; no stock ni extensión a otras unidades.')),
              'unit':ref.get('unitLabel',d.get('identity',{}).get('unit')), 'model':ref.get('modelLabel',d.get('identity',{}).get('model')),
              'observedAtUTC':ref.get('observedAtUTC',d.get('createdAtUTC')), 'observedOn':ref.get('observedOn'), 'sourceDocumentDate':ref.get('sourceDocumentDate',ref.get('sourceDate')),
              'nonNullExplicitAttributes':{k:v for k,v in attrs.items() if v is not None and k not in ['priceUF']},
              'sourceMetricsAt':loc(rel,pointer+'/sourceMetrics') if 'sourceMetrics' in ref else None,
              'pricePolicy':'Sin precio Sollahms ni uso comercial del precio externo.' if ref['id'].startswith('IRIS-') else 'UF11119 owner28Oct asociado sólo a213/C7 conprocedencias porcampo; no vigencia/stock acreditados.',
              'primarySource':ref.get('sourceFile'),'primarySHA256':ref.get('sourceSHA256'),
              'notOffer':True,'stock':None,'historicalClassificationUpdated':False})
            rows[r['slug']]['existingQueryWitnesses'].append({**loc(rel,pointer),'kind':'referencia_documental_local_adicional','layer':'local-documentary-not-offer','date':ref.get('sourceDocumentDate',ref.get('sourceDate')),
              'referenceId':ref['id'],'observedAtUTC':ref.get('observedAtUTC',d.get('createdAtUTC')),
              'contract':'Sólo los atributos explícitos y ámbito de esta referencia;19/18no esstock. Precio externoIris excluido de filtros comerciales. Plaza213/C7 no extiende a313/C6/C8;R018no deriva0D ni usoResidential.'})

overlay_path=Path('/private/tmp/sollahms-parking-storage-131-20261118/CLASIFICACION-ESTACIONAMIENTO-BODEGA-131.json')
overlay=json.loads(overlay_path.read_text())
overlay_indices={p['slug']:i for i,p in enumerate(overlay['projects'])}
assert set(overlay_indices)==set(rows)
overlay_pin={'localPath':str(overlay_path),'sha256':sha(overlay_path),'bytes':overlay_path.stat().st_size,'kind':'overlay_independiente_131_sin_duplicar_en_9_campos','reviewStatus':'Consultar REVISION-INDEPENDIENTE-PARKING-STORAGE.json; no ejecutar otra derivación.'}

special={
 'edificio-mood':{'scope':'Cotizaciones owner1D/1B UF3753.20 y2D/2B UF4678.45 válidas por tipología; superficies sólo en sus propios planos. Asociación precio-superficie no confirmada.', 'action':'Conservar búsquedas precio+D/B y perfiles de superficie separados. No volver a preguntar precios ni unidad/modelo.'},
 'edificio-verne':{'scope':'Referencia202: interfazEstudio frente a planoOficina, contradictoria. No aporta referencia residencial nueva.', 'action':'Mantener la discrepancia aislada y excluirla de coincidencias residenciales; no reabrir consulta sin evidencia nueva.'},
 'parque-panama':{'scope':'Producto ownerLocal. PDF residencial9páginas/6planos no respalda sus baños/útil/total.', 'action':'Aceptarunknown explícito paraLocal y consultas respaldadas sin esos filtros; no repetir consulta ni usar departamentos.'},
 'irarrazaval':{'scope':'Baños delEstudio de oferta owner no acreditados; Iris0 ydownload403 agotados.', 'action':'Única intervención vigente OWNER-BATH-IRARR1970-20261118-01. Mantener consultas respaldadas y continuar demásproyectos; no repetir búsqueda.'},
 'own':{'scope':'Vendido, sólo excluido de oferta preparada; ficha e historial conservados.', 'action':'Mantener exclusión preparada de oferta activa; no borrar ficha ni reinterpretar454documentos como stock.'},
 'bordevivo':{'scope':'Oferta actualownerLocal; brochurehistórico residencial no acredita superficies/baños/equipamiento delLocal.', 'action':'Reutilizar ofertaLocal yunknowns aplicables; ningún modelo residencial se incorpora alLocal.'},
 'vergara-domeyko':{'scope':'Oferta actualownerLocal; no está en archivohistórico17brochuresNV.', 'action':'Conservar alcancelocal yunknowns explícitos. No exigir restaurar un registrohistórico ni asignar planos residenciales.'}
}
for slug,row in rows.items():
    refs=row['additionalLocalDocumentaryReferences']
    row['localLayerContext']={'hasAdditionalReference':bool(refs),'identityOnlyInAdditionalLocalLayer':not bool(refs),'doesNotMeanUnauditedHistorically':True}
    row['parkingStorageOverlay']={**overlay_pin,'pointer':'/projects/'+str(overlay_indices[slug])}
    documented=bool(refs) or any(x['kind'] not in ['verificacion_publicada_existente','investigacion_oficial_por_ficha_existente','fuente_especifica_inventariada_no_releida'] for x in row['existingReviews'])
    row['acceptance']['reviewTraceabilityStatus']='ALCANCES_ESPECIFICOS_EXISTENTES_LOCALIZADOS' if documented else 'ALCANCE_PUBLICADO_Y_FUENTES_COMPARTIDAS_LOCALIZADOS'
    row['acceptance']['conclusion']='Información clasificada y antecedentes existentes localizados para reutilización. Este índice no reejecuta QA ni certifica por sí solo combinaciones o adopción comercial de una referencia.'
    row['conditionalNextAction']={'kind':'guia_condicional_de_consulta_no_auditoria_pendiente','condition':'Sólo si una consulta nueva o un hallazgo concreto afecta a este producto; no exige volver a auditarlo por tener desconocidos.', 'requiredToReopenProject':False,'scope':'Consultas efectivamente soportadas por el producto publicado y capas autorizadas; reutilizar evidencias y QA certificados sin repetirlos si hashes iguales.',
      'action':'Usar los punteros de esta fila al revisar el alcance de una consulta pendiente; no completar unknowns ni exigir todas las combinaciones para cerrar consultas parciales.',
      'isMissingOwnerData':False}
    row['remainingWork']=[]
    if refs:
        row['remainingWork'].append({'kind':'integracion_local_pendiente_autorizacion','action':'El suplemento24a con estas referencias sigue local y no oferta. Primerpush/nuevoPRDraft pendiente AUTH-PUSH-PR-SUPPLEMENT-20261118-01; no publicar ni repetir QA sin cambios.','isMissingOwnerData':False})
    if slug in special:
        row['acceptedSpecificLimitation']=special[slug]
        if slug=='irarrazaval':
            row['remainingWork'].append({'kind':'intervencion_owner_ya_abierta','action':special[slug]['action'],'isMissingOwnerData':True})

# Validación documental del índice: no se ejecuta la batería Node/Chrome certificada.
for rel,pointer in POINTERS:
    d=json.loads(Path(REG[rel]['localPath']).read_text())
    for part in pointer.split('/')[1:]:
        part=part.replace('~1','/').replace('~0','~')
        d=d[int(part)] if isinstance(d,list) else d[part]
for slug,row in rows.items():
    assert row['historicalNineFieldClassification']['states']=={k:v['estado'] for k,v in class_by_slug[slug][1]['campos'].items()}
assert sum(len(r['additionalLocalDocumentaryReferences']) for r in rows.values())==19
assert sum(bool(r['additionalLocalDocumentaryReferences']) for r in rows.values())==18
assert sum(not bool(r['additionalLocalDocumentaryReferences']) for r in rows.values())==113
for rel,m in REG.items(): assert sha(Path(m['localPath']))==m['sha256']
summary=collections.Counter(r['developer'] for r in rows.values())
result={
 'schemaVersion':1,'date':'2026-11-18','kind':'INDICE_DE_ACEPTACION_Y_TRAZABILIDAD_EXISTENTE_NO_AUDITORIA_NUEVA',
 'status':'NO_CERTIFICADO_GLOBALMENTE','universe':{'projects':131,'source':catalog_rel,'sha256':REG[catalog_rel]['sha256'],'perDeveloper':dict(summary)},
 'readingPolicy':{'sourceRecoveryIsExistingEvidence':True,'newPrimaryQueries':0,'newOwnerReceipts':0,'newFactsCreated':0,'historicalNineFieldsChanged':False,'historical313IdsOrBalanceChanged':False,'appOrGitChanged':False,'certifiedTestsRepeated':False},
 'acceptanceCriteria':{'source':loc(criteria_rel,'/criterio_minimo_de_aceptacion'),'unit':'Consulta y referencia compatible; no todos los campos completos por proyecto.','unknownsAreAllowed':True,'additionalIrisReferenceRequiredForEveryProject':False},
 'counts':{'projectsWithExistingFicheResearchRecords':131,'projectsWithScopedExistingSpecificRecordsBeyondFiche':sum(r['acceptance']['reviewTraceabilityStatus']=='ALCANCES_ESPECIFICOS_EXISTENTES_LOCALIZADOS' for r in rows.values()),'projectsWithPublishedAndSharedEvidenceOnly':sum(r['acceptance']['reviewTraceabilityStatus']=='ALCANCE_PUBLICADO_Y_FUENTES_COMPARTIDAS_LOCALIZADOS' for r in rows.values()),'existingQueryWitnessLocators':sum(len(r['existingQueryWitnesses']) for r in rows.values()),'additionalLocalReferences':19,'projectsWithAdditionalLocalReferences':18,'identityOnlyInAdditionalLocalLayer':113,'identityOnlyDoesNotMeanUnaudited':True,'historicalNineFieldCountsUnchanged':cls['resumen_estados_por_campo']},
 'whatThisEstablishes':['Los131proyectos tienen identidad exacta y los9estados históricos trazados sin cambios.','Existen revisiones primarias documentales/comerciales previas con distinto corte y alcance, además de la clasificación compartida; se conservan punteros reales y no se ordena repetirlas.','19referenciaslocales/18proyectos son una capa adicional;113identidades no equivalen a113proyectos sin auditoría.','Los registros de Maestra y NorteVerde recuperados son versiones previas existentes, no documentación recibida nueva ni un cambio de datos comerciales.'],
 'globalRemainder':{'technical':'Conciliar únicamente aceptación pendiente de consultas/productos actuales con los testigos y QA ya existentes; preservar incompatibilidades y desconocidos explícitos. Este índice no sustituye revisión independiente del candidato ni verificación de producción autorizada.','externalAuthorization':'AUTH-PUSH-PR-SUPPLEMENT-20261118-01 para primerpush/nuevoPRDraft del suplemento24a. No autorizaReady/merge/deployment/promoción.','ownerData':'Sólo OWNER-BATH-IRARR1970-20261118-01 sigue como solicitud indispensable ya abierta; no derivar preguntas nuevas de unknowns.','independentWorkCanContinue':['Conciliar el índice con el overlayparking/bodega de131 sin alterar9campos históricos.','Registrar por consulta pendiente su fuente exacta y alcance; reutilizar revisiones históricas y controles certificados que cubran ese alcance.','Mantener instruccionesMood y excepcionesVerne/ParquePanamá/Irarrsinreabrirlas.','Conservar documentación/autorizaciones y preparar integración sin modificarproducción.']},
 'parkingStorageOverlay':overlay_pin,'sources':REG,'projects':list(rows.values()),
 'validation':{'uniqueProjectCount':131,'sameSlugsAsPublishedUniverse':True,'historicalNineFieldStatesEqualPerProject':True,'jsonPointersResolved':len(POINTERS),'allIndexedReadSourcesUnchanged':True,'localReferenceCount':19,'projectsWithLocalReference':18,'ownerQuestionsInvented':0,'thisIsDocumentValidationNotCertifiedTestRerun':True}
}
result['counts'].update({'distinctExistingAuthorizationBlockers':1,'distinctExistingOwnerInformationBlockers':1,'projectsRequiringNewAuditBecauseOfUnknowns':0})
OUT.mkdir(exist_ok=True)
target=OUT/'INDICE-ACEPTACION-POR-PROYECTO.json'
target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'output':str(target),'sha256':sha(target),'bytes':target.stat().st_size,'counts':result['counts'],'validation':result['validation']},ensure_ascii=False,indent=2))
