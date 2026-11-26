# Filtros privados por comuna y región

La solicitud agrega búsqueda por comuna o región en Metadatos. El inventario incorpora Región junto al selector de Comuna existente. Planes de pago recibe ambos selectores. Cada región limita las comunas disponibles; cambiar a otra región limpia una comuna incompatible. Los filtros se combinan con texto, estado y demás controles existentes.

El texto busca nombre, comuna, región e inmobiliaria sin distinguir acentos. Las dos etiquetas originales de Metropolitana se presentan como una opción; no se infiere ninguna región por la comuna ni se reescriben los datos fuente. El inventario tiene 152 proyectos y todas sus regiones están informadas. Los proyectos sin geografía de una futura consulta se conservan al mostrar todos.

La API de planes incorpora la región del inventario conocido, mediante el identificador validado del proyecto. Un valor de región en una importación comercial no puede sustituirla. No se modifica el dataset privado almacenado ni se consulta un proveedor geográfico. Los filtros se ejecutan en el dispositivo, sin persistencia ni envío de selecciones al servidor.

Si un proyecto sigue visible, Planes conserva su unidad y escenario. Si sale del conjunto filtrado, se limpian sus referencias y resultados para no presentar un cálculo asociado a un proyecto oculto. Limpiar filtros restaura el conjunto y la recarga conserva selecciones válidas.

Se mantienen la ruta /metadatos, el acceso por la cuenta corporativa autorizada, cookies, permisos, cálculos y descargas. Sólo los selectores de comuna/región del inventario ocupan todo el ancho en móvil para evitar recortes de sus nombres. El baseline es dpl_5BHLEQkXuY1p3GYQVQzzbcTHpHg6, fuente fb0ada2dbcda1d3812fd15fb56361494d707208c, 1741 archivos y ocho funciones. Sólo se permite modificar el bundle privado y cuatro archivos UI. Todos los estáticos públicos, otras funciones y configuración de rutas permanecen idénticos.

La ampliación está comprendida en la autorización original de desarrollar, probar y publicar el panel privado con autenticación real, y en esta petición de filtros geográficos. No se fusiona a main ni a otra rama. No cambia la estrategia SEO/GEO ni la navegación, sitemap o datos comerciales públicos.

La validación comprende seguridad y procedencia de región, prueba del paquete compilado, QA sintética de cascadas/combinaciones/limpieza/recarga y vistas móviles. La publicación usa un candidato aislado y promueve el mismo artefacto después de comparar todos los archivos y cinco alias; se comprueba después con la sesión real y lecturas anónimas.
