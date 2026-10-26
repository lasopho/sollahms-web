import {cp,mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=dirname(dirname(fileURLToPath(import.meta.url)));
const [baselinePath,destinationPath]=process.argv.slice(2);
if(!baselinePath||!destinationPath)throw Error('Supply preserved baseline deployment directory and a new destination');
const baseline=resolve(baselinePath),destination=resolve(destinationPath);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
if(hash(await readFile(join(baseline,'.vercel/output/static/index.html')))!=='d4e49c5e5a9fc2ea72851779c93bb29b140e0e0b3829aba84ba231548a7c5e2b')throw Error('Baseline is not the verified SEO deployment');
if(await stat(destination).then(()=>true,()=>false))throw Error('Destination must be new');
await cp(baseline,destination,{recursive:true});
for(const path of ['index.html','contacto.html','agenda-asesoria.html','privacidad.html','sitemap.xml','assets/css/advisory.css','assets/js/advisory.mjs','assets/js/commercial-fields.mjs','assets/js/rut.mjs','assets/js/rut-field.mjs']){
 await mkdir(dirname(join(destination,'.vercel/output/static',path)),{recursive:true});await cp(join(root,path),join(destination,'.vercel/output/static',path));
}
await cp(join(root,'vercel.json'),join(destination,'vercel.json'));
const func=join(destination,'.vercel/output/functions/api/advisory.func');
for(const path of ['api/advisory.mjs','lib/form-operation-server.mjs','data/advisory-projects.json','assets/js/commercial-fields.mjs','assets/js/rut.mjs']){await mkdir(dirname(join(func,path)),{recursive:true});await cp(join(root,path),join(func,path));}
const config=JSON.parse(await readFile(join(baseline,'.vercel/output/functions/api/contact.func/.vc-config.json'),'utf8'));config.handler='api/advisory.mjs';
await writeFile(join(func,'.vc-config.json'),JSON.stringify(config,null,2)+'\n');
console.log('Prepared additive advisory release; existing functions copied byte for byte');
