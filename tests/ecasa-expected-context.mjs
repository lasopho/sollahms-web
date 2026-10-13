// Independent expectations for the five explicitly consolidated developments.
const references = Object.freeze({
  'nucleo-costanera': 1, ferroparque: 1, terratolten: 3,
  'lomas-de-puyai': 1, 'alto-san-joaquin': 1,
});
export function expectedProjectLabel(name, slug) {
  return references[slug] ? name + ' · Etapa ' + references[slug] : name;
}
export function expectedProjectQuery(slug) {
  return '?proyecto=' + encodeURIComponent(slug) + (references[slug] ? '&etapa=' + references[slug] : '');
}
export function expectedProjectDetail(project) {
  return project.detalleUrl + (references[project.slug] ? '#etapa-' + references[project.slug] : '');
}
