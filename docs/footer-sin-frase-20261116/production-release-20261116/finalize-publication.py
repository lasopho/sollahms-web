"""Close the authorized publication only after all isolated/public gates pass."""
import hashlib
import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
FOOTER = DOCS.parent
ROOT = DOCS.parents[2]
SOURCE = 'b761ddeaea2fa526870e6af25658046e31b571d7'
def load(name):
    return json.loads((DOCS / name).read_text())
def sha(body):
    return hashlib.sha256(body).hexdigest()
def save(name, value):
    (DOCS / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
auth, created, promoted = load('authorization.json'), load('created.json'), load('promotion-confirmed.json')
isolated, post = load('verification/isolated-summary.json'), load('verification/postpromotion-summary.json')
private_browser, public_browser = load('browser/isolated/results.json'), load('browser/public/results.json')
http, connected = load('public-http/summary.json'), load('postflight-connected.json')
runtime = load('final-runtime-preservation.json')
visual = load('browser/public/visual-review.json')
deployment = created['deploymentId']
assert auth['explicitAuthorization'] and auth['productionCreationAuthorized'] and auth['promotionAuthorized']
assert created['target'] == created['reportedTarget'] == 'production' and created['prebuilt'] and created['skipDomain']
assert created['sourceCommit'] == auth['sourceHead'] == SOURCE
assert promoted['passed'] and promoted['sameVerifiedDeployment'] and not promoted['rebuild']
assert created['candidateInventorySha256'] == promoted['candidateInventorySha256'] == auth['candidateInventorySha256']
assert isolated['passed'] and post['passed'] and http['passed']
assert runtime.get('passed', runtime.get('status') == 'PASS')
assert connected.get('passed', connected.get('status') == 'PASS')
assert visual['passed'] and visual['deploymentId'] == deployment and len(visual['images']) == 10
for report in [private_browser, public_browser]:
    assert report['passed'] and report['deployment'] == deployment and len(report['cases']) == 10
    assert all(case['passed'] and case['commercialSubmits'] == 0 for case in report['cases'])
    assert not any(report[key] for key in ['pageErrors', 'failedResources', 'consoleErrors', 'blockedMutations', 'blockedAPIs', 'blockedExternal'])
assert promoted['deploymentId'] == isolated['deployment'] == post['deployment'] == http['deploymentId'] == deployment
assert http['summary']['projectFichesPassed'] == http['summary']['projectFichesSourceByteExact'] == 131
assert http['summary']['passedRequests'] == http['summary']['plannedRequests'] == 210
assert http['summary']['verifiedTlsTransactions'] == http['summary']['transactions'] == 222
assert post['productionIDsSinceAuthorization'] == [deployment]
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == SOURCE

# Preserve the original Preview receipts and the now-executed publication prompt.
history = DOCS / 'history'
history.mkdir(exist_ok=True)
originals = [(ROOT / 'NEXT-PROMPT.md', 'NEXT-PROMPT-before.md'),
             (FOOTER / 'INFORME-CIERRE.md', 'INFORME-CIERRE-preview.md'),
             (FOOTER / 'SIGUIENTE-PROMPT.md', 'SIGUIENTE-PROMPT-executed.md'),
             (FOOTER / 'SHA256SUMS', 'SHA256SUMS-preview')]
for source, name in originals:
    target = history / name
    assert not target.exists(), 'Publication closure already started; inspect before re-running.'
    shutil.copy2(source, target)
now = datetime.now(ZoneInfo('America/Santiago')).isoformat()
published = datetime.fromtimestamp(max(a['updatedAt'] for a in promoted['aliases']) / 1000, ZoneInfo('America/Santiago')).isoformat()
pin = auth['candidateInventorySha256']
summary = http['summary']
report = f'''# Publicación productiva — eliminación del eslogan en los pies

Publicación autorizada y completada el **16/11/2026 a las {published[11:23]}, America/Santiago**. Se promovió exactamente el mismo Production aislado que superó la verificación previa, y después se completó el QA público. No queda una publicación pendiente.

- Deployment definitivo: `{deployment}`, READY, Production, prebuilt.
- [Portada pública](https://sollahms.cl/) · [Asset Portafolio público](https://sollahms.cl/proyectos.html).
- Hostname inmutable protegido: `{created['url']}`.
- Source SHA declarado: `{SOURCE}`. Implementación: `{auth['implementationCommit']}`. Los commits posteriores solo documentan el cierre; conservar el HEAD remoto real.
- Rama `codex/footer-sin-frase-20261116`; [PR #31](https://github.com/lasopho/sollahms-web/pull/31) abierto en Draft, sin merge.
- Anterior conservado para recuperación: `{auth['baselineDeployment']}`. Preview histórica: `{auth['candidateDeployment']}`.

## Intervención exacta e integridad

El inventario publicado SHA256 es `{pin}`. Contiene 1.660 archivos: únicamente `static/index.html` y `static/proyectos.html` cambian respecto de HWs; otros 1.658 permanecen idénticos. Se retiran seis líneas de HTML que contenían las dos apariciones y sus contenedores exclusivos, sin reemplazar la frase. Ambos pies reducen su altura en 112 px en los cinco anchos.

Las 131 fichas, los 66 cambios anteriores de eliminación de recorridos, Contacto, Centro de Orientación, siete funciones/57 archivos, configuración v3, datos comerciales, recursos, logo y motion se conservan. CRM 360, Sollahms AI Lab, Resend, credenciales, variables, DNS y ajustes de seguridad no se modifican. No se ejecutan builders, generadores históricos ni reconstrucciones; Vercel confirma `Using prebuilt build artifacts from .vercel/output`.

La autorización y el texto original están en [authorization.json](authorization.json) y [authorization-request.txt](authorization-request.txt). [created.json](created.json), [promotion-request.json](promotion-request.json), [promotion-confirmed.json](promotion-confirmed.json) y [deployment-events.json](deployment-events.json) documentan la única creación y promoción. Los hashes completos originales se conservan en `../candidate-manifest.json`; esta fase añade [preservación final](final-runtime-preservation.json), [archivos documentales](modified-files.json) y `SHA256SUMS`.

## Gates y QA

| Evidencia | Resultado |
|---|---|
| Preflight conectado | 14/14; HEAD, PR Draft, producción, cuatro dominios, SSO y concurrencia |
| Artefacto local | 16/16; 1.660 archivos, 131 fichas, 66 cambios de recorridos y 89 checksums previos |
| Preflight nativo | 21/21; producción y Preview completas contra manifiestos originales |
| Production aislado | 24/24; 1.660 rutas/SHA1, siete funciones, SSO y aliases todavía en HWs |
| Chrome aislado | 10/10 y 10 capturas; ambas páginas a 1440/1024/768/390/320 |
| Gate inmediato | Aliases y concurrencia reconsultados antes de promover; un solo Production nuevo |
| Postpromoción nativa | 25/25; mismo ID, artefacto exacto, cuatro dominios y protecciones |
| QA HTTP público | 210/210 URL; 222/222 transacciones TLS; 12 redirecciones 308 |
| Fichas públicas | 131/131 byte por byte, sin recorridos |
| Enlaces y recursos | 36/36 destinos/fragmentos y 54 recursos aprobados |
| Retiro Patio Brasil | 12/12 casos con 410 y redirecciones existentes |
| Chrome público | 10/10 en cinco anchos; TLS 1.3, 10 capturas revisadas visualmente |
| Postflight conectado | 17/17; cuatro dominios en el nuevo ID y PR aún Draft, sin merge |

Se comprobaron las cuatro URL expresas: `/` y `/proyectos.html` en `sollahms.cl` y `www.sollahms.cl`. También se conservan el 308 de `sollhams.cl` y el dominio predeterminado `project-wrapp.vercel.app`. Las 210 respuestas públicas coinciden exactamente con sus fuentes certificadas, sin excepción por toolbar. El hostname inmutable mantiene 302 a SSO con TLS válido. SSO `all_except_custom_domains`, autoasignación false y previews automáticas deshabilitadas permanecen intactos.

Los pies conservan DOM, logo, texto, enlaces, estilos y geometría del candidato; no quedan contenedores del eslogan, separadores residuales ni overflow. Se comprueban lectura opaca, borde atenuado y movimiento reducido. Cero errores JavaScript inesperados o recursos propios fallidos. WhatsApp se verifica por destino y clic interceptado, sin enviar mensajes. No se envían formularios, correos, reservas, leads, POST ni escrituras CRM. La única API financiera del navegador usa una fixture UF 503 explícita; no se realiza una consulta UF real ni una nueva auditoría financiera.

### Trazabilidad de los verificadores

El primer verificador de anclas usaba `/index.html` como base en lugar de la URL canónica `/`; se corrigió exclusivamente el harness y se conservó el diagnóstico. En la primera matriz pública, nueve casos se completaron y el registro del grupo de desvanecimiento agotó la espera en proyectos a 320 px, después de aprobar footer/TLS/recursos. Ese único caso se repitió completo con traza de media query: aprobó lectura 1, borde 0.055 y movimiento reducido, con el mismo deployment, origen, pin y hash del pie. `browser/public/results.json` conserva los nueve certificados originales y esa repetición; su campo `aggregation` enlaza ambos recibos originales. No se alteró el sitio para conseguir esos resultados. Los diagnósticos permanecen en `browser/attempts/`.

## Continuidad y recuperación

Esta autorización quedó ejecutada completamente. No reutilizarla para crear deployments, publicar cambios nuevos o fusionar PR. El anterior prompt de autorización y el cierre de Preview están archivados en `history/`. Los certificados de Preview siguen siendo evidencia histórica del mismo candidato; el estado publicado vigente está en [publication-closure.json](publication-closure.json).

El output exacto permanece en `.vercel/footer-sin-frase-20261116/stage/.vercel/output`, dentro de `/private/tmp/sollahms-footer-review-20261116`. Si falta en una tarea futura, recuperar los bytes autenticados del Production definitivo y cotejar los 1.660 archivos; no reconstruir desde main ni restaurar paquetes anteriores que sustituyan Contacto o Centro. HWs se conserva como referencia de recuperación. Para cambios nuevos, reconsultar producción, dominios y HEAD antes de actuar. Sin nuevo encargo, informar el cierre y mantener el sitio intacto.
'''
(DOCS / 'INFORME-PUBLICACION.md').write_text(report)
closure = {'closedAt': now, 'publishedAtAmericaSantiago': published, 'status': 'PASS', 'objectiveComplete': True,
    'explicitAuthorizationExecuted': True, 'authorizationReusable': False, 'deploymentId': deployment,
    'sameProductionVerifiedBeforePromotion': True, 'prebuilt': True, 'rebuild': False,
    'publicationSourceCommit': SOURCE, 'implementationCommit': auth['implementationCommit'],
    'candidateInventorySha256': pin, 'runtimeFiles': 1660, 'runtimeChangedFiles': 2, 'runtimeIdenticalFiles': 1658,
    'projectFichesPreserved': 131, 'virtualTourChangesPreserved': 66, 'functionBundles': 7, 'functionFiles': 57,
    'previousRecoveryDeployment': auth['baselineDeployment'], 'historicalPreviewDeployment': auth['candidateDeployment'],
    'newProductionDeployments': 1, 'promotions': 1, 'pr': 31, 'prDraft': True, 'prMerged': False,
    'sourceBranch': auth['branch'], 'domains': promoted['aliases'], 'defaultDomain': promoted['defaultDomain'],
    'publicHttp': summary, 'isolatedChromeCases': 10, 'publicChromeCases': 10, 'viewports': public_browser['widths'],
    'publicBrowserAggregation': public_browser['aggregation'], 'visualCapturesReviewed': 20,
    'commercialSubmissions': 0, 'commercialProviderRequests': 0, 'realUfLookups': 0,
    'unexpectedJavaScriptErrors': 0, 'failedOwnResources': 0, 'runtimeSourcesModifiedDuringPublication': False,
    'buildersOrGeneratorsExecuted': 0, 'secretsOrSecurityConfigurationModified': False,
    'authoritativeReport': 'INFORME-PUBLICACION.md'}
save('publication-closure.json', closure)
(FOOTER / 'INFORME-CIERRE.md').write_text(f'''# Eliminación del eslogan — publicado y verificado

Publicación completada el **16/11/2026 a las {published[11:23]}, America/Santiago**, con autorización expresa. La frase y sus bloques exclusivos desaparecieron de la [portada](https://sollahms.cl/) y de [Asset Portafolio](https://sollahms.cl/proyectos.html).

- Production definitivo `{deployment}`, READY, prebuilt; exactamente el mismo ID verificado antes de promover.
- Source `{SOURCE}`; implementación `{auth['implementationCommit']}`. Los commits posteriores solo cierran documentación.
- Candidato SHA256 `{pin}`: 1.660 archivos, solo dos HTML modificados, otros 1.658 idénticos.
- Conservados las 131 fichas, 66 cambios de recorridos, Contacto, Centro, siete funciones/57 archivos, configuración v3, CRM 360, Sollahms AI Lab, Resend y datos comerciales.
- QA público 210/210 URL, 222 transacciones TLS, 131 fichas exactas, 36 destinos/fragmentos, 54 recursos y 12 casos Patio Brasil 410. Chrome aislado y público 10/10 cada uno en cinco anchos, con 20 capturas revisadas. Cero errores inesperados o recursos propios fallidos.
- Los cuatro dominios apuntan al nuevo ID; www y el dominio alternativo mantienen 308. SSO y ajustes automáticos intactos. Cero operaciones comerciales.
- [PR #31](https://github.com/lasopho/sollahms-web/pull/31) permanece abierto en Draft, sin merge. HWs `{auth['baselineDeployment']}` se conserva para recuperación.

[Informe productivo completo](production-release-20261116/INFORME-PUBLICACION.md) · [Cierre verificable](production-release-20261116/publication-closure.json) · [QA HTTP público](production-release-20261116/public-http/summary.json) · [Chrome público](production-release-20261116/browser/public/results.json) · [Continuidad](SIGUIENTE-PROMPT.md).

La autorización ya se ejecutó; no queda una publicación pendiente ni se reutiliza para cambios futuros. El cierre de Preview y el prompt ejecutado se conservan en `production-release-20261116/history/`. El informe completo distingue los diagnósticos de los verificadores de los certificados finales y documenta la repetición completa del único caso público de 320 px.
''')
continuity = f'''# SOLLAHMS — publicación del footer completada

La eliminación global de «PRECISION • TRANSPARENCY • STRATEGY» se publicó y verificó el **16/11/2026 a las {published[11:23]}, America/Santiago**. La autorización expresa quedó ejecutada. Este documento es continuidad histórica, no una nueva orden de publicación.

## Estado vigente

- Repositorio `lasopho/sollahms-web`; rama `codex/footer-sin-frase-20261116`.
- Checkout independiente `/private/tmp/sollahms-footer-review-20261116`, limpio al cierre documental.
- [PR #31](https://github.com/lasopho/sollahms-web/pull/31) abierto en Draft y sin merge. No fusionarlo por retomar el chat.
- Production definitivo `{deployment}`, READY, prebuilt, source `{SOURCE}`; implementación `{auth['implementationCommit']}`. Consultar y conservar el HEAD remoto real, incluidos los commits documentales posteriores.
- [Portada pública](https://sollahms.cl/) y [Asset Portafolio](https://sollahms.cl/proyectos.html).
- Hostname inmutable protegido `{created['url']}`.
- `sollahms.cl`, `www.sollahms.cl`, `sollhams.cl` y `project-wrapp.vercel.app` están asociados al nuevo Production. Www y el dominio alternativo conservan 308 al dominio canónico.
- Inventario publicado SHA256 `{pin}`, 1.660 archivos, dos HTML modificados y 1.658 idénticos a HWs.
- Anterior de recuperación `{auth['baselineDeployment']}`; Preview histórica `{auth['candidateDeployment']}`.

## Evidencias y preservación

Leer `AGENTS.md`, `NEXT-PROMPT.md`, `docs/footer-sin-frase-20261116/INFORME-CIERRE.md` y `production-release-20261116/INFORME-PUBLICACION.md`, `publication-closure.json`, `authorization.json`, `created.json`, `promotion-confirmed.json`, los certificados HTTP/Chrome y `SHA256SUMS`.

QA final: preflight 21/21, aislado 24/24, Chrome aislado 10/10, postpromoción 25/25, público 210/210 URL, 222/222 transacciones TLS, 131 fichas byte exactas, 36 destinos/fragmentos, 54 recursos, Chrome público 10/10 y revisión visual de las 20 capturas de esta publicación. El certificado público agrega nueve casos originales completos y una repetición completa del último caso de 320 px; todos usan el mismo artefacto y origen. Los diagnósticos están en `browser/attempts/`.

Conservar las 131 fichas, los 66 cambios de eliminación de recorridos, Contacto, Centro, siete funciones/57 archivos, configuración v3, CRM 360, Sollahms AI Lab, Resend, SEO/GEO y datos comerciales. SSO `all_except_custom_domains`, autoasignación false, previews automáticas deshabilitadas y reglas de ramas false permanecen intactos. No se realizaron envíos de formularios/mensajes ni consultas UF reales; QA usa una fixture 503 explícita.

## Próxima acción

Sin un nuevo encargo, informar que el trabajo está completado y mantener el sitio intacto. No crear otro deployment, reconstruir, promover, reasignar dominios o fusionar ramas por el solo hecho de retomar este chat. La autorización archivada ya fue consumida por esta publicación y no cubre trabajo futuro.

Para una tarea nueva, reconsultar producción real, aliases, HEAD remotos y PR activos, y conciliar cambios posteriores antes de intervenir. El output publicado está en `.vercel/footer-sin-frase-20261116/stage/.vercel/output`. Si falta, recuperar exactamente los bytes autenticados del Production definitivo y verificar el manifiesto completo; no reconstruir desde main histórico ni usar un paquete previo que restaure el eslogan o sustituya Contacto/Centro. No repetir auditorías certificadas salvo cambios, discrepancias o un nuevo deployment que lo justifique. No tocar checkouts ajenos.
'''
(FOOTER / 'SIGUIENTE-PROMPT.md').write_text(continuity)
(DOCS / 'SIGUIENTE-PROMPT.md').write_text(continuity)
(ROOT / 'NEXT-PROMPT.md').write_text(f'''# SOLLAHMS — eliminación del eslogan publicada y verificada

Trabajo completado el **16/11/2026 a las {published[11:23]}, America/Santiago**. La [portada pública](https://sollahms.cl/) y [Asset Portafolio](https://sollahms.cl/proyectos.html) ya sirven los pies sin la frase corporativa. No queda una publicación pendiente.

- Production `{deployment}`, READY, prebuilt; mismo ID verificado antes de asignar dominios.
- Source `{SOURCE}`; implementación `{auth['implementationCommit']}`. Los commits posteriores son documentales: consultar y conservar HEAD remoto real.
- Rama `codex/footer-sin-frase-20261116`; [PR #31](https://github.com/lasopho/sollahms-web/pull/31) abierto en Draft, sin merge.
- Los cuatro dominios están en el nuevo Production; www y `sollhams.cl` conservan 308 a `sollahms.cl`. HWs `{auth['baselineDeployment']}` queda como referencia de recuperación.
- Inventario SHA256 `{pin}`: 1.660 archivos, dos HTML modificados, otros 1.658 idénticos. Se conservan 131 fichas, 66 cambios de recorridos, Contacto, Centro y siete funciones/57 archivos.
- Preflight 21/21, aislado 24/24, Chrome aislado 10/10, postpromoción 25/25; público 210/210 URL y 222 transacciones TLS, 131 fichas exactas, Chrome público 10/10 en 1440/1024/768/390/320, 20 capturas revisadas. Cero errores inesperados, recursos propios fallidos u operaciones comerciales.

Leer `AGENTS.md`, [cierre](docs/footer-sin-frase-20261116/INFORME-CIERRE.md), [informe productivo](docs/footer-sin-frase-20261116/production-release-20261116/INFORME-PUBLICACION.md), [certificado vigente](docs/footer-sin-frase-20261116/production-release-20261116/publication-closure.json) y [continuidad completa](docs/footer-sin-frase-20261116/SIGUIENTE-PROMPT.md).

La autorización expresa quedó ejecutada; recibos en `production-release-20261116/`. El cierre previo de Preview y el prompt que pedía autorización están archivados en `production-release-20261116/history/`. Los certificados originales de Preview, incluido `completion.json`, son históricos; el estado vigente de esta fase es `publication-closure.json`. El informe documenta el diagnóstico de ancla canónica y el reintento completo de 320 px, sin cambios runtime.

Checkout independiente `/private/tmp/sollahms-footer-review-20261116`; output `.vercel/footer-sin-frase-20261116/stage/.vercel/output`. Si falta, recuperar los mismos bytes autenticados del Production definitivo y verificar las 1.660 rutas/hashes; no reconstruir desde main ni restaurar paquetes anteriores. SSO, autoasignación false, previews automáticas deshabilitadas y reglas manuales false siguen intactos.

Sin nuevo encargo, informar el cierre y no crear, promover, reconstruir, fusionar ni reasignar dominios. No reutilizar esta autorización para cambios nuevos. Reconsultar producción/aliases/HEAD antes de trabajo futuro, preservar cambios posteriores y no modificar checkouts ajenos, fichas, funciones, CRM 360 o Sollahms AI Lab sin un encargo específico.
''')

# Manifests form a DAG: modified-files excludes itself and checksum files;
# phase SHA256SUMS covers its report; the root SHA256SUMS covers the phase sum.
allowed_existing = {'NEXT-PROMPT.md', str((FOOTER / 'INFORME-CIERRE.md').relative_to(ROOT)),
    str((FOOTER / 'SIGUIENTE-PROMPT.md').relative_to(ROOT)), str((FOOTER / 'SHA256SUMS').relative_to(ROOT))}
changed_existing = subprocess.check_output(['git', 'diff', '--name-only', SOURCE], cwd=ROOT, text=True).splitlines()
assert set(changed_existing).issubset(allowed_existing), changed_existing
subprocess.run(['git', 'add', 'NEXT-PROMPT.md', 'docs/footer-sin-frase-20261116'], cwd=ROOT, check=True)
paths = subprocess.check_output(['git', 'diff', '--name-only', SOURCE], cwd=ROOT, text=True).splitlines()
records = []
exclusions = {str((DOCS / 'modified-files.json').relative_to(ROOT)), str((DOCS / 'SHA256SUMS').relative_to(ROOT)), str((FOOTER / 'SHA256SUMS').relative_to(ROOT))}
for rel in paths:
    if rel in exclusions:
        continue
    file = ROOT / rel
    assert file.is_file() and not file.is_symlink()
    previous = subprocess.run(['git', 'show', SOURCE + ':' + rel], cwd=ROOT, capture_output=True)
    before = {'size': len(previous.stdout), 'sha256': sha(previous.stdout)} if previous.returncode == 0 else None
    body = file.read_bytes()
    records.append({'path': rel, 'before': before, 'after': {'size': len(body), 'sha256': sha(body)}})
save('modified-files.json', {'sourceBeforePublication': SOURCE, 'runtimeChanged': False, 'scope': 'Publication documentation and evidence only',
    'hashExclusions': sorted(exclusions), 'files': records})
phase_files = sorted(p for p in DOCS.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.name != 'SHA256SUMS')
(DOCS / 'SHA256SUMS').write_text(''.join(sha(p.read_bytes()) + '  ' + p.relative_to(ROOT).as_posix() + '\n' for p in phase_files))
all_files = sorted(p for p in FOOTER.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p != FOOTER / 'SHA256SUMS')
all_files.append(ROOT / 'NEXT-PROMPT.md')
(FOOTER / 'SHA256SUMS').write_text(''.join(sha(p.read_bytes()) + '  ' + p.relative_to(ROOT).as_posix() + '\n' for p in all_files))
subprocess.run(['git', 'add', 'NEXT-PROMPT.md', 'docs/footer-sin-frase-20261116'], cwd=ROOT, check=True)
print(json.dumps({'status': 'PASS', 'deploymentId': deployment, 'publishedAtAmericaSantiago': published,
                  'phaseChecksummedFiles': len(phase_files), 'allChecksummedFiles': len(all_files),
                  'documentationStaged': True, 'runtimeChanges': 0}))
