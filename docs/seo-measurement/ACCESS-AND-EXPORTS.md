# Accesos y exportaciones — alcance corporativo vigente

**Política activa:** [scope-v2.json](scope-v2.json). No se solicita inventario comercial ni inspecciones estratégicas de fichas individuales.

## Estado heredado, sin reintentos innecesarios

Fases 2/3 no encontraron un conector utilizable de GSC/Bing ni exportaciones nuevas; las solicitudes a sus interfaces y a plataformas IA fallaron con 403 del proxy. Las consultas de Analytics devolvieron 400. Estos son antecedentes de acceso, no pruebas de tráfico cero o indexación ausente. No se repiten solicitudes fallidas ni auditorías técnicas en esta corrección. La evidencia completa permanece en los runs históricos.

## Recurso mínimo por motor

Desde una cuenta ya autorizada y la propiedad existente que cubra `sollahms.cl`, exportar:

1. Rendimiento **filtrado a las 11 URL exactas incluidas**: fechas, páginas y consultas; países/dispositivos si están disponibles. Conservar vista general del dominio solo como contexto no filtrado, en un archivo y serie distintos.
2. Procedencia completa: propiedad, fuente, periodo, zona del informe, último día completo disponible, filtros realmente aplicados, definición de posición, idioma/locale, fecha/hora de extracción y limitaciones de filas/datos.
3. Evidencia del filtro nativo de páginas y su revisión. Si el motor solo entrega totales globales o tablas parciales, declararlo: no llamar a esas cifras “resultados corporativos exclusivos”. [Procedimiento de segmentación](SEGMENTATION-v2.md).
4. Estado del sitemap existente e inspecciones/cobertura de **páginas incluidas**. No crear otra propiedad, reenviar sitemap, solicitar indexación ni instalar IndexNow como efecto de esta tarea. Las fichas pueden aparecer en informes generales originales, pero no se evalúan estratégicamente.
5. Para 30 contra 30: 60 fechas completas consecutivas del segmento. Para 90 contra 90: 180. Con menos cobertura, importar lo disponible y conservar comparación no disponible sin rellenar ceros.

No hace falta contraseña, otra propiedad, un nuevo servicio o permisos de administrador para la vía de exportaciones. Si se elige acceso interactivo/API después, usar una sesión/identidad autorizada con lectura, gestor seguro de credenciales y acceso de red apropiado al servicio. No deducir acceso a un producto de consumo de IA de disponer de una API de generación.

## Importación y conservación

Reutilizar `scripts/seo_measurement.py` y los formatos históricos de rendimiento/indexación para normalizar el original; después aplicar las guardas de `scripts/seo_scope.py`. Los manifiestos de `templates/` son ejemplos históricos, no evidencia de extracción ni del nuevo filtro. Agregar la prueba de segmentación real para obtener métricas exclusivas.

Conservar originales y sus hashes en `.local/` ignorado o almacenamiento privado autorizado. Publicar solo resúmenes revisados sin consultas sensibles, cookies, tokens o datos de personas. Un hash no certifica la autenticidad de un informe; registrar su obtención autorizada y filtros verificables. No sumar tablas de páginas/consultas como si fueran los totales de propiedad.

## Captación y IA

Para negocio: totales agregados de solicitudes/contactos atribuibles a páginas incluidas, periodo y método de atribución; sin información personal. No se requieren confirmaciones de stock ni datos de unidades.

Para IA: acceso directo legítimo a la plataforma/modalidad, respuesta original y fuentes. Usar [protocolo v2](AI-PROTOCOL-v2.md); no evaluar proyectos individuales ni consumir API para simular ChatGPT Search. Si no hay acceso o evidencia suficiente, las métricas permanecen desconocidas.
