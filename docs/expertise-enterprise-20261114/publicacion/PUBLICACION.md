# Publicación de Expertise empresarial

**PUBLICADO Y VERIFICADO.**

- Publicación: **14/11/2026 23:03:31.268 America/Santiago** (15/11/2026 02:03:31.268 UTC), timestamp updatedAt del alias.
- Producción al iniciar: `dpl_MnEt1RLpezr7atjVvYrehaGcE69D`, SHA `941051c69d23c1069b68200b019fb020dbf2c722`.
- Producción inmediatamente anterior: **`dpl_4wFhnHbb3zsQGjzM7T8nop6g1uYY`**, SHA `2b9a49338ce090e8d4d3cac71107eb4b4efe2b80`.
- Deployment publicado: **`dpl_A6HxKsPgvbfDTaHqUHqSgaBbegPM`**, READY y confirmado en `sollahms.cl`.
- Commit publicado: **`72ceaa022fa3c9bd8db90c07a2aa6656ec9c1025`**.
- Rama: `codex/expertise-release-20261115`.
- Código aprobado conservado: `b95cc86cfa81ef52d4b8971cbd05b9e41cf2db3b`; preview aprobado intacto.

## Cambio concurrente preservado

Durante el preflight se publicó legítimamente la primera etapa tributaria. Su manifiesto contiene los 1.653 archivos originales idénticos y cuatro adiciones. Su hash serializado SHA-1 `5808d47019ef12fba96fd7b16e654d3ec9ac8fe5` coincide con el manifiesto del deployment en Vercel. Se creó un commit nuevo sobre ese SHA productivo, sin merge ni force push, aplicando los 14 archivos aprobados exactamente.

Se descartó para asignación de dominio el paquete anterior `dpl_DxQiAs2wUwquUkNL3hZoK4KQ2nSg`. Nunca sirvió sollahms.cl. El paquete definitivo incorpora sin cambios beneficios-tributarios-inmobiliarios.html, beneficios-tributarios.css y sus dos módulos JS. No se les añadió navegación ni se amplió el alcance.

## Artefacto y hashes

Base vigente: **1.657 archivos**. Publicado: **1.659**. **1.645 archivos existentes idénticos**, 12 HTML modificados y dos recursos nuevos. El build verificó todos los hashes SHA-1, inventario exacto, ausencia de eliminaciones y lista permitida. Los tamaños se verificaron cuando existen en el manifiesto; una entrada histórica sin tamaño mantiene validación obligatoria por hash.

Documentos, capturas y scripts de evidencia quedan fuera de .vercel/output. No se modificó configuración runtime, variables de entorno ni auto-deploy. Se construyó target production antes de asignar manualmente sollahms.cl; no se promovió directamente Preview.

| HTML modificado | Enlace del pie renombrado | SHA-1 publicado |
|---|---|---|
| contacto.html | Sí | 0982909d86bbd1c1535043161c44818113914600 |
| agenda-asesoria.html | Sí | c4aa251758099ded68d9ae430859f74cf3d821ec |
| cuando-comprar-propiedad.html | Sí | 34e642043ed4be4f7a29369170ca969fde5db7ee |
| index.html | Sí | 8c253589f9190f0d334dd6f71f227f0c0111e0f0 |
| proyectos.html | Sin cambio | 9ec5862cc32c271e0fc64eec5f69b1ffa2dae0b8 |
| comparador-hipotecario.html | Sin cambio | 0f55e8c16a09660dae23983b98eb99de3a19207d |
| entorno-desarrollo-urbano.html | Sin cambio | c5e221cafcdd99015553bb557ee465420b362081 |
| centro-orientacion.html | Sí | ab5493ccf1dba68e518d0e3a928bf482d2ae5c58 |
| privacidad.html | Sin cambio | 69144de69f594f1ca47eb187aa7c39e947c86338 |
| trabaja-con-nosotros.html | Sí | f63d429899ab209f4d8ccef8feaab416be79aecc |
| guia-hipotecaria.html | Sí | dcab35e8f6d8cd310f86ea19b27349ec11f7b121 |
| inversion-inmobiliaria-empresas.html | Sí | 390b912b16be56b82593721539e03badd5f4ce6a |

Recursos nuevos: `assets/css/expertise-navigation.css`, `assets/js/expertise-navigation.js`. Cada ruta y hash completo están en [candidate-manifest.json](candidate-manifest.json); base completa en [production-manifest.json](production-manifest.json).

## QA público

- **23 HTTP 200**, sin noindex en cabeceras, con bytes SHA-1 idénticos al artefacto: 12 HTML, dos recursos Expertise, sitemap, robots, cuatro archivos tributarios y tres recursos empresariales.
- **48 mediciones responsive**: las 12 páginas en 320/390/768/1440. ScrollWidth 305/375/753/1425; sin desbordamiento horizontal.
- **24 recorridos de menú**, 12 páginas a 320/1440: apertura Enter, Tab al destino exacto, contorno solid, Escape cierra con foco visible, apertura clic y cierre exterior.
- En móvil, el manejador existente también cierra el menú principal al pulsar Escape y devuelve el foco a su botón. En escritorio y Entorno, el foco vuelve a Opciones de Expertise. No queda foco oculto.
- Cambiar de escritorio a móvil y abrir el desplegable mantiene un solo details abierto. El popup móvil se superpone temporalmente a opciones originales y se puede cerrar para usarlas; no elimina enlaces.
- Enter sobre la opción empresarial móvil llega a `https://sollahms.cl/inversion-inmobiliaria-empresas.html`.
- Ocho pies renombrados: URLs originales y bytes del pie conservados salvo Servicios→Expertise; Secciones/Legal, orden, correo y WhatsApp intactos. Los otros cuatro pies no cambian.
- Calculadora: 5.000 UF/80% → aporte 1.000 UF y deuda 4.000 UF; 81% produce alerta y resultados vacíos. Restaurado 70% después del ensayo.
- Página empresarial: cero form, fieldset disabled, un WhatsApp a 56948502440. No se enviaron formularios comerciales.
- Registro de consola revisado al terminar: sin errores observados.

## SEO/GEO y protecciones

Los hashes públicos coinciden con el código previamente comprobado: main, title, meta descriptions, canonicals, Open Graph, JSON-LD y contenido editorial idénticos a la base. Sitemap idéntico, XML válido con **143 URL únicas**. Robots idéntico. Form scripts, API, atribución, agenda funcional, fichas, calculadora y recursos preservados. No se afirma certificación WCAG completa ni prueba de lector de pantalla o dispositivo táctil físico.

corporate-education-v2 conserva T0 09/11/2026 20:11:23; corporate-enterprise-v1 conserva T0 14/11/2026 21:03:45.065. Esta navegación tiene evento independiente a las 23:03:31.268. Sin atribución de posicionamiento, sin indexación solicitada ni reenvíos de sitemap. No se intervino Google/Bing, CRM360 ni AI Lab.

PR #18 comprobado **open, draft, merged=false**; no modificado ni fusionado.

## Incidencias y reversión

La producción cambió durante la preparación; se detectó antes de asignar el dominio y se preservó completa. No hubo pérdida de contenido ni regresión crítica. No se ejecutó reversión; el deployment previo tributario se conserva como referencia segura.

Algunas llamadas de QA usaron localizadores de encabezado demasiado estrictos o asumieron que Escape dejaba abierto el menú móvil. Se corrigieron únicamente las comprobaciones y se completaron los 12 recorridos con resultados guardados. No hubo correcciones de código posteriores a la aprobación.

## Evidencia

- [HTTP y hashes](http-qa.json), [navegación y responsive](navigation-responsive-qa.json), [calculadora](calculator-qa.json), [build](build-events.json), [estado PR18](pr18.json).
- [Escritorio público](expertiseLiveDesktop.png), [móvil público](expertiseLiveMobile.png), [pie público](expertiseLiveFooter.png).
- [Auditoría previa](https://github.com/lasopho/sollahms-web/blob/e51316d5620c05937bcb762f7f026173548d5ae4/docs/expertise-enterprise-20261114/REVISION.md) para inventario y capturas anteriores.

Cierre documental: 2026-11-14T23:14:38.010151-03:00 America/Santiago.
