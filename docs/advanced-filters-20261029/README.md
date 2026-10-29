# Filtros avanzados del catálogo Sollahms

El catálogo conserva las vistas Tarjetas, Listado y Mapa y añade filtros combinables respaldados por los datos revisados de las 131 fichas. Las tarjetas mantienen fotografías, tipologías, precio desde, identidad, animaciones y acceso a cotización.

## Filtros disponibles

- Región/comuna; rango mínimo y máximo en UF; departamento, casa, local comercial o terreno; estudio/1/2/3/4+ dormitorios; entrega inmediata y años 2027/2028/2029 verificados.
- Más filtros: baños, ocho tipologías con dormitorios/baños vinculados, superficie útil/interior/total/terraza/jardín, 15 categorías de amenities, cinco características de vivienda, estado comercial normalizado, tipo de activo e inmobiliarias múltiples.
- Búsqueda por nombre, ubicación, inmobiliaria o características; chips removibles; contador; limpiar y modificar búsqueda; orden por precio, entrega, nombre o coincidencia textual. Tarjetas/listado/mapa comparten los mismos resultados.
- URL compartible con parámetros acotados y permitidos. El regreso desde una ficha conserva filtros, orden y vista. No se guardan inputs financieros ni texto personal arbitrario.
- En móvil, panel Filtros y botón Ver resultados permiten recuperar espacio para explorar proyectos. Controles nativos con etiquetas, foco, estados y áreas táctiles.

Las categorías usan AND; las selecciones de una misma categoría usan OR, salvo la opción explícita Debe incluir todas. Los límites son inclusivos. Un rango invertido muestra un mensaje y cero resultados. Los precios son siempre el precio desde validado del proyecto, también al seleccionar un local; no se reemplazan por campañas, unidades ni mínimos históricos de otra tipología.

## Datos y alcance

131 proyectos de 13 inmobiliarias. Se normalizaron 20 conceptos: piscina, gimnasio, quinchos, salón multiuso, cowork, bicicleteros, lavandería, áreas verdes, juegos infantiles, terraza panorámica común, lounge, mascotas, seguridad/acceso, estacionamientos, bodegas, cocina equipada, termopanel, tecnología, terraza privada y jardín/patio privado. No se añadieron amenities inventados ni nuevos dibujos SVG: se reutiliza el sistema de las fichas y se agrega el mapeo semántico.

114 proyectos tienen al menos una característica filtrable; 54 tienen una superficie exacta tipada. 60 tienen dormitorios/baños vinculados y 50 también superficie en la misma fila. La revisión conserva 703 filas de la etapa de referencia y excluye 21 de otras etapas. Nunca se cruzan dormitorios, baños, superficies o espacios privados de modelos distintos. El índice no publica inventario de unidades.

61 proyectos tienen entrega inmediata verificada y 17 un año confirmado; otros dos constan como entregados, sin convertir ese dato en disponibilidad inmediata. Los 93 precios conocidos y 38 pendientes siguen intactos. Las 131 fichas permanecen idénticas en esta publicación: la mejora conecta sus características al buscador sin reescribir contenido.

## Pendientes y exclusiones

| Dato pendiente | Proyectos |
| --- | ---: |
| Precio desde | 38 |
| Tipo de propiedad | 8 |
| Entrega verificada | 51 |
| Estado comercial verificable | 29 |
| Superficie exacta tipada | 77 |
| Baños documentados | 16 |
| Amenities comunes filtrables | 19 |

No informado significa desconocido: sin ese filtro, el proyecto sigue apareciendo. Los ocho tipos pendientes son Alto Buzeta, Plaza Cervantes A, Mapocho A, Froilán Norte/Sur, Parque Germania, Own y Monjitas 690. Reserva Mayor 2 informa terreno desde 1.500 m², sin lote exacto/máximo; no se inventa un rango numérico. Climatización no se ofrece como filtro porque sólo hay opciones/preinstalaciones, no instalación verificada. No se prestan áreas residenciales a locales, ni amenities de una etapa a otra. Family Room, salón gourmet y zona de entrenamiento no se equiparan automáticamente a SUM/lounge/gimnasio.

`coverage.json` enumera los pendientes por proyecto; `property-audit.json` conserva fuentes y 1.527 punteros verificados; `amenity-audit.json` documenta el criterio de los 973 ítems existentes. Son auditorías internas del repositorio; el sitio sólo recibe la proyección pública pequeña.

## Fuente única y archivos centrales

| Archivo | Función |
| --- | --- |
| `data/amenities.json` | Nombres, alias, SVG y IDs de filtro semánticos comunes. |
| `data/project-features.json` | Grupos y descripciones compartidos por ficha e índice, con procedencia y alcance. |
| `scripts/project_amenities.py` | Render único de las características de cada ficha. |
| `scripts/catalog_property_facts.py` | Lee 15 fuentes actuales revisadas, conserva el modelo/etapa y valida los punteros; no contiene precios nuevos. |
| `scripts/build-catalog-facets.py` | Regenera `data/catalog-facets.json` y auditorías desde las fuentes anteriores. |
| `templates/catalog-filters.html` | Controles reutilizables, aplicados por `build-catalog-presentation.py`. |
| `assets/js/catalog-filter-engine.mjs` | Reglas de coincidencia, rangos, orden y URL. |
| `assets/js/catalog-filter-controls.mjs` | Controles, opciones, chips y persistencia pública. |
| `assets/css/catalog-filters.css` | Distribución responsive con los tokens de Sollahms. |

`catalog.mjs`, `catalog-model.mjs` y `catalog-map.mjs` integran el sistema en las vistas existentes; `projectOffer` mantiene el precio desde del proyecto. No se alteran endpoints ni destinatarios de formularios.

## Mantenimiento

1. Actualizar el ítem comprobado y su evidencia en `data/project-features.json`; indicar `filterEligible` y el alcance real. Las variantes privadas y superficies provienen de los registros de modelos revisados, no de una copia manual en el índice.
2. Para un concepto nuevo, registrar su nombre/alias, SVG coherente e IDs semánticos en `data/amenities.json`. Una imagen o un icono parecido no acredita una característica.
3. Ejecutar `python scripts/project_amenities.py` y `python scripts/build-catalog-facets.py`. Un mismo cambio del registro central llega a ficha y filtros; nunca editar `catalog-facets.json` a mano.
4. En un proyecto nuevo, generar su ficha con el componente compartido, incorporarlo al catálogo/fuentes y ejecutar `python scripts/register-project-features.py SLUG`. Revisar la evidencia/etapa/producto de los ítems importados antes de activar su elegibilidad; no se asumen datos.
5. Ejecutar ambas variantes `--check`, `python scripts/build-catalog-presentation.py --check`, `python tests/catalog_features.py`, `python tests/amenities.py` y las pruebas Node indicadas en `node-tests.tap`.
6. Publicar mediante `scripts/package-catalog-filters.py`, superponiendo sólo los ocho archivos públicos cambiados al último artefacto congelado. Este manifiesto pasa a ser la nueva base para futuras publicaciones.

## Verificación

52 pruebas Node aprobadas cubren filtros, URL, rangos, datos desconocidos, vinculación de modelos, alcance comercial, precios del propietario, mapas, cotización, retiro de Patio Brasil y los cuatro campos obligatorios. Se aprobaron seis pruebas del componente de amenities y tres del registro compartido. Las verificaciones de formularios usan transporte simulado; no se enviaron leads reales.

`preservation.json` verifica 139 archivos idénticos, incluidas las 131 fichas, catálogo/precios, portada y código visual/formularios. `packaging.json` verifica la preservación de todos los demás registros del artefacto, incluidas las funciones, HTTP 410 de Patio Brasil y sincronización de Nollagam. La revisión de navegador y publicación se registra en `responsive.json` y `release.json`.
