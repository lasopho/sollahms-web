# Prepublicación controlada — PR #18

**Dictamen: APTO PARA SOLICITAR AUTORIZACIÓN DE PUBLICACIÓN**, exclusivamente como página educativa, con formulario desactivado. No se ha publicado ni autorizado la publicación.

## Identificación exacta

| Elemento | Valor |
|---|---|
| Repositorio / PR | lasopho/sollahms-web / #18, borrador abierto, sin fusionar |
| Rama | codex/inversion-empresas-20261114 |
| Producción vigente comprobada antes y después | dpl_AZw6TnXFbk8P3DdGPqvo8YGrzrB9 |
| Commit productivo | 9afbd74cd1793533aed8f96de34d273f1ea19cd8 |
| Candidato de producción, READY | dpl_CDJGxa1Y2irRKJ9TJWR2emSJEvjy |
| Commit del candidato | 0e750eb3afe7424726ea770a3963e324bd1d8339 |
| Aliases del candidato | Ninguno |
| Vista previa auditada conservada | dpl_5KJRt5igHedhn2JvEnPtgQyG2GQU |
| Commit de auditoría anterior | 87022830fa743e7b68316c245b3a2156b97c80a7 |

[Revisar candidato privado](https://project-wrapp-7qm8d2qcp-lsandoval2-8260s-projects.vercel.app/inversion-inmobiliaria-empresas.html)

La referencia histórica sigue siendo la producción vigente: no se detectó un deployment posterior en sollahms.cl. Se preservó el artefacto productivo completo, no una reconstrucción desde una copia antigua del repositorio. La configuración existente de autoasignación de dominios está desactivada y no se cambió. El candidato usa entorno production, Node 24.x y protección Vercel para dominios no personalizados; no se le asignó dominio público. La configuración runtime y las siete funciones existentes conservan sus hashes.

## Diferencia funcional frente a producción

Los **1.649 archivos existentes son idénticos**. El candidato tiene 1.653 archivos runtime: solo añade:

1. `inversion-inmobiliaria-empresas.html`
2. `assets/css/inversion-empresas.css`
3. `assets/js/inversion-empresas.mjs`
4. `assets/js/inversion-empresas-engine.mjs`

No hay archivos runtime existentes modificados ni eliminados. El ensamblador verificó en Vercel el inventario completo y el SHA-1 de cada archivo; también su tamaño cuando figura en el manifiesto histórico. Los manifiestos adjuntos permiten reproducir la comparación. La lista remota de archivos del conector estaba truncada: no se usó como prueba de inventario completo; la comprobación completa se ejecutó dentro del build y consta en los logs.

Frente al candidato auditado, solo se ajustaron dos frases del aviso/botón del formulario para no hablar de una «vista previa» en la futura página pública, y se retiró la etiqueta meta robots exclusivamente del HTML incluido en el artefacto publicable. El HTML fuente conserva noindex para futuras vistas previas. CSS y ambos módulos JavaScript son idénticos por SHA-256 a los auditados.

## QA ejecutado y evidencia reutilizada

| Comprobación | Resultado |
|---|---|
| Nueva página y ocho recursos CSS/JS, robots y sitemap | 11 respuestas HTTP 200; bytes comparados por hash con el manifiesto |
| Calculadora 5.000 UF / 80% | Aporte 1.000 UF, deuda 4.000 UF |
| Calculadora 80,01% | Rechazo efectivo, salidas vacías «—», aria-invalid y mensaje de error |
| Chrome 320 / 390 / 1440 px | Sin desbordamiento horizontal; scrollWidth 305 / 375 / 1425, respectivamente |
| Consola Chrome durante el recorrido | Cero errores y advertencias registrados |
| Fragmentos internos | Todos tienen destino en el DOM |
| Enlaces y recursos locales | Todos resuelven a archivos existentes en el artefacto |
| WhatsApp | Un enlace, +56 9 4850 2440, base https://wa.me/56948502440 |
| Formulario | Cero elementos form; todos los campos y botón empresariales efectivamente desactivados |
| Aviso de indisponibilidad | Visible y comprobado a 390 px; no promete recepción de solicitudes |

Se reutilizaron las **28 pruebas Node**, los **13 casos Chrome**, las pruebas de teclado y la auditoría financiera/tributaria de `../AUDITORIA-FINAL.json`: el código de la calculadora, sus estilos y el contenido financiero no cambiaron. No se repitieron investigaciones certificadas. Las dos pruebas de calculadora de esta fase son comprobaciones de integración del artefacto servido, no una nueva ejecución de las 28 pruebas.

Capturas: `candidato-320.jpg`, `candidato-390.jpg`, `candidato-1440.jpg`. Evidencia técnica: `PREPUBLICACION.json`, manifiestos y log completo del build guardado dentro del JSON.

No se enviaron formularios, correos, mensajes de WhatsApp ni solicitudes reales. No se probaron entregas comerciales ni recepción de consentimiento, porque están inactivas. La revisión no constituye certificación WCAG ni prueba con lector de pantalla real. No se ejecutó Lighthouse en esta fase.

## SEO/GEO y noindex

Title, description, H1 único, canonical, Open Graph y JSON-LD WebPage conservados y validados. Canonical y og:url apuntan a `https://sollahms.cl/inversion-inmobiliaria-empresas.html`. Los enlaces locales y la imagen Open Graph existen en el artefacto. Robots conserva su permiso de rastreo.

**El HTML publicable no contiene noindex.** La URL privada del nuevo candidato sí recibe `X-Robots-Tag: noindex` automático de Vercel. Esto es esperado: [la documentación oficial](https://vercel.com/docs/headers/response-headers#x-robots-tag) indica que también se aplica a deployments production solicitados mediante su URL única. No se desactivó esa protección. La ausencia de esa cabecera en la futura URL pública deberá verificarse después de una publicación expresamente autorizada; no se afirma haberla probado antes de asignar el dominio.

La vista previa auditada original mantiene tanto su meta noindex como la cabecera noindex; respondió HTTP 200 y no fue alterada. No hubo solicitudes de indexación, envíos de sitemap ni cambios en Search Console o Bing.

## Preservación de corporate-education-v2

Se verificó identidad de hash en el artefacto para las once páginas: `index.html`, `centro-orientacion.html`, `guia-hipotecaria.html`, `comparador-hipotecario.html`, `cuando-comprar-propiedad.html`, `entorno-desarrollo-urbano.html`, `proyectos.html`, `contacto.html`, `agenda-asesoria.html`, `trabaja-con-nosotros.html` y `privacidad.html`. Los hashes exactos figuran en `PREPUBLICACION.json`.

La misma preservación cubre sus recursos compartidos, metadatos, datos estructurados, pies, navegación y formularios. También conserva sitemap, robots y funciones existentes. No se modificaron CRM 360, Supabase, Resend ni Sollahms AI Lab. El baseline y T0 editorial del 09/11/2026 20:11:23 America/Santiago permanecen intactos. La nueva página tendrá T0 propio cuando se publique, aún sin establecer.

## Sitemap y navegación: propuestas separadas

El candidato conserva **142 URL** en el sitemap y la navegación existente sin cambios. `sitemap-propuesta.patch` añade solo la URL definitiva y resultaría en 143 entradas, conservando las 142 actuales. `NAVEGACION-PROPUESTA.md` propone un enlace contextual desde la introducción de «¿Qué necesitas resolver hoy?» en el Centro de Orientación.

Ambas propuestas están **sin aplicar y excluidas del candidato**. Requieren aprobación explícita, particularmente porque el enlace modifica una página protegida. No se añadieron rutas ficticias ni fechas lastmod anticipadas. La publicación del candidato actual deja pendiente la incorporación a la navegación y al sitemap; no se certifica una estrategia de descubrimiento completa.

## Archivos de preparación y trazabilidad

Además de las dos frases ajustadas en el HTML fuente, esta fase añade bajo `docs/inversion-empresas-20261114/prepublicacion/`: `prepare-production.mjs`, `production-base-manifest.json`, `production-manifest.json`, `sitemap-propuesta.patch`, `NAVEGACION-PROPUESTA.md`, este informe, `PREPUBLICACION.json` y las tres capturas. Estos documentos no se publican en el runtime. El commit que agrega la evidencia será posterior al commit desplegado y no requerirá otro deployment.

El primer intento, `dpl_DPYTQX6viQb3aV9Box3csUjXk66s`, falló porque el ensamblador exigía un tamaño ausente en parte del manifiesto histórico. No recibió aliases. Se corrigió la comprobación opcional del tamaño, manteniendo la comprobación obligatoria de hash, y el candidato final pasó. No hubo cambios funcionales adicionales ni reemplazo productivo.

## Autorización pendiente y límites

No quedan correcciones funcionales detectadas dentro del alcance educativo. Quedan pendientes: autorización de publicación; decisión separada sobre sitemap/navegación; y verificación HTTP en sollahms.cl y registro del T0 propio una vez publicada. El formulario seguirá sin recepción comercial.

Antes de cualquier publicación se debe volver a comprobar el deployment del dominio. Si ya no es `dpl_AZw6TnXFbk8P3DdGPqvo8YGrzrB9`, este candidato no debe sustituirlo sin incorporar y verificar los cambios posteriores.

**Autorización que se solicita:** publicar exclusivamente los cuatro archivos nuevos del candidato `dpl_CDJGxa1Y2irRKJ9TJWR2emSJEvjy`, commit `0e750eb3afe7424726ea770a3963e324bd1d8339`, con formulario desactivado, preservando los 1.649 archivos productivos. Sitemap y navegación quedan fuera de esta autorización. No fusionar PR #18 ni solicitar indexación.
