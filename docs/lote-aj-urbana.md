# AJ Urbana — integración documental y revisión protegida

Fecha: 2026-10-10. Rama: `codex/integracion-financiera-sollahms`. Baseline: `045fe182ef5d2ad2206df303ba74330aa747050d`.

[Preview protegida del catálogo](https://project-wrapp-git-codex-integr-460693-lsandoval2-8260s-projects.vercel.app/proyectos.html). El commit de este informe y su despliegue correspondiente se identifican en el historial de la rama.

Se revisaron visualmente las 174 páginas de los cinco PDF originales, las 33 imágenes candidatas y los 78 modelos únicos. Se integran 26 renders adicionales y 78 planos completos, con ampliación y carga diferida. El modelo 6 de Downtown, repetido en páginas 24/25, se presenta una vez. No se redistribuyen los originales PDF, ZIP ni el inventario privado como recursos públicos.

## Alcance comercial y derechos

Precios, estado comercial, entrega, mínimos de superficie y tipologías actuales conservan exactamente sus datos previamente verificados. Los modelos del brochure se presentan en un apartado documental separado y no equivalen a stock. Los cinco proyectos permanecen en categoría E por falta de precio vigente; los otros 143 no se modifican.

Procedencia y correspondencia de las imágenes verificadas. Los PDF no contienen una licencia expresa de redistribución pública. La autorización del usuario permite esta revisión protegida, pero la difusión pública sigue pendiente. El empaquetado incluye el material AJ únicamente en Preview: un build de Production o sin entorno excluye las secciones, renders, planos y CSS del lote, y recupera las fichas originales. La protección SSO de Vercel sigue activa; no se genera un enlace público de bypass.

## Resumen por proyecto

| Proyecto | Renders añadidos | Modelos / planos | Información incorporada |
| --- | ---: | ---: | --- |
| [Downtown San Martín](https://project-wrapp-git-codex-integr-460693-lsandoval2-8260s-projects.vercel.app/downtown-san-martin.html) | 5 | 19 / 19 | Cinco renders de piscina, terraza, sala común e interiores. Se conservan las dos imágenes oficiales existentes y la portada actual. Bicicletero, cowork, lavandería y terminaciones documentadas. |
| [Edificio Teatinos 750](https://project-wrapp-git-codex-integr-460693-lsandoval2-8260s-projects.vercel.app/edificio-teatinos-750.html) | 4 | 15 / 15 | Cuatro renders de fachada, piscina, sala gourmet e interior. Nueva portada de ficha. Equipamiento, mascotas, e-commerce y terminaciones por página. |
| [Edificio Vista Amunategui](https://project-wrapp-git-codex-integr-460693-lsandoval2-8260s-projects.vercel.app/edificio-vista-amunategui.html) | 5 | 19 / 19 | Cinco renders de fachada, piscina, sala común, cowork e interior. Nueva portada de ficha. Amenities y terminaciones coherentes; material de cubierta se mantiene incierto. |
| [Monjitas 690](https://project-wrapp-git-codex-integr-460693-lsandoval2-8260s-projects.vercel.app/monjitas-690.html) | 4 | 2 / 2 | Cuatro renders de espacio común, gourmet, patio y piscina. Se conservan las cuatro imágenes oficiales existentes y la portada. Equipamiento, terminaciones y variante documentada del piso 2. |
| [Vista Morandé](https://project-wrapp-git-codex-integr-460693-lsandoval2-8260s-projects.vercel.app/vista-morande.html) | 8 | 23 / 23 | Ocho renders de fachada, acceso, piscina, quincho, skybar, terraza e interiores. Se conservan las dos imágenes oficiales existentes y la portada. Amenities y correcciones de dos orientaciones. |

## Resultados de verificación

- 174/174 pruebas Node aprobadas, sin omisiones: motores financieros, ahorro CLP, tasas/UF, clasificación A–E, formularios/RUT, reserva, contexto de las 148 fichas, integración del comparador, fuentes oficiales anteriores y lote AJ.
- Validador del catálogo: 148 fichas, 3.347 enlaces internos, 137 mapas, cuatro mapas oficiales de referencia y 154 URL del sitemap; aprobado.
- Integridad frente al baseline: 148 objetos públicos, todos los registros históricos y sus fuentes, 143 HTML y 531 assets existentes idénticos. APIs, navegación global, catálogo, comparador y motores financieros idénticos.
- Cinco fichas verificadas en 1280×900, 820×1100 y 390×844: sin desbordamientos; galerías, métricas de modelos, acordeones y menús correctos. Los 78 planos tienen dimensiones de lectura y SHA verificados; las 26 imágenes conservan exactamente los bytes del candidato original.
- Cinco mapas cargados mediante sus direcciones verificadas. No se incorporaron coordenadas estimadas ni un recorrido de otro proyecto. Las cinco fichas conservan su estado de recorrido virtual pendiente.
- Consulta y agenda conservan el proyecto en sus cinco rutas. Disponibilidad probada con proveedor simulado. Envíos de reserva y contacto bloqueados con respuesta 503 de revisión; registro local: seis comprobaciones simuladas de disponibilidad, una reserva bloqueada, un mensaje bloqueado y cero solicitudes externas.
- Simulación de las cinco rutas de proyecto: ejemplo sintético de 3.000 UF, pie 20%, 25 años y tasa efectiva 4,5% obtiene 13,22 UF / $543.713 con la UF fechada del 10/10/2026. El importe es proporcionado para la prueba, no un precio del proyecto.
- Buscador por renta y pie: filtro AJ Urbana devuelve cinco fichas; ordenamiento permanece operativo; acepta $100.000.000 y $500.000 mensuales, horizonte 24 meses. Las cinco mantienen E / información insuficiente, sin tomar superficies o precios de un brochure como oferta financiera.
- Build real verificado en fixture separado: Preview incluye el lote; Production, entorno ausente y rama ajena no pueden publicar el lote.

## Correcciones realizadas

- Dos orientaciones de Vista Morandé: modelo 13A → SurOriente; modelo 16C → Sur y Norte, según las páginas originales.
- Terrazas omitidas en los brochures representadas como “No indicada”, nunca como una medida cero deducida. Amunátegui modelos 8–10; Morandé 5A–12A, 14B y 15B; Downtown trece modelos.
- Totales aritméticamente discrepantes de Downtown 3 y Teatinos 4 conservan las cifras impresas con advertencia visible.
- Retirados el contexto urbano de Downtown y su dormitorio duplicado; vistas redundantes de Amunátegui y Monjitas también excluidas. Se conservan planos distintos de Teatinos 10/11 pese a superficies iguales.
- Las observaciones documentales están escritas para el visitante; instrucciones editoriales y auditoría de derechos quedan en el registro privado.

## Fuentes, imágenes y pendientes por ficha

### Downtown San Martín

Original: `AJ Urbana - Downtown San Martín.pdf`. 38 páginas. SHA-256: `a5c95f31e3f90b365d0b8edd8340bd6fb7bfdb28172cd30e59dfef854e6643f4`.

Información documentada:

- **Equipamiento:** Lounge exterior (p. 7, 8); Sala gourmet (p. 7, 9); Sala común (p. 7, 10); Cowork (p. 7, 11); Sala de juegos (p. 7, 12); Sky Bar (p. 7, 13); Quinchos (p. 7, 14); Gimnasio (p. 7, 15); Piscina templada (p. 7, 16); Bicicletero (p. 7, 17); Sala de lavado de mascotas (p. 7); Lavandería equipada (p. 7); Sala Property Manager (p. 7); Bodega de encomiendas (p. 7); Lockers con QR (p. 7); Bodega de mudanzas (p. 7); Bodega de maletas (p. 7).
- **Terminaciones:** Luminarias LED (p. 5); Cortinas roller (p. 5); Soporte para TV (p. 5); Cubiertas de cuarzo blanco (p. 5); Ventanas termopanel con marco de PVC (p. 5); Cerradura para renta corta (p. 5); Refrigerador apanelado (p. 5); Piso vinílico (p. 5); Secador de platos (p. 5); Circuito eléctrico individual para estufa eléctrica (p. 5); Circuito eléctrico para aire acondicionado en modelos 1D 1B con terraza señalados; el equipo no está incluido. (p. 20, 21, 28, 29, 32, 37).
- **Características:** Tipologías Home Estudio y 1D 1B (p. 7, 19, 20); 285 unidades según brochure (p. 7); Central de agua caliente, ascensores y CCTV (p. 18).

Imágenes añadidas:

| Página | Contenido | Archivo |
| ---: | --- | --- |
| 5 | Render de living y cocina integrada del departamento. | [downtown-san-martin_pagina_05_candidato.jpeg](../assets/propiedades/aj-urbana-preview/downtown-san-martin/downtown-san-martin_pagina_05_candidato.jpeg) |
| 8 | Render de lounge exterior. | [downtown-san-martin_pagina_08_candidato.jpeg](../assets/propiedades/aj-urbana-preview/downtown-san-martin/downtown-san-martin_pagina_08_candidato.jpeg) |
| 13 | Render de Sky Bar. | [downtown-san-martin_pagina_13_candidato.jpeg](../assets/propiedades/aj-urbana-preview/downtown-san-martin/downtown-san-martin_pagina_13_candidato.jpeg) |
| 15 | Render de gimnasio. | [downtown-san-martin_pagina_15_candidato.jpeg](../assets/propiedades/aj-urbana-preview/downtown-san-martin/downtown-san-martin_pagina_15_candidato.jpeg) |
| 16 | Render de piscina templada. | [downtown-san-martin_pagina_16_candidato.jpeg](../assets/propiedades/aj-urbana-preview/downtown-san-martin/downtown-san-martin_pagina_16_candidato.jpeg) |

Pendientes:

- Modelo 3, página 21: 35,17 m² útiles más 2,68 m² de terraza suman 37,85 m², frente a 37,87 m² de total impreso. Diferencia pendiente de confirmación con la inmobiliaria.
- El modelo 6 aparece repetido en páginas 24 y 25; se muestra una vez.
- Modelo 13: la tabla y la distribución muestran un dormitorio y un baño, aunque el título invierte las siglas.
- Los modelos 1, 4, 5, 6, 7, 8, 11, 12, 14, 15, 16, 17 y 19 no indican una medida de terraza.
- El brochure incluye modelos desde 21,27 m² útiles; su disponibilidad actual no está confirmada. La ficha conserva la superficie comercial previamente verificada.
- La asignación de bicicletero por departamento está documentada para 1 dormitorio y 1 baño; su inclusión para estudios queda pendiente.
- El brochure refiere un recorrido virtual cuya disponibilidad actual sigue pendiente de confirmación.
- Precio y disponibilidad actuales de cada modelo; vigencia de características históricas; licencia documental de difusión pública.

Inventario integrado:

| Modelo | Tipología | Útil m² | Terraza m² | Total impreso m² | Pisos | Orientación | Página |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: |
| 1 | Estudio | 23,71 | No indicada | 23,71 | 2 al 16 | Norte | 19 |
| 2 | 1 dormitorio / 1 baño | 37,07 | 2,86 | 39,93 | 2 al 16 | Poniente | 20 |
| 3 | 1 dormitorio / 1 baño | 35,17 | 2,68 | 37,87 | 2 al 16 | Oriente | 21 |
| 4 | Estudio | 21,30 | No indicada | 21,30 | 2 al 16 | Oriente | 22 |
| 5 | Estudio | 21,27 | No indicada | 21,27 | 2 al 16 | Oriente | 23 |
| 6 | Estudio | 21,57 | No indicada | 21,57 | 2 al 16 | Oriente | 24 |
| 7 | Estudio | 21,40 | No indicada | 21,40 | 2 al 16 | Oriente | 26 |
| 8 | Estudio | 21,31 | No indicada | 21,31 | 2 al 16 | Oriente | 27 |
| 9 | 1 dormitorio / 1 baño | 34,95 | 2,64 | 37,59 | 2 al 16 | Oriente | 28 |
| 10 | 1 dormitorio / 1 baño | 36,76 | 2,96 | 39,72 | 2 al 16 | Poniente | 29 |
| 11 | Estudio | 38,48 | No indicada | 38,48 | 2 al 16 | Sur | 30 |
| 12 | Estudio | 23,85 | No indicada | 23,85 | 2 al 16 | Sur | 31 |
| 13 | 1 dormitorio / 1 baño | 38,36 | 5,28 | 43,64 | 2 al 16 | Sur | 32 |
| 14 | Estudio | 23,51 | No indicada | 23,51 | 2 al 16 | Sur | 33 |
| 15 | Estudio | 24,25 | No indicada | 24,25 | 2 al 16 | Sur | 34 |
| 16 | Estudio | 26,50 | No indicada | 26,50 | 2 al 16 | Norte | 35 |
| 17 | Estudio | 23,55 | No indicada | 23,55 | 2 al 16 | Norte | 36 |
| 18 | 1 dormitorio / 1 baño | 38,10 | 5,58 | 43,68 | 2 al 16 | Norte | 37 |
| 19 | 1 dormitorio / 1 baño | 36,43 | No indicada | 36,43 | 2 al 16 | Norte | 38 |

### Edificio Teatinos 750

Original: `AJ Urbana - Edificio Teatinos 750.pdf`. 32 páginas. SHA-256: `119976d9a6cc9045be5c9ccdedd6c293d0ebdc38be7df3065843a29b88c56327`.

Información documentada:

- **Equipamiento:** Piscina panorámica en azotea (p. 6, 8); Quinchos panorámicos (p. 7, 8); Sala gourmet (p. 7, 9); Gimnasio equipado (p. 7); Cowork (p. 8); Lavandería (p. 8); Áreas verdes (p. 8); Sala e-commerce (p. 10); Sala de lavado de mascotas (p. 10); Bodega de mudanzas (p. 10); Bicicleteros comunes (p. 10); Oficina Property Management (p. 10).
- **Terminaciones:** Cocinas integradas full electric con refrigerador apanelado no frost, encimera y horno (p. 14); Cortinas roller, blackout en dormitorios (p. 14); Soporte para TV y luminarias (p. 14); Cerradura electrónica con control por tarjeta (p. 14); Magnéticos en ventanas de departamentos de pisos 2 y 3 (p. 14); Enchufe de fuerza para estufa eléctrica (p. 14); Pisos vinílicos (p. 14); Cubierta de granito en cocinas (p. 14); Ventanas termopanel (p. 14); Opción de instalar lavadora en departamentos 1D 1B, salvo línea 9. (p. 14).
- **Características:** Central de agua caliente a gas natural, ascensores y CCTV (p. 5); Audio y WiFi en amenities según brochure (p. 6); Ascensor de parking y oficina de administración independiente (p. 16).

Imágenes añadidas:

| Página | Contenido | Archivo |
| ---: | --- | --- |
| 5 | Render de fachada de Edificio Teatinos 750. | [edificio-teatinos-750_pagina_05_candidato.jpeg](../assets/propiedades/aj-urbana-preview/edificio-teatinos-750/edificio-teatinos-750_pagina_05_candidato.jpeg) |
| 6 | Render de piscina panorámica en azotea. | [edificio-teatinos-750_pagina_06_candidato.jpeg](../assets/propiedades/aj-urbana-preview/edificio-teatinos-750/edificio-teatinos-750_pagina_06_candidato.jpeg) |
| 7 | Render de sala gourmet. | [edificio-teatinos-750_pagina_07_candidato.jpeg](../assets/propiedades/aj-urbana-preview/edificio-teatinos-750/edificio-teatinos-750_pagina_07_candidato.jpeg) |
| 11 | Render de living y cocina integrada. | [edificio-teatinos-750_pagina_11_candidato.jpeg](../assets/propiedades/aj-urbana-preview/edificio-teatinos-750/edificio-teatinos-750_pagina_11_candidato.jpeg) |

Pendientes:

- Modelo 4, página 20: 29,72 m² útiles más 4,69 m² de terraza suman 34,41 m², frente a 34,68 m² de total impreso. Diferencia pendiente de confirmación con la inmobiliaria.
- Modelos 8 a 12: el piso 2 no tiene terraza. Sus superficies útiles y totales específicas están pendientes de confirmación.
- Los modelos 10 y 11 tienen las mismas superficies y distribuciones distintas.
- Modelo 15: el brochure indica 17,85 m² útiles y totales; la ficha vigente indica una superficie desde 18,07 m². La disponibilidad del modelo del brochure está pendiente de confirmación.
- Los renders no acreditan el estado actual terminado del proyecto.
- La opción de instalar lavadora excluye la línea 9; no implica que se incluya una lavadora.
- Precio y disponibilidad actuales de cada modelo; vigencia de características históricas; licencia documental de difusión pública.

Inventario integrado:

| Modelo | Tipología | Útil m² | Terraza m² | Total impreso m² | Pisos | Orientación | Página |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: |
| 1 | Estudio | 26,31 | 3,92 | 30,23 | 2 al 16 | Sur | 17 |
| 2 | Estudio | 27,44 | 3,08 | 30,52 | 2 al 16 | Norte | 18 |
| 3 | Estudio | 22,38 | 3,42 | 25,80 | 2 al 16 | Norte | 19 |
| 4 | 1 dormitorio / 1 baño | 29,72 | 4,69 | 34,68 | 2 al 16 | Norte | 20 |
| 5 | 1 dormitorio / 1 baño | 36,79 | 7,10 | 43,89 | 2 al 16 | Norte | 21 |
| 6 | 1 dormitorio / 1 baño | 35,94 | 0,00 | 35,94 | 2 al 16 | Poniente | 22 |
| 7 | 1 dormitorio / 1 baño | 31,64 | 4,66 | 36,30 | 2 al 16 | Oriente | 23 |
| 8 | 1 dormitorio / 1 baño | 30,77 | 4,94 | 35,71 | 2 al 16 | Oriente | 24 |
| 9 | 1 dormitorio / 1 baño | 27,09 | 4,98 | 32,07 | 2 al 16 | Oriente | 25 |
| 10 | 1 dormitorio / 1 baño | 30,44 | 4,94 | 35,38 | 2 al 16 | Oriente | 26 |
| 11 | 1 dormitorio / 1 baño | 30,44 | 4,94 | 35,38 | 2 al 16 | Oriente | 27 |
| 12 | 1 dormitorio / 1 baño | 30,28 | 4,06 | 34,34 | 2 al 16 | Oriente | 28 |
| 13 | Estudio | 23,41 | 0,00 | 23,41 | 2 al 16 | Poniente | 29 |
| 14 | Estudio | 18,58 | 0,00 | 18,58 | 2 al 16 | Poniente | 30 |
| 15 | Estudio | 17,85 | 0,00 | 17,85 | 2 al 16 | Poniente | 31 |

### Edificio Vista Amunategui

Original: `AJ Urbana - Edificio Vista Amunategui.pdf`. 35 páginas. SHA-256: `3a80503b8ef2670deb75c7776724f6d6880128a03b1609484cedb43f452893f4`.

Información documentada:

- **Equipamiento:** Piscina panorámica en azotea (p. 7, 9); Quinchos panorámicos (p. 8, 9); Sala gourmet (p. 8, 10); Sala de eventos (p. 8); Gimnasio equipado (p. 8, 10); Sala cowork (p. 9, 10); Lavandería (p. 9); Áreas verdes (p. 9); Sala e-commerce (p. 11); Bicicleteros comunes (p. 11); Sala de lavado de mascotas (p. 11); Bodega de mudanzas (p. 11); Oficina de administración del arriendo (p. 11); Áreas comunes amobladas con audio y Wifi (p. 7, 10).
- **Terminaciones:** Cocinas integradas full electric con refrigerador apanelado no frost, encimera y horno (p. 14); Pisos vinílicos (p. 14); Ventanas termopanel (p. 14); Cerradura electrónica con tarjeta (p. 14); Cortinas roller y blackout en dormitorios (p. 14); Soporte para TV y luminarias (p. 14); Enchufe para estufa eléctrica (p. 14); Opción de instalación de lavadora (p. 14).
- **Características:** CCTV (p. 6); Ascensores Heavenward–Mitsubishi (p. 6); Central de agua caliente a gas natural (p. 6).

Imágenes añadidas:

| Página | Contenido | Archivo |
| ---: | --- | --- |
| 1 | Fachada del edificio — render del brochure de Edificio Vista Amunátegui | [edificio-vista-amunategui_pagina_01_candidato.jpeg](../assets/propiedades/aj-urbana-preview/edificio-vista-amunategui/edificio-vista-amunategui_pagina_01_candidato.jpeg) |
| 7 | Piscina panorámica — render del brochure de Edificio Vista Amunátegui | [edificio-vista-amunategui_pagina_07_candidato.jpeg](../assets/propiedades/aj-urbana-preview/edificio-vista-amunategui/edificio-vista-amunategui_pagina_07_candidato.jpeg) |
| 8 | Sala común — render del brochure de Edificio Vista Amunátegui | [edificio-vista-amunategui_pagina_08_candidato.jpeg](../assets/propiedades/aj-urbana-preview/edificio-vista-amunategui/edificio-vista-amunategui_pagina_08_candidato.jpeg) |
| 10 | Sala cowork — render del brochure de Edificio Vista Amunátegui | [edificio-vista-amunategui_pagina_10_candidato.jpeg](../assets/propiedades/aj-urbana-preview/edificio-vista-amunategui/edificio-vista-amunategui_pagina_10_candidato.jpeg) |
| 12 | Interior de departamento — render del brochure de Edificio Vista Amunátegui | [edificio-vista-amunategui_pagina_12_candidato.jpeg](../assets/propiedades/aj-urbana-preview/edificio-vista-amunategui/edificio-vista-amunategui_pagina_12_candidato.jpeg) |

Pendientes:

- Precio vigente y disponibilidad comercial de cada modelo pendientes de confirmación.
- La vigencia de las terminaciones y del equipamiento del brochure está pendiente de confirmación.
- Material de cubierta de cocina: el rótulo indica cuarzo blanco y el texto indica granito en página 14. Pendiente de confirmación.
- Superficies específicas del piso 2 sin terraza para modelos 1–7, 13, 16 y 17 pendientes de confirmación.
- La sala común de página 8 recibe distintas denominaciones en el brochure. Su uso específico está pendiente de confirmación.
- Precio y disponibilidad actuales de cada modelo; vigencia de características históricas; licencia documental de difusión pública.

Inventario integrado:

| Modelo | Tipología | Útil m² | Terraza m² | Total impreso m² | Pisos | Orientación | Página |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: |
| 1 | 1 dormitorio / 1 baño | 35,69 | 4,56 | 40,25 | 2 al 16 | Poniente | 16 |
| 2 | 1 dormitorio / 1 baño | 34,14 | 5,10 | 39,24 | 2 al 16 | Poniente | 17 |
| 3 | 1 dormitorio / 1 baño | 35,49 | 5,10 | 40,59 | 2 al 16 | Poniente | 18 |
| 4 | 1 dormitorio / 1 baño | 32,33 | 5,10 | 37,43 | 2 al 16 | Poniente | 19 |
| 5 | 1 dormitorio / 1 baño | 31,08 | 5,12 | 36,20 | 2 al 16 | Poniente | 20 |
| 6 | 1 dormitorio / 1 baño | 30,83 | 5,10 | 35,93 | 2 al 16 | Poniente | 21 |
| 7 | 2 dormitorios / 2 baños | 56,18 | 7,40 | 63,58 | 2 al 16 | Poniente | 22 |
| 8 | 2 dormitorios / 2 baños | 45,17 | No indicada | 45,17 | 2 al 16 | Sur | 23 |
| 9 | 2 dormitorios / 2 baños | 44,89 | No indicada | 44,89 | 2 al 16 | Oriente | 24 |
| 10 | 1 dormitorio / 1 baño | 29,24 | No indicada | 29,24 | 2 al 16 | Oriente | 25 |
| 11 | Estudio | 21,97 | 3,16 | 25,13 | 2 al 16 | Sur | 26 |
| 12 | 1 dormitorio / 1 baño | 32,58 | 5,01 | 37,59 | 2 al 16 | Sur | 27 |
| 13 | 1 dormitorio / 1 baño | 34,81 | 5,51 | 40,32 | 2 al 16 | Norte | 28 |
| 14 | Estudio | 21,57 | 3,12 | 24,69 | 2 al 16 | Norte | 29 |
| 15 | 2 dormitorios / 2 baños | 53,17 | 1,62 | 54,79 | 2 al 16 | Nororiente | 30 |
| 16 | Estudio | 22,06 | 2,92 | 24,98 | 2 al 16 | Norte | 31 |
| 17 | Estudio | 20,99 | 2,88 | 23,87 | 2 al 16 | Norte | 32 |
| 18 | Estudio | 20,82 | 3,70 | 24,52 | 2 al 16 | Sur | 33 |
| 19 | Estudio | 19,77 | 3,58 | 23,35 | 2 al 16 | Sur | 34 |

### Monjitas 690

Original: `AJ Urbana - Monjitas 690.pdf`. 26 páginas. SHA-256: `da6ede0213e85e675ff7531e0640dc55194e375c1e4822244a459c2a837816b1`.

Información documentada:

- **Equipamiento:** Hall de acceso de doble altura (p. 5, 8); Dos salas gourmet (p. 5, 10); Cowork abierto y cubículos (p. 5, 11); Sport bar (p. 5, 12); Lounge y patios interiores (p. 5, 13); Gimnasio y pilates (p. 5, 14); Patio y lavado de mascotas (p. 5, 15); Piscina templada y terrazas panorámicas (p. 5, 9, 16); Quinchos; cantidad pendiente de confirmación (p. 5, 9); Bicicletero con taller (p. 5, 17); Lavandería (p. 5).
- **Terminaciones:** Refrigerador apanelado y cortinas roller (p. 6, 7); Cerradura electrónica (p. 6, 7); Piso vinílico y ventanas termopanel con marco PVC (p. 6, 7); Luminarias LED y soporte para TV (p. 6, 7); Cubierta de cuarzo blanco y secador de platos (p. 6, 7); Receptáculo con showerdoor (p. 6, 7); Circuito individual para estufa eléctrica (p. 6, 7).
- **Características:** Bodega de encomiendas y lockers QR (p. 18); Bodega de mudanzas y oficina de administración (p. 18); Ascensores, central de agua caliente y CCTV (p. 18).

Imágenes añadidas:

| Página | Contenido | Archivo |
| ---: | --- | --- |
| 5 | Espacio común — render ilustrativo | [monjitas-690_pagina_05_candidato.jpeg](../assets/propiedades/aj-urbana-preview/monjitas-690/monjitas-690_pagina_05_candidato.jpeg) |
| 10 | Sala gourmet — render ilustrativo | [monjitas-690_pagina_10_candidato.jpeg](../assets/propiedades/aj-urbana-preview/monjitas-690/monjitas-690_pagina_10_candidato.jpeg) |
| 13 | Patio interior — render ilustrativo | [monjitas-690_pagina_13_candidato.jpeg](../assets/propiedades/aj-urbana-preview/monjitas-690/monjitas-690_pagina_13_candidato.jpeg) |
| 16 | Piscina — render ilustrativo | [monjitas-690_pagina_16_candidato.jpeg](../assets/propiedades/aj-urbana-preview/monjitas-690/monjitas-690_pagina_16_candidato.jpeg) |

Pendientes:

- Cantidad de quinchos: la página 5 indica cinco y la página 9 indica cuatro. Cantidad pendiente de confirmación.
- El brochure identifica modelos 14 y 26, pisos 2 al 16; la web oficial actual identifica modelos 14 y 36, pisos 2 al 6. Correspondencia comercial y disponibilidad pendientes.
- Modelo 26, página 25: variante de piso 2 sin terraza, con 30,88 m² útiles; su superficie total no está publicada.
- Las imágenes y dimensiones son ilustrativas y no acreditan disponibilidad comercial actual.
- Precio y disponibilidad actuales de cada modelo; vigencia de características históricas; licencia documental de difusión pública.

Inventario integrado:

| Modelo | Tipología | Útil m² | Terraza m² | Total impreso m² | Pisos | Orientación | Página |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: |
| 14 | Estudio | 20,82 | 2,68 | 23,50 | 2 al 16 | Poniente | 24 |
| 26 | 1 dormitorio / 1 baño | 35,03 | 5,30 | 40,33 | 2 al 16 | Oriente | 25 |

### Vista Morandé

Original: `AJ Urbana - Vista Morandé.pdf`. 43 páginas. SHA-256: `4e1ac72e7fa333bc944039a50745d935800df80f3d9d8d3f4d01a277207ef628`.

Información documentada:

- **Equipamiento:** Piscina panorámica en azotea con terraza (p. 8); Quinchos panorámicos (p. 8, 9); Gimnasio equipado (p. 8); Sky bar (p. 8, 10); Salón gourmet (p. 8); Sala cowork (p. 8); Lavandería (p. 8); Sala de lavado de mascotas (p. 8); Sala e-commerce con refrigerador (p. 13); Bicicleteros comunes cerrados (p. 13); Bodega de mudanzas (p. 13); Oficina de administración del arriendo (p. 13); Áreas comunes amobladas con audio y Wifi (p. 8).
- **Terminaciones:** Cocinas full electric con refrigerador apanelado no frost, encimera y horno (p. 17); Secaplatos mural (p. 17); Cubierta de granito en cocina (p. 17); Pisos vinílicos (p. 17); Ventanas termopanel (p. 17); Cerradura electrónica con tarjeta (p. 17); Cortinas roller y blackout en dormitorios (p. 17); Soporte para TV y luminarias LED (p. 17); Enchufe para estufa eléctrica (p. 17); Opción de instalación de lavadora (p. 17).
- **Características:** Ascensores con tarjeta de residente (p. 7); CCTV conectado a conserjería y administración (p. 7); Sistema de control de incendios (p. 7); Central de agua caliente a gas natural (p. 7).

Imágenes añadidas:

| Página | Contenido | Archivo |
| ---: | --- | --- |
| 1 | Fachada del edificio — render del brochure de Vista Morandé | [vista-morande_pagina_01_candidato.jpeg](../assets/propiedades/aj-urbana-preview/vista-morande/vista-morande_pagina_01_candidato.jpeg) |
| 7 | Acceso y fachada — render del brochure de Vista Morandé | [vista-morande_pagina_07_candidato.jpeg](../assets/propiedades/aj-urbana-preview/vista-morande/vista-morande_pagina_07_candidato.jpeg) |
| 8 | Piscina panorámica — render del brochure de Vista Morandé | [vista-morande_pagina_08_candidato.jpeg](../assets/propiedades/aj-urbana-preview/vista-morande/vista-morande_pagina_08_candidato.jpeg) |
| 9 | Quincho en azotea — render del brochure de Vista Morandé | [vista-morande_pagina_09_candidato.jpeg](../assets/propiedades/aj-urbana-preview/vista-morande/vista-morande_pagina_09_candidato.jpeg) |
| 10 | Sky bar — render del brochure de Vista Morandé | [vista-morande_pagina_10_candidato.jpeg](../assets/propiedades/aj-urbana-preview/vista-morande/vista-morande_pagina_10_candidato.jpeg) |
| 11 | Terraza de áreas comunes — render del brochure de Vista Morandé | [vista-morande_pagina_11_candidato.jpeg](../assets/propiedades/aj-urbana-preview/vista-morande/vista-morande_pagina_11_candidato.jpeg) |
| 14 | Interior de departamento — render del brochure de Vista Morandé | [vista-morande_pagina_14_candidato.jpeg](../assets/propiedades/aj-urbana-preview/vista-morande/vista-morande_pagina_14_candidato.jpeg) |
| 16 | Dormitorio — render del brochure de Vista Morandé | [vista-morande_pagina_16_candidato.jpeg](../assets/propiedades/aj-urbana-preview/vista-morande/vista-morande_pagina_16_candidato.jpeg) |

Pendientes:

- Precio vigente, fecha de entrega y disponibilidad de cada modelo pendientes de confirmación.
- La vigencia de las terminaciones y del equipamiento del brochure está pendiente de confirmación.
- Los estudios 13A y 18A del brochure tienen 17,04 y 19,42 m² útiles. Su disponibilidad comercial actual está pendiente de confirmación; se conserva la oferta verificada de la ficha.
- El recorrido referido en página 14 del brochure tiene identidad exacta y accesibilidad pendientes de confirmación.
- Precio y disponibilidad actuales de cada modelo; vigencia de características históricas; licencia documental de difusión pública.

Inventario integrado:

| Modelo | Tipología | Útil m² | Terraza m² | Total impreso m² | Pisos | Orientación | Página |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: |
| 1A | 2 dormitorios / 1 baño | 39,47 | 2,47 | 41,94 | 2 al 24 | Poniente | 20 |
| 2A | 1 dormitorio / 1 baño | 32,43 | 4,40 | 36,83 | 2 al 24 | Poniente | 21 |
| 3A | 1 dormitorio / 1 baño | 32,43 | 4,40 | 36,83 | 2 al 20 | Poniente | 22 |
| 3B | 2 dormitorios / 2 baños | 49,14 | 7,93 | 57,07 | 21 al 24 | Poniente | 23 |
| 4A | 1 dormitorio / 1 baño | 32,33 | 5,18 | 37,51 | 2 al 20 | Poniente | 24 |
| 5A | 1 dormitorio / 1 baño | 33,67 | No indicada | 33,67 | 2 al 16 | Poniente | 25 |
| 6A | 1 dormitorio / 1 baño | 32,64 | No indicada | 32,64 | 2 al 16 | Oriente | 26 |
| 7A | 1 dormitorio / 1 baño | 30,91 | No indicada | 30,91 | 2 al 16 | Oriente | 27 |
| 8A | 1 dormitorio / 1 baño | 32,03 | No indicada | 32,03 | 2 al 16 | Oriente | 28 |
| 9A | 1 dormitorio / 1 baño | 32,05 | No indicada | 32,05 | 2 al 16 | Oriente | 29 |
| 10A | 1 dormitorio / 1 baño | 33,19 | No indicada | 33,19 | 2 al 16 | Oriente | 30 |
| 11A | 1 dormitorio / 1 baño | 29,12 | No indicada | 29,12 | 3 al 16 | Oriente | 31 |
| 12A | 1 dormitorio / 1 baño | 31,10 | No indicada | 31,10 | 3 al 16 | Oriente | 32 |
| 13A | Estudio | 30,17 | 3,34 | 33,51 | 3 al 16 | SurOriente | 33 |
| 14A | 1 dormitorio / 1 baño | 30,76 | 5,62 | 36,38 | 3 al 16 | Sur | 34 |
| 14B | 2 dormitorios / 2 baños | 46,72 | No indicada | 46,72 | 2 | Sur | 35 |
| 15A | 1 dormitorio / 1 baño | 31,64 | 4,98 | 36,62 | 3 al 16 | Sur | 36 |
| 15B | 2 dormitorios / 2 baños | 49,09 | No indicada | 49,09 | 2 | Sur | 37 |
| 16A | 1 dormitorio / 1 baño | 32,70 | 2,36 | 35,06 | 3 al 16 | Sur | 38 |
| 16B | 2 dormitorios / 2 baños | 49,53 | 4,33 | 53,86 | 2 | Norte | 39 |
| 16C | 1 dormitorio / 1 baño | 35,46 | 7,61 | 43,07 | 17 al 20 | Sur y Norte | 40 |
| 17A | 1 dormitorio / 1 baño | 32,52 | 1,49 | 34,01 | 3 al 16 | Norte | 41 |
| 18A | Estudio | 17,04 | 2,38 | 19,42 | 3 al 16 | Norte | 42 |

## Continuación y reproducción

El registro privado `data/brochures-aj-urbana.json` mantiene los SHA de documentos, candidatos y planos, páginas, selección/rechazos, excepciones y estado de derechos. Los PDF originales permanecen en el ZIP facilitado por el usuario. Para reconstruir assets con Pillow y Poppler:

```sh
python3 scripts/materialize-aj-brochures.py --input /ruta/Lote_AJ_Urbana_Sollahms --pdftoppm /ruta/pdftoppm
python3 scripts/build-project-details.py --slugs downtown-san-martin,edificio-teatinos-750,edificio-vista-amunategui,monjitas-690,vista-morande --review-date 2026-10-10 --branch codex/integracion-financiera-sollahms
VERCEL_ENV=preview VERCEL_GIT_COMMIT_REF=codex/integracion-financiera-sollahms node scripts/package-vercel.mjs
```

No se modifica main, no se fusionan otras ramas y no se realiza promoción ni despliegue de Production. El lote queda preparado para revisión; la licencia de difusión pública y las diferencias documentales señaladas siguen pendientes.
