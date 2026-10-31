import {readFileSync,readdirSync,mkdirSync,copyFileSync,lstatSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const expected=JSON.parse(readFileSync('orientation-output-hashes.json','utf8'));const paths=[];
function scan(dir){for(const n of readdirSync(dir)){const p=join(dir,n),s=lstatSync(p);assert.equal(s.isSymbolicLink(),false);if(s.isDirectory())scan(p);else{assert.ok(s.isFile());paths.push(p.slice('release/'.length));}}}scan('release');
assert.deepEqual(paths.sort(),Object.keys(expected).sort());
for(const path of paths){const bytes=readFileSync(join('release',path));assert.equal(createHash('sha256').update(bytes).digest('hex'),expected[path],path);const target=join('.vercel/output',path);mkdirSync(dirname(target),{recursive:true});copyFileSync(join('release',path),target);}
const root='.vercel/output',read=p=>JSON.parse(readFileSync(join(root,p),'utf8'));
const rows=read('static/data/proyectos.json');assert.equal(rows.length,131);assert.ok(!rows.some(p=>p.slug==='patio-brasil'));assert.ok(rows.some(p=>p.slug==='novo-catedral'));
for(const name of ['contact','orientation-contact'])assert.deepEqual(read('functions/api/'+name+'.func/data/proyectos.json'),rows);
const config=read('config.json');assert.equal(config.version,3);assert.ok(Array.isArray(config.routes));
const headers={'X-Robots-Tag':'noindex, follow','Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN','Content-Security-Policy':"base-uri 'self'; object-src 'none'; frame-ancestors 'self'"};
config.routes.unshift({src:'^/(?:patio-brasil(?:\\.html)?/?|410\\.html)$',dest:'/410.html',status:410,headers});
config.routes.unshift({src:'^/centro-orientacion$',headers:{Location:'/centro-orientacion.html'},status:308});
writeFileSync(join(root,'config.json'),JSON.stringify(config,null,2)+'\n');
console.log(JSON.stringify({verifiedReleaseFiles:paths.length,activeProjects:rows.length,priorRetirementPreserved:true,privateContactBaselinesIncluded:false}));
const written=JSON.parse(readFileSync(join(root,'config.json'),'utf8'));assert.deepEqual(written,config);const retired=written.routes.find(r=>r.status===410);for(const p of ['/patio-brasil','/patio-brasil.html','/patio-brasil/','/patio-brasil.html/','/410.html'])assert.ok(new RegExp(retired.src).test(p),p);assert.equal(new RegExp(retired.src).test('/patio-brasil-other.html'),false);
