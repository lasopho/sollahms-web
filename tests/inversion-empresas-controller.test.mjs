import {test} from 'node:test';
import assert from 'node:assert/strict';
const nodes=new Map();
function field(value){return {value,validity:{valid:true},get valueAsNumber(){return this.value===''?NaN:Number(this.value);},attrs:{},addEventListener(type,fn){this.listener=fn;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];}};}
nodes.set('empresa-precio',field('5000'));nodes.set('empresa-porcentaje',field('70'));
for(const id of ['capital-error','capital-propio','capital-deuda'])nodes.set(id,{textContent:'',hidden:true});
globalThis.document={getElementById:id=>nodes.get(id)};
await import('../assets/js/inversion-empresas.mjs');
const price=nodes.get('empresa-precio'),percent=nodes.get('empresa-porcentaje'),error=nodes.get('capital-error');
test('controller initial split',()=>{assert.equal(nodes.get('capital-propio').textContent,'1.500 UF');assert.equal(nodes.get('capital-deuda').textContent,'3.500 UF');assert.equal(error.hidden,true);});
test('blank percent clears stale result, zero is valid',()=>{percent.value='';percent.listener();assert.equal(error.hidden,false);assert.equal(percent.attrs['aria-invalid'],'true');assert.equal(nodes.get('capital-propio').textContent,'—');percent.value='0';percent.listener();assert.equal(error.hidden,true);assert.equal(nodes.get('capital-propio').textContent,'5.000 UF');});
test('invalid field clears both results and recovers',()=>{price.value='-1';price.validity.valid=false;price.listener();assert.equal(error.hidden,false);assert.equal(nodes.get('capital-deuda').textContent,'—');price.value='5800';price.validity.valid=true;percent.value='80';price.listener();assert.equal(nodes.get('capital-propio').textContent,'1.160 UF');assert.equal(error.hidden,true);assert.equal(price.attrs['aria-invalid'],undefined);});

test('values over 80 are rejected even without native validity checks',()=>{percent.value='80.01';percent.listener();assert.equal(error.hidden,false);assert.match(error.textContent,/80/);assert.equal(nodes.get('capital-propio').textContent,'—');percent.value='80';percent.listener();assert.equal(error.hidden,true);assert.equal(nodes.get('capital-propio').textContent,'1.160 UF');});
