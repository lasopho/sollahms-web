# QA local de las 131 fichas — PASS

Preview comprobada: https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app/

Deployment: `dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi`. Runtime declarado: `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`.

El reporte final contiene **524 parejas únicas**, 131 fichas a **1440, 768, 390 y 320 px**, sin faltantes ni duplicados. El [resumen de aceptación](acceptance-summary.json) tiene **0 incidencias pendientes**. Los controles de encabezados/pies, menú móvil y el suplemento de navegación, galerías, planos y formularios se entregan por separado y se concilian en el gate principal.

| Control core | Resultado final |
| --- | --- |
| Fichas reales HTTP 200 y `#project-name` | 524/524 |
| Elementos o texto visible de recorridos eliminados | 0 residuales |
| Overflow horizontal mayor que 1 px | 0 |
| Imágenes incompletas o sin dimensiones naturales | 0 |
| Excepciones JavaScript de página | 0 |
| Fallos de recursos de aplicación sin resolver | 0 |
| Secciones vacías y destinos internos ausentes | 0 |
| Nombre, RUT, correo y teléfono visibles/habilitados | 2096 comprobaciones correctas |
| Imágenes de galería visibles con opacidad nula/ocultas | 0 |
| Mapas existentes | 119 en fuente; 476 inspecciones responsive |
| Reproductores de video públicos en las 131 fichas | 0; reproducción no aplicable |
| Envíos comerciales, reservas, correos, CRM o Resend | 0 |

## Método y acceso

Chrome **157.0.8103.78**, Playwright Core **1.65.1**, Node **v24.22.3**, Vercel CLI **65.16.0**, en macOS. La navegación mantuvo el origen HTTPS exacto de la Preview. Las respuestas del mismo origen procedieron de la CLI nativa autenticada existente y de su caché comprobada por deployment y SHA256; se conservaron sus cabeceras de seguridad, incluida CSP. Google Maps se cargó desde el navegador. No se modificaron SSO, credenciales, protección, HTML, CSS, datos comerciales ni funciones.

El transporte usa un directorio CLI sin vinculación y un deployment explícito. No crea enlaces de compartición ni bypasses. La caché y los perfiles no forman parte de esta entrega. No se exportó estado de autenticación.

Los métodos que pueden enviar datos se bloquearon. Se permitieron únicamente las consultas públicas de lectura de Google Maps documentadas en [la política](scripts/read-only-map-rpc-policy.json), sin registrar cuerpos, cabeceras ni tokens. Los **9 POST de telemetría SLO bloqueados deliberadamente** se conservaron como evidencia separada; cinco filas los registraron como `requestfailed`. Por ello el harness crudo terminó con código 1. El análisis final separa esos bloqueos de los errores de aplicación y no deja incidencias de aplicación pendientes.

La consola textual se valida en los reportes complementarios. El core registra excepciones JavaScript, solicitudes fallidas y respuestas HTTP de error; no sustituye esa captura complementaria.

## Resolución de las evidencias pendientes

Las primeras capturas de algunas galerías se tomaron antes de terminar la decodificación/pintura. Se ajustaron únicamente las esperas del harness. Se conservaron ejemplos iniciales en [diagnóstico de pintura](screenshots/diagnostic-gallery-before-paint/). La versión final verifica decodificación, geometría y opacidad de las imágenes visibles.

Cuatro proyectos necesitaron una comprobación dirigida del mapa tras una espera inicial insuficiente: Vistamar, Plaza de Lourdes, Ferroparque y Eleuterio Ramírez. Los reprobes finales usaron `DOMContentLoaded`, `bringToFront`, estado de visibilidad y deadlines independientes de Node para tiles, metadatos y captura. Las RPC públicas terminaron con HTTP 200, sin operaciones comerciales. Las capturas finales muestran dirección, pin, calles, controles y atribución; no quedan spinners de la tarjeta de lugar.

Ferroparque conserva **dos mapas**. Su primer iframe está dentro de `details#etapa-2`, inicialmente cerrado. Se abrió su `summary` mediante un clic real antes de comprobarlo. Se preservaron las dos referencias de dirección, **Av. Bascuñán Santa María** y **Pasaje Bascuñán Santa María**, sin modificar HTML ni geocodificar.

Los reportes finales conservan `previousMapEvidence` y el vínculo al reprobe. Los intentos incompletos se mantienen para trazabilidad y no se usan como aceptación final:

- [Primer intento detenido](reprobes/map-reprobe/results.json).
- [Reprobe con deadlines: tres proyectos aprobados y diagnóstico del disclosure](reprobes/map-reprobe-bounded/results.json).
- [Ferroparque: ambos mapas aprobados](reprobes/map-reprobe-ferro/results.json).
- [Capturas anteriores](screenshots/maps-before/) y [capturas finales](screenshots/maps-after/).

## Estabilidad y preservación

Se corrigió el transporte del QA para limitar la concurrencia, liberar buffers y páginas, y terminar grupos de procesos propios con watchdog. La prueba ficticia [watchdog-test.json](transport/watchdog-test.json) confirmó que terminan el proceso padre y un hijo que ignora SIGTERM. Se rechaza una respuesta si `code !== 0`, hubo timeout o señal, antes de escribir la caché.

Las pausas conservaron las filas válidas; no se repitió la preparación certificada ni la eliminación de recorridos. Todos los navegadores de este core y sus reprobes terminaron cerrados. Esta tarea no ejecutó builds, deployments ni operaciones productivas.

La salida certificada sigue identificada por el inventario SHA256 `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`. Su verificación completa y las siete funciones corresponden al gate principal y al informe de recuperación.

## Archivos entregados

[Reporte completo](responsive-qa.json), [resumen](acceptance-summary.json), [proveniencia](provenance.json) e [índice de evidencia](evidence-index.json). Se incluyen los scripts usados, el watchdog y su prueba, los reprobes antes/después, **24 capturas representativas** de las seis fichas prioritarias por cuatro anchos y cinco capturas finales de mapas de los cuatro proyectos resueltos.

El reporte crudo conserva las rutas locales originales de todas las capturas. Este paquete versiona el subconjunto solicitado; las demás capturas se conservaron en el directorio local registrado en el índice. No se copiaron cachés HTTP, perfiles, `node_modules`, cookies ni valores de autenticación.

El manifiesto SHA256 cubre los archivos de esta entrega, excluyendo el propio manifiesto y `SHA256SUMS` para evitar referencias circulares. La etapa Production utiliza su propio ID y una caché separada; estos resultados identifican exclusivamente la Preview citada.
