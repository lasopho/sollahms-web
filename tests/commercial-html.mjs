import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const catalogue = JSON.parse(readFileSync(resolve(ROOT, 'data/proyectos.json')));
const ficheFiles = new Set(catalogue.map(project => project.slug + '.html'));
assert.equal(ficheFiles.size, 144);
const transformed = new Map();
export const INGEVEC_ADDED_BASELINE = 'b64911588e2fdf52f32d5f772b53735936fbd423';
export const INGEVEC_ADDED_SLUGS = new Set(['coronel-godoy', 'diagonal-paraguay',
  'el-aromo', 'los-lilenes', 'matta-016', 'nueva-esmeralda', 'vicuna-mackenna-7589']);
export const PORTFOLIO_BASELINE = '8cdb9bf2af607a4f0822e5ea2c3ec4ba3f4c76b1';
export const INGEVEC_REMOVED_SLUGS = new Set(['brasil','vespucio-capital','edificio-serrano-capital',
  'edificio-carrera-capital','edificio-froilan-roa','hacienda-lo-errazuriz']);
export const INGEVEC_NEW_SLUGS = new Set(['los-alerces','valle-los-ingleses-iii']);
export const INGEVEC_ENRICHED_SLUGS = new Set(['abdon-cifuentes','don-ignacio','terrazzo','vima']);
export const INGEVEC_FINAL_SLUGS = new Set([...INGEVEC_ADDED_SLUGS,'centenario-1','tocornal','vivaceta',
  ...INGEVEC_ENRICHED_SLUGS,...INGEVEC_NEW_SLUGS]);
const portfolioOld = path => execFileSync('git',['show',`${PORTFOLIO_BASELINE}:${path}`],{cwd:ROOT});
export function readCommercialFile(file) {
  if (INGEVEC_REMOVED_SLUGS.has(file.replace(/\.html$/, ''))) {
    assert.equal(existsSync(resolve(ROOT,file)), false, file + ': retired public route must be absent');
    return Buffer.alloc(0);
  }
  return readFileSync(resolve(ROOT,file));
}
export function vimaImageCorrection(value, json = false) {
  const bad = '/assets/propiedades/catalogo/571b2a1740b3b5d4920157fa.webp';
  if (json) {
    const copy = structuredClone(value);
    copy.images = copy.images.filter(image => image.localPath !== bad);
    return copy;
  }
  return value.replace(/<figure>(?:(?!<\/figure>).)*571b2a1740b3b5d4920157fa\.webp(?:(?!<\/figure>).)*<\/figure>/gs,'');
}
export function assertPortfolioData(actual, baseline, file='data/proyectos.json') {
  const after = JSON.parse(actual), prior = JSON.parse(portfolioOld(file));
  assert.equal(prior.length,148,file+': fixed pre-consolidation inventory');
  assert.equal(after.length,144,file+': exact final inventory');
  assert.deepEqual(after.map(row=>row.slug), [...prior.filter(row=>!INGEVEC_REMOVED_SLUGS.has(row.slug)).map(row=>row.slug),...INGEVEC_NEW_SLUGS],
    file+': only six retirements and two appended identities are authorized');
  const bySlug = new Map(after.map(row=>[row.slug,row]));
  for(const row of prior.filter(row=>!INGEVEC_REMOVED_SLUGS.has(row.slug))) {
    const expected = file==='data/fichas-proyectos.json' && row.slug==='vima' ? vimaImageCorrection(row,true) : row;
    assert.deepEqual(bySlug.get(row.slug),expected,file+'/'+row.slug+': prior data must remain exact');
  }
  for(const [slug,name,commune,address,hash] of [
    ['los-alerces','Los Alerces','Ñuñoa','Los Alerces 3254','c93eaab1b4c5a398c7f49e98614a40781fb01f9428aba6c9fea7d52e2a7882bd'],
    ['valle-los-ingleses-iii','Valle Los Ingleses III','Valparaíso','Camino Los Ingleses 715','509ad7aeaafec2b9e09354505a117aea77efb354a433a0d4eae27b08e6378f08']]) {
    const row=bySlug.get(slug); assert.ok(row,slug);
    if(file==='data/proyectos.json') {
      assert.equal(row.nombre,name);assert.equal(row.inmobiliaria,'Ingevec');assert.equal(row.comuna,commune);
      assert.equal(row.direccion,address);assert.equal(row.detalleUrl,'/'+slug+'.html');
      for(const key of ['precioDesdeUF','estado','entrega']) assert.equal(row[key],null,slug+': no invented commercial data');
      assert.ok(!row.verificacion.camposVerificados.includes('precioDesdeUF'));
    } else if(file==='data/fichas-proyectos.json') {
      assert.equal(row.sourceDocument.sha256,hash);assert.equal(row.sourceDocument.sourceChannel,'Yapo/IRIS');
      assert.deepEqual(row.virtualTours,[]);assert.equal(row.updates.precioDesdeUF,null);
    } else {assert.equal(row.nombre,name);assert.equal(row.mapa,true);assert.equal(row.matterport,false);assert.equal(row.fichaDesarrollada,true);}
  }
  if(file==='data/proyectos.json') {
    assert.equal(after.filter(row=>row.inmobiliaria!=='Ingevec').length,128);
    assert.deepEqual(after.filter(row=>row.inmobiliaria==='Ingevec').map(row=>row.slug).sort(),[...INGEVEC_FINAL_SLUGS].sort());
    assert.ok(bySlug.has('froilan-roa-5731-torre-norte') || after.some(row=>['Euro','Euroinmobiliaria'].includes(row.inmobiliaria) && /froilan-roa-5731/.test(row.slug)));
  }
  return after;
}
export function assertPortfolioIndex(file,actual) {
  if(file==='lib/project-context.mjs') {
    const objects=actual.toString().match(/Object\.freeze\(([\s\S]*)\);/)[1];
    assert.deepEqual(JSON.parse(objects),Object.fromEntries(catalogue.map(p=>[p.slug,{name:p.nombre,url:p.detalleUrl}])));
  } else if(file==='sitemap.xml') {
    const urls=text=>[...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
    const old=urls(portfolioOld(file).toString());
    const expected=old.filter(url=>!INGEVEC_REMOVED_SLUGS.has(url.split('/').at(-1).replace(/\.html$/,'')));
    expected.splice(expected.indexOf('https://sollahms.cl/comparador-hipotecario.html'),0,...[...INGEVEC_NEW_SLUGS].map(s=>'https://sollahms.cl/'+s+'.html'));
    assert.deepEqual(urls(actual.toString()),expected);assert.equal(new Set(expected).size,150);
  } else if(file==='docs/registro-fichas-proyectos.md') {
    const old=portfolioOld(file).toString();
    const originalRows=old.split('\n').filter(line=>line.startsWith('| ['));
    const currentRows=actual.toString().split('\n').filter(line=>line.startsWith('| ['));
    for(const line of originalRows) {
      if([...INGEVEC_REMOVED_SLUGS].some(slug=>line.includes('../'+slug+'.html)'))) assert.ok(!currentRows.includes(line));
      else assert.ok(currentRows.includes(line),'Existing inventory row changed: '+line);
    }
    assert.equal(currentRows.length,originalRows.length-6+2);
    assert.ok(actual.toString().includes('Catálogo real: 144 proyectos'));
    assert.ok(actual.toString().includes('128 de otras inmobiliarias y 16 Ingevec; 17 entradas comerciales'));
  } else throw new Error('Unknown portfolio index '+file);
}
export function assertDefinitiveFicheFallback(html,slug) {
  assert.ok(INGEVEC_ENRICHED_SLUGS.has(slug));
  const expected=portfolioOld(slug+'.html').toString();
  const fallback=addedPublicFallback(html);
  assert.equal(fallback,slug==='vima'?vimaImageCorrection(expected):expected,slug+': content outside brochure enrichment changed');
  return fallback;
}
const additionBaseline = new Map();

export function addedPublicFallback(html) {
  return html.replace(/<!--INGEVEC_PREVIEW_START-->[\s\S]*?<!--INGEVEC_PREVIEW_END-->/g, '')
    .replace(/<!--INGEVEC_PUBLIC_START-->([\s\S]*?)<!--INGEVEC_PUBLIC_END-->/g, '$1');
}
export function assertAddedFicheFallback(html, slug) {
  assert.ok(INGEVEC_ADDED_SLUGS.has(slug), 'Only the seven explicitly authorized brochure fichas are eligible');
  if (!additionBaseline.has(slug)) additionBaseline.set(slug,
    execFileSync('git', ['show', `${INGEVEC_ADDED_BASELINE}:${slug}.html`], { cwd: ROOT, encoding: 'utf8' }));
  assert.ok(html.includes('<!--INGEVEC_PREVIEW_START-->') && html.includes('<!--INGEVEC_PUBLIC_START-->'),
    slug + ': reviewed media must retain their public fallback guards');
  const fallback = addedPublicFallback(html);
  assert.equal(fallback, additionBaseline.get(slug), slug + ': content outside the new brochure blocks changed');
  return fallback;
}
export function assertIngevecManifestAddition(actual, baseline) {
  const before = JSON.parse(baseline), after = JSON.parse(actual);
  assert.equal(before.projects.length, 3);
  assert.equal(after.projects.length, 16);
  const definitive = JSON.parse(portfolioOld('data/brochures-ingevec.json'));
  assert.deepEqual(after.projects.slice(0,10),definitive.projects,'The ten previously reviewed records remain exact');
  assert.deepEqual(after.projects.slice(0, 3), before.projects, 'The previous three Ingevec records must remain exact');
  assert.deepEqual(after.projects.slice(3).map(record => record.slug).sort(), [...INGEVEC_ADDED_SLUGS,...INGEVEC_ENRICHED_SLUGS,...INGEVEC_NEW_SLUGS].sort(),
    'Only seven authorized existing projects may enter the brochure manifest');
  const restored = structuredClone(after);
  restored.projects = before.projects;
  delete restored.batchAddition;
  delete restored.portfolioConsolidation;
  assert.deepEqual(restored, before, 'All original rights, date, baseline and top-level evidence remain exact');
}

// The single approved addition to the privacy policy is fixed here, rather
// than accepting arbitrary new sections or changes to existing paragraphs.
const PRIVACY_NOTICE = `<section class="py-8 border-t border-slate-200" aria-labelledby="informacion-inmobiliaria-material-grafico">
<h2 id="informacion-inmobiliaria-material-grafico" class="font-headline text-2xl md:text-3xl font-bold tracking-tight text-primary mb-5">10. Información inmobiliaria y material gráfico</h2>
<div class="space-y-5 text-slate-700 leading-relaxed">
<p>Las fichas de proyectos pueden incluir material promocional facilitado por inmobiliarias y canales de comercialización autorizados, para presentar las características de cada proyecto.</p>
<p>Las fotografías, renders y planos pueden ser referenciales. El mobiliario, la decoración, las vistas y los elementos ilustrados no necesariamente forman parte de la unidad ofrecida. Las superficies, distribuciones, terminaciones, equipamiento y áreas comunes pueden variar según la unidad y la etapa del proyecto; confirma sus características al consultar.</p>
<p>Los precios indicados como «Desde UF» son valores de referencia y están sujetos a disponibilidad y a las condiciones vigentes de la inmobiliaria. Antes de tomar una decisión, confirma el precio de la unidad, su disponibilidad, las condiciones del pie y la entrega con nuestro equipo. Cuando no existe un precio vigente confirmado, la ficha indica «Consultar precio».</p>
<p>La información de brochures de otras fechas no constituye por sí sola una oferta comercial vigente. Los avisos específicos junto a imágenes, planos, precios y simulaciones complementan este apartado y deben considerarse al evaluar cada alternativa.</p>
</div>
</section>
`;

export function commercialPage(bytes, slug) {
  assert.ok(ficheFiles.has(slug + '.html'), slug + ': presentation is limited to the 144 catalogue fichas');
  const html = bytes.toString();
  const key = slug + ':' + createHash('sha256').update(html).digest('hex');
  if (!transformed.has(key)) {
    const script = 'import sys\nsys.path.insert(0,sys.argv[1])\nfrom fiche_presentation import commercialize_fiche\nsys.stdout.write(commercialize_fiche(sys.stdin.read(),sys.argv[2]))';
    transformed.set(key, execFileSync('python3', ['-c', script, resolve(ROOT, 'scripts'), slug], {
      cwd: ROOT, input: html, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
    }));
  }
  return transformed.get(key);
}

export function assertCatalogueConsultPrices(actual, baseline) {
  const previous = baseline.toString();
  assert.equal(previous.split("'Precio pendiente de verificación'").length, 2);
  assert.equal(actual.toString(), previous.replace("'Precio pendiente de verificación'", "(['los-alerces', 'valle-los-ingleses-iii'].includes(project.slug) ? 'Consultar precio' : 'Precio pendiente de verificación')"), 'Only the two newly authorized cards change their unknown-price label');
}

export function assertCommercialBytes(file, actual, baseline) {
  if(file === 'proyectos.html') {assertCatalogueConsultPrices(actual,baseline);return;}
  if (INGEVEC_REMOVED_SLUGS.has(file.replace(/\.html$/, ''))) {
    assert.equal(actual.length,0);assert.equal(existsSync(resolve(ROOT,file)),false);return;
  }
  if(['data/proyectos.json','data/fichas-proyectos.json','data/registro-fichas.json'].includes(file)) {assertPortfolioData(actual,baseline,file);return;}
  if(['lib/project-context.mjs','sitemap.xml','docs/registro-fichas-proyectos.md'].includes(file)) {assertPortfolioIndex(file,actual);return;}
  if (INGEVEC_NEW_SLUGS.has(file.replace(/\.html$/, ''))) {
    const html=actual.toString();assert.ok(html.includes('Consultar precio'));assert.ok(html.includes('id="modelos"'));
    assert.doesNotMatch(html,/id="fuentes(?:-verificadas)?"/);return;
  }
  if (ficheFiles.has(file)) {
    const slug = file.slice(0, -5);
    if(INGEVEC_ENRICHED_SLUGS.has(slug)) {assertDefinitiveFicheFallback(actual.toString(),slug);return;}
    const html = INGEVEC_ADDED_SLUGS.has(slug) ? assertAddedFicheFallback(actual.toString(), slug) : actual.toString();
    assert.equal(html, commercialPage(baseline, slug),
      file + ': changes exceed the approved commercial presentation');
  } else if (file === 'privacidad.html') {
    const html = actual.toString();
    assert.equal(html.split(PRIVACY_NOTICE).length, 2, 'The exact privacy notice must occur once');
    assert.equal(baseline.toString().includes(PRIVACY_NOTICE) ? html : html.replace(PRIVACY_NOTICE, ''), baseline.toString(),
      'privacidad.html: all content outside the single approved notice remains byte identical');
  } else {
    assert.ok(actual.equals(baseline), file + ': protected baseline bytes changed');
  }
}
