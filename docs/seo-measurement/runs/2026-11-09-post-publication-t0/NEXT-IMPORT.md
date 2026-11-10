# Próxima acción de medición: recibir evidencia real

La publicación está acreditada; el impacto sigue **no medido**. No editar las páginas, activar analítica, solicitar indexación ni generar contenido para desbloquear esta medición.

## Recursos pendientes

| Fuente | Recurso exacto necesario |
|---|---|
| Google Search Console | Exportaciones originales de Fechas, Páginas y Consultas desde la propiedad autorizada existente que cubra `sollahms.cl`; Países y Dispositivos cuando estén disponibles. Serie del grupo exacto de 11 URL y vista general del dominio separadas. Evidencia del filtro nativo y último día completo. Inspecciones/cobertura de URL incluidas para indexación. |
| Bing Webmaster Tools | Rendimiento e indexación de la propiedad existente, con dimensiones disponibles, filtros, definición de posición y zona acreditados por Bing. Si no existe filtro nativo del grupo, conservar solo tablas parciales por URL y mantener el total corporativo desconocido. |
| Analítica | Informe agregado de la herramienta existente por fecha, página de entrada y canal/fuente orgánica, con zona de la propiedad, periodo, cobertura y método de atribución. La lectura actual de Vercel devuelve `400 web_analytics_not_enabled`; no se habilitó ni se reintentará sin una condición nueva. |
| Captación orgánica | Totales agregados por periodo, página incluida y atribución: clic WhatsApp, solicitud enviada, solicitud aceptada, contacto cualificado y reserva/conversión comercial confirmada. Sin datos personales ni identificación individual. |
| IA/GEO | Acceso directo legítimo a una de las cinco superficies de consumo del protocolo v2, con modalidad de búsqueda y condiciones documentadas; respuesta original, fuentes, fecha y evidencia. Una API de generación no lo sustituye. |

Las propiedades escritas en los manifiestos de ejemplo no demuestran acceso autorizado. No crear otra propiedad, reenviar el sitemap, instalar IndexNow ni pedir stock de fichas. La búsqueda puntual de Drive y los inboxes locales no identificaron nuevos exports verificables; no se afirma ausencia en todas las cuentas privadas.

## Importación existente, sin reconstrucción

1. Guardar originales privados en `docs/seo-measurement/.local/LOTE/`, ignorado por Git. Conservar hashes y procedencia: fuente, propiedad, periodo, zona **nativa**, dimensiones, filtros, país, tipo de búsqueda, locale, extracción, último día completo, muestreo y límites de filas. Revisar antes de versionar cualquier resumen.
2. Reutilizar los manifiestos de `../../templates/` como formato, reemplazando sus ejemplos por metadatos reales. No importar plantillas, planes ni cabeceras vacías como resultados.
3. Normalizar cada motor/dimensión por separado con el importador existente:

```bash
python scripts/seo_measurement.py import-performance --csv docs/seo-measurement/.local/LOTE/Fechas.csv --manifest docs/seo-measurement/.local/LOTE/gsc-manifest.json --output docs/seo-measurement/.local/LOTE/gsc-daily.json
python scripts/seo_measurement.py import-performance --csv docs/seo-measurement/.local/LOTE/Paginas.csv --manifest docs/seo-measurement/.local/LOTE/gsc-pages-manifest.json --output docs/seo-measurement/.local/LOTE/gsc-pages.json
python scripts/seo_scope.py segment --input docs/seo-measurement/.local/LOTE/gsc-pages.json --scope docs/seo-measurement/scope-v2.json --output docs/seo-measurement/.local/LOTE/gsc-included-pages.json
```

Para series diarias exclusivas, aplicar `bind-daily` únicamente con prueba real y revisada de `native_exact_allowlist`, propiedad/fuente coincidentes, las 11 URL exactas, archivo de evidencia y su hash. Seguir [SEGMENTATION-v2.md](../../SEGMENTATION-v2.md). No fabricar esa prueba para un informe global; un hash no demuestra autenticidad.

Mantener total y Chile separados cuando existan, junto a dispositivo, consulta y página de entrada. Un CTR agregado es clics/impresiones del mismo informe, no un promedio de porcentajes. La posición media conserva la definición de cada motor y nunca es un ranking fijo. Las dimensiones parciales o consultas anonimizadas no reconstruyen totales ocultos.

## T0 y comparaciones

Conservar `T0 = 2026-11-09T20:11:23-03:00`, `America/Santiago`. El 09/11 es día de cambio; no convertir sus fracciones en días completos. Para GSC conservar las etiquetas de fecha originales de su informe diario PT, sin convertirlas a fechas chilenas. La zona y los cortes de Bing/analítica siguen pendientes de su exportación real.

Las ventanas de [temporal-plan.json](temporal-plan.json) son candidatas, no datos ni garantías de significación. La comparación 30/30 necesita 60 fechas completas; la 90/90, 180. Excluir el día de cambio introduce un hueco: el comando `compare` existente construye ventanas adyacentes. **No ejecutarlo directamente cruzando T0, no incluir el 09/11 para satisfacer la guarda y no rellenarlo con ceros.** Cuando lleguen datos suficientes, revisar explícitamente la ruta de cálculo de las dos ventanas separadas, preservando filtros y guardas. Este run no modifica el comparador ni calcula deltas.

## IA v2

Reutilizar `../../ai-prompts-v2.csv`, `../../ai-test-plan-v2.csv`, [ai-observations-v2.csv](ai-observations-v2.csv) y [AI-PROTOCOL-v2.md](../../AI-PROTOCOL-v2.md). Los 180 espacios siguen planificados, sin respuestas ejecutadas. Sus offsets 0/7/14 se anclan al **primer acceso válido**, no automáticamente a T0. T+7/14/28 revisa acceso/evidencia sin alterar ese diseño.

No incluir la marca en los prompts. Registrar mención, enlace, cita, recomendación, contexto corporativo, URL de fuente, competidores, condiciones y evidencia original; revisión humana de la cita. No puntuar fichas ni URL desconocidas. Inaccesible/no ejecutado es **no medido**; sin denominador válido las tasas son `null`, no 0%.

Los controles ya se gestionan externamente. No se crean cron, automatizaciones ni recordatorios: el calendario es únicamente un plan de observación documentado.
