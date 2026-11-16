# Contacto publicado y verificado sobre el baseline sin recorridos

**Publicación completada el 16/11/2026 a las 10:54:49.885, America/Santiago.** [Contacto](https://sollahms.cl/contacto.html) incorpora el pie corporativo y el selector responsive aprobados. Se promovió exclusivamente el mismo Production aislado que superó el QA, sin reconstruir. La verificación posterior aprobó **648/648 controles HTTP** y los **cinco anchos** de Contacto. No quedan etapas de publicación pendientes.

- Deployment definitivo: `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`.
- [Hostname inmutable protegido](https://project-wrapp-4l11wr2s0-lsandoval2-8260s-projects.vercel.app/).
- Ambos aliases apuntan a B9HL; `www.sollahms.cl` conserva 308 hacia `sollahms.cl`.
- Source SHA declarado por el deployment: `534bf362b8960e275f5b8b42b5c786027906a4cb`.
- Anterior conservado para recuperación: `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`.
- [PR #29](https://github.com/lasopho/sollahms-web/pull/29) permanece abierto en Draft, sin merge.

La asignación de dominios se registró con el timestamp del servidor y se confirmó por API a las 10:55:29 Santiago. [Recibo de promoción](production-release-20261116/promotion-confirmed.json), [gate final de cierre](production-release-20261116/publication-closure.json).

## Autorización, preflight y preservación

El propietario concedió expresamente crear un único Production aislado, verificarlo, promover ese mismo ID, asignar los dominios existentes y comprobar el resultado. Esa autorización posterior se registra en [authorization.json](production-release-20261116/authorization.json), con el hash del adjunto original. Los certificados de la fase Preview se conservaron intactos; sus límites históricos no se utilizaron para solicitar de nuevo un permiso ya concedido.

GitHub confirmó el HEAD remoto `534bf36` y los PR #29/#26/#28/#27 abiertos en Draft. Vercel confirmó ByUhr como último Production y baseline de ambos dominios, sin publicaciones posteriores. Se verificaron SSO, proyecto/equipo, identidad CLI y las reglas automáticas. Las tareas de Contacto y León observadas estaban terminadas; antes de promover se releyeron los aliases y los deployments recientes. No se detectó otra publicación concurrente. [Preflight conectado](production-release-20261116/preflight-connected.json), [preflight nativo](production-release-20261116/preflight-native.json), [relectura previa a promoción](production-release-20261116/promotion-preflight.json).

| Elemento | Resultado |
| --- | --- |
| Artefacto | 1.660 archivos, 219.244.937 bytes |
| Delta frente a ByUhr | Un cambio en `static/contacto.html`; 1.659 entradas idénticas |
| Páginas/fichas | 147 HTML; 131 fichas preservadas |
| Recorridos | Los 66 cambios aprobados, 64 HTML y dos CSS, permanecen intactos |
| Backend/config | Siete bundles, 57 archivos y Build Output API v3 conservados |
| Contacto | 18.655 bytes; SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1` |

Inventario publicado SHA256: `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`. El baseline ByUhr conserva el hash `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`.

Se releyeron las 1.660 rutas, tamaños, SHA1 y SHA256 del output existente y de su copia productiva. No se repitió la preparación histórica: no hubo builders, generadores, reconstrucción de fichas ni nueva eliminación. La cifra histórica de 1.594 idénticos corresponde a Recorridos frente a 9zz; la comparación aplicable a Contacto es 1.659 idénticos frente a ByUhr, con la única excepción aprobada de Contacto. [Preparación y recibos](production-release-20261116/preparation/README.md), [manifiesto candidato](candidate-manifest.json), [preservación de contratos](PRESERVACION.md).

El HTML coincide con `967d556`, aprobado por #26/#28 e integrado en `e95357f`. Header, main, formulario, cuatro campos comerciales, RUT, consentimiento, cinco scripts, metadatos, JSON-LD/canonical, WhatsApp, legales y las integraciones conservan sus bytes. Las tres versiones productivas conciliadas ajenas a Contacto también permanecen. La cobertura territorial de #25 queda separada. El control manual de la rama, añadido en `a1f2930`, permanece igual durante esta publicación.

## Production aislado aprobado antes de publicar

Se transfirió el artefacto a `.vercel/contacto-production-release-20261116/stage/.vercel/output`. La CLI ejecutó una única creación con `--prebuilt --environment=production --skip-domain`, proyecto y equipo explícitos. B9HL alcanzó READY el 16/11 a las 10:37:30 Santiago sin aliases; los dominios públicos continuaron en ByUhr durante el QA. [Creación](production-release-20261116/created.json).

La API verificó las 1.660 rutas/SHA1, siete lambdas, prebuilt, target Production y SHA correcto. Se aprobaron 32/32 controles HTTP seguros: Contacto, CSS/JS/imágenes, portada, fichas representativas, funciones, fuentes internas denegadas y Patio Brasil 410. Los 24 cuerpos con source esperado fueron exactos, sin aplicar la firma de toolbar de Preview. El árbol API no expone tamaños: estos se verificaron localmente y se vincularon a sus direcciones SHA1 remotas; no se afirma una medición independiente de tamaños remotos. [API/HTTP aislado](production-release-20261116/verification/README.md).

El navegador aprobó 1440/1024/768/390/320 px: encabezado, pie de tres/una columnas, selector y flecha nativa a 320, navegación, cuatro campos obligatorios, validación vacía, RUT inválido/válido, consentimiento y WhatsApp. Las 15 capturas se tomaron vacías; se verificaron teclado por letra/Tab/Shift+Tab y restauración de estado. Cero eventos submit, POST, solicitudes comerciales o errores JavaScript de aplicación. Caché propia, sin respuestas de Preview reutilizadas. [QA aislado](production-release-20261116/browser/isolated/README.md), [inspección visual](production-release-20261116/visual-isolated.json).

El [gate productivo](production-release-20261116/production-gate.json) aprobó todos los controles a las 10:52:49. Sus evidencias quedaron subidas en `41577c1fae2f8c10e577a8af5c68d277c515f6bc` antes de promover. La promoción utilizó B9HL directamente y mantuvo su contenido e ID; no se promovió la Preview ni se reconstruyó.

## Verificación pública completa

| Control posterior | Resultado |
| --- | --- |
| HTTP global | 648/648 PASS; cero fallos |
| HTML de portada, Contacto y fichas | 532 controles en HTTP/HTTPS de apex/www; bytes exactos |
| Recursos | 70 controles aprobados |
| Funciones | 14 comprobaciones seguras en ambos dominios |
| Fuentes internas | 16 denegaciones/rechazos sin exposición de código |
| Patio Brasil | 16/16 respuestas 410 |
| Transporte | 1.246 transacciones, 972 TLS válidos y 598 redirects 308 |
| Contacto en navegador público | 5/5 anchos, 15 capturas nuevas y cero errores de aplicación |

Las 524 comprobaciones de fichas de esta pasada son 131 × cuatro orígenes HTTP; no son una repetición de la matriz responsive histórica. Los 632 cuerpos estáticos cotejados fueron exactos, sin toolbar público, y se confirmó cero UI de recorridos. Las funciones mantienen sus rechazos seguros: GET 405 en contacto y afines; reservas 503 `booking_not_certified`, request-only; UF solamente HEAD 405, sin lookup. [Informe HTTP público](production-release-20261116/public/README.md).

El primer intento HTTP no obtuvo respuestas por falta de DNS en el sandbox. Se archivó como `HARNESS_NETWORK_UNAVAILABLE`; la ejecución autorizada con red obtuvo el único PASS completo. No se repitió ningún caso ya aprobado ni se atribuyó ese fallo del entorno a la aplicación. No fue necesario recuperar ByUhr.

El QA público de navegador utilizó HTTPS directo sin autenticación, perfil nuevo y caché separada. Reaprobó los cinco anchos, validaciones RUT, consentimiento y navegación; cero submits o solicitudes comerciales. Sus 15 capturas y la revisión visual están archivadas. [QA público](production-release-20261116/browser/public/README.md), [inspección pública](production-release-20261116/visual-public.json).

## Estado final y continuidad

SSO permanece `all_except_custom_domains`; el hostname aislado respondió 302 hacia SSO con TLS válido antes de promover y la configuración se comprobó igual después. `autoAssignCustomDomains=false`, `previewDeploymentsDisabled=true`, integración Git y las reglas main/rama/Recorridos permanecen preservadas. No se modificaron credenciales, variables, proveedores o protecciones; no se crearon bypasses/sharelinks. [Proyecto después de la promoción](production-release-20261116/post-promotion-project.json).

La creación usó Node 24.22.3 y Vercel CLI 65.16.0. El harness aislado registró Node 24.22.1; el público usó explícitamente 24.22.3. Ambos aprobaron sus pruebas con Chrome 157; esa variación del host de QA queda registrada y no cambia el runtime nodejs24.x de las funciones. No se afirma entrega real a CRM 360/Resend: no se enviaron formularios, leads, correos ni reservas. Los procesos y perfiles propios están cerrados.

La rama sigue siendo `codex/contacto-baseline-productivo-20261116` en el checkout independiente. Documents y el checkout de Projects no se sobrescribieron ni cambiaron de rama. PR #29 sigue abierto en Draft; #26/#28/#27 y #25 permanecen intactos, sin fusiones. La documentación final se identifica con el HEAD remoto de la rama y el historial de este informe.

La autorización productiva de Contacto quedó ejecutada completamente. [Continuidad actual](../../NEXT-PROMPT.md), [siguiente prompt completo](SIGUIENTE-PROMPT-PUBLICACION.md). Las evidencias y textos anteriores permanecen en el historial Git y en [history](production-release-20261116/history/INFORME-PREVIEW-before-production.txt).
