# Ubicación de datos

Fecha de referencia: **2026-11-16**. Extraer únicamente los campos necesarios; no guardar el texto completo de la página.

| Dato | Ubicación observada | Cómo registrarlo |
| --- | --- | --- |
| Identidad | Nombre principal de la ficha y nombre de la tarjeta de resultado | Conservar nombre literal, URL real e inmobiliaria identificada. La identificación de Leben se corroboró por la ficha, sin filtro de inmobiliaria. |
| Comuna y dirección | **Ubicación** | Referencia para identificar el proyecto. Una diferencia no autoriza reemplazar la dirección Sollahms. |
| Descripción y terminaciones | **Descripción**, control **Más** | Conservar afirmaciones expresas y su alcance. Texto promocional no demuestra una terminación concreta. |
| Amenities | **Amenities** | Evidencia de presencia documental en Iris. Su silencio no demuestra ausencia física. Aplicar por separado la política vigente de brochure de la auditoría. |
| Entrega | **Características > Entrega** | Fecha o texto literal, con fecha de consulta. No deducirla desde Estado. |
| Pisos | **Características > Pisos** | Número o rótulo literal; piso no equivale a etapa o torre. |
| Identificador de unidad | **Unidades en Venta**, tabla y modal | Separar unidad, piso y modelo. Un número de unidad no es código de modelo. |
| Modelo o tipo | Modal de unidad, **Descripción**; rótulo del gráfico adjunto | Mantener ambas fuentes. No convertir una descripción comercial en equivalencia de códigos si el gráfico difiere. |
| Dormitorios y baños | Tabla/modal y rótulo gráfico | Registrar cada fuente por separado ante discrepancias. **Estudio**, falta de dormitorios y **0 baños** requieren contexto de tipo de propiedad. |
| Área publicada en UI | Modal: rótulos **Internos** y **Terraza** | Conservar etiqueta y valor originales. **Internos** no se transforma automáticamente en útil ni interior. |
| Superficies documentales | Cuadro de superficies del plano, cuando existe | Separar útil, interior, total, terraza, patio/jardín y terreno. Conservar logia y rooftop como categorías adicionales si se imprimen. No sumar ni sustituir categorías. |
| Alcance del plano | Texto de modelo y departamentos indicados en el gráfico | Guardar rango o unidades literales. El vínculo de imagen en la UI no elimina una contradicción de alcance impreso. |
| Precio Iris | Importe de unidad/modal; lista y final solo cuando estén rotulados | Referencia complementaria, con fecha y unidad. No confirma precio Sollahms vigente. No asumir inclusión de estacionamiento o bodega desde importes en la descripción. |
| Plantas generales | **Pisos o plantas** | Diferenciar inventario de títulos, apertura de imagen y lectura gráfica efectiva. Los títulos inventariados no significan gráficos inspeccionados. |
| Documentos adicionales | Botón **Archivos**, cuando esté disponible | Las opciones varían: impresión, brochure o condiciones; Nórdico solo ofreció impresión y Living Town pudo abrirse mediante el botón, aunque su span estaba oculto. Confirmar cada ficha y consultar el historial; una opción observada no implica documento leído. |

En la implementación observada, las unidades de venta se distinguían mediante `.units-table.units`; había otras tablas para estacionamientos y bodegas. Al abrir una fila, el modal contenía tarjetas `.carousel-item`, con una tarjeta `.active`. Estos selectores son ayudas de la sesión de referencia, no un contrato de la interfaz.

## Formatos y comprobación de correspondencia

| Familia | Presentación y formato verificados | Distinción y comprobación |
| --- | --- | --- |
| Identidad y ubicación | Encabezado `Leben - …`; sección Ubicación con calle, comuna y región como texto | Comparar nombre completo, inmobiliaria y comuna antes de registrar la URL. Indi e Índigo requieren fichas distintas. No corregir la dirección Sollahms desde esta referencia. |
| Modelo, unidad y piso | Descripción `Modelo D`, rótulo `Unidad 221 · Piso 2`; código también impreso en imagen | Registrar tres campos separados y confrontar el código de la descripción con el gráfico enlazado. Una discrepancia se conserva, no se corrige por el nombre del archivo. |
| Dormitorios y baños | Textos `1 dormitorio`, `2 Dormitorios`, `1 baño`, `2 baños`; gráficos como `1D+1B` o `1,5D+2B` | Mantener decimales literales del gráfico y las dos fuentes ante conflicto. No convertir Estudio en un dormitorio ni mezclar locales con departamentos. |
| Superficies | UI `34.14m² Internos · 0m² Terraza`; tablas gráficas con punto o coma decimal y rótulos propios | Extraer cada nodo por separado; conservar número, unidad y rótulo. Confirmar modelo y alcance de departamentos escritos en ese plano antes de asociar una métrica. Cero y campo no publicado son distintos. |
| Equipamiento e interiores | Etiquetas de Amenities, frases de Descripción expandida y rótulos de planos | Distinguir equipamiento común, terraza/patio privado y entorno público. Una cocina dibujada no confirma materiales ni artefactos sin texto explícito. |
| Entrega y estado | `Inmediata`, `septiembre 2027`, `1er Semestre 2028` en Características | Conservar categoría/fecha y consulta. Inmediata no informa año/semestre ni equivale a una ratificación contractual o de stock. No inferir NO APLICA por omisión. |
| Precios | Texto UF con separadores locales; tabla diferencia lista y final; modal muestra importe de unidad | Conservar el tipo de precio si está rotulado. Si no lo está, registrar importe literal sin llamarlo lista/final. Vincular unidad y fecha; no convertirlo en precio propio Sollahms ni deducir inclusiones. |
| Imágenes y documentos | Imágenes de planos en modal y galería; opciones de Archivos sin enlace DOM en cuatro fichas | Conservar URL observada y hash. Nombre de archivo o extensión no demuestra código, alcance ni formato. Registrar exportación fallida y fuente no inspeccionada por separado. |

Para todos los campos, conservar la misma URL de ficha y fecha de consulta junto con unidad/modelo/torre cuando se conozcan. Si solo se conoce el proyecto, dejar esos identificadores sin determinar; no completarlos por proximidad visual.

No conservar importes ni porcentajes de comisión, atribuciones comerciales de intermediarios ni datos de autenticación. Revisar las capturas y exportaciones antes de incorporarlas al expediente.

## Plantilla técnica: fuente ya aprovechada en fase 3

Archivos contiene una plantilla imprimible en el DOM. Se localizaron sus h3 Características, Amenities, Descripción y Ubicación y se leyó únicamente el siguiente hermano de cada uno. Las tablas conservan Internos sin nueva clasificación. Sus textos repiten la evidencia previa y pueden omitir algunos amenities: no interpretar esa diferencia como ausencia. No volver a revisar las doce plantillas sin un cambio verificable.
