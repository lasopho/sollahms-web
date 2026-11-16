import {spawn} from 'node:child_process';
const active = new Map();
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
function signalGroup(pid,signal){try{process.kill(-pid,signal);}catch(error){if(error.code!=='ESRCH')throw error;}}
export async function runManaged(command,args,{cwd,env,timeoutMs=60000,killGraceMs=800,onStart}={}){
 const child=spawn(command,args,{cwd,env,detached:true,stdio:['ignore','ignore','pipe']});
 let timedOut=false,stderrBytes=0,termination=null;
 const entry={pid:child.pid,async terminate(reason='stop'){
  if(termination)return termination;
  termination=(async()=>{signalGroup(child.pid,'SIGTERM');await pause(killGraceMs);signalGroup(child.pid,'SIGKILL');})();
  return termination;
 }};
 if(child.pid){active.set(child.pid,entry);onStart?.(child.pid);}
 child.stderr.on('data',chunk=>{stderrBytes+=chunk.length;});
 const timer=setTimeout(()=>{timedOut=true;void entry.terminate('watchdog');},timeoutMs);
 try{
  const exit=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',(code,signal)=>resolve({code,signal}));});
  if(termination)await termination;
  return {...exit,timedOut,stderrBytes,pid:child.pid};
 }finally{clearTimeout(timer);active.delete(child.pid);}
}
export async function stopManagedProcesses(){
 await Promise.all([...active.values()].map(entry=>entry.terminate('runner-stop')));
}
export function managedPids(){return [...active.keys()];}
