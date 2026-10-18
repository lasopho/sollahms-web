# SEC-003 — inventario local y propuesta CSP por etapas

Estado: **preparado para revisión; hallazgo abierto**. No se ha aplicado una
cabecera, creado un colector de reportes ni cambiado `vercel.json`, packager,
guardas, servicios o configuración remota.

La política configurada conserva `base-uri 'self'; object-src 'none';
frame-ancestors 'self'`. El siguiente paso necesita conocer los recursos del
artefacto concreto antes de proponer restricciones adicionales. Este trabajo no
afirma una inyección explotable ni una política completa o efectiva.

## Inventario reproducible, sin ejecutar el proyecto

`scripts/inventory-csp.py` usa únicamente la biblioteca estándar de Python. Lee
HTML y sus referencias locales de script/estilo, incluidas dependencias de
módulos y estilos reconocibles estáticamente. No importa ni ejecuta el packager,
JavaScript, APIs o herramientas del proyecto; no hace peticiones de red.

```sh
python -B scripts/inventory-csp.py \
  --root /ruta/al/checkout \
  --scope source \
  --output /ruta/fuera-del-checkout/csp-fuentes.json
```

La salida debe ser un archivo nuevo fuera del repositorio y del árbol de entrada.
El programa rechaza sobrescrituras, symlinks relevantes y rutas locales que
escapen del árbol. Sus entradas de texto son UTF-8, con límite por archivo y
cantidad de archivos. No lee variables de entorno ni archivos de credenciales.

La salida JSON es determinista para las mismas entradas y opciones: no incluye
hora actual ni rutas absolutas. Registra rutas y SHA-256 de los textos leídos,
referencias y sus contextos, candidatos externos separados para scripts,
estilos, fuentes, imágenes, frames, conexiones, medios, workers y formularios.
Los enlaces de navegación, canonical y metadatos no se añaden como permisos de
carga. `preconnect` se conserva como indicio, no como prueba de una petición.

Cada elemento `script` y `style` conserva el hash de su texto parseado y un
candidato SHA-256 en base64. Para CSP se usa UTF-8 después del preprocesado HTML:
CRLF/CR se convierten en LF y NUL en U+FFFD. **Las entidades dentro de un script
no se decodifican**; las entidades de atributos sí las decodifica el parser HTML.
El SHA del archivo original permite distinguir esos bytes del texto parseado.
Los bloques de datos como JSON-LD se distinguen del JavaScript ejecutable y sus
hashes no se añaden como permisos de ejecución. Un `src` presente, incluso vacío,
impide tratar el cuerpo del elemento como código inline. Las estructuras
ambiguas, como scripts escapados/doblemente escapados, no aportan un hash CSP
propuesto. Una codificación efectiva distinta de UTF-8 requiere recalcular los
hashes con el texto del navegador y las cabeceras reales.

La observación inicial del checkout encontró **141 HTML en la raíz** —134
fichas y siete páginas generales—, 173 textos alcanzables y 570 elementos script,
de los cuales 277 son datos o tipos no reconocidos como ejecutables. Es un corte
de fuentes, no el inventario certificado de un build. La salida enumera los
archivos exactos para detectar cambios posteriores. Un directorio sin candidatos
externos de fuentes tipográficas no demuestra ausencia de esas peticiones: las
hojas de Google Fonts son externas y no se descargan aquí.

## Fuentes y artefacto extraído son alcances diferentes

`--scope source` inspecciona únicamente los HTML de la raíz y sus dependencias
estáticas alcanzables. No incluye como rutas públicas los HTML de `docs/archive`
o `assets/review`. Se leyó la regla estática del packager: toma HTML de la raíz,
comprueba su allowlist y después puede eliminar bloques de revisión/públicos o
reescribir contenido. El inventario no ejecuta ni reproduce esas decisiones.
Por tanto, **los hashes de las fuentes no se deben aplicar a un artefacto**.

Cuando exista un artefacto autorizado ya extraído, se puede leer por separado:

```sh
python -B scripts/inventory-csp.py \
  --root /ruta/al/artefacto-extraido \
  --scope artifact \
  --profile-label etiqueta-de-observacion \
  --output /ruta/fuera-del-artefacto/csp-artefacto.json
```

Este modo incluye todos los HTML del directorio suministrado. No extrae ZIP,
crea builds ni obtiene archivos. La etiqueta es un dato del operador:
`profileVerified`, `artifactProvenanceVerified` y `deployedBytesVerified`
permanecen en `false`, aunque se escriba “production”. El manifiesto abarca
solo los textos leídos; no certifica el árbol completo, sus permisos, el recibo
de release, los bundles de API ni el contenido servido por Vercel. La procedencia
y el perfil se deben acreditar mediante el recibo real y los controles vigentes.

## Propuesta Report-Only, todavía sin aplicar

`proposal.perRouteCandidates` contiene una entrada por HTML con
`headerValueCandidate`, su tamaño y sus dependencias estáticas. Se proponen
hashes por página, sin combinar todos los scripts inline del sitio en una única
allowlist global. El nombre de cabecera propuesto es
`Content-Security-Policy-Report-Only`; `readyToApply` y `browserValidated`
permanecen en `false`.

El borrador parte de `default-src 'self'`, conserva las restricciones actuales,
separa las categorías de carga e incorpora solo los orígenes observados. No
añade `unsafe-inline`, `unsafe-eval`, `unsafe-hashes`, nonces o `strict-dynamic`.
Los atributos de estilo permanecen deliberadamente como violaciones potenciales
de `style-src-attr 'none'`: necesitan una solución revisada, sin copiar hashes de
elementos como si autorizaran atributos. Los handlers y URLs `javascript:` se
registran aparte; un hash de elemento tampoco los autoriza.

El inventario señala importaciones/cargas dinámicas, asignaciones de `src` o
HTML, peticiones calculadas, aliases conocidos de `fetch`, CSS con variables o
escapes, `srcdoc`, políticas meta y referencias malformadas. Es un análisis
léxico conservador: puede producir falsos positivos y no resuelve todos los
caminos JavaScript/CSS. No infiere los orígenes de imágenes tomadas de datos ni
el contenido que cargará un tercero. Las URLs relativas a protocolo se excluyen
de la allowlist de orígenes hasta conocer el esquema efectivo de la página.

No se inventa `report-uri`, `report-to` o endpoint. Sin colector revisado, una
prueba local solo puede observar eventos/console del navegador. **Report-Only
informa; no bloquea un script**. Una prueba negativa de bloqueo debe usar una
página sintética aislada con su propia política de enforcement; ese resultado
no demuestra enforcement en Sollahms.

## Comprobaciones pendientes antes de cualquier activación

1. Obtener el artefacto autorizado de cada perfil y acreditar sus bytes/recibo;
   generar su inventario separado después de todas las transformaciones.
2. Revisar hashes, MIME/encoding, tamaños de cabecera, URLs calculadas, estilos
   inline y los proveedores necesarios. La aprobación de un origen no se deduce
   de que aparezca en una cadena de texto.
3. Observar en Chromium las peticiones reales autorizadas de Google Fonts,
   recorridos y mapas, incluyendo redirecciones y recursos descendientes. La
   política del padre controla la carga del frame; no sustituye la política ni
   la inspección del documento de otro origen.
4. Probar primero en loopback una cabecera Report-Only sobre catálogo, fichas de
   las distintas familias, capacidad, comparador, contacto y agenda. Mantener
   proveedores sintéticos y bloquear envíos/reservas. Registrar violaciones,
   teclado y flujos, sin convertir una red interceptada en validación de terceros.
5. Revisar por separado alcance, observabilidad y autorización de un ensayo
   remoto Report-Only. La transición a enforcement exige otra comprobación y
   aprobación concreta; este documento no la ejecuta ni la autoriza.

## Pruebas del preparador

```sh
python -B -m unittest discover -s tests -p test_csp_inventory.py -v
```

Doce pruebas sintéticas cubren hashes/entidades/normalización, cuerpos externos
y datos, tokenización ambigua, módulos y cargas calculadas, CSS y tipos de
recursos, URLs malformadas, traversal, symlinks, determinismo, separación de
alcances y escritura externa exclusiva. No son una prueba de XSS ni una
certificación de navegador o del artefacto. El CI completo y cualquier QA local
adicional se registran en el cierre integrado de la fase. SEC-003 sigue abierto.
