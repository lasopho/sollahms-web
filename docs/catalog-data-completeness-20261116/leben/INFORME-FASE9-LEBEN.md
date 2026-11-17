# Leben — cobertura comercial esencial y búsquedas parciales, fase 9

Corte **17/11/2026, America/Santiago**. HEAD local y remoto de inicio verificado: `26dba5d3684fcfa1eb69fe75e8a33aa01c64c18e`; árbol inicial limpio. Solo se reutilizaron documentos y tablas existentes. No hubo navegación, nuevas recepciones, relectura de imágenes o exportaciones.

**Los 12 proyectos activos cuentan con datos para búsquedas parciales confiables, respetando el alcance de cada referencia.** Diez permiten precio+dormitorios en una cotización; cinco permiten precio+D/B en esa misma cotización; dos permiten D/B+útil+total en un perfil gráfico sin precio. Se preparan esas capacidades y sus límites; no se modificaron ni se certifican filtros nuevos en la aplicación.

## Qué puede consultarse con respaldo

Las marcas Sí significan que existe al menos una referencia documental con todos los atributos de esa combinación. No prueban stock ni cobertura de todas las unidades. Una fila sin respaldo para una combinación conserva otras búsquedas válidas.

| Proyecto | Precio por cotización | Precio + D/B | D/B + terraza | D/B + útil + total |
| --- | --- | --- | --- | --- |
| Edificio Living Town | Sí | Sí | Sí | Sin respaldo para esa combinación |
| Edificio Mood | Sí | Sí | Sí | Sí |
| Edificio Santo | Sin respaldo para esa combinación | Sin respaldo para esa combinación | Sí | Sin respaldo para esa combinación |
| Edificio BAUM | Sin respaldo para esa combinación | Sin respaldo para esa combinación | Sí | Sin respaldo para esa combinación |
| Edificio Suecia | Sí | Sí | Sí | Sin respaldo para esa combinación |
| Capitanes | Sí | Sí | Sí | Sin respaldo para esa combinación |
| Edificio Bold | Sí | Sin respaldo para esa combinación | Sí | Sin respaldo para esa combinación |
| Edificio Argomedo | Sí | Sí | Sí | Sin respaldo para esa combinación |
| Edificio Indi | Sí | Sin respaldo para esa combinación | Sí | Sin respaldo para esa combinación |
| Edificio Índigo | Sí | Sin respaldo para esa combinación | Sí | Sin respaldo para esa combinación |
| INN Puerto Chico | Sí | Sin respaldo para esa combinación | Sí | Sin respaldo para esa combinación |
| Edificio Nórdico | Sí | Sin respaldo para esa combinación | Sí | Sí |

D/B sin precio tiene referencias en los doce proyectos; D/B+total, en cinco. Útil+total con D/B procede de Mood y Nórdico. Ninguna referencia conservada combina precio Sollahms con útil+total o con jardín privado: falta correspondencia expresa cuando se quiere cruzar la cotización con otro perfil. Eso no impide consultar el precio de la cotización ni las superficies de un perfil por separado.

Los doce conservan identidad, ubicación, tipo general y entrega documentados. El tipo general de un proyecto no se usa para adjudicarlo a una opción de otro tipo en un proyecto mixto. Hay tres desde globales expresos (Suecia, Capitanes y Argomedo), siete listados cotizados por categorías y dos esperas de precio/estado —Santo L-009 y BAUM L-013—. No se calcula un desde global de los listados. Los once estados F049 incluyen diez activos cotizados y Own vendido; Own queda fuera de esta tabla y de oferta activa.

## Referencias separadas para evitar coincidencias falsas

La preparación contiene 330 referencias UI, 104 perfiles gráficos y veinte cotizaciones del propietario. Son 454 registros documentales, **no 454 unidades ofertadas**. Se emparejan tipologías y superficies únicamente dentro del mismo registro UI o del mismo recurso gráfico; las cotizaciones mantienen solo lo expresamente declarado en F049.

Cada referencia conserva ID, fuente, fecha de consulta o comunicación, literal, alcance y atributos utilizables. No se une un precio con un plano por compartir dormitorio, código parecido, URL o pertenencia al proyecto. Los dos adicionales Suecia siguen separados de los veinte inmuebles y nunca se usan como precio de departamento.

Ejemplos comprobados:

- Living puede satisfacer precio hasta UF 4.000 + 1D1B con OWN4-P001, sin necesitar antes una superficie. La discrepancia de baños A1/603 no invalida esa cotización general, pero tampoco permite asignarla a 603.
- Mood puede consultar 1D1B + útil desde 30 m² + total hasta 40 m² en un perfil propio. Añadir un precio F049 sin asociación expresa no produce una coincidencia.
- Capitanes 501 conserva 3D3B y terraza UI 18,45 m². No recibe automáticamente total 109,01 m² del plano A cuyo alcance imprime 201–301.
- INN 806 conserva sus propios 2D2B y terraza UI 26,36 m²; no recibe total 135,86 m² del perfil 406. El perfil 406 puede conservar su uso documental propio.
- Bold F/608 mantiene presencia de terraza, aunque su cifra queda indeterminada por 3,71/3,12. El predicado de presencia puede continuar; el de metros exactos no recibe un positivo conciliado.

Los [32 escenarios de consulta documental](fase9-comercial-20261117/COMPROBACIONES-DE-CONSULTA.json) comprueban esos límites, desconocidos con predicados activos/inactivos y la prohibición de cruces. No son pruebas de una implementación nueva de frontend.

## Disponibles, faltantes y preguntas por proyecto

[COBERTURA-ESENCIAL-LEBEN.csv](fase9-comercial-20261117/COBERTURA-ESENCIAL-LEBEN.csv) contiene doce filas con precio/categorías, tipo, D/B y métricas disponibles por referencia, estado, entrega, amenities, condiciones de estacionamiento/bodega, consultas respaldadas, limitaciones del código y una pregunta mínima preparada.

[DATOS-REALES-FALTANTES-LEBEN.csv](fase9-comercial-20261117/DATOS-REALES-FALTANTES-LEBEN.csv) contiene 39 filas de faltantes **condicionados a la consulta que los necesita**, sin inventar 39 cierres o nuevos IDs: diez de útil, siete de total, diez asociaciones cotización/perfil, cuatro esperas comerciales previas y ocho amenities de Nórdico sin respaldo suficiente. Un campo ausente no excluye al proyecto cuando su predicado no está activo.

Se preservan los veinte precios, dos adicionales, tipologías expresas, direcciones, estados confirmados, doce entregas y amenities ya documentados. Las propuestas false de catálogo de brochures completos no prueban ausencia física. Un desconocido sin brochure/evidencia no se transforma en false.

Estas preguntas están **preparadas, no enviadas**, y no son obligatorias para que el proyecto aparezca en búsquedas parciales. Bastaría ampliar una opción comercial a ofertar; no se pide rehacer el inventario completo:

| Proyecto | Siguiente precisión, solo para ampliar la combinación |
| --- | --- |
| Edificio Living Town | ¿Puedes vincular una cotización ya aceptada de Living Town con una opción a ofertar y aportar únicamente un extracto con útil y total rotulados de esa opción? |
| Edificio Mood | ¿Qué cotización ya aceptada de Mood corresponde a uno de los perfiles conservados IR-P030 o IR-P037, y con qué alcance de unidad o versión? Basta una opción; no necesitamos repetir precios ni superficies. |
| Edificio Santo | Para una opción de Santo que se vaya a ofertar, ¿puedes aportar únicamente un extracto con útil y total rotulados que identifique su unidad o referencia? |
| Edificio BAUM | Para una opción de BAUM que se vaya a ofertar, ¿puedes aportar únicamente un extracto con útil y total rotulados que identifique su unidad o referencia? |
| Edificio Suecia | Para el Modelo 203 ya cotizado de Suecia, ¿puedes aportar únicamente un extracto con útil y total rotulados e identificación expresa de ese modelo? |
| Capitanes | Para la unidad 501 ya cotizada de Capitanes, ¿puedes aportar su útil rotulada y el respaldo de qué plano o cuadro de total le aplica? No necesitamos repetir el precio ni las medidas ya documentadas de 704. |
| Edificio Bold | ¿Puedes vincular una cotización aceptada de Bold con una opción y su útil rotulada, aprovechando el total ya conservado si le aplica? Si esa opción no tiene total respaldado, basta un extracto que lo rotule. |
| Edificio Argomedo | Para la referencia 2D2B ya cotizada de Argomedo, ¿puedes identificar una opción aplicable y aportar únicamente su útil y total rotulados? |
| Edificio Indi | ¿Puedes identificar una opción de Indi correspondiente a una cotización aceptada y aportar únicamente su útil y total rotulados, conservando si se trata del local o de un departamento? |
| Edificio Índigo | ¿Puedes vincular una cotización aceptada de Índigo con una opción a ofertar y aportar únicamente un extracto con útil y total rotulados de esa opción? |
| INN Puerto Chico | ¿Puedes vincular una cotización aceptada de INN con uno de los perfiles de total ya conservados y aportar únicamente su útil rotulada? Basta una opción, sin repetir el total o la terraza documentados. |
| Edificio Nórdico | ¿Qué cotización aceptada de Nórdico corresponde a un perfil de 1D o 3D ya conservado, y con qué alcance de unidad o versión? Basta una opción; no necesitamos repetir precios, útil, total ni terraza. |

En Santo/BAUM no se repite la pregunta previa de precio o estado. En Mood/Nórdico no se solicitan de nuevo las superficies de los perfiles conservados: se pide únicamente correspondencia. Las aclaraciones de los nueve conflictos se activan solo si se quiere utilizar la opción y atributo afectados, no para habilitar todo el proyecto.

## Nueve conflictos esenciales y un límite adicional

[CONFLICTOS-QUE-AFECTAN-FILTROS.csv](fase9-comercial-20261117/CONFLICTOS-QUE-AFECTAN-FILTROS.csv) contiene nueve casos esenciales y F3-C001 como limitación adicional, sin convertirlo en un décimo conflicto. Se indican consultas afectadas, consultas permitidas, referencias y pregunta mínima condicionada.

- Living A1: baños indeterminados; sus dormitorios y terraza UI siguen disponibles.
- Mood A/303: dormitorios indeterminados; baños y terraza propios permanecen.
- Capitanes A: falta la aplicabilidad de datos del plano a 501/601; sus D/B y terraza UI no se borran.
- Bold S1: no elegir estudio/1D por inferencia. Bold F: retener D/B y presencia de terraza, apartando el número de terraza discrepante y las transferencias no acreditadas.
- Indi D/A2: dormitorios indeterminados; baño y terraza propios permanecen.
- INN S/605: baños indeterminados. INN R/604 y Q/603: dormitorios indeterminados. Los demás atributos de la misma fuente conservan su alcance.
- F3-C001: no transferir total o presencia de jardín de 406 a 806/906. Torre e interior se conservan como contexto histórico, sin exigirse como nuevos datos comerciales.

D-03, Argomedo C/C1 e Indi A4/C1 permanecen fuera de bloqueos comerciales y no se solicitan. No se resolvió físicamente ningún caso mediante esta preparación.

## Amenidades y condiciones comerciales

Se distinguen los rasgos comunes documentados del proyecto de jardín/terraza privados presentes en ciertas opciones. No se une el precio de una cotización sin jardín declarado con la existencia de patio en un perfil distinto, aunque ambos pertenezcan al mismo proyecto. Los desconocidos no generan coincidencia positiva.

La oferta general de estacionamiento/bodega adicional F049 se conserva para los diez cotizados, con exclusión del precio de inmueble. No acredita stock o asignación a una unidad. Una consulta por oferta adicional general es distinta de bodega incluida o disponible para una unidad concreta. Las condiciones desconocidas de otras referencias no se completan con una propuesta false de brochure.

## Código actual y preparación documental son capas distintas

El código de HEAD conserva precio máximo, tipo de activo, región, comuna, estado y texto libre. No implementa filtros de dormitorios/baños, superficie, entrega, amenities o estacionamiento/bodega. Tipo de activo tampoco equivale a tipo detallado de propiedad.

El HTML tiene el mismo SHA que el ya examinado en `3eccce6`: persiste la sustitución incorrecta de tipoActivo desconocido por Residencial. Se reutiliza su prueba aislada previa, sin ejecutar de nuevo la aplicación. El catálogo carga `data/proyectos.json` —137 proyectos—, no F049 ni las tablas preparadas. Por ejemplo, el precio heredado de Living es UF 2.812 y no sustituye a la cotización F049. Esta fase no modifica esos archivos o precios publicados.

[RECOMENDACIONES-FILTROS.json](fase9-comercial-20261117/RECOMENDACIONES-FILTROS.json) prepara reglas de predicados por referencia, desconocidos, privados y condiciones comerciales. No están implementadas. La matriz global sigue anclada al universo de 131 y no se inicia revisión de los otros 118 proyectos.

## Integridad y continuidad

Se mantienen los 313 IDs históricos y su clasificación 74 A/48 B/191 C, con cero cierres nuevos. No hubo originales nuevos que registrar en F6. Las matrices canónicas, cotizaciones, clasificaciones, perfiles, fuentes y cortes anteriores no se modificaron. El estado global solo incorpora el resumen administrativo de aptitud parcial; no cambia valores de campos. Se preservan los 235 hashes protegidos.

La [verificación final](fase9-comercial-20261117/VERIFICACION-FASE9.json) y el [manifiesto](fase9-comercial-20261117/MANIFIESTO-BASE.json) documentan el control. El trabajo es exclusivamente documental, sin generadores de aplicación, despliegues, publicación, PR, cambios en main o inicio de Euro. Se comprueban HEAD remoto y árbol limpio al sincronizar.

[Siguiente prompt completo](fase9-comercial-20261117/NEXT-PROMPT.md).
