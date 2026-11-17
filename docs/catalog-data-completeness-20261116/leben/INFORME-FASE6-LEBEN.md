# Leben — recepción preparada y saldo documental, fase 6

Corte: **16/11/2026, America/Santiago**. HEAD local y remoto de inicio: `da5506875cf2f09133e883db55d3e8717d88c95d`; árbol inicial limpio. El encargo de fase 6 no incluye nuevos archivos ni respuestas inmobiliarias. No se registra como una recepción comercial o técnica.

**Recepción preparada; se conservan los 313 pendientes.** No hubo incorporación de datos ni resolución de conflictos. Quedan disponibles registros vacíos y un procedimiento verificable para procesar antecedentes reales del propietario, sin repetir las consultas anteriores.

## Resultado real

| Indicador | Resultado |
| --- | ---: |
| Documentos o declaraciones nuevos recibidos | 0 |
| Hechos nuevos validados | 0 |
| Campos completados realmente | 0 |
| Campos enriquecidos parcialmente en esta fase | 0 |
| Conflictos resueltos | 0 |
| Campos pendientes antes / después | 313 / 313 |
| Campos parciales dentro del saldo pendiente | 107 |
| Desconocidos / contradictorios / históricos dentro del saldo | 177 / 20 / 9 |

Los 689 campos del universo conservan 215 confirmados (196 por documento y 19 por propietario), **161 parciales** en total, 177 desconocidos, 26 contradictorios, 99 propuestas false de catálogo, 9 históricos y 2 no aplicables. Los 107 parciales del saldo son un subconjunto de los 161 del universo. La cobertura confirmada permanece **215/689 = 31,20 %**. False de catálogo no prueba ausencia física.

Los **313 campos necesitan intervención adicional**: 306 respaldo documental/técnico, uno la precisión de especificación D-03 y seis las esperas comerciales previas Santo/BAUM. Se conserva la partición de origen: 287 documentales/de alcance, 20 campos de contradicción y 6 comerciales. Las filas de datos no se convierten en nuevas preguntas.

## Recepción sin registros ficticios

- [REGISTRO-RECEPCION-DOCUMENTOS.csv](fase6-20261116/REGISTRO-RECEPCION-DOCUMENTOS.csv): solo encabezado, cero recepciones. Incluye fecha, nombre original, proyecto, paquete, SHA-256, localizador y campos potencialmente respaldados.
- [HECHOS-VALIDADOS-FASE6.csv](fase6-20261116/HECHOS-VALIDADOS-FASE6.csv): solo encabezado, cero hechos. Cada futura fila debe conservar literal, rótulo, alcance, recepción y fuente.
- [CONFLICTOS-RESUELTOS.csv](fase6-20261116/CONFLICTOS-RESUELTOS.csv): solo encabezado, cero resoluciones. Las aclaraciones parciales no se presentan como casos resueltos.
- [PENDIENTES-ACTUALIZADOS.csv](fase6-20261116/PENDIENTES-ACTUALIZADOS.csv): las 313 claves y todas las columnas previas intactas, más estado de recepción y trazabilidad F6 sin cambios de datos.
- [DOCUMENTOS-AUN-FALTANTES.csv](fase6-20261116/DOCUMENTOS-AUN-FALTANTES.csv): las 17 expectativas previas, sin fecha, SHA o ID de una recepción nueva. Son trece paquetes y cuatro anexos dentro de INN.

El [protocolo](fase6-20261116/PROTOCOLO-RECEPCION-Y-VALIDACION.md) cubre PDF, Excel, CSV, fotografías, capturas, planos, memorias y texto/declaraciones. Distingue recepción, lectura validada, aplicabilidad y cierre. Los [esquemas](fase6-20261116/ESQUEMAS-RECEPCION.json) y [criterios por caso](fase6-20261116/CRITERIOS-CONFLICTOS-Y-ANEXOS.json) permiten continuar con los mismos IDs.

Se conservarán los bytes originales, nombre y SHA antes de extraer. Las transcripciones de chat se identificarán como tales y los derivados se guardarán separados. Proyecto, modelo, unidad, versión, superficies rotuladas y alcance se verificarán contra las fuentes existentes. Se preservan útil, interior, total, terraza, patio/jardín, terreno, Internos, logia y rooftop con sus categorías originales, sin sumas ni equivalencias inferidas.

## Conflictos que siguen abiertos

D-03 mantiene cuarzo de F005/F021 frente a ultracompacto con terminación travertino de F014. No se ha recibido declaración nueva ni memoria aplicable. Se necesita identificar material comercial y alcance por modelo/versión, documentando ambas especificaciones si corresponden a versiones distintas.

Los once conflictos técnicos conservan ambos lados: Living A1; Mood A; Capitanes A; Bold S1 y F; Argomedo C1/C; Indi D/A2 y A4/C1; INN S/605, R/604 y Q/603. No se procesó ningún antecedente nuevo para ellos. F3-C001 sigue como límite adicional para F/406 y 806/906, fuera de los doce conflictos. El [dossier F5](fase5-20261116/DOSSIER-CONFLICTOS.json) y el [CSV técnico](fase5-20261116/CONFLICTOS-TECNICOS-LEBEN.csv) permanecen intactos.

## Paquetes en espera

| Paquete | Proyecto / slug | Pendientes conservados | Recepciones nuevas |
| --- | --- | ---: | ---: |
| F5-DOC-01 | edificio-living-town | 18 | 0 |
| F5-DOC-02 | edificio-mood | 25 | 0 |
| F5-DOC-03 | edificio-santo | 25 | 0 |
| F5-DOC-04 | edificio-baum | 21 | 0 |
| F5-DOC-05 | edificio-suecia | 22 | 0 |
| F5-DOC-06 | capitanes | 20 | 0 |
| F5-DOC-07 | edificio-bold | 27 | 0 |
| F5-DOC-08 | edificio-argomedo | 23 | 0 |
| F5-DOC-09 | edificio-indi | 23 | 0 |
| F5-DOC-10 | edificio-indigo | 22 | 0 |
| F5-DOC-11 | inn-puerto-chico | 20 | 0 |
| F5-DOC-12 | edificio-nordico | 32 | 0 |
| F5-DOC-13 | own | 35 | 0 |

Se reutiliza el [mapeo F5](fase5-20261116/MAPEO-DOCUMENTOS.json): 287 claves documentales asignadas una vez. F5-DOC-11 incluye F5-ANX-INN-01 (616/N), -02 (513/B2), -03 (601/O1) y -04 (aplicabilidad F/406 a 806/906). Los tres PDF originales no fueron entregados y sus hashes nuevos siguen vacíos. No hubo nuevos intentos de exportación ni consultas a Iris.

No se reiteran veinte precios de inmuebles, dos adicionales Suecia, trece direcciones, once brochures, 210 gráficos o doce plantillas. F049 sigue aceptada al 16/11/2026 sin nueva ratificación. Las esperas Santo L-009 y BAUM L-013 se mantienen; Own conserva vendido.

## Integridad y continuación

Sin hechos nuevos, no se modificaron las matrices canónicas, el registro de 49 fuentes, confirmados/parciales ni los cortes Iris/F3/F4/F5. La maestra conserva las 131 identidades y valores anteriores; únicamente añade metadatos de recepción F6 para Leben y deja en blanco los de los otros 118 proyectos. El estado global conserva la cobertura y refleja la preparación administrativa.

El [manifiesto](fase6-20261116/MANIFIESTO-BASE.json), la [revisión de base](fase6-20261116/REVISION-BASE.json), el [resumen](fase6-20261116/RESUMEN-FASE6.json) y la [verificación final](fase6-20261116/VERIFICACION-FASE6.json) permiten comprobar integridad y cantidades. No se alteró la plantilla Excel F5. El manual añade el procedimiento de recepción sin afirmar una nueva verificación de interfaz.

El siguiente paso es recibir antecedentes reales, registrar sus originales y validar únicamente su alcance. Si no llegan, mantener el saldo. Trabajo exclusivamente documental, rama independiente y exclusión de deployments conservada. Se verifican GitHub, hashes y árbol limpio al sincronizar. No se inicia Euro.

[Siguiente prompt completo](fase6-20261116/SIGUIENTE-PROMPT.md).
