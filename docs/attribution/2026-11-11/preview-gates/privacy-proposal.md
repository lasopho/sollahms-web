# Propuesta mínima de transparencia — NO PUBLICADA

Fecha: 2026-11-11. Fuente revisada: `privacidad.html`, versión publicada «26 de octubre de 2026», preservada en el commit `6d818f38a26e21e7e5a7a518fb986aa962111f8c`.

Es una propuesta técnica para decisión humana, no un dictamen jurídico. No se modificaron `privacidad.html`, los consentimientos, checkboxes ni banners.

## Hallazgo técnico

La política describe formularios, proveedores, conservación por finalidad, el almacenamiento temporal del escenario hipotecario y la ausencia de perfiles de marketing. No describe aún el nuevo registro temporal de adquisición ni sus campos. El almacenamiento del escenario por cinco minutos no debe confundirse con el de adquisición: tienen finalidades, claves y duración distintas.

| Dato | Momento y alcance |
| --- | --- |
| `landing_path` | Primera página de la sesión, solo ruta normalizada, sin parámetros arbitrarios ni fragmentos. |
| `referrer_origin` | Solo origen HTTP(S) externo inicial que entrega el navegador; ruta/query/fragmento descartados. Ausencia = `null`, nunca «directo». |
| Cinco UTM | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, si son válidas; primera entrada conservada. |
| `gclid`, `msclkid` | Identificadores de clic opcionales y acotados, cuando existen; este mecanismo no los remite a Google/Microsoft. |
| `captured_at` | Momento declarado por el navegador de la captura inicial. |
| `request_id` | UUID técnico cuando se prepara una operación de formulario; no identifica a un visitante entre sesiones. |
| `submission_path` | Página desde la que se prepara el envío. |

La adquisición inicial se almacena en `sessionStorage["sollahms:acquisition:v1"]`. La operación pendiente conserva también su UUID y contexto para evitar duplicaciones al reintentar. No contiene correo, RUT, teléfono ni mensaje. El objeto de adquisición se incorpora a la solicitud cuando se envía un formulario; no hay petición de captura, píxel o beacon independiente. En el preview, el guard bloquea el transporte al proveedor.

La captura no crea un historial de páginas visitadas ni un perfil de navegación, no vincula actividad entre sitios y no incorpora analítica de audiencia ni cookies publicitarias. Sí permite medir el canal declarado de adquisición **de las solicitudes enviadas**; no equivale a un censo de visitas ni prueba causal de SEO/IA.

`sessionStorage` es temporal a la sesión/pestaña; una restauración de sesión o duplicación de pestaña puede conservarlo según el navegador. Si está bloqueado, solo se conserva memoria en la página y el formulario sigue funcionando.

## Texto propuesto para revisión

Añadir un apartado breve en «5. Cookies, analítica y tecnologías de seguimiento» y referencias acotadas en datos/proveedores/conservación, sin cambiar el consentimiento en esta tarea:

> **Contexto técnico de las solicitudes.** Utilizamos almacenamiento temporal de primera parte (`sessionStorage`), limitado a la sesión o pestaña del navegador, para conservar la página inicial de entrada, el origen del sitio externo que te remitió cuando el navegador lo informa, los parámetros de campaña UTM válidos y los identificadores de clic `gclid` o `msclkid` cuando existen. No conservamos la ruta ni los parámetros de la página externa de referencia. Cuando no existe esa referencia, la dejamos sin información; no la interpretamos automáticamente como una visita directa.
>
> Al iniciar una operación de formulario, añadimos un identificador técnico aleatorio de solicitud y la página desde la que se envía. El contexto y su fecha de captura se utilizan para identificar técnicamente el origen de la solicitud, mantener su trazabilidad y medir su canal de adquisición. El identificador no se obtiene de tu correo, RUT ni teléfono.
>
> Este mecanismo no crea un perfil de navegación, no realiza identificación entre sitios, no incorpora analítica de audiencia y no añade cookies publicitarias. Si no envías un formulario, el registro de adquisición guardado en tu navegador no se transmite a Sollahms mediante esta implementación. Esto no sustituye la información sobre las conexiones y registros técnicos necesarios para cargar y proteger el sitio. La sesión puede conservarse si utilizas las funciones de restauración de tu navegador.
>
> Cuando envías una solicitud, ese contexto acompaña a sus datos a través del canal habilitado. Si se remite mediante Resend, el contexto técnico puede conservarse en las etiquetas del correo. Resend informa que almacena los datos en Estados Unidos. Su conservación se sujeta a la retención aplicable al servicio contratado; la duración concreta de la cuenta de Sollahms está pendiente de confirmación operativa. La conservación posterior de la solicitud en nuestros canales se rige por su finalidad y las obligaciones aplicables.

**No incorporar este borrador automáticamente a la política.** Confirmar plan y retención operativa, acceso del equipo, conservación en buzón/exportaciones y revisión jurídica antes de decidir el texto público. No publicar «30 días» como un hecho específico de Sollahms sin confirmar su plan y alcance.

## Separación de finalidades

- A: contexto técnico asociado a una solicitud y medición de su canal de adquisición. Es la finalidad técnica pretendida, no una declaración de exención legal.
- B: analítica opcional de audiencia o navegación. No implementada por este cambio.
- C: marketing, publicidad o perfiles. No implementados ni autorizados por este cambio.

La base jurídica y la eventual necesidad de consentimiento específico para almacenamiento/medición permanecen como **revisión jurídica/privacidad pendiente**. La ausencia de cookies no decide por sí sola la cuestión. No se emitió una conclusión normativa ni se alteraron consentimientos.

## Retención del proveedor, separada del plan de Sollahms

Documentación oficial consultada el 2026-11-11:

| Concepto | Información publicada por Resend |
| --- | --- |
| Free, Pro, Scale | Email/log data: 30 días durante la cuenta activa. |
| Enterprise | Retención flexible. |
| Almacenamiento | Estados Unidos; la región de envío no cambia la residencia de los datos almacenados. |
| Cuenta de Sollahms | **plan Resend actual: no confirmado**. |

Fuentes: [GDPR y almacenamiento/retención](https://resend.com/security/gdpr/), [tabla de planes](https://resend.com/pricing). Son hechos del proveedor, no una certificación jurídica de Sollahms.

Se intentó consultar el panel de facturación por la sesión de Chrome: mostró «Log in to Resend». No hay un conector Resend disponible. No se solicitaron ni leyeron claves, no se inició una nueva cuenta, no se cambió el plan y no se enviaron mensajes. La retención exacta de etiquetas, buzón receptor, copias y exportaciones de Sollahms queda por confirmar; no puede deducirse de la tabla pública.

## Precisión sobre «sin transmisión»

La prueba aislada del módulo demuestra que su inicialización y navegación no invocan `fetch`, `sendBeacon`, XHR ni WebSocket. No sustituye una captura de tráfico de un navegador real, pendiente. Además, la URL inicial con UTM se solicita normalmente al servidor y puede constar en registros de infraestructura: «sin transmisión» se refiere al **registro adicional de adquisición por este mecanismo**, no a una promesa de ausencia de toda conexión, cabecera Referer o registro HTTP.
