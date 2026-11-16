# Continuidad — HTTPS operativo; acceso SSO pendiente

Continuar la verificación y publicación autorizada de Sollahms. La autorización integral vigente comprende corrección acotada, Previews privadas, QA, Production aislado sin dominios y promoción final sólo después de aprobar todos los controles. No pedirla de nuevo. Conservar SSO y credenciales; no crear bypasses ni enlaces temporales de compartición.

## Estado nuevo comprobado

El 15/11/2026 a las 21:54–21:55, America/Santiago, HTTPS de la Preview respondió **302 hacia https://vercel.com/sso-api**, con curl exitoso y TLS verificado (`ssl_verify_result=0`). Es un límite de autenticación SSO, no un bloqueo de red. No se obtuvo contenido autenticado de la aplicación. `https://www.google.com/` respondió 200 y una URL representativa de mapas respondió 301 → 200 en `www.google.com/maps/embed`, también con TLS válido. Esto no certifica la carga visual de los mapas dentro de las fichas.

Preview: https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app/
Deployment: `dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi`, READY.
Runtime declarado: `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`.
Proyecto: `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`; equipo: `team_A9VNIW2f2K1IJpd2pGdvDmEN`.
SSO: habilitado, `all_except_custom_domains`.

Repositorio `lasopho/sollahms-web`, rama `codex/eliminar-recorridos-global-20261115`; HEAD recibido `f975a005c4f4330996461d6d71134aaf678f3e26`. PR #27 abierto, Draft, base `codex/agenda-regions-responsive-20261115` (`c2e1965ced736d46917a1bee286456cb937d58fe`). Leer AGENTS.md y el cierre nuevo: `docs/recorridos-eliminacion-20261115/https-sso-20261115T215402/INFORME-CIERRE.md`. El commit documental de esta entrega se obtiene del historial de NEXT-PROMPT.md.

## Conservar la preparación certificada

Las evidencias actuales se localizaron en GitHub; el checkout preexistente de este ejecutor (`work@86e200e`, 134 proyectos) es histórico y no debe usarse para reconstruir las 131 fichas ni para publicar. No se modificó ese checkout. El inventario de evidencias anteriores con sus Git blob SHA está en `docs/recorridos-eliminacion-20261115/https-sso-20261115T215402/historial-preservado.json`; el prompt previo está archivado junto al cierre.

Salida certificada documentada: `/workspace/work/tour-release/preview/.vercel/output`, 1.660 archivos, 66 cambios autorizados, 1.594 preservados, siete bundles/57 archivos; inventario SHA256 `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`. **Esa salida y el directorio de sesión CLI documentado no existen en este ejecutor nuevo.** No se regeneraron. Recuperar los artefactos existentes mediante su mecanismo autorizado; conservar sus hashes. No repetir la preparación ni pruebas certificadas por reanudar.

En este ejecutor no hay `VERCEL_OIDC_TOKEN`; la CLI no está en PATH. La credencial de automatización configurada conserva alcance sólo para dos Previews anteriores, no para la nueva. No copiar, extraer, reemplazar ni ampliar credenciales. Usar exclusivamente una sesión SSO o CLI ya autorizada que pueda acceder a esta Preview. No usar conectores que creen/reutilicen share links, ni desactivar SSO. La autorización de publicación no sustituye autenticación de aplicación.

## Próximos pasos

1. Revalidar HEAD, PR Draft, Preview READY y SSO, conservando cambios posteriores. Resolver el acceso autenticado con una vía existente autorizada; distinguir SSO, errores de aplicación y bloqueos de red. No volver a tratar esta conexión 302 como CONNECT 403.
2. Con acceso efectivo, verificar portada, las 131 rutas originales, recursos, siete endpoints con métodos seguros y fuentes internas no expuestas. Ejecutar `tests/qa-project-tour-removal.mjs` para **524 controles** a 1440/768/390/320 px. Comprobar medios, planos, mapas, navegación, controles y campos, WhatsApp, consola, overflow, huecos y superposiciones, sin enviar leads, reservas, correos ni operaciones CRM/Resend.
3. Sólo tras aprobar todo y disponer de los artefactos certificados, preparar los mismos bytes en Production aislado, desplegar oficialmente con `--prebuilt --environment=production --skip-domain`, verificar ese Production y promover exclusivamente su ID. No promover la Preview. Comprobar HTTP/HTTPS de ambos dominios; conservar el deployment anterior. Producción de referencia histórica: `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`; reconsultar antes de cualquier cambio.
4. Actualizar documentación y PR tras hitos, conservar evidencias y actualizar NEXT-PROMPT.md. Mantener Draft mientras falte QA; no fusionar por defecto.

Esta sesión: **0/131 fichas y 0/524 controles remotos ejecutados; publicación no intentada**. Las comprobaciones históricas siguen siendo históricas. No se confirmó ni descartó la presencia de defectos bloqueantes de la aplicación. Mantener la publicación pendiente hasta superar los controles. Sin cambios comerciales, de CRM/AI Lab/proveedores, credenciales, dominios, gastos ni ampliación de alcance.
