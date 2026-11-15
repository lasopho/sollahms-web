# SOLLAHMS — reanudar corrección, QA y publicación autorizadas

Repositorio lasopho/sollahms-web; rama codex/eliminar-recorridos-global-20261115; PR #27 Draft; base codex/agenda-regions-responsive-20261115.

## Autorización vigente
El propietario autorizó completar autónomamente corrección técnica, Previews privadas, QA completo, preparación Production sin asignación de dominios y publicación/promoción final, únicamente después de aprobar todos los controles. No pedir otra autorización para estas etapas. Las prohibiciones históricas de publicación del prompt packaging-20261115 están superadas. No alterar credenciales/seguridad/proveedores, CRM, AI Lab, contenido comercial, otras páginas ni sitemap; no generar gastos.

## Estado y primer paso
Leer AGENTS.md, INFORME-CIERRE.md, packaging-20261115/INFORME-DIAGNOSTICO.md, packaging-20261115/NEXT-PROMPT-CORRECCION.md y continuidad-autorizada-20261115/INFORME-BLOQUEO.md dentro de docs/recorridos-eliminacion-20261115. Verificar HEAD remoto y preservar cambios posteriores. No reconstruir desde main.

La CLI 65.14.0 está instalada y admite --prebuilt, --environment y --skip-domain. Su login fue interrumpido por la política de red del ejecutor hacia https://api.vercel.com:443. whoami reporta loggedIn:false. Resolver el acceso por la configuración normal del entorno o usar un ejecutor permitido; no eludir políticas ni extraer secretos. Después comprobar sesión con `npx --yes vercel@65.14.0 whoami --format json --non-interactive`; iniciar un nuevo login normal sólo si sigue sin sesión. No usar el código de acceso anterior. Este requisito de acceso no revoca ni renueva la autorización del propietario.

## Preparación preservada
Salida existente: /workspace/scratch/11cb6972c409/preview-corrected/.vercel/output. Su project.json aislado vincula prj_URomRRU0MAy4etGKP5gWv3Qv4DGH con team_A9VNIW2f2K1IJpd2pGdvDmEN (slug lsandoval2-8260s-projects).
Si no existe, ensamblarla con prepare-isolated.py siguiendo el procedimiento histórico, sin generadores ni vercel build. Si existe, verificarla; no repetir pruebas históricas sin cambios.

Pins: candidato ed39917d1639b797d2715fe585af89717637d324109db77eb4c603e75a1fcdaa; producción 120fc0c35ae7e3391f5be5b4c22eeae2c3c864722d25dd91d811dda10e213760; delta 70f3d07fe0d9764b09e869cc67970bebbec5875ef749ab06517b540a95d490da; inventario preparado f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0.
Conservar 1.660 archivos, 66 cambios autorizados /1.594 preservados, 57 archivos en siete bundles. Runtime c97bfa5aba80329f18e3db8058ec5c3fada80cc4. Preparación documental 7170f30aa56abef2001df2f74359a79f39e31dd2.

## Preview y QA obligatorios
Verificar proyecto, equipo, SSO all_except_custom_domains, producción actual y manifiestos. Producción de referencia dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN. Si cambió, conciliar los cambios posteriores antes de publicar; no perderlos.

Desde el directorio aislado confirmado ejecutar:
```bash
npx --yes vercel@65.14.0 deploy --prebuilt --environment=preview --cwd /workspace/scratch/11cb6972c409/preview-corrected --scope lsandoval2-8260s-projects --meta githubCommitRef=codex/eliminar-recorridos-global-20261115 --meta githubCommitSha=c97bfa5aba80329f18e3db8058ec5c3fada80cc4 --meta packagingInventory=f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0
```
No deploy ordinario, no --temporary, no cambio de seguridad ni --verify que cree bypass automáticamente. Confirmar entorno Preview y guardas existentes; no activar Resend/CRM.

READY no basta: comprobar siete funciones ejecutables, rutas raíz / y /inn-puerto-chico.html, las 131 fichas, assets, config y ausencia de fuentes internas servidas. QA remoto completo de 131 fichas en 1440/768/390/320 (524 combinaciones); no extrapolar una muestra. Priorizar INN Puerto Chico, Bcome, Núcleo Costanera, Plaza Las Condes, Bordevivo y Distrito Centro. Verificar eliminación, huecos, imágenes, galerías, planos, videos, mapas, encabezados/pies, navegación, campos y WhatsApp. No enviar formularios, leads, reservas, correos ni operaciones CRM/Resend. Separar bloqueos externos de defectos del deployment. Corregir sólo lo necesario, actualizar hashes y repetir pruebas afectadas con nueva Preview si corresponde.

## Producción sólo tras QA aprobado
Revisar delta PR y preservar cambios ajenos. Preparar el mismo runtime aprobado para Production, verificando entorno/configuración y hashes. Usar el procedimiento oficial desde la salida aislada:
```bash
npx --yes vercel@65.14.0 deploy --prebuilt --environment=production --skip-domain --cwd DIRECTORIO_PRODUCTIVO_AISLADO_VERIFICADO --scope lsandoval2-8260s-projects
```
DIRECTORIO_PRODUCTIVO_AISLADO_VERIFICADO es un marcador que debe reemplazarse por la ruta realmente preparada y revisada, nunca ejecutarlo literalmente. No promover la Preview. Verificar el nuevo Production sin dominios: siete funciones, rutas, assets, manifiesto idéntico, configuración/guardas correctas. Después promover exclusivamente ese ID Production verificado con `vercel promote ID_PRODUCTIVO_VERIFICADO --scope lsandoval2-8260s-projects`. Conservar el ID anterior para recuperación.

Verificar sollahms.cl y www.sollahms.cl, HTTP/HTTPS, portada/fichas/recursos/funciones y campos sin enviar datos. Registrar fecha America/Santiago, deployment definitivo, SHA, hashes, resultados, capturas y límites. No declarar terminada hasta completar todos los criterios. Mantener PR Draft mientras el QA esté pendiente; no fusionar por defecto. Actualizar INFORME-CIERRE.md y NEXT-PROMPT.md después de hitos, conservar toda evidencia histórica y entregar enlaces y siguiente prompt completo.
