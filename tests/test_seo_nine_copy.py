"""Regresión acotada de los nueve textos aprobados; no solicita ni publica nada."""
import html
import json
import re
import subprocess
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '87108f3fc6d10994d456388c106e79a5b538bffc'
REVIEW = ROOT/'docs/seo-measurement/reviews/2026-11-08-four-pages'
P = {x['id']: x for x in json.loads((REVIEW/'proposals.json').read_text())}
FILES = {'home':'index.html','orientation':'centro-orientacion.html','guide':'guia-hipotecaria.html','comparator':'comparador-hipotecario.html'}

def before(name):
    return subprocess.check_output(['git','show',BASE+':'+name],cwd=ROOT).decode()

def inline(text):
    return re.sub(r'\[([^\]]+)\]\((/[^)]+)\)',r'<a href="\2">\1</a>',text)

def restore_once(text,new,old):
    if text.count(new)!=1:
        raise AssertionError('El reemplazo aprobado debe existir una sola vez: '+new)
    return text.replace(new,old,1)

class Content(HTMLParser):
    def __init__(self,text):
        super().__init__();self.meta=[];self.controls=[];self.links=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        if tag=='meta':self.meta.append(dict(attrs))
        if tag in {'input','select','textarea','button','form','fieldset'}:self.controls.append((tag,attrs))
        if tag=='a':self.links.append(dict(attrs))

class NineCopyTests(unittest.TestCase):
    def test_approved_changes_are_unique_and_every_other_page_byte_is_preserved(self):
        for page,name in FILES.items():
            text=(ROOT/name).read_text();baseline=before(name)
            for x in [p for p in P.values() if p['page']==page]:
                id=x['id']
                if id=='H01':
                    text=restore_once(text,'<meta name="description" content="'+x['proposed']+'">','<meta name="description" content="'+x['current']+'">')
                elif id=='O02':
                    a,b=x['current'].split('\n');aa,bb=x['proposed'].split('\n\n')
                    text=restore_once(text,aa,a);text=restore_once(text,bb,b)
                elif id=='G01':
                    text=restore_once(text,'<p>'+inline(x['proposed'])+'</p>','')
                elif id=='C01':
                    new=inline(x['proposed']).replace('el pie, la tasa y el plazo. ','el pie, la tasa y el plazo.<br class="desktop-break"> ',1)
                    old='Explora cómo cambia tu dividendo según el pie, la tasa y el plazo.<br class="desktop-break"> Si necesitas repasar conceptos, consulta la <a href="/guia-hipotecaria.html">guía hipotecaria</a>.'
                    text=restore_once(text,new,old)
                else:text=restore_once(text,inline(x['proposed']),x['current'])
            self.assertEqual(text,baseline,name)
    def test_baseline_matches_the_four_published_snapshots(self):
        import hashlib
        for x in json.loads((REVIEW/'evidence/published-content.json').read_text()):
            self.assertEqual(hashlib.sha256(before(FILES[x['name']]).encode()).hexdigest(),x['body_sha256'])
    def test_titles_h1_schema_styles_scripts_and_canonical_are_identical(self):
        patterns=[r'<title>.*?</title>',r'<h1\b.*?</h1>',r'<script\b.*?</script>',r'<style\b.*?</style>',r'<link\b[^>]+>']
        for name in FILES.values():
            old,new=before(name),(ROOT/name).read_text()
            for pattern in patterns:self.assertEqual(re.findall(pattern,old,re.S),re.findall(pattern,new,re.S),(name,pattern))
    def test_only_the_home_description_meta_changes(self):
        for name in FILES.values():
            old,new=Content(before(name)).meta,Content((ROOT/name).read_text()).meta
            if name=='index.html':
                expected=[dict(m,content=P['H01']['proposed']) if m.get('name')=='description' else m for m in old]
                self.assertEqual(new,expected)
            else:self.assertEqual(new,old)
    def test_all_form_control_attributes_and_consent_fragments_are_identical(self):
        for name in FILES.values():
            old,new=before(name),(ROOT/name).read_text()
            self.assertEqual(Content(new).controls,Content(old).controls,name)
            for form in re.findall(r'<form\b.*?</form>',old,re.S):
                if P['C02']['current'] in form:
                    form=form.replace(P['C02']['current'],P['C02']['proposed'],1)
                self.assertIn(form,new,name)
    def test_original_links_are_preserved_except_one_educational_label(self):
        expected_extra={'index.html':[], 'centro-orientacion.html':['/guia-hipotecaria.html','/comparador-hipotecario.html'], 'guia-hipotecaria.html':['/comparador-hipotecario.html'],'comparador-hipotecario.html':[]}
        for name in FILES.values():
            old=Content(before(name)).links;new=Content((ROOT/name).read_text()).links
            from collections import Counter
            freeze=lambda a:tuple(a.items())
            delta=Counter(map(freeze,new));delta.subtract(Counter(map(freeze,old)))
            self.assertFalse(any(n<0 for n in delta.values()),name)
            extras=[dict(a).get('href') for a,n in delta.items() for _ in range(max(0,n))]
            self.assertCountEqual(extras,expected_extra[name])
    def test_g01_is_before_existing_actions_and_durable_in_specific_generator(self):
        addition='<p>'+inline(P['G01']['proposed'])+'</p>'
        guide=(ROOT/'guia-hipotecaria.html').read_text()
        anchor='<p class="gh-help">Puedes usar toda la guía sin completar un formulario. Tus escenarios no se adjuntan a la solicitud.</p>'
        self.assertIn(anchor+addition+'</div><div class="gh-actions">',guide)
        name='scripts/build-mortgage-guide.py';new=(ROOT/name).read_text()
        self.assertEqual(restore_once(new,addition,''),before(name))
    def test_main_and_working_branch_deployments_remain_disabled(self):
        name='vercel.json';self.assertEqual((ROOT/name).read_text(),before(name))
        config=json.loads((ROOT/name).read_text())['git']['deploymentEnabled']
        self.assertIs(config['main'],False);self.assertIs(config['codex/seo-medicion-20261108'],False)

if __name__=='__main__':unittest.main()
