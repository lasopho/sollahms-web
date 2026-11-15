# Publicación controlada PR #18 — completada

Página: https://sollahms.cl/inversion-inmobiliaria-empresas.html

- Publicación / T0 propio: **14/11/2026 21:03:45.065 America/Santiago** (15/11/2026 00:03:45.065 UTC), según updatedAt del alias Vercel.
- Deployment anterior: `dpl_AZw6TnXFbk8P3DdGPqvo8YGrzrB9`.
- Deployment publicado y confirmado al cierre: **`dpl_CDJGxa1Y2irRKJ9TJWR2emSJEvjy`**.
- Commit publicado: `0e750eb3afe7424726ea770a3963e324bd1d8339`.
- PR #18 permanece abierto, en borrador y sin fusionar.

## Alcance y preservación

Producción seguía en la referencia certificada al iniciar. Se reutilizó el deployment READY aprobado, con entorno production, y se asignó únicamente sollahms.cl. No hubo nuevo build ni cambios en variables o configuración de despliegues automáticos. El procedimiento no activó recepción de leads, Resend, Supabase, CRM 360 ni Sollahms AI Lab.

Antes de publicar se compararon los manifiestos completos: **1.649 archivos existentes idénticos, cuatro añadidos y cero modificaciones o eliminaciones**. Se reutilizó además el log del build del deployment exacto, que valida hashes del inventario completo. No se reconstruyó desde una base anterior.

Únicos archivos runtime añadidos:

1. `inversion-inmobiliaria-empresas.html`
2. `assets/css/inversion-empresas.css`
3. `assets/js/inversion-empresas.mjs`
4. `assets/js/inversion-empresas-engine.mjs`

## QA en el dominio real

| Comprobación | Resultado |
|---|---|
| HTTP | 17 respuestas 200, todas idénticas por SHA-1 al artefacto aprobado |
| Nueva página y tres recursos | Bytes exactos del candidato aprobado |
| 11 páginas corporate-education-v2 | Descargadas desde sollahms.cl; hashes idénticos a producción anterior |
| Sitemap y robots | Descargados desde sollahms.cl; sin cambios, sitemap conserva 142 URL |
| Canonical | https://sollahms.cl/inversion-inmobiliaria-empresas.html |
| Noindex | Ausente en HTML y cabeceras HTTP públicas |
| Calculadora 5.000 UF al 80% | 1.000 UF aporte y 4.000 UF deuda |
| Porcentaje 80,01% | Rechazado, resultados limpiados, error visible y aria-invalid |
| Formulario empresarial | Sin elemento form, campos y botón desactivados, aviso visible |
| WhatsApp | Un enlace correcto, +56 9 4850 2440 |
| Chrome | Sin errores ni advertencias de consola durante el recorrido |
| 320, 390 y 1440 px | Sin desbordamiento horizontal; capturas adjuntas |

La preservación de las once páginas incluye portada, Centro de Orientación, Guía Hipotecaria, Comparador, Cuándo Comprar, Entorno y Desarrollo Urbano, Catálogo, Contacto, Agenda, Trabaja con Nosotros y Privacidad. Sus contenidos, pies, navegación y metadatos permanecen idénticos. Los demás archivos y funciones existentes se preservan por el manifiesto completo verificado. No se enviaron formularios ni mensajes reales.

Se reutilizaron las 28 pruebas Node y 13 casos de navegador certificados porque no se cambió código. El QA público añade las comprobaciones de transporte, preservación y renderizado anteriores; no se afirma haber repetido las 28 pruebas. No se declara certificación WCAG ni prueba de lector de pantalla.

## Indexabilidad y límites

La nueva URL es técnicamente indexable: HTTP 200, canonical propio, robots permite acceso y no existe noindex en HTML/cabeceras. **No se solicitó indexación ni se comprobó que Google o Bing ya la hayan indexado.** No se enviaron sitemaps ni se modificaron herramientas de buscadores.

Sitemap y navegación continúan sin incluir esta nueva URL, conforme al alcance autorizado. Las propuestas anteriores siguen pendientes y no fueron aplicadas. El baseline corporate-education-v2 y su T0 editorial permanecen intactos; esta página tiene el T0 independiente indicado arriba.

## Incidencias y estado final

Sin incidencias críticas detectadas durante esta publicación; no fue necesaria reversión. No hay regresiones detectadas en las comprobaciones realizadas. No se ejecutaron transacciones de formularios existentes ni pruebas de entrega comercial.

Estado final comprobado por API de alias: **sollahms.cl sirve dpl_CDJGxa1Y2irRKJ9TJWR2emSJEvjy**.

Evidencia reproducible: `PUBLICACION.json` contiene cabeceras y hashes de las 17 respuestas. Capturas: `publicada-320.jpg`, `publicada-390.jpg`, `publicada-1440.jpg`. Los manifiestos completos y logs certificados permanecen en `../prepublicacion/`.
