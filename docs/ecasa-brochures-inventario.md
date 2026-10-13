# Ecasa: inventario documental de las 22 entradas

Revisión del 12/10/2026. El ZIP recibido contiene 17 originales PDF coincidentes por SHA-256 con los originales locales, 15 contenidos únicos, tres capturas comerciales privadas, 57 páginas de referencia y 248 candidatos gráficos. Se revisaron originales, inventarios e instrucciones. La composición de cartera sigue la instrucción expresa del titular: 22 entradas; las restricciones antiguas del paquete a 23 fichas quedan sustituidas por esta instrucción.

Se seleccionaron **56 imágenes y 74 planos individuales (130 derivados)**: 14 fichas tienen nuevas galerías, 12 tienen planos documentados. Cada recurso conserva documento, página, recorte normalizado, dimensiones y SHA-256. Los originales y capturas permanecen fuera de Git y del output público. Los ceros de la tabla corresponden al nuevo lote; los recursos oficiales previamente acreditados se conservan en sus fichas.

| Entrada autorizada | Imágenes nuevas del lote | Planos nuevos | Alcance o pendiente |
| --- | ---: | ---: | --- |
| Lomas de Puyai | 0 | 0 | Sin brochure específico |
| FerroParque | 4 | 0 | Desarrollo homónimo documentado; modelos no asignados por etapa |
| Bezanilla | 4 | 3 | Desarrollo homónimo documentado |
| Endémico | 6 | 4 | Desarrollo homónimo documentado |
| Terratoltén 1 | 4 | 5 | Desarrollo homónimo documentado |
| Edificio Wayra | 5 | 3 | Desarrollo homónimo documentado |
| Alto San Joaquín 3 | 0 | 0 | Sin brochure específico |
| Enlace Mackenna | 1 | 9 | Desarrollo homónimo documentado |
| Ferroparque 2 | 0 | 0 | Sin brochure específico |
| Espacio Victoria | 3 | 9 | Desarrollo homónimo documentado |
| Lamara | 4 | 4 | Desarrollo homónimo documentado |
| Terratoltén 3 | 0 | 0 | Sin brochure específico |
| Lomas de Puyai 3 | 0 | 0 | PDF menciona segunda etapa; correspondencia pendiente |
| Cumbres de Peñuelas | 2 | 9 | Desarrollo homónimo documentado |
| Aires La Florida 2 | 4 | 6 | Desarrollo homónimo documentado |
| Conecta Huechuraba | 4 | 6 | Desarrollo homónimo documentado |
| Urban La Florida | 6 | 0 | Desarrollo homónimo documentado; el documento no trae planos individuales |
| Alto San Joaquín | 5 | 8 | Desarrollo homónimo documentado |
| Alto San Joaquín 2 | 0 | 0 | PDF duplicado; alcance de etapa pendiente |
| Núcleo Costanera | 4 | 8 | Desarrollo homónimo documentado |
| Terratoltén 2 | 0 | 0 | Sin brochure específico |
| Núcleo Costanera 2 | 0 | 0 | PDF duplicado; alcance de etapa pendiente |

Las fotos reales de Endémico se distinguen de los renders y del contexto urbano. Las superficies de sus casas se imprimen como **interior**, no útil: Docas 72 + 33 = 105 m²; Boldo 84 + 35 = 119 m²; Ciprés 102 + 41 = 143 m²; Molle 119 + 41 = 160 m². Los modelos A y B conservan el aviso de agotados del documento como información referencial; ningún brochure actualiza el stock comercial.

Cumbres de Peñuelas integra sólo los nueve modelos promocionales de páginas 17 a 25. A1, B1, C1 y E1 distinguen útil, terraza y terraza cubierta; no se confunden sus totales con área útil. Se excluyen las plantas técnicas de páginas 4 a 14. La descripción contradictoria de pisos por tipo en página 16 queda pendiente.

FerroParque conserva únicamente imágenes y equipamiento del desarrollo homónimo. Sus planos generales incluyen tipologías fuera de la ficha comercial vigente: no se asignan a FerroParque o Ferroparque 2 sin respaldo por etapa. Terratoltén 1 menciona edificios 1 y 2, lo que no equivale automáticamente a las etapas comerciales 1 y 2. Alto San Joaquín 3 no recibe planos de otra etapa.

Enlace Mackenna imprime 31 a 41 m² en el encabezado y 49/57 m² en algunos modelos; se mantienen los valores impresos de cada modelo. Su portada imprime 5859 y su mapa 5889; se conserva la dirección oficial vigente. Aires La Florida 2 imprime Almahue 6424; no reemplaza su dirección vigente.

La autorización Ecasa para promoción pública web sigue pendiente de contraste contractual independiente. La instrucción del titular autoriza preparar la **Preview protegida**. Los acuerdos AJ Urbana/Ingevec no se reutilizan como cobertura Ecasa. No se publican capturas, comisiones, contratos ni condiciones históricas de los PDF.

Reconstrucción con Python 3, Pillow, pypdf y Poppler: `python3 scripts/materialize-ecasa-brochures.py --input /directorio/privado/con/los/17/originales`. El materializador exige que los hashes PDF y las dimensiones coincidan con el manifiesto y reproduce los recortes y el encoder aprobados. El paquete privado de Preview transporta únicamente los 130 derivados seleccionados, sin originales o inventarios comerciales.

Verificación documental y de medios: 17 originales coinciden con el ZIP, 130 hashes y dimensiones de derivados correctos, validación de procedencia y derechos de Preview aprobada. Una reconstrucción independiente desde dos páginas originales reprodujo los hashes de cinco medios, sin modificar el manifiesto ni los recursos seleccionados. El resto de las pruebas de aplicación y despliegue se registra en el cierre de la tarea.

Durante la comprobación viva de recorridos, el visor `https://tourvirtuales360.cl/pano/ecasa_/nucleo_pilotos/` identificado anteriormente en la matriz mostró inequívocamente **Núcleo Costanera 2** en la portada, en la barra lateral y en el título del documento del proveedor. Tras pulsar su control nativo se confirmó el panorama aéreo. Esta evidencia respalda reasignar **únicamente ese recorrido ya aprobado** a Núcleo Costanera 2, manteniendo su URL y carga automática. No acredita el alcance del brochure duplicado ni transfiere imágenes, planos o superficies de la matriz. El recorrido de la matriz queda pendiente de documentación específica.

La QA viva de siete proveedores Ecasa comprobó navegación automática y estructura de iframe en Chrome de escritorio, sin sustituir proveedores por fixtures. Se confirmaron escenas visibles en Bezanilla, Espacio Victoria, FerroParque y en el recorrido que corresponde a Núcleo Costanera 2. Lamara y Terratoltén 3 cargaron sus panoramas y controles, pero la comprobación acotada no confirmó la salida de la portada nativa hacia la exploración completa. Endémico llegó como máximo al mensaje «Cargando tour virtual Casa D» en dos comprobaciones acotadas: su escena final queda pendiente del proveedor. El enlace alternativo de Endémico sigue siendo externo y no se fuerza su integración en iframe.

El mapa Google de Núcleo Costanera mostró mosaicos, marcador y atribución reales en escritorio de 1440 px y móvil de 390 px. Estas verificaciones no enviaron formularios, reservas ni mensajes, no modificaron Production y no se presentan como pruebas financieras en vivo. El informe y las capturas de proveedores se conservan en el directorio privado de QA de la tarea.
