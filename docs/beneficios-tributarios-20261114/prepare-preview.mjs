import {readFileSync,mkdirSync,copyFileSync,readdirSync,lstatSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
assert.equal(process.env.VERCEL_ENV,'preview','This artifact is preview only');
const base=JSON.parse(readFileSync('base-manifest.json'));
const manifest=JSON.parse(readFileSync('preview-manifest.json'));
assert.equal(base.length,1653);
assert.equal(manifest.length,1657);
for(const x of base)assert.deepEqual(manifest.find(y=>y.file===x.file),x,'Existing runtime file changed: '+x.file);
const additions=manifest.filter(x=>!base.some(y=>y.file===x.file)).map(x=>x.file).sort();
assert.deepEqual(additions,['release/static/assets/css/beneficios-tributarios.css','release/static/assets/js/beneficios-tributarios-engine.mjs','release/static/assets/js/beneficios-tributarios.mjs','release/static/beneficios-tributarios-inmobiliarios.html']);
const html=readFileSync('release/static/beneficios-tributarios-inmobiliarios.html','utf8');
assert.ok(html.includes('noindex, nofollow'));assert.ok(!/<form[\s>]/i.test(html));
const files=[];function scan(dir){for(const n of readdirSync(dir)){const p=join(dir,n),s=lstatSync(p);assert.ok(!s.isSymbolicLink());if(s.isDirectory())scan(p);else files.push(p);}}scan('release');assert.deepEqual(files.sort(),manifest.map(x=>x.file).sort());
for(const x of manifest){const b=readFileSync(x.file);assert.equal(createHash('sha1').update(b).digest('hex'),x.sha,x.file);if(x.size!==undefined)assert.equal(b.length,x.size,x.file);const to='.vercel/output/'+x.file.slice(8);mkdirSync(dirname(to),{recursive:true});copyFileSync(x.file,to);}
console.log(JSON.stringify({previewOnly:true,files:manifest.length,preserved:base.length,additions,formsAdded:0}));
