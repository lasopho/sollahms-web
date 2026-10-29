import {readFileSync,readdirSync,mkdirSync,copyFileSync,statSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {applyOutputRetirement} from './apply-retirements.mjs';
const expected=JSON.parse(readFileSync('release-hashes.json','utf8'));
const files=[];function scan(p){for(const n of readdirSync(p)){const f=join(p,n);if(statSync(f).isDirectory())scan(f);else files.push(f.slice('release/'.length));}}scan('release');
if(files.length!==Object.keys(expected).length)throw Error('Unexpected artifact file count');
for(const p of files){const b=readFileSync(join('release',p));if(createHash('sha256').update(b).digest('hex')!==expected[p])throw Error('Artifact integrity mismatch: '+p);}
for(const p of files){const target=join('.vercel/output',p);mkdirSync(dirname(target),{recursive:true});copyFileSync(join('release',p),target);}
const transformed=applyOutputRetirement('.vercel/output');
const nollagamSlugs=new Set(["edificio-liverpool", "barrio-zenteno", "alto-goycolea", "edificio-santa-maria", "eleuterio-ramirez", "costanera-coquimbo-a", "costanera-coquimbo-b"]);
const cataloguePath='.vercel/output/functions/api/contact.func/data/proyectos.json';
const server=JSON.parse(readFileSync(cataloguePath,'utf8'));
const client=JSON.parse(readFileSync('.vercel/output/static/data/proyectos.json','utf8'));
if(server.length!==131||client.length!==131)throw Error('Catalogue cardinality drift');
const replacement=new Map(client.filter(p=>nollagamSlugs.has(p.slug)).map(p=>[p.slug,p]));
if(replacement.size!==7)throw Error('Missing Nollagam identity');
const updated=server.map(p=>replacement.get(p.slug)||p);
if(JSON.stringify(server.filter(p=>!nollagamSlugs.has(p.slug)))!==JSON.stringify(updated.filter(p=>!nollagamSlugs.has(p.slug))))throw Error('Unrelated server catalogue change');
writeFileSync(cataloguePath,JSON.stringify(updated,null,2)+'\n');
console.log(JSON.stringify({updatedServerCatalogue:replacement.size,untouchedServerProjects:124}));
const actual=Object.fromEntries(Object.keys(expected).map(path=>[path,createHash('sha256').update(readFileSync(join('.vercel/output',path))).digest('hex')]));
console.log(JSON.stringify({verifiedArtifactFiles:files.length,transformed,sha256:createHash('sha256').update(JSON.stringify(actual)).digest('hex')}));
