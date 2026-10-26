# Direcciones oficiales y cuatro referencias adicionales

Se revisaron las seis fichas que no tenían ubicación en el mapa. Se contrastaron las páginas de las inmobiliarias y sus brochures oficiales; el nombre comercial, comuna, dirección y etapa se verificaron antes de asociar un recurso. Los registros de `reviewed-addresses.json` contienen las fuentes y decisiones, incluidos los descartes. `source-fingerprints.json` permite identificar los PDF y documentos inspeccionados sin publicar contenido completo de terceros.

Se incorporan Valle Los Ingleses III (edificio identificado), Gregorio de la Fuente A (punto publicado del proyecto), Ecuador y Nórdico (intersecciones indicadas por sus inmobiliarias). Las dos intersecciones llevan una indicación visible de referencia y acceso por confirmar. No se garantiza precisión métrica. Nominatim y dos consultas pequeñas al API público de OSM se usaron únicamente durante esta revisión, con caché local; no hay geocodificación del visitante ni consultas por proyecto en producción. Se conserva la atribución existente de OSM.

Las seis fichas reciben un enlace discreto a la fuente oficial en Ubicación. Ecuador amplía su dirección con la esquina anunciada por Norte Verde. El helper compartido conserva la atribución en regeneraciones futuras. Se mantienen precios, entregas, disponibilidad, medios y formularios sin cambios.

El catálogo mantiene 132 registros: 130 georreferenciados y dos pendientes. Mirador La Florida: Sento solo confirma Calle Eugenia; los números externos 14/6110 no se adoptan. Marina Pacífico: Euro confirma Los Pescadores 5121, pero no un punto inequívoco; la sala de ventas en Costanera 5351 no es el edificio.

## Validación y publicación

24 pruebas automáticas: identidad, conservación de los 132 datos comerciales, los 126 puntos anteriores, las seis fichas salvo dirección/atribución, filtros, orden, agrupación, navegación y helper idempotente. El paquete reutiliza los 1157 archivos exactos de producción con nueve sustituciones: 1148 archivos y todas las funciones permanecen idénticos. Véanse `package-checks.json`, `candidate-hashes.json` y `deployment-files.json`. La vista previa y la publicación usan el mismo paquete congelado, verificado durante la compilación.

Rama `codex/official-project-addresses-20261026`, sin merge ni cambios en main; despliegues Git desactivados para ambas. Base de fuentes `15fc44d0ef5335af9a4fdccb2f52d8ef5435ae72`; código de producción anterior `15fc44d0ef5335af9a4fdccb2f52d8ef5435ae72`. Rollback anterior: `dpl_GUh3TL7dxHP2AJoPVAwVqhg4JUQ9`. La herramienta oficial `request_rollback` permite restaurarlo; no se ejecuta mientras la nueva versión está sana. Los registros posteriores documentan el despliegue y las comprobaciones públicas realmente realizadas.

Producción avanzó durante la investigación. Se incorporó íntegramente la versión `15fc44d` de colaboración/contacto antes del empaquetado y se volvió a comprobar la preservación de todas las fichas.

## Publicación comprobada

Código `8436c93361c1842f7fb05aa4ec653ccee19bb3f6`. Producción `dpl_HphMyTm2PcfiYJdy8CvE41ThKRj1`, READY y asignada a sollahms.cl. Los nueve archivos modificados y tres controles sin cambios coinciden por SHA-256 con el candidato al descargarlos del dominio; `/api/uf` respondió 200 con $41.221,08 al 26/10/2026. No aparecieron errores/fatales del despliegue en la ventana consultada. La advertencia de versión CLI se documenta en release.json; no se recompilaron funciones intactas para eliminarla.

Capturas reales: [mapa público de escritorio](public-desktop-map.png), [ficha pública móvil](public-mobile-fiche.png) y [mapa móvil de la vista previa](preview-mobile-map.png). Revisados a 1440×1000 y 390×844, sin desbordamiento horizontal. El preview y producción comparten los mismos 1157 hashes.
