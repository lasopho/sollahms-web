# Presencia externa y entidad — observación del 09/11/2026, America/Santiago

**La identidad y las herramientas propias están acreditadas; la autoridad externa independiente sigue sin medirse exhaustivamente.** La muestra actual recuperó el perfil personal de LinkedIn ya documentado el 29/10, dos apariciones de su encabezado en comentarios y dos directorios automáticos que repiten ese perfil. No son cinco entidades independientes, una página corporativa acreditada ni cinco backlinks. No se verificó ninguna recomendación editorial independiente de Sollahms en esas fuentes.

Las consultas se observaron entre **10/11/2026 02:47:12–02:48:50 UTC**, equivalente a **09/11/2026 23:47:12–23:48:50 Santiago**. Las lecturas HTML llevan su instante exacto en la evidencia. El proveedor de búsqueda no informa motor, país efectivo, cuenta ni personalización. Esta muestra no representa directamente el SERP de Google/Bing, no determina posiciones oficiales, no sustituye GSC/Bing y no ejecuta ninguna prueba de IA.

## Recuperación anterior y trabajo nuevo

Se reutilizaron [la investigación de portada del 25/10](../../../home-seo-20261025/research-and-decisions.md), [el informe corporativo del 29/10](../../../seo-corporate-20261029/README.md) y [la recuperación editorial del Lab del 08/11](../../reviews/2026-11-08-four-pages/lab-reuse.md). Ya existían selección de intenciones, competidores/fuentes ilustrativos, definición de entidad, fuentes oficiales y la decisión explícita de no añadir perfiles sociales sin acreditar. No se repitió su QA técnico ni se generó otra investigación de keywords/volúmenes inexistentes. El ejemplo de compra en verde del Lab es sintético y no demuestra un borrador privado vigente.

El trabajo nuevo consiste en consultas públicas fechadas y atribuibles, clasificación de resultados, comprobación de la identidad/relaciones del HTML público de las **11 páginas incluidas**, y extracción de fuentes del recurso público de desarrollo urbano. El código local o `main` no se tomó como equivalente de producción. Las lecturas no enviaron formularios ni abrieron fichas. La prueba técnica de publicación del T0 permanece certificada por su propio run.

## Hallazgos externos comprobables

| Fuente | Clasificación | Qué se observó | Límite |
|---|---|---|---|
| [sollahms.cl](https://sollahms.cl/) | Propiedad de Sollahms; confirmado | Marca, asesoría inmobiliaria en Chile, audiencia, dominio y contacto comercial | Es evidencia propia, no autoridad ganada de un tercero |
| [Perfil personal de LinkedIn](https://cl.linkedin.com/in/luissandovalo) | Social personal; observado parcialmente; propiedad corporativa no verificable | Encabezado público de búsqueda relacionado con Sollahms; mismo antecedente de octubre | La apertura directa devolvió HTTP 999. No se acredita control de cuenta corporativa ni enlace al dominio |
| [Publicación de Urbani](https://es.linkedin.com/posts/urbani_los-10-mejores-portales-inmobiliarios-en-activity-7369767395797782528-5jLF) | Alojamiento de tercero de una autoidentificación | La marca aparece en el encabezado de quien comenta, líneas 34–40 de la apertura pública | El artículo/post trata portales inmobiliarios; no es una recomendación independiente de Sollahms |
| [Publicación sobre liderazgo](https://es.linkedin.com/posts/sebasti%C3%A1n-quiroz-bugue%C3%B1o-621808127_liderazgo-trabajoenequipo-desarrolloprofesional-activity-7448147731279245312-4ubO) | Alojamiento de tercero de una autoidentificación | El mismo encabezado aparece en comentarios, líneas 68–73 | No es una reseña, certificación ni recomendación editorial de la empresa |
| [Directorio de personas A](https://www.linkedin.com/pub/dir/Andres%2BLuis/%2B/cl-0-Chili-) y [directorio B](https://cl.linkedin.com/pub/dir/Luiz/Sandoval/cl-0-Chile) | Directorio/agregador; duplicados del perfil; observado parcialmente | Dos URL de listados automáticos repiten el mismo encabezado | Aperturas HTTP 999. No se cuentan como fichas empresariales independientes |

No se acreditó que alguna de estas apariciones enlazara a `sollahms.cl`. El campo queda **desconocido**, sin convertirlo en un conteo global de enlaces inexistentes. Los intervalos relativos mostrados por LinkedIn no se convierten en fechas editoriales exactas. No hay evidencia suficiente para declarar desactualizado el perfil ni una afirmación corporativa concreta.

No se identificó en los resultados revisados una cuenta empresarial oficial de Instagram/Facebook/LinkedIn Company, directorio empresarial, medio o asociación acreditado. Esto describe el conjunto recuperado, **no prueba que tales propiedades o menciones no existan**. La consulta sin comillas devolvió además homónimos aproximados ajenos a Sollahms; se excluyeron por falta de identidad. No se tomó una empresa con nombre parecido como competidor, perfil propio o inconsistencia real.

## Muestras reproducibles de búsqueda

Los resultados por consulta, URL y limitaciones están en [external-search-samples.json](evidence/external-search-samples.json). Todas usaron `search_service_web_run.system2_search_query`, sin filtro de recencia ni ubicación acreditada.

| ID | Consulta exacta | Resultado observado en la herramienta |
|---|---|---|
| Q01 | `"Sollahms"` | Perfil, dos comentarios y dos directorios LinkedIn |
| Q02 | `"sollahms.cl"` | Resultado vacío |
| Q03 | `"Sollahms" -site:sollahms.cl` | Mismas cinco URL LinkedIn |
| Q04 | `"sollahms.cl" -site:sollahms.cl` | Resultado vacío |
| Q05 | `"Sollahms" site:instagram.com` | Resultado vacío |
| Q06 | `"Sollahms" site:facebook.com` | Resultado vacío |
| Q07 | `"Sollahms" site:linkedin.com/company` | Devolvió perfiles/comentarios/directorios personales: el operador no fue respetado estrictamente |
| Q08 | `"Sollahms" (directorio OR empresa OR asociación OR prensa OR noticia)` | Mismas apariciones LinkedIn; sin fuente empresarial independiente nueva acreditada |
| Q09 | `"Sollahms" -site:linkedin.com` | Resultado vacío |
| Q10 | `"Sollahms Gestión Inmobiliaria"` | Mismas apariciones LinkedIn |
| Q11 | `"56948502440"` | Resultado vacío; es el teléfono comercial ya publicado, no un dato de leads |
| Q12 | `asesoría para invertir en propiedades en Chile` | Servicios de inversión/asesoría; se repiten Arma Tu Patrimonio, Lucas Finanzas y RGL del trabajo anterior |
| Q13 | `comparar crédito hipotecario Chile fuentes oficiales` | CMF Educa/simulador, MINVU, BCN y otros comparadores; no se validaron tasas o elegibilidad |
| Q14 | `Sollahms` | Mezcla de nombres similares ajenos y el perfil relacionado; se excluyen falsos positivos |

Los resultados vacíos son observaciones reales de esta búsqueda, no métricas de tráfico ni prueba de ausencia de indexación. La muestra no permite concluir si el dominio figura o no en Google/Bing, calcular su cuota de visibilidad ni atribuir un cambio al T0. Las fuentes no marca sirven para descubrir y comparar tipos de contenido. No justifican copiar promesas de competidores, sumar oportunidades de fichas, crear nuevas páginas o repetir el estudio de intenciones ya realizado.

## Consistencia de entidad y relaciones de las 11 páginas

[external-entity-live.json](evidence/external-entity-live.json) conserva URL, hora, SHA-256 del HTML público, título/H1, JSON-LD, enlaces internos permitidos, fuentes y contacto comercial. La marca propia es **Sollahms**, el dominio canónico es `https://sollahms.cl/` y todos los enlaces WhatsApp de las 11 páginas apuntaron al mismo número comercial **+56 9 4850 2440**. El encabezado externo añade un descriptor de gestión inmobiliaria; eso no demuestra un nombre legal diferente ni una inconsistencia. No hubo un teléfono corporativo externo contrastable: esa comparación permanece no medida.

La portada identifica asesoría inmobiliaria en Chile para personas, empresas e inversionistas; distingue evaluación/comparación de activos y ubicaciones. Las páginas de contacto/agenda ofrecen la vía de asesoría; la guía, comparador y centro cubren financiamiento, pie/dividendo/costos y orientación; la guía de etapas trata decisiones de compra; Entorno trata infraestructura y conectividad. Colaboración, privacidad y catálogo cumplen funciones corporativas/navegación. No se evalúa ningún proyecto individual contenido en la navegación.

La portada relaciona `Organization`, `WebSite`, `WebPage` y `Service` con IDs persistentes `#organization`, `#website`, `#webpage` y `#asesoria-inmobiliaria`. Las páginas corporativas educativas preexistentes remiten a organización/web y las de contacto al servicio. El catálogo usa `CollectionPage` con un `publisher` Organization en línea por nombre y dominio, sin reutilizar su `@id`: es una conexión menos explícita, sin contradicción de identidad observada.

Se encontró JSON-LD en nueve respuestas HTML. **Centro de Orientación y Entorno no contenían un script JSON-LD en el HTML recibido**. Es una ausencia concreta y acotada; no indica que el contenido sea incomprensible, que no esté indexado o que falle en IA. Se conserva como observación documental para una futura decisión respaldada por datos, sin añadir marcado durante esta tarea.

No se halló `sameAs` ni un enlace saliente a perfiles sociales estándar en esas once respuestas. Esta omisión coincide con la decisión anterior de no inventar perfiles. No corresponde añadir un perfil personal o directorio automático como identidad de la organización. Tampoco se infieren domicilio, tamaño, experiencia, certificaciones, independencia o membresías a partir de resultados públicos incompletos.

Las guías/centro/comparador enlazan fuentes de CMF, BCN, MINVU, SII, Banco Central y SERNAC, y se conectan entre sí y con contacto. La extracción de fuentes del HTML de Entorno por sí sola es incompleta: el controlador carga datos públicos. [external-urban-source-inventory.json](evidence/external-urban-source-inventory.json) recupera **56 registros de obras publicadas** con sus URL fuente y fechas informativas/de revisión del corte **31/10/2026**. Incluyen organismos, municipios, operadores y otras fuentes; no se afirma que todas sean oficiales. No se extrajeron ni auditaron relaciones con fichas, y no se recertificó hoy el estado de las obras. Esta investigación ya existente no se vuelve a presentar como trabajo pendiente.

La [documentación oficial de Organization](https://developers.google.com/search/docs/appearance/structured-data/organization), consultada el 09/11 Santiago, respalda datos reales y `sameAs` aplicable. La [guía oficial de Google para IA](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), consultada en la misma fecha, mantiene el SEO habitual y no requiere archivos o marcado especiales de IA; Google declara que ignora `llms.txt` para su búsqueda. Eso no acredita un efecto positivo o negativo de ese archivo en ChatGPT. No se propone añadirlo ni atribuirle mejoras.

## Brechas y oportunidades, sin ejecución

| Clasificación | Evaluación respaldada | Siguiente acción de auditoría |
|---|---|---|
| Ya cubierto | Identidad/servicio propios, herramientas educativas, vínculos internos, fuentes y grafo principal | Conservar; no rehacer optimización ni investigación ya certificada |
| Requiere actualización cuando exista evidencia | Verificación de control y URL vigente de un perfil corporativo, si el propietario ya lo utiliza | Contrastar el inventario autorizado de cuentas existentes antes de proponer enlaces; no crear perfiles |
| Ausencia real acotada | `sameAs`/enlaces sociales ausentes en el HTML capturado; dos páginas sin script JSON-LD | Documentar; no inferir fallo, no implementar ahora |
| Oportunidad de autoridad | Los comentarios con autoidentificación no acreditan contribuciones editoriales independientes | Evaluar contribuciones técnicas/educativas o colaboraciones reales y atribuibles cuando exista material y relación comprobados; no comprar menciones |
| Oportunidad de distribución | Las herramientas ya publicadas pueden difundirse en canales empresariales existentes cuyo control se acredite | Recuperar primero esos canales; propuesta futura, sin nuevas páginas/contenido/cuentas en esta tarea |
| No verificable con herramientas actuales | Universo de backlinks, dominios de referencia, calidad/historia de enlaces, medios/asociaciones globales y posiciones reales de marca | Export autorizado existente de una herramienta de enlaces, si se dispone, y lectura de propiedades de buscadores; no contratar una herramienta por defecto |

No se dispone aquí de un dataset profesional de backlinks. Las muestras no permiten medir exhaustividad, enlaces perdidos, atributos `rel`, anchor text, autoridad o crecimiento. No hay un recurso profesional obligatorio demostrado antes de recuperar las propiedades y exports existentes. Todos los hallazgos y sus límites quedan en [external-presence-evidence.json](external-presence-evidence.json). No se modificaron producción, marcado, formularios, perfiles, backlinks, sitemaps o configuración externa.
