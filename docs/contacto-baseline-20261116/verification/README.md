# Verificación acotada de la Preview de Contacto

**PASS — 16/11/2026, 10:01:39 America/Santiago.** Alcance exclusivamente de Preview privada; no se creó ni promovió Production.

Preview: [project-wrapp-cyqjausfq](https://project-wrapp-cyqjausfq-lsandoval2-8260s-projects.vercel.app/). Deployment `dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh`, source commit `a1f2930475e23ebb87bac1f8443877b06883fe60`.

Inventario candidato: `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`.

- API: READY, target nulo de Preview, prebuilt=true, proyecto/equipo y source commit correctos.
- Las 1.660 rutas/SHA1 coinciden con el [manifiesto candidato](../candidate-manifest.json); 1.659 archivos siguen idénticos a ByUhr y el único cambio es `static/contacto.html`. Siete lambdas están registradas y los 57 archivos de funciones/config permanecen preservados.
- 32/32 controles HTTP autenticados aprobados: Contacto, sus once recursos CSS/JS/img locales únicos, portada, seis fichas representativas, siete métodos seguros de funciones, cinco rutas de fuentes internas y una muestra del retiro Patio Brasil 410.
- GET de advisory/contact/collaboration/orientation-contact devuelve 405; GET de booking-availability/create devuelve 503 con `booking_not_certified` y el cuerpo request-only existente. UF se comprueba únicamente con HEAD 405; no hubo lookup UF.
- `/AGENTS.md`, `/NEXT-PROMPT.md`, `/config.json` y el archivo interno del bundle devuelven 404. `/api/contact.mjs` ejecuta la función y devuelve el rechazo JSON 405 por el rewrite ya preservado; no entrega código fuente. Patio Brasil conserva 410 y `X-Robots-Tag: noindex`.
- Al cierre, un GET anónimo sin curlrc, cookies, headers de autenticación ni bypass confirmó 302 con host de redirección `vercel.com` y `ssl_verify_result=0`. Sólo se conservan esos tres datos del control anónimo.
- SSO sigue `all_except_custom_domains`. Los aliases `sollahms.cl` y `www.sollahms.cl` continúan en `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`, comprobados antes y después; no hubo cambios productivos.

## Diferencia HTML clasificada por evidencia

La pasada estricta inicial reconocía únicamente la firma de toolbar histórica `1ec749d6c1840dd80e5f178a7ebea403951fa9e3bb90e80a4b1be83b311e85cb`. Por ello clasificó nueve respuestas HTML como diferentes; su evidencia y script se conservan en `first-pass/`.

Se diagnosticaron únicamente esas nueve respuestas. En todas, **el source completo es un prefijo exacto**; no se retiró ni alteró ningún byte de aplicación. Después del source aparece exclusivamente un script externo de 163 bytes, idéntico en los nueve casos, con SHA256:

`8ce47ba7bb69eeb6aafc383d550c6789d0c272a44631a06b0b38ea4140fbd8cc`

Host `vercel.live`, ruta `/_next-live/feedback/feedback.js`, sin query. No se registran valores de atributos sensibles. Retirar sólo ese bloque exacto al calcular la comparación reproduce cada hash certificado. `sourceBytesPreserved=true` queda explícito tanto en el [diagnóstico](html-injection-diagnostic.json) como en los resultados finales. Los cuerpos HTTP originales no se modificaron, ni se cambió aplicación, configuración de toolbar, variables o SSO.

La atribución a toolbar de plataforma es una **observación medida de entrega de este deployment**, no una firma criptográfica garantizada por Vercel. La documentación sobre [gestión de Vercel Toolbar](https://vercel.com/docs/vercel-toolbar/managing-toolbar), consultada por el agente principal, se enlaza como contexto de la función en Preview, no como prueba del hash.

La clasificación final admite únicamente esta firma nueva exacta. Se recalcularon las comparaciones sobre los cuerpos guardados: 15 respuestas con bytes exactos, nueve con source exacto más el único sufijo observado y ocho rechazos seguros de método (incluye el alias `.mjs`). No se repitieron los 32 casos al finalizar. Sólo se releyeron SSO/aliases y el control anónimo al cierre.

## Límites y preservación

El árbol API no expone tamaños de archivo en sus registros. Se cotejan todas sus rutas/direcciones SHA1 contra los tamaños y hashes del certificado; no se presentan como una lectura independiente de 1.660 tamaños remotos. No se volvieron a recuperar las fuentes por API ni a preparar el artefacto.

No se repitieron las matrices históricas de 524 controles ni 1.485 rutas. La igualdad de las otras 1.659 rutas permite conservar su certificación previa. Esta evidencia no sustituye el QA visual específico de Contacto realizado por el otro agente.

Cero formularios enviados, consultas a CRM/Resend o al proveedor UF, escrituras API, deployments, promociones, cambios de credenciales/protecciones o procesos propios pendientes. La CLI 65.16.0 y sus helpers mantienen los hashes auditados. Los procesos de lectura tienen watchdog de 55 segundos y limpieza de su propio grupo.

## Archivos del paquete

`verification-summary.json` contiene el dictamen. `source-comparison.json` conserva el cotejo de los 1.660 registros; `registered-functions.json`, los siete registros ejecutables. Metadata, SSO y aliases contienen campos permitidos. `http-results.json` guarda status, tamaños, hashes y cabeceras de seguridad seleccionadas; no cuerpos ni headers crudos. Los tres scripts documentan la verificación inicial, el diagnóstico de las nueve respuestas y la reclasificación estricta con relectura final de privacidad/aliases.

Se excluyen la caché de cuerpos, cookies, tokens, queries SSO, atributos sensibles, headers crudos, perfiles de navegador y respuestas API completas sin filtrar. `manifest-sha256.json` fija tamaño/SHA256 de todos los archivos salvo el propio manifiesto. No se realizaron commits al empaquetar.
