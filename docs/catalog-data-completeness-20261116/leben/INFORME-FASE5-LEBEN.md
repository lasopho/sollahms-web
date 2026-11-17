# Leben — conciliación técnica y solicitudes mínimas, fase 5

Corte documental: **16/11/2026, America/Santiago**. Rama `codex/auditoria-leben-20261116`, base remota verificada `2774b10bff3e74d186359f7793fa8712866a83fb`.

**Se conservan 313 pendientes.** La revisión no encontró una nueva fuente primaria que permita cerrar campos o resolver conflictos. La intervención se concentra en **una precisión del propietario sobre la especificación comercial de INN**, **once conflictos que necesitan respaldo técnico** y **trece paquetes documentales por proyecto**. F3-C001 permanece como limitación adicional de aplicabilidad.

## Resultado y alcance

| Resultado | Cantidad | Interpretación |
| --- | ---: | --- |
| Conflictos resueltos en fase 5 | 0 | Los doce casos siguen abiertos. |
| Conflictos que admiten precisión del propietario | 1 | D-03, material comercial vigente y alcance por modelo o versión. |
| Conflictos que requieren respaldo técnico específico | 11 | No se someten cantidades físicas a una elección personal. |
| Limitaciones adicionales | 1 | F3-C001 no es un decimotercer conflicto. |
| Campos completos nuevos | 0 | Agrupar solicitudes no completa datos. |
| Campos parcialmente enriquecidos por evidencia nueva | 0 | Las precisiones de transcripción ya constaban en el corte anterior. |
| Fuentes primarias nuevas / PDF originales nuevos | 0 / 0 | El adjunto de esta fase contiene instrucciones. |
| Pendientes iniciales / finales | 313 / 313 | Se conserva cada clave y su historial. |

El universo de 689 campos conserva **215 confirmados** (196 documentales y 19 por propietario), **161 parciales**, **177 desconocidos**, **26 contradictorios**, **99 propuestas false de catálogo**, **9 históricos no vigentes** y **2 no aplicables**. Confirmados: 215/689 = **31,20 %**. Una propuesta false por silencio del brochure no prueba ausencia física. Los 26 campos contradictorios del universo incluyen diferencias de dirección archivadas fuera de preguntas y no equivalen a 26 casos activos.

La distribución de base sigue siendo **6 campos comerciales previos Santo/BAUM + 20 campos afectados por contradicciones + 287 campos documentales o de alcance**. Para organizar el trabajo, 306 campos necesitan respaldo documental/técnico, uno la precisión D-03 y seis mantienen solicitudes comerciales anteriores en espera. Esta clasificación operativa no altera estados ni convierte los campos en preguntas.

## Conciliación de los doce casos

Está confirmada la **lectura registrada de cada fuente**. La divergencia impide confirmar automáticamente el hecho físico de la unidad, la equivalencia de modelos o la vigencia de una especificación. Las declaraciones generales F049 tampoco resuelven una contradicción particular. Las referencias, rutas, URLs, IDs de hechos y SHA disponibles se conservan en [el dossier](fase5-20261116/DOSSIER-CONFLICTOS.json) y [el CSV técnico](fase5-20261116/CONFLICTOS-TECNICOS-LEBEN.csv).

| Caso / proyecto | Unidad o modelo | Fuente A | Fuente B | Precisión o respaldo mínimo |
| --- | --- | --- | --- | --- |
| IR-C001 · Living Town | A1 / unidades 603 y 803 | DOM: Modelo A1, 2 dormitorios y 2 baños en603 y803. [F023] | Plano A1:2D/1B. No imprime alcance de unidades. [IR-P020] | Confirmar baños y aplicabilidad de la versión A1 para603/803 con respaldo específico; no extender la categoría general al modelo. |
| IR-C003 · Mood | A / unidad303; gráfico rotulado DEPTO201 | DOM de303: Modelo A, 2 dormitorios y2 baños. [F024] | Gráfico Modelo A:1,5D+2B; observación previa transcribe DEPTO201. [IR-P035] | Precisar dormitorio/clasificación del ambiente adicional y versión aplicable a303, además de acreditar si el gráfico201 corresponde. |
| CAP-A-ALCANCE · Capitanes | A / unidades501 y601 | DOM501/601: Modelo A,3D/3B,87.01m² Internos y18.45m² Terraza. [F028] | Plano A imprime Deptos.201 al301: interior87,01; terraza18,45; logia3,55; total109,01m². [IR-P099] | Precisar aplicabilidad del plano A a501/601 y sus métricas exactas, sin equiparar Internos a Interior por coincidencia numérica. |
| BOLD-S1-TIPOLOGIA · Bold | S1 / unidad312 | Descripción DOM: Tipo Estudio S1. Baños1; campo numérico dormitorios no publicado. [F029] | Plano S1:1D/1B. [IR-P101] | Determinar la tipología técnica de312/S1: estudio o1D, con correspondencia del plano. |
| BOLD-F-SUPERFICIES · Bold | F / unidades207,307,508,608 | DOM207/307/508:61.67m² Internos y3.71m² Terraza. DOM608:63.44m² Internos y3.71m² Terraza. [F029] | IR-P108 enlazado a608: interior62,40; terraza3,12; total65,52m². Alcance impreso:Deptos.207 al407,508 y608. P106(207/307) yP107(508) no imprimen esas áreas. [IR-P106, IR-P107, IR-P108] | Precisar qué versión de plano/cuadro de superficies rige cada una de las cuatro unidades y qué métrica denomina Internos en UI. |
| ARG-C-C1 · Argomedo | C1(UI) / C(gráfico), unidad915 | DOM915: Modelo C1,2D/2B. [F030] | Plano adjunto: Modelo C,2D/2B. [IR-P109] | Acreditar el código/versión aplicable a915 y si C yC1 son equivalentes o planos diferentes. |
| INDI-D-PLANO-A2 · Indi | D(UI) / A2(gráfico), unidad607 | DOM607: Modelo D,2D/1B. [F031] | Gráfico adjunto: Modelo A2,1D/1B; el nombre del archivo dice modelo-d. [IR-P114] | Precisar modelo y cantidad de dormitorios de607; obtener recurso correcto o equivalencia oficial sin elegir por el archivo. |
| INDI-A4-PLANO-C1 · Indi | A4(UI) / C1(gráfico), unidad411 | DOM411: Modelo A4,2D/2B. [F031] | Plano adjunto: Modelo C1,2D/2B. [IR-P116] | Precisar el código aplicable a411 y la relación A4/C1. |
| IR-C020 · INN Puerto Chico | S / unidad605, TorreA en gráfico | DOM605: Modelo S,3D/3B. [F033] | Plano S:3D/2B; alcance TorreA-Depto605,705. [IR-P138] | Determinar número de baños y versión vigente de605, sin contar recintos o niveles por geometría. |
| IR-C021 · INN Puerto Chico | R / unidad604, TorreA en gráfico | DOM604: Modelo R,4D/4B. [F033] | Plano R:5D/4B; alcance TorreA-Depto604,704. [IR-P139] | Precisar dormitorios y criterio de clasificación de604/R con respaldo específico; no presumir la causa4/5. |
| IR-C022 · INN Puerto Chico | Q / unidad603, TorreA en gráfico | DOM603: Modelo Q,4D/4B. [F033] | Plano Q:5D/4B; alcance TorreA-Depto603,703. [IR-P140] | Precisar dormitorios y criterio de clasificación de603/Q con respaldo específico. |
| D-03 · INN Puerto Chico | Modelos/versiones por precisar; solicitud L-047 | Brochure F005 p.4: Cuarzo en cocina; antecedente directo F021 línea87: Cuarzo, sin fecha/alcance de modelos. | F014, verificación oficial archivada09/10/2026: Cubierta de cocina ultracompacto con terminación travertino. No hay gráfico de material que dirima este caso. [F014] | Indicar material comercial vigente y su alcance por modelo/versión; si coexisten ambas especificaciones, delimitar cada una. Si no puede precisarlo con respaldo, pedir memoria de terminaciones, sin seleccionar por defecto. |

Mood conserva el rótulo 1,5D y la observación previa DEPTO 201: no se redondea a 2D ni se acredita su aplicación a 303. Bold F tiene tres recursos distintos: IR-P106 para 207/307, IR-P107 para 508 e IR-P108 enlazado a 608. Solo este último contiene el cuadro 62,40 interior / 3,12 terraza / 65,52 total y su alcance impreso. No se transfieren esas medidas a los otros recursos o unidades.

**F3-C001, fuera de los doce casos:** IR-P125 imprime Torre B, departamento 406, interior 88,8 / terraza 26,36 / patio 20,7 / total 135,86 m². La UI lo enlaza también a 806/906, sin que estas unidades estén impresas. Obtener aplicabilidad expresa o sus planos específicos. Ni la torre ni las métricas del gráfico se trasladan por el enlace compartido.

Para D-03 se pide identificar el material comercial vigente y su alcance. Si ambas especificaciones corresponden a versiones diferentes, hay que delimitar cada versión. Si el propietario no puede precisarlo con respaldo, se necesita la memoria de terminaciones aplicable. No se selecciona un material por defecto ni por semejanza.

## Documentos concretos que faltan

Los 287 campos documentales se asignan **una sola vez** a trece paquetes. Cada paquete puede componerse de extractos existentes: no exige crear un nuevo brochure ni reenviar documentos ya revisados. Los once conflictos técnicos pueden incorporarse al mismo envío del proyecto.

| Proyecto | Paquete | Pendientes conservados | Campos documentales asignados | Alcance del paquete |
| --- | --- | ---: | ---: | --- |
| Edificio Living Town | F5-DOC-01 | 18 | 17 | Alcance de F049, sin nuevos importes, Modelos, versiones y asociaciones de unidades, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| Edificio Mood | F5-DOC-02 | 25 | 24 | Modelos, versiones y asociaciones de unidades, Alcance de F049, sin nuevos importes, Calendario/no aplicabilidad explícita de entrega, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| Edificio Santo | F5-DOC-03 | 25 | 22 | Modelos, versiones y asociaciones de unidades, Calendario/no aplicabilidad explícita de entrega, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| Edificio BAUM | F5-DOC-04 | 21 | 18 | Modelos, versiones y asociaciones de unidades, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| Edificio Suecia | F5-DOC-05 | 22 | 22 | Modelos, versiones y asociaciones de unidades, Alcance de F049, sin nuevos importes, Calendario/no aplicabilidad explícita de entrega, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| Capitanes | F5-DOC-06 | 20 | 16 | Modelos, versiones y asociaciones de unidades, Alcance de F049, sin nuevos importes, Calendario/no aplicabilidad explícita de entrega, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| Edificio Bold | F5-DOC-07 | 27 | 21 | Modelos, versiones y asociaciones de unidades, Alcance de F049, sin nuevos importes, Calendario/no aplicabilidad explícita de entrega, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| Edificio Argomedo | F5-DOC-08 | 23 | 21 | Modelos, versiones y asociaciones de unidades, Alcance de F049, sin nuevos importes, Calendario/no aplicabilidad explícita de entrega, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| Edificio Indi | F5-DOC-09 | 23 | 20 | Modelos, versiones y asociaciones de unidades, Alcance de F049, sin nuevos importes, Calendario/no aplicabilidad explícita de entrega, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| Edificio Índigo | F5-DOC-10 | 22 | 22 | Modelos, versiones y asociaciones de unidades, Alcance de F049, sin nuevos importes, Calendario/no aplicabilidad explícita de entrega, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| INN Puerto Chico | F5-DOC-11 | 20 | 17 | Modelos, versiones y asociaciones de unidades, Alcance de F049, sin nuevos importes, Superficies y métrica de los valores sin clasificar, Terminaciones y equipamiento privado faltantes |
| Edificio Nórdico | F5-DOC-12 | 32 | 32 | Modelos, versiones y asociaciones de unidades, Alcance de F049, sin nuevos importes, Superficies y métrica de los valores sin clasificar, Equipamiento común aún sin respaldo, Terminaciones y equipamiento privado faltantes |
| Own | F5-DOC-13 | 35 | 35 | Modelos, versiones y asociaciones de unidades, Calendario/no aplicabilidad explícita de entrega, Superficies y métrica de los valores sin clasificar, Equipamiento común aún sin respaldo, Terminaciones y equipamiento privado faltantes |

| Grupo documental | Campos de los 287 | Documento o extracto útil |
| --- | ---: | --- |
| Inventario, versiones y asociaciones | 76 | Listado técnico con código, dormitorios/baños, versión y unidades a las que aplica. |
| Superficies y métrica original | 86 | Planos/cuadros legibles con cada métrica rotulada y alcance de unidades/versiones. Otros cinco campos de superficies están entre los conflictos. |
| Terminaciones y equipamiento privado | 73 | Memoria de terminaciones o ficha de especificaciones aplicable. |
| Entrega documental o calendario | 19 | Respaldo fechado del calendario si existe, o no aplicabilidad expresa; recepción final no determina año/semestre. |
| Alcance de lo ya declarado en F049 | 17 | Correspondencia de categoría/modelo/versión o cobertura, sin pedir nuevos importes ni ratificar los aceptados. |
| Equipamiento común aún sin brochure | 16 | Documento técnico de Nórdico/Own sobre los campos todavía sin respaldo. |

INN agrupa cuatro anexos dentro de F5-DOC-11, **sin sumar campos ni cuatro solicitudes independientes**:

- F5-ANX-INN-01: PDF original de 616 / modelo UI N, `694a1152bb220_pc-f-15-04.pdf`.
- F5-ANX-INN-02: PDF original de 513 / B2, `694a0be8bd379_pc-f-03-04.pdf`.
- F5-ANX-INN-03: PDF original de 601 / O1, `694a0b8a05509_pc-f-17-04.pdf`.
- F5-ANX-INN-04: aplicabilidad expresa de F/406 a 806/906 o planos correctos de estas unidades.

Los tres originales no se recibieron. Sus hashes documentales permanecen vacíos. No se repitió la exportación fallida ni se emplearon endpoints privados, URLs inventadas o solicitudes externas. El documento adicional de condiciones INN, de contenido no recuperado, no se transforma en una petición técnica por suposición.

Los detalles por grupo, campos e IDs L de origen constan en [DOCUMENTOS-REALMENTE-FALTANTES-LEBEN.csv](fase5-20261116/DOCUMENTOS-REALMENTE-FALTANTES-LEBEN.csv) y [MAPEO-DOCUMENTOS.json](fase5-20261116/MAPEO-DOCUMENTOS.json). La coordinación resumida está en [SOLICITUDES-FINALES-POR-PROYECTO.csv](fase5-20261116/SOLICITUDES-FINALES-POR-PROYECTO.csv).

## Plantilla para respuesta

El [Excel](fase5-20261116/outputs/leben-fase5-20261116/DECISIONES-PENDIENTES-PROPIETARIO-LEBEN.xlsx) contiene tres hojas:

- **Propietario:** una fila, D-03. Respuesta y observaciones vacías.
- **Respaldo técnico:** once casos y F3-C001 identificado como límite, con A/B y alcance exacto. El propietario puede aportar o coordinar el documento; no debe elegir arbitrariamente la realidad física.
- **Documentos:** trece paquetes con los cuatro anexos INN dentro de su proyecto, diecisiete filas en total.

Las celdas amarillas son los campos de respuesta. Una celda rellenada no cierra automáticamente un pendiente. Al recibirla hay que comprobar proyecto, modelo/unidad, alcance, fuente, fecha y contradicciones; conservar el original y su SHA antes de cambiar el estado documental.

## Información aceptada que se conserva

Se mantienen los veinte precios de inmuebles y los dos adicionales de Suecia, declarados por el propietario el 16/11/2026 en F049 / COM-F4-001. No se vuelven a pedir, no se sustituyen por Iris ni se exige vigencia futura. Las trece direcciones quedan fuera de preguntas. Suecia conserva literalmente **Modelo 203**, no unidad 203 ni modelo Iris F/206. Capitanes conserva **unidad 501**, no modelo 501. INN conserva 2D UF 10.500, 3D UF 10.016 y 4D UF 21.869.

Los seis campos comerciales de Santo/BAUM siguen en espera bajo L-009/L-013, sin reeditar B1A ni agregar otra ronda. Own permanece vendido, sin solicitar precio o disponibilidad. Estacionamiento y bodega son adicionales en los diez proyectos con cotización; los costos Suecia no se mezclan con precios de inmueble.

## Integridad y continuidad

Se preservan las matrices canónicas de datos y los cortes Iris/fase 3/fase 4 sin cambios de contenido. [PENDIENTES-ACTUALIZADOS-LEBEN.csv](fase5-20261116/PENDIENTES-ACTUALIZADOS-LEBEN.csv) conserva las 313 filas de fase 4 y añade solo metadatos de coordinación. La maestra conserva las 131 identidades y todas sus columnas anteriores, con metadatos fase 5 únicamente para Leben. Las otras 118 filas no reciben una auditoría nueva.

La [auditoría de novedad](fase5-20261116/AUDITORIA-NUEVA-EVIDENCIA.json) documenta la comparación con la base. El [manifiesto histórico](../historico/fase4-2774b10/MANIFIESTO-BASE.json) preserva preimágenes de prompts, manual y maestra/global. [RESUMEN-FASE5.json](fase5-20261116/RESUMEN-FASE5.json), [VERIFICACION-FASE5.json](fase5-20261116/VERIFICACION-FASE5.json) y [VERIFICACION-EXCEL.json](fase5-20261116/VERIFICACION-EXCEL.json) permiten comprobar cantidades, integridad y plantilla.

No hubo navegación nueva ni relectura de los once brochures, 210 gráficos o doce plantillas técnicas. El manual incorpora el procedimiento de recepción por paquete y conserva la autenticación interactiva en Chrome. El trabajo sigue siendo exclusivamente documental, en la rama con deployments excluidos. La sincronización y el árbol limpio se comprueban al terminar; no se declara cerrada Leben ni se inicia Euro.

El [siguiente prompt completo](fase5-20261116/SIGUIENTE-PROMPT.md) contiene el contexto y las restricciones para recibir respuestas o documentos sin repetir esta exploración.
