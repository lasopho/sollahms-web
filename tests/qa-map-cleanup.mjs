// Read-only audit of all 144 fiches, plus controlled recovery and live Google UI.
// No forms or external links are submitted/clicked. Only actual iframe `error`
// events may reveal the recovery link; the layout pass isolates remote frames.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const base = option('--base', 'http://127.0.0.1:8898').replace(/\/$/, '');
const output = resolve(option('--output', '/private/tmp/sollahms-map-cleanup-qa'));
const siteRoot = resolve(option('--site-root', root));
const baselineRef = option('--baseline-ref', 'bb69615d03230cbab76bdc2678938cc741f80e86');
const live = !process.argv.includes('--skip-live');
const projects = JSON.parse(await readFile(resolve(root, 'data/proyectos.json')));
const baseline = new Map(projects.map(project => [project.slug,
  execFileSync('git', ['show', `${baselineRef}:${project.slug}.html`], { cwd: root, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 })]));
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];
const samples = new Set(['bcome', 'inn-puerto-chico', 'distrito-centro', 'centenario-1', 'edificio-verne', 'endemico', 'irarrazaval']);
const results = [], errors = [], screenshots = [], fallbackResults = [], liveResults = [];
const externalMutations = [];
const origin = new URL(base).origin;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

async function isolate(context) {
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      externalMutations.push({ method: request.method(), url: request.url() });
      return route.abort();
    }
    if (request.isNavigationRequest() && url.origin !== origin) return route.fulfill({
      status: 200, contentType: 'text/html', body: '<!doctype html><html><body>Provider isolated for responsive layout QA</body></html>',
    });
    if (url.hostname === 'fonts.googleapis.com') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    if (url.origin !== origin) return route.abort();
    if (process.env.VERCEL_OIDC_TOKEN) return route.continue({
      headers: { ...request.headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN },
    });
    return route.continue();
  });
}

async function inspect(page, originalHtml, project) {
  return page.evaluate(({ originalHtml, project }) => {
    const original = new DOMParser().parseFromString(originalHtml, 'text/html');
    const clean = text => (text || '').replace(/\s+/g, ' ').trim();
    const attrs = (element, names) => Object.fromEntries(names.map(name => [name, element.getAttribute(name)]));
    const mapLink = element => /https:\/\/(?:www\.)?google\.[^/]+\/maps/.test(element.getAttribute('href') || '');
    const inventory = doc => ({
      frames: [...doc.querySelectorAll('iframe')].map(element => attrs(element, ['src', 'title', 'loading', 'allow', 'allowfullscreen', 'referrerpolicy', 'data-project-embed', 'data-embed-fallback'])),
      images: [...doc.querySelectorAll('img')].map(element => attrs(element, ['src', 'srcset', 'alt', 'loading'])),
      links: [...doc.querySelectorAll('a')].filter(element => !mapLink(element)).map(element => ({ ...attrs(element, ['href', 'target', 'rel']), text: clean(element.textContent) })),
      specifications: [...doc.querySelectorAll('.spec-grid, .price-block, #caracteristicas, #detalle-adicional')].map(element => clean(element.textContent)),
      directions: [...doc.querySelectorAll('dt')].filter(element => /direcci[oó]n/i.test(element.textContent)).map(element => clean(element.nextElementSibling?.textContent)),
      plans: [...doc.querySelectorAll('img')].filter(element => /plano/i.test([element.getAttribute('src'), element.getAttribute('alt')].join(' '))).map(element => attrs(element, ['src', 'alt'])),
      endemicoException: [...doc.querySelectorAll('a')].filter(element => element.getAttribute('href') === 'https://mybakerlab.com/endemico/').map(element => ({ ...attrs(element, ['href', 'target', 'rel']), text: clean(element.textContent) })),
    });
    const current = inventory(document), previous = inventory(original);
    const maps = [...document.querySelectorAll('iframe[data-project-embed="map"]')];
    const emptyLeftovers = [];
    const mapLayout = maps.map(frame => {
      const shell = frame.closest('.project-embed-map'), parent = shell.parentElement;
      const bounds = frame.getBoundingClientRect(), shellBounds = shell.getBoundingClientRect();
      const following = [];
      for (let node = shell.nextElementSibling; node; node = node.nextElementSibling) {
        if (getComputedStyle(node).display === 'none' || ['SCRIPT', 'NOSCRIPT'].includes(node.tagName)) continue;
        following.push({ tag: node.tagName, className: node.className, text: clean(node.textContent).slice(0, 200) });
        if (!clean(node.textContent) && !node.querySelector('iframe,img,svg,button,video,input')) emptyLeftovers.push(node.outerHTML.slice(0, 200));
      }
      return { src: frame.getAttribute('src'), width: Math.round(bounds.width), height: Math.round(bounds.height),
        shellHeight: Math.round(shellBounds.height), parentTag: parent.tagName, parentId: parent.id, following,
        marginBottom: parseFloat(getComputedStyle(shell).marginBottom),
        outsideViewport: bounds.left < -2 || bounds.right > innerWidth + 2,
      };
    });
    const address = project.direccion ? clean(project.direccion) : null;
    const ids = new Set([...document.querySelectorAll('[id]')].map(element => element.id));
    return {
      current, previous, title: clean(document.querySelector('h1')?.textContent),
      mapCount: maps.length, tourCount: document.querySelectorAll('iframe[data-project-embed="tour"]').length,
      persistentMapLinks: [...document.querySelectorAll('a')].filter(mapLink).map(element => element.outerHTML),
      genericNote: /Google Maps determina el marcador por dirección\. Confirma el acceso exacto al consultar\./.test(document.body.textContent),
      obsoleteNoscript: /El enlace a Google Maps permite consultar la ubicaci[oó]n sin JavaScript/.test(document.body.textContent),
      emptyLeftovers, mapLayout, overflow: document.documentElement.scrollWidth - innerWidth,
      addressPreserved: !address || clean(document.body.textContent).includes(address),
      brokenFragments: [...document.querySelectorAll('a[href^="#"]')].filter(element => !ids.has(element.getAttribute('href').slice(1))).map(element => element.getAttribute('href')),
      locationPresent: !!document.querySelector('#ubicacion'),
      embeddedEndemicoException: [...document.querySelectorAll('iframe')].some(element => element.getAttribute('src') === 'https://mybakerlab.com/endemico/'),
    };
  }, { originalHtml, project });
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    await isolate(context);
    let index = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      const page = await context.newPage();
      while (index < projects.length) {
        const project = projects[index++], rowErrors = [];
        const onError = error => rowErrors.push('Page error: ' + error.message);
        page.on('pageerror', onError);
        try {
          const response = await page.goto(base + project.detalleUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
          const expectedHtml = await readFile(resolve(siteRoot, project.slug + '.html'));
          const servedHtml = await response.body();
          const htmlMatchesSite = createHash('sha256').update(expectedHtml).digest('hex') === createHash('sha256').update(servedHtml).digest('hex');
          const inspected = await inspect(page, baseline.get(project.slug), project);
          if (response.status() !== 200) rowErrors.push('HTML HTTP ' + response.status());
          if (!htmlMatchesSite) rowErrors.push('Served HTML differs from requested site root');
          if (inspected.overflow > 2) rowErrors.push('Horizontal overflow: ' + inspected.overflow);
          if (!inspected.addressPreserved) rowErrors.push('Project address missing');
          if (inspected.persistentMapLinks.length) rowErrors.push('Persistent external map link remains');
          if (inspected.genericNote) rowErrors.push('Generic geocoding note remains');
          if (inspected.obsoleteNoscript) rowErrors.push('Obsolete map-link noscript remains');
          if (inspected.emptyLeftovers.length) rowErrors.push('Empty element remains after map');
          if (inspected.brokenFragments.length) rowErrors.push('Broken fragment target: ' + inspected.brokenFragments.join(', '));
          if (inspected.mapLayout.some(map => map.outsideViewport || map.height < 240)) rowErrors.push('Map has invalid responsive dimensions');
          for (const key of ['frames', 'images', 'links', 'specifications', 'directions', 'plans', 'endemicoException']) {
            if (!equal(inspected.current[key], inspected.previous[key])) rowErrors.push('Baseline inventory changed: ' + key);
          }
          if (inspected.current.frames.some(frame => frame.loading !== 'lazy')) rowErrors.push('Iframe lacks lazy loading');
          if (project.slug === 'endemico' && (inspected.embeddedEndemicoException || inspected.current.endemicoException.length !== 1)) rowErrors.push('Endémico external exception changed');
          const automaticFrames = [];
          for (const frame of await page.locator('iframe[data-project-embed]').all()) {
            const src = await frame.getAttribute('src');
            await frame.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
            const child = await (await frame.elementHandle()).contentFrame();
            let automatic = false;
            try { await child.waitForURL(src, { timeout: 5000 }); automatic = true; }
            catch { rowErrors.push('Iframe did not load automatically on scroll: ' + src); }
            automaticFrames.push({ src, automatic });
          }
          if (samples.has(project.slug)) {
            const target = page.locator('.project-embed-map, #ubicacion').last();
            if (await target.count()) await target.scrollIntoViewIfNeeded();
            const filename = `${viewport.name}-${project.slug}-map.png`;
            await page.screenshot({ path: resolve(output, filename) });
            screenshots.push(filename);
          }
          // Reinspect after successful automatic frame loads: no recovery link.
          if (await page.locator('a[href*="google.com/maps"]').count()) rowErrors.push('Recovery appeared after healthy load');
          const { current, previous, ...layout } = inspected;
          results.push({ slug: project.slug, viewport: viewport.name, status: response.status(), htmlMatchesSite,
            ...layout, imageCount: current.images.length, planCount: current.plans.length,
            inventoryPreserved: { frames: equal(current.frames, previous.frames), images: equal(current.images, previous.images),
              links: equal(current.links, previous.links), specifications: equal(current.specifications, previous.specifications),
              directions: equal(current.directions, previous.directions), plans: equal(current.plans, previous.plans) },
            automaticFrames, errors: rowErrors });
        } catch (error) {
          rowErrors.push(error.message);
          results.push({ slug: project.slug, viewport: viewport.name, errors: rowErrors });
        }
        if (rowErrors.length) {
          const failure = { slug: project.slug, viewport: viewport.name, errors: rowErrors };
          errors.push(failure);
          console.log(JSON.stringify({ phase: 'responsive-failure', ...failure }));
        }
        page.off('pageerror', onError);
      }
      await page.close();
    }));
    await context.close();
    await writeFile(resolve(output, 'responsive-progress.json'), JSON.stringify({ base, siteRoot, baselineRef, results, errors }, null, 2) + '\n');
    console.log(JSON.stringify({ phase: 'responsive', viewport: viewport.name, checked: results.filter(row => row.viewport === viewport.name).length, failures: errors.filter(row => row.viewport === viewport.name).length }));
  }

  // Deliberately dispatch the browser's actual error event through the retained
  // listener. No timing heuristic or cross-origin load event means failure.
  for (const slug of ['bcome', 'inn-puerto-chico', 'distrito-centro', 'edificio-verne']) {
    const context = await browser.newContext({ viewport: viewports[2] });
    await isolate(context);
    const page = await context.newPage();
    await page.goto(`${base}/${slug}.html`, { waitUntil: 'domcontentloaded' });
    const frame = page.locator('iframe[data-project-embed="map"]').first();
    await frame.scrollIntoViewIfNeeded();
    await (await (await frame.elementHandle()).contentFrame()).waitForURL(await frame.getAttribute('src'));
    const healthy = await page.locator('a[href*="google.com/maps"]').count();
    await frame.evaluate(element => element.dispatchEvent(new Event('load')));
    const afterLoad = await page.locator('a[href*="google.com/maps"]').count();
    const expectedHref = await frame.getAttribute('data-embed-fallback');
    await frame.evaluate(element => element.dispatchEvent(new Event('error')));
    const recovery = page.locator('.project-embed-fallback a[href*="google.com/maps"]');
    const recovered = await recovery.evaluateAll(elements => elements.map(element => ({ href: element.getAttribute('href'), target: element.target, rel: element.rel, visible: !!element.getClientRects().length })));
    const row = { slug, healthyLinkCount: healthy, linkCountAfterLoadEvent: afterLoad, recovery: recovered,
      mapFramesAfterError: await page.locator('iframe[data-project-embed="map"]').count(),
      passed: healthy === 0 && afterLoad === 0 && recovered.length === 1 && recovered[0].visible && recovered[0].href === expectedHref && recovered[0].target === '_blank' && recovered[0].rel.includes('noopener') };
    fallbackResults.push(row);
    await page.screenshot({ path: resolve(output, `mobile-${slug}-error-recovery.png`) });
    if (!row.passed) errors.push({ slug, phase: 'controlled-error-recovery', details: row });
    await context.close();
  }

  if (live) for (const viewport of viewports) for (const slug of ['bcome', 'inn-puerto-chico', 'distrito-centro']) {
    const context = await browser.newContext({ viewport });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) return route.abort();
      if (request.isNavigationRequest() && url.origin !== origin && !url.hostname.endsWith('google.com')) return route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Tour isolated during live Google-map QA</body></html>' });
      if (url.origin === origin && process.env.VERCEL_OIDC_TOKEN) return route.continue({ headers: { ...request.headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } });
      return route.continue();
    });
    const page = await context.newPage(), networkFailures = [];
    page.on('requestfailed', request => { if (request.isNavigationRequest()) networkFailures.push({ url: request.url(), error: request.failure()?.errorText }); });
    await page.goto(`${base}/${slug}.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const element = page.locator('iframe[data-project-embed="map"]').first();
    await element.scrollIntoViewIfNeeded();
    const child = await (await element.elementHandle()).contentFrame();
    let evidence;
    try {
      await child.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await child.waitForTimeout(4000);
      evidence = await child.evaluate(() => {
        const visible = element => {
          const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        return { url: location.href, title: document.title, text: document.body?.innerText.slice(0, 800),
          nativeLinks: [...document.querySelectorAll('a[href]')].filter(visible).map(element => ({ href: element.href, text: element.textContent.trim(), title: element.title, ariaLabel: element.getAttribute('aria-label') })),
          controls: [...document.querySelectorAll('button,[role="button"]')].filter(visible).map(element => ({ text: element.textContent.trim(), title: element.title, ariaLabel: element.getAttribute('aria-label') })).slice(0, 30),
          loadedImages: [...document.images].filter(element => visible(element) && element.complete && element.naturalWidth > 0).length,
          canvases: document.querySelectorAll('canvas').length,
        };
      });
    } catch (error) { evidence = { inspectionError: error.message }; }
    const nativeGoogleControl = evidence?.nativeLinks?.some(link => /google\.[^/]+\/maps/.test(link.href) && /map|google|ver|view/i.test([link.text, link.title, link.ariaLabel].join(' '))) || false;
    const filename = `live-${viewport.name}-${slug}-map.png`;
    await page.screenshot({ path: resolve(output, filename) });
    const persistentLinks = await page.locator('a[href*="google.com/maps"]').count();
    liveResults.push({ slug, viewport: viewport.name, nativeGoogleControl, persistentLinks, networkFailures, screenshot: filename, evidence });
    if (persistentLinks) errors.push({ slug, viewport: viewport.name, phase: 'live-google', error: 'External fallback appeared during live map inspection' });
    console.log(JSON.stringify({ phase: 'live-google', slug, viewport: viewport.name, nativeGoogleControl, persistentLinks }));
    await context.close();
  }
} finally { await browser.close(); }

const counts = viewports.map(viewport => {
  const rows = results.filter(row => row.viewport === viewport.name);
  return { viewport: viewport.name, fiches: rows.length, maps: rows.reduce((sum, row) => sum + (row.mapCount || 0), 0),
    tours: rows.reduce((sum, row) => sum + (row.tourCount || 0), 0), plans: rows.reduce((sum, row) => sum + (row.planCount || 0), 0),
    maplessFiches: rows.filter(row => row.mapCount === 0).map(row => row.slug),
    healthyPersistentLinks: rows.reduce((sum, row) => sum + (row.persistentMapLinks?.length || 0), 0) };
});
if (counts.some(row => row.fiches !== 144 || row.maps !== 137 || row.tours !== 97 || row.plans !== 142)) errors.push({ phase: 'catalogue-counts', counts });
const report = { base, siteRoot, baselineRef, generatedAt: new Date().toISOString(), projects: projects.length,
  viewports, pageChecks: results.length, counts, externalFramesIsolatedForLayout: true, externalFontsIsolatedForLayout: true,
  automaticFrameChecks: results.reduce((sum, row) => sum + (row.automaticFrames?.length || 0), 0),
  fallbackResults, liveResults, liveNativeGoogleControlsVerified: liveResults.filter(row => row.nativeGoogleControl).length,
  screenshots, externalMutationsBlocked: externalMutations, errors,
  passed: projects.length === 144 && results.length === 432 && errors.length === 0, results };
await writeFile(resolve(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, pageChecks: report.pageChecks, counts, automaticFrameChecks: report.automaticFrameChecks,
  errorRecoveryChecks: fallbackResults.length, liveNativeGoogleControlsVerified: report.liveNativeGoogleControlsVerified, errors }));
process.exitCode = report.passed ? 0 : 1;
