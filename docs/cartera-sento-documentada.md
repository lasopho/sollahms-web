> Registro de la Preview validada antes del merge. La integración a main y sus resultados propios se documentan en [Merge Sento a main](merge-sento-main.md). Los archivos completos de QA de esa Preview permanecen en el paquete durable de esta conversación.

# SOLLAHMS — Cartera Inmobiliaria Sento

> **Entrega anterior conservada como registro histórico.** La presentación, las superficies, la regresión y la Preview actuales se documentan en [Correcciones finales Sento](correcciones-finales-sento.md). Este informe describe el despliegue anterior; sus botones PDF, marcas de Mirador A4, clasificación Angamos y pendientes de CI fueron sustituidos por la corrección final.

Informe de entrega: **14 de octubre de 2026**. Datos comerciales y fuentes oficiales comprobados el **13 de octubre de 2026**, zona America/Santiago.

**Preview:** [Cartera Sento en Vercel](https://project-wrapp-qdgqh93lh-lsandoval2-8260s-projects.vercel.app/proyectos.html). Despliegue `dpl_417G8WhbUBV9HwJnyEPdbL542FV7`, confirmado **READY**, entorno Preview, sin alias de Production. Mantiene la autenticación de Vercel del proyecto existente.

## Resultado

**Siete fichas existentes actualizadas; cero fichas añadidas.** Contienen 55 imágenes del proyecto, 45 planos y seis brochures originales descargables. Se conservaron las rutas, el diseño de Sollahms y la estructura destacada de Plaza Las Condes. Se incorporaron especificaciones, áreas comunes, terminaciones, tipologías, superficies por fuente, mapas y recorridos oficiales.

| Proyecto publicado | Imágenes | Planos | Estado oficial | Precio desde UF / unidad | Ficha |
| --- | ---: | ---: | --- | --- | --- |
| Curicó 77 | 5 | 11 | Venta en verde | 2.610 / Estudio 1123 | [Abrir](https://project-wrapp-qdgqh93lh-lsandoval2-8260s-projects.vercel.app/curico-77.html) |
| Domeyko 2055 | 7 | 3 | Entrega inmediata | 2.322 / Estudio 319 | [Abrir](https://project-wrapp-qdgqh93lh-lsandoval2-8260s-projects.vercel.app/domeyko-2055.html) |
| Jofré 157 | 6 | 4 | Vendido | Sin precio; 100% vendido | [Abrir](https://project-wrapp-qdgqh93lh-lsandoval2-8260s-projects.vercel.app/jofre-135.html) |
| Mirador La Florida | 7 | 9 | Venta en blanco · entrega estimada 1.er semestre 2029 | 2.074 / Estudio 202 | [Abrir](https://project-wrapp-qdgqh93lh-lsandoval2-8260s-projects.vercel.app/mirador-la-florida.html) |
| Plaza Las Condes | 7 | 9 | Próxima entrega | 8.858 / 2D/2B 313 | [Abrir](https://project-wrapp-qdgqh93lh-lsandoval2-8260s-projects.vercel.app/plaza-las-condes.html) |
| San Ignacio | 6 | 3 | Entrega inmediata | 2.141 / Estudio 604 | [Abrir](https://project-wrapp-qdgqh93lh-lsandoval2-8260s-projects.vercel.app/san-ignacio.html) |
| Angamos 205 | 17 | 6 | Entrega inmediata | 2.794 / 1D/1B 516 | [Abrir](https://project-wrapp-qdgqh93lh-lsandoval2-8260s-projects.vercel.app/angamos.html) |

Los seis precios corresponden a unidades específicas, incluyen los descuentos publicados en la web de Sento en octubre de 2026 y excluyen estacionamiento y bodega. Están sujetos a disponibilidad y cotización. No se certificó stock por unidad. Los planos son documentación de tipologías y no se utilizan para inferir una superficie mínima disponible. Las promociones antiguas de los brochures se excluyeron de las condiciones comerciales.

## Identidades y ubicación

- **Jofré 135 / 157:** se conserva el nombre público Jofré 157 y la ruta `jofre-135`. La fachada y los cuatro planos son idénticos en bytes al brochure enlazado desde la web oficial Jofré 157; el propio mapa apunta a 135. La identidad es de alta certeza; no se afirma una renumeración administrativa sin documentación municipal.
- **San Ignacio 270 / 280:** se conserva San Ignacio, su ruta y la dirección comercial 280. La web enlaza un mapa a 270 y coincide en características y códigos de plano con el PDF recibido. Se muestra la diferencia y la necesidad de confirmar el acceso.
- **Plaza Las Condes:** el brochure identifica Av. Las Condes 7083 y la web informa acceso por General Carol Urzúa 7060. Se conservó la misma ficha destacada.
- **Curicó:** dirección comercial 77 y mapa oficial 55; se usa búsqueda por 77 con advertencia de acceso por confirmar.
- **Mirador La Florida:** se publica Calle Eugenia, sin inventar numeración. El mapa se identifica como referencial.
- **Angamos:** dirección comercial 205; el mapa oficial apunta a 215 y el pie enlaza General Jofré 376. Se usa búsqueda por Angamos 205 y se explica la discrepancia.

La evidencia completa está en [Identidades y fuentes](sento-identidades-fuentes.md) y en [Investigación oficial](../data/sento-official-research.json).

## Imágenes, planos y recorridos

- Cada imagen y plano queda vinculado a su PDF/página o URL oficial mediante SHA-256, dimensiones, método de extracción y revisión visual. Se descartaron imágenes de entorno y material corporativo que no representa el proyecto.
- Las fotografías tienen variantes WebP para tarjetas y vistas responsive. Los planos se codifican en WebP sin pérdida, se presentan completos y se amplían sin recortar el dibujo ni reconstruir etiquetas. Las superficies se transcriben como están impresas y cada versión mantiene su origen.
- La portada original de Angamos mide **2560 × 1440 px**, PNG de **1.971.394 bytes**. SHA-256: `0c9335d69003cbe4235c8187dbd1fc39cbdabcd8612bb7aed3ba90c2c73dfecb`. Se conserva el PNG para ampliar y se sirven variantes WebP de 1800, 1280 y 768 px. Se revisaron nitidez, compresión, dimensiones y encuadre.
- El Matterport de Angamos mostró la escena 3D del piloto 1 dormitorio, con identificación Sento y sin errores de script en Chrome. Se integra su visor oficial y se ofrece el enlace original. Los recorridos del entorno se etiquetan por separado. Otros visores nuevos sin acreditación interactiva se ofrecen como enlaces; se conservaron las acreditaciones válidas existentes.

## Límites que requieren confirmación de Sento

- **Galerías Angamos:** las imágenes oficiales de interiores y áreas comunes alcanzan 1024 × 576 px; se conserva su resolución real. Las fotos del piloto son referenciales y la decoración no forma parte de la entrega.
- **Recorrido Mirador:** el único visor oficial disponible corresponde al entorno; no se anuncia un tour de departamento.
- **Resolución de origen:** Mirador tiene una fachada original de 1004 px; Curicó, Domeyko y Jofré también tienen originales modestos. Se conservó la resolución real sin ampliación artificial. Angamos C4/C6 sólo dispone de planos actuales de 800 px; las versiones históricas mayores incorporan una promoción y se descartaron.
- **Marcas de la fuente:** Mirador A4 conserva una franja AGOTADO que tapa parte del dibujo; Angamos A2/A4 conservan RESERVADO. Las notas indican que esas marcas de la fuente no verifican stock vigente. No se alteró el plano para borrar ni reconstruir lo cubierto.
- **Superficies:** San Ignacio A3 publica 24,18 m² en el PDF frente a 24,11 m² en web; D1, 55 frente a 55,19 m². Se preserva cada valor por fuente. Angamos C6 informa 51,36 m² total, aunque útil 48,37 + terraza 2,89 suma 51,26; el dato oficial permanece acompañado de la discrepancia.
- **Clasificación Angamos A2/A4:** la pestaña oficial dice Estudio y el campo numérico indica 1 dormitorio. Se muestra la denominación oficial y queda pendiente confirmar dormitorios.
- **Entrega/stock:** Curicó y Plaza no ofrecen una fecha exacta vigente verificable. No se inventaron fechas ni disponibilidad. Los rangos globales o tarjetas inconsistentes de la web no sustituyen los planos documentados.
- **Mapas:** las numeraciones discrepantes y el acceso exacto de Calle Eugenia requieren confirmación del desarrollador.

## Verificación y preservación

| Control | Resultado | Evidencia |
| --- | --- | --- |
| Validación específica Sento | **12/12**: 11 casos de fuente y 1 paquete compilado | [Salida completa](qa/sento/sento-validation.tap) |
| Fidelidad de los planos | **45/45**, píxeles decodificados iguales a la extracción original | Prueba específica Sento |
| Procedencia de fotos PDF | **38/38**, hashes originales comprobados | Prueba específica Sento |
| Recursos revisados | **291** archivos: 285 imágenes/variantes y 6 PDFs | `data/sento-review.json` |
| Reproducción de extracción | 227 medios + 6 PDFs y 58 medios Angamos idénticos en SHA-256 | Scripts de materialización |
| Python y datos hipotecarios | **130/130** fixtures; validador hipotecario aprobado | [Informe automatizado](qa/sento/automated-report.json) |
| QA visual y navegación | **843 controles**, 21 vistas, 66 capturas, **0 fallos** | [Informe visual](qa/sento/visual-report.json) |
| Dispositivos | 375, 768 y 1440 px; sin desbordes ni imágenes locales rotas | [Resumen visual](sento-qa-visual.json) |
| Interacciones | 3 filtros Sento, 14 ampliaciones, 6 PDFs y 7 flujos de contacto/agenda/crédito | Informe visual |
| Envíos de formularios en QA | 21 solicitudes interceptadas; cero mensajes ni reservas reales | Informe visual |
| Preservación de otras inmobiliarias | 127 filas en los 3 registros, 127 HTML compilados y 1198 recursos: **0 diferencias** | [Comparación independiente](qa/sento/preservation-report.json) |
| Integración al workspace compartido | 7 HTML, 21 filas revisadas y 291 recursos verificados por SHA; resto intacto frente al instante previo | [Registro de integración](qa/sento/workspace-integration.json), [Validación de fuente](qa/sento/workspace-source-check.json) |
| Preview remota | **67/67** recursos correctos: HTML, catálogo, CSS, 6 PDFs, 7 portadas y 45 planos; HTTP 200 y `noindex` | [Informe remoto](qa/sento/preview-report.json) |
| Regresión histórica Node | Ejecución inicial **320/323**; tres inventarios corregidos y comprobados **3/3**. Repeticiones amplias terminaron por timeout; CI completo no declarado verde | [Informe automatizado](qa/sento/automated-report.json) |

Los HTML remotos conservan íntegramente el archivo aprobado y añaden sólo el script de Vercel Toolbar de 163 bytes con el ID exacto de este despliegue. El informe conserva hashes crudos y la comparación normalizada: no se eliminan otros scripts ni diferencias. Las 60 respuestas que no son HTML coinciden directamente en SHA-256. La comprobación remota utilizó GET/HEAD autenticados con el CLI existente, sin cambiar la protección ni realizar escrituras. Las 66 capturas están guardadas en `docs/qa/sento/screenshots/`.

La prueba de preservación usa dos compilaciones independientes de la misma fuente: una restaura únicamente los siete Sento anteriores y otra aplica esta cartera. Ambas pasan por el empaquetador existente, por lo que sus 127 fichas ajenas y 1198 recursos pueden compararse en bytes. El catálogo congelado de la Preview contiene 134 proyectos.

Durante esta tarea otras conversaciones modificaron el workspace compartido, incluida la cartera León, que retiró tres rutas de su catálogo. La integración Sento conservó los **124 registros ajenos presentes en ese momento**. Esos trabajos posteriores de otras conversaciones no se incluyeron en esta Preview congelada. No se reemplazaron sus módulos de publicación, registros ni contextos por la copia aislada.

**Límite de la regresión adicional:** los tres fallos iniciales eran inventarios históricos que contaban nuevos recursos Sento y una hoja de estilos Norte Verde. Los adaptadores preservan los hashes anteriores, aíslan los recursos añadidos y las tres verificaciones focales pasan. Las repeticiones amplias agotaron sus plazos; el intento serial registró 175 casos aprobados antes de la interrupción, sin completar los 254 de esa unidad. No se presenta la suite histórica completa como aprobada. Sus objetos Git usan un alternates al repositorio bajo iCloud; se observó esa dependencia, sin atribuirle causalidad exclusiva del timeout. Los recibos, salidas parciales y ejecución original están conservados en `docs/qa/sento/`.

La clasificación existente también excluye **27 casos de release de otras carteras** de la regresión de checkout. No se ejecutaron ni se marcaron aprobados en esta entrega; sus nombres y requisitos constan en el informe automatizado. La cartera Sento se verificó mediante sus pruebas específicas, dos compilaciones independientes, controles visuales y comparación remota del paquete realmente publicado.

Las pruebas antiguas fijan cortes previos de catálogos, fechas y políticas. Los adaptadores proyectan exclusivamente sucesores documentados a esas etapas para conservar sus hashes de referencia; las pruebas Sento y la comparación de dos compilaciones comprueban los datos reales actuales por separado.

## Fuentes y reproducción

| Brochure recibido | Páginas | SHA-256 |
| --- | ---: | --- |
| [Curicó 77](../assets/brochures/sento/curico-77.pdf) | 17 | `4aced7cd07f11a65a02885a83b134c09338e82b58e7acf0df14ef1897c3bcdf8` |
| [Domeyko 2055](../assets/brochures/sento/domeyko-2055.pdf) | 6 | `01451ac31ac2441997e341d1ae91e27954a0b0a6862adcc4223678edc4ad3a7b` |
| [Jofré 135 · ficha Jofré 157](../assets/brochures/sento/jofre-135.pdf) | 6 | `c55b58c468201c8b252c2148666203039109dd1d39bc98bdd2501a4cd00a1dd0` |
| [Mirador La Florida](../assets/brochures/sento/mirador-la-florida.pdf) | 22 | `8d591a6572948c1fc17466727c500b2c573d371027625d59c0624055ab946199` |
| [Plaza Las Condes](../assets/brochures/sento/plaza-las-condes.pdf) | 9 | `85ba1584b1f4658b57d26768682cfebff8f4823541625326221657e71e935a6d` |
| [San Ignacio](../assets/brochures/sento/san-ignacio.pdf) | 6 | `cc8e7cdfb6f68fc1e375ef71c8ddaf85f614d50ff8a6b5d3494c2d6806a69a5f` |

Manifiestos: [Brochures](../data/brochures-sento.json), [Angamos](../data/sento-angamos.json), [Web oficial](../data/sento-official-research.json), [Cartera revisada](../data/sento-review.json), [Baseline de alcance](../data/sento-baseline.json). Estos archivos documentan también descartes, recortes, versiones y pendientes por recurso.

Scripts: `scripts/materialize-sento-brochures.py`, `scripts/materialize-sento-angamos.py`, `scripts/apply-sento.py`, `scripts/sento_fiche.py` y `scripts/sento-publication.mjs`. La extracción acepta una carpeta de originales; consultar `--help` para paths y verificación de manifiesto.

Comprobaciones específicas sobre la copia aislada de la Preview: `SOLLAHMS_SENTO_ROOT=<copia-aislada> node --test tests/sento-validation.mjs` y `node tests/qa-sento.mjs --root <copia-aislada> --base http://127.0.0.1:8089 --output <carpeta-evidencia>`. El QA visual requiere Playwright/Chrome; la variable `SOLLAHMS_PLAYWRIGHT_MODULE` permite indicar el módulo del runtime disponible. El paquete se genera con el comando de build configurado en `vercel.json`, bajo entorno Preview.

**No se hizo merge a main, no se promovió ningún despliegue y no se modificó Production.** La publicación manual se realizó con la cuenta ya autenticada sobre una copia de la fuente validada, sin alterar permisos del equipo ni desactivar protección. Un primer intento vinculado al autor Git del commit base quedó bloqueado por Vercel; el despliegue READY indicado arriba es el resultado de entrega.

## Tipologías y superficies documentadas

Las siguientes superficies provienen del plano/PDF seleccionado o de la tarjeta oficial Angamos. Son referenciales y no certifican disponibilidad.

### Curicó 77

| Plano | Tipología publicada | Superficies por fuente |
| --- | --- | --- |
| D1 | Estudio | Superficie total: 23 m² |
| D2 | Estudio | Superficie total: 25 m² |
| D3 | Estudio | Superficie total: 24 m² |
| D4 | Estudio | Superficie total: 25 m² |
| D5 | Estudio | Superficie total: 24 m² |
| C2 | 2D / 2B | Superficie total: 49 m² |
| C2-1 | 2D / 2B | Superficie total: 87 m² |
| B1 | 2D / 2B | Superficie total: 42 m² |
| B2 | 2D / 2B | Superficie total: 46 m² |
| A2 | 1D / 1B | Superficie total: 34 m² |
| A5 | 1D / 1B | Superficie total: 33 m² |

### Domeyko 2055

| Plano | Tipología publicada | Superficies por fuente |
| --- | --- | --- |
| A5 | Estudio | Superficie total desde: 27 m² |
| B5 | 1D / 1B | Superficie total desde: 33,26 m² |
| C1 | 2D / 2B | Superficie total desde: 43,04 m² |

### Jofré 157

| Plano | Tipología publicada | Superficies por fuente |
| --- | --- | --- |
| A1 | Estudio | Superficie total desde: 20,77 m² |
| B27 | 1D / 1B | Superficie total desde: 33,7 m² |
| C1 | 2D / 1B | Superficie total desde: 40,97 m² |
| D1 | 2D / 2B | Superficie total desde: 55,33 m² |

### Mirador La Florida

| Plano | Tipología publicada | Superficies por fuente |
| --- | --- | --- |
| D1 | Estudio | Superficie total desde: 23,24 m² |
| A1 | 1D / 1B | Superficie total desde: 34,31 m² |
| A1-3 | 1D / 1B | Superficie total desde: 50,56 m² |
| A2 | 1D / 1B | Superficie total desde: 35,12 m² |
| A3 | 1D / 1B | Superficie total desde: 34,92 m² |
| A4 | 1D / 1B | Superficie total desde: 33,98 m² |
| B1 | 2D / 2B | Superficie total desde: 44,61 m² |
| B2 | 2D / 2B | Superficie total desde: 44,07 m² |
| C1 | 2D / 2B | Superficie total desde: 49,76 m² |

### Plaza Las Condes

| Plano | Tipología publicada | Superficies por fuente |
| --- | --- | --- |
| A2 | Estudio | Superficie total: 33,32 m² |
| B2 | 1D / 1B | Superficie total: 49,49 m² |
| B5 | 1D / 1B | Superficie total: 48,09 m² |
| B9 | 1D / 1B | Superficie total: 51,32 m² |
| B14 | 1D / 1B | Superficie total: 48,58 m² |
| C2 | 2D / 2B | Superficie total: 76,77 m² |
| C4 | 2D / 2B | Superficie total: 83,53 m² |
| C6 | 2D / 2B | Superficie total: 71,93 m² |
| C8 | 2D / 2B | Superficie total: 83,43 m² |

### San Ignacio

| Plano | Tipología publicada | Superficies por fuente |
| --- | --- | --- |
| A3 | Estudio | Superficie total desde: 24,18 m² |
| B1 | 1D / 1B | Superficie total desde: 36,7 m² |
| D1 | 2D / 2B | Superficie total desde: 55 m² |

### Angamos 205

| Plano | Tipología publicada | Superficies por fuente |
| --- | --- | --- |
| Departamento tipo B10-I | 1 dormitorios / 1 baño | Superficie útil: 31,22 m² · Terraza: 2,5 m² · Superficie total: 33,72 m² |
| Departamento tipo C3 | 2 dormitorios / 2 baños | Superficie útil: 45,55 m² · Terraza: 2,55 m² · Superficie total: 48,1 m² |
| Departamento tipo C4 | 2 dormitorios / 2 baños | Superficie útil: 47,39 m² · Terraza: 2,68 m² · Superficie total: 50,07 m² |
| Departamento tipo C6 | 2 dormitorios / 2 baños | Superficie útil: 48,37 m² · Terraza: 2,89 m² · Superficie total: 51,36 m² |
| Departamento tipo A2 | Estudio según pestaña oficial · 1 baño (clasificación por confirmar) | Superficie útil: 22,31 m² · Terraza: 2,31 m² · Superficie total: 24,62 m² |
| Departamento tipo A4 | Estudio según pestaña oficial · 1 baño (clasificación por confirmar) | Superficie útil: 22,89 m² · Terraza: 1,78 m² · Superficie total: 24,67 m² |
