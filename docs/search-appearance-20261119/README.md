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

Para publicar, revalidar primero producción y conservar cualquier publicación posterior; crear un nuevo deployment **Production con --prebuilt --skip-domain**, verificar todo el inventario, siete funciones, entorno y HTTP y promover ese mismo ID validado, conservando ajustes/SSO/dominios/integraciones. La ruta de reversión preferente será el deployment productivo inmediatamente anterior, comprobado nuevamente antes de actuar. No ejecutar generadores históricos ni reconstruir desde main.

Después de una publicación aprobada: comprobar ambos alias, bytes exactos de portada/PNG/SVG, canonical, robots y sitemap sin modificaciones; registrar T0 en America/Santiago. Solo entonces solicitar nuevo rastreo de la portada pública por Search Console y comprobar su lastCrawlTime posterior a T0. La integración actual permite inspección, pero no enviar esa solicitud: debe hacerse en la interfaz de Search Console si no se dispone de otra capacidad autorizada. No se ha enviado ninguna.

Repetir una muestra equivalente de Google Chile/es/escritorio, separando consulta de dominio y marca sola; registrar título/descripción y, cuando exista evidencia visual, favicon/sitelinks. La ventana de 28 días es para comparar rendimiento, no un requisito para corregir presentación. Mantener separadas implementación, publicación, rastreo/indexación, apariencia observada y resultados SEO/GEO.

## Fuentes

- [Google: favicon en resultados](https://developers.google.com/search/docs/appearance/favicon-in-search). PNG figura entre los formatos admitidos; la aparición no está garantizada y requiere un nuevo rastreo/procesamiento.
- [Google: enlaces de título](https://developers.google.com/search/docs/appearance/title-link?hl=es). Google considera varias señales, incluido og:title; no permite fijar manualmente el título final.
- [Google: solicitud de nuevo rastreo](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=es). Una solicitud no garantiza ni acelera por repetición la indexación.
