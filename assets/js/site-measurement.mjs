// Deliberately no third-party import, tag or request before both deployment and consent gates.
export const PRODUCTION_ORIGIN = 'https://sollahms.cl';
export const CONSENT_KEY = 'sollahms.measurement-consent.v1';
const SOURCE_KEY = 'sollahms.measurement-source.v1';
const DAY = 86400000;
export const CORPORATE_PATHS = Object.freeze([
  '/', '/agenda-asesoria.html', '/contacto.html', '/privacidad.html',
  '/comparador-hipotecario.html', '/trabaja-con-nosotros.html', '/guia-hipotecaria.html',
  '/cuando-comprar-propiedad.html', '/centro-orientacion.html', '/entorno-desarrollo-urbano.html',
  '/inversion-inmobiliaria-empresas.html', '/beneficios-tributarios-inmobiliarios.html',
]);
// Scenario tools render derived attributes; urban filters mutate the URL. Text masking alone is insufficient.
export const REPLAY_PATHS = Object.freeze([
  '/', '/agenda-asesoria.html', '/contacto.html', '/privacidad.html', '/trabaja-con-nosotros.html',
  '/inversion-inmobiliaria-empresas.html',
]);
// Literal navigation targets in the certified corporate HTML; never accept an arbitrary DOM id/hash.
const ANCHORS = Object.freeze({
  '/': ['contenido-principal', 'expertise', 'portfolio', 'solicitar-asesoria'],
  '/agenda-asesoria.html': ['contenido-principal', 'solicitar-asesoria'],
  '/contacto.html': ['contenido-principal', 'solicitar-asesoria'],
  '/privacidad.html': ['contenido-principal'],
  '/comparador-hipotecario.html': ['contenido-principal'],
  '/trabaja-con-nosotros.html': ['contenido-principal'],
  '/guia-hipotecaria.html': ['aprende', 'beneficios', 'contenido-principal', 'fuentes', 'glosario', 'herramientas-oficiales', 'simulador'],
  '/cuando-comprar-propiedad.html': ['blanco', 'comparacion', 'contenido-principal', 'fuentes', 'inmediata', 'modalidades', 'orientador', 'preguntas', 'verde'],
  '/centro-orientacion.html': ['beneficios', 'checklist', 'contenido-principal', 'cotizaciones', 'preguntas', 'presupuesto', 'recorrido', 'ruta'],
  '/entorno-desarrollo-urbano.html': ['contenido-principal'],
  '/inversion-inmobiliaria-empresas.html': ['alternativas', 'asesoria', 'capital', 'comparacion', 'contenido-principal', 'empresa', 'riesgos'],
  '/beneficios-tributarios-inmobiliarios.html': ['cambios', 'comparacion', 'contenido', 'fuentes', 'orientador', 'preguntas'],
});
const FORM_KINDS = Object.freeze(['advisory', 'orientation', 'mortgage', 'collaboration_company', 'collaboration_person']);
const ACCEPTANCE_KINDS = Object.freeze(['provider_accepted', 'crm_persisted']);
const DENIED = Object.freeze({analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});

export function allowedEnvironment(location, topLevel = true) {
  try {
    const url = new URL(location.href);
    return topLevel && !url.username && !url.password && url.origin === PRODUCTION_ORIGIN && CORPORATE_PATHS.includes(url.pathname);
  } catch { return false; }
}

export function safeReferrer(raw) {
  if (!raw) return {origin:'', group:'direct_or_unavailable'};
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return {origin:'', group:'other'};
    const host = url.hostname.toLowerCase();
    if (url.origin === PRODUCTION_ORIGIN) return {origin:PRODUCTION_ORIGIN, group:'internal'};
    const platforms = [
      [/^(?:www\.)?google\.(?:com|cl)$/, 'google'],
      [/^(?:www\.)?bing\.com$/, 'bing'],
      [/^(?:www\.)?(?:chatgpt\.com|chat\.openai\.com)$/, 'chatgpt'],
      [/^(?:www\.)?copilot\.microsoft\.com$/, 'copilot'],
      [/^gemini\.google\.com$/, 'gemini'],
      [/^(?:www\.)?perplexity\.ai$/, 'perplexity'],
    ];
    const match = platforms.find(([pattern]) => pattern.test(host));
    return match ? {origin:url.origin, group:match[1]} : {origin:'', group:'other'};
  } catch { return {origin:'', group:'other'}; }
}

export function replayUrlAllowed(location, referrer = '') {
  try {
    const url = new URL(location.href);
    if (!allowedEnvironment(location) || !REPLAY_PATHS.includes(url.pathname) || url.search) return false;
    if (url.hash && !(ANCHORS[url.pathname] || []).includes(url.hash.slice(1))) return false;
    if (!referrer) return true;
    const source = new URL(referrer);
    if (source.protocol !== 'https:' || source.username || source.password || source.search || source.hash) return false;
    // Do not let Clarity capture an external conversation/document path or an excluded-page context.
    return source.origin === PRODUCTION_ORIGIN ? CORPORATE_PATHS.includes(source.pathname) : source.pathname === '/';
  } catch { return false; }
}

export function normalizeConfig(raw = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {};
  const version = /^\d{4}-\d{2}-\d{2}$/.test(raw.consentVersion || '') ? raw.consentVersion : '2026-11-19';
  const gaId = /^G-[A-Z0-9]{6,20}$/.test(raw.analytics?.measurementId || '') ? raw.analytics.measurementId : '';
  const clarityId = /^[a-z0-9]{5,20}$/.test(raw.replay?.projectId || '') ? raw.replay.projectId : '';
  const replayScopeValid = Array.isArray(raw.replay?.allowedPaths) && raw.replay.allowedPaths.length === REPLAY_PATHS.length
    && new Set(raw.replay.allowedPaths).size === REPLAY_PATHS.length && raw.replay.allowedPaths.every(path => REPLAY_PATHS.includes(path));
  const enabled = raw.schemaVersion === 1 && raw.productionOrigin === PRODUCTION_ORIGIN && raw.enabled === true;
  return Object.freeze({
    enabled, consentVersion:version, consentMaxAgeDays:Math.min(180, Math.max(1, Number(raw.consentMaxAgeDays) || 180)),
    analytics:Object.freeze({enabled:enabled && raw.analytics?.enabled === true && !!gaId && raw.analytics?.enhancedMeasurementVerifiedDisabled === true, measurementId:gaId}),
    replay:Object.freeze({enabled:enabled && raw.replay?.enabled === true && !!clarityId && raw.replay?.strictMaskingVerified === true && replayScopeValid, projectId:clarityId}),
  });
}

export function parseConsent(raw, config, now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    if (value.version !== config.consentVersion || typeof value.analytics !== 'boolean' || typeof value.replay !== 'boolean') return null;
    if (!Number.isFinite(value.updatedAt) || !Number.isFinite(value.expiresAt) || value.updatedAt > now || value.expiresAt <= now || value.expiresAt <= value.updatedAt) return null;
    if (value.expiresAt - value.updatedAt > config.consentMaxAgeDays * DAY) return null;
    return {version:value.version, analytics:value.analytics, replay:value.replay, updatedAt:value.updatedAt, expiresAt:value.expiresAt};
  } catch { return null; }
}

export function safeEvent(name, detail = {}) {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return null;
  const schemas = {
    contact_cta_click:{cta_kind:['contact', 'advisory', 'whatsapp'], placement:['header', 'main', 'footer']},
    form_start:{form_kind:FORM_KINDS},
    contact_request_accepted:{form_kind:FORM_KINDS, acceptance_kind:ACCEPTANCE_KINDS},
    form_error:{form_kind:FORM_KINDS, error_kind:['validation', 'network', 'provider', 'unconfirmed']},
    tool_interaction:{tool_kind:['mortgage_comparator', 'mortgage_guide', 'budget', 'quotes', 'benefits', 'purchase_stage', 'tax_guide']},
  };
  const schema = schemas[name];
  if (!schema || Object.keys(detail).some(key => !Object.hasOwn(schema, key))) return null;
  const result = {};
  for (const [key, values] of Object.entries(schema)) {
    if (!values.includes(detail[key])) return null;
    result[key] = detail[key];
  }
  // These two forms only accept the sender-provider acknowledgement in their existing controllers.
  if (name === 'contact_request_accepted' && ['advisory', 'collaboration_company', 'collaboration_person'].includes(result.form_kind) && result.acceptance_kind !== 'provider_accepted') return null;
  return result;
}

function formKind(form) {
  if (!form) return null;
  if (form.id === 'advisory-form') return 'advisory';
  if (form.id === 'orientation-contact') return 'orientation';
  if (form.id === 'lead-form') return 'mortgage';
  return ({inmobiliaria:'collaboration_company', persona:'collaboration_person'})[form.dataset?.collaborationForm] || null;
}

function permittedForm(path, kind) {
  return kind === 'advisory' ? ['/', '/contacto.html', '/agenda-asesoria.html'].includes(path)
    : kind === 'orientation' ? path === '/centro-orientacion.html'
    : kind === 'mortgage' ? path === '/comparador-hipotecario.html'
    : path === '/trabaja-con-nosotros.html';
}

function clearCookies(document, category) {
  const match = category === 'analytics' ? /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/ : /^_clck$|^_clsk$/;
  for (const part of (document.cookie || '').split(';')) {
    const name = part.trim().split('=')[0];
    if (!match.test(name)) continue;
    for (const domain of ['', '; Domain=sollahms.cl', '; Domain=.sollahms.cl']) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure${domain}`;
    }
  }
}

function scriptLoader(document, src) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  script.referrerPolicy = 'origin';
  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

export function createMeasurement({window, document, config:raw, now = () => Date.now(), loadScript = src => scriptLoader(document, src), reload = () => window.location.reload(), mountUI = true}) {
  const config = normalizeConfig(raw);
  const topLevel = (() => { try { return window.top === window.self; } catch { return false; } })();
  if (!allowedEnvironment(window.location, topLevel)) return null;
  const storageGet = key => { try { return window.localStorage.getItem(key); } catch { return null; } };
  const storageSet = (key, value) => { try { window.localStorage.setItem(key, value); } catch { /* Denied storage means page-local consent. */ } };
  let consent = parseConsent(storageGet(CONSENT_KEY), config, now());
  let analyticsStarted = false, replayStarted = false, analyticsActive = false, stopped = false, generation = 0;
  let ui, expiryTimer;
  const canonical = () => PRODUCTION_ORIGIN + window.location.pathname;
  const referrer = safeReferrer(document.referrer);
  let sourceGroup = referrer.group;
  const expired = () => !!consent && consent.expiresAt <= now();
  const analyticsAllowed = () => !stopped && !expired() && consent?.analytics === true && config.analytics.enabled && allowedEnvironment(window.location, topLevel);
  const replayAllowed = () => !stopped && !expired() && consent?.replay === true && config.replay.enabled && replayUrlAllowed(window.location, document.referrer);

  function scheduleExpiry() {
    if (expiryTimer !== undefined) window.clearTimeout?.(expiryTimer);
    if (!consent || stopped || !window.setTimeout) return;
    // Browser timers have a signed 32-bit delay limit. Recheck on each bounded interval.
    expiryTimer = window.setTimeout(() => { checkExpiry(); if (!stopped) scheduleExpiry(); },
      Math.min(2147483647, Math.max(1, consent.expiresAt - now())));
  }

  function rememberSource() {
    try {
      const previous = JSON.parse(window.sessionStorage.getItem(SOURCE_KEY));
      const groups = ['google', 'bing', 'chatgpt', 'copilot', 'gemini', 'perplexity', 'direct_or_unavailable', 'other'];
      if (referrer.group === 'internal' && previous && groups.includes(previous.group) && previous.expiresAt > now()) sourceGroup = previous.group;
      if (sourceGroup === 'internal') sourceGroup = 'direct_or_unavailable';
      window.sessionStorage.setItem(SOURCE_KEY, JSON.stringify({group:sourceGroup, expiresAt:now() + 30 * 60000}));
    } catch { sourceGroup = referrer.group === 'internal' ? 'direct_or_unavailable' : referrer.group; }
  }

  function emit(name, detail = {}) {
    const cleaned = safeEvent(name, detail);
    if (!cleaned || !analyticsActive || !analyticsAllowed()) return false;
    if (cleaned.form_kind && !permittedForm(window.location.pathname, cleaned.form_kind)) return false;
    window.gtag('event', name, {...cleaned, send_to:config.analytics.measurementId,
      page_location:canonical(), page_referrer:referrer.origin, page_title:window.location.pathname === '/' ? 'Sollahms' : window.location.pathname.slice(1, -5), source_group:sourceGroup});
    return true;
  }

  async function startAnalytics() {
    if (analyticsStarted || !analyticsAllowed()) return;
    // An unmanaged pre-existing installation is not safe to merge with this minimal contract.
    if (window.gtag || window.dataLayer) return;
    analyticsStarted = true;
    const currentGeneration = generation;
    window[`ga-disable-${config.analytics.measurementId}`] = false;
    window.dataLayer = [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {...DENIED});
    // Current Google tags may initialize a destination before legacy config commands.
    // Apply the whole privacy contract globally BEFORE js, grant and SDK insertion.
    const tagSettings = {
      send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false,
      cookie_domain:'none', cookie_expires:60 * 86400, cookie_update:false, cookie_flags:'SameSite=Lax;Secure',
      page_location:canonical(), page_referrer:referrer.origin,
      page_title:window.location.pathname === '/' ? 'Sollahms' : window.location.pathname.slice(1, -5),
      campaign_id:'', campaign_source:'', campaign_medium:'', campaign_name:'', campaign_term:'', campaign_content:'',
    };
    window.gtag('set', {...tagSettings});
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('set', 'url_passthrough', false);
    window.gtag('consent', 'update', {...DENIED, analytics_storage:'granted'});
    window.gtag('js', new Date(now()));
    rememberSource();
    window.gtag('config', config.analytics.measurementId, {...tagSettings});
    try {
      await loadScript(`https://www.googletagmanager.com/gtag/js?id=${config.analytics.measurementId}`);
      if (currentGeneration !== generation || !analyticsAllowed()) return;
      analyticsActive = true;
      window.gtag('event', 'page_view', {send_to:config.analytics.measurementId, page_location:canonical(), page_referrer:referrer.origin,
        page_title:window.location.pathname === '/' ? 'Sollahms' : window.location.pathname.slice(1, -5), source_group:sourceGroup});
    } catch { analyticsActive = false; }
  }

  async function startReplay() {
    if (replayStarted || !replayAllowed() || window.clarity) return;
    replayStarted = true;
    // The root mask also covers future form errors, calculated results and user text. Never unmask descendants.
    document.documentElement.setAttribute('data-clarity-mask', 'True');
    document.querySelectorAll('[data-clarity-unmask]').forEach(element => element.removeAttribute('data-clarity-unmask'));
    window.clarity = function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    window.clarity('consentv2', {analytics_Storage:'granted', ad_Storage:'denied'});
    try { await loadScript(`https://www.clarity.ms/tag/${config.replay.projectId}`); } catch { /* No retry or alternative telemetry. */ }
  }

  function applyChoice(choice) {
    const next = {version:config.consentVersion, analytics:choice?.analytics === true && config.analytics.enabled,
      replay:choice?.replay === true && config.replay.enabled, updatedAt:now(), expiresAt:now() + config.consentMaxAgeDays * DAY};
    const withdrawing = (consent?.analytics && !next.analytics && analyticsStarted) || (consent?.replay && !next.replay && replayStarted);
    consent = next;
    storageSet(CONSENT_KEY, JSON.stringify(next));
    scheduleExpiry();
    if (!next.analytics) {
      if (config.analytics.measurementId) window[`ga-disable-${config.analytics.measurementId}`] = true;
      clearCookies(document, 'analytics');
      try { window.sessionStorage.removeItem(SOURCE_KEY); } catch { /* Unavailable storage. */ }
    }
    if (!next.replay) clearCookies(document, 'replay');
    ui?.close();
    if (withdrawing) {
      stopped = true; analyticsActive = false; generation++;
      // Merely sending consent=denied to either SDK can still transmit cookieless data. Reload removes SDKs.
      reload();
      return;
    }
    startAnalytics(); startReplay();
  }

  function checkExpiry() {
    if (!expired()) return;
    const hadSdk = analyticsStarted || replayStarted;
    consent = null; analyticsActive = false; generation++;
    if (config.analytics.measurementId) window[`ga-disable-${config.analytics.measurementId}`] = true;
    clearCookies(document, 'analytics'); clearCookies(document, 'replay');
    try { window.localStorage.removeItem(CONSENT_KEY); window.sessionStorage.removeItem(SOURCE_KEY); } catch { /* Unavailable storage. */ }
    if (hadSdk) { stopped = true; reload(); }
  }

  const toolContainers = {
    '/comparador-hipotecario.html':[['#simulation-form', 'mortgage_comparator']], '/guia-hipotecaria.html':[['#gh-inputs', 'mortgage_guide']],
    '/centro-orientacion.html':[['#budget-form', 'budget'], ['#quotes-form', 'quotes'], ['#benefit-form', 'benefits']],
    '/cuando-comprar-propiedad.html':[['#ps-form', 'purchase_stage']], '/beneficios-tributarios-inmobiliarios.html':[['#tax-controls', 'tax_guide']],
  }, interactedTools = new Set();
  const firstToolInteraction = event => {
    if (!event.isTrusted || !analyticsActive || !analyticsAllowed()) return;
    const tool = (toolContainers[window.location.pathname] || []).find(([selector]) => event.target?.closest?.(selector));
    if (!tool || interactedTools.has(tool[1])) return;
    if (emit('tool_interaction', {tool_kind:tool[1]})) interactedTools.add(tool[1]);
  };
  document.addEventListener('input', firstToolInteraction);
  document.addEventListener('change', firstToolInteraction);

  const startedForms = new WeakSet();
  document.addEventListener('focusin', event => {
    const form = event.target?.closest?.('form'), kind = formKind(form);
    if (!kind || startedForms.has(form) || !analyticsActive) return;
    if (emit('form_start', {form_kind:kind})) startedForms.add(form);
  });
  document.addEventListener('click', event => {
    const link = event.target?.closest?.('a[href]');
    if (!link) return;
    try {
      const target = new URL(link.getAttribute('href'), PRODUCTION_ORIGIN);
      let kind;
      if (target.protocol === 'https:' && ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(target.hostname)) kind = 'whatsapp';
      if (target.origin === PRODUCTION_ORIGIN && target.pathname === '/contacto.html') kind = 'contact';
      if (target.origin === PRODUCTION_ORIGIN && (target.pathname === '/agenda-asesoria.html' || target.hash === '#solicitar-asesoria')) kind = 'advisory';
      if (kind) emit('contact_cta_click', {cta_kind:kind, placement:link.closest('footer') ? 'footer' : link.closest('header,nav') ? 'header' : 'main'});
    } catch { /* Never serialize a malformed/raw link. */ }
  });
  window.addEventListener('sollahms:measurement', event => {
    const detail = event.detail;
    if (!detail || typeof detail !== 'object' || Object.keys(detail).some(key => !['name', 'parameters'].includes(key))) return;
    emit(detail.name, detail.parameters);
  });
  window.addEventListener('pageshow', checkExpiry);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkExpiry(); });
  // Public, literal anchors stay usable. Unrecognized URL context is never a trigger to start replay.
  window.addEventListener('hashchange', () => {
    if (replayStarted && !replayUrlAllowed(window.location, document.referrer)) {
      stopped = true; analyticsActive = false; generation++;
      if (config.analytics.measurementId) window[`ga-disable-${config.analytics.measurementId}`] = true;
      clearCookies(document, 'replay');
      reload(); // Only unrecognized URL context; every existing public anchor remains a normal navigation.
    } else if (!replayStarted) startReplay();
  });
  window.addEventListener('storage', event => {
    if (event.key !== CONSENT_KEY && event.key !== null) return;
    const updated = parseConsent(event.newValue, config, now());
    const withdrawing = !updated || (consent?.analytics && !updated.analytics) || (consent?.replay && !updated.replay);
    if (withdrawing && (analyticsStarted || replayStarted)) {
      stopped = true; analyticsActive = false; generation++;
      if (!updated?.analytics) {
        if (config.analytics.measurementId) window[`ga-disable-${config.analytics.measurementId}`] = true;
        clearCookies(document, 'analytics');
        try { window.sessionStorage.removeItem(SOURCE_KEY); } catch { /* Unavailable storage. */ }
      }
      if (!updated?.replay) clearCookies(document, 'replay');
      reload();
    } else { consent = updated; scheduleExpiry(); startAnalytics(); startReplay(); }
  });

  if (!consent?.analytics || !config.analytics.enabled) clearCookies(document, 'analytics');
  if (!consent?.replay || !config.replay.enabled) clearCookies(document, 'replay');
  if (mountUI) ui = mountPreferences({document, config, current:() => consent, apply:applyChoice, showBanner:!consent && (config.analytics.enabled || config.replay.enabled)});
  scheduleExpiry();
  startAnalytics(); startReplay();
  return Object.freeze({
    openPreferences:() => ui?.open(), choose:applyChoice, track:emit,
    status:() => ({enabled:config.enabled, analyticsReady:config.analytics.enabled, replayReady:config.replay.enabled,
      analyticsConsented:consent?.analytics === true, replayConsented:consent?.replay === true,
      analyticsActive, replayStarted, replayUrlAllowed:replayUrlAllowed(window.location, document.referrer), stopped}),
  });
}

function mountPreferences({document, config, current, apply, showBanner}) {
  const root = document.createElement('div');
  root.className = 'site-measurement';
  root.setAttribute('data-scroll-static', '');
  root.setAttribute('data-clarity-mask', 'True');
  // All copy is literal; no remote configuration, page text or form value enters this markup.
  root.innerHTML = `<button class="site-measurement-launcher" type="button">Privacidad y medición</button>
    <section class="site-measurement-banner" role="region" aria-label="Medición opcional" ${showBanner ? '' : 'hidden'}>
      <p class="site-measurement-title">Tú eliges cómo medimos este sitio</p>
      <p>Con tu permiso usamos Google Analytics para conocer visitas y solicitudes, y Microsoft Clarity para revisar la interacción mediante grabaciones enmascaradas. Son opciones independientes. Rechazarlas permite seguir usando el sitio y sus formularios.</p>
      <p><a href="/privacidad.html">Política de privacidad</a></p>
      <div class="site-measurement-actions"><button type="button" data-choice="accept">Aceptar ambas</button><button type="button" data-choice="reject">Rechazar ambas</button><button type="button" data-choice="configure">Configurar</button></div>
    </section>
    <dialog class="site-measurement site-measurement-dialog" aria-labelledby="site-measurement-title" aria-describedby="site-measurement-description">
      <h2 class="site-measurement-title" id="site-measurement-title">Preferencias de medición</h2>
      <p id="site-measurement-description">Los formularios y las herramientas funcionan sin medición opcional. Puedes cambiar o retirar tu permiso aquí cuando quieras.</p>
      <fieldset><legend>Opciones independientes</legend>
      <label class="site-measurement-option"><input type="checkbox" name="analytics"><span><strong>Medición de visitas y solicitudes</strong><small>Google Analytics: páginas corporativas, origen general y acciones sin campos de formularios ni valores financieros.</small></span></label>
      <label class="site-measurement-option"><input type="checkbox" name="replay"><span><strong>Interacción y grabaciones enmascaradas</strong><small>Microsoft Clarity: revisión de navegación con textos y contenido enmascarados. Se excluyen herramientas financieras, URL con parámetros y contexto no permitido.</small></span></label></fieldset>
      <p class="site-measurement-note" data-availability></p>
      <p class="site-measurement-note">Conservamos esta elección en tu navegador hasta 180 días. Al retirar un permiso activo, la página se recarga para detener la sesión de medición.</p>
      <p><a href="/privacidad.html">Política y derechos de privacidad</a></p>
      <div class="site-measurement-actions"><button type="button" data-choice="save">Guardar preferencias</button><button type="button" data-choice="reject">Rechazar ambas</button><button type="button" data-choice="close">Cerrar</button></div>
    </dialog>`;
  document.body.append(root);
  const dialog = root.querySelector('dialog'), banner = root.querySelector('.site-measurement-banner');
  const analytics = root.querySelector('input[name=analytics]'), replay = root.querySelector('input[name=replay]');
  analytics.disabled = !config.analytics.enabled; replay.disabled = !config.replay.enabled;
  root.querySelector('[data-availability]').textContent = !config.analytics.enabled && !config.replay.enabled
    ? 'La medición opcional está desactivada en este momento.'
    : !config.analytics.enabled || !config.replay.enabled ? 'Una de las opciones todavía está desactivada y no puede recopilar datos.' : '';
  const open = () => {
    analytics.checked = current()?.analytics === true && config.analytics.enabled;
    replay.checked = current()?.replay === true && config.replay.enabled;
    dialog.showModal();
  };
  const close = () => { banner.hidden = true; if (dialog.open) dialog.close(); };
  root.querySelector('.site-measurement-launcher').addEventListener('click', open);
  root.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
    switch (button.dataset.choice) {
      case 'accept': apply({analytics:true, replay:true}); break;
      case 'reject': apply({analytics:false, replay:false}); break;
      case 'configure': open(); break;
      case 'save': apply({analytics:analytics.checked, replay:replay.checked}); break;
      case 'close': dialog.close(); break;
    }
  }));
  return {open, close};
}

export async function bootMeasurement(window, document) {
  let topLevel = false;
  try { topLevel = window.top === window.self; } catch { /* Cross-origin frame. */ }
  if (!allowedEnvironment(window.location, topLevel)) return null;
  let config = {};
  try {
    const response = await window.fetch('/data/site-measurement.json', {credentials:'omit', cache:'no-store'});
    if (response.ok) config = await response.json();
  } catch { /* Missing/invalid configuration leaves all providers disabled. */ }
  const controller = createMeasurement({window, document, config});
  window.SollahmsMeasurement = controller;
  return controller;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => bootMeasurement(window, document), {once:true});
  else bootMeasurement(window, document);
}
