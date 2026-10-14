import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, lstatSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const LEON_COMBINED_BASELINE = 'data/leon-leben-combined-baseline.json';
export const LEON_COMBINED_SHA256 = '1209b8f6b5ee2f8691b9eaf204d1a71e7bb5538b9624a83dd0951a0fbf838ae9';
const MANIFEST = 'data/brochures-leon.json';
const MAIN_BASELINE = 'data/leon-main-baseline.json';
const MANIFEST_SHA256 = '962ed948e818a6c27046657bea5835d54e1e885f88c14775b5567b1c6c3ec28d';
const MAIN_BASELINE_SHA256 = '2a5a315c3a63073a01e38f4fb68c0dbb83d5481b7c90aea6f19616e328edf64c';
const DATA_KEYS = Object.freeze({'data/proyectos.json':'catalogue','data/fichas-proyectos.json':'research','data/registro-fichas.json':'ledger'});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,item])=>[key,canonical(item)])) : value;
const fingerprint = value => hash(JSON.stringify(canonical(value)));
function pinnedJson(root, name, sha256) {
  const path = resolve(root, name);
  assert.ok(lstatSync(path).isFile() && realpathSync(path) === path, 'León evidence must be regular: ' + name);
  const bytes = readFileSync(path);
  assert.equal(hash(bytes), sha256, 'Unreviewed León preservation evidence: ' + name);
  return JSON.parse(bytes);
}
export function readLeonCombinedBaseline(root=ROOT) {
  return pinnedJson(root, LEON_COMBINED_BASELINE, LEON_COMBINED_SHA256);
}
function evidence(root=ROOT) {
  if (!existsSync(resolve(root, MANIFEST)) && !existsSync(resolve(root, MAIN_BASELINE))) return null;
  return { baseline:pinnedJson(root, MAIN_BASELINE, MAIN_BASELINE_SHA256), review:pinnedJson(root, MANIFEST, MANIFEST_SHA256) };
}

// Restores only the eight León objects for an independently pinned historical
// check. The live catalogue continues to contain five projects and three retirements.
export function restoreLeonRows(rows, file='data/proyectos.json', {root=ROOT}={}) {
  const bound=evidence(root); if (!bound || !DATA_KEYS[file]) return rows;
  const {baseline,review}=bound, originals=baseline.originalRows[file];
  const all=new Set([...baseline.authorizedSlugs,...baseline.retiredSlugs]);
  const actual=rows.filter(row=>all.has(row.slug));
  if (fingerprint(actual)===fingerprint(originals)) return rows;
  const approved=review[DATA_KEYS[file]];
  assert.equal(actual.length,5,'León requires exactly five reviewed successors');
  assert.ok(!rows.some(row=>baseline.retiredSlugs.includes(row.slug)),'Retired León rows cannot return to the live catalogue');
  assert.equal(fingerprint(actual),fingerprint(approved),'León successors must match the independent main review');
  const combined=rows.length===134 ? readLeonCombinedBaseline(root) : null;
  assert.equal(rows.length,combined ? 134 : 141,'Unreviewed León catalogue composition');
  const boundary=combined??baseline;
  assert.equal(fingerprint(rows.filter(row=>!all.has(row.slug))),boundary.otherRowsSha256[file],
    'León changed a record outside its authorized successor scope: '+file);
  const old=new Map(originals.map(row=>[row.slug,row]));
  const result=rows.map(row=>all.has(row.slug)?structuredClone(old.get(row.slug)):row);
  const rowOrder=combined ? combined.originalRowOrders[file] : readLeonCombinedBaseline(root).originalMainRowOrders[file];
  const order=new Map(rowOrder.map((slug,index)=>[slug,index]));
  for (const slug of baseline.retiredSlugs) {
    const index=result.findIndex(row=>order.get(row.slug)>order.get(slug));
    result.splice(index<0?result.length:index,0,structuredClone(old.get(slug)));
  }
  return result;
}

export function restoreLeonContexts(contexts, {root=ROOT}={}) {
  const bound=evidence(root); if(!bound)return contexts;
  const proof=readLeonCombinedBaseline(root),all=new Set([...proof.authorizedSlugs,...proof.retiredSlugs]);
  const actual=Object.fromEntries(Object.entries(contexts).filter(([slug])=>all.has(slug)));
  if(fingerprint(actual)===fingerprint(proof.originalContexts))return contexts;
  const approved=Object.fromEntries(bound.review.catalogue.map(row=>[row.slug,{name:row.nombre,url:row.detalleUrl}]));
  assert.equal(fingerprint(actual),fingerprint(approved),'Unreviewed León project context');
  assert.equal(fingerprint(Object.fromEntries(Object.entries(contexts).filter(([slug])=>!all.has(slug)))),proof.otherContextsSha256,
    'Other project contexts changed outside the León union');
  return Object.fromEntries(proof.originalContextOrder.map(slug=>[slug,all.has(slug)?structuredClone(proof.originalContexts[slug]):contexts[slug]]));
}

function removeOnce(text, literal) {
  assert.equal(text.split(literal).length,2,'Only the exact León insertion can be projected');
  return text.replace(literal,'');
}
export function projectLeonFile(file,value,{root=ROOT}={}) {
  const bound=evidence(root); if(!bound)return value;
  const proof=readLeonCombinedBaseline(root);
  if(DATA_KEYS[file]) {
    const rows=JSON.parse(value),restored=restoreLeonRows(rows,file,{root});
    if(restored===rows)return value;
    // Preserve every foreign object's literal bytes and original decimal
    // encodings. Only the eight bound León row blocks are restored.
    const blocks=value.toString().match(/^  \{[\s\S]*?^  \}/gm);
    if(blocks?.length===rows.length) {
      const current=new Map(blocks.map(block=>[JSON.parse(block).slug,block]));
      const result=restored.map(row=>proof.originalRowsSource[file][row.slug]??current.get(row.slug));
      assert.ok(result.every(Boolean),'Missing foreign row while projecting León');
      return Buffer.from('[\n'+result.join(',\n')+'\n]\n');
    }
    return Buffer.from(JSON.stringify(restored,null,2)+'\n');
  }
  if(proof.originalFiles[file]) {
    const current=hash(value),original=proof.originalFiles[file];
    const approved=bound.baseline.approvedFiles[file];
    assert.ok(current===original.sha256||current===approved,'Unreviewed León fiche: '+file);
    return Buffer.from(original.content);
  }
  if(file==='lib/project-context.mjs') {
    const text=value.toString(),pattern=/(export const projects = Object\.freeze\()([\s\S]*?)(\);)/;
    const match=text.match(pattern); assert.ok(match,'Missing project context registry');
    const contexts=JSON.parse(match[2]),restored=restoreLeonContexts(contexts,{root});
    if(restored===contexts)return value;
    const result=Buffer.from(text.replace(pattern,(_,start,data,end)=>start+JSON.stringify(restored,null,2)+end));
    assert.equal(hash(result),proof.originalSharedSha256[file],'Shared context bytes changed outside León');
    return result;
  }
  if(file==='sitemap.xml') {
    const entries=[...proof.originalSitemap.matchAll(/  <url>[\s\S]*?<\/url>\n/g)].map(match=>match[0]);
    const retired=entries.filter(entry=>proof.retiredSlugs.some(slug=>entry.includes('/'+slug+'.html')));
    assert.equal(retired.length,3,'The frozen sitemap needs three exact retirement slots');
    const current=value.toString();
    if(hash(value)===proof.originalSharedSha256[file])return value;
    assert.equal(current,retired.reduce((text,entry)=>text.replace(entry,''),proof.originalSitemap),'Unrelated sitemap change');
    let result=current;
    for(const entry of retired.reverse()) {
      const next=entries[entries.indexOf(entry)+1];
      const anchor=next??'</urlset>';
      assert.ok(result.includes(anchor),'Missing historical sitemap insertion anchor');
      result=result.replace(anchor,entry+anchor);
    }
    assert.equal(hash(result),proof.originalSharedSha256[file],'Sitemap projection changed foreign routes');
    return Buffer.from(result);
  }
  if(!proof.originalSharedSha256[file])return value;
  if(hash(value)===proof.originalSharedSha256[file])return value;
  let text=value.toString();
  if(file==='vercel.json') {
    const config=JSON.parse(text);
    assert.equal(config.git.deploymentEnabled.main,false);
    for(const branch of ['codex/leon-main-integration','codex/leon-cartera-preview'])assert.equal(config.git.deploymentEnabled[branch],false);
    text=removeOnce(text,',\n      "codex/leon-main-integration": false,\n      "codex/leon-cartera-preview": false');
  } else if(file==='scripts/package-vercel.mjs') {
    for(const addition of [
      ", 'codex/leon-main-integration', 'codex/leon-cartera-preview'",
      "let leonReview=null, leonTools=null;\ntry { leonReview=JSON.parse(await readFile(join(root,'data/brochures-leon.json'),'utf8')); }\ncatch(error){ if(error.code!=='ENOENT')throw error; }\nconst leonPaths=new Set();\n",
      "if(leonReview){\n  if(!preview)throw new Error('The León update remains authorized for protected Preview only');\n  leonTools=await import('./leon-main-publication.mjs');\n  if (JSON.parse(await readFile(join(root, 'data/proyectos.json'))).length === 134) leonTools.assertLeonCombinedScope(root);\n  else leonTools.assertLeonMainScope(root);\n  for(const a of leonTools.verifyLeonAssets(leonReview,{root}))leonPaths.add(join(root,a.localPath.slice(1)));\n}\n",
      ', ...(leonTools?.LEON_RETIRED_SLUGS ?? [])',
      "    if(path.startsWith('assets/brochures/leon')||path.startsWith('assets/propiedades/leon')){\n      const info=await lstat(source);if(info.isSymbolicLink())throw new Error('León media must be regular');\n      return info.isDirectory()?[...leonPaths].some(file=>file.startsWith(source+sep)):leonPaths.has(source);\n    }\n",
    ])text=removeOnce(text,addition);
  } else if(file==='scripts/brochure-publication.mjs') {
    text=removeOnce(text,"import { restoreLeonRows } from './leon-combined-scope.mjs';\n");
    text=removeOnce(text,"export { restoreLeonRows } from './leon-combined-scope.mjs';\n");
    text=removeOnce(text,'  projects = restoreLeonRows(projects);\n');
  } else if(file==='scripts/sento-publication.mjs') {
    text=removeOnce(text,"import { restoreLeonRows, projectLeonFile } from './leon-combined-scope.mjs';\n");
    text=removeOnce(text,'  value = projectLeonFile(file, value);\n');
    text=removeOnce(text,'  rows = restoreLeonRows(rows);\n');
  } else if(file==='scripts/ecasa-image-quality.mjs') {
    text=removeOnce(text,"import { restoreLeonRows } from './leon-combined-scope.mjs';\n");
    text=removeOnce(text,'  catalogue = restoreLeonRows(catalogue);\n');
  }
  assert.equal(hash(text),proof.originalSharedSha256[file],'Shared bytes changed outside exact León insertions: '+file);
  return Buffer.from(text);
}

export function assertLeonCombinedScope(root=ROOT) {
  const {baseline,review}=evidence(root),proof=readLeonCombinedBaseline(root);
  for(const [file,key] of Object.entries(DATA_KEYS)) {
    const rows=JSON.parse(readFileSync(resolve(root,file)));
    assert.equal(rows.length,134);assert.equal(new Set(rows.map(row=>row.slug)).size,134);
    const all=new Set([...proof.authorizedSlugs,...proof.retiredSlugs]);
    assert.equal(fingerprint(rows.filter(row=>all.has(row.slug))),fingerprint(review[key]));
    assert.equal(fingerprint(rows.filter(row=>!all.has(row.slug))),proof.otherRowsSha256[file],'Other combined developer records changed: '+file);
    assert.ok(!rows.some(row=>proof.retiredSlugs.includes(row.slug)),'Retired León project returned');
  }
  for(const item of [...proof.otherHtml,...proof.existingAssets]) {
    const path=resolve(root,item.path);assert.ok(lstatSync(path).isFile()&&realpathSync(path)===path,'Nonregular preserved resource');
    const bytes=readFileSync(path);assert.equal(bytes.length,item.bytes);assert.equal(hash(bytes),item.sha256,'Other combined resource changed: '+item.path);
  }
  for(const slug of proof.authorizedSlugs)assert.equal(hash(readFileSync(resolve(root,slug+'.html'))),baseline.approvedFiles[slug+'.html'],'Reviewed León fiche changed');
  for(const slug of proof.retiredSlugs)assert.ok(!existsSync(resolve(root,slug+'.html')),'Retired León root route returned');
  assert.equal(hash(readFileSync(resolve(root,'assets/css/leon.css'))),baseline.approvedFiles['assets/css/leon.css']);
  return {otherProjects:129,otherHtml:proof.otherHtml.length,existingAssets:proof.existingAssets.length};
}
