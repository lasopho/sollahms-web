"""Focused editorial consistency and preservation against reviewed PR19 head."""
from pathlib import Path
from html import escape
import ast,json,subprocess
R=Path(__file__).resolve().parents[1];D=R/'docs/beneficios-tributarios-20261114'
m=json.loads((D/'matriz-beneficios.json').read_text());log=json.loads((D/'correcciones-antes-despues.json').read_text())
old=json.loads(subprocess.check_output(['git','show',log['reference']+':docs/beneficios-tributarios-20261114/matriz-beneficios.json'],cwd=R))
changed={x['id'] for x in log['changes']};assert len(changed)==6
p=(R/'beneficios-tributarios-inmobiliarios.html').read_text()
for b,o in zip(m['benefits'],old['benefits']):
 assert b['id']==o['id']
 if b['id'] not in changed:assert b==o
 else:
  entry=next(x for x in log['changes'] if x['id']==b['id']);assert entry['before']==o and entry['after']==b
 for k in ['requirements','limits','validity']:assert escape(b[k]) in p,(b['id'],k)
 for s in b['sources']:assert 'id="fuente-'+s+'"' in p
nodes=ast.parse((D/'generate-page.py').read_text()).body
args=[list(map(ast.literal_eval,n.value.args)) for n in nodes if isinstance(n,ast.Expr) and isinstance(n.value,ast.Call) and isinstance(n.value.func,ast.Name) and n.value.func.id=='add']
keys=['id','title','who','status','what','requirements','limits','validity','example','sources']
assert len(args)==16
for a,b in zip(args,m['benefits']):assert dict(zip(keys,a))=={k:b[k] for k in keys},b['id']
assert '30/11/2027' not in p and 'El terreno no goza' not in p
assert 'noindex, nofollow' in p
paths=subprocess.check_output(['git','diff','--name-only',log['reference']],cwd=R,text=True).splitlines()
assert all(x=='beneficios-tributarios-inmobiliarios.html' or x.startswith('docs/beneficios-tributarios-20261114/') or x=='tests/beneficios-tributarios-correcciones.py' for x in paths),paths
print(json.dumps({'cards':16,'changed':6,'unchanged':10,'html_json_generator':'consistent','scope':'pass','legacy_css_js':'unchanged'},ensure_ascii=False))
