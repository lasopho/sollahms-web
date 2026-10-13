# Preview privada reproducible — cartera Ecasa

Esta operación prepara **136 proyectos, con 15 desarrollos Ecasa y 22 entradas comerciales internas**, desde la rama `codex/ecasa-cartera-definitiva`. La consolidación continúa el commit de revisión `f8e1c848998d5ed9c0eef7cd5f3424b1d908a155`; Production permanece separado en `main`. El paquete conserva los 121 objetos del catálogo ajenos a Ecasa y los manifiestos AJ Urbana/Ingevec completos, fijados con hashes independientes.

La referencia privada describe el **commit preparado para revisión**. No acredita aprobación de publicación, merge ni Production. Los derechos Ecasa tienen estado `pending_contract_scope_verification`, independiente de Yapo/IRIS. En la Preview se integran exclusivamente los derivados seleccionados en `data/brochures-ecasa.json`. El build público local conserva los fallbacks comerciales Ecasa y excluye esos derivados. El comparativo no afirma paridad pública de los nuevos brochures.

## Recursos necesarios

Los recursos previamente aprobados se mantienen: **104 AJ Urbana** (26 imágenes y 78 planos) y **165 Ingevec** (101 imágenes y 64 planos), todos comprobados mediante SHA-256. Ecasa conserva exactamente sus **130 derivados: 56 imágenes y 74 planos**, con las mismas rutas, bytes, páginas y recortes. El manifiesto v2 vincula cada recurso mediante `originCommercialSlug` a una de las 22 entradas internas y su desarrollo; Terratoltén conserva la carpeta gráfica `terratolten-1`. Los 165 Ingevec y los 130 Ecasa permanecen fuera de Git y se transportan privadamente. El ZIP, los PDF, las capturas comerciales, los contratos, los inventarios originales, los candidatos y las credenciales quedan fuera del archivo fuente desplegable y de `dist`.

El paquete anterior de recuperación está disponible localmente en `/private/tmp/sollahms-pr4-reproduced-20261012/source.tgz`, SHA-256 `25e4d5daa8f4d0cd2b62da46ac067174610cde9c7eaf05434cdf96ef16604f95`. Permite recuperar los derivados Ingevec originales si falta alguno, cotejando cada archivo contra el manifiesto actual. No se usa ese paquete como código fuente del nuevo despliegue.

## Preparar un commit revisable

Primero completar datos, fichas, manifiestos y pruebas, y guardar un commit en la rama. El helper comprueba que todo archivo fuente registrado coincide exactamente con ese commit y que los únicos recursos fuera de Git pertenecen a las carpetas privadas autorizadas.

Con Node disponible, generar el paquete fuera del checkout:

```sh
SOLLAHMS_NODE=/Users/luissandoval/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
python3 scripts/create-brochure-bundle.py \
  --branch codex/ecasa-cartera-definitiva \
  --node "$SOLLAHMS_NODE" \
  --output-directory /private/tmp/sollahms-ecasa-review-bundle
python3 scripts/prepare-ecasa-preview.py \
  --bundle-directory /private/tmp/sollahms-ecasa-review-bundle \
  --node "$SOLLAHMS_NODE" \
  --output-directory /private/tmp/sollahms-ecasa-review-prepared
```

Usar directorios nuevos en cada revisión. El archivo `source.tgz` usa un orden, permisos y fechas deterministas; el mismo contenido produce los mismos bytes. `metadata.json` fija su SHA-256, cada archivo, cada fragmento y el commit. El helper crea `review-reference.json` y `preview-deployment-request.json` sólo en la carpeta privada. Lee los identificadores del proyecto desde la referencia histórica y no la modifica. La preparación local no descarga variables ni recibe credenciales de proveedores.

Los tres ejecutores QA (`tests/qa-ecasa.mjs`, `tests/qa-ecasa-remote.mjs` y `tests/qa-preview-server.mjs`) se ejecutan desde el checkout de ese commit. Sus tamaños y SHA-256 quedan fijados en `verificationTools` de los comprobantes privados, y la preparación coteja sus bytes con Git. Las herramientas operativas no entran en `source.tgz`, en la fuente desplegable ni en `dist`.

La preparación produce `source`, `preview-local/dist`, `production-local/dist`, `release-receipt.json` y `public-preview-audit.json`. Comprueba **143 rutas HTML, 142 URL únicas del sitemap**, todas las referencias y canonical, la desaparición de las 11 rutas retiradas históricas —incluidas las cinco Ecasa— y la ausencia de documentos privados. Revalida los 269 medios AJ Urbana/Ingevec y los 130 Ecasa. Permite sólo las diferencias declaradas de noindex, robots, aviso de revisión, bloques documentados Ecasa y sus portadas; los demás datos comerciales permanecen iguales.

Las ocho rutas antiguas de etapas no producen fichas HTML duplicadas. Las 16 reglas permanentes cubren cada ruta con y sin `.html`, conservando el contexto: Núcleo Costanera 2 → Núcleo Costanera `#etapa-2`; Ferroparque 2 → FerroParque `#etapa-2`; Terratoltén 1/2/3 → Terratoltén `#etapa-1/2/3`; Lomas de Puyai 3 → Lomas de Puyai `#etapa-3`; Alto San Joaquín 2/3 → Alto San Joaquín `#etapa-2/3`. El auditor comprueba destinos exactos, ausencia de bucles y duplicados, y existencia de las anclas en ambos builds. La compatibilidad de parámetros antiguos de consulta/agenda/comparador se resuelve mediante los contextos de aplicación, conservando proyecto y etapa.

La presentación de leyendas utiliza `scripts/public-fiche-copy.mjs` y la política exacta `data/public-caption-policy.json` incluida sólo en el source privado. Ambos builds aplican la misma transformación acotada de texto y atributos visibles. Las leyendas originales del manifiesto, las advertencias referenciales, las acreditaciones, los precios y los recursos permanecen preservados. Las 121 fichas ajenas a Ecasa mantienen su fuente exacta; el auditor compara la misma presentación pública en Production local y Preview.

También se puede repetir la preparación con la referencia privada ya creada:

```sh
python3 scripts/prepare-release.py \
  --protected-review \
  --reference /private/tmp/sollahms-ecasa-review-bundle/review-reference.json \
  --archive /private/tmp/sollahms-ecasa-review-bundle/source.tgz \
  --node "$SOLLAHMS_NODE" \
  --output-directory /private/tmp/sollahms-ecasa-review-repeated
```

El contenido `protected_ecasa_review` se rechaza expresamente al verificar cualquier comprobante de staging Production. El indicador `--verify-public-web` del generador de paquetes tampoco corresponde a esta revisión mientras Ecasa conserve el pendiente contractual.

## Desplegar sólo en Preview

Antes del envío, consultar el proyecto y confirmar `project-wrapp`, `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`, Node 24.x y Vercel Authentication habilitada. La consulta del 13/10/2026 confirmó `ssoProtection.enabled=true` y `all_except_custom_domains`. Production permanece en `dpl_9LvbrLDbZhho3Umm5Rmv6AMkauXE`, commit `f1e9bf1715cc99d095a367eba9028a9a1ad2b026`; esa identidad se vuelve a comprobar después de entregar la Preview.

La CLI autenticada puede desplegar el directorio `source` preparado mediante su transporte nativo de archivo, con destino explícito Preview, el mismo equipo y los metadatos del commit preparado. Realizar primero un dry run y cotejar su inventario con el archivo privado. No usar opciones Production, promover, asignar dominios ni modificar los controles de acceso. Si se usa el conector Vercel como alternativa, subir únicamente los fragmentos `source.tgz.partN` verificados y enviar el contenido exacto de `preview-deployment-request.json`; ese template fija `target=preview`, los identificadores de proyecto/equipo y el commit, sin aliases ni variables de proveedores.

La CLI nativa disponible en esta sesión admite estas opciones. La referencia privada ya fija el commit; obtenerlo de esa referencia evita desplegar un HEAD distinto:

```sh
SOLLAHMS_VERCEL=/private/tmp/sollahms-candidate-final-runtime/native-package/package/bin/vercel
SOLLAHMS_REVIEW_COMMIT=$(python3 -c 'import json; print(json.load(open("/private/tmp/sollahms-ecasa-review-bundle/review-reference.json"))["preparedCommitForReview"])')
"$SOLLAHMS_VERCEL" deploy --dry --json \
  --target preview --project prj_URomRRU0MAy4etGKP5gWv3Qv4DGH \
  --scope lsandoval2-8260s-projects \
  --cwd /private/tmp/sollahms-ecasa-review-prepared/source \
  --non-interactive
"$SOLLAHMS_VERCEL" deploy --json --archive tgz \
  --target preview --project prj_URomRRU0MAy4etGKP5gWv3Qv4DGH \
  --scope lsandoval2-8260s-projects \
  --cwd /private/tmp/sollahms-ecasa-review-prepared/source \
  --meta githubCommitRef=codex/ecasa-cartera-definitiva \
  --meta "githubCommitSha=$SOLLAHMS_REVIEW_COMMIT" \
  --non-interactive
```

El dry run sin archivo permite cotejar los nombres y hashes de cada fuente con `metadata.json`; el envío posterior usa el transporte nativo comprimido de la CLI. El segundo comando sólo corresponde al despliegue Preview autorizado. La autenticación existente se usa directamente; no se incluyen tokens en la línea de comandos ni se descargan variables de Production.

Esperar `READY` y guardar un comprobante sanitizado con ID, URL inmutable, commit, equipo, proyecto, entorno Preview y protección Vercel. Acceder a las comprobaciones HTTP con `vercel curl` a esa URL exacta, o utilizar un token OIDC de desarrollo mediante un encabezado limitado al origen en el navegador. Los tokens permanecen fuera de logs, capturas y comprobantes.

La aceptación final incluye las 15 fichas, sus 22 entradas internas, las ocho redirecciones y cinco rutas retiradas, recursos y planos ampliables, escritorio/tablet/móvil, buscador, mapa/recorridos, funciones hipotecarias, UF y contexto de formularios. Los envíos y reservas en Preview deben devolver el bloqueo de revisión antes de contactar a un proveedor. El servidor QA local ofrece proveedores simulados y fixtures UF diarios publicados en SII; fuera de las fechas acreditadas devuelve indisponibilidad en lugar de prolongar un valor antiguo.
