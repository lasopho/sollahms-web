# Propuesta separada — pendiente de autorización

## Alcance propuesto
Preparar primero un diseño y candidato privado de medición first-party del recorrido guía → CTA → agenda → solicitud. No implementar ni publicar con la autorización de auditoría actual.

Eventos mínimos:
- guide_view: sesión anónima que carga la guía.
- tax_advisory_click: clic del CTA con identificador propio; distinguir cabecera y CTA de cierre.
- agenda_view: llegada atribuida al clic anterior dentro de la misma sesión.
- advisory_form_start: primera interacción real, una vez por sesión/formulario; no usar startedAt actual.
- advisory_accepted: operación única validada y aceptada por el proveedor.
- advisory_delivered: separado y solo si existe confirmación verificable del canal.

Datos mínimos: timestamp UTC, rutas normalizadas sin query sensible, cta_id, versión de contenido, event_id y sesión opaca efímera de pestaña. Sin RUT, nombre, correo, teléfono, mensaje, respuestas tributarias, fingerprint de navegador ni cookies de marketing en el almacén de medición. Minimizar IP y fijar retención/acceso antes de desplegar. Respetar restricciones del navegador; informar cobertura perdida.

La clave actual de idempotencia sigue teniendo función operacional: no reutilizar indiscriminadamente como identidad analítica. Vincular aceptación deduplicada con contexto de origen mediante contrato explícito y validado. No bastaría con agregar un parámetro al enlace: falta persistencia y confirmación del envío.

## Métricas solo después de validar cobertura
- CTR de guía: sesiones únicas con clic específico / sesiones únicas con guide_view.
- Conversión de guía: sesiones con solicitud aceptada atribuida / sesiones con guide_view, misma cohorte y ventana.
- Conversión posterior al CTA: sesiones con solicitud aceptada atribuida / sesiones con clic específico.
- Entrega: solicitudes únicas con entrega confirmada / solicitudes únicas aceptadas.
Ventana propuesta: misma sesión de pestaña con caducidad de 30 minutos de inactividad; decidir antes de implementar. Ventas o citas confirmadas serían métricas distintas.
No calcular si numerador o denominador es incompleto o no comparable. Mostrar conteos, período, tamaño de muestra y limitaciones.

## Autorización necesaria y control
Requiere autorización nueva para preparar cambios de código y un receptor/almacén first-party, revisar privacidad, retención, protección contra abuso y conciliación de aceptaciones. Evaluar reutilización segura del trabajo de atribución existente, sin asumir que está publicado. No modificar Resend ni CRM en esta fase de diseño.
Entregar propuesta técnica, diff, pruebas y preview privados; publicar solo con autorización expresa posterior. No instalar herramientas, generar gasto ni tocar producción ahora.
