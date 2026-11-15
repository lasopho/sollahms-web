# Continuidad autorizada — bloqueo de red CLI

Fecha: 2026-11-15T18:56:31-03:00, America/Santiago.

## Autorización vigente
El propietario autorizó expresamente el ciclo completo de corrección, Previews privadas, QA de las 131 fichas en 1440/768/390/320, preparación Production sin dominios, verificación y promoción final. No solicitar autorización nuevamente para estas etapas. La publicación está condicionada a aprobar todos los controles; no autoriza alterar contenido comercial, proveedores, secretos, CRM, AI Lab ni ampliar el alcance. Esta autorización reemplaza las prohibiciones históricas de publicación del prompt anterior, conservado en packaging-20261115.

## Comprobaciones realizadas
- HEAD remoto y PR #27: 7170f30aa56abef2001df2f74359a79f39e31dd2; abierto en Draft, misma base.
- CLI oficial 65.14.0 instalada mediante npx. Ayuda confirma --prebuilt, --environment, --skip-domain; no se ejecutó deploy.
- Salida aislada existente verificada otra vez antes del intento: 1.660 archivos, 66 cambios y 1.594 preservados; siete bundles / 57 archivos de funciones. Inventario SHA-256 f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0.
- Vinculación local aislada .vercel/project.json: prj_URomRRU0MAy4etGKP5gWv3Qv4DGH, team_A9VNIW2f2K1IJpd2pGdvDmEN. Sin cambios remotos de proyecto.
- SSO observado habilitado: all_except_custom_domains. Ambos aliases consultados conservan dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN.
- El deployment ERROR de Contacto dpl_3TUeGDo3eCjRVcG57KVRqnQuNR5v pertenece a otra rama y no fue creado ni modificado en esta intervención.

## Bloqueo exacto
El usuario informó haber completado el acceso por dispositivo. Al reanudar el proceso de login, el ejecutor devolvió: `Network access to "https://api.vercel.com:443" was blocked by policy.` La comprobación posterior `vercel whoami --format json --non-interactive` devolvió `loggedIn: false`, mostrando correctamente el proyecto vinculado.

Esto es un bloqueo de red del entorno, no una denegación del propietario ni prueba de credenciales incorrectas. No se intentó eludir la política mediante proxies, otros endpoints o extracción de tokens. No se dispone de una herramienta de cambio de red en esta sesión; el snapshot /etc/codex/network-policy.json tampoco está disponible. No afirmar qué regla administrativa concreta lo originó.

Acción necesaria: habilitar por el mecanismo normal del entorno el acceso HTTPS a api.vercel.com para la CLI, o continuar en un ejecutor permitido y autenticado. Si la sesión no quedó establecida, iniciar un nuevo flujo normal de login después de resolver la red. No reutilizar el código anterior ni guardar códigos/tokens en Git. La conexión Vercel del plugin funciona para consultas, pero no sustituye la autenticación de la CLI exigida para este procedimiento.

## Estado
No se creó nueva Preview ni Production, no se promovió, no se enviaron formularios ni se activaron proveedores. QA remoto nuevo: 0/131; 524 combinaciones ficha/ancho pendientes. Preparación local verificada; intervención NO APROBADA y NO PUBLICADA. Las pruebas históricas permanecen separadas.
