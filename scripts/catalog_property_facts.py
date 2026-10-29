#!/usr/bin/env python3
"""Read-only projection of property filters from source data. Never changes source files.
Usage: python build_filter_property_audit.py --root PATH --output PATH.json [--report PATH.md]
The projection contains no prices. Combined predicates must match a single variant.
"""
import argparse,collections,hashlib,json,re,unicodedata
from pathlib import Path

def normalize(x):
    return ''.join(c for c in unicodedata.normalize('NFKD',str(x)).lower() if not unicodedata.combining(c))
def number(x):
    if x is None:return None
    if isinstance(x,(int,float)):return x
    text=str(x).strip().replace(',','.')
    return float(text) if re.fullmatch(r'\d+(?:\.\d+)?',text) else None
def bedrooms(text):
    text=normalize(text)
    if 'estudio' in text:return 0
    m=re.search(r'\b(\d+)\s*(?:dorm|d\b)',text)
    return int(m[1]) if m else None
def bathrooms(text):
    m=re.search(r'\b(\d+)\s*(?:bano|b\b)',normalize(text))
    return int(m[1]) if m else None
def count_endpoints(text):
    if text is None or re.search('unidad|depto',str(text),re.I):return []
    return sorted(set(int(x) for x in re.findall(r'\b[0-9]+\b',str(text))))
def pointer(*parts):return '/'+ '/'.join(str(x).replace('~','~0').replace('/','~1') for x in parts)
def evidence(file,*parts,pages=None,url=None):
    record={'file':file,'pointer':pointer(*parts)}
    if pages:record['pages']=pages
    if url:record['sourceUrl']=url
    return record

def variant(id,label,ptype,beds,baths,areas,proof,scope='model',**extra):
    values={k:number(v) for k,v in areas.items() if number(v) is not None}
    result={'id':id,'label':label,'propertyType':ptype,'bedrooms':beds,'bathrooms':baths,'areas':values,
        'areaSourceValues':{k:str(v) for k,v in areas.items() if number(v) is not None},
        'typology':('estudio' if beds==0 else f'{beds}d' if beds is not None else ptype or 'sin-tipologia')+(f'-{baths}b' if baths is not None else ''),
        'scope':scope,'evidence':proof}
    if 'terraza' in values:result['privateTerrace']=values['terraza']>0
    if 'jardin' in values:result['privateGarden']=values['jardin']>0
    result.update(extra)
    return result

class Audit:
    def __init__(self,root):
        self.root=Path(root).resolve();self.cache={};self.projects={};self.counts=collections.Counter()
        self.catalogue=self.load('data/proyectos.json');self.fiches=self.load('data/fichas-proyectos.json')
        self.pi={p['slug']:i for i,p in enumerate(self.catalogue)};self.fi={p['slug']:(i,p) for i,p in enumerate(self.fiches)}
    def load(self,file):
        if file not in self.cache:self.cache[file]=json.loads((self.root/file).read_text())
        return self.cache[file]
    def add(self,slug,row,group):
        if slug not in self.projects:return
        self.projects[slug]['variants'].append(row);self.counts[group]+=1
    def core(self):
        statusmap={'entrega inmediata':'inmediata','venta en blanco':'en-blanco','en blanco':'en-blanco','venta en verde':'en-verde','en verde':'en-verde','en construccion':'en-construccion','en recepcion final':'en-recepcion-final','proxima entrega':'proxima-entrega','entrega futura':'entrega-futura','vendido':'vendido','sin unidades disponibles':'sin-unidades','en desarrollo':'en-desarrollo','lanzamiento':'lanzamiento'}
        for i,p in enumerate(self.catalogue):
            j,f=self.fi[p['slug']];known=p.get('verificacion',{}).get('camposVerificados',[])
            label=p.get('entrega');confirmed=bool(label and ('entrega' in known or 'entrega' in f['verifiedFields'] and label==f.get('updates',{}).get('entrega')))
            proof=evidence('data/proyectos.json',i,'entrega') if 'entrega' in known else evidence('data/fichas-proyectos.json',j,'updates','entrega',url=f['sourceUrl'])
            delivery={'label':label,'immediate':None,'year':None,'confirmed':confirmed,'evidence':proof if label else None}
            if confirmed:
                text=normalize(label);year=re.search(r'\b(20\d{2})\b',text)
                delivery.update(year=int(year[1]) if year else None,immediate=True if 'inmediata' in text else False if year else None)
                delivery['precision']='semester' if 'semestre' in text else 'quarter' if 'trimestre' in text else 'month' if re.search('enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre',text) else 'year' if year else 'immediate' if delivery['immediate'] else 'delivered' if 'entregado' in text else 'unspecified'
            state=p.get('estado');stateok=bool(state and ('estado' in known or 'estado' in f['verifiedFields'] and f.get('updates',{}).get('estado')==state))
            if p['inmobiliaria']=='Norte Verde' and 'estado' not in known:stateok=False
            if p.get('stageConflict'):stateok=False
            row={'name':p['nombre'],'developer':p['inmobiliaria'],'developerEvidence':evidence('data/proyectos.json',i,'inmobiliaria'),'propertyTypes':[],'propertyTypeEvidence':[],'variants':[],'delivery':delivery,'status':{'label':state,'key':statusmap.get(normalize(state)) if stateok else None,'confirmed':stateok,'evidence':evidence('data/proyectos.json',i,'estado') if state else None},'referenceStageSlug':p.get('etapaReferenciaSlug'),'catalogTypologies':{'labels':p.get('tipologias',[]),'evidence':evidence('data/proyectos.json',i,'tipologias') if 'tipologias' in p else None,'verified':bool('tipologias' in known or p.get('commercialSource',{}).get('type')=='owner-supplied')},'aggregateEvidence':{'specs':f['specs'],'evidence':evidence('data/fichas-proyectos.json',j,'specs',url=f['sourceUrl']),'combineAsModel':False,'surfaceSinceExcluded':p.get('superficieDesdeM2'),'surfaceSinceReason':'Unlabelled catalogue minimum is not interchangeable with useful, total, interior or land.'},'excluded':[],'pending':[]}
            if label and not confirmed:row['excluded'].append({'field':'delivery','value':label,'reason':'Current same-product delivery unverified or explicitly pending; historical brochure dates excluded.'})
            if state and not stateok:row['excluded'].append({'field':'status','value':state,'reason':'Reported catalogue state lacks current matching certification; owner commercial source does not certify reception/stock.'})
            self.projects[p['slug']]=row
    def specialized_models(self):
        # Technical records from the existing central fiche registry, never stock/prices.
        for slug,(i,f) in self.fi.items():
            source=f.get('officialSurfaceModels')
            if not source:continue
            for j,m in enumerate(source['records']):
                areas={'util':m['usefulM2'],'terraza':m['terraceM2']}
                # Totals with unexplained extra private areas are not interchangeable.
                if abs(m['totalM2']-m['usefulM2']-m['terraceM2'])<0.011:areas['total']=m['totalM2']
                self.add(slug,variant('official-layout-'+str(j+1),m['typology'],'departamento',bedrooms(m['typology']),bathrooms(m['typology']),areas,evidence('data/fichas-proyectos.json',i,'officialSurfaceModels','records',j,url=source['sourceUrl']),sourceKind='official_technical_layout',availability='not_inferred',limitations=['Approximate technical dimensions; no price or stock association.']),'Official typed surfaces')
        for i,p in enumerate(self.load('data/sento-review.json')['projects']):
            if p['slug']=='plaza-las-condes':continue
            for j,m in enumerate(p['models']):
                areas={};excluded=[]
                for a in m['areas']:
                    key={'useful':'util','interior':'interior','total':'total','terrace':'terraza','garden':'jardin','land':'terreno'}.get(a.get('kind'))
                    if key and a.get('publishable',True) and a.get('valueM2') is not None:areas[key]=a['valueM2']
                    elif key:excluded.append({'field':key,'reason':'Unknown or not publishable in final model audit.'})
                row=variant('sento-'+str(m.get('code',j)),m['label'],'departamento',m.get('bedrooms'),m.get('bathrooms'),areas,evidence('data/sento-review.json','projects',i,'models',j,pages=[m['sourcePage']] if m.get('sourcePage') else None),limitations=m.get('consumerNotes',[]),excludedFields=excluded,sourceKind='audited_model',availability='not_inferred')
                if m.get('planAudit'):row['auditEvidence']=evidence('data/sento-review.json','projects',i,'models',j,'planAudit')
                self.add(p['slug'],row,'Sento audited')
        for i,m in enumerate(self.load('data/leon-plan-surfaces.json')['plans']):
            areas={};excluded=[]
            for a in m['areas']:
                key={'useful':'util','interior':'interior','total':'total','terrace':'terraza','garden':'jardin'}.get(a['kind'])
                if key and a.get('valueM2') is not None and a['status']=='confirmado':areas[key]=a['valueM2']
                elif key:excluded.append({'field':key,'reason':'Explicitly not applicable' if a.get('applicable') is False else 'Not confirmed in final review','status':a.get('status')})
            row=variant(m['id'],m['typology'],'departamento',m['bedrooms'],m['bathrooms'],areas,evidence('data/leon-plan-surfaces.json','plans',i,pages=[m['pdf']['page']],url=m['officialUrl']),limitations=[m['status']] if m['status']!='confirmado' else [],excludedFields=excluded,sourceKind='audited_model',availability='not_inferred')
            if any(a['kind']=='terrace' and a.get('applicable') is False for a in m['areas']):row['privateTerrace']=False
            self.add(m['projectSlug'],row,'Leon audited')
        plc=self.load('data/plaza-las-condes-verified.json')
        for i,m in enumerate(plc['plans']):
            row=variant('plc-'+m['model'],m['model'],'departamento',bedrooms(m['typology']),m['baths'],{'total':m.get('totalM2')},evidence('data/plaza-las-condes-verified.json','plans',i,pages=[m['brochurePage']],url=m.get('source')),sourceKind='current_verified_model',availability='not_inferred')
            if m.get('totalM2') is None:row['excludedFields']=[{'field':'total','reason':'Conflicting documents; current verified record explicitly leaves it null.'}]
            self.add('plaza-las-condes',row,'Plaza approved')
        self.projects['plaza-las-condes']['excluded'].append({'field':'owner_units','evidence':evidence('data/plaza-las-condes-verified.json','units'),'reason':'Private owner unit data excluded from public filter variants; never map unit interior areas to model useful or total.'})
        for slug,p in self.load('data/nollagam-brochures.json')['projects'].items():
            for j,m in enumerate(p['models']):
                kind='util' if 'util' in normalize(m.get('interior_label','')) else 'interior'
                self.add(slug,variant(m['id'],m['name'],'departamento',m['beds'],m['baths'],{kind:m.get('interior'),'total':m.get('total'),'terraza':m.get('terrace'),'jardin':m.get('garden')},evidence('data/nollagam-brochures.json','projects',slug,'models',j,pages=[m['page']]),floors=m.get('floors'),limitations=m.get('issues',[]),sourceKind='printed_model_variant',availability='not_inferred',historicalStampIgnored=bool(m.get('historical_sold_out_stamp'))),'Nollagam variants')
    def brochure_models(self):
        for slug,p in self.load('data/euro-brochures.json')['projects'].items():
            for j,m in enumerate(p['variants']):
                areas={a['metric']:a['value'] for a in m['areas'] if m['filterEligibility']['areas'] and not a.get('average')}
                self.add(slug,variant('euro-'+m['id'],m['sourceLabel'],'departamento',m['bedrooms'],m['bathrooms'],areas,evidence('data/euro-brochures.json','projects',slug,'variants',j,pages=[m['sourcePage']]),limitations=m['notes'],sourceKind='audited_brochure_model',availability='not_inferred'),'Euro reviewed models')
        for j,m in enumerate(self.load('data/euro-official-review.json')['diagonalVicuna']['variants']):
            self.add('diagonal-vicuna',variant(m['id'],m['label'],'departamento',m['bedrooms'],m['bathrooms'],m['areas'],evidence('data/euro-official-review.json','diagonalVicuna','variants',j,url='https://www.euroinmobiliaria.cl/proyectos/diagonal-vicuna'),sourceKind='official_project_model',availability='not_inferred'),'Euro official models')
        for slug,p in self.load('data/crescer-brochures.json')['projects'].items():
            for j,m in enumerate(p['models']):
                proof=evidence('data/crescer-brochures.json','projects',slug,'models',j,pages=[m['page']])
                if not m['filterEligible']:
                    self.projects[slug]['excluded'].append({'field':'conflicting_model','evidence':proof,'reason':'Printed title and areas contradict the drawing; no bedroom/area association is published.'})
                    continue
                self.add(slug,variant(m['id'],m['label'],'departamento',m['bedrooms'],m['bathrooms'],m['filterAreas'],proof,sourceKind='audited_model',availability='not_inferred',limitations=[i['message'] for i in m['issues']]),'Crescer reviewed models')
            if slug=='don-rafael':
                self.add(slug,variant('crescer-documented-2d1b','2 dormitorios y 1 baño','departamento',2,1,{},evidence('data/crescer-brochures.json','projects',slug,'general','typologies',pages=[2]),scope='typology_only',sourceKind='printed_project_typology',availability='not_inferred',limitations=['No coherent 2-bedroom area is published; the conflicting p12 model is excluded.']),'Crescer documentary typologies')
        for filename,group in [('brochures-aj-urbana.json','AJ'),('brochures-ingevec.json','Ingevec'),('brochures-ecasa.json','Ecasa'),('brochures-leben.json','Leben documentary')]:
            file='data/'+filename
            for i,p in enumerate(self.load(file)['projects']):
                slug=p['slug'];field='documentarySurfaces' if group=='Leben documentary' else 'models'
                if slug not in self.projects:continue
                for j,m in enumerate(p.get(field,[])):
                    label=m.get('label',m.get('modelo',str(j)));typ=m.get('tipologia','');beds=m.get('dormitorios') if m.get('dormitorios') is not None else bedrooms(typ);baths=m.get('banos') if m.get('banos') is not None else bathrooms(typ)
                    areas={'util':m.get('superficie_util_m2'),'interior':m.get('superficie_interior_m2'),'total':m.get('superficie_total_m2'),'terraza':m.get('terraza_m2')};ptype='casa' if re.search(r'\bcasa\b',normalize(label)) else 'departamento'
                    stage_slug=m.get('originCommercialSlug');stage=m.get('etapa');limits=[x for x in [m.get('advertencia'),m.get('excepcion'),m.get('terraceNote')] if x]+m.get('notes',[]);excluded_stage=False
                    if group=='Ecasa':
                        ref=self.projects[slug]['referenceStageSlug'];stages=self.fi[slug][1].get('etapasComerciales',[])
                        excluded_stage=bool(ref and stage_slug!=ref) or bool(len(stages)>1 and stage is None)
                        if excluded_stage:limits.append('Not attributable to selected reference stage; no mixing with its price, delivery or other stage facts.')
                    row=variant(group.lower().replace(' ','-')+'-'+str(j+1)+'-'+str(m.get('modelo',j)),label,ptype,beds,baths,areas,evidence(file,'projects',i,field,j,pages=m.get('sourcePages') or [m.get('pagina_brochure')]),limitations=limits,sourceKind='documented_brochure',availability='not_inferred',stageSlug=stage_slug,stage=stage,excludedFromProjectReference=excluded_stage)
                    if group=='Leben documentary':row.update(imageRejected=True,excludedFields=[{'field':'unlabelled_surface','value':m.get('superficie_publicada_sin_etiqueta_m2'),'reason':'No useful/total classification established; never relabel as total.'}])
                    if m.get('terraza_cubierta_m2') is not None:row['additionalAreas']={'terraza_cubierta':m['terraza_cubierta_m2']};row['limitations'].append('Covered terrace retained separately; do not add to terrace/total.')
                    if m.get('excepcion'):
                        row['floors']='Main published variant excluding floor 2';row['limitations'].append('Floor 2 differs; main area tuple applies to terrace-bearing variant only.')
                        floor_variants=m.get('variants') or [{'floor':2,'usefulM2':None,'terraceM2':0,'totalM2':None,'sourcePage':m.get('pagina_brochure')}]
                        for z,a in enumerate(floor_variants):
                            proof=evidence(file,'projects',i,field,j,'variants',z,pages=[a.get('sourcePage')]) if m.get('variants') else evidence(file,'projects',i,field,j,'excepcion',pages=m.get('sourcePages'))
                            self.add(slug,variant(row['id']+'-floor-'+str(a['floor']),label+' · piso '+str(a['floor']),ptype,beds,baths,{'util':a.get('usefulM2'),'terraza':a.get('terraceM2'),'total':a.get('totalM2')},proof,sourceKind='explicit_floor_exception',floors=str(a['floor']),availability='not_inferred',limitations=['Only explicit exception fields retained; no subtraction or inferred total.']),'AJ explicit floor exceptions')
                    self.add(slug,row,group)
        file='docs/maestra-brochures-20261025/manifest.json'
        for slug,p in self.load(file)['projects'].items():
            if slug not in self.projects:continue
            for i,m in enumerate(p['plans']):
                beds=bedrooms(m['label']);baths=bathrooms(m['label'])
                if beds is None and baths is None:continue
                self.add(slug,variant('maestra-plan-'+str(i+1),m['label'],'departamento',beds,baths,{},evidence(file,'projects',slug,'plans',i,pages=[m['page']]),sourceKind='verified_plan_label',availability='not_inferred',limitations=['Printed areas are not structured in the approved manifest; no inferred numeric transcription.']),'Maestra labels')
    def catalogue_facts(self):
        for slug,out in self.projects.items():
            i=self.pi[slug];p=self.catalogue[i];j,f=self.fi[slug];rows=out['variants'];types={v['propertyType'] for v in rows if not v.get('excludedFromProjectReference')};proofs=[]
            for a,b,value in [('updates','descripcionLarga',f.get('updates',{}).get('descripcionLarga')),('sourceNotes',None,f.get('sourceNotes')),('verifiedFeatures','edificio',f.get('verifiedFeatures',{}).get('edificio'))]:
                if value and re.search(r'\b(?:departamentos?|deptos?)\b',normalize(value)):
                    types.add('departamento');proofs.append(evidence('data/fichas-proyectos.json',j,a,*([b] if b else [])));break
            if p.get('tipoActivo')=='Terreno':types={'terreno'};proofs=[evidence('data/proyectos.json',i,'tipoActivo')]
            if any(v['propertyType']=='casa' for v in rows) and not any(v['propertyType']=='departamento' for v in rows):types={'casa'}
            cat=out['catalogTypologies']
            for k,text in enumerate(cat['labels'] if cat['verified'] else []):
                beds=bedrooms(text);ptype='local' if normalize(text)=='local' else 'terreno' if 'parcela' in normalize(text) else 'casa' if types=={'casa'} else 'departamento' if beds is not None else None
                if not ptype:continue
                types.add(ptype);proof=evidence('data/proyectos.json',i,'tipologias',k);proofs.append(proof)
                if not any(v['propertyType']==ptype and v['bedrooms']==beds and not v.get('excludedFromProjectReference') for v in rows):rows.append(variant('catalog-typology-'+str(k+1),text,ptype,beds,None,{},proof,scope='typology_only',sourceKind='owner_supplied_typology' if p.get('commercialSource',{}).get('type')=='owner-supplied' else 'verified_catalogue_typology',availability='not_inferred'))
            # The current authorized asset type overrides an old related residential description.
            if p.get('tipoActivo')=='Comercial' and cat['verified'] and cat['labels']==['Local']:
                types={'local'};proofs=[evidence('data/proyectos.json',i,'tipoActivo'),evidence('data/proyectos.json',i,'tipologias')]
            spec=f['specs'];known_baths={v['bathrooms'] for v in rows if not v.get('excludedFromProjectReference')};raw=spec.get('banos')
            if raw and re.search('unidad|depto',str(raw),re.I):out['excluded'].append({'field':'bathrooms','value':raw,'evidence':evidence('data/fichas-proyectos.json',j,'specs','banos'),'reason':'Unit-specific count; not extrapolated to other bedrooms.'})
            elif raw:
                for count in count_endpoints(raw):
                    if count in known_baths:continue
                    ptype='casa' if types=={'casa'} else 'departamento' if 'departamento' in types else next(iter(types)) if len(types)==1 else None
                    if ptype=='local':continue
                    rows.append(variant('bathroom-fact-'+str(count),str(count)+' baño(s) documentado(s); modelo no vinculado',ptype,None,count,{},evidence('data/fichas-proyectos.json',j,'specs','banos'),scope='project_fact',sourceKind='isolated_count',limitations=['Cannot combine with bedrooms or area from another variant.']))
            for sourcefield,key in [('utilM2','util'),('totalM2','total'),('terrenoM2','terreno')]:
                value=number(spec.get(sourcefield))
                if value is None or any(v['areas'].get(key)==value and not v.get('excludedFromProjectReference') for v in rows):continue
                ptype='terreno' if key=='terreno' else 'casa' if types=={'casa'} else 'departamento' if 'departamento' in types else next(iter(types)) if len(types)==1 else None
                if ptype=='local':continue
                rows.append(variant('area-fact-'+key,'Superficie '+key+' documentada; modelo no vinculado',ptype,None,None,{key:value},evidence('data/fichas-proyectos.json',j,'specs',sourcefield),scope='project_fact',sourceKind='isolated_area',limitations=['No association to a bedroom/bathroom model inferred.']))
            if spec.get('terrenoM2') and number(spec['terrenoM2']) is None:
                out['excluded'].append({'field':'land_exact_area','value':spec['terrenoM2'],'reason':'Published lower bound only; no exact lot or maximum documented.','evidence':evidence('data/fichas-proyectos.json',j,'specs','terrenoM2')})
                m=re.fullmatch(r'Desde\s+(\d+(?:[.,]\d+)?)',str(spec['terrenoM2']),re.I)
                if m:out['landBound']={'min':number(m[1]),'max':None,'exactLot':False,'evidence':evidence('data/fichas-proyectos.json',j,'specs','terrenoM2')}
            feature=f.get('verifiedFeatures',{}).get('edificio','')
            if re.search(r'patio privado|jardin privado',normalize(feature)):
                rows.append(variant('private-patio-feature',feature,'departamento',None,None,{},evidence('data/fichas-proyectos.json',j,'verifiedFeatures','edificio'),scope='project_fact',privateGarden=True,sourceKind='explicit_private_patio',limitations=['Private patio documented for some apartments; no bedroom, bathroom or area association.']))
            out['propertyTypes']=sorted(t for t in types if t);out['propertyTypeEvidence']=proofs or [v['evidence'] for v in rows[:1]]
            eligible=[v for v in rows if not v.get('excludedFromProjectReference')]
            checks=[(bool(types),'Property type not established for exact active entry; no borrowing from sibling buildings.'),(any(v['bedrooms'] is not None for v in eligible),'Bedrooms unconfirmed for exact entry/reference stage.'),(any(v['bathrooms'] is not None for v in eligible),'Bathrooms unconfirmed for exact entry/reference stage.'),(any(v['areas'] for v in eligible),'No exact typed area for a filterable variant; ranges retained separately.'),(out['delivery']['confirmed'],'Delivery date/year unconfirmed; historical dates excluded.'),(any(v.get('privateTerrace') is True for v in eligible),'No linked private terrace affirmation; common rooftop excluded.'),(any(v.get('privateGarden') is True for v in eligible),'No linked private garden/patio affirmation; communal green areas excluded.')]
            out['pending']=[text for valid,text in checks if not valid]
            if p['inmobiliaria']=='Norte Verde':out['excluded'].append({'field':'office_context_and_cross_asset_specs','reason':'Related office context does not describe the catalogue product; local-only options inherit no residential baths/areas.','evidence':evidence('data/fichas-proyectos.json',j,'officialContext') if 'officialContext' in f else evidence('data/proyectos.json',i,'tiposActivos')})
            if f.get('etapasComerciales'):out['stageEvidence']=[{'stageSlug':s['slug'],'stage':s.get('etapa'),'reference':s['slug']==out['referenceStageSlug'],'evidence':evidence('data/fichas-proyectos.json',j,'etapasComerciales',k),'catalogTypologies':s.get('catalogo',{}).get('tipologias',[]),'deliveryLabel':s.get('catalogo',{}).get('entrega'),'specs':s.get('investigacion',{}).get('specs'),'notToMix':True} for k,s in enumerate(f['etapasComerciales'])]
    def verify_property_types(self):
        """Bedrooms/Residencial alone never establish apartment vs house."""
        def texts(value,path):
            if isinstance(value,str):yield path,value
            elif isinstance(value,list):
                for i,item in enumerate(value):yield from texts(item,path+[i])
            elif isinstance(value,dict):
                for k,item in value.items():yield from texts(item,path+[k])
        source_records=collections.defaultdict(list)
        for file in ['data/sento-review.json','data/brochures-leon.json','data/brochures-aj-urbana.json','data/brochures-ingevec.json','data/brochures-ecasa.json','data/brochures-leben.json']:
            for i,p in enumerate(self.load(file)['projects']):
                for key in ['description','architecture','features','finishes','amenities','images']:
                    for path,value in texts(p.get(key),['projects',i,key]):source_records[p['slug']].append((file,path,value))
        for file in ['data/nollagam-commercial.json','data/nollagam-media.json']:
            for slug,p in self.load(file)['projects'].items():
                for key in ['description','detail','gallery']:
                    for path,value in texts(p.get(key),['projects',slug,key]):source_records[slug].append((file,path,value))
        file='docs/project-photos-20261025/image-provenance.json'
        for slug,p in self.load(file).items():
            if isinstance(p,dict):
                for path,value in texts(p.get('images'),[slug,'images']):source_records[slug].append((file,path,value))
        for slug,out in self.projects.items():
            i=self.pi[slug];p=self.catalogue[i];j,f=self.fi[slug];candidates=[]
            for key in ['sourceEvidence','verifiedFeatures']:
                for path,value in texts(f.get(key),[j,key]):candidates.append(('data/fichas-proyectos.json',path,value))
            if f.get('updates',{}).get('descripcionLarga'):candidates.append(('data/fichas-proyectos.json',[j,'updates','descripcionLarga'],f['updates']['descripcionLarga']))
            for k,tour in enumerate(f.get('virtualTours',[])):
                if tour.get('title'):candidates.append(('data/fichas-proyectos.json',[j,'virtualTours',k,'title'],tour['title']))
            candidates+=source_records[slug]
            # This exact retained extraction note refers to the current residential table,
            # not a blanket developer or bedroom inference. Commercial-only entries excluded.
            if p.get('tipoActivo') in ['Residencial','Mixto'] and re.search(r'fila\s+[ÚU]til depto',f.get('sourceNotes',''),re.I):candidates.append(('data/fichas-proyectos.json',[j,'sourceNotes'],f['sourceNotes']))
            candidates.sort(key=lambda candidate:'virtualTours' in candidate[1])
            chosen=next(((file,path,value,re.search(r'\b(?:departamentos?|deptos?)\b',value,re.I)) for file,path,value in candidates if re.search(r'\b(?:departamentos?|deptos?)\b',value,re.I)),None)
            proofs=[];types=[]
            if chosen and p.get('tipoActivo')!='Comercial':
                file,path,value,match=chosen;excerpt=value[max(0,match.start()-38):match.end()+58]
                excerpt=re.sub(r'UF\s*[\d.,]+','[precio omitido]',excerpt,flags=re.I)
                proofs.append({'type':'departamento','rule':'explicit_department_word_in_same_project_source','excerpt':excerpt,'evidence':evidence(file,*path)})
                types.append('departamento')
            # A named building plus the exact current residential product is documented
            # context, rather than assigning apartment from bedroom count alone.
            if not chosen and p.get('tipoActivo')!='Comercial' and out['catalogTypologies']['verified'] and any(bedrooms(t) is not None for t in out['catalogTypologies']['labels']):
                building=next(((path,value) for path,value in texts(f.get('sourceEvidence'),[j,'sourceEvidence']) if re.search(r'\bedificio\b',value,re.I)),None)
                if building:
                    path,value=building;proofs.append({'type':'departamento','rule':'explicit_named_building_and_current_residential_product','excerpt':value[:150],'evidence':evidence('data/fichas-proyectos.json',*path),'supportingEvidence':out['catalogTypologies']['evidence']});types.append('departamento')
            if any(v['propertyType']=='casa' for v in out['variants']):
                house=next(v for v in out['variants'] if v['propertyType']=='casa');types=['casa'];proofs=[{'type':'casa','rule':'explicit_house_model_label','excerpt':house['label'],'evidence':house['evidence']}]
            if p.get('tipoActivo')=='Terreno':types=['terreno'];proofs=[{'type':'terreno','rule':'explicit_catalogue_asset_type','excerpt':p['tipoActivo'],'evidence':evidence('data/proyectos.json',i,'tipoActivo')}]
            if out['catalogTypologies']['verified'] and 'Local' in out['catalogTypologies']['labels']:
                types.append('local');proofs.append({'type':'local','rule':'explicit_current_owner_commercial_product','excerpt':'Local','evidence':evidence('data/proyectos.json',i,'tipologias',out['catalogTypologies']['labels'].index('Local'))})
            types=sorted(set(types));out['propertyTypes']=types;out['propertyTypeEvidence']=proofs
            for row in out['variants']:
                if row['propertyType'] not in types:
                    previous=row['propertyType'];row['propertyType']=None
                    row.setdefault('limitations',[]).append('Property type unconfirmed: bedrooms or residential category alone do not establish apartment/house.')
                    row['excludedInferredPropertyType']=previous
            out['pending']=[x for x in out['pending'] if not x.startswith('Property type')]
            if not types:out['pending'].append('Property type not established explicitly for exact active entry; no apartment default from bedroom count.')
    def output(self):
        self.core();self.specialized_models();self.brochure_models();self.catalogue_facts();self.verify_property_types()
        def eligible(p):return [v for v in p['variants'] if not v.get('excludedFromProjectReference')]
        projects=self.projects;allrows=[v for p in projects.values() for v in eligible(p)]
        summary={'projects':len(projects),'developers':sorted({p['developer'] for p in projects.values()}),'variants':sum(len(p['variants']) for p in projects.values()),'referenceEligibleVariants':len(allrows),'sourceModelCounts':dict(self.counts),'projectsByPropertyType':{t:sum(t in p['propertyTypes'] for p in projects.values()) for t in sorted({t for p in projects.values() for t in p['propertyTypes']})},'projectsWithCoherentBedroomBathroomPairs':sum(any(v['bedrooms'] is not None and v['bathrooms'] is not None for v in eligible(p)) for p in projects.values()),'projectsWithCoherentBedroomBathroomAndTypedArea':sum(any(v['bedrooms'] is not None and v['bathrooms'] is not None and v['areas'] for v in eligible(p)) for p in projects.values()),'projectsWithVerifiedDeliveryYear':sum(p['delivery']['confirmed'] and p['delivery']['year'] is not None for p in projects.values()),'projectsWithVerifiedImmediateDelivery':sum(p['delivery']['confirmed'] and p['delivery']['immediate'] is True for p in projects.values()),'deliveryYears':sorted({p['delivery']['year'] for p in projects.values() if p['delivery']['confirmed'] and p['delivery']['year']}),'unknownPropertyType':[s for s,p in projects.items() if not p['propertyTypes']],'excludedStageVariants':sum(bool(v.get('excludedFromProjectReference')) for p in projects.values() for v in p['variants']),'privateGardenProjects':[s for s,p in projects.items() if any(v.get('privateGarden') for v in eligible(p))]}
        output={'schemaVersion':2,'scope':'Read-only local property/filter audit; no new prices, downloads, source or application edits.','sourceRoot':str(self.root),'schemaNotes':{'variants':'Apply all requested bedroom/bathroom/area/private-feature criteria to ONE coherent row; no joins with other rows or aggregateEvidence.','areas':'util/interior/total/departamento/terreno/terraza/jardin are distinct. Original decimal strings retained. Missing is unknown.','scope':'model: coherent layout; typology_only: bedroom/type only; project_fact: isolated count/area/feature without model linkage. Private owner units omitted.','stage':'Only rows with excludedFromProjectReference != true are eligible for reference-price catalogue matching.','availability':'Documented plans do not establish stock. Historical AGOTADO/RESERVADO stamps ignored; project status retained separately.','delivery':'Use confirmed=true only. No invented day for month/semester/year; delivered is not automatically immediate-sale inventory.','prices':'ALWAYS preserve current proyectos.json project desde; never replace with model/source prices.','aggregate':'No cartesian expansion of project ranges; no inferred intermediate values. Land lower bound is not an exact lot or maximum.'},'summary':summary,'sources':[{'file':f,'sha256':hashlib.sha256((self.root/f).read_bytes()).hexdigest()} for f in self.cache],'projects':projects}
        count=0
        def validate(x):
            nonlocal count
            if isinstance(x,dict):
                if isinstance(x.get('file'),str) and isinstance(x.get('pointer'),str):
                    value=self.load(x['file']);count+=1
                    for key in x['pointer'].strip('/').split('/'):
                        key=key.replace('~1','/').replace('~0','~');value=value[int(key)] if isinstance(value,list) else value[key]
                for value in x.values():validate(value)
            elif isinstance(x,list):
                for value in x:validate(value)
        validate(output)
        for p in projects.values():
            ids=[v['id'] for v in p['variants']];assert len(ids)==len(set(ids)),p['name']
            for v in p['variants']:
                assert all(isinstance(n,(int,float)) for n in v['areas'].values())
                assert v.get('privateTerrace') is not True or v['areas'].get('terraza',0)>0
                assert not(v['propertyType']=='local' and (v['bedrooms'] is not None or v['bathrooms'] is not None or v['areas']))
        output['validation']={'sourcePointersResolved':count,'uniqueVariantIdsPerProject':True,'localCommercialRowsDoNotInheritResidentialFields':True,'sourceFilesModified':False}
        return output

def report(data):
    s=data['summary']
    excluded={slug:sum(bool(v.get('excludedFromProjectReference')) for v in p['variants']) for slug,p in data['projects'].items()}
    excluded=', '.join(f'{slug}: {count}' for slug,count in excluded.items() if count)
    return f'''Auditoría de propiedades para filtros avanzados\n\n{s['projects']} proyectos y {len(s['developers'])} inmobiliarias normalizados, sin modificar aplicación ni precios.\n\n- {s['variants']} filas respaldadas; {s['referenceEligibleVariants']} elegibles para la etapa de referencia. Cada fila conserva sus propios dormitorios, baños, superficies y evidencia.\n- {s['projectsWithCoherentBedroomBathroomPairs']} proyectos tienen pares dormitorios/baños; {s['projectsWithCoherentBedroomBathroomAndTypedArea']} también tienen superficie tipada en esa misma fila. Los rangos agregados no se cruzan para fabricar modelos.\n- Fechas: {s['projectsWithVerifiedDeliveryYear']} proyectos con año verificable ({', '.join(map(str,s['deliveryYears']))}), {s['projectsWithVerifiedImmediateDelivery']} con entrega inmediata verificable. Las fechas residenciales de Verne e Irarrázaval siguen excluidas. Estados NV no confirmados por la actualización comercial se conservan como reportados, sin llave de filtro confirmada.\n- Sento usa sento-review; León usa leon-plan-surfaces; Plaza usa plaza-las-condes-verified. Unidades privadas del propietario quedan fuera del índice.\n- Nollagam conserva {s['sourceModelCounts'].get('Nollagam variants',0)} variantes y decimales originales. Interior no se convierte en Útil. Sellos históricos no son stock.\n- Etapas excluidas de la referencia: {excluded}. No se mezcla una superficie de otra etapa con el precio desde del catálogo.\n- Endémico documenta casas con Interior separado de Útil; Reserva Mayor 2 conserva un mínimo de terreno, sin inventar máximo ni lote exacto.\n- Locales no heredan baños ni superficies residenciales; Verne Oficinas no entra en la ficha residencial.\n- Jardín/patio privado sólo con evidencia enlazada: {', '.join(s['privateGardenProjects'])}. La característica aislada de proyecto no se cruza con dormitorios. Áreas verdes o rooftop común no equivalen a jardín/terraza privada.\n- Tipo de propiedad exige evidencia explícita del proyecto. Dormitorios/Residencial solos no establecen Departamento. Cada prueba guarda regla, fragmento y puntero. Tipos pendientes: {', '.join(s['unknownPropertyType'])}.\n\nRegeneración\n`python build_filter_property_audit.py --root RUTA_FUENTE --output RUTA_JSON --report RUTA_MD`\n\nEl generador lee las fuentes primarias en cada ejecución; el JSON es una proyección derivada. No contiene precios nuevos. Se validaron {data['validation']['sourcePointersResolved']} punteros resolubles y la coherencia de filas comerciales.\n'''

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--root',required=True);parser.add_argument('--output',required=True);parser.add_argument('--report');args=parser.parse_args()
    data=Audit(args.root).output();encoded=json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n';Path(args.output).write_text(encoded)
    if args.report:Path(args.report).write_text(report(data))
    print(json.dumps({'summary':data['summary'],'validation':data['validation'],'outputSha256':hashlib.sha256(encoded.encode()).hexdigest()},ensure_ascii=False,indent=2))
