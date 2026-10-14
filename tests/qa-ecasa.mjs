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
let manual = null;
try { manual = JSON.parse(await readFile(resolve(root, 'data/ecasa-manual-quality.json'))); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const manualBySlug = new Map((manual?.projects ?? []).map(project => [project.slug, project]));
const effectiveBySlug = manual ? manualBySlug : qualityBySlug;
let ownerCover = null;
try { ownerCover = JSON.parse(await readFile(resolve(root, 'data/ecasa-owner-cover.json'))); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const ownerCoverProjects = ownerCover ? (ownerCover.schemaVersion === 2 ? ownerCover.projects : [ownerCover]) : [];
const ownerCoverBySlug = new Map(ownerCoverProjects.map(project => [project.projectSlug, project]));
const ownerSupersededPaths = new Set(ownerCoverProjects.flatMap(project => project.supersededCoverOnly ? [project.supersededCoverOnly.localPath] : []));
const official = JSON.parse(await readFile(resolve(root, 'data/ecasa-official-originals.json')));
const officialBySlug = new Map(official.projects.map(project => [project.slug, project]));
const retinaProjects = [...official.projects, ...ownerCoverProjects.map(project => ({ slug: project.projectSlug, previewCover: project.selected.localPath }))];
const deploymentConfig = JSON.parse(await readFile(resolve(root, 'vercel.json')));
const assetOrigins = Object.fromEntries(review.projects.flatMap(record =>
  [...record.images, ...record.models.map(model => model.plan)].map(asset => [asset.localPath, asset.originCommercialSlug])));
for (const project of official.projects) for (const image of project.images) assetOrigins[image.localPath] = project.slug;
for (const project of ownerCoverProjects) assetOrigins[project.selected.localPath] = project.projectSlug;
const ownerSourcePlans = new Map(await Promise.all(ownerCoverProjects.map(async project => {
  const html = await readFile(resolve(root, project.projectSlug + '.html'), 'utf8');
  const paths = [...html.matchAll(/<a\b(?=[^>]*\bclass="[^"]*\baj-plan-link\b[^"]*")(?=[^>]*\bhref="([^"]+)")[^>]*>/g)].map(match => match[1]);
  return [project.projectSlug, paths];
})));
const selectedSlugs = new Set(option('--slugs', '').split(',').filter(Boolean));
const ecasaOnly = process.argv.includes('--ecasa-only');
const visualOnly = process.argv.includes('--visual-only');
const origin = new URL(base).origin;
const results = [], checks = [], issues = [], screenshots = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop-retina', width: 1440, height: 1000, dpr: 2, targetsOnly: true },
  { name: 'tablet-retina', width: 768, height: 1024, dpr: 2, targetsOnly: true },
  { name: 'mobile-retina', width: 390, height: 844, dpr: 2, targetsOnly: true }];
const check = (condition, label) => { checks.push({ label, passed: !!condition }); if (!condition) issues.push(label); };
async function checkOwnerCard(card, project, viewport) {
  const selected = ownerCoverBySlug.get(project.slug)?.selected;
  if (!selected) return;
  const geometry = await card.locator('img').evaluate(image => ({
    naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
    width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height,
    objectFit: getComputedStyle(image).objectFit,
    coverWidth: image.closest('.catalog-cover').getBoundingClientRect().width,
    coverHeight: image.closest('.catalog-cover').getBoundingClientRect().height,
  }));
  check(geometry.naturalWidth === selected.width && geometry.naturalHeight === selected.height &&
    geometry.objectFit === 'cover' && Math.abs(geometry.coverWidth / geometry.coverHeight - 16 / 9) < 0.015 &&
    Math.abs(geometry.width - geometry.coverWidth) < 1 && Math.abs(geometry.height - geometry.coverHeight) < 1 &&
    geometry.width <= selected.width + 1 && geometry.height <= selected.height + 1,
  viewport.name + ' uniform owner catalogue frame with original photograph ' + project.slug);
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: viewport.dpr ?? 1 });
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
      .filter(project => !ecasaOnly || project.inmobiliaria === 'Ecasa')
      .filter(project => !viewport.targetsOnly || officialBySlug.has(project.slug) || ownerCoverBySlug.has(project.slug))
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
          devicePixelRatio,
          heroGeometry: [...document.querySelectorAll('.hero-image')].map(image => ({ path: new URL(image.src).pathname,
            naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
            width: image.getBoundingClientRect().width, height: image.getBoundingClientRect().height,
            objectFit: getComputedStyle(image).objectFit,
            nativePixelLimitExceeded: image.getBoundingClientRect().width * devicePixelRatio > image.naturalWidth + 1 })),
          galleryImagePaths: [...document.querySelectorAll('.gallery-grid img')].map(image => new URL(image.src).pathname),
          planImagePaths: [...document.querySelectorAll('.aj-plan-link img')].map(image => new URL(image.src).pathname),
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
      const visual = effectiveBySlug.get(project.slug);
      if (visual) {
        const gallery = await page.locator('.gallery-grid img').evaluateAll(images => images.map(image => new URL(image.src).pathname));
        const expected = visual.images.filter(image => image.decision === 'keep').map(image => image.localPath);
        expected.push(...(officialBySlug.get(project.slug)?.gallery ?? []));
        check(JSON.stringify([...new Set(gallery)].sort()) === JSON.stringify([...expected].sort()), viewport.name + ' accepted image gallery ' + project.slug);
        check(await page.locator('.gallery-grid').evaluateAll(grids => grids.every(grid => grid.querySelector('img'))), viewport.name + ' no empty gallery ' + project.slug);
        const originalSelection = officialBySlug.get(project.slug);
        const selectedOwnerCover = ownerCoverBySlug.get(project.slug);
        const approvedHero = selectedOwnerCover?.selected.localPath ?? originalSelection?.previewCover ?? visual.previewCover ?? visual.covers?.preview.hero;
        const approvedOrigin = selectedOwnerCover || originalSelection ? project.slug : visual.images.find(image => image.localPath === approvedHero)?.originCommercialSlug;
        check(await page.locator('.hero-image').evaluateAll((images, expected) => images.length === 1 && images.every(image =>
          image.complete && image.naturalWidth && new URL(image.src).pathname === expected.path &&
          image.getAttribute('data-commercial-stage') === expected.origin), { path: approvedHero, origin: approvedOrigin }),
          viewport.name + ' approved valid hero ' + project.slug);
        if (selectedOwnerCover) {
          check(evidence.devicePixelRatio === (viewport.dpr ?? 1), viewport.name + ' actual owner cover device pixel ratio ' + project.slug);
          check(evidence.heroGeometry.length === 1 && evidence.heroGeometry.every(image =>
            image.naturalWidth === selectedOwnerCover.selected.width && image.naturalHeight === selectedOwnerCover.selected.height &&
            image.objectFit === 'contain' && Math.abs(image.width / image.height - image.naturalWidth / image.naturalHeight) < 0.015 &&
            image.width <= image.naturalWidth + 1 && image.height <= image.naturalHeight + 1),
          viewport.name + ' complete owner photograph without crop or enlargement ' + project.slug);
          check(new URL(await page.locator('meta[property="og:image"]').getAttribute('content'), base).pathname === selectedOwnerCover.selected.localPath,
            viewport.name + ' approved owner Open Graph cover ' + project.slug);
          check(JSON.stringify(evidence.planImagePaths) === JSON.stringify(ownerSourcePlans.get(project.slug)) &&
            JSON.stringify([...evidence.planImagePaths].sort()) === JSON.stringify(record.models.map(model => model.plan.localPath).sort()),
          viewport.name + ' unchanged owner project plan inventory ' + project.slug);
          check(evidence.galleryImagePaths.length === expected.length && !evidence.galleryImagePaths.includes(selectedOwnerCover.selected.localPath) &&
            (!selectedOwnerCover.supersededCoverOnly || !evidence.galleryImagePaths.includes(selectedOwnerCover.supersededCoverOnly.localPath)),
          viewport.name + ' owner cover does not enter unchanged gallery ' + project.slug);
          if (!selectedOwnerCover.supersededCoverOnly) {
            const previousCover = visual.previewCover ?? visual.covers?.preview.hero;
            check(evidence.galleryImagePaths.includes(previousCover), viewport.name + ' previous accepted photograph remains in gallery ' + project.slug);
          }
        }
        if (originalSelection) {
          check(evidence.devicePixelRatio === (viewport.dpr ?? 1), viewport.name + ' actual device pixel ratio ' + project.slug);
          for (const image of originalSelection.images) check(await page.locator('.gallery-grid img').evaluateAll((images, expected) => {
            const selected = images.filter(image => new URL(image.src).pathname === expected.localPath);
            return selected.length === 1 && selected.every(image => image.naturalWidth === expected.width && image.naturalHeight === expected.height &&
              image.closest('[data-official-scope]')?.getAttribute('data-official-scope') === 'development_general' && getComputedStyle(image).objectFit === 'cover');
          }, image), viewport.name + ' original native dimensions and general scope ' + project.slug);
        }
        if (manualBySlug.has(project.slug)) {
          check(await page.locator('#galeria .aj-gallery').evaluateAll(grids => grids.every(grid => grid.querySelector('img'))),
            viewport.name + ' no empty documentary section ' + project.slug);
          const additional = visual.images.filter(image => image.kind === 'documentary' && image.decision === 'keep');
          check(await page.locator('#galeria .aj-gallery img').count() === additional.length,
            viewport.name + ' exact manually selected additional photographs ' + project.slug);
          if (!additional.length) check(await page.locator('#galeria').evaluate(gallery => ![...gallery.querySelectorAll('h3')].some(heading => heading.textContent.trim() === 'Imágenes del proyecto')),
            viewport.name + ' no empty additional image heading ' + project.slug);
          if (project.slug === 'ferroparque') check(await page.locator('#galeria .gallery-grid').first().locator('img').evaluateAll((images, path) =>
            images.some(image => new URL(image.src).pathname === path), originalSelection.previewCover),
            viewport.name + ' development photograph belongs to official gallery');
        }
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
    if (viewport.targetsOnly) {
      await page.goto(base + '/proyectos.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !document.querySelector('#search')?.disabled && document.querySelectorAll('.catalog-card').length > 0);
      await page.locator('#search').fill('Ecasa');
      await page.waitForTimeout(100);
      for (const project of retinaProjects) {
        const card = page.locator('.catalog-card[data-project="' + project.slug + '"]');
        await card.scrollIntoViewIfNeeded();
        await card.locator('img').evaluate(image => { image.loading = 'eager'; });
        await card.locator('img').evaluate(async image => { await image.decode(); });
        check(await card.locator('img').evaluate((image, path) => image.complete && image.naturalWidth && new URL(image.src).pathname === path,
          project.previewCover), viewport.name + ' valid original catalogue cover ' + project.slug);
        await checkOwnerCard(card, project, viewport);
        const cardPath = resolve(output, viewport.name + '-catalogue-' + project.slug + '.png');
        await card.screenshot({ path: cardPath }); screenshots.push(cardPath);
      }
      await context.close(); continue;
    }
    if (visualOnly) {
      await page.goto(base + '/proyectos.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !document.querySelector('#search')?.disabled && document.querySelectorAll('.catalog-card').length > 0);
      await page.locator('#search').fill('Ecasa'); await page.waitForTimeout(100);
      check(await page.locator('.catalog-card').count() === 15, viewport.name + ' catalogue contains fifteen Ecasa projects');
      for (const project of projects.filter(project => project.inmobiliaria === 'Ecasa')) {
        const card = page.locator('.catalog-card[data-project="' + project.slug + '"]');
        await card.scrollIntoViewIfNeeded(); await card.locator('img').evaluate(image => { image.loading = 'eager'; });
        await card.locator('img').evaluate(async image => { await image.decode(); });
        const expectedCover = ownerCoverBySlug.get(project.slug)?.selected.localPath ?? officialBySlug.get(project.slug)?.previewCover ?? manualBySlug.get(project.slug)?.previewCover ?? qualityBySlug.get(project.slug).covers.preview.catalogue;
        check(await card.locator('img').evaluate((image, path) => image.complete && image.naturalWidth && new URL(image.src).pathname === path, expectedCover),
          viewport.name + ' valid selected catalogue cover ' + project.slug);
        await checkOwnerCard(card, project, viewport);
        const cardPath = resolve(output, viewport.name + '-catalogue-' + project.slug + '.png');
        await card.screenshot({ path: cardPath }); screenshots.push(cardPath);
      }
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), viewport.name + ' no catalogue overflow');
      await context.close(); continue;
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
      await page.waitForFunction(() => document.querySelector('#capacity-summary').textContent.includes('133'));
      check(!(await page.locator('#capacity-error').textContent()).trim(), viewport.name + ' capacity calculation');
      check(await page.locator('.catalog-card').count() === 133, viewport.name + ' capacity retains the portfolio');
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
    const visual = effectiveBySlug.get(record.slug);
    for (const asset of [...record.images.filter(image => !ownerSupersededPaths.has(image.localPath) && visual.images.some(reviewed => reviewed.localPath === image.localPath && (reviewed.decision === 'keep' || reviewed.coverOnly))), ...record.models.map(model => model.plan)]) {
      const response = await request.request.get(base + asset.localPath, requestOptions);
      check(response.status() === 200 && createHash('sha256').update(await response.body()).digest('hex') === asset.sha256, 'Media hash ' + asset.localPath);
    }
  }
  for (const project of official.projects) for (const image of project.images) {
    const response = await request.request.get(base + image.localPath, requestOptions);
    check(response.status() === 200 && createHash('sha256').update(await response.body()).digest('hex') === image.sha256,
      'Selected original image hash ' + image.localPath);
    check((await request.request.get(base + image.original.localPath, requestOptions)).status() === 404,
      'Raw official download remains private ' + project.slug);
  }
  if (ownerCoverProjects.length) check((await request.request.get(base + '/data/ecasa-owner-cover.json', requestOptions)).status() === 404,
    'Owner cover review remains private');
  for (const project of ownerCoverProjects) {
    const response = await request.request.get(base + project.selected.localPath, requestOptions);
    check(response.status() === 200 && createHash('sha256').update(await response.body()).digest('hex') === project.selected.sha256,
      'Selected owner cover image hash ' + project.projectSlug);
    for (const path of [project.original.localPath, ...(project.supersededCoverOnly ? [project.supersededCoverOnly.localPath] : [])])
      check((await request.request.get(base + path, requestOptions)).status() === 404, 'Excluded owner cover resource ' + path);
  }
  await request.close();
} finally { await browser.close(); }
await writeFile(resolve(output, 'report.json'), JSON.stringify({ passed: !issues.length, browserCases: results.length, checks, issues, results, screenshots, providerLayoutIsolation: true, noApplicationWrites: true }, null, 2) + '\n');
console.log(JSON.stringify({ passed: !issues.length, browserCases: results.length, checks: checks.length, issues, output }));
if (issues.length) process.exitCode = 1;
