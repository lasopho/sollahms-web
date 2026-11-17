# Continuar Sollahms / Leben desde la cobertura parcial de fase 9

Repositorio `lasopho/sollahms-web`, rama `codex/auditoria-leben-20261116`, checkout independiente `/private/tmp/sollahms-auditoria-leben-20261116`. Corte: **17/11/2026, America/Santiago**. Base F9 local/remota verificada antes de cambios: `26dba5d3684fcfa1eb69fe75e8a33aa01c64c18e`. Consultar HEAD y remoto actuales y conservar cambios posteriores. Leer AGENTS.md si aparece; no alterar el checkout original con cambios ajenos.

## Objetivo y lectura activa

Continuar únicamente con los doce Leben activos: Living Town, Mood, Santo, BAUM, Suecia, Capitanes, Bold, Argomedo, Indi, Índigo, INN Puerto Chico y Nórdico. Own sigue vendido y fuera de oferta activa. No iniciar Euro automáticamente.

Leer `docs/catalog-data-completeness-20261116/leben/INFORME-FASE9-LEBEN.md` y `leben/fase9-comercial-20261117/`: `COBERTURA-ESENCIAL-LEBEN.csv`, `DATOS-REALES-FALTANTES-LEBEN.csv`, `CONFLICTOS-QUE-AFECTAN-FILTROS.csv`, `PROYECTOS-APTOS-BUSQUEDA-PARCIAL.json`, `RECOMENDACIONES-FILTROS.json`, `REGLAS-POR-REFERENCIA.json`, `PREGUNTAS-MINIMAS-PREPARADAS.json`, comprobaciones, manifiesto y verificación. Consultar el manual Iris completo. La reclasificación comercial anterior y F4/F5/F6/F7 siguen siendo historial, sin reabrir obligaciones técnicas descartadas.

## Resultado y alcance

Los doce proyectos tienen datos para búsquedas parciales: diez precio+dormitorios, cinco precio+D/B y dos D/B+útil+total en una misma referencia. D/B+terraza tiene referencias en los doce y D/B+total en cinco. Estos son respaldos documentales, no filtros nuevos implementados, garantía futura de precio o stock.

Se conservaron 330 referencias UI, 104 perfiles y veinte cotizaciones como 454 registros documentales separados, no 454 unidades ofertadas. Ninguna referencia acredita todavía precio Sollahms junto con útil+total o jardín privado. Esa limitación no impide consultar la cotización o el perfil por separado. No exigir que un proyecto tenga todos los atributos para participar en búsquedas parciales.

No hubo documentos o declaraciones nuevos, cierres, hechos o IDs de recepción creados por esta fase. El saldo histórico sigue en 313, clasificados 74 A/48 B/191 C. No convertir C o una parcialidad en campo completo. Hay 39 faltantes condicionados por consulta: diez útil, siete total, diez asociaciones cotización/perfil, cuatro esperas comerciales anteriores y ocho amenities desconocidas de Nórdico. No equivalen a una nueva ronda de 39 preguntas.

## Reglas de referencia para evitar cruces

Cada predicado de opción debe coincidir dentro de un único registro: una cotización F049, una UI o un perfil gráfico. No unir registros por compartir dormitorio, parecido de código, vínculo de imagen o pertenencia al proyecto. Tipología y superficie solo se emparejan si proceden del mismo ID UI o del mismo recurso gráfico; la cotización conserva exclusivamente sus atributos expresos.

Una cotización F049 puede filtrar su precio y D/B declarados sin necesitar primero un plano. Un perfil puede filtrar sus D/B y útil/total sin precio o asociación a una UI distinta. Los rasgos comunes acreditados del proyecto no son lo mismo que jardín o terraza privados: la existencia de patio en alguna opción no se aplica a todas las cotizaciones. Oferta general de bodega/estacionamiento adicional no es inclusión o stock por unidad.

Si el atributo está indeterminado y se filtra, no produce coincidencia positiva; si no está activo, no excluye la referencia ni todo el proyecto. Mantener útil, total y terraza separados. No transformar Internos/interior, sumar superficies ni extrapolar rangos o plantas a unidades enlazadas.

## Conflictos: limitar solo el atributo afectado

Usar las máscaras por referencia ya preparadas: Living A1/603–803, baños; Mood A/303, dormitorios; Bold S1/312 e Indi D/607, dormitorios; INN S/605, baños; INN R/604 y Q/603, dormitorios; Bold F, cifra de terraza. Conservar los literales originales y los demás atributos de la misma fuente. No redondear 1,5D ni decidir estudio/1D por inferencia.

En Bold F ambas cifras de terraza son positivas: la presencia de terraza permanece true aunque los metros sean indeterminados. En Capitanes 501/601 siguen disponibles 3D3B y terraza UI 18,45; total 109,01 del plano 201–301 no se traslada. F3-C001 conserva D/B y terraza propios de 806/906, sin transferirles total o jardín del perfil 406. Torre e interior quedan como contexto, no como datos comerciales obligatorios.

Los nueve conflictos esenciales siguen abiertos y F3-C001 es un límite adicional. Preguntar sobre ellos únicamente cuando se pretenda utilizar la opción afectada. D-03, Argomedo C/C1 e Indi A4/C1 están fuera del bloqueo comercial; no solicitar materiales, códigos equivalentes, marcas, pisos o inventarios exhaustivos de versiones.

## Siguiente antecedente, solo si se necesita ampliar la consulta

Las doce preguntas mínimas están preparadas, no enviadas y no son condición para aparecer en búsquedas parciales. Pedir solo una opción a ofertar, no cada modelo o cotización. En proyectos sin útil/total rotulados, solicitar únicamente esas métricas y su alcance. En Mood/Nórdico, pedir solo correspondencia de una cotización con un perfil ya conservado, sin volver a pedir sus superficies. No repetir importes, categorías, D/B expresos, entregas, direcciones o estados confirmados.

Santo L-009 y BAUM L-013 siguen en sus esperas comerciales previas; no reenviar una pregunta equivalente de precio/estado. Para ampliar sus superficies basta un extracto de una opción. Los desconocidos de amenities solo requieren una precisión si se necesita ese predicado concreto, no para bloquear todo el proyecto.

F049/COM-F4-001, 16/11/2026, contiene veinte precios de inmueble y dos adicionales Suecia. Prevalece sobre Iris para Sollahms, conservando fecha y sin garantía futura. Tres desde globales expresos: Suecia, Capitanes y Argomedo. Usar los siete listados por categoría sin inventar un mínimo global. INN 2D UF 10.500, 3D UF 10.016, 4D UF 21.869; Índigo 2D UF 9.001. Suecia es Modelo 203, no unidad 203 ni Iris F/206; Capitanes es unidad 501, no modelo 501. Suecia UF 510/75 son adicionales separados del inmueble.

Reutilizar las doce entregas documentadas y los estados F049 con su alcance, sin derivar recepción final desde entrega inmediata. Preservar amenities positivos y false de catálogo de brochures completos, sin afirmar ausencia física; sin brochure/evidencia suficiente, desconocido. No sobreponer un false por omisión a la oferta adicional general F049.

## Implementación y protección

El catálogo actual carga proyectos.json con 137 proyectos, no F049 ni estas tablas. No mezclar ese número con la matriz histórica de 131 ni iniciar los 118 restantes. El HTML mantiene precio máximo, tipo de activo, región, comuna, estado y texto libre; carece de filtros D/B, superficies, entrega, amenities y estacionamiento/bodega. Persiste el default incorrecto de tipo desconocido a Residencial. Las recomendaciones son para una futura implementación autorizada y no están activadas.

Procesar solo originales o declaraciones realmente proporcionados: preservar bytes/nombre/SHA, separar fechas, citar página/hoja/celda y comparar alcance. Actualizar aditivamente registros F6 y matrices solo con evidencia suficiente; asignar siguiente F6-R/F6-H/F6-CR/F libre sin renumerar IDs. Conservar antes/después y fuente por cierre; no borrar las 313 claves. Sin evidencia nueva o cambio real de análisis, no generar otro corte vacío ni repetir preguntas.

No repetir los once brochures, 210 gráficos, doce plantillas o mecanismos de exportación fallidos. Reutilizar Chrome/Iris solo ante una fuente nueva concreta. Si solicita login, detener automatización y permitir acceso personal en Chrome visible, incluido OTP/CAPTCHA. Esperar confirmación y comprobar catálogo; no leer/copiar/guardar credenciales, cookies o tokens, automatizar contraseñas, cerrar sesión o cambiar seguridad. No usar endpoints privados o URLs inventadas.

Trabajo documental exclusivamente. No modificar producción, HTML, fichas, filtros, catálogo, precios publicados, direcciones, formularios, CRM360, Resend o funciones. No ejecutar generadores/builds de aplicación, crear deployments, publicar, crear/fusionar PR o cambiar main. Mantener rama independiente, exclusión de deployments e historial. Verificar 235 hashes, HEAD remoto y árbol limpio al sincronizar. Entregar informe, cobertura, faltantes, conflictos, reglas y siguiente prompt completo. No iniciar Euro automáticamente.


## Verificación de continuidad global — 17/11/2026

Continuar desde el [NEXT raíz](../../NEXT-PROMPT.md) y el [control global](../objetivo-principal-asset-portafolio/CONTROL-DE-AVANCE.md). La restricción histórica de no iniciarEuro fue sustituida por la autorización global131. Reutilizar las15referencias en14proyectos del registro nuevo antes de navegar. Mantener autenticación interactiva: si aparece login/CAPTCHA/OTP, abrir Chrome oficial visible, detener sólo esa tarea y esperar al propietario sin leer credenciales/cookies/tokens. No hay autenticación solicitada pendiente en este corte. El PR32 ya fue Ready y merge con autorizaciones independientes; no se creó deployment ni se publicó.
