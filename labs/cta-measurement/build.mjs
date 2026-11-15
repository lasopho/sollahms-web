import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),src=import.meta.dirname,out=resolve(root,'.vercel/output/static');
assert.equal(process.env.VERCEL_ENV,'preview','Solo se permite build preview');
function write(p,b){mkdirSync(dirname(resolve(out,p)),{recursive:true});writeFileSync(resolve(out,p),b);}
for(const p of ['index.html','agenda.html','app.mjs','core.mjs','store.mjs','fixtures.mjs','lab.css','browser-tests.mjs','ownership.mjs','ownership-tests.mjs','export.mjs'])write(p,readFileSync(resolve(src,p)));
write('preview-config.mjs','export const previewOnly=true;\n');write('logo.svg',readFileSync(resolve(root,'assets/branding/sollahms-logo.svg')));
let html=readFileSync(resolve(root,'beneficios-tributarios-inmobiliarios.html'),'utf8');
assert.ok(html.includes('¿Estás pensando en invertir en una propiedad?'));
html=html.replace('<body class="tributaria-page">','<body class="tributaria-page" data-page="guide"><div class="lab-banner"><strong>Copia privada · recorrido sintético.</strong> No se registran visitantes reales. <a href="/">Panel de prueba</a><p id="session-info"></p><p id="lab-status" role="status"></p></div>');
html=html.replace(/<meta name="robots"[^>]+>/,'<meta name="robots" content="noindex,nofollow">').replace(/<link rel="canonical"[^>]+>/,'');
let n=0;const ids=['tax_advisory_header','tax_advisory_main','tax_advisory_footer'];html=html.replace(/href="\/agenda-asesoria.html"/g,()=>`href="/agenda.html" data-cta="${ids[n++]}"`);assert.equal(n,3);
html=html.replace(/<script[^>]*>[\s\S]*?<\/script>/g,s=>s.includes('beneficios-tributarios.mjs')?s:'');
html=html.replace(/href="\/(?!assets|agenda.html)[^"]*"/g,'href="/"');
html=html.replace('</head>','<link rel="stylesheet" href="/lab.css"></head>').replace('</body>','<script type="module" src="/app.mjs"></script></body>');write('guia.html',html);
const assets=new Set([...html.matchAll(/(?:href|src)="(\/assets\/[^"?]+)[^"]*"/g)].map(m=>m[1].slice(1)));
assets.add('assets/js/beneficios-tributarios-engine.mjs');
for(const p of assets){const b=readFileSync(resolve(root,p));write(p,b);}
// CSS fonts are local; no external services or dependencies.
function fonts(p){if(!existsSync(p))return;for(const x of readdirSync(p,{withFileTypes:true})){const f=resolve(p,x.name);if(x.isDirectory())fonts(f);else write(f.slice(root.length+1),readFileSync(f));}}fonts(resolve(root,'assets/fonts'));
writeFileSync(resolve(root,'.vercel/output/config.json'),JSON.stringify({version:3,routes:[{src:'/(.*)',headers:{'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; frame-ancestors 'self'; base-uri 'none'",'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'},continue:true},{handle:'filesystem'}]},null,2));
console.log('Preview estático sintético: sin API, sin formularios reales, sin conexiones externas.');
