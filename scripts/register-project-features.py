"""Register a new fiche's shared feature groups without inferring filter eligibility.

Review each imported source/scope/filterEligible field, then regenerate fiches
and catalogue facets. Existing project records are never overwritten.
"""
import argparse,json
from pathlib import Path
from bs4 import BeautifulSoup
from project_amenities import entry
ROOT=Path(__file__).resolve().parents[1]
def register(slug):
    path=ROOT/'data/project-features.json';data=json.loads(path.read_text())
    if slug in data['projects']:raise ValueError('Already registered; edit its central record: '+slug)
    project=next(p for p in json.loads((ROOT/'data/proyectos.json').read_text()) if p['slug']==slug)
    file=project['detalleUrl'].split('#')[0].lstrip('/');soup=BeautifulSoup((ROOT/file).read_text(),'html.parser')
    groups=[];counts={}
    for ul in soup.select('main ul.am-grid'):
        owner=ul.find_parent(lambda n:n.get('id') is not None);section=owner['id'];ordinal=counts.get(section,0);counts[section]=ordinal+1
        items=[]
        for li in ul.select('.am-item'):
            label=li.select_one('.am-label').get_text(' ',strip=True);entry(label)
            description=li.select_one('.am-description')
            items.append({'label':label,'description':description.get_text(' ',strip=True) if description else '',
                'filterEligible':False,'scope':'project','exclusionReasons':['Pending review of exact project/stage/product scope'],
                'source':{'file':file,'line':li.sourceline}})
        groups.append({'sectionId':section,'ordinal':ordinal,'kind':ul['data-amenity-group'],'stageSlug':None,'items':items})
    data['projects'][slug]={'groups':groups,'prose':[],'referenceStage':project.get('etapaReferenciaSlug'),'commercialOnly':project.get('tipoActivo')=='Comercial'}
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    return {'slug':slug,'groups':len(groups),'reviewRequired':True}
if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('slug');print(json.dumps(register(ap.parse_args().slug)))
