import {readFileSync,readdirSync,mkdirSync,copyFileSync,statSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const expected=JSON.parse(readFileSync('release-hashes.json','utf8'));
const files=[];function scan(p){for(const n of readdirSync(p)){const f=join(p,n);if(statSync(f).isDirectory())scan(f);else files.push(f.slice('release/'.length));}}scan('release');
if(files.length!==Object.keys(expected).length)throw Error('Unexpected artifact file count');
for(const p of files){const b=readFileSync(join('release',p));if(createHash('sha256').update(b).digest('hex')!==expected[p])throw Error('Artifact integrity mismatch: '+p);}
for(const p of files){const target=join('.vercel/output',p);mkdirSync(dirname(target),{recursive:true});copyFileSync(join('release',p),target);}
console.log(JSON.stringify({verifiedArtifactFiles:files.length,sha256: createHash('sha256').update(JSON.stringify(expected)).digest('hex')}));
