// Shared server/build projection. No file-system, Git, environment or network access.
// These preservation inputs establish fact provenance, not brochure publication rights.
import { createHash } from 'node:crypto';
import sento from '../data/sento-main-baseline.json' with { type: 'json' };
import leon from '../data/leon-main-baseline.json' with { type: 'json' };

const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']'
  : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
export const PUBLIC_SAFE_BASELINE_PINS = Object.freeze({
  Sento: Object.freeze({ path: 'data/sento-main-baseline.json', sha256: 'b97c7de6fded5cc25ed726192e9a0de1ef5c6a68e016b5afe63bb9a332557326', canonicalSha256: '7212f202c35d806d5e5d1cf1d487bad8462d121b08d5ebcf652c2bb0f194c5b3', commit: '61884b03bf2c843e4859cace9883033aec3690db' }),
  'León': Object.freeze({ path: 'data/leon-main-baseline.json', sha256: '2a5a315c3a63073a01e38f4fb68c0dbb83d5481b7c90aea6f19616e328edf64c', canonicalSha256: '73fb79a9fbe36f160272a9f61d2648a4acbb9df705b26c66497ad2522d72e88a', commit: 'f72bd9ec097e63faabeb7e1d5fa9d8388a54ae83' }),
});
export const PUBLIC_SAFE_PROJECT_SLUGS = Object.freeze([
  'angamos', 'curico-77', 'domeyko-2055', 'jofre-135', 'mirador-la-florida', 'plaza-las-condes', 'san-ignacio',
  'jardines-de-ramon-cruz', 'condominio-parque-don-lautaro', 'condominio-uruguay', 'gregorio-de-la-fuente-a', 'bcome',
]);
const slugs = new Set(PUBLIC_SAFE_PROJECT_SLUGS);
const facts = Object.freeze(['comuna', 'region', 'direccion', 'estado', 'entrega', 'tipologias', 'mapQuery']);
const baseline = new Map();
for (const [builder, data] of [['Sento', sento], ['León', leon]]) {
  if (createHash('sha256').update(canonical(data)).digest('hex') !== PUBLIC_SAFE_BASELINE_PINS[builder].canonicalSha256) throw new Error('Public fact baseline differs from approved binding');
  for (const project of data.originalRows['data/proyectos.json']) if (slugs.has(project.slug)) baseline.set(project.slug, structuredClone(project));
}
if (baseline.size !== 12) throw new Error('Incomplete public fact baseline');
const verified = (project, field) => project.verificacion?.estadoFuente === 'verified' && project.verificacion.camposVerificados?.includes(field);

export function projectPublicSafeCatalogue(catalogue) {
  if (!Array.isArray(catalogue) || catalogue.length !== 131 || new Set(catalogue.map(row => row?.slug)).size !== 131
      || PUBLIC_SAFE_PROJECT_SLUGS.some(slug => !catalogue.some(row => row?.slug === slug))
      || catalogue.some(row => ['la-casona-de-buin', 'urbano-centro', 'box-santiago', 'atelier-prat-oficinas', 'corrientes-oficinas', 'patio-brasil'].includes(row?.slug))) throw new Error('Public catalogue must preserve the current 131 routes');
  return catalogue.map(project => {
    if (!slugs.has(project.slug)) return project;
    const prior = baseline.get(project.slug);
    if (project.inmobiliaria !== prior.inmobiliaria || project.detalleUrl !== '/' + project.slug + '.html'
        || typeof project.nombre !== 'string' || !project.nombre.trim()) throw new Error('Public project identity is inconsistent');
    // Current identities are explicitly retained. No raw project spread is allowed.
    const result = { slug: project.slug, nombre: project.nombre, inmobiliaria: project.inmobiliaria, detalleUrl: project.detalleUrl,
      precioDesdeUF: null, superficieDesdeM2: null, imagenPrincipal: null, imagenAlt: null };
    const retained = [];
    for (const field of facts) if (project[field] != null && verified(project, field) && verified(prior, field)
        && canonical(project[field]) === canonical(prior[field])) {
      result[field] = structuredClone(project[field]); retained.push(field);
    }
    // No recent verification date, supplier URL, financial terms or omitted
    // private facts are inferred from the newer protected review.
    result.verificacion = { estadoFuente: 'public_subset', camposVerificados: retained };
    return result;
  });
}

// Private build receipt only. Callers must not add this to client JSON.
export function publicSafeFactReceipt(catalogue) {
  const selected = projectPublicSafeCatalogue(catalogue);
  return selected.filter(project => slugs.has(project.slug)).map(project => ({ slug: project.slug,
    retainedFacts: facts.filter(field => Object.hasOwn(project, field)),
    omittedFacts: Object.keys(catalogue.find(row => row.slug === project.slug)).filter(field => !Object.hasOwn(project, field)),
    nulledFields: ['precioDesdeUF', 'superficieDesdeM2', 'imagenPrincipal', 'imagenAlt'].filter(field => catalogue.find(row => row.slug === project.slug)[field] != null),
    baseline: PUBLIC_SAFE_BASELINE_PINS[project.inmobiliaria] }));
}
