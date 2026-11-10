# Primera ola IA v2 — paquete de operación manual

**Estado real:** cinco superficies bloqueadas por acceso de esta sesión; ninguna respuesta observada. La [tabla de operaciones](ai-wave-1-operations.csv) contiene las 60 combinaciones iniciales exactas: 12 preguntas × cinco superficies. Son trabajo pendiente, no ejecuciones. Las otras 120 repeticiones futuras siguen planificadas. [Evidencia de acceso](evidence/ai-access-inventory.json).

Se reutiliza [AI-PROTOCOL-v2.md](../../AI-PROTOCOL-v2.md) y las condiciones de [v1](../../AI-PROTOCOL.md). No se crea versión 3. El inventario actual de 572 herramientas no expone Browser `js`, CUA `js`, control de pestañas ni handoff. El escritorio figura habilitado con estado desconocido: no demuestra una sesión controlable. La política aplicada no incluye dominios de estas interfaces. No se repitieron sondeos HTTP anteriores ni se intentó modificar accesos.

## Condiciones para cada combinación

1. Abrir una conversación/contexto nuevo que no tenga historial, memoria o instrucciones previas sobre Sollahms. No usar esta conversación para medir. Desactivar memoria/personalización cuando el producto lo permita y registrar lo que realmente se pudo desactivar; si no se puede garantizar contexto limpio, dejar la operación bloqueada o como serie distinta.
2. Conservar la pregunta exacta de la tabla. Idioma objetivo español/es-CL, país objetivo Chile. Registrar ubicación efectiva conocida o `unknown`; no inferir Chile por idioma, URL o centro de datos. No cambiar país con VPN ni eludir condiciones del producto.
3. Registrar fecha/hora ISO8601 con zona, fecha local America/Santiago, país objetivo y ubicación efectiva, dispositivo/navegador, tipo de cuenta, estado de personalización/memoria, modalidad, modelo visible o `not_disclosed`, búsqueda activada y evidencia que lo demuestra. Si cambia una condición, separar la serie.
4. Ejecutar una sola vez cada combinación de primera ola que sea legítimamente accesible. No contratar un plan, consumir créditos de API, rodear autenticación ni ignorar límites. No simular repeticiones. Los offsets +7/+14 se anclan al primer acceso válido y no automáticamente a T0.

## Modalidad por superficie

| Superficie | Qué debe observarse y conservarse | Tratamiento si falta |
|---|---|---|
| ChatGPT Search | Interfaz de ChatGPT, conversación nueva, Search/búsqueda realmente activada; respuesta completa y panel de fuentes. | Acceso/autenticación bloqueado → `blocked`; búsqueda no acreditada → no mezclar con Search. |
| Gemini con búsqueda/fundamentación | Interfaz de Gemini y búsqueda/fundamentación realmente disponible; registrar modalidad visible y fuentes. | Sin acceso → `blocked`; sin búsqueda verificable → serie/modalidad separada, sin crédito a Gemini con búsqueda. |
| Perplexity | Interfaz de Perplexity, consulta nueva; registrar modo de búsqueda/modelo si visible y todas las fuentes. | Acceso o límites → `blocked`; no reemplazar por API. |
| Google AI Overviews | Búsqueda real en Google con pregunta exacta. Registrar si se ofreció AI Overview, texto y fuentes expandidas. | Búsqueda válida sin Overview → `unavailable`; error/autenticación → `blocked`. Ninguno equivale a ausencia de marca. |
| Google AI Mode | Interfaz AI Mode de Google, contexto nuevo y pregunta exacta; respuesta y panel completo de fuentes. | Modo no ofrecido → `unavailable`; acceso bloqueado → `blocked`. Mantener separado de Overviews. |

## Preguntas exactas v2

| ID | Pregunta a pegar sin cambios |
|---|---|
| C01 | ¿Qué empresas ofrecen asesoría inmobiliaria en Chile para comparar alternativas de compra según mi presupuesto y objetivo? |
| C02 | ¿Cómo encuentro asesoría inmobiliaria independiente en Chile y qué debo preguntar sobre comisiones y conflictos de interés? |
| C03 | Quiero comprar mi primera vivienda en Chile. ¿Qué pasos debería seguir y dónde puedo encontrar orientación confiable? |
| C04 | Quiero evaluar una inversión inmobiliaria en Chile. ¿Cómo comparo costos, arriendo esperado, vacancia y riesgos sin asumir rentabilidad garantizada? |
| C05 | ¿Cómo calculo el pie y el dividendo de una vivienda en Chile y qué gastos adicionales debo considerar? |
| C06 | ¿Cómo comparo tasas, CAE, seguros y costo total de créditos hipotecarios en Chile? |
| C07 | ¿Qué diferencia hay entre FOGAES y un subsidio a la tasa hipotecaria en Chile, y dónde reviso las condiciones vigentes? |
| C08 | Quiero entender los subsidios y beneficios para comprar una vivienda en Chile. ¿Cómo reviso sus requisitos en fuentes confiables? |
| C09 | ¿Qué ventajas, riesgos y plazos debo comparar al comprar una vivienda en blanco, en verde o con entrega inmediata en Chile? |
| C10 | ¿Qué herramientas educativas me ayudan a comparar escenarios de pie, tasa y plazo hipotecario en Chile sin confundirlos con una aprobación bancaria? |
| C11 | ¿Qué checklist debería usar para elegir una vivienda en Chile según mi presupuesto, necesidades y horizonte de compra? |
| C12 | ¿Cómo evalúo conectividad, infraestructura y obras urbanas al decidir dónde comprar una vivienda en Chile? |

## Evidencia y registro

Guardar por operación únicamente evidencia de esta prueba que pueda conservarse sin información privada: respuesta íntegra de prueba revisada, captura recortada de la interfaz, panel/listado de fuentes y URLs públicas exactas, competidores nombrados y su función, texto de la afirmación que cita a Sollahms, y la ficha de condiciones anterior. Calcular SHA-256 de cada archivo. La prohibición expresa de esta tarea de guardar respuestas privadas de cuentas prevalece sobre la referencia histórica del protocolo a `.local/`: no copiar respuestas privadas de cuenta al expediente, a `.local/` ni a Git. Si el único original disponible es privado, el operador debe entregar evidencia pública o un extracto permitido y sanitizado y declarar la limitación de integridad; no afirmar que se conserva el original. No guardar cookies, sesiones, credenciales ni identificadores de cuenta.

El CSV [ai-wave-1.csv](ai-wave-1.csv) conserva exactamente el encabezado v2. `notes` debe enlazar un registro sanitizado de condiciones (idioma, dispositivo, tipo de cuenta sin identidad, personalización, modalidad, búsqueda y texto exacto por prompt ID); los campos explícitos guardan plataforma, versión, alcance, fecha, ubicación y evidencia. Las respuestas y fuentes solo se conservan cuando están permitidas y revisadas conforme a la restricción anterior. No marcar `executed` hasta que existan respuesta y evidencia auténticas.

Para cada resultado válido: `mention=1` si nombra Sollahms como empresa; `link=1` si hay enlace clicable al dominio; `citation=1` solo si una afirmación se asocia explícitamente a una fuente de Sollahms y se verifica que la fuente la sostiene; `recommendation=1` si sugiere considerar o contactar a Sollahms. Un indicador no acredita los demás. Usar 0 únicamente cuando una respuesta efectivamente observada permita confirmar ausencia de ese indicador. Si es ambiguo, conservarlo no medido, con explicación.

Conservar `linked_urls`, `cited_urls`, `selected_sources` y `competitors`, separados por ` | ` cuando haya múltiples. Registrar destinos visibles y redirecciones de seguimiento; no seguir enlaces privados. Añadir contexto `corporate`, `project_only`, `none` o `unclear`. Una ficha solo puede conservarse incidentalmente en el original: queda excluida del crédito corporativo, sin auditarla ni priorizarla. URL desconocida se retiene fuera del cálculo hasta clasificarla; no asumir inclusión por complemento.

Validar el resumen con la guarda existente:

```bash
python scripts/seo_scope.py ai-summary --csv docs/seo-measurement/runs/2026-11-09-gap-closure-audit/ai-wave-1.csv --scope docs/seo-measurement/scope-v2.json --output docs/seo-measurement/.local/ai-wave-1/scoped-summary.json
```

El hash y la validación sintáctica no sustituyen revisión humana de la cita. Reportar denominadores observados por indicador y modalidad, días distintos y disponibilidad de la superficie. Con n=0, tasas `null`. Una mención aislada no demuestra repetición ni impacto comercial. No usar el orden textual como ranking ni una muestra sin menciones como fracaso de la estrategia.

## Recurso mínimo para desbloquear

Una sesión del producto legítimamente accesible y un operador humano o herramienta de control autorizada que entregue la evidencia descrita. Habilitar únicamente conectividad no resolvería por sí solo la falta de control de interfaz/cuenta. No hacen falta claves API, nuevas suscripciones ni cambios del sitio. El inventario de bloqueo no determina si las cuentas existen.
