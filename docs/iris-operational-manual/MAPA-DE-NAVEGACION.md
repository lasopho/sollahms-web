# Mapa de navegación de Iris Yapo

Verificado el **16 de noviembre de 2026**, en Chrome con sesión iniciada personalmente por el propietario. Describe la interfaz observada; los controles pueden cambiar.

## Entrada y búsqueda

- Dominio consultado: `https://iris.yapo.cl`.
- Catálogo observado: [Proyectos, estados iniciales 1/2/3](https://iris.yapo.cl/proyectos?country=7&state=1%2C2%2C3&order=promos%2Cpopularity).
- Buscador: **Buscar por nombre de proyecto o zona**. Escribir el nombre y pulsar **Enter**. Comprobar la URL y los resultados después de actualizarse la pantalla.
- Ejemplo real: [búsqueda Living Town](https://iris.yapo.cl/proyectos?country=7&state=1%2C2%2C3&order=promos%2Cpopularity&search=Living+Town).
- Abrir el enlace de la tarjeta encontrada. Las fichas observadas siguen `/proyecto/{id}?operation=Venta`; el ID debe proceder del enlace real, nunca deducirse.
- Una primera lectura vacía durante la carga de la aplicación no prueba que falten resultados. Esperar una señal positiva de carga, como el nombre de la ficha o sus secciones, y volver a leer.

## Panel Filtrar

Se abre desde el icono de deslizadores. Se observaron **Tipo de Propiedad, Precios, Estado, Dormitorios, Baños, Amenities, Nombre de Proyecto, Fecha de entrega, Sujeto a subsidio y Bono Pie**. No se observó un selector de inmobiliaria en ese panel.

| Estado visible | Valor observado | Selección inicial observada |
| --- | --- | --- |
| En recepción final | 1 | Sí |
| En verde | 2 | Sí |
| En blanco | 3 | Sí |
| Usado | 4 | No |

No se observó **Vendido** entre esas opciones. Estado no permite inferir disponibilidad Sollahms ni recuperar por sí solo un proyecto vendido. Las variantes utilizadas para Own están en [Historial de consultas](HISTORIAL-DE-CONSULTAS.md).

## Recorrido de la ficha

1. Corroborar nombre del proyecto e identificación de Leben, comuna y dirección de referencia.
2. Revisar **Descripción** y expandir **Más**, si aparece.
3. Leer **Amenities** y **Características**; separar entrega, pisos y otros rótulos.
4. Revisar **Unidades en Venta** y abrir una fila de unidad para acceder al modal.
5. Registrar descripción de modelo, dormitorios, baños, superficies con sus etiquetas y plano adjunto. Distinguir tabla, tarjeta activa y tarjetas DOM no activas.
6. Revisar **Pisos o plantas** y **Ubicación**. Pulsar una cápsula de nivel para abrir el visor gráfico; distinguir títulos, imágenes exportadas y lectura efectiva. Nórdico no presenta esa sección.
7. Revisar **Archivos** si el control está visible. Puede ofrecer impresión, brochure o condiciones; las opciones y su disponibilidad difieren entre fichas. Nórdico solo ofreció impresión y Living Town requiere seleccionar el botón real; su span puede estar oculto. El historial conserva las opciones verificadas, sin ejecutar impresiones ni leer condiciones.

Las ubicaciones exactas de los campos están en [Ubicación de datos](UBICACION-DE-DATOS.md); las fichas encontradas y las búsquedas sin coincidencia exacta están en el historial.

Para reutilizar el módulo, seguir [Procedimientos de extracción](PROCEDIMIENTOS-DE-EXTRACCION.md), contrastar [Estructura de fichas](ESTRUCTURA-DE-FICHAS.md) y [Limitaciones y excepciones](LIMITACIONES-Y-EXCEPCIONES.md), y comenzar la siguiente sesión desde [NEXT-PROMPT](NEXT-PROMPT.md). Actualizar el historial y la fecha de verificación cuando una nueva consulta cambie el procedimiento o descubra una excepción.

## Actualización de fase 3 — 16/11/2026

Las doce plantillas técnicas de Archivos ya están revisadas por secciones permitidas. El control que funcionó en Living Town y las demás fichas es `button.filter-estate.dropdown-toggle`; verificar el selector y su visibilidad en cada sesión. Leer el menú completo o su anchor concatena contenido ajeno al encargo: usar solo encabezados permitidos y su siguiente hermano. No es necesario pulsar Imprimir para examinar la plantilla DOM.

## Actualización de fase 4 — 16/11/2026

La fase4 incorpora una fuente directa del propietario, no una navegación nueva. Antes de volver a Iris, consultar F049 y el corte fase4-20261116. Los precios declarados se aceptan sin exigir una segunda fuente. No se repiten brochures, gráficos, plantillas o PDF fallados.

El corte activo está en [INFORME-FASE4-LEBEN.md](../catalog-data-completeness-20261116/leben/INFORME-FASE4-LEBEN.md) y su carpeta fase4-20261116. Los números y solicitudes de cortes anteriores de este manual son históricos; usar el siguiente prompt actualizado antes de repetir una exploración.


## Verificación de continuidad global — 17/11/2026

La instrucción vigente permite Euro y las demás inmobiliarias del universo131. Catálogo y catorce fichas consultadas fueron accesibles sin pedir login; no se afirmó que hubiera sesión autenticada. Una ficha pública accesible no sustituye la comprobación tras una autenticación personal cuando ésta sea necesaria. Al pulsar una tarjeta se abrió otra pestaña; recuperar la pestaña por el enlace realmente abierto, sin deducir IDs.

Después de Enter, la URL y el tag de búsqueda pueden actualizarse antes que las tarjetas y el contador. Esperar el resultado definitivo por nombre antes de abrirlo. Caso real: Diagonal pasó del listado previo a1/1; Mapocho3521 terminó2/2, con /311 y /1149 separados. No repetir búsquedas completadas por ese estado transitorio.

Fuente y punto activo: [registro nuevo de Iris](../objetivo-principal-asset-portafolio/REGISTRO-NUEVA-EVIDENCIA-IRIS.json) y [control global](../objetivo-principal-asset-portafolio/CONTROL-DE-AVANCE.md).

## Descubrimiento Chile — 18/11/2026

En la sesión de exploración se seleccionó también **Usado** desde el filtro Estado. Con `country=7` y estados1/2/3/4 el catálogo mostró **158 de158 oportunidades** tras Cargar más, con158IDs/URLs únicos. El contador del listado no equivale a fichas válidas ni candidatos nuevos. Abrir y comprobar cada ficha según [validación de existencia](VALIDACION-DE-EXISTENCIA.md). Registrar sólo campos permitidos del proyecto, sin leer texto completo de tarjetas que concatene comisiones o intermediarios. La comparación con Sollahms y la validación individual son ejes separados.

La validación final del18/11 comprobó158fichas reales, sin exclusiones ni errores finales. Para cabeceras mínimas, delimitar `.detail-container .detail-content`. Un selector global puede incluir recomendaciones: `.tag-hand-over` no estaba dentro del bloque principal en22/22casos; su entrega válida procede del enlace propio del listado, no de esas tarjetas relacionadas.
