import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, realpathSync, copyFileSync, linkSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { assertEcasaMainIntegration, assertIntegratedSharedSuccessor, integrationFingerprint } from '../scripts/ecasa-main-integration.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const policy=JSON.parse(readFileSync(resolve(ROOT,'data/ecasa-main-integration.json')));
const original=readFileSync(resolve(ROOT,'vercel.json'));
const approved=JSON.parse(original);
const sha=value=>createHash('sha256').update(value).digest('hex');
let fixture;

before(()=>{
  fixture=realpathSync(mkdtempSync(join(tmpdir(),'sollahms-runtime-config-fixture-')));
  const files=new Set(['data/ecasa-main-integration.json',...Object.keys(policy.datasets),
    ...[...policy.mainFiches,...policy.ecasaFiches,...policy.mainResources,...policy.reviewResources,...policy.sourceInputs].map(item=>item.file)]);
  for(const file of files) {
    const source=resolve(ROOT,file),destination=resolve(fixture,file);
    mkdirSync(dirname(destination),{recursive:true});
    // Only this fixture's configuration is mutated. Immutable reviewed media
    // can be linked; every guard still reads and hashes their actual bytes.
    if(file==='vercel.json')copyFileSync(source,destination);
    else {try{linkSync(source,destination);}catch{copyFileSync(source,destination);}}
  }
});
after(()=>{if(fixture)rmSync(fixture,{recursive:true,force:true});});

function context(vercel,environment,run) {
  const previous={VERCEL:process.env.VERCEL,VERCEL_ENV:process.env.VERCEL_ENV};
  for(const [name,value] of Object.entries({VERCEL:vercel,VERCEL_ENV:environment}))
    if(value===undefined)delete process.env[name];else process.env[name]=value;
  try{return run();}finally{
    for(const [name,value] of Object.entries(previous))if(value===undefined)delete process.env[name];else process.env[name]=value;
    writeFileSync(resolve(fixture,'vercel.json'),original);
  }
}
function write(value){writeFileSync(resolve(fixture,'vercel.json'),value);}
function shared(integration){return assertIntegratedSharedSuccessor('vercel.json',policy.sharedMainSha256['vercel.json'],{root:fixture,integration});}

test('Vercel Preview accepts only the complete approved configuration object while preserving its raw source binding',()=>{
  const binding=policy.runtimeVercelConfiguration;
  assert.equal(binding.rawBytes,3286);assert.equal(binding.rawSha256,sha(original));
  assert.equal(binding.canonicalSha256,'def3819505acf82a71aefcb831561a8f9e5ac28cbb5db58ab08d423c1e03c730');
  assert.equal(integrationFingerprint(approved),binding.canonicalSha256);
  assert.equal(approved.redirects.length,16);
  assert.ok(Object.values(approved.git.deploymentEnabled).every(value=>value===false));
  context(undefined,undefined,()=>assert.equal(assertEcasaMainIntegration(fixture).projects,133));
  const compact=JSON.stringify(approved);
  // This padded input exercises the observed cloud byte count; it does not
  // claim to reproduce the still-unobserved server configuration body.
  const cloudLengthFixture=' '.repeat(2439-Buffer.byteLength(compact))+compact;
  assert.equal(Buffer.byteLength(cloudLengthFixture),2439);
  const reordered=Object.fromEntries(Object.entries(approved).reverse());
  for(const representation of [original,compact,JSON.stringify(approved,null,4),JSON.stringify(reordered),cloudLengthFixture]) {
    context('1','preview',()=>{
      write(representation);
      const integration=assertEcasaMainIntegration(fixture);
      assert.equal(integration.projects,133);assert.equal(integration.ecasaProjects,15);assert.equal(integration.otherDeveloperProjects,118);
      assert.equal(shared(integration),true);
      assert.equal(integration.policy.sourceInputs.find(item=>item.file==='vercel.json').sha256,sha(original));
    });
  }
});

test('runtime configuration equivalence rejects changed redirects gates headers build settings and unknown fields without logging values',()=>{
  const marker='FIXTURE_VALUE_MUST_NOT_APPEAR';
  const mutations=[
    value=>{value.redirects[0].destination='/other.html';},
    value=>{value.redirects[0].permanent=false;},
    value=>{value.redirects.push({source:'/other',destination:'/other.html',permanent:true});},
    value=>{value.redirects.pop();},
    value=>{value.git.deploymentEnabled.main=true;},
    value=>{value.git.deploymentEnabled['codex/ecasa-publicacion-independiente']=true;},
    value=>{delete value.git;},
    value=>{value.headers[0].headers[0].value='';},
    value=>{value.buildCommand='node other.mjs';},
    value=>{value.outputDirectory='other';},
    value=>{value.framework='other';},
    value=>{value.unapproved=marker;},
    value=>{value.version=2;value.builds=[];value.routes=[];},
  ];
  context('1','preview',()=>{
    const integration=assertEcasaMainIntegration(fixture);
    for(const mutate of mutations) {
      const changed=structuredClone(approved);mutate(changed);write(JSON.stringify(changed));
      for(const verify of [()=>assertEcasaMainIntegration(fixture),()=>shared(integration)]) {
        assert.throws(verify,error=>{
          assert.match(error.message,/Integration configuration semantics changed/);
          assert.ok(!error.message.includes(marker),'Configuration values leaked into diagnostics');
          return true;
        });
      }
    }
    write('{\"unapproved\":\"'+marker);
    for(const verify of [()=>assertEcasaMainIntegration(fixture),()=>shared(integration)])
      assert.throws(verify,error=>{assert.match(error.message,/Malformed runtime Vercel configuration/);assert.ok(!error.message.includes(marker));return true;});
  });
});

test('configuration representation fallback is unavailable outside explicit Vercel Preview and cannot authorize Production',()=>{
  for(const [vercel,environment] of [[undefined,undefined],[undefined,'preview'],['0','preview'],['1',undefined],['1','development'],['1','production']]) {
    context(vercel,environment,()=>{
      const integration=assertEcasaMainIntegration(fixture);
      write(JSON.stringify(approved));
      for(const verify of [()=>assertEcasaMainIntegration(fixture),()=>shared(integration)])
        assert.throws(verify,/Integration resource (?:size )?changed/);
    });
  }
});
