# Fase 13 — correcciones de F12-01 a F12-04

**Los cuatro defectos están corregidos y probados.** No quedan correcciones parciales o pendientes dentro de este encargo. PR [#32](https://github.com/lasopho/sollahms-web/pull/32) permanece abierto en Draft; no se solicita ni se registra aprobación, Ready for Review, merge o publicación.

Repositorio `lasopho/sollahms-web`. Commit único de corrección: `165f918aba402a0eb3313c85e144af2b4a7e8651`, descendiente de `e090d33d71cd98a6919e589f7ec66168216c94ba`, sincronizado en `codex/filtros-comerciales-fase10-20261117`. Base del PR sin cambios: `codex/footer-sin-frase-20261116`, `daf16e7dd560301029357ce79a7af0b0e9a7e67b`. Producción y merge-base: `b761ddeaea2fa526870e6af25658046e31b571d7`.

## Resultado por defecto

| ID | Estado | Cambio y evidencia |
|---|---|---|
| F12-01 | Corregido y probado | Cada referencia debe respaldar el uso y alcance del amenity. Indi UF8560 + gimnasio excluye el local con y sin tipo explícito. |
| F12-02 | Corregido y probado | El índice de texto reutiliza etiquetas e IDs públicos españoles, sólo de amenities elegibles para la misma referencia. |
| F12-03 | Corregido y probado | El resumen de capacidad se oculta en preparado y se restaura al volver a publicados, en las cuatro vistas. |
| F12-04 | Corregido y probado | El aviso existente permanece fuera de ambos paneles colapsables, con estado accesible y explicación del respaldo publicado. |

### F12-01: alcance por referencia

[commercial-filter-engine.mjs](https://github.com/lasopho/sollahms-web/blob/165f918aba402a0eb3313c85e144af2b4a7e8651/assets/js/commercial-filter-engine.mjs) determina elegibilidad desde el tipo/uso de cada candidato y la evidencia de alcance. Un uso desconocido no se convierte en residencial. Alcances explícitos universal, comercial, residencial y por tipo de propiedad mantienen sus coincidencias válidas. Selecciones OR y Debe incluir todas se comprueban contra un mismo testigo, igual que el precio y las palabras buscadas.

Antes, `OWN4-P011` pasaba UF8560 + gimnasio al omitir tipo; después se excluye en evaluador directo y wrapper, tanto implícito como Local/Comercial. Los casos positivos con alcance suficiente siguen pasando. El precio+D sin amenity conserva la cotización `OWN4-P012` de uso desconocido; una existencia administrativa de departamento no le presta tipo ni amenities.

### F12-02: etiquetas públicas en español

El motor reutiliza `AMENITY_KEY_MAP` y `AMENITY_LABELS` del módulo existente, sin editar el adaptador, taxonomía ni JSON documental. Conserva el alias previo de terraza y compatibilidad con claves técnicas. Texto y checkbox aplican el mismo alcance por referencia; las palabras no se satisfacen juntando diferentes candidatos.

Living Town ahora coincide con piscina. Además se confirmaron gimnasio, quincho, lavandería y áreas verdes junto con UF3949 y 1D/1B: todos mantienen el testigo `OWN4-P001`. Salón multiuso sin confirmación no coincide. Las pruebas sintéticas cubren las etiquetas compartidas, acentos, false/null, alcance y testigos separados.

### F12-03: contexto financiero por fuente

[catalog.mjs](https://github.com/lasopho/sollahms-web/blob/165f918aba402a0eb3313c85e144af2b4a7e8651/assets/js/catalog.mjs) sólo añade la visibilidad del resumen según el modo. No cambia fórmulas, módulos, valores de entrada ni evaluación. Al pasar a preparado se oculta el resumen y siguen suprimidos los escenarios y orden de compatibilidad publicados. Al regresar a publicados reaparece el mismo resumen y se conserva la capacidad de reabrir el formulario con sus valores sintéticos.

Se verificó la transición publicados → preparados → publicados en Tarjetas, Listado, Mapa y Lista + mapa. Preparado tiene 130 proyectos, cero escenarios y resumen oculto; publicados restaura 131 y el contexto previo. El mapa conserva sus resultados sin inventar escenarios en tarjetas ausentes de esa vista.

### F12-04: aviso visible y accesible

En [proyectos.html](https://github.com/lasopho/sollahms-web/blob/165f918aba402a0eb3313c85e144af2b4a7e8651/proyectos.html) se mueve el mismo nodo `advanced-data-status` fuera de ambos details y se añaden `role=status` y `aria-live=polite`. Esta mínima modificación HTML es necesaria para mantener el aviso visible al cerrar filtros. `catalog.mjs` explica que se muestran datos publicados. `catalog-filter-controls.mjs` no cambia.

El fallo exclusivo del GET preparado deja un aviso visible después de normalizar la URL, cerrar los paneles, cambiar de vista y limpiar filtros. Se comprobó también a 390 px, por ser relevante para el panel móvil. El modo preparado queda deshabilitado mientras su fuente no está disponible; el respaldo permite navegar el catálogo publicado sin ocultar la sustitución.

## Evidencia antes y después

El antes se conserva íntegro en el expediente F12 fijado en el commit documental `0b6ab0bd04565d73d9621c5d5b73fad0035d8251`: `engine-results.jsonl`, `capacity-summary.json` y `source-fallback.json`. Sus rutas y SHA-256 se incluyen en `PRUEBAS-REGRESION-FASE13.json` y `RESULTADO-F12-01-04.json`.

El después está en `evidencias/engine-after.jsonl`, `spanish-labels-real-reference.json`, `browser-report.json`, `browser-checks.log` y dos capturas. La reproducción de motor original de F12 se ejecutó sin modificarla contra el código corregido. No se copiaron de nuevo las evidencias antiguas ni se generó otra auditoría.

## Regresiones ejecutadas

- Motor por referencia: **57/57 Node**, 52 grupos previos y cinco regresiones nuevas. Se hizo explícito departamento en una fixture positiva antigua; se conservaron sus expectativas y se añadieron negativos independientes para uso desconocido. No se relajó la regla para hacer pasar datos desconocidos.
- Filtros vigentes afectados: **10/10 Node**. Total Node de estas dos ejecuciones: **67/67**, sin sumar dos veces los cinco grupos nuevos.
- Navegador focalizado: **6/6 Chrome**: cuatro transiciones completas de vista, respaldo visible y ausencia de errores/escrituras. Servidor local cerrado al terminar.
- Seis consultas adicionales controladas comprueban etiquetas españolas sobre la cotización real de Living Town y rechazo de una característica no acreditada. No se suman al contador de suites.
- Revisión independiente de diff y pruebas: sin hallazgos nuevos; los cinco grupos nuevos del motor pasaron también de forma dirigida. Esa repetición independiente es subconjunto de 57, no cinco pruebas adicionales al total.

Las suites completas F10 de 84 Node y 16 Chrome, junto con sus cinco anchos, quedan como certificación histórica y no se repitieron. Se ejecutaron únicamente regresiones afectadas. La API UF, red externa y escrituras estuvieron bloqueadas; los valores financieros fueron sintéticos y no certifican una UF vigente ni compatibilidad bancaria.

Para reproducir desde el checkout técnico, con Node24/Playwright/Chrome disponibles:

```sh
node --test tests/commercial-filter-engine.test.mjs
node --test tests/catalog-filters.test.mjs
node tests/commercial-filter-fase13-browser.mjs
```

La última prueba admite `F13_BROWSER_OUTPUT` y `F13_CHROME_PATH`, abre un servidor localhost efímero y lo cierra. Los resultados y comandos están fijados en `PRUEBAS-REGRESION-FASE13.json`. La salida Node de los ejecutores no se conservó como log de texto; sus resultados observados, exit codes, comandos y hashes de prueba quedan registrados. La evidencia posterior de aceptación y el log de navegador sí se conservan.

## Alcance y preservación

Sólo cinco archivos cambiaron respecto de e090d33: motor comercial, integración de catálogo, una reubicación del aviso en HTML, pruebas del motor y una prueba de navegador nueva. El PR completo tiene ahora diecisiete archivos; su base no cambió y no se reescribió historial.

Los 155 hashes protegidos coinciden con F10: 131 fichas, datos/precios/direcciones, marca y módulos protegidos. Los árboles API/lib y Contacto/Centro de Orientación permanecen iguales. No se editaron datos comerciales para forzar resultados, funciones serverless, módulos financieros, formularios, Resend, CRM360 o AI Lab. `vercel.json` conserva la exclusión de la rama y su hash F11.

Los 454 documentos no representan stock; los veinte precios y dos adicionales Suecia siguen separados. Los 313 pendientes no cambian. No se incorporan seis registros históricos ni Patio Brasil, y no se inicia Euro.

## Sincronización y continuidad

El remoto técnico coincide con `165f918aba402a0eb3313c85e144af2b4a7e8651` y PR32 continúa Draft, abierto y sin merge. Producción sigue en `dpl_9b2Fp33LqsL5NuB2p7JLdxx9t9gu`, SHA b761dde; el conjunto reciente de deployments no añadió entradas. No se modificaron main, dominios, SSO o variables y no se ejecutaron generadores o deployments.

La documentación se mantiene en su rama independiente. Se propone revisar el cierre de estas cuatro correcciones antes de solicitar aprobación del PR. Ready for Review, merge y publicación continúan fuera de la autorización vigente.
