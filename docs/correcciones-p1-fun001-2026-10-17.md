# FUN-001 — Contacto y agenda: idempotencia y resultado incierto

Fecha: 17-10-2026. Base auditada: `3866095`. Rama local: `fix/p1-idempotencia-20261017`.
Estado: **contacto corregido bajo el contrato nativo de Resend; agenda mitigada, con garantía distribuida bloqueada por el backend externo**.

## Evidencia y alcance

Corresponde exclusivamente a FUN-001 del informe maestro: contactos y reservas repetidos llegaban a proveedores simulados sin identificador de operación. No se había demostrado duplicación real en Calendar, cuyo código no está disponible. No se han creado reservas ni enviado correos reales durante este lote.

Se verificó la [documentación oficial de Resend](https://resend.com/docs/dashboard/emails/idempotency-keys), consultada el 17-10-2026: `Idempotency-Key` en `POST /emails`, retención de 24 horas, respuesta previa para la misma clave/payload, `409 concurrent_idempotent_requests` y `409 invalid_idempotent_request` para concurrencia y cambios de payload. Las pruebas reproducen ese contrato mediante un proveedor simulado; no certifican credenciales ni entrega real.

## Antes y después

| Caso | Antes | Después |
|---|---|---|
| Tres contactos repetidos | Tres aceptaciones simuladas independientes | Clave nativa compartida: una aceptación en el proveedor simulado, incluso entre dos handlers independientes |
| Respuesta de contacto perdida | Reintento sin identidad de operación | Misma clave y mismo cuerpo; respuesta previa o conflicto seguro sin segunda aceptación |
| Contacto hipotecario, avance del reloj | `simulatedAt` y recepción cambiaban al reenviar | Snapshot de tiempos del intento; la recepción volátil no altera el email keyed |
| UF cambia entre intentos | Sin política de repetición | Resend recibe la misma clave y rechaza el payload distinto con 409; se requiere verificar el resultado |
| Validación 400 después de un resultado incierto | La interfaz podía reiniciar el intento | Un reintento conserva su clave, incluso tras recarga; un 400 posterior no habilita una clave nueva |
| Dos reservas concurrentes, mismo proceso y clave | Dos llamadas simuladas | Una llamada y resultado compartido en un ledger local acotado |
| Reserva con respuesta perdida | La agenda invitaba a reintentar | La interfaz impide volver a crearla y pide verificar su resultado con el equipo; el proxy retiene el resultado incierto en ese proceso |
| Recarga de pestaña | Se perdía el estado del envío | Se conserva metadata en `sessionStorage`, sin nombre, correo, teléfono, RUT ni mensaje |
| Preview | Envíos bloqueados | Bloqueo conservado antes del proveedor |

## Límites deliberados

- Las claves nuevas caducan a las 23 horas desde su creación. La interfaz y el servidor impiden un nuevo intento de esa operación tras ese límite; no convierten una operación incierta en una nueva. La tolerancia de reloj del servidor es de 60 segundos y el ledger conserva resultados durante toda esa ventana, incluso con claves en mayúsculas.
- El almacenamiento de pestaña conserva clave opaca, SHA-256 de intención y tiempos de formulario. Ante almacenamiento bloqueado, corrupto o sin cuota, el envío no se inicia. Cerrar la pestaña, usar otro navegador o dispositivo no constituye una garantía de coordinación global.
- El contacto legacy sin cabecera mantiene el contrato JSON y recibe una clave derivada del contenido comercial. Consultas idénticas se consideran la misma operación durante la ventana de Resend de 24 horas; el cambio de tiempos/UF puede producir un conflicto seguro. Estos clientes no tienen el límite preventivo de 23 horas del protocolo nuevo: su garantía de reintento se limita a la retención nativa de Resend.
- Las reservas legacy sin cabecera conservan su payload y comportamiento anteriores; no se les atribuye deduplicación. El ledger de agenda es efímero, limitado a 1.000 operaciones por proceso, y rechaza nuevas operaciones si se llena. No sustituye almacenamiento distribuido. No elimina operaciones pendientes para admitir otras. Los controles temporales de disponibilidad siguen aplicándose: después de pasada la cita, la API rechaza el slot, en lugar de prometer replay local fuera de esa validación.
- El JSON enviado a Apps Script se conserva exactamente. Añadir `operationId` sin conocer su contrato podría romper el backend privado; la propagación se prepara documentalmente junto con la implementación externa y permanece bloqueada. Ninguna prueba local acredita atomicidad de Calendar entre procesos o reinicios. Una prueba explícita conserva visible ese límite: dos handlers independientes producen dos llamadas al backend simulado.
- Una oferta o formulario hipotecario que caduque mientras el resultado es incierto puede impedir confirmar mediante un reintento validado. Se conserva el identificador y se deriva la comprobación al equipo, sin regenerar un intento ni inventar vigencia financiera.

## Dependencia externa para completar FUN-001

Se necesita código/versionado y entorno aislado del Apps Script. El contrato propuesto debe aceptar un identificador estable de operación, vincularlo a un hash de payload, almacenar estado/resultado de forma durable y permitir consultar el estado tras timeout. La comprobación del slot y la creación deben ejecutarse bajo un lock compartido, con una sola invitación por operación. Debe definirse recuperación de una creación parcial, expiración y respuesta ante payload distinto. No se ha aplicado este contrato ni se ha modificado Calendar.

La aceptación pendiente exige demostrar dos POST concurrentes en instancias distintas → un evento/una invitación, y respuesta perdida → consulta/reintento de la misma operación, también tras reinicio. Hasta contar con ese backend, FUN-001 no puede declararse cerrado de extremo a extremo.

## Verificación

Se añadieron 31 casos Node: 27 de API/proveedor/ledger/metadata/alcance histórico, 3 simulaciones de la agenda real y 1 simulación de reintento hipotecario. El inventario de esta rama pasa de 330 a 361 casos públicos, sin retirar casos anteriores ni ejecutar los 26 privados. Los 137 casos Python de esta rama se conservan; otros lotes pueden añadir sus propios casos al consolidarse.

Se ajustaron los dobles DOM existentes para usar el helper real y respuestas conformes al contrato. El reloj de los helpers financieros del test de comparador ahora usa la fecha fija de su fixture: la fecha real 17-10-2026 había vencido una oferta histórica del test. No se cambió ninguna fecha, tasa ni oferta en los datos de la aplicación.

Las cinco fuentes existentes afectadas por FUN-001 se proyectan a `3866095` únicamente para auditorías históricas de preservación, tras comprobar sus hashes exactos antes/después. Dos pruebas negativas impiden que esa excepción acepte cambios ajenos. Las pruebas de comportamiento siempre ejecutan el código actual.

Logs y resultado reproducible del lote: `/workspace/sollahms-p1-2026-10-17/fun001/`. El resultado consolidado del CI se registra fuera del repositorio y debe revisarse junto con los demás lotes antes de integrar.

No se hicieron push, merge, Preview, Production, cambios de Vercel, dominios, DNS o credenciales. No se modificaron el diseño general ni datos comerciales. `vercel.json` y los controles de publicación permanecen intactos.
