# Cartera definitiva de Norte Verde — borrador de entrega

**Estado: documentación preliminar. Las pruebas finales, el commit y la Preview de Vercel siguen pendientes de cierre por el responsable de integración. Este documento no declara QA completo ni autorización de publicación en Production.**

## Alcance y fuente documental

La actualización se limita a los 17 proyectos autorizados de Norte Verde y utiliza exclusivamente los 17 PDF aportados. Cada ficha preparada conserva el brochure original, una portada de fachada, la galería seleccionada, tipologías y planos disponibles. El manifiesto [`data/brochures-norte-verde.json`](../data/brochures-norte-verde.json) vincula los recursos a su PDF, página y SHA-256. La auditoría inicial se conserva en [`data/norte-verde-baseline.json`](../data/norte-verde-baseline.json); sus datos anteriores sirven para comparación y no se toman como fuente comercial vigente.

## Auditoría del catálogo

| Concepto | Cantidad |
|---|---:|
| Proyectos Norte Verde encontrados inicialmente | 20 |
| Proyectos autorizados actualizados | 17 |
| Proyectos agregados | 0 |
| Proyectos excluidos del catálogo público | 3 |
| Proyectos de otras inmobiliarias preservados | 117 |

Los 17 autorizados ya existían: se conservaron sus slugs y enlaces de ficha. Los nombres públicos se ajustaron a la lista solicitada. Las tres exclusiones responden a la lista definitiva, no a una afirmación sobre la vigencia comercial de esos proyectos.

- Edificio Vergara Domeyko (`vergara-domeyko`): Fuera de la lista definitiva autorizada.
- Edificio Atelier Prat Oficinas (`atelier-prat-oficinas`): Fuera de la lista definitiva autorizada.
- Edificio Corrientes Oficinas (`corrientes-oficinas`): Fuera de la lista definitiva autorizada.

Las 117 fichas HTML de otras inmobiliarias fueron comparadas por SHA-256 con la línea base y conservan su contenido. La comprobación de ausencia de regresiones funcionales y del catálogo completo forma parte del cierre de pruebas todavía pendiente.

## Estado de las 17 fichas

El estado de esta tabla describe la preparación documental en la fuente de trabajo; no acredita disponibilidad de unidades ni estado de venta. Las limitaciones de cada brochure se detallan más abajo.

| Proyecto | Ficha | Imágenes | Planos | Estado de preparación |
|---|---|---:|---:|---|
| Bordevivo | [`bordevivo.html`](../bordevivo.html) | 12 | 8 | Integrada en fuente; validación final pendiente |
| Carmen Marín | [`carmen-marin.html`](../carmen-marin.html) | 7 | 9 | Integrada en fuente; validación final pendiente |
| Ecuador | [`edificio-ecuador.html`](../edificio-ecuador.html) | 3 | 8 | Integrada en fuente; validación final pendiente |
| Origen Atacama 3008 | [`edif-origen-atacama-3008.html`](../edif-origen-atacama-3008.html) | 7 | 6 | Integrada en fuente; validación final pendiente |
| Dual 390 LTO | [`edificio-dual-390-lto.html`](../edificio-dual-390-lto.html) | 8 | 7 | Integrada en fuente; validación final pendiente |
| Lira 622 | [`edificio-lira-622.html`](../edificio-lira-622.html) | 6 | 10 | Integrada en fuente; validación final pendiente |
| Plaza Nova | [`edificio-plaza-nova.html`](../edificio-plaza-nova.html) | 8 | 8 | Integrada en fuente; validación final pendiente |
| San Francisco 1204 | [`edificio-san-francisco-1204.html`](../edificio-san-francisco-1204.html) | 6 | 6 | Integrada en fuente; validación final pendiente |
| Verne | [`edificio-verne.html`](../edificio-verne.html) | 6 | 6 | Integrada en fuente; validación final pendiente |
| Irarrázaval 1970 | [`irarrazaval.html`](../irarrazaval.html) | 8 | 11 | Integrada en fuente; validación final pendiente |
| Parque Panamá | [`parque-panama.html`](../parque-panama.html) | 4 | 6 | Integrada en fuente; validación final pendiente |
| Parque Quinta | [`parque-quinta.html`](../parque-quinta.html) | 3 | 8 | Integrada en fuente; validación final pendiente |
| Playa Peñuelas | [`playa-penuelas.html`](../playa-penuelas.html) | 7 | 8 | Integrada en fuente; validación final pendiente |
| Playa Serena | [`playa-serena.html`](../playa-serena.html) | 8 | 7 | Integrada en fuente; validación final pendiente |
| Quintavista | [`quintavista.html`](../quintavista.html) | 8 | 9 | Integrada en fuente; validación final pendiente |
| Vicuña Mackenna 6896 | [`vicuna-mackenna-6896.html`](../vicuna-mackenna-6896.html) | 8 | 10 | Integrada en fuente; validación final pendiente |
| Vista Bulnes | [`vista-bulnes.html`](../vista-bulnes.html) | 9 | 8 | Integrada en fuente; validación final pendiente |
| **Total** | **17 fichas** | **118** | **135** | **Cierre de validación pendiente** |

Las galerías excluyen fotografías genéricas del entorno, recursos decorativos, texto de los brochures y repeticiones detectadas. Los renders se identifican como referenciales. La optimización WebP conserva la proporción original y no agrega ni modifica arquitectura.

## Superficies, planos y calidad del material

Las superficies municipales y construidas se mantienen como categorías distintas, con sus rótulos y valores originales. No se suman, sustituyen ni comparan como si fueran equivalentes. Las discrepancias aritméticas impresas en Carmen Marín, Lira 622 y Vista Bulnes se conservan y quedan pendientes de confirmación. Peñuelas solo publica superficies construidas; Parque Panamá solo informa el total construido por tipología. Los rangos publicados corresponden a los modelos documentados, sin inferir stock.

Cuando el plano forma parte de una página compuesta, el recorte mantiene distribución, identificación y tablas. Los renders priorizan objetos originales incrustados en el PDF. Los planos se renderizan a un máximo de 3000 px de página y se guardan en WebP sin pérdida; esa salida no crea detalle ausente en una imagen raster original. Ecuador y Verne presentan limitaciones explícitas por rasterización, y los planos de Peñuelas y Serena son esquemáticos. El PDF permanece como referencia para revisar el detalle disponible.

Las portadas de Plaza Nova (799 × 708 px) y Quintavista (767 × 532 px) tienen resolución nativa limitada; se conserva sin ampliación artificial. Los recortes corrigieron cruces entre tipos, títulos truncados y cortes de terrazas o balcones detectados durante revisión documental.

## Pendientes documentales por proyecto

Para todos los proyectos, precios, disponibilidad, estado comercial, fechas de entrega, promociones y condiciones vigentes requieren confirmación. No se completan con el catálogo previo ni con fuentes externas. Una ubicación dudosa queda sin mapa puntual. Los siguientes pendientes se reproducen desde el manifiesto para permitir su seguimiento:

### Bordevivo

- Precio, disponibilidad, estado de venta, fecha de entrega y promociones pendientes de validación vigente.
- Las imágenes del brochure son ilustrativas; las superficies y terrazas pueden variar según versión, piso u orientación.
- Región no declarada expresamente en el brochure.

### Carmen Marín

- Precio, disponibilidad, estado de venta, fecha de entrega y promociones pendientes de validación vigente.
- Las imágenes del brochure son ilustrativas; las superficies y terrazas pueden variar según versión, piso u orientación.
- Región no declarada expresamente en el brochure.
- Tipo C (p. 12): el total municipal publicado es 24,50 m², aunque las superficies útil 22,49 m² y terraza 1,39 m² no suman ese total; se conserva el valor original para validación.
- Walk Score 95 indicado en p. 3, sin fecha ni evidencia de vigencia; no se publica como medición actual.

### Ecuador

- Precio, disponibilidad, estado de venta, fecha de entrega y promociones pendientes de validación vigente.
- Las imágenes del brochure son ilustrativas; las superficies y terrazas pueden variar según versión, piso u orientación.
- Región y número de calle no declarados expresamente en el brochure.
- PDF rasterizado: los renders se recortan de imágenes originales incrustadas; los planos mantienen la resolución disponible del original, sin cotas numéricas adicionales.

### Origen Atacama 3008

- Precio, disponibilidad, estado de venta, fecha de entrega y promociones pendientes de validación vigente.
- Las imágenes del brochure son ilustrativas; las superficies y terrazas pueden variar según versión, piso u orientación.
- El nombre autorizado y el archivo incluyen Atacama 3008, pero el contenido del brochure no declara explícitamente dirección, comuna o región. Ubicación y mapa pendientes de confirmación.
- La lista de conectividad incluye Santa Isabel (L5), dato sin contexto coherente con el entorno ilustrado; requiere validación y se omite del resumen público.
- La estación futura de Línea 7 figura como proyección del brochure; operación y vigencia pendientes.

### Dual 390 LTO

- Precio, disponibilidad, estado de venta, fecha de entrega y promociones pendientes de validación vigente.
- Las imágenes del brochure son ilustrativas; las superficies y terrazas pueden variar según versión, piso u orientación.
- Región no declarada expresamente en el brochure.

### Lira 622

- Precio, disponibilidad, estado de venta, fecha de entrega y promociones pendientes de validación vigente.
- Las imágenes del brochure son ilustrativas; las superficies y terrazas pueden variar según versión, piso u orientación.
- El logo y nombre incluyen Lira 622, pero el brochure no declara expresamente dirección postal, comuna o región. Ubicación y mapa pendientes de confirmación.
- Las páginas 8 y 9 repiten los tipos A y A1; se incluyen una sola vez.
- Tipo A3 (p. 10): el total municipal publicado es 35,47 m², aunque útil 30,70 m² + terraza 1,77 m² no suman ese valor; se conserva el original para validación.
- Tipo F (p. 13): el título indica 1 Dorm + 1 Baño, mientras el plano muestra un ambiente abierto. Se conserva la denominación del brochure, pendiente de confirmación.
- Se menciona Wall bed para tipos Estudio (p. 7), pero las láminas de tipologías no identifican expresamente un tipo como Estudio.

### Plaza Nova

- Precio, disponibilidad, estado comercial, fecha de entrega y promociones pendientes de confirmación vigente.
- Región no declarada expresamente en el brochure.
- Dirección exacta no declarada en el brochure; no publicar mapa de ubicación puntual.
- Portada original de 799 × 708 px: conservar su calidad nativa y evitar ampliación excesiva.
- El brochure distingue terrazas municipales de 0 m² con superficie construida positiva; se conserva esa distinción sin corregir sus valores.

### San Francisco 1204

- Precio, disponibilidad, estado comercial, fecha de entrega y promociones pendientes de confirmación vigente.
- Región no declarada expresamente en el brochure.
- Comuna no declarada expresamente en el brochure.
- El número 1204 integra el nombre del proyecto y la calle/esquina se describe en p2; no se infieren coordenadas.

### Verne

- Precio, disponibilidad, estado comercial, fecha de entrega y promociones pendientes de confirmación vigente.
- Región no declarada expresamente en el brochure.
- Brochure compuesto por páginas rasterizadas de 1772 × 1772 px; no contiene texto seleccionable ni planos vectoriales. Se transcribió mediante revisión visual.
- La mención a futura estación 1 del metrotren en p5 no acredita servicio actual y se excluye de la conectividad publicada.
- Renders referenciales y planos sin cotas dimensionales legibles en el original.
- Los modelos ilustrados corresponden a unidades de ejemplo (C 709, E 713, D 712, A 708, A2 701, B 703); no acreditan disponibilidad.

### Irarrázaval 1970

- Precio, disponibilidad, estado comercial, fecha de entrega y promociones pendientes de confirmación vigente.
- Región no declarada expresamente en el brochure.
- P5 incluye una lista inconsistente de cercanías al centro de Santiago (Mapocho, Plaza de Armas, Parque Forestal, Paseo Bandera y Parque de los Reyes); se omite esa lista y se usa únicamente la conectividad coherente con Ñuñoa declarada en la misma página.

### Parque Panamá

- Precio, disponibilidad, estado comercial, fecha de entrega y promociones pendientes de confirmación vigente.
- Región no declarada expresamente en el brochure.
- El brochure informa solo total construido por tipología; no publica superficies útiles ni una tabla municipal por modelo.
- El rango genérico de p5 (22,50 a 56,02 m²) no se usa como rango de los seis planos, cuyos totales construidos son 29,12 a 52,66 m².
- P6 declara que los datos son referenciales, elaborados con información pública de toctoc.com; requieren confirmación comercial antes de ser condiciones vinculantes.
- La futura L7 indicada en p5 no acredita un servicio operativo actual y se omite de la conectividad vigente.
- Se excluye de la galería la imagen de fachada alternativa incrustada en p5 pero no visible en la página; su atribución no es verificable.

### Parque Quinta

- Precio, disponibilidad, estado comercial, fecha de entrega y promociones pendientes de confirmación vigente.
- Región no declarada expresamente en el brochure.
- Dirección exacta y comuna no declaradas expresamente en el brochure; no publicar ubicación puntual ni inferirlas del nombre del parque.
- El brochure no ofrece interiores del proyecto: se excluyen fotografías genéricas de personas, comida, naturaleza y entorno.
- P8 contiene un logo Bordevivo incrustado pero no visible en la página; se excluye de los recursos publicados.

### Playa Peñuelas

- Precio, disponibilidad, fecha de entrega, promociones y condiciones comerciales vigentes no confirmados por el brochure.
- Dirección postal, comuna y región no declaradas de forma inequívoca.
- El brochure solo publica superficies construidas, sin valores municipales.
- Planos esquemáticos raster: consultar el PDF original para mayor detalle; no se añaden cotas no publicadas.

### Playa Serena

- Precio, disponibilidad, fecha de entrega, promociones y condiciones comerciales vigentes no confirmados por el brochure.
- Región y numeración postal no declaradas; la ubicación se describe mediante una intersección en el brochure.
- Los planos son imágenes raster esquemáticas sin cotas constructivas; el PDF conserva la referencia original.
- La referencia de Avenida del Mar con Cuatro Esquinas y el esquema de ubicación no fijan el acceso exacto; confirmar antes de mostrar mapa.

### Quintavista

- Precio, disponibilidad, fecha de entrega, promociones y condiciones comerciales vigentes no confirmados por el brochure.
- Dirección postal, comuna y región no declaradas.
- Baños de los estudios no explicitados en los rótulos.
- Texto legal de G identifica modelo A y de J identifica G; se conservan los rótulos principales de cada plano y se solicita confirmar estas referencias.
- La fachada original tiene 767 × 532 píxeles; se conserva sin ampliar.

### Vicuña Mackenna 6896

- Precio, disponibilidad, fecha de entrega, promociones y condiciones comerciales vigentes no confirmados por el brochure.
- Región y baños de los estudios no explicitados en el brochure.
- El PDF contiene capas y textos residuales de Irarrázaval en páginas 7–13; se descartan los elementos que no corresponden al contenido visible de Vicuña Mackenna.

### Vista Bulnes

- Precio, disponibilidad, fecha de entrega, promociones y condiciones comerciales vigentes no confirmados por el brochure.
- Dirección postal, comuna y región no declaradas.
- Baños de los estudios no explicitados en los rótulos.
- Modelo D: total municipal publicado 31,45 m² difiere de suma útil 29,62 + terraza 1,82 = 31,44 m²; conservar dato impreso y confirmar.

## Integridad y reproducibilidad

El manifiesto contiene 17 PDF, 118 imágenes y 135 planos: 270 recursos documentales. Cada entrada conserva su SHA-256. La constancia de reproducción independiente está en el expediente de revisión `reproducibility.json`; el cierre de integridad del paquete de publicación queda pendiente hasta generar y comprobar el paquete final.

La portada final de Verne usa `crop.width = 0.590`. Se reprodujeron sus 13 recursos —un PDF, seis imágenes y seis planos— mediante `materialize(..., root=TEMP)` en una carpeta temporal nueva, sin escribir en la fuente ni en `dist`. Los 13 SHA-256 coinciden con el manifiesto y los archivos fuente. Se registró `finalVerneCoverReverified = true`.

- Portada Verne: `/assets/propiedades/norte-verde/edificio-verne/imagen-02.webp`.
- SHA-256 de portada: `4c5b5737c02238c59524ba1871d202301456b9666e3b31917f7e7bc6113f79d4`.
- SHA-256 del manifiesto usado en esta reproducción: `cc1cba6ef8bb9ad5adbb5574316d573751f1270838ff8905221bb05c031033c2`.

Esta reproducción comprueba determinismo e integridad de archivos; no reemplaza las pruebas de navegación, responsive, consulta, agendamiento ni despliegue.

## Cierre técnico pendiente

| Verificación | Estado de este borrador |
|---|---|
| Exactamente 17 Norte Verde visibles, sin no autorizados ni duplicados | Pendiente de consolidar resultado final |
| Portadas, galerías, planos, enlaces y ausencia de secciones vacías | Pendiente de consolidar resultado final |
| Consulta y agendamiento funcionales | Pendiente de consolidar resultado final |
| Escritorio, tablet y móvil; ausencia de desbordamientos | Pendiente de consolidar resultado final |
| Datos comerciales respaldados y pendientes correctamente presentados | Pendiente de consolidar resultado final |
| Ausencia de regresiones en otras inmobiliarias | SHA de 117 HTML preservados; cierre funcional pendiente |
| Integridad SHA-256 del paquete final de publicación | Pendiente |
| Suites automatizadas y build final | Pendiente de consignar ejecución, alcance y resultado |
| Commit final | Pendiente |
| Rama de trabajo | Pendiente de consignar por integración |
| Nueva Preview de Vercel y comprobación remota | Pendiente |

No se declara la entrega concluida mientras falten estos resultados. La Preview se entrega para revisión del usuario; no se autoriza merge a `main` ni modificación de Production.
