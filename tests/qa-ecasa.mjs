// Browser QA of the definitive portfolio and its protected documentary review.
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { ECASA_SLUGS, ECASA_RETIRED_SLUGS } from '../scripts/ecasa-publication.mjs';
import { resolveProjectIdentity } from '../assets/js/project-identity.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const base = option('--base', 'http://127.0.0.1:8897').replace(/\/$/, '');
const output = resolve(option('--output', '/private/tmp/sollahms-ecasa-browser-qa'));
const projects = JSON.parse(await readFile(resolve(root, 'data/proyectos.json')));
const review = JSON.parse(await readFile(resolve(root, 'data/brochures-ecasa.json')));
const quality = JSON.parse(await readFile(resolve(root, 'data/ecasa-image-quality.json')));
const qualityBySlug = new Map(quality.projects.map(project => [project.slug, project]));
const deploymentConfig = JSON.parse(await readFile(resolve(root, 'vercel.json')));
const assetOrigins = Object.fromEntries(review.projects.flatMap(record =>
  [...record.images, ...record.models.map(model => model.plan)].map(asset => [asset.localPath, asset.originCommercialSlug])));
const selectedSlugs = new Set(option('--slugs', '').split(',').filter(Boolean));
const origin = new URL(base).origin;
const results = [], checks = [], issues = [], screenshots = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 }];
const check = (condition, label) => { checks.push({ label, passed: !!condition }); if (!condition) issues.push(label); };

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) {
        issues.push('Unexpected write request: ' + request.method() + ' ' + url.pathname);
        return route.abort();
      }
      if (url.origin === origin) return route.continue(process.env.VERCEL_OIDC_TOKEN ? {
        headers: { ...request.headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN },
      } : {});
      // Provider documents are isolated only for layout QA. Existing exact
      // iframe source/security checks and separate live viewer QA cover them.
      if (request.isNavigationRequest()) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Layout QA provider fixture</title>' });
      if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      return route.abort();
    });
    const page = await context.newPage();
    let consoleErrors = [];
    page.on('pageerror', error => consoleErrors.push(error.message));
    const selected = (viewport.name === 'desktop' ? projects : projects.filter(project => project.inmobiliaria === 'Ecasa'))
      .filter(project => !selectedSlugs.size || selectedSlugs.has(project.slug));
    for (const project of selected) {
      consoleErrors = [];
      const response = await page.goto(base + project.detalleUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].filter(link => new URL(link.href).origin === location.origin).every(link => link.sheet));
      await page.evaluate(() => {
        document.querySelectorAll('.aj-typology,.aj-model,.ecasa-stage').forEach(detail => { detail.open = true; });
        document.images && [...document.images].forEach(image => { image.loading = 'eager'; });
      });
      await page.waitForFunction(() => [...document.images].filter(image => new URL(image.src).origin === location.origin).every(image => image.complete), null, { timeout: 15000 });
      await page.locator('img').evaluateAll(async images => {
        await Promise.all(images.filter(image => new URL(image.src).origin === location.origin && image.naturalWidth).map(image => image.decode()));
      });
      const evidence = await page.evaluate(({ slug, assetOrigins }) => {
        const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
        const images = [...document.images].filter(image => new URL(image.src).origin === location.origin);
        const action = route => [...document.querySelectorAll('a[href]')].some(anchor => {
          const target = new URL(anchor.href);
          return target.pathname === '/' + route + '.html' && target.searchParams.get('proyecto') === slug;
        });
        return {
          heading: document.querySelector('h1')?.textContent.trim(),
          overflow: document.documentElement.scrollWidth - innerWidth,
          failedImages: images.filter(image => !image.naturalWidth).map(image => image.src),
          images: images.length, plans: document.querySelectorAll('.aj-plan-link').length,
          duplicatedIds: ids.length - new Set(ids).size,
          brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].map(anchor => anchor.getAttribute('href')).filter(href => !ids.includes(href.slice(1))),
          contact: action('contacto'), booking: action('agenda-asesoria'), comparator: action('comparador-hipotecario'),
          documentaryOrigins: images.filter(image => assetOrigins[new URL(image.src).pathname]).map(image => ({
            path: new URL(image.src).pathname, expected: assetOrigins[new URL(image.src).pathname],
            actual: image.closest('[data-commercial-stage]')?.getAttribute('data-commercial-stage'),
          })),
          visibleDocumentReferences: /\bbrochure\b|según folleto|extraíd[ao] del folleto/i.test(document.body.innerText)
            || images.some(image => /\bbrochure\b|según folleto|extraíd[ao] del folleto/i.test(image.alt)),
          lazyFrames: [...document.querySelectorAll('iframe')].every(frame => frame.loading === 'lazy'),
          planLinks: [...document.querySelectorAll('.aj-plan-link')].every(anchor => anchor.getAttribute('href') === anchor.querySelector('img')?.getAttribute('src') && anchor.target === '_blank'),
        };
      }, { slug: project.slug, assetOrigins });
      const errors = [];
      if (response.status() !== 200) errors.push('HTTP ' + response.status());
      if (evidence.heading !== project.nombre) errors.push('Project heading');
      if (evidence.overflow > 2) errors.push('Horizontal overflow ' + evidence.overflow);
      if (evidence.failedImages.length) errors.push('Image loading');
      if (evidence.duplicatedIds || evidence.brokenAnchors.length) errors.push('Internal navigation');
      if (!evidence.contact || !evidence.booking || !evidence.comparator) errors.push('Contextual actions');
      if (!evidence.lazyFrames || !evidence.planLinks) errors.push('Viewer/plan behavior');
      if (evidence.documentaryOrigins.some(asset => asset.actual !== asset.expected)) errors.push('Ecasa commercial media origin');
      if (evidence.visibleDocumentReferences) errors.push('Visible documentary caption reference');
      if (consoleErrors.length) errors.push(...consoleErrors);
      const record = review.projects.find(record => record.slug === project.slug);
      const visual = qualityBySlug.get(project.slug);
      if (visual) {
        const gallery = await page.locator('.gallery-grid img').evaluateAll(images => images.map(image => new URL(image.src).pathname));
        const expected = visual.images.filter(image => image.decision === 'keep').map(image => image.localPath);
        check(JSON.stringify([...new Set(gallery)].sort()) === JSON.stringify([...expected].sort()), viewport.name + ' accepted image gallery ' + project.slug);
        check(await page.locator('.gallery-grid').evaluateAll(grids => grids.every(grid => grid.querySelector('img'))), viewport.name + ' no empty gallery ' + project.slug);
        const approvedHero = visual.covers.preview.hero;
        const approvedOrigin = visual.images.find(image => image.localPath === approvedHero)?.originCommercialSlug;
        check(await page.locator('.hero-image').evaluateAll((images, expected) => images.length === 1 && images.every(image =>
          image.complete && image.naturalWidth && new URL(image.src).pathname === expected.path &&
          image.getAttribute('data-commercial-stage') === expected.origin), { path: approvedHero, origin: approvedOrigin }),
          viewport.name + ' approved valid hero ' + project.slug);
        for (let index = 0; index < await page.locator('.gallery-grid').count(); index++) {
          const galleryImages = page.locator('.gallery-grid').nth(index).locator('img');
          for (let picture = 0; picture < await galleryImages.count(); picture++) await galleryImages.nth(picture).scrollIntoViewIfNeeded();
          const galleryPath = resolve(output, viewport.name + '-' + project.slug + '-gallery-' + (index + 1) + '.png');
          await page.locator('.gallery-grid').nth(index).screenshot({ path: galleryPath });
          screenshots.push(galleryPath);
        }
      }
      if (record && evidence.plans !== record.models.length) errors.push('Ecasa plan inventory');
      if (record?.models.length) {
        const [popup] = await Promise.all([page.waitForEvent('popup'), page.locator('.aj-plan-link').first().click()]);
        await popup.waitForLoadState('domcontentloaded');
        await popup.waitForFunction(() => document.images[0]?.complete && document.images[0]?.naturalWidth > 0);
        check(new URL(popup.url()).origin === origin && popup.url().includes(record.models[0].plan.localPath),
          viewport.name + ' expanded plan ' + project.slug);
        await popup.close();
      }
      results.push({ slug: project.slug, viewport: viewport.name, status: response.status(), ...evidence, errors });
      if (errors.length) issues.push(viewport.name + ':' + project.slug + ': ' + errors.join(', '));
      if (project.inmobiliaria === 'Ecasa') {
        await page.evaluate(() => window.scrollTo(0, 0));
        const path = resolve(output, viewport.name + '-' + project.slug + '.png');
        await page.screenshot({ path }); screenshots.push(path);
      }
    }
    for (const path of ['/proyectos.html', '/comparador-hipotecario.html', '/contacto.html?proyecto=alto-san-joaquin-3', '/agenda-asesoria.html?proyecto=terratolten-2']) {
      const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      check(response.status() === 200, viewport.name + ' global ' + path);
      await page.waitForTimeout(150);
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), viewport.name + ' global layout ' + path);
    }
    await page.goto(base + '/proyectos.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('#search')?.disabled && document.querySelectorAll('.catalog-card').length > 0);
    const search = page.locator('#search');
    if (await search.count()) {
      await search.fill('Ecasa');
      await page.waitForTimeout(100);
      const cards = await page.locator('#project-grid a[href$=".html"]').evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')));
      check(new Set(cards).size === 15 && ECASA_SLUGS.every(slug => cards.includes('/' + slug + '.html')), viewport.name + ' Ecasa search 15 principal projects');
      await page.locator('#project-grid img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
      await page.waitForFunction(() => [...document.querySelectorAll('#project-grid img')].every(image => image.complete && image.naturalWidth));
      await page.locator('#project-grid img').evaluateAll(async images => { await Promise.all(images.map(image => image.decode())); });
      for (let index = 0; index < await page.locator('.catalog-card').count(); index++) {
        const card = page.locator('.catalog-card').nth(index);
        await card.scrollIntoViewIfNeeded();
        const cardPath = resolve(output, viewport.name + '-catalogue-' + await card.getAttribute('data-project') + '.png');
        await card.screenshot({ path: cardPath }); screenshots.push(cardPath);
      }
      const cataloguePath = resolve(output, viewport.name + '-ecasa-catalogue.png');
      await page.locator('#project-grid').screenshot({ path: cataloguePath }); screenshots.push(cataloguePath);
      for (const slug of ['alto-san-joaquin-2', 'alto-san-joaquin-3', 'terratolten-2', 'nucleo-costanera-2', 'ferroparque-2', 'lomas-de-puyai-3']) {
        const principal = projects.find(project => project.etapasComerciales?.some(stage => stage.slug === slug));
        await search.fill(principal.etapasComerciales.find(stage => stage.slug === slug).nombre);
        await page.waitForTimeout(50);
        const stageCards = await page.locator('#project-grid a[href$=".html"]').evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')));
        check(await page.locator('.catalog-card').count() === 1 && new Set(stageCards).size === 1 &&
          stageCards[0] === principal.detalleUrl, viewport.name + ' stage search principal ' + slug);
      }
      for (const slug of ECASA_RETIRED_SLUGS) {
        await search.fill(slug); await page.waitForTimeout(50);
        check(await page.locator('#project-grid a[href$=".html"]').count() === 0, viewport.name + ' retired search ' + slug);
      }
      await search.fill('');
      await page.locator('#capacity-toggle').click();
      await page.locator('#capacity-income').fill('2500000');
      await page.locator('#capacity-debt').fill('200000');
      await page.locator('#capacity-savings').fill('20000000');
      await page.locator('#capacity-rate').fill('4.5');
      await page.locator('#capacity-submit').click();
      await page.waitForFunction(() => document.querySelector('#capacity-summary').textContent.includes('136'));
      check(!(await page.locator('#capacity-error').textContent()).trim(), viewport.name + ' capacity calculation');
      check(await page.locator('.catalog-card').count() === 136, viewport.name + ' capacity retains the portfolio');
    } else check(false, 'Search control selector');
    await page.goto(base + '/comparador-hipotecario.html', { waitUntil: 'domcontentloaded' });
    await page.locator('#property').fill('3500');
    await page.locator('#down').fill('20');
    await page.locator('#years').selectOption('25');
    await page.locator('#rate').fill('0');
    await page.locator('#simulation-form button[type="submit"]').click();
    await page.waitForFunction(() => !document.querySelector('#result-panel').hidden);
    check(/9[,.]33/.test(await page.locator('#monthly-uf').textContent()), viewport.name + ' zero-rate amortization 2800/300 UF');
    check(!(await page.locator('#simulation-error').textContent()).trim(), viewport.name + ' comparator calculation');
    for (const rule of deploymentConfig.redirects.filter(rule => rule.permanent && rule.source.endsWith('.html'))) {
      const response = await page.goto(base + rule.source, { waitUntil: 'domcontentloaded' });
      const target = new URL(rule.destination, base);
      check(response.status() === 200 && page.url() === target.href, viewport.name + ' legacy navigation ' + rule.source);
      const anchor = page.locator(target.hash);
      check(await anchor.count() === 1, viewport.name + ' requested stage anchor ' + rule.source);
      if (await anchor.evaluate(element => element.tagName === 'DETAILS')) {
        await page.waitForFunction(hash => document.getElementById(hash.slice(1)).open, target.hash);
        check(await anchor.evaluate(element => element.open), viewport.name + ' requested stage expanded ' + rule.source);
      }
    }
    const stageRequests = viewport.name === 'desktop'
      ? deploymentConfig.redirects.filter(rule => rule.permanent && rule.source.endsWith('.html')).map(rule => rule.source.slice(1, -5))
      : ['terratolten-1', 'terratolten-2', 'terratolten-3'];
    for (const requested of stageRequests) {
      const identity = resolveProjectIdentity(projects, requested);
      await page.goto(base + '/comparador-hipotecario.html?proyecto=' + requested, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(name => document.querySelector('#project-name').textContent === name, identity.nombre);
      check(await page.locator('#project-detail').getAttribute('href') === identity.detalleUrl, viewport.name + ' stage comparator detail ' + requested);
      check(await page.locator('#property').inputValue() === (identity.precioDesdeUF === null ? '' : String(identity.precioDesdeUF)),
        viewport.name + ' stage comparator own price ' + requested);
      await page.goto(base + '/contacto.html?proyecto=' + requested, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(name => document.querySelector('#contact-project-context').textContent.includes(name), identity.nombre);
      check(!(await page.locator('#contact-project-context').isHidden()), viewport.name + ' stage contact context ' + requested);
      await page.goto(base + '/agenda-asesoria.html?proyecto=' + requested, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(name => document.querySelector('#agenda-reserva-titulo').textContent.includes(name), identity.nombre);
      check(await page.locator('#agenda-project-back-link').getAttribute('href') === identity.detalleUrl,
        viewport.name + ' stage booking context ' + requested);
    }
    await context.close();
  }
  const request = await browser.newContext();
  const requestOptions = { maxRedirects: 0, ...(process.env.VERCEL_OIDC_TOKEN ? { headers: {
    'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN,
  } } : {}) };
  for (const slug of ECASA_RETIRED_SLUGS) check((await request.request.get(base + '/' + slug + '.html', requestOptions)).status() === 404, 'Retired route ' + slug);
  for (const rule of deploymentConfig.redirects.filter(rule => rule.permanent)) {
    const response = await request.request.get(base + rule.source, requestOptions);
    const location = response.headers()['location'];
    check(response.status() === 308 && location && new URL(location, base).href === new URL(rule.destination, base).href,
      'Permanent stage redirect ' + rule.source);
  }
  for (const record of review.projects) {
    const visual = qualityBySlug.get(record.slug);
    for (const asset of [...record.images.filter(image => visual.images.some(reviewed => reviewed.localPath === image.localPath && (reviewed.decision === 'keep' || reviewed.coverOnly))), ...record.models.map(model => model.plan)]) {
      const response = await request.request.get(base + asset.localPath, requestOptions);
      check(response.status() === 200 && createHash('sha256').update(await response.body()).digest('hex') === asset.sha256, 'Media hash ' + asset.localPath);
    }
  }
  await request.close();
} finally { await browser.close(); }
await writeFile(resolve(output, 'report.json'), JSON.stringify({ passed: !issues.length, browserCases: results.length, checks, issues, results, screenshots, providerLayoutIsolation: true, noApplicationWrites: true }, null, 2) + '\n');
console.log(JSON.stringify({ passed: !issues.length, browserCases: results.length, checks: checks.length, issues, output }));
if (issues.length) process.exitCode = 1;
