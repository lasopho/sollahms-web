# Medición independiente SEO/GEO — integración tributaria PR #21

## Resultado inicial
**Impacto todavía no evaluable.** Las series disponibles terminan antes de la integración. La inspección almacenada de Google indica «La URL no está en Google / Google no reconoce esta URL» y Bing indica «Not discovered / The inspected URL is not known to Bing». No se solicitó indexación ni se ejecutó una prueba de URL en vivo.

Cierre de observación: **14/11/2026 23:39:29.125 America/Santiago (UTC−03:00)**; **15/11/2026 02:39:29.125 UTC**. Las lecturas se realizaron durante esta sesión, aproximadamente quince minutos después del T0. La hora de cierre no sustituye la fecha de actualización de cada proveedor.

## Referencias y alcance
- T0 de integración preservado: **14/11/2026 23:24:35.656 America/Santiago**.
- T0 de la guía preservado: **14/11/2026 23:00:14.697 America/Santiago**.
- T0 corporate-education-v2 preservado: **09/11/2026 20:11:23 America/Santiago**.
- Deployment de referencia del informe de publicación: `dpl_6ittTviwNMv8RyaKvYLdTiPdZu2L`.
- SHA de código: `9182da81a75a6ce1b026b67736291ebef3e4ac2f`.
- [Certificación de publicación, HTTP y enlaces](https://github.com/lasopho/sollahms-web/blob/a2efd10702c4ca201249e95501ab98395c90aa7c/docs/tributarios-integracion-20261115/PUBLICACION.md). Se reutiliza como evidencia técnica anterior; esta medición no reconstruyó ni recertificó el deployment.
- Segmento independiente: cinco páginas de origen y la guía destino. Los totales de dominio siguientes son contexto, **no rendimiento del segmento**. Fichas individuales de proyectos excluidas.

## Resultados por fuente y límites temporales

| Canal / fuente | Resultado observado | Cobertura y límite |
|---|---|---|
| Google Search, informe Web (texto), dominio | 4 clics; 28 impresiones; CTR 14,3%; posición media 5,1 | Selector 3 meses; gráfico 25/10–12/11/2026; actualización «hace 3,5 horas». Todo anterior al T0 |
| Google Web, filtro Página contiene URL completa de la guía | 0 clics; 0 impresiones; tabla sin datos | Mismo período anterior a publicación. Posición no aplicable; el 0 de la interfaz no es una posición orgánica |
| Google: funciones de IA generativa, Beta | 11 impresiones agregadas del dominio; guía ausente de las cuatro filas visibles | 25/10–12/11; sin clics ni consultas en la vista observada |
| Google AI Overviews | Desglose individual no disponible en la interfaz observada | No asignar las 11 impresiones a AI Overviews |
| Google AI Mode | Desglose individual no disponible en la interfaz observada | No asignar las 11 impresiones a AI Mode |
| Bing Search, dominio | 0 clics; 12 impresiones | Selector 3 meses; gráfico 14/08–13/11; tabla diaria llega al 12/11. No se certifica el 13/11 como día completo |
| Microsoft Copilots and Partners, AI Performance Beta | 0 citas; 0 páginas citadas promedio; grounding queries sin datos | Agregado de proveedores, no una medición individual de Copilot. Datos muestreados según aviso de la interfaz |
| ChatGPT Search | No medido en su interfaz de consumo | No equiparar una búsqueda auxiliar con una respuesta de ChatGPT Search |
| Gemini | No medido | Sin evidencia de menciones/citas en esta ejecución |
| Perplexity | No medido | Sin evidencia de menciones/citas en esta ejecución |

**Última fecha visible utilizable como corte conservador: 12/11/2026**, tanto en Google como en la tabla diaria de Bing. No se verificó una marca de consolidación definitiva. La zona horaria del reporte no fue expuesta en las vistas capturadas; no se convierte automáticamente un día del proveedor a America/Santiago. En el seguimiento debe confirmarse la zona del export, especialmente Pacífico para las series diarias de Search Console.

El informe Google IA solo ofreció filtros Página, País y Dispositivo. Sus filas fueron portada 11, contacto 2, agenda 1 y proyectos 1 impresiones. No sumar estas filas como usuarios o impresiones únicas ni conciliarlas por resta con el total 11. Tampoco sumar Google Web y Google IA: no se certificó su exclusividad.

## Cinco orígenes, medidos separadamente
Datos Google Web 25/10–12/11, previos al enlace. «Sin fila» no equivale a cero certificado ni a página no indexada.

| Origen | Clics | Impresiones | Posición media | Destino documentado |
|---|---:|---:|---:|---|
| Portada / | 4 | 25 | 1,6 | /beneficios-tributarios-inmobiliarios.html |
| /centro-orientacion.html | 0 | 2 | 3,5 | /beneficios-tributarios-inmobiliarios.html |
| /guia-hipotecaria.html | Sin fila | Sin fila | N/D | /beneficios-tributarios-inmobiliarios.html#intereses |
| /comparador-hipotecario.html | Sin fila | Sin fila | N/D | /beneficios-tributarios-inmobiliarios.html |
| /inversion-inmobiliaria-empresas.html | Sin fila | Sin fila | N/D | /beneficios-tributarios-inmobiliarios.html |

Las siete filas de páginas de dominio también incluían contacto (0/5/2,6), proyectos (0/3/2,0), agenda (0/3/3,0), trabaja con nosotros (0/3/34,3) y cuándo comprar (0/1/1,0). No sumar impresiones por página para reconstruir el total agregado de dominio.

## Consultas y marca
La tabla Google expuso dos consultas: `solams` (0 clics, 1 impresión, posición media 2,0) y `site:*.*/trabaja-con-nosotros "buk"` (0 clics, 3 impresiones, posición 34,3).
- No apareció una fila de «Sollahms», «Soll ahms» ni consultas tributarias en esa tabla.
- La posición 2,0 corresponde únicamente a una impresión de «solams», anterior al T0; no acredita un posicionamiento estable de la marca.
- La ausencia de consultas no demuestra demanda nula: el detalle disponible no cubre necesariamente todos los totales.
- Búsqueda auxiliar ejecutada: `site:sollahms.cl/beneficios-tributarios-inmobiliarios.html` y `"Sollahms" "beneficios tributarios"`, sin resultados devueltos. Es evidencia limitada de esas consultas en esa herramienta, no prueba universal de ausencia ni métrica de IA.

## Rastreo, indexación y descubrimiento
| Indicador | Evidencia | Interpretación |
|---|---|---|
| Enlaces disponibles para navegación | Cinco enlaces certificados en el informe de publicación; comprobados entonces en móvil y escritorio | Disponibilidad técnica, no prueba de rastreo por bots |
| Google, guía | URL no reconocida; última visita, página referente, recuperación y canonical N/D | No hay evidencia de rastreo o indexación de esta URL en la inspección almacenada |
| Bing, guía | Not discovered; URL no conocida | No descubierta según la inspección almacenada |
| Descubrimiento desde cada origen | No hay referente documentado en Google; sin eventos de clic internos obtenidos | No es posible atribuir visitas o descubrimiento a uno de los cinco enlaces |
| Logs de bots / sesiones | No consultados ni disponibles en esta ejecución | No inferir cero rastreos ni cero clics internos |

El HTTP 200 y los enlaces funcionales de la publicación no implican indexación. Los N/D de Google tampoco prueban un bloqueo de indexación. No se añadió instrumentación ni se enviaron formularios.

## Comparación frente al baseline y atribución
Este registro abre una **serie independiente**, sin reiniciar ni reemplazar los baselines corporativos. El baseline del repositorio `docs/seo-measurement/runs/2026-11-09-post-publication-t0/baseline.json` contenía métricas no medidas/null: no se convierten en cero ni se calculan porcentajes frente a ellas. Este informe no afirma reconciliar todos los informes históricos externos.

Cambio técnico documentado: cinco nuevos enlaces contextuales; guía y recursos íntegros en la certificación de publicación. Cambio de tráfico atribuible: **no determinable**. No existe aún un día completo posterior disponible en las series.

La guía se publicó aproximadamente 24 minutos antes de la integración, y hubo otras intervenciones corporativas cercanas. Antigüedad de la URL, indexación inicial, cambios concurrentes, volumen reducido, privacidad de consultas y variación de respuestas IA impiden aislar causalidad. Un crecimiento posterior será una asociación temporal hasta contar con evidencia adicional; tampoco una ausencia inicial de impresiones demostraría fracaso.

## Calendario propuesto — America/Santiago
Calendario documental; no se crean ni modifican automatizaciones en esta tarea.

| Fecha de revisión | Hito | Trabajo de solo lectura |
|---|---|---|
| 18/11/2026, 10:00 | D+4 | Inspección almacenada Google/Bing, último día completo confirmado, primeras impresiones de guía; registrar cada canal por separado |
| 21/11/2026, 10:00 | D+7 | Comparar primeras ventanas disponibles, consultas, cinco orígenes, guía y referencias de rastreo |
| 28/11/2026, 10:00 | D+14 | Comparación de ventanas de igual duración y días de semana; primera evaluación descriptiva |
| 12/12/2026, 10:00 | D+28 | Consolidar evolución, límites de atribución y recomendaciones sin intervenir producción |

El día de publicación es parcial. Usar desde el 15/11 como primer día calendario posterior solo después de confirmar la zona y consolidación del proveedor. No inventar días faltantes: si hay demora, registrar el corte real y posponer la comparación. Para cada origen conservar URL exacta, país, dispositivo, tipo de búsqueda, período y filtros; comparar ventanas iguales cuando existan.

Protocolo de consultas: «Sollahms», «Soll ahms», «solams», «beneficios tributarios compra vivienda Chile», «beneficios tributarios crédito hipotecario», «beneficios DFL2 Chile», «comprar propiedad como empresa Chile» e «impuestos arriendo propiedades Chile». Para IA usar sesiones nuevas, mismos prompts, fecha, idioma y ubicación documentados; registrar respuesta completa, mención de marca, URL citada y si cita realmente la guía. Separar ChatGPT, Gemini, Perplexity, Copilot, AI Overviews y AI Mode; «no disponible» no será cero. No evaluar fichas individuales de proyectos.

## Fuentes y evidencias
- [Google Search Console — Web](https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Asollahms.cl).
- [Google — IA generativa](https://search.google.com/search-console/performance/search-analytics/ai?resource_id=sc-domain%3Asollahms.cl).
- [Google — inspección almacenada](https://search.google.com/search-console/inspect?resource_id=sc-domain%3Asollahms.cl).
- [Bing Webmaster Tools](https://www.bing.com/webmasters/), propiedad https://sollahms.cl/: Search Performance, AI Performance y URL Inspection.
- Evidencia textual de las interfaces: `EVIDENCIA-LECTURAS.txt`, asociada a esta sesión. Se eliminaron del archivo las líneas de identificación de cuenta.
- Informe de publicación enlazado arriba: fuente histórica de navegación/HTTP; no presentado como nueva captura.
- Conector SEO consultado sin proyectos disponibles; medición realizada en las consolas autenticadas existentes.

## Cierre y preservación
**Continuar observación; no emitir conclusión de aumento o disminución atribuible.** Google y Bing no reconocen todavía la guía en sus inspecciones; el rendimiento posterior permanece pendiente.

Solo se crean documentos de medición en una rama independiente. No se modifica producción, las cinco páginas, la guía, sus recursos, sitemap, robots, SEO/GEO, formularios ni integraciones. No se solicita indexación, no se fusiona PR #21 y no se reinicia ningún T0. No se crea deployment.
