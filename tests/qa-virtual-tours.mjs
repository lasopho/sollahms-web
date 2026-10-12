// Read-only browser audit of every fiche at all three requested viewports.
// External frames are isolated for 432 layout checks; live provider QA is separate.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const base = option('--base', 'http://127.0.0.1:8897');
const out = resolve(option('--output', '/private/tmp/sollahms-virtual-tour-browser'));
const packagedRoot = resolve(option('--site-root', resolve(root, 'dist')));
await mkdir(out, { recursive: true });
const projects = JSON.parse(await readFile(resolve(root, 'data/proyectos.json')));
const records = new Map(JSON.parse(await readFile(resolve(root, 'data/fichas-proyectos.json'))).map(r => [r.slug, r]));
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const results = [], errors = [];
const viewports = [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'tablet', width: 768, height: 1024 }, { name: 'mobile', width: 390, height: 844 }];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    await context.route('**/*', async route => {
      const request = route.request();
      if (!['GET', 'HEAD'].includes(request.method())) return route.abort();
      if (request.isNavigationRequest() && new URL(request.url()).origin !== new URL(base).origin) {
        return route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>External frame isolated for layout audit</body></html>' });
      }
      if (new URL(request.url()).origin !== new URL(base).origin && !/fonts\.(googleapis|gstatic)\.com/.test(new URL(request.url()).hostname)) return route.abort();
      if (new URL(request.url()).origin === new URL(base).origin && process.env.VERCEL_OIDC_TOKEN) {
        return route.continue({ headers: { ...request.headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } });
      }
      return route.continue();
    });
    let index = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      const page = await context.newPage();
      while (index < projects.length) {
        const project = projects[index++], record = records.get(project.slug);
        const localErrors = [];
        const onError = e => localErrors.push(e.message);
        page.on('pageerror', onError);
        const response = await page.goto(base + project.detalleUrl, { waitUntil: 'load', timeout: 45000 });
        const localHtml = await readFile(resolve(packagedRoot, project.slug + '.html'));
        const htmlMatchesPackagedPreview = createHash('sha256').update(await response.body()).digest('hex') === createHash('sha256').update(localHtml).digest('hex');
        const inspected = await page.evaluate(() => {
          const visible = e => !!e.getClientRects().length;
          const ids = new Set([...document.querySelectorAll('[id]')].map(e => e.id));
          const broken = [...document.querySelectorAll('a[href^="#"]')].filter(e => !ids.has(e.getAttribute('href').slice(1))).map(e => e.getAttribute('href'));
          const empty = [...document.querySelectorAll('main section')].filter(e => {
            const c = e.cloneNode(true);
            c.querySelectorAll('h1,h2,h3,.eyebrow').forEach(n => n.remove());
            return !c.textContent.trim() && !c.querySelector('img,iframe,button,svg,video');
          }).map(e => e.id || e.className);
          const location = document.querySelector('#ubicacion');
          const previous = location?.previousElementSibling;
          const gap = location && previous ? Math.round(location.getBoundingClientRect().top - previous.getBoundingClientRect().bottom) : null;
          const margin = previous ? parseFloat(getComputedStyle(previous).marginBottom) : null;
          return { title: document.querySelector('h1')?.innerText, tourSection: !!document.querySelector('#recorrido'),
            legacyTour: [...document.querySelectorAll('h2')].some(e => /Recorridos y experiencias oficiales/.test(e.textContent)),
            tourNav: !!document.querySelector('a[href="#recorrido"]'), broken, empty,
            placeholder: /Consulta la disponibilidad de un recorrido virtual/.test(document.body.innerText),
            overflow: document.documentElement.scrollWidth - innerWidth, locationGap: gap, previousMargin: margin,
            visibleLocation: location ? visible(location) : null, localImages: [...document.images].filter(e => e.src.startsWith(location?.ownerDocument.location.origin || document.location.origin)).length };
        });
        const expected = !!record.virtualTours.length && project.slug !== 'irarrazaval';
        if (response.status() !== 200) localErrors.push('HTML HTTP ' + response.status());
        if (!htmlMatchesPackagedPreview) localErrors.push('HTML differs from packaged Preview');
        if (inspected.broken.length) localErrors.push('Broken fragments: ' + inspected.broken.join(','));
        if (inspected.empty.length) localErrors.push('Empty sections: ' + inspected.empty.join(','));
        if (inspected.overflow > 2) localErrors.push('Horizontal overflow: ' + inspected.overflow);
        if (inspected.placeholder) localErrors.push('Absent-tour message');
        if (!expected && (inspected.tourSection || inspected.tourNav || inspected.legacyTour)) localErrors.push('Tour remains without usable registration');
        if (expected && !inspected.tourSection && !inspected.legacyTour) localErrors.push('Registered tour section missing');
        if (!expected && inspected.locationGap !== null && Math.abs(inspected.locationGap - inspected.previousMargin) > 2) localErrors.push('Location gap differs from normal section margin');
        if (await page.locator('[data-embed-src]').count()) localErrors.push('Activation button remains');
        if (await page.getByText('Abrir recorrido original', { exact: false }).count()) localErrors.push('Redundant original viewer link remains');
        const frameChecks = [];
        const frames = page.locator('iframe');
        for (let n = 0; n < await frames.count(); n++) {
          const frame = frames.nth(n);
          const attributes = await frame.evaluate(f => ({ src: f.src, title: f.title, loading: f.loading,
            referrerPolicy: f.referrerPolicy, allowFullscreen: f.allowFullscreen, allow: f.allow,
            width: f.getBoundingClientRect().width, height: f.getBoundingClientRect().height }));
          if (attributes.loading !== 'lazy') localErrors.push('Iframe is not lazy');
          if (!attributes.title || !attributes.src.startsWith('https://')) localErrors.push('Iframe missing safe URL/title');
          if (attributes.referrerPolicy !== 'strict-origin-when-cross-origin') localErrors.push('Iframe missing referrer policy');
          if (!attributes.src.includes('google.com/maps') && !attributes.allowFullscreen) localErrors.push('Tour lacks fullscreen permission');
          await frame.evaluate(f => f.scrollIntoView({ block: 'center', behavior: 'instant' }));
          const handle = await frame.elementHandle();
          const child = await handle.contentFrame();
          try {
            await child.waitForURL(attributes.src, { timeout: 5000 });
            frameChecks.push({ ...attributes, autoLoadedAfterScroll: true });
          } catch {
            localErrors.push('Iframe did not load automatically after scrolling: ' + attributes.src);
            frameChecks.push({ ...attributes, autoLoadedAfterScroll: false });
          }
        }
        if (['bcome', 'distrito-centro', 'centenario-1', 'irarrazaval', 'inn-puerto-chico', 'endemico', 'edificio-verne'].includes(project.slug)) {
          const target = page.locator('#ubicacion').first();
          if (await target.count()) await target.scrollIntoViewIfNeeded();
          await page.screenshot({ path: resolve(out, `${viewport.name}-${project.slug}.png`) });
        }
        const row = { slug: project.slug, viewport: viewport.name, expectedTour: expected, status: response.status(), htmlMatchesPackagedPreview, ...inspected, frameChecks, errors: localErrors };
        results.push(row);
        if (localErrors.length) errors.push({ slug: project.slug, viewport: viewport.name, errors: localErrors });
        page.off('pageerror', onError);
      }
      await page.close();
    }));
    await context.close();
    console.log(JSON.stringify({ viewport: viewport.name, checked: results.filter(r => r.viewport === viewport.name).length, errors: errors.filter(r => r.viewport === viewport.name).length }));
  }
} finally { await browser.close(); }
const report = { base, packagedRoot, projects: projects.length, viewports, pageChecks: results.length,
  automaticFrameChecks: results.reduce((sum, r) => sum + r.frameChecks.length, 0), externalFramesIsolated: true, externalPostRequests: 0,
  passed: errors.length === 0 && results.length === 432, errors, results };
await writeFile(resolve(out, 'responsive-results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, pageChecks: report.pageChecks, automaticFrameChecks: report.automaticFrameChecks, errors }));
process.exitCode = report.passed ? 0 : 1;
