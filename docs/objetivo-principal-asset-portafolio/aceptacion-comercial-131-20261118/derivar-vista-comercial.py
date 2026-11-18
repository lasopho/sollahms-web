#!/usr/bin/env python3
"""Vista documental compacta de once campos. No auditoría primaria ni motor de filtros."""
import collections
import hashlib
import json
from pathlib import Path

OUT=Path('/private/tmp/sollahms-consolidacion-comercial-131-20261118')
I=Path('/private/tmp/sollahms-aceptacion-131-20261118/INDICE-ACEPTACION-POR-PROYECTO.json')
P=Path('/private/tmp/sollahms-parking-storage-131-20261118/CLASIFICACION-ESTACIONAMIENTO-BODEGA-131.json')
A=Path('/private/tmp/sollahms-auditoria-leben-20261116')
CLASS_REL='docs/objetivo-principal-asset-portafolio/CLASIFICACION-COMERCIAL-131.json'
COMBO=OUT/'ANALISIS-COMBINACIONES.json'
READ_SET={}
POINTERS=[]
DATA={}
FIELD_MAP={'tipo_propiedad':'propertyType','precio':'priceUF','dormitorios':'bedrooms','banos':'bathrooms','util':'usefulM2','total':'totalM2','entrega':'delivery','estado':'state','amenities':'amenities'}
REASONS={
 'VALOR_NO_ESTRUCTURADO_EN_ESTE_CORTE':'Sin valor reutilizable rotulado en estos registros indexados. No afirma que el dato nunca exista ni que deba repetirse su investigación.',
 'ALCANCE_PARCIAL_DECLARADO':'La evidencia sólo cubre los resúmenes, referencias, modelos o etapas declarados. No requiere completar todas las unidades para conservar consultas respaldadas.',
 'RESUMEN_NO_ES_ASOCIACION':'Un valor o rango de resumen no acredita su relación con precio, modelo, unidad o etapa de otra referencia.',
 'RELACION_ENTRE_HECHOS_NO_ACREDITADA':'Los hechos pueden estar documentados por separado; su relación conjunta no se deduce de similitud de precio, tipología, nombre o área.',
 'ROTULO_METRICO_DISTINTO':'Internos, interior, útil, total y terraza permanecen separados. Un rótulo distinto no completa automáticamente la métrica pedida.',
 'OBSERVACION_REFERENCIAL_NO_OFERTA':'Dato observado sólo en la referencia indicada. No es oferta, stock, adopción comercial ni confirmación general del proyecto.',
 'CONFLICTO_DE_ASOCIACION':'El valor observado se conserva, pero la asociación de edificio, torre, modelo o plano está en conflicto; no habilita una combinación publicable automática.',
 'PRODUCTO_DISTINTO':'La documentación de departamentos u otro producto no respalda automáticamente el Local, terreno, oficina o etapa de la oferta owner.',
 'ANTECEDENTE_HISTORICO':'Fecha y alcance históricos de la propia fuente; no confirma vigencia comercial o stock actual.',
 'CONTRADICCION_DECLARADA':'Existe contradicción declarada en el alcance indicado. No se resuelve seleccionando arbitrariamente una fuente.',
 'INCLUSION_NO_DECLARADA_GLOBALMENTE':'No hay inclusión global acreditada. Las inclusiones o exclusiones expresas por precio permanecen restringidas a esas referencias.',
 'DISPONIBILIDAD_NO_ASIGNADA':'No se acredita disponibilidad o asignación actual a una unidad/referencia exacta. No implica ausencia física del producto.',
 'MENCION_NO_ES_PRODUCTO_PRIVADO':'Una mención general o una oferta adicional no acredita un espacio privado/asignado incluido en el precio.',
 'SERVICIO_O_VISITA_EXCLUIDO':'La mención de visitas o servicios no es evidencia de un estacionamiento o bodega privados del inmueble.',
 'PRECIO_ADICIONAL_SEPARADO':'Un importe adicional permanece separado del precio del inmueble; no se suma ni se asigna a otra unidad.',
 'NO_APLICABLE_DECLARADO':'Se conserva únicamente el no aplicable declarado por la fuente; no se deriva de un desconocido.'
}

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def esc(s):return str(s).replace('~','~0').replace('/','~1')
def read(key,path,expected=None,commit=None):
    p=Path(path);digest=sha(p)
    if expected:assert digest==expected, 'Fuente cambió: '+str(p)
    READ_SET[key]={'path':str(p),'sha256':digest,'bytes':p.stat().st_size,'commit':commit,'newEvidence':False}
    DATA[key]=json.loads(p.read_text());return DATA[key]
def ptr(key,pointer):
    POINTERS.append((key,pointer));return {'source':key,'pointer':pointer}
def resolve(d,p):
    for part in p.split('/')[1:]:
        part=part.replace('~1','/').replace('~0','~')
        d=d[int(part)] if isinstance(d,list) else d[part]
    return d
def evidence_family(e):
    raw=e.get('capa');f=e.get('fuente')
    if raw=='preparada_F9':return 'preparedLeben'
    if raw=='historia_comercial':return 'historicalCommercial'
    if raw in ['owner_declaracion','owner_unidad'] and f!='data/proyectos.json':return 'ownerRetained'
    if f=='data/proyectos.json':return 'publishedRecords'
    if raw in ['publicado','proyeccion_existente','investigacion_heredada','caracteristicas_existentes']:return 'publishedSupportOrProjection'
    return 'documentaryExisting'

index=read('acceptanceIndex',I,'4b9487d8964e35b15c3dd4c372d3edf7aa9b57f2c6c581b0d9aeeb309470cc4f')
parking=read('parkingStorage',P,'74dacc7ad347e57bd84cb24927a7ab60c09eec1a687df2668bfdc70a13ef8e53')
class_pin=index['sources'][CLASS_REL]
classification=read('historical9',A/CLASS_REL,class_pin['sha256'],class_pin['commit'])
classes={r['slug']:(i,r) for i,r in enumerate(classification['proyectos'])}
parks={r['slug']:(i,r) for i,r in enumerate(parking['projects'])}
assert len(index['projects'])==len(classes)==len(parks)==131
assert {r['slug'] for r in index['projects']}==set(classes)==set(parks)
combo=read('combinationAnalysis',COMBO) if COMBO.exists() else None
if combo is not None:assert 'projectsBySlug' in combo

projects={};scoped_promotions=[]
for ix,project in enumerate(index['projects']):
    slug=project['slug'];ci,c=classes[slug];pi,p=parks[slug]
    local_details={};adds=collections.defaultdict(list);metric_limits=collections.defaultdict(list)
    for l in project['additionalLocalDocumentaryReferences']:
        rel=l['source'];key='fixture:'+rel
        if key not in DATA:
            pin=index['sources'][rel];read(key,pin['localPath'],pin['sha256'],pin['commit'])
        ref=resolve(DATA[key],l['pointer']);record_pointer=l['pointer'].rsplit('/references/',1)[0];record=resolve(DATA[key],record_pointer)
        constraints=ref.get('constraints',[])
        conflict=any(x.get('kind')=='building-scope-conflict' for x in constraints)
        attrs=ref.get('attributes',{})
        status='PARCIAL_EN_REFERENCIA_CON_CONFLICTO_DE_ASOCIACION' if conflict else 'DOCUMENTADO_SOLO_EN_REFERENCIA_NO_OFERTA'
        observed={k:v for k,v in attrs.items() if v is not None}
        # El precio externo nunca se convierte en precio comercial. Plaza213 conserva su fuente owner específica.
        if ref['id'].startswith('IRIS-'):observed.pop('priceUF',None)
        local_details[ref['id']]={
          'source':ptr(key,l['pointer']),'unit':l.get('unit'),'model':l.get('model'),
          'sourceDocumentDate':l.get('sourceDocumentDate'),'observedAtUTC':l.get('observedAtUTC'),'observedOn':l.get('observedOn'),
          'scope':l.get('scope'),'recordBindingLimit':record.get('bindingLimit'),'status':status,
          'observedAttributes':observed,'constraints':constraints,
          'sourceMetrics':ref.get('sourceMetrics',[]),'explicitPlanMetricsAt':ptr(key,l['pointer']+'/explicitPlanMetrics') if 'explicitPlanMetrics' in ref else None,
          'notOffer':True,'stockCertified':False,'querySupportNotConcludedByThisView':True}
        for field,attribute in FIELD_MAP.items():
            if observed.get(attribute) is not None:adds[field].append({'referenceId':ref['id'],'attribute':attribute,'state':status})
        for metric in ref.get('sourceMetrics',[]):
            if metric.get('storedKey') in ['internalM2','interiorM2'] and metric.get('canonicalInteriorUsefulTotalMapping') is None:
                for field in ['util','total']:
                    if attrs.get(FIELD_MAP[field]) is None:metric_limits[field].append(ref['id'])
    fields={}
    for field in FIELD_MAP:
        original=c['campos'][field];state=original['estado'];evidences=original.get('evidencias',[])
        assert state==project['historicalNineFieldClassification']['states'][field]
        layers={}
        for e in evidences:
            family=evidence_family(e);x=layers.setdefault(family,{'sourceStates':set(),'scopeKinds':set(),'sourceDates':set(),'evidenceEntries':0})
            x['sourceStates'].add(e['estado']);x['scopeKinds'].add(e.get('alcance'));x['evidenceEntries']+=1
            dt=e.get('fecha_fuente_declarada',e.get('fecha_revision_declarada'))
            if dt:x['sourceDates'].add(dt)
        layers={k:{a:sorted(v) if isinstance(v,set) else v for a,v in x.items()} for k,x in layers.items()}
        if adds[field]:layers['documentaryLocal24a']={'sourceStates':sorted({x['state'] for x in adds[field]}),'referenceIds':sorted({x['referenceId'] for x in adds[field]})}
        view_state='parcial' if state=='desconocido' and adds[field] else state
        reasons=[]
        if state=='desconocido' and not adds[field]:reasons.append('VALOR_NO_ESTRUCTURADO_EN_ESTE_CORTE')
        if state=='parcial':reasons.append('ALCANCE_PARCIAL_DECLARADO')
        if state=='historico':reasons.append('ANTECEDENTE_HISTORICO')
        if state=='contradictorio':reasons.append('CONTRADICCION_DECLARADA')
        if state=='noaplicable':reasons.append('NO_APLICABLE_DECLARADO')
        if evidences and all(e.get('alcance') in ['resumen_proyecto','tipo_activo_solo'] for e in evidences):reasons.append('RESUMEN_NO_ES_ASOCIACION')
        if metric_limits[field]:reasons.append('ROTULO_METRICO_DISTINTO')
        if adds[field]:reasons.append('OBSERVACION_REFERENCIAL_NO_OFERTA')
        if any(x['state']=='PARCIAL_EN_REFERENCIA_CON_CONFLICTO_DE_ASOCIACION' for x in adds[field]):reasons.append('CONFLICTO_DE_ASOCIACION')
        fields[field]={
          'historicalState':state,'documentaryCoverageState':view_state,
          'detail':ptr('historical9','/proyectos/'+str(ci)+'/campos/'+field),
          'evidenceByFamily':layers,'additionalScopedValues':adds[field],
          'unknownValueInIndexedScopes':state=='desconocido' and not adds[field],
          'limitationReasonCodes':reasons,'differentMetricLabelReferenceIds':sorted(set(metric_limits[field])),
          'notProofOfAllUnitsOrAllQueries':True}
        if field=='dormitorios':fields[field]['studioDoesNotImplyNumericZero']=True
        if slug in ['parque-panama','bordevivo','vergara-domeyko'] and field in ['dormitorios','banos','util','total','amenities']:
            fields[field]['applicabilityToCurrentOwnerProduct']='NO_ACREDITADA'
            fields[field]['currentOwnerProductScope']='Local; las observaciones de departamentos o generales se conservan en sus propios alcances.'
            if 'PRODUCTO_DISTINTO' not in fields[field]['limitationReasonCodes']:fields[field]['limitationReasonCodes'].append('PRODUCTO_DISTINTO')
        if slug=='edificio-mood' and field in ['precio','util','total']:
            fields[field]['priceAreaAssociation']='NO_CONFIRMADA'
            if 'RELACION_ENTRE_HECHOS_NO_ACREDITADA' not in fields[field]['limitationReasonCodes']:fields[field]['limitationReasonCodes'].append('RELACION_ENTRE_HECHOS_NO_ACREDITADA')
        if slug=='irarrazaval' and field=='dormitorios':fields[field]['numericCountForOwnerStudio']='NO_ACREDITADO; se conserva tipología literal Estudio sin convertirla en0.'
        if slug=='irarrazaval' and field=='banos':fields[field]['existingOwnerIntervention']='OWNER-BATH-IRARR1970-20261118-01'
        if slug=='edificio-verne' and field=='tipo_propiedad':
            fields[field]['specificReferenceLimit']='Sólo la referencia202 presenta interfazEstudio/planoOficina; no se vuelve residencial por defecto ni contradice automáticamente todas las demás referencias.'
            fields[field]['limitationReasonCodes'].append('CONTRADICCION_DECLARADA')
        if state=='desconocido' and adds[field]:
            scoped_promotions.append({'slug':slug,'field':field,'historicalState':'desconocido','viewState':'parcial','referenceIds':[x['referenceId'] for x in adds[field]],'hasAssociationConflict':any(x['state']=='PARCIAL_EN_REFERENCIA_CON_CONFLICTO_DE_ASOCIACION' for x in adds[field])})
    for outfield,pk in [('estacionamiento','parking'),('bodega','storage')]:
        raw=p[pk];inclusion=raw['inclusion'];mention=raw['productMention'];offer=raw['additionalCost']['generalOffer']
        any_scoped=mention['state']!='desconocido' or bool(inclusion['byPriceReference']) or bool(raw['additionalCost']['amounts'])
        reasons=[]
        if mention['state']=='desconocido':reasons.append('VALOR_NO_ESTRUCTURADO_EN_ESTE_CORTE')
        else:reasons.append('MENCION_NO_ES_PRODUCTO_PRIVADO')
        if inclusion.get('projectWideValue') is None:reasons.append('INCLUSION_NO_DECLARADA_GLOBALMENTE')
        if raw['availability']['state']=='desconocido':reasons.append('DISPONIBILIDAD_NO_ASIGNADA')
        if raw['excludedServiceMentions']:reasons.append('SERVICIO_O_VISITA_EXCLUIDO')
        if raw['additionalCost']['amounts']:reasons.append('PRECIO_ADICIONAL_SEPARADO')
        base='/projects/'+str(pi)+'/'+pk
        fields[outfield]={
          'documentaryCoverageState':'parcial' if any_scoped else 'desconocido','detail':ptr('parkingStorage',base),
          'componentStates':{'productMention':mention['state'],'priceInclusion':inclusion['state'],'exactAvailability':raw['availability']['state'],'additionalGeneralOffer':offer['state']},
          'generalProductMention':mention.get('value'),'privateOrAssignedProductConfirmed':mention.get('privateOrAssignedProductConfirmed'),
          'includedInPriceReferences':[{'referenceId':x['referenceId'],'state':x['state'],'includedInDeclaredPropertyPrice':x.get('includedInDeclaredPropertyPrice')} for x in inclusion['byPriceReference']],
          'projectWideInclusion':inclusion.get('projectWideValue'),'exactAvailability':raw['availability'].get('value'),
          'additionalAmountCount':len(raw['additionalCost']['amounts']),'additionalAmountsAt':ptr('parkingStorage',base+'/additionalCost/amounts'),
          'excludedServiceMentions':len(raw['excludedServiceMentions']),'limitationReasonCodes':reasons,
          'preparedProjectionNotGlobalTruth':True,'notProofOfAllUnitsOrAllQueries':True}
    constraints=[]
    if project.get('acceptedSpecificLimitation'):constraints.append({'source':ptr('acceptanceIndex','/projects/'+str(ix)+'/acceptedSpecificLimitation'),'literal':project['acceptedSpecificLimitation']})
    relation_limits=[]
    if slug=='edificio-mood':relation_limits.append({'relation':'precio_superficie','status':'NO_CONFIRMADA','reasonCode':'RELACION_ENTRE_HECHOS_NO_ACREDITADA','scope':'Cotizaciones por tipología válidas; perfiles de planos válidos en su propio alcance, sin asignación precio-plano. No volver a pedir precios/unidad.'})
    if slug in ['parque-panama','bordevivo','vergara-domeyko']:
        relation_limits.append({'relation':'oferta_local_vs_planos_residenciales','status':'NO_TRANSFERIBLE','reasonCode':'PRODUCTO_DISTINTO','scope':'El producto ownerLocal no hereda D/B, superficies ni equipamiento de departamentos.'})
    combo_link=ptr('combinationAnalysis','/projectsBySlug/'+esc(slug)) if combo else {'expectedSource':str(COMBO),'expectedPointer':'/projectsBySlug/'+esc(slug),'state':'ANALISIS_PARALELO_AUN_NO_FIJADO'}
    projects[slug]={
      'name':project['name'],'developer':project['developer'],
      'acceptanceIndex':ptr('acceptanceIndex','/projects/'+str(ix)),
      'fields':fields,'localReferenceDetails':local_details,'relationLimits':relation_limits,'specificConstraints':constraints,
      'historicalUnknownFieldsWithoutAdditionalScopedValue':[f for f in FIELD_MAP if fields[f]['unknownValueInIndexedScopes']],
      'parkingStorageUnknownsAreComponentsNotOwnerRequests':True,
      'existingOwnerInterventionIds':['OWNER-BATH-IRARR1970-20261118-01'] if slug=='irarrazaval' else [],
      'combinationEvidence':combo_link,'globalStatus':'NO_CERTIFICADO_GLOBALMENTE',
      'newOwnerQuestionRequiredByThisView':False}

for key,pointer in POINTERS:resolve(DATA[key],pointer)
for key,m in READ_SET.items():assert sha(Path(m['path']))==m['sha256'],'Entrada cambió durante derivación: '+key
assert len(projects)==131 and all(len(x['fields'])==11 for x in projects.values())
assert len(scoped_promotions)==8 and len({x['slug'] for x in scoped_promotions})==6
assert all(not p['newOwnerQuestionRequiredByThisView'] for p in projects.values())
summary={f:dict(collections.Counter(p['fields'][f]['documentaryCoverageState'] for p in projects.values())) for f in next(iter(projects.values()))['fields']}
result={
 'schemaVersion':1,'date':'2026-11-18','kind':'VISTA_COMPACTA_DE_COBERTURA_Y_LIMITES_POR_PROYECTO_NO_AUDITORIA_NUEVA',
 'universe':{'projects':131,'keysPerProject':11,'sameSlugsAsAcceptanceIndex':True,'newDiscovery21NotIncorporated':True},
 'meaning':{'coverageState':'Estado documental dentro de los alcances indexados, nunca aprobación de todas las consultas/unidades ni prueba de uso publicado.','historicalState':'Copia intacta de los nueve campos históricos. La capa adicional se muestra aparte.','unknown':'No hay un valor reutilizable rotulado en estos registros para ese alcance; no afirma inexistencia física, búsqueda exhaustiva ni tarea automática de investigación.','unknownFlag':'unknownValueInIndexedScopes es sólo estado histórico desconocido sin observación adicional. False no certifica valor numérico, aplicabilidad al producto owner ni relación conjunta; una tipología literal Estudio sigue sin implicar0D.','unknownWithoutFilter':'Un desconocido no debe excluir consultas que no usan ese atributo. La elegibilidad concreta se consulta en el análisis separado.','partial':'Dato localizado en un alcance limitado, no obligación de recuperar todo el inventario.','layers':'Presencia en un archivo, evidencia documental, hecho owner retenido, capa preparada y uso del filtro publicado son ejes distintos. No se unen.'},
 'reasonDictionary':REASONS,
 'summary':{'coverageStatesByField':summary,'historicalUnknownFieldsWithAdditionalScopedObservations':scoped_promotions,'countsAreNotHistoricalPendingClosures':True,'newEvidenceReceived':0,'newCommercialFactsOrIdsCreated':0,'historical313Closed':0,'historicalNineStatesChanged':False,'newOwnerQuestionsCreated':0,'technicalOrProductionChanges':False},
 'combinationAnalysis':{'source':ptr('combinationAnalysis','/projectsBySlug') if combo else None,'pendingPath':str(COMBO) if combo is None else None,'rule':'Sólo ese análisis separa contrato/testigo por capa y combina campos compatibles. La vista no convierte sus propios punteros o resúmenes en coincidencias certificadas.'},
 'existingInterventionsOnly':['AUTH-PUSH-PR-SUPPLEMENT-20261118-01','OWNER-BATH-IRARR1970-20261118-01'],
 'sources':READ_SET,'projectsBySlug':projects,
 'documentValidation':{'projectCount':131,'elevenFieldsEveryProject':True,'jsonPointersResolved':len(POINTERS),'allReadHashesUnchangedDuringRun':True,'newPrimaryQueriesOrAppTests':0,'noWritesToAOrT2':True}}
OUT.mkdir(exist_ok=True)
target=OUT/'VISTA-COMERCIAL-POR-PROYECTO.json';target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'output':str(target),'sha256':sha(target),'bytes':target.stat().st_size,'projectCount':len(projects),'unknownToScopedObservations':len(scoped_promotions),'combinationAnalysisLinked':combo is not None,'validation':result['documentValidation']},ensure_ascii=False,indent=2))
