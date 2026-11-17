# Estructura de fichas de investigación

Esquema de trabajo de referencia, **2026-11-16**. Separar hechos del proyecto, unidades, planos y decisiones de conciliación. Los nombres de campos siguientes son una estructura de documentación, no campos garantizados de Iris.

| Nivel | Campos mínimos |
| --- | --- |
| Consulta | Fecha local, fuente Iris Yapo, término buscado, filtros, URL, resultado de coincidencia exacta, autenticación manual confirmada sin datos de acceso. |
| Proyecto | Clave Sollahms, nombre literal Iris, inmobiliaria identificada, comuna y dirección Iris solo de referencia, descripción, entrega, pisos, amenities observados y secciones revisadas con su alcance. |
| Unidad | Identificador de unidad, piso, descripción literal, código de modelo UI explícito, dormitorios/baños con rótulos originales, tipo publicado y fuente de su clasificación. |
| Superficie UI | Etiqueta literal, número, unidad de medida y sección. Conservar **Internos** separado de las categorías documentales. |
| Plano | URL observada, archivo original, formato real, SHA-256, derivado de lectura y hash, rótulo de modelo/tipo, dormitorios/baños, alcance impreso y unidades que enlazan el recurso en UI. |
| Superficie gráfica | Útil, interior, total, terraza, patio/jardín y terreno como métricas independientes; etiqueta y valor impresos. Logia o rooftop en campos adicionales. Nulo cuando no aparece un rótulo. |
| Precio complementario | Valor literal Iris, moneda, unidad, fecha y condiciones expresas disponibles. Estado de confirmación Sollahms separado. |
| Conciliación | Campo afectado, unidad/modelo, ambas evidencias, clasificación, limitación y decisión del propietario cuando exista. |

La asociación **unidad → imagen adjunta** prueba qué recurso mostró Iris; no demuestra que el plano sea correcto para esa unidad. Conservar también la asociación **rótulo gráfico → alcance impreso**. No propagar medidas de un modelo a otro, de una unidad a todo el proyecto ni de un rango de departamentos a unidades fuera del rango.

Para el alcance, guardar al menos: número de tarjetas DOM inventariadas, tarjetas visualmente abiertas, gráficos únicos inspeccionados, imágenes de reemplazo y secciones no inspeccionadas. Pisos o plantas no son etapas. Si no se identifican torre o etapa, dejarlas sin confirmar.

Ejemplos reales que justifican esta separación:

- Capitanes: unidades 501/601 describen A y enlazan un gráfico A cuyo alcance impreso es **Deptos. 201 al 301**.
- Indi: unidad 607 describe D, 2 dormitorios y 1 baño; su imagen adjunta imprime **Modelo A2 | 1D + 1B**.
- Bold: unidad 312 se presenta como Estudio S1; el gráfico S1 imprime **1D · 1B**.

Ninguno permite elegir una versión por inferencia. El registro debe permitir revisar el hecho original y su contradicción sin depender de una etiqueta normalizada.

## Secciones comunes y opcionales comprobadas

| Componente | Estructura y diferencias reales |
| --- | --- |
| Encabezado, Descripción, Amenities, Características y Ubicación | Presentes en las doce fichas exactas. Descripción puede requerir Más. Los campos de Características no tienen siempre valores completos; un contador no confirma stock. |
| Unidades en Venta | Todas las fichas consultadas ofrecen filas y modal. La muestra publicada varía de una a 108 tarjetas. Tipologías, superficies y códigos están repartidos entre campos de la tarjeta y texto del plano. |
| Plano individual | Puede tener modelo, tipología y cuadro de áreas; puede mostrar únicamente un dibujo o ser una imagen de reemplazo. Tres planos INN solo rotulan niveles y no acreditan código o métricas. |
| Pisos o plantas | Sección de cápsulas que abre otro carrusel. Once fichas la presentan; Nórdico no. Incluye subterráneos, plantas, cubiertas y elevaciones. Se revisaron 105 gráficos; no se obtuvieron nuevas superficies inequívocas por modelo. INN sí identifica Torres A/B. |
| Estacionamientos y Bodegas | Tablas distintas de las viviendas. Su existencia o precio no acredita inclusión en la unidad ni disponibilidad. No confundir sus botones Ver más con la apertura de un departamento. |
| Archivos | Opciones de impresión, brochure o condiciones según ficha. Nórdico solo permite impresión en el menú observado; Índigo e INN muestran dos rótulos Descargar brochure. Living Town tiene control oculto. No se deduce identidad o contenido de un documento desde el rótulo del botón. |
| Información solo gráfica | Mood tiene dos cuadros numéricos de alcance parcial; Capitanes y Bold combinan métricas y conflictos; INN y Nórdico aportan cuadros con patio/loggia o torres. Muchos otros planos solo identifican modelo y tipología. Cada imagen requiere su lectura y alcance propios. |

La presencia de una galería o menú no prueba que contenga el dato buscado. Registrar la navegación adicional necesaria, qué imagen o documento se revisó y si el rótulo era legible, ausente o contradictorio.
