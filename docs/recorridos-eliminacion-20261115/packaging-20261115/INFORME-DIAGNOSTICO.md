# Diagnóstico y preparación aislada — PR #27

Cierre: 15/11/2026, 18:41:29 America/Santiago (UTC−03:00).
Estado: **preparación local verificada; Preview original NO APROBADA. Sin nuevo deployment.**
Rama: `codex/eliminar-recorridos-global-20261115`. HEAD inicial: `e558faf1b343f0d9c9da6ca497f43d75918577ef`.
Runtime aprobado: `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`.

## Causa raíz y trazabilidad

El contenido del paquete Build Output API fue entregado como **fuentes ordinarias a la raíz**, sin el contenedor `.vercel/output` ni un paso que lo reconstruyera como Build Output. Vercel hizo un build remoto y trató los directorios `static` y `functions` como material estático. No es un defecto de los HTML de eliminación de recorridos.

Evidencias concordantes:

1. [Logs nuevos de la API](build-events.json): descarga de 1.660 archivos, `Running "vercel build"`, CLI 65.14.0 y finalización en 685 ms. No aparece la ejecución del preparador ni su resumen de preservación.
2. [Árbol actual parcial](source-tree-partial.json): rutas `src/config.json`, `src/static/...` y `src/functions/...`; 465 entradas devueltas por el conector, **no un inventario completo**. `src` es el contenedor de fuentes de la API, no una ruta pública.
3. [Inventario completo histórico autenticado](../qa-preview-20261115T173733/manifiesto-fuentes-verificado.json): las 1.660 rutas recibidas bajo `src/` coinciden con `release/` al quitar ese prefijo. No contiene `.vercel/output/`, `prepare-preview.mjs` ni `vercel.json` como archivos fuente.
4. [QA de Chrome preservado](../qa-preview-chrome-20261115T182244/INFORME-QA.md): 1.660 Static Assets; `/` y `/inn-puerto-chico.html` dan 404, mientras `/static/inn-puerto-chico.html` entrega HTML sin recursos. El dashboard Source autenticado leído durante esta etapa muestra `config.json`, `static` y `functions` en raíz.
5. `prepare-preview.mjs` sí copia cada `release/X` a `.vercel/output/X`, valida 1.660 entradas, 66 cambios y SHA-1. Es un ensamblador local, no un cliente de despliegue. Fue conservado intacto. Su presencia en Git no acredita que lo haya ejecutado el deployment.
6. El `vercel.json` de la rama contiene `buildCommand: node prepare-output.mjs`, sin archivo `prepare-output.mjs` en la raíz de esta rama. No estaba entre las fuentes enviadas. El nuevo procedimiento no despliega la rama como fuentes ni usa ese comando; tampoco lo cambia por afectar otros flujos.

**Límite de trazabilidad:** no se conserva en los documentos inspeccionados el cuerpo JSON original de creación ni el comando literal con todos sus overrides. La API resumida no los devuelve. No se inventa que se usó `@vercel/static`, un `outputDirectory` concreto ni una herramienta específica. Se demuestra el error efectivo de ingestión/estructura con las fuentes, logs y salida observada; el nombre exacto de la llamada original sigue sin acreditarse.

## Estructura comparada

| Elemento | Recibido por el deployment defectuoso | Preparación correcta | Resolución esperada |
| --- | --- | --- | --- |
| Configuración | `src/config.json`, luego asset `/config.json` | `.vercel/output/config.json` | Metadatos y rutas Build Output v3 |
| Portada | `src/static/index.html` | `.vercel/output/static/index.html` | `/` |
| Ficha | `src/static/inn-puerto-chico.html` | `.vercel/output/static/inn-puerto-chico.html` | `/inn-puerto-chico.html` |
| Recursos | `src/static/assets/...` | `.vercel/output/static/assets/...` | `/assets/...` |
| Funciones | `src/functions/api/*.func/...`, como assets | `.vercel/output/functions/api/*.func/...` | `/api/<nombre>` ejecutable |

No se agregan prefijos `/static/` a enlaces, ni se alteran formularios, endpoints, métodos, medios, configuración runtime o datos. Los 1.602 estáticos quedan separados de 57 archivos de funciones y un config. El `config.json` v3 conserva rutas, cabeceras, manejo filesystem/error/miss, redirecciones y `crons: []` byte por byte.

## Fuentes recuperadas y preservación

[Mapa de procedencia](source-map.json): 1.646 rutas se obtienen de archivos con bytes coincidentes en este checkout; las otras 14 rutas se recuperaron del deployment existente y se guardaron como 13 blobs únicos en `recovered/` (contact se repite en dos bundles). No se importó `main` ni una versión histórica distinta. Un JSON conservado en un directorio documental también coincide exactamente con el candidato; su ubicación no sustituye la comprobación de hash.

Ocho blobs cortos se leyeron por API Vercel. Cinco blobs largos se extrajeron del visor Source autenticado por líneas visibles porque el conector truncaba sus respuestas. Se conservó la terminación LF; los hashes y tamaños finales coinciden exactamente. No se usaron las rutas estáticas expuestas para descargar fuentes de funciones. No se publican secretos: las siete configuraciones incorporadas tienen `environment: {}`.

`prepare-isolated.py` usa exclusivamente el mapa y los manifiestos fijados. Verifica todos los inputs antes de escribir, exige un destino inexistente fuera del repositorio, no ejecuta generadores, no hace red y no despliega. Rechaza alteraciones, archivos sobrantes, symlinks y configuración de función ausente.

| Verificación | Resultado |
| --- | --- |
| Hash SHA-1 y tamaño antes/después | 1.660/1.660 iguales al candidato |
| Delta contra producción congelada | Exactamente 66 cambios; 1.594 idénticos |
| Cambios permitidos | 64 HTML y 2 CSS, hashes afterSha1 intactos |
| Funciones | 57 archivos en 7 bundles; todos preservados |
| Configuración | 3.916 bytes; SHA-1 `04e9bcfbdaedafe692af92f3409844151fd82ab3` |
| Inventario canónico preparado SHA-256 | `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0` |
| Manifiesto candidato SHA-256 | `ed39917d1639b797d2715fe585af89717637d324109db77eb4c603e75a1fcdaa` |
| Manifiesto producción SHA-256 | `120fc0c35ae7e3391f5be5b4c22eeae2c3c864722d25dd91d811dda10e213760` |

El inventario canónico ordena por ruta y concatena `ruta<TAB>tamaño<TAB>SHA256<LF>`; no es un hash de un archivo tar. [Detalle por archivo](verification.json).

## Pruebas aisladas realizadas

- **1.603 HTTP GET locales aprobados:** `/` más los 1.602 archivos estáticos, comparando cuerpo con los bytes preparados. Incluye las 131 fichas y sus recursos en rutas raíz. [Resultados finales](local-http-final.json); se conserva también la primera ejecución en `local-http.json`.
- Tres rutas internas no servidas por la raíz estática: `/static/inn-puerto-chico.html`, `/functions/api/contact.func/api/contact.mjs`, `/config.json`.
- Tres pruebas negativas aprobadas: mutación de un byte, archivo extra y retirada de `.vc-config.json` son rechazados. Se restauró la salida y se comprobó idéntica al inventario inicial.
- **Siete imports Node 24.22.1 aprobados** desde cada handler y sus dependencias dentro del bundle. Pruebas sólo de métodos rechazados/estado cerrado, sin formularios ni datos personales, con fetch externo bloqueado y entorno sin credenciales. **Cero llamadas externas intentadas.** [Resultados](functions-check.json).

| Endpoint | Prueba local | Respuesta preservada |
| --- | --- | --- |
| `/api/advisory` | GET | 405 |
| `/api/booking-availability` | GET | 503, política request-only existente |
| `/api/booking-create` | GET | 503, política request-only existente |
| `/api/collaboration` | GET | 405 |
| `/api/contact` | GET | 405 |
| `/api/orientation-contact` | GET | 405 |
| `/api/uf` | PUT | 405; no consulta UF externa |

Las reservas ya estaban cerradas mediante su política existente; esta intervención no las deshabilitó. Se conserva íntegro su código. Las comprobaciones no certifican entrega comercial ni integración con proveedores.

## Documentación oficial consultada

Consulta 15/11/2026. Se usaron las páginas oficiales vigentes, no respuestas de terceros.

- [Build Output API](https://vercel.com/docs/build-output-api): permite preparar manualmente `.vercel/output`; no obliga a regenerar el sitio.
- [Primitives](https://vercel.com/docs/build-output-api/primitives): los archivos de `static` se sirven desde raíz; cada directorio `.func` dentro de `functions` registra una función mediante `.vc-config.json`, con handler y runtime. Los archivos internos del bundle no se sirven como estáticos.
- [Configuration](https://vercel.com/docs/build-output-api/configuration): `config.json` v3 contiene metadatos y reglas de salida.
- [CLI deploy](https://vercel.com/docs/cli/deploy), actualización indicada 14/11/2026: `--prebuilt` consume la salida preparada; `--environment=preview` identifica el destino. No debe usarse un deploy ordinario sobre el contenido de `output`.

## Procedimiento futuro y límites

[Procedimiento exacto y prompt condicionado a autorización](NEXT-PROMPT-CORRECCION.md). Los comandos de despliegue allí escritos **no fueron ejecutados**. La preparación está en `/workspace/scratch/11cb6972c409/preview-corrected/.vercel/output`; el repositorio conserva todas las entradas necesarias para volver a ensamblarla, sin depender de su persistencia local.

1. El servidor HTTP de prueba sólo valida el montaje estático y bytes; no emula toda la semántica de rutas Vercel, SSO, CDN ni runtime Lambda.
2. Las siete funciones cumplen la estructura y cargan localmente; su **registro efectivo en Vercel sólo podrá comprobarse después de un deployment autorizado**. No se presenta como ya registrado.
3. No hay CLI Vercel instalado ni credencial CLI en este ejecutor; no se instalaron ni modificaron. La futura sesión necesitará CLI oficial autenticado. La versión 65.14.0 se propone porque es la observada en el log; su ayuda debe confirmar flags antes de usarla.
4. No se extrajeron variables de entorno. Los valores disponibles en Preview y sus guardas deben verificarse sin divulgar secretos; no se copiarán credenciales de producción.
5. El deployment defectuoso contiene fuentes de funciones como assets detrás de la protección configurada. No se declara exposición pública anónima; no se eliminó ni alteró para respetar el alcance.
6. Faltan QA visual/funcional remoto de 131 fichas y los cuatro anchos, Maps y servicios externos. Ocho pruebas, 393 controles y capturas anteriores siguen históricos.

## Estado final

PR #27 continúa Draft; base y runtime sin cambios. SSO `all_except_custom_domains` habilitado. `sollahms.cl` y `www.sollahms.cl` siguen en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`. Preview defectuosa `dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF` sigue como referencia NO APROBADA. No se creó deployment, no se fusionó/promovió/publicó, no hubo llamadas CRM/Resend, formularios, gastos ni cambios de dominios/protecciones/credenciales. Sólo se añade preparación, pruebas y documentación a la rama actual.

Trazabilidad del commit documental: consultar `git log -1 --format=%H -- docs/recorridos-eliminacion-20261115/packaging-20261115/INFORME-DIAGNOSTICO.md`. El SHA completo y enlace permanente se entregan al cierre de esta sesión.
