# Cierre de comprobación HTTPS y acceso SSO

Fecha: 15/11/2026, America/Santiago. Comprobaciones de red a las 21:54–21:55.

**Resultado: HTTPS funciona para la Preview y Google; el acceso a la aplicación está detenido en SSO. QA remoto y publicación pendientes.**

## Evidencia efectiva

| Destino | Resultado | Interpretación |
| --- | --- | --- |
| Nueva Preview, GET / | HTTP 302 hacia https://vercel.com/sso-api; curl 0; TLS válido | La conexión llega a Vercel; se requiere autenticación SSO |
| https://www.google.com/ | HTTP 200; curl 0; TLS válido | Acceso HTTPS efectivo |
| URL representativa www.google.com/maps | HTTP 301 → 200 en /maps/embed, mismo host; TLS válido | Endpoint de mapas accesible; carga visual en fichas pendiente |

No hubo CONNECT 403, HTTP 000, denegación del proxy ni error TLS en estas comprobaciones. La red del entorno actual declara la Preview y www.google.com permitidos, con observaciones actuales y política enforced. Esta evidencia sustituye el diagnóstico anterior de conectividad para estas conexiones, sin sobrescribir los registros históricos. Se omitieron cookies y queries SSO de la evidencia versionada.

## Identidad y acceso

La API de Vercel confirma Preview `dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi` READY, runtime declarado `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`, proyecto y equipo esperados, SSO habilitado `all_except_custom_domains`. Los metadatos de API no acreditan acceso autenticado al contenido ni ejecución remota de funciones.

En este ejecutor `VERCEL_OIDC_TOKEN` está ausente y la CLI no está en PATH. El directorio de sesión CLI y salida congelada documentados en el cierre anterior no existen. La credencial de automatización existente no incluye el nuevo hostname en su alcance. No se amplió ese alcance ni se usaron enlaces de compartición, bypasses o cambios de SSO. No se copiaron ni extrajeron credenciales. Se necesita una vía de autenticación existente autorizada para continuar la parte dependiente.

## Trazabilidad y preservación

Se identificó por GitHub la rama correcta `codex/eliminar-recorridos-global-20261115`, HEAD recibido `f975a005c4f4330996461d6d71134aaf678f3e26`, y el PR #27 abierto, Draft, sin merge, con su base reciente preservada. El checkout local preexistente `work@86e200e` contiene una versión anterior de 134 proyectos; no se usó como candidato de 131 fichas ni se alteró.

Las evidencias certificadas se conservaron en su ubicación versionada. Se indexan 117 archivos históricos con Git blob SHA en [historial-preservado.json](historial-preservado.json), incluido el informe principal antes del apéndice de esta sesión. Se archivó el [NEXT-PROMPT anterior](NEXT-PROMPT-anterior.md). No se ejecutó preparación, build, generadores, reinstalación de CLI ni repetición de pruebas certificadas.

El paquete certificado documentado conserva 1.660 archivos, 66 cambios y 1.594 preservados; siete bundles y 57 archivos de funciones; SHA256 de inventario `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`. Su existencia e integridad en este nuevo ejecutor no se afirman: el directorio no está presente. Recuperar el artefacto certificado será necesario antes de cualquier etapa productiva, sin repetir la preparación solicitada.

## Pendientes y decisión

- QA de esta sesión: **0/131 fichas y 0/524 combinaciones** a 1440/768/390/320 px. No se contaron respuestas SSO como fichas verificadas.
- Pendientes portada, rutas, recursos, siete endpoints, fuentes internas y QA funcional/responsive autenticado. No hay capturas remotas nuevas ni certificación visual de mapas.
- No se confirmó ni descartó ningún defecto bloqueante de la aplicación; falta acceso para evaluarla.
- No se creó Production, promovió, asignó dominios, publicó ni fusionó. La referencia productiva anterior `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN` se conserva como histórica; no se reconsultaron sus aliases aquí.
- No hubo envíos de formularios, leads, reservas, correos ni operaciones comerciales.

La autorización integral de QA y publicación condicionada sigue vigente y no necesita pedirse nuevamente. La publicación permanece detenida por los controles pendientes. Al disponer de acceso SSO aceptado y de los artefactos existentes, continuar automáticamente con el flujo documentado en [NEXT-PROMPT.md](../../../NEXT-PROMPT.md), conservando SSO, credenciales y evidencias.

[Evidencia estructurada](evidencia.json). El commit de esta entrega se identifica en el historial de estos archivos.
