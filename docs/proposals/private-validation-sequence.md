# Preparación de los 26 casos privados

Estado: pendientes. Este documento no incorpora recursos, concede derechos, habilita un build ni cambia el inventario de exclusiones de Git CI.

## Prerrequisitos verificables

1. Partir del SHA revisado en un checkout de validación aislado. Conservar los 134 proyectos y todos los SHA de P1/P2 como ancestros; no sustituir el código probado por una salida histórica.
2. Obtener el paquete privado autorizado y su manifiesto exacto, junto con el alcance de derechos de cada recurso. Los metadatos del respaldo no sustituyen los originales ni un permiso de publicación.
3. Ejecutar `scripts/check-private-resources.py --asset-root <paquete-autorizado> --output <informe-nuevo-fuera-del-checkout>`. El resultado actual es 1039 requeridos, 686 verificados y 353 ausentes. El exit code 1 actual es el rechazo esperado, no un CI aprobado.
4. Resolver las discrepancias de fuente/artefacto y las autorizaciones de los controles reales de release, sin alterar hashes o assertions para hacer pasar el código. La referencia histórica de release no certifica P1/P2 ni esta continuidad.
5. Materializar únicamente los recursos y perfiles autorizados mediante las herramientas existentes, sin añadirlos al índice Git, cambiar derechos o copiar archivos ajenos al manifiesto. El preflight debe verificar hashes, tamaños, dimensiones y PDFs antes de ejecutar las pruebas privadas.
6. Correr los casos exactos siguientes y los validadores de artefacto en ese entorno autorizado; registrar cada resultado real. No contarlos como aprobados por el éxito del CI público.

## Selección literal vigente

| Archivo | Caso | Motivo de exclusión pública |
| --- | --- | --- |
| `tests/aj-urbana.test.mjs` | a synthetic pending contract publishes AJ only in Preview and removes review assets from non-Preview output | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | three supplied sources and fourteen unique models retain document/page evidence and unknown values | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | the previous 36 images/plans retain project identity and hashes within the explicitly enlarged 165-resource directory | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | AJ and Ingevec retain their 269 media across Preview and offline public fallback while Ecasa stays protected | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | covered media missing after a merge blocks the build instead of silently dropping galleries, plans and covers | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | contract-covered output copies only selected derivatives and rejects symbolic selected media | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | real Preview packaging changes only twenty-one authorized card covers, publishes 64 Ingevec models, and hides all private manifests/documents | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | a synthetic pending contract excludes protected media outside Preview and retains all 136 fallback objects | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | real packaging fails closed for absent authorization, unrelated branch, cross-project covers and altered image bytes | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | real packager checks non-cover galleries/plans and privacy flags, and rejects unapproved identities and routes | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | new source bindings and Vicuña stage identifiers cannot be reassigned through the packaging manifest | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | final source bindings reject earlier Valle stages, unprinted fields and unsafe newly added galleries in every build profile | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | retired and unknown routes, sitemap entries and internal links cannot reappear in Preview or fallback builds | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | exclusive retired covers stay in historical source but are excluded from output, while a shared photograph remains usable | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | new supplied brochure plaintext remains ignored and absent from the public Git index | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | a synthetic pending Git Preview without Ingevec assets preserves sixteen fallbacks and the five AJ reviews | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-brochures.test.mjs` | Preview rejects partial Ingevec uploads instead of publishing a mixture of incomplete review fichas | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-definitive.test.mjs` | definitive Ingevec portfolio retains ten prior records and 105 non-Ecasa non-Ingevec historical objects | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-definitive.test.mjs` | 36 selected native images and 23 full-page plans retain independent hashes, dimensions and metadata privacy | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-definitive.test.mjs` | Vicuña Mackenna retains six independent plans and its exact prior stage-source assignment | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ingevec-eight.test.mjs` | reviewed images include seven distinct catalogue/hero covers without duplicate gallery renders or confidential Matta attribution | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/project-commercial-presentation.test.mjs` | all 269 supplied media derivatives retain approved identity, hashes and contractual scope status | Requires actual approved Ingevec derivatives or a packaging fixture that copies them; mandatory in private release validation. |
| `tests/ecasa-definitive.test.mjs` | all 130 selected Ecasa photos and plans preserve their original bytes, origin-stage bindings and enlarged canonical references | Requires all 130 original-derived Ecasa resources; mandatory before the protected Preview delivery. |
| `tests/ecasa-image-quality.test.mjs` | real private packaging publishes 395 selected resources, keeps 74 Ecasa plans and excludes four source photographs | Requires all preserved private AJ/Ingevec/Ecasa bytes and tests actual output exclusion, source preservation and 74 plans in isolated builds. |
| `tests/ecasa-official-originals.test.mjs` | real private official originals decode to exact native rectangles and retain frozen evidence | Requires the four privately materialized Ecasa official files and a local Sharp decoder to prove exact RGBA crop identity and unchanged original bytes. |
| `tests/leon-main-integration.test.mjs` | all 310 original media and 36 individually bound plans retain their verified payloads | Requires five private original León PDFs and the complete existing Ecasa/Leben/AJ/Ingevec protected resource batch for assertLeonCombinedScope; tracked-only row/HTML/media guards remain in five Git cases. |

La selección procede de `tests/git-ci-selection.json`, no de una lista inferida. Para generar comandos sin ejecutarlos:

```python
import json, re, shlex
m = json.load(open("tests/git-ci-selection.json"))
for suite in m["selectedSuites"]:
    cases = [row["name"] for row in suite["releaseRequired"]]
    if cases:
        pattern = "^(?:" + "|".join(re.escape(name) for name in cases) + ")$"
        print(shlex.join(["node", "--test", "--test-reporter=tap", "--test-name-pattern", pattern, suite["file"]]))
```

El adaptador documentado de stdio puede utilizarse en Cloud si el transporte nativo está restringido; nunca sustituye assertions, permisos o recursos. Después deben aprobarse también los validadores del artefacto completo y el QA de la Preview protegida autorizada. Un conjunto de pruebas fuente aprobado no prueba los bytes servidos en Production.
