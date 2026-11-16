import {runManaged,managedPids,stopManagedProcesses} from './managed-process.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const path='/private/tmp/sollahms-recorridos-qa/watchdog-fixture-pids.json';
const fixture="const{spawn}=require('node:child_process');const{writeFileSync}=require('node:fs');const child=spawn(process.execPath,['-e',\"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)\"],{stdio:'ignore'});writeFileSync("+JSON.stringify(path)+",JSON.stringify({parent:process.pid,child:child.pid}));setInterval(()=>{},1000)";
const result=await runManaged(process.execPath,['-e',fixture],{cwd:'/private/tmp/sollahms-recorridos-qa',env:process.env,timeoutMs:700,killGraceMs:200});
const pids=JSON.parse(await readFile(path,'utf8'));
let active=[];
try{active=execFileSync('ps',['-p',Object.values(pids).join(','),'-o','pid=,stat='],{encoding:'utf8'}).trim().split('\n').filter(Boolean).filter(x=>!x.trim().split(/\s+/)[1]?.startsWith('Z'));}catch(error){if(error.status!==1)throw error;}
const evidence={passed:result.timedOut&&active.length===0&&managedPids().length===0,timeoutMs:700,killGraceMs:200,result,pids,activeChildrenAfterWatchdog:active,managedAfterWatchdog:managedPids(),realNetworkCalls:0,realCommercialWrites:0};
await writeFile('/private/tmp/sollahms-recorridos-qa/watchdog-test.json',JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence));
if(!evidence.passed)process.exitCode=1;

