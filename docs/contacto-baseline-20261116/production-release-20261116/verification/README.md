# Verificación del nuevo Production aislado de Contacto

**PASS — 16/11/2026, 10:47:06 America/Santiago.** Esta evidencia queda cerrada antes de la promoción. El verificador no creó deployments, no asignó dominios y no realizó ninguna promoción.

Deployment: `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`. URL: [Production aislado](https://project-wrapp-4l11wr2s0-lsandoval2-8260s-projects.vercel.app/).

El source commit declarado de este Production es `534bf362b8960e275f5b8b42b5c786027906a4cb`, HEAD documental del candidato de PR #29. El contenido ya probado en Preview procede de `a1f2930475e23ebb87bac1f8443877b06883fe60`; los bytes son los mismos y el inventario sigue siendo `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`.

## Controles aprobados

- READY, target Production, prebuilt=true y proyecto/equipo esperados.
- 1.660 rutas/SHA1 coinciden con el manifiesto candidato, conservando 1.659 archivos de ByUhr y el único delta autorizado en Contacto. Siete lambdas están registradas; los 57 archivos de funciones permanecen preservados.
- El nuevo ID tiene **cero aliases**, verificados antes y después, y `autoAssignCustomDomains=false`. Los dominios `sollahms.cl` y `www.sollahms.cl` siguen en ByUhr durante toda esta verificación.
- No se utilizó `project.targets.production` como criterio del baseline: ese campo puede reflejar el staging. La comprobación de continuidad productiva utiliza los dos aliases públicos reales.
- SSO `all_except_custom_domains`, variables de sistema, Node 24.x, integración Git y reglas automáticas se conservan frente al preflight. Las reglas de `main`, la rama de integración y Recorridos continúan en false. No se modificó ninguna configuración.
- 32/32 casos HTTP autenticados aprobados: Contacto, once recursos locales, portada, seis fichas representativas, siete métodos seguros de funciones, cinco rutas de fuentes internas y Patio Brasil 410.
- **Los 24 cuerpos con una fuente estática esperada son byte exacto.** No hubo sufijo de toolbar ni se aplicó la firma de Preview. Los ocho casos restantes son rechazos seguros de método, incluido el alias de función `.mjs`.
- GET advisory/contact/collaboration/orientation-contact devuelve 405. GET booking-availability/create devuelve 503 con el cuerpo `booking_not_certified`, request-only, idéntico al baseline. UF se comprueba sólo con HEAD 405, sin lookup externo.
- Las cuatro rutas internas de documentación/config/bundle devuelven 404. `/api/contact.mjs` ejecuta el rechazo JSON 405 por el rewrite preservado, sin servir el código. Patio Brasil conserva 410 y noindex.
- Un GET anónimo sin curlrc, cookies, headers de autenticación ni bypass devuelve 302 hacia el host `vercel.com`, con `ssl_verify_result=0`. Sólo se conservan esos tres datos del control.

## Evidencia y campos del gate

`verification-summary.json` es una copia exacta del resumen final ejecutado. Sus campos principales son `passed=true`, `deployment`, `candidate_inventory_sha256`, `source_commit`, `candidate_content_source_commit`, `expected_source_files=1660`, `baseline_preserved_files=1659`, `function_bundles=7`, `function_files=57`, `http_authenticated_completed=32`, `checks`, `failures=[]` y `active_own_process_groups=[]`.

`gate-summary.json` proporciona los conteos observados: 1.660 fuentes cotejadas, siete registros lambda, 32 respuestas aprobadas, 24 cuerpos byte exactos, listas de aliases del nuevo ID vacías y control de los dos dominios en ByUhr. `source-comparison.json` y `registered-functions.json` contienen sus registros de respaldo. `http-results.json` conserva hashes/tamaños/status y únicamente cabeceras de seguridad permitidas. El plan de 32 casos queda en `http-plan.json`.

La API del árbol no expone tamaños en sus registros. Sus direcciones SHA1 se compararon contra el certificado que fija tamaños/SHA1/SHA256; no se afirma una lectura remota independiente de 1.660 tamaños ni se redescargaron los cuerpos fuente. Los cuerpos HTTP de la muestra sí se compararon directamente por tamaño y SHA256.

## Límites y seguridad

No se repitieron las matrices históricas de 524 controles o 1.485 rutas ni se ejecutaron builders, generadores o env pulls. Este control no sustituye la revisión de navegador que el agente correspondiente realiza sobre el nuevo Production aislado.

Cero formularios, leads, reservas o correos enviados; cero consultas a CRM/Resend o proveedor UF, escrituras API, cambios de credenciales/protecciones, creación/promoción de deployments o procesos propios pendientes. Se usó CLI 65.16.0 autenticada desde un cwd sin vínculo, con helpers auditados, ID explícito, watchdog de 55 segundos y limpieza exclusivamente de sus propios grupos de procesos.

Se excluyen cuerpos de caché, headers crudos, cookies, tokens, queries SSO, perfiles y respuestas API completas sin filtrar. Los JSON versionados contienen proyecciones permitidas. El script archivado realiza sólo lecturas y métodos GET/HEAD; cualquier diferencia HTML habría detenido la aceptación para diagnosticarla, sin normalizar contenido arbitrario.

`manifest-sha256.json` fija bytes/SHA256 de todos los archivos de este paquete salvo el propio manifiesto. El paquete queda inmutable para el gate del agente principal. No se hicieron nuevos HTTP ni repeticiones de QA al empaquetarlo, ni commits desde este subtask.
