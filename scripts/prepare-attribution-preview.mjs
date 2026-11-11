// Preview-only assembly of an authenticated, frozen runtime; never rebuild the legacy site.
import {readFileSync,readdirSync,lstatSync,mkdirSync,copyFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
assert.equal(process.env.VERCEL_ENV,'preview','This candidate can only be built as a preview');
const expected=JSON.parse(readFileSync('runtime-hashes.json','utf8'));
const paths=[];
function scan(dir){for(const n of readdirSync(dir)){const p=join(dir,n),s=lstatSync(p);assert.ok(!s.isSymbolicLink());if(s.isDirectory())scan(p);else{assert.ok(s.isFile());paths.push(p.slice(8));}}}
scan('release/');assert.deepEqual(paths.sort(),Object.keys(expected).sort());
for(const name of paths){assert.ok(name==='config.json'||/^(?:static|functions)\//.test(name));assert.ok(!name.split('/').some(p=>p==='docs'||p==='tests'||p==='.git'||p.startsWith('.env')||p.endsWith('.local')));const bytes=readFileSync(join('release',name));assert.equal(createHash('sha256').update(bytes).digest('hex'),expected[name],name);}
const config=JSON.parse(readFileSync('release/config.json','utf8'));
assert.equal(config.version,3);assert.equal(createHash('sha1').update(readFileSync('release/config.json')).digest('hex'),'04e9bcfbdaedafe692af92f3409844151fd82ab3');
assert.ok(config.routes.some(r=>r.status===410));assert.ok(config.routes.some(r=>r.status===308&&r.headers?.Location==='/centro-orientacion.html'));
const catalogue=readFileSync('release/static/data/proyectos.json','utf8');assert.equal(JSON.parse(catalogue).length,131);
for(const name of ['contact','orientation-contact'])assert.equal(readFileSync(`release/functions/api/${name}.func/data/proyectos.json`,'utf8'),catalogue);
for(const name of paths){const target=join('.vercel/output',name);mkdirSync(dirname(target),{recursive:true});copyFileSync(join('release',name),target);}
console.log(JSON.stringify({previewOnly:true,verifiedRuntimeFiles:paths.length,configUnchanged:true,providersReadOnlyInPreview:true}));
