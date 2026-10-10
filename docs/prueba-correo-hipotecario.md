# Prueba controlada del formulario hipotecario

Preparada el 9 de octubre y ejecutada el 10 de octubre de 2026. **Un envío real autorizado: aceptación Resend y entrega al servidor comprobadas; recepción y apertura efectivas en el buzón confirmadas por el usuario.** El usuario autorizó la prueba con datos ficticios y mantuvo Vercel Authentication. No se usaron enlaces de acceso sin autenticación. La prueba queda cerrada; no realizar más envíos.

Identificador único: **QA-SOLLAHMS-HIP-20261009T230224Z-B5E38C90**. Usar una sola vez, en nombre y comentario.

## Acceso autenticado comprobado

- Versión preparada: commit `635dc9468f2e66c5156da130adb242393a4ae8b5`, deployment `dpl_55imMM7hv4bepVxnEaYKPxeL8vUm`, READY como preview.
- [Vista previa exacta](https://project-wrapp-mbokvmnqf-lsandoval2-8260s-projects.vercel.app/comparador-hipotecario.html): el 10/10 se accedió normalmente después del inicio de sesión realizado por el usuario en el navegador integrado.
- La metadata del proyecto volvió a confirmar el 10/10 Vercel Authentication activa (`all_except_custom_domains`). No se cambió esa configuración.
- [Emails de Resend](https://resend.com/emails): se comprobó la sesión autenticada del usuario y se revisó exclusivamente el registro de esta prueba.
- El agente no tuvo acceso directo confirmado al buzón `contacto@sollahms.cl`. Las búsquedas previas en las dos conexiones Gmail disponibles no devolvieron mensajes; no demostraban ausencia de entrega. La recepción quedó confirmada posteriormente por el titular.

**Comprobación manual completada por el usuario:** informó que recibió y abrió correctamente el correo en `contacto@sollahms.cl`, confirmó el identificador exacto y la simulación de propiedad 5.000 UF, pie 1.000 UF, crédito 4.000 UF, plazo 25 años y dividendo financiero 22,23 UF. La recepción efectiva quedó confirmada por el usuario mediante captura de pantalla, según su declaración en el chat. No se adjuntó esa captura en el mensaje de confirmación; el agente no inspeccionó directamente el buzón ni esa imagen. La carpeta no fue informada. No se requiere otro envío para cerrar la prueba.

El acceso normal autenticado permitió completar la prueba del formulario y del proveedor. No se requirió un enlace temporal. No se copiaron contraseñas, claves, cookies, códigos ni cabeceras de autenticación.

## Campos de la prueba

La única dirección destinataria y de Reply-To fue `contacto@sollahms.cl`, también usada como correo de prueba en el formulario. No hubo CC, BCC, adjuntos, respuestas ni reenvíos. El remitente configurado sigue siendo `Sollahms Web <formularios@forms.sollahms.cl>`.

| Campo | Valor |
|---|---|
| Propiedad | 5.000 UF |
| Pie | 20% |
| Plazo | 25 años |
| Tasa | 4,5% nominal anual convertible mensualmente |
| Ubicación | Por confirmar |
| Banco | Sin selección; simulación manual ficticia |
| Nombre | `PRUEBA QA - QA-SOLLAHMS-HIP-20261009T230224Z-B5E38C90` |
| Correo | `contacto@sollahms.cl` |
| Teléfono | `000000000` (marcador ficticio, no llamar) |
| Consentimiento | Marcado para esta prueba autorizada |
| Honeypot | Vacío, sin modificar |

Comentario exacto:

```text
PRUEBA TÉCNICA AUTORIZADA — QA-SOLLAHMS-HIP-20261009T230224Z-B5E38C90.
Datos ficticios para comprobar el formulario y la recepción en contacto@sollahms.cl.
El teléfono 000000000 es ficticio. Gestionar únicamente como prueba técnica, sin contacto comercial.
Verificar el identificador y el resumen de 5.000 UF, pie 20%, plazo 25 años y tasa nominal anual 4,5%.
```

El asunto generado es **Comparador hipotecario Sollahms: Asesoría hipotecaria**. El identificador va en el cuerpo: el frontend fija el asunto. La página debe generar sus timestamps; no reutilizar una solicitud guardada. Completar los campos permite superar naturalmente los dos segundos mínimos de protección contra spam.

Resultados esperados del escenario: pie 1.000 UF, crédito 4.000 UF, financiamiento 80%, 300 cuotas, dividendo financiero 22,23 UF, suma de cuotas 6.669,99 UF e intereses 2.669,99 UF. La conversión CLP sólo corresponde si la UF del catálogo es del día de ejecución en Chile. Los importes futuros permanecen en UF.

Preflight local ejecutado con el handler real y transporte Resend sustituido por un simulador: HTTP 200, una llamada simulada, destino y Reply-To correctos, asunto e identificador presentes, y resultados financieros contrastados. No utilizó una credencial real ni transporte de red. Este resultado confirma la preparación de los datos; no demuestra aceptación real por Resend ni recepción de correo.

## Protocolo completado: no repetir el envío

La autorización del usuario consta en el chat. Se comprobó el consentimiento, formato válido y honeypot vacío antes de pulsar una sola vez «Solicitar asesoría». El siguiente procedimiento se conserva como registro; no constituye una instrucción para volver a enviar.

1. Configurar el escenario, abrir «Quiero que me contacten» y completar los campos anteriores. Capturar contexto y campos ficticios, sin incluir cabeceras de autenticación.
2. Pulsar «Solicitar asesoría» una sola vez. Registrar hora UTC y Chile, URL/deployment, confirmación o error. Si está disponible la inspección de red, conservar sólo estado y JSON de respuesta de `POST /api/contact`, sin cookies ni tokens.
3. En Resend → Emails, localizar el mensaje por hora, destinatario, remitente y asunto. Abrir Preview o Plain Text y comprobar el identificador. La documentación no garantiza que la búsqueda global indexe el cuerpo.
4. En «View log», comprobar `POST /emails`, respuesta exitosa con `id`, y contenido de esta prueba. Registrar únicamente ID, destinatario, asunto, hora y estado; no copiar cabeceras Authorization ni otros mensajes.
5. Comprobar el evento/estado Delivered del mismo mensaje (completado). Confirmar recepción y apertura en `contacto@sollahms.cl` con identificador y resumen (completado por el titular mediante su confirmación en el chat). Carpeta y Message-ID SMTP no informados.

## Evidencia y límites

| Nivel | Evidencia requerida |
|---|---|
| Aplicación | Confirmación visible y, si está disponible, HTTP 200 `{"ok":true}`, con honeypot vacío |
| Aceptación Resend | Respuesta API exitosa con `id`, asociada al contenido y destinatario de la prueba |
| Entrega al servidor | Delivered del mismo mensaje |
| Recepción efectiva | Mensaje abierto en el buzón de contacto con el identificador, observado directamente o confirmado por el titular; registrar carpeta si se informa |

El handler sólo confirma su camino normal después de Resend 2xx e ID no vacío. Un honeypot produce la misma respuesta sin envío, por lo que debe permanecer vacío. La aplicación no expone el ID al navegador: su comprobación directa se realiza en Resend. Delivered acredita aceptación por el servidor destinatario, no presencia en la bandeja. Una confirmación específica del titular del buzón también sirve como evidencia de recepción, indicando identificador y contenido observado.

Ante timeout o resultado incierto, buscar primero el identificador en Resend y el buzón. No repetir automáticamente: el handler no utiliza idempotencia y otro POST podría duplicar el correo. No declarar éxito ante login, 400/403/413/415, 503, 502 o falta de evidencia. Mantener pendientes los niveles no comprobados.

## Resultado observado el 10/10/2026

| Evidencia | Resultado |
|---|---|
| Inicio del único intento | `2026-10-10T10:51:49.379Z` · 07:51:49 de Chile |
| Respuesta visible | A las `10:51:51.170Z`: «Solicitud enviada correctamente. Sollahms se pondrá en contacto contigo para conversar sobre tu financiamiento.» |
| Timestamp de simulación en el correo | `2026-10-10T10:51:49.867Z` |
| Solicitud recibida por el servidor | `2026-10-10T10:51:50.891Z` |
| Resend `POST /emails` | **HTTP 200** observado directamente en el panel de logs |
| ID devuelto en Response body | `01a12570-c935-7dda-a216-5c697b748382` |
| Log de proveedor | `ec6855bb-9a03-4576-979b-20c7acb9d9c3` |
| Eventos del mismo mensaje | **Sent y Delivered**, Oct 10, 07:51 en el panel |
| Contenido en Preview y Plain Text | Identificador exacto, teléfono ficticio, remitente/destinatario/Reply-To y escenario correctos; resumen recalculado con 22,23 UF y 6.669,99 UF |
| UF del 9 de octubre | Se omiten pesos tanto en página como en correo y se explica que requiere actualización; no se cambió el catálogo para esta prueba |
| Recepción efectiva | **Confirmada por el usuario**: recibió y abrió el mensaje en contacto, identificador coincidente y valores correctos; evidencia mediante captura de pantalla atribuida a su declaración |

Se observó la confirmación de aplicación, pero no se capturó directamente la respuesta HTTP de `/api/contact`; la aceptación HTTP 200 del proveedor sí se comprobó en Resend. No se consultaron Request headers. El ID Resend es un identificador de diagnóstico, no una credencial ni un Message-ID SMTP.

Capturas de aplicación y Resend: [formulario preparado](qa/correo-remoto-preparado.jpg), [confirmación de aplicación](qa/correo-remoto-resultado.jpg), [metadata del correo](qa/resend-correo-prueba.jpg), [aceptación HTTP 200](qa/resend-aceptacion-prueba.jpg) y [Sent/Delivered con identificador en el contenido](qa/resend-entrega-prueba.jpg). Estas imágenes no son capturas del buzón destinatario; la recepción se acredita mediante la confirmación específica del usuario registrada arriba.

Registro actual: **aceptación y entrega al servidor verificadas; recepción y apertura efectivas confirmadas por el usuario**. No se modificó la implementación, `main`, producción ni las fichas. La prueba conserva un solo envío y queda lista para revisión final.

## Documentación primaria

- [Respuesta de envío de Resend](https://resend.com/docs/api-reference/emails/send-email).
- [Eventos sent y delivered](https://resend.com/docs/webhooks/event-types).
- [Gestión de mensajes y View log](https://resend.com/docs/dashboard/emails/manage-emails).
- [Request/response en logs](https://resend.com/docs/dashboard/logs/introduction).
- [Por qué Delivered no demuestra recepción en la bandeja](https://resend.com/docs/knowledge-base/what-if-an-email-says-delivered-but-the-recipient-has-not-received-it).
