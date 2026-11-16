# SOLLAHMS — futura Preview privada con Build Output API correcto

**Prompt preparado, no ejecutado. Sólo ejecutar la creación de deployment cuando el usuario autorice expresamente esta nueva Preview correctiva. La autorización de la primera Preview no basta.**

Repositorio: `lasopho/sollahms-web`.
Rama: `codex/eliminar-recorridos-global-20261115`.
PR #27: mantener abierto en Draft, misma base `codex/agenda-regions-responsive-20261115`.
Proyecto: `project-wrapp`, `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`.
Equipo: `team_A9VNIW2f2K1IJpd2pGdvDmEN`, slug `lsandoval2-8260s-projects`.
Producción esperada: `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`.
Runtime preservado: `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`.
Preview fallida: `dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF`.

## Lecturas y causa raíz

Leer AGENTS.md, NEXT-PROMPT.md, el informe de cierre y `docs/recorridos-eliminacion-20261115/packaging-20261115/INFORME-DIAGNOSTICO.md`.

El deployment fallido recibió `config.json`, `static/` y `functions/` como fuentes raíz y los sirvió como Static Assets. El ensamblador anterior sí escribía `.vercel/output/`, pero esa estructura no fue consumida como Build Output. No está archivado el payload exacto de creación; no inventarlo. No repetir la eliminación, no generar fichas desde main ni añadir `/static/` a sus enlaces.

La estructura preparada contiene `.vercel/output/config.json` v3, 1.602 archivos en `.vercel/output/static/` y 57 archivos en siete bundles bajo `.vercel/output/functions/api/*.func/`. Tiene 1.660 archivos en total; 66 cambios aprobados y 1.594 preservados respecto de producción congelada.

## Verificaciones previas

1. Releer HEAD y estado real PR Draft. Preservar cambios ajenos; si difieren los manifiestos fijados, detenerse y explicar la diferencia.
2. Consultar ambos aliases productivos y SSO `all_except_custom_domains`. Si producción cambió, no usar este candidato como futura base de publicación; documentar el delta y preservar producción. Esta etapa sólo permite Preview.
3. Confirmar auto-deploy de esta rama desactivado. No cambiar configuración.
4. Confirmar autenticación CLI existente para el equipo/proyecto, sin mostrar ni solicitar secretos en chat. Si falta, entregar al usuario el acceso normal; no crear bypass ni copiar credenciales de otros hostnames.
5. Revisar configuración disponible para Preview sin leer valores secretos. No activar proveedores ni cambiar variables. No usar un entorno personalizado `staging` por su nombre: el destino solicitado es Preview, con `VERCEL_ENV=preview`.

## Preparación reproducible local

Desde la raíz del checkout de la rama indicada, ejecutar sólo el ensamblador y comprobaciones siguientes. No ejecutar `vercel build`, `prepare-output.mjs`, generadores históricos ni despliegue ordinario.

```bash
REPO_ROOT="$PWD"
QA_DIR="$REPO_ROOT/docs/recorridos-eliminacion-20261115/packaging-20261115"
PACKAGING_PARENT="$(mktemp -d)"
PACKAGING_WORK="$PACKAGING_PARENT/preview"
python "$QA_DIR/prepare-isolated.py" "$PACKAGING_WORK" --report "$PACKAGING_PARENT/verification.json"
python "$QA_DIR/check-local.py" "$PACKAGING_WORK" "$PACKAGING_PARENT/local-http.json"
python - "$QA_DIR" "$PACKAGING_WORK" "$PACKAGING_PARENT/functions-check.json" <<'PY'
import pathlib,shutil,subprocess,sys
subprocess.run([shutil.which('node'),str(pathlib.Path(sys.argv[1])/'check-functions.mjs'),sys.argv[2],sys.argv[3]],env={'VERCEL_ENV':'preview'},check=True)
PY
```

El comprobador HTTP exige un archivo de informe nuevo y rechaza sobrescribir evidencia histórica. Los bytes runtime no se modifican. Los resultados nuevos nunca se atribuyen a QA remoto.

Pins obligatorios:

- `candidate-manifest.json` SHA-256: `ed39917d1639b797d2715fe585af89717637d324109db77eb4c603e75a1fcdaa`.
- `production-manifest.json` SHA-256: `120fc0c35ae7e3391f5be5b4c22eeae2c3c864722d25dd91d811dda10e213760`.
- `runtime-changes.json` SHA-256: `70f3d07fe0d9764b09e869cc67970bebbec5875ef749ab06517b540a95d490da`.
- Inventario canónico de salida SHA-256: `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`.
- `config.json`: SHA-1 `04e9bcfbdaedafe692af92f3409844151fd82ab3`, 3.916 bytes.

Exigir 1.660 hashes/tamaños coincidentes, 66 deltas exactos, siete imports y cero intentos externos. Los endpoints son advisory, booking-availability, booking-create, collaboration, contact, orientation-contact y uf. Las reservas conservan su política request-only; no habilitarlas.

## Única creación autorizable de Preview

Estos comandos están **reservados para después de la autorización expresa** de la nueva Preview. Comprobar primero que CLI oficial 65.14.0 admite `--prebuilt`, `--environment=preview`, `--cwd` y `--scope`; fue la versión observada en el log original. Si no existe o no admite esos flags, detenerse antes del deployment y documentar una alternativa oficial exacta, nunca improvisar un deploy ordinario. No actualizar dependencias del repositorio.

Vincular sólo el directorio aislado mediante IDs conocidos, sin crear un proyecto ni descargar secretos:

```bash
python - "$PACKAGING_WORK" <<'PY'
import json,pathlib,sys
p=pathlib.Path(sys.argv[1])/'.vercel/project.json'
assert not p.exists()
p.write_text(json.dumps({'projectId':'prj_URomRRU0MAy4etGKP5gWv3Qv4DGH','orgId':'team_A9VNIW2f2K1IJpd2pGdvDmEN','projectName':'project-wrapp'})+'\n')
PY
python "$QA_DIR/prepare-isolated.py" "$PACKAGING_WORK" --verify-only --report "$PACKAGING_PARENT/preupload.json"
```

Usar el binario oficial instalado de la versión comprobada, o `npx --yes vercel@65.14.0` si el entorno permite obtenerlo del registro oficial. No ejecutar ahora:

```bash
npx --yes vercel@65.14.0 deploy \
  --prebuilt \
  --environment=preview \
  --cwd "$PACKAGING_WORK" \
  --scope lsandoval2-8260s-projects \
  --meta githubCommitRef=codex/eliminar-recorridos-global-20261115 \
  --meta githubCommitSha=c97bfa5aba80329f18e3db8058ec5c3fada80cc4 \
  --meta packagingInventory=f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0
```

No pasar `--prod`, `--temporary`, `--force`, comandos promote/alias/redeploy ni `outputDirectory`. No desplegar desde `output/static` o `output` como raíz de un proyecto. No usar la API files ordinaria para subir el contenido como fuentes. Capturar ID/URL/entorno y logs sin secretos. No crear deployments de prueba adicionales por iniciativa propia. Si la herramienta solicita un proyecto nuevo o destino Production, detenerse.

## Aceptación de la nueva Preview

- READY más registro real de **siete funciones ejecutables**, no 1.660 Static Assets. Comprobar su clasificación en Resources/API y handlers. No aprobar sólo por READY o hashes.
- SSO conservado; ningún dominio productivo asignado al nuevo deployment. Ambos aliases de producción intactos.
- `/`, `/inn-puerto-chico.html`, `/assets/...` funcionales en sus rutas raíz. Recursos internos de funciones y config no deben quedar expuestos como assets.
- Verificar endpoints con métodos de rechazo y sin payloads comerciales; no ejecutar consultas UF/servicios externos si no están autorizadas. No enviar formularios, leads, correos, reservas ni operaciones CRM/Resend.
- Completar QA remoto de 131 fichas a 1440/768/390/320, priorizando INN, Bcome, Núcleo Costanera, Plaza Las Condes, Bordevivo y Distrito Centro. Comprobar galerías, planos, videos, navegación, encabezado/pie, campos, WhatsApp sin envío y carga de recursos. Distinguir problemas Maps del entorno.
- Guardar evidencias en un nuevo directorio, conservar QA fallido e histórico, actualizar INFORME-CIERRE.md y NEXT-PROMPT.md, mantener Draft y registrar SHA.

La tarea original sigue NO APROBADA hasta superar ese QA. No autorizar ni ejecutar producción, merge, promoción, dominios, credenciales, proveedores, cambios de seguridad o gastos.
