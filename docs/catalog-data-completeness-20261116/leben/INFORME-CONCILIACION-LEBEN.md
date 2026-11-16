> Actualización 2026-11-16: este documento conserva el informe histórico de su fase. Para resultados y pendientes actuales, leer [INFORME-IRIS-LEBEN.md](INFORME-IRIS-LEBEN.md) y las columnas actualizadas de la matriz.

# Leben: recepción y conciliación, fase 2

Estado: **recepción abierta; Leben todavía no conciliada**. Se recibieron una comunicación y cuatro respuestas por campo del bloque 1A. El propietario indica que no tiene respaldo suficiente para confirmar precios vigentes. Por tanto hay **cero valores actuales nuevos, cero campos resueltos, cero discrepancias resueltas y cero registros nuevos listos para incorporación**.

## Entregables

[Bloques de solicitudes](recepcion-fase2/BLOQUES-SOLICITUDES-LEBEN.md) · [Recepción por campo](recepcion-fase2/RECEPCION-POR-CAMPO.csv) · [Respuestas recibidas](recepcion-fase2/RESPUESTAS-RECIBIDAS.csv) · [Datos parciales](DATOS-PARCIALES.csv) · [Matriz actualizada](MATRIZ-LEBEN.csv) · [Pendientes restantes](DATOS-PENDIENTES-PROPIETARIO.csv) · [Discrepancias](recepcion-fase2/CONCILIACION-DISCREPANCIAS.csv) · [Campos listos, cero registros](recepcion-fase2/CAMPOS-LISTOS-FILTROS.csv) · [Preparación futura y pruebas](recepcion-fase2/PREPARACION-FUTURA-FILTROS.md).

## Recepción efectiva

| ID respuesta | Proyecto | Antecedente histórico UF | Precio actual | Estado resultante |
| --- | --- | --- | --- | --- |
| R-F2-001 | Edificio Living Town | 3949 | No confirmado | Histórico; faltante abierto |
| R-F2-002 | Edificio Mood | 3855.33 | No confirmado | Histórico; faltante abierto |
| R-F2-003 | Edificio Santo | 4023 | No confirmado | Histórico; faltante abierto |
| R-F2-004 | Edificio BAUM | 3843 | No confirmado | Histórico; faltante abierto |

La respuesta F022 está registrada en [COM-F2-001](recepcion-fase2/COM-F2-001-RESPUESTA-PROPIETARIO.json). Sus valores antiguos coinciden con los antecedentes; no se interpretan como confirmación de precio, fecha, modelo o disponibilidad. No se pide inmediatamente la misma información al propietario después de declarar que no la tiene. Se esperan nuevos antecedentes, aceptando respuestas parciales.

## Organización y estados

| Bloque | Campos pendientes |
| --- | --- |
| B1 Precios desde y por tipología | 24 |
| B2 Identificación de tipologías, dormitorios y baños | 91 |
| B3 Superficies por el mismo modelo y etapa | 91 |
| B4 Amenities sin respaldo | 111 |
| B5 Características interiores faltantes o parciales | 89 |
| B6 Estado comercial y entrega | 52 |
| B7 Tres discrepancias que requieren respuesta | 3 |

Se conservan 55 IDs originales y 461 campos pendientes. La matriz sigue teniendo 689 combinaciones proyecto/campo: 209 confirmadas documentalmente, 72 parciales, 47 históricas, siete contradictorias, 352 desconocidas y dos no aplicables. Se añadió el estado de recepción sin reemplazar valores ni categorías históricas. Los campos de preparación siguen sin evaluación para incorporación.

Los 13 tipos de propiedad de proyecto ya están acreditados y no se vuelven a solicitar. Solo se pide su vínculo por modelo donde falta. Own permanece fuera de solicitudes de precio mientras figure vendido. Los otros 118 proyectos siguen pendientes de auditoría. El registro actual contiene 22 fuentes: las 21 de fase 1 y F022, la respuesta del propietario.

## Tres discrepancias abiertas

| Proyecto | Fuente A | Fuente B | Decisión pendiente |
| --- | --- | --- | --- |
| Edificio Argomedo | Argomedo 380 | Argomedo 382 | Indicar dirección oficial y si 380/382 son accesos del mismo proyecto. |
| Edificio Indi | Hipódromo 1816 | Vallenar 2070, esquina Hipódromo | Ratificar dirección oficial y aclarar relación entre accesos. |
| INN Puerto Chico | Cubierta de cuarzo | Ultracompacto con terminación travertino | Confirmar material y modelos/versiones a los que aplica cada especificación. |

No hubo respuesta sobre esas discrepancias. Los cuatro criterios de direcciones conservados desde fase 1 permanecen históricos, sin nuevas decisiones atribuidas al propietario. Parque Germania sigue fuera de Leben, como ESEPE.

## Cobertura y comparación

La cobertura resultante no cambia: cero precios vigentes nuevos y ninguna superficie nueva correctamente clasificada. El snapshot local de 131 filas y main remoto de 134 fueron bases distintas; no se rebasan ni unifican para forzar una coincidencia. Los archivos centrales de filtros avanzados no estaban disponibles. La comparación futura exige la fuente vigente y autorización de incorporación; no se inventa cobertura de una implementación no examinada.

## Preservación y trazabilidad

Se conservaron los 55 archivos y hashes certificados de fase 1 en el [manifiesto histórico](../historico/fase1-dd3a688/MANIFIESTO-HASHES-FASE1.json). Los entregables originales cambiados tienen copia exacta; las evidencias originales y el Excel protegido mantienen sus bytes. Se leyó el Excel con Artifact Tool: 55 solicitudes y 275 celdas de respuesta, todas vacías. La respuesta posterior del chat se registra por separado, sin simular que estaba escrita en el Excel.

[Registro de cambios](recepcion-fase2/REGISTRO-CAMBIOS.csv): la nota anterior decía cinco API locales, pero su BASELINE enumeraba cuatro; se corrige solo la nota nueva, preservando el dato histórico y sus hashes. No se verifican ni invocan las siete funciones productivas.

## Sincronización y siguiente paso

El propietario autorizó la exclusión de deployments solo para esta rama y su sincronización. El contenido documental quedó [verificado en GitHub, commit 37ff7a4](https://github.com/lasopho/sollahms-web/commit/37ff7a41c2635e8d8e7370b72b9e459dce8522c5), con SHA local/remoto coincidente y la exclusión presente. Main conserva su SHA anterior y Vercel devuelve cero deployments de esta rama tras el push. [Recibo y commit de control posterior](recepcion-fase2/SINCRONIZACION-GITHUB.md). No se creó PR ni se ejecutaron generadores.

Esperar antecedentes Leben, validar las respuestas contra sus fuentes y actualizar solo los campos afectados. No iniciar Euro automáticamente. Se preparó un [prompt Euro condicionado](../continuidad/PROMPT-EURO-CONDICIONADO.md), que no se ejecuta hasta el cierre documental Leben y autorización de continuación.
