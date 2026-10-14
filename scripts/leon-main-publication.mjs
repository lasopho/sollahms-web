import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BASELINE = 'data/leon-main-baseline.json';
const BASELINE_SHA256 = 'e64e23d30fd6c62928af394575cdae8ecbe4d0489020ead4f096628cf166386d';
export const LEON_SLUGS = ['jardines-de-ramon-cruz','condominio-parque-don-lautaro','condominio-uruguay','gregorio-de-la-fuente-a','bcome'];
export const LEON_RETIRED_SLUGS = ['la-casona-de-buin','urbano-centro','box-santiago'];
export const LEON_MANIFEST = 'data/brochures-leon.json';
const all = new Set([...LEON_SLUGS,...LEON_RETIRED_SLUGS]);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>[k,canonical(v)])) : value;
export const fingerprint = value => hash(JSON.stringify(canonical(value)));
export function readMainBaseline(root=ROOT) {
 const bytes=readFileSync(resolve(root,BASELINE));assert.equal(hash(bytes),BASELINE_SHA256,'Unreviewed main preservation baseline');return JSON.parse(bytes);
}
export { restoreLeonRows } from './brochure-publication.mjs';
export function assertLeonMainScope(root=ROOT) {
 const b=readMainBaseline(root), manifestBytes=readFileSync(resolve(root,LEON_MANIFEST));
 assert.equal(hash(manifestBytes),'962ed948e818a6c27046657bea5835d54e1e885f88c14775b5567b1c6c3ec28d','Unreviewed León source manifest');
 const review=JSON.parse(manifestBytes);
 for(const [file,key] of [['data/proyectos.json','catalogue'],['data/fichas-proyectos.json','research'],['data/registro-fichas.json','ledger']]){
  const rows=JSON.parse(readFileSync(resolve(root,file)));assert.equal(rows.length,b.catalogueCount-3);assert.equal(new Set(rows.map(p=>p.slug)).size,rows.length);
  assert.equal(fingerprint(rows.filter(p=>all.has(p.slug))),fingerprint(review[key]));assert.equal(fingerprint(rows.filter(p=>!all.has(p.slug))),b.otherRowsSha256[file],'Other main developer records changed: '+file);
 }
 for(const item of [...b.otherHtml,...b.existingAssets]){const bytes=readFileSync(resolve(root,item.path));assert.equal(bytes.length,item.bytes);assert.equal(hash(bytes),item.sha256,'Other main resource changed: '+item.path);}
 for(const [file,expected] of Object.entries(b.approvedFiles))assert.equal(hash(readFileSync(resolve(root,file))),expected,'Reviewed León integration file changed: '+file);
 return { otherProjects:b.catalogueCount-8,otherHtml:b.otherHtml.length,existingAssets:b.existingAssets.length };
}
export function verifyLeonAssets(review,{root=ROOT}={}) {
 assert.equal(review.schemaVersion,1);assert.equal(review.protectedPreviewOnly,true);assert.deepEqual(review.projects.map(p=>p.slug).sort(),[...LEON_SLUGS].sort());
 const assets=new Map();
 for(const p of review.projects){
  for(const a of [p.document,...p.images.flatMap(a=>[a,...(a.original?.localPath?[a.original]:[]),...Object.values(a.variants??{}).flat()]),...p.models.flatMap(m=>[m.plan,...Object.values(m.plan.variants??{}).flat()])]){
   assert.ok(a.localPath.startsWith('/assets/brochures/leon/')||a.localPath.startsWith('/assets/propiedades/leon/'+p.slug+'/'));assert.ok(!a.localPath.includes('..'));assert.match(a.sha256,/^[a-f0-9]{64}$/);
   if(assets.has(a.localPath))assert.equal(assets.get(a.localPath).sha256,a.sha256);else assets.set(a.localPath,a);
  }
 }
 assert.equal(assets.size,310);
 for(const a of assets.values()){const path=resolve(root,a.localPath.slice(1));assert.ok(lstatSync(path).isFile());assert.equal(realpathSync(path),path);const bytes=readFileSync(path);assert.equal(bytes.length,a.bytes);assert.equal(hash(bytes),a.sha256,'León original changed: '+a.localPath);}
 return [...assets.values()];
}
