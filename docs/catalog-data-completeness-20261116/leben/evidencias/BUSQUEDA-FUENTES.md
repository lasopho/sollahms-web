# Búsqueda de fuentes y filtros Leben

Fecha de auditoría: 16/11/2026. Solo lectura; no generadores, despliegues ni cambios de fuentes comerciales.

## Universo y atribución

El catálogo local contiene 131 filas. Hay 14 etiquetadas Leben; Parque Germania pertenece a ESEPE según el encargo y el propio manifiesto. Se excluye del bloque, conservando su fila en la matriz maestra y la contradicción. Los 13 restantes incluyen Own (Vendido / Proyecto entregado), por lo que solo 12 constan no vendidos en este snapshot. Esto no acredita stock ni vigencia al 16/11/2026.

El archivo remoto de main consultado con GitHub fetch_file contiene 134 filas, blob 408adf254b9c84684a8bb01a15962167564475c1. Los 14 etiquetados Leben son los mismos. Las 134 filas remotas no se mezclan con el universo local solicitado de 131. origin/main local apunta a f1e9bf1715cc99d095a367eba9028a9a1ad2b026 del 12/10/2026 y está desactualizado respecto de main remoto.

## Filtros realmente disponibles

proyectos.html líneas 162–170: búsqueda, activo, región, comuna, estado, máximo UF y orden. Líneas 339–349: predicado. El precio usa precioDesdeUF numérico finito; con máximo aplicado excluye desconocidos. Orden por precio deja desconocidos al final. El activo utiliza project.tipoActivo ?? Residencial, y los 13 Leben no poseen tipoActivo explícito. Se trata de un valor predeterminado del programa, no de confirmación documental.

No existen en este checkout filtros de dormitorios, baños, superficie útil, superficie total, terraza, jardín, amenities o entrega. Entrega y tipologías se muestran en las tarjetas. La búsqueda libre no utiliza amenities, tipologías ni superficies. Datos de fichas y brochures no alimentan automáticamente predicados nuevos.

Sobre 13 Leben: precio numérico 12; estado 13; entrega 10 (incluye Own entregado); tipologías 13; amenities 13; dormitorios en specs 13; baños en specs 12 (Nórdico solo acredita unidad 101 aparte). Útil 0; total 0; terreno 0; terraza 0; jardín privado 0 estructurados. superficieDesdeM2 tiene 11 valores generales sin clasificación y no cuenta como útil o total. Las cifras describen presencia local, no vigencia comercial.

Los siete paths de advanced-filters solicitados no están en checkout ni HEAD ni aparecen en git log --all por esos paths. origin/main local tampoco los contiene. Fetch directo de GitHub main para data/catalog-facets.json y README advanced-filters devuelve404; búsquedas catalog_property_facts e INVENTARIO_13_PROYECTOS no retornan resultados. No declarar auditada una implementación de filtros avanzados no disponible.

## Inventario y documentos de control

Búsqueda por nombre y referencias en repositorio, Downloads, Documents y adjuntos: INVENTARIO_13_PROYECTOS.csv e INSTRUCCIONES_CODEX.md no encontrados. docs/leben-brochures-inventario.md ya advierte que el inventario y las instrucciones anteriores fueron regenerados y mantenidos privados. data/brochures-leben.json contiene hashes de esos controles, que no pueden contrastarse sin los archivos. Los 12 PDF de Downloads/Leben sí están disponibles: 11 Leben y 1 ESEPE. No se encontraron brochure Own o Nórdico. No solicitar de nuevo los 11 PDF Leben disponibles.

## Fuentes directas del propietario recuperadas

1. Adjunto 583827f8-f49f-4336-8328-84568a0a3ad6/Texto pegado.txt, línea 65: se deben priorizar los precios Sollahms de INN y Suecia aun frente a capturas de otro precio. Tabla líneas 107–119 con 10 Leben y Parque Germania. Todas las filas se preservan en el JSON, con precio, fecha de entrega, dirección y tipologías. Son antecedentes históricos sin fecha documental ni vigencia actual declaradas. Sus instrucciones antiguas de edición no se ejecutan.

2. Adjunto 6d8ca7b5-9b4e-4024-8b32-9da9c59024db/Texto pegado.txt, líneas 65–87: datos directos de INN, incluyendo 2–5 dormitorios; 78–242 m² considerando patio/jardín exclusivo; tipos patio privado/dúplex; piscina climatizada, quinchos, sauna, gimnasio, hidromasaje, fogones, lounge, lavandería, bodega náutica, jardín interior y rooftop wellness; cocina Franke, ventanas PVC termopanel, radiadores con caldera individual y cuarzo. No convertir el rango en útil/total, no generalizar todos los interiores a cada modelo y contrastar diferencias de fuente antes de incorporar. Fecha documental s/f.

3. Adjunto 29eddadf-7ca4-4dad-90e2-13594c926efe/Texto pegado.txt enumera Leben para rediseño visual; no se usa como evidencia de precios o superficies. Otros adjuntos de navegación/SEO solo mencionan INN o Suecia, sin datos de negocio nuevos.

No se hallaron planillas XLSX/CSV adicionales Leben ni capturas comerciales Leben separadas en esos ámbitos. La auditoría usa las fuentes documentales disponibles y registra los vacíos, sin inventar completitud.
