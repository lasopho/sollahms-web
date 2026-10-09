# Prueba controlada del formulario hipotecario

Preparada el 9 de octubre de 2026. **No ejecutada remotamente: no se ha enviado correo real.** El usuario autoriza una prueba con datos ficticios y exige mantener Vercel Authentication. No autoriza enlaces de acceso sin autenticación.

Identificador único: **QA-SOLLAHMS-HIP-20261009T230224Z-B5E38C90**. Usar una sola vez, en nombre y comentario.

## Acceso pendiente

- Versión preparada: commit `635dc9468f2e66c5156da130adb242393a4ae8b5`, deployment `dpl_55imMM7hv4bepVxnEaYKPxeL8vUm`, READY como preview.
- [Vista previa exacta](https://project-wrapp-mbokvmnqf-lsandoval2-8260s-projects.vercel.app/comparador-hipotecario.html): el acceso normal en el navegador integrado muestra login Vercel.
- La metadata del proyecto confirma Vercel Authentication activa (`all_except_custom_domains`). No se cambió esa configuración.
- No hay CLI Vercel ni sesión CLI local disponible en las ubicaciones comprobadas. La inspección del Chrome del sistema está bloqueada por permisos de control del equipo; no se puede afirmar si tiene una sesión válida.
- [Emails de Resend](https://resend.com/emails): el navegador integrado también muestra login. No hay acceso directo confirmado al buzón `contacto@sollahms.cl` con las conexiones actuales.

Acciones manuales: abrir la preview en el navegador integrado de este chat, iniciar sesión con la cuenta Vercel que tiene acceso a `project-wrapp`, completar en privado cualquier contraseña o verificación, volver a la URL exacta y avisar cuando se vea el comparador. No enviar todavía el formulario. Para comprobar el registro del proveedor, iniciar también sesión con la cuenta existente de Resend que gestiona `forms.sollahms.cl`; no crear credenciales ni compartir claves, cookies o códigos. La recepción requiere acceso al buzón de contacto, o confirmación específica de su titular.

El acceso normal autenticado aún está pendiente. No se ha demostrado que un enlace temporal sea indispensable y no se solicita autorización para crearlo.

## Campos de la prueba

El único correo real usado será `contacto@sollahms.cl`, como destinatario existente y como correo de prueba/Reply-To. No habrá CC, BCC, adjuntos, respuestas ni reenvíos. El remitente configurado sigue siendo `Sollahms Web <formularios@forms.sollahms.cl>`.

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

## Ejecución de un único envío

La autorización del usuario para esta prueba ya consta en el chat; no requiere otra aprobación de envío. Falta obtener acceso normal autenticado.

1. Configurar el escenario, abrir «Quiero que me contacten» y completar los campos anteriores. Capturar contexto y campos ficticios, sin incluir cabeceras de autenticación.
2. Pulsar «Solicitar asesoría» una sola vez. Registrar hora UTC y Chile, URL/deployment, confirmación o error. Si está disponible la inspección de red, conservar sólo estado y JSON de respuesta de `POST /api/contact`, sin cookies ni tokens.
3. En Resend → Emails, localizar el mensaje por hora, destinatario, remitente y asunto. Abrir Preview o Plain Text y comprobar el identificador. La documentación no garantiza que la búsqueda global indexe el cuerpo.
4. En «View log», comprobar `POST /emails`, respuesta exitosa con `id`, y contenido de esta prueba. Registrar únicamente ID, destinatario, asunto, hora y estado; no copiar cabeceras Authorization ni otros mensajes.
5. Comprobar el evento/estado Delivered del mismo mensaje. En `contacto@sollahms.cl`, buscar el identificador también en Spam o cuarentena y abrirlo. Registrar carpeta, remitente, destinatario, hora y resumen. Si está disponible, correlacionar Message-ID con Resend.

## Evidencia y límites

| Nivel | Evidencia requerida |
|---|---|
| Aplicación | Confirmación visible y, si está disponible, HTTP 200 `{"ok":true}`, con honeypot vacío |
| Aceptación Resend | Respuesta API exitosa con `id`, asociada al contenido y destinatario de la prueba |
| Entrega al servidor | Delivered del mismo mensaje |
| Recepción efectiva | Mensaje abierto en el buzón de contacto con el identificador; indicar carpeta |

El handler sólo confirma su camino normal después de Resend 2xx e ID no vacío. Un honeypot produce la misma respuesta sin envío, por lo que debe permanecer vacío. La aplicación no expone el ID al navegador: su comprobación directa se realiza en Resend. Delivered acredita aceptación por el servidor destinatario, no presencia en la bandeja. Una confirmación específica del titular del buzón también sirve como evidencia de recepción, indicando identificador y contenido observado.

Ante timeout o resultado incierto, buscar primero el identificador en Resend y el buzón. No repetir automáticamente: el handler no utiliza idempotencia y otro POST podría duplicar el correo. No declarar éxito ante login, 400/403/413/415, 503, 502 o falta de evidencia. Mantener pendientes los niveles no comprobados.

Registro actual: **envío no ejecutado; aceptación, entrega y recepción pendientes por sesiones/acceso**. No se modificó la implementación, `main`, producción ni las fichas.

## Documentación primaria

- [Respuesta de envío de Resend](https://resend.com/docs/api-reference/emails/send-email).
- [Eventos sent y delivered](https://resend.com/docs/webhooks/event-types).
- [Gestión de mensajes y View log](https://resend.com/docs/dashboard/emails/manage-emails).
- [Request/response en logs](https://resend.com/docs/dashboard/logs/introduction).
- [Por qué Delivered no demuestra recepción en la bandeja](https://resend.com/docs/knowledge-base/what-if-an-email-says-delivered-but-the-recipient-has-not-received-it).
