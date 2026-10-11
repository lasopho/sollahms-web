# Sollahms — publicación controlada y reversión

Preparación verificada el **11/10/2026**. **FASE A y FASE B no ejecutadas ni autorizadas.** Este documento es el procedimiento para una autorización posterior; no habilita por sí mismo merge, despliegue, promoción, rollback ni cambios de plataforma.

## Versión y diagnóstico confirmados

La rama `codex/integracion-financiera-sollahms` estaba limpia en `d3e18ad4576c64662b05a74e58be01aae60a354d`, igual al remoto, al iniciar esta tarea. `main` local/remoto conserva `69eb89524d38071a5b5df6a032e105f0aa958d87`; había **33 commits** de desarrollo respecto de ese `main`. Los nuevos documentos, herramienta y tests de preparación no cambian ninguna fuente de la aplicación desplegada.

Los logs del deployment Git **`dpl_2d17ucdR3Ar6egzvSeoq9TJxiFxv`** confirman el rechazo en `package-vercel.mjs`:

```text
Incomplete Ingevec contract-covered media batch: reproducible source package required
```

Los **165 recursos Ingevec** no están en Git y sí están en el archivo privado aprobado. El fallo evita perder portadas, galerías y planos silenciosamente. No se eliminará ese control ni se publicarán esos recursos en Git público. El deployment de archivo **`dpl_DruHL78Bm7VBsS5xtdUDer6ESget`** está READY; sus logs confirman la extracción de 964 fuentes, 151 HTML y 269 recursos gráficos. Incluye las cuatro funciones de UF, contacto, disponibilidad y reserva.

La [Preview aprobada](https://project-wrapp-23xd0qnrh-lsandoval2-8260s-projects.vercel.app/proyectos.html) permanece vigente. La preparación sólo cambia documentación y herramientas excluidas del archivo desplegable; no necesita otra Preview para un contenido idéntico. Un push de preparación puede disparar otro intento Git de Preview incompleto; no debe confundirse con el deployment completo identificado por su ID y URL inmutables.

## Paquete original, reproducción y respaldo

Archivo original verificado:

```text
/Users/luissandoval/.codex/visualizations/2026/10/09/01a1218b-daec-72b3-b6d5-7c17c42e4319/sollahms-brochures-private/launch-2026-10-11/release/source.tgz
SHA-256: 0a12368ef521e4a6302af2658d6744431bffe7b3391cb91da2b73b88baba1e65
Tamaño comprimido: 138632917 bytes
Fuentes: 964 archivos / 142095441 bytes sin comprimir
```

Los 799 archivos versionados coinciden exactamente con los blobs de `d3e18ad`; los otros 165 son los derivados Ingevec seleccionados y verificados. El archivo incluye 269 recursos —127 imágenes y 142 planos—, con 22 brochures documentados. No contiene originales PDF, contratos, candidatos, documentos internos, secretos, `.git`, `.env`, auditorías, tests ni documentación operativa.

La herramienta **`scripts/prepare-release.py`** verifica hash, tamaños, inventario, blobs Git y fuentes actuales, rechaza cambios relevantes, extrae exclusivamente miembros regulares sin escapes/duplicados y construye localmente ambas variantes. Audita el resultado y genera un comprobante privado. También funciona desde un clon Git limpio: recupera los recursos ignorados del archivo aprobado y nunca necesita publicarlos en Git.

Ejemplo **local, sin red ni despliegue**, ejecutado satisfactoriamente durante esta preparación:

```sh
SOLLAHMS_PYTHON=/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
SOLLAHMS_NODE=/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
SOLLAHMS_ARCHIVE=/Users/luissandoval/.codex/visualizations/2026/10/09/01a1218b-daec-72b3-b6d5-7c17c42e4319/sollahms-brochures-private/launch-2026-10-11/release/source.tgz
"$SOLLAHMS_PYTHON" scripts/prepare-release.py \
  --archive "$SOLLAHMS_ARCHIVE" \
  --output-directory /private/tmp/sollahms-release-NUEVO \
  --node "$SOLLAHMS_NODE"
```

Usar un directorio **nuevo**, privado y fuera del checkout. `source/` es el único directorio fuente que podrá enviarse a Vercel. Los builds locales y los comprobantes permanecen al lado, fuera de él. `.vercel/project.json` sólo vincula localmente los IDs conocidos; no consulta ni modifica Vercel. No desplegar el `.tgz` como archivo estático, el directorio padre, el checkout incompleto ni `dist/` como prebuilt.

Conservar el original y una segunda copia privada con SHA verificado en almacenamiento controlado por el titular. La preparación aprobó desde un clon sin los 165 archivos ignorados; tras recuperarlos con la receta acotada, el generador reprodujo también el archivo original con **exactamente el mismo SHA-256, 964 fuentes y 138632917 bytes**. Los directorios `/private/tmp` son comprobantes de trabajo y no reemplazan el archivo durable. No se contrató almacenamiento ni otro servicio pagado.

## Equivalencia y pruebas ejecutadas

| Control | Resultado ejecutado |
|---|---:|
| Suite Node completa | 249 PASS, sin skips |
| Suite Python base | 33 PASS |
| Suite Python final, incluidos 17 controles nuevos | 50 PASS |
| Validadores de fichas, presentación, finanzas y datos hipotecarios | 4 PASS |
| Proyectos / otras inmobiliarias / fichas Ingevec | 144 / 128 / 16 |
| Entradas comerciales Ingevec / brochures documentados | 17 / 22 |
| HTML / archivos por build | 151 / 951 |
| Portadas AJ Urbana + Ingevec | 21 |
| Imágenes / planos seleccionados | 127 / 142 |
| Recursos de brochures con SHA exacto | 269 |
| Imágenes raster decodificadas completamente | 770, cero fallos |
| Referencias locales / canonical de fichas / sitemap | 6183 / 144 / 150 |
| Errores del auditor independiente | 0 |

Los builds fresh publicable y Preview coinciden con los inventarios aprobados archivo por archivo. Sólo difieren el `noindex` de revisión, `robots.txt` y el aviso de revisión de los tres formularios; las funciones también mantienen el bloqueo de escrituras en Preview según `VERCEL_ENV`. Los seis proyectos retirados permanecen fuera. Vicuña Mackenna 7589 conserva tres modelos por etapa, dos fuentes distintas y una ficha, sin mezclar superficies ni disponibilidad.

Se probaron las API **extraídas del archivo**, en modo Production, con proveedores estrictamente simulados: contacto, disponibilidad, reserva, contexto de proyecto y UF recalculada por servidor; rechazo de Origin ajeno, de métodos/valores incorrectos y de UF antigua. Cero mensajes, reservas o POST reales. El negativo sin los 165 recursos Ingevec rechazó Production antes de crear `dist`.

El handler real consultó SII por GET el 11/10/2026: HTTP200, **$41.141,53**, fecha `America/Santiago`, `private, no-store`. Regresiones de error, timeout, recuperación y cambio de día aprobadas; conserva los cálculos independientes en UF y evita convertir CLP con un día anterior. [Fuente oficial SII](https://www.sii.cl/valores_y_fechas/uf/uf2026.htm). El valor debe verificarse nuevamente el día de publicación, no fijarse como constante.

La CLI oficial **63.1.2** y su binario ARM se descargaron del registro npm y sus integridades SHA512 se verificaron; versión y ayudas de deploy/promote/rollback aprobaron. El dry-run dirigido al equipo se detuvo por falta de acceso; el dry-run aislado sin credenciales también se detuvo antes del inventario. **No se declara probado el upload/deployment de CLI ni se realizó login o cambio de credenciales.** El transporte nativo por archivo sí fue ejecutado en la Preview anterior. El inventario CLI queda como comprobación obligatoria previa, con autenticación válida.

## Configuración real de plataforma

Proyecto **`project-wrapp`**, ID `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`; equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`, slug `lsandoval2-8260s-projects`. Se verificaron en la sesión autenticada de Vercel, sin tocar controles:

- Plan Hobby; Production sigue la rama **`main`**.
- **Auto-assign Custom Production Domains: Enabled**. Hoy un merge sin gate intentaría construir Production automáticamente y el checkout Git incompleto fallaría.
- Acceso a variables de sistema habilitado; Node **24.x**, framework Other, raíz vacía, sin overrides de build/output/install. `vercel.json` aporta el build `node scripts/package-vercel.mjs` y salida `dist`.
- Ignored Build Step **Automatic**; sin Deployment Checks configurados; retención visible de cancelados, errores, Preview y Production: **30 días**.
- Protection autenticada en deployments fuera de dominios personalizados; no se crearon bypasses ni se desactivó protección.

Variables inspeccionadas sólo por nombre, tipo y alcance:

| Variable | Presencia y alcance |
|---|---|
| `RESEND_API_KEY` | Secret/sensitive, Production, Preview y Development |
| `BOOKING_BACKEND_URL` | Config/encrypted, los tres entornos |
| `BOOKING_SECRET` | Secret/sensitive, una configuración para cada entorno |
| `VERCEL_ENV` | Sistema habilitado; verificar `production` en el candidato |

No se revelaron valores ni se verificó mediante un envío real la aceptación del proveedor o la validez de credenciales. UF no requiere token ni proveedor pagado. Contacto conserva su destinatario, y agenda conserva su backend autorizado. El servidor valida Origin contra el origen de la propia solicitud; no confiar en un origen suministrado por el visitante. Las pruebas de seguridad conservan los headers y la compatibilidad con mapas/visores.

## Método seleccionado

**Directorio privado verificado → build remoto de Production sin dominios → auditoría → promoción del mismo ID.** Es un proceso repetible con la CLI, sin servicios pagados adicionales. `--archive=tgz` comprime y fragmenta el transporte en esta versión de CLI; no convierte el TGZ original en un proyecto. El paquete de transporte puede tener otro hash, por lo que se verifican fuentes, manifiestos, logs y recursos remotos, además del hash original registrado. [CLI deploy](https://vercel.com/docs/cli/deploy), [fragmentación oficial](https://vercel.com/changelog/split-tgz-is-now-the-default-cli-archive-deployment-behavior).

Un build remoto completo conserva el empaquetado automático de las cuatro funciones, sus imports y los valores Production. No se recomienda prebuilt para este cierre: `dist` no contiene el Build Output API ni las Functions, y no se ha creado ni auditado `.vercel/output` completo. Promover la Preview aprobada provoca otro build; no equivale a publicar el build revisado con entorno Production. Un staged Production puede promoverse sin reconstruirlo. [Promoción de deployments](https://vercel.com/docs/deployments/promoting-a-deployment), [deploy prebuilt](https://vercel.com/docs/cli/deploy#prebuilt).

El acceso efectivo de CLI al equipo y a operaciones Production/rollback es un requisito aún pendiente. Si la CLI no dispone de ese alcance, usar el conector nativo para el mismo archivo fragmentado **sólo después de comprobar sus permisos de Production y la opción de staging sin alias**; no improvisar un fallback que asigne el dominio directamente.

## FASE A — instrucción posterior para integrar con seguridad

**Instrucción lista para autorizar:** «Ejecuta únicamente FASE A. Verifica las referencias y la versión preparada, añade en la rama de integración el gate Git específico de main, reconstruye y registra el nuevo paquete privado con equivalencia comercial exacta, integra mediante PR revisado sin despliegue automático y deja Production en su deployment actual. Detente si una comprobación falla. No ejecutes FASE B.»

1. Revalidar remoto `main`, HEAD de integración, estado limpio, proyecto/equipo, dominios y Production actual. Si hay cambios desde las referencias aprobadas, analizar el diff y preservar avances; no reset/force-push ni integrar otras ramas. Resolver antes el acceso de publicación y reversión. Registrar el deployment vigente, que debe permanecer igual durante toda FASE A.
2. Crear en la rama de integración un commit operacional que añada exclusivamente este gate a `vercel.json`, conservando todos sus otros campos:

   ```json
   "git": { "deploymentEnabled": { "main": false } }
   ```

   No incluir reglas `true` que también coincidan con `main`, ni deshabilitar todas las ramas. La [configuración oficial Git](https://vercel.com/docs/project-configuration/git-configuration) hace que la configuración del commit impida los builds disparados por `main`. No cambiar la Production Branch ni el resto del desarrollo paralelo. **Este gate todavía no está aplicado.**

   El SHA actual de `vercel.json` está congelado en `tests/commercial-html.mjs` y `tests/brochure_review_validation.py`: tras comprobar que la única diferencia semántica contra `d3e18ad` es `git.deploymentEnabled.main:false`, calcular el nuevo SHA y actualizar únicamente el fingerprint actual de ese archivo en ambos controles, manteniendo el fingerprint histórico y todos los demás freezes. Incluir esa revisión de tests en el commit operacional; no sustituir la comparación estricta por una excepción general. Sin este ajuste revisado la suite y los validadores rechazarían correctamente el gate nuevo.
3. En un clon limpio, recuperar primero los 165 derivados ignorados desde `source/` de una preparación original aprobada usando el comando acotado de abajo. El preparador original los obtiene del archivo, pero el generador de un paquete nuevo los necesita también en el checkout. Verificar hashes y exclusión Git; no copiar otras fuentes ni sobrescribir `vercel.json` con su versión anterior. Como `vercel.json` es parte de las fuentes, el gate crea **otro SHA de archivo**: generar nuevo paquete con `scripts/create-brochure-bundle.py --verify-public-web --node ... --output-directory ...`. Comparar el inventario contra el paquete original: ninguna fuente comercial, HTML, CSS, JS, API, lib, dato financiero, imagen o plano puede cambiar; la única diferencia desplegable autorizada es `vercel.json.git`. Ambos `dist` y las fuentes de las cuatro funciones deben ser idénticos a la versión aprobada según su perfil. No atribuir al nuevo commit el antiguo hash.
4. Registrar el commit fuente que contiene el gate y el nuevo SHA, tamaño e inventario en un nuevo `release-reference.json` privado/revisado; conservar el de `d3e18ad` como histórico. Reejecutar el preparador con `--reference` nuevo, suite y validadores; generar una Preview protegida desde el nuevo paquete, sin Production, para registrar la versión exacta de publicación.
5. Abrir/revisar el PR de integración **sin squash ni rebase de los 33 commits originales**, comprobar que el merge resultante contiene el gate `main:false`, mantiene 144 proyectos y todas las fuentes aprobadas. Respetar branch protection y checks; no omitirlos para forzar el merge. Tras autorización A, integrar ese PR mediante merge normal. El merge genera un evento Git para el nuevo tip; no despliega individualmente los 33 commits históricos.
6. Verificar inmediatamente el SHA remoto de `main`, la ausencia de un nuevo build automático Production y que `sollahms.cl` sigue apuntando al ID capturado antes. Mantener el gate para todas las futuras actualizaciones. Entregar SHA de integración, paquete nuevo, Preview y evidencia; terminar FASE A esperando autorización B.

**Detener A** por conflicto que cambie la versión aprobada, gate no comprobable, refs movidas sin revisión, paquete distinto de lo autorizado, CI fallido, acceso/rollback no verificables o cualquier cambio del alias Production. Si sólo ocurrió el merge, no desplegar para «arreglarlo». Si debe revertirse Git, usar PR inverso del merge conservando el gate; no eliminar la protección junto al contenido. Si Production cambió, tratarlo como incidente y aplicar el rollback autorizado de abajo.

Restauración local de medios, desde la rama de integración y **antes de generar el paquete nuevo**. Usar las rutas del comprobante de la preparación original. Se probó en un clon limpio: ningún recurso privado se añade al índice Git. El comando verifica todos los destinos antes de escribir y conserva los archivos existentes cuando sus bytes coinciden:

```sh
export SOLLAHMS_VERIFIED_SOURCE=/ruta/privada/preparada/source
export SOLLAHMS_PREPARATION_RECEIPT=/ruta/privada/preparada/release-receipt.json
"$SOLLAHMS_PYTHON" - <<'PY'
import hashlib, json, os, subprocess
from pathlib import Path
root = Path.cwd().resolve()
source = Path(os.environ['SOLLAHMS_VERIFIED_SOURCE']).resolve()
receipt = json.loads(Path(os.environ['SOLLAHMS_PREPARATION_RECEIPT']).read_text())
assert receipt['localPreparationPassed'] is True
assert receipt['approvedAppCommit'] == 'd3e18ad4576c64662b05a74e58be01aae60a354d'
assert receipt['archiveSha256'] == '0a12368ef521e4a6302af2658d6744431bffe7b3391cb91da2b73b88baba1e65'
branch = subprocess.check_output(['git','branch','--show-current'], text=True).strip()
assert branch == 'codex/integracion-financiera-sollahms'
tracked = set(subprocess.check_output(['git','ls-files','-z']).decode().split('\0'))
media = {name:info for name,info in receipt['deployableSourceInventory'].items()
         if name.startswith('assets/propiedades/ingevec-preview/')}
assert len(media) == 165
checked = []
for name, info in media.items():
    assert '..' not in Path(name).parts and name not in tracked
    assert subprocess.run(['git','check-ignore','-q','--',name]).returncode == 0
    original, target = source/name, root/name
    assert original.is_file() and original.resolve() == original
    data = original.read_bytes()
    assert hashlib.sha256(data).hexdigest() == info['sha256']
    assert target.resolve() == target and not target.is_symlink()
    if target.exists():
        assert target.is_file() and target.read_bytes() == data
    checked.append((target,data))
for target, data in checked:
    if not target.exists():
        target.parent.mkdir(parents=True,exist_ok=True)
        with target.open('xb') as output:
            output.write(data)
print('165 medios verificados y disponibles; ninguno añadido a Git')
PY
```

## FASE B — instrucción posterior para publicar con control

**Instrucción lista para autorizar:** «Ejecuta únicamente FASE B sobre el commit, archivo y Preview exactos entregados tras FASE A. Comprueba integridad, configuración y recuperación; crea un staged Production completo sin asignar dominios, audítalo sin correos o reservas reales y publica promoviendo sólo ese ID si todas las comprobaciones pasan. Si se detecta una señal de reversión, restaura inmediatamente el deployment anterior previamente verificado. No cambies catálogo, credenciales ni otras ramas.»

Antes de B deben existir permiso verificable de deploy/promote/rollback, target anterior READY elegible y retenido, gate de `main` vigente, paquete privado nuevo de A respaldado, variables Production presentes, sistema habilitado y pruebas aprobadas. Volver a capturar el ID del deployment que sirve `sollahms.cl` **justo antes** de publicar; no reutilizar ciegamente un ID histórico.

La CLI probada está en `/private/tmp/sollahms-production-prep-method/cli/native-package/package/bin/vercel`. Para otra máquina instalar **la versión oficial 63.1.2**, verificar integridad y autenticar normalmente con el titular autorizado; no guardar tokens en el repo ni pasarlos como `--token`. La autenticación o scope actuales de esta sesión no permiten completar el dry-run del equipo.

Comandos futuros, **no ejecutados**. Completar variables con el comprobante real de A; no inventar IDs ni SHA:

```sh
SOLLAHMS_VC=/private/tmp/sollahms-production-prep-method/cli/native-package/package/bin/vercel
SOLLAHMS_RELEASE_SOURCE=/ruta/privada/preparada/source
SOLLAHMS_SOURCE_COMMIT=SHA_REAL_DEL_COMMIT_FUENTE_APROBADO_EN_A
SOLLAHMS_SOURCE_ARCHIVE_SHA=SHA256_REAL_DEL_ARCHIVO_APROBADO_EN_A
export VERCEL_TELEMETRY_DISABLED=1
export NO_UPDATE_NOTIFIER=1

# Read-only; debe aprobar y seleccionar las 964 fuentes, incluidos los 165 privados.
"$SOLLAHMS_VC" deploy --dry --json --cwd "$SOLLAHMS_RELEASE_SOURCE" \
  --project prj_URomRRU0MAy4etGKP5gWv3Qv4DGH \
  --scope team_A9VNIW2f2K1IJpd2pGdvDmEN --non-interactive

# Crea Production staged con entorno Production, SIN asignar dominios.
"$SOLLAHMS_VC" deploy --cwd "$SOLLAHMS_RELEASE_SOURCE" \
  --project prj_URomRRU0MAy4etGKP5gWv3Qv4DGH \
  --scope team_A9VNIW2f2K1IJpd2pGdvDmEN --non-interactive \
  --prod --skip-domain --archive=tgz --json \
  --meta githubCommitSha="$SOLLAHMS_SOURCE_COMMIT" \
  --meta sourceArchiveSha256="$SOLLAHMS_SOURCE_ARCHIVE_SHA"
```

Esperar READY y guardar el ID generado; confirmar `target:production`, equipo/proyecto correctos, **sin aliases**, logs de 151 páginas/269 medios/165 Ingevec y las cuatro funciones. El origen contractual permite `sollahms.cl`; el URL de staging debe mantener protección de revisión. `--skip-domain` no deshabilita proveedores ni garantiza autenticación: verificar la protección y no enviar POST reales al candidato.

Auditar todos los archivos y recursos contra el inventario local, navegación, mapas/visores, responsive, filtros, buscador CLP, comparador, UF vigente y headers. Los POST se verifican con mocks locales de las fuentes exactas. GET UF real debe ser del día chileno; una caída SII temporal debe mostrar estado indisponible sin conversión falsa. Verificar robots, canonical, sitemap, ausencia de contenido privado y modo servidor Production; no confiar sólo en metadata escrita por el operador.

Guardar un **comprobante sanitizado respaldado por evidencia real**, fuera del deploy, con los campos exigidos por `verify_staged_deployment`: `deploymentId`, `projectId`, `teamId`, `target`, `readyState`, `aliases`, `archiveSha256`, `approvedAppCommit`, `runtimeEnvironment`, `systemEnvironmentVerified`, `publicBuildAuditPassed`, `providerMocksPassed`, `realProviderWrites:0`. Validarlo:

```sh
"$SOLLAHMS_PYTHON" scripts/prepare-release.py \
  --reference /ruta/privada/referencia-aprobada-A.json \
  --staged-receipt /ruta/privada/candidato-verificado.json
```

Este comando comprueba la consistencia del comprobante; **no certifica por sí solo un deployment ni realiza la promoción**. Tras superar todos los controles de B:

```sh
SOLLAHMS_STAGED_ID=ID_REAL_VERIFICADO_DEL_CANDIDATO
"$SOLLAHMS_VC" promote "$SOLLAHMS_STAGED_ID" \
  --cwd "$SOLLAHMS_RELEASE_SOURCE" \
  --scope team_A9VNIW2f2K1IJpd2pGdvDmEN --non-interactive
"$SOLLAHMS_VC" promote status project-wrapp \
  --cwd "$SOLLAHMS_RELEASE_SOURCE" \
  --scope team_A9VNIW2f2K1IJpd2pGdvDmEN --non-interactive
```

Comprobar alias `sollahms.cl` al ID exacto, HTTPS, páginas/recursos/SHA, UF del día, formularios accesibles sin el bloqueo de Preview, headers y SEO publicables, navegaciones contextual y móvil. No crear mensajes o reservas de control sin autorización específica. Vigilar errores iniciales y conservar ambos deployments/archivos. Un timeout de promote exige consultar estado antes de repetir.

## Rollback exacto y límites comprobados

Production actual confirmado por el alias y dashboard:

```text
ID: dpl_B2yGdPCsFsg9fdHdVUBYF9j6qwsF
URL: project-wrapp-kn80j7fn2-lsandoval2-8260s-projects.vercel.app
Git: main / 69eb89524d38071a5b5df6a032e105f0aa958d87
```

Se guardó un respaldo privado de las **30 fuentes Git de ese commit** (10 HTML y tres API) mediante `git archive`, SHA256 **`7ed4f3c5602fafca50949996a3df3fa19dc06f1483c93e97261585692dfe15fb`**. No incluye secretos ni documentos privados. **Es un respaldo de fuentes, no una exportación del build compilado ni de sus variables.** Vercel no entregó el árbol fuente del deployment Git mediante el endpoint consultado (404). El deployment vigente retenido es el respaldo íntegro de artefactos y entorno para Instant Rollback. Se registró además el baseline público por GET de `/api/contact`, `/api/booking-availability` y `/api/booking-create`: 405 y `Allow: POST`, sin llamadas de escritura ni reservas.

La política visible es 30 días y el plan Hobby conserva excepciones para deployments activos/Production recientes; no asumir retención ilimitada. Reconfirmar disponibilidad y elegibilidad antes de B y no borrar deployments. [Retención](https://vercel.com/docs/security/deployment-retention). Hobby permite el Production inmediatamente anterior para rollback; el futuro candidato, una vez publicado, debe tener como anterior el ID que acaba de capturarse. No intercalar otras promociones. [Instant Rollback](https://vercel.com/docs/instant-rollback).

La sesión autenticada del dashboard permitió abrir el diálogo inicial de Instant Rollback y ver el candidato anterior **`dpl_6D6SXGHyLChQ4KfgL6x4qshJdRTG`**, commit `333a4c1`, marcado Previous. Se canceló el diálogo sin pulsar Continue ni Confirm Rollback. Es una comprobación de lectura de la elegibilidad actual, no un ensayo de reversión. Después de la publicación nueva, el target que deberá figurar como Previous es el Production capturado justo antes de B, hoy `dpl_B2yGdPCsFsg9fdHdVUBYF9j6qwsF`.

**Pendiente bloqueante de lanzamiento:** el conector devuelve **403 `deploymentRollback`** al consultar candidatos y la CLI no completa el dry-run con el equipo. La lectura del diálogo no demuestra permiso efectivo de ejecución de CLI/conector. Antes de B debe verificarse acceso de un titular autorizado y un camino de recuperación ejecutable; no lanzar sin él. Como alternativa de interfaz, el titular puede usar Overview → Instant Rollback, comprobar el ID Previous → Continue → comprobar de nuevo el ID → Confirm Rollback, exclusivamente con autorización de reversión. Los dos últimos pasos no se ejecutaron durante esta preparación. [Secuencia oficial](https://vercel.com/docs/instant-rollback).

Comandos exactos para una reversión posterior **autorizada**:

```sh
SOLLAHMS_PREVIOUS_PRODUCTION_ID=ID_CAPTURADO_JUSTO_ANTES_DE_B
"$SOLLAHMS_VC" rollback "$SOLLAHMS_PREVIOUS_PRODUCTION_ID" \
  --cwd "$SOLLAHMS_RELEASE_SOURCE" \
  --scope team_A9VNIW2f2K1IJpd2pGdvDmEN --non-interactive
"$SOLLAHMS_VC" rollback status project-wrapp \
  --cwd "$SOLLAHMS_RELEASE_SOURCE" \
  --scope team_A9VNIW2f2K1IJpd2pGdvDmEN --non-interactive
```

Consultar estado tras timeout; no ejecutar dos operaciones opuestas. Verificar alias al ID anterior, HTML/recursos del baseline, tres API anteriores y ausencia de fallos. GET a API que exige POST debe conservar 405; no enviar correos o reservas. La restauración de un build no restaura datos del proveedor, reservas ya creadas, cambios externos ni credenciales revocadas. No divulgar/descifrar secretos para verificarlo.

Los recursos privados del release nuevo permanecen dentro de su deployment y su archivo privado; no desaparecen al volver al anterior. El rollback al sitio previo a esta integración restaura su catálogo anterior, **no promete 144 fichas**, pues esa cartera no estaba publicada allí. Mantener el nuevo archivo para una posterior corrección. Promover otra vez un Production anteriormente promovido no sustituye Instant Rollback; no usar aliases manuales para eludirlo. [Reglas de promoción](https://vercel.com/docs/deployments/promoting-a-deployment).

Si el deployment anterior ya no existe, la alternativa es reconstruir su fuente respaldada y crear/promover **otro** staged Production, con configuración y variables actuales verificadas. No es rollback instantáneo ni garantiza equivalencia al snapshot perdido; exige autorización y pruebas. Mientras no exista una ruta verificable de recuperación, detener lanzamiento.

El rollback desactiva la autoasignación de Production y una promoción posterior puede reactivarla. Mantener `git.deploymentEnabled.main:false` durante y después del incidente. Si también debe revertirse el merge, crear PR con la reversión del merge **conservando ese gate** y verificar que ningún build Git reasigne el dominio. Un revert Git aislado no restaura las imágenes, Functions ni entorno de Vercel. [Rollback operativo](https://vercel.com/docs/cli/rollback).

**Detener antes de promover o revertir tras publicar** ante hash/inventario distinto, menos de 144 proyectos, pérdida de una etapa, cualquiera de los 269 recursos ausente, error de canonical/robots que impida indexar, exposición privada, candidato Preview/missing Functions, origen o alias inesperado, conversión UF vencida, fallo de navegación/formularios, 5xx repetidos o falta de recuperación. Una caída transitoria SII correctamente informada no equivale a convertir con UF vencida; reintentar y evaluar su impacto antes de publicar. Registrar síntoma, ID y hora sin secretos.

## Actualizaciones futuras y pruebas repetibles

1. Trabajar en una rama de desarrollo autorizada, manteniendo el gate de main y el resto del desarrollo paralelo. Para nuevos proyectos o cambios de cartera obtener aprobación explícita de composición; no alterar los 144 aprobados durante este cierre.
2. Verificar fuentes oficiales y alcance Yapo/IRIS de nuevos brochures, correspondencia/atribución, avisos referenciales, privacidad y hashes. Mantener originales/contratos/candidatos fuera de fuente publicable. No exigir licencia individual cuando el contrato ya cubra el uso, ni extenderlo a Git público.
3. Actualizar fichas/datos/derivados privados mediante el flujo existente. Para una nueva cartera aprobada actualizar de forma revisada los inventarios, cantidades y fingerprints; no eliminar controles para conseguir un build verde. Conservar precios y condiciones vigentes; pendientes explícitos cuando no hay evidencia.
4. Ejecutar la batería completa, validadores y auditoría móvil/escritorio. Con Node/Python disponibles, desde el checkout:

   ```sh
   "$SOLLAHMS_NODE" --test tests/*.test.mjs tests/booking-project-context.mjs \
     tests/form-regression.mjs tests/rut-contact.mjs tests/integration-capacity-ui.mjs \
     tests/integration-comparator.mjs tests/integration-contact.mjs
   "$SOLLAHMS_PYTHON" -m unittest discover -s tests -p 'test_*.py' -v
   "$SOLLAHMS_PYTHON" tests/validate-project-details.py
   "$SOLLAHMS_PYTHON" tests/validate-final-adjustments.py --commercial-presentation
   "$SOLLAHMS_PYTHON" tests/validate-financial-integration.py --commercial-presentation
   "$SOLLAHMS_NODE" scripts/validate-mortgage-data.mjs
   ```

5. Commit de aplicación → paquete privado reproducible con `create-brochure-bundle.py --verify-public-web` → comprobar fuentes/archivo/SHA/bytes → registrar nueva referencia y copias privadas. El commit de referencia debe existir antes del registro, evitando un hash circular; los documentos de referencia no se despliegan.
6. Ejecutar `prepare-release.py --reference` nuevo, comparar con Preview protegida y auditar Functions mediante mocks. Entregar ID, hash y comprobantes para revisión humana.
7. Aplicar FASE A y luego FASE B sólo con sus autorizaciones separadas, nuevas verificaciones de refs/alias/permisos/retención y target de rollback capturado inmediatamente antes. Conservar recibos privados y un informe público sin información confidencial. No usar el build Git incompleto como reemplazo de la publicación por archivo.

Pendientes comerciales conservados: precios/estado/entrega no vigentes de Los Alerces y Valle Los Ingleses III, disponibilidad y orientación por unidad no verificadas. Diez fichas carecen de `og:image` (mejora opcional); no se inventaron versiones inglesas ni hreflang. No afectan la reproducción exacta de la versión revisada.

**Estado final de esta preparación: ninguna operación FASE A/B, ningún merge, ningún cambio en main, dominios, credenciales o settings de Vercel, ninguna publicación/promoción/rollback de Production y ningún correo o reserva real.**
