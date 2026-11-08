# Visibilidad corporativa en IA — protocolo versión 2

**Alcance:** `corporate-education-v2`, definido en [scope-v2.json](scope-v2.json). Las fichas individuales y su posicionamiento no se evalúan. Esta versión sustituye el uso futuro de v1; no sobrescribe sus preguntas, 180 espacios planificados ni evidencias.

## Diseño

[ai-prompts-v2.csv](ai-prompts-v2.csv) contiene 12 preguntas de compradores en Chile, sin mencionar Sollahms ni proyectos individuales: empresas de asesoría, independencia y conflictos de interés, primera vivienda, inversión y riesgos, pie/dividendo, tasas y costos, FOGAES, subsidios, etapas de compra, herramientas, elección de vivienda y conectividad/infraestructura.

[ai-test-plan-v2.csv](ai-test-plan-v2.csv) contiene 180 espacios nuevos: 12 preguntas × cinco superficies × tres días distintos (offsets 0, 7, 14 desde el primer acceso válido). Son pruebas **planificadas**, no ejecutadas ni automatizadas. Las superficies se mantienen separadas: ChatGPT Search, Gemini con búsqueda/fuentes cuando esté disponible, Perplexity, Google AI Overviews y Google AI Mode. Una API de generación no sustituye ninguna interfaz.

## Ejecución y evidencia

Reutilizar las condiciones válidas de v1: conversación nueva, pregunta exacta, idioma/país objetivo, ubicación efectiva conocida o desconocida, fecha/hora con zona, cuenta/personalización, dispositivo, modelo declarado o `not_disclosed`, modalidad y disponibilidad de búsqueda. Cambios de condiciones o de pregunta forman series distintas. No contratar servicios ni emitir llamadas API potencialmente facturables para ejecutar este protocolo.

Guardar respuesta original, captura/listado de fuentes y hash. Verificar humanamente que cada cita sostiene una afirmación y apunta a una página incluida. El hash y la validación de campos no comprueban el significado de la cita. Conservar originales de cuenta en `.local/` y versionar únicamente material público/revisado.

El [CSV vacío v2](runs/2026-11-08-scope-v2/ai-observations-v2.csv) añade `measurement_scope_id`, `mention_context` y `recommendation_context`. En pruebas ejecutadas, estos contextos admiten:

- `corporate`: referencia a Sollahms como empresa/asesoría o contenido del alcance.
- `project_only`: mención/recomendación únicamente de un proyecto; no otorga crédito corporativo ni se analiza el proyecto.
- `none`: ausencia observada de esa mención/recomendación.
- `unclear`: contexto que no permite decidir; no convertirlo en un cero medido.

`mention`, `link`, `citation` y `recommendation` conservan la observación original 0/1 solo en ejecuciones válidas. Los enlaces/citas originales se guardan completos como evidencia, incluso si hay referencias excluidas; el resultado **derivado** filtra únicamente URL incluidas y contextos corporativos. No crear tablas de rendimiento, recomendaciones o posiciones de proyectos individuales.

## Exclusión de fuentes y resultados

Si una respuesta solo enlaza/cita una ficha, no cuenta como enlace/cita elegible del nuevo alcance. Si mezcla contenido incluido con una ficha, únicamente la fuente incluida puede recibir crédito. Una mención contextualizada exclusivamente en un proyecto tampoco cuenta como recomendación de la asesoría corporativa.

Las URL desconocidas, alias no acreditados o variantes no clasificadas se mantienen fuera de las métricas elegibles. La guarda usa coincidencia estricta de URL del registro (fragmentos no crean páginas); consultar la salida para saber si una referencia quedó pendiente. Cuando no se puede decidir si la referencia es elegible, declarar el indicador no medido en esa observación en lugar de inventar ausencia corporativa. No alterar el sitio ni seguir enlaces privados para resolver esa clasificación.

Los competidores y fuentes pueden conservarse en la respuesta original para contexto corporativo, sin puntuar proyectos individuales. No usar el orden de una respuesta como ranking.

## Resumen y denominadores

```bash
python scripts/seo_scope.py ai-summary --csv docs/seo-measurement/runs/2026-11-08-scope-v2/ai-observations-v2.csv --scope docs/seo-measurement/scope-v2.json --output docs/seo-measurement/.local/LOTE/ai-v2-summary.json
```

La herramienta reutiliza la validación de evidencia de fase 2 y agrega la exclusión por alcance. Exige versión 2 y el identificador correcto. No modifica el original. Reporta tasas solo con observaciones clasificables para cada indicador, y separa bloqueos, pruebas no ejecutadas y ambigüedades. n=0 produce `null`, nunca 0%.

En AI Overviews, registrar por separado si la superficie se ofreció: `unavailable` no es ausencia de Sollahms. Mantener la disponibilidad junto a las frecuencias condicionadas. Una ejecución aislada es ocasional; tres días permiten describir repetición en esa muestra, sin afirmar presencia universal o consistencia estadística.

**Estado al crear esta versión:** 180 espacios nuevos planificados, cero respuestas ejecutadas. El plan v1 de 180 permanece histórico y sus resultados no se mezclan con v2.
