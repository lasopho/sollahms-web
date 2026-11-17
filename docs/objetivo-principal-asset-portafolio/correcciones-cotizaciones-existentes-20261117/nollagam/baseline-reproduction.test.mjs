import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {advancedFilterAndSort,defaults} from '/private/tmp/sollahms-referencias-documentales-131-20261117/assets/js/catalog-filter-engine.mjs';
import {projectOffer} from '/private/tmp/sollahms-referencias-documentales-131-20261117/assets/js/catalog-model.mjs';

const root='/private/tmp/sollahms-referencias-documentales-131-20261117/';
const projects=JSON.parse(readFileSync(root+'data/proyectos.json','utf8'));
const facets=JSON.parse(readFileSync(root+'data/catalog-facets.json','utf8'));
const owner=JSON.parse(readFileSync(root+'data/nollagam-commercial.json','utf8'));

test('Costanera A 3D must retain its explicit owner UF5070 quote within UF5000–5100',()=>{
  assert.equal(owner.projects['costanera-coquimbo-a'].prices['3'],5070);
  const original=projects.find(project=>project.slug==='costanera-coquimbo-a');
  const project={...original,_facets:facets.projects[original.slug]};
  const state={...defaults(),bedrooms:'3',minPriceInput:'5000',maxPriceInput:'5100'};
  const rows=advancedFilterAndSort([project],state);
  assert.equal(rows.length,1,'known owner category is incorrectly excluded by the original project minimum');
  assert.equal(projectOffer(rows[0],state).value,5070);
});
