# Incidencia del arnés de control, reconciliada

Esta incidencia pertenece al arnés local separado del control global CRM, **no** a `lib/crm-outbox-postgres.mjs` ni a la suite Outbox15. Los once casos funcionales de control aprobaron, pero su proceso terminó con **código1**, `accepted:false` y `markerCleanupConfirmed:false`. Esos valores se conservan en [el recibo original sanitizado](evidencia/CONTROL_POSTGRES_CASOS.json); no se presentan como PASS integral.

El DELETE de cierre recibió `[...markers]` como diez parámetros cuando esperaba un único `uuid[]`. El log local confirmó el mensaje «bind message supplies10parameters; statement requires1»; el SQLSTATE no fue capturado en esa corrida. No se infiere que hubo borrado parcial: la sentencia se rechazó por su ligadura de parámetros.

El código ejecutado se archivó localmente con su SHA-256. La versión futura del arnés quedó corregida a `[[...markers]]`, con registro del código de error de limpieza; pasó sintaxis, **no se volvió a ejecutar la suite**. Los digests del ejecutado y del corregido figuran en procedencia; no se publican el bootstrap ni código ajeno al alcance Outbox.

Mediante lecturas acotadas se vincularon los cinco marcadores restantes con los pilotos/roles sintéticos registrados. Una operación separada los borró por UUID y piloto explícitos, confirmó COMMIT y verificó desde otra conexión **0 marcadores, 0 pilotos abiertos y 0 filas Outbox**. No se resetearon contadores ni reabrieron terminales. [Recibo reconciliado](evidencia/LIMPIEZA_RECONCILIADA.json).

Luego se detuvo el PostgreSQL propio y su guardia, se comprobó el puerto sin listener y se eliminó el directorio completo con ambas bases, roles, certificados, claves de prueba, driver y binarios, dentro de90min. Solo se publican recibos sintéticos sanitizados; no dumps ni secretos. [Cierre](evidencia/LABORATORIO_CIERRE.json).
