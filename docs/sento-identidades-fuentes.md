# Sento: identidad y contraste de fuentes oficiales

Revisión realizada el **13 de octubre de 2026**, zona `America/Santiago`. El detalle estructurado, hashes de HTML/PDF, 50 tarjetas de planos oficiales y verificaciones HTTP están en [`data/sento-official-research.json`](../data/sento-official-research.json). Los PDFs recibidos son la fuente principal de características y planos de los seis proyectos; la web actual prevalece para estado comercial. Angamos utiliza exclusivamente la página oficial y el registro de medios correspondiente.

## Siete desarrollos y siete rutas existentes

| Solicitud / brochure | Ficha existente | Nombre oficial actual | Ruta que se conserva | Decisión |
| --- | --- | --- | --- | --- |
| Curicó 77 | Curicó 77 | Curicó 77 | `curico-77` | Misma ficha. |
| Domeyko 2055 | Domeyko 2055 | Domeyko 2055 | `domeyko-2055` | Misma ficha. |
| Jofré 135 | Jofré 157 | Jofré 157 | `jofre-135` | Alias de brochure documentado, sin segunda ficha. |
| Mirador La Florida | Mirador La Florida | Mirador La Florida | `mirador-la-florida` | Misma ficha. |
| Plaza Las Condes | Plaza Las Condes | Plaza Las Condes 7083 | `plaza-las-condes` | Conservar ficha y documentar acceso Carol Urzúa. |
| San Ignacio 270 | San Ignacio | San Ignacio 280 | `san-ignacio` | Alias 270 documentado, conservar dirección comercial 280. |
| Angamos 205 | Angamos | Angamos 205 | `angamos` | Misma ficha, con nombre descriptivo completo. |

### Jofré 135 / Jofré 157: identidad de alta certeza

La [ficha oficial Jofré 157](https://sento.cl/proyectos/jofre-157/) conserva un iframe Google Maps dirigido a General Jofré **135**. También enlaza un [brochure oficial](https://sento.cl/wp-content/uploads/2023/03/Brochure-Digital-Jofre-enero-13.01.pdf) con las mismas características y cuatro planos del PDF recibido: A1 Estudio 20,77 m²; B27 1D/1B 33,70 m²; C1 2D/1B 40,97 m²; D1 2D/2B 55,33 m².

La comparación de imágenes embebidas aporta evidencia adicional: la fachada de página 2 de ambos brochures tiene exactamente el mismo contenido y SHA-256 `366b9bfac3cbd30a5b77e4bc79ab912338b6744244977f8bcb75f1efdfeab2b5`. Las cuatro imágenes de plano también son idénticas en bytes. Se revisó visualmente el conjunto de imágenes y se verificaron los textos de las páginas pertinentes.

Esta concordancia permite tratar ambas numeraciones como referencias del mismo desarrollo con alta certeza. No se encontró un documento municipal que explique el cambio de numeración; no se afirma una renumeración administrativa formal. Se conserva el nombre público actual Jofré 157, la ruta histórica `jofre-135` y una nota que identifica el brochure como Jofré 135.

La web actual declara el proyecto entregado y **100% vendido**, sin precio. El brochure recibido anuncia venta en blanco y entrega segundo semestre 2026; el brochure descargable de la web anuncia venta en verde y entrega segundo semestre 2025. Esas fechas históricas no deben sustituir el estado publicado hoy. El footer todavía conserva publicidad mayo 2026 y se excluye de promociones vigentes.

### San Ignacio 270 / San Ignacio 280: identidad de alta certeza

La [ficha oficial San Ignacio 280](https://sento.cl/proyectos/sento-san-ignacio-280/) mantiene tanto un iframe de mapa como un enlace de ubicación cuyo destino es Calle San Ignacio de Loyola **270**, aunque el texto visible dice 280. El PDF recibido presenta explícitamente San Ignacio 270. Barrio, equipamiento, terminaciones, tipologías y códigos de plano coinciden: B1 mantiene exactamente 36,70 m².

Las superficies A3 y D1 difieren entre versiones: A3 es 24,18 m² en el brochure y 24,11 m² en web; D1 es 55 m² en brochure y 55,19 m² en web. Estas diferencias se conservan por fuente, sin corregir el plano del brochure ni combinar ambos valores como una misma versión. Se conserva la ficha `san-ignacio`, su nombre actual San Ignacio y dirección comercial 280, dejando identificada la numeración 270 del brochure y del mapa oficial.

La identificación del mismo desarrollo tiene alta certeza por las referencias explícitas cruzadas en el sitio y las coincidencias técnicas. Tampoco existe en las fuentes consultadas una explicación municipal de numeración. El brochure anunciaba entrega segundo semestre 2025; hoy la web informa entrega inmediata.

### Plaza Las Condes: nombre y acceso

La [página Plaza Las Condes 7083](https://sento.cl/proyectos/plaza-las-condes-7083/) identifica el desarrollo por Av. Las Condes 7083, pero su sección de ubicación, sala de ventas y mapa usan Av. General Carol Urzúa **7060**. Se registra como acceso indicado oficialmente del mismo desarrollo, sin crear otra ficha. El listado genérico conserva Estudio/1D/2D; el precio anunciado hoy corresponde a 2D/2B. Los planos documentados no certifican stock.

## Comercial verificado

| Proyecto | Estado publicado | Desde UF | Unidad de referencia | Descuento incluido | Fuente |
| --- | --- | ---: | --- | ---: | --- |
| Curicó 77 | Venta en verde | 2.610 | Estudio 1123 | 20% | [Página oficial](https://sento.cl/proyectos/sento-curico-77/) |
| Domeyko 2055 | Entrega inmediata | 2.322 | Estudio 319 | 14% | [Página oficial](https://sento.cl/proyectos/sento-domeyko-2055/) |
| Jofré 157 | Proyecto entregado; 100% vendido | Sin precio | — | — | [Página oficial](https://sento.cl/proyectos/jofre-157/) |
| Mirador La Florida | Venta en blanco; entrega estimada primer semestre 2029 | 2.074 | Estudio 202 | 22% | [Página oficial](https://sento.cl/proyectos/mirador-la-florida/) |
| Plaza Las Condes | Próxima entrega | 8.858 | 2D/2B 313 | 20% | [Página oficial](https://sento.cl/proyectos/plaza-las-condes-7083/) |
| San Ignacio 280 | Entrega inmediata | 2.141 | Estudio 604 | 18% | [Página oficial](https://sento.cl/proyectos/sento-san-ignacio-280/) |
| Angamos 205 | Entrega inmediata | 2.794 | 1D/1B 516 | 20% | [Página oficial](https://sento.cl/proyectos/angamos-205/) |

Estos seis precios coinciden con el [catálogo oficial actual](https://sento.cl/proyecto/). Las seis páginas con precio declaran publicidad octubre 2026. Los precios son **desde**, excluyen estacionamiento y bodega y están sujetos a disponibilidad y condiciones de cotización. El stock por unidad no fue confirmado independientemente. No se publican promociones antiguas, cuotas ni bonos del PDF como beneficios actuales. Los precios observados en resultados de búsqueda o landing pages históricas no reemplazan el HTML actual verificado.

## Planos, mapas y recorridos

Se registraron 50 tarjetas de planos oficiales con código, URL original, dormitorios y baños declarados, superficie útil, terraza y total. Es información complementaria al plano del brochure; el origen permanece separado. Las tarjetas Estudio de varias páginas muestran también dormitorio 1: esa etiqueta de UI no permite convertir un estudio en departamento de un dormitorio.

Se comprobaron **14 endpoints de visor** y **24 recursos de configuración/JavaScript**, todos HTTP 200. Doce visores y sus 24 recursos se verificaron en esta investigación; los dos visores Angamos constan en `data/sento-angamos.json`. El registro incluye título, URL final, tamaño y recursos comprobados. Esta prueba valida accesibilidad técnica de los enlaces; la revisión interactiva dentro de las fichas corresponde al QA visual de la publicación.

| Proyecto | Recorridos oficiales registrados | Distinción |
| --- | --- | --- |
| Curicó 77 | [1D/1B](https://sento.cl/360-curico/depto-1d1b/), [tipo C](https://sento.cl/360-curico/depto-tipo-c/), [360 del botón entorno](https://sento.cl/360-curico/) | Dos departamentos; otro botón presentado como entorno por Sento. |
| Domeyko 2055 | [Departamento](https://sento.cl/360-domeyko/), [entorno](https://sento.cl/360-domeyko/entorno/) | Separar interiores de barrio. |
| Jofré 157 | [Matterport](https://my.matterport.com/show/?m=pK2vLc2BEUX), [entorno](https://sento.cl/360-jofre/) | Departamento y entorno separados. |
| Mirador La Florida | [Entorno 360](https://www.plango360.com/360_Sento/Mirador_LaFlorida360_3/) | Galería de departamento tiene iframe vacío; no anunciar un tour de interior que no existe. |
| Plaza Las Condes | [Departamento 213](https://sento.cl/360-plc/213/), [emplazamiento](https://mybakerlab.com/plazalascondesweb/) | El visor de emplazamiento no confirma inventario actualizado. |
| San Ignacio 280 | [Matterport](https://my.matterport.com/show/?m=TqVXdVUKGvj), [entorno](https://sento.cl/360-sanignacio/entorno/) | Departamento y entorno separados. |
| Angamos 205 | [Matterport](https://my.matterport.com/show/?m=ccFqoRTyaRH), [entorno](https://sento.cl/360-angamos/) | Ambos HTTP 200 según el registro de extracción oficial Angamos; departamento y entorno separados. |

## Diferencias y límites que deben conservarse

- **Curicó:** dirección comercial Curicó 77; iframe de mapa identifica Curicó 55. La dirección escrita oficial prevalece para consulta de ubicación. El rango global de web es 20,85–47,35 m² y algunas tarjetas incluyen 49,52/87,84 m². No inferir oferta actual a partir de esos planos.
- **Domeyko:** la página declara 23,68–86,97 m² globales; los planos disponibles en la página representan sólo una selección. Los originales de brochure son la fuente de sus tipologías documentadas.
- **Jofré:** brochure 20,21–55,46 m² globales; cuatro planos aportados 20,77–55,33 m²; web 20,21–55,33 m². Mantener valores por fuente. Estado comercial vendido sin precio.
- **Mirador:** la ubicación actual se expresa sólo como Calle Eugenia, La Florida; no inventar número. Fotos de Metro, mall, parques, MIM, Bosque Panul y centro cívico pertenecen al entorno. El único 360 publicado corresponde al entorno.
- **Plaza Las Condes:** conservar Av. Las Condes 7083 como identificación y Carol Urzúa 7060 como acceso oficial. La tarjeta web C2 tiene 49,52 m² y repite métricas de Curicó; no reemplazar la planta del brochure con ella sin evidencia adicional.
- **San Ignacio:** rangos y planos difieren entre brochure y web; mantener versiones separadas. Mapas oficiales apuntan 270 aunque la dirección comercial actual sea 280.
- **Angamos:** título y dirección comercial dicen 205, iframe de mapa 215 y enlace de pie General Jofré 376. Usar consulta de mapa Angamos 205. C6 mantiene total oficial 51,36 m² aunque útil 48,37 más terraza 2,89 suman 51,26. Las plantas A2/A4 tienen nombres de archivo con reservado, que no prueban stock presente.

Sento advierte que imágenes, superficies y medidas son referenciales. Los renders se identifican como tales; las imágenes de entorno no se incorporan como fotos del edificio. La preservación de los otros 127 proyectos se verifica en las pruebas de alcance de la publicación. Este documento contiene investigación de fuente y no certifica por sí mismo el resultado visual final ni un despliegue.
