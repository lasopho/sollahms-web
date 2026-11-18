# Proyecciones públicas de cotizaciones existentes — 17/11/2026

El corte local [`3082a859fd4b0600478a4b8a7d14cff16067853b`](https://github.com/lasopho/sollahms-web/commit/3082a859fd4b0600478a4b8a7d14cff16067853b), con padre único `cb3597102e63f02356cca00cd3612f9afc77afcb` y rama `codex/proyecciones-publicas-cotizaciones-20261117`, corrige el recurso que podían solicitar los consumidores de cotizaciones. Las nuevas proyecciones públicas conservan 21 precios Euro en 11 de sus 12 identidades y 17 precios Nollagam en siete identidades. Diagonal conserva precios vacíos y mínimo nulo; las cinco categorías Nollagam sin precio siguen desconocidas. Fechas, autoridad y prueba SHA del original se conservan por separado del recurso público. No hay hechos, importes owner ni cierres de los 313 IDs nuevos.

Se archivan copias byte a byte de los recibos y logs, los dos JSON públicos extraídos directamente del commit, el patch exacto de ocho archivos frente a CB y sus ocho hashes de blob Git/SHA256. El delta contiene dos módulos, dos JSON públicos, tres pruebas y sólo la exclusión `false` de la nueva rama en `vercel.json`. El certificado de raíz reutilizado en `PRESERVACION-RAIZ.json` registra 155 archivos protegidos y 21 fuentes originales intactos; los ocho blobs se contrastaron con ese recibo al archivarlos. Esta tarea no repite la comprobación de los 155 o las 21 fuentes.

| Ejecución pertinente | Resultado final | Alcance del contador |
| --- | ---: | --- |
| Euro | 49/49 | Incluye sus 42 casos previos y siete nuevos; no sumar 49+42. |
| Nollagam consumidor | 19/19 | Incluye los 14 casos retargeteados y cinco nuevos; no sumar 19+14. |
| Nollagam integración | 23/23 | Pasada de raíz con el nuevo fixture público. |

Los tres cortes se mantienen separados; no se suman a 112/83 ni equivalen a certificación comercial global de 131 proyectos. El log Euro previo 48/49 se conserva: la expectativa nueva invirtió el orden alfabético de `projectionKind` y `projects`; se corrigió esa expectativa y la pasada final fue 49/49. Ese antecedente es un error del harness, no un defecto de la aplicación.

La revisión independiente por lectura de fuente/código no dejó bloqueantes: Euro fue leído por `documentary_contract_review` y Nollagam por `global_scope_inventory`, con revisión de ambos por raíz. Se conservaron los valores y los guards de identidad, matching, desconocidos y scope. Esta actividad documental no ejecutó las pruebas ni creó un informe técnico nuevo.

Los originales `data/euro-commercial.json` y `data/nollagam-commercial.json` son privados y no deben añadirse a ningún artefacto público. El output anterior `/private/tmp/sollahms-pr33-release-20261117/stage/.vercel/output`, que incluía los originales raw, queda en cuarentena documental: no desplegarlo ni usarlo como fuente de un paquete nuevo. Se conserva únicamente como antecedente; esta tarea no mueve ni altera ese output. Los fixtures documentales siguen exclusivos de la revisión local y no se exportan.

Al corte certificado por raíz, PR33 está fusionado en CB; su fuente C56 local/remota se conserva y producción continúa en 9e. La rama local 3082 aún no tiene primer push, nuevo PR, deployment ni publicación. Este expediente no incorpora controles Chrome, QA de paquete ni un recibo de paquete nuevo; raíz los añadirá en un corte posterior. Ningún permiso futuro se deduce de esta documentación.

Ver `RECIBO-DOCUMENTAL.json`, `MANIFIESTO-ARCHIVOS.json` y `CB-a-3082.patch` para trazabilidad exacta. Las fechas UTC de los recibos alcanzan el 18/11; corresponden al 17/11 en Santiago.
