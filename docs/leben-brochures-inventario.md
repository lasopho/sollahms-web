# Complemento Leben y nueva ficha Nórdico

> Conteos históricos: las cifras de catálogo de 148/144/137 de este documento corresponden a su etapa de revisión. El [registro vigente de 134 fichas](registro-vigente.md), fijado al commit fuente, define el inventario actual. Se conserva íntegra la evidencia y el alcance original.

Revisión del 13/10/2026. Por autorización expresa del titular se utilizaron los doce originales de `Downloads/Leben`, sin depender del ZIP anterior. El inventario SHA-256 y `INSTRUCCIONES_CODEX.md` se regeneraron y permanecen privados; no se afirma haber contrastado un inventario externo ausente. El manifiesto registra los hashes de estos documentos de control.

Los 12 PDF únicos suman 93 páginas. Se comprobaron encabezado y EOF, lectura estricta de las páginas y decodificación de las imágenes. El materializador vuelve a exigir SHA-256 y número de páginas antes de reconstruir los derivados.

El catálogo contiene **137 proyectos: las 136 filas comerciales anteriores exactas y una nueva ficha de Edificio Nórdico**. Los 15 Ecasa, Own y la identidad única de Parque Germania se conservan. Las fichas mantienen su diseño, portadas, galerías oficiales, precios, entrega, tipologías comerciales, mapas, recorridos y navegación contextual. Los complementos se agregan mediante bloques aislados; retirarlos reproduce exactamente las doce fichas anteriores.

## Selección documental

Se añadieron **43 imágenes referenciales** sin ampliar su resolución nativa. Se rechazaron **97 candidatos**, incluidos los **22 planos raster** de Parque Germania. Nórdico añade por separado tres medios oficiales y excluye ocho iconos como recursos fotográficos. El inventario completo de entrega registra **46 medios nuevos y 105 candidatos descartados**, con procedencia, decisión y dimensiones.

| Ficha existente | Páginas del PDF | Imágenes añadidas | Candidatos rechazados | Registros de superficies |
| --- | ---: | ---: | ---: | ---: |
| Parque Germania | 11 | 0 | 31 | 22 |
| Capitanes | 1 | 4 | 13 | 0 |
| Edificio Bold | 9 | 0 | 9 | 0 |
| Edificio Argomedo | 6 | 5 | 2 | 0 |
| INN Puerto Chico | 15 | 10 | 4 | 0 |
| Edificio Indi | 8 | 6 | 1 | 0 |
| Edificio Living Town | 1 | 4 | 12 | 0 |
| Edificio Mood | 10 | 0 | 11 | 0 |
| Edificio Santo | 6 | 3 | 1 | 0 |
| Edificio Índigo | 6 | 4 | 2 | 0 |
| Edificio BAUM | 12 | 2 | 8 | 0 |
| Edificio Suecia | 8 | 5 | 3 | 0 |

Los ceros corresponden a este lote y no implican eliminar fotografías anteriores. Se excluyeron duplicados, representaciones antiguas de fachadas ya ilustradas, imágenes de marketing genérico, contextos urbanos y rasters insuficientes. Bold y Mood conservan sus medios anteriores y reciben únicamente características acreditadas. Los nuevos renders se identifican como referenciales.

Parque Germania conserva las superficies útiles impresas de sus 22 modelos en páginas 8 y 9. La segunda cifra publicada no está etiquetada inequívocamente como terraza o total; se muestra como **otra superficie publicada**. No se calcula una categoría, diferencia o suma ausente. Los planos de 127–316 píxeles de ancho no se amplían ni se ofrecen como planos nítidos. Los otros once brochures no incluyen planos individuales; todas las fichas indican el pendiente correspondiente.

Las condiciones antiguas de brochures, rangos y tipologías que difieren de la oferta vigente se conservan como antecedentes separados. No actualizan precios, stock, entrega ni facilidades del pie. La dirección Eyzaguirre 580 del mapa de Living Town no sustituye Eyzaguirre 590 de su ficha acreditada. La revisión visual de columnas identifica correctamente **Sala e-commerce** y **Mirador verde**. Equipamientos ambiguos de Germania no se generalizan entre modelos.

La atribución ESEPE del brochure de Germania y su presencia comercial en ambos canales oficiales están documentadas. Se conserva una ficha; no se infiere una relación societaria. La información y los pendientes de Nórdico se describen en [su revisión oficial](nordico-y-parque-germania-2026-10-13.md).

## Trazabilidad y reproducción

`data/brochures-leben.json` vincula cada dato y medio a su PDF, SHA-256 y página física. Los recursos seleccionados añaden objeto de imagen, recorte, dimensiones nativas, dimensiones del derivado, hash, revisión visual y decisión de calidad. Los rechazos conservan el motivo y su alcance. El inventario privado exporta también las superficies y los recursos oficiales de Nórdico.

Los 43 derivados se reconstruyeron independientemente desde los doce originales y reprodujeron exactamente hashes y dimensiones. La reconstrucción no cambia el manifiesto y verifica todos los candidatos antes de escribir los destinos. Ejecución: `python3 scripts/materialize-leben-brochures.py --input /directorio/privado/con/los/doce/originales`. Para reproducir los complementos: `python3 scripts/leben_brochure.py`.

El paquete privado incluye exclusivamente los derivados seleccionados. Originales PDF, inventarios, instrucciones regeneradas, candidatos, contratos, credenciales y recibos de QA no entran en el output web. Los 104 medios AJ Urbana, 165 Ingevec y 130 originales derivados Ecasa conservan sus bytes; las decisiones anteriores de publicación y calidad Ecasa permanecen intactas.

El perfil `protected_leben_review` exige los 137 proyectos y conserva las coberturas independientes de lotes anteriores. Con `VERCEL=1`, el nuevo lote sólo compila en Preview. La comparación de fallbacks de Production se efectúa localmente y no autoriza un despliegue. La rama deshabilita los despliegues automáticos Git; el commit se transporta mediante el procedimiento privado existente y se contrasta con la Preview autenticada.

Los resultados finales de regresión, navegador, paquete y Vercel se registran en los recibos privados de entrega. Esta fase no realiza merge, promoción, cambio de alias ni modificación de Production.
