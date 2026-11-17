# Procedimientos de extracción

Vigencia documental: **2026-11-16**. Investigación de lectura y exportación documental; no cotizar, reservar, contactar, guardar proyectos, compartir ni modificar información del servicio.

## Autenticación interactiva obligatoria

Si Iris solicita iniciar sesión:

1. Abrir Chrome en la autenticación oficial de Iris que presente el servicio.
2. Detener temporalmente la automatización.
3. Presentar la ventana visible de Chrome al propietario para que ingrese personalmente correo y contraseña.
4. Permitir que complete personalmente OTP, CAPTCHA y verificaciones adicionales.
5. No solicitar, leer, copiar, registrar ni almacenar credenciales en archivos, logs, variables de entorno o repositorios.
6. No automatizar la introducción de contraseñas.
7. Esperar la confirmación del propietario de que completó el acceso; no inspeccionar el formulario durante su intervención.
8. Comprobar el acceso mediante una pantalla posterior de proyectos, sin leer secretos.
9. Reanudar la consulta utilizando esa sesión autorizada.
10. Si caduca, detenerse y volver a solicitar la intervención directa del propietario.

No cerrar sesión ni modificar mecanismos de seguridad. No acceder a cookies, tokens, almacenamiento del navegador, gestores de contraseñas ni estado interno de autenticación. La autenticación ocurre en Chrome visible, bajo control del propietario.

## Consulta por proyecto

Seleccionar el Chrome autorizado de tipo `extension` entre los navegadores disponibles. Los IDs del runtime pueden variar entre agentes o sesiones: no asumir que un número identifica siempre Chrome ni sustituirlo por el navegador interno. Trabajar en pestañas propias y no interferir con la ventana donde el propietario autentica ni con las pestañas de otros investigadores.

En esta sesión el cliente público se cargó desde `/Users/luissandoval/.codex/plugins/cache/openai-bundled/chrome/26.1103.60933/scripts/browser-client.mjs`, mediante su exportación `setupBrowserRuntime()`. La documentación pública estaba en el directorio vecino `docs/`, especialmente `api.json`, `browser-safety.md`, `api-use-behavior.md` y las instrucciones de asignación y limpieza de pestañas. En una sesión nueva, descubrir primero el paquete y las herramientas disponibles y leer sus instrucciones vigentes; la versión y los IDs no son persistentes. No inspeccionar archivos internos ni perfiles de Chrome para recuperar la sesión.

1. Leer el historial existente y los campos pendientes para evitar repetir evidencia ya disponible.
2. Buscar el nombre en el campo observado y pulsar **Enter**. Registrar término, filtros y URL. No confundir coincidencias parciales con una ficha exacta.
3. Abrir el enlace real del resultado. Confirmar nombre, Leben, comuna y dirección de referencia. Conservar discrepancias sin corregir el catálogo.
4. Expandir la descripción y recorrer las secciones relevantes. Registrar por separado **revisada**, **no encontrada** y **no inspeccionada**.
5. Abrir una fila de **Unidades en Venta**. Registrar unidad y piso desde su rótulo; código de modelo desde la descripción; dormitorios, baños y superficies desde sus campos propios.
6. Inventariar las tarjetas DOM que ya renderizó el modal. No presentar las tarjetas no activas como unidades visualmente abiertas. No interpretar el inventario como confirmación de stock.
7. Extraer campos de nodos individuales. El texto concatenado de tarjetas inactivas puede unir precio y superficie sin separador; no obtener números mediante una expresión regular sobre ese texto completo.
8. Examinar todos los gráficos únicos exportados y confrontar código, dormitorios/baños, superficies y alcance impreso con la unidad enlazada.
9. Clasificar cada aporte como confirmado, parcial, contradictorio o no encontrado. Una contradicción se conserva con ambas fuentes; no se resuelve por similitud del plano.

## Exportación de planos y evidencia

Utilizar únicamente las interfaces autorizadas del navegador y lectura de UI/DOM. No consultar directamente endpoints, ejecutar solicitudes HTTP por fuera de la UI, leer estado de frameworks ni recuperar datos ocultos de la aplicación.

Para recursos ya observados en la ficha, la capacidad `pageAssets` permitió **list** y **bundle**: obtener un inventario de la pestaña, seleccionar los IDs cuya URL coincide con el plano observado y exportar esos recursos. No adivinar URLs ni navegar al recurso para sustituir la exportación por una descarga directa. La imagen `np-planes.png` observada es un reemplazo sin plano; no aporta medidas ni modelo.

Guardar bytes originales, URL, URL de la ficha, sección, fecha y SHA-256. Varios recursos con sufijo `.jpg` llegaron como **AVIF**; preservar el original y detectar el formato real. Si hace falta un PNG para lectura, conservarlo como derivado, con su hash y vínculo al original. No sustituir el original por la conversión.

Antes de guardar una captura, verificar que muestra la sección deseada y excluye autenticación y campos comerciales restringidos. Se detectaron capturas de modal que mostraban el fondo de la ficha; se eliminaron y no se usaron como evidencia. Los planos originales exportados y la transcripción acotada del DOM son evidencias distintas de una captura UI válida.

Cada hecho debe conservar valor literal, valor normalizado cuando proceda, etiqueta, modelo/unidad/etapa identificados, fuente, sección o archivo, fecha y límites. Un nulo significa falta de respaldo; no significa cero, ausencia física ni respuesta negativa.

## Abrir plantas generales

La sección **Pisos o plantas** puede mostrar únicamente botones en forma de cápsula con el nombre del nivel. La ausencia de imágenes en el DOM de esa sección no significa que no haya planos. En Living Town se verificó que pulsar la primera cápsula, `.floors .col-auto` en la interfaz observada, abre un modal independiente con las imágenes de los nueve niveles. Allí se leen las leyendas y los `img` de cada tarjeta del carrusel, se exportan las URLs observadas mediante `pageAssets` y se revisa cada gráfico.

Mantener separados esos planos generales y los planos individuales de **Unidades en Venta**. Las plantas pueden mostrar distribución, subterráneos, cubierta o elevaciones sin un cuadro de superficies por modelo. Si la resolución publicada no permite leer un dato, registrar esa limitación; no reconstruir medidas desde el dibujo. No adivinar una URL de mayor resolución.

## Documentos adicionales y límites comprobados en fase 3

Abrir el botón Archivos permite leer la plantilla técnica sin imprimir. Una prueba de Imprimir ficha técnica bloqueó su pestaña propia de Mood y no produjo un PDF exportable; no repetir ese camino ni confirmar una impresión física. Once fichas muestran Imprimir ficha técnica, Descargar brochure y Condiciones comerciales; Nórdico solo ofrece impresión. La lectura anterior que identificó dos rótulos Descargar brochure en Índigo/INN se precisa con la inspección del botón real en fase 3.

Los tres PDF de unidades INN fallaron otra vez mediante pageAssets. El documento adicional de Condiciones comerciales de INN se observó como recurso `other`, cuya exportación fue rechazada. No reclasificarlo como imagen, adivinar otra URL o usar solicitudes externas. Conservar el fallo, la URL exacta y el estado no leído; no declarar inexistencia. Los registros están en el corte fase3-20261116.

## Actualización de fase 4 — 16/11/2026

Para una respuesta del propietario: conservar el original y SHA, normalizar UF como string decimal, registrar cada asociación literal y comparar únicamente su alcance con los pendientes. No exigir Iris para aceptar precios propios. No volver a preguntar datos ya declarados. Una respuesta comercial general no resuelve discrepancias de un modelo particular. No hubo navegación, autenticación ni reintentos PDF en fase4.

El corte activo está en [INFORME-FASE4-LEBEN.md](../catalog-data-completeness-20261116/leben/INFORME-FASE4-LEBEN.md) y su carpeta fase4-20261116. Los números y solicitudes de cortes anteriores de este manual son históricos; usar el siguiente prompt actualizado antes de repetir una exploración.

## Recepción por paquete antes de nueva navegación — fase 5, 16/11/2026

1. Revisar el ledger vigente y el mapeo de paquetes F5-DOC. Comprobar si el dato/documento ya está conservado antes de abrir Iris.
2. Coordinar una entrega por proyecto con extractos o archivos existentes del alcance faltante. Los cuatro anexos INN pertenecen a F5-DOC-11; no son nuevas preguntas por campo.
3. Al recibir un original o respuesta, preservar su archivo, SHA, fecha, fuente, proyecto, unidad/modelo y alcance. Distinguir el documento leído del hecho físico que puede acreditar.
4. Conciliar cada campo contra A/B y su versión. Mantener abierto si no hay aplicabilidad expresa o persiste contradicción; una celda de respuesta no cierra el caso automáticamente.
5. Actualizar solo los campos suficientemente respaldados y registrar el cambio con sus IDs. Abrir Chrome únicamente si existe una fuente nueva concreta accesible mediante la sesión autorizada.

Se mantienen el acceso interactivo del propietario y las prohibiciones de exportación fallida, URLs supuestas y endpoints privados del procedimiento anterior. Esta fase no añadió selectores ni rutas nuevas.

## Recepción verificable de originales — fase 6, 16/11/2026

Antes de abrir Iris, utilizar el [protocolo de recepción y validación](../catalog-data-completeness-20261116/leben/fase6-20261116/PROTOCOLO-RECEPCION-Y-VALIDACION.md). Separa identidad binaria del original, campos potenciales, hechos validados y resolución suficiente por alcance. Los registros vacíos no consumen IDs ni constituyen evidencia. Las transcripciones de mensajes se identifican como tales; los derivados no reemplazan originales.

Un documento duplicado no aporta nuevos hechos por sí mismo. Un mensaje acompañante que precise versión o alcance se conserva y evalúa por separado. La preparación administrativa no reabre F049 ni justifica repetir búsquedas o exportaciones.

## Alcance comercial vigente — 17/11/2026

Usar [INFORME-RECLASIFICACION-CATALOGO](../catalog-data-completeness-20261116/INFORME-RECLASIFICACION-CATALOGO.md) antes de una extracción nueva. Prioridad A para atributos esenciales, B para comparación comercial y C fuera de la obligación. D-03 y los inventarios exhaustivos de códigos/versiones no bloquean el cierre comercial. Reutilizar las cotizaciones F049, entregas y perfiles ya conservados; solicitar únicamente el alcance o métrica esencial aún no respaldados.

No exigir todas las opciones para que una búsqueda por atributos conocidos conserve el proyecto. Para filtros combinados, una misma referencia debe respaldar todos los predicados de opción. Nueve propuestas de false para jardín privado aplican el criterio de brochure completo ya revisado; no implican ausencia física ni cierre canónico.
