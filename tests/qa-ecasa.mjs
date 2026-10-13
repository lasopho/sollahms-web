// Browser QA of the definitive portfolio and its protected documentary review.
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { ECASA_SLUGS, ECASA_RETIRED_SLUGS } from '../scripts/ecasa-publication.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const base = option('--base', 'http://127.0.0.1:8897').replace(/\/$/, '');
const output = resolve(option('--output', '/private/tmp/sollahms-ecasa-browser-qa'));
const projects = JSON.parse(await readFile(resolve(root, 'data/proyectos.json')));
const review = JSON.parse(await readFile(resolve(root, 'data/brochures-ecasa.json')));
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
        document.querySelectorAll('.aj-typology,.aj-model').forEach(detail => { detail.open = true; });
        document.images && [...document.images].forEach(image => { image.loading = 'eager'; });
      });
      await page.waitForFunction(() => [...document.images].filter(image => new URL(image.src).origin === location.origin).every(image => image.complete), null, { timeout: 15000 });
      const evidence = await page.evaluate(({ slug }) => {
        const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
        const images = [...document.images].filter(image => new URL(image.src).origin === location.origin);
        return {
          heading: document.querySelector('h1')?.textContent.trim(),
          overflow: document.documentElement.scrollWidth - innerWidth,
          failedImages: images.filter(image => !image.naturalWidth).map(image => image.src),
          images: images.length, plans: document.querySelectorAll('.aj-plan-link').length,
          duplicatedIds: ids.length - new Set(ids).size,
          brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].map(anchor => anchor.getAttribute('href')).filter(href => !ids.includes(href.slice(1))),
          contact: !!document.querySelector(`a[href="/contacto.html?proyecto=${slug}"]`),
          booking: !!document.querySelector(`a[href="/agenda-asesoria.html?proyecto=${slug}"]`),
          comparator: !!document.querySelector(`a[href="/comparador-hipotecario.html?proyecto=${slug}"]`),
          lazyFrames: [...document.querySelectorAll('iframe')].every(frame => frame.loading === 'lazy'),
          planLinks: [...document.querySelectorAll('.aj-plan-link')].every(anchor => anchor.getAttribute('href') === anchor.querySelector('img')?.getAttribute('src') && anchor.target === '_blank'),
        };
      }, { slug: project.slug });
      const errors = [];
      if (response.status() !== 200) errors.push('HTTP ' + response.status());
      if (evidence.heading !== project.nombre) errors.push('Project heading');
      if (evidence.overflow > 2) errors.push('Horizontal overflow ' + evidence.overflow);
      if (evidence.failedImages.length) errors.push('Image loading');
      if (evidence.duplicatedIds || evidence.brokenAnchors.length) errors.push('Internal navigation');
      if (!evidence.contact || !evidence.booking || !evidence.comparator) errors.push('Contextual actions');
      if (!evidence.lazyFrames || !evidence.planLinks) errors.push('Viewer/plan behavior');
      if (consoleErrors.length) errors.push(...consoleErrors);
      const record = review.projects.find(record => record.slug === project.slug);
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
      if (project.inmobiliaria === 'Ecasa' && ['wayra', 'alto-san-joaquin-3', 'terratolten-1', 'ferroparque', 'nucleo-costanera-2'].includes(project.slug)) {
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
      check(new Set(cards).size === 22 && ECASA_SLUGS.every(slug => cards.includes('/' + slug + '.html')), viewport.name + ' Ecasa search 22 identities');
      for (const slug of ['alto-san-joaquin-2', 'alto-san-joaquin-3', 'terratolten-2', 'nucleo-costanera-2', 'ferroparque-2', 'lomas-de-puyai-3']) {
        await search.fill(projects.find(project => project.slug === slug).nombre);
        await page.waitForTimeout(50);
        const stageCards = await page.locator('#project-grid a[href$=".html"]').evaluateAll(anchors => anchors.map(anchor => anchor.getAttribute('href')));
        check(await page.locator('.catalog-card').count() === 1 && new Set(stageCards).size === 1 &&
          stageCards[0] === '/' + slug + '.html', viewport.name + ' stage search identity ' + slug);
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
      await page.waitForFunction(() => document.querySelector('#capacity-summary').textContent.includes('143'));
      check(!(await page.locator('#capacity-error').textContent()).trim(), viewport.name + ' capacity calculation');
      check(await page.locator('.catalog-card').count() === 143, viewport.name + ' capacity retains the portfolio');
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
    await context.close();
  }
  const request = await browser.newContext();
  const requestOptions = { maxRedirects: 0, ...(process.env.VERCEL_OIDC_TOKEN ? { headers: {
    'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN,
  } } : {}) };
  for (const slug of ECASA_RETIRED_SLUGS) check((await request.request.get(base + '/' + slug + '.html', requestOptions)).status() === 404, 'Retired route ' + slug);
  for (const record of review.projects) {
    for (const asset of [...record.images, ...record.models.map(model => model.plan)]) {
      const response = await request.request.get(base + asset.localPath, requestOptions);
      check(response.status() === 200 && createHash('sha256').update(await response.body()).digest('hex') === asset.sha256, 'Media hash ' + asset.localPath);
    }
  }
  await request.close();
} finally { await browser.close(); }
await writeFile(resolve(output, 'report.json'), JSON.stringify({ passed: !issues.length, browserCases: results.length, checks, issues, results, screenshots, providerLayoutIsolation: true, noApplicationWrites: true }, null, 2) + '\n');
console.log(JSON.stringify({ passed: !issues.length, browserCases: results.length, checks: checks.length, issues, output }));
if (issues.length) process.exitCode = 1;
