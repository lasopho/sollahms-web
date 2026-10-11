# UF oficial automática

El buscador en CLP y la referencia en pesos del comparador consultan `GET /api/uf` al cargar la página, reintentan cuando se necesita una UF ausente o vencida y revisan su vigencia durante la sesión. Las tasas, ofertas, CAE y precios inmobiliarios conservan su proceso de verificación existente. No se extrapolan condiciones bancarias ni se cambia el motor hipotecario en UF.

## Fuente oficial y coste

Se consulta directamente la tabla anual pública del Servicio de Impuestos Internos: `https://www.sii.cl/valores_y_fechas/uf/ufAAAA.htm`. El año se deriva del día actual en `America/Santiago`; no está fijado a 2026. No se utiliza un agregador de indicadores, API key, suscripción, almacenamiento externo ni cron de pago. El endpoint emplea el alojamiento Vercel ya utilizado por el sitio y se actualiza con las visitas, sin exigir reconstrucciones diarias del sitio.

Contraste directo realizado el 11 de octubre de 2026: la fila del día 11 en la tabla de octubre y la tabla anual de [SII UF 2026](https://www.sii.cl/valores_y_fechas/uf/uf2026.htm) publican **$41.141,53**. Esta cifra sirve como evidencia de la revisión; el endpoint sigue obteniendo el valor correspondiente a la fecha de cada consulta. Los valores futuros que el SII publica en la misma tabla no se presentan como vigentes antes de su día.

## Validación y recuperación

- Fuente HTTPS fija del SII, sin URL ni fecha elegibles por el visitante. Los redirects están deshabilitados.
- Tiempo máximo de cinco segundos, respuesta HTML UTF-8, lectura limitada a 512 KiB y validación numérica chilena estricta.
- Año, mes y día exactos; un único valor; concordancia obligatoria entre tablas mensual y anual. Tablas ambiguas, valores vacíos, formatos distintos y markup inesperado se rechazan.
- Memoria del proceso: consultas concurrentes comparten la misma solicitud; el valor se conserva hasta una hora dentro del mismo día. Cambiar de día en Chile invalida el valor inmediatamente, incluso si la solicitud cruza medianoche. Se contemplan el horario de verano y el cambio de año.
- Fallos: no se guarda un valor incorrecto ni se sustituyen fechas. El endpoint devuelve 503 con `Retry-After: 30`, sin revelar detalles internos. Transcurrida esa pausa se consulta de nuevo y puede recuperarse sin redeploy.
- Respuestas públicas `private, no-store`: el navegador o CDN no pueden arrastrar un valor del día anterior a medianoche.
- El cliente revisa la UF cada quince minutos, reintenta una ausencia cada minuto mientras la página está visible, al volver a la pestaña y al solicitar una evaluación. Conserva un valor verificado de hoy durante un fallo transitorio; nunca convierte con un snapshot de otro día.
- El buscador conserva los importes CLP ingresados. Sin UF vigente, las categorías quedan como información insuficiente y las conversiones se omiten; los cálculos en UF permanecen disponibles. El comparador ofrece `Reintentar UF` y continúa funcionando en UF.
- El servidor de contacto recalcula la simulación y obtiene la UF oficial cuando el snapshot no está vigente; nunca acepta una cotización UF del visitante. Si el SII sigue inaccesible, el resumen permanece en UF sin inventar pesos.

El snapshot histórico de `data/hipotecario.json` permanece como registro verificado: no es una UF vigente de manera indefinida. La actualización automática es independiente de las ofertas verificadas manualmente. El fallo completo del SII no tiene una segunda fuente no oficial: se comunica la ausencia y se bloquea la conversión, con recuperación automática.

## Pruebas

`node --test tests/official-uf.test.mjs tests/contact.test.mjs tests/integration-contact.mjs tests/integration-capacity-ui.mjs tests/integration-comparator.mjs`

Incluyen parseo válido y adversarial, límites de respuesta, fuente/redirects, tiempo máximo, concurrencia, caché/recuperación, medianoche de Santiago en verano e invierno, cambio de año, fechas antiguas/futuras, API read-only, privacidad de parámetros, buscador CLP con snapshot vencido y recuperación, y contacto con proveedor simulado. No se envían mensajes ni reservas reales.


## QA local sin servicios externos

`SOLLAHMS_QA_PORT=8897 node tests/qa-preview-server.mjs --root dist` sirve el mismo endpoint GET mediante el handler real e inyecta el valor SII verificado para **2026-10-11** ($41.141,53). La fecha de consulta se calcula en `America/Santiago`; si el día cambia, la fixture falla como UF no disponible, sin trasladar esa cifra a una fecha sin evidencia. Este servidor es exclusivo de pruebas y no forma parte del build público.

Para revisar la ausencia, visita `/__qa/mode?scenario=uf_unavailable` y luego el buscador/comparador. Para recuperar, usa `/__qa/mode?scenario=success` y reintenta UF o la búsqueda. `/__qa/mode?scenario=uf_recovery` simula un único fallo seguido de recuperación en la siguiente consulta. El modo `preview_read_only` sigue bloqueando mensajes y reservas simulados; permite la lectura de UF. `/__qa/status` registra consultas y confirma `externalRequests: 0`.
