# Recepción y validación documental Leben — fase 6

Corte 16/11/2026, America/Santiago. La base es da5506875cf2f09133e883db55d3e8717d88c95d. El registro está preparado y no contiene recepciones nuevas. Los criterios F5 y F049 continúan vigentes dentro de su alcance documental.

## Registro y preservación

1. Recibir solo el archivo o declaración expresamente proporcionado por el propietario. Las instrucciones de trabajo, la plantilla vacía y los paquetes esperados no son antecedentes recibidos.
2. Registrar fecha de recepción con zona horaria, nombre original, formato real, tamaño, emisor declarado, proyecto y paquete F5. La fecha documental se registra aparte y solo si consta. Si proyecto, modelo, unidad o versión no constan, dejar ese dato vacío y registrar la limitación.
3. Calcular SHA-256 de los bytes recibidos antes de extraer. Conservar una copia exacta en `originales/<id_recepcion>/<nombre_seguro>`, manteniendo el nombre recibido en el registro. Comprobar igualdad de hash entre entrada y copia, sin alterar ni sobrescribir ninguna. No asignar el hash de una URL o nombre a un documento no recuperado.
4. Para texto en chat, preservar una transcripción fiel UTF-8 de la comunicación con su referencia y fecha. El hash identifica esa transcripción, no un supuesto archivo binario entregado. No recortar el alcance o autor de una declaración. OCR, recortes y conversiones son derivados separados y nunca reemplazan el original.
5. Comparar SHA con las fuentes anteriores. Un duplicado conserva su referencia y no origina hechos nuevos por sí mismo. Si el mensaje acompañante aporta alcance nuevo, preservar y evaluar esa declaración por separado. Un archivo con varios proyectos mantiene una identidad binaria y asociaciones explícitas, sin multiplicar documentos por cada campo.

REGISTRO-RECEPCION-DOCUMENTOS contiene solo recepciones reales. DOCUMENTOS-AUN-FALTANTES contiene expectativas: 13 paquetes y cuatro anexos INN. No copiar esas 17 filas al registro de recepción. Los campos potenciales son candidaturas y no indican validación o cierre.

## Validación por soporte

| Soporte | Comprobación y localizador por hecho |
| --- | --- |
| PDF, memoria de terminaciones | Apertura, número de páginas, legibilidad y rótulos. Citar página y sección/cuadro. En escaneados, contrastar OCR con imagen; no reconstruir cifras ilegibles. |
| Excel | Hoja y celda/rango, proyecto y alcance. Separar fórmulas, datos precargados y respuestas nuevas. La plantilla F5 sin respuesta no aporta nueva evidencia. Una celda rellena no produce cierre automático. |
| CSV | Codificación, separador, encabezados, clave estable y fila. Conservar IDs como texto y el literal, precisión y rótulo. Vacío no equivale a cero o false. |
| Fotografía o captura | Contexto visible que identifique proyecto y alcance, legibilidad y región que respalda el dato. El nombre del archivo o parecido del plano no acreditan identidad. |
| Plano | Proyecto, código, revisión, torre/etapa y unidades/versiones impresas o aplicabilidad expresa. No identificar modelo solo por filename. |
| Texto o declaración comercial | Literal, comunicación de origen, emisor, fecha, proyecto y modelo/versión/unidad según lo declarado. Distinguir confirmación comercial de respaldo técnico específico. |

Mantener útil, interior, total, terraza, patio/jardín y terreno separados. Conservar Internos, logia y rooftop con su rótulo. No sumar, restar ni equiparar métricas. Una misma cifra o un enlace compartido no prueba equivalencia o aplicabilidad.

## Hechos, fuentes y decisiones

Asignar IDs nuevos solo al producirse un hecho real: F6-R001 y siguientes para recepción, F6-H001 para hechos y F6-CR001 para resoluciones. Consultar el siguiente ID libre en cada registro, sin reservar o consumir una secuencia por la preparación. Las nuevas fuentes continúan la serie F canónica tras comprobar unicidad; la base actual termina en F049. No renumerar L, F, IR-H, IR-P, F3-H o F4-H existentes.

Cada hecho remite a recepción y fuente, clave `slug + campo_id`, valor literal y normalización justificada, unidad/rótulo, modelo, unidad, versión, torre y alcance, localizador y fuentes comparadas. Una lectura validada puede aportar evidencia parcial o contradictoria: no significa hecho físico confirmado. Registrar lo que falta y si el alcance alcanza para cerrar la clave completa. Lo ilegible queda en recepción pendiente de validación, sin un valor inventado en HECHOS-VALIDADOS.

Estados del dato: Confirmado por documento, Confirmado por propietario, Parcial, Histórico, Contradictorio, Desconocido y No aplicable. El estado de recepción se mantiene separado. No aplicable exige respaldo explícito; no se deduce de omisión. Una fecha posterior no invalida automáticamente una versión anterior.

D-03 exige material comercial aplicable y su alcance por modelo o versión. Si cuarzo y ultracompacto con terminación travertino corresponden a versiones diferentes, documentar ambas asignaciones. Si falta respaldo suficiente, conservar la contradicción y obtener memoria o declaración precisa. Los once conflictos técnicos requieren plano, cuadro o aclaración técnica específica; una afirmación general D/B no resuelve cada unidad. Los [criterios por caso y anexo](CRITERIOS-CONFLICTOS-Y-ANEXOS.json) conservan los alcances exactos.

F3-C001 permanece fuera de los doce conflictos. La resolución de INN F/406 no traslada torre o superficies a 806/906 sin aplicabilidad expresa. Los tres PDF 616/N, 513/B2 y 601/O1 se procesan directamente si llegan; registrar hash, páginas y rótulos reales. No repetir exportaciones fallidas.

CONFLICTOS-RESUELTOS admite una fila cuando el alcance registrado resuelve efectivamente el caso o el límite original que identifica. Debe conservar A/B, hechos nuevos, motivo, fecha y alcance. Una aclaración parcial se documenta como hecho parcial y mantiene el conflicto abierto. Resolver una unidad no completa automáticamente un campo global ni un proyecto. No borrar fuentes antiguas.

## Incorporación y conciliación del saldo

Antes de cada cambio conservar estado/valor anterior y registrar después, hecho, fuente, recibo, localizador y motivo. Solo actualizar matrices canónicas, fuentes, confirmados/parciales y cobertura cuando exista respaldo nuevo suficiente. Mantener PENDIENTES-ACTUALIZADOS como ledger completo de la cohorte original de 313: `sigue_pendiente_fase6` distingue abiertos de cerrados futuros y `nuevo_campo_completo_fase6` no cuenta parcialidades. Conservar filas e IDs cerrados para trazabilidad, y calcular el saldo contando exclusivamente los que siguen pendientes.

Los trece paquetes no equivalen a trece documentos físicos obligatorios. Pueden recibirse extractos existentes y un archivo puede cubrir varios grupos. Actualizar por campo, no marcar todo un paquete o proyecto completo por un solo original. Los cuatro anexos INN pertenecen a F5-DOC-11 y no suman cobertura primaria adicional a los 287 campos.

Los veinte precios y dos adicionales F049 están aceptados al 16/11/2026. No aplicar retroactivamente la exigencia de una nueva vigencia o ratificación del protocolo F2. Conservar las trece direcciones fuera de preguntas y las esperas Santo L-009 / BAUM L-013 sin una ronda nueva. Own permanece vendido.

Sin nuevos antecedentes, dejar recepción/hechos/resoluciones con solo encabezados. No registrar este procedimiento como fuente inmobiliaria ni asignarle un F. La maestra/global pueden reflejar preparación administrativa sin cambiar datos o cobertura. No publicar ni empezar Euro.

Reutilizar Iris solo ante una fuente nueva concreta. Se conserva autenticación interactiva en Chrome: propietario ingresa credenciales, OTP/CAPTCHA y confirma la sesión; detener automatización durante ese acceso. No leer, copiar o almacenar credenciales, cookies o tokens, automatizar contraseñas, cerrar sesión o modificar seguridad. No repetir brochures, imágenes, plantillas o rutas de exportación fallidas.
