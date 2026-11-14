# Auditoría final del PR #18

14 de noviembre de 2026, America/Santiago. Este informe sustituye los resultados vigentes de README.md y REVISION-LECTURA.md; esos documentos se conservan como historia.

## Dictamen y alcance

**APTO PARA SOLICITAR AUTORIZACIÓN DE PUBLICACIÓN**, exclusivamente como página educativa con el formulario desactivado. No se certifica una captación empresarial operativa. Publicar una versión con formulario activo requiere resolver su contrato de recepción y verificar el recorrido completo por separado.

No se publicó ni fusionó el PR. No se modificaron las 11 páginas de corporate-education-v2, su T0 del 09/11/2026 20:11:23 America/Santiago, sitemap, robots, CRM 360 ni AI Lab. No se solicitó indexación.

## Identificación verificable

| Elemento | Resultado |
|---|---|
| PR | [#18](https://github.com/lasopho/sollahms-web/pull/18), abierto y en borrador |
| Rama | `codex/inversion-empresas-20261114` |
| Base | `codex/guia-footer-20261114` · `9afbd74cd1793533aed8f96de34d273f1ea19cd8` |
| Commit recibido | `c835b2dedec7f4a2e9e89e5de84aa3b5b6a1edda` |
| Commit con correcciones runtime | `71faee3e39c5a8b205e7cd1adb77e974a5065f4b` |
| Candidato recibido | `dpl_3N3baxBYJLzUh7JMZBhuRe4Z5qPu` |
| Candidato corregido | `dpl_5KJRt5igHedhn2JvEnPtgQyG2GQU` · READY · staging/preview |
| Producción al inicio y al cierre | `dpl_AZw6TnXFbk8P3DdGPqvo8YGrzrB9`, sin cambios |

[Revisar candidato privado](https://project-wrapp-4l16q20uc-lsandoval2-8260s-projects.vercel.app/inversion-inmobiliaria-empresas.html). Puede requerir sesión Vercel. El acceso temporal de QA no se incluye en este informe. El commit posterior de documentación no cambia los cuatro recursos runtime de este candidato.

## Hallazgos corregidos

1. **Precisión de presentación:** 0,01 UF al 50% mostraba 0,01 UF de aporte y 0,01 UF de deuda. Reproducido en Chrome y en cuatro pruebas que fallaban antes de corregir. El formateador admite ahora hasta seis decimales, necesarios cuando precio y porcentaje aceptan dos. Resultado corregido: 0,005 + 0,005 UF. No cambia las fórmulas ni el máximo 80%.
2. **Vigencia DFL2:** la ausencia de exención general para sociedades no debe confundirse con ausencia de regímenes especiales. Se agregó una precisión visible y una referencia en la FAQ sobre el régimen opcional previsto desde enero de 2027, con enlace a la Ley 21.850 y calendario SII. No se promete elegibilidad ni ahorro.

## Revisión financiera y tributaria

| Materia | Comprobación y conclusión |
|---|---|
| Hipotecario empresarial, SpA y sociedades de inversión | Bci distingue financiamiento comercial/patrimonial para personas jurídicas del habitacional. La guía no traslada condiciones personales ni garantiza aprobación. |
| Requisitos, porcentajes y garantías | Documentación publicada por Bci coincide con los ejemplos. No hay antigüedad, tasa, plazo o porcentaje universal en la guía. La hipoteca y eventuales garantías personales no equivalen a protección patrimonial absoluta. |
| Leasing | BancoEstado acredita la modalidad y bienes admitidos; CMF explica el dominio del arrendador y la opción de compra. La guía evita afirmar que toda cuota es deducible universalmente. |
| Arriendos y DFL2 | SII confirma tributación de sociedades. La nueva precisión distingue esa regla del régimen opcional futuro de la Ley 21.850. Sus requisitos deben examinarse según fecha y operación. |
| Depreciación | SII y LIR respaldan la distinción construcción/terreno y los requisitos del activo inmovilizado; no se promete deducir el precio completo. |
| Gastos financieros | Se distingue capital de intereses y otros gastos, sujetos a reglas y respaldo. No se promete deducibilidad automática. |
| IVA | SII confirma IVA del arriendo amoblado; la FAQ menciona instalaciones comerciales/industriales y revisión del contrato. La venta exige análisis particular. |
| Persona natural frente a sociedad | Titularidad, administración, disponibilidad de fondos, garantías y tratamiento de venta se presentan con condiciones; no se promete superioridad tributaria de una sociedad. |

Fuentes oficiales consultadas: las diez referencias de [sources.json](sources.json), más [CMF sobre leasing](https://www.cmfchile.cl/educa/621/w3-article-27148.html) y [SII sobre circulares en consulta](https://www.sii.cl/noticias/2026/051126noti02pcr.htm). La Ley 21.850, artículo 3 y disposición transitoria de vigencia, se verificó en [BCN](https://www.bcn.cl/leychile/navegar?idNorma=1229250). No se trataron borradores de circular como instrucciones definitivas. La guía no fija tasas tributarias ni promete beneficios de IVA; deben revisarse las normas transitorias al fechar una operación. No constituye revisión tributaria individual.

## Calculadora, accesibilidad y experiencia

- 28 pruebas Node aprobadas: las 23 existentes y cinco adicionales de presentación. La suite se repitió porque cambió el controlador; el motor permanece intacto.
- Chrome: 13 combinaciones documentadas en [AUDITORIA-FINAL.json](AUDITORIA-FINAL.json), incluidos 0,01 UF, 100.000.000 UF, 0%, 80%, 80,01%, 100%, vacíos y exceso de decimales. Rechazo efectivo, resultados anteriores borrados y recuperación válida.
- El 80% se identifica explícitamente como límite educativo. Aporte y deuda no incluyen costos, intereses ni impuestos; no se convierten UF a pesos.
- Flujo visible: objetivo → financiamiento → aporte → estructura → riesgos. Se conserva la eliminación del recuadro bancario.
- Detalles nativos abiertos con Enter y Espacio. Tab pasa del precio al porcentaje; tablas enfocables y desplazables con flecha derecha. Sin desbordamiento de página a 320, 390 y 1440 px. El desplazamiento horizontal se limita a las tablas.
- Etiquetas, descripciones, `aria-invalid`, alerta de error y región viva de resultados verificadas en DOM y árbol accesible. No se ejecutó NVDA/VoiceOver: no se certifica la experiencia de un lector de pantalla real.
- Contrastes base revisados: dorado/verde 8,30:1; verde/blanco 14,11:1; texto secundario/blanco 6,74:1; error/blanco 6,74:1. Comprobación parcial, no auditoría exhaustiva de todos los estados o de WCAG.
- Pautas pertinentes: estructura y relaciones, contraste, reflujo, teclado, orden/foco, identificación de errores, etiquetas y mensajes de estado. Organización cognitiva basada en W3C; sin estudios con usuarios ni afirmaciones de eficacia neurocientífica.

## Formulario, datos e infraestructura

La propuesta tiene `fieldset disabled`, consentimiento y enlace de privacidad, pero no contiene un elemento `form` ni destino de envío. No hay validación ni mensajes de recepción operativos que puedan aprobarse. El código de calculadora no usa red, cookies ni almacenamiento; sus dependencias de página tampoco incorporan un transporte de los valores introducidos.

Se ejecutaron tres llamadas **locales y aisladas** a la fábrica del receptor existente con datos sintéticos y transporte que bloquea cualquier envío: sin RUT → 400; campo empresarial fuera del contrato → 400; sin consentimiento → 400. Cero llamadas de red. Esto demuestra la incompatibilidad de activar directamente esta propuesta; no es una prueba de entrega comercial ni de deduplicación en un CRM.

WhatsApp aparece una sola vez: `https://wa.me/56948502440`, con mensaje contextual. No se envió ningún mensaje. No se añadió integración ni se alteraron APIs/formularios existentes. La ausencia de envíos impide crear contactos duplicados desde esta propuesta.

## SEO/GEO y conservación

Title y description específicos; un H1; jerarquía H2/H3/H4 sin saltos; canonical público futuro; Open Graph y WebPage coherentes con los IDs corporativos; JSON-LD parseable y destinos/anclas locales existentes. Contenido educativo propio con referencias; no se realizó una búsqueda exhaustiva de plagio. No se promete indexación ni citación por IA.

El candidato mantiene `noindex,nofollow` y cabecera `X-Robots-Tag: noindex`. **No es indexable en este estado.** Al preparar una publicación autorizada se debe retirar el noindex solo de esta página y comprobar las cabeceras de producción. Incorporar enlaces desde el baseline, sitemap o solicitar indexación queda fuera de esta autorización. La URL requiere su propia línea base cuando se publique.

Comparación Git: 3.945 archivos preexistentes conservados, sin modificaciones ni eliminaciones frente a la base. El paquete preserva los 1.649 archivos runtime de producción y añade cuatro. El build verificó los 1.653 hashes y tamaños disponibles. Los cuatro recursos servidos devuelven HTTP 200 y son idénticos al código revisado. La conservación incluye portada, Centro, Guía, Agenda, Trabaja, pies, navegación, formularios, sitemap y robots. Se conserva la corrección posterior de Guía usada como base. No se repitieron recorridos completos de módulos intactos ni se afirmó que sus servicios externos estén disponibles.

## Evidencia, cambios y límites

Correcciones de esta auditoría: `assets/js/inversion-empresas.mjs`, `inversion-inmobiliaria-empresas.html`, `tests/inversion-empresas-controller.test.mjs` y `docs/inversion-empresas-20261114/sources.json`. Se agregan este informe, su JSON y tres capturas. Ningún CSS ni componente compartido modificado.

Capturas actuales: [320 px](audit-320.jpg), [resultado a 390 px](audit-390.jpg), [escritorio](audit-desktop.jpg). Se reutilizan evidencias históricas de menú/Escape, FAQ, CTA, 768 px y consola porque esas implementaciones permanecen idénticas. La consola no se volvió a registrar en esta ronda. No se ejecutó Lighthouse ni una certificación WCAG.

Pendientes para otra fase: aprobación expresa de publicación educativa con formulario desactivado; preparación de indexabilidad de esta URL; baseline independiente al publicar. Si se requiere captación por formulario, faltan contrato compatible, validaciones cliente/servidor, entrega, errores y pruebas de idempotencia. Ese flujo **requiere implementación y QA antes de ser aprobado**.
