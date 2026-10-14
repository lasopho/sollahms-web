// Shared packaging fixtures import the exact publication-only policy while
// preserving their independent non-Ecasa, financial and rights assertions.
import assert from 'node:assert/strict';
import { readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEcasaImageQuality } from '../scripts/ecasa-image-quality.mjs';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const json=file=>JSON.parse(readFileSync(resolve(ROOT,file)));
const quality=validateEcasaImageQuality(json('data/brochures-ecasa.json'),json('data/fichas-proyectos.json'),
  json('data/proyectos.json'),json('data/ecasa-image-quality.json'),json('data/fuentes-imagenes.json'));
// Historical asset-list guards allow only these four explicitly reviewed new
// private paths. Their original/selected hashes and pixels have a separate
// release test; every historical asset is still checked against its Git blob.
export const reviewedOfficialSourceFiles = Object.freeze([
  ...json('data/fichas-proyectos.json').find(project => project.slug === 'edificio-nordico').images.map(image => image.localPath.slice(1)),
  'assets/propiedades/ecasa-official-review/ferroparque/cocina-living-8f4a01f128d58e46.webp',
  'assets/propiedades/ecasa-official-review/alto-san-joaquin/living-terraza-1c280f71ad82ecac.webp',
  'assets/propiedades/ecasa-official-review/originals/ferroparque/59cef73347f67699.webp',
  'assets/propiedades/ecasa-official-review/originals/alto-san-joaquin/1c280f71ad82ecac.webp',
]);
assert.deepEqual(json('data/ecasa-official-originals.json').projects.flatMap(project => project.images.flatMap(image =>
  [image.localPath.slice(1), image.original.localPath.slice(1)])).toSorted(), reviewedOfficialSourceFiles.filter(path => path.startsWith('assets/propiedades/ecasa-official-review/')).sort());

export function copyEcasaImageQualityInputs(destination) {
  for(const file of ['scripts/ecasa-image-quality.mjs','data/ecasa-image-quality.json',
    'data/fichas-proyectos.json','data/fuentes-imagenes.json',
    ...[...quality.images.values()].filter(image=>image.kind==='official').map(image=>image.localPath.slice(1))]) {
    const target=resolve(destination,file);mkdirSync(dirname(target),{recursive:true});copyFileSync(resolve(ROOT,file),target);
  }
}

export function assertEcasaQualityCoverFields(before,after,{preview=true}={}) {
  const strip=value=> {
    const copy=structuredClone(value);
    for(const row of [copy,...copy.etapasComerciales??[]])for(const field of ['imagenPrincipal','imagenAlt','imagenEtapa'])delete row[field];
    return copy;
  };
  assert.deepEqual(strip(after),strip(before),before.slug+': only image display fields may change');
  const project=quality.projects.get(before.slug),image=quality.images.get(project.covers[preview?'preview':'public'].catalogue);
  assert.equal(after.imagenPrincipal,image?.localPath??null);
  assert.equal(after.imagenAlt,image?.alt);
  assert.equal(after.imagenEtapa,project.multiple?image?.displayStage??undefined:undefined);
  for(const stage of after.etapasComerciales??[]) {
    const original=before.etapasComerciales.find(row=>row.slug===stage.slug);
    const decision=quality.images.get(original.imagenPrincipal);
    assert.equal(stage.imagenPrincipal,decision?.decision==='exclude'?null:original.imagenPrincipal);
  }
}

export function assertEcasaQualityPublicCatalogue(before,after) {
  assert.deepEqual(after.map(project=>project.slug),before.map(project=>project.slug));
  for(const original of before) {
    const published=after.find(project=>project.slug===original.slug);
    if(original.inmobiliaria==='Ecasa')assertEcasaQualityCoverFields(original,published,{preview:false});
    else assert.deepEqual(published,original,original.slug+': public fallback outside Ecasa remains exact');
  }
}
