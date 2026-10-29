# SEO corporativo — auditoría y candidato del 29/10/2026

Estado: cambios implementados en candidato; producción no modificada. Publicación pendiente de autorización expresa (apartado 19 del encargo). No confundir una mejora técnica con posiciones obtenidas.

## Base recuperada y alcance

Base inicial auditada: `dpl_CwKecmoAPWkxhdbheFWEWfx3nntF`, código `1369697b2dbd1c9d614ec1ad8a62c7cd715c32a7`. Producción avanzó durante la tarea. El candidato final incorpora íntegramente la actualización Euro: producción `dpl_2ZVBbbzPnRAHfnDeFCaAaywgaDuY`, código `da064d6433d9099af4b3e5df892f4db23997ad5c`, evidencia `1b77fe086d8794d33d0990d82dcc92886808e1da`. Se conservaron sus nuevos enlaces de origen entre guías y contacto, scripts, 12 fichas, precios y recursos. El manifiesto vigente contiene 1.621 archivos de salida más cuatro archivos de construcción. Conserva funciones, retiro HTTP410 de Patio Brasil y sincronización de21 registros comerciales (Nollagam/Crescer/Euro). Los nueve archivos de salida modificados por SEO se superponen a esa base; los otros 1.612 permanecen idénticos.

Ocho páginas auditadas y optimizadas: portada, contacto, agenda-asesoria, guia-hipotecaria, comparador-hipotecario, cuando-comprar-propiedad, trabaja-con-nosotros y privacidad. La última recibe únicamente metadatos estructurados: su texto legal permanece idéntico. Las dos guías conservan todo su texto educativo, herramientas y sección final de fuentes.

Excluidos: `/proyectos.html`, las 131 fichas activas y todos sus datos, medios, mapas, precios y metadatos. No se modifican sus entradas de sitemap ni permisos de rastreo. Las fotografías, CSS compartidos, scripts funcionales y formularios de las ocho páginas también se conservan. Se agrega una única regla local al comparador para que los enlaces de su pie puedan envolver y no desbordar en móvil. Se mantienen los enlaces de Guía hipotecaria incorporados en la versión vigente junto con Expertise, Asset Portafolio y Contacto.

## Auditoría inicial y cambios justificados

Las ocho páginas dan HTTP200, canonical correcto, H1 único, descripción y título únicos, contenido en HTML y sin noindex. HTTPS, www y /index.html responden308 hacia la variante canónica. URL inexistente404, Patio Brasil410. Robots y sitemap accesibles. Ninguna imagen sin atributo alt. No se rehacen estos mecanismos válidos.

Se corrigen brechas concretas:

- Contacto y agenda tenían introducciones casi iguales. Ahora contacto explica consultas concretas; asesoría explica objetivos, comparación de antecedentes y coordinación, sin prometer cita confirmada ni crédito.
- El pie del comparador no envolvía sus enlaces y desbordaba en móvil. Una regla local de flex-wrap lo corrige sin afectar otras páginas. En ese mismo pie se usa el archivo maestro verde existente: la variante clara anterior no contrastaba sobre el fondo claro aprobado. No se altera el recurso del logo ni otras imágenes.
- H1 del comparador genérico: ahora identifica el dividendo hipotecario en UF. La explicación enlaza a la guía sin tocar cálculos.
- Expertise precisa el servicio para compradores e inversionistas. El bloque de preparación y la respuesta sobre etapas enlazan naturalmente a las guías existentes. Se conservan el título, H1 y descripción SEO ya pertinentes de la portada y las tres tarjetas comerciales.
- Títulos de guía, comparador y colaboración distinguen su intención. Guías completan metadatos sociales con la misma imagen aprobada, sin alterar su composición.
- Organization, WebSite y Service de portada eran válidos y se conservan. Las otras siete páginas se conectan mediante `@id` persistentes: WebPage/ContactPage, publisher, isPartOf y temas visibles. Contacto/agenda apuntan al servicio real. No se inventan oficinas, expertos, reseñas, experiencia, sameAs, ofertas laborales ni marcado de producto financiero.
- Helper `scripts/corporate_seo.py` con lista explícita de ocho páginas, configuración centralizada y rechazo de catálogo/fichas. Los dos generadores educativos aplican el helper al final. No hay JavaScript, cookies ni dependencias de producción nuevos.
- Sitemap conserva exactamente todas sus URL; lastmod se actualiza únicamente para los cuatro documentos con cambios de texto visible.

## Intenciones de búsqueda seleccionadas

Observaciones puntuales de resultados públicos del 29/10/2026; no son un estudio de volumen, dificultad ni posiciones propias.

| Destino | Consulta/intención prioritaria | Motivo |
|---|---|---|
| Portada/Expertise | asesoría para invertir en propiedades en Chile; asesoría inmobiliaria en Chile | Coincide con el servicio y permite explicar comparación, ubicación, objetivos y siguiente paso. |
| Contacto/agenda | contactar a Sollahms; solicitar asesoría para comprar o invertir | Intención de marca o contratación, diferenciada de contenido educativo. |
| Guía | cuánto pie necesito; qué es dividendo, tasa, CAE y gastos | Ya existen explicaciones, ejemplos, fuentes y herramienta original. |
| Comparador | calcular dividendo hipotecario en UF; comparar pie, tasa y plazo | Corresponde a la herramienta real, sin simular una oferta bancaria. |
| Etapas | comprar en blanco o en verde; entrega inmediata; riesgos y plazos | Página específica ya útil con comparación equilibrada y orientador. |
| Colaboración | colaborar con Sollahms/inmobiliarias; postulación espontánea | Dos rutas reales, sin vacantes inventadas. |

Las búsquedas generales mezclan corredoras, inversión y asesoría legal. Se observaron páginas de Tinsa (guía), RGL (inversionistas), Arma Tu Patrimonio, Lucas Finanzas e ICARIA (servicios/comparación). La oportunidad razonable es explicar el proceso de evaluación y conectar herramientas propias; no copiar promesas de rentabilidad o experiencia de competidores. La búsqueda puntual de marca mostró un perfil personal de LinkedIn relacionado, pero no se acreditó como perfil corporativo controlado: no se añadió `sameAs`. No se crean páginas por comuna ni Business Profile sin acreditar contacto presencial elegible.

## Rastreo, indexación y métricas

**Verificado técnicamente:** robots permite Googlebot/Bingbot por regla general y OAI-SearchBot explícitamente. Cuatro solicitudes con esos agentes y GPTBot entregaron el mismo HTML200. Cambiar el User-Agent no acredita acceso desde las IP reales de los rastreadores ni prueba indexación. Preferencias de entrenamiento intactas. Vercel mantiene SSO para dominios de deployment, excepto dominios personalizados; live/auto-deployment=false. La consulta de firewall devolvió404 «Seawall Config not found»; no demuestra por sí sola ausencia de todas las defensas de plataforma. No se cambiaron protecciones.

**No accesible:** Search Console pide Google login; Bing Webmaster Tools pide cuenta. Se dejaron pestañas para acceso del propietario. No se crearon propiedades ni se enviaron sitemaps/indexaciones duplicados. No hay cifras verificadas de clics, impresiones, CTR, posición, consultas, indexación o citaciones del dominio. El antecedente suministrado de verificación/indexación del 25/10 no pudo reconfirmarse; el registro recuperado `docs/home-seo-20261025/measurement-baseline.json` tampoco acreditaba acceso en esa revisión.

**No medible con accesos actuales:** Vercel Web Analytics devuelve `web_analytics_not_enabled`; no se activó. No hay tráfico atribuido a IA ni incremento de conversión medido. Las búsquedas públicas puntuales no permiten concluir inclusión/exclusión del índice ni visibilidad global en IA.

**Laboratorio actual:** PageSpeed de portada,29/10/2026, [informe](https://pagespeed.web.dev/analysis/https-sollahms-cl/8ts19kgxez): móvil rendimiento98/accesibilidad96/buenas prácticas100/SEO100; escritorio100/96/100/100. LCP1370ms móvil / 325 ms escritorio, TBT0, CLS0; sin datos de campo. El contraste señalado incluye bloques con opacidad0.05 del desvanecimiento aprobado. Se conserva el efecto; no se afirma accesibilidad perfecta ni Core Web Vitals aprobados. El100 histórico no se reproduce como dato actual. El preview protegido no se envía a PageSpeed con credenciales.

## Documentación oficial consultada el 29/10/2026

- [Google: guía vigente para búsqueda con IA](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide): contenido útil y SEO, sin archivos/marcados especiales obligatorios.
- [Google: informe de IA generativa](https://support.google.com/webmasters/answer/16984139): impresiones, páginas, países y dispositivos; sujeto a datos disponibles. No sustituirlo por suposiciones.
- [Google: cambios de documentación](https://developers.google.com/search/updates): resultado enriquecido FAQ retirado desde 7/5/2026. Se conservan preguntas útiles visibles, sin añadir FAQPage por un beneficio inexistente.
- [Google: Organization](https://developers.google.com/search/docs/appearance/structured-data/organization?hl=es): datos reales consistentes. [Elegibilidad Business Profile](https://support.google.com/business/answer/13763036?hl=en).
- [OpenAI: bots](https://developers.openai.com/api/docs/bots): OAI-SearchBot búsqueda y GPTBot entrenamiento son controles distintos. No se modifica entrenamiento.
- [Bing: AI Performance](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/): citaciones y consultas de fundamentación disponibles no equivalen a ranking ni autoridad.

## Medición reproducible y pendientes

Al recuperar acceso: inspeccionar URL canónica y sitemap existente; registrar fecha, propiedad y cobertura. En GSC comparar los últimos 28 días completos disponibles con los 28 anteriores (según zona horaria/informe), separando las ocho rutas corporativas del catálogo/fichas. Exportar consultas, páginas, países, dispositivos, clics, impresiones, CTR y posición; distinguir marca con expresión `sollahms|sollhams`. Revisar además informe IA generativa cuando aparezca, sin convertir ausencia de datos en cero.

En Bing revisar índice/sitemaps/SEO y Performance; AI Performance: total de citaciones, páginas y grounding queries que el informe muestre. No sumar métricas con definiciones distintas. Tráfico IA sólo si existe una fuente autorizada que exponga referente verificable, sin añadir rastreo en esta tarea.

Para pruebas manuales, usar `ai-observations.csv`: registrar consulta exacta, plataforma, fecha/hora, país/idioma/contexto de cuenta, modalidad con búsqueda, URL citada y evidencia. No llamar ranking al orden de una respuesta. Separar una cita de una recomendación y de una mera mención. Conjunto repetible: marca, asesoría para invertir, comparación de propiedades, pie/dividendo, blanco/verde. El archivo es plantilla vacía, no observaciones inventadas.

Pendientes del propietario: acceso a Search Console/Bing y, después de revisar el candidato, autorización de publicación. No se bloquea el preview por las métricas privadas.

## Validación y recuperación

`static-verification.json`: 276 comprobaciones de canonical, semántica, metadatos, enlaces/anclas, idempotencia y preservación. `educational-tests.txt`:15 pruebas existentes aprobadas, incluidos cálculos y las 72 combinaciones del orientador. Formularios, scripts, imágenes, estilos, cabeceras y pies comparados contra producción. Sin envíos, correos, reservas ni evaluaciones reales.

La rama `codex/corporate-seo-20261029` mantiene `main:false` y su propia clavefalse. El despliegue es preview; producción conserva su deployment anterior. Antes de una futura publicación, volver a comprobar el alias y recuperar cualquier avance posterior. No promover este candidato obsoleto sobre una producción más nueva. La versión anterior y el mecanismo oficial de rollback de Vercel siguen disponibles, pero no se ejecuta rollback porque no se cambió producción.

La evidencia de preview, revisión visual y estado final se incorpora en `preview-verification.json` al concluir.

Las capturas de Contacto/Expertise fueron obtenidas en el primer preview y reutilizadas tras comprobar el HTML visual idéntico; los enlaces de origen y el comparador se revisan de nuevo en el candidato final. El número de comprobaciones no equivale a solicitudes reales ni a métricas de posicionamiento.

## Candidato final validado

- Preview READY: [abrir versión protegida](https://project-wrapp-h3pul7key-lsandoval2-8260s-projects.vercel.app/). Vercel añade noindex al preview; los canonical siguen apuntando al dominio oficial. El toolbar de Vercel se excluyó únicamente de la comparación de bytes de respuesta, sin modificarlo.
- Commit de código: `bd59851b736892f3aaa01989b6b3c4c570a0a00d`; deployment `dpl_3aqTiHXik8wEbFYcQ6NKEpUBeUNU`; rama `codex/corporate-seo-20261029`.
- Once respuestas HTTP satisfactorias: ocho páginas, sitemap, catálogo y UF. Las nueve salidas de página/sitemap coinciden exactamente con el candidato. Catálogo 131 idéntico al manifiesto vigente. Build oficial verificó 1.621 archivos y conservó la sincronización de 21 registros.
- Revisión Chrome: escritorio 1425 px y móvil 390 px (375px de contenido), navegación/anclas, menú, foco de teclado, formulario sin enviar, guías y cálculo ilustrativo. El único desbordamiento detectado se corrigió; el pie del comparador muestra el logo maestro con contraste. No se detectaron errores de consola. La consulta de logs error/fatal de la última hora no devolvió registros; esto no equivale a demostrar entrega de contactos, que no se probó con envíos reales.
- Comprobación final de producción 29/10/2026 06:33 UTC: continúa `dpl_2ZVBbbzPnRAHfnDeFCaAaywgaDuY` (Euro), sin promoción de este trabajo. Main `86e200ec191b38af355061e21bc0fc1e549cce3b`, live=false y SSO conservados. La comparación Git contra la evidencia actual de Euro no muestra cambios fuera del alcance corporativo y su documentación.
- Capturas: [Contacto escritorio](contact-desktop.jpg), [Contacto móvil](contact-mobile.jpg), [Expertise escritorio](expertise-desktop.jpg), [pie del comparador corregido](comparator-mobile-footer.jpg).

**Próximo paso autorizado pendiente:** el propietario revisa el preview y autoriza publicación. La consulta de métricas sólo requiere iniciar sesión en las pestañas de Search Console/Bing ya abiertas. No se necesitan descargas, comandos ni configuración nueva por parte del propietario.
