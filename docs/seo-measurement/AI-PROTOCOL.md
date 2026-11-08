# Protocolo de visibilidad en búsquedas con IA — versión 1

**Objetivo:** medir una muestra reproducible de menciones, enlaces, citas y recomendaciones de Sollahms, sin preguntar por su marca. No mide un ranking universal ni promete inclusión.

## Diseño

`ai-prompts-v1.csv`: 12 preguntas en español para compradores en Chile, con intención de compra, localidades del catálogo, crédito, etapas e inversión. No contienen Sollahms. No se agregan presupuestos ni características de clientes reales. Mantener el texto exacto: un cambio crea otra versión y serie.

Superficies separadas: ChatGPT Search, Gemini con búsqueda/fundamentación disponible, Perplexity, Google AI Overviews y Google AI Mode. AI Overviews y AI Mode no se agrupan. No sustituir ninguna por un modelo vía API, una búsqueda genérica o esta conversación.

`ai-test-plan.csv`: 180 espacios planificados; tres repeticiones de cada combinación en días distintos, offsets 0, 7 y 14 desde la primera ejecución accesible. No se creó una automatización ni una agenda. El orden se mantiene o se registra si se aleatoriza. Evaluar cada pregunta en conversación nueva, sin historial de Sollahms ni preguntas previas que orienten la respuesta.

## Condiciones que se conservan

Idioma es-CL/español; país objetivo Chile; ubicación efectiva conocida (o `unknown`, nunca asumir Chile por una URL); dispositivo; cuenta y personalización; modelo/versión visible (`not_disclosed` si no aparece); modalidad y si búsqueda está activada. No usar ubicación del centro de datos como ubicación de comprador. Comparar como series separadas si cambian cuenta, país, modo o prompt.

Registrar fecha/hora con zona, fecha local America/Santiago y evidencia completa de respuesta, fuentes y enlaces. No iniciar suscripciones ni llamadas potencialmente pagadas. No dar a una plataforma claves de otra. Respetar las condiciones del producto y límites de acceso.

## Registro

Copiar el encabezado de `runs/2026-11-08-phase2/ai-observations.csv` a un nuevo run:

- `run_id` único; plataforma; prompt_id/versión; país, contexto de cuenta y modalidad.
- `status`: `executed`, `blocked`, `not_run` o `unavailable`.
- `observed_at` ISO8601 con zona, modelo declarado o no divulgado, ubicación efectiva y notas sobre personalización/dispositivo.
- `mention`, `link`, `citation`, `recommendation`: `0`/`1` solo si se ejecutó y se pudo observar la respuesta. Para bloqueo/no ejecución quedan vacíos.
- `linked_urls` y `cited_urls`: enlaces exactos a Sollahms; separar múltiples con ` | `. Conservar URLs de destino visibles y anotar redirecciones de seguimiento, sin visitar enlaces privados.
- `competitors`: competidores nombrados y función; `selected_sources`: fuentes elegidas por el sistema, no solo competidores. Separar con ` | `.
- `evidence_file` y SHA-256 de respuesta/captura. El archivo debe existir para el resumen automático. Respuestas de cuentas y enlaces privados se conservan en `.local/`; versionar únicamente material revisado y público.

**Mención:** nombre de la empresa en la respuesta. **Enlace:** URL clicable al dominio. **Cita:** asociación explícita entre una afirmación y una fuente de Sollahms. **Recomendación:** sugerencia de considerar/contactar Sollahms. Pueden coexistir, pero una no sustituye automáticamente a otra. Registrar citas a una URL antigua o de otro dominio como tales, no acreditarlas al dominio por parecido de nombre.

Para Google AI Overviews, registrar si apareció la superficie. Si no se ofrece, `unavailable` con motivo, sin adjudicar ceros de cita. Conservar por separado cuántas búsquedas se intentaron y cuántas mostraron la superficie; reportar esa disponibilidad junto a las frecuencias condicionadas. Error o acceso bloqueado tampoco es ausencia de marca. En Gemini sin búsqueda verificable, marcar modalidad y no mezclar con ejecuciones con fuentes.

## Análisis

Por plataforma/consulta/versión/país/cuenta/modalidad: `n` ejecutado, días distintos y fracciones mención/enlace/cita/recomendación (`2/3`, por ejemplo). Mostrar también no ejecutadas/bloqueadas/no disponibles. Si n=0, tasas `null`, nunca 0%.

Una aparición en un día es ocasional. Tres ejecuciones en días distintos permiten describir repetición en esa muestra; incluso 3/3 no representa presencia general ni significación estadística. No usar el orden del texto como posición media. Si cambian fuentes o competidores, conservarlo como variabilidad, no eliminar la observación.

Relacionar citas con páginas y oportunidades de claridad, hechos verificables, utilidad, responsable editorial y revisión temporal. No añadir archivos o marcado “para IA” como requisito supuesto ni generar contenido masivo. Las métricas de citas no sustituyen visitas cualificadas y contactos.

**Resultado de esta fase:** ninguna ejecución de plataforma accesible; CSV de observaciones vacío y matriz con estados de acceso, no resultados simulados.
