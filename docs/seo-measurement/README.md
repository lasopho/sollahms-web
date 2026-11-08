# Medición SEO y visibilidad en IA de Sollahms

**Último avance:** [fase 3 — 8 de noviembre de 2026](runs/2026-11-08-phase3/report.md).

**Continuidad:** no se encontraron insumos nuevos; la línea base real sigue pendiente. Se conservan fase 2, importadores, pruebas históricas y protocolo de 180 ejecuciones. Antes de reutilizar propuestas, aplicar la [corrección de Condominio Uruguay: La Florida, no Ñuñoa](runs/2026-11-08-phase3/editorial-correction.json).
**Estado:** sistema offline preparado; indexación, tráfico, posiciones, citas y conversiones todavía no medidos con fuentes privadas. `null` significa desconocido, no cero.

La rama `codex/seo-medicion-20261108` parte de `d7e98eb61edc3b8577b0fe7ec189e7c0ad7e0d53`, fuente de la producción identificada. No fusionar a main ni desplegar este trabajo. La única diferencia de configuración es `git.deploymentEnabled["codex/seo-medicion-20261108"]=false`, para impedir despliegues automáticos de esta rama. No se modifican HTML, datos del catálogo, precios, formularios, scripts públicos, funciones ni paquetes de publicación. No ejecutar el packager histórico para este trabajo.

## Continuar sin repetir la auditoría

1. Leer el informe, `baseline.json`, `history.jsonl` y `evidence/connected-access.json` del último run.
2. Consultar el deployment/alias vigente: no asumir que main o esta rama siguen representando producción. Si cambió, registrar la nueva identidad antes de comparar.
3. Importar las exportaciones autorizadas. No repetir el rastreo técnico de 141 páginas para resolver un problema de acceso a métricas.
4. Escribir un nuevo directorio `runs/FECHA-ID/`; no sobrescribir evidencia histórica. Añadir una línea con evidencia al historial. Conservar procedencia, filtros y fechas del motor.
5. Repriorizar las ocho candidatas con impresiones, clics, CTR, consultas, inventario y contactos cualificados. Coordinar con el Lab; las propuestas de hoy no autorizan publicación.

## Archivos operativos

- [Accesos y exportaciones](ACCESS-AND-EXPORTS.md): procedimiento GSC/Bing y bloqueos exactos.
- [Protocolo IA](AI-PROTOCOL.md), `ai-prompts-v1.csv` y `ai-test-plan.csv`: 12 consultas × 5 superficies × 3 días = 180 ejecuciones **planificadas**, no resultados.
- [Coordinación editorial](AI-LAB-HANDOFF.md): límites con el generador existente.
- `templates/`: manifiestos de ejemplo y CSV de indexación vacío; sustituir todos los metadatos por los reales antes de importar.
- `scripts/seo_measurement.py`: importador local sin red ni dependencias externas.
- `history.jsonl`: estados conocidos y desconocidos desde octubre; no mezcla Lighthouse con posicionamiento.

## Importar rendimiento

Desde la raíz del repositorio:

```bash
mkdir -p docs/seo-measurement/.local/2026-11-08
python scripts/seo_measurement.py import-performance \
  --csv docs/seo-measurement/.local/2026-11-08/Fechas.csv \
  --manifest docs/seo-measurement/.local/2026-11-08/gsc-manifest.json \
  --output docs/seo-measurement/.local/2026-11-08/gsc-daily.json
python scripts/seo_measurement.py compare \
  --input docs/seo-measurement/.local/2026-11-08/gsc-daily.json \
  --end 2026-11-07 \
  --output docs/seo-measurement/.local/2026-11-08/gsc-comparison.json
```

La fecha es ilustrativa: usar el último día **completo y disponible** en el motor. Necesita 60 días diarios para comparar 30 contra 30 y 180 para 90 contra 90. No crear ceros para días faltantes. Repetir para Bing con su manifiesto, sin combinar motores. El importador acepta CSV/TSV UTF-8 con BOM opcional, cabeceras habituales en español/inglés, delimitador coma/punto y coma/tabulador, `locale=en|es` explícito. XLSX/ZIP debe exportarse o convertirse a CSV UTF-8; guardar hash del original y del derivado y describir la conversión. Otros encabezados Bing se renombran explícitamente a los campos canónicos, sin inferir métricas distintas.

Se requieren clics e impresiones enteros, dimensión y procedencia. CTR se recalcula como clics/impresiones; posición ausente queda `null`. No se promedian CTR. La posición agregada es aproximada, ponderada por impresiones desde las medias exportadas, sujeta a redondeo; no es un ranking fijo. Posiciones de clic y posiciones de impresión de Bing no deben mezclarse: indicar la definición exacta en el manifiesto (campo adicional `position_definition`) y usar solo una por conjunto.

Importar consultas/páginas/países/dispositivos por separado cambiando `dimension`. No sumar esas tablas como totales de propiedad: hay anonimización, límites de filas y diferencias de agregación. La comparación automatizada acepta solo series diarias con cobertura completa declarada. La cobertura es una declaración comprobada por el operador con el export, no certificación del script.

## Importar indexación

```bash
python scripts/seo_measurement.py import-indexation \
  --csv docs/seo-measurement/.local/2026-11-08/indexation.csv \
  --manifest docs/seo-measurement/.local/2026-11-08/indexation-manifest.json \
  --output docs/seo-measurement/.local/2026-11-08/indexation.json
```

Normalizar la exportación/inspección al formato de `templates/indexation.csv`. `status` admite `indexed`, `not_indexed`, `unknown`; copiar el motivo literal del motor, fecha de último rastreo y canonical seleccionado si están disponibles, dejando vacío lo que no informa. Cada fila exige `evidence_reference` al original/inspección. Una lista de ejemplos es parcial aunque todas sus filas estén indexadas; no convertirla en cobertura de las 141 URL. Guardar original, su SHA-256 y mapeo de columnas en `.local/`.

## Matriz IA y trazabilidad

```bash
python scripts/seo_measurement.py ai-summary \
  --csv docs/seo-measurement/runs/2026-11-08-phase2/ai-observations.csv \
  --output docs/seo-measurement/.local/2026-11-08/ai-summary.json
python -m unittest discover -s tests -p test_seo_measurement.py -v
```

El CSV inicial está vacío deliberadamente. Para un resultado ejecutado se requieren respuesta/captura, hash, fecha con zona y condiciones; una prueba bloqueada no entra en el denominador ni recibe ceros. El resumen separa plataforma/consulta/versión/país/cuenta/modalidad. `repeat_sample_complete` solo indica tres fechas medidas; no prueba consistencia general.

## Indicadores y privacidad

Por motor: cobertura y motivos de exclusión; impresiones, clics, CTR y posición con su definición; páginas/consultas; marca/no marca; país/dispositivo. GSC `sollahms|sollhams` es una segmentación propuesta, no un dato observado. Separar Chile del total internacional y conservar ambas vistas si existen.

Por IA: frecuencia de mención, enlace, cita y recomendación; URLs, competidores y fuentes elegidas. Por negocio: solicitudes aceptadas y cualificadas atribuibles a orgánico/IA, reservas confirmadas y tasa de conversión. Un clic de WhatsApp es una microconversión, no una conversación ni una venta. Referente ausente no acredita ausencia de IA. No sumar tráfico de bots como visitas humanas.

Los CSV originales, consultas, referencias completas, respuestas de cuentas y cualquier dato personal se guardan en `.local/` ignorado, no en este repositorio público. Versionar solo evidencia pública y resúmenes revisados sin datos personales. No guardar cookies, tokens ni datos de leads. Si se necesita continuidad entre entornos, conservar los originales en almacenamiento privado ya autorizado y registrar una referencia y hash, sin contratar infraestructura. El código sintético de pruebas nunca se incorpora a la línea base real.
