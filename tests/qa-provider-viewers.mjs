// Live read-only evidence for each registered viewer host. Provider entry and
// fullscreen controls stay native; no form is submitted or security bypassed.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const base = option('--base', 'http://127.0.0.1:8897');
const output = resolve(option('--output', '/private/tmp/sollahms-auto-providers-browser'));
const width = Number(option('--width', '1440'));
const concurrency = Number(option('--concurrency', '3'));
const loadingTimeout = Number(option('--loading-timeout', '15000'));
const records = JSON.parse(await readFile(resolve(root, 'data/fichas-proyectos.json')));
const preferred = { 'my.matterport.com': 'inn-puerto-chico', 'proyectos.rito3d.cl': 'bcome',
  'luftimages.space': 'vista-llacolen-b', 'mybakerlab.com': 'endemico',
  'www.lanube360.com': 'bosquemar', 'norte-verde.cl': 'vista-bulnes' };
const registered = records.flatMap(record => (record.virtualTours || []).filter(t => t.embedStatus === 'allowed')
  .map(t => ({ slug: record.slug, title: t.title, url: t.url, host: new URL(t.url).hostname,
    historicalVisualResult: t.visualVerification?.result })));
const samples = [...new Set(registered.map(t => t.host))].sort().flatMap(host => {
  const candidates = registered.filter(t => t.host === host);
  const selected = candidates.find(t => t.slug === preferred[host]) || candidates[0];
  return host === 'proyectos.rito3d.cl' ? candidates.filter(t => t.slug === 'bcome') : [selected];
});
const slugFilter = option('--slugs', '').split(',').filter(Boolean);
const selectedSamples = slugFilter.length ? samples.filter(t => slugFilter.includes(t.slug)) : samples;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];

async function inspect(frame) {
  return frame.evaluate(() => {
    const visible = e => {
      const r = e.getBoundingClientRect(), css = getComputedStyle(e);
      if (!(r.width > 10 && r.height > 10 && css.display !== 'none' && css.visibility !== 'hidden')) return false;
      for (let parent = e; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (Number(style.opacity) < 0.05 || style.visibility === 'hidden' || style.display === 'none') return false;
      }
      return true;
    };
    const controls = [...document.querySelectorAll('button,[role="button"],[title],[aria-label]')]
      .filter(visible).map(e => ({ tag: e.tagName, title: e.getAttribute('title'), label: e.getAttribute('aria-label'),
        text: e.textContent?.trim().slice(0, 100), class: typeof e.className === 'string' ? e.className.slice(0, 150) : '' })).slice(0, 100);
    return { url: location.href, title: document.title, text: document.body?.innerText.slice(0, 1400),
      visibleCanvases: [...document.querySelectorAll('canvas')].filter(visible).map(e => ({ width: e.width, height: e.height })),
      loadedVisibleImages: [...document.images].filter(e => visible(e) && e.complete && e.naturalWidth > 50)
        .map(e => ({ src: e.currentSrc, width: e.naturalWidth, height: e.naturalHeight })).slice(0, 12),
      visibleBackgrounds: [...document.querySelectorAll('div')].filter(visible)
        .map(e => ({ background: getComputedStyle(e).backgroundImage, width: Math.round(e.getBoundingClientRect().width),
          height: Math.round(e.getBoundingClientRect().height) }))
        .filter(e => e.background !== 'none' && e.width > 100 && e.height > 100).slice(0, 12),
      visibleLoadingText: [...document.querySelectorAll('div,span,p')].filter(e => !e.childElementCount && visible(e) &&
        /CARGANDO TOUR|loading\.\.\./i.test(e.textContent)).map(e => e.textContent.trim()).slice(0, 4),
      controls, fullscreenEnabled: document.fullscreenEnabled,
      isFullscreen: !!document.fullscreenElement };
  });
}

async function waitForInterface(frame, page, timeout = loadingTimeout) {
  const start = Date.now();
  let evidence;
  while (Date.now() - start < timeout) {
    try {
      evidence = await inspect(frame);
      const stillLoading = evidence.visibleLoadingText.length > 0;
      if (!stillLoading && (evidence.visibleCanvases.length || evidence.loadedVisibleImages.length || evidence.visibleBackgrounds.length || evidence.controls.length > 3)) {
        // Allow provider textures to finish after the interface creates a canvas.
        await page.waitForTimeout(2500);
        return await inspect(frame);
      }
    } catch (e) { evidence = { inspectionError: e.message.slice(0, 200) }; }
    await page.waitForTimeout(500);
  }
  return evidence;
}

async function clickFirstVisible(frame, selectors) {
  for (const selector of selectors) {
    const controls = typeof selector === 'string' ? frame.locator(selector) : frame.getByRole('button', { name: selector });
    for (let i = 0; i < Math.min(await controls.count(), 6); i++) {
      const control = controls.nth(i);
      if (!await control.isVisible().catch(() => false)) continue;
      const description = await control.evaluate(e => ({ tag: e.tagName, title: e.getAttribute('title'),
        label: e.getAttribute('aria-label'), text: e.textContent?.trim().slice(0, 100), class: e.className }));
      try { await control.click({ timeout: 4000 }); return { clicked: true, selector: String(selector), description }; }
      catch (e) { return { clicked: false, selector: String(selector), description, error: e.message.slice(0, 220) }; }
    }
  }
  return { clicked: false, reason: 'native_control_not_exposed' };
}

async function audit(sample, index) {
  const context = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 1000 } });
  if (process.env.VERCEL_OIDC_TOKEN) await context.route(new URL(base).origin + '/**', route => route.continue({
    headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN }
  }));
  const page = await context.newPage();
  const navigations = [], documentFailures = [], consoleErrors = [];
  page.on('request', request => {
    if (request.isNavigationRequest() && request.frame().parentFrame() === page.mainFrame()) navigations.push(request.url());
  });
  page.on('requestfailed', request => {
    if (request.isNavigationRequest()) documentFailures.push({ url: request.url(), error: request.failure()?.errorText });
  });
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 400)); });
  const key = `${String(index).padStart(2, '0')}-${sample.slug}-${width}`;
  const row = { ...sample, width, testedAt: new Date().toISOString(), navigations, documentFailures, consoleErrors };
  try {
    const response = await page.goto(`${base}/${sample.slug}.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    row.status = response.status();
    row.activationButtons = await page.locator('[data-embed-src]').count();
    row.visibleOriginalLinks = await page.getByText('Abrir recorrido original').count();
    row.overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const iframes = page.locator('iframe');
    let element;
    for (let i = 0; i < await iframes.count(); i++) {
      if (await iframes.nth(i).getAttribute('src') === sample.url) { element = iframes.nth(i); break; }
    }
    if (!element) throw new Error('Registered automatic iframe not found');
    row.attributes = await element.evaluate(e => ({ src: e.src, loading: e.loading, title: e.title,
      allow: e.allow, fullscreen: e.allowFullscreen, referrerPolicy: e.referrerPolicy }));
    row.requestedBeforeScroll = navigations.includes(sample.url);
    await element.scrollIntoViewIfNeeded();
    const handle = await element.elementHandle();
    const frame = await handle.contentFrame();
    await frame.waitForURL(sample.url, { timeout: 15000 }).catch(() => {});
    row.automaticNavigationWithoutActivation = navigations.includes(sample.url);
    row.initialInterface = await waitForInterface(frame, page);
    row.initialScreenshot = `${key}-initial.png`;
    await element.screenshot({ path: resolve(output, row.initialScreenshot), timeout: 10000 });
    let activeFrame = frame;
    if (sample.host === 'my.matterport.com' || sample.host === 'mpembed.com') {
      row.nativeEntry = await clickFirstVisible(frame, [ /explore.*3d|explorar.*3d|explorar.*espacio|explore.*space|play|reproducci[oó]n|reproducir/i,
        '#circleLoader', '#showcase-play', '.play-button', 'button[aria-label*="Explore" i]', 'button[aria-label*="Explorar" i]', '[data-testid="showcase-play-button"]' ]);
      if (row.nativeEntry.clicked) {
        if (sample.host === 'mpembed.com') {
          await page.waitForTimeout(5000);
          activeFrame = frame.childFrames().find(f => f.url() !== 'about:blank') || frame;
        }
        row.afterNativeEntry = await waitForInterface(activeFrame, page);
      }
    }
    row.finalInterface = await inspect(activeFrame).catch(e => ({ inspectionError: e.message.slice(0, 200) }));
    row.finalScreenshot = `${key}-viewer.png`;
    await element.screenshot({ path: resolve(output, row.finalScreenshot), timeout: 10000 });
    const fullscreenFrame = sample.host === 'mpembed.com' ? frame : activeFrame;
    row.nativeFullscreen = await clickFirstVisible(fullscreenFrame, [ /full.?screen|pantalla completa|tela cheia|plein écran/i,
      '[title*="fullscreen" i]', '[title*="pantalla completa" i]', '[aria-label*="fullscreen" i]', '[aria-label*="pantalla completa" i]',
      '[data-balloon="Fullscreen"]', '.spl.fullscreen' ]);
    if (!row.nativeFullscreen.clicked && sample.host === 'my.matterport.com' && row.nativeEntry?.clicked) {
      row.nativeViewerMenu = await clickFirstVisible(frame, [ /^men[uú]$/i ]);
      if (row.nativeViewerMenu.clicked) {
        await page.waitForTimeout(300);
        const menuControl = frame.getByText(/pantalla completa|fullscreen/i).first();
        if (await menuControl.isVisible().catch(() => false)) {
          await menuControl.click();
          row.nativeFullscreen = { clicked: true, method: 'native_matterport_menu_fullscreen' };
        }
      }
    }
    // These three 3DVista toolbars draw their controls as unlabeled canvases.
    // Desktop screenshots verified the native expand icon at (567, 477) in
    // the 801x500 viewer; use it only with that exact reviewed geometry.
    if (!row.nativeFullscreen.clicked && sample.host === 'proyectos.rito3d.cl' &&
      /\/paicavi\/depto-(305|311|313)\/$/.test(sample.url) && width === 1440) {
      const box = await element.boundingBox();
      if (Math.abs(box.width - 801) <= 2 && Math.abs(box.height - 500) <= 2) {
        await element.click({ position: { x: 567, y: 477 } });
        row.nativeFullscreen = { clicked: true, method: 'native_expand_icon_from_reviewed_screenshot',
          position: { x: 567, y: 477 }, viewerSize: { width: box.width, height: box.height } };
      }
    }
    if (row.nativeFullscreen.clicked) {
      await page.waitForTimeout(500);
      row.nativeFullscreen.entered = await fullscreenFrame.evaluate(() => !!document.fullscreenElement) || await page.evaluate(() => !!document.fullscreenElement);
      if (row.nativeFullscreen.entered) {
        row.fullscreenScreenshot = `${key}-fullscreen.png`;
        await page.screenshot({ path: resolve(output, row.fullscreenScreenshot) });
      }
      await page.keyboard.press('Escape');
    }
    row.passAutomaticStructure = row.status === 200 && row.activationButtons === 0 && row.visibleOriginalLinks === 0 &&
      row.automaticNavigationWithoutActivation && row.attributes.loading === 'lazy' && row.attributes.fullscreen &&
      row.attributes.referrerPolicy === 'strict-origin-when-cross-origin' && row.overflow <= 2;
    row.visualReview = 'pending_screenshot_review';
  } catch (e) { row.error = e.message.slice(0, 500); row.passAutomaticStructure = false; }
  finally {
    await writeFile(resolve(output, `${key}.json`), JSON.stringify(row, null, 2) + '\n');
    await context.close();
  }
  results.push(row);
  console.log(JSON.stringify({ slug: sample.slug, host: sample.host, title: sample.title,
    auto: row.automaticNavigationWithoutActivation, canvases: row.finalInterface?.visibleCanvases?.length,
    images: row.finalInterface?.loadedVisibleImages?.length, entry: row.nativeEntry?.clicked,
    fullscreen: row.nativeFullscreen?.entered, structuralPass: row.passAutomaticStructure, error: row.error }));
}

let index = 0, externalAlternative;
try {
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (index < selectedSamples.length) { const current = index++; await audit(selectedSamples[current], current); }
  }));
  const context = await browser.newContext({ viewport: { width, height: 1000 } });
  if (process.env.VERCEL_OIDC_TOKEN) await context.route(new URL(base).origin + '/**', route => route.continue({
    headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN }
  }));
  const page = await context.newPage();
  await page.goto(`${base}/endemico.html`, { waitUntil: 'domcontentloaded' });
  const url = 'https://mybakerlab.com/endemico/';
  externalAlternative = await page.evaluate(url => ({ slug: 'endemico', url,
    iframeCount: [...document.querySelectorAll('iframe')].filter(f => f.src === url).length,
    linkCount: [...document.querySelectorAll('a')].filter(a => a.href === url).length,
    links: [...document.querySelectorAll('a')].filter(a => a.href === url).map(a => ({ text: a.textContent.trim(), rel: a.rel, target: a.target })),
    activationButtons: document.querySelectorAll('[data-embed-src]').length }), url);
  await page.getByText('Recorrido 2 · Endémico Pichilemu', { exact: true }).scrollIntoViewIfNeeded();
  externalAlternative.screenshot = `endemico-external-alternative-${width}.png`;
  await page.screenshot({ path: resolve(output, externalAlternative.screenshot) });
  externalAlternative.passed = externalAlternative.iframeCount === 0 && externalAlternative.linkCount === 1 && externalAlternative.activationButtons === 0;
  await context.close();
} finally { await browser.close(); }
for (const row of results) {
  if (row.finalScreenshot) row.screenshotSha256 = createHash('sha256').update(await readFile(resolve(output, row.finalScreenshot))).digest('hex');
}
const report = { base, width, sampleCount: results.length, hostCount: new Set(results.map(r => r.host)).size,
  readOnly: true, providerRequestsAllowed: true, screenshotsRequireVisualReview: true,
  automaticStructurePassed: results.every(r => r.passAutomaticStructure) && externalAlternative?.passed,
  externalAlternative, results: results.sort((a, b) => a.host.localeCompare(b.host) || a.url.localeCompare(b.url)) };
await writeFile(resolve(output, 'provider-results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ sampleCount: report.sampleCount, hostCount: report.hostCount,
  automaticStructurePassed: report.automaticStructurePassed, externalAlternativePassed: externalAlternative?.passed,
  visualReview: 'pending_screenshot_review' }));
process.exitCode = report.automaticStructurePassed ? 0 : 1;
