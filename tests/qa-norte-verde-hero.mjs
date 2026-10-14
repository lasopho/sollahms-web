// Presentation-only hero review. Every write and external service is intercepted.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const { PNG } = require('pngjs');
const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const base = option('--base', 'http://127.0.0.1:8090').replace(/\/$/, '');
const origin = new URL(base).origin;
const source = option('--source', '/private/tmp/norte-verde-hero-source');
const output = resolve(option('--output', '/private/tmp/norte-verde-hero-review/qa'));
const quick = process.argv.includes('--quick');
const variants = ['lateral', 'envolvente', 'contenida'];
const viewports = [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 375, height: 844 }];
const slugs = ['bordevivo', 'edificio-verne', 'quintavista', 'playa-serena'];
const manifest = JSON.parse(await readFile(resolve(source, 'data/brochures-norte-verde.json')));
const records = manifest.projects;
const rows = [], checks = [], comparisons = [], controls = [], screenshots = [];
const requests = { writesBlocked: [], externalIsolated: 0, httpFailures: [], requestFailures: [] };
const reportPath = resolve(output, 'report.json');
const check = (passed, label, evidence) => checks.push({ passed: !!passed, label, ...(evidence === undefined ? {} : { evidence }) });
const digest = value => createHash('sha256').update(value).digest('hex');
const version = async () => Object.fromEntries(await Promise.all(['assets/css/norte-verde-hero-variants.css', 'assets/js/norte-verde-hero-variants.js', 'assets/review/norte-verde-hero-variantes.html'].map(async path => [path, digest(await readFile(resolve(source, path)))])));
const initialVersion = await version();
let finalVersion = null;
const snapshot = completed => ({ base, completed, quick, methodology: 'Isolated Chrome contexts at requested CSS viewports. Text is temporarily hidden with visibility without changing layout to sample the actual composited background under every rendered text rectangle. Foreground color and opacity are measured before masking. Image framing geometry and source scaling are reported; architecture anchors require visual inspection. All writes and external services are blocked or replaced with fixtures. External font stylesheets are replaced by empty fixtures, so screenshots use installed fallback fonts. OIDC, when supplied, is attached only to the deployment origin and is never persisted.', initialVersion, finalVersion, rows, comparisons, controls, requests, screenshots, checks, failures: checks.filter(row => !row.passed) });
await mkdir(output, { recursive: true });
const save = async (completed = false) => writeFile(reportPath, JSON.stringify(snapshot(completed), null, 2) + '\n');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const contextFor = async (viewport, missingAsset = null) => {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) { requests.writesBlocked.push({ path: url.pathname, method: request.method() }); return route.abort(); }
    if (url.origin === origin) {
      if (missingAsset === url.pathname) return route.fulfill({ status: 404, contentType: 'text/plain', body: 'Intentional missing hero image fixture' });
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false,"code":"preview_read_only"}' });
      return route.continue(process.env.VERCEL_OIDC_TOKEN ? { headers: { ...request.headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } } : {});
    }
    requests.externalIsolated++;
    if (request.isNavigationRequest()) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><title>External service isolated for QA</title><body style="margin:0;background:#e5e7eb"></body></html>' });
    if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    return route.abort();
  });
  context.on('response', response => { const url = new URL(response.url()); if (url.origin === origin && response.status() >= 400 && url.pathname !== missingAsset && !url.pathname.startsWith('/api/')) requests.httpFailures.push({ path: url.pathname, status: response.status() }); });
  context.on('requestfailed', request => { const url = new URL(request.url()); if (url.origin === origin && url.pathname !== missingAsset && request.failure()?.errorText !== 'net::ERR_ABORTED') requests.requestFailures.push({ path: url.pathname, type: request.resourceType(), error: request.failure()?.errorText }); });
  return context;
};
const linear = channel => { const c = channel / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
const luminance = rgb => .2126 * linear(rgb[0]) + .7152 * linear(rgb[1]) + .0722 * linear(rgb[2]);
const contrast = (a, b) => { const [dark, light] = [luminance(a), luminance(b)].sort((x, y) => x - y); return (light + .05) / (dark + .05); };
const collect = page => page.evaluate(() => {
  const hero = document.querySelector('.nv-hero'), image = hero.querySelector('.hero-image'), content = hero.querySelector('.hero-content');
  const bounds = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
  const heroRect = bounds(hero), imageRect = bounds(image), imageCSS = getComputedStyle(image);
  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT), text = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim()) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    const element = node.parentElement, style = getComputedStyle(element);
    let opacity = 1; for (let ancestor = element; ancestor && ancestor !== hero.parentElement; ancestor = ancestor.parentElement) opacity *= Number(getComputedStyle(ancestor).opacity);
    text.push({ value: node.textContent.trim(), color: style.color, opacity, fontSize: parseFloat(style.fontSize), fontWeight: Number(style.fontWeight), rects: [...range.getClientRects()].map(r => ({ x: r.x - heroRect.x, y: r.y - heroRect.y, width: r.width, height: r.height, right: r.right - heroRect.x, bottom: r.bottom - heroRect.y })) });
  }
  const css = getComputedStyle(hero);
  const fit = imageCSS.objectFit, natW = image.naturalWidth, natH = image.naturalHeight;
  const scale = fit === 'contain' ? Math.min(imageRect.width / natW, imageRect.height / natH) : Math.max(imageRect.width / natW, imageRect.height / natH);
  const drawW = natW * scale, drawH = natH * scale;
  const positions = imageCSS.objectPosition.split(' ').map(value => value.endsWith('%') ? parseFloat(value) / 100 : .5);
  const offsetX = (imageRect.width - drawW) * positions[0], offsetY = (imageRect.height - drawH) * positions[1];
  const sourceLeft = Math.max(0, (Math.max(imageRect.x, heroRect.x) - imageRect.x - offsetX) / scale);
  const sourceTop = Math.max(0, (Math.max(imageRect.y, heroRect.y) - imageRect.y - offsetY) / scale);
  const sourceRight = Math.min(natW, (Math.min(imageRect.right, heroRect.right) - imageRect.x - offsetX) / scale);
  const sourceBottom = Math.min(natH, (Math.min(imageRect.bottom, heroRect.bottom) - imageRect.y - offsetY) / scale);
  return { actualWidth: innerWidth, actualHeight: innerHeight, heading: document.querySelector('h1').textContent.trim(), mode: document.documentElement.dataset.nvHeroVariant ?? null, heroMode: hero.dataset.nvHeroVariant ?? null, slug: hero.dataset.nvHeroSlug, heroRect, imageRect, contentRect: bounds(content), text,
    background: css.backgroundColor, gradient: getComputedStyle(hero.querySelector('.hero-shade')).backgroundImage, solidWidth: css.getPropertyValue('--nv-solid-width').trim(),
    image: { path: new URL(image.src).pathname, loaded: image.complete && natW > 0, nativeWidth: natW, nativeHeight: natH, objectFit: fit, objectPosition: imageCSS.objectPosition, maskImage: imageCSS.maskImage, scale, drawnWidth: drawW, drawnHeight: drawH, sourceCrop: { x: sourceLeft, y: sourceTop, width: Math.max(0, sourceRight - sourceLeft), height: Math.max(0, sourceBottom - sourceTop) } },
    overflow: document.documentElement.scrollWidth - innerWidth, models: document.querySelectorAll('.nv-model').length, galleryImages: document.querySelectorAll('.gallery-grid img').length,
    sectionsVisible: [...document.querySelectorAll('.section-nav,.project-layout,.site-footer')].every(element => getComputedStyle(element).display !== 'none'),
    consultation: [...document.querySelectorAll('a[href]')].some(a => new URL(a.href).pathname === '/contacto.html' && new URL(a.href).searchParams.get('proyecto') === hero.dataset.nvHeroSlug),
    booking: [...document.querySelectorAll('a[href]')].some(a => new URL(a.href).pathname === '/agenda-asesoria.html' && new URL(a.href).searchParams.get('proyecto') === hero.dataset.nvHeroSlug)
  };
});
const sampleBackground = (png, text) => {
  const rows = [], target = [0, 50, 41];
  for (const run of text) {
    const effective = run.color.match(/[\d.]+/g).slice(0, 3).map((value, index) => Number(value) * run.opacity + target[index] * (1 - run.opacity));
    const threshold = run.fontSize >= 24 || (run.fontSize >= 18.6667 && run.fontWeight >= 700) ? 3 : 4.5;
    let samples = 0, nonSolid = 0, worst = Infinity, maxDeviation = 0;
    for (const rect of run.rects) {
      const left = Math.max(0, Math.ceil(rect.x)), right = Math.min(png.width, Math.floor(rect.right)), top = Math.max(0, Math.ceil(rect.y)), bottom = Math.min(png.height, Math.floor(rect.bottom));
      for (let y = top; y < bottom; y += 2) for (let x = left; x < right; x += 2) {
        const offset = (y * png.width + x) * 4, pixel = [...png.data.subarray(offset, offset + 3)];
        const deviation = Math.max(...pixel.map((v, i) => Math.abs(v - target[i])));
        samples++; if (deviation) nonSolid++; maxDeviation = Math.max(maxDeviation, deviation); worst = Math.min(worst, contrast(effective, pixel));
      }
    }
    rows.push({ value: run.value, samples, nonSolid, maxDeviation, minimumContrast: worst, requiredContrast: threshold, passedSolid: samples > 0 && nonSolid === 0, passedContrast: samples > 0 && worst >= threshold });
  }
  return rows;
};
const inspect = async (slug, mode, viewport, group = 'representative') => {
  const context = await contextFor(viewport), page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const name = `${viewport.width}-${slug}-${mode}`, prefix = name;
  try {
    const response = await page.goto(base + '/' + slug + '.html?encabezado=' + mode, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(mode => document.querySelector('.nv-hero')?.dataset.nvHeroVariant === mode, mode);
    await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].filter(link => new URL(link.href).origin === location.origin).every(link => !!link.sheet));
    const image = page.locator('.nv-hero .hero-image');
    await image.evaluate(async element => { if (!element.complete || !element.naturalWidth) await new Promise((resolve, reject) => { element.addEventListener('load', resolve, { once: true }); element.addEventListener('error', reject, { once: true }); }); await element.decode(); });
    const evidence = await collect(page), record = records.find(record => record.slug === slug), cover = record.images.find(asset => asset.localPath === record.cover);
    check(response.status() === 200, prefix + ' HTTP 200');
    check(evidence.actualWidth === viewport.width && evidence.actualHeight === viewport.height, prefix + ' actual viewport');
    check(evidence.mode === mode && evidence.heroMode === mode && evidence.slug === slug, prefix + ' selected variant and slug');
    check(evidence.heading === record.name, prefix + ' original heading');
    check(evidence.background === 'rgb(0, 50, 41)', prefix + ' solid hero fallback color');
    check(evidence.overflow === 0, prefix + ' zero page overflow', evidence.overflow);
    check(evidence.image.loaded && evidence.image.path === record.cover && evidence.image.nativeWidth === cover.width && evidence.image.nativeHeight === cover.height, prefix + ' exact own-project cover decoded');
    check(['cover', 'contain'].includes(evidence.image.objectFit), prefix + ' image proportions preserved');
    check(evidence.models === record.models.length && evidence.galleryImages === record.images.length, prefix + ' gallery and all plans preserved');
    check(evidence.sectionsVisible && evidence.consultation && evidence.booking, prefix + ' complete fiche and contextual links remain');
    check(!errors.length, prefix + ' no script errors', errors);
    for (const run of evidence.text) check(run.rects.every(r => r.x >= -1 && r.y >= -1 && r.right <= evidence.heroRect.width + 1 && r.bottom <= evidence.heroRect.height + 1), prefix + ' text fits hero ' + run.value);
    const heroFile = name + '-hero.png', viewportFile = name + '-viewport.png';
    await page.locator('.nv-hero').screenshot({ path: resolve(output, heroFile) }); await page.screenshot({ path: resolve(output, viewportFile) }); screenshots.push(heroFile, viewportFile);
    // visibility preserves layout and hides the text instantly; changing color
    // would trigger the links' existing 200 ms transition and taint pixel samples.
    const style = await page.addStyleTag({ content: '.nv-hero .hero-content { visibility: hidden !important; }' });
    const background = sampleBackground(PNG.sync.read(await page.locator('.nv-hero').screenshot()), evidence.text);
    await style.evaluate(element => element.remove());
    for (const run of background) { check(run.passedSolid, prefix + ' exact solid RGB under ' + run.value, run); check(run.passedContrast, prefix + ' contrast under ' + run.value, run.minimumContrast); }
    rows.push({ group, slug, mode, viewport, ...evidence, background, errors, screenshots: [heroFile, viewportFile] }); await save();
  } finally { await context.close(); }
};
const comparison = async viewport => {
  const context = await contextFor(viewport), page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(base + '/assets/review/norte-verde-hero-variantes.html', { waitUntil: 'domcontentloaded' });
    for (const slug of slugs) {
      await page.locator('#project').selectOption(slug);
      for (const width of [1440, 768, 375]) {
        await page.locator('#viewport').selectOption(String(width));
        for (const mode of [...variants, 'actual']) {
          await page.locator('[data-variant="' + mode + '"]').click();
          await page.waitForFunction(({ width, mode, slug }) => {
            const iframe = document.querySelector('#main-frame'), doc = iframe?.contentDocument;
            return iframe?.parentElement.hasAttribute('data-ready') && iframe?.contentWindow.innerWidth === width && doc?.querySelector('.nv-hero')?.dataset.nvHeroSlug === slug && (doc.documentElement.dataset.nvHeroVariant ?? 'actual') === mode && iframe.contentWindow.innerHeight === Math.ceil(doc.querySelector('.nv-hero').getBoundingClientRect().height);
          }, { width, mode, slug });
          const evidence = await page.evaluate(() => {
            const main = document.querySelector('#main-frame');
            return { label: document.querySelector('#main-label').textContent, fullLink: document.querySelector('#full-link').getAttribute('href'), pressed: [...document.querySelectorAll('[data-variant][aria-pressed="true"]')].map(button => button.dataset.variant), overflow: document.documentElement.scrollWidth - innerWidth,
              frameWidth: main.contentWindow.innerWidth, frameHeight: main.contentWindow.innerHeight, heroHeight: main.contentDocument.querySelector('.nv-hero').getBoundingClientRect().height, hiddenFiche: getComputedStyle(main.contentDocument.querySelector('.project-layout')).display === 'none',
              compare: [...document.querySelectorAll('[data-compare]')].map(frame => ({ mode: frame.dataset.compare, width: frame.contentWindow.innerWidth, heroMode: frame.contentDocument?.documentElement.dataset.nvHeroVariant, slug: frame.contentDocument?.querySelector('.nv-hero')?.dataset.nvHeroSlug })) };
          });
          const prefix = `comparison ${viewport.width} ${slug} ${width} ${mode}`;
          check(evidence.frameWidth === width && evidence.frameHeight === Math.ceil(evidence.heroHeight), prefix + ' actual iframe viewport and fitted height', evidence);
          check(evidence.pressed.length === 1 && evidence.pressed[0] === mode, prefix + ' active option');
          check(evidence.label.includes(records.find(record => record.slug === slug).name), prefix + ' selected project name');
          check(evidence.fullLink === '/' + slug + '.html' + (mode === 'actual' ? '' : '?encabezado=' + mode), prefix + ' complete fiche link');
          check(evidence.overflow === 0 && evidence.hiddenFiche, prefix + ' bounded hero-only comparison');
          comparisons.push({ viewport: viewport.width, slug, selectedWidth: width, mode, ...evidence });
        }
        await page.waitForFunction(({ width, slug }) => [...document.querySelectorAll('[data-compare]')].every(frame => frame.contentWindow.innerWidth === width && frame.contentDocument?.querySelector('.nv-hero')?.dataset.nvHeroSlug === slug), { width, slug });
      }
    }
    for (const mode of variants) {
      await page.locator('[data-show="' + mode + '"]').click();
      await page.waitForFunction(mode => document.querySelector('[data-variant="' + mode + '"]').getAttribute('aria-pressed') === 'true', mode);
      check(true, 'comparison ' + viewport.width + ' enlarge card selects ' + mode);
    }
    for (const mode of ['contenida', 'actual']) {
      await page.locator('[data-variant="' + mode + '"]').click();
      const [popup] = await Promise.all([page.waitForEvent('popup'), page.locator('#full-link').click()]);
      await popup.waitForLoadState('domcontentloaded');
      await popup.waitForFunction(() => !!document.querySelector('.nv-hero')?.dataset.nvHeroSlug);
      const evidence = await popup.evaluate(() => ({ slug: document.querySelector('.nv-hero').dataset.nvHeroSlug, mode: document.documentElement.dataset.nvHeroVariant ?? 'actual', full: getComputedStyle(document.querySelector('.project-layout')).display !== 'none', reviewOnly: document.documentElement.dataset.nvHeroReview ?? null }));
      check(evidence.slug === 'playa-serena' && evidence.mode === mode && evidence.full && evidence.reviewOnly === null, 'comparison ' + viewport.width + ' complete fiche opens with ' + mode, evidence); await popup.close();
    }
    check(!errors.length, 'comparison ' + viewport.width + ' no script errors', errors);
    const filename = `comparison-${viewport.width}.png`; await page.screenshot({ path: resolve(output, filename), fullPage: true }); screenshots.push(filename); await save();
  } finally { await context.close(); }
};
try {
  if (quick) for (const viewport of [viewports[0], viewports[2]]) for (const mode of variants) await inspect('bordevivo', mode, viewport);
  else {
    for (const viewport of viewports) for (const slug of slugs) for (const mode of variants) await inspect(slug, mode, viewport);
    for (const viewport of [viewports[1], viewports[2]]) for (const mode of variants) await inspect('vicuna-mackenna-6896', mode, viewport, 'long-title');
    for (const viewport of viewports) await comparison(viewport);
    for (const viewport of viewports) {
      const context = await contextFor(viewport), page = await context.newPage();
      try { await page.goto(base + '/bordevivo.html', { waitUntil: 'domcontentloaded' }); const evidence = await collect(page); check(evidence.mode === null && evidence.heroMode === null && evidence.sectionsVisible, 'default unchanged at ' + viewport.width); controls.push({ type: 'default', viewport: viewport.width, ...evidence }); } finally { await context.close(); }
    }
    const record = records.find(record => record.slug === 'bordevivo');
    const context = await contextFor(viewports[0], record.cover), page = await context.newPage();
    try {
      await page.goto(base + '/bordevivo.html?encabezado=lateral', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.querySelector('.nv-hero').dataset.nvHeroImageUnavailable === '1');
      const evidence = await page.evaluate(() => ({ background: getComputedStyle(document.querySelector('.nv-hero')).backgroundColor, image: getComputedStyle(document.querySelector('.hero-image')).visibility, shade: getComputedStyle(document.querySelector('.hero-shade')).backgroundColor, heading: document.querySelector('h1').textContent.trim() }));
      check(evidence.background === 'rgb(0, 50, 41)' && evidence.shade === 'rgb(0, 50, 41)' && evidence.image === 'hidden' && evidence.heading === record.name, 'missing image keeps solid green readable fallback', evidence); controls.push({ type: 'missing-image', ...evidence });
    } finally { await context.close(); }
  }
} catch (error) { check(false, 'Browser verification stopped: ' + error.message); await save(); }
finally { await browser.close(); }
finalVersion = await version();
check(JSON.stringify(initialVersion) === JSON.stringify(finalVersion), 'Reviewed CSS/JS/comparison source remained stable during run', { initialVersion, finalVersion });
check(!requests.writesBlocked.length, 'No form or other writes attempted', requests.writesBlocked);
check(!requests.httpFailures.length && !requests.requestFailures.length, 'No first-party HTTP or connection failures', { http: requests.httpFailures, connection: requests.requestFailures });
const completed = rows.length === (quick ? 6 : 42) && checks.every(row => row.passed);
await save(completed);
console.log(JSON.stringify({ completed, cases: rows.length, comparisonChecks: comparisons.length, checks: checks.length, failures: checks.filter(row => !row.passed).length, report: reportPath }));
if (!completed) process.exitCode = 1;
