# SOLLAHMS — homologación global certificada y publicada, 25/11/2026

Las **168 páginas públicas** comparten la referencia corporativa oficial. La auditoría actual comprobó que ya estaban conformes: **cero nuevas correcciones de footer y 1.729 archivos de runtime idénticos** a la producción que servía el dominio al comenzar. Las 152 fichas conservan íntegramente sus HTML, incluidos los propios footers; no se diseñó un componente nuevo.

La nueva publicación autorizada quedó asignada el **2026-11-25T17:38:41.676000-03:00** y el QA se cerró el **2026-11-25T17:45:54.954039-03:00**, America/Santiago. La nueva fuente publicada `15c07de8be8bf6255c1b431ab191127269fefdc9` identifica la certificación y el guard documental de esta rama. La implementación del footer sigue siendo `e866ce7ac0d7b6df968ecd011fa78d6aec335828`.

## 1. Referencia oficial y justificación

Componente explícito aprobado templates/corporate-footer.html y su CSS, publicado en PR40; coincide con Inicio actual. La referencia explícita y vigente tiene precedencia. Se capturó Inicio en cinco anchos y se contrastó el HTTP actual.

## 2. Total de páginas inspeccionadas

168 HTML públicos auditados individualmente, incluidas 152 fichas; matriz completa audit-matrix.json, sin limitarse a una muestra.

## 3. Total de páginas homologadas

168 páginas conformes con el footer oficial. Ya eran conformes al iniciar este encargo: cero nuevas correcciones. El total conforme se distingue de los archivos modificados.

## 4. Excepciones justificadas

Cero excepciones al pie corporativo en el inventario actual. Ningún contenido específico, legal o comercial fue eliminado; todos los HTML completos se conservaron.

## 5. Cambios realizados

Ningún cambio de runtime, HTML, CSS, contenidos o diseño. Se auditó y certificó nuevamente el componente existente, se añadió el guard false de esta rama en vercel.json y se generó documentación. Se publicó el paquete íntegro validado con los mismos bytes por autorización expresa.

## 6. Archivos modificados

Runtime: 0 modificados, 0 añadidos y 0 eliminados; 1.729 archivos idénticos a ADQD. Fuente: únicamente el guard de vercel.json, documentación de esta fase y NEXT-PROMPT. Inventarios completos y hashes en candidate-manifest.json, release/source-preservation.json y release/closure-manifest.json.

## 7. Pruebas responsive

1440, 1280, 768, 390 y 320 px: 840 casos en el Production aislado y 840 en público, con 1.680 capturas verificadas. Hay cinco capturas de referencia de Inicio adicionales. Las revisiones visuales manuales por categoría están registradas por separado; no se confunden con los casos automatizados.

## 8. Pruebas funcionales

Once destinos/anclas, logo, correo, teléfono +56 9 4850 2440 y WhatsApp wa.me/56948502440 con consulta aprobada, sin enviar mensajes. Funciones: siete bundles/57 archivos íntegros y registrados. Formularios, comparadores y herramientas conservan todos sus bytes; no hubo envíos ni pruebas reales de proveedores. Motion del contenido principal se muestrea únicamente en Inicio a cinco anchos; pie estático y sin desvanecimiento ancestral en cada caso.

## 9. Preservación SEO/GEO

Todos los HTML completos, títulos, metadescripciones, canonical, datos estructurados, textos, enlaces, formularios, sitemap y robots son idénticos. Alcance corporativo v3 de doce URL, GA4/Clarity, consentimiento y preferencias de entrenamiento intactos. Google, OpenAI/ChatGPT Search y Bing/Microsoft Copilot se mantienen separados: no se acreditan nuevos resultados de búsqueda, IA o negocio.

## 10. SHA del commit publicado

15c07de8be8bf6255c1b431ab191127269fefdc9 identifica la nueva certificación, documentación y guard. La implementación del footer procede de e866ce7ac0d7b6df968ecd011fa78d6aec335828 y no se modificó. Los commits finales de cierre posteriores son documentales y no requieren otro deployment.

## 11. Deployment anterior y nuevo

Anterior: dpl_ADQD9qtMpZMDFzkTmbWN8GbX52be, conservado READY/Production y elegible para rollback. Nuevo: dpl_8Dn1aquS1i4TeemVamcd5Yga6YZz, READY/Production/prebuilt; se promovió el mismo ID comprobado sin reconstruir.

## 12. Fecha y hora de publicación

Asignación del alias canónico: 2026-11-25T17:38:41.676000-03:00, America/Santiago. Cierre de QA: 2026-11-25T17:45:54.954039-03:00; no se confunden ambos momentos.

## 13. Dominio en producción

Los cinco aliases, incluido sollahms.cl, apuntan a dpl_8Dn1aquS1i4TeemVamcd5Yga6YZz. www.sollahms.cl y sollhams.cl conservan 308 hacia sollahms.cl; dominios técnicos mantienen SSO. Fechas de creación, configuración y metadatos de variables preservados.

## 14. Evidencias post-publicación

HTTP público: 174/174 GET, 168 HTML y 168 comparaciones de contenido exterior/principal; TLS válido. Chrome público: 840/840 y capturas SHA256. Comprobación nativa final: 31 controles y 1.729 archivos remotos. Revisiones manuales, matrices, recibos y hashes enlazados en el manifiesto de cierre.

## 15. Incidencias pendientes

Ninguna incidencia pendiente dentro del alcance del footer después de las pruebas. Los mapas externos se aislaron como fixtures y la API/UF como respuestas503: no se certificaron esos proveedores ni un valor UF. No se probaron entregas comerciales ni SDK opcionales; las doce páginas canónicas rechazaron opcionales sin SDK/POST. No se atribuyen efectos de búsqueda o negocio.

## Dominios, método y evidencia

- `sollahms.cl` → `dpl_8Dn1aquS1i4TeemVamcd5Yga6YZz`.
- `www.sollahms.cl` → `dpl_8Dn1aquS1i4TeemVamcd5Yga6YZz`; 308 hacia `sollahms.cl`.
- `sollhams.cl` → `dpl_8Dn1aquS1i4TeemVamcd5Yga6YZz`; 308 hacia `sollahms.cl`.
- `project-wrapp.vercel.app` → `dpl_8Dn1aquS1i4TeemVamcd5Yga6YZz`.
- `project-wrapp-lsandoval2-8260s-projects.vercel.app` → `dpl_8Dn1aquS1i4TeemVamcd5Yga6YZz`.

El paquete completo conserva el pin `fdc28233a83fb11cc1e269d4b3b2963e6711f796973ac714247cea93d80aaf79`. Se creó un único Production prebuilt sin dominios y se promovió el mismo ID validado, sin rebuild. `live=false`, autoasignación false, previews automáticas deshabilitadas y SSO `all_except_custom_domains` siguen intactos. El deployment anterior ADQD queda disponible para recuperación; no se ejecutó rollback.

La matriz responsive usa **1440, 1280, 768, 390 y 320 px**. Se realizaron dos matrices completas de 840 casos; los archivos se compararon también por hashes completos. La referencia actual de Inicio tiene cinco capturas propias. El área inferior móvil aprobada ya existía y se conserva; no se añadió margen nuevo.

- isolated: 34 revisiones manuales sobre 17 páginas; anchos 1440, 320 px.
- public: 34 revisiones manuales sobre 17 páginas; anchos 1440, 320 px.

Las revisiones manuales se basan en inspección real de imágenes por categorías y están separadas de los 1.680 casos automatizados. Los registros de errores esperados 404/410 y fixtures 503 permanecen diferenciados de errores inesperados. Ningún resultado READY por sí solo se utilizó como prueba de éxito.

`audit-matrix.json` registra cada página; `candidate-manifest.json` y `html-preservation.json` registran la identidad íntegra. Los recibos de autorización/creación/promoción, las verificaciones nativas, las tres pruebas HTTP y las dos matrices Chrome se identifican por hash en `release/closure-manifest.json`. `release/publication-closure.json` conserva este cierre estructurado y los quince puntos solicitados.

El estudio SEO/GEO del 25 y 29 de octubre, `STRATEGY-v3.md`, el registro de doce URL y sus exclusiones se preservan. Publicar nuevamente los mismos bytes no prueba rastreo, indexación, posiciones, citas IA ni resultados comerciales. La política estratégica anterior se conserva como antecedente; el estado productivo de esta intervención se documenta aquí.

El [PR #42](https://github.com/lasopho/sollahms-web/pull/42) sigue abierto en Draft, sin merge. El NEXT anterior se conserva byte por byte en `history/NEXT-PROMPT-before-20261125.md`; el NEXT actual y `SIGUIENTE-PROMPT.md` describen el estado nuevo. El agente raíz completa README/checksums y el commit documental final, sin otro deployment ni fusión.
