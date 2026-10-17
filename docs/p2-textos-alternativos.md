# MED-008: descripciones visuales de imágenes existentes

Revisión visual: 17/10/2026 (America/Santiago). Base de aplicación: `9204a57e50ed8a5f7037be761cf70de55fe153d4`, que ya conserva los cambios P2 previos de navegación y embeds. Este lote modifica **512 valores `alt` genéricos en 94 fichas**, correspondientes a **331 imágenes únicas** y 335 asociaciones ficha/recurso. No modifica archivos de imagen ni sus asociaciones.

El [registro de descripciones revisadas](../data/reviewed-image-alts.json) conserva cada ruta, SHA-256, descripción de escena, clase de imagen, fecha, índice de revisión y referencias de procedencia ya retenidas. Los 331 archivos nativos fueron revisados visualmente en este lote por el agente principal y tres agentes revisores. Los 156 registros clasificados como render se describen expresamente como referenciales; cuando la técnica visual no se pudo distinguir con certeza, se conserva `unknown` sin inventarla.

Las descripciones se refieren sólo a lo visible. No añaden nombres de proyecto o etapa, disponibilidad, especificaciones comerciales ni dimensiones. Los recursos compartidos mantienen su misma descripción de escena, sin atribuir una fotografía a una etapa por el parecido. Las alternativas que ya describían una escena se conservan, incluida una instancia descriptiva de Mood que comparte archivo con otra instancia antes genérica.

## Procedencia y alcance

329 imágenes conservan referencias a `data/fuentes-imagenes.json`, con URL del recurso y página de origen, fecha histórica y hashes. Dos recursos preexistentes, `inn-puerto-chico-principal.webp` y `suecia-principal.webp`, no tienen entrada en ese manifiesto: el registro identifica esta limitación y referencia su HTML y evidencia histórica de presencia. No se inventa su URL original ni se considera que describirlos subsane esa falta documental.

Este lote no amplía derechos de uso ni cambia permisos o manifiestos de publicación. Los bloqueos MED-001/SRC-002, los originales privados ausentes y la revisión de calidad de otros recursos mantienen su estado. Las 331 imágenes presentes revisadas aquí no deben confundirse con los 338 rasters privados faltantes del inventario de transporte.

## Aplicación y regeneración

`scripts/reviewed_image_alts.py` sólo aplica una descripción cuando coinciden la ficha, la ruta y el `alt` genérico previamente inventariado. Antes comprueba los bytes SHA-256 de la imagen y la integridad del dataset revisado. Conserva el resto del HTML literalmente, escapa el nuevo valor y mantiene las descripciones específicas existentes. Un archivo cambiado requiere nueva revisión; una ruta o asociación no registrada no adquiere una descripción.

El generador `scripts/build-project-details.py` llama al mismo helper al terminar `render()`, también en la salida especializada Sento. No se ejecutó una regeneración completa de fichas: el lote se aplicó mediante `python scripts/apply-reviewed-image-alts.py`, que exige el inventario exacto de ocurrencias. `--check` verifica que ya esté aplicado y que los recursos conserven sus hashes, sin escribir.

## Verificación

Diez pruebas dirigidas contrastan los 512 valores con el dataset, los 331 hashes, los bytes ajenos a `alt` de las 94 fichas, idempotencia, escaping, rutas/fichas no registradas, conservación de alternativas descriptivas, rechazo de imágenes o dataset alterados y la salida futura del generador en memoria. No se sustituyen las pruebas de comportamiento por proyecciones históricas.

`tests/p2-media-scope.mjs` es exclusivamente de pruebas: exige hashes completos de antes y después para 94 HTML y el hook del generador. Su reversión vuelve al predecesor P2 `9204a57`, para componer después las guardas anteriores; no salta directamente a P1 ni participa en autorización de publicación. Un canario fuera del cambio revisado se rechaza.

Las verificaciones integradas del lote P2 y los 26 casos privados mantienen sus criterios originales. Este documento no autoriza merge, despliegue ni incorporación de nuevos medios.
