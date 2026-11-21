# Outbox: recuperación al cambiar la política de intentos

Dependencia: [PR13](https://github.com/lasopho/sollahms-web/pull/13), rama `codex/crm360-integracion-2026-11-02`, SHA `137dc93739a94c911e42193b66ddddc584b83085`. Este PR Draft se dirige a esa rama; no modifica el PR13 ni main. Publicación autorizada por el propietario después del laboratorio del20/11/2026. No autoriza fusión o despliegue.

Con ocho intentos y máximo12, una solicitud puede quedar `pending`. Al bajar el máximo a5, antes quedaba pendiente e inelegible. Ahora `claim()` terminaliza agotadas con `attempts >= maxAttempts` en pending o lease vencida, sin resetear historia, UUID o fingerprint ni tocar leases activas. Usa un único lote por llamada: **32 por defecto, entero1..100**, orden por antigüedad/UUID y `FOR UPDATE SKIP LOCKED`, antes del claim sano existente. `failed`/`recorded` no se reabren automáticamente.

El único módulo de aplicación cambiado es `lib/crm-outbox-postgres.mjs`. Delivery, HMAC, endpoint, runtime, formularios, DDL e índices se conservan. La copia `candidato/` sirve como entrada histórica exacta del arnés, no como otro producto o candidato cloud. [Parche completo](endurecimiento-outbox.diff). La [propuesta original](OUTBOX_POLICY_ANTECEDENTE.md) se conserva explícitamente como antecedente, cuyos estados de no-ejecución describen su fecha original.

## Evidencia ejecutada, sin repetirla para publicar

| Evidencia | Resultado y límite |
| --- | --- |
| [Suite PostgreSQL](evidencia/OUTBOX_15.tap) | **15/15**, PostgreSQL17.12, Node24.22.3, pg8.16.3, commits/sesiones reales. Igualdad/exceso, reducción/aumento, históricos, leases activas/vencidas, SKIP LOCKED, concurrencia, fencing y terminales. |
| [Disponibilidad](evidencia/OUTBOX_DISPONIBILIDAD.json) | 102 agotadas+1 sana; progresión100/2/0; sana avanza y confirma antes de liberar otra fila bloqueada. EXPLAIN servidor2.716ms, cliente4.363ms; claim sano bajo lock0.744ms, muestras del laboratorio. |
| [Máximo concurrente](evidencia/OUTBOX_CONCURRENCIA_MAX.json) | Tres transacciones retenidas, lote100: reparto observado0/2/100, unión disjunta102 y un propietario sano. No es una distribución prometida para otra carga. |
| Unitarios históricos | Cuatro contratos delivery, uno de almacenamiento incierto y uno de opciones; TAP conservados, **no reejecutados**. No sustituyen PostgreSQL. |
| [Incidencia de cierre](INCIDENTE_LIMPIEZA.md) | Arnés separado de control: once casos funcionales positivos, salida original1 por parámetro de limpieza; reconciliación separada y laboratorio eliminado. No se oculta el fallo ni se repiten casos. |

El lote limita **actualizadas**, no filas examinadas, sorting, CPU o todos los locks. El plan adjunto muestra scans y loops más allá del tamaño del lote; el número global de filas únicas examinadas permanece `null`. Estas mediciones no aceptan un SLA o escala productiva. No se agregan índices, extensiones o privilegios para favorecerlas.

Los workers deben drenar la política anterior y reiniciar con un máximo uniforme: el parche no versiona la política por fila ni sincroniza configuraciones diferentes. Un retry anterior intercalado entre las dos sentencias puede requerir el siguiente tick. No vaciar backlog con un loop masivo ni considerar `idle` como limpieza completa. Leases activas y resultados inciertos requieren conciliación; ningún redrive/reset automático está autorizado.

`recorded` acredita registro de solicitud; `review:true` exige revisión y **no confirma contacto creado**. El caso09 conserva un receptor doble; ledger/contacto CRM real, worker comercial completo e integración alojada siguen pendientes. El servidor reiniciado en la evidencia de control fue local y propio, no restauración fría ni medición RPO/RTO.

## Publicación sin ejecución

El primer commit visible de `codex/outbox-policy-pg17-2026-11-20` añade únicamente su entrada `git.deploymentEnabled=false` a `vercel.json`. Todas las entradas, headers, redirects y configuración existentes se conservan. Se usa el mecanismo documentado de [Vercel](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled); no se cambian settings, SSO, presupuestos o dominios del proyecto Sollahms. La rama/base del PR no coinciden con los filtros del workflow existente; no se modifica CI ni se solicitan suites históricas.

No se ejecutan SQL ni instalaciones en esta publicación. El laboratorio de72min23s ya fue eliminado. US$0 incremental; sin despliegues, servicios nuevos, credenciales operativas, usuarios reales, fusión o cambios de producción. **060 bloqueada**, v2 congelada y diez migraciones intactas. La publicación Draft permite revisar el parche; no es autorización de promoción.

[Admisión y reproducción futura](pruebas/README.md). [Procedencia e integridad](evidencia/PROCEDENCIA.json). Los alias públicos de UUID/PID/roles conservan correspondencia y los valores de medidas/resultados; no son referencias ejecutables. El campo `pr_published:false` del resumen de laboratorio corresponde al cierre anterior a este PR, no al estado de esta publicación.
