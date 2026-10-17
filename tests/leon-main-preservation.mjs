// Only approved León successors are projected for historical audits.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { projectP1CommercialFile, projectP1CommercialRows } from './p1-commercial-scope.mjs';
import { restoreP1IdempotencyFile } from './p1-idempotency-preservation.mjs';
import { restoreP2FinanceFile } from './p2-finance-preservation.mjs';
import { restoreP2EmbedFile } from './p2-embed-scope.mjs';
import { readMainBaseline, projectLeonFile, restoreLeonRows as publicationRestoreLeonRows, restoreLeonContexts, LEON_RETIRED_SLUGS } from '../scripts/leon-main-publication.mjs';
export { projectLeonFile, restoreLeonContexts };
// Test-only historical projections. The real publication validator remains
// byte-identical and rejects the pending P1 release until separately approved.
export function restoreLeonRows(rows, file='data/proyectos.json', options) {
 return publicationRestoreLeonRows(projectP1CommercialRows(rows,file),file,options);
}
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const baseline=readMainBaseline();
const original=file=>execFileSync('git',['show',baseline.mainCommit+':'+file],{cwd:ROOT,maxBuffer:16*1024*1024});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function readPreLeonFile(file) {
 if(LEON_RETIRED_SLUGS.some(slug=>file===slug+'.html')) {
  assert.equal(existsSync(resolve(ROOT,file)),false,'Retired León public route returned');
  const before=original(file);assert.deepEqual(readFileSync(resolve(ROOT,'docs/archive/leon',file)),before);return before;
 }
 return projectLeonFile(file,projectP1CommercialFile(file,restoreP1IdempotencyFile(file,restoreP2FinanceFile(file,restoreP2EmbedFile(file,readFileSync(resolve(ROOT,file)))))));
}
const reviewBytes=readFileSync(resolve(ROOT,'data/brochures-leon.json'));
assert.equal(sha(reviewBytes),'962ed948e818a6c27046657bea5835d54e1e885f88c14775b5567b1c6c3ec28d');
const review=JSON.parse(reviewBytes),media=new Map();
for(const project of review.projects)for(const a of [project.document,...project.images.flatMap(a=>[a,...(a.original?.localPath?[a.original]:[]),...Object.values(a.variants??{}).flat()]),...project.models.flatMap(m=>[m.plan,...Object.values(m.plan.variants??{}).flat()])])media.set(a.localPath.slice(1),a.sha256);
export function isReviewedLeonAsset(file) {
 const expected=media.get(file)??(file==='assets/css/leon.css'?baseline.approvedFiles[file]:null);
 if(!expected)return false;
 assert.equal(sha(readFileSync(resolve(ROOT,file))),expected,'León asset changed');return true;
}
