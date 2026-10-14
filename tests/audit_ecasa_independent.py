#!/usr/bin/env python3
"""Offline Ecasa scope audit. It authorizes no merge, deployment or provider write."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

BASELINE = 'f1e9bf1715cc99d095a367eba9028a9a1ad2b026'
REVIEW = 'fb11f3fb466f7362cb20e99fa89b2abc610683c5'
CONTEXT = {'assets/js/project-identity.mjs': {'beforeSha256': None, 'afterSha256': '86395bb47c4fba999d62dbb905c8c0fbdc30a1efc865b741ad102d48968babeb'}, 'contacto.html': {'beforeSha256': 'eb191297092a0c8a791f4eed399fb85bbfdbdb1a46536e737e51990827633e8b', 'afterSha256': '8d73a220b1e43b9b01899bb91b5a17123f54b365979626b56ef3aa417aa0cfde'}, 'agenda-asesoria.html': {'beforeSha256': 'dc7b37c244e54f89be4d485fcb95cc714561ebe81b2e4ec320d76fabd02ee762', 'afterSha256': '2cdda24895d3547a5264b11ccb90988cba232d6f7ebf09af7229abdc707fb769'}, 'assets/js/hipotecario.mjs': {'beforeSha256': 'b313f5dd6dbe2b27694d9751c0e19053ca3b671809914cab24854c82ded355d9', 'afterSha256': '18f6070de614671c4d69f1771da636fa9d033ee3bf5136be613b2531c916554d'}, 'api/contact.mjs': {'beforeSha256': '6533c6f2e3cda476cd325d2074cc963394efdab16cc0839fb526da4aa1c399b2', 'afterSha256': 'b2d518743172e4a695fe00c859c103e6d9805b9ae57a8ea21c2c44620ceb9ba0'}, 'api/booking-create.mjs': {'beforeSha256': '151c74d58c020f7d97b9e888d70c3d4fb7675b9d0ba28afd23f72d0015c564db', 'afterSha256': 'e910a2ad7d218fcbb30665ab911026f859c097a5869a790236a80e98472f123c'}, 'proyectos.html': {'beforeSha256': 'be9f5056565b710bef24c3eaa058725257307d980d599e7752a48cb289166ba9', 'afterSha256': 'c8c15f965f9d644a6d292c76052c124321eb3d68258ca44707474fb33f58020a'}}
FROZEN_INPUTS = {'data/brochures-ecasa.json': 'fd37681006e965e83241dccd88b7b532dba5411733219dbdc152aef1e4f5017c', 'data/ecasa-image-quality.json': 'b4562d1dfbe729520a270039df347b8e3e62f5cff7c3b62d99355d784b0bfb34', 'data/ecasa-manual-quality.json': '68f3187f03062d83fcc294d77bda83d7094b249bd50e60e3823ed3687317fe14', 'data/ecasa-official-originals.json': '3fce8acf5d4c6e5e2585e2a4f7087f739db2125bc198fab9a5d19be0a9907cdf', 'data/ecasa-owner-cover.json': 'e2b8a85a2721bee343ec6ff50689713864fc9973191018aebe46c84ed4270b4a'}
ECASA = {'aires-la-florida-2','alto-san-joaquin','conecta-huechuraba','cumbres-de-penuelas',
 'edificio-bezanilla','endemico','enlace-mackenna','espacio-victoria','ferroparque','lamara',
 'lomas-de-puyai','nucleo-costanera','terratolten','urban-la-florida','wayra'}
NOTICE = '<div role="note" style="padding:14px 24px;background:#003229;color:#fff;text-align:center;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6">Vista previa de revisión. Los formularios no envían mensajes ni crean reservas.</div>'
NOINDEX = '<meta name="robots" content="noindex, nofollow">\n'
CORE = ['api/uf.mjs','lib/official-uf.mjs','assets/js/project-finance.mjs','assets/js/mortgage-engine.mjs',
 'assets/js/mortgage-data.mjs','assets/js/purchase-capacity.mjs','assets/js/clp-input.mjs',
 'data/hipotecario.json','privacidad.html','lib/booking-server.mjs','lib/mortgage-lead.mjs']
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

def require(value, message):
    if not value: raise AssertionError(message)

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def load(path): return json.loads(path.read_text())
def normalized_preview(text): return text.replace(NOINDEX, '').replace(NOTICE, '')
def inventory(root):
    result = {}
    for path in root.rglob('*'):
        require(not path.is_symlink(), 'Symlink in audited tree: ' + str(path))
        if path.is_file(): result[path.relative_to(root).as_posix()] = digest(path)
    return result

def asset_path(root, path):
    require(isinstance(path,str) and path.startswith('/assets/') and not re.search(r'[?#\\]',path) and
        all(part not in {'.','..',''} for part in path[1:].split('/')), 'Unsafe selected asset path')
    file = root / path[1:]
    require(file.resolve().is_relative_to(root.resolve()) and not file.is_symlink(), 'Asset escapes source')
    return file

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True); self.stack=[]; self.images=[]; self.ids=[]; self.links=[]
        self.feed(text)
    def handle_starttag(self, tag, pairs):
        attrs=dict(pairs); chain=self.stack+[(tag,attrs)]
        if attrs.get('id'): self.ids.append(attrs['id'])
        if tag=='a' and attrs.get('href'): self.links.append(attrs['href'])
        if tag=='img' and attrs.get('src'):
            classes=[set(item.get('class','').split()) for _,item in chain]
            self.images.append({'path':urlsplit(attrs['src']).path,'origin':next((item['data-commercial-stage']
                for _,item in reversed(chain) if item.get('data-commercial-stage')),None),
                'gallery':any('gallery-grid' in cls for cls in classes),
                'plan':any('aj-plan-link' in cls for cls in classes),'hero':'hero-image' in classes[-1]})
        if tag not in VOID:self.stack.append((tag,attrs))
    def handle_endtag(self, tag):
        for index in range(len(self.stack)-1,-1,-1):
            if self.stack[index][0]==tag:self.stack=self.stack[:index];break
    def handle_startendtag(self, tag, pairs):
        self.handle_starttag(tag,pairs)
        if tag not in VOID:self.handle_endtag(tag)

def source_assets(source):
    brochure=load(source/'data/brochures-ecasa.json'); official=load(source/'data/ecasa-official-originals.json')
    owner=load(source/'data/ecasa-owner-cover.json'); paths=set()
    for project in brochure['projects']:
        paths.update(image['localPath'] for image in project['images'])
        paths.update(model['plan']['localPath'] for model in project['models'])
    for project in official['projects']:
        for image in project['images']:paths.update([image['localPath'],image['original']['localPath']])
    for project in owner.get('projects',[owner]):paths.update([project['selected']['localPath'],project['original']['localPath']])
    return paths

def audit(source, public, preview, production_source, production_public, approved_preview):
    roots=[Path(path).resolve() for path in [source,public,preview,production_source,production_public,approved_preview]]
    source,public,preview,production_source,production_public,approved_preview=roots
    require(all(path.is_dir() for path in roots), 'All six audited roots must exist')
    manifest=load(source/'data/ecasa-publication-candidate.json')
    require(manifest['schemaVersion']==1 and manifest['scope']=='ecasa_independent_public_candidate' and
        manifest['baselineCommit']==BASELINE and manifest['reviewCommit']==REVIEW and set(manifest['projectSlugs'])==ECASA,
        'Unrecognized independent scope or baseline')
    require(manifest['actionAuthorization']=={'production':False,'mergeMain':False}, 'Content cannot authorize release actions')
    require(manifest['frozenInputs']==FROZEN_INPUTS,'Unreviewed frozen evidence inventory')
    for name,expected in manifest['frozenInputs'].items():
        require(digest(source/name)==expected, 'Frozen evidence changed: '+name)
    catalogue=load(source/'data/proyectos.json'); prior=load(production_source/'data/proyectos.json')
    require(len(catalogue)==136 and len({p['slug'] for p in catalogue})==136 and
        {p['slug'] for p in catalogue if p['inmobiliaria']=='Ecasa'}==ECASA,'Canonical catalogue must contain136/15')
    others=[p for p in prior if p['inmobiliaria']!='Ecasa']; other_slugs={p['slug'] for p in others}
    require(len(others)==121 and len(other_slugs)==121,'Production baseline must contain121 other projects')
    for name in ['proyectos.json','fichas-proyectos.json','registro-fichas.json']:
        before=load(production_source/'data'/name); after=load(source/'data'/name)
        require([p for p in before if p['slug'] in other_slugs]==[p for p in after if p['slug'] in other_slugs],
            'Other SOURCE records changed: '+name)
    for slug in other_slugs:
        require(digest(source/(slug+'.html'))==digest(production_source/(slug+'.html')),'Other SOURCE fiche changed: '+slug)
        require(digest(public/(slug+'.html'))==digest(production_public/(slug+'.html')),'Other public OUTPUT fiche changed: '+slug)
        require(normalized_preview((preview/(slug+'.html')).read_text())==(production_public/(slug+'.html')).read_text(),
            'Other Preview OUTPUT fiche changed: '+slug)
    production_rows=load(production_public/'data/proyectos.json')
    for output in [public,preview]:
        rows=load(output/'data/proyectos.json')
        require(len(rows)==136 and {p['slug'] for p in rows if p['inmobiliaria']=='Ecasa'}==ECASA,'Output catalogue scope changed')
        require([p for p in rows if p['slug'] in other_slugs]==[p for p in production_rows if p['slug'] in other_slugs],
            'Other OUTPUT catalogue records changed')
        approved_rows=load(approved_preview/'data/proyectos.json')
        require([p for p in rows if p['slug'] in ECASA]==[p for p in approved_rows if p['slug'] in ECASA],
            'Approved Ecasa commercial/catalogue display changed')
    for name in CORE:
        require(digest(source/name)==digest(production_source/name),'Financial/privacy/provider core changed: '+name)
    for name,pin in CONTEXT.items():
        require(digest(source/name)==pin['afterSha256'],'Unapproved shared stage context: '+name)
        previous=production_source/name
        require((digest(previous) if previous.exists() else None)==pin['beforeSha256'],'Unexpected stage-context baseline: '+name)
    resources=manifest['selectedResources']; selected={row['localPath']:row for row in resources}
    require(len(resources)==len(selected)==92,'Exactly92 unique selected resources required')
    require(sum(row['kind']=='plan' for row in resources)==74 and sum(row['kind']=='documentary_photo' for row in resources)==11 and
        sum(row['kind']=='official_photo' for row in resources)==2 and sum(row['kind']=='owner_cover' for row in resources)==5,
        'Selected source cardinality changed')
    private=source_assets(source)-set(selected)
    require(len(private)==52,'Exactly52 original/unselected resources must stay private')
    galleries=plans=0
    for slug in sorted(ECASA):
        approved_text=normalized_preview((approved_preview/(slug+'.html')).read_text())
        current=(public/(slug+'.html')).read_text()
        require(current==approved_text,'Approved Ecasa body/layout/media changed: '+slug)
        page=Page(current); reference=Page(approved_text)
        require(len(page.ids)==len(set(page.ids)),'Duplicate public anchors: '+slug)
        require([image for image in page.images if image['gallery']]==[image for image in reference.images if image['gallery']],
            'Approved gallery or gallery origin changed: '+slug)
        galleries+=sum(image['gallery'] for image in page.images); plans+=sum(image['plan'] for image in page.images)
        for image in page.images:
            if image['path'].startswith('/assets/'):
                require(digest(asset_path(public,image['path']))==digest(asset_path(approved_preview,image['path'])),
                    'Approved local image bytes changed: '+image['path'])
            if image['path'] in selected:
                require(selected[image['path']]['projectSlug']==slug and image['origin']==selected[image['path']]['originCommercialSlug'],
                    'Selected resource attributed to another stage/project: '+image['path'])
        for image in page.images:
            if image['plan']:require(image['path'] in selected and selected[image['path']]['kind']=='plan','Unreviewed plan')
    require(galleries==72 and plans==74,'Approved72 photographs/74 plans changed')
    public_inventory,preview_inventory=inventory(public),inventory(preview)
    require(set(public_inventory)==set(preview_inventory)==set(inventory(approved_preview)),
        'Approved public/Preview file inventory changed')
    for output in [source,approved_preview,public,preview]:
        for path,row in selected.items():
            file=asset_path(output,path); require(file.is_file() and file.stat().st_size==row['bytes'] and digest(file)==row['sha256'],
                'Selected resource bytes changed: '+path)
    for output in [public,preview]:
        for path in private:require(not asset_path(output,path).exists(),'Private original/unselected resource exposed: '+path)
        require({p for p in inventory(output) if p.startswith('data/')}=={'data/proyectos.json','data/hipotecario.json'},'Private data exposed')
        require(not any(re.search(r'\.(pdf|zip|docx?|xlsx?|env|toml)$',path,re.I) or '/originals/' in path for path in inventory(output)),
            'Private document/raw original exposed')
    for path in public_inventory:
        if path=='robots.txt':
            require((preview/path).read_text()=='User-agent: *\nDisallow: /\n','Preview robots must block indexing')
            require((public/path).read_bytes()==(production_public/path).read_bytes(),'Public robots changed')
        elif path.endswith('.html'):
            require(NOINDEX in (preview/path).read_text(),'Preview noindex missing: '+path)
            require(NOINDEX not in (public/path).read_text(),'Public unexpectedly noindex: '+path)
            require(normalized_preview((preview/path).read_text())==(public/path).read_text(),'Unexpected profile body difference: '+path)
        else:require(public_inventory[path]==preview_inventory[path],'Unexpected profile asset/data difference: '+path)
    return {'passed':True,'baselineCommit':BASELINE,'reviewCommit':REVIEW,'sourceOtherProjects':121,'outputOtherProjects':121,
        'sharedContextFiles':7,'selectedResources':92,'galleryImages':galleries,'plans':plans,'privateResourcesExcluded':52,
        'publicFiles':len(public_inventory),'previewFiles':len(preview_inventory),
        'allowedProfileDifferences':['noindex meta','read-only forms notice','robots Disallow'],
        'productionActionAuthorized':False,'mergeActionAuthorized':False,'offlineOnly':True,'noProviderWrites':True}

def main():
    parser=argparse.ArgumentParser()
    for flag in ['source','public','preview','production-source','production-public','approved-preview','output']:
        parser.add_argument('--'+flag,required=True,type=Path)
    args=parser.parse_args(); output=args.output.resolve()
    roots=[getattr(args,name).resolve() for name in ['source','public','preview','production_source','production_public','approved_preview']]
    require(not any(output==root or output.is_relative_to(root) for root in roots),'Audit receipt must remain outside all audited roots')
    try:result=audit(*roots)
    except (AssertionError,OSError,ValueError,KeyError) as error:
        result={'passed':False,'error':str(error),'offlineOnly':True,'noProviderWrites':True}
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False));return 0 if result['passed'] else 1

if __name__=='__main__':raise SystemExit(main())
