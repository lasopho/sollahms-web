// Project the exact approved León change for older, independently scoped audits.
// Both new payloads and all other developers remain checked before restoring history.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readMainBaseline, restoreLeonRows, LEON_RETIRED_SLUGS } from '../scripts/leon-main-publication.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const baseline=readMainBaseline();
const original=file=>execFileSync('git',['show',baseline.mainCommit+':'+file],{cwd:ROOT});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function readPreLeonFile(file) {
 if(LEON_RETIRED_SLUGS.some(slug=>file===slug+'.html')) {
  assert.equal(existsSync(resolve(ROOT,file)),false,'Retired León public route returned');
  const before=original(file);assert.deepEqual(readFileSync(resolve(ROOT,'docs/archive/leon',file)),before);return before;
 }
 const bytes=readFileSync(resolve(ROOT,file));
 if(Object.hasOwn(baseline.originalRows,file)) {
  const before=original(file);assert.deepEqual(restoreLeonRows(JSON.parse(bytes),file),JSON.parse(before),'Changes exceed the reviewed León catalogue scope');return before;
 }
 if(baseline.approvedFiles[file] && file!=='assets/css/leon.css') {
  assert.equal(sha(bytes),baseline.approvedFiles[file],'Changes exceed the reviewed León file scope');return original(file);
 }
 return bytes;
}

const review=JSON.parse(readFileSync(resolve(ROOT,'data/brochures-leon.json')));
const media=new Map();
for(const project of review.projects)for(const a of [project.document,...project.images.flatMap(a=>[a,...(a.original?.localPath?[a.original]:[]),...Object.values(a.variants??{}).flat()]),...project.models.flatMap(m=>[m.plan,...Object.values(m.plan.variants??{}).flat()])])media.set(a.localPath.slice(1),a.sha256);
export function isReviewedLeonAsset(file) {
 const expected=media.get(file)??(file==='assets/css/leon.css'?baseline.approvedFiles[file]:null);
 if(!expected)return false;
 assert.equal(sha(readFileSync(resolve(ROOT,file))),expected,'León asset changed');return true;
}
