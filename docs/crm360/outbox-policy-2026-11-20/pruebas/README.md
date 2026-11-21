# Reproducción PostgreSQL y alcance

La suite de quince casos se conserva byte por byte como fue ejecutada el 20/11/2026. El layout `../base` y `../candidato` conserva sus entradas originales. `../../../..` conduce a la raíz del repositorio: el módulo candidato documental debe ser idéntico a `lib/crm-outbox-postgres.mjs`.

La ejecución ya documentada es PostgreSQL17.12 real, Node24.22.3 y pg8.16.3, con COMMIT y varias sesiones. No se repitió para publicar este PR. El laboratorio temporal fue eliminado; ningún comando de esta carpeta crea bases, roles o servicios.

Una reproducción futura requiere autorización nueva y una base aislada `crm360_test_sender_<sufijo>`, tabla Outbox inicialmente vacía/exclusiva y DDL revisado. La suite conserva su socket Unix literal/canónico/privado y `ssl:false`; rechaza TCP, variables PG*/DATABASE_URL y hooks Node heredados. El rol debe coincidir con session_user/current_user y tener propiedad de su tabla o la visibilidad admitida: se utilizó propietario no-superuser/no-BYPASSRLS, exclusivamente de laboratorio, nunca API/worker.

Deben aportarse explícitamente las referencias/ACK del arnés y las rutas canónicas del driver y de `../base/lib/crm-outbox-postgres.mjs`, `../candidato/lib/crm-outbox-postgres.mjs`, `../base/lib/crm-delivery.mjs`. Los ACK no conceden autorización. El arnés no instala dependencias, descubre contraseñas o `.env`, ni acepta una base compartida/Supabase de origen. Su after borra solo UUID propios con COMMIT y exige tabla vacía; una caída puede impedir ese after.

La medición adicional incluyó EXPLAIN ANALYZE real del DML, ROLLBACK, lote100, commits, progreso sano bajo lock y tres transacciones concurrentes. Los JSON adjuntos preservan el plan y las medidas. ROLLBACK no revierte el calentamiento de caché o todo el trabajo físico. El límite100 acota actualizadas, no escaneo/CPU. No hay SLA productivo certificado.

El caso08 recrea objeto/conexión; el09 usa receptor doble: no certifican reinicio del worker comercial ni ledger/contacto CRM real. Las pruebas separadas de TLS/control están identificadas en los recibos y no convierten los quince casos Unix en aceptación TLS. `recorded` es recepción, `review:true` requiere revisión; contacto creado se verifica por separado.

El unitario de opciones se conserva como antecedente y necesita `OUTBOX_SOURCE_ROOT` absoluto. No se volvió a ejecutar. Las suites y la hora del control no se ejecutan en CI por esta publicación; no se cambian workflows.
