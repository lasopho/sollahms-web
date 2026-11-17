# Depuración documental final de Leben — fase 3

Corte: **16/11/2026, America/Santiago**. Rama `codex/auditoria-leben-20261116`; base documental `27c21f28980ff120454980abfe5064cb9dd1d983`. Los 13 proyectos Leben permanecen en el universo maestro de 131. Las otras 118 filas siguen sin auditoría de esta fase.

**El saldo documental sigue en 330 campos. No se encontró respaldo para cerrar campos completos nuevos.** Se aprovechó parcialmente una referencia de bodegas de Nórdico y se corrigieron dos etiquetas de divergencia numérica de baños. La depuración distingue **58 campos preparados para decisión o conciliación del propietario** de **272 vacíos documentales o de alcance**; no convierte esa clasificación en cierres.

## Resultado

| Métrica | Resultado |
| --- | ---: |
| Pendientes iniciales | 330 |
| Nuevos campos completados íntegramente | 0 |
| Nuevos campos parcialmente completados | 1 |
| Nuevos hechos estructurados de evidencia ya existente | 3 |
| Contradicciones resueltas | 0 |
| Etiquetas de divergencia numérica de baños corregidas, sin cierre | 2 |
| Campos que dejaron de requerir información | 0 |
| Pendientes documentales finales | 330 |
| Decisión comercial Sollahms | 36 |
| Campos con conflicto que requieren conciliación | 22 |
| Falta de documentación o alcance suficiente | 272 |

Los 58 campos de decisión/conciliación **no equivalen a 58 preguntas**. Los 272 vacíos se agrupan por proyecto en solicitudes de documentación consolidada, sin pedir otra vez cada dato de las tarjetas ya conservadas. Tampoco se ha emitido una nueva ronda de preguntas ni repetido B1A. La falta de documentación puede requerir apoyo del propietario para obtener archivos, pero no constituye una decisión personal sobre 272 características.

## Fuentes nuevas revisadas y límites

Se examinaron las **12 plantillas técnicas imprimibles** de las fichas exactas mediante el menú Archivos y lectura selectiva de Características, Amenities, Descripción y Ubicación. Las secciones permitidas repiten lo ya registrado. Los encabezados técnicos de tablas no aportan una clasificación nueva de superficies: se mantiene el rótulo Internos. La plantilla imprime menos amenities que la ficha en algunos casos; no se interpreta esa diferencia como ausencia.

No se volvieron a descargar los 11 brochures, ni se repitió la lectura de los 104 planos de unidad, las 105 plantas/elevaciones o el reemplazo ya inspeccionados. Se usaron las transcripciones e IDs existentes para conciliar registros. Las 13 fichas Leben de los archivos locales adicionales del checkout coinciden con los objetos de la base de 131; un hash distinto del catálogo global no aporta datos nuevos para estos proyectos.

Los tres PDF INN se comprobaron en el DOM actual y se reintentaron **una sola vez** mediante pageAssets. Los tres volvieron a fallar con `TypeError: Failed to fetch`. No se obtuvieron bytes válidos ni se inventó un SHA del documento.

| Unidad / modelo UI | PDF observado | Estado |
| --- | --- | --- |
| 616 / N | `694a1152bb220_pc-f-15-04.pdf` | No recuperado; no leído |
| 513 / B2 | `694a0be8bd379_pc-f-03-04.pdf` | No recuperado; no leído |
| 601 / O1 | `694a0b8a05509_pc-f-17-04.pdf` | No recuperado; no leído |

Las URLs exactas están en [reintento PDF](REINTENTO-PDF-INN.json) y en el [inventario de fuentes](INVENTARIO-FUENTES-POR-REVISAR.json). **No se concluye que esos documentos o datos no existan**: permanecen pendientes por acceso/exportación con el mecanismo disponible.

La apertura de Condiciones comerciales de INN expuso un documento adicional, distinto de los brochures. El exportador lo clasificó como `other` y rechazó la exportación con `unsupported asset kinds`. Su [URL y limitación](DOCUMENTO-ADICIONAL-NO-EXPORTABLE.json) se conservan; su contenido no fue leído. No se reclasificó el recurso ni se usaron solicitudes externas, endpoints privados o mecanismos de autenticación alternativos. No se abrieron las otras condiciones para repetir una incompatibilidad conocida del mismo exportador.

Una prueba de Imprimir ficha técnica en Mood no produjo un archivo exportable y dejó su pestaña propia sin respuesta a los controles normales. No se confirmó impresión ni guardado, no se accedió a impresoras y no se repitió ese botón. Las demás plantillas se leyeron directamente por secciones permitidas. La sesión de Iris estaba disponible; no fue necesario pedir credenciales ni autenticación nueva.

## Información recuperada y depuración

**Nórdico, bodegas:** las descripciones conservadas de las unidades 104, 204 y 304 dicen «Estacionamiento UF 500 y Bodega UF 100 (opcionales)». Se añaden `F3-H001` a `F3-H003`, vinculados a F034 y a sus unidades. El campo pasa de desconocido a **parcial**. Esto documenta una oferta opcional; no prueba inclusión en el precio, stock o cobertura de todas las unidades. No se cuenta como cierre completo ni como precio Sollahms vigente.

**Bold e Indi, baños:** se contrastaron las transcripciones de 28 pares UI/plano: 14 por proyecto, sin nueva lectura de imágenes. Todos coinciden numéricamente. En Bold312, IR-H02069 e IR-H02890 declaran 1 baño; en Indi607, IR-H02260 e IR-H02938 declaran 1 baño. Se retira la etiqueta de divergencia numérica de esos dos campos y pasan a parcial por inventario/asociación incompletos. **Los conflictos S1/Estudio y D/A2/1D–2D siguen abiertos**. Las cinco unidades sin plano real no se completan por analogía. [Auditoría puntual](AUDITORIA-BAÑOS-COINCIDENTES.json).

**INN F/406:** el registro IR-P125 imprime Torre B–Depto406, pero la UI enlaza el mismo recurso a406/806/906. Se añade la anotación F3-C001 para impedir transferir métricas o torre a806/906. Es una limitación de aplicabilidad detectada en la conciliación, no un área nueva ni una contradicción resuelta.

Las tres discrepancias previas siguen abiertas: Argomedo380/382, IndiHipódromo1816/Vallenar2070 y cubiertasINNcuarzo/ultracompacto travertino. Se mantienen las cuatro decisiones previas de dirección sin nuevas preguntas. Las otras diferencias de modelos, áreas, dormitorios y baños se conservan en [CONTRADICCIONES-IRIS.csv](CONTRADICCIONES-IRIS.csv).

## Cobertura documental sin inflar resultados

Denominador fijo: **689 campos proyecto/campo = 13 × 53**.

| Indicador | Campos | Porcentaje sobre689 |
| --- | ---: | ---: |
| Estado confirmado documentalmente sin etiqueta de alcance, heredado y conservado | 198 | 28,74 % |
| Confirmado dentro de alcance limitado del corte previo, separado del indicador anterior | 42 | 6,10 % |
| Propuesta false de catálogo por silencio de brochure completo | 99 | 14,37 % |
| No aplica documentado previamente | 2 | 0,29 % |
| Sin pendiente administrativo en el corte base, incluye otros estados | 359 | 52,10 % |

El **28,74 %** describe el estado de confirmación documental conservado; no certifica vigencia comercial, disponibilidad ni inventario exhaustivo. El **52,10 % es cobertura administrativa**, no porcentaje de completitud documental. Los 42 campos con alcance y las 99 propuestas false no se suman al primer indicador para aparentar completitud. La regla del brochure no acredita ausencia física. Los datos parciales, históricos y contradictorios permanecen separados.

La regla estricta de fase3 arroja **0/330 nuevos cierres completos (0 %)**. Cambiar el responsable o corregir una etiqueta no elimina un pendiente. Los 38 cierres del corte anterior se conservan como resultado histórico con su alcance; no se vuelven a contar en esta fase.

## Solicitudes finales agrupadas por proyecto

Esta tabla prepara intervenciones concretas y necesidades documentales; **no reenvía preguntas anteriores**. Para Living Town, Mood, Santo y BAUM, el precio B1A ya fue solicitado y sigue esperando respaldo nuevo. Para los demás, se mantienen las solicitudes comerciales previas; no se presentan precios Iris como Sollahms. Own conserva vendido.

| Proyecto | Pendientes | Campos decisión/conciliación | Campos documentales | Intervención o alcance que falta |
| --- | ---: | ---: | ---: | --- |
| Edificio Living Town | 20 | 4 | 16 | A1/603–803: 2 baños UI frente a 1 gráfico. B1A ya solicitado; esperar respaldo nuevo. |
| Edificio Mood | 26 | 4 | 22 | A/303: 2D UI frente a 1,5D gráfico. B1A ya solicitado; no reiterar. |
| Edificio Santo | 25 | 3 | 22 | Sin nuevo conflicto de decisión; B1A ya solicitado. Falta inventario técnico fuera de D/221. |
| Edificio BAUM | 21 | 3 | 18 | Sin nuevo conflicto de decisión; B1A ya solicitado. No equiparar Internos a útil/interior. |
| Edificio Suecia | 24 | 3 | 21 | Sin nueva confirmación de dirección: conservar criterio previo. Falta inventario fuera de F/206. |
| Capitanes | 22 | 7 | 15 | Plano A rotula 201 al 301 y se enlaza a 501/601: precisar aplicabilidad, sin pedir dirección ya resuelta. |
| Edificio Bold | 28 | 9 | 19 | S1/312: Estudio frente a 1D; F: terraza UI3,71 frente a gráfico3,12 y alcance de versiones. Baños coinciden. |
| Edificio Argomedo | 26 | 6 | 20 | 915: C1 UI frente a C gráfico. Conciliar antecedente380/382 sin alterar dirección Sollahms. |
| Edificio Indi | 25 | 7 | 18 | 607:D/2D frente a A2/1D;411:A4 frente a C1. Precisar Hipódromo1816/Vallenar2070 sin cambiar la dirección. Baños coinciden. |
| Edificio Índigo | 23 | 3 | 20 | Sin nuevo conflicto de decisión; faltan métricas clasificadas y alcance de modelos fuera de las dos tarjetas. |
| INN Puerto Chico | 21 | 6 | 15 | S/605 baños3/2;R/604 yQ/603 dormitorios4/5; cubierta cuarzo/travertino. F/406 no se extiende a806/906. Faltan tresPDF. |
| Edificio Nórdico | 34 | 3 | 31 | Bodega opcional documentada solo104/204/304. Falta respaldo general y terminaciones; sin brochure, omisión no es false. |
| Own | 35 | 0 | 35 | Conservar vendido. Recuperar solo documentación técnica histórica; no pedir precio/disponibilidad ni buscar sustituto. |

El [CSV agrupado](SOLICITUDES-FINALES-POR-PROYECTO.csv) conserva los IDs L originales, distingue comercio, conflicto y documentación y detalla qué pedir solo si se necesita completar el alcance faltante. El [pendiente por campo](PENDIENTES-POR-CAMPO.csv) permite excluir los hechos ya documentados. La documentación técnica solicitada debe cubrir únicamente modelos/versiones/métricas/terminaciones no respaldados; no los 11 brochures existentes ni las unidades ya transcritas.

## Archivos y continuidad

- [Matriz Leben actual](MATRIZ-LEBEN.csv), [confirmados](DATOS-CONFIRMADOS.csv), [parciales](DATOS-PARCIALES.csv), [solicitudes previas acotadas](DATOS-PENDIENTES-PROPIETARIO.csv).
- Nuevo corte [fase3-20261116](RESUMEN-IRIS.json): contiene las matrices de esta fase, fuentes filtradas, nuevos hechos y registro de cambios.
- Base anterior preservada con [hashes](../../historico/iris-27c21f2/MANIFIESTO-BASE.json); la carpeta `iris-20261116/` conserva todos sus bytes y sus 3213 hechos,210gráficos e IDs.
- La [maestra de131](../../master/MATRIZ-MAESTRA-131.csv) y [estado global](../../master/ESTADO-GLOBAL.json) añaden el corte fase3 sin alterar las otras118identidades.
- [Siguiente prompt completo](../../continuidad/NEXT-PROMPT.md) y [memoria operativa Iris](../../../iris-operational-manual/NEXT-PROMPT.md).

Los campos activos de esta fase son `estado_fase3`, `tipo_pendiente_fase3`, `sigue_pendiente_documental_fase3`, `requiere_decision_propietario_fase3` y `requiere_documentacion_fase3`. `DATOS-PARCIALES.csv` incluye los confirmados solo en alcance, sin convertirlos en cierres completos nuevos. Las columnas anteriores permanecen como trazabilidad; los tres cambios de clasificación/alcance están en REGISTRO-CAMBIOS.csv.

`AGENTS.md` y `NEXT-PROMPT.md` de raíz no existían en filesystem ni árbol Git de la base. Se registra esa ausencia; se crea el NEXT de raíz solicitado, sin inventar instrucciones AGENTS. No se modifican datos productivos, direcciones, precios publicados, HTML, filtros, formularios, integraciones ni funciones. La exclusión de deployments de la rama se conserva. No hay cierre integral de Leben ni inicio de Euro.

Verificación final: [31 controles de integridad y datos aprobados](VERIFICACION-FASE3.json) y [revisión independiente de 37 controles](REVISION-INDEPENDIENTE.json), sin hallazgos materiales abiertos.

La tabla actual DATOS-CONFIRMADOS.csv usa granularidad de campo canónico (198 filas). La tabla anterior de hechos atómicos confirmados y todos sus IDs se conserva [íntegra en el histórico](../../historico/iris-27c21f2/leben/DATOS-CONFIRMADOS.csv); sus hechos no se borran ni se cuentan como198descubrimientos nuevos.
