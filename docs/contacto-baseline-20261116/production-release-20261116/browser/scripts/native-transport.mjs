import {runManaged,stopManagedProcesses} from './managed-process.mjs';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const HEADERS = new Set(['content-type','content-security-policy','content-security-policy-report-only','x-content-type-options','x-frame-options','referrer-policy','permissions-policy','strict-transport-security','cross-origin-opener-policy','cross-origin-resource-policy','cache-control','content-language']);
export async function nativeTransport({origin,root,deployment}) {
 const scope='lsandoval2-8260s-projects',cwd=join(root,'cli-unlinked');
 if(!/^dpl_[A-Za-z0-9]+$/.test(deployment||'')||['dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5','dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN','dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh'].includes(deployment))throw new Error('Exact new Contacto Production deployment required');
 const target=new URL(origin);if(target.protocol!=='https:'||target.origin!==origin||!target.hostname.endsWith('.vercel.app'))throw new Error('Exact HTTPS Production deployment origin required');
 await mkdir(cwd,{recursive:true,mode:0o700});
 for(const rel of ['.vercel/project.json','.now/project.json','.vercel/repo.json']){try{await readFile(join(cwd,rel));throw new Error('CLI working directory must be unlinked');}catch(e){if(e.code!=='ENOENT')throw e;}}
 const cli='/Users/luissandoval/.npm-global/bin/vercel';
 const cache=join(root,'cache',deployment,'native-cache');await mkdir(cache,{recursive:true,mode:0o700});
 const promises=new Map(),records=[],semaphore=[];
 let active=0,closing=false;
 async function acquire(){while(active>=2&&!closing)await new Promise(resolve=>semaphore.push(resolve));if(closing)throw new Error('QA transport closed');active++;}
 function release(){active--;semaphore.shift()?.();}
 const env={...process.env};
 for(const k of ['VERCEL_PROJECT_ID','VERCEL_ORG_ID','NOW_PROJECT_ID','NOW_ORG_ID','VERCEL_AUTOMATION_BYPASS_SECRET','VERCEL_USE_EXPERIMENTAL_SERVICES','NODE_OPTIONS','NODE_DEBUG','DEBUG','VERCEL_DEBUG','VERCEL_LOG_LEVEL','VC_DEBUG'])delete env[k];
 env.PATH='/Users/luissandoval/.local/node/node-v24.22.3-darwin-arm64/bin:/Users/luissandoval/.npm-global/bin:/usr/bin:/bin';
 function run(args){return runManaged(cli,args,{cwd,env,timeoutMs:60000});}
 async function fetchNative(url,method){
  const path=url.pathname+url.search,key=createHash('sha256').update(deployment+' '+origin+' '+method+' '+path).digest('hex'),bodyPath=join(cache,key+'.body'),metaPath=join(cache,key+'.json');
  try{const meta=JSON.parse(await readFile(metaPath,'utf8')),body=await readFile(bodyPath);if(meta.deployment===deployment&&meta.origin===origin&&meta.bytes===body.length&&createHash('sha256').update(body).digest('hex')===meta.sha256)return {...meta,body,cached:true};}catch{}
  await acquire();
  const tmp=await mkdtemp(join(cache,'request-'));
  try{
   const out=join(tmp,'body'),head=join(tmp,'headers');
   const result=await run(['curl',path,'--deployment',deployment,'--scope',scope,'--','--request',method,'--silent','--show-error','--max-time','60','--output',out,'--dump-header',head]);
   const raw=await readFile(head,'utf8').catch(()=>''),body=await readFile(out).catch(()=>Buffer.alloc(0));
   const blocks=raw.split(/\r?\n\r?\n/).filter(x=>/^HTTP\//.test(x)),block=blocks.at(-1)||'';
   const lines=block.split(/\r?\n/),status=Number(lines[0]?.match(/^HTTP\/\S+\s+(\d+)/)?.[1]||0),headers={};
   for(const line of lines.slice(1)){const at=line.indexOf(':');if(at<0)continue;const k=line.slice(0,at).toLowerCase(),v=line.slice(at+1).trim();if(HEADERS.has(k))headers[k]=v;if(k==='location'){const next=new URL(v,url);if(next.origin===origin)headers.location=next.href;else headers.location='AUTH_REDIRECT_REJECTED';}}
   if(result.code!==0||result.timedOut||result.signal||!status)throw new Error('Native CLI transport failed or was interrupted; code='+result.code);
   if(headers.location==='AUTH_REDIRECT_REJECTED')throw new Error('Native CLI did not obtain same-origin application response');
   const meta={deployment,origin,path: url.pathname,method,status,headers,bytes:body.length,sha256:createHash('sha256').update(body).digest('hex')};
   await writeFile(bodyPath,body,{mode:0o600});await writeFile(metaPath,JSON.stringify(meta)+'\n',{mode:0o600});records.push({path:url.pathname,method,status,bytes:body.length});
   if(records.length%20===0)await writeFile(join(root,'native-transport-summary-'+deployment+'.json'),JSON.stringify({deployment,requests:records,mutationsForwarded:0,credentialsLogged:false},null,2)+'\n');
   return {...meta,body,cached:false};
  }finally{await rm(tmp,{recursive:true,force:true});release();}
 }
 async function access(url,method){const key=method+' '+url.href;if(!promises.has(key)){const promise=fetchNative(url,method);promises.set(key,promise);promise.then(()=>promises.delete(key),()=>promises.delete(key));}return promises.get(key);}
 return {async readOnlyGet(path){const url=new URL(path,origin);if(url.origin!==origin||url.pathname.startsWith('/api/'))throw new Error('Only same-origin static GET is allowed');return access(url,'GET');},async handle(route){const request=route.request(),url=new URL(request.url());if(url.origin!==origin)throw new Error('Transport origin mismatch');const r=await access(url,request.method());await route.fulfill({status:r.status,headers:r.headers,body:r.body});},async close(){closing=true;semaphore.splice(0).forEach(resolve=>resolve());await stopManagedProcesses();await writeFile(join(root,'native-transport-summary-'+deployment+'.json'),JSON.stringify({deployment,requests:records,mutationsForwarded:0,credentialsLogged:false},null,2)+'\n');}};
}

