# Sollahms — cierre de eliminación de recorridos virtuales

Fecha: 15 de noviembre de 2026, America/Santiago.
Resultado: implementación y QA local completados; entrega remota mediante PR y Preview bloqueada por revisión automática. No aprobado ni publicado en producción.

1. **Objetivo y alcance ejecutado.** Eliminar recorridos de las 131 fichas activas de `lasopho/sollahms-web`, sin alterar fotografías, planos, videos promocionales, precios, contactos, SEO/GEO ni páginas ajenas. Se inspeccionaron las 131 fichas y se compararon sus bytes con `https://sollahms.cl`. La fuente reciente coincide exactamente en las 131; `main` conserva una versión anterior y no se usó como base del cambio.

2. **Actividades completadas.** Se eliminaron 49 secciones completas, 73 iframes y 74 enlaces. Cambian 64 fichas: 49 con recorridos y otras 15 con permisos/cargas sobrantes o menciones que también debían limpiarse. Se retiraron estilos exclusivos en dos CSS. La generación de navegación y la migración de embeds eliminan recorridos de su salida. Se conservó `#etapa-2` de Núcleo Costanera dentro de Características para no romper enlaces y redirecciones existentes. No se usó ocultación CSS. Los cambios compartidos mínimos fueron expresamente autorizados por el usuario durante esta sesión.

   Los proveedores retirados incluyen Matterport/mpembed, Luft Images, Norte Verde/Viewin360, Panoraven, Polyform3D, Plango, Rito3D, Sento y otros visores oficiales registrados. [Inventario previo con archivos, proveedores y cantidades](inventario.json).

3. **Actividades pendientes.** Obtener autorización adicional explícita para crear el PR en borrador y el deployment privado del paquete completo. Después, verificar READY, protección SSO, manifiestos y entrega HTTP de la Preview. Repetir únicamente las comprobaciones que dependan de ese deployment. Comprobar mapas en un entorno con acceso a Google si se requiere certificar su carga externa. No repetir la implementación ni el QA local sin una razón nueva.

4. **Incidencias y bloqueos.** La revisión automática rechazó dos acciones: crear el deployment staging del sitio completo, incluidas sus funciones y datos actuales, y crear el PR en GitHub. Sus razones literales se conservan en [bloqueos.json](bloqueos.json). No se ejecutaron vías alternativas para eludir esos rechazos. Se detuvo sólo la entrega afectada y se completaron las verificaciones y documentos.

   La primera pasada del navegador detectó certificados del proxy de pruebas y recursos lazy aún no cargados. La pasada definitiva aceptó el certificado del entorno únicamente en el contexto de prueba y cargó todas las imágenes: cero imágenes rotas. Persisten 351 fallos de acceso a `www.google.com/maps` en las 393 vistas, por `ERR_TUNNEL_CONNECTION_FAILED` del entorno. Los iframes de mapas son idénticos al original; no se afirma disponibilidad externa comprobada. No se enviaron formularios ni se activaron servicios comerciales.

5. **Archivos modificados.** Hay 72 archivos funcionales: 64 HTML, dos CSS, tres scripts Python, dos pruebas y `vercel.json`. Este último sólo desactiva deployments automáticos de la nueva rama; no cambia las protecciones existentes. [Inventario completo y justificación por archivo](archivos-intervenidos.json). La documentación y las 27 capturas se añaden en este directorio; no se sobrescribió documentación histórica. El prompt de continuidad está en [NEXT-PROMPT.md](../../NEXT-PROMPT.md).

   La comparación del paquete runtime permite exactamente 66 cambios —64 fichas y dos CSS— y conserva 1.594 de sus 1.660 archivos idénticos, incluidas las 57 entradas de funciones y su configuración. Los scripts de autoría, pruebas y documentos no forman parte del runtime. [Cambios runtime](runtime-changes.json), [manifiesto productivo](production-manifest.json), [manifiesto candidato](candidate-manifest.json) y [constructor Preview](prepare-preview.mjs).

   Las referencias históricas de investigación, plantillas y pruebas se conservan como fuentes; no hay referencias a recorridos en las 131 fichas resultantes. El texto informativo de Privacidad permanece por ser una página corporativa excluida del alcance. El JS compartido de embeds se conserva porque lo necesitan los mapas. [Clasificación de referencias residuales](referencias-residuales.json).

6. **Rama, commits y SHA.**
   - Rama: `codex/eliminar-recorridos-global-20261115`, guardada en GitHub.
   - Base: `codex/agenda-regions-responsive-20261115`, `c2e1965ced736d46917a1bee286456cb937d58fe`.
   - Implementación: `49476ea5f45b6eb9778b9f780d82e2c86720e0c3`.
   - Prevención adicional y evidencias definitivas: `a64cbfb762e7b2df157eedb1f1fdc136baf2031f`.
   - Cierre documental inicial: `26a413367729debc40b88029663b8cbd68f9797f`. Las revisiones documentales posteriores se consultan con `git log -1 --format=%H -- docs/recorridos-eliminacion-20261115/INFORME-CIERRE.md`; la respuesta final identifica el HEAD entregado.

7. **Pruebas y resultados.**
   - Cinco pruebas Python aprobadas: preservación independiente en las 131 fichas, eliminación anidada y anclas, rechazo de medios mezclados, generación y migración sin reintroducir recorridos. [Resultados](pruebas-preservacion.txt).
   - Tres pruebas Node aprobadas: navegación, formato de precios y composición sintética de cotización. [Resultados](pruebas-navegacion.txt).
   - Chromium: 131 fichas × 1440/768/390 px = 393 comprobaciones. HTTP 200 en todas; cero recorridos, textos asociados, errores JavaScript, desbordamientos, secciones vacías e imágenes rotas. [Resumen](qa-summary.json), [detalle](responsive-qa.json).
   - Se compararon independientemente imágenes, videos, formularios, mapas, planos, encabezado, pie, metadatos, JSON-LD y todos los destinos de enlaces sobrevivientes. [Preservación por ficha](preservacion.json), [verificación previa de producción](produccion-fichas-verificadas.json).
   - `project_tour_removal.py --check`, validación de manifiestos, sintaxis y `git diff --check` aprobados. No se certifica una suite histórica completa ni un build remoto no ejecutado.

   Comparación visual de INN Puerto Chico:

   | Ancho | Antes | Después |
   | --- | --- | --- |
   | 1440 | [Captura](antes-inn-puerto-chico-1440.png) | [Captura](inn-puerto-chico-1440.png) |
   | 768 | [Captura](antes-inn-puerto-chico-768.png) | [Captura](inn-puerto-chico-768.png) |
   | 390 | [Captura](antes-inn-puerto-chico-390.png) | [Captura](inn-puerto-chico-390.png) |

   También se guardaron comparaciones de Bcome y Núcleo Costanera y capturas resultantes de Plaza Las Condes, Bordevivo y Distrito Centro. Se inspeccionaron visualmente escritorio, tablet y móvil. Las capturas anteriores no certifican la disponibilidad de los proveedores de recorridos.

8. **PR y deployment.** No se creó PR: su creación fue rechazada automáticamente. Se preparó como destino de revisión la rama base reciente indicada arriba, para no mezclar miles de cambios históricos contra `main`. No se fusionó ninguna rama. No se creó deployment de esta intervención: la solicitud fue rechazada antes de crearlo. Los blobs preparados no equivalen a una publicación.

   Producción antes y después sigue en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`, proyecto `project-wrapp`, `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`. La API no expone un SHA Git para ese deployment CLI; no se le atribuye uno inventado. Su manifiesto fuente tiene SHA-1 `e557204aa1ea36c5216ec5b8271393f037770bf0`. Las fichas sí coinciden con la base Git identificada. Otras diferencias entre la rama y el paquete publicado se preservan mediante los hashes del manifiesto actual. No se cambió ningún dominio ni configuración de proveedores.

9. **URL de Preview.** No disponible: no existe un deployment de esta tarea. No se sustituye por una Preview histórica ni por el sitio productivo. La protección SSO existente del proyecto es `all_except_custom_domains`; se debe conservar al crear la Preview autorizada.

10. **Próxima acción recomendada.** Autorizar explícitamente ambos destinos y el alcance del paquete descritos en `solicitud-aprobacion.json`. La revisión automática exige esa confirmación adicional antes de reintentar. Después se podrá crear el PR en borrador y la Preview privada, validar su entrega y actualizar el cierre. Publicar, promover, fusionar a `main`, cambiar dominios, pagar servicios o modificar credenciales sigue requiriendo autorización separada.


## Addendum de entrega autorizada — 15 de noviembre de 2026

El usuario otorgó autorización explícita para crear el PR en borrador y desplegar el paquete completo exclusivamente como Preview privada en el proyecto Vercel indicado. Las dos operaciones se completaron:

- **PR:** [#27 — Eliminar recorridos virtuales de las fichas de proyectos](https://github.com/lasopho/sollahms-web/pull/27). Estado: abierto, **Draft**, no fusionado. Base: `codex/agenda-regions-responsive-20261115` (`c2e1965ced736d46917a1bee286456cb937d58fe`). Head de runtime: `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`. GitHub reporta 117 archivos en el diff del PR.
- **Vercel:** deployment `dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF`, URL [Preview privada](https://project-wrapp-b1aszxxoe-lsandoval2-8260s-projects.vercel.app/), proyecto `project-wrapp`, ID `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`. Estado **READY**, target `staging`, sin dominios personalizados ni alias de producción. Metadata de commit: rama `codex/eliminar-recorridos-global-20261115`, SHA `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`.
- El registro de build confirma **1.660 archivos de deployment descargados** y deployment completado. La inspección del árbol de deployment confirma **57 bundles de funciones** y `config.json`; la respuesta del árbol fue truncada por el límite del conector, por lo que no se usa como recuento exhaustivo de todos los nodos.
- La configuración del proyecto fue releída después del despliegue: SSO habilitado con `all_except_custom_domains`. La URL de deployment es un hostname `vercel.app`, no un dominio personalizado. La protección de acceso está configurada; no se logró verificar una sesión HTTP autenticada desde esta herramienta, por lo que el acceso visual del usuario sigue pendiente.
- La lectura directa de la URL mediante la herramienta web no fue accesible. No se afirma un QA HTTP/browser de la Preview. Las pruebas locales anteriores se mantienen como evidencia, pero no sustituyen la revisión de la URL desplegada.
- Producción se volvió a consultar y continúa en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`, estado READY, target production. No se modificaron producción, dominios ni configuración de protección. No hubo merge ni promoción.

**Estado:** implementación y QA local completados; PR Draft creado; Preview privada READY con SSO configurado. Pendiente: revisión visual/HTTP autenticada de la Preview y eventual feedback del usuario. La autorización recibida no incluye merge, producción ni promoción.

## QA final de Preview — 15/11/2026, 17:37–17:45 America/Santiago

La auditoría autenticada de fuentes verifica 1.660/1.660 hashes del deployment `dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF` frente al candidato. Las 131 fichas coinciden con la rama y están sin recorridos; ninguna de sus 1.119 rutas locales de recursos falta. Se conservan formularios, WhatsApp, imágenes, planos y mapas en las fuentes. Los 57 archivos de funciones corresponden a **7 bundles**, corrigiendo el recuento del addendum anterior.

**QA visual remoto pendiente:** el proxy excluye el hostname de Preview y Chromium reproduce `ERR_TUNNEL_CONNECTION_FAILED`. No se inspeccionó visualmente ninguna ficha remota ni se comprobaron los 320 px. Las 393 comprobaciones y capturas previas se reutilizan sólo como evidencia histórica. SSO permanece configurado; PR #27 Draft y producción en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`. No hubo cambios runtime, reconstrucción, promoción ni merge.

[Informe completo y pendientes](qa-preview-20261115T173733/INFORME-QA-FINAL.md). Evidencias en commit `1933a086f29086fa45883b18176fdb2fe88fdf30`. El siguiente paso es disponer de acceso de red y autenticación permitidos para esa URL y completar el QA remoto, sin pedir otra vez las autorizaciones históricas ya resueltas.

## Revalidación de acceso — 15/11/2026, 17:50:32 America/Santiago

El hostname de Preview sigue excluido del entorno y un nuevo GET reproduce CONNECT 403. PR #27 continúa Draft, Preview READY y SSO habilitado; ambos aliases de producción siguen en el deployment esperado. No se repitieron auditorías ni QA histórico ni se modificó runtime. Se solicitó al propietario del entorno habilitar acceso HTTPS y autenticación permitidos para esa URL. [Cierre de revalidación y evidencias](qa-preview-20261115T173733/REVALIDACION-175032.md). El QA visual remoto, incluidos 320 px, permanece pendiente.

## QA Chrome — 2026-11-15 18:22:44 America/Santiago

**Preview NO aprobada: fallo de empaquetado confirmado.** Chrome alcanza el hostname; portada y /inn-puerto-chico.html devuelven 404. Resources enumera 1.660 Static Assets, incluyendo funciones; /static/inn-puerto-chico.html muestra HTML sin estilos/imágenes y formulario deshabilitado. La auditoría histórica de hashes no certifica enrutamiento ni funciones registradas.

Una ficha inspeccionada parcialmente para diagnóstico; **0/131 con QA completo**, cero controles responsive nuevos. Las 393 comprobaciones permanecen históricas. PR Draft, Preview READY y SSO habilitado; ambos aliases productivos siguen en dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN. Sin reconstrucción, reemplazo ni cambios runtime. [Informe, capturas y propuesta mínima](qa-preview-chrome-20261115T182244/INFORME-QA.md). La siguiente etapa debe resolver la ingestión correcta de Build Output API antes de reanudar QA. No se atribuye a un defecto de eliminación de recorridos ni al proxy anterior.

## Preparación aislada de empaquetado — 15/11/2026, 18:41:29 America/Santiago

**Preparación local verificada; Preview original NO APROBADA.** El árbol recibió config/static/functions como fuentes raíz, sin consumo Build Output API. Logs, árbol y QA Chrome demuestran el fallo; no está archivado el cuerpo exacto de la solicitud original. El preparador anterior sí escribía `.vercel/output` y no fue modificado.

Se preparó una salida aislada con 1.660/1.660 hashes y tamaños iguales al candidato: 66 cambios autorizados, 1.594 preservados, 1.602 estáticos, 57 archivos en siete bundles y config v3 intacto. Inventario canónico SHA-256 `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`. Pasaron 1.603 GET locales de bytes/rutas, tres pruebas de integridad negativas y siete imports/pruebas de rechazo, con cero intentos externos. No son QA remoto ni registro real en Vercel.

[Diagnóstico, límites y evidencias](packaging-20261115/INFORME-DIAGNOSTICO.md). [Prompt completo para la futura etapa autorizada](packaging-20261115/NEXT-PROMPT-CORRECCION.md). Sin nuevo deployment, reconstrucción de fichas, merge, promoción, cambios runtime/productivos ni envío comercial. PR #27 Draft, SSO conservado y ambos aliases productivos en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`. La autorización para una nueva Preview correctiva sigue pendiente.
