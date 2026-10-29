// Apply the owner's public retirement to an otherwise frozen Vercel artifact.
// No network, environment changes, dependency installation or function rebuild.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

export const retiredSlug = 'patio-brasil';
export function assertActiveCatalogue(rows) {
  assert.equal(rows.some(row => row.slug === retiredSlug), false, 'Retired Patio Brasil cannot return to the catalogue');
}

export function applyOutputRetirement(output) {
  const read = path => JSON.parse(readFileSync(join(output,path),'utf8'));
  const write = (path,value) => writeFileSync(join(output,path),JSON.stringify(value,null,2)+'\n');
  assert.equal(existsSync(join(output,'static/patio-brasil.html')),false);
  assert.equal(existsSync(join(output,'static/410.html')),true);
  const publicRows=read('static/data/proyectos.json');
  assertActiveCatalogue(publicRows);
  assert.equal(publicRows.length,131);
  assert.ok(publicRows.some(row=>row.slug==='novo-catedral'&&row.inmobiliaria==='Sudamericana'));

  // The server's original catalogue is frozen independently of the public JSON.
  // Remove only this record; do not substitute or refresh any other server facts.
  const serverPath='functions/api/contact.func/data/proyectos.json';
  const original=read(serverPath);
  const removed=original.filter(row=>row.slug===retiredSlug);
  assert.equal(removed.length,1);
  assert.equal(removed[0].nombre,'Patio Brasil');
  assert.equal(removed[0].inmobiliaria,'Sudamericana');
  assert.equal(removed[0].direccion,'Avenida Brasil 697');
  const retained=original.filter(row=>row.slug!==retiredSlug);
  assert.equal(retained.length,131);
  write(serverPath,retained);
  assert.deepEqual(read(serverPath),retained);

  const config=read('config.json');
  const priorRoutes=structuredClone(config.routes);
  assert.ok(Array.isArray(priorRoutes));
  const headers={
    'X-Robots-Tag':'noindex, follow',
    'Cache-Control':'public, max-age=0, must-revalidate',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    'X-Frame-Options':'SAMEORIGIN',
    'Content-Security-Policy':"base-uri 'self'; object-src 'none'; frame-ancestors 'self'"
  };
  config.routes.unshift({src:'^/(?:patio-brasil(?:\\.html)?/?|410\\.html)$',dest:'/410.html',status:410,headers});
  assert.deepEqual(config.routes.slice(1),priorRoutes);
  write('config.json',config);
  return Object.fromEntries(['config.json',serverPath].map(path=>[path,createHash('sha256').update(readFileSync(join(output,path))).digest('hex')]));
}
