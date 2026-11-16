# Leben: auditoría documental y pendientes al 16/11/2026

Auditoría entregada para **13 proyectos Leben** del catálogo local de 131 filas. Se revisaron completos **11 brochures y 82 páginas**, además de fichas, notas y adjuntos históricos del propietario. Se controlaron los hashes de los **12 PDF** disponibles: los 12 coinciden. Parque Germania queda fuera de Leben: su portada acredita ESEPE; solo se revisó su identidad, sin abrir el bloque de esa inmobiliaria.

**La fase documental queda entregada; los datos comerciales actuales y la conciliación siguen pendientes.** Hay 12 proyectos que no figuran vendidos en el snapshot y Own, que figura vendido/proyecto entregado. No se interpreta ese recuento como disponibilidad actual ni se activan unidades.

## Entregables y lectura

[Plantilla de respuesta protegida](PLANTILLA-RESPUESTA-LEBEN.xlsx) · [Matriz completa CSV](MATRIZ-LEBEN.csv) · [Solicitudes agrupadas CSV](DATOS-PENDIENTES-PROPIETARIO.csv) · [Evidencias confirmadas CSV](DATOS-CONFIRMADOS.csv) · [Fuentes y SHA-256](FUENTES-DOCUMENTALES.csv) · [Matriz maestra de 131](../master/MATRIZ-MAESTRA-131.csv) · [Estado global](../master/ESTADO-GLOBAL.json) · [Continuidad](../continuidad/NEXT-PROMPT.md).

En el Excel, completar únicamente las celdas amarillas de respuesta, unidad, fuente, fecha y observaciones. La información encontrada y las hojas de matriz y fuentes están protegidas. La protección evita cambios accidentales y se puede retirar deliberadamente en Excel; no es cifrado. Una respuesta todavía no es un dato conciliado. Las fuentes deben permitir comprobar la respuesta.

## Alcance, versiones y límites

La matriz maestra conserva los 131 slugs, nombres y orden del catálogo local recibido, SHA-256 `8f1c7ea7021cb630c4144fb7612d741d4c472d3534189da7b09e1299580bed78`. El checkout original tenía cambios en curso y su HEAD contenía 137 filas. Se creó la rama `codex/auditoria-leben-20261116` en un checkout independiente, con lectura parcial de archivos. Las copias de referencia de 131 filas viven exclusivamente dentro de esta documentación; no reemplazan las fuentes de aplicación.

La lectura remota de `main` devolvió **134 filas**, con tres slugs adicionales respecto del snapshot local: `atelier-prat-oficinas`, `corrientes-oficinas` y `vergara-domeyko`. Se conserva [esa lectura](evidencias/main-remoto-proyectos.json). La página pública no pudo verificarse mediante web ni conexión directa en esta sesión; no se afirma que producción sirva 131 filas, esta implementación o estos precios.

Se buscaron repositorio, referencias e historial Git locales, documentación, Downloads/Leben, adjuntos anteriores del propietario y Drive conectado. El archivo `INVENTARIO_13_PROYECTOS.csv` y las instrucciones originales con hash histórico no se localizaron. No se regeneraron haciéndolos pasar por originales. El control verificable utilizado es el inventario de 12 PDF de `data/brochures-leben.json`, más la inspección efectiva de la biblioteca. Nórdico y Own no tienen brochure localizado. No se solicita nuevamente ninguno de los 11 brochures Leben disponibles. [Registro de búsqueda](evidencias/BUSQUEDA-FUENTES.md).

Hay **21 archivos fuente locales examinados**: 12 PDF (uno de identificación ESEPE), siete archivos del repositorio y dos adjuntos del propietario. Las capturas antiguas no aparecieron como archivos independientes; su información recuperable se conserva mediante los adjuntos, `reviewedOriginal` y las notas verificadas, con la procedencia que realmente existe. No se presenta un derivado o una captura citada como original recuperado.

## Resultados y clasificación

| Medida | Resultado |
| --- | --- |
| Proyectos Leben revisados | 13 |
| Brochures Leben completos / páginas | 11 / 82 |
| PDF controlados por SHA-256 | 12 de 12 coincidentes |
| Archivos fuente locales examinados | 21 |
| Evidencias atómicas conservadas | 679 |
| Evidencias individuales CONFIRMADO | 424 |
| Campos canónicos de matriz | 689 |
| Campos CONFIRMADO | 209 |
| Campos PARCIAL | 72 |
| Campos HISTÓRICO | 47 |
| Campos CONTRADICTORIO | 7 |
| Campos DESCONOCIDO | 352 |
| Campos NO APLICA | 2 |
| Solicitudes agrupadas al propietario | 55 |
| Diferencias documentales Leben / pendientes de conciliación | 7 / 3 |
| Atribución adicional ESEPE pendiente | 1 |
| Precios ratificados comercialmente en esta fase | 0 |

Un campo canónico es una combinación proyecto/campo de la matriz: 53 campos por proyecto. Una evidencia es una afirmación de una fuente; varias pueden respaldar el mismo campo. Sus recuentos no se suman. CONFIRMADO significa respaldado documentalmente en el alcance y fecha citados; no implica stock ni vigencia comercial. PARCIAL conserva el contenido conocido y describe la asociación o especificación que falta. HISTÓRICO conserva precios, estados y fechas anteriores. DESCONOCIDO no significa ausente. NO APLICA se usa aquí solo para precio y oferta por tipología de Own mientras el registro conserve vendido.

Los PDF no muestran fecha editorial inequívoca. Se registra `s/f`; los metadatos técnicos se conservan por separado y no se utilizan como fecha comercial. Las verificaciones oficiales archivadas son del 09/10/2026 y, para Nórdico, del 13/10/2026. No se renovaron esas verificaciones durante esta auditoría.

## Datos recuperados que no deben volver a pedirse

Se conservaron identificaciones, localizaciones, rangos de dormitorios y baños con su alcance, amenities y terminaciones con página física y SHA-256. Se recuperaron también modelos B/C de Argomedo (2D/2B) y antecedentes de las unidades 204 de Bold (un baño), 311 de Índigo (dos baños) y 101 de Nórdico (1D/1B, UF 4.746 sin estacionamiento ni bodega). **Unidad no equivale a modelo** y ninguno de estos registros acredita oferta actual. [Modelos y unidades parciales](evidencias/modelos-y-unidades-parciales.json).

INN documenta departamentos, dúplex y unidades con patio privado; el brochure y el adjunto histórico describen 2–5 dormitorios y 78–242 m² considerando patio/jardín exclusivo. La ficha comercial archivada registra 2–4 dormitorios. Los ámbitos se conservan separados; no se deduce disponibilidad de cinco dormitorios. Lavandería, sauna, fogones, jardín central y bodega náutica están documentados en su brochure, aunque la lista del catálogo sea más corta.

Living Town, Mood y BAUM documentan lavadora incluida; falta la especificación de conexión por modelo, no la existencia de ese equipo. BAUM documenta marco de ventana PVC blanco sin acreditar cristal termopanel. Capitanes documenta SPC y una alternativa porcelanato/gres en baños y terrazas que necesita precisión por modelo. Suecia documenta variantes dúplex con rooftop, sin identificar los modelos ni generalizar el alcance a todo el edificio.

Ninguno de los 11 brochures Leben contiene plantas individuales y superficies desglosadas por modelo. Los rangos generales recuperados se mantienen **sin clasificación**: no son superficie útil, interior, total, terraza, patio ni terreno. Jardines comunes, patios interiores y bodegas e-commerce/náuticas no se convierten en jardín privado, área verde o bodega de la unidad sin respaldo específico.

## Precios Sollahms y referencias externas

Se recuperó una tabla aportada directamente por Sollahms en un adjunto anterior. Conserva prioridad documental sobre campañas externas y no tiene fecha de vigencia declarada. El valor del catálogo archivado se muestra por separado. La diferencia entre dos momentos no demuestra una contradicción simultánea; sí exige ratificar qué precio Sollahms está vigente antes de cualquier incorporación. No se reemplazó ningún precio publicado.

| Proyecto | Sollahms directo histórico UF | Catálogo archivado UF | Fuente Sollahms |
| --- | --- | --- | --- |
| Edificio BAUM | 3843.0 | 2844 | Adjunto, línea 107 |
| INN Puerto Chico | 9415.0 | 9816 | Adjunto, línea 109 |
| Edificio Suecia | 10885.0 | 8247 | Adjunto, línea 110 |
| Capitanes | 8347.0 | 7662 | Adjunto, línea 111 |
| Edificio Argomedo | 4212.0 | 3790 | Adjunto, línea 113 |
| Edificio Mood | 3855.33 | 2750 | Adjunto, línea 114 |
| Edificio Índigo | 9000.1 | 8905 | Adjunto, línea 115 |
| Edificio Santo | 4023.0 | 3756 | Adjunto, línea 117 |
| Edificio Living Town | 3949.0 | 2812 | Adjunto, línea 118 |
| Edificio Bold | 4493.0 | 3521 | Adjunto, línea 119 |

Indi registra UF 2.560 en la verificación archivada y UF 3.827 en el antecedente de importación, sin atribuir ese antecedente al propietario por inferencia. Nórdico registra UF 4.746 únicamente para la unidad 101. Own conserva un precio residual de landing como histórico, sin oferta ni solicitud de precio mientras figure vendido.

## Cobertura de filtros disponible

Los siete archivos avanzados indicados en el encargo están ausentes del checkout, HEAD e historial consultado, y cada lectura directa del archivo en `main` devolvió 404. Se conservan [las dos primeras respuestas](evidencias/main-catalog-facets-404.json) y [las otras cinco](evidencias/main-otros-cinco-404.json). La ausencia se documenta; no se fabrica un `coverage.json` ni se ejecutan generadores.

La implementación disponible de `proyectos.html` usa búsqueda libre, activo, región, comuna, estado comercial, precio máximo y orden. Dormitorios, baños, superficies, amenities y fecha de entrega no tienen filtro específico en esa implementación. Una lista o un rango guardado en una ficha no equivale a cobertura de un filtro. [Resumen completo](RESUMEN-FILTROS-LEBEN.json).

| Dato | Presencia en fuente local | Filtro específico actual | Límite |
| --- | --- | --- | --- |
| precio_desde_uf | 12/13 | Sí | Precio máximo y orden; sin valor el filtro con tope excluye la fila y el orden la deja al final. |
| tipo_propiedad | 0/13 | No implementado | No equivale a tipoActivo. Departamentos debe acreditarse con documentos. |
| tipo_activo_explicito | 0/13 | Sí | El código usa (project.tipoActivo ?? Residencial). Los 13 pasan como Residencial por valor predeterminado, sin campo explícito. |
| dormitorios | 13/13 | No implementado | Rangos textuales del proyecto; no modelos ni oferta de unidades. No existe filtro. |
| banos | 12/13 | No implementado | Indigo y Bold se refieren a una unidad concreta. Nordico solo acredita 1 baño de unidad 101 en fieldEvidence, no en specs.banos. No existe filtro. |
| superficie_util_m2 | 0/13 | No implementado | Nunca usar superficieDesdeM2 como útil. No existe filtro. |
| superficie_total_m2 | 0/13 | No implementado | Nunca usar superficieDesdeM2 como total. No existe filtro. |
| terraza_m2 | 0/13 | No implementado | No existe filtro. Presencia cualitativa no acredita área. |
| jardin_privado_m2 | 0/13 | No implementado | No existe filtro. Jardín interior de área común no es jardín privado. |
| terreno_m2 | 0/13 | No implementado | No confundir terreno del proyecto con terreno privativo por modelo. |
| amenities | 13/13 | No implementado | Listas disponibles y mostradas en fichas; no las consulta el filtro ni la búsqueda libre. |
| entrega | 10/13 | No implementado | Se muestra en tarjeta. No hay filtro específico ni año/semestre estructurado. Incluye Proyecto entregado de Own. |
| estado_comercial | 13/13 | Sí | Filtro exacto por estado del proyecto o etapas. No excluye Vendido al cargar sin filtros. |
| superficie_general_sin_clasificar | 11/13 | No implementado | Rango general de encabezado, sin clasificación útil/interior/total. No es cobertura de las métricas requeridas. |

Los 13 proyectos reciben Residencial por valor predeterminado del código, con **cero campos `tipoActivo` explícitos** en estas filas. Esto es un pendiente de estructuración futura, no una pregunta al propietario sobre un uso residencial ya documentado. Los 12 precios no nulos representan 12 de los 12 proyectos no vendidos del snapshot; no son doce precios comercialmente revalidados. Nórdico tiene un baño documentado para la unidad 101 fuera de `specs.banos`, por lo que no se confunde evidencia cualitativa parcial con cobertura estructurada general.

## Matrices por proyecto

Estas tablas condensan cada proyecto. El [CSV completo](MATRIZ-LEBEN.csv) conserva los 53 campos por proyecto, su categoría, valor, evidencias y faltante. Las solicitudes detalladas figuran debajo de cada tabla y en la plantilla editable. Un campo confirmado no entra en las solicitudes; las precisiones parciales se limitan a lo desconocido.

### Edificio Living Town (`edificio-living-town`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Edificio Living Town; Santiago; Región Metropolitana | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONTRADICTORIO | Eyzaguirre 590  /  Otras direcciones: Eyzaguirre 580 | Nada al propietario; conservar dirección de ficha oficial archivada y discrepancia del brochure. |
| Precio desde | HISTÓRICO | Sollahms: 3949 UF (histórico, s/f). Catálogo archivado: 2812 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Venta en verde | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Sollahms histórico: Septiembre 2027  /  Catálogo sin fecha | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: 1–2  /  Brochure s/f: [1,2]  /  Sollahms histórico: ["1 dormitorio","2 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 1–2 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Brochure s/f: {"desde":31,"hasta":52} / Ficha archivada 2026-10-09: [31.0,52.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Piscina; Gimnasio / Training Zone; Quinchos; Cowork; Lavandería; Áreas verdes comunes | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Cocina equipada; Ventanas termopanel; Pisos; Iluminación interior; Cubiertas de cocina; Conexión para lavadora; Terminaciones adicionales | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 18 / CONTRADICTORIO: 1 / DESCONOCIDO: 24 / HISTÓRICO: 5 / PARCIAL: 5 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-001 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-002 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. |
| L-003 | Amenities sin evidencia | Completar solo: Salón multiuso, Bicicleteros, Juegos infantiles, Terraza panorámica común, Lounge, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-004 | Interiores sin evidencia | Completar solo: Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia). Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. Lavadora incluida ya consta; solo falta precisar conexión/ubicación por modelo. |

### Edificio Mood (`edificio-mood`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Edificio Mood; La Florida; Región Metropolitana | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONTRADICTORIO | Av. Américo Vespucio 6630  /  Otras direcciones: Av. Américo Vespucio 6608 | Nada al propietario; conservar dirección de ficha oficial archivada y discrepancia del brochure. |
| Precio desde | HISTÓRICO | Sollahms: 3855.33 UF (histórico, s/f). Catálogo archivado: 2750 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Entrega inmediata | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Sollahms histórico: Primer semestre 2026  /  Catálogo archivado: Inmediata | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: 1–2  /  Brochure s/f: [1,2]  /  Sollahms histórico: ["1 dormitorio","2 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 1–2 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Ficha archivada 2026-10-09: [30.0,48.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Piscina; Gimnasio / Training Zone; Quinchos; Cowork; Bicicleteros; Lavandería; Terraza panorámica común; Espacios para mascotas | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Cocina equipada; Iluminación interior; Conexión para lavadora | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 16 / CONTRADICTORIO: 1 / DESCONOCIDO: 26 / HISTÓRICO: 5 / PARCIAL: 5 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-005 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-006 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. |
| L-007 | Amenities sin evidencia | Completar solo: Salón multiuso, Áreas verdes comunes, Juegos infantiles, Lounge, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-008 | Interiores sin evidencia | Completar solo: Ventanas termopanel, Pisos, Cubiertas de cocina, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales. Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. Lavadora incluida ya consta; solo falta precisar conexión/ubicación por modelo. |

### Edificio Santo (`edificio-santo`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Edificio Santo; Santiago; Región Metropolitana | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONFIRMADO | Cóndor 1071, esquina San Diego | Nada documentalmente |
| Precio desde | HISTÓRICO | Sollahms: 4023 UF (histórico, s/f). Catálogo archivado: 3756 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Entrega inmediata | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Sollahms histórico: Inmediata  /  Catálogo archivado: Inmediata | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: 2  /  Brochure s/f: ["Studio",1,2]  /  Sollahms histórico: ["2 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 2 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Brochure s/f: {"desde":30,"hasta":50} / Ficha archivada 2026-10-09: [45.0,50.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Gimnasio / Training Zone; Quinchos; Cowork; Bicicleteros; Lavandería | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Ventanas termopanel; Pisos; Cubiertas de cocina | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 15 / DESCONOCIDO: 31 / HISTÓRICO: 3 / PARCIAL: 4 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-009 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-010 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. |
| L-011 | Amenities sin evidencia | Completar solo: Piscina, Salón multiuso, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Lounge, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-012 | Interiores sin evidencia | Completar solo: Cocina equipada, Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales. Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. |

### Edificio BAUM (`edificio-baum`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Edificio BAUM; La Florida; Región Metropolitana | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONFIRMADO | El Canelo 6750 | Nada documentalmente |
| Precio desde | HISTÓRICO | Sollahms: 3843 UF (histórico, s/f). Catálogo archivado: 2844 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Venta en verde | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Sollahms histórico: Primer semestre 2028  /  Catálogo sin fecha | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: 1–2  /  Brochure s/f: [1,2]  /  Sollahms histórico: ["1 dormitorio","2 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 1–2 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Brochure s/f: {"desde":33,"hasta":58} / Ficha archivada 2026-10-09: [33.0,58.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Piscina; Gimnasio / Training Zone; Quinchos; Cowork; Bicicleteros; Lavandería; Áreas verdes comunes; Juegos infantiles; Lounge; Espacios para mascotas | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Cocina equipada; Ventanas termopanel; Pisos; Iluminación interior; Cubiertas de cocina; Conexión para lavadora; Equipamiento tecnológico interior; Terminaciones adicionales | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 22 / DESCONOCIDO: 19 / HISTÓRICO: 5 / PARCIAL: 7 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-013 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-014 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. |
| L-015 | Amenities sin evidencia | Completar solo: Salón multiuso, Terraza panorámica común, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-016 | Interiores sin evidencia | Completar solo: Ventanas termopanel, Pisos, Conexión para lavadora, Terraza / rooftop privado, Jardín / patio privado (presencia). Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. Lavadora incluida ya consta; solo falta precisar conexión/ubicación por modelo. Ventanas PVC blanco ya constan; falta confirmar cristal termopanel. Pisos SPC y gres porcelánico en baños ya constan; precisar pavimento de terrazas. |

### Edificio Suecia (`edificio-suecia`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Edificio Suecia; Providencia; Región Metropolitana | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONTRADICTORIO | Tranquila 2323, esquina Suecia  /  Otras direcciones: Tranquila 2307, Providencia  /  Tranquila 2307 | Nada al propietario; conservar dirección de ficha oficial archivada y discrepancia del brochure. |
| Precio desde | HISTÓRICO | Sollahms: 10885 UF (histórico, s/f). Catálogo archivado: 8247 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Entrega inmediata | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Sollahms histórico: Inmediata  /  Catálogo archivado: Inmediata | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: 2–3  /  Brochure s/f: [2,3]  /  Sollahms histórico: ["2 dormitorios","3 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 2–3 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Ficha archivada 2026-10-09: [74.0,139.0] / Antecedente sin vigencia: 87.38 | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Piscina; Gimnasio / Training Zone; Quinchos; Cowork; Juegos infantiles; Lounge | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Cocina equipada; Ventanas termopanel; Pisos; Cubiertas de cocina; Terraza / rooftop privado | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 16 / CONTRADICTORIO: 1 / DESCONOCIDO: 28 / HISTÓRICO: 3 / PARCIAL: 5 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-017 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-018 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. |
| L-019 | Amenities sin evidencia | Completar solo: Salón multiuso, Bicicleteros, Lavandería, Áreas verdes comunes, Terraza panorámica común, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-020 | Interiores sin evidencia | Completar solo: Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales. Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. Dúplex con rooftop ya consta; falta correspondencia con modelos y alcance privativo. |

### Capitanes (`capitanes`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Capitanes; Providencia; Región Metropolitana | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONTRADICTORIO | Los Capitanes 1447  /  Otras direcciones: Los Capitanes 1445 | Nada al propietario; conservar dirección de ficha oficial archivada y discrepancia del brochure. |
| Precio desde | HISTÓRICO | Sollahms: 8347 UF (histórico, s/f). Catálogo archivado: 7662 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Entrega inmediata | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Sollahms histórico: Inmediata  /  Catálogo archivado: Inmediata | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: 2–3  /  Brochure s/f: [2,3]  /  Sollahms histórico: ["2 dormitorios","3 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 2–3 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Ficha archivada 2026-10-09: [67.0,173.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Piscina; Gimnasio / Training Zone; Quinchos; Salón multiuso; Bicicleteros; Lounge; Seguridad | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Ventanas termopanel; Pisos; Equipamiento tecnológico interior; Terraza / rooftop privado; Terminaciones adicionales | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 17 / CONTRADICTORIO: 1 / DESCONOCIDO: 27 / HISTÓRICO: 3 / PARCIAL: 5 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-021 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-022 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. |
| L-023 | Amenities sin evidencia | Completar solo: Cowork, Lavandería, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Espacios para mascotas, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-024 | Interiores sin evidencia | Completar solo: Cocina equipada, Pisos, Iluminación interior, Cubiertas de cocina, Conexión para lavadora, Jardín / patio privado (presencia). Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. SPC ya consta; precisar material de baños/terrazas ante alternativa porcelanato/gres. |

### Edificio Bold (`edificio-bold`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Edificio Bold; Valdivia; Los Ríos | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONFIRMADO | Chacabuco 637 | Nada documentalmente |
| Precio desde | HISTÓRICO | Sollahms: 4493 UF (histórico, s/f). Catálogo archivado: 3521 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Entrega inmediata | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Sollahms histórico: Junio 2026  /  Catálogo archivado: Inmediata | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: ["1 dormitorio","2 dormitorios"]  /  Brochure s/f: [1,2]  /  Sollahms histórico: ["1 dormitorio","2 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 1 (unidad 204)  /  unidad:204:banos: 1 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Ficha archivada 2026-10-09: [22,64] / Ficha archivada 2026-10-09: [22.0,64.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Gimnasio / Training Zone; Cowork; Bicicleteros; Lavandería; Lounge; Estacionamientos; Bodegas privadas | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Sin especificaciones suficientes | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 14 / DESCONOCIDO: 27 / HISTÓRICO: 5 / PARCIAL: 7 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-025 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-026 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. Ya existen estos antecedentes: Unidad 204. Los números de unidad no se tratarán como códigos de modelo. |
| L-027 | Amenities sin evidencia | Completar solo: Piscina, Quinchos, Salón multiuso, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Espacios para mascotas, Seguridad. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-028 | Interiores sin evidencia | Completar solo: Cocina equipada, Ventanas termopanel, Pisos, Iluminación interior, Cubiertas de cocina, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales. Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. |

### Edificio Argomedo (`edificio-argomedo`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Edificio Argomedo; Santiago; Región Metropolitana | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONTRADICTORIO | Argomedo 382  /  Otras direcciones: Argomedo 380, Santiago Centro | Aclarar si las direcciones son accesos del mismo proyecto y ratificar dirección oficial. |
| Precio desde | HISTÓRICO | Sollahms: 4212 UF (histórico, s/f). Catálogo archivado: 3790 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Entrega inmediata | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Sollahms histórico: Inmediata  /  Catálogo archivado: Inmediata | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: ["2 dormitorios"]  /  Brochure s/f: [1,2]  /  modelo:B:dormitorios: 2  /  modelo:C:dormitorios: 2  /  Sollahms histórico: ["2 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 2  /  modelo:B:banos: 2  /  modelo:C:banos: 2 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Brochure s/f: [32,53] / Ficha archivada 2026-10-09: [32,49] / Ficha archivada 2026-10-09: [32.0,49.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Gimnasio / Training Zone; Quinchos; Cowork; Bicicleteros; Lavandería | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Cocina equipada; Ventanas termopanel; Cubiertas de cocina | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 14 / CONTRADICTORIO: 1 / DESCONOCIDO: 28 / HISTÓRICO: 3 / PARCIAL: 7 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-029 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-030 | Dirección | Aclarar las dos direcciones documentadas, señalar si son accesos del mismo proyecto y ratificar la dirección oficial. No reenviar brochure existente. |
| L-031 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. Ya existen estos antecedentes: B, C. Los números de unidad no se tratarán como códigos de modelo. |
| L-032 | Amenities sin evidencia | Completar solo: Piscina, Salón multiuso, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Lounge, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-033 | Interiores sin evidencia | Completar solo: Pisos, Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales. Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. |

### Edificio Indi (`edificio-indi`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Edificio Indi; Independencia; Región Metropolitana | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONTRADICTORIO | Vallenar 2070, esquina Hipódromo  /  Otras direcciones: Hipódromo 1816, Independencia | Aclarar si las direcciones son accesos del mismo proyecto y ratificar dirección oficial. |
| Precio desde | HISTÓRICO | Catálogo archivado: 2560 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Entrega inmediata | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Catálogo archivado: Inmediata | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: ["1 dormitorio","2 dormitorios"]  /  Brochure s/f: [1,2] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 1–2 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Brochure s/f: [31,57] / Ficha archivada 2026-10-09: [31.0,57.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Piscina; Gimnasio / Training Zone; Quinchos; Cowork; Bicicleteros; Lavandería; Juegos infantiles; Terraza panorámica común; Lounge | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Cocina equipada; Ventanas termopanel; Pisos; Cubiertas de cocina | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 19 / CONTRADICTORIO: 1 / DESCONOCIDO: 26 / HISTÓRICO: 3 / PARCIAL: 4 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-034 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-035 | Dirección | Aclarar las dos direcciones documentadas, señalar si son accesos del mismo proyecto y ratificar la dirección oficial. No reenviar brochure existente. |
| L-036 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. |
| L-037 | Amenities sin evidencia | Completar solo: Salón multiuso, Áreas verdes comunes, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-038 | Interiores sin evidencia | Completar solo: Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales. Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. |

### Edificio Índigo (`edificio-indigo`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Edificio Índigo; Puerto Varas; Los Lagos | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONFIRMADO | Imperial 645 | Nada documentalmente |
| Precio desde | HISTÓRICO | Sollahms: 9000.1 UF (histórico, s/f). Catálogo archivado: 8905 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Entrega inmediata | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Sollahms histórico: Inmediata  /  Catálogo archivado: Inmediata | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: ["2 dormitorios","3 dormitorios"]  /  Brochure s/f: [1,2,3,5]  /  Sollahms histórico: ["2 dormitorios","3 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 2 (unidad 311)  /  unidad:311:banos: 2 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Brochure s/f: [37,135] / Ficha archivada 2026-10-09: [68,106] / Ficha archivada 2026-10-09: [68.0,106.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Piscina; Gimnasio / Training Zone; Quinchos; Lounge | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Cocina equipada; Ventanas termopanel; Pisos; Cubiertas de cocina | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 15 / DESCONOCIDO: 28 / HISTÓRICO: 3 / PARCIAL: 7 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-039 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-040 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. Ya existen estos antecedentes: Unidad 311. Los números de unidad no se tratarán como códigos de modelo. |
| L-041 | Amenities sin evidencia | Completar solo: Salón multiuso, Cowork, Bicicleteros, Lavandería, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-042 | Interiores sin evidencia | Completar solo: Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales. Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. |

### INN Puerto Chico (`inn-puerto-chico`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | INN Puerto Chico; Puerto Varas; Los Lagos | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONFIRMADO | Vicente Pérez Rosales 991 | Nada documentalmente |
| Precio desde | HISTÓRICO | Sollahms: 9415 UF (histórico, s/f). Catálogo archivado: 9816 UF (2026-10-09). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Venta en verde | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Sollahms histórico: Diciembre 2026  /  Catálogo archivado: Primer semestre 2027 | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: ["2 dormitorios","3 dormitorios","4 dormitorios"]  /  Brochure s/f: 2 a 5  /  Sollahms histórico: ["2 dormitorios","3 dormitorios","4 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 2–4 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Brochure s/f: [78,242] / Antecedente sin vigencia: 78 | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Piscina; Gimnasio / Training Zone; Quinchos; Lavandería; Áreas verdes comunes; Lounge | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Cocina equipada; Ventanas termopanel; Pisos; Jardín / patio privado (presencia); Terminaciones adicionales | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 18 / DESCONOCIDO: 25 / HISTÓRICO: 5 / PARCIAL: 4 / CONTRADICTORIO: 1 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-043 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-044 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. |
| L-045 | Amenities sin evidencia | Completar solo: Salón multiuso, Cowork, Bicicleteros, Juegos infantiles, Terraza panorámica común, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-046 | Interiores sin evidencia | Completar solo: Iluminación interior, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado. Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. Iluminación pendiente se refiere a unidades/equipos; luz natural de pasillos ya documentada. |
| L-047 | Terminación contradictoria | Confirmar material de cubierta de cocina y modelos/versión a que aplica: cuarzo (brochure p.4 y antecedente Sollahms) frente a ultracompacto travertino (ficha oficial archivada 09/10/2026). Mantener ambas evidencias hasta conciliación. |

### Edificio Nórdico (`edificio-nordico`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Edificio Nórdico; Puerto Varas; Los Lagos | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONFIRMADO | Del Rosario esquina Mirador | Nada documentalmente |
| Precio desde | HISTÓRICO | Catálogo archivado: 4746 UF (2026-10-13). | Ratificar precio Sollahms vigente, unidad de referencia, fecha y condiciones; conservar prioridad del valor directo sin asumir vigencia. |
| Estado comercial | HISTÓRICO | Venta en blanco | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | DESCONOCIDO | Catálogo sin fecha | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-13: ["1 dormitorio","2 dormitorios","3 dormitorios"]  /  unidad:101:dormitorios: 1 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | unidad:101:banos: 1 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Ficha archivada 2026-10-13: [42,120] / Ficha archivada 2026-10-13: [42.0,120.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Piscina; Gimnasio / Training Zone; Quinchos; Bicicleteros | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Sin especificaciones suficientes | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 11 / DESCONOCIDO: 32 / HISTÓRICO: 2 / PARCIAL: 8 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-048 | Vigencia comercial | Ratificar el precio desde Sollahms vigente y su unidad de referencia, estado comercial y entrega. Añadir fecha/vigencia y condiciones (incluye/excluye bodega y estacionamiento). Informar precios por modelo solo donde existan. Si la entrega tiene fecha calendario, indicar año/semestre; en otro caso declarar la categoría aplicable. |
| L-049 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. Ya existen estos antecedentes: Unidad 101. Los números de unidad no se tratarán como códigos de modelo. |
| L-050 | Amenities sin evidencia | Completar solo: Salón multiuso, Cowork, Lavandería, Áreas verdes comunes, Juegos infantiles, Terraza panorámica común, Lounge, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-051 | Interiores sin evidencia | Completar solo: Cocina equipada, Ventanas termopanel, Pisos, Iluminación interior, Cubiertas de cocina, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales. Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. |

### Own (`own`)

| Campo | Estado | Información encontrada | Qué falta |
| --- | --- | --- | --- |
| Identificación | CONFIRMADO | Own; Ñuñoa; Región Metropolitana | Nada en nombre, slug, inmobiliaria, región y comuna |
| Dirección | CONFIRMADO | San Eugenio 567 | Nada documentalmente |
| Precio desde | NO APLICA | Catálogo sin precio; Own figura vendido. | No pedir precio mientras conserve estado vendido. |
| Estado comercial | HISTÓRICO | Vendido | Ratificar estado a la fecha de respuesta. Para Own confirmar si continúa vendido; no presuponer reapertura. |
| Fecha o categoría de entrega | HISTÓRICO | Catálogo archivado: Proyecto entregado | Ratificar categoría/fecha de entrega y, cuando exista cronograma calendario, año y semestre. No convertir «Inmediata» en fecha. |
| Dormitorios | PARCIAL | Ficha archivada 2026-10-09: ["1 dormitorio","2 dormitorios"] | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Baños | PARCIAL | Ficha archivada 2026-10-09: 1–2 | Asociar cantidades a modelo/etapa; completar únicamente asociaciones faltantes. Rango de proyecto y baño de una unidad no definen todos los modelos. |
| Superficie general sin clasificación | PARCIAL | Ficha archivada 2026-10-09: [47,55] / Ficha archivada 2026-10-09: [47.0,55.0] | Definir métrica y alcance del rango; INN 78–242 m² incluye patio/jardín. No sumar ni asignar a útil/total. |
| Modelos y seis superficies | PARCIAL / DESCONOCIDO | Asociaciones parciales conservadas; seis métricas sin desglose por modelo. | Tabla por modelo, etapa y métrica; ver solicitud de modelos. |
| Amenities documentados | CONFIRMADO | Piscina; Gimnasio / Training Zone; Quinchos; Bicicleteros; Lavandería; Terraza panorámica común; Lounge | No repetirlos; completar exclusivamente la lista desconocida de la solicitud. |
| Interiores documentados | CONFIRMADO / PARCIAL | Sin especificaciones suficientes | Solo faltantes o precisiones de las solicitudes. |
| Conteo de campos | CONFIRMADO: 14 / DESCONOCIDO: 31 / NO APLICA: 2 / PARCIAL: 4 / HISTÓRICO: 2 | 53 combinaciones proyecto/campo |  |

| Solicitud | Grupo | Dato que debe aportar el propietario |
| --- | --- | --- |
| L-052 | Vigencia comercial | Confirmar si Own continúa vendido/proyecto entregado. Mientras mantenga esa condición no se solicita precio, stock ni oferta comercial; cualquier reapertura necesita respaldo explícito. |
| L-053 | Modelos y superficies | Completar una tabla por modelo: nombre/código, etapa o edificio, tipo de propiedad, dormitorios y baños; superficies útil, interior, total, terraza, patio/jardín privado y terreno, cada una en m² y con su etiqueta original. Indicar NO APLICA cuando corresponda. Precisar si hay una única etapa. No repetir asociaciones ya acreditadas ni reclasificar el rango general sin respaldo. |
| L-054 | Amenities sin evidencia | Completar solo: Salón multiuso, Cowork, Áreas verdes comunes, Juegos infantiles, Espacios para mascotas, Seguridad, Estacionamientos, Bodegas privadas. Marcar Sí, No o NO APLICA y alcance/etapa. Se conservarán los amenities documentados; bodega e-commerce/náutica no equivale a bodega privada. |
| L-055 | Interiores sin evidencia | Completar solo: Cocina equipada, Ventanas termopanel, Pisos, Iluminación interior, Cubiertas de cocina, Conexión para lavadora, Equipamiento tecnológico interior, Terraza / rooftop privado, Jardín / patio privado (presencia), Terminaciones adicionales. Indicar especificación y alcance por modelo, o NO APLICA. No volver a enumerar características ya documentadas. |

## Contradicciones y conciliación

[Detalle de diferencias documentales, criterios y acciones](CONTRADICCIONES.md). Cuatro diferencias de dirección conservan el criterio de la ficha oficial archivada y no se convierten en una nueva solicitud. Las tres conciliaciones requeridas dentro de Leben son los accesos/direcciones de Argomedo e Indi y el material de cubierta de cocina de INN. Parque Germania se conserva como ESEPE en la matriz de auditoría, junto con la etiqueta original Leben para trazabilidad; el catálogo fuente permanece intacto.

## Estado global y siguiente paso

La matriz maestra conserva 131 proyectos: **13 con pendientes entregados en esta conversación y 118 pendientes de auditoría**. Los otros proyectos no se califican como completos. No se abrió Euro ni otra inmobiliaria. No hay comunicaciones enviadas a terceros; entregar al propietario significa que la matriz y la plantilla están disponibles en este chat.

El siguiente paso es recibir respuestas Leben, comprobar fuentes y vigencia, conciliar cada discrepancia y marcar únicamente los registros validados como datos recibidos/conciliados/listos para incorporación. No autoriza modificar filtros, fichas o precios. La incorporación requerirá la fase posterior y autorización indicada en el encargo. [Prompt de continuidad](../continuidad/NEXT-PROMPT.md).

## Protección y verificación

No se ejecutaron generadores de aplicación, builds, formularios, integraciones, deployments, pushes ni operaciones de publicación/fusión de PR. Se verifican hashes antes/después de HTML, datos, API, librerías, scripts, runtime y configuración del checkout original. Esta copia solo contiene cinco archivos API locales; no se presenta como verificación de las siete funciones de producción. Ninguna función fue invocada o modificada. [Recibo de integridad y validación](evidencias/VERIFICACION.json).

La plantilla se verificó mediante lectura del XLSX guardado: las celdas fuente conservan sus valores y solo las respuestas quedan desbloqueadas. Se revisaron visualmente las tres hojas. La auditoría no ejecuta pruebas de aplicación porque no cambia su código; la validación comprueba identidades, filas, categorías, evidencias, páginas, hashes, correspondencia CSV/Excel y protección de respuestas.
