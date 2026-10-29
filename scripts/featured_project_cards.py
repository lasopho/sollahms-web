"""Synchronize the two reviewed homepage cards from existing central records.

No prices, image markup, scripts, styles or other cards are rewritten.
Run after any homepage regeneration; --check is a release gate.
"""
import argparse, html, json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SLUGS=('inn-puerto-chico','plaza-las-condes')
def read(path):return json.loads((ROOT/path).read_text())
def fmt(n):return f'{n:.2f}'.replace('.',',')
def typologies(labels):
    nums=[str(int(re.search(r'\d+',t)[0])) for t in labels if re.search(r'\d+',t)]
    text=(', '.join(nums[:-1])+' y '+nums[-1] if len(nums)>1 else nums[0])+' dormitorios' if nums else ''
    return ('Estudio, ' if any(t.lower()=='estudio' for t in labels) and text else 'Estudio' if not text else '')+text
def facts():
    projects={p['slug']:p for p in read('data/proyectos.json')}
    fiches={p['slug']:p for p in read('data/fichas-proyectos.json')}
    plc=read('data/plaza-las-condes-verified.json')
    totals=[p['totalM2'] for p in plc['plans'] if p.get('totalM2') is not None]
    useful=[m['usefulM2'] for m in fiches['inn-puerto-chico']['officialSurfaceModels']['records']]
    assert totals and useful and all(n>0 for n in totals+useful)
    return {
      'plaza-las-condes':{'typologies':typologies(projects['plaza-las-condes']['tipologias']),'surfaceLabel':'Total según planos','surface':f'{fmt(min(totals))}–{fmt(max(totals))} m²','description':projects['plaza-las-condes']['descripcionCorta']},
      'inn-puerto-chico':{'typologies':typologies(projects['inn-puerto-chico']['tipologias']), 'surfaceLabel':'Útil aprox.','surface':f'{fmt(min(useful))}–{fmt(max(useful))} m²'}}
def apply_home(page):
    data=facts()
    for number,slug in [(2,'inn-puerto-chico'),(3,'plaza-las-condes')]:
        # The existing card boundaries and all image/CTA/style bytes are preserved.
        start=page.index(f'<!-- Property Card {number} -->')
        end=page.index(f'<!-- Property Card {number+1} -->',start) if number==2 else page.index('<div class="flex justify-center mt-16">',start)
        block=page[start:end];assert f'href="/{slug}.html"' in block
        f=data[slug]
        pattern=r'(<span class="block text-\[10px\] uppercase text-slate-400 font-bold">)(?:Tipologías|Tipologías del proyecto)(</span><span class="font-mono text-sm font-bold">)[^<]*(</span>)'
        block,n=re.subn(pattern,lambda m:m[1]+'Tipologías del proyecto'+m[2]+html.escape(f['typologies'])+m[3],block);assert n==1
        pattern=r'(<span class="block text-\[10px\] uppercase text-slate-400 font-bold">)(?:Superficie|Total según planos|Útil aprox\.)(</span><span class="font-mono text-sm font-bold text-primary">)[^<]*(</span>)'
        block,n=re.subn(pattern,lambda m:m[1]+f['surfaceLabel']+m[2]+f['surface']+m[3],block);assert n==1
        if f.get('description'):
            block,n=re.subn(r'(<p class="text-sm text-secondary leading-relaxed mb-6">)[^<]*(</p>)',lambda m:m[1]+html.escape(f['description'])+m[2],block);assert n==1
        page=page[:start]+block+page[end:]
    return page
def apply_fiche(page,project):
    if project['slug']!='inn-puerto-chico':return page
    f=next(x for x in read('data/fichas-proyectos.json') if x['slug']==project['slug'])
    surface=facts()[project['slug']]['surface']
    page,n=re.subn(r'(<div class="text-\[10px\] text-secondary font-bold tracking-widest uppercase">)(?:Superficie desde|Superficie útil aprox\.)(</div><div class="text-lg font-headline font-extrabold text-primary">)(?:<span class="pending">Por confirmar</span>|[^<]+)(</div>)',lambda m:m[1]+'Superficie útil aprox.'+m[2]+surface+m[3],page);assert n==1
    page,n=re.subn(r'<li>Superficie útil(?: aproximada)?: (?:<span class="pending">Por confirmar</span>|[^<]+)</li>',lambda _:'<li>Superficie útil aproximada: '+surface+'</li>',page);assert n==1
    # Keep the unnormalized total honest, and explain the useful-area scope in the existing section.
    start=page.index('id="detalle-adicional"');end=page.index('</section>',start)
    block=page[start:end];block=re.sub(r'<p data-surface-scope="inn">.*?</p>','',block)
    block+='<p data-surface-scope="inn">'+html.escape(f['surfaceNote'])+'</p>'
    return page[:start]+block+page[end:]
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
    for name,render in [('index.html',apply_home),('inn-puerto-chico.html',lambda p:apply_fiche(p,{'slug':'inn-puerto-chico'}))]:
        p=ROOT/name;before=p.read_text();after=render(before)
        if args.check:assert before==after,'Regenerate '+name
        else:p.write_text(after)
    print(json.dumps(facts(),ensure_ascii=False))
if __name__=='__main__':main()
