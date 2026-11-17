# Revisión independiente final del PR #32

Fecha: 17/11/2026. Dictamen: **APROBADO CON OBSERVACIONES**. Los cuatro defectos F12 están resueltos; no se identificaron defectos bloqueantes nuevos en el delta revisado. El PR está técnicamente preparado para solicitar autorización del siguiente paso cuando corresponda. Durante esta revisión no se solicitó aprobación ni se cambió su estado.

## Referencias verificadas

- PR [#32](https://github.com/lasopho/sollahms-web/pull/32), abierto en Draft, sin merge.
- Head local/remoto: `165f918aba402a0eb3313c85e144af2b4a7e8651`.
- Base: `codex/footer-sin-frase-20261116`, `daf16e7dd560301029357ce79a7af0b0e9a7e67b`.
- Delta revisado: `e090d33d71cd98a6919e589f7ec66168216c94ba → 165f918aba402a0eb3313c85e144af2b4a7e8651`, cinco archivos. El PR completo incluye diecisiete.
- Producción: `b761ddeaea2fa526870e6af25658046e31b571d7`, deployment `dpl_9b2Fp33LqsL5NuB2p7JLdxx9t9gu`, READY/production. Los veinte IDs de deployments consultados coinciden con el registro previo; no se observaron deployments nuevos.
- Main remoto: `86e200ec191b38af355061e21bc0fc1e549cce3b`. No fue modificado. Exclusión de la rama técnica en `vercel.json:8` conservada.

## Método y evidencia

Dos revisores independientes inspeccionaron por separado motor/etiquetas y UI/avisos, comparando los defectos F12, el código corregido y la evidencia F13. No editaron código o pruebas. Los cinco archivos del delta y los diecisiete del PR coinciden con el manifiesto F13. Sus once artefactos documentales coincidían antes de actualizar el punto de continuidad; el NEXT histórico se conserva en el commit documental `0b9d2a36e89077ee0a11a97ef7026593be636a27`. Los 155 archivos protegidos coinciden con la certificación F10.

| Hallazgo | Dictamen | Evidencia y alcance |
| --- | --- | --- |
| F12-01 | Resuelto | `commercial-filter-engine.mjs:114–129`: amenities elegibles por referencia y uso acreditado; Indi local UF 8.560 + gimnasio excluido. AND/OR y desconocidos conservados. Pruebas de regresión en `tests/commercial-filter-engine.test.mjs:123`, `:142` y `:161`; `evidencias/engine-after.jsonl` F13. |
| F12-02 | Resuelto | Motor `:128` y `:170`: etiquetas españolas de amenities elegibles en la misma referencia. Living Town piscina/gimnasio/quincho/lavandería conservan OWN4-P001; salón multiuso no acreditado se rechaza. Pruebas `:172`, `:186` y `evidencias/spanish-labels-real-reference.json` F13. |
| F12-03 | Resuelto | `catalog.mjs:87`: resumen oculto en preparado y restaurado en publicados. Reporte F13 registra las cuatro transiciones/vistas y texto restaurado idéntico; `tests/commercial-filter-fase13-browser.mjs:57`. Módulos financieros intactos. |
| F12-04 | Resuelto | `proyectos.html:177`: aviso fuera de ambos paneles, `role=status` y `aria-live=polite`. `catalog.mjs:110` identifica el respaldo publicado. Reporte y prueba Chrome F13 `:80`, `:95` conservan visibilidad tras normalizar URL y con paneles cerrados. |

Los detalles estructurados y rutas verificables constan en [RESULTADO-REVISION-PR32.json](RESULTADO-REVISION-PR32.json); la lectura de servicios en [VERIFICACION-REMOTA.json](VERIFICACION-REMOTA.json). Los rangos en la tabla son referencias documentales, no pruebas nuevas.

## Pruebas aceptadas y observaciones

Se aceptan 57/57 Node del motor y 10/10 Node de filtros de F13 (67 pruebas afectadas), junto con 6/6 controles Chrome nuevos. Los cinco grupos nuevos son un subconjunto de las 57 pruebas; no se suman otra vez. F10 84/84 Node, 16/16 Chrome, cinco anchos y cuatro vistas siguen siendo evidencia histórica. No se ejecutaron nuevamente estas suites. No se generaron builds ni deployments.

GitHub devuelve cero reviews, comentarios, hilos, estados, Check Runs y workflow runs para las consultas realizadas. Eso no constituye aprobación ni CI aprobado. El registro F13 no conserva stdout bruto de Node; sí sus comandos, conteos registrados y hashes, más el reporte y log Chrome. La comprobación móvil F13 es puntual (390 px), sin nueva certificación de los cinco anchos. Estas limitaciones son observaciones y no defectos encontrados en las cuatro correcciones.

## Preservación y continuidad

No hubo cambios de código, pruebas, fichas, precios publicados, direcciones, siete funciones, Contacto, Centro de Orientación, formularios, CRM360, AI Lab, Resend o módulos financieros. Las 131 fichas y los 155 protegidos permanecen intactos. Las 454 referencias documentales no son stock; los dos adicionales Suecia siguen separados. Los 313 pendientes históricos no se alteraron. No se incorporaron los seis registros de la aplicación histórica ni se restauró Patio Brasil.

El PR continúa en Draft. No se añadieron comentarios, no se resolvieron hilos, no hubo Ready, merge, promoción, publicación, cambios de dominios, SSO o variables. Ready, merge y publicación requieren permisos separados. La continuación autorizada del objetivo general está en [CONTROL-DE-AVANCE.md](../../../objetivo-principal-asset-portafolio/CONTROL-DE-AVANCE.md) y en el NEXT-PROMPT raíz; la nueva instrucción del propietario permite investigar Euro y las otras inmobiliarias sin volver a auditar Leben.
