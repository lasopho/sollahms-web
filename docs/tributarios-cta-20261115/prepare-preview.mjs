import {readFileSync,readdirSync,lstatSync,mkdirSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';import {dirname,join} from 'node:path';import assert from 'node:assert/strict';
assert.equal(process.env.VERCEL_ENV,'preview');
const base=JSON.parse(readFileSync('production-manifest.json')),m=JSON.parse(readFileSync('candidate-manifest.json'));assert.equal(base.length,1659);assert.equal(m.length,1659);
assert.deepEqual(m.filter((x,i)=>JSON.stringify(x)!==JSON.stringify(base[i])).map(x=>x.file),['release/static/beneficios-tributarios-inmobiliarios.html']);
const files=[];function scan(p){for(const n of readdirSync(p)){const f=join(p,n);assert.ok(!lstatSync(f).isSymbolicLink());if(lstatSync(f).isDirectory())scan(f);else files.push(f);}}scan('release');assert.deepEqual(files.sort(),m.map(x=>x.file).sort());
for(const x of m){const b=readFileSync(x.file);assert.equal(createHash('sha1').update(b).digest('hex'),x.sha);if(x.size!==undefined)assert.equal(b.length,x.size);const o='.vercel/output/'+x.file.slice(8);mkdirSync(dirname(o),{recursive:true});copyFileSync(x.file,o);}
console.log(JSON.stringify({previewOnly:true,preserved:1658,changed:['beneficios-tributarios-inmobiliarios.html'],total:m.length}));