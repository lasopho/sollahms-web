# Contradicciones — corte activo fase 3

No se resolvieron contradicciones. Se corrigieron dos etiquetas de divergencia numérica de baños en Bold/Indi; las cantidades coinciden y los conflictos de modelo/tipología permanecen. F3-C001 registra límite del plano INN F/406 frente a806/906, sin transferir métricas. Consultar [registro activo fase3](fase3-20261116/CONTRADICCIONES-IRIS.csv) e [informe de depuración](INFORME-DEPURACION-LEBEN.md). Conservar decisiones previas de dirección y Own vendido.

## Registro del corte anterior preservado

# Contradicciones y diferencias — actualización Iris

Las tres discrepancias anteriores siguen abiertas. Las diferencias con criterio previo sobre direcciones se conservan sin nueva solicitud. Ningún hallazgo Iris cambia la dirección Sollahms.

Consultar [registro Iris por unidad, campo y fuente](iris-20261116/CONTRADICCIONES-IRIS.csv). Distingue contradicción, alcance parcial, dirección previamente resuelta y diferencia con política de catálogo. Esta última no prueba ausencia física ni anula la regla expresa del propietario.

**IR-C001 — edificio-living-town** (Contradictorio). Modelo A1: DOM 2 baños; gráfico 1 baño (2D1B). Alcance: Unidades 603 y 803.

**IR-C002 — edificio-mood** (Diferencia con criterio previo). {"field": "direccion", "sollahms_preserved": "Av. Américo Vespucio 6630", "iris_literal": "Av. Américo Vespucio 6608", "classification": "Contradictorio", "action": "Conservar dirección Sollahms; registrar diferencia."} Alcance: proyecto.

**IR-C003 — edificio-mood** (Contradictorio). {"field": "dormitorios", "model_code": "A", "unit_identifier": "303", "iris_dom": "2 Dormitorios", "graphic_plan": "Modelo A | 1,5D + 2B", "classification": "Contradictorio", "action": "Conservar 1,5D literal del plano y 2 explícito de la unidad; no convertir el plano a 2D."} Alcance: 303.

**IR-C004 — edificio-mood** (Parcial). {"field": "superficie_terraza", "model_code": "H", "unit_identifier": "511", "iris_dom": "34.14m² Internos · 0m² Terraza", "graphic_plan_scope": "Modelo H; DEPTO 209, terraza dibujada sin cifra de área.", "classification": "Parcial", "action": "No usar geometría de plano representativo para corregir cero publicado ni generalizar las áreas de otras unidades H."} Alcance: 511.

**IR-C005 — edificio-suecia** (Diferencia con criterio previo). {"field": "direccion", "sollahms_preserved": "Tranquila 2323, esquina Suecia", "iris_location_literal": "Tranquila 2323 Esq. Suecia", "floor_plan_header_literal": "TRANQUILA 2307", "classification": "Contradictorio", "action": "El encabezado del plano mantiene 2307 histórico; conservar 2323 Sollahms y ubicación de ficha."} Alcance: proyecto.

**CAP-A-ALCANCE — capitanes** (Contradictorio). Iris vincula plano A a 501 y 601; el gráfico imprime Deptos. 201 al 301. Sus rótulos de superficie no confirman el alcance de 501/601. Alcance: 501 | 601.

**CAP-E2-CODIGO — capitanes** (Parcial). La descripción Iris usa E.2 Duplex y el gráfico E2. Se conservan ambas denominaciones sin imponer equivalencia de códigos. Alcance: 704.

**CAP-A2-SIN-PLANO — capitanes** (Parcial). Modelo A2 en Iris; imagen de reemplazo sin plano documental. Alcance: 701.

**CAP-DIRECCION — capitanes** (Diferencia con criterio previo). Iris identifica Los Capitanes 1445. No se modifica la dirección Sollahms 1447. Alcance: proyecto.

**BOLD-S1-TIPOLOGIA — edificio-bold** (Contradictorio). La ficha dice Tipo Estudio S1 y dormitorio Estudio; el plano S1 imprime 1D · 1B. Alcance: 312.

**BOLD-F-SUPERFICIES — edificio-bold** (Contradictorio). Plano F vinculado a 608 imprime interior 62,40, terraza 3,12 y total 65,52 m², con alcance Deptos. 207 al 407, 508 y 608. Iris muestra 63.44 Internos y 3.71 Terraza para 608; para 207/307/508, 61.67 Internos y 3.71 Terraza. Internos no se equipara automáticamente a interior; terraza publicada difiere. Alcance: 207 | 307 | 508 | 608.

**BOLD-SIN-PLANO — edificio-bold** (Parcial). Iris presenta reemplazo de imagen sin plano para E2 unidad 201 y L3 unidad L-103. Alcance: 201 | L-103.

**BOLD-LOCAL-UI — edificio-bold** (Parcial). Tras seleccionar Local Comercial, la tabla contiene únicamente L-103. La leyenda móvil o de fila muestra Estudio. Se conserva la membresía explícita del filtro y la discordancia; no se clasifica por el prefijo de unidad. Alcance: L-103.

**ARG-C-C1 — edificio-argomedo** (Contradictorio). La descripción Iris usa C1; el plano adjunto imprime Modelo C. No se inventa equivalencia entre ambos códigos. Alcance: 915.

**ARG-DIRECCION — edificio-argomedo** (Contradicción previa abierta). Iris muestra Argomedo 382; no resuelve el respaldo que menciona 380 ni autoriza modificar la dirección final. Alcance: proyecto.

**INDI-D-PLANO-A2 — edificio-indi** (Contradictorio). Iris dice Modelo D, 2 Dormitorios, 1 baño; el archivo modelo-d.jpg adjunto imprime Modelo A2 | 1D + 1B. Alcance: 607.

**INDI-A4-PLANO-C1 — edificio-indi** (Contradictorio). Iris dice Modelo A4; el gráfico adjunto imprime Modelo C1 | 2D + 2B. Ambos códigos se conservan separados. Alcance: 411.

**INDI-LOCALES-UI — edificio-indi** (Parcial). Filtro Local Comercial seleccionado muestra estas tres unidades y sus descripciones dicen LOCAL. Las filas muestran Estudio y 0 baños. Los tres planos son imágenes de reemplazo; no se valida una tipología habitacional. Alcance: L-2Casona | L-2 | L-1Casona.

**INDI-DIRECCION — edificio-indi** (Contradicción previa abierta). Iris identifica Hipódromo 1816. La dirección Sollahms Vallenar 2070 permanece sin modificar y requiere conciliación del propietario. Alcance: proyecto.

**IR-C020 — inn-puerto-chico** (Contradictorio). DOM 3; plano 2. Modelo S Alcance: Unidad 605 · Piso 6.

**IR-C021 — inn-puerto-chico** (Contradictorio). DOM 4; plano 5. Modelo R Alcance: Unidad 604 · Piso 6.

**IR-C022 — inn-puerto-chico** (Contradictorio). DOM 4; plano 5. Modelo Q Alcance: Unidad 603 · Piso 6.

**IR-C023 — edificio-living-town** (Diferencia con política de catálogo). Iris menciona SUM; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C024 — edificio-living-town** (Diferencia con política de catálogo). Iris menciona Seguridad; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C025 — edificio-mood** (Diferencia con política de catálogo). Iris menciona SUM; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C026 — edificio-mood** (Diferencia con política de catálogo). Iris menciona Seguridad; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C027 — edificio-mood** (Diferencia con política de catálogo). Iris menciona Estacionamiento; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C028 — edificio-santo** (Diferencia con política de catálogo). Iris menciona SUM; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C029 — edificio-santo** (Diferencia con política de catálogo). Iris menciona Seguridad; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C030 — edificio-santo** (Diferencia con política de catálogo). Iris menciona Estacionamiento; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C031 — edificio-baum** (Diferencia con política de catálogo). Iris menciona SUM; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C032 — edificio-baum** (Diferencia con política de catálogo). Iris menciona Seguridad; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C033 — edificio-suecia** (Diferencia con política de catálogo). Iris menciona Parrillero; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C034 — edificio-suecia** (Diferencia con política de catálogo). Iris menciona SUM; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C035 — edificio-suecia** (Diferencia con política de catálogo). Iris menciona Lavanderia; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C036 — edificio-suecia** (Diferencia con política de catálogo). Iris menciona Seguridad; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C037 — capitanes** (Diferencia con política de catálogo). Iris menciona Piscina; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C038 — capitanes** (Diferencia con política de catálogo). Iris menciona Gimnasio; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C039 — edificio-bold** (Diferencia con política de catálogo). Iris menciona SUM; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C040 — edificio-bold** (Diferencia con política de catálogo). Iris menciona Seguridad; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C041 — edificio-argomedo** (Diferencia con política de catálogo). Iris menciona Parrillero; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C042 — edificio-argomedo** (Diferencia con política de catálogo). Iris menciona SUM; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C043 — edificio-argomedo** (Diferencia con política de catálogo). Iris menciona Seguridad; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C044 — edificio-indi** (Diferencia con política de catálogo). Iris menciona Jardin; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C045 — edificio-indi** (Diferencia con política de catálogo). Iris menciona Seguridad; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C046 — edificio-indigo** (Diferencia con política de catálogo). Iris menciona Seguridad; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C047 — inn-puerto-chico** (Diferencia con política de catálogo). Iris menciona SUM; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

**IR-C048 — inn-puerto-chico** (Diferencia con política de catálogo). Iris menciona Seguridad; el brochure completo no lo menciona. Se conserva false propuesto por regla expresa del propietario, sin afirmar ausencia física. Alcance: Presencia general del proyecto.

## Registro previo conservado

# Diferencias documentales Leben y exclusión ESEPE

Fecha: 16/11/2026. Son siete diferencias de fuente dentro de Leben; cuatro direcciones conservan un criterio de ficha oficial ya documentado y tres casos necesitan respuesta del propietario. Los cambios históricos de precio, oferta y entrega se presentan aparte: no se demuestra incompatibilidad simultánea cuando sus fechas/ámbitos son diferentes.

## Direcciones

| Proyecto | Fuente A | Fuente B | Criterio o pendiente |
| --- | --- | --- | --- |
| Edificio Living Town | Eyzaguirre 580 en mapa, PDF p.1 | Eyzaguirre 590 en ficha oficial archivada 09/10/2026 | Criterio conservado: 590. No pedir otra vez dirección ya acreditada. |
| Edificio Mood | Av. Américo Vespucio 6608, PDF pp.3 y 10 | 6630 en mapa PDF p.9 y ficha oficial archivada | Criterio conservado: 6630. Se conserva el error interno del brochure, sin modificarlo ni pedir nuevamente dirección. |
| Edificio Suecia | Tranquila 2307, PDF pp.2 y 7 y tabla directa Sollahms | Tranquila 2323 esquina Suecia en ficha verificada 09/10/2026 | Criterio conservado: 2323 según actualización expresamente registrada. No se solicita de nuevo dirección. |
| Capitanes | Los Capitanes 1445 en mapa raster, PDF p.1 | Los Capitanes 1447 en ficha oficial archivada | Criterio conservado: 1447. La diferencia se recuperó visualmente y no aparecía en el texto extraído. |
| Edificio Argomedo | Argomedo 380, PDF p.2 | Argomedo 382 en ficha oficial archivada | PENDIENTE: aclarar si son accesos del mismo proyecto y ratificar dirección. No asumir otro proyecto. |
| Edificio Indi | Hipódromo 1816, PDF pp.2 y 7 | Vallenar 2070 esquina Hipódromo en ficha oficial archivada | PENDIENTE: aclarar accesos/dirección oficial. No fusionar o duplicar identidades. |

## Cubierta de cocina INN Puerto Chico

Brochure p.4 y adjunto directo Sollahms: **cuarzo**. Ficha oficial archivada 09/10/2026 (`verifiedFeatures.terminaciones`): **ultracompacto con terminación travertino**. Pendiente confirmar versión, modelo y material. No asumir equivalencia ni vigencia universal de una terminación.

## Parque Germania: exclusión del bloque Leben

La portada del PDF `Leben -  Parque Germania.pdf` acredita **ESEPE**. SHA-256 `7617a6ad9165547534ad5ad0298739512f2d4e15e8eb95afed306dcafd44d7df`. El catálogo y la tabla de importación histórica lo etiquetan Leben. La matriz de auditoría conserva ESEPE y guarda la etiqueta original en una columna aparte. No se infiere relación societaria. Revisión comercial/técnica pendiente para ESEPE/otras inmobiliarias; no se abre ahora. [Portada examinada](evidencias/visual/germania-identidad.png).

## Diferencias históricas que no se elevan a contradicción simultánea

Las diez diferencias de precio entre la tabla directa Sollahms y la ficha oficial archivada se conservan como HISTÓRICO. La prioridad del propietario no crea una oferta vigente ni autoriza cambiar el sitio. Living Town conserva septiembre 2027 y BAUM 1S2028 como antecedentes; sus fichas no tienen entrega actual confirmada. INN conserva diciembre 2026 frente a 1S2027. Mood y Bold contienen estados/fechas de lanzamiento anteriores frente a entrega inmediata archivada. El rango INN 2–5 dormitorios es del proyecto/brochure y el 2–4 de una oferta archivada; no se infiere stock de ninguna tipología. Own vendido y precio residual son ámbitos diferentes, sin reabrir oferta.

## Evidencias

Los IDs de archivo, SHA-256, página física y fecha documental se consultan en [Fuentes](FUENTES-DOCUMENTALES.csv), [Hechos atómicos](evidencias/hechos-documentales.json) y [Matriz](MATRIZ-LEBEN.csv). Cuatro criterios resueltos documentalmente siguen clasificados CONTRADICTORIO por coexistencia de valores, pero no generan una solicitud redundante.

## Recepción fase 2

Se registró COM-F2-001 para cuatro precios del bloque 1A, sin valores actuales confirmados. No responde a D-01 Argomedo, D-02 Indi ni D-03 cubierta INN. Los tres casos siguen abiertos; ninguna discrepancia se resolvió en fase 2. [Control por caso](recepcion-fase2/CONCILIACION-DISCREPANCIAS.csv).
