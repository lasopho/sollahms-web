# Correcciones jurídicas focalizadas — PR #19

Revisión: 2026-11-14T21:58:21.639578-03:00 — America/Santiago. Corte normativo: 14/11/2026.

**Publicación bloqueada.** Se corrige la redacción de A–D; el cierre administrativo sigue pendiente. No equivale a dictamen jurídico ni a autorización de publicación.

Referencia desplegada: bc50a76176cea7005135e864f27a06204a2803c4. Referencia documental: cc5cf415fac0fcbda1648670bcfef877fe31fcaa.

| Observación | Resultado | Pendiente / severidad residual |
|---|---|---|
| A. Plazo IVA | Eliminado 30/11/2027. Inicio 01/12/2026 y un año; aniversario 01/12/2027 a medianoche según art.48 CC, identificado como cómputo jurídico | Media: contrastar instrucciones definitivas antes de operación/publicación |
| B. Terrenos DFL2 | Lectura conjunta arts.14 y19, terreno común autorizado, singular hasta500m², exceso, copropiedad y pérdida por edificio no DFL2 | Evaluación individual del rol; no exención general de suelo |
| C. Vivienda principal | Copropiedad, herencia, uso mixto, aseo, deudas, relacionados y procedimiento individual precisados | Media: resolución general de forma/plazo no localizada; noticia y guía no la sustituyen |
| D. Resolución146 | Emisión23/10/2026, vigencia01/12/2026, devolución anterior delimitada | Media: circulares IVA/DFL2 en consulta; no cierre por fecha de consulta |

Las precisiones de primera venta entre relacionados, inicio22/04/2026 y comunero en55bis corresponden a hallazgos M1/B1/B2 del informe revisado. Se modifican seis fichas; las otras diez se conservan literalmente. No se reauditan otras fichas como si hubiera una nueva certificación total.

## Fuentes y límites de verificación

Ley21.850, texto BCN con versión17/10/2026 leído; enlace genérico BCN respondió intermitentemente con error de aplicación. [Texto consultado](https://www.bcn.cl/leychile/navegar?idNorma=1229250&idVersion=2026-10-17). [DFL2 art.19, SII](https://www.sii.cl/pagina/jurisprudencia/legislacion/complementaria/dfl_texto2.htm): consolidación histórica utilizada exclusivamente para art.19, complementada con Circular22/2022; no se usan sus reglas históricas de titularidad como vigentes. Circular2/2012 III.3 consultada; no se reproduce su antiguo tratamiento de herencias. Índices SII: circulares hasta43 de09/11 y resoluciones hasta155 de11/11; no se localizaron versiones finales IVA/DFL2 ni resolución general específica de vivienda principal. Esto describe el resultado de consulta, no prueba absoluta de inexistencia. Guía de vivienda principal accesible14p; distingue resolución individual del resultado de la solicitud.

## QA focalizado

- Node:6 pruebas aprobadas, incluida matriz de1.080 combinaciones.
- Prueba editorial: HTML/JSON/generador consistentes;6 fichas modificadas,10 idénticas; alcance aprobado.
- Estático:60 IDs únicos,0 enlaces internos rotos,1 H1,6 FAQ visibles concordantes con JSON-LD,0 formularios/dependencias nuevas.
- CSS y motor/controlador JS idénticos al candidato revisado. Se reutilizan pruebas de contraste y protecciones anteriores.
- Chrome y deployment: evidencia posterior en `correcciones-qa-final.json`; no dar por aprobados antes de su registro.
- Fuentes nuevas SII y CódigoCivil accesibles; BCN genérico intermitente, texto versionado legal recuperado. No se afirma disponibilidad permanente de enlaces externos.

## Preservación y publicación futura

Único archivo runtime alterado: beneficios-tributarios-inmobiliarios.html. Base histórica de preview preservada (1.653 archivos); producción actual comprobada al inicio: dpl_5XmA5bbvmsDyttpgwC3sZf8jKtFk, SHA700c96b0868af9ef648be90d7754192041e5f383. Este candidato NO incorpora los cambios productivos posteriores y NO puede promoverse. Una futura publicación requiere resolver pendientes documentales, revisar nuevamente fuentes, conservar producción vigente, revisión del usuario y autorización expresa. No modificar PR18 ni baseline, sitemap, robots, formularios, CRM o AI Lab.

## Antes / después y fundamento

### Intereses hipotecarios · artículo 55 bis

Norma: LIR art. 55 bis, inciso tercero. Publicación/emisión: Ley 19.753: 28/09/2001; texto LIR consultado al corte. Vigencia: Regla vigente; no cambio legislativo nuevo.

Justificación: Evitar duplicar la rebaja en comunidad.

**requirements — anterior:** Crédito con garantía hipotecaria destinado a adquirir o construir viviendas, o a refinanciar esos créditos; intereses efectivamente pagados y acreditados.

**Corregido:** Crédito con garantía hipotecaria destinado a adquirir o construir viviendas, o a refinanciar esos créditos; intereses efectivamente pagados y acreditados. Solo un contribuyente puede usar la rebaja por vivienda; si se adquiere en comunidad con más de un deudor, la escritura debe identificar al comunero beneficiario.

Fuentes: [1](https://www.bcn.cl/leychile/navegar?idNorma=6368&idVersion=2026-11-01), [2](https://www.sii.cl/valores_y_fechas/renta/2026/personas_naturales.html)

### Contribuciones · exenciones y rebajas

Norma: DFL2 arts. 14 y 19; Circular 2/2012 III.3; Circular 22/2022. Publicación/emisión: Texto definitivo 18/07/1960; Circular 2 emitida 06/01/2012 y publicada 12/01/2012; Circular 22 emitida 06/05/2022. Vigencia: Alcance territorial vigente; cupos actualizados desde 01/01/2023.

Justificación: Corregir exclusión absoluta y separar impuestos y naturaleza de la operación.

**requirements — anterior:** Consultar certificado de avalúo y catastro SII. El DFL2 puede tener una exención del 50% por 20, 15 o 10 años según superficie: hasta 70 m², más de 70 hasta 100 m², y más de 100 hasta 140 m².

**Corregido:** Consultar certificado de avalúo, recepción y calidad DFL2. La vivienda puede acceder a una exención parcial del 50% por 20, 15 o 10 años según superficie: hasta 70 m², más de 70 hasta 100 m², y más de 100 hasta 140 m². El artículo 19 extiende las franquicias a terrenos comunes autorizados por el proyecto y a terrenos singulares hasta 500 m² por vivienda; no al resto del terreno.

**limits — anterior:** La franquicia DFL2 se limita a las dos viviendas correspondientes de personas naturales. Los plazos corren desde la recepción, no desde cada reventa. El terreno no goza de esa exención. No sumar automáticamente exenciones ni usar un avalúo exento antiguo como valor vigente.

**Corregido:** Aplican titularidad y límite de dos viviendas de personas naturales, plazo remanente y destino. Los artículos 14 y 19 deben leerse conjuntamente: no corresponde excluir todo terreno ni eximirlo sin condiciones. La Circular 2, III.3, contempla el avalúo total y ajuste por cuotas de dominio elegibles. Verificar en el SII el terreno común o singular, superficie, copropiedad y exención del rol; un terreno separado sin vivienda DFL2 no recibe automáticamente esta franquicia. No acumular exenciones por cuenta propia. La exención territorial no equivale a exención de renta o IVA al arrendar o vender; el suelo sigue sin ser depreciable. Si se construye en ese terreno un edificio no acogido al DFL2, el artículo 19 priva al respectivo inmueble de sus franquicias y exenciones.

**validity — anterior:** Beneficios actuales según rol y plazo remanente. Ver cambio especial para mayores de 65 años desde 2027.

**Corregido:** Reglas vigentes según rol y plazo remanente; la reventa no reinicia los 20, 15 o 10 años. Aplicar las instrucciones históricas junto con los cambios de titularidad y cupos vigentes desde 2023. En casos de deslindes, exceso de superficie o configuración jurídica dudosa, verificar el alcance individual ante el SII. Ver beneficio distinto de vivienda principal desde 2027.

**sources — anterior:** ['contribuciones', 'catastro']

**Corregido:** ['contribuciones', 'catastro', 'dfl19', 'dfl-circular2', 'dfl-circular22']

Fuentes: [1](https://educacion.dedecon.cl/informacion/mis-impuestos-personales/contribuciones-de-bienes-raices-impuesto-territorial), [2](https://www.sii.cl/preguntas_frecuentes/aval_contrib_bbrr/001_165_2439.htm), [3](https://www.bcn.cl/leychile/navegar?idNorma=16842), [4](https://www.sii.cl/documentos/circulares/2012/circu02.pdf), [5](https://www.sii.cl/normativa_legislacion/circulares/2022/circu22.pdf)

### Exención transitoria de IVA · vivienda nueva

Norma: Ley 21.850 art. cuarto transitorio N°2 y plazo; Código Civil art. 48. Publicación/emisión: Ley 21.850: 17/10/2026; texto refundido Código Civil: 30/05/2000. Vigencia: 01/12/2026; un año, cómputo general hasta medianoche 01/12/2027.

Justificación: Cómputo de aniversario fundamentado; exclusión de relacionados; circular no definitiva.

**requirements — anterior:** Primera enajenación de vivienda nueva destinada a habitación; recepción definitiva acreditada con fecha anterior al 17/10/2026. Escritura dentro del período o promesa por escritura pública/instrumento protocolizado en ese período y compraventa posterior.

**Corregido:** Primera enajenación de vivienda nueva destinada a habitación; recepción definitiva acreditada con fecha anterior al 17/10/2026. La transferencia entre empresas relacionadas en los términos del artículo 8 N°17 del Código Tributario no califica como primera enajenación para esta norma. Escritura dentro del período o promesa por escritura pública/instrumento privado protocolizado en ese período y compraventa posterior.

**validity — anterior:** Ley publicada el 17/10/2026. Aplicación futura al corte 14/11/2026; ventana ordinaria hasta 30/11/2027.

**Corregido:** Ley publicada el 17/10/2026. Inicio: 01/12/2026; duración: un año contado desde esa fecha. Aplicando la regla general del artículo 48 del Código Civil (mismo número de día y vencimiento a medianoche), el término corresponde al 01/12/2027. Este cómputo se funda en la ley y el Código Civil, no en una circular definitiva del SII: la circular general sigue en consulta al 14/11/2026 y debe revalidarse antes de operar.

**sources — anterior:** ['reforma', 'resolucion']

**Corregido:** ['reforma', 'plazos', 'consulta', 'circulares2026']

Fuentes: [1](https://www.bcn.cl/leychile/navegar?idNorma=1229250), [2](https://www.bcn.cl/leychile/navegar?idNorma=172986&idParte=8717831), [3](https://www.sii.cl/noticias/2026/051126noti02pcr.htm), [4](https://www.sii.cl/normativa_legislacion/circulares/2026/indcir2026.htm)

### Restitución de IVA en operaciones anteriores

Norma: Ley 21.850 art. cuarto transitorio; Resolución 146, resolutivos 1–13. Publicación/emisión: Ley: 17/10/2026; resolución emitida 23/10/2026, publicada en SII; anuncio 19/10/2026. Vigencia: Resolución: 01/12/2026.

Justificación: Distinguir emisión, vigencia y objeto; precisar fecha inicial según SII.

**requirements — anterior:** Escritura en el período entre ingreso del mensaje presidencial y el 01/12/2026, IVA pagado y restantes requisitos legales; mención expresa de la opción en escritura y acreditación de la restitución.

**Corregido:** Escritura entre el 22/04/2026 (ingreso del mensaje, según anuncio SII) y el 01/12/2026, IVA pagado y demás condiciones del artículo cuarto transitorio, incluida primera enajenación elegible; las transferencias entre empresas relacionadas no califican como tal. Debe constar expresamente la opción en la escritura y acreditarse la restitución.

**validity — anterior:** Resolución definitiva emitida el 23/10/2026; procedimiento habilitado desde diciembre. Circular general aún en consulta al corte.

**Corregido:** Resolución Exenta 146 emitida el 23/10/2026, con entrada en vigencia el 01/12/2026: al corte aún no rige. Regula el procedimiento especial de devolución por operaciones anteriores. La circular general de exención de IVA sigue en consulta; no se atribuyen sus proyectos de instrucciones a esta resolución.

**sources — anterior:** ['reforma', 'resolucion']

**Corregido:** ['reforma', 'resolucion', 'consulta', 'iva-anuncio']

Fuentes: [1](https://www.bcn.cl/leychile/navegar?idNorma=1229250), [2](https://www.sii.cl/normativa_legislacion/resoluciones/2026/reso146.pdf), [3](https://www.sii.cl/noticias/2026/051126noti02pcr.htm), [4](https://www.sii.cl/noticias/2026/191026noti01pcr.htm)

### DFL2 · opción de impuesto único del 5%

Norma: Ley 21.850 art. 3 y transitorios noveno y décimo octavo; anuncio SII 05/11. Publicación/emisión: Ley: 17/10/2026; anuncio consulta: 05/11/2026; circular definitiva no localizada. Vigencia: 01/01/2027; instrucciones pendientes al corte.

Justificación: Evitar atribuir régimen DFL2 a la Resolución 146.

**validity — anterior:** Régimen permanente desde 01/01/2027. Extensión transitoria a DFL2 nuevas hasta 140 m² compradas a no relacionados dentro de 12 meses desde 17/10/2026; esa ventana no limita el régimen a un solo año.

**Corregido:** Régimen legal permanente desde 01/01/2027. Extensión transitoria a DFL2 nuevas hasta 140 m² compradas a no relacionados dentro de 12 meses desde 17/10/2026; esa ventana no limita el régimen a un solo año. La circular general sigue en consulta al 14/11/2026; no se localizaron instrucciones definitivas de opción y salida en los índices revisados. Verificar los actos finales antes de acogerse. La Resolución 146 trata devolución de IVA, no este régimen.

**sources — anterior:** ['reforma', 'calendario']

**Corregido:** ['reforma', 'calendario', 'consulta', 'circulares2026', 'resoluciones2026']

Fuentes: [1](https://www.bcn.cl/leychile/navegar?idNorma=1229250), [2](https://www.sii.cl/destacados/ley_reconstruccion/), [3](https://www.sii.cl/noticias/2026/051126noti02pcr.htm), [4](https://www.sii.cl/normativa_legislacion/circulares/2026/indcir2026.htm), [5](https://www.sii.cl/normativa_legislacion/resoluciones/2026/res_ind2026.htm)

### Vivienda principal de personas de 65 años o más

Norma: Ley 21.850 art. 10 N°2, letra F), y octavo transitorio. Publicación/emisión: Ley: 17/10/2026; noticia SII: 11/11/2026; resolución específica no localizada. Vigencia: Beneficio: 01/01/2027.

Justificación: Precisar copropiedad, obligaciones y exclusiones; diferenciar ley, noticia y resolución.

**requirements — anterior:** Declarar la vivienda principal ante el SII y cumplir residencia habitual, edad y condiciones de propiedad; revisar copropiedad, deudas y derechos de aseo.

**Corregido:** Persona natural de 65 años o más, propietaria de su residencia habitual y asiento principal. En copropiedad, todos los titulares deben ser personas naturales y al menos uno debe residir allí, tener al menos 50% de los derechos y cumplir las demás condiciones. Existe excepción para quien herede de su cónyuge o conviviente civil al menos 25% del inmueble y cumpla los demás requisitos. Debe estar al día en aseo y en el impuesto territorial del año inmediatamente anterior, respecto de esa vivienda.

**limits — anterior:** Solo vivienda principal y dependencias que califican; no toda la cartera. Existen reglas de uso mixto, relacionados y pérdida del beneficio. No aplica por comprar mediante una sociedad.

**Corregido:** Solo una vivienda principal en Chile; estacionamientos y bodegas en la misma dirección y destinados a su habitación. En uso mixto, al menos 50% de la superficie construida debe destinarse a habitación efectiva del propietario. Se excluyen adquisiciones desde relacionados realizadas en los tres años previos a la declaración, salvo acreditación de causas distintas de las meramente tributarias conforme a resolución. No aplica a una sociedad propietaria. El beneficio cesa si se pierde la condición de vivienda principal o se incumple el pago de aseo; no elimina por sí solo deudas anteriores ni derechos de aseo.

**validity — anterior:** Desde 01/01/2027. El SII informa plazo hasta 31/12/2026 para acogerse desde enero de 2027.

**Corregido:** Exención legal desde 01/01/2027, no automática. El SII anunció el 11/11/2026 la declaración de vivienda principal por su web o en oficinas; presentar hasta 31/12/2026 para efectos desde enero de 2027. La ley remite el plazo y forma a una resolución: no se identificó esa resolución específica en el índice revisado al 14/11/2026. La noticia informa presentación inicial y renovación si se mantienen requisitos; debe verificarse la instrucción formal aplicable. Una guía o anuncio no equivalen a resolución. La guía indica adjuntar dominio vigente o escritura cuando corresponda, conservar el comprobante y consultar la solicitud; el resultado individual se comunica mediante resolución fundada.

**sources — anterior:** ['reforma', 'mayores']

**Corregido:** ['reforma', 'mayores', 'guia-mayores', 'resoluciones2026']

Fuentes: [1](https://www.bcn.cl/leychile/navegar?idNorma=1229250), [2](https://www.sii.cl/noticias/2026/111126noti01pcr.htm), [3](https://www.sii.cl/servicios_online/docs/guia_declaracion_vivienda_principal.pdf), [4](https://www.sii.cl/normativa_legislacion/resoluciones/2026/res_ind2026.htm)
