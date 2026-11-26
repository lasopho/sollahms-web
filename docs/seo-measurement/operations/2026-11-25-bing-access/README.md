# Bing Webmaster Tools: acceso y seguimiento reutilizable

Verificación del 25/11/2026, America/Santiago. Esta operación recupera métricas y acceso del sitio existente; no modifica contenido, configuración pública, integraciones comerciales ni producción. Reutiliza el [estudio permanente](../../STRATEGY-v3.md), la [política activa](../../active-policy.json), el [alcance v3 de doce URL](../../scope-v3.json) y el [informe del ciclo](../../runs/2026-11-25-autonomous-improvements/report.md).

## Acceso confirmado y límite de autenticación

La sesión existente de Chrome permitió consultar la propiedad **https://sollahms.cl/** y su administración de usuarios. La interfaz identificó **lsandoval@sollahms.cl**, con **Administrator / verified administrator** y verificación **Verified by DNS**. Esto verifica acceso operativo a esa propiedad con la sesión observada; no se deduce de un correo candidato, de una etiqueta DNS antigua ni de disponer de otra herramienta de Microsoft.

El proveedor usado para iniciar esa sesión —Google o Microsoft— **no quedó expuesto**. No es necesario cerrar una sesión operativa para averiguarlo. No se crearon cuentas, se cambiaron permisos ni se consultaron contraseñas, cookies, tokens o credenciales. La comprobación actual resuelve el bloqueo de acceso registrado anteriormente; aquel registro se conserva como antecedente histórico.

Antes de cada seguimiento, abrir Bing Webmaster Tools en la sesión autorizada, confirmar la propiedad literal y comprobar una lectura privada satisfactoria. Reutilizar esa sesión mientras esté vigente. Si exige contraseña, MFA, nueva autorización o consentimiento, detener únicamente la autenticación y registrar el paso visible; continuar con las fuentes independientes. No elegir otra identidad o proveedor por ensayo, ni crear/importar otra propiedad. El acceso de hoy no garantiza que una sesión siga autenticada en una fecha futura.

## Lectura y procedencia

Registrar el instante de extracción con zona, propiedad, informe, período seleccionado, fechas realmente devueltas, fuente/vertical literal, filtros y límites de tabla. La hora de extracción se puede presentar en Santiago; las fechas nativas del informe se conservan sin desplazarlas. Si la zona nativa no aparece, registrar `not_displayed` o su equivalente explícito, sin atribuirle la zona de Google o de GA4.

La gráfica general puede indicar **Web and Chat** y contener catálogo/fichas. La tabla de páginas observada declara **Web**. Conservar ambas definiciones: no intercambiar sus cifras, no sumar tablas marginales de páginas/consultas como si fueran totales nativos y no restar fichas para construir un supuesto total corporativo. Aplicar únicamente las doce URL canónicas del registro v3; las ausentes quedan desconocidas, no cero.

Conservar capturas o exportaciones originales y sus hashes en almacenamiento privado autorizado. En Git y OpenSEO incorporar sólo resúmenes revisados, sin datos de personas ajenas al encargo, cookies, enlaces de autenticación o secretos. Una transcripción de la interfaz se etiqueta como tal; no se presenta como exportación nativa descargada. Los hashes permiten comprobar integridad local, no autentican por sí solos la procedencia de Bing.

## Períodos y comparación recuperados

La lectura actual del **11–17/11** reproduce las filas Web del [registro del 19/11](../../runs/2026-11-19-weekly-comparison/bing-comparison.json):

| URL incluida | Impresiones | Clics | CTR mostrado | Posición media |
| --- | ---: | ---: | ---: | ---: |
| https://sollahms.cl/ | 5 | 0 | 0,00 % | 1,2 |
| https://sollahms.cl/contacto.html | 1 | 0 | 0,00 % | 3 |

Son filas parciales por página. No constituyen un total nativo del segmento y no prueban una posición fija para todas las búsquedas. El histórico del 2–8/11 no devolvió filas corporativas; tampoco se transforma en cero medido.

Para la selección **18–24/11**, no se observaron filas corporativas ni filas de las marcas consultadas. La tabla de fechas devuelta cubre **18–23/11**; el **24/11 está ausente**. Conservar la selección solicitada y esa cobertura efectiva por separado. No calcular un descenso del 100 %, rellenar el día ausente ni declarar una comparación semanal completa. Un agregado del 11–17 tampoco permite reconstruir el 11–16: sólo una lectura nativa de esa ventana permitiría comparar seis días equivalentes por página.

La publicación SEO/GEO ocurrió el **25/11 a las 18:11:35.881 de Santiago**. Los períodos anteriores no miden su efecto. Para futuras comparaciones, registrar el último día completo realmente disponible y mantener el mismo período, fuente, filtros y conjunto de URL. Las series de Google y Bing se presentan por separado; una ausencia o un promedio de posición en un motor no se sustituye por datos del otro.

## Consultas de marca

Registrar por separado las cinco búsquedas sin términos adicionales: **Sollahms**, **Sollams**, **Solams**, **Solamp** y **Solamps**. Conservar la consulta literal y el filtro utilizado. Para clasificar búsquedas simples, comparar la consulta completa —sin espacios exteriores y sin distinguir mayúsculas— con cada término; una búsqueda compuesta, una dirección de dominio o una coincidencia parcial pertenece a otra fila/grupo. `Sollams` a secas conserva la prioridad de seguimiento del estudio; la marca pública sigue siendo Sollahms.

Para una fila de consulta, abrir sus páginas asociadas sólo cuando la interfaz lo ofrezca y clasificar esas páginas con el registro v3. En el desglose observado de **Sollahms** para el 11–17/11, Inicio muestra **1 impresión / 0 clics / posición 1** y Contacto **1 / 0 / posición 3**. El valor **7** de la tabla general de esa consulta incluye páginas excluidas: no se presenta como resultado corporativo. Tampoco se convierte la suma de las dos filas observadas en un total nativo exhaustivo de la consulta.

Las consultas compuestas se conservan aparte de las cinco simples. Una consulta sin fila sigue como `no_row_returned`/desconocida; no significa cero búsquedas en Bing. No se obtiene volumen de demanda a partir de una tabla parcial ni se añaden estas variantes artificialmente al contenido del sitio.

## Indexación, sitemap y rastreo

Leer los estados existentes mediante URL Inspection para URL incluidas y conservar razón literal, fecha de descubrimiento, último rastreo y canonical cuando se muestren. La disponibilidad HTTP, una prueba de URL publicada y una solicitud aceptada no sustituyen el estado del índice. No pulsar Request indexing, reenviar sitemap o iniciar un Site Scan como parte de esta operación de lectura.

La inspección de **Entorno** muestra descubrimiento el **11/11** sin rastreo establecido por esa inspección. Esto describe la evidencia de Bing; no se reemplaza por el estado diferente de Google. Centro figura descubierta desde el 02/11 y sin rastrear; Inicio figura indexada. Su último rastreo se muestra como «Today at 02:30», sin zona nativa verificada: se conserva literal y no se usa para probar procesamiento posterior a T0. Las otras nueve URL no se inspeccionaron nuevamente en esta tarea.

El sitemap existente figura **Success**, con **144 URL** y último rastreo mostrado el **22/11**. Es un dato del sitemap, no una confirmación de que las 144 páginas estén indexadas ni de que Bing haya procesado el contenido publicado el 25/11. No se modifica una configuración que ya funciona.

## IndexNow: recepción separada de indexación

El [acuse original del 25/11](../../../seo-geo-20261125/indexnow-submission.json) registra un único POST de Entorno y Centro a las **21:12:18 UTC / 18:12:18 Santiago**, con **HTTP 202** y estado `received_key_validation_pending`. Se conserva ese acuse; no se reenvía para intentar obtener otro código.

La prueba pública de propiedad responde HTTP 200 y su hash coincide con el registro original. Esto confirma que el archivo es accesible y coincide; no demuestra que el motor haya terminado de validarlo. El panel IndexNow observado mostró la pantalla informativa **Get Started**, sin un historial privado verificado de recepción o procesamiento. Esa pantalla no acredita que la integración no exista, que la clave sea inválida ni que las dos URL estén indexadas.

En siguientes lecturas, consultar sólo el historial que el panel realmente ofrezca y registrar por URL sus estados/fechas y la fuente. Distinguir **aviso recibido → propiedad validada → URL descubierta → rastreada → indexada**. La recepción IndexNow no constituye una consulta autenticada a Bing, no comprueba citas de Copilot y no es un envío a Google o OpenAI.

## Integración con los formatos existentes

Se revisaron las fuentes existentes de [seo_measurement.py](https://github.com/lasopho/sollahms-web/blob/412917b5297defb22c1d4e7be74033876e8b79d5/scripts/seo_measurement.py) y [seo_scope.py](https://github.com/lasopho/sollahms-web/blob/412917b5297defb22c1d4e7be74033876e8b79d5/scripts/seo_scope.py), referencia de documentación **412917b5**. No se crea otro importador ni se cambian sus contratos para aparentar cobertura completa.

- **Exportación nativa disponible:** conservar original y manifiesto real; usar `import-performance` con dimensión `page` para los agregados por página, sin columna de fecha inventada. El manifiesto recoge período, fuente, filtros, zona y límites reales; `coverage_complete` no se marca verdadero sin evidencia. Después, `seo_scope.segment` conserva sólo la lista v3 y declara `partial_page_table`, `native_scoped_total=false` y `daily_comparison_eligible=false`.
- **Sólo tabla agregada de la interfaz:** conservar las filas como observación UI dentro del JSON Bing y el informe del ciclo existentes, con evidencia, período y clasificación v3. `import-performance` admite `origin=real_export` o `synthetic_test`; no admite una transcripción UI como origen propio. No etiquetar una transcripción como exportación nativa para superar esa guarda. No distribuir sus impresiones entre días ficticios ni invocar `compare` con ese agregado.
- **Consultas:** conservar su filtro de página/propiedad y su carácter parcial. `seo_scope.segment` admite páginas o estados de indexación, no tablas marginales de consultas. Un agregado de consulta del dominio no pasa a ser corporativo porque la palabra coincida con la marca; usar el desglose real de páginas asociadas cuando exista.
- **Indexación:** si existe una exportación nativa, usar `import-indexation` con sus estados y referencias, después segmentar por v3. Una captura/lectura UI se conserva como observación identificada, sin denominarla exportación. `unknown` no se convierte en `not_indexed` por falta de fila.
- **Serie diaria:** `bind-daily` exige una prueba revisada del filtro nativo con exactamente las doce URL y hash de su evidencia. `compare` conserva las reglas existentes de períodos completos de 30/90 días y rechaza series globales, no vinculadas o incompletas. No fabricar ese justificante a partir de una selección posterior de páginas ni usar el histórico parcial para forzar una comparación semanal.

No hace falta extender el importador para registrar estas observaciones UI: el ciclo ya emplea JSON con procedencia y tablas parciales de Bing desde el 19/11. Si una futura exportación requiere un cambio de formato real, corregir el importador existente y probar ese caso, preservando los originales; no debilitar las guardas de origen, alcance o fechas.

## Continuidad y validación del siguiente seguimiento

Actualizar el registro Bing del ciclo y el puntero `current_bing_measurement` de la política con la evidencia verificada, conservando el bloqueo anterior y las mediciones históricas como antecedentes. Actualizar el informe privado existente de OpenSEO **29f4cbc1-4e1f-4c01-8df0-24625149cdc1**, sin crear una copia del mismo trabajo ni habilitar difusión pública. Los datos de Google, ChatGPT y GA4 ya recuperados mantienen sus fuentes, condiciones y zonas; esta operación no repite sus mediciones.

Conservar la automatización **seguimiento-semanal-seo-geo-de-sollahms**, los **jueves a las 10:00 de America/Santiago**. Antes de afirmar que podrá obtener datos en cada ejecución, comprobar sesión/propiedad y una consulta privada real en esa ejecución. Si caduca la sesión, registrar el bloqueo preciso y continuar las demás fuentes, sin prometer acceso API persistente que no se ha configurado.

El cierre valida identidad/rol observados, propiedad, lectura privada satisfactoria, procedencia y filtros de cada cifra, clasificación exacta v3, fechas/ausencias y enlaces a evidencia. El acceso a métricas queda separado de rastreo/indexación, visibilidad, menciones/enlaces/citas/recomendaciones IA y solicitudes comerciales. No se ejecutan contactos, reservas, cambios públicos ni nuevos avisos IndexNow para probar esta integración.
