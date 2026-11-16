# Verificación del Production aislado — 16/11/2026

**Resultado: PASS. Este paquete no ejecuta ni acredita una promoción.** Al cerrarlo, la promoción seguía pendiente del smoke visual de 24 controles y de la decisión coordinada del agente principal.

Deployment: `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`. URL: [Production aislado](https://project-wrapp-jteux3lm5-lsandoval2-8260s-projects.vercel.app/). Comprobación terminada a las 01:12:12, America/Santiago, el 16/11/2026 (`2026-11-16T04:12:12.419549+00:00`). Runtime declarado: `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`; rama `codex/eliminar-recorridos-global-20261115`.

- READY, target Production y prebuilt=true; proyecto/equipo esperados.
- SSO `all_except_custom_domains` y exposición de variables de sistema conservados. `autoAssignCustomDomains=false`, lista de aliases vacía y ningún dominio personalizado asignado a este deployment durante la verificación.
- 1.660/1.660 rutas fuente y SHA1 coinciden con el inventario certificado; siete lambdas registradas bajo `out/api/`.
- 153/153 comprobaciones HTTP aprobadas: raíz,131 fichas,14 recursos representativos y siete métodos seguros. Los146 cuerpos estáticos coinciden byte por byte con el artefacto; no necesitaron retirar el sufijo Vercel observado en Preview.
- GET de advisory/collaboration/contact/orientation-contact devuelve 405; GET de booking-availability/booking-create devuelve 503 con el cuerpo request-only existente; HEAD de UF devuelve 405 sin consulta externa. Los seis cuerpos GET coinciden con los rechazos ya verificados en Preview. No se hicieron envíos ni comprobaciones comerciales reales.

## Integridad y límite del inventario remoto

Inventario canónico certificado SHA256: `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`.

La API de árbol no expuso tamaños en ninguno de los 1.660 registros. Se compararon todas las rutas y direcciones de contenido SHA1 con el inventario certificado, que ya fija tamaño/SHA1/SHA256 de los bytes recuperados. Así quedan vinculados los tamaños al mismo contenido; **no se presenta como una lectura independiente de 1.660 tamaños remotos**. No se volvieron a descargar esos archivos. La API sí acredita sus direcciones de contenido y el registro separado de las siete lambdas.

## Archivos

`verification-summary.json` contiene el dictamen y todos los controles. `metadata.json`, `project-protection.json` y `deployment-aliases.json` guardan sólo campos permitidos. `deployment-tree.json` es una proyección filtrada de path/tipo/uid/mode/size, sin la respuesta API completa. `source-manifest-comparison.json` conserva el cotejo por ruta; `registered-functions.json` el registro de las siete funciones. `http-results.json` conserva status, hashes, tamaños y cabeceras de seguridad seleccionadas, sin cuerpos ni headers crudos/cookies.

`verify-production.py` y `expected.json` son copias exactas de los inputs del verificador ejecutado. Se archivan como evidencia; no se ejecutaron de nuevo al empaquetar. El script conserva las rutas absolutas del ejecutor original en `/private/tmp/sollahms-recorridos-production-verify` y de su cwd de CLI sin vínculo en `/private/tmp/sollahms-recorridos-access`; copiarlo a este directorio no lo convierte en un nuevo comando de publicación.

El verificador sólo admite el ID explícito de un Production nuevo y exige el gate de QA aprobado. Usa CLI 65.16.0 autenticada, GET de API y GET/HEAD HTTP, caché separada por ID, watchdog de 55 segundos y limpieza exclusivamente de su propio grupo de procesos mediante SIGTERM/SIGKILL, incluso ante SIGINT/SIGTERM del runner. Terminó con cero grupos propios activos.

No se incluyen cachés de cuerpos, headers crudos, perfiles de navegador, node_modules, variables/credenciales, tokens ni respuestas API completas sin filtrar. Cero escrituras API, formularios enviados o cambios de protecciones/credenciales. No se creó ni promovió ningún deployment desde este verificador o desde esta operación de empaquetado.

`manifest-sha256.json` enumera los bytes y SHA256 de todos los archivos de este paquete salvo el propio manifiesto. El informe general y NEXT-PROMPT son responsabilidad del agente principal; este subdirectorio es la evidencia congelada anterior a promoción.
