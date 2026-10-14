# Preview privada reproducible — cartera Ecasa

Esta operación prepara **136 proyectos, con 15 desarrollos Ecasa y 22 entradas comerciales internas**, desde la rama `codex/ecasa-cartera-definitiva`. La revisión visual continúa el commit consolidado `2d34997f8fd82b775c0697b20493674773e7fdc2`; Production permanece separado en `main`. El paquete conserva los 121 objetos del catálogo ajenos a Ecasa y los manifiestos AJ Urbana/Ingevec completos, fijados con hashes independientes.

La referencia privada describe el **commit preparado para revisión**. No acredita aprobación de publicación, merge ni Production. Los derechos Ecasa tienen estado `pending_contract_scope_verification`, independiente de Yapo/IRIS. La selección publicada aplica `data/ecasa-image-quality.json` a los originales completos de `data/brochures-ecasa.json`, sin modificar el manifiesto fuente ni sus recursos. El build público local conserva los fallbacks comerciales Ecasa y excluye esos derivados. El comparativo no afirma paridad pública de los nuevos brochures.

La revisión de originales oficiales continúa específicamente la base `0117cc546cc75183f73cae07c90dd093937a819f` y añade sólo dos fotografías generales de FerroParque y Alto San Joaquín mediante `data/ecasa-official-originals.json` y `scripts/ecasa-official-originals.mjs`. El manifiesto documental, la política anterior de calidad, las fuentes investigadas, el catálogo y los HTML fuente conservan sus bytes. El overlay modifica únicamente imágenes de esas dos fichas y sus portadas de catálogo en Preview; los 13 proyectos Ecasa restantes, los 121 ajenos y todos los planos/datos/funciones permanecen exactos. Los nuevos derechos tienen estado `pending_explicit_ecasa_authorization`, `publicWeb=false` e `irisYapo=false`: las páginas oficiales no acreditan por sí solas una licencia de promoción web.

La depuración manual continúa la base `fd9f238685ed59e03716ccef10f40ab8b0a9a1c5` mediante `data/ecasa-manual-quality.json` y `scripts/ecasa-manual-quality.mjs`. Sus decisiones sólo se aplican al perfil Preview: conserva las 62 imágenes oficiales históricas, retira las fotografías documentales indicadas por el usuario y permite siete excepciones explícitas de portada. La política original permanece exacta con 118 decisiones, 114 fotografías de galería y cuatro exclusiones. La selección efectiva tiene 70 fotografías en galería, 48 exclusiones y siete de estas últimas usadas exclusivamente como portada; las dos fotografías nativas oficiales elevan la galería final a **72**. Los perfiles públicos conservan el resultado de la base `fd9f238`.

## Recursos necesarios

Los recursos previamente aprobados se mantienen: **104 AJ Urbana** (26 imágenes y 78 planos) y **165 Ingevec** (101 imágenes y 64 planos), todos comprobados mediante SHA-256. El archivo fuente conserva exactamente los **130 derivados Ecasa: 56 imágenes y 74 planos**, con las mismas rutas, bytes, páginas y recortes. La revisión histórica publicaba 126 derivados Ecasa y 395 brochures en total. La depuración manual publica **89 derivados Ecasa: 15 imágenes documentales y los 74 planos completos**; ocho documentales pertenecen a galerías y siete sólo a portadas. Junto a AJ Urbana/Ingevec resultan **358 derivados publicados y 399 transportados**. El manifiesto v2 vincula cada recurso mediante `originCommercialSlug` a una de las 22 entradas internas y su desarrollo; Terratoltén conserva la carpeta gráfica `terratolten-1`. Los 165 Ingevec y los 130 Ecasa permanecen fuera de Git y se transportan privadamente. El ZIP, los PDF, las capturas comerciales, los contratos, los inventarios originales, los candidatos y las credenciales quedan fuera del archivo fuente desplegable y de `dist`.

El suplemento oficial transporta **cuatro archivos privados** bajo `assets/propiedades/ecasa-official-review/`: dos originales descargados y dos imágenes seleccionadas. Sólo las dos seleccionadas se copian a la Preview; la revisión anterior tenía 116 fotografías de galería y la selección manual tiene 72. FerroParque utiliza un recorte exacto de 3840 × 1380 píxeles codificado como WebP lossless, sin ampliar ni generar píxeles; su igualdad RGBA con el rectángulo original está comprobada. Alto San Joaquín conserva los bytes originales de 1920 × 870. Los originales completos permanecen en el archivo fuente privado para reproducir y cotejar, pero nunca en `dist`, incluso en Preview. La fuente manual suma **1095 archivos: 796 Git y 299 privados** una vez guardado el commit revisable; los dos nuevos insumos Git no añaden ni eliminan archivos gráficos.

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

Los recibos separan `officialSourceMedia=4`, `officialPublishedMedia=2`, `ecasaGalleryImages=72` y `officialOriginals`, que fija SHA-256 del manifiesto y los inventarios ordenados `sourceAssets`/`publishedAssets` por ruta, SHA-256, bytes y dimensiones. `imageQuality` conserva los contadores originales; `manualQuality` fija el SHA-256 del nuevo manifiesto, las 118 decisiones efectivas, las 15 selecciones de proyecto y los contadores derivados desde esas filas. El helper reconstruye estas decisiones desde las identidades y hashes congelados, verifica su consumidor contra Git y rechaza contadores históricos de publicación reutilizados. La carpeta privada sólo se permite junto a su inventario exacto y al perfil protegido. Un permiso genérico de carpeta no autoriza archivos adicionales. Los HTML de origen, capturas, comparativas e informes de derechos continúan fuera de la fuente transportada y del output.

Los tres ejecutores QA (`tests/qa-ecasa.mjs`, `tests/qa-ecasa-remote.mjs` y `tests/qa-preview-server.mjs`) se ejecutan desde el checkout de ese commit. Sus tamaños y SHA-256 quedan fijados en `verificationTools` de los comprobantes privados, y la preparación coteja sus bytes con Git. Las herramientas operativas no entran en `source.tgz`, en la fuente desplegable ni en `dist`.

La preparación produce `source`, `preview-local/dist`, `production-local/dist`, `release-receipt.json` y `public-preview-audit.json`. Comprueba **143 rutas HTML, 142 URL únicas del sitemap**, todas las referencias y canonical, la desaparición de las 11 rutas retiradas históricas —incluidas las cinco Ecasa— y la ausencia de documentos privados. Revalida los 269 medios AJ Urbana/Ingevec y los 130 originales Ecasa del archivo fuente; verifica que sólo se publiquen los 89 derivados Ecasa seleccionados. Las fotografías retiradas carecen de archivo y ruta servida; una excepción de portada exige la selección final del mismo proyecto, una portada real y ausencia de uso o enlace en galería. Las siete excepciones no conceden permiso de galería. Permite sólo las diferencias declaradas de noindex, robots, aviso de revisión, bloques documentados Ecasa y las selecciones visuales por perfil; los demás datos comerciales permanecen iguales.

La auditoría valida también los cuatro archivos oficiales privados, los dos publicados y la ausencia de los originales, candidatos o referencias privadas en ambos outputs. El build público local excluye íntegramente el namespace oficial nuevo y conserva su resultado anterior. El bridge Node valida la política congelada, calcula una copia efectiva para Preview, filtra imágenes y portadas, aplica el overlay oficial y finalmente el ajuste manual de galería: FerroParque integra su fotografía general primero y a todo el ancho; Cumbres conserva una fotografía documental a todo el ancho y con su proporción nativa. El auditor compara ambos perfiles y comprueba de forma independiente hashes, selección y roles; los 121 proyectos ajenos mantienen su salida exacta. Los datos, snapshots comerciales y planos continúan preservados, salvo los campos de imagen explícitamente seleccionados por el filtro. El perfil `protected_ecasa_review` sigue sin acreditar paridad pública Ecasa ni autorizar Production.

Las ocho rutas antiguas de etapas no producen fichas HTML duplicadas. Las 16 reglas permanentes cubren cada ruta con y sin `.html`, conservando el contexto: Núcleo Costanera 2 → Núcleo Costanera `#etapa-2`; Ferroparque 2 → FerroParque `#etapa-2`; Terratoltén 1/2/3 → Terratoltén `#etapa-1/2/3`; Lomas de Puyai 3 → Lomas de Puyai `#etapa-3`; Alto San Joaquín 2/3 → Alto San Joaquín `#etapa-2/3`. El auditor comprueba destinos exactos, ausencia de bucles y duplicados, y existencia de las anclas en ambos builds. La compatibilidad de parámetros antiguos de consulta/agenda/comparador se resuelve mediante los contextos de aplicación, conservando proyecto y etapa.

La presentación de leyendas utiliza `scripts/public-fiche-copy.mjs` y la política exacta `data/public-caption-policy.json` incluida sólo en el source privado. Ambos builds aplican la misma transformación acotada de texto y atributos visibles. Las leyendas originales del manifiesto, las advertencias referenciales, las acreditaciones, los precios y los recursos permanecen preservados. Las 121 fichas ajenas a Ecasa mantienen su fuente exacta; el auditor compara la misma presentación pública en Production local y Preview.

La revisión visual independiente conserva 118 fotografías originales (62 oficiales y 56 documentales), excluye cuatro por blur de origen y ajusta siete portadas por proyecto y origen comercial. Terratoltén utiliza en Preview una imagen oficial de Etapa 3 con etiqueta explícita; las galerías y planos de Etapa 1 mantienen su atribución. Los pendientes de licencia web de brochures permanecen independientes: el perfil público sólo elige portadas oficiales. Los originales rechazados siguen en el paquete privado para trazabilidad, mientras el filtro evita su copia a `dist`.

El validador requiere privadamente `scripts/ecasa-image-quality.mjs`, `data/ecasa-image-quality.json`, `data/fichas-proyectos.json` y `data/fuentes-imagenes.json`. El archivo fuente incluye estos insumos; las rutas estáticas continúan limitadas a los dos JSON públicos del catálogo y del comparador. El auditor coteja decisiones y SHA con las fuentes, conserva todos los planos, proyecta ambos perfiles mediante el overlay revisado y permite únicamente cambios visuales explícitos en el catálogo.

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
