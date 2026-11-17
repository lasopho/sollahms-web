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
