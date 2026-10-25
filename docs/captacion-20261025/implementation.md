# Captación: portada, contacto y asesoría

Base publicada comprobada: dpl_awW6NxX9nDVyu6nreq12TT9uxkQc. Fuentes de referencia c68779dfa68a924f51bf1a99ddd5543c8c873400, rama independiente codex/captacion-20261025. El dominio seguía en esa versión al iniciar.

## Decisiones

Una acción consistente, «Solicitar asesoría». Portada conserva SEO y contenido útil; el cierre ahora permite completar el formulario. Contacto y asesoría comparten un recorrido breve y muestran el formulario primero en móvil. Se retira el campo de RUT y el requisito de mensaje; se pide nombre y correo o teléfono según la elección, objetivo y mensaje opcionales, con consentimiento específico sin campañas. Sin urgencia, gratuidad, respuesta garantizada ni rentabilidad inventadas.

Fundamentos consultados: [NN/g: carga cognitiva](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/), [W3C: etiquetas](https://www.w3.org/WAI/tutorials/forms/labels/), [W3C: notificaciones](https://www.w3.org/WAI/tutorials/forms/notifications/). Jerarquía, campos claramente etiquetados y mensajes próximos al error se aplican como principios de usabilidad, sin atribuir aumentos de conversión medidos.

## Flujo y destino

Formulario HTML → validación accesible → /api/advisory → Resend → contacto@sollahms.cl. El servidor conserva remitente, destinatario y configuración existentes (CONTACT_DELIVERY_MODE=resend); no activa CRM, reservas ni autorespuestas al visitante. El campo reply_to sólo se añade cuando la persona eligió correo. [Contrato oficial de Resend](https://resend.com/docs/api-reference/emails/send-email). La aceptación exige respuesta satisfactoria con identificador del proveedor. La interfaz aclara que no acredita entrega al buzón ni una cita.

La función nueva es aditiva. Las funciones publicadas existentes se copiaron byte por byte desde el paquete publicado, porque el empaquetado histórico contiene controles adicionales respecto de api/contact.mjs del árbol Git. No se sustituyó esa función por su versión antigua del repositorio. scripts/package-advisory-release.mjs verifica el hash de la portada base y genera el paquete sobre ella, conservando funciones, rutas y protecciones. El índice de proyectos sólo contiene nombres e identificadores públicos y deriva del catálogo ya publicado.

## Pruebas y límites

20 pruebas nuevas y 6 regresiones relevantes del control de operaciones aprobadas. La ejecución inicial de la suite histórica completa detectó una expectativa de plantilla de contacto del trabajo P1, sustituida intencionalmente en esta tarea; no se modificaron esos tests históricos ni se presentó aquella suite como aprobada. El registro inicial se conserva. La prueba nueva de error se corrigió para esperar ok:false, que es la respuesta real del contrato.

Servidor HTTP aislado con datos sintéticos: recepción, aceptación, repetición con la misma clave y conflicto con datos diferentes. Navegador real contra un paquete protegido con transporte de prueba: vacío, inválido, enviando, éxito, error, preservación de datos, correo y teléfono, teclado, escritorio y móvil. El paquete de pruebas tiene aviso visible, admite únicamente Prueba QA / qa@example.invalid / +56 9 0000 0000 y no puede enviar correos externos. No se promovió.

No se envió ningún POST de prueba a producción ni correo a personas reales. La entrega efectiva al buzón de Sollahms queda fuera de esta prueba segura; no se afirma haberla verificado. No se instaló analítica nueva. No hay datos posteriores que permitan afirmar un aumento de conversión.
