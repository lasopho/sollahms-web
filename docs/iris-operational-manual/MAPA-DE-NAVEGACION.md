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
7. Revisar **Archivos** si el control está visible. Puede ofrecer impresión, brochure o condiciones; las opciones y su disponibilidad difieren entre fichas. Nórdico solo ofreció impresión y Living Town tenía el control oculto. El historial conserva las opciones verificadas, sin ejecutar impresiones ni leer condiciones.

Las ubicaciones exactas de los campos están en [Ubicación de datos](UBICACION-DE-DATOS.md); las fichas encontradas y las búsquedas sin coincidencia exacta están en el historial.

Para reutilizar el módulo, seguir [Procedimientos de extracción](PROCEDIMIENTOS-DE-EXTRACCION.md), contrastar [Estructura de fichas](ESTRUCTURA-DE-FICHAS.md) y [Limitaciones y excepciones](LIMITACIONES-Y-EXCEPCIONES.md), y comenzar la siguiente sesión desde [NEXT-PROMPT](NEXT-PROMPT.md). Actualizar el historial y la fecha de verificación cuando una nueva consulta cambie el procedimiento o descubra una excepción.
