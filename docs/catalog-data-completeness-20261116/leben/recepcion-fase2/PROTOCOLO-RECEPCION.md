# Reglas de recepción y conciliación Leben

Usar ID original, proyecto, campo, modelo y etapa como clave. Los datos del encargo de fase 2 no son respuestas. Un mensaje puede originar varias filas de recepción; conservar la comunicación común y su SHA-256 sin duplicar evidencias comerciales.

Registrar por respuesta: texto/valor tal como se recibe, unidad original, fuente, fecha de recepción, fecha documental, vigencia, página/línea y alcance por modelo/etapa. Una captura debe ser legible y permitir identificar proyecto, especificación y fecha/condiciones. Un precio sin UF/unidad, vigencia o alcance suficiente queda parcial o histórico; no inferir stock. No redondear ni sustituir valores directos Sollahms por campañas externas.

Una respuesta ambigua genera una sola pregunta concreta sobre lo que falta; no volver a pedir el documento ni información ya confirmada. En COM-F2-001 la ausencia de respaldo es explícita, no ambigua: no hace falta una aclaración semántica, hacen falta nuevos antecedentes.

Separar estado de recepción (esperando/recibida/en validación/requiere aclaración) del estado del dato: Confirmado documentalmente, Confirmado por propietario, Parcial, Histórico, Contradictorio, Desconocido y No aplicable. `Listo para incorporación` se registra además como estado de preparación, sin borrar la procedencia documental o del propietario. Exige campo/valor con respaldo, unidad y alcance conciliados; para precios también vigencia. Proyecto o inmobiliaria no se dan por completos por un único dato recibido.

Las seis superficies se registran separadas: útil, interior, total, terraza, jardín/patio privado y terreno. No sumarlas/restarlas ni convertir rangos ambiguos. Vincular dormitorios, baños y superficies al mismo modelo y etapa. Los identificadores de unidad 101/204/311 no se convierten en códigos de modelo. Un jardín común no demuestra patio privado; bodega e-commerce/náutica no demuestra bodega privada.

Antes de cambiar una celda, conservar el valor anterior y registrar antes/después, ID de respuesta, fuente y motivo. Los archivos originales y hashes del commit dd3a688 se conservan en historico/fase1-dd3a688 y evidencias originales. Mantener los 131 slugs y los otros 118 proyectos pendientes.

Las tres decisiones abiertas se encuentran en CONCILIACION-DISCREPANCIAS.csv. Conservar ambas fuentes y su alcance, sin elegir arbitrariamente. Los cuatro criterios de dirección ya documentados en fase 1 no se reclasifican como decisiones nuevas de fase 2.

No repetir la auditoría PDF. No ejecutar generadores de aplicación ni modificar fuentes productivas, precios, fichas, funciones, CRM360, Resend o integraciones. No crear deployments ni publicar/fusionar PR. Antes de sincronizar GitHub, la rama debe tener sus despliegues automáticos excluidos o existir evidencia verificable de su desactivación. No iniciar Euro automáticamente.
