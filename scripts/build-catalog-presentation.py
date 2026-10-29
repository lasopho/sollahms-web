#!/usr/bin/env python3
"""Keep a single accessible no-JavaScript directory from the current catalogue.

The dynamic card/list renderer lives in catalog.mjs; this generator does not
rewrite it, duplicate images, mutate commercial records or download assets.
"""
import argparse,html,json,re
from project_navigation import price_from
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def directory(projects):
    assert projects and len({p['slug'] for p in projects})==len(projects)
    for p in projects:
        assert p['detalleUrl']=='/'+p['slug']+'.html'
        assert (ROOT/p['detalleUrl'].lstrip('/')).is_file()
    links='\n'.join('    <li><a href="'+html.escape(p['detalleUrl'],quote=True)+'">'+html.escape(p['nombre'])+'</a> — <span>'+html.escape(price_from(p.get('precioDesdeUF')))+'</span></li>' for p in projects)
    return '<!--CATALOG_DIRECTORY_START-->\n<details id="catalog-static-directory" class="catalog-directory">\n<summary>Explorar el listado de fichas de proyectos</summary>\n<p>Accede directamente a las fichas del catálogo.</p>\n<ul>\n'+links+'\n</ul>\n</details>\n<!--CATALOG_DIRECTORY_END-->'
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    projects=json.loads((ROOT/'data/proyectos.json').read_text());path=ROOT/'proyectos.html';before=path.read_text()
    after,count=re.subn(r'<!--CATALOG_DIRECTORY_START-->[\s\S]*?<!--CATALOG_DIRECTORY_END-->',lambda _:directory(projects),before);assert count==1
    if args.check:assert after==before,'Run build-catalog-presentation.py to refresh the directory'
    else:path.write_text(after)
    print(json.dumps({'projects':len(projects),'newAssets':0,'check':args.check}))
if __name__=='__main__':main()
