import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { verifiedProjectPrice } from '../assets/js/project-finance.mjs';
import { resolveProjectIdentity } from '../assets/js/project-identity.mjs';
import { projectPublicSafeCatalogue } from '../lib/public-project-view.mjs';
import { projects as bookingProjects } from '../lib/project-context.mjs';

const json = p => JSON.parse(readFileSync(new URL('../'+p,import.meta.url)));
const data=json('data/proyectos.json');
const base=JSON.parse(execFileSync('git',['show','710a60262004ccbc524b7dfb8cc75866d9e01f08:data/proyectos.json'],{encoding:'utf8'}));
const expected={
 'edificio-verne':[['Estudio',1937]],
 'edificio-ecuador':[['1 dormitorio',2658.23],['2 dormitorios',3291.14]],
 'vicuna-mackenna-6896':[['Estudio',3259.49]],
 'playa-serena':[['1 dormitorio',4222],['2 dormitorios',5878],['3 dormitorios',8065]],
 'playa-penuelas':[['1 dormitorio',3544],['2 dormitorios',4361]],
 'irarrazaval':[['Estudio',3589.29]],
 'edificio-dual-390-lto':[['Local',18386.36],['1 dormitorio',7337.21],['2 dormitorios',10232.56]],
 'bordevivo':[['Local',3318.19]],
 'parque-quinta':[['Local',3194.45],['Estudio',3101.27],['1 dormitorio',3164.56]],
 'quintavista':[['Estudio',3417.72]],
 'vista-bulnes':[['Estudio',3148.10]],
 'vergara-domeyko':[['Local',7587.50]],
 'parque-panama':[['Local',2575.45]],
 'edificio-san-francisco-1204':[['1 dormitorio',3197.67]],
 'edificio-lira-622':[['Estudio',3372.09],['1 dormitorio',3313.95]],
 'edif-origen-atacama-3008':[['Estudio',2534.88],['Local',2697.78],['1 dormitorio',2534.88],['2 dormitorios',4360.47]],
 'edificio-plaza-nova':[['Estudio',2035.23],['Local',6910.23],['1 dormitorio',3275.14]],
 'carmen-marin':[['Estudio',2932.56],['1 dormitorio',3476.74],['2 dormitorios',4552.33]],
};
const nv=data.filter(p=>p.inmobiliaria==='Norte Verde');
test('Exactly the authorized 18; 114 other developers retain every data field',()=>{
 assert.equal(data.length,132);assert.equal(new Set(data.map(p=>p.slug)).size,132);
 assert.deepEqual(nv.map(p=>p.slug).sort(),Object.keys(expected).sort());
 assert.deepEqual(data.filter(p=>p.inmobiliaria!=='Norte Verde'),base.filter(p=>p.inmobiliaria!=='Norte Verde'));
 for(const name of ['proyectos','fichas-proyectos','registro-fichas'])
   assert.deepEqual(json('data/'+name+'.json').map(p=>p.slug).sort(),data.map(p=>p.slug).sort());
});
test('Typed prices retain all authorized decimals; the unverified Dual studio is withheld',()=>{
 for(const p of nv){
  assert.deepEqual(p.preciosPorTipologia.map(r=>[r.tipologia,r.precioDesdeUF]),expected[p.slug]);
  const min=Math.min(...expected[p.slug].map(r=>r[1]));assert.equal(p.precioDesdeUF,min);
  assert.equal(p.preciosPorTipologia.find(r=>r.tipologia===p.precioDesdeTipologia).precioDesdeUF,min);
  const price=verifiedProjectPrice(p,'2026-10-25');assert.equal(price.valueUf,min);assert.equal(price.sourceKind,'owner-supplied');
  assert.equal(price.typology,p.precioDesdeTipologia);assert.equal(verifiedProjectPrice(p,'2026-12-01'),null);
 }
 assert.equal(nv.find(p=>p.slug==='edificio-dual-390-lto').precioDesdeUF,7337.21);
});
test('Commercial amounts never acquire residential labels; mixed highlights are residential references',()=>{
 for(const p of nv){
  const hasLocal=p.tipologias.includes('Local');const hasHome=p.tipologias.some(t=>t!=='Local');
  assert.equal(p.tipoActivo,hasLocal?(hasHome?'Mixto':'Comercial'):'Residencial');
  if(p.tipoActivo==='Comercial'){assert.equal(p.precioDesdeTipologia,'Local');assert.equal(p.superficieDesdeM2,null);}
  if(p.tipoActivo==='Mixto')assert.notEqual(p.precioDesdeTipologia,'Local');
  assert.notEqual(p.entrega,p.estado);
 }
});
test('Retired pages and references are absent; originals remain recoverable',()=>{
 for(const slug of ['atelier-prat-oficinas','corrientes-oficinas']){
  assert.equal(existsSync(new URL('../'+slug+'.html',import.meta.url)),false);
  assert.ok(existsSync(new URL('../docs/norte-verde-18-20261026/'+slug+'.html',import.meta.url)));
  assert.equal(resolveProjectIdentity(data,slug),null);assert.equal(bookingProjects[slug],undefined);
  assert.equal(json('data/advisory-projects.json')[slug],undefined);
  for(const path of ['sitemap.xml','proyectos.html','index.html'])assert.ok(!readFileSync(new URL('../'+path,import.meta.url),'utf8').includes(slug));
 }
});
test('Commercial and booking identities agree; server projection accepts the 132-record catalogue',()=>{
 assert.equal(projectPublicSafeCatalogue(data).length,132);
 for(const p of nv){assert.equal(bookingProjects[p.slug].name,p.nombre);assert.equal(json('data/advisory-projects.json')[p.slug],p.nombre);assert.equal(resolveProjectIdentity(data,p.slug).nombre,p.nombre);}
});
test('Automatic deployment remains disabled, including main and this branch',()=>{
 const cfg=json('vercel.json');assert.equal(cfg.git.deploymentEnabled.main,false);
 assert.equal(cfg.git.deploymentEnabled['codex/norte-verde-18-20261025'],false);
});
test('Commercial filtering/sorting uses the local price of mixed projects, preserving residential prices',()=>{
 const html=readFileSync(new URL('../proyectos.html',import.meta.url),'utf8');
 const code=html.match(/\/\/ CATALOG_TYPED_PRICE_START([\s\S]*?)\/\/ CATALOG_TYPED_PRICE_END/)[1];
 const selectedOffer=vm.runInNewContext(code+'\nselectedOffer');
 const dual=nv.find(p=>p.slug==='edificio-dual-390-lto');
 assert.equal(selectedOffer(dual,'Comercial').value,18386.36);
 assert.equal(selectedOffer(dual,'Residencial').value,7337.21);
 assert.equal(selectedOffer(dual,'').value,7337.21);
 const commercialUnder4000=nv.filter(p=>p.tiposActivos.includes('Comercial')&&selectedOffer(p,'Comercial').value<=4000).map(p=>p.slug).sort();
 assert.deepEqual(commercialUnder4000,['bordevivo','edif-origen-atacama-3008','parque-panama','parque-quinta'].sort());
 for(const p of data.filter(p=>p.inmobiliaria!=='Norte Verde'))assert.equal(selectedOffer(p,'Comercial').value,p.precioDesdeUF);
});
