'use strict';
(() => {
  const endpoint = '/api/interno-bonos-pie';
  const $ = id => document.getElementById(id);
  const state = { projects: [], stats: {}, history: [], csrfToken: '', version: null, visible: [], importing: false, loading: false, records: null };
  const labels = Object.freeze({ confirmed: 'Bono pie confirmado', conditional: 'Bono pie con condiciones', promotion_only: 'Promoción sin bono pie confirmado', no_information: 'Sin información', not_found: 'No encontrado en Iris', pending: 'Pendiente de verificación' });
  const fmt = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });
  const dateFormat = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'America/Santiago' });
  const timeFormat = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Santiago' });
  const filterFields = ['search', 'commune', 'developer', 'bonus', 'percentage', 'sort'];
  let lastDetailTrigger;
  const text = value => value === null || value === undefined ? '' : Array.isArray(value) ? value.map(text).filter(Boolean).join('\n') : typeof value === 'object' ? Object.entries(value).map(([key, val]) => `${key}: ${text(val)}`).join('\n') : String(value);
  const fold = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL').trim();
  const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  const statusOf = project => Object.hasOwn(labels, project.status) ? project.status : 'pending';
  const hasBonus = project => ['confirmed', 'conditional'].includes(statusOf(project));
  function percentageText(project) { const value = number(project.percentage); if (value === null) return 'No identificado'; const percent = `${fmt.format(value)} %`; if (project.percentageKind === 'maximum') return `Hasta ${percent}`; if (project.percentageKind === 'minimum') return `Desde ${percent}`; if (project.percentageKind === 'range' && number(project.percentageMax) !== null) return `${fmt.format(value)}–${fmt.format(project.percentageMax)} %`; return percent; }
  const percentageKey = project => number(project.percentage) === null ? '' : `${project.percentageKind || 'unknown'}:${project.percentage}:${number(project.percentageMax) ?? ''}`;
  const percentageSort = project => number(project.percentage) === null ? -1 : project.percentageKind === 'range' && number(project.percentageMax) !== null ? project.percentageMax : project.percentage;
  function el(tag, className, value) { const element = document.createElement(tag); if (className) element.className = className; if (value !== undefined) element.textContent = text(value); return element; }
  function safeUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; } }
  function link(value, label) { const url = safeUrl(value); if (!url) return null; const element = el('a', '', label); element.href = url; element.target = '_blank'; element.rel = 'noopener noreferrer'; return element; }
  function date(value, withTime = false) { if (!value) return 'Sin registro'; if (typeof value !== 'string') return text(value); const input = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00-03:00` : value; const parsed = new Date(input); return Number.isNaN(parsed.getTime()) ? text(value) : (withTime ? timeFormat : dateFormat).format(parsed); }
  function notice(message, kind = '') { const target = $('app-status'); target.textContent = message; target.className = `notice${kind ? ` ${kind}` : ''}`; target.hidden = !message; }
  function badge(project) { return el('span', `badge ${statusOf(project)}`, labels[statusOf(project)]); }
  function bonusLabel(project) { return statusOf(project) === 'confirmed' ? 'Sí' : statusOf(project) === 'conditional' ? 'Sí, con condiciones' : 'No confirmado'; }
  async function api(op, options = {}) {
    const response = await fetch(`${endpoint}?op=${op}`, { credentials: 'same-origin', cache: 'no-store', ...options, headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.method && options.method !== 'GET' ? { 'X-CSRF-Token': state.csrfToken } : {}), ...options.headers } });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401) {
      state.projects = []; state.visible = []; state.csrfToken = ''; state.records = null;
      $('project-rows').replaceChildren(); $('detail-dialog').close();
      window.location.replace('/interno/bonos-pie');
      throw new Error('La sesión terminó. Vuelve a iniciar sesión.');
    }
    if (!response.ok) {
      const error = new Error(response.status === 409 ? 'La información cambió desde que abriste el panel. Recarga los datos y revisa el archivo antes de importar nuevamente.' : response.status === 403 ? 'No se pudo verificar la solicitud. Recarga el panel para continuar.' : response.status === 413 ? 'El archivo supera el tamaño permitido.' : response.status === 400 || response.status === 422 ? 'El archivo no cumple el formato de verificación. Revisa los identificadores, estados, fechas y evidencias.' : 'No pudimos completar la solicitud. Inténtalo nuevamente.');
      error.status = response.status; throw error;
    }
    return result;
  }
  function selectOptions(id, values, defaults) {
    const select = $(id), previous = select.value;
    select.replaceChildren(...defaults.map(([value, label]) => { const option = el('option', '', label); option.value = value; return option; }));
    [...new Set(values.filter(Boolean))].sort((a, b) => text(a).localeCompare(text(b), 'es')).forEach(value => { const option = el('option', '', value); option.value = text(value); select.append(option); });
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
  }
  function populateFilters() {
    selectOptions('commune', state.projects.map(project => project.commune), [['', 'Todas las comunas']]);
    selectOptions('developer', state.projects.map(project => project.developer), [['', 'Todas las inmobiliarias']]);
    const percentages = [...new Map(state.projects.filter(project => number(project.percentage) !== null).map(project => [percentageKey(project), project])).values()].sort((a, b) => percentageSort(b) - percentageSort(a));
    const select = $('percentage'), previous = select.value;
    select.replaceChildren(...[['', 'Cualquier porcentaje'], ['identified', 'Con porcentaje identificado'], ['unknown', 'Sin porcentaje identificado'], ...percentages.map(project => [percentageKey(project), percentageText(project)])].map(([value, label]) => { const option = el('option', '', label); option.value = value; return option; }));
    if ([...select.options].some(option => option.value === previous)) select.value = previous;
  }
  function renderStats() {
    const stats = state.stats;
    const values = { total: stats.total, reviewed: stats.reviewed, bonus: stats.withBonus, percentage: stats.withPercentage, pending: stats.pending, expired: state.projects.filter(project => project.expired === true).length };
    for (const [id, value] of Object.entries(values)) $(`stat-${id}`).textContent = number(value) === null ? '—' : fmt.format(value);
    $('last-update').textContent = stats.lastUpdated ? date(stats.lastUpdated, true) : 'Sin consultas registradas';
  }
  function cell(label, content, className = '') { const td = el('td', className); td.dataset.label = label; if (content instanceof Node) td.append(content); else td.textContent = text(content); return td; }
  function renderRows() {
    const fragment = document.createDocumentFragment();
    for (const project of state.visible) {
      const row = document.createElement('tr');
      const identity = el('div'); const name = el('button', 'project-name', project.name || project.id); name.type = 'button'; name.addEventListener('click', () => showDetail(project, name)); identity.append(name, el('span', 'project-id', project.id));
      row.append(cell('Proyecto', identity));
      row.append(cell('Inmobiliaria', project.developer || 'Sin identificar'), cell('Comuna', project.commune || 'Sin identificar'));
      const bonus = el('div', '', bonusLabel(project)); if (project.expired) bonus.append(el('br'), el('span', 'badge expired', 'Vencido · reconfirmar')); else if (project.stale) bonus.append(el('br'), el('span', 'badge conditional', 'Reconfirmar consulta')); row.append(cell('Bono pie', bonus));
      row.append(cell('Porcentaje', number(project.percentage) !== null ? el('span', 'percent-value', percentageText(project)) : el('span', 'unknown', 'No identificado')));
      row.append(cell('Monto UF', number(project.amountUf) !== null ? el('span', 'amount-value', fmt.format(project.amountUf)) : el('span', 'unknown', 'No identificado')));
      const conditions = el('div'); conditions.append(el('span', 'condition-preview', text(project.conditions) || 'Sin condiciones informadas')); const detail = el('button', 'detail-link', 'Ver detalle'); detail.type = 'button'; detail.setAttribute('aria-label', `Ver condiciones y evidencia de ${project.name || project.id}`); detail.addEventListener('click', () => showDetail(project, detail)); conditions.append(detail); row.append(cell('Condiciones', conditions, 'condition-cell'));
      row.append(cell('Vigencia', el('span', 'date-value', project.validUntil ? date(project.validUntil) : 'No informada')), cell('Verificación', badge(project)), cell('Consultado', el('span', 'date-value', project.checkedAt ? date(project.checkedAt) : 'Pendiente')));
      const sources = el('div', 'source-links'); const iris = link(project.irisUrl, 'Iris ↗'), publicLink = link(project.publicUrl, 'Sollahms ↗'); if (iris) sources.append(iris); if (publicLink) sources.append(publicLink); if (!sources.childNodes.length) sources.append(el('span', 'unknown', 'Sin enlaces verificados')); row.append(cell('Fichas', sources, 'source-cell'));
      fragment.append(row);
    }
    $('project-rows').replaceChildren(fragment);
    $('empty').hidden = state.visible.length > 0;
    $('result-count').textContent = `${fmt.format(state.visible.length)} de ${fmt.format(state.projects.length)} proyectos`;
    $('export').disabled = state.visible.length === 0;
  }
  function applyFilters() {
    const filters = Object.fromEntries(filterFields.map(id => [id, $(id).value]));
    const search = fold(filters.search);
    state.visible = state.projects.filter(project => {
      if (search && !fold(project.name).includes(search)) return false;
      if (filters.commune && text(project.commune) !== filters.commune) return false;
      if (filters.developer && text(project.developer) !== filters.developer) return false;
      if (filters.bonus === 'verified' && (!hasBonus(project) || project.expired)) return false;
      if (filters.bonus === 'expired' && !project.expired) return false;
      if (filters.bonus && !['verified', 'expired'].includes(filters.bonus) && statusOf(project) !== filters.bonus) return false;
      if (filters.percentage === 'identified' && number(project.percentage) === null) return false;
      if (filters.percentage === 'unknown' && number(project.percentage) !== null) return false;
      if (filters.percentage && !['identified', 'unknown'].includes(filters.percentage) && percentageKey(project) !== filters.percentage) return false;
      return true;
    });
    state.visible.sort((a, b) => {
      const byName = text(a.name).localeCompare(text(b.name), 'es');
      if (filters.sort === 'name') return byName;
      if (filters.sort === 'amount_desc') return (number(b.amountUf) ?? -1) - (number(a.amountUf) ?? -1) || byName;
      if (filters.sort === 'checked_desc') return (Date.parse(b.checkedAt) || 0) - (Date.parse(a.checkedAt) || 0) || byName;
      return percentageSort(b) - percentageSort(a) || byName;
    });
    renderRows();
  }
  function clearFilters() { $('filters').reset(); applyFilters(); }
  function detailItem(grid, label, value, className = '') { const group = el('div', className); group.append(el('dt', '', label)); const dd = el('dd'); if (value instanceof Node) dd.append(value); else dd.textContent = text(value) || 'Sin información'; group.append(dd); grid.append(group); }
  function showDetail(project, trigger) {
    lastDetailTrigger = trigger;
    $('detail-title').textContent = project.name || project.id;
    $('detail-location').textContent = [project.developer, project.commune, project.region].filter(Boolean).join(' · ');
    const grid = el('dl', 'detail-grid');
    detailItem(grid, 'Porcentaje de bono pie', percentageText(project), 'detail-feature');
    detailItem(grid, 'Monto de bono pie', number(project.amountUf) !== null ? `${fmt.format(project.amountUf)} UF` : 'No identificado', 'detail-feature');
    detailItem(grid, 'Estado de verificación', badge(project)); detailItem(grid, 'Identificador Sollahms', project.id);
    if (project.identity?.validated === true) detailItem(grid, 'Identidad validada en Iris', [project.identity.name, project.identity.developer, project.identity.location].filter(Boolean).join(' · '), 'detail-full');
    detailItem(grid, 'Condiciones comerciales', text(project.conditions) || 'No hay condiciones comerciales registradas. Confirma los antecedentes en Iris antes de ofrecer el beneficio.', 'detail-full');
    detailItem(grid, 'Unidades participantes', text(project.units) || 'No informadas', 'detail-full');
    detailItem(grid, 'Vigencia informada', project.validUntil ? date(project.validUntil) : 'No informada'); detailItem(grid, 'Fecha de consulta', project.checkedAt ? date(project.checkedAt, true) : 'Pendiente');
    if (project.validityNote) detailItem(grid, 'Condición de vigencia', project.validityNote, 'detail-full');
    if (project.note) detailItem(grid, 'Observación de la consulta', project.note, 'detail-full');
    if (project.expired) detailItem(grid, 'Promoción vencida', 'El beneficio requiere una nueva confirmación en Iris antes de ofrecerlo.', 'detail-full');
    else if (project.stale) detailItem(grid, 'Reconfirmar información', 'Han transcurrido más de 30 días desde la consulta registrada. Confirma las condiciones actuales en Iris antes de ofrecer el beneficio.', 'detail-full');
    const sources = el('div', 'source-links'); const iris = link(project.irisUrl, 'Abrir ficha de Iris ↗'), publicLink = link(project.publicUrl, 'Abrir ficha de Sollahms ↗'); if (iris) sources.append(iris); if (publicLink) sources.append(publicLink); detailItem(grid, 'Fichas del proyecto', sources.childNodes.length ? sources : 'No hay enlaces verificados', 'detail-full');
    const evidence = Array.isArray(project.evidence) ? project.evidence : [];
    if (evidence.length) {
      const list = el('ul', 'detail-evidence');
      for (const item of evidence) {
        const li = el('li');
        if (typeof item === 'string') li.textContent = item;
        else if (item && typeof item === 'object') {
          const title = item.title || item.label || item.section || item.type || 'Evidencia de consulta';
          const evidenceLink = link(item.url || item.sourceUrl, title);
          li.append(evidenceLink || el('strong', '', title));
          const details = [item.text || item.excerpt || item.quote || item.description, item.capturedAt || item.checkedAt ? `Consultado: ${date(item.capturedAt || item.checkedAt, true)}` : '', item.sha256 ? `SHA-256: ${text(item.sha256)}` : '', item.path ? `Referencia privada: ${text(item.path)}` : ''].filter(Boolean).map(text).join('\n');
          if (details) li.append(el('br'), document.createTextNode(details));
        }
        if (li.textContent) list.append(li);
      }
      detailItem(grid, 'Evidencia conservada', list.childNodes.length ? list : 'Sin evidencia legible registrada', 'detail-full');
    } else detailItem(grid, 'Evidencia conservada', 'Sin evidencia registrada para este proyecto.', 'detail-full');
    const changes = state.history.filter(change => change && (change.id === project.id || change.projectId === project.id)).slice(-5).reverse();
    if (changes.length) {
      const list = el('ul', 'detail-evidence');
      for (const change of changes) list.append(el('li', '', [change.changedAt || change.at || change.updatedAt ? date(change.changedAt || change.at || change.updatedAt, true) : '', change.summary || change.description || 'Verificación actualizada'].filter(Boolean).join(' · ')));
      detailItem(grid, 'Cambios recientes', list, 'detail-full');
    }
    $('detail-content').replaceChildren(grid);
    $('detail-dialog').showModal();
    $('close-detail').focus();
  }
  function closeDetail() { $('detail-dialog').close(); }
  $('close-detail').addEventListener('click', closeDetail); $('detail-done').addEventListener('click', closeDetail);
  $('detail-dialog').addEventListener('click', event => { if (event.target === $('detail-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDetail(); } });
  $('detail-dialog').addEventListener('close', () => { lastDetailTrigger?.focus(); });
  async function load({ feedback = true } = {}) {
    if (state.loading) return;
    state.loading = true; $('reload').disabled = true; $('reload').setAttribute('aria-busy', 'true');
    if (feedback) notice('Consultando las verificaciones guardadas…');
    try {
      const result = await api('data');
      if (!Array.isArray(result.projects) || !result.stats || typeof result.csrfToken !== 'string') throw new Error('No pudimos leer el inventario privado. Inténtalo nuevamente.');
      state.projects = result.projects; state.stats = result.stats; state.history = Array.isArray(result.history) ? result.history : []; state.csrfToken = result.csrfToken; state.version = result.version ?? null;
      $('account-label').textContent = result.adminEmail ? `Administración · ${text(result.adminEmail)}` : 'Acceso exclusivo a administración';
      populateFilters(); renderStats(); applyFilters();
      if (feedback) notice(result.stats.reviewed === 0 ? 'El inventario está disponible. Las consultas de Iris todavía requieren verificación; no se han confirmado beneficios.' : 'Datos guardados cargados. La consulta de Iris se realiza manualmente.', 'success');
      $('import-button').disabled = !state.records || state.importing || state.version === null;
      return true;
    } catch (error) { notice(error.message || 'No hay conexión. Inténtalo nuevamente.', 'error'); return false; }
    finally { state.loading = false; $('reload').disabled = false; $('reload').removeAttribute('aria-busy'); }
  }
  $('filters').addEventListener('submit', event => event.preventDefault());
  for (const id of filterFields) $(id).addEventListener(id === 'search' ? 'input' : 'change', applyFilters);
  $('reset').addEventListener('click', clearFilters); $('empty-reset').addEventListener('click', clearFilters); $('reload').addEventListener('click', () => load());
  $('export').addEventListener('click', () => {
    const columns = [['Identificador', 'id'], ['Proyecto', 'name'], ['Inmobiliaria', 'developer'], ['Comuna', 'commune'], ['Región', 'region'], ['Bono pie', project => bonusLabel(project)], ['Porcentaje informado', project => number(project.percentage) !== null ? percentageText(project) : ''], ['Porcentaje base', 'percentage'], ['Tipo de porcentaje', 'percentageKind'], ['Porcentaje máximo del rango', 'percentageMax'], ['Monto UF', 'amountUf'], ['Condiciones', 'conditions'], ['Unidades participantes', 'units'], ['Vigencia', 'validUntil'], ['Estado de verificación', project => labels[statusOf(project)]], ['Promoción vencida', project => project.expired ? 'Sí' : 'No'], ['Fecha de consulta', 'checkedAt'], ['Ficha Iris', 'irisUrl'], ['Ficha Sollahms', 'publicUrl'], ['Evidencia', 'evidence']];
    const quote = value => { let output = text(value); if (/^[\s\u0000-\u001f]*[=+\-@]/u.test(output) || /^[\t\r\n]/.test(output)) output = `'${output}`; return `"${output.replace(/"/g, '""')}"`; };
    const content = '\uFEFF' + [columns.map(([label]) => quote(label)).join(';'), ...state.visible.map(project => columns.map(([, field]) => quote(typeof field === 'function' ? field(project) : project[field])).join(';'))].join('\r\n');
    const blobUrl = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = blobUrl; anchor.download = `sollahms-bonos-pie-${new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' }).format(new Date())}.csv`; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
    notice(`Se exportaron ${state.visible.length} proyectos con los filtros actuales. El CSV contiene información comercial privada.`, 'success');
  });
  $('import-file').addEventListener('change', async event => {
    state.records = null; $('import-button').disabled = true;
    const file = event.target.files?.[0];
    if (!file) { $('import-preview').textContent = 'Selecciona un archivo JSON de hasta 2 MB.'; return; }
    if (file.size > 2 * 1024 * 1024) { $('import-preview').textContent = 'El archivo supera los 2 MB. Selecciona un archivo más pequeño.'; return; }
    try {
      const parsed = JSON.parse(await file.text());
      const records = parsed?.records;
      if (!Array.isArray(records) || records.length === 0 || records.length > state.projects.length || records.some(record => !record || typeof record !== 'object' || Array.isArray(record) || typeof record.id !== 'string' || !Object.hasOwn(labels, record.status)) || new Set(records.map(record => record.id)).size !== records.length) throw new Error();
      const known = new Set(state.projects.map(project => project.id));
      if (records.some(record => !known.has(record.id))) { $('import-preview').textContent = 'El archivo incluye identificadores que no corresponden al inventario publicado. Revisa el archivo.'; return; }
      state.records = records;
      $('import-preview').textContent = `${fmt.format(records.length)} verificaciones preparadas. Se validarán fechas, identidad y evidencia al importar.`;
      $('import-button').disabled = state.version === null || state.importing;
    } catch { $('import-preview').textContent = 'No pudimos leer el archivo. Usa JSON válido con una lista records, identificadores únicos y estados admitidos.'; }
  });
  $('import-button').addEventListener('click', async () => {
    if (!state.records || state.importing || state.version === null) return;
    state.importing = true; $('import-button').disabled = true; $('import-file').disabled = true; $('import-button').setAttribute('aria-busy', 'true');
    notice('Validando y guardando las verificaciones…');
    try {
      const count = state.records.length;
      await api('data', { method: 'PUT', body: JSON.stringify({ records: state.records, expectedVersion: state.version }) });
      state.records = null; $('import-file').value = ''; $('import-preview').textContent = 'Selecciona un archivo JSON de hasta 2 MB.';
      const reloaded = await load({ feedback: false });
      if (reloaded) notice(`${fmt.format(count)} verificaciones importadas. Se conservó el historial y el resto del inventario.`, 'success');
      else notice('Las verificaciones se guardaron, pero no pudimos recargar el inventario. Pulsa Recargar datos para consultar la versión actual.', 'error');
    } catch (error) { notice(error.message || 'No hay conexión. No se pudo confirmar la importación; recarga los datos para revisar el resultado.', 'error'); }
    finally { state.importing = false; $('import-button').disabled = !state.records || state.version === null; $('import-file').disabled = false; $('import-button').removeAttribute('aria-busy'); }
  });
  $('logout').addEventListener('click', async () => {
    $('logout').disabled = true;
    try { await api('logout', { method: 'POST', body: '{}' }); state.projects = []; state.visible = []; state.csrfToken = ''; state.records = null; $('project-rows').replaceChildren(); window.location.replace('/interno/bonos-pie'); }
    catch (error) { notice(error.message || 'No se pudo cerrar la sesión. Inténtalo nuevamente.', 'error'); $('logout').disabled = false; }
  });
  load();
})();
