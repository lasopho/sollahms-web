# Continuar Sollahms / Leben después de la fase 3

Continúa el trabajo documental desde el corte del 16 de noviembre de 2026, America/Santiago. Usa el repositorio `lasopho/sollahms-web`, la rama `codex/auditoria-leben-20261116` y el checkout independiente `/private/tmp/sollahms-auditoria-leben-20261116`. La base anterior a fase 3 es `27c21f28980ff120454980abfe5064cb9dd1d983`; consulta el HEAD y la referencia remota actuales sin cambiar `main`.

Lee primero:

- `docs/catalog-data-completeness-20261116/leben/INFORME-DEPURACION-LEBEN.md`.
- `leben/fase3-20261116/RESUMEN-IRIS.json`, `PENDIENTES-POR-CAMPO.csv`, `SOLICITUDES-FINALES-POR-PROYECTO.csv`, `CONTRADICCIONES-IRIS.csv` y `REGISTRO-CAMBIOS.csv`, dentro del mismo expediente.
- La matriz Leben, la maestra de 131 proyectos, `ESTADO-GLOBAL.json` y los siete archivos de `docs/iris-operational-manual/`.

`AGENTS.md` no existía en el corte. Si aparece, léelo antes de actuar. La base anterior está preservada en `historico/iris-27c21f2/MANIFIESTO-BASE.json`. No sobrescribas la evidencia histórica.

El resultado de fase 3 es: 330 pendientes iniciales y 330 finales; cero campos completos nuevos; una mejora parcial de Nórdico en bodegas opcionales para las unidades 104, 204 y 304, con hechos `F3-H001` a `F3-H003`. Se corrigieron dos etiquetas de divergencia numérica de baños en Bold e Indi, sin cerrar campos ni resolver sus conflictos de modelo. Hay 36 campos comerciales y 22 afectados por conflictos: 58 campos preparados para decisión o conciliación. Los otros 272 son falta de documentación o alcance suficiente. Estas cifras no equivalen a preguntas separadas. No se envió una nueva ronda de solicitudes.

La cobertura conservada es 198/689 campos con estado confirmado sin etiqueta de alcance (28,74 %). Presentar por separado los 42 confirmados dentro de un alcance limitado y las 99 propuestas `false` de catálogo. El indicador 359/689 (52,10 %) es cobertura administrativa, no completitud documental. Mantener el denominador 689 = 13 × 53. Ningún dato parcial o asociado solo a una unidad se cuenta como un campo completo nuevo.

No repetir los 11 brochures completos y sus 82 páginas, los 104 planos de unidad, las 105 plantas/elevaciones ni el reemplazo sin plano. Los 210 originales y sus SHA, así como los 3.213 hechos `IR-H`, permanecen en `iris-20261116/`. Las doce plantillas técnicas de Archivos ya fueron leídas por secciones permitidas y duplican datos. No volver a examinarlas sin un cambio de versión verificable. La plantilla puede omitir amenities respecto de la ficha; esa diferencia no significa ausencia. Los objetos de los 13 proyectos Leben en los archivos locales adicionales coinciden con la base de 131.

Quedan tres PDF INN sin lectura válida:

- Unidad 616 / modelo UI N: `694a1152bb220_pc-f-15-04.pdf`.
- Unidad 513 / B2: `694a0be8bd379_pc-f-03-04.pdf`.
- Unidad 601 / O1: `694a0b8a05509_pc-f-17-04.pdf`.

Un reintento autorizado de los tres mediante `pageAssets` volvió a fallar con `Failed to fetch`; no existen bytes, SHA ni lectura del documento. No repetir el mismo mecanismo salvo que cambie una condición verificable. Condiciones comerciales de INN expone otro PDF, clasificado como `other`; la exportación devolvió `unsupported asset kinds`. Su URL exacta y límite están en `DOCUMENTO-ADICIONAL-NO-EXPORTABLE.json`. No afirmar que esos documentos o datos no existen. Si se recibe el archivo original o aparece otro mecanismo UI documentado y válido, revisar únicamente esos documentos y sus campos pertinentes. No usar HTTP externo, endpoints privados, recursos reclasificados ni URLs adivinadas.

Usa Chrome y la sesión autorizada. Si Iris solicita acceso, abre la autenticación oficial visible y detén la automatización. El propietario debe introducir personalmente correo, contraseña, OTP y CAPTCHA. Espera su confirmación y comprueba después el catálogo. No solicites, leas, copies ni guardes credenciales, cookies, tokens, almacenamiento o secretos en archivos, logs, variables de entorno o repositorios. No automatices contraseñas ni cierres sesión.

La navegación aprendida en fase 3 permite abrir Archivos mediante el botón visible `button.filter-estate.dropdown-toggle`. El texto del `span` puede estar oculto y el nombre accesible puede ser ambiguo; verifica el DOM actual antes de interactuar. Living Town pudo revisarse con ese botón. Lee únicamente Características, Amenities, Descripción y Ubicación mediante el encabezado y su siguiente hermano; nunca el texto completo del menú o su anchor. Una prueba de Imprimir ficha técnica bloqueó la pestaña propia de Mood y no produjo un PDF exportable. No repetir esa acción ni confirmar impresión física. Las otras plantillas se leyeron sin imprimir. Once fichas ofrecen impresión, brochure y condiciones; Nórdico solo ofreció impresión.

Mantén separadas útil, interior, total, terraza, patio/jardín privado y terreno. `Internos` no equivale a útil o interior. No sumar áreas ni renombrar logia o rooftop. Una unidad no es un modelo. Conserva la relación DOM → recurso adjunto separada del alcance que imprime el gráfico. No extender los dos cuadros parciales de Mood a la unidad 1702 ni a todas las versiones E/J. En INN, el plano F/406 se enlaza también a 806/906: `F3-C001` impide transferir métricas o torre sin aplicabilidad expresa.

Bold 312 conserva el conflicto S1/Estudio, e Indi 607 conserva D/A2 y 2D/1D. Los baños coinciden en 1/1; no preguntar por una divergencia numérica inexistente. Los inventarios siguen parciales. Continúan abiertos INN S/605 (baños 3/2), R/604 y Q/603 (dormitorios 4/5), Argomedo C1/C, Indi A4/C1 y Capitanes A con alcance 201 al 301 enlazado a 501/601. Resolver solo con respaldo específico o decisión expresa.

Conserva exactamente las direcciones Sollahms y las cuatro decisiones previas, sin pedir otra confirmación. Argomedo 380/382, Indi Hipódromo1816/Vallenar2070 y cubiertas INN cuarzo/ultracompacto travertino siguen pendientes de conciliación; ninguna fuente Iris autoriza modificar las fichas. Own permanece vendido, sin buscar un sustituto ni pedir precio o disponibilidad. Parque Germania es ESEPE, fuera de Leben.

Los cuatro precios B1A ya fueron solicitados. `COM-F2-001/F022` indicó que Living Town, Mood, Santo y BAUM carecían de respaldo actual. No repetir esas preguntas sin antecedentes nuevos. Las otras solicitudes comerciales previas siguen en espera. Los precios Iris son referencias fechadas y dinámicas, no precios propios Sollahms vigentes. Ante una nueva cotización o declaración precisa, registrar vigencia, unidad/modelo, condiciones y antes/después sin borrar fuentes.

Para amenities con brochure completo sin mención, conservar `false` como propuesta de catálogo por instrucción expresa, sin afirmar ausencia física. Preservar los positivos discrepantes de Iris. Sin brochure, como Nórdico y Own, el silencio nunca implica `false`. No extender esta regla a interiores, superficies o comercio. Excluir siempre las columnas Realizado por, Comisión, porcentajes y atribuciones de intermediarios de la extracción y entrega.

El siguiente trabajo se limita a documentos nuevos, a los PDF no exportables cuando exista una vía válida y a las decisiones concretas del informe. Solicitar documentación consolidada solo para modelos, versiones, métricas o terminaciones aún sin respaldo. No reenviar las solicitudes originales completas ni pedir datos ya recuperados. Conservar los IDs L y los hechos originales; asignar IDs nuevos a hechos nuevos, con fuente, sección, alcance y SHA cuando existan bytes. No cerrar Leben para reducir contadores.

El trabajo es exclusivamente documental. No tocar producción, HTML, catálogo, filtros, precios, direcciones, formularios, CRM 360, Resend ni funciones serverless. No ejecutar builds o generadores de la aplicación. La exclusión de deployments de esta rama está autorizada y activa: conservarla. Sincronizar solo documentación en esta rama, sin PR, cambios en `main`, deployments o publicación. Verificar los 235 hashes originales, la base histórica, los IDs, los 131 slugs y el árbol limpio. Actualizar manual, historial y fecha ante cambios de interfaz. No iniciar Euro ni otra inmobiliaria automáticamente.
