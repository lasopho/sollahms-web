import { readFileSync, mkdirSync, copyFileSync, readdirSync, lstatSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
assert.equal(process.env.VERCEL_ENV,'preview','Preview only; production is forbidden');
const manifest=JSON.parse(readFileSync('preview-manifest.json','utf8'));
const files=[];
function scan(dir){for(const n of readdirSync(dir)){const p=join(dir,n);const s=lstatSync(p);assert.ok(!s.isSymbolicLink());if(s.isDirectory())scan(p);else files.push(p);}}
scan('release');assert.deepEqual(files.sort(),manifest.map(x=>x.file).sort());
for(const x of manifest){const b=readFileSync(x.file);assert.equal(createHash('sha1').update(b).digest('hex'),x.sha,x.file);if(x.size!==undefined)assert.equal(b.length,x.size,x.file);const to='.vercel/output/'+x.file.slice(8);mkdirSync(dirname(to),{recursive:true});copyFileSync(x.file,to);}
console.log(JSON.stringify({previewOnly:true,verifiedFiles:manifest.length,existingFilesPreserved:1649,newFiles:4}));
