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
