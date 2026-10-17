// Local browser QA only. Intercept and isolate every external request; never
// submit forms, call APIs or contact any provider. Simulations are not tour QA.
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SOLLAHMS_PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(process.argv[2] || '/tmp/sollahms-p2-embed-qa');
await mkdir(output, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method) || request.url.startsWith('/api/')) {
    response.writeHead(405).end(); return;
  }
  const path = resolve(root, '.' + new URL(request.url, 'http://127.0.0.1').pathname);
  if (!path.startsWith(root)) { response.writeHead(403).end(); return; }
  try { const content = await readFile(path); response.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' }); response.end(content); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = [];
let interceptedExternal = 0;
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    for (const mode of ['csp-denied', 'network-failure', 'javascript-disabled']) {
      const context = await browser.newContext({ viewport, javaScriptEnabled: mode !== 'javascript-disabled', serviceWorkers: 'block' });
      const externalRequests = [];
      await context.route('**/*', async route => {
        const request = route.request();
        if (new URL(request.url()).origin === origin && ['GET', 'HEAD'].includes(request.method()) && !new URL(request.url()).pathname.startsWith('/api/')) {
          await route.continue(); return;
        }
        interceptedExternal++;
        externalRequests.push(request.url());
        let childFrame = false;
        try { childFrame = Boolean(request.frame().parentFrame()); } catch { /* New popup navigation has no frame yet. */ }
        if (mode === 'csp-denied' && request.isNavigationRequest() && childFrame) {
          await route.fulfill({ status: 200, contentType: 'text/html', headers: { 'content-security-policy': "frame-ancestors 'none'" }, body: '<html><body>Simulated denied provider</body></html>' });
        } else await route.abort('blockedbyclient');
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const slug of ['alto-buzeta', 'edificio-suecia', 'endemico']) {
        await page.goto(origin + '/' + slug + '.html', { waitUntil: 'load' });
        const alternatives = page.locator('p[data-project-embed-alternative] a');
        const expected = await page.locator('iframe[data-project-embed]').count();
        if (await alternatives.count() !== expected) throw new Error(slug + ': static alternatives do not match original frame count');
        const first = alternatives.first();
        await first.scrollIntoViewIfNeeded();
        const href = await first.getAttribute('href');
        if (!href.startsWith('https://')) throw new Error(slug + ': insecure alternative');
        if (await first.getAttribute('target') !== '_blank' || await first.getAttribute('rel') !== 'noopener noreferrer') throw new Error(slug + ': unsafe new tab');
        // Reach the link with actual Tab navigation; no programmatic focus.
        await page.locator('body').click({ position: { x: 1, y: 1 } });
        let keyboardReachable = false;
        for (let index = 0; index < 180; index++) {
          await page.keyboard.press('Tab');
          keyboardReachable = await first.evaluate(element => document.activeElement === element);
          if (keyboardReachable) break;
        }
        if (!keyboardReachable) throw new Error(slug + ': static alternative is not keyboard reachable');
        const popupPromise = context.waitForEvent('page');
        await page.keyboard.press('Enter');
        const popup = await popupPromise;
        await popup.waitForLoadState('load').catch(() => {});
        if (!externalRequests.includes(href)) throw new Error(slug + ': Enter did not request the approved alternative');
        await popup.close();
        results.push({ slug, viewport, mode, expectedFrames: expected, staticLinks: await alternatives.count(), keyboardReachable, requestedApprovedDestination: true, visible: await first.isVisible(), pageErrors: [...errors] });
        if (errors.length) throw new Error(slug + ': runtime errors ' + errors.join('; '));
      }
      await context.close();
    }
  }
  await writeFile(resolve(output, 'report.json'), JSON.stringify({ methodology: 'Real Chromium, actual local HTML, external traffic intercepted before network. CSP frame-ancestors denial, network abortion and disabled JavaScript. Real Tab/Enter; popup destinations intercepted. No provider scene verified.', externalRequestsSent: 0, interceptedExternal, results }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: results.length, interceptedExternal, externalRequestsSent: 0, output }));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
