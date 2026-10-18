# P2 — Portadas pequeñas y recursos pendientes

Revisión local del 17 de octubre de 2026 sobre P1
`01b03931faefcd376023f3afdde99dad5a4f64c4`. Este lote conserva imágenes,
fichas, catálogo y controles de publicación. No modifica textos alternativos;
MED-008 tiene su revisión separada.

## MED-006 — Cuatro originales necesarios

Se decodificaron las cuatro portadas y se compararon dimensiones y SHA-256
contra `data/fuentes-imagenes.json` y la evidencia multimedia del informe
maestro. Los cuatro archivos son íntegros y conservan sus bytes; el problema
de resolución nativa permanece:

| Proyecto | Dimensiones nativas | SHA-256 del archivo local |
| --- | --- | --- |
| Reserva Mayor 2 | 400×300 | `5cd044c27a63b07255cba9422e538389f68fca6db84885247e9080302c6e4be5` |
| Plaza Cervantes, Torre A | 532×399 | `721dfc0bca432e3632ae8f5822b643871157d241813d0f6afd7e3a5fabcb2dbf` |
| Plaza Cervantes, Torre B | 636×463 | `5befccdf3deb03bff5cd79af150a6764fed63d12f9915a3780c8108b40854b56` |
| Trinidad III | 636×463 | `073e8eb26d4cd96f66981973032c026273e74a99f7b8864df348f3dbc3561c05` |

Se cotejaron los hashes de los originales retenidos contra los **1349 archivos
de imagen versionados** del árbol actual. Sólo aparece el original exacto de
Torre A, que es la propia miniatura de 532×399. No se identificó un master de
mayor resolución vinculado de forma verificable a estas cuatro escenas. La
comparación de hashes no descarta que el proveedor conserve otros originales;
no se infiere una URL nueva eliminando sufijos de tamaño.

Reserva Mayor 2 también conserva tres fotografías de 900×600. Se inspeccionaron
visualmente: muestran parcela, árboles y cercos desde el suelo. La portada es
una vista aérea distinta. Sustituirla por una de esas fotos cambiaría escena y
encuadre; no recuperaría su original. No se realizó esa sustitución ni se
ampliaron artificialmente los archivos.

Estas son cuatro solicitudes concretas preparadas para el propietario, **sin
envío a terceros**. Las URL son referencias retenidas con revisión del
09/10/2026, sin nueva recertificación remota en este lote:

| Destinatario y proyecto | Referencia de identidad y archivo retenido | Original solicitado |
| --- | --- | --- |
| Vesant — Reserva Mayor 2 | [Proyecto](https://www.vesant.cl/proyectos/reserva-mayor-2), [toma aérea retenida](https://wbhxfoyppzbngafroxds.storage.supabase.co/storage/v1/object/public/vesant-media/media/dji-0053-1784668997660-400x300.webp) | Misma toma aérea y etapa; master nativo de al menos 2880×2160, con procedencia y autorización del uso solicitado |
| Maestra — Plaza Cervantes, Torre A | [Tarjeta oficial retenida](https://maestra.cl/promocion-gastos-operacionales/), [miniatura Torre A](https://maestra.cl/wp-content/uploads/2022/10/Pza-Cervantes-Torre-A-miniatura.webp) | Misma fotografía de Torre A; master nativo de al menos 2880×2160. No usar Torre B ni inferir equivalencia con brochures I/II |
| Maestra — Plaza Cervantes, Torre B | [Proyecto Torre B](https://maestra.cl/proyectos/plaza-cervantes-torre-b/), [galería 2 retenida](https://maestra.cl/wp-content/uploads/2022/10/Pza-Cervantes-Torre-B-galeria-2.webp) | Misma fotografía de Torre B; master nativo de al menos 2880×2097, con identidad y encuadre comprobables |
| Maestra — Trinidad III | [Proyecto](https://maestra.cl/proyectos/trinidad-iii/), [galería 3 retenida](https://maestra.cl/wp-content/uploads/2022/10/Trinidad-III-galeria-3.webp) | Misma fotografía de Trinidad III; master nativo de al menos 2880×2097, sin sustituir otra etapa/proyecto |

Los mínimos son un **objetivo técnico propuesto**, calculado para 1440 píxeles
CSS a DPR2 conservando la proporción retenida. No son dimensiones de originales
que se hayan encontrado ni una condición comercial. El hero actual ocupa el
ancho disponible, tiene mínimo de 580 píxeles en escritorio y usa
`object-fit:cover`; la caja y el recorte efectivos requieren QA al recibir los
originales. Conservar archivo nativo, hash, URL/documento de procedencia,
confirmación de escena/etapa y autorización verificable para el canal de uso.
Una fuente pública o una licencia web no acredita por sí sola permiso para
redistribuir un master en un repositorio público.

**Estado: BLOQUEADO por originales externos y autorización verificable.** No se
repitieron búsquedas remotas fallidas sin evidencia nueva. Cuando lleguen los
originales, producir variantes sin superar la resolución nativa y revisar
nitidez, encuadre e identidad a 390/768/1440 píxeles y DPR2. No se declara esa
validación visual futura aprobada.

## Recursos privados: comprobación actual del transporte

Se ejecutó de nuevo el verificador P1 `scripts/check-private-resources.py`, con
su modo de sólo lectura y el tooling PDF parcheado. Sus selectores actuales
requieren **1039 rutas: 686 verificadas y 353 faltantes**, sin recursos
existentes inválidos. El exit code 1 señala faltantes; no es una regresión del
verificador. El resultado coincide con la fase P1:

| Cartera/selección | Verificados | Faltantes |
| --- | ---: | ---: |
| León | 305 | 5 PDF |
| Sento | 277 | 6 PDF |
| AJ Urbana | 104 | 0 |
| Ecasa oficiales | 0 | 4 WebP: 2 seleccionados y 2 originales |
| Ecasa | 0 | 130 imágenes |
| Ingevec | 0 | 165 imágenes |
| Leben | 0 | 43 imágenes |
| Total | 686 | 353 |

El denominador corresponde al **transporte seleccionado**, distinto de un
inventario de todos los manifiestos o de todos los archivos Git. Faltan 338
imágenes de Ingevec/Ecasa/Leben, los otros 4 WebP de Ecasa oficiales y 11 PDF:
342 archivos de imagen en total. No se descargó ni importó ningún recurso;
no se modificaron manifiestos, derechos ni gates para ocultar faltantes.
Los **26 casos privados de release siguen pendientes**. Las restricciones de
derechos Ecasa/Leben y la solicitud privada de recursos P1 permanecen vigentes.

Estos resultados describen el checkout local y su paquete de entrada requerido.
No prueban que los mismos archivos falten en el deployment público: el paquete
CLI y los bytes servidos continúan sujetos a OPS-01. La comprobación no concede
aprobación de release, publicación, Preview ni Production.

Evidencia externa al repositorio: `med006-estado.json`,
`private-resource-inventory-p2.json` y `private-resource-summary-p2.log` en
`/workspace/sollahms-p2-2026-10-17/medios/`. Este lote documental no añade tests
ni modifica los conteos del CI público.
