// Historical fixtures may project either developer only after exact dual binding.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { assertEcasaMainIntegration, assertIntegratedSharedSuccessor } from '../scripts/ecasa-main-integration.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const A99='a99d1c8d077698f78d9824ca96d47cb19e515dcd';
const F66='f66fbec15f1f4b30be3a70e94644a29212402a63';
const original=path=>execFileSync('git',['show',A99+':'+path],{cwd:ROOT,maxBuffer:16*1024*1024});
export const mergedEcasaSlugs=new Set(JSON.parse(original('data/proyectos.json')).filter(row=>row.inmobiliaria==='Ecasa').map(row=>row.slug));
export function mergedPredecessorData(path,commit) {
 return execFileSync('python3',[resolve(ROOT,'tests/integrated_scope.py'),'--data',path,commit],
  {cwd:ROOT,input:readFileSync(resolve(ROOT,path)),maxBuffer:16*1024*1024});
}
export function mergedMainPage(path,bytes) {
 return execFileSync('python3',[resolve(ROOT,'tests/integrated_scope.py'),path],{cwd:ROOT,input:bytes,maxBuffer:16*1024*1024});
}
export function historicalMergedData(path) {
 return execFileSync('python3',[resolve(ROOT,'tests/integrated_scope.py'),'--canonical-history',path],
  {cwd:ROOT,maxBuffer:16*1024*1024});
}
let validatedIntegration=null;
export function verifyMergedShared(path,oldSha256) {
 // The trusted context covers immutable source bytes in this test process.
 // The requested shared file is read and hashed afresh by the runtime guard.
 const integration=validatedIntegration??=assertEcasaMainIntegration(ROOT);
 assert.ok(integration,'An exact merged runtime receipt is required');
 assert.equal(assertIntegratedSharedSuccessor(path,oldSha256,{root:ROOT,integration}),true,
  path+': shared successor is outside the exact merge receipt');
}
export function assertMergedSource(path,baselineBytes) {
 const current=readFileSync(resolve(ROOT,path));
 if(['data/proyectos.json','data/fichas-proyectos.json','data/registro-fichas.json'].includes(path)) {
  mergedPredecessorData(path,A99);
  assert.deepEqual(JSON.parse(current).filter(row=>mergedEcasaSlugs.has(row.slug)),
   JSON.parse(baselineBytes).filter(row=>mergedEcasaSlugs.has(row.slug)),path+': Ecasa source evidence changed');
 } else if(path.endsWith('.html')) {
  const source=mergedEcasaSlugs.has(path.replace(/\.html$/,''))?baselineBytes:
   execFileSync('git',['show',F66+':'+path],{cwd:ROOT,maxBuffer:16*1024*1024});
  assert.deepEqual(current,source,path+': merged source owner bytes changed');
 } else if(path==='sitemap.xml') {
  const catalogue=JSON.parse(readFileSync(resolve(ROOT,'data/proyectos.json')));
  const urls=[...current.toString().matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]);
  assert.equal(urls.length,139);assert.equal(new Set(urls).size,139);
  for(const row of catalogue)assert.ok(urls.some(url=>url.endsWith('/'+row.slug+'.html')),row.slug);
 } else if(path==='vercel.json') {
  const config=JSON.parse(current);
  const a=JSON.parse(original(path)),b=JSON.parse(execFileSync('git',['show',F66+':'+path],{cwd:ROOT}));
  assert.deepEqual(config.git.deploymentEnabled,{...a.git.deploymentEnabled,...b.git.deploymentEnabled});
  for(const gate of Object.values(config.git.deploymentEnabled))assert.equal(gate,false);
  const stripped=value=>{const copy=structuredClone(value);delete copy.git.deploymentEnabled;return copy;};
  assert.deepEqual(stripped(config),stripped(a),path+': only the union of manual deployment gates may change');
 } else assert.deepEqual(current,baselineBytes,path);
 return current;
}
