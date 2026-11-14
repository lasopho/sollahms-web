import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitCapital } from '../assets/js/inversion-empresas-engine.mjs';
for(const [p,f,e,d] of [[5000,70,1500,3500],[4180,80,836,3344],[1234.5,0,1234.5,0],[5000,80,1000,4000],[100000000,50,50000000,50000000]]) {
 test(`capital ${p} / ${f}%`,()=>assert.deepEqual(splitCapital(p,f),{equity:e,debt:d}));
}
test('decimal precision and conservation',()=>{for(const p of [0.01,5800.55,20000.15])for(const f of [0.01,33.33,79.99,80]){const r=splitCapital(p,f);assert.ok(Math.abs(r.equity+r.debt-p)<1e-8);assert.ok(r.equity>=0&&r.debt>=0);}});
for(const [p,f] of [[0,70],[-1,70],[NaN,70],[Infinity,70],[100000001,70],['5000',70],[5000,-1],[5000,80.01],[5000,81],[5000,100],[5000,NaN],[5000,Infinity],[5000,'70']])test(`invalid ${p}/${f}`,()=>assert.throws(()=>splitCapital(p,f),RangeError));
