# Recuperación de Drive — evidencia acotada y sin cambios remotos

Consulta: 09/11/2026 America/Santiago (10/11/2026 UTC). Rango preciso y metadatos en los JSON de evidencia. Repositorio comparado: `b6720089822ba2185b040d0ddebe2fa1abe1560d`, rama `codex/seo-medicion-20261108`.

## Hechos confirmados

- El conector Google Drive permite búsquedas, listados y lectura de archivos privados autorizados. No se ha declarado inexistente ninguna integración por no aparecer en resultados.
- Se listaron las tres carpetas Sollahms encontradas: P2 (`1FrK5AXM0jaTkAh-wnjUzZ_JQS_I1RMRM`), M3 (`1d-VqSR3fnJzJWVMkiKpUYW-75ONEODXa`) y transferencia (`1eas7l_gYgJBCZ82zGVJ-5XRpYNfvG2aw`). Identidad, URL canónica, fechas, MIME y tamaños están en `search-evidence.json`.
- Se recuperó lectura de `ENTREGA-P2.md`, `TABLA-P2.md`, `RECUPERACION-P2.md`, índice de recuperación `2c6ea4d` y manifiesto de transferencia `17f4496b411f`. Los hashes de contenido y URLs estables se registran en `drive-conclusions.json`; no se conservan enlaces firmados.
- La tabla P2, fechada 17/10/2026, declara en SEO-001 que no acredita mejora de indexación/tráfico ni verificación de Search Console. Su revisión de navegación de catálogo es **trabajo histórico fuera del segmento corporativo**; no se recertificó ni se convierte en deuda de fichas.
- La entrega P2 conserva una auditoría técnica/local previa, pruebas y bloqueos de aquella fase. No es una exportación GSC/Bing ni una medición posterior a T0.
- El índice `2c6ea4d` recupera la procedencia de ramas/commits y copias privadas verificadas históricamente. Las afirmaciones de integridad de otras entregas se mantienen como antecedentes, sin recertificar esos ZIP.
- El manifiesto de transferencia declara un artefacto de salida Vercel de 211.687.360 bytes y cinco fragmentos. Se leyó sólo el manifiesto; no se descargaron sus fragmentos ni se reconstruyó el artefacto.

## Recuperación documental adicional

Se descargó exclusivamente el ZIP documental pequeño `Sollahms-RECONSTRUIDO-continuidad-documental-20261018-r2.zip`, Drive ID `1rQzlrZ7AJXuy155zq-RCB9r7RXkNpkuC`, 370.453 bytes. Su manifiesto y documento de privacidad describen un snapshot reconstruido que conserva 41 archivos minimizados y omite diez documentos con metadatos personales/operativos. Se inspeccionó la lista y contenido documental/código estructural en memoria, sin ejecutar código, restaurar bundles, instalar ni acceder a servicios.

La comparación SHA-256 con el árbol T0 encontró dos archivos idénticos al mismo path y un archivo diferente; otros 38 no aparecen en ese árbol ni tienen copia exacta en otra ruta versionada. Esto recupera antecedentes adicionales, no demuestra que estén vigentes. No se copia el código propuesto al sitio. Los tres Markdown P2 independientes tampoco son copias byte a byte de un archivo versionado del árbol T0.

Los documentos recuperados de booking distinguen explícitamente el código original recibido de una propuesta local `v2` no desplegada. El audit original describe creación de eventos en Calendar y pérdida de contexto comercial del proyecto en ese backend (O-06). No permite afirmar conservación de página de entrada, UTM, referrer, source/medium, conversiones cualificadas ni reserva agregada en el sistema **vigente**. El protocolo propuesto contiene estados de operación y correlación, pero no prueba activación ni métricas reales. No se consultó Calendar, CRM ni hojas de leads.

## Búsquedas y límites

Se buscaron: Sollahms, Search Console, GSC, Bing, analytics, AI Lab, SEO, GA4, GTM, Clarity, medición, posicionamiento, keywords, backlinks, sollahms.cl, webmaster, Google Analytics y consola. No se encontró una exportación de rendimiento GSC/Bing/GA4 identificable dentro de estos resultados y las tres carpetas listadas. `Search Console` sólo recuperó TABLA-P2; `SEO` y `medición` recuperaron documentos técnicos P2. Las consultas AI Lab/webmaster devolvieron metadatos de hojas de leads no pertinentes: **no se abrieron**, sus identificadores y títulos se excluyen del registro de auditoría.

Los resultados son del índice/buscador del proveedor y los listados directos, con `topn=100` y `top_k=200`. Se comprobó también una página de metadatos nativa (`item_type=document`) filtrada por nombres de marca/analítica: devolvió un TXT ya conocido y ningún token siguiente; su filtro de MIME no cubre todos los ZIP/Markdown. No hubo errores del conector ni token de continuación en las respuestas; no hay certificado de cobertura total del Drive. No se leyó contenido de todos los respaldos comprimidos. En consecuencia, la existencia de una propiedad GSC/Bing o una analítica usada por la organización permanece **no confirmada por Drive**, y sus métricas permanecen `null`, nunca cero.

## Clasificación para continuidad

| Antecedente | Clasificación | Uso permitido en esta fase |
| --- | --- | --- |
| P2 técnico y su tabla de hallazgos | Ya realizado; histórico | Recuperar procedencia, sin repetir QA ni revisar fichas |
| Índice privado 2c6ea4d y manifiesto de transferencia | Vigente como referencia de recuperación; estado operativo histórico | Conservar rutas, hashes y límites; no usar alias antiguos como producción actual |
| Booking original y propuesta v2 reconstruida | Ya investigado; vigencia actual necesita revisión | Reconocer backend y propuesta anteriores; no afirmar tracking ni despliegue |
| Rendimiento GSC/Bing/GA4 post-T0 | Realmente pendiente en la evidencia de Drive revisada | Acceso legítimo o exportación agregada de propiedades existentes |
| Backlinks y autoridad externa profesional | No verificado en Drive | No sustituir por documentos de QA ni por búsqueda pública |

Recurso mínimo para cerrar la brecha de Drive: exportaciones existentes de GSC/Bing/analítica con fechas y filtros, o lectura autorizada de sus propiedades existentes. Para CRM, esquema y agregados sanitizados; no registros personales. No crear propiedades, activar herramientas ni reenviar sitemaps.

## Archivos de esta recuperación

Para integrar al run: `drive-conclusions.json`, `search-evidence.json`, `extra-search-evidence.json`, `documentary-zip-inventory.json`, `documentary-duplicate-check.json`, `provider-page-evidence.json` y este resumen. Los textos originales y ZIP en `work/` son material de trabajo privado; no es necesario versionarlos. Se registran hashes y extractos mínimos pertinentes en las conclusiones.
