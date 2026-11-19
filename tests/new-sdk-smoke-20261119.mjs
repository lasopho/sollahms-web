import {createRequire} from 'node:module';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import path from 'node:path';

// Real public SDK reads only. Every measurement, beacon, API, image and non-allowlisted request is intercepted.
const require = createRequire(import.meta.url);
const {chromium} = require('/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const staticRoot = '/Users/luissandoval/.codex/visualizations/2026/11/19/01a1f34f-7346-7b03-850e-9f941c675b6c/sollahms-measurement-private/candidate-final/.vercel/output/static';
const receiptPath = new URL('../docs/measurement-20261119/sdk-smoke-receipt.json', import.meta.url);
const sha = data => createHash('sha256').update(data).digest('hex');
const moduleBytes = await readFile(path.join(staticRoot, 'assets/js/site-measurement.mjs'));
const configBytes = await readFile(path.join(staticRoot, 'data/site-measurement.json'));
assert.equal(sha(moduleBytes), '579f798149433ed7e14b199c8f8bb7cd63f2f1e253ce2d7bfe2a0d14338a8dfc');
assert.equal(sha(configBytes), '302c12004cdd37b76fa5fb91889a04dbe7b9ed95cfc0cac8697530ad15e39902');
const receipt = {observedAtUTC:new Date().toISOString(), status:'running', artifactStaticRoot:staticRoot,
  moduleSHA256:sha(moduleBytes), configSHA256:sha(configBytes), profile:'new ephemeral Playwright contexts, no user profile',
  harness:'Minimal locally fulfilled corporate HTML; exact certified candidate module/config bytes; all customer-like inputs are synthetic. Not an end-to-end form test.',
  policy:'Default abort. Only exact public SDK GET allowlist can reach network; route.fetch maxRedirects=0. All collect/beacon/API/POST blocked or locally fulfilled204.',
  providerScriptGETs:[], blockedRequests:[], measurementsIntercepted:[], beaconsSent:0, contactsSent:0, violations:[], scenarios:[]};
const synthetic = ['qa-sdk@example.invalid', '1000005-K', 'QA_SDK_SYNTHETIC', '7000000', 'qa-sensitive', 'qa-sdk-conversation'];
const safeParams = new Set(['en', 'dl', 'dr', 'dt', 'tid', 'gcs', 'gcd', 'npa', 'ep.source_group', 'ep.form_kind', 'ep.acceptance_kind', 'ep.tool_kind']);
function inspectMeasurement(request, scenario) {
  const url = new URL(request.url());
  const lines = request.postData()?.split('\n') || [''];
  for (const line of lines) {
    const params = new URLSearchParams(url.search);
    for (const [key, value] of new URLSearchParams(line)) params.set(key, value);
    const decoded = [...params].map(([key, value]) => key + '=' + value).join('&');
    for (const marker of synthetic) if (decoded.includes(marker)) receipt.violations.push({scenario, kind:'synthetic_sensitive_marker_in_measurement', marker});
    receipt.measurementsIntercepted.push({scenario, method:request.method(), host:url.hostname, path:url.pathname,
      event:params.get('en'), parameterKeys:[...new Set(params.keys())].sort(), parameters:Object.fromEntries([...params].filter(([key]) => safeParams.has(key))),
      bodyBytes:Buffer.byteLength(request.postData() || ''), action:'locally_fulfilled204_not_sent'});
  }
}
const browser = await chromium.launch({headless:true, executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args:['--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run']});
try {
  async function scenario(name, url, choices, referrer='') {
    const context = await browser.newContext({serviceWorkers:'block'});
    const scriptStart = receipt.providerScriptGETs.length;
    await context.route('**/*', async route => {
      const request = route.request(), current = new URL(request.url());
      if (current.origin === 'https://sollahms.cl' && request.method() === 'GET') {
        if (current.pathname === '/contacto.html') return route.fulfill({contentType:'text/html', body:'<!doctype html><html><head><meta charset="utf-8"><script type="module" src="/assets/js/site-measurement.mjs"></script></head><body><h1>Prueba sintética aislada</h1><form id="advisory-form"><input value="QA_SDK_SYNTHETIC"></form></body></html>'});
        if (current.pathname === '/assets/js/site-measurement.mjs') return route.fulfill({contentType:'text/javascript', body:moduleBytes});
        if (current.pathname === '/data/site-measurement.json') return route.fulfill({contentType:'application/json', body:configBytes});
      }
      const google = current.origin === 'https://www.googletagmanager.com' && current.pathname === '/gtag/js'
        && current.searchParams.size === 1 && current.searchParams.get('id') === 'G-LTFBQKVNY2';
      const clarity = current.origin === 'https://www.clarity.ms' && current.pathname === '/tag/zg5i98wnxm' && !current.search;
      const clarityVersion = current.origin === 'https://scripts.clarity.ms' && /^\/[0-9.]+\/clarity\.js$/.test(current.pathname) && !current.search;
      if (request.method() === 'GET' && request.resourceType() === 'script' && (google || clarity || clarityVersion)) {
        const item = {scenario:name, url:current.href, method:'GET', maxRedirects:0}; receipt.providerScriptGETs.push(item);
        try {
          const headers = {...request.headers()}; delete headers.cookie; delete headers.authorization;
          headers.referer = 'https://sollahms.cl/';
          const response = await route.fetch({maxRedirects:0, timeout:12000, headers});
          item.status = response.status();
          if (item.status !== 200) { item.blocked = 'non200_or_redirect'; return route.abort(); }
          const body = await response.body(); item.bytes = body.length; item.sha256 = sha(body);
          const responseHeaders = {...response.headers()}; delete responseHeaders['set-cookie'];
          return route.fulfill({status:200, headers:responseHeaders, body});
        } catch (error) { item.error = String(error.message).slice(0, 300); return route.abort(); }
      }
      const isMeasurement = /(?:google-analytics\.com|analytics\.google\.com|clarity\.ms)$/.test(current.hostname) && /(?:collect|g\/collect)/.test(current.pathname);
      if (isMeasurement) { inspectMeasurement(request, name); return route.fulfill({status:204, body:''}); }
      receipt.blockedRequests.push({scenario:name, method:request.method(), type:request.resourceType(), host:current.hostname, path:current.pathname, action:'aborted'});
      return route.abort();
    });
    const page = await context.newPage();
    const pageErrors = []; page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(url, {waitUntil:'domcontentloaded', referer:referrer || undefined, timeout:20000});
    await page.waitForFunction(() => !!window.SollahmsMeasurement, null, {timeout:10000});
    await page.waitForTimeout(700);
    const preConsentScriptGETs = receipt.providerScriptGETs.length - scriptStart;
    assert.equal(preConsentScriptGETs, 0, name + ': no SDK read before consent');
    if (choices) await page.evaluate(choice => window.SollahmsMeasurement.choose(choice), choices);
    if (name === 'google-opt-in') {
      try { await page.waitForFunction(() => !!window.google_tag_manager, null, {timeout:18000}); } catch { /* Receipt records SDK/network failure. */ }
      await page.waitForTimeout(6000);
    } else if (name === 'clarity-opt-in') await page.waitForTimeout(4500);
    else await page.waitForTimeout(600);
    const state = await page.evaluate(() => ({status:window.SollahmsMeasurement.status(), gtagType:typeof window.gtag,
      googleTagManagerPresent:!!window.google_tag_manager, rootMask:document.documentElement.getAttribute('data-clarity-mask'),
      clarityType:typeof window.clarity,
      consentCommands:(window.dataLayer || []).filter(args => args[0] === 'consent').map(args => [args[0], args[1], args[2]])}));
    const measurements = receipt.measurementsIntercepted.filter(item => item.scenario === name);
    const pageViews = measurements.filter(item => item.event === 'page_view');
    const result = {name, preConsentScriptGETs, scriptGETs:receipt.providerScriptGETs.length - scriptStart, measurementRequestsIntercepted:measurements.length,
      pageViewCount:pageViews.length, state, pageErrors};
    if (name === 'google-opt-in') {
      result.exactlyOnePageView = pageViews.length === 1;
      result.cleanPageLocation = pageViews.length > 0 && pageViews.every(item => item.parameters.dl === 'https://sollahms.cl/contacto.html');
      result.cleanReferrer = pageViews.length > 0 && pageViews.every(item => item.parameters.dr === 'https://chatgpt.com');
      result.noDuplicateAutomaticPageView = pageViews.length === 1;
    }
    receipt.scenarios.push(result);
    await context.close();
  }
  await scenario('default-no-consent', 'https://sollahms.cl/contacto.html', null);
  await scenario('rejected', 'https://sollahms.cl/contacto.html', {analytics:false, replay:false});
  await scenario('google-opt-in', 'https://sollahms.cl/contacto.html?correo=qa-sdk%40example.invalid&rut=1000005-K&mensaje=QA_SDK_SYNTHETIC&income=7000000#qa-sensitive',
    {analytics:true, replay:false}, 'https://chatgpt.com/c/qa-sdk-conversation?mensaje=QA_SDK_SYNTHETIC');
  const google = receipt.scenarios.find(item => item.name === 'google-opt-in');
  if (google.exactlyOnePageView && google.cleanPageLocation && google.cleanReferrer && receipt.violations.length === 0) {
    await scenario('clarity-opt-in', 'https://sollahms.cl/contacto.html', {analytics:false, replay:true});
  }
  receipt.status = receipt.violations.length ? 'failed_real_sdk_sensitive_url_and_duplicate_page_view'
    : google.exactlyOnePageView && google.cleanPageLocation && google.cleanReferrer ? 'passed_google_real_sdk_intercepted' : 'failed_or_network_blocked';
} catch (error) { receipt.status = 'failed_or_network_blocked'; receipt.error = String(error.stack).slice(0, 1200); }
finally { await browser.close(); await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n'); }
console.log(JSON.stringify({status:receipt.status, providerScriptGETs:receipt.providerScriptGETs.length, beaconsSent:receipt.beaconsSent,
  violations:receipt.violations, scenarios:receipt.scenarios.map(item => ({name:item.name, scriptGETs:item.scriptGETs, pageViews:item.pageViewCount})), receiptPath:receiptPath.pathname}));
if (receipt.status !== 'passed_google_real_sdk_intercepted') process.exitCode = 1;
