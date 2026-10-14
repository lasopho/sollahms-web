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
MAIN_COMPARISON = 'f66fbec15f1f4b30be3a70e94644a29212402a63'
MERGE_ECASA_REVIEW = 'a99d1c8d077698f78d9824ca96d47cb19e515dcd'
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

def merged_public_inventory(source, main_output, approved_preview):
    """Exact main resources plus the previously approved Ecasa successor only."""
    policy=load(source/'data/ecasa-main-integration.json')
    require(policy['mainCommit']==MAIN_COMPARISON and policy['ecasaCommit']=='a99d1c8d077698f78d9824ca96d47cb19e515dcd',
            'Unrecognized concurrent-main integration receipt')
    private_documents={row['file'] for row in policy['privateDocuments']}
    require(len(private_documents)==11 and all(path.startswith(('assets/brochures/leon/','assets/brochures/sento/')) and path.endswith('.pdf')
            for path in private_documents), 'Exactly11 preserved private source PDF paths required')
    main=inventory(main_output); approved=inventory(approved_preview)
    old_ecasa={slug+'.html' for slug in policy['mainEcasaSlugs']}
    # These exact historic resources were already retired in the approved a99
    # Ecasa candidate. All unrelated main photographs, originals and plans stay.
    retired={
        'assets/propiedades/catalogo/883af11703388c0dba211491.webp',
        'assets/propiedades/catalogo/70413545b58983da8e24825a.webp',
        'assets/propiedades/catalogo/5ec72b840d3cb985b609df36.webp',
        'assets/propiedades/catalogo/cc5c4d04b4f258731931d6eb.webp',
        'assets/propiedades/catalogo/81adaf07bdbd2fab601a093c.webp',
        'assets/propiedades/catalogo/da691207ca6c24621740a2e4.webp',
        'assets/propiedades/catalogo/204406fdd4ac3e04f45dcd19.webp',
        'assets/propiedades/catalogo/9521654e9d91c2fac363344a.webp',
        'assets/propiedades/catalogo/22dad05519d3b294ee0d70f5.webp',
        'assets/propiedades/catalogo/a773e94159c8ca452f77aabb.webp',
        'assets/propiedades/catalogo/a35bc3797ca9f594152f5de1.webp',
    }
    require(not retired & set(approved), 'An approved Ecasa retired asset returned')
    selected={row['localPath'].lstrip('/') for row in load(source/'data/ecasa-publication-candidate.json')['selectedResources']}
    addition={slug+'.html' for slug in ECASA}|selected|{
        'assets/js/project-identity.mjs','assets/js/ecasa-stages.js','assets/css/ecasa-stages.css'}
    require(addition<=set(approved), 'Approved Ecasa output is incomplete')
    expected=(set(main)-old_ecasa-private_documents-retired)|addition
    return expected, private_documents


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


def audit_merged_preview(source, preview, main_source, main_preview, approved_preview):
    source,preview,main_source,main_preview,approved_preview=[Path(path).resolve() for path in
        [source,preview,main_source,main_preview,approved_preview]]
    require(all(path.is_dir() for path in [source,preview,main_source,main_preview,approved_preview]), 'All five Preview-only audit roots must exist')
    policy=load(source/'data/ecasa-main-integration.json')
    require(policy['scope']=='ecasa_main_exact_integration' and policy['protectedPreviewOnly'] is True and
        policy['mainCommit']==MAIN_COMPARISON and policy['ecasaCommit']==MERGE_ECASA_REVIEW and
        policy['counts']=={'projects':133,'ecasa':15,'otherDevelopers':118}, 'Unrecognized exact merge receipt')
    manifest=load(source/'data/ecasa-publication-candidate.json')
    require(manifest['baselineCommit']==BASELINE and manifest['reviewCommit']==REVIEW and
        manifest['actionAuthorization']=={'production':False,'mergeMain':False} and manifest['frozenInputs']==FROZEN_INPUTS,
        'Ecasa evidence or independent content/action scope changed')
    for name,expected in FROZEN_INPUTS.items():require(digest(source/name)==expected,'Frozen Ecasa evidence changed: '+name)
    rows=load(source/'data/proyectos.json');main_rows=load(main_source/'data/proyectos.json')
    require(len(rows)==len({row['slug'] for row in rows})==133 and
        {row['slug'] for row in rows if row['inmobiliaria']=='Ecasa'}==ECASA,'Integrated canonical catalogue must contain133/15')
    others={row['slug'] for row in main_rows if row['inmobiliaria']!='Ecasa'}
    require(len(main_rows)==141 and len(others)==118,'Concurrent main baseline must contain141/23/118')
    for name in ['proyectos.json','fichas-proyectos.json','registro-fichas.json']:
        current=load(source/'data'/name);before=load(main_source/'data'/name)
        require([row for row in current if row['slug'] in others]==[row for row in before if row['slug'] in others],
            'Other SOURCE records changed: '+name)
    for slug in others:
        require(digest(source/(slug+'.html'))==digest(main_source/(slug+'.html')),'Other SOURCE fiche changed: '+slug)
        require(normalized_preview((preview/(slug+'.html')).read_text())==normalized_preview((main_preview/(slug+'.html')).read_text()),
            'Other Preview OUTPUT fiche changed: '+slug)
    output_rows=load(preview/'data/proyectos.json');baseline_output_rows=load(main_preview/'data/proyectos.json')
    require(len(output_rows)==len({row['slug'] for row in output_rows})==133,'Preview catalogue must contain133 unique records')
    require([row for row in output_rows if row['slug'] in others]==[row for row in baseline_output_rows if row['slug'] in others],
        'Other OUTPUT catalogue records changed')
    require([row for row in output_rows if row['slug'] in ECASA]==[row for row in load(approved_preview/'data/proyectos.json') if row['slug'] in ECASA],
        'Approved a99 Ecasa commercial/catalogue image fields changed')
    for name in CORE:require(digest(source/name)==digest(main_source/name),'Financial/privacy/provider core changed: '+name)
    for name,pin in CONTEXT.items():require(digest(source/name)==pin['afterSha256'],'Shared stage-context source changed: '+name)
    selected={row['localPath']:row for row in manifest['selectedResources']}
    require(len(selected)==92 and len(manifest['selectedResources'])==92,'Exactly92 approved Ecasa resources required')
    require(sum(row['kind']=='plan' for row in selected.values())==74 and
        sum(row['kind']=='documentary_photo' for row in selected.values())==11 and
        sum(row['kind']=='official_photo' for row in selected.values())==2 and
        sum(row['kind']=='owner_cover' for row in selected.values())==5,'Ecasa selected image/plan cardinality changed')
    private=source_assets(source)-set(selected);require(len(private)==52,'Exactly52 Ecasa original/unselected resources remain private')
    galleries=plans=0
    for slug in ECASA:
        current=normalized_preview((preview/(slug+'.html')).read_text())
        approved=normalized_preview((approved_preview/(slug+'.html')).read_text())
        require(current==approved,'Approved a99 Ecasa body/layout/media changed: '+slug)
        page=Page(current);require(len(page.ids)==len(set(page.ids)),'Duplicate Ecasa anchors: '+slug)
        galleries+=sum(image['gallery'] for image in page.images);plans+=sum(image['plan'] for image in page.images)
        for image in page.images:
            if image['path'].startswith('/assets/'):
                require(digest(asset_path(preview,image['path']))==digest(asset_path(approved_preview,image['path'])),
                    'Approved Ecasa local image bytes changed: '+image['path'])
            if image['path'] in selected:
                row=selected[image['path']]
                require(row['projectSlug']==slug and row['originCommercialSlug']==image['origin'],'Selected resource attributed to another stage/project')
            if image['plan']:require(image['path'] in selected and selected[image['path']]['kind']=='plan','Unreviewed Ecasa plan')
    require((galleries,plans)==(72,74),'Approved72 gallery photographs/74 plans changed')
    for path,row in selected.items():
        for root in [source,preview,approved_preview]:
            file=asset_path(root,path)
            require(file.is_file() and file.stat().st_size==row['bytes'] and digest(file)==row['sha256'],'Selected resource bytes changed: '+path)
    for path in private:require(not asset_path(preview,path).exists(),'Private Ecasa original/unselected resource exposed: '+path)
    expected,private_documents=merged_public_inventory(source,main_preview,approved_preview)
    current_inventory=inventory(preview);main_inventory=inventory(main_preview)
    require(set(current_inventory)==expected,'Exact merged Preview file inventory changed: '+str({'missing':sorted(expected-set(current_inventory)),
        'extra':sorted(set(current_inventory)-expected)}))
    require(not private_documents&set(current_inventory),'One of11 private source PDFs entered Preview')
    require({path for path in current_inventory if path.startswith('data/')}=={'data/proyectos.json','data/hipotecario.json'},'Private data exposed')
    require(not any(re.search(r'\.(pdf|zip|docx?|xlsx?|env|toml)$',path,re.I) for path in current_inventory),'Private document exposed')
    exceptions={slug+'.html' for slug in ECASA}|{'data/proyectos.json','robots.txt','assets/js/hipotecario.mjs',
        'contacto.html','agenda-asesoria.html','proyectos.html','sitemap.xml'}
    for path in set(main_inventory)&set(current_inventory)-exceptions:
        if path.endswith('.html'):
            require(normalized_preview((preview/path).read_text())==normalized_preview((main_preview/path).read_text()),'Unrelated main page changed: '+path)
        else:require(current_inventory[path]==main_inventory[path],'Unrelated main resource changed: '+path)
    urls=[match[1] for match in re.findall(r'(<loc>)([^<]+)</loc>',(preview/'sitemap.xml').read_text())]
    expected_urls={'https://sollahms.cl'+path for path in ['/', '/proyectos.html','/agenda-asesoria.html','/contacto.html','/privacidad.html','/comparador-hipotecario.html']}|{'https://sollahms.cl/'+row['slug']+'.html' for row in rows}
    require(len(urls)==139 and set(urls)==expected_urls,'Integrated sitemap must contain139 exact indexable identities')
    for path in ['contacto.html','agenda-asesoria.html','proyectos.html']:
        require(normalized_preview((preview/path).read_text())==normalized_preview((approved_preview/path).read_text()),'Approved shared context output changed: '+path)
    require(current_inventory['assets/js/hipotecario.mjs']==CONTEXT['assets/js/hipotecario.mjs']['afterSha256'],'Approved financial context module changed')
    for path in current_inventory:
        if path.endswith('.html'):require(NOINDEX in (preview/path).read_text(),'Preview noindex missing: '+path)
    require((preview/'robots.txt').read_text()=='User-agent: *\nDisallow: /\n','Preview robots must block indexing')
    return {'passed':True,'mode':'integrated_protected_preview_only','comparisonMainCommit':MAIN_COMPARISON,
        'reviewCommit':MERGE_ECASA_REVIEW,'licenseEvidenceBaselineCommit':BASELINE,'projects':133,'ecasaProjects':15,
        'sourceOtherProjects':118,'outputOtherProjects':118,'selectedResources':92,'galleryImages':72,'plans':74,
        'privateEcasaResourcesExcluded':52,'privateOtherDeveloperPdfsExcluded':sorted(private_documents),
        'preservedMainRawGraphicOriginals':sum('/originals/'in path for path in current_inventory if not path.startswith('assets/propiedades/ecasa-')),
        'previewFiles':len(current_inventory),'htmlFiles':sum(path.endswith('.html')for path in current_inventory),
        'publicParityChecked':False,'publicParityLimitation':'Concurrent main contains protected-only Sento/León source; this review verifies Preview only.',
        'productionActionAuthorized':False,'mergeActionAuthorized':False,'offlineOnly':True,'noProviderWrites':True}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--preview-only',action='store_true',help='Exact133-project protected integration review; does not test or authorize public publication')
    for flag in ['source','preview','production-source','production-public','approved-preview','output']:
        parser.add_argument('--'+flag,required=True,type=Path)
    parser.add_argument('--public',type=Path)
    args=parser.parse_args(); output=args.output.resolve()
    if args.preview_only:
        report=audit_merged_preview(args.source,args.preview,args.production_source,args.production_public,args.approved_preview)
    else:
        require(args.public is not None,'The historical two-profile audit requires --public')
        report=audit(args.source,args.public,args.preview,args.production_source,args.production_public,args.approved_preview)
    output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False));return 0 if report['passed'] else 1

if __name__=='__main__':raise SystemExit(main())
