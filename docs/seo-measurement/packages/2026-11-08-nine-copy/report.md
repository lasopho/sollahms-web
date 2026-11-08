# Preparación local de la publicación de nueve mejoras

> **Continuidad:** el archivo faltante se recibió y verificó; la construcción y el QA local del artefacto están completados. Estado actual y huella en [completion/report.md](completion/report.md). El informe siguiente se conserva como evidencia histórica del bloqueo previo.

**8 de noviembre de 2026, UTC. Rama:** `codex/seo-medicion-20261108`.
**Cambios aprobados conservados:** `ad84faac50cfa434fdcfaadbd0a139fbd6e5ab0d`.
**Estado: bloqueado por un archivo fuente exacto; paquete NO listo.** No hay artefacto publicable ni SHA-256 de artefacto para autorizar.

## Base comprobada

Vercel mantiene `dpl_5ReP6rLckXZ7nonSTE7Qu79gesiZ` como publicación de `project-wrapp`, proyecto `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`. Se consultaron sus alias y se confirmó `sollahms.cl` y `www.sollahms.cl`. La metadata identifica la referencia `codex/whatsapp-produccion-20261108`, commit `d7e98eb61edc3b8577b0fe7ec189e7c0ad7e0d53`; ese commit **no sustituye al artefacto congelado**.

Las cuatro páginas públicas se descargaron nuevamente entre 20:43:41 y 20:43:42 UTC: HTTP 200, mismos bytes que la base anterior a las nueve mejoras. [recovery-summary.json](recovery-summary.json) conserva fecha, URL, tamaño, ETag y SHA-256. No hay conflictos nuevos en ellas.

La recuperación detectó que `entorno-desarrollo-urbano.html` publicado difiere de la copia Git de `d7e98eb`. Se conservaron sus bytes autenticados por el registro de producción. Esto confirma por qué no se puede publicar directamente todo el checkout ni partir de `main`.

## Flujo recuperado y trazabilidad

Los logs de construcción de este despliegue registran descarga de **1651 archivos fuente**, instalación omitida y resultado `verifiedReleaseFiles:1648`, `activeProjects:131`, `priorRetirementPreserved:true`, `privateContactBaselinesIncluded:false`.

El árbol fuente real identifica **`prepare-orientation-production.mjs`**, SHA-1 `003dad8371b1fa7b78c310b1c7e26536b90cc774`. Su contenido coincide exactamente con la copia conservada en `docs/centro-orientacion-20261031/prepare-output.mjs`; SHA-256 `b8c4f84614ca6ed942973811ae2a6f264d13053929f7a49bd06bb7a4fbfcaff0`. Se recuperó con su nombre real en el área privada de trabajo. El puntero del checkout a `prepare-output.mjs` no representa por sí solo el flujo publicado y no se modificó `vercel.json` para corregirlo por aproximación.

Se leyó el constructor íntegro antes de ejecutarlo. Solo importa `node:fs`, `node:path`, `node:crypto` y `node:assert/strict`: comprueba el conjunto exacto de archivos y sus SHA-256, rechaza symlinks, copia `release/` a `.vercel/output/`, comprueba la sincronización de catálogos y conserva las salvaguardas 410 y la redirección del Centro. No instala, despliega, invoca proveedores ni envía contactos.

El registro actual `orientation-output-hashes.json` se recuperó con **coincidencia exacta de su UID SHA-1 en Vercel**, `724094619180f7e3afac95bb96f4dffae1e2d495`: 218.817 bytes, 1648 rutas, SHA-256 `9dd43786ed065db694712cdaed938362035aaef2c5a8f368d11a8c0b571a94a8`. Se emplearon manifiestos históricos como diccionarios de bytes CAS y la transformación de contacto documentada, aceptando el resultado únicamente después de esa coincidencia exacta. No se eligió un manifiesto antiguo como base predeterminada.

**1647/1648 archivos runtime ya están materializados y validados** contra ese registro: los 1590 estáticos y los 57 archivos de funciones. Las fichas solo se comprobaron como rutas, bytes y hashes para preservarlas. No se evaluó ni optimizó su contenido. Los handlers de reservas se recuperaron con sus hashes exactos y sus políticas originales; no se sustituyeron por las versiones diferentes del checkout.

Las fuentes recuperadas y la procedencia detallada permanecen fuera de Git:

`/workspace/work/publish-nine-copy-20261108/recovery.local/src/`

El directorio padre conserva `materialization.json`, el procedimiento reproducible de recuperación y la evidencia del handler. Son material de trabajo privado, **no un paquete de publicación**. No se incorporaron bundles de funciones ni exportaciones completas al repositorio.

## Único recurso indispensable pendiente

| Recurso del despliegue base | Valor que debe verificarse |
|---|---|
| Archivo | `release/config.json` |
| File ID / SHA-1 | `0e51cb57914c40cd4fa14f7bdff3894fd375dbc1` |
| SHA-256 | `0440b96a1986452092e2249bc9c6f86b86788c979ff4296f4618b1c125dbe985` |
| Destino local | `/workspace/work/publish-nine-copy-20261108/recovery.local/src/release/config.json` |

Se buscó en los checkouts disponibles, historial Git y 629 JSON, incluyendo manifiestos históricos, `baseline`, `base-deployment-manifest`, valores anidados y base64. No existe una copia completa con ese hash. La herramienta autorizada `get_deployment_file_contents` de Vercel devuelve su base64 truncado a 2000 caracteres; `list_deployment_files` también trunca parte del árbol. No es un fallo de credenciales. No se repitieron consultas de métricas ni se pidieron contraseñas.

El `vercel.json` histórico contiene redirecciones y cabeceras compatibles con el prefijo visible, pero no una transformación documentada que recupere íntegramente el archivo congelado. No se inventó su parte restante. Este archivo es indispensable para conservar las rutas y salvaguardas de la publicación.

Hace falta **el archivo original completo**, desde el artefacto conservado o una exportación autorizada de las fuentes de ese despliegue que no trunque el contenido. No se requiere ampliar permisos de escritura, publicar ni cambiar configuraciones externas. Debe aceptarse únicamente con los hashes indicados.

## Preparación y comprobaciones nuevas

Se añadió [scripts/prepare-nine-copy-local.py](../../../../scripts/prepare-nine-copy-local.py), un orquestador local que exige el registro y constructor exactos, valida los 1648 archivos antes de escribir, usa el constructor original sin modificar y prepara una base y un candidato aislados. Solo superpone los cuatro HTML aprobados; no ejecuta generadores ni sustituye el sitio por HTML descargado. `scripts/build-mortgage-guide.py` conserva G01 sin nuevos cambios.

Cuando los insumos estén completos, compara los dos `.vercel/output` y exige rutas idénticas y únicamente cuatro HTML diferentes. Funciones, recursos, datos, fichas y configuración de salida deben permanecer iguales entre base reconstruida y candidato. La configuración base se reconstruye de manera determinista con **fuentes y constructor certificados del despliegue**, no se presenta como una descarga del artefacto compilado. El orquestador verifica también los hashes exactos del contenido aprobado, excluye rutas internas, crea un tar.gz determinista y vuelve a leer sus bytes para comprobarlo. No contiene comandos de publicación.

La prueba existente de navegador ahora admite árboles estáticos de base/candidato y un directorio nuevo de evidencia. Cada servidor sirve **sus propios recursos empaquetados**. Conserva las interacciones, fixtures, fingerprints y la interceptación de APIs; bloquea destinos remotos y no envía contactos. Se preparó para usarla después del build completo, sin reescribir la evidencia histórica.

Comprobaciones ejecutadas en esta tarea:

- Preflight real con los archivos recuperados: salida **2**, identifica exclusivamente `config.json` faltante, sin extras ni diferencias de hash. No crea directorio de build ni artefacto. [preflight-result.json](preflight-result.json).
- Constructor original ejecutado una vez sobre esas fuentes incompletas, con entorno sin credenciales: salida **1**, falla en la igualdad del conjunto de rutas **antes de copiar la salida**. No crea `.vercel/output`. [builder-negative-result.json](builder-negative-result.json). Es una prueba negativa, no una construcción aprobada.
- Las comprobaciones de las herramientas locales y del aislamiento se registran en [preparation-tests.txt](preparation-tests.txt).

**No se ejecutaron nuevas pruebas de navegador, visualización móvil/escritorio ni cálculos sobre un paquete completo**, porque todavía no existe. Los resultados anteriores siguen siendo históricos de fuentes; no se presentan como evidencia del paquete. Tampoco se certifica entrega de contactos, disponibilidad de UF ni ningún servicio externo mediante mocks.

## Diferencias y límites conservados

Esta tarea solo añade preparación, pruebas y documentación interna. Los cuatro HTML, el generador G01, configuración del sitio, formularios, consentimiento, contacto, WhatsApp, agenda, precios, cálculos, metadatos, robots, sitemap, canonical, datos estructurados y todas las fichas permanecen sin cambios respecto de `ad84faac`.

Se comprobó que los despliegues automáticos de `main` y `codex/seo-medicion-20261108` siguen desactivados en `vercel.json`, el proyecto mantiene `live:false` y el workflow de GitHub no publica esta rama. No se modificaron esas protecciones. La documentación y herramientas se guardan en la misma rama sin crear PR, fusionar ni desplegar.

## Continuación y punto de parada

El [procedimiento de continuación, publicación y reversión](runbook.md) está preparado. Primero debe recuperarse el único archivo faltante y completar construcción, comparación y QA del paquete. Solo entonces existirá una huella SHA-256 sobre la cual el propietario pueda autorizar una publicación concreta.

**Artefacto: no generado. SHA-256 de artefacto: no disponible. Publicación y reversión: no ejecutadas.** No se activaron AI Lab, APIs de generación ni infraestructura pagada.
