import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {allowedEnvironment, replayUrlAllowed, safeReferrer, normalizeConfig, parseConsent, safeEvent,
  createMeasurement, bootMeasurement, CORPORATE_PATHS, REPLAY_PATHS, CONSENT_KEY} from '../assets/js/site-measurement.mjs';

// All loaders are local doubles. No Google, Microsoft, mail, CRM or production request is made.
const NOW = Date.parse('2026-11-19T15:00:00Z');
const candidate = JSON.parse(readFileSync(new URL('../data/site-measurement.json', import.meta.url)));
const ready = () => ({...candidate, enabled:true,
  analytics:{...candidate.analytics, enabled:true, measurementId:'G-TEST123456', enhancedMeasurementVerifiedDisabled:true},
  replay:{...candidate.replay, allowedPaths:[...candidate.replay.allowedPaths], enabled:true, projectId:'test12345', strictMaskingVerified:true}});
function memoryStorage() {
  const data = new Map();
  return {getItem:key => data.get(key) ?? null, setItem:(key, value) => data.set(key, value), removeItem:key => data.delete(key), data};
}
function target() {
  const handlers = new Map();
  return {addEventListener:(name, handler) => { const list = handlers.get(name) || []; list.push(handler); handlers.set(name, list); },
    emit:(name, event = {}) => { for (const handler of handlers.get(name) || []) handler(event); }};
}
function fixture({url='https://sollahms.cl/contacto.html', referrer='', config=ready(), saved, load, clock=() => NOW} = {}) {
  let reloads = 0;
  const attrs = new Map(), scripts = [], writes = [], timers = [];
  const document = {...target(), referrer, visibilityState:'visible', querySelectorAll:() => [], documentElement:{setAttribute:(key, value) => attrs.set(key, value)}};
  let cookie = '_ga=synthetic; _ga_TEST123456=synthetic; _clck=synthetic; _clsk=synthetic; essential=keep';
  Object.defineProperty(document, 'cookie', {get:() => cookie, set:value => { writes.push(value); const name = value.split('=')[0]; cookie = cookie.split(';').filter(part => part.trim().split('=')[0] !== name).join(';'); }});
  const window = {...target(), location:new URL(url), localStorage:memoryStorage(), sessionStorage:memoryStorage(),
    setTimeout:(callback, delay) => { timers.push({callback, delay}); return timers.length - 1; },
    clearTimeout:index => { if (timers[index]) timers[index].cancelled = true; }};
  window.top = window; window.self = window;
  if (saved) window.localStorage.setItem(CONSENT_KEY, JSON.stringify(saved));
  const controller = createMeasurement({window, document, config, now:clock, mountUI:false,
    loadScript:src => { scripts.push({src, masked:attrs.get('data-clarity-mask')}); return load ? load(src) : Promise.resolve(); },
    reload:() => { reloads++; }});
  return {window, document, controller, scripts, writes, attrs, timers, get reloads() { return reloads; }};
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const commands = window => (window.dataLayer || []).map(args => [...args]);

test('hard-coded positive scope is exactly the 12 certified corporate URLs', () => {
  const registry = JSON.parse(readFileSync(new URL('../docs/seo-measurement/scope-v3.json', import.meta.url)));
  assert.deepEqual(CORPORATE_PATHS.map(path => 'https://sollahms.cl' + path), registry.included_urls);
  for (const path of CORPORATE_PATHS) assert.equal(allowedEnvironment(new URL('https://sollahms.cl' + path)), true);
  for (const url of ['http://sollahms.cl/', 'https://www.sollahms.cl/', 'https://preview.vercel.app/', 'https://sollahms.cl/index.html',
    'https://sollahms.cl/proyectos.html', 'https://sollahms.cl/fuentes-respaldo-documental.html', 'https://sollahms.cl/cicarelli.html',
    'https://sollahms.cl/unknown.html', 'https://sollahms.cl/contacto.html/', 'https://user:secret@sollahms.cl/']) {
    assert.equal(allowedEnvironment(new URL(url)), false, url);
  }
  assert.equal(allowedEnvironment(new URL('https://sollahms.cl/'), false), false);
});

test('preview and excluded routes return before even fetching the same-origin config', async () => {
  let requests = 0;
  for (const url of ['https://preview.vercel.app/contacto.html', 'https://sollahms.cl/proyectos.html']) {
    const window = {location:new URL(url), fetch:() => { requests++; throw Error('No network'); }};
    window.top = window; window.self = window;
    assert.equal(await bootMeasurement(window, {}), null);
  }
  assert.equal(requests, 0);
});

test('shipped config contains only typed public settings and IDs within the certified positive scope', () => {
  assert.deepEqual(Object.keys(candidate).sort(), ['schemaVersion', 'enabled', 'productionOrigin', 'consentVersion', 'consentMaxAgeDays', 'analytics', 'replay'].sort());
  assert.deepEqual(Object.keys(candidate.analytics).sort(), ['enabled', 'measurementId', 'enhancedMeasurementVerifiedDisabled', 'retentionMonths', 'cookieMaxAgeDays'].sort());
  assert.deepEqual(Object.keys(candidate.replay).sort(), ['enabled', 'projectId', 'strictMaskingVerified', 'allowedPaths'].sort());
  assert.equal(candidate.schemaVersion, 1); assert.equal(candidate.productionOrigin, 'https://sollahms.cl');
  assert.match(candidate.consentVersion, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof candidate.consentMaxAgeDays, 'number'); assert.ok(candidate.consentMaxAgeDays > 0 && candidate.consentMaxAgeDays <= 180);
  for (const value of [candidate.enabled, candidate.analytics.enabled, candidate.analytics.enhancedMeasurementVerifiedDisabled, candidate.replay.enabled, candidate.replay.strictMaskingVerified]) assert.equal(typeof value, 'boolean');
  assert.equal(typeof candidate.analytics.measurementId, 'string'); assert.equal(typeof candidate.replay.projectId, 'string');
  if (candidate.analytics.measurementId) assert.match(candidate.analytics.measurementId, /^G-[A-Z0-9]{6,20}$/);
  if (candidate.replay.projectId) assert.match(candidate.replay.projectId, /^[a-z0-9]{5,20}$/);
  assert.equal(candidate.analytics.retentionMonths, 2); assert.equal(candidate.analytics.cookieMaxAgeDays, 60);
  assert.deepEqual(candidate.replay.allowedPaths, REPLAY_PATHS);
  assert.ok(candidate.replay.allowedPaths.every(path => CORPORATE_PATHS.includes(path)));
  if (candidate.enabled && candidate.analytics.enabled) {
    assert.match(candidate.analytics.measurementId, /^G-[A-Z0-9]{6,20}$/);
    assert.equal(candidate.analytics.enhancedMeasurementVerifiedDisabled, true);
  }
  if (candidate.enabled && candidate.replay.enabled) {
    assert.match(candidate.replay.projectId, /^[a-z0-9]{5,20}$/);
    assert.equal(candidate.replay.strictMaskingVerified, true);
  }
});

test('an explicitly disabled fixture without IDs remains inert even after both choices are granted', async () => {
  const config = {...candidate, enabled:false,
    analytics:{...candidate.analytics, enabled:false, measurementId:''}, replay:{...candidate.replay, enabled:false, projectId:''}};
  const f = fixture({config}); f.controller.choose({analytics:true, replay:true}); await flush();
  assert.equal(f.scripts.length, 0); assert.equal(f.window.dataLayer, undefined); assert.equal(f.window.clarity, undefined);
  assert.equal(f.controller.status().analyticsConsented, false); assert.equal(f.controller.status().replayConsented, false);
});

test('enabled providers without IDs or verified property preflights still fail closed', async () => {
  const config = ready();
  config.analytics.enhancedMeasurementVerifiedDisabled = false;
  config.replay.strictMaskingVerified = false;
  const f = fixture({config});
  f.controller.choose({analytics:true, replay:true}); await flush();
  assert.equal(f.scripts.length, 0);
  assert.equal(f.controller.status().analyticsConsented, false); assert.equal(f.controller.status().replayConsented, false);
  const noIds = ready(); noIds.analytics.measurementId = ''; noIds.replay.projectId = '';
  const empty = fixture({config:noIds}); empty.controller.choose({analytics:true, replay:true}); await flush();
  assert.equal(empty.scripts.length, 0); assert.equal(empty.controller.status().analyticsReady, false); assert.equal(empty.controller.status().replayReady, false);
  assert.equal(normalizeConfig({...ready(), productionOrigin:'https://other.invalid'}).enabled, false);
  for (const invalid of [null, false, '', [], 'invalid']) assert.equal(normalizeConfig(invalid).enabled, false);
});

test('unanswered and rejected choices send no third-party scripts, events or consent pings with real or fixture configuration', async () => {
  for (const config of [candidate, ready()]) {
    const f = fixture({config});
    assert.equal(f.scripts.length, 0); assert.equal(f.window.gtag, undefined); assert.equal(f.window.clarity, undefined);
    f.controller.choose({analytics:false, replay:false}); await flush();
    assert.equal(f.scripts.length, 0); assert.equal(f.window.dataLayer, undefined); assert.equal(f.window.clarity, undefined);
    assert.equal(f.controller.track('form_start', {form_kind:'advisory'}), false);
    assert.equal(f.reloads, 0); assert.match(f.document.cookie, /essential=keep/);
  }
});

test('analytics opt-in alone creates only a Google loader and sanitized allowlisted events', async () => {
  const f = fixture({url:'https://sollahms.cl/contacto.html?correo=private%40example.invalid&income=7000000#private',
    referrer:'https://chatgpt.com/c/private-conversation?email=private@example.invalid'});
  f.controller.choose({analytics:true, replay:false}); await flush();
  assert.deepEqual(f.scripts.map(s => s.src), ['https://www.googletagmanager.com/gtag/js?id=G-TEST123456']);
  const config = commands(f.window).find(command => command[0] === 'config')[2];
  const queue = commands(f.window);
  const globalIndex = queue.findIndex(command => command[0] === 'set' && typeof command[1] === 'object');
  assert.ok(globalIndex >= 0);
  assert.deepEqual(queue[globalIndex][1], config);
  assert.ok(globalIndex < queue.findIndex(command => command[0] === 'js'));
  assert.ok(globalIndex < queue.findIndex(command => command[0] === 'consent' && command[1] === 'update'));
  assert.equal(config.send_page_view, false); assert.equal(config.allow_google_signals, false); assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(config.cookie_expires, 60 * 86400); assert.equal(config.cookie_update, false); assert.equal(config.cookie_domain, 'none');
  assert.equal(config.cookie_flags, 'SameSite=Lax;Secure');
  assert.equal(config.page_location, 'https://sollahms.cl/contacto.html'); assert.equal(config.page_referrer, 'https://chatgpt.com');
  assert.equal(config.campaign_term, '');
  assert.equal(f.controller.track('contact_request_accepted', {form_kind:'advisory', acceptance_kind:'provider_accepted'}), true);
  const queued = JSON.stringify(commands(f.window));
  for (const forbidden of ['private', 'income', '7000000', 'conversation', 'correo=', '#']) assert.equal(queued.includes(forbidden), false, forbidden);
  assert.equal(f.window.clarity, undefined);
  const consentCommands = commands(f.window).filter(command => command[0] === 'consent');
  assert.equal(consentCommands[0][2].analytics_storage, 'denied');
  assert.equal(consentCommands[1][2].analytics_storage, 'granted');
  for (const command of consentCommands) assert.equal(command[2].ad_storage, 'denied');
});

test('replay opt-in is independent and masks root before the Microsoft loader', async () => {
  const f = fixture();
  f.controller.choose({analytics:false, replay:true}); await flush();
  assert.deepEqual(f.scripts, [{src:'https://www.clarity.ms/tag/test12345', masked:'True'}]);
  assert.equal(f.window.gtag, undefined); assert.equal(f.window.dataLayer, undefined);
  assert.deepEqual([...f.window.clarity.q[0]], ['consentv2', {analytics_Storage:'granted', ad_Storage:'denied'}]);
  assert.equal(f.controller.track('form_start', {form_kind:'advisory'}), false);
});

test('replay blocks query/unknown hash/conversation referrer and accepts only literal normal anchors', async () => {
  for (const [url, referrer] of [
    ['https://sollahms.cl/?rut=12345678', ''], ['https://sollahms.cl/#email@example.invalid', ''],
    ['https://sollahms.cl/', 'https://google.com/search?q=private'],
    ['https://sollahms.cl/', 'https://chatgpt.com/c/conversation-id'],
    ['https://sollahms.cl/', 'https://sollahms.cl/proyectos.html'],
  ]) {
    assert.equal(replayUrlAllowed(new URL(url), referrer), false);
    const f = fixture({url, referrer}); f.controller.choose({analytics:false, replay:true}); await flush();
    assert.equal(f.scripts.length, 0, url + referrer);
  }
  const f = fixture({url:'https://sollahms.cl/#expertise', referrer:'https://www.google.com/'});
  f.controller.choose({analytics:false, replay:true}); await flush(); assert.equal(f.scripts.length, 1);
  f.window.location = new URL('https://sollahms.cl/#solicitar-asesoria'); f.window.emit('hashchange');
  assert.equal(f.reloads, 0);
  f.window.location = new URL('https://sollahms.cl/#private@example.invalid'); f.window.emit('hashchange');
  assert.equal(f.reloads, 1); assert.equal(f.controller.status().stopped, true);
});

test('replay cannot load on scenario tools or URL filter pages, even with full consent and enabled IDs', async () => {
  assert.deepEqual(candidate.replay.allowedPaths, REPLAY_PATHS);
  assert.equal(REPLAY_PATHS.length, 6);
  const tools = CORPORATE_PATHS.filter(path => !REPLAY_PATHS.includes(path));
  assert.equal(tools.length, 6);
  for (const path of tools) {
    const f = fixture({url:'https://sollahms.cl' + path}); f.controller.choose({analytics:true, replay:true}); await flush();
    assert.equal(f.scripts.filter(script => script.src.includes('clarity.ms')).length, 0, path);
    assert.equal(f.scripts.filter(script => script.src.includes('googletagmanager.com')).length, 1, path);
  }
  const config = ready(); config.replay.allowedPaths.push('/guia-hipotecaria.html');
  assert.equal(normalizeConfig(config).replay.enabled, false);
});

test('first trusted tool input/change sends one fixed enum per tool, without reading values or commercial fields', async () => {
  const containers = [
    ['/comparador-hipotecario.html', '#simulation-form', 'mortgage_comparator'],
    ['/guia-hipotecaria.html', '#gh-inputs', 'mortgage_guide'],
    ['/centro-orientacion.html', '#budget-form', 'budget'], ['/centro-orientacion.html', '#quotes-form', 'quotes'],
    ['/centro-orientacion.html', '#benefit-form', 'benefits'],
    ['/cuando-comprar-propiedad.html', '#ps-form', 'purchase_stage'],
    ['/beneficios-tributarios-inmobiliarios.html', '#tax-controls', 'tax_guide'],
  ];
  for (const [path, selector, kind] of containers) {
    const f = fixture({url:'https://sollahms.cl' + path});
    const target = {closest:requested => requested === selector ? {} : null};
    for (const key of ['value', 'name', 'id', 'textContent']) Object.defineProperty(target, key, {get:() => { throw Error('Must not read raw ' + key); }});
    f.document.emit('input', {isTrusted:true, target}); assert.equal(f.window.dataLayer, undefined);
    f.controller.choose({analytics:true, replay:false}); await flush();
    f.document.emit('input', {isTrusted:false, target});
    f.document.emit('input', {isTrusted:true, target}); f.document.emit('change', {isTrusted:true, target});
    const events = commands(f.window).filter(command => command[0] === 'event' && command[1] === 'tool_interaction');
    assert.equal(events.length, 1, kind); assert.equal(events[0][2].tool_kind, kind);
    assert.equal(Object.keys(events[0][2]).some(key => ['value', 'name', 'id', 'textContent'].includes(key)), false);
    const commercial = {closest:() => null};
    f.document.emit('input', {isTrusted:true, target:commercial});
    assert.equal(commands(f.window).filter(command => command[1] === 'tool_interaction').length, 1);
  }
  const f = fixture({url:'https://sollahms.cl/centro-orientacion.html'});
  f.controller.choose({analytics:true, replay:false}); await flush();
  for (const selector of ['#budget-form', '#quotes-form', '#benefit-form']) f.document.emit('change', {isTrusted:true, target:{closest:requested => requested === selector ? {} : null}});
  assert.equal(commands(f.window).filter(command => command[1] === 'tool_interaction').length, 3, 'dedupe is per tool, not per page');
});

test('withdrawal persists choice, disables events, removes own cookies and reloads the active SDK session', async () => {
  const f = fixture(); f.controller.choose({analytics:true, replay:true}); await flush();
  const before = commands(f.window).length;
  f.controller.choose({analytics:false, replay:false});
  assert.equal(f.reloads, 1); assert.equal(f.window['ga-disable-G-TEST123456'], true);
  assert.equal(f.controller.track('form_start', {form_kind:'advisory'}), false);
  assert.equal(commands(f.window).length, before, 'no denied-mode ping command sent to a loaded SDK');
  assert.equal(JSON.parse(f.window.localStorage.getItem(CONSENT_KEY)).analytics, false);
  assert.match(f.document.cookie, /essential=keep/); assert.equal(f.document.cookie.includes('_ga'), false); assert.equal(f.document.cookie.includes('_cl'), false);
  assert.equal(f.writes.some(value => value.includes('Domain=.sollahms.cl')), true);
});

test('revoke while loader is pending never emits a late page_view', async () => {
  let complete;
  const f = fixture({load:() => new Promise(resolve => { complete = resolve; })});
  f.controller.choose({analytics:true, replay:false}); f.controller.choose({analytics:false, replay:false});
  complete(); await flush();
  assert.equal(commands(f.window).some(command => command[0] === 'event'), false);
});

test('bad, expired, future, stale-version or overlong consent cannot start a provider', async () => {
  const config = normalizeConfig(ready());
  const valid = {version:config.consentVersion, analytics:true, replay:true, updatedAt:NOW - 1000, expiresAt:NOW + 1000};
  for (const change of [{expiresAt:NOW}, {updatedAt:NOW + 10}, {version:'2025-01-01'}, {analytics:'true'}, {expiresAt:NOW + 181 * 86400000}]) {
    const saved = {...valid, ...change};
    assert.equal(parseConsent(JSON.stringify(saved), config, NOW), null);
    const f = fixture({saved}); await flush(); assert.equal(f.scripts.length, 0);
  }
  let time = NOW;
  const f = fixture({saved:valid, clock:() => time}); await flush(); assert.equal(f.scripts.length, 2);
  time = NOW + 2000; f.window.emit('pageshow');
  assert.equal(f.reloads, 1); assert.equal(f.controller.track('form_start', {form_kind:'advisory'}), false);
});

test('cross-tab withdrawal immediately disables local events and reloads', async () => {
  for (const key of [CONSENT_KEY, null]) {
    const f = fixture(); f.controller.choose({analytics:true, replay:true}); await flush();
    f.window.emit('storage', {key, newValue:null});
    assert.equal(f.reloads, 1); assert.equal(f.controller.track('form_start', {form_kind:'advisory'}), false);
  }
});

test('total withdrawal in another tab removes analytics source and both provider cookie categories', async () => {
  const saved = {version:'2026-11-19', analytics:true, replay:true, updatedAt:NOW - 1000, expiresAt:NOW + 1000};
  const f = fixture({saved, referrer:'https://www.google.com/'}); await flush();
  const sourceKey = 'sollahms.measurement-source.v1';
  assert.equal(JSON.parse(f.window.sessionStorage.getItem(sourceKey)).group, 'google');
  assert.match(f.document.cookie, /_ga=synthetic/); assert.match(f.document.cookie, /_clck=synthetic/);
  const updated = {...saved, analytics:false, replay:false, updatedAt:NOW};
  f.window.emit('storage', {key:CONSENT_KEY, newValue:JSON.stringify(updated)});
  assert.equal(f.reloads, 1); assert.equal(f.window['ga-disable-G-TEST123456'], true);
  assert.equal(f.window.sessionStorage.getItem(sourceKey), null);
  assert.equal(f.document.cookie.includes('_ga'), false); assert.equal(f.document.cookie.includes('_cl'), false);
  assert.match(f.document.cookie, /essential=keep/);
  assert.equal(f.controller.track('form_start', {form_kind:'advisory'}), false);
});

test('replay-only withdrawal in another tab preserves consented analytics cookies and source', async () => {
  const saved = {version:'2026-11-19', analytics:true, replay:true, updatedAt:NOW - 1000, expiresAt:NOW + 1000};
  const f = fixture({saved, referrer:'https://www.google.com/'}); await flush();
  const sourceKey = 'sollahms.measurement-source.v1', source = f.window.sessionStorage.getItem(sourceKey);
  assert.equal(JSON.parse(source).group, 'google');
  const updated = {...saved, replay:false, updatedAt:NOW};
  f.window.emit('storage', {key:CONSENT_KEY, newValue:JSON.stringify(updated)});
  assert.equal(f.reloads, 1); assert.equal(f.window['ga-disable-G-TEST123456'], false);
  assert.equal(f.window.sessionStorage.getItem(sourceKey), source);
  assert.match(f.document.cookie, /_ga=synthetic/); assert.match(f.document.cookie, /_ga_TEST123456=synthetic/);
  assert.equal(f.document.cookie.includes('_cl'), false); assert.match(f.document.cookie, /essential=keep/);
  assert.equal(f.controller.track('form_start', {form_kind:'advisory'}), false, 'events stop until the reload finishes');
});

test('a continuously visible tab expires consent by a bounded timer, even without another interaction', async () => {
  let time = NOW;
  const saved = {version:'2026-11-19', analytics:true, replay:true, updatedAt:NOW - 1000, expiresAt:NOW + 1000};
  const f = fixture({saved, clock:() => time}); await flush();
  assert.equal(f.scripts.length, 2); assert.equal(f.timers.at(-1).delay, 1000);
  time += 1000; f.timers.at(-1).callback();
  assert.equal(f.reloads, 1); assert.equal(f.window.localStorage.getItem(CONSENT_KEY), null);
  const fresh = fixture(); fresh.controller.choose({analytics:true, replay:false});
  assert.equal(fresh.timers.at(-1).delay, 2147483647);
});

test('only fixed event names/enums pass; no extra PII, field IDs, finance or receipt IDs are serialized', async () => {
  const f = fixture(); f.controller.choose({analytics:true, replay:false}); await flush();
  const before = commands(f.window).length;
  const invalid = [
    ['generate_lead', {form_kind:'advisory'}], ['form_submit', {}], ['page_view', {}],
    ['form_start', {form_kind:'advisory', email:'private@example.invalid'}],
    ['form_start', {form_kind:'private@example.invalid'}],
    ['contact_request_accepted', {form_kind:'advisory', acceptance_kind:'delivered'}],
    ['contact_request_accepted', {form_kind:'advisory', acceptance_kind:'crm_persisted'}],
    ['contact_request_accepted', {form_kind:'advisory', acceptance_kind:'provider_accepted', operation_id:'secret'}],
    ['tool_interaction', {tool_kind:'budget', income:7000000}],
    ['form_error', {form_kind:'advisory', error_kind:'private error text'}],
    ['form_start', {form_kind:'mortgage'}], // Valid enum on the wrong corporate page.
  ];
  for (const [name, detail] of invalid) assert.equal(f.controller.track(name, detail), false, name + JSON.stringify(detail));
  assert.equal(commands(f.window).length, before);
  assert.equal(safeEvent('contact_request_accepted', {form_kind:'orientation', acceptance_kind:'crm_persisted'}).acceptance_kind, 'crm_persisted');
  assert.deepEqual(safeReferrer('https://unknown.invalid/private?email=x'), {origin:'', group:'other'});
});

test('the four real controller acknowledgement blocks cannot dispatch on missing/false provider or CRM proof', () => {
  const variants = [
    ['advisory.mjs', '      if(!response.ok){', '    }catch(error)', 'result', false],
    ['collaboration.mjs', '      if(!response.ok){', '    }catch(e)', 'result', false],
    ['orientacion.mjs', '    if(!response.ok){if(!attempt.reused', '  }catch(error)', 'result', true],
    ['hipotecario.mjs', '    for(const [name,message] of Object.entries(body.fieldErrors||{}))', '  } catch (error)', 'body', true],
  ];
  for (const [file, start, end, resultKey, supportsCrm] of variants) {
    const source = readFileSync(new URL('../assets/js/' + file, import.meta.url), 'utf8');
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert.ok(a >= 0 && b > a, file);
    const code = source.slice(a, b);
    function run(result, httpOk = true) {
      const events = [], element = {reset(){}, focus(){}, value:'', textContent:''};
      const context = {
        [resultKey]:result, response:{ok:httpOk, status:httpOk ? 200 : 503}, attempt:{reused:true},
        window:{dispatchEvent:event => events.push(event)}, CustomEvent:class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
        operation:{discard(){}, complete(){}}, contactOperation:{discard(){}, complete(){}}, form:element, status:element, contactForm:element,
        contactStatus:element, rutField:{clear(){}}, completed:false, kind:'inmobiliaria', startedAt:0,
        fieldError(){}, leadError(){}, show(){}, $:() => element,
      };
      try { vm.runInNewContext(code, context); } catch { /* The controller's outer catch handles invalid/unconfirmed responses. */ }
      return events;
    }
    const invalid = [{}, {ok:true}, {ok:true, providerAccepted:false, deliveryConfirmed:false},
      {ok:true, providerAccepted:true, deliveryConfirmed:true}, {ok:true, persisted:false}];
    if (supportsCrm) invalid.push({ok:true, persisted:true, providerAccepted:true, deliveryConfirmed:false});
    for (const result of invalid) {
      assert.equal(run(result).length, 0, file + JSON.stringify(result));
    }
    assert.equal(run({ok:true, providerAccepted:true, deliveryConfirmed:false}, false).length, 0, file + ' HTTP failure');
    const accepted = run({ok:true, providerAccepted:true, deliveryConfirmed:false});
    assert.equal(accepted.length, 1, file);
    assert.equal(accepted[0].detail.name, 'contact_request_accepted');
    assert.deepEqual(Object.keys(accepted[0].detail.parameters).sort(), ['acceptance_kind', 'form_kind']);
    const crm = run({ok:true, persisted:true});
    assert.equal(crm.length, supportsCrm ? 1 : 0, file + ' CRM acknowledgement');
  }
});
