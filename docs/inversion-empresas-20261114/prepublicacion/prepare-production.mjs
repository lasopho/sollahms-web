import { readFileSync, mkdirSync, copyFileSync, readdirSync, lstatSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
assert.equal(process.env.VERCEL_ENV,'production','Production artifact required; domain assignment must remain disabled');
const manifest=JSON.parse(readFileSync('production-manifest.json','utf8'));
const base=JSON.parse(readFileSync('production-base-manifest.json','utf8'));
assert.equal(base.length,1649); assert.equal(manifest.length,1653);
for(const x of base) assert.deepEqual(manifest.find(y=>y.file===x.file),x,'Production file changed: '+x.file);
const additions=manifest.filter(x=>!base.some(y=>y.file===x.file)).map(x=>x.file).sort();
assert.deepEqual(additions,['release/static/assets/css/inversion-empresas.css','release/static/assets/js/inversion-empresas-engine.mjs','release/static/assets/js/inversion-empresas.mjs','release/static/inversion-inmobiliaria-empresas.html']);
const html=readFileSync('release/static/inversion-inmobiliaria-empresas.html','utf8');
assert.ok(!/noindex/i.test(html)); assert.ok(html.includes('<fieldset disabled>')); assert.ok(!/<form[\s>]/i.test(html));
assert.ok(html.includes('href="https://sollahms.cl/inversion-inmobiliaria-empresas.html"'));
const files=[];
function scan(dir){for(const n of readdirSync(dir)){const p=join(dir,n),s=lstatSync(p);assert.ok(!s.isSymbolicLink());if(s.isDirectory())scan(p);else files.push(p);}}
scan('release'); assert.deepEqual(files.sort(),manifest.map(x=>x.file).sort());
for(const x of manifest){const b=readFileSync(x.file);assert.equal(createHash('sha1').update(b).digest('hex'),x.sha,x.file);assert.equal(b.length,x.size,x.file);const to='.vercel/output/'+x.file.slice(8);mkdirSync(dirname(to),{recursive:true});copyFileSync(x.file,to);}
console.log(JSON.stringify({productionArtifact:true,verifiedFiles:manifest.length,existingFilesPreserved:base.length,newFiles:additions,formDisabled:true}));
