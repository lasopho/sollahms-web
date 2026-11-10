# Sollahms — T0 de medición post-publicación

**T0: 09/11/2026 20:11:23, America/Santiago** (`2026-11-09T23:11:23Z`).
**Alcance vigente:** `corporate-education-v2`, 11 URL incluidas, sin fichas individuales actuales o futuras.

**Publicación SEO verificada: sí. Impacto SEO/GEO medido: todavía no.** El tiempo transcurrido no proporciona un periodo posterior completo suficiente ni sustituye los datos de los buscadores. No se atribuyen tráfico, ranking, visibilidad en IA ni captación a la publicación.

## Publicación y continuidad

El [registro formal sanitizado](publication.json) documenta el paso de `dpl_5ReP6rLckXZ7nonSTE7Qu79gesiZ` a **`dpl_655iVXDar2r8kipVSLhAtGCPYbT4`**, publicado y verificado a T0. SHA-256 del artefacto autorizado:

```text
17f4496b411f779029494de4c6757c30cca41f8547992333f1e76523444c035d
```

Ambos alias públicos se leyeron de nuevo durante este run y siguen en ese deployment; `www` conserva su redirección 308 al dominio principal. Esta lectura no cambia alias ni repite el QA. **No inferir producción desde `main`**. Los informes anteriores que dicen publicación bloqueada/pausada describen su momento histórico; permanecen intactos y este registro gobierna la continuidad actual.

Las cuatro páginas cambiadas fueron `/`, `/centro-orientacion.html`, `/guia-hipotecaria.html` y `/comparador-hipotecario.html`. Se registran los nueve cambios H01–H03, O01–O02, G01 y C01–C03 con sus elementos originales. Las fichas no fueron modificadas ni pasan a ser objetivos de medición estratégica.

El QA de publicación **ya realizado**, conservado como antecedente en [el resumen](evidence/activation-qa-summary.json) y [HTTP/hashes](evidence/activation-http.json), acreditó cuatro respuestas 200 iguales al candidato, nueve cambios una vez, formularios/consentimiento/enlaces y cálculos preservados, escritorio/móvil y carga/uso real de Inter y Manrope. La activación preservó los otros 173 alias y no requirió reversión. No se ejecutó nuevamente esa auditoría en este run.

Los cinco recuadros de `↗ U+2197` existen en la base anterior: [backlog independiente](backlog-symbols.json), sin corrección aplicada ni nueva prueba para influir en medición.

## Comprobación única de insumos y accesos

| Fuente | Resultado actual | Métricas |
|---|---|---|
| Google Search Console | Sin conector/identidad de lectura ni export verificable nuevo en las ubicaciones revisadas. El bloqueo 403 previo no se repitió sin condición nueva. | `null` |
| Bing Webmaster Tools | Misma ausencia de acceso/export nuevo verificable; sin reintentar su bloqueo previo. | `null` |
| Analítica de Vercel | Una petición real de lectura devuelve **400 `web_analytics_not_enabled`**. El nuevo canal autorizado de lectura justificó esta comprobación; no se habilitó el servicio. | `null`, no cero visitas |
| Captación orgánica | Sin informe agregado nuevo con página de origen y atribución acreditadas. | `null` |
| IA/GEO | Ningún acceso legítimo nuevo a las cinco superficies de consumo; sin repetir sus bloqueos, sin API sustitutiva. | No medido; tasas `null` |

[Disponibilidad sanitizada](evidence/access-availability.json) e [inventario de insumos](evidence/input-discovery.json). Una búsqueda puntual de Drive devolvió ocho metadatos, sin identificar exports de métricas; los datos privados de esa búsqueda no se versionan. Los CSV existentes son planes/plantillas o cabeceras vacías. El inventario no es una afirmación exhaustiva sobre todas las cuentas privadas.

La consulta analítica se filtró a las 11 rutas incluidas. Un primer límite inválido fue rechazado localmente por el esquema del conector, antes de llamar al proveedor; se corrigió al máximo admitido y se efectuó una sola consulta real. No hubo reintentos de la respuesta `web_analytics_not_enabled` ni cambios de configuración.

## Base previa y páginas a observar

La [referencia pre-publicación](pre-publication-baseline.json) conserva las 11 URL y los indicadores desconocidos separados por motor. **No hay suficientes datos históricos reales disponibles para calcular esa referencia.** Los totales generales de dominio, que pueden contener fichas, permanecen separados de las métricas exclusivas. No se obtiene el segmento restando cifras supuestas de fichas.

El [seguimiento específico](published-pages-tracking.json) prepara indexación, consultas, impresiones, clics, CTR, posición media y evolución para las cuatro páginas publicadas. Todos esos valores siguen `null`; HTTP 200 no demuestra indexación. País total y Chile, dispositivo y página de entrada quedan separados cuando el origen los permita. La posición media no es un ranking fijo ni una medida intercambiable entre motores.

[Conversiones](conversions.json) conserva cinco etapas distintas y desconocidas: clic en WhatsApp, solicitud enviada, solicitud aceptada, contacto cualificado y reserva/conversión comercial confirmada. Un clic no es un lead ni una venta. No se incorporan nombres, RUT, teléfonos, correos ni otros identificadores personales.

## Reglas temporales y calendario

Los eventos con instante anterior a T0 son pre-publicación; los posteriores son post-publicación. T0 es el evento de publicación. El **09/11/2026 es día de cambio** y se excluye de las ventanas diarias completas antes/después. No se prorratea tráfico supuesto ni se mezclan días parciales.

Conservar fechas y zona nativas de cada fuente. En el informe diario estándar de GSC, las etiquetas PT no se convierten a fechas Santiago. Bing y la analítica requieren la definición real de su informe; su zona permanece desconocida hasta acreditarla. No se impone la zona del host ni la de este calendario.

| Punto | Observación prevista, America/Santiago | Máximo de fechas post completas en Santiago a esa hora |
|---|---|---|
| T+7 | 16/11/2026 20:11:23 | 6: 10–15/11 |
| T+14 | 23/11/2026 20:11:23 | 13: 10–22/11 |
| T+28 | 07/12/2026 20:11:23 | 27: 10/11–06/12 |

Son máximos de calendario, **no cobertura real ni garantías estadísticas**. El día del punto de control todavía es parcial; la disponibilidad/finalización del proveedor puede ir retrasada. [Plan temporal](temporal-plan.json), [CSV de control](checkpoints.csv). Los controles se gestionan externamente; no se crearon cron, automatizaciones ni recordatorios.

Ventanas candidatas en la base temporal documentada, todavía sin resultados:

- 30/30: **10/10–08/11/2026** frente a **10/11–09/12/2026**, 60 fechas completas excluyendo el día de cambio.
- 90/90: **11/08–08/11/2026** frente a **10/11/2026–07/02/2027**, 180 fechas completas excluyendo el día de cambio.

Las fechas deben validarse en la zona nativa de la fuente antes de usarlas; el plan no transforma filas GSC ni asigna una zona a Bing. El comparador offline existente construye periodos adyacentes; las ventanas T0 tienen un día excluido entre ellas. **No ejecutar `compare` sin resolver explícitamente esa diferencia cuando haya datos, ni llenar el hueco con cero o incluir el día de cambio.** Se conservan importadores, manifiestos y guardas intactos; en este run no se calcula ningún delta. Antes de cobertura suficiente solo cabrán tendencias descriptivas, sin porcentajes inventados ni causalidad.

## IA/GEO v2

Se reutilizan el protocolo, las 12 preguntas sin marca y el plan de 180 espacios v2. No se ejecutó ninguna respuesta ni se modificó el plan histórico/v2. [Estados de superficie](ai-platform-status.csv), [observaciones sin filas inventadas](ai-observations-v2.csv), [resumen por la guarda existente](ai-summary-v2.json).

Los días 0/7/14 del protocolo IA se anclan al **primer acceso válido**, no automáticamente a la publicación. Los puntos T0+7/14/28 permiten revisar disponibilidad. Cada ejecución legítima futura documentará mención, enlace, cita, recomendación, fuentes, competidores y condiciones, con revisión humana y exclusión de fichas del crédito corporativo. No se simulan ChatGPT Search, Gemini, Perplexity, AI Overviews o AI Mode mediante API de generación. Inaccesible significa no medido, no ausencia observada.

## Bloqueos y siguiente acción

El recurso inmediato es un **export autorizado real** de rendimiento/indexación Google y Bing, con procedencia y filtros acreditados de las 11 URL, y un informe agregado de captación orgánica sin personas identificables. Los campos y comandos existentes están en [NEXT-IMPORT.md](NEXT-IMPORT.md). No hace falta confirmar stock ni abrir fichas para avanzar.

Al recibirlo, conservar el original privado, normalizarlo con `seo_measurement.py`, aplicar las guardas `seo_scope.py`, validar cobertura/zonas y publicar únicamente resúmenes sanitizados. La ausencia de Web Analytics en Vercel se documenta; habilitar instrumentación sería una tarea separada y no forma parte de esta autorización.

No se editó producción, no se corrigieron símbolos, no se desplegó ni creó candidato, no se cambiaron alias, no se fusionó `main` y no se activó AI Lab. La actualización es únicamente de documentación de medición, historial y registros sanitizados.

## Validación offline y cierre

**25 pruebas offline aprobadas:** 12 de guardas de alcance y 13 de compatibilidad del importador existente. Son fixtures sintéticos, no datos de posicionamiento. [Log de segmentación](evidence/offline-scope-tests.txt), [log del importador](evidence/offline-importer-tests.txt) y [validación de conservación](validation.json). JSON, enlaces locales, calendario, matrices `null` y preservación de informes/protocolo/importadores fueron revisados. Solo se versiona documentación de medición en la rama de continuidad, sin fusión a `main` ni publicación adicional.
