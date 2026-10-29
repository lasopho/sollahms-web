"""Refresh reviewed Sento/León plans, excluding Plaza's more recent override."""
import json
from pathlib import Path
from bs4 import BeautifulSoup
from sento_fiche import blocks,commercial_typology
from leon_fiche import render_plans
from leon_surfaces import reviewed_surface_plans,room_counts

ROOT=Path(__file__).resolve().parents[1]

def reviewed_plans(record,developer):
    raw=blocks(record)['plans'] if developer=='Sento' else render_plans(record)
    soup=BeautifulSoup(raw,'html.parser');node=soup.section
    node['class']=['detail-section','pj-block','jn-reviewed-plans']
    node['data-reviewed-plans']=developer
    for image in node.select('img'):
        # Preserve the full, verified original. Avoid publishing unused variants.
        image.attrs.pop('srcset',None);image.attrs.pop('sizes',None)
        assert (ROOT/image['src'].lstrip('/')).is_file(),image['src']
    grid=node.select_one('.sento-models,.leon-models')
    models=grid.find_all('article',recursive=False)
    details=soup.new_tag('details',attrs={'class':'pj-disclosure'})
    summary=soup.new_tag('summary',attrs={'data-scroll-static':''})
    summary.string=f'Ver {len(models)} planos por tipología';details.append(summary)
    grid.replace_with(details);details.append(grid)
    return str(node)

def main():
    path=ROOT/'data/project-content-additions.json';data=json.loads(path.read_text())
    for source,developer in [('sento-review.json','Sento'),('brochures-leon.json','León')]:
        records=json.loads((ROOT/'data'/source).read_text())['projects']
        for record in records:
            if record['slug']=='plaza-las-condes':continue
            data['projects'][record['slug']]['plansHtml']=reviewed_plans(record,developer)
            types=[commercial_typology(m) for m in record['models']] if developer=='Sento' else [room_counts(m) for m in reviewed_surface_plans(record).values()]
            data['projects'][record['slug']]['documentedTypologies']=list(dict.fromkeys(types))
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

if __name__=='__main__':main()
