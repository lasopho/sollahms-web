// Browser checks for the complete Norte Verde portfolio. Form requests are intercepted;
// no message, booking or availability request reaches an application API or provider.
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NORTE_VERDE_SLUGS, NORTE_VERDE_RETIRED_SLUGS, NORTE_VERDE_MANIFEST } from '../scripts/norte-verde-publication.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const base = option('--base', 'http://127.0.0.1:8087').replace(/\/$/, '');
const origin = new URL(base).origin;
const output = resolve(option('--output', '/private/tmp/norte-verde-review/qa'));
const catalogue = JSON.parse(await readFile(resolve(root, 'data/proyectos.json')));
const manifest = JSON.parse(await readFile(resolve(root, NORTE_VERDE_MANIFEST)));
const selectedSlugs = new Set(option('--slugs', '').split(',').filter(Boolean));
const selectedWidths = new Set(option('--widths', '').split(',').filter(Boolean).map(Number));
const selected = manifest.projects.filter(record => !selectedSlugs.size || selectedSlugs.has(record.slug));
const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 375, height: 844 }].filter(viewport => !selectedWidths.size || selectedWidths.has(viewport.width));
const pages = [], checks = [], actions = [], catalogues = [], screenshots = [], popups = [];
const requests = { mockApiCalls: [], unexpectedWrites: [], localFailures: [], externalIsolated: 0 };
const check = (passed, label, evidence) => checks.push({ passed: !!passed, label, ...(evidence === undefined ? {} : { evidence }) });
const reportPath = resolve(output, 'report.json');
const report = completed => ({ base, completed, methodology: 'Headless Chrome at 375, 768 and 1440 CSS pixels. All first-party images decode; gallery and plan ownership matches the reviewed PDF manifest. Each ficha uses an isolated browser context, and each image must finish loading before strict decode. Real catalogue searches and navigation links are exercised. External map documents are isolated for layout checks. Form API calls are intercepted with fixtures before network delivery; no real messages or bookings are sent.', targets: selected.map(record => record.slug), viewports, pages, catalogues, actions, popups, requests, screenshots, checks, failures: checks.filter(row => !row.passed) });
await mkdir(output, { recursive: true });
const save = async (completed = false) => writeFile(reportPath, JSON.stringify(report(completed), null, 2) + '\n');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const openContext = async viewport => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) {
        let body = null; try { body = request.postDataJSON(); } catch {}
        if (url.origin === origin && ['/api/contact', '/api/booking-create', '/api/booking-availability'].includes(url.pathname)) {
          requests.mockApiCalls.push({ path: url.pathname, method: request.method(), project: body?.proyecto ?? null, date: body?.date ?? null });
          if (url.pathname === '/api/booking-availability') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, available: true }) });
          return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'preview_read_only', error: 'La vista previa no envía mensajes ni reservas reales.' }) });
        }
        requests.unexpectedWrites.push({ path: url.pathname, method: request.method() });
        return route.abort();
      }
      if (url.origin === origin) {
        if (url.pathname === '/api/uf') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ uf: { valueClp: 40000, date: '2026-10-13', source: { url: 'https://www.sii.cl/' } } }) });
        return route.continue(process.env.VERCEL_OIDC_TOKEN ? { headers: { ...request.headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } } : {});
      }
      requests.externalIsolated++;
      if (request.isNavigationRequest()) return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><title>Mapa aislado para comprobar diseño</title><body style="margin:0;background:#e5e7eb;height:100vh"></body></html>' });
      if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      return route.abort();
    });
    context.on('response', response => { const url = new URL(response.url()); if (url.origin === origin && response.status() >= 400 && !url.pathname.startsWith('/api/')) requests.localFailures.push({ path: url.pathname, status: response.status() }); });
    return context;
};
try {
  check(manifest.projects.length === 17 && new Set(manifest.projects.map(record => record.slug)).size === 17 && NORTE_VERDE_SLUGS.every(slug => manifest.projects.some(record => record.slug === slug)), 'Exactly seventeen distinct authorized documentary records');
  check(catalogue.filter(record => record.inmobiliaria === 'Norte Verde').length === 17 && catalogue.filter(record => record.inmobiliaria !== 'Norte Verde').length === 117, 'Catalogue contains seventeen Norte Verde and 117 other projects');
  for (const viewport of viewports) {
    let context = await openContext(viewport);
    let page = await context.newPage(); let errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const record of selected) {
      errors = [];
      const url = '/' + record.slug + '.html';
      const response = await page.goto(base + url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].filter(link => new URL(link.href).origin === location.origin).every(link => !!link.sheet));
      for (const image of await page.locator('img').all()) {
        await image.scrollIntoViewIfNeeded();
        try {
          // decode() can run before Chromium has started a lazy image request.
          // Wait for its actual loaded dimensions; corrupt/missing media still fails.
          await page.waitForFunction(element => element.complete && element.naturalWidth > 0, await image.elementHandle(), { timeout: 20000 });
          await image.evaluate(element => element.decode());
        } catch (error) { check(false, viewport.name + ' ' + record.slug + ' image decodes', { path: await image.getAttribute('src'), error: error.message }); }
      }
      const evidence = await page.evaluate(record => {
        const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
        const images = [...document.images];
        const expected = [...record.images, ...record.models.map(model => model.plan)];
        const links = page => [...document.querySelectorAll('a[href]')].filter(anchor => new URL(anchor.href).pathname === page && new URL(anchor.href).searchParams.get('proyecto') === record.slug).map(anchor => anchor.getAttribute('href'));
        return { actualWidth: innerWidth, actualHeight: innerHeight, heading: document.querySelector('h1')?.textContent.trim(), overflow: document.documentElement.scrollWidth - innerWidth,
          duplicateIds: ids.length - new Set(ids).size, brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].map(anchor => anchor.getAttribute('href')).filter(href => href.length > 1 && !ids.includes(href.slice(1))),
          failedImages: images.filter(image => !image.complete || !image.naturalWidth).map(image => new URL(image.src).pathname),
          images: expected.map(asset => { const image = images.find(image => new URL(image.src).pathname === asset.localPath); return { path: asset.localPath, found: !!image, width: image?.naturalWidth, height: image?.naturalHeight, expectedWidth: asset.width, expectedHeight: asset.height, alt: image?.alt, href: image?.closest('a')?.getAttribute('href'), target: image?.closest('a')?.target }; }),
          modelCount: document.querySelectorAll('.nv-model').length, contact: links('/contacto.html'), booking: links('/agenda-asesoria.html'),
          brochure: [...document.querySelectorAll('a[href]')].some(anchor => new URL(anchor.href).pathname === record.document.localPath),
          blankSections: [...document.querySelectorAll('main section')].filter(section => !section.innerText.trim() && !section.querySelector('img,iframe')).map(section => section.id),
          foreignProjectAssets: images.filter(image => image.src.includes('/assets/propiedades/norte-verde/') && !new URL(image.src).pathname.startsWith('/assets/propiedades/norte-verde/' + record.slug + '/')).map(image => new URL(image.src).pathname),
          lazyFrames: [...document.querySelectorAll('iframe')].every(frame => frame.loading === 'lazy' && frame.title && frame.referrerPolicy === 'strict-origin-when-cross-origin'),
          mapCount: document.querySelectorAll('iframe[src*="google.com/maps"]').length,
        };
      }, record);
      const prefix = viewport.name + ' ' + record.slug;
      check(response.status() === 200, prefix + ' HTTP 200');
      check(evidence.actualWidth === viewport.width && evidence.actualHeight === viewport.height, prefix + ' actual requested viewport');
      check(evidence.heading === record.name, prefix + ' correct project identity');
      check(evidence.overflow <= 2, prefix + ' no page overflow', evidence.overflow);
      check(!evidence.duplicateIds && !evidence.brokenAnchors.length, prefix + ' valid section navigation');
      check(!evidence.failedImages.length && !evidence.foreignProjectAssets.length, prefix + ' intact same-project assets');
      check(evidence.modelCount === record.models.length, prefix + ' all documentary plans shown');
      check(evidence.contact.length > 0 && evidence.booking.length > 0, prefix + ' contextual consultation and booking links');
      check(evidence.brochure, prefix + ' original PDF link');
      check(!evidence.blankSections.length, prefix + ' no empty sections');
      check(evidence.lazyFrames, prefix + ' safe lazy map embedding');
      check(evidence.mapCount === (record.location?.address && record.location?.commune && record.location?.mapVerified !== false ? 1 : 0), prefix + ' map only with documentary address');
      check(!errors.length, prefix + ' no script errors', errors);
      for (const asset of evidence.images) check(asset.found && asset.width === asset.expectedWidth && asset.height === asset.expectedHeight && !!asset.alt, prefix + ' decoded reviewed asset ' + asset.path);
      if (viewport.name === 'desktop') {
        for (const asset of [record.images[0], record.models[0]?.plan].filter(Boolean)) {
          const anchor = page.locator('a[href="' + asset.localPath + '"]').first();
          const [popup] = await Promise.all([page.waitForEvent('popup'), anchor.click()]);
          await popup.waitForLoadState('domcontentloaded'); await popup.waitForFunction(() => document.images[0]?.complete && document.images[0]?.naturalWidth > 0);
          const dimensions = await popup.locator('img').first().evaluate(image => ({ width: image.naturalWidth, height: image.naturalHeight }));
          const passed = new URL(popup.url()).pathname === asset.localPath && dimensions.width === asset.width && dimensions.height === asset.height;
          check(passed, prefix + ' actual native enlargement ' + asset.localPath); popups.push({ slug: record.slug, path: asset.localPath, ...dimensions, passed }); await popup.close();
        }
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      const file = viewport.name + '-' + record.slug + '.png'; await page.screenshot({ path: resolve(output, file), fullPage: true }); screenshots.push(file);
      pages.push({ slug: record.slug, viewport: viewport.name, status: response.status(), ...evidence, errors: [...errors] });
      if (viewport.name === 'desktop') {
        await page.locator('a[href="/contacto.html?proyecto=' + record.slug + '"]').first().click();
        await page.waitForURL('**/contacto.html?proyecto=' + record.slug); await page.locator('#contact-project-context').waitFor({ state: 'visible' });
        const contactText = await page.locator('#contact-project-context').innerText();
        check(contactText.includes(record.name), prefix + ' consultation context resolves name');
        await page.locator('#nombre').fill('Prueba de revisión'); await page.locator('#correo').fill('qa@example.invalid'); await page.locator('#mensaje').fill('Prueba local de la ficha ' + record.name + '. Sin envío real.');
        await page.locator('#contact-form button[type="submit"]').click(); await page.locator('#form-status').filter({ hasText: 'La vista previa no envía' }).waitFor();
        check(requests.mockApiCalls.at(-1)?.path === '/api/contact' && requests.mockApiCalls.at(-1)?.project === record.slug, prefix + ' consultation request has correct slug and remains mocked');
        await page.locator('a[href="/agenda-asesoria.html?proyecto=' + record.slug + '"]').first().click(); await page.waitForURL('**/agenda-asesoria.html?proyecto=' + record.slug);
        await page.locator('#agenda-project-back').waitFor({ state: 'visible' });
        const bookingTitle = await page.locator('#agenda-reserva-titulo').innerText();
        check(bookingTitle === 'Asesoría sobre ' + record.name, prefix + ' booking context resolves name');
        check(await page.locator('#agenda-project-back-link').getAttribute('href') === url, prefix + ' booking returns to exact ficha');
        const date = await page.locator('#booking-date').evaluate(element => { const value = new Date(element.min + 'T12:00:00Z'); do { value.setUTCDate(value.getUTCDate() + 1); } while ([0,6].includes(value.getUTCDay())); return value.toISOString().slice(0,10); });
        await page.locator('#booking-date').fill(date); await page.locator('#booking-time').selectOption('10:00'); await page.locator('#booking-check').click(); await page.locator('#booking-details').waitFor({ state: 'visible' });
        for (const [name, value] of Object.entries({ nombre: 'Prueba', apellido: 'Revisión', correo: 'qa@example.invalid', telefono: '+56911111111' })) await page.locator('#booking-form [name="' + name + '"]').fill(value);
        await page.locator('#booking-submit').click(); await page.locator('#booking-status').filter({ hasText: 'La vista previa no envía' }).waitFor();
        check(requests.mockApiCalls.at(-1)?.path === '/api/booking-create' && requests.mockApiCalls.at(-1)?.project === record.slug, prefix + ' booking request has correct slug and remains mocked');
        actions.push({ slug: record.slug, contactText, bookingTitle, contactMock: true, availabilityMock: true, bookingMock: true });
      }
      await save();
      // Release the whole storage/media partition between documentary fiches.
      await page.close();
      await context.close();
      context = await openContext(viewport);
      page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
    }
    await page.goto(base + '/proyectos.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('#search')?.disabled && document.querySelectorAll('.catalog-card').length > 0);
    check(await page.locator('.catalog-card').count() === catalogue.length, viewport.name + ' complete catalogue preserved');
    await page.locator('#search').fill('Norte Verde'); await page.waitForFunction(() => document.querySelectorAll('.catalog-card').length === 17);
    const displayed = await page.locator('.catalog-card').evaluateAll(cards => cards.map(card => ({ slug: card.dataset.project, href: card.querySelector('.catalog-details-link')?.getAttribute('href') })));
    check(displayed.length === 17 && displayed.every(card => NORTE_VERDE_SLUGS.includes(card.slug)) && new Set(displayed.map(card => card.slug)).size === 17, viewport.name + ' real Norte Verde filter returns exactly authorized seventeen');
    check(!displayed.some(card => NORTE_VERDE_RETIRED_SLUGS.includes(card.slug)), viewport.name + ' retired projects excluded');
    for (const card of displayed) {
      const element = page.locator('.catalog-card[data-project="' + card.slug + '"]'); await element.scrollIntoViewIfNeeded(); await element.locator('img').evaluate(image => image.decode());
      const expected = manifest.projects.find(record => record.slug === card.slug);
      check(card.href === '/' + card.slug + '.html', viewport.name + ' catalogue detail route ' + card.slug);
      check(await element.locator('img').evaluate((image, path) => new URL(image.src).pathname === path && image.naturalWidth > 0, expected.cover), viewport.name + ' catalogue reviewed facade ' + card.slug);
    }
    const catalogOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); check(catalogOverflow <= 2, viewport.name + ' catalogue no overflow', catalogOverflow);
    await page.evaluate(() => window.scrollTo(0,0)); const file = viewport.name + '-catalogue-norte-verde.png'; await page.screenshot({ path: resolve(output, file), fullPage: true }); screenshots.push(file); catalogues.push({ viewport: viewport.name, displayed, overflow: catalogOverflow });
    await context.close(); await save();
  }
} catch (error) { check(false, 'Browser verification stopped: ' + error.message); await save(); }
finally { await browser.close(); }
check(!requests.localFailures.length, 'No missing first-party page, CSS, gallery, plan or PDF responses', requests.localFailures);
check(!requests.unexpectedWrites.length, 'No unexpected write escaped or was attempted', requests.unexpectedWrites);
const completed = pages.length === selected.length * viewports.length && checks.every(row => row.passed);
await save(completed);
console.log(JSON.stringify({ completed, pages: pages.length, catalogueWidths: catalogues.length, contextualFlows: actions.length, checkedNativePopups: popups.length, mockedApiCalls: requests.mockApiCalls.length, failures: checks.filter(row => !row.passed).length, report: reportPath }));
if (!completed) process.exitCode = 1;
