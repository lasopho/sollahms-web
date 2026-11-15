import {readFileSync,readdirSync,lstatSync,mkdirSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import assert from 'node:assert/strict';
assert.equal(process.env.VERCEL_ENV,'production');
const base=JSON.parse(readFileSync('production-manifest.json')), manifest=JSON.parse(readFileSync('candidate-manifest.json'));
assert.equal(base.length,1653);assert.equal(manifest.length,1657);
for(const x of base)assert.deepEqual(manifest.find(y=>y.file===x.file),x);
const add=manifest.filter(x=>!base.some(y=>y.file===x.file)).map(x=>x.file).sort();
assert.deepEqual(add,['release/static/assets/css/beneficios-tributarios.css','release/static/assets/js/beneficios-tributarios-engine.mjs','release/static/assets/js/beneficios-tributarios.mjs','release/static/beneficios-tributarios-inmobiliarios.html']);
const files=[];function scan(p){for(const n of readdirSync(p)){const f=join(p,n);assert.ok(!lstatSync(f).isSymbolicLink());if(lstatSync(f).isDirectory())scan(f);else files.push(f);}}scan('release');assert.deepEqual(files.sort(),manifest.map(x=>x.file).sort());
for(const x of manifest){const b=readFileSync(x.file);assert.equal(createHash('sha1').update(b).digest('hex'),x.sha);if(x.size!==undefined)assert.equal(b.length,x.size);const out='.vercel/output/'+x.file.slice(8);mkdirSync(dirname(out),{recursive:true});copyFileSync(x.file,out);}
const html=readFileSync('release/static/beneficios-tributarios-inmobiliarios.html','utf8');assert.ok(html.includes('index, follow') && !html.includes('noindex'));assert.ok(!/iva2026|dfl2027|mayores2027/.test(html));
console.log(JSON.stringify({productionStage1:true,preserved:base.length,added:add,total:manifest.length}));
