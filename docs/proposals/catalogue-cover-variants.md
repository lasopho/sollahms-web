# PERF-001: candidatos locales de portadas; integración pendiente

Preparación del 17/10/2026 sobre el HEAD P2 publicado `e3b66f806ebdbc032b704f9bf53ea0f33df7cb2a`.
Se añade una herramienta de preparación y seis pruebas sintéticas; no se cambia
el runtime, el catálogo, las imágenes originales, los manifiestos de derechos,
las guardas, el empaquetador ni `vercel.json`. PERF-001 conserva estado de
**mitigación parcial**. No se ha medido una mejora de LCP ni de campo.

## Alcance y procedencia

La lista concreta coincide con las 23 entradas `largeCoversWithoutDeclaredVariants`
de la evidencia P2 retenida `alcance-variantes-existentes.json`, SHA-256
`96a00ddb4adf475ad6c82c816e97e6ca3721a27c09c9d6a6882ca29bd37097d5`.
Son portadas presentes de más de 200.000 bytes, excluidas las cinco León ya
optimizadas. Los 23 archivos coinciden con sus blobs de `HEAD` y con las entradas
conservadas en `data/leon-leben-combined-baseline.json`. Ninguna de las 23 tiene
variantes declaradas y verificadas en el vínculo retenido de su portada; no se
ha tratado otra fotografía del mismo proyecto como variante equivalente.

Veinte fuentes tienen URL del recurso, proyecto de origen, fecha histórica y
`localSha256` en `data/fuentes-imagenes.json`. Distrito Centro, INN Puerto Chico y
Edificio Suecia conservan sus bytes e identidad de uso histórico, pero no tienen
entrada de origen del archivo en ese manifiesto. No se inventa una URL para
ellos. Los dos últimos también están vinculados por hash en `data/leben-headers.json`;
esa configuración conserva `protectedPreviewOnly: true` y no constituye una
licencia adicional. La URL pública de una fuente oficial y su presencia histórica
no prueban permiso para redistribuir un derivado en otro canal.

La lista local copia el alcance heredado por recurso y marca todos los resultados
`publicationAuthorized: false`. Las restricciones separadas Ecasa/Leben de sus
brochures/suplementos se conservan; no se convierten en permisos para este lote.
El archivo de Endémico conserva su escena interior, sin llamarlo fachada ni
reemplazarlo por una imagen distinta. Las URL y fechas son evidencia histórica,
sin nueva recertificación comercial ni de derechos.

En Nórdico, `fuentes-imagenes.json` registra `bytes: 487721`, mientras el WebP local
mide 552146 bytes. El `localSha256` y las dimensiones coinciden, así como el
inventario de preservación. La preparación usa los bytes locales medidos y
registra ambos valores, sin corregir ni reinterpretar el dato de origen.

## Resultado medido de archivos candidatos

Se generaron 46 WebP locales, dos por original, con Pillow 12.3.0 / libwebp 1.6.0,
`quality=82`, `method=6`, LANCZOS, sin recorte ni ampliación. Se volvieron a
decodificar las 46 imágenes y se comprobaron tamaño, dimensiones y SHA-256.
Dos preparaciones independientes produjeron bytes de imagen idénticos. El valor
82 describe el codificador; **no acredita aceptación visual**.

| Selección fija de un archivo por portada | Bytes agregados | Ahorro respecto de originales |
| --- | ---: | ---: |
| 23 originales | 6.017.816 | — |
| 23 candidatos de 480 px | 740.228 | 5.277.588; 87,699 % |
| 23 candidatos de 960 px | 2.479.950 | 3.537.866; 58,790 % |

Son sumas de archivos seleccionados hipotéticamente a un ancho fijo. No son
transferencia observada en navegador, selección `currentSrc`, peso de una página,
LCP, CLS, métricas CDN o Core Web Vitals. Conservar todos los originales y añadir
ambos candidatos ocupa espacio adicional; no se suman las dos variantes como si
el navegador descargara necesariamente ambas.

| Proyecto | Original px | Original B | 480 B | 960 B | SHA-256 original |
| --- | --- | ---: | ---: | ---: | --- |
| distrito-centro | 1600×1000 | 325,286 | 45,836 | 151,496 | `d4601abba8fe196cf3358308de8ba1cb4d8a128da78f509af495e34213892ff9` |
| costanera-coquimbo-b | 1600×900 | 214,190 | 32,926 | 100,590 | `0a93a4a8f05992026c976f84aeeaa7690fc7983d3d0bbe9c64ddb57837d036d4` |
| endemico | 1600×900 | 223,362 | 22,744 | 92,456 | `5f9ed9dd607d56654d636ad450f3a8878a3e5148fbddf2d5c504733aca6b3fa7` |
| vista-reloncavi | 1600×488 | 202,172 | 23,056 | 84,254 | `d7d812ce2867bed79f1c5d78220cbd496e4eca47ff3260ba1aaf184938ef2e40` |
| entre-vicunas | 1600×1000 | 207,744 | 23,658 | 82,166 | `7dbf30226e5137fb2f11864261492664a7f0493b4fa697ad86bd3b80c32ba01d` |
| guillermo-mann-1401 | 1600×1000 | 214,310 | 23,062 | 81,520 | `e6a3a26b5d1cc59b091b320cf741ea7d9390aa0cf77bf1fd80d849e9b7316237` |
| edificio-baum | 1200×1200 | 233,934 | 44,450 | 157,042 | `6d2676aeb10e0c24161756ae42b9467d1442a8b48eb8ec211d4c9c32a68a925e` |
| inn-puerto-chico | 1600×1000 | 209,518 | 27,218 | 78,516 | `cc72a97670f1670fe2489ebff9451469729557b4bb522d9c73b47cc2474a218a` |
| edificio-suecia | 1600×1000 | 214,840 | 31,244 | 83,998 | `90a290a4d3726ed05cdedcf093aacbdbc2fc8910a105c4a4699ca8ee0411c7a6` |
| capitanes | 1600×900 | 217,510 | 27,450 | 96,824 | `5b34deb2f6446d64c762bfc2826c0716bc7b29558ff9c2192cf3ecfa26a6650d` |
| vergara-domeyko | 1600×900 | 217,330 | 33,100 | 110,644 | `aabae36550fc84c1dcf9358f044ef63a770fce866602f33d646dc264667dc44f` |
| parque-panama | 1600×900 | 231,512 | 30,222 | 103,944 | `a158b96d87aced4f657cc3e19eb1c06751109e16a429bf087011e6bdb097fdcc` |
| quintavista | 1600×900 | 251,648 | 37,788 | 125,674 | `90a2c8d453c69dc1b8c090c49f978c32309bedeb2b33deb73b957f174464b72c` |
| eleuterio-ramirez | 1600×1067 | 243,060 | 34,022 | 110,632 | `aa45645a601d10429b29b199134a7827448c7bdc7e97daea47cd569a6c397c90` |
| vicuna-mackenna-6896 | 1600×900 | 202,360 | 30,752 | 103,882 | `22069bcb70ef3788f0f533ec576adea1d1d63316c5a0bb6da2ec927e5886dcb5` |
| carmen-marin | 1600×1065 | 251,658 | 38,524 | 119,136 | `1f00a87e7bb2bf05fc40fc9c37093b829926ca1a2cde00460bc673423dedb4ec` |
| edificio-plaza-nova | 1600×1065 | 200,152 | 29,542 | 88,386 | `80ce3e88aa0cd60207515ec61b866b30a7385666c145ebf7a4766b50591cbfc9` |
| edif-origen-atacama-3008 | 1600×900 | 286,882 | 34,484 | 115,590 | `d632c3f186dceea0ee987f4e0e8a4842306c5440b40496fa27b18bbf4ed6a411` |
| vitro | 1600×1000 | 342,198 | 45,562 | 150,130 | `2751bf14f0c916a03008fe6a13fa949c41add6185c56b49e89ab37ea34646453` |
| jose-pedro-alessandri | 1600×1000 | 527,760 | 47,550 | 184,962 | `76b397ecb9150c13e9edc0d526e43672871d56d96e5815500f81c3bf02d1bc7d` |
| vicuna-mackenna-1432 | 1600×1000 | 210,248 | 24,032 | 84,090 | `c4417044c322bd4a299f8f7bc85619c36992043f778e2c2feffe472db7c78afd` |
| marina-pacifico | 1600×1000 | 237,996 | 28,726 | 94,496 | `0848b7ec57096bba9b0f7bebdccb0d4bbaa1547afeeb9c892b0d1bab28131705` |
| edificio-nordico | 1969×1108 | 552,146 | 24,280 | 79,522 | `4b8f1b8d01a821f79b9fec25b5db6c2e92a4b74c01d6762634b7471ce1f86a9a` |

El manifiesto local contiene además la ruta exacta de cada original, su blob Git,
las dimensiones, bytes y hash de cada variante, la procedencia y el alcance
heredado. Los candidatos y manifiestos quedan fuera del checkout:

- `/workspace/work/continuity-performance/shortlist.json`
- `/workspace/work/continuity-performance/head-verified/manifest.json`
- `/workspace/work/continuity-performance/head-verified/assets/`
- `/workspace/work/continuity-performance/verification.json`

Lista local SHA-256: `356f08795fe9de315b1dde3e5761de7e4b5b287f4270c755a6dabc9b3840f850`.
Manifiesto HEAD verificado SHA-256: `dc1ba4ff7ca0cedffea10c59385b20945d0f276239ebac6ac9f2bba885f6c807`.

## Uso de la herramienta y comprobaciones negativas

La herramienta requiere `--root`, una lista revisada y `--output` absoluto nuevo.
No descubre ni descarga medios. El revisor debe comprobar expresamente el vínculo
`slug`/archivo/proyecto y el alcance de la lista; la herramienta verifica
integridad y seguridad de rutas, no certifica derechos ni identidad visual.

```sh
python3 -B scripts/prepare-cover-variants.py \
  --root /workspace/work/sollahms-continuity \
  --shortlist /workspace/work/continuity-performance/shortlist.json \
  --output /workspace/work/continuity-performance/new-reviewed-candidates
python3 -B -m unittest discover -s tests -p test_cover_variants.py -v
```

La lista usa `schemaVersion: 1`, `expectedCount`, `encoding` y `sources`. Cada fuente
requiere `slug`, `source` (`path`, `sha256`, `bytes`, `width`, `height`), `provenance`
y `inheritedScope`. El codificador exige las versiones exactas de la receta,
anchos `[480, 960]`, calidad 82 y método 6. Cambiar versiones requiere revisión
explícita de la receta; no promete identidad binaria entre codificadores distintos.

Las seis pruebas verifican conservación del original y alcance, reproducibilidad,
blobs `HEAD`, errores de hash/bytes/dimensiones, fuente no versionada, sustitución
de bytes aunque coincida el hash de una lista manipulada, traversal, enlaces
simbólicos, fuentes privadas fuera de alcance, versiones no fijadas, duplicados,
falta de alcance y prohibición de ampliar. Rechazan salida dentro del checkout,
en otro worktree registrado o repositorio independiente, en un ancestro del
checkout, por alias simbólico, por ruta relativa/traversal o sobre una carpeta ya
existente. Se valida el lote completo antes de crear salidas. Todo usa imágenes
sintéticas y Git local, sin llamadas a proveedores.

## Integración mínima propuesta y bloqueos

Una integración futura conservaría `src`, `alt`, `loading=lazy`, `decoding=async`,
el enlace de ficha y el placeholder actual. Añadiría fuentes sólo cuando coincidan
el `slug`, la ruta exacta del original y el manifiesto revisado. No modificaría
precios, planos, escenas ni galerías. El generador de presentación debe poder
reproducir el mapa; no bastaría una edición manual de `proyectos.html`.

Actualmente `proyectos.html` está fijado por hash tanto en la evidencia de
preservación de publicación como en `tests/p2-catalogue-scope.mjs`; este último
acepta exactamente el P2 existente y rechaza otras ediciones. La guardia de
publicación no normaliza P2. Por tanto, no hay integración segura del mapa nuevo
en el runtime actual que conserve intactos esos controles. Crear un script
alternativo o un overlay de CSS para eludirlos no resolvería ese bloqueo. Este
lote no modifica guardas ni introduce ninguna de esas vías.

Bloqueos y acciones concretas:

1. **Implementación local preparada:** generador, lista exacta, 46 candidatos y
   verificación de integridad completos. No depende de recuperar los 353 recursos
   privados y no cambia su denominador.
2. **Integración/release:** diferida por los controles de preservación congelados.
   Cualquier evolución necesita un lote de integración expresamente revisado que
   mantenga controles negativos equivalentes; no se amplía ese alcance aquí.
3. **Derechos/procedencia:** confirmar alcance de derivados por recurso antes de
   publicar; completar la procedencia faltante de los tres archivos destacados.
   Preparar candidatos locales no cierra esos puntos ni autoriza subir binarios.
4. **Aceptación visual y densidad:** pendiente en 390/768/1440 px y DPR1/2, con
   recorte efectivo del grid y comprobación de `currentSrc`/cuerpos recibidos.
   Vista Reloncaví es 1600×488: su proporción 3,28 produce un recorte fuerte dentro
   de 16:9. Para una caja de 384×216 CSS px, la cobertura nítida a DPR2 exige un
   archivo de unos 1416 px de ancho (432 px de alto); 960×293 es insuficiente.
   Puede necesitar la fuente de 1600 u otro ancho revisado. Los candidatos
   480/960 no se presentan como solución universal y nunca deben forzar una
   resolución menor sólo para alcanzar un objetivo de bytes.
5. **Métricas posteriores:** medir selección real, transferencia, LCP y CLS en un
   entorno autorizado con acceso y recursos completos; CDN y campo siguen aparte.
   Las galerías y planos permanecen fuera de este lote.
