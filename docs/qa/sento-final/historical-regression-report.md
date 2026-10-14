# Cierre de regresión histórica Sento — 14 de octubre de 2026

**323/323 Node, 130/130 Python y validador hipotecario aprobados.** Los 323 casos Node se ejecutaron en 32 lotes equivalentes y trazables, con los mismos archivos, nombres literales, clasificación y asserts. El resultado corresponde a una composición verificada de lotes; no se presenta como una única ejecución monolítica.

Recibo completo con cada comando, entorno, duración, caso efectivo, hash de test y hash TAP: [coverage-complete.json](coverage-complete.json). Plan exacto antes de ejecutar: [coverage-plan.json](coverage-plan.json).

## Tres fallas originales

El intento original terminó 320/323 Node y 130/130 Python. Los tres errores fueron inventarios históricos que no proyectaban todas las adiciones ya autorizadas. Se conservan los errores y TAP originales.

| Archivo y línea | Nombre exacto | Error original | TAP original |
| --- | --- | --- | --- |
| `tests/aj-urbana.test.mjs:179` | 531 historical assets and handlers retain strict baselines outside the scoped official UF and privacy changes | Expected values to be strictly deep-equal; inventario incluye seis PDF y recursos nuevos Sento, sento.css y norte-verde.css. | [AJ Urbana](../sento/git-ci-original/node-aj-urbana.test.log) |
| `tests/ingevec-brochures.test.mjs:214` | 531 historical assets retain hashes outside the scoped official UF changes and reviewed image additions | Expected values to be strictly deep-equal; único extra assets/css/norte-verde.css. | [Ingevec](../sento/git-ci-original/node-ingevec-brochures.test.log) |
| `tests/official-contexts.test.mjs:340` | all 521 integration assets and 509 historical originals retain their hashes outside the exact official UF UI change; ten official images retain complete provenance | No other asset additions/deletions are authorized; único extra assets/css/norte-verde.css. | [Official contexts](../sento/git-ci-original/node-full-git-suites.log) |

La corrección previa usa `historicalAssetFiles` para proyectar exclusivamente `assets/propiedades/sento/`, `assets/brochures/sento/`, `assets/css/sento.css` y el CSS Norte Verde ya existente antes de Sento. Ese último archivo solo se admite si su SHA-256 sigue siendo `6751bd4aaae873c44a7135df46178c7a834de0a266fbf8db847d458380a913b7`. Se mantienen los inventarios y hashes individuales de 531 recursos en AJ/Ingevec y de 521/509 recursos en official-contexts, además de los controles de APIs, datos financieros, contextos y otros HTML.

En esta solicitud final no se editaron las pruebas históricas, sus helpers, clasificación ni pins. Los SHA-256 de las tres suites, el helper y la clasificación siguen coincidiendo con [three-failures-fix-confirmation.json](three-failures-fix-confirmation.json). El recibo compuesto comprueba también cada archivo de las 32 suites contra el plan original. Las nuevas comprobaciones específicas de presentación Sento se documentan por separado en el informe principal.

Tres comprobaciones negativas en una copia adicional confirman que un recurso ajeno continúa visible al inventario estricto, un CSS Norte Verde alterado es rechazado por el pin y un precio Sento arbitrario es rechazado antes de la proyección: [helper-negative-probes.json](helper-negative-probes.json). Solo se mutó temporalmente el CSS de esa tercera copia y se restituyó a su hash original; no se modificó el clone de trabajo ni la copia de regresión.

## Ejecuciones individuales

Cada una ejecutó exactamente su nombre mediante `--test-name-pattern` anclado, `--test-concurrency=1` y TAP. Cada resultado es 1/1, cero fallos, cero omitidos y cero cancelados.

| Ejecución | Entorno | Segundos | Recibo / comando / TAP |
| --- | --- | ---: | --- |
| individual-aj | Clone de trabajo | 79.529163 | [runs/individual-aj.json](runs/individual-aj.json) · [TAP](runs/individual-aj.tap) |
| individual-ingevec | Clone de trabajo | 3.038142 | [runs/individual-ingevec.json](runs/individual-ingevec.json) · [TAP](runs/individual-ingevec.tap) |
| individual-contexts | Clone de trabajo | 2.793565 | [runs/individual-contexts.json](runs/individual-contexts.json) · [TAP](runs/individual-contexts.tap) |
| clean-individual-aj | Copia limpia independiente | 94.531045 | [runs/clean-individual-aj.json](runs/clean-individual-aj.json) · [TAP](runs/clean-individual-aj.tap) |
| clean-individual-ingevec | Copia limpia independiente | 2.317452 | [runs/clean-individual-ingevec.json](runs/clean-individual-ingevec.json) · [TAP](runs/clean-individual-ingevec.tap) |
| clean-individual-contexts | Copia limpia independiente | 2.073104 | [runs/clean-individual-contexts.json](runs/clean-individual-contexts.json) · [TAP](runs/clean-individual-contexts.tap) |

## Entorno limpio y causa de los tiempos de espera

El clone inicial dependía de `objects/info/alternates` hacia el repositorio de iCloud. Sus packs locales no incluían el grafo completo: el control independiente detectó commits/blobs faltantes. En la fuente había 2.452 objetos loose marcados `dataless`; se observaron lecturas de archivos comprimidos de pocos KB que tardaron segundos o decenas de segundos, y finalmente `Errno 60: Operation timed out`. La copia local incompleta nunca se utilizó como una historia Git válida para aprobar tests. Diagnóstico conservado en [git-cache-first-check.json](git-cache-first-check.json), [source-loose-object-inventory.json](source-loose-object-inventory.json) y los ledgers de [copia](git-object-copy-ledger.jsonl) y [concurrencia acotada](git-object-parallel-ledger.jsonl).

Los intentos anteriores de repetición amplia superaron el límite de 300 segundos. El intento serial dejó 175 casos aprobados, cero fallos, sin ejecutar el resto del bloque de 254. Se conservan [recibo de timeout](../sento/rerun-timeout.json), [recibo serial](../sento/git-ci-reruns/serial-report.json) y [TAP parcial](../sento/git-ci-reruns/serial-node-full-git-suites.log); ninguno se convirtió retroactivamente en aprobado.

Se recuperaron objetos Git auténticos mediante fetch de lectura desde el remoto GitHub hacia un repositorio bare nuevo. Se validaron todos los commits requeridos y `git fsck --full --no-reflogs`. Tras esa prueba se copiaron exclusivamente los objetos/packs verificados al clone y se eliminó su dependencia de alternates. Un ref histórico Ecasa adicional también se recuperó por su SHA exacto. No cambió HEAD, ramas, refs, índice ni archivos de trabajo para esta operación. [remote-git-integrity.json](remote-git-integrity.json) y [snapshot-git-independence.json](snapshot-git-independence.json) registran grafo, hashes de packs y `fsck` final correcto.

La copia limpia `/private/tmp/sollahms-sento-history-clean` se creó de nuevo desde la fuente revisada y el Git completo; no es un checkout sin modificaciones, porque conserva intencionalmente los cambios Sento que se revisan. Tiene HEAD `dfa5b5b73173b246fd29921ad3514fa53e4bf0c4`, rama `codex/sento-cartera-documentada`, sin alternates y `fsck` correcto. Se excluyeron `dist`, `.vercel`, `node_modules`, variables `.env` y cachés Python. Los tests y helpers copiados son byte idénticos a la fuente: [clean-fixture.json](clean-fixture.json).

Cada comando se ejecutó con Node v24.19.0 y Python 3.12.14 del runtime disponible, un entorno mínimo y PATH explícito. No se heredaron variables Vercel, booking, SMTP, Resend ni credenciales de proveedores. Los registros `.started.json` conservan PID/PGID y límite; el runner captura TAP en vivo y al alcanzar un límite termina únicamente su propio grupo de procesos. El límite de cada lote fue 240 s y ningún lote final agotó ese límite.

## Insumo de evidencia restituido y repetición completa

El primer pase limpio ejecutó los 323 casos: 322 aprobados y un error `ENOENT` en `tests/official-contexts.test.mjs:304` para `docs/qa/fuentes-oficiales-2026-10-10/irarrazaval-desktop.png`. La copia había excluido todo `docs/qa`, incluyendo ese insumo histórico obligatorio. No era una de las tres fallas originales ni una regresión de código. [TAP del intento](runs/batch-official-contexts.tap) y [recibo 9/10](runs/batch-official-contexts.json) quedan conservados.

Se restituyeron exactamente 163.434 bytes, con SHA-256 `3f17aeba419ecaaa7d99a322c3bac876578fefa8344cea850c0db1e48591aab2`, contrastado con el campo `screenshotSha256` del registro histórico proyectado. [Recibo de restitución](clean-fixture-restored-qa-input.json). Después se repitió la suite completa, no solamente el caso antes omitido: 10/10 en 167.110088 s, cero omitidos y cero cancelados; [recibo final](runs/rerun-batch-official-contexts.json), [TAP final](runs/rerun-batch-official-contexts.tap).

## Cobertura exacta por lotes

La clasificación `tests/git-ci-selection.json` conserva SHA-256 `dee3e2816813c766b1ef8d77588052935fc31c90886b9d2acd4df6e942bf3ee9`. Se verifican 323 pares únicos `(archivo, nombre literal)`, iguales al plan original, sin duplicados ni omisiones. Las suites seleccionadas usan expresiones ancladas con los nombres escapados exactos. Los 27 casos de release privado de otras inmobiliarias que esa clasificación ya excluía permanecen explícitamente **no ejecutados**, fuera del denominador 323; no se introdujeron exclusiones nuevas. Sus nombres completos figuran en `excludedReleaseCases` de [coverage-plan.json](coverage-plan.json) y el informe histórico original.

| Lote final | Casos | Segundos | Archivo | Recibo / TAP |
| --- | ---: | ---: | --- | --- |
| batch-project-map-cleanup | 5 | 0.134389 | `tests/project-map-cleanup.test.mjs` | [runs/batch-project-map-cleanup.json](runs/batch-project-map-cleanup.json) · [TAP](runs/batch-project-map-cleanup.tap) |
| batch-brochure-publication | 8 | 0.191311 | `tests/brochure-publication.test.mjs` | [runs/batch-brochure-publication.json](runs/batch-brochure-publication.json) · [TAP](runs/batch-brochure-publication.tap) |
| batch-clp-input | 11 | 0.134376 | `tests/clp-input.test.mjs` | [runs/batch-clp-input.json](runs/batch-clp-input.json) · [TAP](runs/batch-clp-input.tap) |
| batch-contact | 15 | 0.310804 | `tests/contact.test.mjs` | [runs/batch-contact.json](runs/batch-contact.json) · [TAP](runs/batch-contact.tap) |
| batch-git-checkout-controls | 8 | 0.443334 | `tests/git-checkout-controls.mjs` | [runs/batch-git-checkout-controls.json](runs/batch-git-checkout-controls.json) · [TAP](runs/batch-git-checkout-controls.tap) |
| batch-launch-security | 3 | 0.197096 | `tests/launch-security.test.mjs` | [runs/batch-launch-security.json](runs/batch-launch-security.json) · [TAP](runs/batch-launch-security.tap) |
| batch-mortgage-data | 12 | 0.138166 | `tests/mortgage-data.test.mjs` | [runs/batch-mortgage-data.json](runs/batch-mortgage-data.json) · [TAP](runs/batch-mortgage-data.tap) |
| batch-mortgage-engine | 8 | 0.142594 | `tests/mortgage-engine.test.mjs` | [runs/batch-mortgage-engine.json](runs/batch-mortgage-engine.json) · [TAP](runs/batch-mortgage-engine.tap) |
| rerun-batch-official-contexts | 10 | 167.110088 | `tests/official-contexts.test.mjs` | [runs/rerun-batch-official-contexts.json](runs/rerun-batch-official-contexts.json) · [TAP](runs/rerun-batch-official-contexts.tap) |
| batch-official-uf | 15 | 0.187015 | `tests/official-uf.test.mjs` | [runs/batch-official-uf.json](runs/batch-official-uf.json) · [TAP](runs/batch-official-uf.tap) |
| batch-purchase-capacity | 19 | 0.190729 | `tests/purchase-capacity.test.mjs` | [runs/batch-purchase-capacity.json](runs/batch-purchase-capacity.json) · [TAP](runs/batch-purchase-capacity.tap) |
| batch-booking-project-context | 6 | 0.139996 | `tests/booking-project-context.mjs` | [runs/batch-booking-project-context.json](runs/batch-booking-project-context.json) · [TAP](runs/batch-booking-project-context.tap) |
| batch-form-regression | 18 | 0.191787 | `tests/form-regression.mjs` | [runs/batch-form-regression.json](runs/batch-form-regression.json) · [TAP](runs/batch-form-regression.tap) |
| batch-rut-contact | 15 | 0.250814 | `tests/rut-contact.mjs` | [runs/batch-rut-contact.json](runs/batch-rut-contact.json) · [TAP](runs/batch-rut-contact.tap) |
| batch-integration-capacity-ui | 22 | 0.359438 | `tests/integration-capacity-ui.mjs` | [runs/batch-integration-capacity-ui.json](runs/batch-integration-capacity-ui.json) · [TAP](runs/batch-integration-capacity-ui.tap) |
| batch-integration-comparator | 14 | 0.532440 | `tests/integration-comparator.mjs` | [runs/batch-integration-comparator.json](runs/batch-integration-comparator.json) · [TAP](runs/batch-integration-comparator.tap) |
| batch-integration-contact | 18 | 0.361075 | `tests/integration-contact.mjs` | [runs/batch-integration-contact.json](runs/batch-integration-contact.json) · [TAP](runs/batch-integration-contact.tap) |
| batch-ecasa-publication | 14 | 2.811357 | `tests/ecasa-publication.test.mjs` | [runs/batch-ecasa-publication.json](runs/batch-ecasa-publication.json) · [TAP](runs/batch-ecasa-publication.tap) |
| batch-project-identity | 9 | 0.192396 | `tests/project-identity.test.mjs` | [runs/batch-project-identity.json](runs/batch-project-identity.json) · [TAP](runs/batch-project-identity.tap) |
| batch-public-fiche-copy | 6 | 0.194319 | `tests/public-fiche-copy.test.mjs` | [runs/batch-public-fiche-copy.json](runs/batch-public-fiche-copy.json) · [TAP](runs/batch-public-fiche-copy.tap) |
| batch-ecasa-stage-presentation | 5 | 0.199307 | `tests/ecasa-stage-presentation.test.mjs` | [runs/batch-ecasa-stage-presentation.json](runs/batch-ecasa-stage-presentation.json) · [TAP](runs/batch-ecasa-stage-presentation.tap) |
| batch-ecasa-manual-quality | 10 | 4.415034 | `tests/ecasa-manual-quality.test.mjs` | [runs/batch-ecasa-manual-quality.json](runs/batch-ecasa-manual-quality.json) · [TAP](runs/batch-ecasa-manual-quality.tap) |
| batch-leben-publication | 3 | 0.142084 | `tests/leben-publication.test.mjs` | [runs/batch-leben-publication.json](runs/batch-leben-publication.json) · [TAP](runs/batch-leben-publication.tap) |
| batch-aj-urbana | 9 | 103.126829 | `tests/aj-urbana.test.mjs` | [runs/batch-aj-urbana.json](runs/batch-aj-urbana.json) · [TAP](runs/batch-aj-urbana.tap) |
| batch-ingevec-brochures | 6 | 117.976870 | `tests/ingevec-brochures.test.mjs` | [runs/batch-ingevec-brochures.json](runs/batch-ingevec-brochures.json) · [TAP](runs/batch-ingevec-brochures.tap) |
| batch-ingevec-definitive | 7 | 116.031054 | `tests/ingevec-definitive.test.mjs` | [runs/batch-ingevec-definitive.json](runs/batch-ingevec-definitive.json) · [TAP](runs/batch-ingevec-definitive.tap) |
| batch-ingevec-eight | 4 | 130.984973 | `tests/ingevec-eight.test.mjs` | [runs/batch-ingevec-eight.json](runs/batch-ingevec-eight.json) · [TAP](runs/batch-ingevec-eight.tap) |
| batch-project-commercial-presentation | 7 | 126.437146 | `tests/project-commercial-presentation.test.mjs` | [runs/batch-project-commercial-presentation.json](runs/batch-project-commercial-presentation.json) · [TAP](runs/batch-project-commercial-presentation.tap) |
| batch-ecasa-definitive | 9 | 5.766145 | `tests/ecasa-definitive.test.mjs` | [runs/batch-ecasa-definitive.json](runs/batch-ecasa-definitive.json) · [TAP](runs/batch-ecasa-definitive.tap) |
| batch-ecasa-image-quality | 9 | 4.984936 | `tests/ecasa-image-quality.test.mjs` | [runs/batch-ecasa-image-quality.json](runs/batch-ecasa-image-quality.json) · [TAP](runs/batch-ecasa-image-quality.tap) |
| batch-ecasa-official-originals | 10 | 4.771425 | `tests/ecasa-official-originals.test.mjs` | [runs/batch-ecasa-official-originals.json](runs/batch-ecasa-official-originals.json) · [TAP](runs/batch-ecasa-official-originals.tap) |
| batch-norte-verde | 8 | 0.761092 | `tests/norte-verde.test.mjs` | [runs/batch-norte-verde.json](runs/batch-norte-verde.json) · [TAP](runs/batch-norte-verde.tap) |

Las duraciones sumadas de los 32 lotes finales son 789.810419 s; algunos se ejecutaron en paralelo de dos, por lo que esta suma no es tiempo de pared.

Python: 130/130 en 45.373836 s, [recibo](runs/batch-python.json), [salida detallada](runs/batch-python.tap). Validador hipotecario: aprobado en 0.077383 s, [recibo](runs/batch-mortgage.json).

Comandos Python y validador ejecutados:

```text
/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest discover -s tests -p test_*.py -v
/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/validate-mortgage-data.mjs
```

Los comandos Node completos, incluyendo todos los patrones exactos y entornos, están en las 32 entradas de `commands` del recibo compuesto y en cada `.started.json`; no se abrevia el patrón en esa evidencia. [run_case_or_batch.py](run_case_or_batch.py) implementa la captura y límites de grupos; [run_coverage_batches.py](run_coverage_batches.py) conserva el primer pase y su intento fallido. El cierre se compone verificando los 31 lotes aprobados y el lote completo repetido, sin alterar ni borrar sus resultados anteriores.

Todo este trabajo se hizo en `/private/tmp/sollahms-sento-work` y copias temporales. No se tocó el workspace compartido ahora dedicado a León, main ni Production. No se ejecutaron comandos de despliegue, push, merge, formularios reales ni escrituras a servicios externos. Los empaquetados sintéticos invocados por los tests permanecieron en fixtures locales. Las pruebas específicas de Sento y la publicación de Preview final se documentan por separado en el informe principal.
