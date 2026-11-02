# Recuperación CRM 360 y Sollahms — 2 de noviembre de 2026

## Estado vigente

La outbox PostgreSQL, receptor transaccional y conexión de los tres formularios están implementados y verificados con datos sintéticos. No repetir el plan inicial de este documento. Consultar [operación de la integración](OPERACION_INTEGRACION.md) y `docs/INTEGRACION_SOLLAHMS_PERSISTENTE_2026_11_02.md` en CRM.

La integración permanece desactivada por defecto y no está en producción. El CI Git local aprobó 424 Node y 216 Python; los 26 casos de publicación con materiales privados siguen pendientes. La siguiente validación es una Preview aislada autorizada, después de revisar accesos, secretos, roles y mapas de proyecto.

## Registro inicial (histórico)

## Estado recuperado

Main CRM continúa en f73f56d1e9bf9f6c99df45e53d600ec406705de3. Los avances posteriores se recuperaron desde la rama cloud, f0d865022c047dbc54d8a9e384cb574fc5acedbd, sin integrarla en main. Nueva rama: codex/sollahms-integracion-2026-11-02.

Sollahms se obtuvo del repositorio existente, main 86e200ec191b38af355061e21bc0fc1e549cce3b, rama codex/crm360-integracion-2026-11-02. Es un sitio estático con endpoints Node, sin package.json. Se conservaron Resend, el catálogo y vercel.json; no se alteraron los despliegues automáticos desactivados.

## Auditoría inicial y cambios

El CRM conserva clientes, oportunidades, DeepSales, Growth, agenda y cotizaciones. La documentación de octubre distingue las APIs duales preparadas del ejecutable SQLite habitual. No existe evidencia nueva de operación permanente ni de Supabase conectado.

Sollahms centraliza contactos en api/contact.mjs y reservas en api/booking-create.mjs. Contacto tiene idempotencia externa de Resend; reservas tienen un guard en memoria y dependen de un Apps Script privado cuyo contrato no se verificó. No se debe presentar el guard de reservas como cola persistente. Falta completar el inventario exhaustivo de formularios de portada, asesoría, fichas y páginas educativas.

Se implementó en CRM un contrato estricto de recepción Sollahms con HMAC-SHA256, límites de tamaño/antigüedad, validación de campos, identidad del origen y rechazo de organización/roles inyectados. La clave y la organización deben vincularse en el servidor. La atribución separa UTM de la URL y rechaza query/hash para evitar incorporar información personal accidental. El endpoint todavía no está montado; la firma no sustituye el ledger persistente de idempotencia.

La resolución de contactos normaliza correo/teléfono, conserva identidades ambiguas para revisión y no fusiona por nombre o por una coincidencia telefónica aislada. No escribe clientes ni reemplaza proyectos anteriores. El identificador público de proyecto todavía requiere un mapeo explícito al proyecto CRM de la organización.

Sollahms incorpora lib/crm-delivery.mjs: recepción solamente tras confirmación duradera del store inyectado; entrega firmada; timeout; reintento con la misma identidad; confirmación únicamente con recibo CRM coincidente y lease vigente. No hay conexión, temporizador, variables de credenciales ni activación implícita. El adaptador persistente sigue pendiente; las pruebas usan un doble de almacenamiento y no demuestran durabilidad real.

## Verificación de esta sesión

- Instalación CRM con pnpm 11.19.0 y lockfile congelado; cachés en /workspace y /tmp por restricciones de escritura del entorno.
- npm run check sobre la recuperación y las tres primeras pruebas nuevas: 394 aprobadas, TypeScript y build Vite correctos.
- Siete pruebas específicas nuevas de firma y resolución de identidad aprobadas. La regresión consolidada posterior se registra en la entrega.
- Sollahms: 21 aprobadas entre crm-delivery, contact y booking-form-idempotency. Transporte simulado; sin correos ni reservas reales.
- Los tres inventarios SQLite se reprodujeron, manteniendo 41 tablas ordinarias, 12 Growth y suplementos privados opcionales.
- No se repitieron aún PostgreSQL, navegador ni toda la suite Python/Sollahms. Los 102 PostgreSQL y cuatro escenarios de navegador pertenecen al informe de octubre, no a esta sesión.

Git HTTPS funciona en ambos repositorios. La consulta de Actions por REST devuelve Forbidden; no hay conectores de Vercel/Supabase/GitHub disponibles en las herramientas actuales, ni secretos o identidades cloud configurados. No se pudo auditar cuentas, desplegar una vista previa alojada ni verificar CI remoto. No se cambiaron políticas para sortearlo.

## Plan inicial — superado por la continuación persistente

1. Implementar y ensayar el store outbox PostgreSQL persistente, con fingerprint, unicidad por solicitud, claim con lease/fencing, backoff limitado, dead letters y recuperación tras reinicio. No usar SQLite efímero en Vercel.
2. Implementar la recepción transaccional CRM: ledger, resolución de identidad dentro de la organización, solicitud/interés por proyecto sin sobrescribir anteriores, caso ambiguo, historial, aviso interno y seguimiento. Confirmar recorded solamente después del commit.
3. Integrar ambos extremos con pruebas HTTP sintéticas que consulten el estado real de la base, cubriendo concurrencia, respuesta perdida, replay y recuperación; agregar contratos PostgreSQL/SQLite donde corresponda.
4. Inventariar todos los formularios y preparar la conexión opcional del servidor a la outbox. Preservar Resend y el contrato privado de reservas; no confirmar recepción CRM por éxito del correo.
5. Completar los puertos HTTP pendientes y composición PostgreSQL documentados en el informe de octubre; ejecutar navegador con ambos motores y todas las regresiones pertinentes.
6. Preparar artefacto de preview con almacenamiento persistente, secretos y Auth independientes. La autorización para servicios reales, costos o producción se solicita solo tras presentar un resultado revisable.

Esta es una entrega incremental de recuperación y contratos, no la finalización del proyecto ni una integración operativa. No se accedió a bases privadas ni se enviaron comunicaciones.
