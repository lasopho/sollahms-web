# Próxima importación: ejecutar solo cuando lleguen insumos reales

Reutilizar [ACCESS-AND-EXPORTS.md](../../ACCESS-AND-EXPORTS.md) y los manifiestos de [templates](../../templates/). No volver a intentar accesos fallidos por el simple paso del tiempo. Un archivo nuevo, cambio explícito de autorización/red o una sesión disponible son señales de que corresponde volver a comprobar.

## Paquete mínimo por motor

- **Rendimiento:** originales de Fechas, Páginas y Consultas; Países y Dispositivos cuando estén disponibles. Para comparar 30 contra 30 hacen falta 60 días consecutivos completos; para 90 contra 90, 180. Con menos datos se puede importar lo disponible y reportar cobertura insuficiente, sin ceros sintéticos.
- **Procedencia:** propiedad exacta, fuente, informe, periodo, filtros, país, tipo de búsqueda, fecha/hora de extracción con zona, zona del informe, locale, límites/truncamientos y declaración de cobertura revisada. El último día completo se toma del motor, no de la fecha de este documento. No combinar GSC/Bing ni vistas de Chile/total, zonas o definiciones de posición diferentes.
- **Indexación:** originales de cobertura/estado de sitemap existente e inspecciones de URL. Registrar canonical elegido, último rastreo y motivo cuando se informen. Una lista de ejemplos parcial no acredita el total de 141 URL.
- **Validación:** conservar el original privado sin editar, SHA-256 y, si se convierte ZIP/XLSX a CSV, hash del derivado y transformación. Registrar quién obtiene el export en un registro privado autorizado, sin datos personales en este repositorio público. Un manifiesto con `origin=real_export` no prueba autenticidad por sí solo.

Guardar el paquete en `docs/seo-measurement/.local/FECHA-LOTE/` o referenciar almacenamiento privado ya autorizado. No subir originales con consultas sensibles ni información de leads a GitHub público. Los manifiestos actuales son plantillas con fechas ilustrativas y no deben importarse como datos reales.

## Comandos existentes

Desde la raíz, sustituir los marcadores por rutas/fechas verificadas. **No se ejecutaron en fase 3 porque faltan los archivos.**

```bash
python scripts/seo_measurement.py import-performance \
  --csv docs/seo-measurement/.local/FECHA-LOTE/Fechas.csv \
  --manifest docs/seo-measurement/.local/FECHA-LOTE/gsc-manifest.json \
  --output docs/seo-measurement/.local/FECHA-LOTE/gsc-daily.json
python scripts/seo_measurement.py compare \
  --input docs/seo-measurement/.local/FECHA-LOTE/gsc-daily.json \
  --end AAAA-MM-DD \
  --output docs/seo-measurement/.local/FECHA-LOTE/gsc-comparison.json
python scripts/seo_measurement.py import-indexation \
  --csv docs/seo-measurement/.local/FECHA-LOTE/indexation.csv \
  --manifest docs/seo-measurement/.local/FECHA-LOTE/indexation-manifest.json \
  --output docs/seo-measurement/.local/FECHA-LOTE/indexation.json
```

Repetir con Bing y sus manifiestos. Importar Páginas/Consultas separadamente cambiando `dimension`; no sumarlas como totales ni usarlas en `compare`. Si cambia el esquema del export, documentar la normalización antes de adaptar código o repetir sus pruebas. No modificar el importador sin un caso real que lo justifique.

## Inventario y atribución comercial

`commercial-confirmation.csv` y `attributed-contacts.csv` son **cabeceras vacías**, no informes ni importadores nuevos. Sirven para pedir un registro mínimo revisable y luego cruzarlo con la URL/slug, sin duplicar el CRM o el Lab:

- Inventario: slug existente, fecha de confirmación con zona, estado literal, posibilidad de recibir consultas, vigencia y referencia documental privada. Separar proyecto en catálogo de unidades comercialmente disponibles. Dejar desconocido lo que el responsable no confirma; no completar precios, unidades o entrega por inferencia.
- Contactos: periodo, zona, origen, URL de entrada si se conserva, solicitudes aceptadas y contactos cualificados, método y evidencia de atribución. Conteos agregados sin datos personales. Una celda vacía significa desconocido, no cero. No deducir atribución de una URL o referente faltante.

El cruce/priorización será una revisión documentada tras validar esos datos, no un ranking automático inventado ahora.

## IA

Conservar [AI-PROTOCOL.md](../../AI-PROTOCOL.md), preguntas v1 y plan de 180. Solo ejecutar una combinación si la interfaz y la cuenta/modalidad legítimas son accesibles. No usar API de generación como reemplazo de ChatGPT Search, Gemini o Perplexity de consumo. Registrar el estado de disponibilidad de AI Overviews separado de la presencia de Sollahms.

Guardar respuesta original, fecha, condiciones, fuentes y hash. Verificar humanamente que una cita sustenta la afirmación y apunta a Sollahms: el resumen de fase 2 comprueba archivo/hash y campos, no el significado de la cita. Ejecutar `ai-summary` con el CSV nuevo únicamente después. Bloqueos y no ejecuciones quedan fuera del denominador; n=0 implica tasas desconocidas.

## Cierre del próximo run

Crear `runs/FECHA-ID/` nuevo, conservar evidencia e importaciones, generar resúmenes revisados sin información sensible, registrar cobertura efectiva y añadir una línea al historial. Antes del traspaso editorial, aplicar [la corrección de Condominio Uruguay](editorial-correction.json) a la oportunidad existente. No activar generación ni publicación como efecto de importar mediciones.
