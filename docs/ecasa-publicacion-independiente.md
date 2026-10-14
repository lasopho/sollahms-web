# Candidata Ecasa independiente

La candidata continúa la revisión aprobada `fb11f3fb466f7362cb20e99fa89b2abc610683c5` y conserva como referencia de Production `f1e9bf1715cc99d095a367eba9028a9a1ad2b026`. Se prepara en `codex/ecasa-publicacion-independiente`, en un checkout aislado. El checkout principal con cambios de otras carteras, `main` y Production quedan fuera de esta operación.

La composición sigue siendo **136 proyectos: 15 Ecasa consolidados y 121 de otras inmobiliarias**. La selección gráfica mantiene las 72 imágenes de galerías, los 74 planos, las dos fotografías oficiales de FerroParque/Alto San Joaquín y las cinco portadas aprobadas de Bezanilla, Espacio Victoria, Aires La Florida 2, Conecta Huechuraba y Urban La Florida. No se incorpora otra cartera ni se actualizan precios o condiciones comerciales.

## Autorización de contenido y ejecución

El titular autorizó expresamente la promoción web de la versión Ecasa en `https://sollahms.cl`, incluidas las fotografías y los 74 planos aprobados. Declaró que las fotografías seleccionadas desde las dos páginas oficiales Ecasa también están disponibles mediante Yapo bajo su convenio de comercialización, y remitió a los términos IRIS/Yapo revisados anteriormente. La autorización nueva es específica para Ecasa; no se atribuye automáticamente el alcance de los documentos AJ Urbana/Ingevec a otro lote.

La adquisición observada de esas dos fotografías sigue siendo descarga directa desde `ecasa.cl`. La disponibilidad mediante Yapo es una declaración del titular, sin afirmar descarga desde Yapo ni identidad técnica entre archivos de ambos canales. Los hashes identifican los bytes adquiridos y aprobados. No se afirma haber inspeccionado una cuenta, una firma personal o un anexo contractual que enumere estos archivos.

`contentAuthorization.contractEvidenceSha256` identifica la evidencia privada previa `verified-contract-evidence.json`, SHA256 `a3f5fc354a7fd5e41ed1c3f3ae499d4b5511376a7a914161d4de9c87ee44f3eb`. `ownerDeclarationSha256` identifica **únicamente el texto exacto de la declaración del titular codificado en UTF-8, sin las comillas externas ni salto final**, SHA256 `78af5bd82017fe2445eebca37bd8e3f4c0abe245041dee893ec8e6ff334ecfbc`. Este último hash es diferente del hash del JSON privado completo que registra la declaración; no representa un contrato o archivo descargado de Yapo.

La elegibilidad de contenido público queda registrada separadamente. El flag contractual histórico Ecasa permanece falso: no se inventó una comprobación contractual independiente. Las condiciones y el contrato completo permanecen privados. La instrucción actual sólo autoriza preparar y entregar una candidata READY para revisión; `actionAuthorization.production=false` y `mergeMain=false` siguen obligatorios. La ejecución del release necesita una autorización humana posterior expresa.

## Manifiesto y validador

`data/ecasa-publication-candidate.json` tiene schema 1 y alcance `ecasa_independent_public_candidate`. Fija Production f1, la revisión fb11, las 15 identidades, los 92 recursos seleccionados y cinco fingerprints históricos:

- `data/brochures-ecasa.json`;
- `data/ecasa-image-quality.json`;
- `data/ecasa-manual-quality.json`;
- `data/ecasa-official-originals.json`;
- `data/ecasa-owner-cover.json`.

El módulo independiente no modifica esos manifiestos. `validateEcasaPublicationCandidate(manifest, {root})` comprueba el esquema exacto, baselines, declaraciones y acciones, los cinco hashes históricos y el inventario fijo de recursos. Rechaza rutas ajenas al proyecto, registros duplicados, raws, entradas adicionales, enlaces simbólicos, cambios de bytes/dimensiones o un ambiente con una rama distinta de `main` o la candidata autorizada. Lee encabezados WebP nativos; no necesita generar imágenes ni instalar codecs.

La respuesta contiene `eligible`, `manifestSha256`, `selectedResources`, `baselineCommit`, `reviewCommit`, `projectSlugs`, `contentAuthorization`, `actionAuthorization`, `summary` y `technicalYapoFileIdentityVerified=false`. La selección es idéntica en el contenido público y en Preview. Los controles de revisión dependen del ambiente: Preview mantiene `noindex`, robots bloqueados y bloqueo de envíos reales.

## Recursos Git y archivo privado

Se versionan **92 archivos Ecasa ya seleccionados**: 85 derivados de brochure (11 fotografías y 74 planos), dos fotografías oficiales y cinco WebP de portada. Ningún PNG input ni original oficial se publica como ruta original. Los nombres históricos de carpetas terminados en `preview` o `review` conservan las URLs; no determinan la autorización.

Los 165 derivados Ingevec mantienen su transporte privado anterior. Otras 52 fuentes también continúan privadas: 45 DOC excluidas, dos originales oficiales y cinco PNG input. Los 399 registros fuente de brochures, los 130 derivados originales Ecasa, las 118 decisiones manuales y sus hashes permanecen completos. Se conservan los cuatro DOC cover-only supersedidos en el archivo fuente, pero salen del output; el dormitorio anterior de Espacio permanece en la galería. No se publica ningún PDF original, contrato, comisión o material comercial confidencial.

Bezanilla, Aires y Urban conservan sus inputs nativos con hash exacto. Espacio y Conecta emplean las representaciones disponibles del adjunto a 2048×1214. No se presentan como los masters 3280×1944 no disponibles, no son screenshots y no se amplían. El proof de píxeles del WebP lossless se compara con el recorte del input utilizado; los recibos de ese proof quedan privados.

Los 92 recursos publicables Ecasa proceden del repositorio y no requieren Downloads. El paquete reproducible todavía transporta exactamente 217 entradas privadas: 165 Ingevec y las 52 fuentes restantes. Los validadores legacy completos conservan sus comprobaciones de esos inputs; no se relajan para simular un build exclusivamente Git.

## Preparación reproducible

`scripts/prepare-ecasa-independent.py` trabaja sólo con una rama candidata comprometida y limpia. Usa las funciones de inventario y archivo existentes, sin invocar sus entrypoints de publicación o interpretar una referencia de Preview como autorización de Production. Agrega explícitamente el nuevo manifiesto y módulo a la allowlist de compilación. Verifica que los 92 recursos Ecasa correspondan a blobs Git del commit, y que las 217 entradas privadas correspondan exactamente a las fuentes preservadas.

El helper genera un archivo fuente determinista, fragmentos de transporte, una copia fuente preparada y dos builds locales del perfil `public-web`. El directorio llamado `public-local` es una compilación offline; no crea un deployment de Production. Ambos builds conservan 1028 archivos y la misma selección aprobada, con diferencias limitadas a los controles de revisión.

El helper exige los inventarios privados de fuente/output Production f1 y la Preview fb11: verifica sus conjuntos completos de rutas y hashes antes de reutilizar los baselines. La auditoría dedicada `tests/audit_ecasa_independent.py` recibe esas carpetas verificadas. Comprueba los 121 objetos y fichas ajenos a Ecasa frente a Production, los contextos compartidos ya aprobados frente a fb11, la cartera, las 16 redirecciones, los 92 fingerprints, las galerías/planos, las cinco portadas y la exclusión de fuentes privadas. No envía formularios ni realiza POSTs.

```sh
python3 scripts/prepare-ecasa-independent.py \
  --output-directory /ruta/privada/fuera/del/repositorio \
  --node /ruta/al/runtime/node \
  --production-source /ruta/a/fuente/f1-verificada \
  --production-public /ruta/a/output/f1-verificado \
  --approved-preview /ruta/a/output/preview/fb11-verificado \
  --production-baseline-receipt /ruta/privada/production-baseline-receipt.json \
  --approved-preview-receipt /ruta/privada/fb11/metadata.json
```

Los tres scripts privados de QA (browser, remoto y servidor) se registran con bytes/SHA256 y deben corresponder a blobs regulares del HEAD preparado. Viajan en la evidencia privada, nunca dentro del archivo fuente runtime. `verificationTools` conserva sus fingerprints en metadata y referencia.

El output contiene `metadata.json`, `independent-reference.json`, `independent-audit.json`, `build-receipt.json`, `source.tgz`, sus fragmentos y `preview-request-template.json`. La referencia registra `ecasa_independent_candidate`, elegibilidad promocional del titular, el commit preparado, los hashes reales y `productionActionAuthorized=false`/`mergeActionAuthorized=false`. No afirma que las tres clases de autorización —material web, operación de release y redistribución del repositorio— sean equivalentes.

El helper no sube archivos, hace push, crea deployment, alias o promoción, modifica settings ni descarga variables. El template de Preview es informativo. La protección y la aprobación operacional deben verificarse al ejecutar un envío expresamente autorizado después de cerrar QA; este documento no ejecuta ni concede ese permiso.
