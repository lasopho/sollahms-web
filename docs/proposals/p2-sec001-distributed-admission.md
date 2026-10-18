# SEC-001 — Control de abuso distribuido pendiente de configuración

Fecha: 17 de octubre de 2026. Estado: **propuesta, sin activar controles ni servicios**.

El código público continúa sin una cuota persistente verificable. Honeypot,
validación, temporizador opcional y deduplicación P1 cumplen propósitos distintos
y no se presentan como una cuota distribuida. El anterior `404 / Seawall Config
not found` al consultar WAF no demuestra que Vercel carezca de mitigaciones
externas. No se repite la consulta sin nueva capacidad o evidencia.

## Decisiones externas necesarias

| Decisión | Información pendiente |
| --- | --- |
| Protección existente | Lectura autorizada de la política efectiva de tráfico/WAF y alcance por ruta; no secretos. |
| Cuotas | Límites globales y por origen, ventanas, tolerancia a ráfagas y tratamiento de redes compartidas. No se inventan valores. |
| Servicio | Almacén o servicio distribuido con operación atómica entre instancias/regiones, caducidad y presupuesto aceptado. |
| Identificación | Cabecera de dirección validada por la plataforma; confianza exacta de proxy. No aceptar direcciones declaradas por el cliente. |
| Privacidad | Finalidad, retención y acceso a las métricas; usar identificadores seudonimizados y no guardar cuerpos, RUT, correo ni teléfono en contadores. |
| Desafío, si corresponde | Proveedor, reglas progresivas, accesibilidad y alternativa para un usuario legítimo. |
| Operación | Responsable, métricas sin datos personales, alertas y procedimiento de reversión autorizado. |

## Contrato propuesto para implementación

Inyectar un adaptador de admisión en las fábricas existentes de contacto y
reservas; mantener el contrato HTTP de los formularios y los cuerpos actuales
para Resend/Apps Script. Revisar la consulta de disponibilidad por separado para
que no permita eludir una cuota global del backend. No cambiar Calendar desde
esta propuesta.

Tras validar método, tamaño, estructura y datos, y después de la barrera de
Preview, el adaptador decide **antes de consultar UF, enviar correo o invocar
Google**. Al integrar, revisar el orden de la validación hipotecaria: actualmente
puede resolver UF antes de llegar al envío. No introducir llamadas externas para
solicitudes rechazadas. Las peticiones inválidas también necesitan una defensa
de borde; el adaptador de efectos no sustituye esa protección.

Entrada conceptual del adaptador:

```text
admit({ route, trustedTrafficKey, operationDigest, observedAt })
  -> { kind: "allowed", receipt }
   | { kind: "limited", retryAfterSeconds }
   | { kind: "unavailable" }
```

`trustedTrafficKey` se obtiene en servidor a partir del origen de tráfico
validado, con seudonimización y retención definidas antes de activar. Ni `Origin`
ni una clave de operación son identidad de usuario ni barrera antispam. No enviar
información personal al contador. No crear secretos o credenciales como parte de
este lote.

El servicio debe comprobar y consumir las cuotas global y por origen en **una
operación atómica**; un `GET` seguido de `SET` o un `Map` por proceso no cumple.
La operación debe tener caducidad y semántica explícita ante errores de red. Las
solicitudes concurrentes en instancias diferentes deben observar el mismo cupo.
Distinguir el coste de recibir intentos del coste de iniciar efectos: los
reintentos de una misma operación no deben duplicar un correo/reserva, pero una
misma clave tampoco debe permitir intentos ilimitados contra el proxy. La
atomicidad de las reservas en Calendar continúa siendo un bloqueo independiente
P1 del backend privado, incluso con una cuota distribuida.

Una denegación responde `429`, JSON genérico con `code: "rate_limited"`,
`Cache-Control: no-store` y `Retry-After` expresado como entero positivo validado.
No devolver direcciones, claves, tamaño del cupo ni el estado de otro usuario.
Si el almacén no puede decidir, responder `503` antes del proveedor. No descartar
la clave idempotente del navegador: preservar la recuperación segura tras una
respuesta perdida. Antes de habilitar, verificar las ramas `429/503` de ambos
formularios y sus mensajes, sin generar reservas o correos reales.

## Matriz de aceptación obligatoria para la implementación

| Simulación con proveedores falsos | Resultado necesario |
| --- | --- |
| Envío válido dentro de cuota | Flujo actual completo; un único efecto lógico. |
| Primer exceso por origen | `429` y `Retry-After`; cero accesos a Resend/Google/UF. |
| Cuota global agotada desde otro origen | Misma denegación, sin revelar cupos. |
| Concurrencia desde dos fábricas/instancias | El almacén compartido admite exactamente el cupo configurado; ningún sobrepaso por carrera. |
| Reintento simultáneo o respuesta perdida | La política de cuota e idempotencia no duplica efectos ni renueva operación a ciegas. |
| Vencimiento de ventana y reloj inválido | Recuperación según reloj servidor/TTL; entrada del cliente no adelanta el cupo. |
| Cabecera de IP falsificada o `Origin` ausente | No elude el límite; identidad depende sólo de la cadena de confianza verificada. |
| Almacén lento, error o resultado malformado | `503`; cero efectos y cero datos personales en error/log. |
| Honeypot, cuerpo inválido o Preview | Mantener comportamiento existente, sin contactos reales. |
| Redes compartidas y accesibilidad | Usuarios legítimos pueden completar el flujo bajo las cuotas aprobadas. |

Estas pruebas todavía **no están ejecutadas** porque no existe una implementación
ni una configuración distribuida seleccionada. Las simulaciones P1 existentes
siguen siendo comprobaciones de formularios e idempotencia, no una certificación
antispam. SEC-001 permanece abierto hasta completar las decisiones, implementar
y verificar el adaptador y autorizar por separado cualquier activación externa.
