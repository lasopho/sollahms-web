# Limitaciones y excepciones

Corte de investigación: **2026-11-16**. Iris aporta evidencia complementaria; no reemplaza decisiones del propietario ni confirma vigencia comercial Sollahms.

## Límites comunes

- Las tarjetas renderizadas en el DOM no equivalen a inspección visual individual ni acreditan stock Sollahms. Los contadores de la ficha tampoco autorizan esa conclusión.
- **Internos**, útil e interior no son equivalentes por defecto. No sumar Internos y Terraza para inventar Total. No convertir logia o rooftop en terraza, útil o interior.
- Una imagen sin cuadro de superficies no respalda seis métricas completas. Un gráfico de reemplazo no respalda ninguna.
- La revisión final cubre 105 plantas/elevaciones generales de once fichas. En Nórdico la sección no aparece. La resolución publicada limita la lectura de pequeños rótulos; no aporta cuadros inequívocos de las seis superficies por modelo. Los menús Archivos varían por ficha y Living Town tenía un span oculto en el primer corte; el botón real sí permitió abrirlo en fase 3; revisar el historial antes de extrapolar opciones.
- Se detectaron recortes de captura que mostraban el fondo en lugar del modal. Esos archivos se descartaron; no deben citarse como capturas válidas.
- En una comprobación posterior de Living Town, un recorte del encabezado produjo una imagen en blanco y también se descartó. El control **Archivos** existía en el DOM pero estaba oculto; el intento UI informó `no_visible_match`. No se forzó su activación ni se declara leído ese menú. Verificar visibilidad y diseño de la ficha antes de reutilizar un selector.
- Los filtros del catálogo no incluyen un estado visible Vendido ni un selector observado de inmobiliaria. Una búsqueda sin coincidencia exacta no demuestra que el proyecto no exista.
- La presencia de una amenity en Iris es evidencia documental positiva. Su omisión no demuestra ausencia física. La regla catalográfica del brochure se aplica separadamente y no transforma el silencio de Iris en un dato recuperado.
- No se guardan datos de autenticación, importes o porcentajes de comisión ni atribuciones de intermediarios. Los precios Iris no sustituyen cotizaciones Sollahms vigentes.

## Excepciones verificadas

| Proyecto / alcance | Diferencia o límite | Tratamiento |
| --- | --- | --- |
| Living Town, A1, unidades 603/803 | UI declara 2 dormitorios/2 baños; gráfico A1, 2D/1B | Conservar ambas fuentes; no generalizar baños. |
| Living Town, dirección | Iris Eyzaguirre 580 frente a referencia Sollahms 590 | Identificación y conciliación; no reemplazar dirección. |
| Mood, A, 303 | UI 2 dormitorios; gráfico A 1,5D + 2B | Conservar 1,5D literal; no convertirlo a 2D. |
| Mood, dirección | Iris Av. Américo Vespucio 6608 frente a Sollahms 6630 | Conservar dirección Sollahms y registrar diferencia. |
| Suecia, encabezado de planta | Gráfico Tranquila 2307 frente a ubicación de ficha y Sollahms 2323 | No reemplazar dirección por el encabezado histórico. |
| Capitanes, A, 501/601 | Plano A imprime alcance 201 al 301 | Superficies del gráfico no confirman el alcance de 501/601. |
| Capitanes, E2, 704 | Plano distingue interior, terraza, rooftop y total | Conservar categorías separadas; no sumar para crear otra métrica. |
| Capitanes, dirección | Iris Los Capitanes 1445 frente a Sollahms 1447 | Conservar dirección Sollahms y dejar diferencia expresa. |
| Bold, S1, 312 | UI Estudio; gráfico 1D/1B | Tipología contradictoria. |
| Bold, F | Gráfico enlazado a 608 imprime interior 62,40; terraza 3,12; total 65,52 m². UI 608: Internos 63.44 y Terraza 3.71 | No equiparar Internos a interior; terraza también difiere. Conservar alcance impreso 207 al 407, 508 y 608. |
| Bold, L-103; Indi, tres locales | Filtro Local Comercial incluye las unidades, pero leyendas de filas muestran Estudio | Conservar membresía explícita y discordancia. No clasificar por prefijo L ni trasladar sus 0 baños a departamentos. |
| Argomedo, 915 | UI C1; gráfico Modelo C | No inventar equivalencia entre códigos. |
| Argomedo, dirección | Iris 382; existe respaldo con 380 | No resolver arbitrariamente el conflicto. |
| Indi, 607 | UI D, 2D/1B; gráfico A2, 1D/1B | Asociación contradictoria. |
| Indi, 411 | UI A4; gráfico C1 | Asociación contradictoria. |
| Indi, dirección | Iris Hipódromo 1816 frente a Sollahms Vallenar 2070 | Mantener referencia y decisión pendiente. |
| INN Puerto Chico, terminaciones | Diferencia documental de cubierta cuarzo / ultracompacto travertino | Requiere alcance por versión o modelo; no elegir por generalización. |
| INN Puerto Chico, S/605, R/604 y Q/603 | S: UI 3 baños frente a gráfico 2; R y Q: UI 4 dormitorios frente a gráfico 5 | Conservar las tres contradicciones por unidad y fuente. |
| INN Puerto Chico, recursos | Tres planos PDF observados no pudieron exportarse con pageAssets | No se consultaron por vías alternativas ni se declaran leídos. |
| Nórdico / Own | Sin brochure en el inventario auditado | No aplicar una regla de ausencia documental basada en brochure inexistente. |
| Own | Búsquedas UI documentadas sin coincidencia exacta | Mantener condición Sollahms vendido. No asignar resultados Living Town o Downtown San Martín a Own. |

Estas excepciones no son una lista exhaustiva de campos pendientes. Consultar la matriz y los registros de evidencia antes de promover un dato a confirmado o listo para filtros.

## Depuración de fase 3

La limitación inicial de Archivos de Living Town quedó superada al seleccionar el botón real. Las doce plantillas fueron leídas sin aportar campos completos nuevos. No repetir la lectura de los 210 gráficos ni los 11 brochures. La prueba de impresión de Mood no produjo archivo y no debe repetirse. Los tres PDF INN siguen no leídos tras un reintento fallido; el PDF adicional de condiciones se clasificó como other y no fue exportable. Estas limitaciones no demuestran ausencia de los documentos o de los datos.

En Bold e Indi, los baños de los pares UI/gráfico coinciden: se corrigieron dos etiquetas numéricas sin resolver las diferencias de código/tipología. En INN F/406 no se transfieren medidas a806/906. Nórdico ofrece bodega opcional en104/204/304; es mejora parcial, sin inferir inclusión, stock o cobertura general.

## Actualización de fase 4 — 16/11/2026

Las siete listas de precios por categoría no se convierten en precio desde global calculando mínimos. Las20cotizaciones son válidas como declaración en16/11/2026 aunque falte inventario técnico completo. INN2D10500,3D10016,4D21869 se conserva en ese orden; Índigo2D9001 no se cambia por9000,1 de otra fuente. No inferir baños no declarados. Todas las direcciones quedan fuera de preguntas, sin modificar sus strings ni resolver físicamente diferencias. Own permanece vendido.

El corte activo está en [INFORME-FASE4-LEBEN.md](../catalog-data-completeness-20261116/leben/INFORME-FASE4-LEBEN.md) y su carpeta fase4-20261116. Los números y solicitudes de cortes anteriores de este manual son históricos; usar el siguiente prompt actualizado antes de repetir una exploración.

## Precisión de aplicabilidad — fase 5, 16/11/2026

Una lectura documental confirmada y un enlace de unidad a plano no confirman por sí solos la realidad física, la versión vigente o la aplicabilidad. Mood A enlazado a 303 conserva la observación previa DEPTO 201 y 1,5D, sin redondeo. Bold F tiene tres recursos diferentes: IR-P106 para 207/307, IR-P107 para 508 e IR-P108 enlazado a 608; solo este último contiene el cuadro 62,40/3,12/65,52. No propagarlo a los demás recursos. F3-C001 sigue siendo un límite adicional, fuera de los doce conflictos.

No resolver cantidades físicas mediante una elección personal. Obtener plano, cuadro o constancia técnica con unidad/modelo/versión explícitos. El propietario puede precisar la especificación comercial de cubiertas INN y su alcance; si falta respaldo, solicitar memoria técnica. No hay nuevas fuentes ni cambios verificados de interfaz en esta fase.

## Expectativas frente a recepciones — fase 6, 16/11/2026

F5-DOC-01..13 y los cuatro anexos INN identifican documentos esperados. No son archivos recibidos y no tienen una nueva fecha/SHA hasta su entrega real. Sin nuevos antecedentes, los registros de recepción, hechos y resoluciones tienen cero filas y los 313 campos permanecen pendientes.

La regla histórica de solicitar vigencia para una cotización no se aplica retroactivamente a los veinte precios y dos adicionales F049 ya aceptados al 16/11/2026. Una aclaración parcial o un archivo de alcance limitado no resuelve el caso completo ni un campo global por sí solo.

## Complementarios y filtro de desconocidos — cambio de alcance, 17/11/2026

La clasificación comercial reemplaza el bloqueo constructivo anterior: D-03, Argomedo C/C1 e Indi A4/C1 quedan complementarios, abiertos documentalmente y sin equivalencias inventadas. Los nueve casos que sí afectan D/B o superficies restringen solo el atributo/opción correspondiente. F3-C001 sigue adicional.

Desconocido no equivale a false/cero/Residencial. Sin predicado activo no excluye al proyecto. El código actual todavía aplica Residencial a tipoActivo ausente: hallazgo documentado, no corregido en esta etapa. Las 131 identidades auditadas se distinguen de las 137 del archivo actual. Los 118 proyectos no Leben siguen sin auditoría comercial. No usar una propuesta false de brochure para invalidar la oferta adicional general declarada en F049.

## Máscaras de atributo y existencia — fase 9, 17/11/2026

En Bold F la cifra de terraza queda indeterminada, pero ambas cifras positivas conservan la presencia de terraza. Capitanes 501/601 mantiene sus 3D3B y terraza UI; el total del plano 201–301 no se transfiere. INN 806/906 mantiene sus propios D/B/terraza; los datos del plano 406 siguen limitados a su alcance. No exigir torre o interior como nuevos datos comerciales.

El conflicto no invalida automáticamente toda la referencia o el proyecto. Un dato desconocido o en conflicto solo restringe el predicado que lo necesita. Las recomendaciones y consultas documentales no certifican filtros nuevos implementados ni stock.


## Verificación de continuidad global — 17/11/2026

Diagonal Vicuña /1104: el modal235 muestra un plano rotulado PLANTA DEPTO435 AL1635, TORREB, noviembre2022. No se acreditó su aplicabilidad a235 ni su equivalencia con los cinco modelos oficiales conservados. No trasladar torre, útil municipal o superficie de ventas del plano a235.

MapochoA /1149: el título, dirección y tipo Departamento respaldan esa ficha externa; unidad1010 tiene datos propios pero no plano cargado. Esto no resuelve el brochure histórico unresolved-building ni permite copiar modelos de Mapocho genérico /311.

Plaza Cervantes /1358: descripción general TorreB frente a unidad909A descrita EdificioA. No completar globalmente TorreA con la ficha ni usar la otra ficha1451B como equivalente. Mantener la discrepancia explícita.

Euro9: conservar las diferencias de entrega Nova(1S2028 frente a2S2028) y Mirador(1S2029 frente a1S2028), además de diferencias en rangos de dormitorios en el registro detallado. Son alcances de fuentes con fechas distintas; no sobreescribir datos owner. Vicuña Mackenna1432 aparece escrito Mackena en Iris; se halló mediante búsqueda visible1432 tras el intento nominal. La identidad se comprobó por proyecto, Euro y dirección. No extrapolar ese alias a otro proyecto.

No se enviaron chats, reservas, cotizaciones o contactos. Si el panel AsistenteIRIS tapa el modal, cerrar sólo ese panel por su control visible para capturar; no preguntar al chatbot ni enviar formularios.

## Plaza213 —17/11/2026

El plano C7/213 respalda útil69,85/terraza13,97/total83,82 como declaración gráfica comercial; no certifica áreas legales o as-built, fecha/revisión ni disponibilidad. La tabla literal original de áreas owner no se localizó: las atribuciones derivadas interiorM2 no prueban su rótulo original. El plano nuevo proporciona respaldo independiente.313 no estaba visible, no se buscó ni se declaró agotada; sus69,78 no quedan validados porC7. El motor puro no impone stock/sourceLayer: el consumidor debe mantener explícita la capa documental y no presentarla como oferta activa.

## Nuevo alcance unitario, sin cierres artificiales —17/11/2026

Novo109 aporta baño1 sólo a esa referencia; Estudio literal no completa dormitorios numéricos. Endémico45 aporta4D3B eInternos160/Terraza0, pero no útil/total. La coincidencia160 con Total del brochureD-Molle no prueba identidad o métrica. VistaBulnes conserva baño desconocido:0 observado, estabilidad no certificada. No reabrir estas consultas sin evidencia/condición nueva; no pedir un inventario al propietario.

## Precisión de observación y registro —18/11/2026

Una referencia puede conservar sólo el día observado (`observedOn`) y carecer de hora verificable (`observedAtUTC:null`). El registro posterior (`recordedAtUTC`) no sustituye esa observación: Endémico45 conserva17/11 observado aunque se registró enUTC después. El suplemento local admite día de calendario válido y muestra ese día sin inventar medianoche u otra hora. Los originales conservan sus timestamps o ausencias. Esta mejora de recepción no representa navegaciónIris nueva ni cambia la vigencia comercial. Novo109 mantiene Estudio literal sin0D; Casa45 no acredita automáticamente usoResidencial.

## Resultados diferidos, enlaces y planos — 18/11/2026

El buscador observado expone el campo como `textbox Username` con placeholder vacío; no es el formulario de acceso. Se identifica por contexto de catálogo y tags. Después de Enter, el tag puede cambiar antes que las tarjetas: confirmar el resultado una vez cargado, sin interpretar la primera instantánea como final. Los enlaces de ficha pueden abrir otra pestaña; localizarla mediante su URL real. El modal 1103 de Iris 624 vincula un plano C2 sin unidad impresa: registrar «plano mostrado por Iris para 1103», no aplicabilidad universal. Útil y total sólo se incorporan por sus rótulos gráficos explícitos; Internos continúa separado.

## Tipología del portal frente al plano —18/11/2026

Verne465/202 demuestra que títuloDepartamento/etiquetaEstudio y dirección correcta no bastan para certificar el producto: el plano del modal imprimeOficina1O+1B/oficina202. Conservar ambos lados; excluir la asociación residencial y no pedir otra vez la identidadowner ya resuelta. Un encabezado o extensión no valida por sí solo una fuente. La primera extracción residencial de root se conserva conerratum separado. Internos y útil/total no son comparables por diferencia numérica; tampoco se homologa su igualdad.

Un403 de transferencia actual no prueba que el documento no exista. Antes de solicitarlo al propietario, seguir el índice archivado y reutilizar originales disponibles en lectura, conservando hash/versión. El PDF Irarrázaval local3.501.590B es distinto en tamaño al remoto reportado17.700.840B; no se afirmó equivalencia de versiones ni se reintentó403. Leer referencias normativas/metadatos como contexto, sin convertirlas en fecha de emisión.
