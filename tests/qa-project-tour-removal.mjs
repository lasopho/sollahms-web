// Read-only Chromium QA. No form submits, API mutations or provider activation.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const base = process.env.QA_BASE || 'http://127.0.0.1:8898';
if (process.env.QA_REQUIRE_REMOTE === '1' && new URL(base).protocol !== 'https:')
  throw new Error('Release QA must use the actual HTTPS deployment');
const output = resolve(process.env.QA_OUTPUT || 'docs/recorridos-eliminacion-20261115');
const records = JSON.parse(await readFile('data/proyectos.json', 'utf8'));
const slugs = process.env.QA_SLUGS ? process.env.QA_SLUGS.split(',') : records.map(row => row.slug);
const widths = (process.env.QA_WIDTHS || '1440,768,390,320').split(',').map(Number);
const samples = new Set(['inn-puerto-chico', 'plaza-las-condes', 'bcome', 'nucleo-costanera', 'bordevivo', 'distrito-centro']);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage',
    ...(process.env.QA_PROXY_SPKI ? ['--ignore-certificate-errors-spki-list=' + process.env.QA_PROXY_SPKI] : [])] });
const results = [];
try {
  for (const width of widths) {
    const queue = [...slugs];
    await Promise.all(Array.from({ length: 4 }, async () => {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce',
        storageState: process.env.QA_STORAGE_STATE || undefined });
      let blockedMutations = 0;
      // Source and contact checks must never produce real leads or reservations.
      await context.route('**/*', route => {
        if (new URL(route.request().url()).origin === new URL(base).origin
          && !['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
          blockedMutations++;
          return route.abort();
        }
        return route.continue();
      });
      const page = await context.newPage();
      while (queue.length) {
        blockedMutations = 0;
        const slug = queue.shift(), errors = [], failedRequests = [], failedResponses = [];
        const onError = error => errors.push(error.message);
        const onFailure = request => { if (!request.failure()?.errorText.includes('ERR_ABORTED'))
          failedRequests.push({ url: request.url().split('?')[0], error: request.failure()?.errorText }); };
        const onResponse = response => { if (response.status() >= 400)
          failedResponses.push({ url: response.url().split('?')[0], status: response.status() }); };
        page.on('pageerror', onError); page.on('requestfailed', onFailure); page.on('response', onResponse);
        const response = await page.goto(base + '/' + slug + '.html', { waitUntil: 'load', timeout: 45000 });
        if (response.status() !== 200 || !(await page.locator('#project-name').count()))
          throw new Error(slug + ': actual fiche route did not load (status ' + response.status() + ')');
        // Load the existing lazy images for a complete resource check.
        await page.evaluate(() => { for (const image of document.images) image.loading = 'eager'; });
        for (const id of ['galeria', 'planos', 'modelos', 'ubicacion', 'solicitar-cotizacion']) {
          const section = page.locator('#' + id).first();
          if (await section.count()) await section.scrollIntoViewIfNeeded();
        }
        // Exercise existing disclosure controls without submitting any form.
        for (const details of await page.locator('details:has(img)').all())
          if (await details.getAttribute('open') === null) await details.locator('summary').first().click();
        for (const intent of ['llamada', 'cotizacion']) {
          const button = page.locator('[data-request-mode="' + intent + '"]').first();
          if (await button.count()) await button.click();
        }
        await page.evaluate(async () => {
          await Promise.all([...document.images].map(image => image.complete ? null
            : new Promise(resolve => { image.addEventListener('load', resolve, { once: true });
              image.addEventListener('error', resolve, { once: true }); setTimeout(resolve, 2000); })));
        });
        const row = await page.evaluate(() => {
          const gallery = document.querySelector('#galeria');
          return {
            title: document.title, overflow: document.documentElement.scrollWidth - innerWidth,
            tourElements: document.querySelectorAll('#recorrido,.tour-card,[data-project-embed="tour"],a[href="#recorrido"]').length,
            tourText: /recorrido virtual|tour virtual|virtual tour|Galería y 360°/i.test(document.body.innerText),
            images: document.images.length,
            brokenImages: [...document.images].filter(image => !image.complete || !image.naturalWidth).map(image => image.getAttribute('src')),
            plans: document.querySelectorAll('#planos img,#modelos img').length,
            forms: [...document.forms].map(form => ({ action: form.getAttribute('action'), controls: form.elements.length })),
            commercialFields: ['nombre','rut','correo','telefono'].map(name => {
              const field = document.querySelector('form [name="' + name + '"]');
              return { name, exists: !!field, enabled: field ? !field.disabled : false,
                visible: !!field?.getClientRects().length };
            }),
            navigationTargetsExist: [...document.querySelectorAll('[data-project-navigation] a[href^="#"]')]
              .every(link => document.getElementById(link.hash.slice(1))),
            whatsapp: [...document.querySelectorAll('a[href*="wa.me/"]')].map(link => link.getAttribute('href')),
            emptySections: [...document.querySelectorAll('main section')].filter(section => !section.textContent.trim() && !section.querySelector('img,iframe,video,input')).map(section => section.id),
            galleryImageLinks: gallery?.querySelectorAll('a:has(img)').length || 0,
            galleryHeading: gallery?.querySelector('h2')?.textContent.trim()
          };
        });
        if (samples.has(slug)) {
          await page.locator('#galeria').scrollIntoViewIfNeeded();
          await page.screenshot({ path: resolve(output, `${slug}-${width}.png`) });
        }
        results.push({ slug, width, status: response.status(), ...row, errors, failedRequests, failedResponses, blockedMutations });
        page.off('pageerror', onError); page.off('requestfailed', onFailure); page.off('response', onResponse);
      }
      await context.close();
    }));
    console.log(JSON.stringify({ width, completed: results.length }));
    await writeFile(resolve(output, 'responsive-qa.json'), JSON.stringify({ base, readOnly: true, results }, null, 2) + '\n');
  }
} finally { await browser.close(); }
const failures = results.filter(row => row.status !== 200 || row.tourElements || row.tourText || row.errors.length || row.overflow > 1 || row.emptySections.length
  || row.brokenImages.length || !row.navigationTargetsExist || row.commercialFields.some(field => !field.exists || !field.enabled || !field.visible));
console.log(JSON.stringify({ pages: slugs.length, viewportChecks: results.length, failures: failures.length,
  resourceFailures: results.filter(row => row.brokenImages.length || row.failedRequests.length || row.failedResponses.length).length }));
if (failures.length) process.exitCode = 1;
