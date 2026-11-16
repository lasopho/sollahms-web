# SOLLAHMS — eliminación de recorridos completada y publicada

Objetivo completado el **16/11/2026, America/Santiago**. No quedan controles de publicación pendientes. No repetir preparación, eliminación, QA certificado ni crear/promover otro deployment por el solo hecho de retomar.

La versión final está en [sollahms.cl](https://sollahms.cl/). `www.sollahms.cl` conserva 308 hacia el dominio principal. Ambos aliases quedaron asignados al mismo Production verificado el **16/11/2026 a las 01:23:43 Santiago**; confirmación API a las 01:23:57.

- Deployment vigente: `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`.
- [Hostname inmutable protegido](https://project-wrapp-jteux3lm5-lsandoval2-8260s-projects.vercel.app/).
- Runtime declarado: `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`.
- Commit de aprobación QA: `7ebad405d403f62306039b08193a58b35bef8bfc`. El HEAD documental final se obtiene con `git log -1 --format=%H -- NEXT-PROMPT.md`; consultar también el remoto real y conservar avances posteriores.
- Artefacto: 1.660 archivos, 66 cambios aprobados / 1.594 idénticos; 1.602 estáticos, 57 archivos en siete bundles y config v3.
- SHA256 canónico: `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`.
- Anterior para recuperación: `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`; no fue eliminado.

Trabajar únicamente en el checkout independiente `/private/tmp/sollahms-recorridos-20261115-local`, rama `codex/eliminar-recorridos-global-20261115`. No tocar ni cambiar de rama `/Users/luissandoval/Documents/sollahms-web`, con trabajo de otras intervenciones, ni `/Users/luissandoval/Projects/sollahms-publicacion` de Contacto.

Leer `AGENTS.md` y [cierre final](docs/recorridos-eliminacion-20261115/local-qa-20261115/INFORME-CIERRE.md). [PR #27](https://github.com/lasopho/sollahms-web/pull/27) permanece **abierto y Draft** por instrucción del propietario, incluso después de publicar. No fusionar ni marcar ready automáticamente. Su base es `codex/agenda-regions-responsive-20261115` (`c2e1965ced736d46917a1bee286456cb937d58fe`); `main` es histórico y no se utilizó para reconstruir las 131 fichas.

Las evidencias finales certifican:

- Preview: 131 fichas × 1440/768/390/320 px = 524 parejas únicas; 476 mediciones de 119 mapas; cero recorridos, imágenes rotas, huecos, overflow o excepciones JS.
- Encabezados/pies: 524 controles y 18 menús móviles aprobados. Interacciones/formularios/galerías/planos en 131 fichas; 730 clics de navegación, 262 modalidades/validaciones vacías/CTA; siete comparadores más bloqueo de una sola lámina.
- Recursos: 1.485 rutas HTTP verificadas; identidad del contenido ligada al artefacto.
- Production aislado: 1.660 rutas/SHA1 coincidentes, siete lambdas, 153 HTTP seguros y 24 casos de navegador. Caché propia, cero respuestas de Preview reutilizadas.
- Público: 608/608 controles aprobados; 528 HTML exactos en cuatro orígenes HTTP/HTTPS de apex/www, 38 recursos, 14 métodos seguros, 12 controles internos y 16 retiros 410. TLS y redirects correctos.
- Cero formularios enviados, campos modificados, leads, reservas, correos u operaciones CRM/Resend. Se verificaron métodos seguros; no se afirma entrega real de proveedores sin haberla probado.

Se documentaron 116 advertencias preexistentes del parser sobre `allow`/`allowfullscreen` y bloqueos deliberados de toolbar/telemetría durante QA; no son cambios de la aplicación ni se declaran cero advertencias. No hay videos publicados en las fichas; siete referencias internas de investigación Sento permanecen conservadas y no desplegadas. Los reprobes abrieron mediante clic real `Etapa 2` de Ferroparque para conservar/verificar sus dos mapas y direcciones distintas.

SSO sigue habilitado `all_except_custom_domains`. No hubo cambios de credenciales, variables, proveedores, precios, sitemap o seguridad; no se crearon bypasses/sharelinks. CLI 65.16.0 y Node 24.22.3 locales verificados. No usar conectores de fetch que creen enlaces temporales ni `--verify` que pueda generar un bypass. Los deployments automáticos continúan desactivados.

Las salidas existentes están en `/private/tmp/sollahms-recorridos-recovery/output` y `/private/tmp/sollahms-recorridos-production-20261116/.vercel/output`. Se recuperaron directamente de fuentes desplegadas y se transfirieron idénticas; no se corrieron builders/preparadores/generadores ni suites históricas para reanudar. Si esos temporales desaparecen, recuperar los mismos bytes por API autenticada de fuentes del deployment publicado, usando las 1.660 rutas/SHA del certificado versionado; no usar `main` ni generar otra versión. El script histórico archivado apunta a la Preview correctiva: verificar el target antes de cualquier recuperación futura.

La promoción utilizó el Production ya probado y **no reconstruyó**. Los recibos, gates, manifiestos, hashes, capturas, incidencias del harness y verificación pública están bajo `docs/recorridos-eliminacion-20261115/local-qa-20261115/`.

Contacto permanece separado: PR #26/#28, SHA aprobado `967d556730e20ef86bae6ecee11ec6152434c8ae`, únicamente `contacto.html`, sin intersección textual con Recorridos. Se conservaron la versión productiva de contacto y sus ramas, sin incorporar el overlay todavía no publicado ni sustituir los bundles certificados por su construcción alternativa B. Se informó el nuevo baseline ByUhr a la otra tarea. Cualquier futura publicación de Contacto debe conciliarse con este baseline y mantener los 64 HTML y dos CSS sin recorridos; su autorización productiva propia no se amplió. Evitar publicaciones simultáneas y no promover su paquete basado en 9zz sin conciliación.

La autorización integral de esta intervención se ejecutó completa; no debe solicitarse otra vez ni utilizarse para ampliar el alcance a trabajos ajenos. Si se retoma sin un encargo nuevo, informar el cierre y preservar este estado.
