# Primera medición real con Search Console conectado

19/11/2026, America/Santiago. **La conexión ya funciona:** se pudo leer rendimiento e inspeccionar las 12 URL corporativas de `sc-domain:sollahms.cl`. GA4 no es necesario para medir resultados de Google Search. [Conexión verificada](connection-verified.json).

Ahora existe una referencia real por página. **Todavía no hay una comparación válida de 28 días contra 28:** al solicitar 20/10–16/11, Google devolvió 23 fechas, del 25/10 al 16/11; faltan 20–24/10. La ventana anterior, 22/09–19/10, no devolvió filas. No convertimos esos huecos en tráfico cero ni calculamos crecimiento. La primera fecha devuelta tampoco acredita cuándo se creó la propiedad.

Los datos son de búsqueda web, solicitados como finalizados, con todas las ubicaciones y dispositivos. Las fechas del informe conservan la zona del Pacífico de Search Console; las horas de actividad usan Santiago. Se aplicó un filtro de URL exacta por página, excluyendo catálogo, fichas y Centro documental.

## Datos observados por página

Las dos primeras columnas numéricas resumen **solo las 23 fechas devueltas**, no un periodo completo de 28 días. Para las diez páginas que ya existían se pudo derivar una comparación descriptiva de siete días contra siete: ambas ventanas contienen sus siete filas explícitas. Se excluye el día de cambio histórico, 09/11.

| Página | Clics 25/10–16/11 | Impresiones 25/10–16/11 | Impresiones 02–08/11 | Impresiones 10–16/11 |
|---|---:|---:|---:|---:|
| Portada | 4 | 27 | 0 | 13 |
| Asesoría | 0 | 4 | 0 | 4 |
| Contacto | 0 | 7 | 0 | 7 |
| Privacidad | 0 | 1 | 0 | 1 |
| Comparador hipotecario | 0 | 4 | 0 | 4 |
| Trabaja con nosotros | 0 | 6 | 0 | 6 |
| Guía hipotecaria | 0 | 1 | 0 | 1 |
| Cuándo comprar | 0 | 2 | 0 | 2 |
| Centro de Orientación | 0 | 4 | 0 | 4 |
| Entorno y desarrollo urbano | 0 | 0 | 0 | 0 |
| Inversión para empresas | 0 | 3 | No comparable: página nueva | 3 |
| Beneficios tributarios | 0 | 0 | No comparable: página nueva | 0 |

Los ceros de esta tabla proceden de filas explícitas de la fuente. Todas las páginas registran cero clics en 10–16/11 y las diez comparables también en 02–08/11. Con cero impresiones anteriores no corresponde calcular un porcentaje de crecimiento, CTR o posición media anterior. Empresas y Beneficios se observan aparte: una página que aún no existía no tiene una referencia anterior comparable.

Son cifras pequeñas y por página; no se suman como si fueran el total nativo de la propiedad, visitas o contactos. El [resumen reproducible](performance-summary.json) conserva cobertura, CTR y posición ponderada derivada de las filas diarias, con sus límites de precisión. El [CSV](page-performance.csv) permite revisar las cifras sin acceder a los originales privados.

## Indexación y marca

La inspección de Google acredita **10 URL indexadas**. Entorno figura como «Rastreada: actualmente sin indexar»; Beneficios tributarios, como URL desconocida por Google. Los rastreos informados son anteriores a la publicación del 19/11: no prueban que Google haya procesado los cambios nuevos. [Estados exactos y fechas](index-status.json).

Las cinco consultas de marca se midieron por separado, con `Sollams` a secas como prioritaria. `Solams` devolvió dos impresiones de la portada y una de Contacto, sin clics. `Sollams`, `Sollahms`, `Solamp` y `Solamps` no devolvieron filas. Esa ausencia no equivale a cero búsquedas: las consultas de poca frecuencia pueden no mostrarse. [Observaciones de marca y límites](brand-observations.json).

## Qué permite concluir y qué falta

Ya podemos leer datos reales sin necesitar otra herramienta de analítica. Esta lectura establece la referencia histórica disponible; **no mide el efecto de la publicación de hoy**, activada a las 07:54:02.653 de Santiago, porque el rendimiento leído termina el 16/11. Tampoco mide citas o recomendaciones en asistentes con IA.

El seguimiento consiste en incorporar nuevas fechas finalizadas con las mismas 12 URL y condiciones, comparar periodos completos equivalentes cuando existan y volver a revisar las dos URL pendientes de indexación. No se requiere rehacer mejoras, instalar tracking ni rellenar datos ausentes.

Se efectuaron 24 lecturas gratuitas de rendimiento, con máximo cuatro simultáneas. La comparación de siete días se derivó de esas mismas respuestas, sin nuevas consultas. Los originales y su manifiesto de integridad se guardaron en almacenamiento privado; no se versionan credenciales, datos personales ni respuestas originales. No hubo cambios al sitio, producción, formularios o solicitudes de indexación durante esta medición.
