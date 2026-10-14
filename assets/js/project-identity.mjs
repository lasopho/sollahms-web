const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
const STAGE = /^[1-9]\d?$/;

function validProject(project) {
  return project && typeof project === 'object' && typeof project.slug === 'string' && SLUG.test(project.slug)
    && typeof project.nombre === 'string' && project.nombre.trim() && project.nombre.length <= 200
    && project.detalleUrl === '/' + project.slug + '.html';
}

function commercialStages(project) {
  if (project.inmobiliaria !== 'Ecasa' || !Array.isArray(project.etapasComerciales)) return [];
  const prefix = '/' + project.slug + '.html#etapa-';
  // Single-project snapshots keep their existing name and omit a stage field.
  // Their published anchor is enough to resolve an explicit stage query;
  // it never adds a stage label to the normal single-project context.
  const stages = project.etapasComerciales.map(stage => stage && typeof stage === 'object'
    ? { ...stage, etapa: stage.etapa ?? (typeof stage.detalleUrl === 'string' && stage.detalleUrl.startsWith(prefix)
      ? Number(stage.detalleUrl.slice(prefix.length)) : null) } : stage);
  if (!stages.every(stage => stage && typeof stage === 'object' && typeof stage.slug === 'string'
      && SLUG.test(stage.slug) && typeof stage.nombre === 'string' && stage.nombre.trim()
      && stage.nombre.length <= 200 && Number.isInteger(stage.etapa) && stage.etapa > 0 && stage.etapa <= 99
      && stage.detalleUrl === '/' + project.slug + '.html#etapa-' + stage.etapa)
      || new Set(stages.map(stage => stage.slug)).size !== stages.length
      || new Set(stages.map(stage => stage.etapa)).size !== stages.length) return null;
  return stages;
}

/**
 * Resolve only identities already present in the public catalogue. Explicit
 * stages use their own snapshot: a missing price or specification never falls
 * back to the parent. The original request remains available for handoffs.
 */
export function resolveProjectIdentity(catalogue, requestedSlug, requestedEtapa = null) {
  if (!Array.isArray(catalogue) || typeof requestedSlug !== 'string' || !SLUG.test(requestedSlug)) return null;
  const hasStage = requestedEtapa !== null;
  if (hasStage && !((typeof requestedEtapa === 'string' && STAGE.test(requestedEtapa))
      || (Number.isInteger(requestedEtapa) && requestedEtapa > 0 && requestedEtapa <= 99))) return null;
  const stageNumber = hasStage ? Number(requestedEtapa) : null;
  let root = catalogue.find(project => validProject(project) && project.slug === requestedSlug);
  let selected = null;
  let stages = root && commercialStages(root);
  let explicitStage = hasStage;
  if (root) {
    if (stages === null) return null;
    if (hasStage) selected = stages.find(stage => stage.etapa === stageNumber);
    else if (stages.length > 1) selected = stages.find(stage => stage.slug === root.etapaReferenciaSlug);
    else selected = root;
  } else {
    const matches = catalogue.filter(validProject).flatMap(project => {
      const candidates = commercialStages(project);
      return (candidates ?? []).filter(stage => stage.slug === requestedSlug).map(stage => ({ root: project, stage, stages: candidates }));
    });
    if (matches.length !== 1) return null;
    ({ root, stage: selected, stages } = matches[0]);
    if (hasStage && selected.etapa !== stageNumber) return null;
    explicitStage = true;
  }
  if (!selected) return null;
  const multipleStages = stages.length > 1;
  const label = multipleStages ? root.nombre + ' · Etapa ' + selected.etapa : root.nombre;
  const detail = multipleStages || explicitStage ? selected.detalleUrl : root.detalleUrl;
  const bodyProjectSlug = explicitStage ? selected.slug : root.slug;
  return {
    ...selected,
    slug: bodyProjectSlug,
    nombre: label,
    detalleUrl: detail,
    canonicalSlug: root.slug,
    originCommercialSlug: selected.slug,
    requestedSlug,
    explicitStage,
    bodyProjectSlug,
    contextQuery: '?proyecto=' + encodeURIComponent(root.slug)
      + (multipleStages || explicitStage ? '&etapa=' + selected.etapa : ''),
  };
}
