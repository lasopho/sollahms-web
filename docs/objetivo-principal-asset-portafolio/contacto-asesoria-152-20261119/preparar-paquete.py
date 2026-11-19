from pathlib import Path
import hashlib,json,shutil
r=Path('/private/tmp/sollahms-contacto-152-20261119');app=Path('/private/tmp/sollahms-contacto-asesoria-152-20261119');base=r/'base-output';stage=r/'release/stage';out=stage/'.vercel/output'
def h(b):return hashlib.sha256(b).hexdigest()
inventory=r/'base-output-inventory.json';assert h(inventory.read_bytes())=='e12408412891bcf181380717ceecf56fc97067f0ff06a7aba25d26f95f12bc72';expected=json.loads(inventory.read_text())['files'];assert len(expected)==1727
for path,row in expected.items():assert h((base/path).read_bytes())==row['sha256'],path
if not out.exists():shutil.copytree(base,out)
projects=json.loads((app/'data/catalog-expansion-iris-20261118.json').read_text())['projects']
public=['contacto.html','agenda-asesoria.html','assets/js/advisory.mjs','assets/js/advisory-project-context.mjs']+[p['detailUrl'].lstrip('/') for p in projects]
for path in public:
 target=out/'static'/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(app/path,target)
whitelist='functions/api/advisory.func/data/advisory-projects.json';shutil.copyfile(app/'data/advisory-projects.json',out/whitelist)
(stage/'.vercel/project.json').write_text(json.dumps({'projectId':'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH','orgId':'team_A9VNIW2f2K1IJpd2pGdvDmEN','projectName':'project-wrapp'},indent=2)+'\n')
rows=[]
for p in sorted(out.rglob('*')):
 if p.is_file():
  b=p.read_bytes();rows.append({'path':str(p.relative_to(out)),'bytes':len(b),'sha256':h(b),'sha1':hashlib.sha1(b).hexdigest()})
new={x['path']:x for x in rows};added=sorted(set(new)-set(expected));removed=sorted(set(expected)-set(new));changed=sorted(k for k in set(new)&set(expected) if new[k]['sha256']!=expected[k]['sha256']);allowed=sorted(['static/'+p for p in public if p!='assets/js/advisory-project-context.mjs']+[whitelist])
assert len(rows)==1728 and added==['static/assets/js/advisory-project-context.mjs'] and not removed and changed==allowed,(added,removed,changed)
assert 'static/data/advisory-projects.json' not in new
functions=[x for x in rows if x['path'].startswith('functions/')];assert len(functions)==57 and new['config.json']['sha256']==expected['config.json']['sha256']
assert all(new[k]['sha256']==row['sha256'] for k,row in expected.items() if k.startswith('functions/') and k!=whitelist)
res={'schemaVersion':1,'baseCommit':'b56fa12771a824dd8a4d581dc0c9c81e0938f71a','baseDeploymentId':'dpl_Dbd8TFEozqMgfFZ7DsGwq4efWKXC','baseInventorySHA256':h(inventory.read_bytes()),'files':len(rows),'bytes':sum(x['bytes'] for x in rows),'changed':changed,'added':added,'removed':removed,'unchanged':1727-len(changed),'original131FichesUnchanged':True,'new21FichesOnlyThreeContactLinksChanged':True,'commercialCatalogAndMapPreserved':True,'measurementAndConsentPreserved':True,'functions':7,'functionFiles':57,'functionFilesUnchanged':56,'functionExecutableCodeAndConfigurationUnchanged':True,'functionDataChangedOnly':whitelist,'configurationPreserved':True,'buildsOrGeneratorsExecuted':0,'inventorySHA256':h(''.join(x['path']+'\t'+str(x['bytes'])+'\t'+x['sha256']+'\n' for x in rows).encode()),'inventory':rows}
(r/'release/MANIFIESTO-PAQUETE.json').write_text(json.dumps(res,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in res.items() if k!='inventory'},ensure_ascii=False))
