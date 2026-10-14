// Shared packaging fixtures import the exact publication-only policy while
// preserving their independent non-Ecasa, financial and rights assertions.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
  'assets/propiedades/ecasa-official-review/ferroparque/cocina-living-8f4a01f128d58e46.webp',
  'assets/propiedades/ecasa-official-review/alto-san-joaquin/living-terraza-1c280f71ad82ecac.webp',
  'assets/propiedades/ecasa-official-review/originals/ferroparque/59cef73347f67699.webp',
  'assets/propiedades/ecasa-official-review/originals/alto-san-joaquin/1c280f71ad82ecac.webp',
]);
assert.deepEqual(json('data/ecasa-official-originals.json').projects.flatMap(project => project.images.flatMap(image =>
  [image.localPath.slice(1), image.original.localPath.slice(1)])).toSorted(), [...reviewedOfficialSourceFiles].sort());

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

// The separately supplied owner photographs have no asserted Ecasa/Yapo URL.
// Only these ten exact reviewed bytes are exempt from the historical inventory;
// arbitrary files in the same folder remain subject to every existing guard.
const reviewedOwnerHashes=new Map([
  ['assets/propiedades/ecasa-owner-review/aires-la-florida-2/fachada-14c384e376fa64c8.webp','14c384e376fa64c83314f689c71cd8791f9507360a2263346e83c458fcdb453c'],
  ['assets/propiedades/ecasa-owner-review/conecta-huechuraba/fachada-fa36b64328871ca9.webp','fa36b64328871ca95d94413c7e4676e22b9328383d15fe9ab7a8fb8a20af5c7a'],
  ['assets/propiedades/ecasa-owner-review/edificio-bezanilla/fachada-050bbe96d9dc5a48.webp','050bbe96d9dc5a482006556d4acf93e40232aa013cbaf34e524f82f34f30a796'],
  ['assets/propiedades/ecasa-owner-review/espacio-victoria/fachada-73d87ae7002cadae.webp','73d87ae7002cadae4c4d5591389481856cdc4f70bedadfb60c2e872028c47fb9'],
  ['assets/propiedades/ecasa-owner-review/originals/aires-la-florida-2/input-ba263aaea712429f.png','ba263aaea712429fef732e25cdf97b240ca7ab1e41f0a91bac250ef47cc4bc3c'],
  ['assets/propiedades/ecasa-owner-review/originals/conecta-huechuraba/input-c2e26279cb5323a4.png','c2e26279cb5323a4bf886a875f64abc09deea240405edf3e67c139e7bf4e366b'],
  ['assets/propiedades/ecasa-owner-review/originals/edificio-bezanilla/web-header-bezanilla-0f1ce1ca935ff5f8.png','0f1ce1ca935ff5f8778a30df92837e7eb4279d11396a741b9a9e7f2e5196553a'],
  ['assets/propiedades/ecasa-owner-review/originals/espacio-victoria/input-0eaac94ba278fba9.png','0eaac94ba278fba9da18c67b86f7159a978f72387be5bddd8a67d90e19bfdfc3'],
  ['assets/propiedades/ecasa-owner-review/originals/urban-la-florida/input-866417b8e9775be2.png','866417b8e9775be2c442bdfef4fd38440025557c7708a05c06a3c832437cf51b'],
  ['assets/propiedades/ecasa-owner-review/urban-la-florida/fachada-4f2f1c6501d8983e.webp','4f2f1c6501d8983e40aa11bb5a390f68299676b444a52fae18873ca52e8175b9'],
]);
export function withoutReviewedOwnerAssets(files) {
  const present=files.filter(file=>reviewedOwnerHashes.has(file));
  const candidate=readFileSync(resolve(ROOT,'data/ecasa-publication-candidate.json'),'utf8');
  const selected=JSON.parse(candidate).selectedResources.filter(row=>row.kind==='owner_cover').map(row=>row.localPath.slice(1));
  const publicOnly=present.length===5&&present.toSorted().join('\n')===selected.toSorted().join('\n');
  assert.ok(present.length===0||present.length===10||publicOnly,'The private source must be complete, or the exact five committed public selections must be present');
  for(const file of present)assert.equal(createHash('sha256').update(readFileSync(resolve(ROOT,file))).digest('hex'),
    reviewedOwnerHashes.get(file),'Owner source pixels or provenance bytes changed: '+file);
  return files.filter(file=>!reviewedOwnerHashes.has(file));
}
