import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const catalogue = JSON.parse(readFileSync(resolve(ROOT, 'data/proyectos.json')));
const ficheFiles = new Set(catalogue.map(project => project.slug + '.html'));
assert.equal(ficheFiles.size, 148);
const transformed = new Map();

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
  assert.ok(ficheFiles.has(slug + '.html'), slug + ': presentation is limited to the 148 catalogue fichas');
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

export function assertCommercialBytes(file, actual, baseline) {
  if (ficheFiles.has(file)) {
    assert.equal(actual.toString(), commercialPage(baseline, file.slice(0, -5)),
      file + ': changes exceed the approved commercial presentation');
  } else if (file === 'privacidad.html') {
    const html = actual.toString();
    assert.equal(html.split(PRIVACY_NOTICE).length, 2, 'The exact privacy notice must occur once');
    assert.equal(html.replace(PRIVACY_NOTICE, ''), baseline.toString(),
      'privacidad.html: all content outside the single approved notice remains byte identical');
  } else {
    assert.ok(actual.equals(baseline), file + ': protected baseline bytes changed');
  }
}
