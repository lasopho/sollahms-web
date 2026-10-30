"""Build a small public projection from shared features and reviewed model sources."""
import argparse,hashlib,json,subprocess,sys
from collections import Counter
from pathlib import Path
from project_amenities import entry
from purchase_stage import classify
ROOT=Path(__file__).resolve().parents[1]
PROPERTY_LABELS={'departamento':'Departamento','casa':'Casa','local':'Local comercial','oficina':'Oficina','terreno':'Terreno o parcela'}
STATE_LABELS={'en-blanco':'En blanco','en-verde':'En verde','en-construccion':'En construcción','en-recepcion-final':'En recepción final','inmediata':'Entrega inmediata','proxima-entrega':'Próxima entrega','entrega-futura':'Entrega futura','vendido':'Vendido','sin-unidades':'Sin unidades disponibles','en-desarrollo':'En desarrollo','lanzamiento':'Lanzamiento'}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--property-audit',type=Path);ap.add_argument('--check',action='store_true');args=ap.parse_args()
    docs=ROOT/'docs/advanced-filters-20261029';docs.mkdir(parents=True,exist_ok=True)
    audit=args.property_audit or docs/'property-audit.json'
    if not args.property_audit:
        subprocess.run([sys.executable,str(ROOT/'scripts/catalog_property_facts.py'),'--root',str(ROOT),'--output',str(audit),'--report',str(docs/'property-audit.md')],check=True,stdout=subprocess.DEVNULL)
    property_data=json.loads(audit.read_text());catalog=json.loads((ROOT/'data/proyectos.json').read_text())
    from euro_details import validate_prices
    validate_prices(catalog)
    shared=json.loads((ROOT/'data/project-features.json').read_text())['projects'];taxonomy=json.loads((ROOT/'data/amenities.json').read_text())
    reviews=json.loads((ROOT/'data/purchase-stage-verifications.json').read_text())['reviews']
    definitions={f['id']:f for f in taxonomy['filters']};out={};counts=Counter();types={};missing=[]
    for project in catalog:
        slug=project['slug']
        if slug not in shared:raise ValueError('Register shared features first: python scripts/register-project-features.py '+slug)
        record=shared[slug];facts=property_data['projects'][slug]
        features={}
        def add_feature(id_,scope='project'):
            assert id_ in definitions,id_
            features[id_]={'id':id_,'label':definitions[id_]['label'],'scope':scope}
        for group in record['groups']:
            for item in group['items']:
                mapping=entry(item['label'])
                if not item.get('filterEligible',False):continue
                for id_ in mapping.get('filterIds',[]):add_feature(id_,item.get('scope','project'))
        for prose in record.get('prose',[]):
            if prose.get('eligibleForFiltering'):
                for id_ in prose.get('filterIds',[]):add_feature(id_)
        variants=[];seen=set()
        for v in facts['variants']:
            if v.get('excludedFromProjectReference') or v.get('scope')=='unit':continue
            if project.get('etapaReferenciaSlug') and v.get('stageSlug') and v['stageSlug']!=project['etapaReferenciaSlug']:continue
            row={k:v[k] for k in ['propertyType','bedrooms','bathrooms','areas','typology','privateTerrace','privateGarden'] if k in v and v[k] is not None}
            row['areas']={k:n for k,n in row.get('areas',{}).items() if isinstance(n,(int,float)) and n>0}
            b=row.get('bedrooms');bath=row.get('bathrooms')
            if b is not None:
                row['typology']=('estudio' if b==0 else str(b)+'d')+(('-'+str(bath)+'b') if bath is not None else '')
            else:row.pop('typology',None)
            signature=json.dumps(row,sort_keys=True)
            if signature in seen:continue
            seen.add(signature);variants.append(row)
            if row.get('privateTerrace'):add_feature('terraza-privada','residential')
            if row.get('privateGarden'):add_feature('jardin-privado','residential')
            if row.get('typology') and bath is not None:
                b=row.get('bedrooms');bath=row.get('bathrooms')
                label=('Estudio' if b==0 else str(b)+' dormitorio'+('s' if b!=1 else '')) if b is not None else ''
                if bath:label+=' · '+str(bath)+' baño'+('s' if bath!=1 else '')
                if label:types[row['typology']]=label
        delivery=facts.get('delivery',{});delivery={k:delivery[k] for k in ['label','year','immediate','precision'] if delivery.get(k) is not None} if delivery.get('confirmed') else {}
        asset=project.get('tiposActivos') or [project.get('tipoActivo')]
        asset=[a for a in asset if a]
        if not asset:
            if any(t in facts['propertyTypes'] for t in ['departamento','casa']):asset.append('Residencial')
            if any(t in facts['propertyTypes'] for t in ['local','oficina']):asset.append('Comercial')
            if 'terreno' in facts['propertyTypes']:asset.append('Terreno')
            if 'Residencial' in asset and 'Comercial' in asset:asset.append('Mixto')
        typology_labels=[]
        for v in variants:
            if v.get('typology') in types and types[v['typology']] not in typology_labels:typology_labels.append(types[v['typology']])
        status=facts.get('status',{});state=STATE_LABELS.get(status.get('key')) if status.get('confirmed') else None
        out[slug]={'propertyTypes':facts['propertyTypes'],'propertyLabels':[PROPERTY_LABELS[t] for t in facts['propertyTypes']],'assetTypes':asset,'variants':variants,'delivery':delivery,'features':list(features.values()),'states':[state] if state else [],'typologyLabels':typology_labels,'purchaseStage':classify(project,facts,reviews)}
        counts.update(features.keys())
        missing.append({'slug':slug,'name':project['nombre'],'pricePending':project.get('precioDesdeUF') is None,'amenitiesUnknown':not any(definitions[x]['group']=='amenities' for x in features),'propertyTypeUnknown':not facts['propertyTypes'],'deliveryUnknown':not delivery,'stateUnknown':not state,'typedAreaUnknown':not any(v['areas'] for v in variants),'bathroomsUnknown':not any(v.get('bathrooms') for v in variants),'notes':facts.get('pending',[])})
    filters=[{**f,'count':counts[id_]} for id_,f in definitions.items() if counts[id_]>0]
    typologies=[{'id':id_,'label':label,'count':sum(any(v.get('typology')==id_ for v in p['variants']) for p in out.values())} for id_,label in sorted(types.items())]
    data={'schemaVersion':1,'projects':out,'filters':filters,'typologies':typologies,'policy':'Documented project/model characteristics; no stock or unit inventory. Missing values are unknown.'}
    from ecasa_commercial import sync_facets
    data=sync_facets(data,catalog)
    from aj_urbana_commercial import sync_facets as sync_aj
    data=sync_aj(data,catalog)
    rendered=json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n';path=ROOT/'data/catalog-facets.json'
    if args.check:assert path.read_text()==rendered,'Regenerate catalogue facets'
    else:path.write_text(rendered)
    summary={'projects':len(out),'filters':len(filters),'knownPrices':sum(p.get('precioDesdeUF') is not None for p in catalog),'pendingPrices':sum(p.get('precioDesdeUF') is None for p in catalog),'projectsWithFeatures':sum(bool(p['features']) for p in out.values()),'projectsWithTypedAreas':sum(any(v['areas'] for v in p['variants']) for p in out.values()),'projectsWithBathrooms':sum(any(v.get('bathrooms') for v in p['variants']) for p in out.values()),'projectsWithDelivery':sum(bool(p['delivery']) for p in out.values()),'publicBytes':len(rendered.encode()),'sha256':hashlib.sha256(rendered.encode()).hexdigest()}
    (docs/'coverage.json').write_text(json.dumps({'summary':summary,'filters':filters,'pending':missing},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(summary))
if __name__=='__main__':main()
