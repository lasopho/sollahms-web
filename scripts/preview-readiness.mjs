import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

// Read-only preflight: never copies private media, packages, deploys or connects
// a provider. Missing materials remain blockers; there is no bypass flag.
const root=fileURLToPath(new URL('../',import.meta.url));
const read=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const selection=read('tests/git-ci-selection.json');
const privateCases=selection.selectedSuites.flatMap(s=>s.releaseRequired.map(c=>({file:s.file,...c})));
const references=new Set();
function visit(value){
 if(typeof value==='string'&&value.startsWith('/assets/')&&!value.includes('..'))references.add(value);
 else if(Array.isArray(value))value.forEach(visit);
 else if(value&&typeof value==='object')Object.values(value).forEach(visit);
}
for(const file of ['data/brochures-ingevec.json','data/brochures-ecasa.json','data/brochures-leben.json','data/brochures-leon.json'])if(existsSync(resolve(root,file)))visit(read(file));
const branch=execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim();
const report={scope:'read-only deployment preflight; not release approval',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),branch,releaseCases:privateCases.length,privateCases,referencedAssets:references.size,missingAssets:[...references].filter(path=>!existsSync(resolve(root,'.'+path))).sort(),vercelConfigurationUnchanged:execFileSync('git',['show','fc160c6:vercel.json'],{cwd:root}).equals(readFileSync(resolve(root,'vercel.json'))),productionAuthorized:false,hostedPreviewVerified:false,requiredAccess:['authorized private development hosting and PostgreSQL','independent authentication and secret manager','protected source package and existing packaging branch/release approval','HTTPS receiver, project map and supervised worker']};
report.packageAssetsReady=report.missingAssets.length===0;
if(process.argv[2]==='--output'){
 if(!process.argv[3])throw new Error('Explicit report path required');
 writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({releaseCases:report.releaseCases,referencedAssets:report.referencedAssets,missingAssets:report.missingAssets.length,hostedPreviewVerified:false}));
}else console.log(JSON.stringify(report,null,2));
