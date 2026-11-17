# Dictamen independiente F12 — PR #32

**Requiere cambios.** Se confirmaron cuatro defectos P2 nuevos con reproducciones específicas. Corregirlos y revisar su resultado antes de solicitar aprobación. Este dictamen documental no cambia el estado de revisión en GitHub.

PR: https://github.com/lasopho/sollahms-web/pull/32. HEAD revisado: `e090d33d71cd98a6919e589f7ec66168216c94ba`. Base: `codex/footer-sin-frase-20261116`, `daf16e7dd560301029357ce79a7af0b0e9a7e67b`. Merge-base y producción: `b761ddeaea2fa526870e6af25658046e31b571d7`. Corte de comprobación: 17/11/2026, UTC.

## Verificación inicial y alcance

PR abierto, Draft y sin merge; SHAs exactos y dieciséis archivos coincidentes con F11. Exclusión automática presente en `vercel.json:8`, con la rama técnica en `false`. Producción READY continúa en `dpl_9b2Fp33LqsL5NuB2p7JLdxx9t9gu`; los veinte IDs recientes de deployments coinciden con F11, sin entradas nuevas. HEAD y árbol técnico permanecen intactos.

Tres revisiones independientes cubrieron motores y sus pruebas, datos/normalización y pruebas, e interfaz/presentación/vistas y pruebas. La consolidación comprobó referencias, alcance, preservación y evidencia. Se revisaron los dieciséis archivos, incluidos los cinco de pruebas y la única línea de configuración añadida en F11.

Coinciden los hashes de los dieciséis archivos del PR y de los 155 protegidos. No se editaron aplicación, pruebas existentes, datos publicados, funciones, formularios o configuración externa. No se publicaron comentarios/reviews ni se resolvieron comentarios en GitHub.

## F12-01 · P2 · Un amenity residencial se presta a un local implícito

Archivo: [commercial-filter-engine.mjs:142](https://github.com/lasopho/sollahms-web/blob/e090d33d71cd98a6919e589f7ec66168216c94ba/assets/js/commercial-filter-engine.mjs#L142), bloque 142–153.

**Entrada real:** Indi, modo preparado, mínimo y máximo UF 8.560, gimnasio, sin seleccionar tipo de propiedad.

**Observado:** coincide únicamente `OWN4-P011`, cuyo tipo es `local` y precio UF 8.560. La misma consulta con tipo `local` devuelve cero. El gimnasio no tiene alcance acreditado para ese local.

**Causa e impacto:** el uso comercial para filtrar amenities se decide desde la consulta antes de elegir las referencias; cuando no hay filtro explícito de tipo, el local que satisface el precio hereda el amenity residencial. Es una coincidencia comercial falsa que incumple la compatibilidad de todos los predicados.

**Corrección propuesta:** evaluar la elegibilidad del amenity contra el tipo y alcance de cada referencia candidata, conservando AND/OR y tratando un alcance desconocido como desconocido. La ausencia de filtro de tipo no debe equivaler a uso residencial.

**Aceptación:** la consulta anterior debe excluir el local con o sin el filtro explícito `local`; referencias con respaldo universal/comercial válido deben conservar sus coincidencias legítimas.

Evidencia: `reproducciones/engine-review-repros.mjs` y `evidencias/engine-results.jsonl`.

## F12-02 · P2 · La búsqueda preparada omite las etiquetas públicas en español

Archivo: [commercial-filter-engine.mjs:151](https://github.com/lasopho/sollahms-web/blob/e090d33d71cd98a6919e589f7ec66168216c94ba/assets/js/commercial-filter-engine.mjs#L151), líneas 150–152. El campo visible anuncia búsqueda por característica en `proyectos.html:131`.

**Entrada real:** Living Town, modo preparado, texto `piscina`.

**Observado:** cero resultados pese a `pool=true`. El texto técnico `pool` devuelve Living Town; seleccionar el amenity Piscina también lo devuelve.

**Causa e impacto:** el índice textual incorpora claves técnicas inglesas y omite etiquetas públicas. El usuario pierde una coincidencia documentada al buscar la característica en el idioma de la interfaz.

**Corrección propuesta:** incorporar las etiquetas de la taxonomía pública para hechos confirmados y con alcance válido. Coordinarlo con F12-01 para evitar recuperar texto de amenities que no corresponden a la referencia.

**Aceptación:** `piscina` debe localizar la referencia/proyecto acreditado, manteniendo las restricciones activas y sin convertir desconocidos en coincidencias.

Evidencia: mismo script de motor y `evidencias/engine-results.jsonl`.

## F12-03 · P2 · El resumen financiero publicado permanece visible en preparado

Archivo: [catalog.mjs:85](https://github.com/lasopho/sollahms-web/blob/e090d33d71cd98a6919e589f7ec66168216c94ba/assets/js/catalog.mjs#L85), líneas 85–88; el resumen está fuera del formulario en `proyectos.html:201`.

**Secuencia:** evaluar capacidad con valores sintéticos en datos publicados y seleccionar después referencias Leben. La reproducción bloqueó la API UF y toda salida externa; no representa una evaluación financiera vigente.

**Observado:** se ocultan el formulario y el botón, se suprimen escenarios y orden por compatibilidad, pero sigue visible «Evaluación de 131 proyectos… Orden por compatibilidad…». Preparado contiene 130 proyectos y cero escenarios financieros. Se confirmó en Tarjetas, Listado, Mapa y Lista + mapa.

**Impacto:** una evaluación calculada sobre otra capa conserva apariencia de vigencia y anuncia una ordenación que ya no se aplica.

**Corrección propuesta:** ocultar o invalidar también el resumen y estado de capacidad al pasar a preparado, restaurando el contexto correcto al volver a publicados. Limitar el ajuste a integración/presentación; no modificar fórmulas ni módulos financieros.

**Aceptación:** ningún mensaje publicado de evaluación/compatibilidad debe verse aplicado a referencias preparadas en ninguna de las cuatro vistas.

Evidencia: `reproducciones/ui-transition-review.mjs`, `evidencias/capacity-summary.json` y `evidencias/prepared-stale-capacity-summary.png`.

## F12-04 · P2 · La fuente solicitada se sustituye sin aviso visible al fallar su carga

Archivos: [catalog.mjs:109](https://github.com/lasopho/sollahms-web/blob/e090d33d71cd98a6919e589f7ec66168216c94ba/assets/js/catalog.mjs#L109), [catalog-filter-controls.mjs:86](https://github.com/lasopho/sollahms-web/blob/e090d33d71cd98a6919e589f7ec66168216c94ba/assets/js/catalog-filter-controls.mjs#L86), línea 89 y `proyectos.html:160`.

**Secuencia:** abrir `?q=Living+Town&evidencia=prepared` y fallar exclusivamente el GET de `commercial-filter-evidence-leben.json`.

**Observado:** se selecciona `published`, se elimina `evidencia` de la URL y se presenta el precio publicado UF 2.812. El aviso de error tiene texto, pero queda dentro de «Más filtros» cerrado; su visibilidad es false y el mensaje general de catálogo está oculto.

**Impacto:** el usuario recibe resultados de otra capa sin advertencia visible. Se pierde el contexto de fuente solicitado; el defecto no depende de considerar histórico o actual el precio publicado.

**Corrección propuesta:** mostrar el aviso fuera del panel colapsable o abrir/mostrar un estado de error al fallar una fuente explícitamente solicitada. La degradación del catálogo puede conservar navegación pública, pero debe ser perceptible y mantener trazabilidad del estado.

**Aceptación:** al fallar la misma petición debe existir un aviso visible y accesible; la sustitución de fuente no debe quedar oculta por el panel ni por la reescritura de URL.

Evidencia: `reproducciones/source-fallback-review.mjs`, `evidencias/source-fallback.json` y `evidencias/silent-published-fallback.png`.

## Preservación y comprobaciones sin hallazgo nuevo

- Los 454 IDs documentales, sus nueve atributos utilizables, fechas, fuentes y alcances coinciden con F9; las dieciséis referencias administrativas se mantienen separadas. Stock sigue en null.
- Se conservan los 277 tipos no documentados como null y las máscaras de conflicto. No se trasladaron precios a UI/planos ni superficies entre modelos para completar cotizaciones.
- Los veinte precios F4 y las distinciones Modelo 203/unidad 501 se preservan. Los adicionales Suecia UF 510 y UF 75 permanecen separados y no se suman al inmueble.
- Own publicado está expresamente etiquetado **Vendido**, tiene precio null y etapa educativa no elegible; preparado lo excluye. Su fila histórica publicada no se registró como un defecto de oferta activa.
- `data/proyectos.json`, las 131 fichas, precios publicados y direcciones conservan sus hashes protegidos. No se añadieron los seis registros históricos ni se restauró Patio Brasil.
- Tarjetas, listado, mapa y split siguen compartiendo resultados. F12-03 afecta el mensaje financiero común; los dos defectos del motor afectan cualquier vista que use la consulta preparada.
- El cambio de expectativa León refleja la regla autorizada de no unir un precio a baños/superficie no vinculados; no se clasificó como debilitamiento arbitrario de la prueba.

## Pruebas, límites y reproducción

F10 permanece certificado en sus escenarios: 84/84 Node, 16/16 Chrome, cinco anchos y cuatro vistas. No se repitieron esas suites ni el barrido responsive. Se prepararon sólo reproducciones nuevas de los cuatro defectos y una comprobación focalizada de Own que descartó ese supuesto fallo.

Los scripts de navegador abren su propio servidor en localhost:8766 y perfil temporal de Chrome, permiten sólo lecturas locales y bloquean API UF, fuentes/teselas externas y escrituras. Las capturas tienen fuentes externas bloqueadas y sirven de evidencia de estado. No hubo POST ni errores JavaScript; no se enviaron formularios reales. El reporte financiero completo se compactó para evitar repetir textos de los 130 proyectos; su SHA original queda conservado en la evidencia.

Para reproducir en el entorno local existente, con Node 24 y Playwright/Chrome disponibles:

```sh
node reproducciones/engine-review-repros.mjs
node reproducciones/ui-transition-review.mjs
node reproducciones/source-fallback-review.mjs
```

Los scripts apuntan al checkout técnico y escriben sólo bajo `/private/tmp/sollahms-fase12-repros`. No ejecutan generadores. No se certificó aquí un artefacto de release ni una publicación; los mecanismos históricos de empaquetado no se ejecutaron.

Los 313 pendientes documentales no cambian. No se generaron recepciones, hechos o cierres inmobiliarios. No se inició Euro ni se navegó Iris.

## Continuidad

Mantener PR #32 abierto en Draft y el HEAD `e090d33` sin cambios durante esta revisión. La corrección de F12-01 a F12-04 queda como siguiente etapa propuesta. Ready for Review, merge y publicación continúan sujetos a autorizaciones expresas. Resultado estructurado, fuentes y hashes de la evidencia: `RESULTADO-REVISION.json` y `MANIFIESTO-REVISION.json`.
