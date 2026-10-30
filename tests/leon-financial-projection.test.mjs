import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectPublicSafeCatalogue} from '../lib/public-project-view.mjs';
import {verifiedProjectPrice} from '../assets/js/project-finance.mjs';
const projects=JSON.parse(readFileSync(new URL('../data/proyectos.json',import.meta.url)));
const safe=projectPublicSafeCatalogue(projects);let checks=0;
for(const p of safe.filter(x=>x.inmobiliaria==='León')){
 const input=projects.find(x=>x.slug===p.slug);
 assert.equal(verifiedProjectPrice(p,'2026-10-30').valueUf,input.precioDesdeUF);checks++;
 assert.equal(verifiedProjectPrice(p,'2026-12-01'),null);checks++;
 for(const field of ['imagenPrincipal','imagenAlt','superficieDesdeM2']){assert.equal(p[field],null);checks++;}
 for(const field of ['paymentTerms','research','models','gallery','commercialOffers']){assert.equal(p[field],undefined);checks++;}
 const poisoned=structuredClone(projects);poisoned.find(x=>x.slug===p.slug).precioDesdeUF++;
 assert.throws(()=>projectPublicSafeCatalogue(poisoned));checks++;
}
for(const p of safe.filter(x=>x.inmobiliaria==='Sento')){assert.equal(p.precioDesdeUF,null);assert.equal(p.imagenPrincipal,null);checks+=2;}
console.log(JSON.stringify({checks,ownerFinancialPrices:5,protectedMedia:'not projected',sento:'unchanged',stalePrices:'rejected'}));
