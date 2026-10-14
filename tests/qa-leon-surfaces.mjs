// Read-only browser review of every León plan at all three required viewports.
// No form action is performed. Every non-GET/HEAD request is blocked before delivery.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFile, lstat, realpath, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  if (!process.argv[index + 1] || process.argv[index + 1].startsWith('--')) throw new Error(name + ' requires a value');
  return process.argv[index + 1];
};
const root = resolve(option('--root', fileURLToPath(new URL('../', import.meta.url))));
const base = option('--base', 'http://127.0.0.1:8089').replace(/\/$/, '');
const baseUrl = new URL(base), origin = baseUrl.origin;
if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) throw new Error('Use an HTTP(S) base without credentials, query or fragment');
const output = resolve(option('--output', '/private/tmp/leon-surfaces/qa'));
const datasetFile = 'data/leon-plan-surfaces.json';
const manifestFile = 'data/brochures-leon.json';
const datasetBytes = await readFile(resolve(root, datasetFile));
const manifestBytes = await readFile(resolve(root, manifestFile));
const dataset = JSON.parse(datasetBytes), manifest = JSON.parse(manifestBytes);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const safeError = error => {
  // Playwright request errors can include a complete HTTP header call log.
  // Retain only the diagnostic first line and redact the optional token.
  let message = String(error?.message ?? error).split('\n')[0];
  if (process.env.VERCEL_OIDC_TOKEN) message = message.replaceAll(process.env.VERCEL_OIDC_TOKEN, '[redacted]');
  return message.replace(/\u001b\[[0-9;]*m/g, '').slice(0, 1000);
};
const expectedSlugs = ['jardines-de-ramon-cruz', 'condominio-parque-don-lautaro', 'condominio-uruguay', 'gregorio-de-la-fuente-a', 'bcome'];
const kinds = new Set(['useful', 'interior', 'terrace', 'garden', 'total']);
const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 375, height: 844 }];
const checks = [], results = [], enlargements = [], screenshots = [], pageResults = [];
const requests = { blockedWrites: [], firstPartyFailures: [], rejectedRedirects: [], externalIsolated: 0, oidcOriginViolations: 0 };
const scriptErrors = [];
const check = (passed, label, evidence, caseResult) => {
  const item = { passed: !!passed, label, ...(evidence === undefined ? {} : { evidence }) };
  checks.push(item); if (caseResult) caseResult.checks.push(item);
  return item.passed;
};
const sameSet = (actual, expected) => actual.length === expected.length && new Set(actual).size === actual.length && JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
const surfaceText = area => area.applicable === false ? 'No incluye' : area.valueM2 === null ? 'Por confirmar' : Number(area.valueM2).toFixed(2).replace('.', ',') + ' m²';
const attrSelector = id => '[data-plan-id="' + id.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]';
const reportPath = resolve(output, 'report.json');
const methodology = 'All 36 source plans are bound independently to the original brochure manifest and local SHA-256 bytes. Each is reviewed individually at 1440, 768 and 375 CSS pixels, producing 108 article screenshots. Labels, room counts, all surface fields, explicit absence and unknown values are compared with the dataset. Published total values are compared directly, without recomputation or adding gardens. CSS contain, native/responsive aspect, decoded RGBA pixels, visible UI text >=11px, article/page overflow and script errors are checked in the normal interface with its visible global header. The rasterized plan labels are retained unchanged, with the 108 PNGs available for visual inspection; CSS font measurement does not measure rasterized cotas. Desktop fetches all 36 original image bytes with redirects disabled, then opens all 36 original links and compares their decoded pixel hashes to the fetched originals. For article screenshots only, the real global selector body > header.site-header is temporarily set to visibility:hidden, preserving layout and preventing fixed-header occlusion on tall cards; the style is removed immediately afterward and restoration and unchanged article dimensions are checked. No plan or article content is hidden. Only exact-origin first-party requests receive the optional OIDC header, using route.fetch with redirects disabled and route.fulfill; every 300-399 response is rejected before browser redirect handling. At most two ECONNRESET transport retries are permitted by Playwright maxRetries; HTTP failures are not retried or waived. Diagnostic error output excludes HTTP header call logs and redacts the token. Service workers are blocked. External documents are isolated, other external resources are aborted, all non-GET/HEAD requests are blocked. No messages or bookings are submitted. Scroll behavior is forced to auto only inside the test browser.';
const report = completed => ({ schemaVersion: 1, base, completed, methodology, datasetFile, datasetSha256: sha(datasetBytes), originalManifestSha256: sha(manifestBytes), targets: expectedSlugs, viewports, expectedResults: 108, expectedOriginalFetches: 36, expectedNativeEnlargements: 36, expectedScreenshots: 108, results, enlargements, pageResults, screenshots, requests, scriptErrors, checks, failures: checks.filter(item => !item.passed), summary: { results: results.length, passedResults: results.filter(item => item.passed).length, originalFetches: results.filter(item => item.originalFetch).length, nativeEnlargements: enlargements.length, screenshots: screenshots.length, checks: checks.length, failures: checks.filter(item => !item.passed).length } });
await mkdir(output, { recursive: true });
const save = async completed => writeFile(reportPath, JSON.stringify(report(completed), null, 2) + '\n');

// Validate the input before creating a browser or contacting the deployment.
check(dataset.schemaVersion === 1 && Array.isArray(dataset.plans) && dataset.plans.length === 36, 'Dataset contains exactly 36 plans with schemaVersion 1');
const plans = dataset.plans ?? [];
check(plans.every(plan => typeof plan.id === 'string' && plan.id && !/[\u0000-\u001f]/.test(plan.id)) && new Set(plans.map(plan => plan.id)).size === 36, 'All 36 plan IDs are unique and safe');
check(sameSet([...new Set(plans.map(plan => plan.projectSlug))], expectedSlugs), 'Only the five authorized projects are included');
const originals = new Map(manifest.projects.flatMap(project => project.models.map(model => [model.plan.localPath, { ...model.plan, projectSlug: project.slug }])));
check(originals.size === 36 && sameSet(plans.map(plan => plan.planPath), [...originals.keys()]), 'Dataset retains exactly the 36 independent original plan paths');
for (const plan of plans) {
  const original = originals.get(plan.planPath);
  const prefix = 'dataset ' + plan.id;
  check(original?.projectSlug === plan.projectSlug && original?.sha256 === plan.planSha256 && /^[a-f0-9]{64}$/.test(plan.planSha256 ?? ''), prefix + ' original project/path/SHA-256 binding');
  check(typeof plan.planPath === 'string' && plan.planPath.startsWith('/assets/propiedades/leon/' + plan.projectSlug + '/') && !/[?#\\]/.test(plan.planPath) && !plan.planPath.split('/').includes('..'), prefix + ' safe first-party original path');
  check(typeof plan.typology === 'string' && !!normalize(plan.typology) && [plan.bedrooms, plan.bathrooms].every(value => value === null || Number.isInteger(value) && value >= 0), prefix + ' documented typology and room values');
  check(typeof plan.status === 'string' && !!plan.status && typeof plan.complete === 'boolean', prefix + ' explicit status and completeness');
  check(Array.isArray(plan.areas) && plan.areas.length > 0 && new Set(plan.areas.map(area => area.kind)).size === plan.areas.length && plan.areas.every(area => kinds.has(area.kind) && typeof area.label === 'string' && !!normalize(area.label) && [true, false, null].includes(area.applicable) && (area.valueM2 === null || typeof area.valueM2 === 'number' && Number.isFinite(area.valueM2) && area.valueM2 >= 0)), prefix + ' distinct explicitly typed surface fields');
  try {
    const path = resolve(root, plan.planPath.slice(1));
    const inside = relative(root, path);
    if (inside.startsWith('..') || inside === '') throw new Error('Original path escapes source root');
    const info = await lstat(path), actualPath = await realpath(path), bytes = await readFile(path);
    check(info.isFile() && actualPath === path && sha(bytes) === plan.planSha256 && bytes.length === original?.bytes, prefix + ' local original bytes remain intact', { bytes: bytes.length, sha256: sha(bytes) });
  } catch (error) { check(false, prefix + ' readable original', safeError(error)); }
}
if (checks.some(item => !item.passed)) {
  await save(false); console.error(JSON.stringify({ completed: false, reason: 'Invalid dataset or original binding; no browser/network started', report: reportPath })); process.exitCode = 1;
} else {
  const require = createRequire(import.meta.url);
  const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: false });
      await context.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (!['GET', 'HEAD'].includes(request.method())) {
          requests.blockedWrites.push({ origin: url.origin, path: url.pathname, method: request.method() }); return route.abort();
        }
        if (url.origin === origin) {
          // No context-wide header or route.continue override: Playwright
          // propagates continue headers through redirects. Fetch exactly one
          // authorized-origin response, then reject redirects before fulfillment.
          const headers = { ...request.headers() };
          delete headers['x-vercel-trusted-oidc-idp-token'];
          if (process.env.VERCEL_OIDC_TOKEN) headers['x-vercel-trusted-oidc-idp-token'] = process.env.VERCEL_OIDC_TOKEN;
          if (url.pathname === '/api/uf') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ uf: null }) });
          try {
            const response = await route.fetch({ headers, maxRedirects: 0, maxRetries: 2, timeout: 30000 });
            if (response.status() >= 300 && response.status() <= 399) {
              requests.rejectedRedirects.push({ path: url.pathname, status: response.status() });
              return route.fulfill({ status: 502, contentType: 'text/plain', body: 'QA rejected a redirect to preserve the exact-origin credential boundary.' });
            }
            return route.fulfill({ response });
          } catch (error) {
            requests.firstPartyFailures.push({ viewport: viewport.name, path: url.pathname, error: safeError(error) });
            return route.abort();
          }
        }
        requests.externalIsolated++;
        if (request.isNavigationRequest()) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><title>Documento externo aislado para QA de diseño</title><body style="margin:0;background:#e5e7eb;height:100vh"></body></html>' });
        return route.abort();
      });
      context.on('response', response => {
        const url = new URL(response.url());
        if (url.origin === origin && response.status() >= 400) requests.firstPartyFailures.push({ viewport: viewport.name, path: url.pathname, status: response.status() });
      });
      const page = await context.newPage(); let currentSlug = null, currentErrors = [];
      page.on('pageerror', error => { const item = { viewport: viewport.name, projectSlug: currentSlug, message: safeError(error) }; currentErrors.push(item); scriptErrors.push(item); });
      for (const projectSlug of expectedSlugs) {
        currentSlug = projectSlug; currentErrors = [];
        const projectPlans = plans.filter(plan => plan.projectSlug === projectSlug);
        let navigationError = null;
        try {
          const response = await page.goto(base + '/' + projectSlug + '.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
          check(response?.status() === 200, viewport.name + ' ' + projectSlug + ' HTTP 200', response?.status());
          await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].filter(link => new URL(link.href).origin === location.origin).every(link => !!link.sheet), null, { timeout: 15000 });
          await page.evaluate(() => document.fonts.ready);
          await page.addStyleTag({ content: 'html,body,*{scroll-behavior:auto!important}' });
          const section = await page.locator('#planos').evaluate(element => ({ ids: [...element.querySelectorAll('article.leon-model')].map(article => article.dataset.planId), tables: element.querySelectorAll('.leon-surface-table,table').length, auditNotes: [...element.querySelectorAll('.leon-source-note')].map(note => ({ text: note.textContent.trim(), id: note.closest('article.leon-model')?.dataset.planId })), technicalText: [...element.querySelectorAll('p,h3,dt,dd')].map(item => item.textContent.trim()).filter(text => /\b(?:brochure|pdf|auditoría|documental|correspondencia|página)\b|pág\.?\s*\d|sin código publicado|tabla de variantes|la suma/i.test(text)), overflow: document.documentElement.scrollWidth - innerWidth }));
          check(sameSet(section.ids, projectPlans.map(plan => plan.id)), viewport.name + ' ' + projectSlug + ' exact plan-ID set', section.ids);
          const incompleteIds = projectPlans.filter(plan => !plan.complete).map(plan => plan.id);
          const commercialNotesValid = section.auditNotes.every(note => note.text === 'Consulta las superficies de esta tipología al cotizar.' && incompleteIds.includes(note.id)) && sameSet(section.auditNotes.map(note => note.id), incompleteIds);
          check(!section.tables && commercialNotesValid && !section.technicalText.length, viewport.name + ' ' + projectSlug + ' no technical audit tables/prose; exact commercial notes only on incomplete plans', section);
          check(section.overflow <= 2, viewport.name + ' ' + projectSlug + ' no document overflow', section.overflow);
          pageResults.push({ viewport: viewport.name, projectSlug, status: response?.status(), ...section });
        } catch (error) { navigationError = safeError(error); check(false, viewport.name + ' ' + projectSlug + ' section available', navigationError); }
        for (const plan of projectPlans) {
          const item = { id: plan.id, projectSlug, viewport: viewport.name, width: viewport.width, status: plan.status, complete: plan.complete, planPath: plan.planPath, checks: [], screenshot: null, passed: false };
          results.push(item); const label = viewport.name + ' ' + projectSlug + ' ' + plan.id;
          if (navigationError) { check(false, label + ' article reachable', navigationError, item); continue; }
          try {
            const article = page.locator('article.leon-model' + attrSelector(plan.id));
            if (!check(await article.count() === 1, label + ' unique matching article', await article.count(), item)) continue;
            await article.scrollIntoViewIfNeeded();
            await article.locator('img').first().evaluate(image => image.decode());
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const evidence = await article.evaluate(async (element, expected) => {
              const image = element.querySelector('img'), style = image && getComputedStyle(image), imageBox = image?.getBoundingClientRect(), articleBox = element.getBoundingClientRect();
              const native = new Image(); native.src = image.currentSrc || image.src; await native.decode();
              const pixelHash = async source => {
                const canvas = document.createElement('canvas'); canvas.width = native.naturalWidth; canvas.height = native.naturalHeight;
                const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(source, 0, 0, canvas.width, canvas.height);
                const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
                const digest = await crypto.subtle.digest('SHA-256', pixels);
                return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
              };
              const fonts = []; const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT); let node;
              while ((node = walker.nextNode())) {
                if (!node.textContent.trim()) continue;
                const parent = node.parentElement, computed = getComputedStyle(parent), range = document.createRange(); range.selectNodeContents(node);
                const box = range.getBoundingClientRect();
                if (box.width > 0 && box.height > 0 && computed.display !== 'none' && computed.visibility !== 'hidden' && Number(computed.opacity) > 0 && computed.clip === 'auto' && computed.clipPath === 'none') fonts.push({ text: node.textContent.trim(), fontSize: parseFloat(computed.fontSize) });
              }
              const box = value => value && ({ x: value.x, y: value.y, width: value.width, height: value.height, right: value.right });
              const width = Math.min(imageBox.width, imageBox.height * native.naturalWidth / native.naturalHeight);
              const height = width * native.naturalHeight / native.naturalWidth;
              const painted = { x: imageBox.x + (imageBox.width - width) / 2, y: imageBox.y + (imageBox.height - height) / 2, right: imageBox.x + (imageBox.width + width) / 2, bottom: imageBox.y + (imageBox.height + height) / 2 };
              const clippedByAncestors = [];
              for (let parent = image.parentElement; parent && parent !== element.parentElement; parent = parent.parentElement) {
                const computed = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
                const clippedX = /hidden|clip|scroll|auto/.test(computed.overflowX) && (painted.x < bounds.x - 2 || painted.right > bounds.right + 2);
                const clippedY = /hidden|clip|scroll|auto/.test(computed.overflowY) && (painted.y < bounds.y - 2 || painted.bottom > bounds.bottom + 2);
                if (clippedX || clippedY) clippedByAncestors.push({ tag: parent.tagName, className: parent.className, clippedX, clippedY });
              }
              return { id: element.dataset.planId, heading: element.querySelector('h3')?.textContent.trim(), roomCounts: element.querySelector('p.leon-room-counts')?.textContent.trim(), areas: [...element.querySelectorAll('dl.leon-areas > div')].map(row => ({ kind: row.dataset.surfaceKind, label: row.querySelector('dt')?.textContent.trim(), value: row.querySelector('dd')?.textContent.trim() })), originalSrcPath: new URL(image.src).pathname, currentOrigin: new URL(native.src).origin, currentPath: new URL(native.src).pathname, naturalWidth: native.naturalWidth, naturalHeight: native.naturalHeight, alt: image.alt, objectFit: style.objectFit, clipPath: style.clipPath, transform: style.transform, href: image.closest('a')?.getAttribute('href'), target: image.closest('a')?.target, rel: image.closest('a')?.rel, decodedDomPixelsSha256: await pixelHash(image), decodedResourcePixelsSha256: await pixelHash(native), paintedAspect: width / height, clippedByAncestors, imageBox: box(imageBox), articleBox: box(articleBox), minimumFontPx: fonts.length ? Math.min(...fonts.map(row => row.fontSize)) : null, smallText: fonts.filter(row => row.fontSize < 11), overflow: element.scrollWidth - element.clientWidth, pageOverflow: document.documentElement.scrollWidth - innerWidth, duplicateAreaKinds: (() => { const rows = [...element.querySelectorAll('dl.leon-areas > div')].map(row => row.dataset.surfaceKind); return rows.length - new Set(rows).size; })() };
            }, plan);
            item.evidence = evidence;
            const original = originals.get(plan.planPath), variants = Array.isArray(original.variants) ? original.variants : Object.values(original.variants ?? {});
            const selected = [original, ...variants].find(asset => asset.localPath === evidence.currentPath);
            check(evidence.id === plan.id && normalize(evidence.heading) === normalize(plan.typology), label + ' ID and printed typology match dataset', evidence.heading, item);
            const roomParts = normalize(evidence.roomCounts).split(/[·|•;,]/).map(part => part.trim());
            for (const [key, noun] of [['bedrooms', 'dormitorio'], ['bathrooms', 'baño']]) {
              const value = plan[key], matchingParts = roomParts.filter(text => new RegExp(noun + 's?', 'i').test(text)), part = matchingParts.length === 1 ? matchingParts[0] : null;
              const known = part && (new RegExp('(?:^|\\s)' + value + '\\s+' + noun + 's?(?:$|\\s)', 'i').test(part) || new RegExp(noun + 's?\\s*:?\\s*' + value + '(?:$|\\s)', 'i').test(part));
              const passed = value === null ? !!part && /\bpor confirmar\b/i.test(part) : value === 0 && key === 'bedrooms' ? known || /\bEstudio\b/i.test(evidence.roomCounts ?? '') : known;
              check(passed, label + ' ' + key + ' matches documented count or explicit pending', evidence.roomCounts, item);
            }
            check(evidence.areas.length === plan.areas.length && !evidence.duplicateAreaKinds && sameSet(evidence.areas.map(area => area.kind), plan.areas.map(area => area.kind)), label + ' separate exact surface-kind set', evidence.areas, item);
            for (const area of plan.areas) {
              const actual = evidence.areas.find(row => row.kind === area.kind);
              check(actual && normalize(actual.label) === normalize(area.label) && normalize(actual.value) === surfaceText(area), label + ' exact ' + area.kind + ' label/value', { expected: { label: area.label, value: surfaceText(area) }, actual }, item);
            }
            const garden = plan.areas.find(area => area.kind === 'garden'), total = plan.areas.find(area => area.kind === 'total');
            check(!garden || evidence.areas.some(area => area.kind === 'garden') && (!total || evidence.areas.find(area => area.kind === 'garden') !== evidence.areas.find(area => area.kind === 'total')), label + ' garden has its own field and never replaces total', undefined, item);
            if (total) check(evidence.areas.find(area => area.kind === 'total')?.value === surfaceText(total), label + ' total equals dataset verbatim without arithmetic or garden addition', undefined, item);
            check(evidence.originalSrcPath === plan.planPath && evidence.currentOrigin === origin && !!selected && evidence.naturalWidth === selected?.width && evidence.naturalHeight === selected?.height && !!evidence.alt, label + ' decoded original/approved responsive resource identity', { path: evidence.currentPath, width: evidence.naturalWidth, height: evidence.naturalHeight }, item);
            if (selected && evidence.currentOrigin === origin) {
              const selectedUrl = new URL(evidence.currentPath, base + '/');
              if (selectedUrl.origin !== origin) { requests.oidcOriginViolations++; throw new Error('Selected image would leave exact authorized origin'); }
              const selectedResponse = await context.request.get(selectedUrl.href, { headers: process.env.VERCEL_OIDC_TOKEN ? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } : {}, maxRedirects: 0, maxRetries: 2, timeout: 30000 });
              const selectedBytes = await selectedResponse.body();
              item.selectedResource = { status: selectedResponse.status(), path: evidence.currentPath, bytes: selectedBytes.length, sha256: sha(selectedBytes) };
              check(selectedResponse.status() === 200 && sha(selectedBytes) === selected.sha256 && selectedBytes.length === selected.bytes, label + ' selected displayed resource bytes match approved original or variant', item.selectedResource, item);
            }
            const ratio = original.width / original.height;
            const tolerance = 2 / (selected?.height || 1);
            check(evidence.objectFit === 'contain' && evidence.clipPath === 'none' && evidence.transform === 'none' && Math.abs(evidence.naturalWidth / evidence.naturalHeight - ratio) <= tolerance && Math.abs(evidence.paintedAspect - ratio) <= tolerance, label + ' full drawing contain and source aspect preserved', { objectFit: evidence.objectFit, ratio, paintedAspect: evidence.paintedAspect }, item);
            check(evidence.decodedDomPixelsSha256 === evidence.decodedResourcePixelsSha256, label + ' displayed bitmap decodes to exact selected resource RGBA pixels', evidence.decodedDomPixelsSha256, item);
            check(!evidence.clippedByAncestors.length, label + ' no ancestor crops the contained drawing', evidence.clippedByAncestors, item);
            check(evidence.minimumFontPx !== null && evidence.minimumFontPx >= 11, label + ' visible UI text is at least 11 CSS pixels', evidence.smallText, item);
            check(evidence.overflow <= 2 && evidence.pageOverflow <= 2 && evidence.articleBox.x >= -2 && evidence.articleBox.right <= viewport.width + 2 && evidence.imageBox.x >= evidence.articleBox.x - 2 && evidence.imageBox.right <= evidence.articleBox.right + 2, label + ' no article/image/page horizontal overflow', { article: evidence.articleBox, image: evidence.imageBox, overflow: evidence.overflow, pageOverflow: evidence.pageOverflow }, item);
            const originalLinkValid = evidence.href === plan.planPath && evidence.target === '_blank' && /\bnoopener\b/.test(evidence.rel ?? '') && /\bnoreferrer\b/.test(evidence.rel ?? '');
            check(originalLinkValid, label + ' unchanged safe original enlargement link', { href: evidence.href, target: evidence.target, rel: evidence.rel }, item);
            if (viewport.name === 'desktop') {
              const url = new URL(plan.planPath, base + '/');
              if (url.origin !== origin) { requests.oidcOriginViolations++; throw new Error('Original fetch would leave exact authorized origin'); }
              const response = await context.request.get(url.href, { headers: process.env.VERCEL_OIDC_TOKEN ? { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } : {}, maxRedirects: 0, maxRetries: 2, timeout: 30000 });
              const bytes = await response.body();
              item.originalFetch = { status: response.status(), bytes: bytes.length, sha256: sha(bytes), path: plan.planPath };
              check(response.status() === 200 && sha(bytes) === plan.planSha256 && bytes.length === original.bytes, label + ' served original SHA-256 and bytes match independent source', item.originalFetch, item);
              const reference = await page.evaluate(async data => {
                const image = new Image(); image.src = data; await image.decode();
                const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
                const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0);
                const digest = await crypto.subtle.digest('SHA-256', context.getImageData(0, 0, canvas.width, canvas.height).data);
                return { width: canvas.width, height: canvas.height, pixelsSha256: [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('') };
              }, 'data:image/webp;base64,' + bytes.toString('base64'));
              if (originalLinkValid) {
                let popup;
                try {
                  [popup] = await Promise.all([page.waitForEvent('popup', { timeout: 12000 }), article.locator('a[href="' + plan.planPath + '"]').first().click({ timeout: 12000 })]);
                  await popup.waitForLoadState('domcontentloaded');
                  await popup.waitForFunction(() => document.images[0]?.complete && document.images[0]?.naturalWidth > 0, null, { timeout: 12000 });
                  const expanded = await popup.locator('img').first().evaluate(async image => {
                    await image.decode(); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
                    const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(image, 0, 0);
                    const digest = await crypto.subtle.digest('SHA-256', context.getImageData(0, 0, canvas.width, canvas.height).data);
                    return { width: canvas.width, height: canvas.height, pixelsSha256: [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('') };
                  });
                  const actualUrl = new URL(popup.url());
                  const passed = actualUrl.origin === origin && actualUrl.pathname === plan.planPath && expanded.width === original.width && expanded.height === original.height && expanded.width === reference.width && expanded.height === reference.height && expanded.pixelsSha256 === reference.pixelsSha256;
                  enlargements.push({ id: plan.id, projectSlug, path: actualUrl.pathname, ...expanded, passed });
                  check(passed, label + ' native original enlargement dimensions and RGBA pixels', expanded, item);
                } catch (error) { check(false, label + ' native enlargement opens and decodes', safeError(error), item); }
                finally { if (popup) await popup.close(); }
              }
            }
          } catch (error) { check(false, label + ' individual plan inspection completed', safeError(error), item); }
          // Capture each article even when an inspection check fails, so a
          // reviewable visual result accompanies every reachable plan.
          let captureStyle = null, captureBefore = null;
          try {
            const article = page.locator('article.leon-model' + attrSelector(plan.id));
            await article.scrollIntoViewIfNeeded();
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            captureBefore = await article.evaluate(element => {
              const box = element.getBoundingClientRect();
              return { width: box.width, height: box.height, articleVisibility: getComputedStyle(element).visibility, headers: [...document.querySelectorAll('body > header.site-header')].map(header => ({ position: getComputedStyle(header).position, visibility: getComputedStyle(header).visibility, outsidePlans: !header.closest('#planos') })) };
            });
            check(captureBefore.headers.length === 1 && captureBefore.headers.every(header => ['fixed', 'sticky'].includes(header.position) && header.visibility === 'visible' && header.outsidePlans), label + ' real global header selector verified before capture', captureBefore.headers, item);
            captureStyle = await page.addStyleTag({ content: 'body > header.site-header{visibility:hidden!important}' });
            const captureDuring = await article.evaluate(element => {
              const box = element.getBoundingClientRect();
              return { width: box.width, height: box.height, articleVisibility: getComputedStyle(element).visibility, headerHidden: [...document.querySelectorAll('body > header.site-header')].every(header => getComputedStyle(header).visibility === 'hidden'), hiddenPlanContents: [...element.querySelectorAll('h3,p,img,dt,dd,a')].filter(node => getComputedStyle(node).visibility === 'hidden').length };
            });
            check(captureDuring.headerHidden && captureDuring.articleVisibility === 'visible' && !captureDuring.hiddenPlanContents && captureDuring.width === captureBefore.width && captureDuring.height === captureBefore.height, label + ' capture hides only the header and preserves article content/layout', captureDuring, item);
            item.capture = { headerSelector: 'body > header.site-header', temporaryVisibility: 'hidden', ...captureDuring, originalHeaderState: captureBefore.headers };
            const file = viewport.name + '-' + projectSlug + '-' + String(projectPlans.indexOf(plan) + 1).padStart(2, '0') + '-' + plan.planSha256.slice(0, 12) + '.png';
            await article.screenshot({ path: resolve(output, file), animations: 'disabled', timeout: 15000 });
            item.screenshot = file; screenshots.push(file); check(true, label + ' article screenshot captured', file, item);
          } catch (error) { check(false, label + ' article screenshot captured', safeError(error), item); }
          finally {
            if (captureStyle) await captureStyle.evaluate(element => element.remove());
            if (captureBefore) {
              const restored = await page.locator('body > header.site-header').evaluateAll(headers => headers.map(header => getComputedStyle(header).visibility));
              const passed = restored.length === captureBefore.headers.length && restored.every((value, index) => value === captureBefore.headers[index].visibility);
              if (item.capture) item.capture.headerRestored = passed;
              check(passed, label + ' normal visible header restored immediately after capture', restored, item);
            }
          }
          check(!currentErrors.length, label + ' no project JavaScript errors', currentErrors, item);
          item.passed = item.checks.length > 0 && item.checks.every(row => row.passed);
          await save(false);
        }
      }
      await context.close();
    }
  } catch (error) { check(false, 'Browser review finished all required cases', safeError(error)); }
  finally { await browser.close(); }
  check(results.length === 108 && results.every(item => item.passed), 'All 36 plans reviewed successfully at all three widths');
  check(results.filter(item => item.originalFetch).length === 36, 'Exactly 36 original first-party desktop fetches');
  check(enlargements.length === 36 && enlargements.every(item => item.passed), 'Exactly 36 successful native original enlargements');
  check(screenshots.length === 108 && new Set(screenshots).size === 108, 'Exactly 108 distinct article PNG screenshots');
  check(!scriptErrors.length, 'No JavaScript page errors at any viewport', scriptErrors);
  check(!requests.firstPartyFailures.length && !requests.oidcOriginViolations && !requests.rejectedRedirects.length, 'No missing first-party resources, rejected redirects or OIDC origin violations', { failures: requests.firstPartyFailures, redirects: requests.rejectedRedirects });
  const completed = checks.every(item => item.passed) && results.length === 108;
  await save(completed);
  console.log(JSON.stringify({ completed, results: results.length, nativeEnlargements: enlargements.length, screenshots: screenshots.length, failures: checks.filter(item => !item.passed).length, report: reportPath }));
  if (!completed) process.exitCode = 1;
}
