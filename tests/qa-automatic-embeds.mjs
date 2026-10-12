// Live, read-only viewer evidence and a repeatable before/after lazy-load sample.
// No application form is submitted. Provider traffic is allowed so scenes can render.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const base = option('--base', 'http://127.0.0.1:8897');
const phase = option('--phase', 'after');
const output = resolve(option('--output', '/private/tmp/sollahms-automatic-embeds'));
const slugs = option('--slugs', 'inn-puerto-chico,bcome').split(',');
const widths = option('--widths', '1440,768,390').split(',').map(Number);
const performanceOnly = process.argv.includes('--performance-only');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const width of widths) for (const slug of slugs) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 } });
    if (process.env.VERCEL_OIDC_TOKEN) await context.route(new URL(base).origin + '/**', route => route.continue({
      headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN }
    }));
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.embedLayoutShift = 0;
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.embedLayoutShift += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    const navigations = [], failures = [], errors = [];
    const bytes = { firstParty: 0, providers: 0 };
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', request => {
      if (request.isNavigationRequest() && request.frame().parentFrame() === page.mainFrame()) navigations.push(request.url());
    });
    page.on('requestfailed', r => {
      if (r.isNavigationRequest()) failures.push({ url: r.url(), error: r.failure()?.errorText });
    });
    // Playwright emits finished requests for out-of-process child frames too.
    // A page-only CDP session misses their traffic and understates viewer costs.
    const pendingSizes = new Set();
    page.on('requestfinished', request => {
      const pending = request.sizes().then(sizes => {
        const group = new URL(request.url()).origin === new URL(base).origin ? 'firstParty' : 'providers';
        bytes[group] += sizes.responseBodySize + sizes.responseHeadersSize;
      }).catch(() => {}).finally(() => pendingSizes.delete(pending));
      pendingSizes.add(pending);
    });
    const response = await page.goto(base + '/' + slug + '.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2000);
    await Promise.allSettled([...pendingSizes]);
    const initial = { iframeNavigations: [...navigations], bytes: { ...bytes },
      performance: await page.evaluate(() => ({ domContentLoadedMs: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd,
        layoutShift: window.embedLayoutShift, iframeCount: document.querySelectorAll('iframe').length,
        lazyFrames: [...document.querySelectorAll('iframe')].filter(f => f.loading === 'lazy').length,
        framePositions: [...document.querySelectorAll('iframe')].map(f => ({ src: f.src, top: Math.round(f.getBoundingClientRect().top) })) })) };
    if (performanceOnly) {
      for (const element of await page.locator('iframe').all()) {
        await element.evaluate(f => f.scrollIntoView({ behavior: 'instant', block: 'center' }));
        await page.waitForTimeout(1200);
      }
      await page.waitForTimeout(1000);
      await Promise.allSettled([...pendingSizes]);
      const row = { phase, slug, width, status: response.status(), initial, finalBytes: { ...bytes }, navigations, errors,
        finalLayoutShift: await page.evaluate(() => window.embedLayoutShift) };
      results.push(row);
      await writeFile(resolve(output, `${phase}-performance-results.json`), JSON.stringify({ base, phase,
        measurement: 'Playwright Request.sizes responseBodySize + responseHeadersSize for completed requests, including child frames; initial snapshot 2 seconds after DOMContentLoaded', results }, null, 2) + '\n');
      console.log(JSON.stringify({ phase, slug, width, initial: initial.bytes, final: bytes, initialFrameRequests: initial.iframeNavigations.length }));
      await context.close();
      continue;
    }
    const tourTarget = page.locator('#recorrido, .space-y-6:has(iframe)').first();
    if (await tourTarget.count()) await tourTarget.scrollIntoViewIfNeeded();
    await page.waitForTimeout(9000);
    const tourScreenshot = `${phase}-${slug}-${width}-tour.png`;
    await page.screenshot({ path: resolve(output, tourScreenshot) });
    const viewers = [];
    const frames = page.locator('iframe');
    for (let i = 0; i < await frames.count(); i++) {
      const element = frames.nth(i), src = await element.getAttribute('src');
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(3000);
      const handle = await element.elementHandle();
      const frame = await handle.contentFrame();
      let evidence;
      try {
        evidence = await frame.evaluate(() => ({ url: location.href, title: document.title,
          text: document.body?.innerText.slice(0, 500),
          canvas: document.querySelectorAll('canvas').length, images: document.images.length,
          fullscreenEnabled: document.fullscreenEnabled,
          controls: [...document.querySelectorAll('button,[role="button"],[title],[aria-label]')]
            .map(e => ({ tag: e.tagName, title: e.getAttribute('title'), label: e.getAttribute('aria-label'), text: e.textContent?.trim().slice(0, 60) }))
            .filter(e => /full.?screen|pantalla completa|tela cheia|plein écran/i.test([e.title,e.label,e.text].join(' '))).slice(0, 8)
        }));
      } catch (e) { evidence = { inspectionError: e.message.slice(0, 180) }; }
      const isMap = src.includes('google.com/maps');
      let nativeFullscreen = 'control_not_exposed';
      if (!isMap && frame) {
        const control = frame.getByRole('button', { name: /full.?screen|pantalla completa|tela cheia|plein écran/i }).first();
        if (await control.count() && await control.isVisible()) {
          try {
            await control.click({ timeout: 3000 });
            await page.waitForTimeout(300);
            nativeFullscreen = await frame.evaluate(() => !!document.fullscreenElement) || await page.evaluate(() => !!document.fullscreenElement) ? 'entered' : 'control_clicked';
            await page.keyboard.press('Escape');
          } catch (e) { nativeFullscreen = 'click_failed: ' + e.message.slice(0, 100); }
        }
      }
      viewers.push({ src, isMap, requestedWithoutClick: navigations.includes(src), nativeFullscreen, ...evidence });
    }
    const mapTarget = page.locator('#ubicacion, section:has(iframe[src*="google.com/maps"])').last();
    if (await mapTarget.count()) await mapTarget.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    const mapScreenshot = `${phase}-${slug}-${width}-map.png`;
    await page.screenshot({ path: resolve(output, mapScreenshot) });
    const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth,
      activationButtons: document.querySelectorAll('[data-embed-src]').length,
      visibleOriginalLinks: [...document.querySelectorAll('a')].filter(a => /Abrir recorrido original/.test(a.textContent)).length,
      frames: [...document.querySelectorAll('iframe')].map(f => ({ src: f.src, title: f.title, loading: f.loading,
        allow: f.allow, fullscreen: f.allowFullscreen, referrerPolicy: f.referrerPolicy,
        width: Math.round(f.getBoundingClientRect().width), height: Math.round(f.getBoundingClientRect().height) })) }));
    const row = { phase, slug, width, status: response.status(), initial, finalBytes: bytes, navigations, viewers, failures, errors, layout, tourScreenshot, mapScreenshot };
    results.push(row);
    await writeFile(resolve(output, `${phase}-live-results.json`), JSON.stringify({ base, phase, results }, null, 2) + '\n');
    console.log(JSON.stringify({ phase, slug, width, iframeCount: layout.frames.length, initialFrameRequests: initial.iframeNavigations.length, finalFrameRequests: navigations.length, activationButtons: layout.activationButtons, overflow: layout.overflow }));
    await context.close();
  }
} finally { await browser.close(); }
