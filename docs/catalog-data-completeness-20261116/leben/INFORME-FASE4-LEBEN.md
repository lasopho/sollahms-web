# Conciliación de respuestas del propietario — Leben, fase 4

Fecha de comunicación: **16/11/2026, America/Santiago**. Fuente directa **F049 / COM-F4-001**. Base: `bdab9dfb8a04bcce350c056648e33cb030ba5cdb`, rama `codex/auditoria-leben-20261116`, checkout independiente. [Declaración íntegra y sus instrucciones](fase4-20261116/COM-F4-001-RESPUESTA-PROPIETARIO.md); su SHA se conserva en el registro de fuentes.

**El saldo baja de 330 a 313 campos pendientes:** 15 campos se completan por respuesta directa y dos preguntas de dirección se retiran por instrucción expresa, sin afirmar que sus numeraciones sean físicamente equivalentes. Se aceptan **20 cotizaciones de inmueble y dos importes adicionales de Suecia** como datos del propietario en esa fecha. No se exige conciliación con Iris para aceptarlos ni se garantiza su vigencia futura.

## Resultado y criterio de cierre

| Indicador | Resultado |
| --- | ---: |
| Pendientes al iniciar fase4 | 330 |
| Campos completados por propietario | 15 |
| Preguntas de dirección retiradas, sin resolución física | 2 |
| Pendientes finales | 313 |
| Campos con enriquecimiento parcial | 34 |
| De los anteriores, conservan conflicto particular | 5 |
| Cotizaciones de inmuebles aceptadas | 20 |
| Costos adicionales Suecia aceptados, separados de inmuebles | 2 |
| Declaraciones atómicas incorporadas | 65 |
| Asociaciones dormitorios/baños expresas | 7 |
| Contradicciones particulares resueltas | 0 |
| Casos particulares de contradicción activos, sin direcciones | 12 |

Conciliación: **330 − 15 − 2 = 313**. Los 15 cierres son diez estados comerciales, tres precios desde globales expresos (Suecia, Capitanes y Argomedo), el edificio único de Living Town y la oferta general de bodega adicional de Nórdico. Esta última confirma presencia/oferta en el proyecto sin brochure, no asignación a cada unidad, inclusión en precio o stock.

Los 34 enriquecimientos parciales no son 34 cierres. Tampoco los 20 precios equivalen a 20 campos canónicos completos: cada cotización queda **confirmada por propietario**, mientras puede faltar cobertura de otras categorías, versiones o modelos. No se calcularon mínimos de los siete listados para atribuirles un precio desde global que el propietario no declaró. No se volverán a pedir los importes ni las categorías ya informados.

El campo `precios_tipologia` mantiene su alcance pendiente cuando solo se conoce una referencia o un conjunto comercial sin inventario exhaustivo de versiones. Ese límite de cobertura **no invalida ninguna de las cotizaciones recibidas** ni las condiciona a documentos de Yapo. En particular, las referencias únicas de Suecia/Capitanes/Argomedo no se convierten en precios de todos sus modelos.

## Precios y condiciones aceptados

| Proyecto | Declaración comercial exacta | Estado informado |
| --- | --- | --- |
| Edificio Living Town | 1 dormitorio: UF 3.949; 2 dormitorios: UF 4.991,65 | en blanco |
| Edificio Mood | 1 dormitorio: UF 3.753,20; 2 dormitorios: UF 4.678,45 | Recepción final |
| Edificio Santo | Sin nueva declaración en fase4 | Sin actualización |
| Edificio BAUM | Sin nueva declaración en fase4 | Sin actualización |
| Edificio Suecia | Precio desde: UF 11.358,90 | Recepción final |
| Capitanes | Precio desde: UF 12.608 | Recepción final |
| Edificio Bold | Estudio: UF 3.862,50; 1 dormitorio: UF 4.897,50; 2 dormitorios: UF 6.716,25 | Recepción final |
| Edificio Argomedo | Precio desde: UF 4.432 | Recepción final |
| Edificio Indi | Local comercial: UF 8.560; 1 dormitorio: UF 3.544; 2 dormitorios: UF 3.944 | Recepción final |
| Edificio Índigo | 2 dormitorios: UF 9.001; 3 dormitorios: UF 10.414,90 | Recepción final |
| INN Puerto Chico | 2 dormitorios: UF 10.500; 3 dormitorios: UF 10.016; 4 dormitorios: UF 21.869 | en verde |
| Edificio Nórdico | 1 dormitorio: UF 5.382; 3 dormitorios: UF 10.335 | en verde |
| Own | No corresponde: vendido | vendido |

Todos los inmuebles con precio declarado tienen estacionamiento y bodega **adicionales**, excluidos del importe del inmueble según la respuesta. Suecia agrega estacionamiento **UF510** y bodega **UF75**. Los dos costos están marcados como `ADICIONAL` en el CSV y nunca se usan como precio de inmueble o umbral desde.

Se conserva exactamente **INN: 2D UF10.500; 3D UF10.016; 4D UF21.869**, aunque el precio 3D sea menor que el de2D. Índigo2D queda en **UF9.001**, sin sustituirlo por9.000,1 de otra fuente. La comunicación de fase4 actualiza el antecedente comercial anterior: los valores históricos y COM-F2-001/F022 permanecen en el historial, sin presentarse como valores actuales. Santo y BAUM no recibieron una nueva respuesta comercial en este mensaje; no se inventan datos ni se repite B1A.

El estado **en blanco** de Living Town es una categoría comercial explícita, no un valor vacío. Recepción final se acepta como estado comercial, sin inferir fecha/año/semestre de entrega. Own conserva vendido y queda fuera de precio o disponibilidad.

## Tipologías, modelos y superficies

Living Town y Mood confirman las asociaciones comerciales 1D/1B y2D/2B. Suecia declara literalmente **Modelo 203, 3D/3B**: no se convierte en unidad 203 ni se vincula por inferencia con Iris206/Modelo F. Capitanes declara **unidad 501, 3D/3B**, sin convertir501 en modelo. Argomedo confirma2D/2B sin elegir entre C1 yC. Las categorías de precio de Bold, Indi, Índigo, INN y Nórdico se conservan con los dormitorios expresos, sin inventar baños.

La tabla de tipologías separa **330 filas UI**, **104 planos de unidad** y **20 referencias comerciales del propietario**. Sus454 filas no son454 unidades o modelos nuevos. Las asociaciones D/B expresas del propietario se preservan en la normalización y en sus referencias correspondientes.

SUPERFICIES-LEBEN.csv contiene **434 registros separados:330UI y104 planos**, sin transferir métricas entre fuentes. Los30 planos con cuadros aportan útil en8, interior en22, total en30, terraza en28 y patio/jardín en8; terreno en0. Los330 registros UI conservan Internos y Terraza como rótulos propios. Logia aparece por separado en3 planos y rooftop en1. No se suman áreas ni se convierte Internos en útil/interior. Los105 planos generales y el reemplazo no se cuentan como inventario de modelos.

No hubo nueva lectura de los 210 gráficos, descarga de los 11 brochures ni reintento de los tresPDFINN. No se recibieron sus originales en este mensaje. Los límites de Mood y del plano INN F/406 enlazado a806/906 permanecen. Las superficies provienen de las transcripciones existentes con IDsIR-H/IR-P y SHA del original, no de cálculos o reconstrucción geométrica.

## Contradicciones y direcciones

Permanecen abiertos los 12 casos particulares: Living A1/603–803; Mood A/303; Capitanes A con alcance201al301 frente a501/601; Bold S1/312 y superficiesF; ArgomedoC1/C; Indi D/A2 yA4/C1; INN S/605, R/604, Q/603 y cubiertasD-03. La declaración comercial general no elige una versión técnica ni resuelve esos conflictos. Los baños coincidentes de Bold/Indi conservan la depuración de fase3; no se reabre una divergencia numérica inexistente.

F3-C001 sigue siendo una limitación documental de aplicabilidad del plano INN F/406 para806/906, separada del casoD-03 de cubiertas. Las cotizaciones4D de INN no resuelven las diferencias4D/5D de R/Q, y el dato3D3B de unidad 501 no extiende el plano Capitanes A fuera de su alcance impreso.

**Las trece direcciones Sollahms conservan exactamente sus cadenas anteriores y ninguna aparece entre las preguntas pendientes.** Las dos claves antes abiertas de Argomedo e Indi se retiran por instrucción. Sus diferencias se conservan como antecedentes, sin declarar equivalencia física ni cambiar fichas. Las cuatro decisiones previas siguen vigentes. Los registros originales de contradicción no se borran; se añade su estado operativo de fase4.

Las99 propuestas false de catálogo se mantienen separadas de ausencia física. Las condiciones comerciales de estacionamiento/bodega adicionales se conservan en los precios; no se utilizan para sustituir automáticamente la regla de los brochures. Nórdico, sin brochure, sí obtiene respaldo general directo para la oferta de bodega. No se vuelve a pedir equipamiento ya documentado.

## Pendientes reales y preguntas necesarias

Los313 campos restantes se separan en **6 campos comerciales previos de Santo/BAUM sin respuesta nueva**, **20 campos afectados por contradicciones particulares** y **287vacíos documentales o de alcance**. La reclasificación de los precios ya informados como cobertura pendiente evita repetir cotizaciones: no reduce artificialmente el saldo ni convierte287 campos en287 preguntas personales.

| Proyecto | Pendientes | Campos de decisión/conciliación | Campos de documentación/alcance |
| --- | ---: | ---: | ---: |
| Edificio Living Town | 18 | 1 | 17 |
| Edificio Mood | 25 | 1 | 24 |
| Edificio Santo | 25 | 3 | 22 |
| Edificio BAUM | 21 | 3 | 18 |
| Edificio Suecia | 22 | 0 | 22 |
| Capitanes | 20 | 4 | 16 |
| Edificio Bold | 27 | 6 | 21 |
| Edificio Argomedo | 23 | 2 | 21 |
| Edificio Indi | 23 | 3 | 20 |
| Edificio Índigo | 22 | 0 | 22 |
| INN Puerto Chico | 20 | 3 | 17 |
| Edificio Nórdico | 32 | 0 | 32 |
| Own | 35 | 0 | 35 |

Las [solicitudes agrupadas por proyecto](fase4-20261116/SOLICITUDES-FINALES-POR-PROYECTO.csv) preparan solo decisiones de código/baños/dormitorios/superficies y aplicabilidad de planos. La documentación todavía necesaria es el inventario consolidado de modelos/versiones/edificios, métricas no rotuladas y terminaciones no respaldadas. Debe excluir las unidades, importes, asociaciones generales, direcciones y amenities ya documentados. No se envió una nueva ronda de preguntas.

La cobertura confirmada actual es **215/689 campos (31,20 %)**:196 confirmados por documento y 19 por propietario. Los19incluyen ratificaciones de campos que ya estaban fuera de los 330 pendientes; por eso no equivalen a19cierres nuevos. Hay161 campos con estado Parcial en el universo completo y34 campos con enriquecimiento parcial en esta fase, de los cuales5siguen Contradictorio. Las99 propuestas de catálogo y todos los parciales quedan fuera del numerador confirmado. Esta cifra no certifica disponibilidad, vigencia futura o inventario técnico completo de cada proyecto.

## Entregables y continuidad

- [Matriz Leben actual](MATRIZ-LEBEN.csv), [confirmados](DATOS-CONFIRMADOS.csv), [parciales](DATOS-PARCIALES.csv) y [solicitudes originales acotadas](DATOS-PENDIENTES-PROPIETARIO.csv).
- [Precios propietario](fase4-20261116/PRECIOS-PROPIETARIO-LEBEN.csv), [tipologías](fase4-20261116/TIPOLOGIAS-LEBEN.csv), [superficies](fase4-20261116/SUPERFICIES-LEBEN.csv).
- [Pendientes reales](fase4-20261116/PENDIENTES-REALES-LEBEN.csv), [pendientes por campo](fase4-20261116/PENDIENTES-POR-CAMPO.csv), [contradicciones activas](fase4-20261116/CONTRADICCIONES-LEBEN.csv) y [registro completo de diferencias](fase4-20261116/CONTRADICCIONES-IRIS.csv).
- [Cobertura documental de filtros](fase4-20261116/RESUMEN-COBERTURA-FILTROS.json), [resumen fase4](fase4-20261116/RESUMEN-IRIS.json), [65 hechos del propietario](fase4-20261116/HECHOS-PROPIETARIO-FASE4.json).
- [Base anterior preservada y hashes](../historico/fase3-bdab9df/MANIFIESTO-BASE.json), [maestra131](../master/MATRIZ-MAESTRA-131.csv), [estado global](../master/ESTADO-GLOBAL.json) y [siguiente prompt completo](../continuidad/NEXT-PROMPT.md).

La lectura activa de la matriz usa `estado_fase4`, `valor_documental_fase4`, `sigue_pendiente_fase4`, `tipo_pendiente_fase4` e IDs de respuestaF4. Todas las columnas anteriores se conservan como trazabilidad histórica. La fecha de comunicación es la fecha informada por el propietario, no una garantía de plazo futuro. Los costos adicionales, los precios del inmueble y las áreas no se mezclan.

Las13 identidades Leben y las 118 filas restantes de la maestra se preservan. No se modifican producción, HTML, catálogo, filtros productivos, precios publicados, direcciones, formularios, CRM, Resend ni funciones. No se ejecutaron generadores de aplicación. Se conserva la exclusión de despliegues de la rama, sin main/PR/publicación. Leben aún no se declara cerrada y no se inicia Euro.

Verificación final: [42 controles de integridad y conciliación](fase4-20261116/VERIFICACION-FASE4.json) aprobados. Revisiones independientes: [precios32/32](fase4-20261116/REVISION-PRECIOS.json), [pendientes41/41](fase4-20261116/REVISION-PENDIENTES.json) y [técnica25/25](fase4-20261116/REVISION-TECNICA.json), sin hallazgos materiales abiertos.
