# Direcciones oficiales y cuatro referencias adicionales

Se revisaron las seis fichas que no tenían ubicación en el mapa. Se contrastaron las páginas de las inmobiliarias y sus brochures oficiales; el nombre comercial, comuna, dirección y etapa se verificaron antes de asociar un recurso. Los registros de `reviewed-addresses.json` contienen las fuentes y decisiones, incluidos los descartes. `source-fingerprints.json` permite identificar los PDF y documentos inspeccionados sin publicar contenido completo de terceros.

Se incorporan Valle Los Ingleses III (edificio identificado), Gregorio de la Fuente A (punto publicado del proyecto), Ecuador y Nórdico (intersecciones indicadas por sus inmobiliarias). Las dos intersecciones llevan una indicación visible de referencia y acceso por confirmar. No se garantiza precisión métrica. Nominatim y dos consultas pequeñas al API público de OSM se usaron únicamente durante esta revisión, con caché local; no hay geocodificación del visitante ni consultas por proyecto en producción. Se conserva la atribución existente de OSM.

Las seis fichas reciben un enlace discreto a la fuente oficial en Ubicación. Ecuador amplía su dirección con la esquina anunciada por Norte Verde. El helper compartido conserva la atribución en regeneraciones futuras. Se mantienen precios, entregas, disponibilidad, medios y formularios sin cambios.

El catálogo mantiene 132 registros: 130 georreferenciados y dos pendientes. Mirador La Florida: Sento solo confirma Calle Eugenia; los números externos 14/6110 no se adoptan. Marina Pacífico: Euro confirma Los Pescadores 5121, pero no un punto inequívoco; la sala de ventas en Costanera 5351 no es el edificio.

## Validación y publicación

24 pruebas automáticas: identidad, conservación de los 132 datos comerciales, los 126 puntos anteriores, las seis fichas salvo dirección/atribución, filtros, orden, agrupación, navegación y helper idempotente. El paquete reutiliza los 1157 archivos exactos de producción con nueve sustituciones: 1148 archivos y todas las funciones permanecen idénticos. Véanse `package-checks.json`, `candidate-hashes.json` y `deployment-files.json`. La vista previa y la publicación usan el mismo paquete congelado, verificado durante la compilación.

Rama `codex/official-project-addresses-20261026`, sin merge ni cambios en main; despliegues Git desactivados para ambas. Base de fuentes `15fc44d0ef5335af9a4fdccb2f52d8ef5435ae72`; código de producción anterior `15fc44d0ef5335af9a4fdccb2f52d8ef5435ae72`. Rollback anterior: `dpl_GUh3TL7dxHP2AJoPVAwVqhg4JUQ9`. La herramienta oficial `request_rollback` permite restaurarlo; no se ejecuta mientras la nueva versión está sana. Los registros posteriores documentan el despliegue y las comprobaciones públicas realmente realizadas.

Producción avanzó durante la investigación. Se incorporó íntegramente la versión `15fc44d` de colaboración/contacto antes del empaquetado y se volvió a comprobar la preservación de todas las fichas.
