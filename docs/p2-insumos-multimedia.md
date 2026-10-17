# Insumos externos para planos y ubicaciones

Corte: 17/10/2026 (America/Santiago). MED-003 y MED-004 siguen bloqueados por información externa. Se reutiliza la evidencia de la auditoría y se contrasta su metadata contra la base P1 `01b03931faefcd376023f3afdde99dad5a4f64c4`. Ese commit local y el remoto `39006d3a6c96bd4154dd99eb6e914c5857393a3b` del [PR #9](https://github.com/lasopho/sollahms-web/pull/9) comparten el árbol `8fe1cc599298c54743f4e503d828671e8d14b6e4`; no comparten SHA de commit.

No se repiten búsquedas fallidas, se importan recursos ni se envían solicitudes reales. Este documento prepara la solicitud al titular o a las inmobiliarias. Tampoco certifica como vigentes las verificaciones históricas.

## MED-003: plantas utilizables y alcance por etapa

El [registro vigente](registro-vigente.md) y su [JSON](../data/registro-vigente.json) reproducen el inventario DOM de la auditoría: **45 fichas con imágenes identificadas como plano/planta y 89 sin ellas**. El criterio busca plano/planta/floor plan en `src` o `alt`; acredita la presencia de etiquetas, no legibilidad, derechos, exactitud geométrica ni disponibilidad de los originales. Irarrázaval permanece como única ficha sin ninguna etiqueta `img`. Las 89 ausencias no crean por sí solas la obligación de publicar una planta, especialmente en terrenos o productos no acreditados.

Los doce proyectos del manifiesto Leben mantienen cero modelos utilizables en ese lote. Parque Germania conserva el rechazo de 22 rasters de 127–316 px; no se amplían para aparentar resolución. Los otros once brochures no incluyen plantas individuales. Nórdico y Own no forman parte de ese lote de doce; no se extrapola la conclusión a sus documentos.

| Inmobiliaria / fichas | Evidencia retenida | Material requerido |
| --- | --- | --- |
| Leben: Parque Germania | Páginas 8–9, rasters nativos insuficientes; categorías de superficies sin desglose acreditado. | Plantas nativas/vectoriales por modelo y tabla que identifique las categorías de superficies y terrazas. |
| Leben: Capitanes, Bold, Argomedo, Inn Puerto Chico, Indi, Living Town, Mood, Santo, Indigo, Baum y Suecia | El lote revisado no incluye plantas individuales utilizables. | PDF vectorial o imágenes nativas legibles y tabla por modelo, identificador y etapa. |
| Ecasa: Lomas de Puyai | Los 17 originales recibidos no incluyen brochure específico de esta entrada. | Brochure y plantas de la etapa exacta, con denominación oficial y alcance. |
| Ecasa: FerroParque | El brochure general no acredita la asignación de sus modelos a las etapas 1/2. | Relación expresa de cada plano/modelo con su etapa; no se asigna por orden o semejanza. |
| Ecasa: Urban La Florida | El documento de cuatro páginas no incluye planos ni tabla por modelo. | Planos y tabla comercial del proyecto o constancia expresa de su ausencia. |

Fuentes retenidas: [manifiesto Leben](../data/brochures-leben.json), [manifiesto Ecasa](../data/brochures-ecasa.json), sus `pending`, `stageScope` y `rejectedAssets`. El nombre documental de Germania no cambia su identidad de ficha. Los recursos privados faltantes y los derechos de publicación continúan regidos por [MED-001/SRC-002](p1-recursos-derechos-2026-10-17.md).

Cada entrega necesita procedencia oficial, autorización aplicable al uso previsto, fecha y versión, nombre de proyecto/etapa/modelo, archivo original, SHA-256 y tabla de superficies con sus etiquetas originales. La recepción permite revisar; no autoriza automáticamente publicación. La validación posterior compara el 100% de las plantas con original y fuente, identidad, legibilidad nativa y móvil, sin inferir áreas ni trasladar modelos de etapa.

## MED-004: ubicación postal, marcador y acceso

El mismo inventario mantiene **132 iframes Google Maps en 130 fichas**. Son búsquedas por dirección; el marcador lo determina Google. La cantidad de iframes incluye contexto oficial relacionado y no demuestra 132 accesos propios confirmados. No existen coordenadas exactas acreditadas para todo el catálogo. No se modifican direcciones ni mapas.

| Ficha / caso | Bloqueo retenido | Confirmación requerida |
| --- | --- | --- |
| Reserva Mayor 2 | Dirección o coordenadas exactas no verificadas; sin mapa. | Dirección postal y acceso de la segunda etapa, comuna y plano oficial de ubicación. |
| Endémico | Sin consulta suficiente para mapa propio. | Ubicación y acceso del proyecto exacto, sin interpretar su estado sin unidades como oferta activa. |
| Plaza Cervantes Torre A | Sin dirección suficiente para mapa propio; identidad de promoción no basta para acreditar acceso. | Dirección, acceso y denominación de torre, con plano oficial. |
| Parque Quinta | Datos insuficientes para mapa propio. | Dirección postal, comuna administrativa y acceso oficial. |
| Curicó 77 / 55 | Numeraciones alternativas retenidas en evidencia Sento. | Diferenciar dirección postal, denominación comercial y acceso habilitado. |
| San Ignacio 270 / 280 | Numeraciones distintas documentadas. | Confirmar acceso y dirección postal, manteniendo la distinción entre denominación e ingreso. |
| Mirador La Florida | Cautela documental del acceso. | Plano oficial con ingreso y numeración; confirmar el punto al que debe llegar el usuario. |

Fuentes retenidas: [investigación](../data/fichas-proyectos.json), [revisión Sento](../data/sento-review.json) y [manifiesto Sento](../data/brochures-sento.json). La auditoría no demostró un marcador publicado erróneo: documentó ausencia de confirmación exacta y cautelas.

La entrega debe acreditar dirección postal, comuna administrativa y acceso mediante fuente autorizada, plano de ubicación y fecha. Si aporta coordenadas, debe identificar qué representan; no se estiman desde un render o un iframe. Tras recibirla, verificar el marcador y el acceso en Google Maps y la ficha a 390/768/1440 px, conservar capturas y referencias. Esta comprobación visual queda pendiente; la conciliación estática no la reemplaza.

## Estado de cierre

MED-003 y MED-004 **no se dan por resueltos**. Los pendientes están acotados y listos para solicitar insumos, sin comunicaciones ni nuevas afirmaciones comerciales. Los 26 casos privados siguen pendientes y ninguna incorporación se autoriza con este documento.
