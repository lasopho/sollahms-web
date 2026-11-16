# SOLLAHMS — continuidad después de publicar Contacto

La publicación de Contacto está completada y verificada. Este es el siguiente prompt completo para reanudar con trazabilidad; **no solicita otra publicación ni concede autorización para cambios nuevos**. Si no hay un encargo nuevo del propietario, informar el cierre y mantener el estado.

## Identidad y estado vigente

Repositorio `lasopho/sollahms-web`; rama `codex/contacto-baseline-productivo-20261116`. [PR #29](https://github.com/lasopho/sollahms-web/pull/29) abierto en Draft, sin merge.

Producción: `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`. [Contacto público](https://sollahms.cl/contacto.html). [Hostname inmutable protegido](https://project-wrapp-4l11wr2s0-lsandoval2-8260s-projects.vercel.app/).

Publicado el 16/11/2026 a las **10:54:49.885, America/Santiago**, por asignación de ambos dominios al mismo Production aislado previamente probado. www mantiene 308 hacia apex. La confirmación API se registró a las 10:55:29. La promoción no reconstruyó ni cambió el ID.

Source SHA del deployment: `534bf362b8960e275f5b8b42b5c786027906a4cb`. Checkpoint de QA previo a promoción: `41577c1fae2f8c10e577a8af5c68d277c515f6bc`. Consultar el HEAD remoto real de la rama para el cierre documental final y conservar todos los commits posteriores; no confundir ese SHA documental con el runtime publicado.

Baseline anterior, conservado como recuperación: `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`. Preview certificada anterior: `dpl_CUtKHF72knPKEdNTAdAXxaxNz8dh`; ya no representa una etapa pendiente.

## Fuentes obligatorias

Leer `AGENTS.md`, `NEXT-PROMPT.md` y los documentos de `docs/contacto-baseline-20261116/`: `INFORME-CIERRE.md`, `CONCILIACION.md`, `PRESERVACION.md` y `candidate-manifest.json`. Los dos documentos de conciliación/preservación describen la fase Preview original; sus límites de autorización son históricos.

Leer también `production-release-20261116/`: `authorization.json`, `created.json`, `production-gate.json`, `promotion-confirmed.json`, `post-promotion-project.json`, `publication-closure.json`, `verification/README.md`, `browser/isolated/README.md`, `browser/public/README.md` y `public/README.md`. El propietario concedió expresamente la publicación en el adjunto de esta etapa; esa autorización se ejecutó completamente. Los textos anteriores permanecen bajo `history/`.

## Artefacto que se debe conservar

Inventario SHA256 `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`: 1.660 archivos, 219.244.937 bytes, 147 HTML, 131 fichas, siete bundles/57 archivos y config v3. Un único cambio frente a ByUhr: `static/contacto.html`; 1.659 entradas idénticas. Los 66 cambios de Recorridos siguen presentes.

Contacto: 18.655 bytes, SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1`. Corresponde al pie de PR #26 y al selector de #28, `967d556`, integrado en `e95357f`. Encabezado, contenido principal, formulario, cuatro campos comerciales, validación RUT, consentimiento, antiabuso, idempotencia, CRM 360, Resend, SEO/GEO, correo, WhatsApp y legales permanecen preservados. La cobertura del PR #25 no se incorporó.

El output está en `/private/tmp/sollahms-contacto-baseline-20261116/.vercel/contacto-production-release-20261116/stage/.vercel/output`. Si desaparece, clonar la rama real en una copia independiente y recuperar los mismos bytes por la API autenticada de fuentes de **B9HL**, verificando rutas, tamaños y SHA con el manifiesto completo. Reutilizar archivos locales solo si sus hashes coinciden. No usar main ni regenerar fichas; no desplegar íntegramente un paquete antiguo de 9zz/6bc/ByUhr que revierta Contacto o Recorridos.

## QA terminado y límites

Production aislado aprobó todas sus 1.660 fuentes, siete lambdas, 32 HTTP y cinco anchos antes de asignar dominios. Público aprobó **648/648 HTTP**, con 972 TLS válidos, 598 redirects y cero UI de recorridos en 131 fichas. Contacto público aprobó **5/5** en 1440/1024/768/390/320, con 15 capturas nuevas, teclado por letra/Tab, RUT inválido/válido y consentimiento.

No repetir por rutina las matrices responsive históricas ni los 648 controles ya aprobados. El intento DNS del sandbox quedó registrado sin respuestas HTTP; la pasada efectiva completa aprobó todo. No hubo envíos productivos, leads, correos, reservas, escrituras CRM/Resend ni lookup UF. No afirmar entrega real de proveedores.

SSO permanece `all_except_custom_domains`; se conservan reglas automáticas, credenciales, variables y proveedores. CLI de publicación Node 24.22.3/Vercel 65.16.0; runtime de funciones nodejs24.x. No crear bypasses/sharelinks ni usar `--verify` que pueda generar uno. Los perfiles, navegadores y procesos propios fueron cerrados.

## Reanudación futura

Usar exclusivamente el checkout independiente `/private/tmp/sollahms-contacto-baseline-20261116` o uno nuevo. No tocar Documents ni `/Users/luissandoval/Projects/sollahms-publicacion`, ni cambiarles la rama. Mantener PR #29/#26/#28/#27 abiertos en Draft salvo nueva instrucción del propietario; no modificar #25 ni fusionar ramas históricas por iniciativa propia.

Antes de cualquier nuevo cambio autorizado, consultar GitHub, Vercel y ambos aliases; la producción puede haber avanzado. Preservar los cambios posteriores y conciliar el trabajo nuevo con el baseline real, incluyendo el Contacto publicado y la eliminación de recorridos. Evitar publicaciones simultáneas. La referencia anterior ByUhr es recuperación histórica y no un sustituto del sitio vigente.

No existe trabajo productivo pendiente de esta intervención. No volver a crear ni promover B9HL, no reconstruir una Preview y no solicitar de nuevo permisos que ya fueron concedidos para este cierre. Un trabajo adicional necesita un objetivo y alcance propios.
