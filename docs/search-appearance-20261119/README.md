# Candidato de apariencia en Google — 19/11/2026

La portada conserva su título, descripción principal y contenido visible. Se alinean con ellos `og:title`, `twitter:title`, ambas descripciones sociales y la descripción del nodo `WebPage` existente. `Organization`, `WebSite`, `Service`, sus IDs y el logo oficial permanecen semánticamente idénticos.

Se añade `favicon.png`, exportación exacta a 512×512 del SVG aprobado, y su enlace en la portada antes del enlace SVG existente. El SVG se conserva. La documentación vigente de Google sobre favicons enumera PNG entre sus formatos; este ajuste no promete que Google seleccione inmediatamente el icono, título, snippet o sitelinks.

La configuración habilita la alineación exclusivamente para `index.html`. Para reproducir solo esa página:

```sh
python3 -c 'import sys; from pathlib import Path; sys.path.insert(0,"scripts"); from corporate_seo import apply_corporate_seo; p=Path("index.html"); p.write_text(apply_corporate_seo(p.read_text(),p.name))'
```

Para exportar el PNG con una instalación local existente de sharp, sin añadir dependencias del sitio:

```sh
SOLLAHMS_SHARP_MODULE=/ruta/local/existente/a/sharp node scripts/export-favicon-png.mjs
```

El exportador comprueba dos codificaciones byte a byte y compara el PNG decodificado con el raster directo del SVG. [manifest.json](manifest.json) registra los hashes, renderer, preservación del body, grafo y las 12 URL; las otras 184 páginas HTML versionadas permanecen idénticas al origen, incluidas las 11 corporativas restantes. Cinco pruebas existentes relevantes aprobaron. El manifest registra esa preparación local; las evidencias posteriores se conservan por separado. No se realizan solicitudes de indexación de este candidato privado.

## Evidencia y alcance

La muestra Google solicitada para Chile, español y escritorio ya devuelve `sollahms.cl` con el título «Sollahms: Asesoría e inversión inmobiliaria en Chile», posición orgánica 1 en dos de tres lecturas. Es una consulta de navegación distinta de `Sollams`, `Sollahms` y `Solams` a secas. En esas tres muestras no se identificó una fila del dominio propio, pero hay dominios sin resolver: no permite concluir ausencia de Google ni falta de indexación. No se observaron visualmente favicon ni sitelinks. [Observaciones saneadas](google-observations.json). No existe muestra histórica equivalente para atribuir un avance.

La medición anterior de Search Console sigue disponible en [el informe de conexión y rendimiento](../seo-measurement/runs/2026-11-19-gsc-connected/report.md): 10 de las 12 URL incluidas constaban indexadas; Entorno estaba rastreada sin indexar y Google aún no reconocía Beneficios. Sus rastreos son anteriores a la publicación de hoy. Las fechas de rendimiento terminan el 16/11: no miden el efecto de la publicación del 19/11. Esta preparación no cambia esos estados ni mide menciones/citas de IA.

La base productiva se comprobó otra vez: `dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH`, sin publicaciones Production posteriores, con configuración y recuperación intactas. [Estado previo](production-before.json). El artefacto conserva todos los archivos actuales: de 1723 pasa a 1724; solo cambia `static/index.html`, se añade el PNG y los otros 1722 archivos son idénticos. Esto incluye las fichas, catálogo, Centro documental, otras 11 URL corporativas, siete funciones, configuración, sitemap, robots y recursos. [Prueba completa](artifact-proof.json). Las 130 verificaciones estáticas corporativas aprobaron. [Resultado](corporate-static-checks.json).

## Publicación y seguimiento

La aprobación anterior se limitó a `df78d77f31c8da946623e586634998e151ed237e`. Este cambio adicional requiere aprobación final del candidato concreto según el encargo original. La preview será privada, protegida por SSO y noindex; no se promueve directamente.

La instrucción de mantener el estudio como referencia permanente y alinear el trabajo con Google, OpenAI y Bing/Microsoft **no constituye aprobación para publicar el PR #38**. Este registro solo precisa su alcance y sus límites; no cambia el candidato ni su estado privado.

Para publicar, revalidar primero producción y conservar cualquier publicación posterior; crear un nuevo deployment **Production con --prebuilt --skip-domain**, verificar todo el inventario, siete funciones, entorno y HTTP y promover ese mismo ID validado, conservando ajustes/SSO/dominios/integraciones. La ruta de reversión preferente será el deployment productivo inmediatamente anterior, comprobado nuevamente antes de actuar. No ejecutar generadores históricos ni reconstruir desde main.

Después de una publicación aprobada: comprobar ambos alias, bytes exactos de portada/PNG/SVG, canonical, robots y sitemap sin modificaciones; registrar T0 en America/Santiago. Solo entonces solicitar nuevo rastreo de la portada pública por Search Console y comprobar su lastCrawlTime posterior a T0. La integración actual permite inspección, pero no enviar esa solicitud: debe hacerse en la interfaz de Search Console si no se dispone de otra capacidad autorizada. No se ha enviado ninguna.

Repetir una muestra equivalente de Google Chile/es/escritorio, separando consulta de dominio y marca sola; registrar título/descripción y, cuando exista evidencia visual, favicon/sitelinks. La ventana de 28 días es para comparar rendimiento, no un requisito para corregir presentación. Mantener separadas implementación, publicación, rastreo/indexación, apariencia observada y resultados SEO/GEO.

## Fuentes

- [Google: favicon en resultados](https://developers.google.com/search/docs/appearance/favicon-in-search). PNG figura entre los formatos admitidos; la aparición no está garantizada y requiere un nuevo rastreo/procesamiento.
- [Google: enlaces de título](https://developers.google.com/search/docs/appearance/title-link?hl=es). Google considera varias señales, incluido og:title; no permite fijar manualmente el título final.
- [Google: solicitud de nuevo rastreo](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=es). Una solicitud no garantiza ni acelera por repetición la indexación.

## Aporte del PR #38 por plataforma

El [estudio del 25/10](../home-seo-20261025/research-and-decisions.md), su [ampliación del 29/10](../seo-corporate-20261029/README.md), la [estrategia activa v3](../seo-measurement/STRATEGY-v3.md) y el [alcance v3](../seo-measurement/SCOPE-v3.md) son la referencia de esta matriz. La alineación de metadatos reduce contradicciones entre señales ya existentes; el HTML visible, las respuestas educativas y la identidad corporativa permanecen iguales.

| Plataforma | Aporte concreto del candidato | Qué no está demostrado |
|---|---|---|
| Google Search y funciones de IA de Google | Alinea título/descripciones sociales y `WebPage.description` con el título/meta principales correctos. Añade una alternativa PNG del favicon oficial, formato documentado para Google y compatible con navegadores. | PR #38 no está publicado. No hay nuevo rastreo, cambio visual de favicon/título/snippet/sitelinks, mejora de posición ni aparición/cita generativa atribuible al candidato. |
| OpenAI / ChatGPT Search | Conserva HTML accesible, nombre oficial y relaciones de entidad; alinea las señales descriptivas de la portada. El permiso existente de OAI-SearchBot y las preferencias de GPTBot no cambian. | No se demuestra que ChatGPT Search utilice estos tags para seleccionar o citar la página. El PNG no acredita soporte, requisito ni beneficio de OpenAI. No hay mención, enlace, cita o recomendación directa medida por este PR. |
| Bing / Microsoft / Copilot | Conserva contenido, enlaces e identidad; presenta descripciones coherentes sin cambiar rastreo o funcionalidades. | El PNG no acredita un requisito o beneficio de Bing/Copilot. No se obtuvieron para este candidato informes nativos de Bing AI Performance ni pruebas directas comparables de citas o recomendaciones de Copilot. |

La compatibilidad del PNG documentada para Google y navegadores no se extrapola a OpenAI o Bing/Microsoft. La coherencia semántica común tampoco garantiza aparición en ChatGPT, Copilot ni otras respuestas con IA.

| Estado | Evidencia conservada y límite |
|---|---|
| Cambios de código | Dos diferencias runtime del PR #38 verificadas en preview privada: portada y nuevo PNG. |
| Publicación | PR #37 publicado; PR #38 pendiente de aprobación. La preview no equivale a producción. |
| Indexación de Google | Último snapshot GSC: 10 de 12 URL indexadas; rastreos anteriores al 19/11. No acredita procesamiento del PR #38 ni respuesta de otro motor. |
| Informes nativos de IA | Disponibilidad, controles efectivos y datos de la propiedad en informes generativos de Google y Bing AI Performance siguen sin comprobarse con estas evidencias. |
| Citas directas de IA | Sin muestra directa comparable de ChatGPT Search o Copilot atribuible al candidato. Una búsqueda general, metadatos válidos o HTTP 200 no sustituyen esa medición. |

Se reutilizan las fuentes técnicas ya contrastadas por los estudios: [Google: funciones de IA](https://developers.google.com/search/docs/appearance/ai-features), [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization), [OpenAI: bots](https://developers.openai.com/api/docs/bots), [Bing: directrices](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a) y [Microsoft: AI Performance](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/). Sus guías respaldan el enfoque, no prueban presencia de Sollahms. Esta precisión documental no ejecuta nuevas consultas, rastreos o pruebas de IA.

Pendientes reales: decidir expresamente si se publica el mantenimiento opcional del PR #38; comprobar informes y controles nativos con acceso disponible; ejecutar el protocolo directo existente por superficie; y separar los resultados de cualquier publicación de la línea base previa. Todo avance conserva las exclusiones v3 y las preferencias de entrenamiento.

## Candidato concreto para revisar

- [PR #38](https://github.com/lasopho/sollahms-web/pull/38), apilado sobre la rama del PR #37 para aislar esta mejora adicional.
- Fuente de runtime: `942cc6401de9092a4cd37c55bdb0cc57e79ce3e6`. Las evidencias de despliegue se agregan después como documentación, sin cambiar runtime.
- [Preview privada](https://project-wrapp-mdt3f6mav-lsandoval2-8260s-projects.vercel.app), ID `dpl_J9eJCCKtDDuT5SL5PMtd8q6e1BqL`, entorno preview, READY, SSO.
- [Inventario remoto](preview-remote-integrity.json): 1724 de 1724 UID SHA1 coinciden, siete funciones/57 archivos y configuración idénticos al artefacto esperado.
- [HTTP](preview-http-verification.json): 12 páginas corporativas + robots + sitemap exactos; HTML noindex; acceso anónimo redirige al SSO de Vercel.
- [Ficha del candidato](candidate.json). La producción actual no se ha modificado y la aprobación de publicación está pendiente.

[Los dos recursos de icono](preview-assets-http.json) responden HTTP 200 con tipo correcto y bytes exactos. La [comprobación posterior](production-after-preview.json) confirma ambos alias en el deployment previo, SHA autorizado y todos los ajustes productivos/SSO idénticos. Cero cambios productivos, envíos reales o solicitudes de indexación.

## Prioridad tras contrastar el estudio anterior

La [revisión de alineación estratégica](alignment-review.md) documenta el vínculo con los estudios del 25/29 de octubre y las brechas de medición. Este candidato es **mantenimiento opcional de presentación**, con beneficio de posicionamiento no demostrado. El estudio original preservó deliberadamente las etiquetas sociales; su alineación actual es una propuesta nueva. Las prioridades actuales son seguimiento de indexación, controles/informes de IA y medición directa repetible de GEO. Esta revisión no autoriza producción.
