import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { naturalCaption, normalizeFicheCopy } from '../scripts/public-fiche-copy.mjs';

test('natural captions retain useful places and remove extraction phrases', () => {
  for (const caption of ['Comedor', 'Cocina equipada', 'Piscina', 'Dormitorio principal']) {
    assert.equal(naturalCaption(caption + ' del departamento según brochure'), caption);
  }
  assert.equal(naturalCaption('Edificio y playa Chinchorro según brochure'), 'Edificio y playa Chinchorro');
  assert.equal(naturalCaption('Imagen obtenida del folleto: Piscina'), 'Piscina');
});

test('renders retain an explicit referential notice and approximate area cautions survive', () => {
  assert.equal(naturalCaption('Piscina — render ilustrativo del brochure'), 'Piscina · Render referencial');
  const source = '<body><figcaption>Piscina — imagen ilustrativa del brochure</figcaption><p>Total según brochure</p><p>Planos y superficies referenciales, sujetos a confirmación para la unidad que consultes.</p></body>';
  const result = normalizeFicheCopy(source);
  assert.match(result, /Piscina · Imagen referencial/);
  assert.match(result, /Superficie total referencial/);
  assert.match(result, /Planos y superficies referenciales, sujetos a confirmación para la unidad que consultes\./);
});

test('presentation cleaning preserves URLs, identifiers, scripts, styles and commercial values', () => {
  const source = '<head><meta property="og:image:alt" content="Living según brochure"><link href="/assets/css/aj-brochure-preview.css"></head><body><figure id="modelo-a"><a href="/assets/plan-brochure.webp"><img src="/assets/plan-brochure.webp" alt="Living según brochure" width="1000"></a><figcaption>Living según brochure</figcaption></figure><p>Desde UF 2.390 · Etapa 3</p><script>{"caption":"según brochure","precio":2390}</script><style>.brochure{color:green}</style></body>';
  const result = normalizeFicheCopy(source);
  assert.ok(!result.includes('content="Living según brochure"'));
  assert.ok(!result.includes('alt="Living según brochure"'));
  for (const exact of ['id="modelo-a"', '/assets/plan-brochure.webp', 'width="1000"', 'Desde UF 2.390 · Etapa 3', '<script>{"caption":"según brochure","precio":2390}</script>', '<style>.brochure{color:green}</style>']) assert.ok(result.includes(exact), exact);
});

test('the privacy material-graphics section stays byte exact even if cleaning is requested', () => {
  const source = '<body><section id="informacion-inmobiliaria-material-grafico"><h2>10. Información inmobiliaria</h2><p>Los brochures no acreditan oferta vigente.</p></section></body>';
  assert.equal(normalizeFicheCopy(source), source);
});

test('caption normalization is idempotent without changing neighbouring text or whitespace', () => {
  const source = '<body><figcaption>Living y comedor del departamento según brochure</figcaption><p> Precio y disponibilidad sujetos a condiciones comerciales. </p></body>';
  const result = normalizeFicheCopy(source);
  assert.equal(normalizeFicheCopy(result), result);
  assert.ok(result.includes('<p> Precio y disponibilidad sujetos a condiciones comerciales. </p>'));
});

test('the CLI projection decodes UTF-8 across input chunks without corrupting typography', () => {
  const source = '<body>' + '<figcaption>Piscina según brochure · Vista de Peñuelas ↗</figcaption>'.repeat(3000) + '</body>';
  const result = execFileSync(process.execPath, ['scripts/public-fiche-copy.mjs', '--stdin'], { input: Buffer.from(source), encoding: 'utf8', maxBuffer: 2_000_000 });
  assert.equal(result, normalizeFicheCopy(source));
  assert.ok(!result.includes('\uFFFD'));
});
