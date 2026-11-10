# Marco de decisión T+7 / T+14 / T+28

**T0:** 09/11/2026 20:11:23 America/Santiago (`2026-11-09T23:11:23Z`). **Producción de referencia:** `dpl_655iVXDar2r8kipVSLhAtGCPYbT4`. **Política:** `corporate-education-v2`, las 11 URL exactas de [scope-v2.json](../../scope-v2.json). [Registro de publicación](../2026-11-09-post-publication-t0/publication.json) y [plan temporal vigente](../2026-11-09-post-publication-t0/temporal-plan.json).

Este documento prepara decisiones futuras; no las ejecuta, no cambia contenido y no crea cron, recordatorios ni automatizaciones. Las revisiones están gestionadas externamente. La ausencia de datos no inicia un nuevo ciclo de optimización.

## Fechas y cobertura admisible

| Control, America/Santiago | Última fecha calendario completa en Santiago a esa hora | Máximo de fechas post completas en Santiago | Regla de decisión |
|---|---|---|---|
| T+7: 16/11/2026 20:11:23 | 15/11 | 6, del 10 al 15/11 | Revisar disponibilidad, trazabilidad y señales descriptivas; datos insuficientes → mantener estable. |
| T+14: 23/11/2026 20:11:23 | 22/11 | 13, del 10 al 22/11 | Revisar persistencia y explicaciones alternativas; insuficiencia → observar, salvo defecto técnico evidente documentado. |
| T+28: 07/12/2026 20:11:23 | 06/12 | 27, del 10/11 al 06/12 | Puede justificar primera propuesta pequeña si la señal es consistente y la evidencia suficiente para esa decisión. La fecha no autoriza por sí sola cambiar el sitio. |

Son máximos de calendario, **no cobertura medida ni un criterio estadístico universal**. Las fechas del control aún son parciales. La finalización y el retraso de cada proveedor se acreditan desde su informe; no se suponen. La zona de ejecución del host no define la de las métricas.

El **09/11/2026 se excluye** como día de transición. En datos con timestamp, clasificar respecto del instante T0; en agregados diarios, no repartir valores por horas supuestas. Para GSC diario estándar conservar etiquetas nativas Pacific Time; T0 cae también el 09/11 en esa base, pero debe verificarse el manifiesto real. No convertir sus fechas exportadas a fechas Santiago. Bing/analítica conservan zona desconocida hasta conocer la configuración del informe; entonces se deriva el día de transición en esa base, sin imponer otra zona.

## Puerta de calidad antes de interpretar una señal

1. **Identidad y procedencia:** motor/fuente, propiedad existente, extracción autorizada, fecha/hora y fichero original privado con hash; evidencia real de filtros y limitaciones. Un hash no prueba por sí solo que los datos provengan de la fuente declarada.
2. **Alcance:** filtro nativo revisado para las 11 URL, o detalle por página elegible con límites explícitos. Las cuatro publicadas (`/`, `/centro-orientacion.html`, `/guia-hipotecaria.html`, `/comparador-hipotecario.html`) pueden describirse como subconjunto, sin atribuirles el total de las 11. Fichas individuales nunca se auditan ni se puntúan. URL desconocida queda retenida.
3. **Comparabilidad:** misma fuente, propiedad, métricas, alcance/hash, zona, país, dispositivo, tipo de búsqueda, criterios de marca y periodo completo/final. Separar Chile/total, móvil/escritorio/otros, marca/no marca y grupos de intención. Mantener fijo el criterio de marca documentado; no reclasificar retrospectivamente para mejorar resultados.
4. **Cobertura:** conservar fechas presentes/ausentes, truncamiento, consultas anonimizadas, muestras y retraso del proveedor. Una tabla parcial no es el total; no sumar dimensiones para reconstruir información oculta. Ausente/desconocido = `null`, nunca cero imputado. Un cero explícito del origen solo puede usarse con cobertura validada.
5. **Significado:** CTR = clics/impresiones del mismo informe, sin promediar porcentajes; posición media no es ranking fijo y no se mezcla entre motores. Visita, clic WhatsApp, formulario enviado, formulario aceptado, contacto cualificado y reserva son etapas distintas. La colaboración corporativa se separa de captación de compradores.

Si falla la puerta, la conclusión es **no medido / observado parcialmente / bloqueado**, según evidencia. Conservar la pregunta abierta y el recurso mínimo concreto; no editar títulos para compensar una incertidumbre de datos.

## Matriz de decisión

| Situación observada | Evidencia mínima y análisis previo | Decisión futura propuesta | Qué obliga a mantener observación |
|---|---|---|---|
| Indexada + impresiones crecientes | Estado del motor y serie comparable de la URL/grupo, consultas e intención; revisar mezcla de marca, país y dispositivo | Mantener contenido estable; registrar evolución y siguiente control | Un aumento aislado o mezcla de segmentos no demuestra efecto de la publicación. |
| Indexada + impresiones + CTR posiblemente bajo | Desglosar consulta/intención, posición y distribución, dispositivo/país, snippet realmente mostrado, presencia de funciones SERP y comparables propios | Solo después, proponer title/meta concreto para una página incluida si hay desajuste demostrado; documentar hipótesis | No hay umbral universal de CTR. Volumen escaso, posiciones distintas, queries ocultas o cambio de mezcla impiden diagnosticar solo por promedio. |
| Indexada + ninguna impresión explícita en informe válido | Confirmar cobertura completa, filtro, periodo, anonimización y estado de indexación; revisar intención, cobertura temática, competencia y autoridad existentes | Investigar demanda/adecuación y distribución; mantener estable hasta evidencia consistente | Sin informe válido no es «cero impresiones». Cero de una muestra no demuestra ausencia de demanda ni fallo técnico. |
| No indexada: bloqueo técnico | Inspección autorizada del motor o evidencia técnica concreta nueva: robots/noindex/respuesta indebida; identificar fecha y URL incluida | Preparar reparación acotada del defecto; validación y autorización de implementación por separado | HTTP 200, sitemap accesible o búsqueda pública sin resultado no prueban indexación ni exclusión. No repetir rastreo certificado sin condición nueva. |
| No indexada: canonical | Canonical declarado/elegido por el motor y su destino, inspección fechada; separar alias de URL realmente incluida | Analizar discrepancia antes de proponer cambios; conservar IDs/rutas hasta tener causa demostrada | Una canonical técnicamente válida no garantiza la elegida. No cambiar contenido como primera reacción. |
| No indexada: descubrimiento/crawling | Estado de sitemap existente, URL descubierta, último rastreo y observación de inspección; enlaces internos ya publicados | Determinar si falta descubrimiento, rastreo o procesamiento; proponer solo la acción pertinente | No reenviar sitemap, solicitar indexación ni configurar IndexNow por defecto. Falta de acceso no demuestra que no existan. |
| No indexada: decisión/exclusión del motor | Motivo literal, fecha, inspección/cobertura de URL incluida; distinguir «descubierta»/«rastreada»/duplicada u otro estado | Evaluar motivo específico y evidencia editorial/autoridad sin asumir bloqueo técnico | Una etiqueta agregada no justifica reescribir todas las páginas. |
| IA cita Sollahms | Ejecución válida con prompt exacto v2, respuesta/fuentes originales, URL incluida y afirmación sustentada; condiciones conocidas/desconocidas explícitas | Registrar página, afirmación, fuente y modalidad; repetir en fechas comparables | Una cita no implica recomendación, tráfico, autoridad universal ni causalidad. No cambiar inmediatamente por una aparición. |
| IA menciona sin enlazar / enlace sin cita / recomendación | Clasificar separadamente mención, enlace, cita y recomendación; contexto corporativo y revisión humana | Conservar observaciones por indicador y su denominador; no sumar fenómenos distintos | Solo proyecto, contexto ambiguo o URL desconocida no reciben crédito corporativo automático. |
| IA no menciona Sollahms en respuesta válida | Respuesta real y fuentes revisadas bajo condiciones del protocolo | Registrar ausencia observada únicamente en esa ejecución; ampliar repetición comparable cuando corresponda | Una muestra pequeña no es fracaso ni ausencia general. No reescribir por un único resultado. |
| Superficie IA bloqueada/no ofrecida | Error/estado real de acceso; AI Overviews ofrecida/no ofrecida separado del resultado | `blocked`/`unavailable`, indicadores `null`; ejecutar manualmente al disponer de interfaz legítima | No convertir bloqueo en cero ni sustituir con API o búsqueda genérica. No evadir login/límites. |
| Clics orgánicos crecen, contactos no demostrados | Atribución real con landing/origen; etapas agregadas, aceptación/cualificación y periodo comparable | Mantener separadas visibilidad y negocio; comprobar embudo existente sin datos personales | Tráfico no prueba lead, clic WhatsApp no prueba contacto, aceptación técnica no prueba calidad o reserva. |
| Contactos/conversiones cambian | Totales agregados válidos, definición estable de etapa, origen/landing y método de atribución conocidos; revisar otras campañas y cambios comerciales | Describir asociación y preparar hipótesis; no atribuir causalidad a SEO solo por tiempo | Sin vínculo al segmento se etiqueta **general no filtrada / no atribuible**, sin repartir valores supuestos. |
| Presencia externa inconsistente | Fuente pública fechada y control/identidad acreditados; comparación de descripción/dominio/teléfono comercial/sociales | Proponer corrección concreta de un activo existente, con evidencia y titular responsable | No crear perfiles, comprar menciones/backlinks ni añadir `sameAs` sin control verificado. |
| Datos insuficientes T+7 | Matriz de acceso/periodo actualizada, cobertura real conocida o `null` | Mantener estable; priorizar el export/lectura mínima existente | El calendario no sustituye datos. |
| Datos insuficientes T+14 | Misma revisión y persistencia de bloqueos; buscar únicamente condición nueva | Mantener observación, salvo defecto técnico evidente documentado | No optimizar por impaciencia ni repetir certificados sin cambio. |
| Señal consistente T+28 | Calidad/comparabilidad acreditadas; más de una observación compatible; intención/posición/dispositivo y alternativas revisadas; suficiencia razonada para la hipótesis concreta | Proponer primera intervención limitada y reversible sobre página incluida, con hipótesis, evidencia y criterio de seguimiento; implementación requiere autorización aparte | Sin señal suficiente, seguir estable. No imponer un CTR/posición/conversión universal ni usar el control como fecha obligatoria de cambios. |

## Antes/después sin confundir ventanas ni causalidad

Comparar periodos equivalentes en la zona nativa y con composición de días comparable cuando el tamaño y cobertura lo permitan; documentar días festivos/estacionalidad/campañas/cambios de demanda o del buscador y diferencias de mezcla. Si no se pueden igualar condiciones, describir la limitación y no presentar el delta como efecto de SEO.

Las ventanas candidatas conservadas son:

| Diseño preparado | Pre | Fecha de cambio excluida | Post | Límite |
|---|---|---|---|---|
| 30 fechas completas frente a 30 | 10/10–08/11/2026 | 09/11 | 10/11–09/12/2026 | A T+28 todavía no han terminado 30 fechas post en Santiago; las fuentes pueden retrasarse más. |
| 90 frente a 90 | 11/08–08/11/2026 | 09/11 | 10/11/2026–07/02/2027 | Es planificación, no cobertura disponible ni garantía de significancia. |

Estos ejemplos proceden del [plan temporal T0](../2026-11-09-post-publication-t0/temporal-plan.json); validar su aplicación con la zona de la fuente antes de calcular. Las ventanas tienen un hueco de transición. El `compare` existente construye ventanas **adyacentes** y requiere 60/180 fechas completas consecutivas: no alimentarlo directamente como si representara este diseño. No relajar sus guardas ni llenar 09/11 con cero. Reutilizar importación/segmentación/vinculación; revisar un camino explícito que respete el día excluido cuando exista cobertura, conservando los periodos independientes hasta entonces.

Una descripción provisional de menos días puede ser útil para observación, con periodo/denominador y límites visibles; no se llama comparación 30/30 o 90/90 y no inventa porcentaje cuando falte una base válida. No promediar CTR o posición de tablas para simular un total nativo. Un cambio observado sigue siendo correlación salvo diseño y evidencia que permitan atribución; esta tarea no crea ese diseño causal.

## Repeticiones IA y registro de cada decisión

Los offsets 0/7/14 del protocolo v2 se anclan al **primer acceso válido de la serie**, no automáticamente a T0. T+7/T+14/T+28 revisan disponibilidad y pueden alojar nuevas rondas si corresponde al plan y condiciones reales. No simular ejecuciones futuras ni cambiar preguntas. Mantener modalidades/modelos/cuenta/personalización/ubicación efectiva, o declarar otra serie si cambian. Ubicación objetivo Chile no equivale a ubicación efectiva Chile. Con n válido = 0, las tasas son `null`; en ambigüedad conservar denominadores específicos por indicador.

Cada decisión futura debe guardar: control/fecha, responsable, pregunta de decisión, fuente/evidencia y hash, propiedad/filtros/alcance, periodo/zona/cobertura, segmentación, valores observados o `null`, estado (**confirmado**, **observado parcialmente**, **inferido**, **no medido**, **bloqueado**), explicaciones alternativas, hipótesis, acción propuesta o estabilidad, autorización aplicable y señal que motivará la siguiente revisión. El estado de una inferencia no se eleva a confirmado por repetirse en un informe.

Hasta esa evidencia y una autorización de implementación: conservar las cuatro páginas publicadas y las otras siete incluidas, fichas/formularios, incidencia ↗, configuración y producción; no crear páginas, candidatos, despliegues, perfiles ni nuevas herramientas de medición.
