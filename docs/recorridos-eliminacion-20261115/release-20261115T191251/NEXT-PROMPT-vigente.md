# Continuidad — acceso efectivo, QA y publicación condicionada de Sollahms

Continúa en `lasopho/sollahms-web`, rama `codex/eliminar-recorridos-global-20261115`, PR #27 Draft. Lee AGENTS.md y, bajo `docs/recorridos-eliminacion-20261115/`, INFORME-CIERRE.md, release-20261115T191251/INFORME-CIERRE.md, AUTORIZACION-ALCANCE.md y REVALIDACION-193435.md de ese directorio. El prompt detallado anterior quedó archivado allí. Verifica HEAD y conserva cambios ajenos. Este prompt no autoriza su ejecución automática.

El propietario ya autorizó corrección, Previews, QA completo, Production sin dominios y publicación/promoción final condicionada a superar todos los controles. No solicitar nuevamente esa autorización.

Estado revalidado el 15/11/2026, 19:34:35 America/Santiago:
- PR https://github.com/lasopho/sollahms-web/pull/27, Draft, base `codex/agenda-regions-responsive-20261115`, SHA `c2e1965ced736d46917a1bee286456cb937d58fe`.
- HEAD recibido `a7d68bb890fe770b3771e7df4848116e7128f76a`; runtime `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`; hito prebuilt y runner `23de970853a2d2e1235cd9cf71addecefc7caa70`. Los commits siguientes sólo documentan revalidación.
- Preview prebuilt READY `dpl_5qdzW9mh6QQKoe7ebWTswnBDnMCi`: https://project-wrapp-nx82ysqwn-lsandoval2-8260s-projects.vercel.app/ . Siete `/api/...` registrados como lambdas; ejecución remota pendiente.
- Vercel `project-wrapp`, proyecto `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`, slug `lsandoval2-8260s-projects`. SSO `all_except_custom_domains` conservado.
- Producción y ambos aliases siguen en `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`; SHA Git desconocido. No hay Production nuevo ni publicación final.

Reutiliza lo completado: salida `/workspace/work/tour-release/preview/.vercel/output`, 1.660 archivos, 66 cambios y 1.594 preservados; siete bundles y 57 archivos de funciones. Inventario SHA-256 `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`. Pasaron 1.603 GET locales y siete imports/rechazos. No repetir eliminación, generadores históricos, empaquetado ni pruebas certificadas sin cambios.

Bloqueo actual: el entorno activo sigue en revisión efectiva 1 y no permite el hostname de Preview. Un nuevo vercel curl autenticado devuelve CONNECT 403 y HTTP 000. La sesión CLI existe; no es falta de autorización del propietario. Debe aplicarse acceso HTTPS real al ejecutor, sin eludir la política, desactivar SSO, divulgar secretos ni crear enlaces temporales de compartición. La vía del conector que crea esos enlaces fue rechazada automáticamente anteriormente.

La CLI 65.14.0 usa caché `/workspace/work/tour-release/npm-cache` y sesión en los directorios XDG de `/workspace/work/tour-release/`. La receta exacta está en NEXT-PROMPT-anterior-193435.md. No copiar autenticación a Git ni pedir tokens. Reautenticar normalmente sólo si whoami indica sesión ausente.

Pasos:
1. Comprueba si cambió efectivamente la política y prueba una conexión nueva a la Preview. Si sigue CONNECT 403, informa ese bloqueo; no atribuyas controles remotos completados ni recrees deployments.
2. Con acceso, verifica `/`, las 131 rutas originales, assets, siete endpoints con métodos seguros y que config/fuentes internas no estén expuestas. No aceptar /static/ como ruta alternativa.
3. Ejecuta las 524 combinaciones de 131 fichas a 1440/768/390/320 con el runner `tests/qa-project-tour-removal.mjs`, QA_REQUIRE_REMOTE=1 y evidencias nuevas. Revisa medios, planos, formularios, WhatsApp, mapas, navegación, consola y composición. Prioriza INN, Bcome, Núcleo Costanera, Plaza Las Condes, Bordevivo y Distrito Centro. No enviar leads, reservas, correos ni operaciones CRM/Resend.
4. Tras aprobar todo: revisar PR y producción actual, preservar cambios posteriores, preparar los mismos bytes en Production aislado y desplegar oficialmente con `--prebuilt --environment=production --skip-domain`. Verificar ese Production y sus funciones antes de promoverlo; no promover directamente la Preview. Comprobar HTTP/HTTPS de ambos dominios y conservar el deployment previo para recuperación.
5. Actualiza PR y cierre tras hitos, conserva historia, genera NEXT-PROMPT.md y entrega enlaces, SHA y prompt íntegro. Mantén Draft mientras falte QA; no fusionar por defecto.

Protecciones: sin cambios comerciales, CRM, AI Lab, proveedores, credenciales del sitio, sitemap o páginas ajenas; sin gastos ni ampliación de alcance. La publicación sólo se acepta con las 131 fichas, cuatro anchos, siete funciones, preservación y ambos dominios comprobados. Estado actual: 0/131 fichas y 0/524 combinaciones remotas; intervención parcial, no publicada.
