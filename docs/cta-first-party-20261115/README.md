# Candidato privado first-party — CTA tributario

Estado: laboratorio sintético, no autoriza producción. Base documental 94754aeed0f7c4c24095c16467917866ef81b0a2; guía publicada f0e8bd59a9589e7d1b5a737778c6bf4783e89e88; alias comprobado dpl_GqikSrihY6ETwsVJtkF6uB6y4Dsw. T0 editorial 14/11/2026 23:00:14.697 America/Santiago e intervención CTA 15/11/2026 00:10:57.260 intactos.

## Arquitectura implementada
- Captura: app.mjs, solo por activación explícita de recorrido de prueba. Copia privada generada de la guía con tres CTA identificados. Agenda sintética con controles cerrados, sin datos personales ni formulario operacional.
- Contrato y atribución: core.mjs; UUID analítico distinto de cualquier clave de idempotencia comercial; lista cerrada de eventos y campos.
- Persistencia staging: store.mjs, IndexedDB aislado por origen de preview, transacciones sobre cola y eventos; índice semántico único. Sin base remota, API, credenciales, IP guardada ni servicio de pago. No es un almacén compartido multiusuario. Borrar datos del navegador pierde la evidencia local.
- Conciliación: fixtures.mjs; recibos del proveedor sintético asociados explícitamente a run/session/request/CTA, tipo y fecha. No se aceptan HTTP 200 como evidencia. No es validación criptográfica de un proveedor real: cualquier integración real queda bloqueada hasta disponer de adaptador de confianza de servidor, autenticación, verificación de recibos y política aprobada.
- Panel: index.html; tres cohortes de enlace, numerador/denominador, muestra, período y cobertura; exportación JSON agregada sin identificadores de sesión o solicitud.
- Empaquetado: build.mjs permite únicamente VERCEL_ENV=preview, salida estática sin funciones; CSP connect-src none y form-action none; X-Robots-Tag noindex,nofollow. Protección de preview mediante SSO existente, sin cambios globales.

## Reutilización evaluada
Rama experimental codex/attribution-first-party-20261111, SHA 32211cf26d76975d42d3882a776f672ef74003a8: leídos acquisition-contract.mjs y acquisition.mjs. Se reutilizan los principios de UUID opaco, contexto cerrado y almacenamiento por pestaña; no se importan gclid/msclkid/UTM ni datos de origen externos, innecesarios para esta prueba. No se fusiona esa rama ni se asume publicada. No se cambia ningún handler operacional.

## Contrato v1
Evento: v=1, synthetic=true, id UUID, run UUID, session UUID, seq entero positivo, type, at milisegundos UTC, cta enum/null, request UUID/null, receipt UUID/null. Toda propiedad adicional se rechaza, incluso PII. Rutas no se reciben como texto libre: guide/agenda están implícitas en eventos y páginas de laboratorio.
Eventos: guide_view, tax_advisory_click, agenda_view, advisory_form_start, advisory_accepted, advisory_delivered.
CTA: tax_advisory_header (cabecera), tax_advisory_main (nuevo CTA comercial), tax_advisory_footer (cierre).
Inicio: primer change/input real isTrusted; carga y submit incompleto no equivalen a inicio. Aceptación: comprobante accepted de fixture. Entrega: comprobante delivered distinto, vinculado a aceptación previa. No se infiere desde aceptación, respuesta HTTP o botón de envío.

## Esquema de almacenamiento
IndexedDB sollahms-cta-synthetic-v1:
- runs: key id; label cerrado generado por interfaz; from/to UTC; expected lista de IDs del fixture o null.
- queue: key id; e (evento validado), proof (recibo sintético validado/null).
- events: key id; índice único semantic; event; proof. Clave semántica run/session/type/cta/request.
Las escrituras de queue y el traslado a events son transaccionales; la confirmación elimina queue en la misma transacción. Reintentos idempotentes y flush concurrente no duplican métricas. Cola pendiente se muestra; desconexión simulada impide flush, no la escritura local. Reinicio recupera cola/eventos; fallo/cuota o bloqueo de almacenamiento deshabilita captura y muestra error, no promesa de cobertura.

## Sesiones y modelo de atribución
SessionStorage por pestaña, renovación al capturar una interacción pertinente, caducidad a los 30 minutos de inactividad medida por esos eventos. No se usa actividad pasiva del usuario ni fingerprint. Un reloj regresivo invalida sesión. Después de caducar se genera otra UUID y se borra CTA.
Clic guarda CTA explícito; agenda recupera el contexto de sesión, nunca depende de document.referrer. Entrada directa sin guía/clic es no atribuible. Eventos fuera de ventana no entran al numerador. Cohorte manual observa 24 horas desde inicio; no certifica cobertura ni calcula tasas.
Web Locks mantiene propiedad de sesión durante cada documento; una pestaña duplicada que conserva sessionStorage recibe otra UUID si detecta el bloqueo ocupado. Navegación libera lock con pagehide. Sin soporte de Web Locks, captura deshabilitada. Sesiones no se unen entre dispositivos. Borrar sessionStorage rompe atribución y no se intenta reconstruirla.
Una solicitud tiene su propia UUID sintética; la entrega conserva la sesión/CTA de la aceptación aunque llegue después de expirar la sesión de navegación. No se usa clave operacional de idempotencia.
Deduplicación: vistas/inicios únicos por sesión; clics únicos por sesión/CTA; aceptaciones/entregas por solicitud y sesión. El panel cuenta sesiones para conversiones y solicitudes únicas para tasa de entrega.

## Métricas
CTR = sesiones con clic / sesiones con guide_view. Conversión guía = sesiones con aceptación atribuida / sesiones con guide_view. Conversión clic = sesiones con aceptación atribuida / sesiones con clic. Entrega = solicitudes entregadas / solicitudes aceptadas.
Solo se calculan tasas cuando expected está definido, no faltan eventos, no hay eventos inesperados, cola pendiente, secuencias inválidas ni no atribuibles. Esto certifica exclusivamente un fixture cerrado, no la cobertura de visitantes reales. Sin denominador fiable: NO DISPONIBLE, nunca cero. Una venta o cita no forma parte del contrato.
Cohorte canónica: 3 sesiones, 3 CTA (uno cada uno), 3 agendas, 3 inicios, 2 aceptaciones, 1 entrega. CTR100%, guía/clic66,7%, entrega50%: exclusivamente datos sintéticos.

## Privacidad y decisiones pendientes
No hay campos de nombre, RUT, correo, teléfono, texto libre, respuestas tributarias, fingerprint, URL de referencia o IP en el almacén. CSP bloquea conexiones del frontend. El hosting puede procesar logs técnicos de acceso según su configuración existente: no se afirma anonimato absoluto ni ausencia de IP en infraestructura ajena.
No se registran visitantes reales; el evaluador inicia manualmente un ensayo. Los controles de la agenda son fixtures, no datos comerciales.
Propuesta, NO política aprobada: eventos productivos 30 días y agregados 90 días, acceso restringido a roles autorizados, eliminación automática y auditable, cifrado en tránsito/reposo, separación por entorno, límites de uso y revisión de incidentes. Decidir responsable, finalidad, base habilitante, información de privacidad, derechos, conservación, proveedores y requisitos legales vigentes mediante revisión competente antes de producción. No se presume consentimiento ni autorización de tracking real.
En staging actual no hay cron ni política remota: botón explícito elimina stores sintéticos; borrado del sitio del navegador elimina IndexedDB/sessionStorage. Retención local hasta borrado; no confundir con la propuesta productiva. Solo exportar agregados.

## Operación y límites
node --test labs/cta-measurement/test.mjs
VERCEL_ENV=preview node labs/cta-measurement/build.mjs
En panel: Cargar cohorte sintética; Probar persistencia y concurrencia; Iniciar recorrido de prueba; probar desconexión y reconectar, expiración, entrada directa, rechazo, incompleto, aceptación y entrega separadas.
No existe endpoint de ingesta productivo ni almacenamiento remoto desplegado. No integra Resend/CRM ni cambia su contrato. Este candidato prueba componentes y recorrido aislados; no es certificación de un sistema de analítica listo para activar en producción.

## Preservación
Solo se añaden labs/cta-measurement y docs/cta-first-party-20261115. Todos los archivos previamente versionados permanecen byte a byte; la guía privada se genera en .vercel/output, sin cambiar el HTML fuente. La agenda privada es un formulario sintético separado. No cambia PR18–22, sitemap, robots, SEO/GEO, T0 ni producción.
