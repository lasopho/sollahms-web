// Focused, read-only browser QA of Indi's protected façade cover.
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const base = option('--base', 'http://127.0.0.1:8914').replace(/\/$/, '');
const origin = new URL(base).origin;
const output = resolve(option('--output', '/private/tmp/sollahms-indi-cover-qa'));
const slug = 'edificio-indi';
const projects = JSON.parse(await readFile(resolve(root, 'data/proyectos.json')));
const research = JSON.parse(await readFile(resolve(root, 'data/fichas-proyectos.json')));
const review = JSON.parse(await readFile(resolve(root, 'data/brochures-leben.json')));
const project = projects.find(project => project.slug === slug);
const ficha = research.find(record => record.slug === slug);
const record = review.projects.find(record => record.slug === slug);
const asset = record.images.find(image => image.localPath === record.catalogueCover?.localPath);
if (!asset) throw new Error('Indi cover must bind an accepted image of the same project.');
const assetBytes = await readFile(resolve(root, asset.localPath.slice(1)));
const checksum = createHash('sha256').update(assetBytes).digest('hex');
const contexts = ['desktop', 'tablet', 'mobile', 'mobile-small'].flatMap(name => [1, 2].map(dpr => ({
  name: name + '-dpr' + dpr, dpr,
  width: name === 'desktop' ? 1440 : name === 'tablet' ? 768 : name === 'mobile-small' ? 320 : 390,
  height: name === 'desktop' ? 1000 : name === 'tablet' ? 1024 : 844,
})));
const references = ['edificio-suecia', 'inn-puerto-chico'];
const checks = [], views = [], popups = [], screenshots = [], activeContexts = new Set();
const requests = { isolatedProviders: 0, fontRequests: 0, blockedWrites: [], httpFailures: [], transportFailures: [] };
const check = (passed, label) => checks.push({ passed: !!passed, label });
const httpFailure = (path, status) => { if (!requests.httpFailures.some(failure => failure.path === path && failure.status === status)) requests.httpFailures.push({ path, status }); };
const sourceEvidence = { localPath: asset.localPath, sha256: checksum, manifestSha256: asset.sha256,
  sourcePdfSha256: asset.sourceSha256, sourcePage: asset.sourcePage,
  sourceImageSha256: asset.sourceImageSha256, nativeWidth: asset.nativeWidth,
  nativeHeight: asset.nativeHeight, width: asset.width, height: asset.height,
  sourceEncodedStream: asset.sourceEncodedStream,
  unchangedOriginalBytes: checksum === (asset.sourceEncodedStream?.sha256 ?? asset.sourceImageSha256),
  policy: 'No source recompression or invented pixels. Effective contain/cover drawing geometry is measured separately from the image element box.',
};
await mkdir(output, { recursive: true });
const save = async (completed = false) => {
  const result = { base, completed, contexts, sourceEvidence, views, checks, popups, screenshots, requests,
    limitations: 'Provider frames are isolated for layout only; no live-tour or map-position claim. No formulas or stock data are changed.',
    failures: checks.filter(check => !check.passed) };
  await writeFile(resolve(output, 'report.next.json'), JSON.stringify(result, null, 2) + '\n');
  await rename(resolve(output, 'report.next.json'), resolve(output, 'report.json'));
};

// This function runs in a read-only DOM scope. It measures the rendered source
// rectangle, rather than assuming a full-bleed element stretches its pixels.
function geometry(image, expected) {
  const box = image.getBoundingClientRect(), style = getComputedStyle(image);
  const fit = style.objectFit;
  const sx = box.width / expected.width, sy = box.height / expected.height;
  const scale = fit === 'contain' ? Math.min(sx, sy) : fit === 'cover' ? Math.max(sx, sy) : sx;
  const drawnWidth = expected.width * scale, drawnHeight = expected.height * scale;
  const positions = style.objectPosition.split(/\s+/);
  const position = (value, difference) => value.endsWith('%') ? difference * parseFloat(value) / 100 : parseFloat(value) || 0;
  const offsetX = position(positions[0] ?? '50%', box.width - drawnWidth);
  const offsetY = position(positions[1] ?? '50%', box.height - drawnHeight);
  const left = Math.max(0, -offsetX / scale), top = Math.max(0, -offsetY / scale);
  const right = Math.min(expected.width, (box.width - offsetX) / scale);
  const bottom = Math.min(expected.height, (box.height - offsetY) / scale);
  const visible = { left: left / expected.width, top: top / expected.height,
    right: right / expected.width, bottom: bottom / expected.height };
  const contains = point => point.x >= visible.left && point.x <= visible.right && point.y >= visible.top && point.y <= visible.bottom;
  return { path: new URL(image.currentSrc || image.src).pathname, naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight, decoded: image.complete && image.naturalWidth > 0,
    alt: image.alt, fit, objectPosition: style.objectPosition,
    box: { x: box.x, y: box.y, width: box.width, height: box.height },
    drawing: { x: box.x + offsetX, y: box.y + offsetY, width: drawnWidth, height: drawnHeight },
    visible, croppedFraction: 1 - (right - left) * (bottom - top) / (expected.width * expected.height),
    sourcePixelsPerDevicePixel: 1 / (scale * devicePixelRatio), scaleTimesDpr: scale * devicePixelRatio,
    // Landmarks reviewed in the authentic native façade render.
    crownVisible: contains({ x: .14, y: .11 }), accessVisible: contains({ x: .62, y: .89 }),
    dpr: devicePixelRatio, viewport: { width: innerWidth, height: innerHeight },
  };
}

// Compare actual computed styles of the featured component, not a mock design.
function featuredStyle(section, indi) {
  const image = section.querySelector('img'), shade = indi ? section.querySelector('.hero-shade') : image.nextElementSibling;
  const content = indi ? section.querySelector('.hero-content') : shade.nextElementSibling;
  const title = section.querySelector('h1'), eyebrow = indi ? content.querySelector('.eyebrow') : content.firstElementChild;
  const location = indi ? content.querySelector('.hero-location') : content.lastElementChild.querySelector('span:last-child');
  const t = getComputedStyle(title), e = getComputedStyle(eyebrow), l = getComputedStyle(location);
  const c = getComputedStyle(content), s = getComputedStyle(shade), i = getComputedStyle(image);
  const frame = section.getBoundingClientRect(), photo = image.getBoundingClientRect(), text = content.getBoundingClientRect();
  return { titleSize: t.fontSize, titleLineHeight: t.lineHeight, titleWeight: t.fontWeight, titleTracking: t.letterSpacing,
    titleColor: t.color, titleMarginBottom: t.marginBottom, titleFamily: t.fontFamily,
    eyebrowSize: e.fontSize, eyebrowTracking: e.letterSpacing, eyebrowColor: e.color, eyebrowMarginBottom: e.marginBottom,
    locationSize: l.fontSize, locationLineHeight: l.lineHeight, locationWeight: l.fontWeight, locationColor: l.color,
    contentLeft: text.left - frame.left, contentMaxWidth: c.maxWidth, contentBottom: frame.bottom - text.bottom,
    gradient: s.backgroundImage, heroHeight: frame.height, contentAbsolute: c.position === 'absolute',
    imageAbsolute: i.position === 'absolute', overlayVisible: s.display !== 'none' && s.backgroundImage !== 'none',
    imageFillsHero: Math.abs(photo.width - frame.width) < 1 && Math.abs(photo.height - frame.height) < 1,
    fontLoaded: document.fonts.check('800 48px Manrope'),
  };
}

let browser;
try {
  check(projects.length === 137 && projects.filter(project => project.inmobiliaria === 'Ecasa').length === 15, '137 projects and fifteen Ecasa remain');
  check(project.precioDesdeUF === 2560 && project.estado === 'Entrega inmediata' && project.direccion === 'Vallenar 2070, esquina Hipódromo', 'Indi commercial facts remain exact');
  check(checksum === asset.sha256 && asset.qualityDecision === 'keep' && asset.sourcePage === 2 && asset.sourceSha256 === record.document.sha256, 'cover hashes and same-project PDF page provenance');
  check(asset.sourceEncodedStream?.format === 'JPEG' && sourceEvidence.unchangedOriginalBytes, 'authentic JPEG stream copied without recompression');
  check(asset.width === 2113 && asset.height === 1335 && asset.width <= asset.nativeWidth && asset.height <= asset.nativeHeight, 'native 2113x1335 façade without encoded enlargement');
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const viewport of contexts) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.dpr });
    const lifecycle = { context, closing: false }; activeContexts.add(lifecycle);
    await context.route('**/*', async route => {
      if (lifecycle.closing) return;
      const request = route.request(), url = new URL(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) { requests.blockedWrites.push({ method: request.method(), path: url.pathname }); return route.abort(); }
      if (url.origin === origin) {
        if (!process.env.VERCEL_OIDC_TOKEN) return route.continue();
        try {
          const response = await route.fetch({ headers: { ...request.headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN }, maxRedirects: 0, timeout: 60000 });
          if (response.status() >= 400) httpFailure(url.pathname, response.status());
          return await route.fulfill({ response });
        } catch (error) {
          if (lifecycle.closing && /context disposed|has been closed|TargetClosedError/i.test(error.message)) return;
          requests.transportFailures.push({ path: url.pathname, type: error.name });
          throw new Error('Protected GET failed for ' + url.pathname + ': ' + error.name);
        }
      }
      if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) { requests.fontRequests++; return route.continue(); }
      requests.isolatedProviders++;
      if (request.isNavigationRequest()) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Provider isolated for layout QA</title>' });
      return route.abort();
    });
    context.on('response', response => { if (new URL(response.url()).origin === origin && response.status() >= 400) httpFailure(new URL(response.url()).pathname, response.status()); });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(base + '/proyectos.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('#search')?.disabled && document.querySelectorAll('.catalog-card').length === 137);
    check(response.status() === 200, viewport.name + ' catalogue HTTP 200');
    await page.locator('#search').fill('Ecasa');
    check(await page.locator('.catalog-card').count() === 15, viewport.name + ' fifteen Ecasa catalogue results');
    await page.locator('#search').fill('Own');
    check(await page.locator('.catalog-card[data-project="own"]').count() === 1, viewport.name + ' Own retained');
    await page.locator('#search').fill('Indi');
    await page.waitForFunction(() => document.querySelectorAll('.catalog-card').length === 2 || document.querySelectorAll('.catalog-card').length === 1);
    const card = page.locator('.catalog-card[data-project="edificio-indi"]');
    check(await card.count() === 1, viewport.name + ' one Indi card');
    await card.scrollIntoViewIfNeeded(); await card.locator('img').evaluate(image => image.decode());
    const cover = await card.locator('img').evaluate(geometry, asset);
    check(cover.path === asset.localPath && cover.decoded && cover.naturalWidth === asset.width && cover.naturalHeight === asset.height, viewport.name + ' native catalogue façade');
    check(cover.dpr === viewport.dpr && cover.viewport.width === viewport.width && cover.viewport.height === viewport.height, viewport.name + ' actual viewport and DPR');
    check(cover.crownVisible && cover.accessVisible && cover.scaleTimesDpr <= 1.01, viewport.name + ' catalogue crown/access and device sampling');
    check((await card.innerText()).includes('2.560') && await card.locator('.catalog-cover').getAttribute('href') === project.detalleUrl, viewport.name + ' card price and slug');
    const cardFile = viewport.name + '-catalogue-card.png'; await card.screenshot({ path: resolve(output, cardFile) }); screenshots.push(cardFile);
    views.push({ context: viewport.name, kind: 'catalogue', geometry: cover }); await save();
    await Promise.all([page.waitForURL(base + project.detalleUrl, { waitUntil: 'domcontentloaded' }), card.locator('.catalog-cover').click()]);
    await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].filter(link => new URL(link.href).origin === location.origin).every(link => link.sheet));
    const hero = page.locator('.project-hero-indi-preview .hero-image-indi-preview');
    await hero.evaluate(image => image.decode());
    await page.evaluate(() => document.fonts.ready);
    const detail = await hero.evaluate(geometry, asset);
    check(detail.path === cover.path && detail.naturalWidth === asset.width && detail.naturalHeight === asset.height && detail.decoded, viewport.name + ' same native façade in card and detail');
    check(detail.fit === 'cover' && detail.croppedFraction <= (viewport.width <= 360 ? .51 : .43) && detail.crownVisible && detail.accessVisible, viewport.name + ' responsive cover keeps roof and access without empty bands');
    check(detail.scaleTimesDpr / viewport.dpr <= 1.01, viewport.name + ' original source covers CSS frame without encoded upscaling');
    const pageEvidence = await page.evaluate(({ slug, oldPath }) => {
      const h1 = document.querySelector('h1'), title = h1.getBoundingClientRect();
      const content = document.querySelector('.project-hero-indi-preview .hero-content').getBoundingClientRect();
      const image = document.querySelector('.hero-image-indi-preview').getBoundingClientRect();
      const header = document.querySelector('.site-header').getBoundingClientRect();
      const frames = [...document.querySelectorAll('iframe')].map(frame => ({ src: frame.src, loading: frame.loading, title: frame.title, referrer: frame.referrerPolicy }));
      const actions = route => [...document.querySelectorAll('a[href]')].some(anchor => new URL(anchor.href).pathname === '/' + route + '.html' && new URL(anchor.href).searchParams.get('proyecto') === slug);
      return { heading: h1.textContent.trim(), title: { top: title.top, bottom: title.bottom }, headerBottom: header.bottom,
        titleVisibleInitially: title.top >= header.bottom && title.bottom <= innerHeight,
        contentOverImage: content.top >= image.top && content.bottom <= image.bottom && title.top >= image.top && title.bottom <= image.bottom, overflow: document.documentElement.scrollWidth - innerWidth,
        oldOfficialPhotoRetained: [...document.querySelectorAll('#galeria img')].some(image => new URL(image.src).pathname === oldPath),
        contact: actions('contacto'), agenda: actions('agenda-asesoria'), comparator: actions('comparador-hipotecario'), frames,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        noindex: [...document.querySelectorAll('meta[name="robots"]')].some(meta => meta.content.includes('noindex')),
      };
    }, { slug, oldPath: project.imagenPrincipal });
    check(pageEvidence.heading === project.nombre && pageEvidence.titleVisibleInitially && pageEvidence.contentOverImage, viewport.name + ' H1 and content over photo and visible in first viewport');
    const nativeStyle = await page.locator('.project-hero-indi-preview').evaluate(featuredStyle, true);
    check(nativeStyle.fontLoaded && nativeStyle.overlayVisible && nativeStyle.imageAbsolute && nativeStyle.contentAbsolute && nativeStyle.imageFillsHero, viewport.name + ' integrated image, gradient and content layers');
    check(pageEvidence.overflow <= 2 && pageEvidence.oldOfficialPhotoRetained, viewport.name + ' old casona retained and page has no overflow');
    check(pageEvidence.contact && pageEvidence.agenda && pageEvidence.comparator && pageEvidence.canonical === 'https://sollahms.cl/edificio-indi.html', viewport.name + ' contextual actions and SEO retained');
    check(pageEvidence.noindex && pageEvidence.frames.every(frame => frame.loading === 'lazy' && frame.title && frame.referrer === 'strict-origin-when-cross-origin'), viewport.name + ' private Preview and iframe security retained');
    const expectedTourUrls = ficha.virtualTours.map(tour => tour.url);
    check(expectedTourUrls.every(url => pageEvidence.frames.some(frame => frame.src === url)) && pageEvidence.frames.some(frame => new URL(frame.src).hostname === 'www.google.com'), viewport.name + ' exact original tour and map remain');
    const heroFile = viewport.name + '-detail-hero.png'; await page.locator('.project-hero-indi-preview').screenshot({ path: resolve(output, heroFile) }); screenshots.push(heroFile);
    const link = page.locator('.leben-gallery a').filter({ has: page.locator('img[src="' + asset.localPath + '"]') });
    const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()]);
    await popup.waitForLoadState('domcontentloaded');
    await popup.locator('img').evaluate(image => image.decode());
    const enlarged = await popup.locator('img').evaluate(image => ({ width: image.naturalWidth, height: image.naturalHeight }));
    const enlargementPassed = new URL(popup.url()).origin === origin && new URL(popup.url()).pathname === asset.localPath && enlarged.width === asset.width && enlarged.height === asset.height;
    check(enlargementPassed, viewport.name + ' real same-origin façade enlargement');
    popups.push({ context: viewport.name, path: asset.localPath, ...enlarged, passed: enlargementPassed }); await popup.close();
    check(!errors.length, viewport.name + ' no script errors');
    views.push({ context: viewport.name, kind: 'detail', geometry: detail, nativeStyle, ...pageEvidence, scriptErrors: errors }); await save();
    for (const reference of references) {
      await page.waitForLoadState('networkidle');
      await page.goto(base + '/' + reference + '.html', { waitUntil: 'domcontentloaded' });
      await page.locator('.property-hero-image').evaluate(image => image.decode());
      await page.evaluate(() => document.fonts.ready);
      const referenceHero = page.locator('section').filter({ has: page.locator('.property-hero-image') });
      const style = await referenceHero.evaluate(featuredStyle, false);
      const equalProperties = ['titleSize', 'titleLineHeight', 'titleWeight', 'titleTracking', 'titleColor', 'titleMarginBottom', 'eyebrowSize', 'eyebrowTracking', 'eyebrowColor', 'eyebrowMarginBottom', 'locationSize', 'locationLineHeight', 'locationWeight', 'locationColor', 'contentLeft', 'contentMaxWidth', 'gradient'];
      check(equalProperties.every(property => style[property] === nativeStyle[property]) && style.titleFamily.split(',')[0] === nativeStyle.titleFamily.split(',')[0], viewport.name + ' native featured hierarchy/spacing/gradient matches ' + reference);
      check(style.heroHeight === 620 && Math.abs(nativeStyle.heroHeight - (viewport.width >= 1100 ? Math.max(620, viewport.width * .54) : viewport.width <= 600 ? Math.min(420, Math.max(400, viewport.width * 1.077)) : 620)) < .02 && nativeStyle.contentBottom === (viewport.width <= 600 ? 32 : style.contentBottom), viewport.name + ' only source-specific responsive framing differs from ' + reference);
      const referenceFile = viewport.name + '-' + reference + '-hero.png';
      await referenceHero.screenshot({ path: resolve(output, referenceFile) }); screenshots.push(referenceFile);
      views.push({ context: viewport.name, kind: 'featured-reference', slug: reference, nativeStyle: style }); await save();
    }
    await page.waitForLoadState('networkidle');
    lifecycle.closing = true; await context.unrouteAll({ behavior: 'ignoreErrors' }); await context.close(); activeContexts.delete(lifecycle);
  }
} catch (error) { check(false, 'QA stopped: ' + error.message); }
finally {
  for (const lifecycle of activeContexts) { lifecycle.closing = true; await lifecycle.context.unrouteAll({ behavior: 'ignoreErrors' }); await lifecycle.context.close(); }
  if (browser) await browser.close();
}
const passed = views.length === 32 && checks.every(check => check.passed) && !requests.httpFailures.length && !requests.blockedWrites.length && !requests.transportFailures.length;
await save(passed);
console.log(JSON.stringify({ views: views.length, checks: checks.length, imagePopups: popups.length, failures: checks.filter(check => !check.passed).length,
  httpFailures: requests.httpFailures.length, blockedWrites: requests.blockedWrites.length, report: resolve(output, 'report.json') }));
if (!passed) process.exitCode = 1;
