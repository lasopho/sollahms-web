"""Finalize review documents after both browser matrices and remote integrity pass."""
import hashlib
import importlib.util
import json
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parents[1]
def load(name):
    return json.loads((DOCS / name).read_text())
def save(name, value):
    (DOCS / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

created = load('preview-created.json')
local, remote = load('local/results.json'), load('remote/results.json')
integrity, stage = load('verification/preview-summary.json'), load('stage-receipt.json')
for report in [local, remote]:
    assert report['passed'] and len(report['cases']) == 20 and all(r['passed'] for r in report['cases'])
    assert report['widths'] == [1440, 1024, 768, 390, 320]
    assert all(not report[key] for key in ['pageErrors', 'failedResources', 'consoleErrors', 'blockedExternal', 'blockedMutations'])
    assert all(r['heightRemoved'] == 112 for r in report['cases'] if r['mode'] == 'after')
assert remote['deployment'] == created['deploymentId'] == integrity['deployment']
assert integrity['passed'] and integrity['fullSourceFileCount'] == 1660
assert created['candidateInventorySha256'] == stage['candidateInventorySha256'] == integrity['outputInventorySha256']
assert stage['changedFiles'] == 2 and stage['identicalFiles'] == 1658
assert all(a['deploymentId'] == created['baselineDeployment'] for a in integrity['productionAliases'])
url = created['url'].rstrip('/')
pin, deployment = created['candidateInventorySha256'], created['deploymentId']
now = datetime.now(ZoneInfo('America/Santiago')).isoformat()
history = DOCS / 'history/NEXT-PROMPT-before.md'
history.parent.mkdir(parents=True, exist_ok=True)
if not history.exists():
    shutil.copy2(ROOT / 'NEXT-PROMPT.md', history)

closure = f'''# Eliminación global de frase corporativa — lista para revisión

Cierre del **16/11/2026**, America/Santiago. Se eliminó el eslogan y su bloque visual exclusivo en las dos únicas páginas activas que lo contenían: portada y Asset Portafolio. Se revisaron 147 HTML y las fuentes; no se modificó ninguna ficha de proyecto.

- [Preview privada SSO]({url}/): `{deployment}`, READY, prebuilt, entorno Preview.
- [Asset Portafolio en Preview]({url}/proyectos.html).
- [PR #31 en Draft](https://github.com/lasopho/sollahms-web/pull/31), abierto y sin merge; base `codex/centro-auditoria-integral-20261116`.
- Rama `codex/footer-sin-frase-20261116`; implementación `{created['sourceCommit']}`. Los commits posteriores solo cierran documentación/evidencias.
- Producción intacta: `{created['baselineDeployment']}`. `sollahms.cl`, `www.sollahms.cl` y `sollhams.cl` siguen en ese deployment; los dos últimos conservan 308 al dominio canónico.

## Resultado y preservación

Dos apariciones eliminadas, cero residuales en contenido publicado o fuentes runtime. No hay componente compartido ni generador que recree la frase. Se retiraron seis líneas de HTML, incluidos los dos contenedores con su margen, padding y divisor exclusivos. La altura de ambos pies disminuye exactamente 112 px en todos los anchos; no quedan contenedores vacíos ni separadores del eslogan.

Artefacto de 1.660 archivos: dos HTML modificados y otros 1.658 idénticos a producción. Permanecen exactos Contacto, Centro de Orientación, 131 fichas, siete funciones/57 archivos, configuración v3, scripts de desvanecimiento, recursos, formularios e información comercial. Logo, texto restante y los 11 enlaces de portada y 9 de Asset Portafolio se comparan exactamente con el DOM anterior. No se modifica CRM 360 ni Sollahms AI Lab.

SHA256 del inventario candidato: `{pin}`.

Los hashes anteriores/posteriores, rutas y archivos idénticos están en [candidate-manifest.json](candidate-manifest.json) y [source-preservation.json](source-preservation.json). La única modificación de configuración fuente añade `false` para la nueva rama; no cambia la configuración runtime ni otras reglas.

## Pruebas finales

| Comprobación | Resultado |
|---|---|
| Inventario global | 147 HTML; 2 páginas afectadas; 131 fichas intactas; cero frase activa |
| Chrome local | 20/20 casos, antes/después, ambas páginas en 1440/1024/768/390/320 |
| Chrome Preview autenticada | 20/20 casos; 10 candidatos remotos y 10 controles anteriores locales |
| Integridad producción previa | 9/9 comprobaciones; 1.660 rutas/SHA1 coincidentes |
| Integridad Preview | 11/11 comprobaciones; 1.660 rutas/SHA1 coincidentes; siete funciones |
| Acceso privado | HTTPS/TLS válido; anónimo 302 a Vercel SSO |
| Diseño y enlaces | Sin overflow, vacíos nuevos o recursos fallidos; DOM/logo/enlaces/estilos conservados |
| Motion | Lectura opaca, borde atenuado, movimiento reducido respetado; pies estáticos |
| JavaScript | Cero errores inesperados; fixtures UF 503 documentadas |
| WhatsApp | Deep link y activación por clic correctos; navegación externa interceptada |
| Envíos o escrituras | Cero formularios, mensajes, reservas, correos, POST o escrituras CRM |

[QA local](local/results.json) · [QA remota](remote/results.json) · [Integridad remota](verification/preview-summary.json) · [Inventario](inventario.json) · [Capturas finales](remote/after/).

Se revisaron visualmente las capturas de ambos pies en los cinco anchos. Las diferencias de contenido que ya existían entre los pies se conservan. La prueba de WhatsApp comprueba enlace y clic, sin enviar un mensaje ni probar entrega del proveedor. Las APIs financieras usan una fixture 503 explícita; no se realiza una nueva auditoría financiera ni una consulta UF real. Las fuentes externas declaradas por el catálogo se cargan mediante GET de Google Fonts. La barra administrativa inyectada por Vercel se excluye del navegador de QA mediante una respuesta 204 al único script de feedback; no se cambia ninguna configuración o recurso del sitio. Los datos publicados no cambian.

Los diagnósticos iniciales de medición del fade y exclusión de la barra administrativa se conservan en `attempts/`; no representan fallos del sitio. La matriz final usa un nodo estable y geometría verificada, y comprueba motion antes/después. Los certificados finales son los JSON de `local/`, `remote/` y `verification/`.

## Continuidad

No se creó ni promovió Production, no se asignaron dominios y no se fusionó ningún PR. La publicación sigue pendiente de autorización expresa posterior. Se conserva SSO `all_except_custom_domains`, autoasignación desactivada y previews automáticas desactivadas. La Preview se verificó con autenticación existente; no se crearon sharelinks ni se cambiaron protecciones o secretos.

Output verificado: `/private/tmp/sollahms-footer-review-20261116/.vercel/footer-sin-frase-20261116/stage/.vercel/output`. No reconstruir desde main histórico ni ejecutar generadores generales. Si falta el output, recuperar los mismos bytes autenticados de la Preview y cotejar el manifiesto completo. El [siguiente prompt completo](SIGUIENTE-PROMPT.md) permite continuar cuando el propietario decida autorizar la publicación.
'''
(DOCS / 'INFORME-CIERRE.md').write_text(closure)

prompt = f'''# SOLLAHMS — siguiente prompt para publicación

**Usar este prompt solamente cuando el propietario haya decidido autorizar la publicación. Este archivo y su creación no constituyen una autorización actual.**

---

Autorizo expresamente publicar en producción exclusivamente la eliminación de «PRECISION • TRANSPARENCY • STRATEGY» de los pies activos de Sollahms, conforme al candidato de la Preview privada ya verificada. No autoriza fusionar este u otros PR, cambiar datos comerciales, modificar fichas, CRM 360, Sollahms AI Lab, integraciones, secretos, DNS ni protecciones.

## Estado de referencia

- Repositorio: `lasopho/sollahms-web`.
- Rama: `codex/footer-sin-frase-20261116`.
- Checkout preparado: `/private/tmp/sollahms-footer-review-20261116`.
- PR: https://github.com/lasopho/sollahms-web/pull/31, abierto en Draft, sin merge.
- Base de continuidad: `codex/centro-auditoria-integral-20261116`, HEAD inicial `67a57b142dd2170c678e75c4c425aabd16579339`.
- Implementación: `{created['sourceCommit']}`. Consultar el HEAD remoto real y conservar los commits documentales posteriores.
- Preview privada: `{deployment}`, `{url}`, READY, prebuilt, SSO.
- Producción observada al cierre: `{created['baselineDeployment']}`, source `42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9`.
- Proyecto Vercel: `project-wrapp`, ID `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`; team `team_A9VNIW2f2K1IJpd2pGdvDmEN`, scope `lsandoval2-8260s-projects`.
- Aliases productivos `sollahms.cl`, `www.sollahms.cl` y `sollhams.cl`; los dos últimos mantienen 308 a `sollahms.cl`.
- Inventario base: `ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05`.
- Inventario candidato: `{pin}`.
- Output: `.vercel/footer-sin-frase-20261116/stage/.vercel/output`, 1.660 archivos, solo `static/index.html` y `static/proyectos.html` modificados; otros 1.658 idénticos.

## Instrucciones

1. Leer `AGENTS.md`, `NEXT-PROMPT.md`, los informes de auditoría y cierre y `candidate-manifest.json` en `docs/footer-sin-frase-20261116/`. Revisar `local/results.json`, `remote/results.json`, `verification/preview-summary.json`, `completion.json` y `SHA256SUMS`. Los diagnósticos en `attempts/` son históricos; los resultados finales están aprobados.
2. Reconsultar producción actual, aliases, configuración SSO, HEAD remotos y PR activos antes de intervenir. Si algo cambió después del cierre, conciliar esos cambios; no sobrescribirlos con el paquete anterior. No reconstruir desde main histórico ni modificar checkouts ajenos.
3. Verificar el inventario completo del output y su pin. Si falta, recuperar exactamente los bytes autenticados de la Preview y comprobar las 1.660 rutas, tamaños y hashes. No ejecutar builders, instaladores, generadores o empaquetadores generales.
4. Preservar las 131 fichas, la eliminación de recorridos, Contacto, Centro, siete funciones/57 archivos, configuración v3, formularios, información comercial, logos, enlaces y motion. El único cambio publicado debe seguir siendo la retirada de los dos bloques del eslogan. No introducir otro eslogan.
5. Con esta nueva autorización, crear un único Production aislado/prebuilt sin asignar dominios, a partir de esos mismos bytes. No promover directamente la Preview porque esa ruta puede reconstruirla. Verificar primero el Production aislado: manifiesto completo, siete funciones, acceso protegido y ambos pies en 1440/1024/768/390/320. No enviar formularios ni mensajes.
6. Reconsultar aliases justo antes de promover. Solo si todo coincide y no hay cambios concurrentes, promover exactamente el mismo Production aislado verificado. Mantener los redireccionamientos existentes y todas las protecciones. No fusionar PR ni habilitar despliegues automáticos.
7. Verificar públicamente ausencia de frase en ambas páginas y alias `/`, enlaces, WhatsApp, recursos, consola, responsive y desvanecimiento, además de hashes/preservación de las 131 fichas y funciones. Evitar repetir auditorías financieras históricas que no corresponden a este cambio. Usar fixtures donde sea necesario y no llamar proveedores de envío.
8. Conservar HWs como rollback y registrar ID nuevo, SHA fuente, hashes del artefacto, verificación previa/posterior, aliases y recibos de autorización. Si hay un fallo real de publicación, restituir el último deployment verificado sin reconstrucciones generales.
9. Actualizar `NEXT-PROMPT.md`, informes, manifiestos, capturas y cierre productivo. Terminar con URLs públicas y estado comprobado, dejando constancia de que esta autorización ya se ejecutó y no se reutiliza para cambios futuros.

La validación previa cubre 147 páginas, solo dos apariciones, 20/20 casos locales y 20/20 de comparación con Preview; 1.660 archivos remotos exactos. Las referencias de la frase que permanecen en documentos históricos o en la evidencia del encargo no están publicadas.
'''
(DOCS / 'SIGUIENTE-PROMPT.md').write_text(prompt)
(ROOT / 'NEXT-PROMPT.md').write_text(f'''# SOLLAHMS — frase corporativa eliminada; Preview privada lista

La eliminación global del eslogan está implementada y verificada el **16/11/2026**. **Producción no modificada.** No publicar, crear Production, promover, asignar dominios ni fusionar PR sin autorización expresa posterior.

- [Preview privada SSO]({url}/): `{deployment}`, READY.
- [PR #31 Draft](https://github.com/lasopho/sollahms-web/pull/31), sin merge; rama `codex/footer-sin-frase-20261116`, base `codex/centro-auditoria-integral-20261116`.
- Implementación `{created['sourceCommit']}`; los commits posteriores contienen documentación/evidencia. Consultar y conservar HEAD remoto real.
- Producción sigue en `{created['baselineDeployment']}`, con Contacto y Centro publicados y recorridos eliminados. Los aliases productivos permanecen intactos.
- Candidato SHA256 `{pin}`: 1.660 archivos, solo dos HTML modificados, otros 1.658 idénticos; 131 fichas, siete funciones/57 archivos y configuración v3 preservados.
- 147 páginas auditadas; solo portada y Asset Portafolio contenían la frase. Dos apariciones eliminadas y cero residuales activos; referencias históricas conservadas.
- Chrome local 20/20 y comparación Preview 20/20 en 1440/1024/768/390/320; integridad Preview 11/11 y 1.660 rutas/SHA1 exactas; SSO anónimo comprobado. Cero errores inesperados, overflow o recursos fallidos. WhatsApp probado por clic sin enviar mensajes; APIs financieras con fixture 503 explícita.

Leer `AGENTS.md`, [auditoría](docs/footer-sin-frase-20261116/INFORME-AUDITORIA.md), [cierre](docs/footer-sin-frase-20261116/INFORME-CIERRE.md), [manifiesto](docs/footer-sin-frase-20261116/candidate-manifest.json), [certificado](docs/footer-sin-frase-20261116/completion.json) y [siguiente prompt completo](docs/footer-sin-frase-20261116/SIGUIENTE-PROMPT.md). El anterior NEXT-PROMPT productivo se conserva en `docs/footer-sin-frase-20261116/history/`.

Checkout `/private/tmp/sollahms-footer-review-20261116`; output `.vercel/footer-sin-frase-20261116/stage/.vercel/output`. Recuperar los mismos bytes autenticados de la Preview si falta y verificar el manifiesto completo; no reconstruir desde main ni ejecutar generadores generales. No modificar checkouts ajenos, fichas, funciones, CRM 360, Sollahms AI Lab ni otros PR.

SSO `all_except_custom_domains`, autoasignación false, previews automáticas deshabilitadas y reglas de ramas false se mantienen. La próxima acción es revisión del propietario. La autorización de publicaciones previas ya se ejecutó y no cubre este cambio. No repetir QA certificada por rutina; verificar cambios nuevos, discrepancias o el nuevo deployment de una futura publicación autorizada.
''')

audit = DOCS / 'INFORME-AUDITORIA.md'
body = audit.read_text().split('\n## Certificación final\n')[0]
audit.write_text(body + f'''\n## Certificación final

Preview `{deployment}` READY y SSO, artefacto remoto 1.660/1.660 exacto, matriz local 20/20 y comparación remota 20/20 aprobadas. No se modificó producción ni se fusionó ningún PR. [Cierre verificable](completion.json) y [siguiente prompt](SIGUIENTE-PROMPT.md).
''')
transport = ROOT / '.vercel/footer-sin-frase-20261116/remote-transport' / ('native-transport-summary-' + deployment + '.json')
if transport.exists():
    shutil.copy2(transport, DOCS / 'verification/native-transport-summary.json')
save('completion.json', {'closedAt': now, 'status': 'PASS', 'readyForOwnerReview': True, 'productionAuthorized': False,
    'productionChanged': False, 'productionDeployment': created['baselineDeployment'], 'previewDeployment': deployment,
    'previewUrl': url, 'sourceCommit': created['sourceCommit'], 'branch': created['sourceBranch'], 'pr': 31, 'prDraft': True,
    'prMerged': False, 'outputInventorySha256': pin, 'runtimeFiles': 1660, 'runtimeChangedFiles': 2, 'runtimeIdenticalFiles': 1658,
    'htmlAudited': 147, 'affectedPages': ['index.html', 'proyectos.html'], 'occurrencesRemoved': 2, 'activeOccurrencesRemaining': 0,
    'projectFichesIdentical': 131, 'functionBundlesIdentical': 7, 'functionFilesIdentical': 57,
    'localBrowserCases': 20, 'previewBrowserCases': 20, 'viewports': remote['widths'], 'previewIntegrityChecks': 11,
    'unexpectedJavaScriptErrors': 0, 'failedResources': 0, 'overflowCases': 0, 'emptySloganContainers': 0,
    'footerHeightRemovedPx': 112, 'whatsappClickVerifiedWithoutSending': True, 'commercialSubmissions': 0,
    'productionDeploymentsCreated': 0, 'productionPromotions': 0, 'branchMerges': 0,
    'ssoAnonymousRedirectVerified': True, 'documentationOnlyAfterImplementation': True})

# Stage only authorized delivery paths so the source certificate includes newly
# tracked evidence as additions. Both hash manifests are explicitly self-excluded.
(DOCS / 'SHA256SUMS').touch(exist_ok=True)
subprocess.run(['git', 'add', 'NEXT-PROMPT.md', 'docs/footer-sin-frase-20261116'], cwd=ROOT, check=True)
spec = importlib.util.spec_from_file_location('footer_prepare', DOCS / 'prepare-preview.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
preservation = module.source_preservation()
preservation['stage'] = {key: stage[key] for key in ['fileCount', 'changedFiles', 'identicalFiles', 'functionFiles',
    'functionBundles', 'projectFichesPreserved', 'contactoUnchanged', 'centroUnchanged', 'sharedMotionUnchanged', 'configUnchanged', 'allOtherRuntimeFilesIdentical']}
module.save(DOCS / 'source-preservation.json', preservation)
paths = sorted(p for p in DOCS.rglob('*') if p.is_file() and p.name != 'SHA256SUMS' and '__pycache__' not in p.parts)
paths.append(ROOT / 'NEXT-PROMPT.md')
checksums = ''.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.relative_to(ROOT).as_posix() + '\n' for p in paths)
(DOCS / 'SHA256SUMS').write_text(checksums)
subprocess.run(['git', 'add', 'docs/footer-sin-frase-20261116/source-preservation.json', 'docs/footer-sin-frase-20261116/SHA256SUMS'], cwd=ROOT, check=True)
print(json.dumps({'status': 'PASS', 'preview': deployment, 'checksummedFiles': len(paths),
                  'baselineTrackedIdentical': preservation['trackedFilesIdentical'], 'baselineTrackedChanged': preservation['trackedFilesModified'],
                  'deliveryTrackedAdded': preservation['trackedFilesAdded'], 'stagedForReview': True}))
