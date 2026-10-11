# Evidencia financiera — 9 de octubre de 2026

## Captura CMF controlada

Consulta pública puntual, sin extracción recurrente. [Resultado CMF](https://servicios.cmfchile.cl/simuladorhipotecario/aplicacion?indice=101.2.3&inst=OK&marcados=1&marcados=9&marcados=12&marcados=14&marcados=16&marcados=28&marcados=37&marcados=39&marcados=51&marcados=672&maxpeso=822618800&maxuf=20000&minpeso=4113094&minuf=100&monto=3000&paso=2&plazo=20&template=entidades&tipocredito=3&tipomoneda=1&tipotasa=1).

Escenario: propiedad 4.000 UF, pie 25%, crédito 3.000 UF, 20 años, Santiago, mutuo no endosable, UF, tasa fija, sin subsidio. Las fechas siguientes son las publicadas por cada institución; consultar hoy no las renueva.

| Institución | Tasa anual | CAE publicada | Actualización | Uso |
|---|---:|---:|---|---|
| Itaú Corpbanca | 5,02% | 5,58% | 2026-10-09 | Referencia |
| Banco de Chile | 4,78% | 5,10% | 2026-09-30 | Financiero; conflicto total |
| Scotiabank Chile | 4,63% | 5,41% | 2026-09-10 | Referencia |
| Coopeuch | 4,50% | 4,77% | 2026-09-04 | Más de 30 días |
| Santander-Chile | 4,00% | 4,62% | 2026-08-28 | Más de 30 días |
| Internacional | 4,68% | 5,02% | 2026-06-04 | Más de 30 días |
| BancoEstado | 4,55% | 4,83% | 2026-02-06 | Más de 30 días |
| BICE | 4,90% | 5,06% | 2025-10-28 | Más de 30 días |
| BCI | 5,53% | 5,83% | 2025-04-09 | Más de 30 días |
| Falabella | 4,68% | 5,17% | 2024-12-30 | Más de 30 días |

Chile: tabla $810.280; detalle $813.159. No publicar ese total conflictivo. CAE Chile incluye incendio; Scotia/Itaú incluyen incendio y sismo: distinta cobertura impide ordenarlas como equivalentes. CMF excluye impuesto e inscripción CBR. [Reproducción con fuente autorizada](https://www.cmfchile.cl/portal/principal/623/w4-article-1833.html).

## Contraste matemático independiente

La convención inferida para este simulador CMF es anual efectiva, corroborada numéricamente: crédito 860 UF, tasa 4,55%, 25 años, dividendo publicado 4,76 UF. `r = (1 + 0.0455)^(1/12) - 1` produce 4,759575 UF; dividir la tasa por 12 produce 4,804599 UF. [Ejemplo consultado](https://servicios.cmfchile.cl/simuladorhipotecario/aplicacion?indice=101.2.3&inst=OK&marcados=12&marcados=16&marcados=37&marcados=672&maxpeso=614991200&maxuf=20000&minpeso=3074956&minuf=100&monto=860&paso=2&plazo=25&template=entidades&tipocredito=3&tipomoneda=1&tipotasa=1). La [normativa D62](https://www.cmfchile.cl/portal/principal/613/articles-29209_doc_pdf.pdf) también define anualización financiera compuesta; no implica que todo anuncio bancario utilice automáticamente esa convención.

Para 3.000 UF/240 meses, cálculo independiente con precisión completa:

| Institución | Financiero UF/mes | Desgravamen publicado UF/mes | Incendio+sismo publicado UF/mes |
|---|---:|---:|---:|
| Santander | 18,0665627471 | 0,363 | 0,596 |
| Scotiabank | 19,0354913930 | 0,183 | 1,040 |
| Itaú | 19,6466408203 | 0,1639 | 0,7288 |

Esas primas son valores mensuales informados para el escenario, no una garantía de constancia durante toda la vida del crédito. Calcular un costo acumulado con primas constantes exige mostrar ese supuesto. No sustituir CAE por interés anual ni extrapolar datos a otro monto, pie o plazo.

## UF y acceso oficial

UF verificada: **$41.130,94 al 2026-10-09**, coincidente en [SII](https://www.sii.cl/valores_y_fechas/uf/uf2026.htm) y simulador CMF abierto. Guardar valor y fecha unidos; la equivalencia CLP futura depende de la UF futura.

Existe [API CMF v3](https://api.cmfchile.cl/documentacion/index.html), con API Key, [recurso UF](https://api.cmfchile.cl/documentacion/UF.html) y [términos gratuitos con cuotas](https://api.cmfchile.cl/terminos-de-uso.html). No se verificó API documentada ni descarga oficial de ofertas del comparador. Recurso UF diario documentado: `https://api.cmfchile.cl/api-sbifv3/recursos_api/uf/2026/10/dias/09`, con parámetros `apikey` y `formato=json`. Mantener la clave exclusivamente en servidor.

## Catálogo institucional y campañas separadas

- [BancoEstado](https://nwm.bancoestado.cl/content/bancoestado-public/cl/es/home/home/productos-/creditos/creditos-hipotecarios.html): hasta 90%, plazos 8/12/15/20/25/30, evaluación comercial.
- [BCI](https://www.bci.cl/personas/credito-hipotecario): hasta 90% y 30 años. Campaña octubre 2026: 3,35% al 80% y 3,40% al 90%; nueva hasta 6.000 UF, subsidio y FOGAES. CAE 3,93%/3,92% corresponde exclusivamente a ejemplos 2.400/2.700 UF a 30 años.
- [Santander](https://banco.santander.cl/personas/credito-hipotecario/subsidio-dividendo): campaña octubre 3,39%, nueva hasta 6.000 UF, hasta 90% y 30 años; exige subsidio y FOGAES. No mezclar con oferta estándar CMF.
- [Chile](https://sitiospublicos.bancochile.cl/personas/beneficios/promociones/credito-hipotecario-fogaes): campaña octubre 3,49%; CAE 3,83% solo ejemplo propiedad 6.000/crédito 5.400 UF/30 años, seguros definidos y elegibilidad.
- [Scotiabank](https://www.scotiabankchile.cl/scotia-impulsa/tips-y-coaching-financiero/impulsando-tu-nuevo-hogar/credito-hipotecario): hasta 85% del menor entre precio y tasación, según evaluación.
- [Security](https://personas.bancosecurity.cl/credito-hipotecario): hasta 80%, 6–25 años; hoy marca de Banco BICE. Consolidar identidad para evitar duplicar bancos. Páginas antiguas todavía publican otros límites.
- [Itaú](https://ww2.itau.cl/personas/creditos/credito-hipotecario): acceso web devolvió 403; usar evidencia CMF actual. Brochures enero–marzo 2026 encontrados están vencidos y no se incorporan.

## Decisión de mantenimiento

El catálogo publicado mantiene actualizaciones controladas por revisión humana y evidencia puntual. El límite interno de 30 días es una política de Sollahms, no una certificación CMF. Guardar `sourceUpdatedAt`, `verifiedAt`, alcance, cobertura, convención de tasa y motivo de exclusión. Ante vencimiento, incompatibilidad o contradicción, retirar la comparación afectada y conservar el simulador referencial. La automatización de ofertas requiere un mecanismo oficial documentado o autorización verificable antes de implementarse.
