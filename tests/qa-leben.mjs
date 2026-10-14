// Read-only browser QA for the Leben documentary Preview and Nórdico.
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const base = option('--base', 'http://127.0.0.1:8913').replace(/\/$/, '');
const origin = new URL(base).origin;
const output = resolve(option('--output', '/private/tmp/sollahms-leben-browser-qa'));
const projects = JSON.parse(await readFile(resolve(root, 'data/proyectos.json')));
const research = JSON.parse(await readFile(resolve(root, 'data/fichas-proyectos.json')));
const brochure = JSON.parse(await readFile(resolve(root, 'data/brochures-leben.json')));
const slugs = new Set([...brochure.projects.map(record => record.slug), 'edificio-nordico']);
const requestedSlugs = new Set(option('--slugs', '').split(',').filter(Boolean));
const requestedViewports = new Set(option('--viewports', '').split(',').filter(Boolean));
const selected = projects.filter(project => slugs.has(project.slug) && (!requestedSlugs.size || requestedSlugs.has(project.slug)));
const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 }]
  .filter(viewport => !requestedViewports.size || requestedViewports.has(viewport.name));
const checks = [], pages = [], popups = [], screenshots = [], requests = { externalIsolated: 0, writesBlocked: [], localFailures: [] };
const check = (value, label) => checks.push({ label, passed: !!value });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
await mkdir(output, { recursive: true });
const saveProgress = async (completed = false) => writeFile(resolve(output, 'report.json'), JSON.stringify({ base, completed,
  methodology: 'Headless Chrome, explicit actual viewports, real search/filter controls and native enlargement popups; all provider documents isolated and all write methods blocked. No live-provider or delivery/availability claim.',
  viewports, targets: selected.map(project => project.slug), pages, checks, popups, requests, screenshots, failures: checks.filter(check => !check.passed),
}, null, 2) + '\n');

try {
  check(projects.length === 134 && slugs.size === 13, '134 catalogue projects, 13 review targets');
  check(brochure.projects.reduce((n, project) => n + project.images.length, 0) === 43, '43 accepted documentary images');
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) {
        requests.writesBlocked.push({ method: request.method(), path: url.pathname });
        return route.abort();
      }
      if (url.origin === origin) return route.continue(process.env.VERCEL_OIDC_TOKEN ? {
        headers: { ...request.headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN },
      } : {});
      requests.externalIsolated++;
      // These neutral fixtures isolate provider documents for layout QA.
      // They do not verify live map positions, tours, fonts or providers.
      if (request.isNavigationRequest()) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><title>Provider isolated for layout QA</title><body></body></html>' });
      if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      return route.abort();
    });
    context.on('response', response => { if (new URL(response.url()).origin === origin && response.status() >= 400) requests.localFailures.push({ path: new URL(response.url()).pathname, status: response.status() }); });
    const page = await context.newPage();
    let errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const project of selected) {
      errors = [];
      const response = await page.goto(base + project.detalleUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].filter(link => new URL(link.href).origin === location.origin).every(link => link.sheet));
      const record = brochure.projects.find(item => item.slug === project.slug);
      const ficha = research.find(item => item.slug === project.slug);
      const expected = record ? record.images : ficha.images;
      for (const detail of await page.locator('details:not([open]) > summary').all()) await detail.click();
      for (const image of await page.locator('img').all()) {
        await image.scrollIntoViewIfNeeded();
        try { await image.evaluate(async element => { if (new URL(element.src).origin === location.origin) await element.decode(); }); }
        catch (error) { throw new Error(viewport.name + ' ' + project.slug + ' could not decode ' + await image.getAttribute('src') + ': ' + error.message); }
      }
      const evidence = await page.evaluate(({ slug, expected }) => {
        const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
        const images = [...document.images].filter(image => new URL(image.src).origin === location.origin);
        const actions = route => [...document.querySelectorAll('a[href]')].filter(anchor => new URL(anchor.href).pathname === '/' + route + '.html').some(anchor => new URL(anchor.href).searchParams.get('proyecto') === slug);
        return {
          actualWidth: innerWidth, actualHeight: innerHeight,
          heading: document.querySelector('h1')?.textContent.trim(), overflow: document.documentElement.scrollWidth - innerWidth,
          failedImages: images.filter(image => !image.complete || !image.naturalWidth).map(image => new URL(image.src).pathname),
          duplicatedIds: ids.length - new Set(ids).size,
          brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].map(anchor => anchor.getAttribute('href')).filter(href => !ids.includes(href.slice(1))),
          contact: actions('contacto'), booking: actions('agenda-asesoria'), comparator: actions('comparador-hipotecario'),
          expectedImages: expected.map(asset => { const image = images.find(image => new URL(image.src).pathname === asset.localPath && image.closest('a')?.getAttribute('href') === asset.localPath); const anchor = image?.closest('a'); return {
            path: asset.localPath, found: !!image, width: image?.naturalWidth, height: image?.naturalHeight,
            expectedWidth: asset.width, expectedHeight: asset.height, alt: image?.alt,
            href: anchor?.getAttribute('href'), target: anchor?.target,
            outsideViewport: image ? image.getBoundingClientRect().width > innerWidth : null,
          }; }),
          lazyFrames: [...document.querySelectorAll('iframe')].every(frame => frame.loading === 'lazy' && frame.title && frame.referrerPolicy === 'strict-origin-when-cross-origin'),
          frameSources: [...document.querySelectorAll('iframe')].map(frame => frame.src),
          plansPending: !!document.querySelector('#planos-complementarios,#planos-pendientes'),
          surfaceRows: document.querySelectorAll('#superficies-documentadas tbody tr').length,
          surfaceWrapper: (() => { const element = document.querySelector('.leben-table-wrap'); return element ? { width: element.clientWidth, scrollWidth: element.scrollWidth, overflowX: getComputedStyle(element).overflowX, tabIndex: element.tabIndex, role: element.getAttribute('role') } : null; })(),
          visibleAuditText: /\bbrochure\b|según folleto|extraíd[ao] del folleto|SHA-256/i.test(document.body.innerText),
        };
      }, { slug: project.slug, expected });
      const prefix = viewport.name + ' ' + project.slug;
      check(response.status() === 200, prefix + ' HTTP 200');
      check(evidence.actualWidth === viewport.width && evidence.actualHeight === viewport.height, prefix + ' actual viewport');
      check(evidence.heading === project.nombre, prefix + ' project identity');
      check(evidence.overflow <= 2, prefix + ' no horizontal page overflow');
      check(!evidence.failedImages.length, prefix + ' all local images decoded');
      check(!evidence.duplicatedIds && !evidence.brokenAnchors.length, prefix + ' anchors and IDs');
      check(evidence.contact && evidence.booking && evidence.comparator, prefix + ' contextual actions');
      check(evidence.lazyFrames, prefix + ' map/tour iframe security retained');
      check(evidence.plansPending, prefix + ' individual plans pending explicitly');
      check(!evidence.visibleAuditText, prefix + ' documentary audit absent from public prose');
      check(!errors.length, prefix + ' no script errors');
      for (const asset of evidence.expectedImages) check(asset.found && asset.width === asset.expectedWidth && asset.height === asset.expectedHeight && asset.alt && asset.href === asset.path && asset.target === '_blank' && !asset.outsideViewport, prefix + ' native reviewed image and enlargement ' + asset.path);
      if (project.slug === 'parque-germania') {
        check(evidence.surfaceRows === record.documentarySurfaces.length && evidence.surfaceRows === 22, prefix + ' all 22 documentary surface rows');
        check(evidence.surfaceWrapper?.overflowX === 'auto' && evidence.surfaceWrapper.tabIndex === 0 && evidence.surfaceWrapper.role === 'region', prefix + ' accessible isolated surface table scrolling');
        if (evidence.surfaceWrapper.scrollWidth > evidence.surfaceWrapper.width) {
          const wrapper = page.locator('.leben-table-wrap');
          await wrapper.focus();
          await wrapper.press('ArrowRight');
          await page.waitForFunction(() => document.querySelector('.leben-table-wrap').scrollLeft > 0);
          evidence.surfaceKeyboardScrollLeft = await wrapper.evaluate(element => element.scrollLeft);
          check(evidence.surfaceKeyboardScrollLeft > 0, prefix + ' real keyboard horizontal table scrolling');
        }
        await page.locator('#leben-surfaces-title').click();
        await page.locator('#superficies-documentadas').screenshot({ path: resolve(output, viewport.name + '-germania-surfaces.png') });
        screenshots.push(viewport.name + '-germania-surfaces.png');
      }
      if (project.slug === 'edificio-nordico') check((await page.locator('#planos-pendientes').innerText()).includes('por confirmar'), prefix + ' plans and unit surfaces remain unverified');
      for (const asset of expected) {
        const anchor = page.locator('a').filter({ has: page.locator('img[src="' + asset.localPath + '"]') }).first();
        const [popup] = await Promise.all([page.waitForEvent('popup'), anchor.click()]);
        await popup.waitForLoadState('domcontentloaded');
        await popup.waitForFunction(() => document.images[0]?.complete && document.images[0]?.naturalWidth > 0);
        const popupImage = await popup.locator('img').first().evaluate(image => ({ width: image.naturalWidth, height: image.naturalHeight }));
        const correct = new URL(popup.url()).origin === origin && new URL(popup.url()).pathname === asset.localPath && popupImage.width === asset.width && popupImage.height === asset.height;
        check(correct, prefix + ' real enlargement popup ' + asset.localPath);
        popups.push({ viewport: viewport.name, slug: project.slug, path: asset.localPath, ...popupImage, passed: correct });
        await popup.close();
      }
      await page.locator('h1').click();
      await page.evaluate(() => window.scrollTo(0, 0));
      const file = viewport.name + '-' + project.slug + '.png';
      await page.screenshot({ path: resolve(output, file), fullPage: true }); screenshots.push(file);
      pages.push({ slug: project.slug, viewport: viewport.name, status: response.status(), ...evidence, scriptErrors: errors });
      await saveProgress();
    }
    await page.goto(base + '/proyectos.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('#search')?.disabled && document.querySelectorAll('.catalog-card').length > 0);
    check(await page.locator('.catalog-card').count() === 134, viewport.name + ' 134 catalogue cards');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), viewport.name + ' catalogue without overflow');
    await page.locator('#search').fill('nordico');
    await page.waitForFunction(() => document.querySelectorAll('.catalog-card').length === 1);
    const card = page.locator('.catalog-card[data-project="edificio-nordico"]');
    check(await card.count() === 1, viewport.name + ' accent-insensitive Nórdico search');
    await card.scrollIntoViewIfNeeded(); await card.locator('img').evaluate(image => image.decode());
    const nordico = projects.find(project => project.slug === 'edificio-nordico');
    check(await card.locator('img').evaluate((image, path) => image.complete && image.naturalWidth > 0 && new URL(image.src).pathname === path, nordico.imagenPrincipal), viewport.name + ' Nórdico official catalogue cover');
    check(await card.locator('.catalog-details-link').getAttribute('href') === nordico.detalleUrl, viewport.name + ' catalogue Nórdico detail link');
    const cardFile = viewport.name + '-catalogue-nordico.png'; await card.screenshot({ path: resolve(output, cardFile) }); screenshots.push(cardFile);
    await page.locator('#clear-filters').click();
    await page.locator('#region').selectOption('Los Lagos');
    await page.locator('#commune').selectOption('Puerto Varas');
    await page.locator('#state').selectOption('Venta en blanco');
    check(await page.locator('.catalog-card[data-project="edificio-nordico"]').count() === 1, viewport.name + ' Nórdico region/commune/state filters');
    await page.locator('#max-price').fill('4745');
    check(await page.locator('.catalog-card[data-project="edificio-nordico"]').count() === 0, viewport.name + ' maximum UF excludes Nórdico below its current minimum');
    await page.locator('#max-price').fill('4746');
    check(await page.locator('.catalog-card[data-project="edificio-nordico"]').count() === 1, viewport.name + ' maximum UF includes Nórdico at its current minimum');
    await page.locator('#clear-filters').click();
    await page.locator('#search').fill('Ecasa');
    check(await page.locator('.catalog-card').count() === 15, viewport.name + ' fifteen Ecasa cards preserved');
    await page.locator('#search').fill('Own');
    const own = await page.locator('.catalog-card').evaluateAll(cards => cards.map(card => card.dataset.project));
    check(own.includes('own'), viewport.name + ' Own preserved in search');
    await page.locator('#search').fill('Parque Germania');
    check(await page.locator('.catalog-card').count() === 1 && await page.locator('.catalog-card[data-project="parque-germania"]').count() === 1, viewport.name + ' Germania one catalogue project');
    await context.close();
    await saveProgress();
  }
} catch (error) {
  check(false, 'Browser verification stopped: ' + error.message);
  await saveProgress();
} finally { await browser.close(); }
const report = { base, completed: pages.length === selected.length * viewports.length && checks.every(check => check.passed), methodology: 'Headless Chrome, explicit actual viewports, real search/filter controls and native enlargement popups; all provider documents isolated and all write methods blocked. No live-provider or delivery/availability claim.', viewports, targets: selected.map(project => project.slug), pages, checks, popups, requests, screenshots, failures: checks.filter(check => !check.passed) };
await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pages: pages.length, checks: checks.length, realImagePopups: popups.length, failures: report.failures.length, localHttpFailures: requests.localFailures.length, writesBlocked: requests.writesBlocked.length, report: resolve(output, 'report.json') }));
if (report.failures.length || requests.localFailures.length || requests.writesBlocked.length) process.exitCode = 1;
