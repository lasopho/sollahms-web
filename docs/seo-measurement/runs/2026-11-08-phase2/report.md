# Sollahms — fase 2: medición, indexación y visibilidad en IA

**Fecha:** 8 de noviembre de 2026, zona de presentación America/Santiago. Evidencias técnicas con timestamps UTC explícitos.

**Resultado:** sistema de medición offline operativo y versionable; no hay datos privados suficientes para acreditar indexación, posiciones, tráfico, citas o crecimiento comercial. Se conservaron las 141 URL y la producción. No se enviaron formularios ni se ejecutaron publicaciones, promociones, fusiones o solicitudes de indexación.

## 1. Producción y antecedentes recuperados

- Proyecto Vercel `project-wrapp`, `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`.
- Producción observada: `dpl_5ReP6rLckXZ7nonSTE7Qu79gesiZ`, READY, del 8/11, fuente `d7e98eb61edc3b8577b0fe7ec189e7c0ad7e0d53`, rama `codex/whatsapp-produccion-20261108`. La consulta de alias confirmó `sollahms.cl` asociado a ese deployment. Solo se conserva metadata pública/sanitizada, sin campos de bypass de protección.
- Main: `86e200ec191b38af355061e21bc0fc1e549cce3b`, de octubre. No se usa como sustituto de producción.
- Se recuperaron informes de portada del 25/10 y SEO corporativo publicado del 29/10. No repetir sus mejoras ni ejecutar sus mecanismos de publicación sobre una base obsoleta.
- Se reutilizó la evidencia del rastreo de esta conversación: 141 respuestas 200, títulos y descripciones presentes, canonical propios; no se volvió a rastrear todo el sitio.
- Comprobación acotada nueva: mismo conjunto de 141 URL en sitemap; 131 proyectos en `data/proyectos.json`; ese JSON público coincide exactamente con el del commit de producción. Las 11 fichas genéricas no cambiaron sus bytes desde la auditoría inicial. Una entrada de catálogo no demuestra stock de unidades.

Fuentes: [baseline](baseline.json), [evidencia recuperada](evidence/audit-phase1-recovered.json), [sitemap](evidence/sitemap-preservation.json), [catálogo](evidence/catalogue-provenance.json), [11 fichas](evidence/generic-fiches.json), [acceso conectado](evidence/connected-access.json).

## 2. Línea base por buscador

| Indicador | Google | Bing |
|---|---|---|
| Integración privada utilizable en esta sesión | No encontrada | No encontrada |
| Estado de indexación por URL | No medido | No medido |
| Sitemap aceptado/procesado por el motor | No verificado | No verificado |
| Impresiones/clics/CTR/posición | `null` | `null` |
| Consultas y páginas con rendimiento | No disponibles | No disponibles |
| Comparación 30 contra 30 / 90 contra 90 | Bloqueada por falta de exportaciones | Bloqueada por falta de exportaciones |
| Referencias de IA y contactos cualificados | No medidos | No medidos |

La respuesta HTTP 200 y el sitemap público prueban accesibilidad técnica, no indexación. Las búsquedas públicas de la auditoría anterior no devolvieron páginas de Sollahms en la herramienta usada; no se convierten en posiciones específicas de Google/Bing ni en exclusión del índice. No se repitió ese muestreo como sustituto de las consolas.

No se verificó IndexNow desde la cuenta: queda desconocido. No se crearon propiedades, envíos ni configuraciones duplicadas. Vercel está conectado para metadata, pero las dos consultas de analítica fallaron con 400. No se afirma que Analytics esté desactivado hoy ni que haya cero tráfico. [Bloqueos y autorización mínima](../../ACCESS-AND-EXPORTS.md).

## 3. Matriz de IA

| Superficie | Ejecuciones de respuestas | Mención/enlace/cita/recomendación |
|---|---|---|
| ChatGPT Search | 0 | No medido |
| Gemini | 0 | No medido |
| Perplexity | 0 | No medido |
| Google AI Overviews | 0 | No medido |
| Google AI Mode | 0 | No medido |

Las interfaces no fueron accesibles: 403 del proxy y sin conector/sesión utilizable. No se simularon respuestas ni competidores elegidos por plataformas. El protocolo contiene 12 preguntas sin marca y 180 espacios planificados en tres días de prueba, no pruebas ya realizadas. El CSV de observaciones permanece vacío. [Matriz de acceso](ai-platform-status.csv), [protocolo](../../AI-PROTOCOL.md).

## 4. Selección editorial inicial

Ocho candidatas **provisionales**, basadas en presencia en el catálogo y hechos publicados, no en volumen, demanda, ranking ni stock acreditado:

1. B.Come — Concepción.
2. Condominio Gregorio de la Fuente — Macul.
3. Condominio Jardines de Ramón Cruz — Macul.
4. Condominio Uruguay — Ñuñoa.
5. Condominio Parque Don Lautaro — Peñalolén.
6. Mirador La Florida — La Florida.
7. Domeyko 2055 — Santiago.
8. San Ignacio — Santiago.

Las cinco primeras cuentan con antecedentes comerciales León del 30/10 y ofertas por tipología en el catálogo; las siguientes también tienen ofertas publicadas, con antecedentes Sento que requieren revisión antes de intervenir. Esta selección facilita una revisión pequeña de páginas existentes; no demuestra que convertirán más.

Se difieren Curicó 77 (revisar diferenciación frente a otras fichas de Santiago), Jofré 157 (conservar ruta histórica `jofre-135`, revisar coherencia de identidad) y Angamos 205 (precio y tipologías no informados; no inferirlos). Se prepararon títulos, descripciones y mejoras para las 11, sin aplicarlas. [Propuestas legibles](page-proposals.md), [CSV](page-priorities.csv), [JSON](page-priorities.json).

Al llegar datos, sustituir la prioridad editorial por una decisión documentada: URL indexada/no indexada y motivo; consultas relevantes en Chile; impresiones con oportunidades de CTR; adecuación real del proyecto; capacidad de recibir consultas y contactos cualificados. No tratar una posición media agregada como la posición de todas las búsquedas ni declarar bajo CTR sin comparables.

## 5. Plan por impacto y evidencia

| Orden | Acción | Evidencia/impacto esperado | Dependencia y aceptación |
|---|---|---|---|
| P0 | Importar GSC/Bing y confirmar indexación | Resuelve la principal incertidumbre | Exports autorizados; procedencia y cobertura registradas |
| P0 | Conservar identidad de producción y 141 URL | Evita perder trabajo publicado | Guardas de diff y hash; cero cambios públicos |
| P1 | Seleccionar 5–10 fichas con datos reales | Orienta esfuerzo a demanda cualificada | Reordenar las ocho candidatas con métricas e inventario vigente |
| P1 | Revisar introducciones, títulos y metas propuestos | Mayor claridad de ubicación/producto en páginas existentes | Aprobación posterior; no alterar condiciones inmobiliarias |
| P1 | Ejecutar pruebas de IA con evidencia | Crea línea base de fuentes/menciones | Acceso gratuito disponible y tres fechas por combinación |
| P1 | Identificar origen y calidad de contactos | Vincula visibilidad con negocio | Datos agregados de herramienta existente; sin modificar formularios |
| P2 | Revisar actualidad editorial y traspasar al Lab | Reutiliza guías y flujo de revisión existentes | Revisar paquetes existentes antes de generar; sin llamadas API |
| P2 | Verificar IndexNow desde Bing | Evita duplicar configuración | Acceso a cuenta; solo diagnóstico en esta fase |

No se necesita infraestructura pagada para lo preparado. Los objetivos comerciales numéricos deben fijarse después de recuperar la base real; no se inventa una meta de crecimiento ni causalidad de cambios.

## 6. Avances y límites frente a octubre y a la fase 1

**Avance confirmado de esta fase:** historial persistente, recuperación de fuente de producción, importador de rendimiento/indexación, comparación 30/90 con guardas de cobertura, protocolo y matriz IA, 11 propuestas y ocho oportunidades para AI Lab. Son mejoras de operación y trazabilidad, no crecimiento medido de tráfico.

**Sin avance de posicionamiento acreditable:** no existen nuevas métricas privadas comparables. Los buenos datos técnicos y Lighthouse históricos no se transforman en resultados comerciales.

**Corrección de contexto del Lab:** main parecía inicial, pero `work` y PR #1 contienen el flujo editorial desarrollado. Se leyó su contrato para no duplicarlo. La entrega de oportunidades se preparó sin ejecutar generación, importar paquetes ni modificar el Lab. [Coordinación](../../AI-LAB-HANDOFF.md).

## 7. Próximo paso y recursos exactos

La vía más corta es aportar exportaciones de las cuentas existentes: rendimiento diario de hasta 180 días completos, páginas, consultas, cobertura, sitemap e inspecciones de las ocho candidatas. No hacen falta contraseñas, una nueva propiedad ni cambios al sitio. Una sesión/API autorizada de lectura es alternativa; requeriría habilitar los dominios correspondientes en la red del entorno y configurar la identidad de forma segura.

Después se ejecutan los importadores y se entrega la comparación real. La publicación de propuestas sigue fuera del alcance: requiere una intervención futura autorizada. No hay acciones automáticas pendientes ni servicios programados.

## 8. Validación

13 pruebas sintéticas del importador/resumen aprobadas inicialmente: idiomas/locale GSC/Bing, CTR ponderado correctamente, medias por impresiones, días faltantes, cero denominador, datos solapados, mezcla de fuentes/filtros, tablas parciales, inmutabilidad de resultados, indexación separada y evidencia obligatoria de IA. El resultado final y la preservación se conservan en `validation.json`.
