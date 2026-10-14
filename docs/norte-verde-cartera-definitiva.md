# Cartera definitiva de Norte Verde — informe de entrega

**Entrega: 14 de octubre de 2026. Preview lista para revisión y aprobación. Las 17 fichas están integradas y verificadas; los pendientes comerciales y las limitaciones del material se documentan por proyecto.**

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

Las 117 fichas HTML de otras inmobiliarias fueron comparadas por SHA-256 con la línea base y conservan su contenido. La regresión automatizada pasó y los 1.343 archivos públicos se compararon con el Preview remoto por SHA-256. El catálogo público conserva las proyecciones de portada previamente aprobadas de las otras inmobiliarias.

## Estado de las 17 fichas

El estado de esta tabla acredita integración y verificación de la ficha en el Preview; no acredita disponibilidad de unidades ni estado de venta. Las limitaciones de cada brochure se detallan más abajo.

| Proyecto | Ficha | Imágenes | Planos | Estado de preparación |
|---|---|---:|---:|---|
| Bordevivo | [`bordevivo.html`](../bordevivo.html) | 12 | 8 | Integrada y verificada en Preview |
| Carmen Marín | [`carmen-marin.html`](../carmen-marin.html) | 7 | 9 | Integrada y verificada en Preview |
| Ecuador | [`edificio-ecuador.html`](../edificio-ecuador.html) | 3 | 8 | Integrada y verificada en Preview |
| Origen Atacama 3008 | [`edif-origen-atacama-3008.html`](../edif-origen-atacama-3008.html) | 7 | 6 | Integrada y verificada en Preview |
| Dual 390 LTO | [`edificio-dual-390-lto.html`](../edificio-dual-390-lto.html) | 8 | 7 | Integrada y verificada en Preview |
| Lira 622 | [`edificio-lira-622.html`](../edificio-lira-622.html) | 6 | 10 | Integrada y verificada en Preview |
| Plaza Nova | [`edificio-plaza-nova.html`](../edificio-plaza-nova.html) | 8 | 8 | Integrada y verificada en Preview |
| San Francisco 1204 | [`edificio-san-francisco-1204.html`](../edificio-san-francisco-1204.html) | 6 | 6 | Integrada y verificada en Preview |
| Verne | [`edificio-verne.html`](../edificio-verne.html) | 6 | 6 | Integrada y verificada en Preview |
| Irarrázaval 1970 | [`irarrazaval.html`](../irarrazaval.html) | 8 | 11 | Integrada y verificada en Preview |
| Parque Panamá | [`parque-panama.html`](../parque-panama.html) | 4 | 6 | Integrada y verificada en Preview |
| Parque Quinta | [`parque-quinta.html`](../parque-quinta.html) | 3 | 8 | Integrada y verificada en Preview |
| Playa Peñuelas | [`playa-penuelas.html`](../playa-penuelas.html) | 7 | 8 | Integrada y verificada en Preview |
| Playa Serena | [`playa-serena.html`](../playa-serena.html) | 8 | 7 | Integrada y verificada en Preview |
| Quintavista | [`quintavista.html`](../quintavista.html) | 8 | 9 | Integrada y verificada en Preview |
| Vicuña Mackenna 6896 | [`vicuna-mackenna-6896.html`](../vicuna-mackenna-6896.html) | 8 | 10 | Integrada y verificada en Preview |
| Vista Bulnes | [`vista-bulnes.html`](../vista-bulnes.html) | 9 | 8 | Integrada y verificada en Preview |
| **Total** | **17 fichas** | **118** | **135** | **Verificadas en Preview** |

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

El manifiesto contiene 17 PDF, 118 imágenes y 135 planos: 270 recursos documentales. Cada entrada conserva su SHA-256. La [reproducción independiente](norte-verde-evidencias/reproducibility.json) confirmó los 270 SHA-256, incluido el recorte final de Verne. El paquete final se leyó nuevamente y sus archivos coinciden con el inventario de entrada de Vercel y el código del commit publicado.

La portada final de Verne usa `crop.width = 0.590`. Se reprodujeron sus 13 recursos —un PDF, seis imágenes y seis planos— mediante `materialize(..., root=TEMP)` en una carpeta temporal nueva, sin escribir en la fuente ni en `dist`. Los 13 SHA-256 coinciden con el manifiesto y los archivos fuente. Se registró `finalVerneCoverReverified = true`.

- Portada Verne: `/assets/propiedades/norte-verde/edificio-verne/imagen-02.webp`.
- SHA-256 de portada: `4c5b5737c02238c59524ba1871d202301456b9666e3b31917f7e7bc6113f79d4`.
- SHA-256 del manifiesto usado en esta reproducción: `cc1cba6ef8bb9ad5adbb5574316d573751f1270838ff8905221bb05c031033c2`.

Esta reproducción comprueba determinismo e integridad de archivos; no reemplaza las pruebas de navegación, responsive, consulta, agendamiento ni despliegue.

## Resultado de pruebas

| Verificación | Resultado |
|---|---|
| Regresión Node del catálogo y funciones existentes | 323/323 aprobadas; cero omitidas |
| Casos adicionales de publicación con recursos reales | 27/27 aprobados; cero omitidos |
| Fixtures Python y validación hipotecaria | 130/130 aprobados; validador aprobado |
| Suite Norte Verde sobre código final | 10/10 aprobadas, incluidos originales y archivos publicados |
| Auditor del paquete | 134 proyectos, 17 Norte Verde, 141 páginas, 6.717 referencias locales; sin errores |
| Revisión responsive completa | 17 fichas × 3 anchos (1440, 768, 375 px): 51 vistas y 1.660 comprobaciones aprobadas |
| Navegación y acciones | 3 catálogos, 17 flujos contextuales, 34 ampliaciones; 51 llamadas API interceptadas |
| Muestra visual en Vercel | Bordevivo e Irarrázaval: 4 vistas, 225 comprobaciones aprobadas |
| Integridad remota | 1.343/1.343 archivos; 301.668.664 bytes; todos SHA-256 iguales al paquete local |
| Exclusiones públicas | Las 3 rutas retiradas responden HTTP 404 en la nueva Preview |
| Formularios de las 17 fichas en Preview | 34/34 respuestas HTTP 503 con `preview_read_only`, antes de proveedores externos |
| Preservación | 117 registros y fichas HTML ajenos intactos; catálogo público histórico preservado |

Las 27 pruebas adicionales se ejecutaron con los recursos privados reales. Los casos Norte Verde verifican el catálogo actual de 134 proyectos; los casos históricos reproducen sus políticas anteriores con las 20 filas Norte Verde archivadas, manteniendo sus hashes originales. Las llamadas de navegador se interceptaron y se comprobaron además los guardas del Preview desplegado. No se enviaron mensajes ni se crearon reservas reales.

El servidor local inicial de QA reinició algunas conexiones. La evidencia de red descartó corrupción de archivos; se corrigió únicamente la cola del servidor de pruebas y se repitieron las 51 vistas desde cero, sin fallos. El sitio y sus archivos no requirieron cambios por ese incidente. La muestra remota en Vercel también pasó.

Evidencias: [CI](norte-verde-evidencias/git-ci.json), [publicación](norte-verde-evidencias/release-cases.json), [auditor](norte-verde-evidencias/public-build-audit.json), [responsive](norte-verde-evidencias/qa-responsive.json), [Vercel visual](norte-verde-evidencias/qa-preview.json), [SHA remotos y formularios](norte-verde-evidencias/remote-integrity.json).

## Rama, commit y Preview

- Rama: `codex/norte-verde-cartera-definitiva`, subida a `lasopho/sollahms-web`.
- Commit de aplicación desplegado: [`1d7f5586e87e08ea0fed7bd0b7f9371c212a93d3`](https://github.com/lasopho/sollahms-web/commit/1d7f5586e87e08ea0fed7bd0b7f9371c212a93d3).
- Preview: [abrir catálogo](https://project-wrapp-7d8yg0ufx-lsandoval2-8260s-projects.vercel.app/proyectos.html). Buscar «Norte Verde» muestra exactamente los 17 proyectos.
- Deployment: `dpl_2DB6XbTe6omhhEGRnAUsfcoVyWL6`, estado READY, entorno Preview, sin aliases de Production.
- Proyecto Vercel: `project-wrapp` / `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`.
- La plataforma confirma rama, commit y SHA de los paquetes en su metadata: [receipt](norte-verde-evidencias/deployment.json).

El checkout compartido fue utilizado por otro trabajo durante la ejecución. Esta entrega se cerró en un checkout independiente en `/private/tmp/norte-verde-checkout`; se preservó el trabajo concurrente. El commit que contiene este informe añade únicamente evidencia, documentación y el harness final de QA respecto del commit de aplicación indicado.

## SHA-256 del paquete

| Elemento | SHA-256 |
|---|---|
| Archivo de fuente `source.tgz` | `99f79449cefba3e4ddf4e35a3c006fb3bad937918348d8c866ab07029153296d` |
| Inventario de fuente | `9567fb606d0e748c73b4c81f0c10dd508b467701d3725e24fba7219fdedef8c1` |
| Inventario de publicación | `b80fef312f71defc435309a296ac9723a1a35f5d743e56af41791dde08ec6138` |

El archivo contiene 1,789 archivos de entrada y 333,132,012 bytes, ocupa 319,454,453 bytes comprimidos y fue leído y verificado después de su creación. Copia local: `/private/tmp/norte-verde-delivery/source.tgz`. El [receipt de fuente](norte-verde-evidencias/source-package.json) y el [inventario público](norte-verde-evidencias/public-inventory.json) conservan los valores verificables.

## Revisión pendiente del usuario

La Preview está protegida por autenticación de Vercel y lista para revisar diseño, selección de imágenes y contenido. Los pendientes documentales descritos para cada proyecto requieren confirmación comercial; ninguna condición se inventó para completarlos. No quedan pruebas críticas pendientes ni recursos faltantes sin documentar.

No se hizo merge a `main` ni se modificó Production. Antes y después de esta entrega, Production mantuvo `dpl_9LvbrLDbZhho3Umm5Rmv6AMkauXE` y `main` mantuvo `f1e9bf1715cc99d095a367eba9028a9a1ad2b026`: [antes](norte-verde-evidencias/production-before.json), [después](norte-verde-evidencias/production-after.json).
