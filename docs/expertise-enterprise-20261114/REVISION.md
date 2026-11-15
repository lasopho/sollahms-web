# Expertise empresarial y pie corporativo — prepublicación

**APTO PARA SOLICITAR AUTORIZACIÓN DE PUBLICACIÓN. No publicado.**

Cierre: 2026-11-14T22:56:18.419746-03:00 America/Santiago.

## Referencias verificadas

- Producción inicial y final: `dpl_MnEt1RLpezr7atjVvYrehaGcE69D`.
- Commit productivo: `941051c69d23c1069b68200b019fb020dbf2c722`.
- Rama independiente: `codex/expertise-enterprise-navigation-20261114`.
- Commit de código: `b95cc86cfa81ef52d4b8971cbd05b9e41cf2db3b`.
- Preview READY: `dpl_2SRH5pdhbMrvbM19R4XU1gnifxuS`.
- [Vista previa](https://project-wrapp-62sf6f8jx-lsandoval2-8260s-projects.vercel.app/).
- HTTP 200 empresarial; cabecera `X-Robots-Tag: noindex` en preview.

## Fuente y alcance

La navegación y el pie están repetidos en los HTML corporativos. Expertise era un enlace simple. Se conserva exactamente su ancla original y se añade junto a ella un desplegable nativo details/summary. No depende de hover: abre con clic/Enter, el enlace recibe Tab, Escape cierra y devuelve foco. Un manejador cierra otros desplegables y responde al clic exterior.

El usuario confirmó que Servicios es el texto de un enlace bajo Secciones, no un encabezado de columna. Se renombra exclusivamente ese enlace en ocho pies. Se conservan los encabezados Secciones/Legal, URLs, orden, estilos y contactos.

| Archivo HTML | Controles incorporados | Pie renombrado |
|---|---:|---|
| contacto.html | 2 | Sí |
| agenda-asesoria.html | 2 | Sí |
| cuando-comprar-propiedad.html | 2 | Sí |
| index.html | 2 | Sí |
| proyectos.html | 2 | Sin cambio |
| comparador-hipotecario.html | 2 | Sin cambio |
| entorno-desarrollo-urbano.html | 1 | Sin cambio |
| centro-orientacion.html | 2 | Sí |
| privacidad.html | 2 | Sin cambio |
| trabaja-con-nosotros.html | 2 | Sí |
| guia-hipotecaria.html | 2 | Sí |
| inversion-inmobiliaria-empresas.html | 2 | Sí |

Recursos añadidos: `assets/css/expertise-navigation.css` y `assets/js/expertise-navigation.js`. Sin dependencias. Las fichas de proyectos no se modifican. No se alteran plantillas de fichas ni otras variantes excluidas.

## Preservación

Artefacto base: 1.653 archivos. Candidato: 1.655. Exactamente 12 HTML modificados y dos recursos añadidos; 1.641 archivos existentes idénticos por SHA-1. El build verifica cada hash, el inventario completo, ausencia de eliminaciones y la lista permitida; tamaños comprobados cuando están disponibles en el manifiesto.

En los 12 HTML se comprobó igualdad exacta del bloque main, title, meta, canonical y JSON-LD. Los pies son exactamente iguales salvo el texto autorizado. Los manifiestos contienen cada hash anterior/nuevo. Sitemap (143 URL), robots, recursos de calculadora, formularios, atribución, imágenes y configuración runtime se conservan por hash. No se enviaron formularios.

## QA ejecutado

- 48 medidas DOM: 12 páginas × 320,390,768,1440 px. Sin desbordamiento horizontal y cero enlaces Servicios en footer.
- 24 recorridos de teclado: 12 páginas × 320/1440 px; Enter abre, Tab enfoca destino exacto, contorno solid visible y Escape cierra. Todos aprobados.
- Capturas: antes cabecera/pie; después escritorio, móvil 320/390, tableta 768 y pie empresarial.
- Clic en enlace de navegación desde Contacto a 768 px llega a la URL empresarial exacta.
- Registro de consola consultado tras los recorridos: sin errores registrados.
- El contenido/recursos empresariales se conserva; no se repitió la auditoría financiera ni las pruebas certificadas de calculadora y formularios.
- No se certifica WCAG completa, lectores de pantalla ni dispositivos físicos táctiles: se probó Chrome con viewport emulado y teclado/clic.

## Incidencias y límites

Primer preview `dpl_2vgRXJMKvARTRLLFFbJxEMVFGX4N` falló porque una entrada del manifiesto carecía de tamaño. Se corrigió exclusivamente el guard de empaquetado para validar tamaño cuando exista, manteniendo SHA-1 obligatorio para todos los archivos. Segundo preview READY.

Una tanda extensa de navegador agotó el tiempo de conexión. No se contabilizaron sus resultados no recuperados; se repitió el teclado en grupos pequeños con evidencia completa. Dos localizadores auxiliares de capturas se ajustaron tras detectar estado distinto; no implicaron cambios del sitio.

El desplegable móvil se superpone temporalmente a parte de las opciones, como un popup; los enlaces originales permanecen y vuelven a estar visibles al cerrar. No existe interacción de apertura por hover.

## SEO/GEO y autorización pendiente

Baseline corporate-education-v2 conserva T0 09/11/2026 20:11:23 America/Santiago. corporate-enterprise-v1 conserva T0 14/11/2026 21:03:45.065. Esta preparación es un evento separado, aún sin fecha de publicación. No se solicitó indexación, no se reenviaron sitemaps ni se intervino Search Console/Bing. PR18 sin fusionar ni modificar. CRM360, AI Lab y variables intactos.

Antes de una eventual publicación se debe volver a comprobar el alias productivo y preservar cualquier cambio posterior. Se solicita autorización expresa únicamente para estos 12 HTML y dos recursos nuevos. Los documentos/capturas son evidencia, no forman parte del artefacto desplegado.

## Evidencia

- [Hashes por HTML](changes.json), [manifiesto productivo](production-manifest.json), [manifiesto candidato](candidate-manifest.json).
- [QA estático](static-qa.json), [responsive](responsive-qa.json), [teclado](navigation-qa.json), [consola](console-errors.json), [HTTP](http-qa.json), [build](build-events.json).
- [Antes cabecera](expertiseBeforeHeader.png), [antes pie](expertiseBeforeFooter.png).
- [Después escritorio](expertiseAfterDesktop.png), [móvil320](expertiseAfterMobile.png), [móvil390](expertiseViewport390.png), [tableta768](expertiseViewport768.png), [pie](expertiseAfterFooter.png).
