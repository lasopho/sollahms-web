# SEO corporativo — auditoría y candidato del 29/10/2026

Estado: cambios implementados en candidato; producción no modificada. Publicación pendiente de autorización expresa (apartado 19 del encargo). No confundir una mejora técnica con posiciones obtenidas.

## Base recuperada y alcance

Producción comprobada: `dpl_CwKecmoAPWkxhdbheFWEWfx3nntF`, código `1369697b2dbd1c9d614ec1ad8a62c7cd715c32a7`. Rama de origen `codex/purchase-stage-guide-20261029`; padre del candidato `f8999fe8afa5962ae82c562d596e90c2a4099b6d`, cuyo único cambio posterior es documentación/evidencia. Manifiesto congelado de 1.508 archivos de salida más cuatro archivos de construcción. Conserva las funciones, retiro HTTP410 de Patio Brasil y sincronización de los nueve registros comerciales de Nollagam/Crescer.

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

**No accesible:** Search Console pide Google login; Bing Webmaster Tools pide cuenta. Se dejaron pestañas para acceso del propietario. No se crearon propiedades ni se enviaron sitemaps/indexaciones duplicados. No hay cifras verificadas de clics, impresiones, CTR, posición, consultas, indexación o citaciones del dominio. El antecedente suministrado de verificación/indexación del25/10 no pudo reconfirmarse; el registro recuperado `docs/home-seo-20261025/measurement-baseline.json` tampoco acreditaba acceso en esa revisión.

**No medible con accesos actuales:** Vercel Web Analytics devuelve `web_analytics_not_enabled`; no se activó. No hay tráfico atribuido a IA ni incremento de conversión medido. Las búsquedas públicas puntuales no permiten concluir inclusión/exclusión del índice ni visibilidad global en IA.

**Laboratorio actual:** PageSpeed de portada,29/10/2026, [informe](https://pagespeed.web.dev/analysis/https-sollahms-cl/8ts19kgxez): móvil rendimiento98/accesibilidad96/buenas prácticas100/SEO100; escritorio100/96/100/100. LCP1370ms móvil/325ms escritorio, TBT0, CLS0; sin datos de campo. El contraste señalado incluye bloques con opacidad0.05 del desvanecimiento aprobado. Se conserva el efecto; no se afirma accesibilidad perfecta ni Core Web Vitals aprobados. El100 histórico no se reproduce como dato actual. El preview protegido no se envía a PageSpeed con credenciales.

## Documentación oficial consultada el29/10/2026

- [Google: guía vigente para búsqueda con IA](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide): contenido útil y SEO, sin archivos/marcados especiales obligatorios.
- [Google: informe de IA generativa](https://support.google.com/webmasters/answer/16984139): impresiones, páginas, países y dispositivos; sujeto a datos disponibles. No sustituirlo por suposiciones.
- [Google: cambios de documentación](https://developers.google.com/search/updates): resultado enriquecido FAQ retirado desde7/5/2026. Se conservan preguntas útiles visibles, sin añadir FAQPage por un beneficio inexistente.
- [Google: Organization](https://developers.google.com/search/docs/appearance/structured-data/organization?hl=es): datos reales consistentes. [Elegibilidad Business Profile](https://support.google.com/business/answer/13763036?hl=en).
- [OpenAI: bots](https://developers.openai.com/api/docs/bots): OAI-SearchBot búsqueda y GPTBot entrenamiento son controles distintos. No se modifica entrenamiento.
- [Bing: AI Performance](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/): citaciones y consultas de fundamentación disponibles no equivalen a ranking ni autoridad.

## Medición reproducible y pendientes

Al recuperar acceso: inspeccionar URL canónica y sitemap existente; registrar fecha, propiedad y cobertura. En GSC comparar los últimos28días completos disponibles con los28anteriores (según zona horaria/informe), separando las ocho rutas corporativas del catálogo/fichas. Exportar consultas, páginas, países, dispositivos, clics, impresiones, CTR y posición; distinguir marca con expresión `sollahms|sollhams`. Revisar además informe IA generativa cuando aparezca, sin convertir ausencia de datos en cero.

En Bing revisar índice/sitemaps/SEO y Performance; AI Performance: total de citaciones, páginas y grounding queries que el informe muestre. No sumar métricas con definiciones distintas. Tráfico IA sólo si existe una fuente autorizada que exponga referente verificable, sin añadir rastreo en esta tarea.

Para pruebas manuales, usar `ai-observations.csv`: registrar consulta exacta, plataforma, fecha/hora, país/idioma/contexto de cuenta, modalidad con búsqueda, URL citada y evidencia. No llamar ranking al orden de una respuesta. Separar una cita de una recomendación y de una mera mención. Conjunto repetible: marca, asesoría para invertir, comparación de propiedades, pie/dividendo, blanco/verde. El archivo es plantilla vacía, no observaciones inventadas.

Pendientes del propietario: acceso a Search Console/Bing y, después de revisar el candidato, autorización de publicación. No se bloquea el preview por las métricas privadas.

## Validación y recuperación

`static-verification.json`:276 comprobaciones de canonical, semántica, metadatos, enlaces/anclas, idempotencia y preservación. `educational-tests.txt`:15 pruebas existentes aprobadas, incluidos cálculos y las72combinaciones del orientador. Formularios, scripts, imágenes, estilos, cabeceras y pies comparados contra producción. Sin envíos, correos, reservas ni evaluaciones reales.

La rama `codex/corporate-seo-20261029` mantiene `main:false` y su propia clavefalse. El despliegue es preview; producción conserva su deployment anterior. Antes de una futura publicación, volver a comprobar el alias y recuperar cualquier avance posterior. No promover este candidato obsoleto sobre una producción más nueva. La versión anterior y el mecanismo oficial de rollback de Vercel siguen disponibles, pero no se ejecuta rollback porque no se cambió producción.

La evidencia de preview, revisión visual y estado final se incorpora en `preview-verification.json` al concluir.
