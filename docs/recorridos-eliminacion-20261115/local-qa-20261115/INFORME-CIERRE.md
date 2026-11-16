# Sollahms — recorridos eliminados, publicados y verificados

**Intervención completada.** La versión aprobada está publicada en [sollahms.cl](https://sollahms.cl/). Los dos aliases se asignaron el **16/11/2026 a las 01:23:43, America/Santiago**; `www.sollahms.cl` conserva la redirección 308 al dominio principal. La confirmación de API se obtuvo a las 01:23:57 y la verificación pública posterior aprobó 608/608 controles.

Deployment definitivo: `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`. Se promovió exclusivamente el mismo Production aislado probado, sin reconstrucción. El anterior `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN` permanece identificado como referencia de recuperación. [Asignación de dominios y hora del servidor](production/published.json), [verificación pública](production/public/README.md).

| Verificación | Resultado |
| --- | --- |
| Preview remota | 131 fichas × 1440/768/390/320 px = 524 parejas únicas, sin faltantes ni duplicados |
| Renderizado | Cero excepciones JS, recorridos, imágenes rotas, huecos visibles o desbordamientos |
| Mapas | 476 mediciones de 119 iframes; cuatro reprobes cerrados sin incidencias pendientes |
| Encabezados y pies | 524 mediciones y 18 interacciones de menú móvil correctas |
| Interacciones | 131 fichas; 730 clics de navegación, 262 modalidades, 262 validaciones vacías y 262 CTA |
| Galerías y planos | 709 imágenes de galería verificadas; 155 originales de galería y 395 planos abiertos y decodificados |
| Comparación de planos | Siete comparadores con dos imágenes/cierre/restauración; bloqueo correcto en la ficha con una sola lámina |
| Recursos HTTP de Preview | 1.485 rutas aprobadas; 1.506 GET200 cotejados contra el artefacto, sin divergencias |
| Production aislado | 1.660 rutas/SHA1 coincidentes, siete lambdas, 153/153 HTTP seguros y 24/24 casos de navegador |
| Sitio público | 608/608 controles: 528 HTML, 38 recursos, 14 métodos seguros, 12 controles de fuentes internas y 16 retenciones 410 |
| TLS y redirects | HTTP/HTTPS de apex y www aprobados; 1.184 transacciones, 912 validaciones TLS y 576 redirects 308 |
| Envíos de prueba | Cero formularios, leads, reservas, correos u operaciones CRM/Resend; campos vacíos y sin modificar |

La matriz principal y sus suplementos quedaron aprobados antes de preparar Production. El gate independiente del 16/11 a las 00:59:57 confirmó cero fallos y la identidad del artefacto. [Gate](qa/gate/qa-gate.json), [core](qa/core/CORE-QA.md), [suplementos](qa/supplement/README.md), [cotejo HTTP](qa/http/warm-http-summary.json).

Se conservaron **1.660 archivos**, con **66 cambios aprobados y 1.594 idénticos** frente al baseline congelado: 64 HTML y dos CSS, 1.602 archivos estáticos, 57 archivos en siete bundles y config v3. Inventario canónico SHA256:

`f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`

Los bytes existentes se recuperaron por API autenticada de fuentes de la Preview correctiva; no se ejecutaron builders, preparadores, generadores ni la eliminación otra vez. Después del QA se hizo únicamente una transferencia idéntica a `.vercel/output` aislado. [Recuperación](recovery-report.json), [transferencia](production/prepared.json). El árbol remoto de Production no expone tamaños: se verificaron sus 1.660 SHA1 y rutas, vinculados a los tamaños y SHA256 certificados localmente, sin inventar esa medición remota ni redescargar todos los archivos.

La creación oficial con CLI 65.16.0 y Node 24.22.3 usó `--prebuilt --environment=production --skip-domain`, proyecto y scope explícitos. Production alcanzó READY a las 01:09:08 sin aliases; se verificaron API, rutas, recursos y siete funciones con métodos seguros, conservando reservas `request-only`. El smoke de entorno comprobó las seis fichas prioritarias en cuatro anchos con caché separada y **cero respuestas de Preview reutilizadas**. El acceso anónimo a su hostname seguía 302 hacia SSO con TLS válido. [Creación](production/created.json), [API/HTTP](production/verification/README.md), [smoke de 24 casos](production/browser/README.md), [SSO anónimo](production/production-anonymous-sso.json), [gate productivo](production/production-gate.json).

La promoción no reconstruyó ni cambió el ID. La comprobación pública recorrió portada y 131 fichas por los cuatro orígenes HTTP/HTTPS de apex/www; todos los HTML coinciden exactamente con el certificado, sin sufijo de toolbar. También se comprobaron recursos, métodos de las siete funciones en ambos dominios, denegación de fuentes internas y las cuatro variantes de Patio Brasil con 410. No hubo fallos ni necesidad de rollback. [Resultados completos y hashes](production/public/README.md).

Los ajustes de esta reanudación afectaron al harness: esperas de descarga/pintura, FrameLocator, selectores de disclosures anidados, posicionamiento de clics, límites de procesos y el disclosure de Etapa 2 en Ferroparque. Allí se abrió la sección mediante clic real y se verificaron sus dos mapas, conservando las direcciones Av. y Pasaje Bascuñán Santa María. Los primeros intentos y las capturas antes/después permanecen archivados; ningún archivo runtime necesitó corrección adicional. Se cerraron diez pares CLI huérfanos propios y los procesos posteriores tienen watchdog y limpieza de grupo, sin tocar procesos de Contacto o Chrome del usuario.

Se documentaron 116 avisos conocidos del parser sobre `allow`/`allowfullscreen`, además de bloqueos deliberados de toolbar/telemetría durante las pruebas. La precedencia está descrita en [W3C Permissions Policy §6.3.1](https://www.w3.org/TR/permissions-policy/#iframe-allowfullscreen-attribute); los atributos ya existían y se conservaron. No se declara cero advertencias de navegador. El inventario exacto tiene cero videos publicados y conserva siete referencias internas de investigación Sento, también ausentes del HTML anterior; no se incorporaron ni se afirma una reproducción inexistente.

La rama es `codex/eliminar-recorridos-global-20261115`, runtime declarado `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`. El QA quedó versionado en `7ebad405d403f62306039b08193a58b35bef8bfc`; el HEAD documental final se obtiene del historial de este informe. [PR #27](https://github.com/lasopho/sollahms-web/pull/27) permanece **abierto y Draft**, base `codex/agenda-regions-responsive-20261115` (`c2e1965ced736d46917a1bee286456cb937d58fe`), sin merge automático. Se preservaron el HEAD remoto recibido `16480969f0647c0e6df97053d49199b979e17c83` y sus antecedentes.

Se trabajó exclusivamente en el checkout independiente `/private/tmp/sollahms-recorridos-20261115-local`. Los cambios de Documents y el checkout de Contacto no se sobrescribieron. Los PR #26/#28 de Contacto siguen separados; únicamente modifican `contacto.html` y no hay intersección textual. Esta publicación conserva su versión productiva anterior y sus ramas. Se comunicó el nuevo baseline ByUhr a la otra tarea: cualquier futura publicación de Contacto deberá conciliar su overlay aprobado con estos 64 HTML y dos CSS sin recorridos. Su autorización productiva no se amplió.

SSO continúa habilitado `all_except_custom_domains`; no se cambiaron credenciales, variables, proveedores, precios, sitemap, contenido SEO/GEO ni configuración de despliegues automáticos. No se crearon bypasses o enlaces temporales. [Estado final del proyecto](production/project-final.json). La autorización integral de esta intervención quedó ejecutada; no quedan controles de publicación pendientes. [Continuidad final](../../../NEXT-PROMPT.md).
