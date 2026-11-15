# Integración SEO/GEO empresarial publicada

**Publicación completada y verificada.**

- Fecha/hora: **2026-11-14T21:39:51.812-03:00 — America/Santiago**. Fuente: actualización del alias Vercel.
- Deployment anterior: `dpl_CDJGxa1Y2irRKJ9TJWR2emSJEvjy`.
- Deployment publicado: **`dpl_5XmA5bbvmsDyttpgwC3sZf8jKtFk`**.
- Commit publicado: `700c96b0868af9ef648be90d7754192041e5f383`.
- Referencia auditada: preview `dpl_28ydhVWXofGntvHXMNXRhxYKXBQv`, commit `dab84b38ebe13a3f02c5d1a1ad298e4bf1d3c949`.

## Alcance exacto

Solo cambian `sitemap.xml` y `centro-orientacion.html`. Se confirmó que producción seguía en la referencia certificada y se construyó un artefacto production usando el mismo inventario congelado. El build validó los hashes completos: **1.651 archivos idénticos y dos cambios autorizados, de un total de 1.653**. Se verificaron las respuestas del candidato contra los hashes aprobados antes de asignar sollahms.cl. No se promovió el deployment preview.

Ruta sitemap: repositorio `sitemap.xml`; paquete `release/static/sitemap.xml`; salida Vercel `.vercel/output/static/sitemap.xml`; URL pública https://sollahms.cl/sitemap.xml.

El sitemap incorpora solo https://sollahms.cl/inversion-inmobiliaria-empresas.html. El Centro incorpora solo el párrafo aprobado en «¿Qué necesitas resolver hoy?», con enlace «Inversión inmobiliaria para empresas». Retirar el párrafo restaura exactamente los bytes anteriores: cabecera, menú, pie, formularios, scripts, estilos, metadatos y datos estructurados no cambian.

## QA público

- **17 respuestas HTTP 200**, todas con SHA-1 idéntico al manifiesto aprobado: once páginas corporativas, sitemap, robots y cuatro archivos empresariales.
- Sitemap XML válido: **143 URL únicas**, empresarial presente una vez, ninguna URL eliminada. Las 142 entradas anteriores y todos sus lastmod permanecen iguales; la entrada nueva no inventa lastmod.
- Enlace visible y navegación mediante Enter comprobada hasta la URL empresarial exacta.
- Centro sin desbordamiento a 320, 390 y 1440 px; sin errores ni advertencias de consola durante el recorrido.
- Página empresarial HTTP 200, canonical correcto, sin noindex en HTML/cabeceras. Archivos idénticos a su publicación anterior. Calculadora a 80%: 1.000 UF de aporte y 4.000 UF de financiamiento sobre 5.000 UF.
- Formulario empresarial desactivado, sin elemento form; WhatsApp único y correcto.
- Las otras diez páginas corporativas y robots son idénticos. Se conservan recursos, funciones, CRM, AI Lab y variables. No se cambiaron ajustes de Vercel ni se activaron despliegues automáticos.

Se reutilizaron las pruebas de límites y regresión ya certificadas para los módulos sin cambios. No se probaron envíos comerciales reales ni se declara certificación WCAG o prueba con lector de pantalla. No se detectaron regresiones en las comprobaciones realizadas.

## Fechas y medición

La intervención de descubrimiento tiene su propio instante: **2026-11-14T21:39:51.812-03:00**. No sustituye el T0 editorial corporate-education-v2 (09/11/2026 20:11:23 America/Santiago) ni el T0 de publicación corporate-enterprise-v1 (14/11/2026 21:03:45.065 America/Santiago). El registro independiente incorpora las fechas reales de sitemap y enlace; las fechas de descubrimiento e indexación de Google/Bing siguen desconocidas.

**No se solicitó indexación, no se reenviaron sitemaps, no se accedió ni modificó Search Console o Bing, y no se fusionó PR #18.** No se atribuye visibilidad o indexación a esta publicación.

## Incidencias y estado final

Sin incidencias críticas; no fue necesaria reversión. La asignación del dominio se confirmó mediante API. Estado final: **sollahms.cl sirve `dpl_5XmA5bbvmsDyttpgwC3sZf8jKtFk`**.

Evidencia: `PUBLICACION.json` contiene hashes anteriores/nuevos, cabeceras de las 17 comprobaciones y log del build; capturas `enlace-publicado-320.jpg` y `enlace-publicado-1440.jpg`.
