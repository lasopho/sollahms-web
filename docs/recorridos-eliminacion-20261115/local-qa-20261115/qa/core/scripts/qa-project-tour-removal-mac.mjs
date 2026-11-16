// macOS runner adapted from the committed harness. No application files are changed.
// Read-only Chromium QA. No form submits, API mutations or provider activation.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.QA_PLAYWRIGHT_MODULE || '/Users/luissandoval/Projects/sollahms-publicacion/.vercel/alternativa-b-contacto-20261115/qa/browser/tools/node_modules/playwright-core');
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { nativeTransport } from './native-transport.mjs';
import { inspectMedia } from './inspect-media.mjs';
const base = process.env.QA_BASE || 'http://127.0.0.1:8898';
if (process.env.QA_REQUIRE_REMOTE === '1' && new URL(base).protocol !== 'https:')
  throw new Error('Release QA must use the actual HTTPS deployment');
const output = resolve(process.env.QA_OUTPUT || 'docs/recorridos-eliminacion-20261115');
const records = JSON.parse(await readFile(resolve(process.env.QA_SOURCE || process.cwd(), 'data/proyectos.json'), 'utf8'));
const slugs = process.env.QA_SLUGS ? process.env.QA_SLUGS.split(',') : records.map(row => row.slug);
const widths = (process.env.QA_WIDTHS || '1440,768,390,320').split(',').map(Number);
const samples = new Set(['inn-puerto-chico', 'plaza-las-condes', 'bcome', 'nucleo-costanera', 'bordevivo', 'distrito-centro']);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,handleSIGINT:false,handleSIGTERM:false,
  args: ['--no-sandbox', '--disable-dev-shm-usage','--disable-features=BackForwardCache',
    ...(process.env.QA_PROXY_SPKI ? ['--ignore-certificate-errors-spki-list=' + process.env.QA_PROXY_SPKI] : [])] });
const results = process.env.QA_PRELOAD ? JSON.parse(await readFile(process.env.QA_PRELOAD,'utf8')).results : [];
const transport = await nativeTransport({origin:new URL(base).origin,root:resolve('/private/tmp/sollahms-recorridos-qa')});
let stopRequested=false,stopPromise=null;
const stop=()=>{stopRequested=true;stopPromise ||= Promise.all([transport.close(),browser.close()]);};
process.once('SIGINT',stop);process.once('SIGTERM',stop);
await writeFile('/private/tmp/sollahms-recorridos-qa/runner-pid.json',JSON.stringify({pid:process.pid,workers:Number(process.env.QA_WORKERS||2),startedAt:new Date().toISOString(),state:'running'})+'\n');
try {
  for (const width of widths) {
    if(stopRequested)break;
    const queue = slugs.filter(slug=>!results.some(r=>r.slug===slug&&r.width===width));
    await Promise.all(Array.from({ length: Number(process.env.QA_WORKERS || 2) }, async () => {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block',
        storageState: process.env.QA_STORAGE_STATE || undefined });
      let blockedMutations = 0, readOnlyMapRpc = 0, blockedRequests = [];
      // Source and contact checks must never produce real leads or reservations.
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        const mapPolicy = route.request().method() === 'POST'
          ? JSON.parse(await readFile('/private/tmp/sollahms-recorridos-qa/read-only-map-rpc-policy.json','utf8')) : null;
        if (mapPolicy && (mapPolicy.exactReads.some(p=>p.origin===url.origin&&p.path===url.pathname)
          || (mapPolicy.allowReadGetMethods && url.origin===mapPolicy.mapOrigin && url.pathname.startsWith(mapPolicy.mapServicePrefix)
            && /^Get[A-Za-z0-9]+$/.test(url.pathname.slice(mapPolicy.mapServicePrefix.length))))) {
          readOnlyMapRpc++;
          return route.continue();
        }
        if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
          blockedMutations++;
          blockedRequests.push({origin:url.origin,path:url.pathname,method:route.request().method(),reason:'QA_READ_ONLY_POLICY'});
          return route.abort();
        }
        if (new URL(route.request().url()).origin === new URL(base).origin) {
          try { return await transport.handle(route); } catch { return route.abort('failed'); }
        }
        return route.continue();
      });
      let page = await context.newPage(), workerCases = 0;
      page.setDefaultTimeout(15000);
      while (queue.length && !stopRequested) {
        blockedMutations = 0; readOnlyMapRpc = 0; blockedRequests = [];
        const slug = queue.shift(), errors = [], failedRequests = [], failedResponses = [];
        const onError = error => errors.push(error.message);
        const onFailure = request => { if (!request.failure()?.errorText.includes('ERR_ABORTED'))
          failedRequests.push({ url: request.url().split('?')[0], error: request.failure()?.errorText }); };
        const onResponse = response => { if (response.status() >= 400)
          failedResponses.push({ url: response.url().split('?')[0], status: response.status() }); };
        page.on('pageerror', onError); page.on('requestfailed', onFailure); page.on('response', onResponse);
        try {
          const response = await page.goto(base + '/' + slug + '.html', { waitUntil: 'load', timeout: 120000 });
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
            if (await details.getAttribute('open') === null) await details.locator('summary').first().press('Enter');
          for (const intent of ['llamada', 'cotizacion']) {
            const button = page.locator('[data-request-mode="' + intent + '"]').first();
            if (await button.count()) await button.click();
          }
          await page.evaluate(async () => {
            await Promise.all([...document.images].map(image => image.complete ? null
              : new Promise(resolve => { image.addEventListener('load', resolve, { once: true });
                image.addEventListener('error', resolve, { once: true }); setTimeout(resolve, 30000); })));
          });
          await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('#galeria img')].map(i=>i.decode().catch(()=>{})));});
          const supplemental = await inspectMedia(page,{slug,width,output,screenshotMaps:true,supplemental:process.env.QA_SUPPLEMENTAL==='1'});
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
            await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
            await page.waitForTimeout(150);
            await page.screenshot({ path: resolve(output, `${slug}-${width}.png`) });
          }
          results.push({ slug, width, status: response.status(), ...row, ...supplemental, errors, failedRequests, failedResponses, blockedMutations, blockedRequests:[...blockedRequests], readOnlyMapRpc });
          if(results.length % 10 === 0) {
            console.log(JSON.stringify({width,completed:results.length,last:slug}));
            await writeFile(resolve(output, 'responsive-qa.json'), JSON.stringify({base,readOnly:true,results},null,2)+'\n');
          }
        } catch (error) {
          if(stopRequested)break;
          results.push({slug,width,status:0,fatalError:String(error.message).split('\n')[0],title:'',overflow:0,tourElements:0,tourText:false,images:0,brokenImages:[],plans:0,forms:[],commercialFields:[],navigationTargetsExist:false,whatsapp:[],emptySections:[],galleryImageLinks:0,galleryPaint:[],navigationInteractions:[],mediaLinks:[],mapEvidence:[],videoEvidence:[],formModes:[],layout:{offscreenControlsOrHeadings:[]},errors,failedRequests,failedResponses,blockedMutations,blockedRequests:[...blockedRequests],readOnlyMapRpc});
          console.log(JSON.stringify({width,completed:results.length,last:slug,fatalError:String(error.message).split('\n')[0]}));
        }
        page.off('pageerror', onError); page.off('requestfailed', onFailure); page.off('response', onResponse);
        await writeFile(resolve(output,'responsive-qa.json'),JSON.stringify({base,readOnly:true,results},null,2)+'\n');
        if(++workerCases % 4 === 0){await page.close();page=await context.newPage();page.setDefaultTimeout(15000);}
      }
      await context.close().catch(()=>{});
    }));
    console.log(JSON.stringify({ width, completed: results.length }));
    await writeFile(resolve(output, 'responsive-qa.json'), JSON.stringify({ base, readOnly: true, results }, null, 2) + '\n');
  }
} finally { await browser.close().catch(()=>{}); await transport.close(); await stopPromise;process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);await writeFile('/private/tmp/sollahms-recorridos-qa/runner-pid.json',JSON.stringify({pid:process.pid,state:'closed',stoppedBySignal:stopRequested,at:new Date().toISOString()})+'\n'); }
const failures = results.filter(row => row.fatalError || row.status !== 200 || row.tourElements || row.tourText || row.errors.length || row.overflow > 1 || row.emptySections.length
  || row.brokenImages.length || !row.navigationTargetsExist || row.commercialFields.some(field => !field.exists || !field.enabled || !field.visible));
console.log(JSON.stringify({ pages: slugs.length, viewportChecks: results.length, failures: failures.length,
  resourceFailures: results.filter(row => row.brokenImages.length || row.failedRequests.length || row.failedResponses.length).length,
  coverageNotice: 'Gallery/link inventory and image loading only; map render/video playback/form validity still require supplemental QA.' }));
if (failures.length || results.some(row => row.failedRequests.length || row.failedResponses.length || row.blockedMutations
  || row.navigationInteractions.some(n=>!n.exists||!n.positioned) || row.mediaLinks.some(m=>!m.opened||!m.imageDecoded)
  || row.formModes.some(m=>m.active!=='true'||!m.consentPresent||m.controls.some(c=>!c.exists||!c.enabled||!c.visible||!c.required))
  || row.layout.offscreenControlsOrHeadings.length || row.mapEvidence.some(m=>!m.ready||m.errorText||!m.mapWidgets||(m.canvases===0&&m.decodedTiles===0))
  || row.videoEvidence.length)) process.exitCode = 1;


if(stopRequested)process.exitCode=130;
