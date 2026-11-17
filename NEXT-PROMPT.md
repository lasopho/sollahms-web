# Continuar Sollahms / Leben desde el corte de fase 7

Repositorio `lasopho/sollahms-web`, rama `codex/auditoria-leben-20261116`, checkout independiente `/private/tmp/sollahms-auditoria-leben-20261116`. Corte de fase 7: **17/11/2026, America/Santiago**. Base local/remota de inicio: `0fc4657f3d39a32042fce0a908d92269b0ad3cc8`. Antes de modificar consulta HEAD y remoto actuales y conserva cambios posteriores. Lee AGENTS.md si aparece. No usar el checkout original con cambios ajenos.

## Expediente activo y saldo

Lee `docs/catalog-data-completeness-20261116/leben/INFORME-FASE7-LEBEN.md` y `leben/fase7-20261117/`: `RESUMEN-FASE7.json`, `BASE-Y-TRAZABILIDAD.json`, `REGISTRO-RECEPCION-FASE7.csv`, `HECHOS-VALIDADOS-FASE7.csv`, `CONFLICTOS-RESUELTOS-FASE7.csv`, `PENDIENTES-REALES-LEBEN.csv`, `DOCUMENTOS-AUN-FALTANTES.csv` y verificaciones. Lee también los siete archivos del manual Iris y NEXT-PROMPT.

La fase 7 recibió únicamente instrucciones de trabajo, sin nuevos archivos o declaraciones inmobiliarias. No se procesó evidencia nueva: cero recepciones, hechos, resoluciones, cierres o avances parciales. Los tres registros de corte tienen solo encabezados. No tratar el encargo, el protocolo o una plantilla vacía como una fuente nueva, ni crear filas para las expectativas documentales.

Saldo anterior y actual: **313 campos**. Dentro del saldo: **107 parciales, 177 desconocidos, 20 contradictorios y 9 históricos**. En el universo de 689: 215 confirmados (196 documento y 19 propietario), 161 parciales, 177 desconocidos, 26 contradictorios, 99 propuestas false de catálogo, 9 históricos y 2 no aplicables. Cobertura confirmada 215/689 =31,20 %. No contar parcialidades o false propuesto de catálogo como confirmación física.

La base mantiene 287 campos documentales/de alcance, 20 de conflicto y seis comerciales anteriores. La coordinación es 306 campos de respaldo documental/técnico, una precisión D-03 y seis esperas Santo/BAUM. No son 313 preguntas. Trece paquetes F5-DOC-01..13 y cuatro anexos INN siguen no recibidos; los 287 campos se asignan una vez en MAPEO-DOCUMENTOS F5.

## Registros operativos y recepción real

Reutiliza `leben/fase6-20261116/PROTOCOLO-RECEPCION-Y-VALIDACION.md`, `ESQUEMAS-RECEPCION.json` y `CRITERIOS-CONFLICTOS-Y-ANEXOS.json`. Los registros operativos son `REGISTRO-RECEPCION-DOCUMENTOS.csv`, `HECHOS-VALIDADOS-FASE6.csv`, `CONFLICTOS-RESUELTOS.csv` y `PENDIENTES-ACTUALIZADOS.csv` en esa carpeta. Se conservaron intactos en fase 7 porque no hubo datos nuevos. La maestra y el estado global también permanecieron intactos.

Procesa únicamente PDF, Excel, CSV, planos, fotografías, capturas, memorias o declaraciones que el propietario efectivamente proporcione. Preserva bytes, nombre y SHA-256 antes de extraer y comprueba el hash de la copia. No modificar originales. Transcripciones fieles de chat y derivados OCR/recortes se identifican como tales y no reemplazan originales. Mantén fecha de recepción con zona horaria separada de fecha documental.

Por cada archivo identifica fuente, proyecto, modelo, unidad, versión, alcance y unidad/rótulo. Registra página/sección, hoja/celda, fila/clave o región de imagen. Si algo no consta o es ilegible, conservar la limitación sin inventarlo. Diferenciar respuestas nuevas de información precargada en Excel. Un duplicado SHA no aporta un hecho nuevo por sí mismo; un mensaje nuevo de alcance que lo acompañe se preserva y evalúa aparte.

No asignar IDs por preparar registros. Cuando llegue evidencia real, continuar el siguiente F6-R, F6-H y F6-CR libre para recepción, hecho y resolución, sin renumerar históricos. Para fuentes continuar la serie F tras consultar FUENTES-DOCUMENTALES; la base termina en F049. Cada hecho enlaza recepción/fuente, `slug + campo_id`, literal, normalización justificada, métrica, alcance y localizador.

Actualizar aditivamente los registros F6 únicamente con evidencia real y conservar cada base anterior en Git/corte. Mantener la cohorte original de 313 claves e IDs en el ledger; un cierre cambia `sigue_pendiente_fase6`, registra antes/después, hecho, fuente, recibo y motivo, y conserva la fila histórica. El informe y PENDIENTES-REALES proyectan solo abiertos. Una aclaración parcial no cierra un caso, un campo global o un proyecto. No borrar A/B ni invalidar una versión solo por fecha posterior.

## Prioridad INN Puerto Chico

1. **D-03:** F005 brochure p.4/E0392 y F021 línea 87/E0679 dicen cuarzo; F014/E0400, verificación archivada 09/10/2026, ultracompacto con terminación travertino. Requiere material comercial aplicable y alcance por modelo/versión. Si ambas corresponden a versiones distintas, registrar cada asignación. No elegir arbitrariamente. Si falta respaldo, conservar abierto y obtener memoria/declaración precisa.
2. **F5-ANX-INN-01:** original 616/modelo UI N, `694a1152bb220_pc-f-15-04.pdf`.
3. **F5-ANX-INN-02:** original 513/B2, `694a0be8bd379_pc-f-03-04.pdf`.
4. **F5-ANX-INN-03:** original 601/O1, `694a0b8a05509_pc-f-17-04.pdf`.
5. **F5-ANX-INN-04 / F3-C001:** aplicabilidad de IR-P125, Torre B/Depto. 406, a 806/906 o sus planos correctos. El gráfico imprime interior 88,8, terraza 26,36, patio 20,7 y total 135,86; no atribuir torre o medidas a 806/906 por compartir enlace. Es un límite adicional, fuera de los doce conflictos.

Los tres PDF no tienen nuevos bytes ni hashes. Si llegan, procesarlos directamente, registrar SHA/páginas y cotejar rótulos reales; no deducir unidad/modelo por filename ni repetir las exportaciones fallidas. Los cuatro anexos pertenecen al paquete INN F5-DOC-11, sin cobertura adicional sobre los 287 campos.

## Después, los once conflictos técnicos

Usa `leben/fase5-20261116/DOSSIER-CONFLICTOS.json` y `CONFLICTOS-TECNICOS-LEBEN.csv`, con los criterios específicos F6. Siguen abiertos:

- IR-C001 Living A1/603 y803: UI 2D2B frente a plano 2D1B. Una categoría general F049 no acredita A1.
- IR-C003 Mood A/303: UI 2D2B frente a gráfico 1,5D2B, observación previa DEPTO 201. No redondear ni aplicar 201 a303 sin respaldo.
- CAP-A-ALCANCE: A/501 y601 frente a plano que imprime 201 al301. No equiparar Internos a interior por coincidencia numérica.
- BOLD-S1-TIPOLOGIA: 312 Estudio S1 frente a gráfico 1D1B; baños coinciden.
- BOLD-F-SUPERFICIES: P106 enlazado207/307 yP107 a508 no imprimen las áreas de P108 enlazado a608. P108 imprime interior62,40/terraza3,12/total65,52 y alcance207 al407,508,608. UI207/307/508 Internos61,67/terraza3,71;608 Internos63,44/terraza3,71. No transferir medidas ni expandir rangos.
- ARG-C-C1: 915, UI C1 frente a gráfico C, ambos2D2B. No inventar equivalencia.
- INDI-D-PLANO-A2: 607, UI D2D1B frente a gráfico A2 1D1B. Filename no decide; baños coinciden.
- INDI-A4-PLANO-C1: 411, UI A4 frente a gráfico C1, ambos2D2B. No propagar a1104/805 por URL.
- IR-C020 INN S/605: UI3D3B frente a gráfico3D2B, Torre A605/705 impresa.
- IR-C021 INN R/604: UI4D4B frente a gráfico5D4B, Torre A604/704 impresa.
- IR-C022 INN Q/603: UI4D4B frente a gráfico5D4B, Torre A603/703 impresa.

Una lectura confirmada de una fuente no confirma automáticamente el hecho físico, la aplicabilidad o vigencia. Se necesita documento/aclaración técnica específica; no resolver por semejanza, geometría o elección personal.

## Información ya aceptada y límites

F049/COM-F4-001 es la comunicación del propietario del 16/11/2026: 65 declaraciones, veinte precios de inmuebles y dos adicionales Suecia, aceptados a esa fecha. Está en fase4-20261116; SHA `e0dba3dcf5ff8698ab18d1a67a308ad513d7e3da0b065eda22bd5018278fac5d`. Leer PRECIOS-PROPIETARIO y HECHOS-PROPIETARIO-FASE4 si hace falta comparar; no solicitar ratificación ni sustituir por Iris, históricos o una garantía futura.

Conservar INN 2D UF 10.500, 3D UF 10.016, 4D UF 21.869 sin intercambiar; Índigo 2D UF 9.001. Suecia declara Modelo 203/3D3B, no unidad 203 ni Iris F/206. Capitanes declara unidad 501/3D3B, no modelo 501. Estacionamiento/bodega son adicionales y se excluyen del precio de inmueble en los diez proyectos con cotización; Suecia UF 510/UF 75 van separados del inmueble. No derivar mínimos globales de los siete listados por categoría ni inferir baños no declarados, stock o asignaciones.

Conservar Santo L-009 y BAUM L-013 en espera sin reeditar B1A ni nueva ronda. Own sigue vendido, sin precio o disponibilidad solicitados. Las trece direcciones quedan fuera de preguntas; D-01/D-02 siguen archivadas, sin afirmar equivalencia física. Parque Germania es ESEPE, fuera de Leben. Living “en blanco” es categoría comercial; recepción final no determina fecha/año de entrega.

Mantener útil, interior, total, terraza, patio/jardín y terreno separados; Internos, logia y rooftop conservan rótulo propio. No sumar o equiparar superficies ni extrapolar planos. SUPERFICIES F4 contiene 330 filas UI y 104 planos, que no son 434 unidades; TIPOLOGIAS añade 20 referencias comerciales sin crear 20 unidades. Los 30 planos con cuadro aportan útil 8/interior 22/total 30/terraza 28/patio 8/terreno 0.

No repetir los once brochures/82 páginas, 210 gráficos o doce plantillas. El PDF adicional de condiciones INN other no exportable no es una petición técnica por contenido supuesto. No repetir Imprimir Mood ni exportaciones fallidas, forzar tipos, inventar URLs o usar endpoints privados/HTTP externo. Si no hay fuente nueva concreta, no abrir Iris ni repetir extracción.

Si Iris solicita acceso, abrir autenticación oficial en Chrome visible y detener automatización. El propietario introduce personalmente correo, contraseña, OTP/CAPTCHA. Esperar confirmación y verificar catálogo antes de reanudar. No solicitar, leer, copiar o almacenar credenciales, cookies o tokens, automatizar contraseñas, cerrar sesión o cambiar seguridad. Si expira, repetir intervención directa.

Amenities: false propuesto por omisión en brochure completo no demuestra ausencia física; preservar positivos y divergencias. Sin brochure, desconocido hasta respaldo. F049 respalda oferta general de bodega Nórdico, sin stock/asignación por unidad. No extender esa regla a superficies, interiores o condiciones comerciales. Excluir Realizado por, Comisión, porcentajes y atribuciones de intermediarios.

## Protección y entrega

Trabajo exclusivamente documental. No modificar producción, HTML/fichas, filtros, catálogo, precios publicados, direcciones, formularios, CRM360, Resend o funciones. No ejecutar generadores/builds de aplicación. Mantener checkout independiente y exclusión de deployments autorizada. No crear PR/deployments, publicar, fusionar o modificar main. No empezar Euro automáticamente.

Regla activa de fase 8 (17/11/2026): sin evidencia nueva, conservar estados y saldo y entregar una única solicitud concreta del siguiente antecedente necesario. No generar otro corte, informe, registro o estructura documental vacía. No crear recepciones, hechos o resoluciones ficticios ni repetir preguntas. La siguiente solicitud es D-03 de INN: declaración expresa o memoria con material de cubierta y alcance por modelo/versión. Ante evidencia suficiente actualizar únicamente campos y registros afectados, fuentes, contradicciones, confirmados/parciales, cobertura y maestra, conservando 13 identidades, 118 proyectos restantes y todos los IDs. Preservar 235 hashes originales y cada base histórica. La matriz canónica conserva estados/valores F4 hasta incorporación explícita de hechos posteriores.

Sincronizar únicamente documentación en la rama de auditoría. Verificar hashes, HEAD remoto, main, exclusión de deployments y árbol limpio. Actualizar manual técnico solo ante aprendizaje nuevo. Solo cuando exista evidencia nueva, actualizar los registros F6 y crear el corte F8 con informe, recepciones, hechos validados, resoluciones y pendientes respaldados. Sin evidencia nueva, entregar solo la solicitud concreta y el siguiente prompt completo; no iniciar Euro hasta cerrar Leben.
