# Fichas comerciales adaptables de Sollahms

Las 131 fichas activas comparten cinco secciones esenciales en orden relativo:
Resumen, Características, Galería, Ubicación y Cotización. El menú conserva la
identidad del sitio, permanece fijo al desplazarse, identifica la sección activa
y se desplaza horizontalmente en móvil. Los enlaces funcionan sin JavaScript.

Las secciones adicionales dependen del contenido: 38 fichas tienen Planos,
16 tienen Tipologías comparables, 49 conservan Galería y 360° y 11 incorporan
Entorno documentado. Los modelos generales se conservan; la ficha pública de
Plaza Las Condes deja de mostrar las unidades 213/313. El formulario permite
indicar una unidad conocida como interés opcional, sin afirmar disponibilidad.

## Contenido incorporado

Se completaron 11 fichas: Curicó 77, Domeyko 2055, Jofré 135, Mirador La Florida,
San Ignacio, Angamos, Jardines de Ramón Cruz, Condominio Parque Don Lautaro,
Condominio Uruguay, Gregorio de la Fuente A y Bcome.

Se incorporan 74 menciones de equipamiento, 68 terminaciones, descripciones,
tipologías, arquitectura y conectividad respaldadas por los registros de
brochures. Se recuperan 72 planos: 36 de Sento y 36 de León. Cada plano se puede
ampliar; conserva las superficies revisadas y las advertencias particulares.
No se usan los antiguos precios comerciales de esos brochures. Las imágenes
se sirven en su calidad original; no se regeneraron ni retocaron.

El sistema SVG anterior se conserva y añade dos dibujos: muro/revestimientos
y reciclaje. Los nuevos nombres se mapean al mismo catálogo, con viewBox 24,
trazo 1,5 y extremos redondeados. No se añaden librerías de iconos.

Los 93 precios informados permanecen intactos. Los 38 pendientes se muestran
como «Desde: consultar precio» en ficha, tarjetas, listado, mapa y directorio
sin JavaScript. La portada conserva sus precios. El formulario recibe el
proyecto, inmobiliaria y precio desde como referencia, aclarando que no es el
precio definitivo de una unidad. Las selecciones previas de tipología siguen
en el mensaje; se preservan los límites, validación, consentimiento y destino.

Hay 14 fichas con equipamiento pendiente de respaldo. Sus características
reales siguen presentes. Ferroparque conserva la distinción entre etapas:
el brochure del conjunto no basta para asignar servicios a una etapa concreta.
No se infieren amenities de fotos ni se trasladan entre proyectos.

## Archivos centrales

- `scripts/project_navigation.py`: estructura, enlaces y detección de secciones.
- `assets/css/project-navigation.css`: navegación, anclas y planos recuperados.
- `assets/js/project-navigation.mjs`: indicador activo y desplazamiento móvil.
- `data/project-content-additions.json`: datos documentados por proyecto con
  referencias a sus fuentes; no contiene precios que sustituyan el catálogo.
- `scripts/build-reviewed-project-plans.py`: usa `sento-review.json` y el registro
  revisado de superficies de León; no recupera superficies históricas descartadas.
- `scripts/project_amenities.py`, `data/amenities.json` y
  `assets/css/project-amenities.css`: componente único de características.
- `assets/js/catalog-model.mjs`: precio desde compartido por las vistas del catálogo.
- `assets/js/project-request.mjs` y `assets/js/plaza-las-condes.mjs`: contexto de
  cotización, sin cambiar API, destino ni campos obligatorios.

## Mantenimiento

El render final sigue este orden: estructura existente y cabecera B → overrides
del proyecto → amenities → navegación adaptable → política de rótulos de imágenes.
`project_header_b.py`, los overrides Plaza/Nollagam y el importador Maestra
consumen el componente. Los generadores de Sento y León pasan por la cabecera común.

1. Registrar contenido real y su procedencia en los datos del proyecto.
2. Para nuevos amenities, registrar el nombre y un icono del catálogo central.
3. Para planos recuperados, ejecutar `python scripts/build-reviewed-project-plans.py`.
4. Ejecutar `python scripts/project_navigation.py` y su variante `--check`.
5. Ejecutar `python tests/project-navigation.py`, `python tests/amenities.py`
   y las pruebas Node de navegación, catálogo, cotización, Plaza y Nollagam.
6. Revisar tamaños de escritorio/tablet/móvil y publicar por superposición sobre
   el manifiesto congelado de esta carpeta; no reconstruir funciones históricas.

## Verificación y límites

`audit.json` y `fichas-revisadas.md` enumeran las 131 fichas y los 38 precios
pendientes. El cotejo conserva todas las imágenes anteriores de galería/cabecera,
iframes, encabezados, pies y formularios (salvo el campo opcional de Plaza).
Todos los enlaces internos se resuelven. Catálogo, precios del propietario,
mapas, parallax, degradados, zoom y código de desvanecimientos no se alteran.

Se revisaron 70 URLs únicas de recorridos en 49 fichas. Se conserva su procedencia
documentada y los enlaces alternativos. La extracción web no puede verificar
interactivamente todos los proveedores; no equivale a una prueba funcional de
cada escena. `tour-provider-check.json` registra esas limitaciones y la revisión
visual de la publicación se documenta por separado.

Las pruebas de formularios usan transporte simulado y datos sintéticos; no
envían leads ni mensajes reales. El paquete conserva las funciones existentes,
las protecciones, la sincronización de siete registros Nollagam y HTTP 410 de
Patio Brasil. `release.json` registra los despliegues y su hash final.

- [Todas las fichas y pendientes](fichas-revisadas.md)
- [Auditoría estructural y preservación](audit.json)
- [Auditoría documental de contenido](content-audit.json)
- [Planos y hashes](plan-assets.json)
- [Comprobaciones de proveedores 360°](tour-provider-check.json)

## Publicación verificada

Publicado en https://sollahms.cl el 29 de octubre de 2026. Producción y vista previa
comparten el artefacto `3e2acc13247c5107a4fddbdfa3789c9349e12c4edac6df7a7271637de389702f`,
con 1.434 archivos verificados. Se aprobaron 4 pruebas de estructura, 6 de
amenities y 42 pruebas Node; el cotejo estático cubre las 131 fichas.

La revisión visual cubre 320, 390, 768 y 1440 px, ocho fichas representativas,
menú activo, desplazamiento horizontal, apertura de planos de León, selección
opcional de unidad en Plaza y los cuatro campos en modo llamada. Tarjetas,
listado y mapa conservan «Desde: consultar precio» en el mismo proyecto.
Los cuatro proveedores que rechazaron la extracción web mostraron su interfaz
en el navegador; no se afirma haber recorrido todas sus escenas.

Se cotejaron cinco HTML públicos, catálogo y datos contra el paquete exacto.
Patio Brasil continúa respondiendo HTTP 410. No se enviaron solicitudes reales.

- [Verificación responsive e interacciones](responsive.json)
- [Registro de publicación](release.json)
- [Captura pública en escritorio](public-curico-desktop.jpg)
- [Captura pública en móvil](public-curico-mobile.jpg)
