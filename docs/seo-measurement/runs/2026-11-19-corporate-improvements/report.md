# Sollahms — revisión y mejoras corporativas, 19/11/2026

Revisión registrada en America/Santiago. Las mejoras están **publicadas y verificadas en producción** desde el **19/11/2026 07:54:02.653 America/Santiago**. Se publicó el SHA autorizado `df78d77f31c8da946623e586634998e151ed237e` en `dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH`. [Registro y evidencias de publicación](publication/publication.json). El candidato usa el artefacto real que sirve `sollahms.cl`, no el `main` histórico.

## Avance comprobado

La producción inicial es `dpl_FhxqQpX3EZNDBg2AFPSsK3mJNhwr`, fuente declarada `49312fd708ccd9e319511432e4b657788f5734f9`. Los alias y la configuración se acreditan en [production-reference.json](production-reference.json). Las 12 páginas y cuatro comprobaciones de dominio/robots/sitemap dieron **16/16 respuestas finales 200 con SHA exacto** en [public-http-baseline.json](public-http-baseline.json). Los redirects de www e index conservan 308.

El sitio ya contaba con títulos, descripciones y canonicals únicos, un H1 por página y enlaces internos válidos. La publicación SEO del 9/11 está documentada históricamente; las páginas empresariales y tributarias se incorporaron después. [Inventario vigente: 12 URL, intención y relaciones](../../SCOPE-v3.md). No se rehízo contenido correcto para aumentar el número de cambios.

| Estado | Evidencia disponible |
|---|---|
| Implementado | Cuatro archivos desplegables corregidos; ver tabla siguiente |
| Publicado | Producción inicial, publicaciones anteriores y candidato actual verificados. El candidato fue publicado con aprobación expresa |
| Rastreo/indexación del motor | No medidos; HTTP 200 y robots permisivo no prueban indexación |
| Visibilidad pública | Cinco consultas exactas de marca y cinco de servicios registradas; sin enlace a sollahms.cl en esas muestras. No son ranking fijo de Google/Bing ni prueba de ausencia de indexación |
| Menciones, enlaces o citas IA directas | No medidos. La búsqueda web no sustituye ChatGPT Search |
| Rendimiento/captación | GSC y Bing sin acceso/export verificable; OpenSEO sin proyecto. Vercel devolvió datos vacíos, sin cobertura que permita comparar 28/28; no se interpreta como cero visitas |

[Observaciones, consultas exactas, herramientas, horas y límites geográficos](public-observations.json). El histórico v2 incluía el catálogo: sus totales no son comparables con v3 sin volver a filtrar los datos originales. No se atribuyen cambios de posición, CTR, tráfico o citas a esta intervención.

## Antes y después

| Hallazgo comprobado | Corrección | Evidencia |
|---|---|---|
| Beneficios tributarios publicada sin entrada en sitemap | Se añade exclusivamente su URL pública; sin lastmod supuesto | El sitemap anterior se reconstruye al retirar esa única línea; todas sus entradas/fechas quedan exactas |
| Centro de Orientación sin entidad de página | WebPage con URL canónica y referencias a Organization/WebSite existentes | JSON-LD válido; cuerpo, scripts y controles idénticos |
| Entorno sin JSON-LD ni metadatos sociales | WebPage y Open Graph/Twitter con arte corporativo existente de 1200×630 | URL social coincide con canonical; dimensiones verificadas contra PNG real; cuerpo idéntico |
| Asesoría empresarial deriva a campos deshabilitados y WhatsApp del pie | Nota clara y enlace contextual al contacto activo | Destino y ancla válidos; no se activó el formulario empresarial |
| Registro histórico incluye catálogo y omite dos páginas nuevas | Alcance v3 de 12 URL; guardas compatibles con v2/v3 | Catálogo y Centro documental se clasifican fuera; desconocidas nunca entran por descarte |

Fuentes de autoría: `data/corporate-seo.json`, `scripts/corporate_seo.py`, los tres HTML, `sitemap.xml`, `scripts/seo_scope.py` y documentación v3. El renderer conserva exactamente la salida previa de sus ocho páginas originales: [metadata-compatibility.json](metadata-compatibility.json). La prueba histórica de octubre conserva sus ocho páginas contractuales, sin intentar leer nuevas páginas ausentes de aquella fixture.

La revisión editorial contrastó una muestra de condiciones hipotecarias/tributarias con MINVU, BCN y SII; conservó el contenido correcto y sus fechas. No constituye una certificación tributaria exhaustiva. [Fuentes y decisiones](content-review.json). No se agregaron variantes de marca, sedes, credenciales, promesas ni tipos estructurados ajenos al contenido visible.

## Validación y conservación

- **130/130** comprobaciones estáticas sobre las 12 corporativas: metadata, enlaces, anclas, sitemap, JSON-LD, formularios, scripts, navegación, WhatsApp y estilos. [Resultado](static-verification.json).
- **36 flujos de navegador**, referencia/candidato en 1440, 390 y 320 px, cero errores JS o desbordamientos; nueve vistas superiores idénticas. Contacto, agenda, comparador, Centro y Entorno probados con fixtures. Los 18 POST fueron interceptados; cero envíos reales. [Navegador y capturas](browser/README.md).
- **28 pruebas empresariales**, **31 de alcance/importación**, **5 de protección del overlay** y **9 mocks de funciones** aprobados. [Mocks](preview-runtime-mocks.json). Ningún proveedor, correo, reserva ni CRM real fue invocado.
- **1.723 archivos de runtime verificados**: cuatro cambios autorizados y **1.719 idénticos**. Siete funciones/57 archivos, configuración, recursos compartidos, robots, catálogo, 152 fichas y Centro documental preservados. [Prueba de artefacto](artifact-proof.json).

Se detectó que el HTML Git del comparador no contenía el pie corporativo publicado después. El candidato conserva el comparador del artefacto productivo exacto, sin sobreponer el HTML Git antiguo. La ampliación de 21 proyectos y los demás avances posteriores también se conservan. El workspace original con cambios pendientes no se modifica.

[Revisión de rastreadores](crawler-review.json): acceso de búsqueda y preferencias de entrenamiento separados, sin cambios a robots ni apertura de previews. No se enviaron solicitudes de indexación.

## Candidato y reproducción

Rama de trabajo: `codex/seo-geo-corporativo-20261119`, aislada desde la fuente productiva. Durante la revisión se detectó una publicación posterior: `dpl_8MyM5t9vQukSLaBkNRq4sTzGsSPV`, SHA `0a0b7c70c7de8f5db8b122ae8a4d6664773180ba`, rama `codex/mapa-filtros-21-proyectos-20261119`. Se integró esa base en la rama de revisión y se reconstruyó el overlay desde sus 1.723 archivos certificados. Las dos altas y dos modificaciones del mapa se conservan exactamente. Las 12 corporativas y todas sus funciones no cambiaron entre ambas bases: la evidencia de navegador y mocks sigue aplicando. [Conciliación](production-update-preservation.json). `main` remoto continúa en `86e200ec191b38af355061e21bc0fc1e549cce3b`, con publicaciones posteriores fuera de esa cadena. El PR debe comparar contra la rama fuente de producción para no mezclar esos trabajos con esta revisión.

El procedimiento vigente utiliza el **Build Output API certificado**, preserva las siete funciones y sobrepone tres HTML y el sitemap. No ejecutar el packager histórico ni desplegar el checkout incompleto. `scripts/prepare-corporate-seo-review.py` verifica primero el SHA del manifiesto productivo y cada archivo; rechaza cambios adicionales y protege las entradas anteriores del sitemap. El artefacto privado durable queda fuera de Git en la carpeta `sollahms-seo-geo-private/candidate-current` de la visualización de este encargo.

La configuración consultada mantiene Production Branch `main`, `autoAssignCustomDomains:false`, auto-deploy Git existente y SSO `all_except_custom_domains`. Subir esta rama puede generar una Preview Git; no publica producción. La preview manual debe usar `vercel deploy --prebuilt --environment preview` con el proyecto/equipo verificados. Las funciones ya bloquean escrituras en Preview; la reserva conserva `booking_not_certified`.

El [candidato verificado](candidate.json) corresponde al código `e1f75f0c95c1d0cba78c2c8c35737835ce395d28`, [PR #37 en borrador](https://github.com/lasopho/sollahms-web/pull/37), base `codex/mapa-filtros-21-proyectos-20261119`. [Preview privada final](https://project-wrapp-dzbpzd5yt-lsandoval2-8260s-projects.vercel.app), deployment `dpl_FnrDxhrH6BMbB93MntwFyFk8zyKN`, READY. Los commits posteriores al código incorporan únicamente esta evidencia.

**Verificación remota final:** [1.723/1.723 UID SHA-1 exactos](preview-remote-integrity.json), siete funciones y configuración coincidentes. [14/14 GET autenticados](preview-http-verification.json) de las 12 corporativas, robots y sitemap coinciden con el candidato; solo se retira para comparar el script exacto del toolbar que Vercel añade a la preview, conservando por separado ambos hashes. Los HTML entregan `X-Robots-Tag: noindex`. Un GET sin autenticar redirige 302 al acceso de Vercel, sin abrir el sitio. No se modificó SSO.

La [última lectura productiva](production-final-recheck.json), **19/11/2026 07:40:23 America/Santiago**, mantiene ambos dominios en `dpl_8MyM5t9vQukSLaBkNRq4sTzGsSPV` y todos los ajustes previos. El primer intento de preview queda documentado como histórico; no es el candidato final.

[Procedimiento para una publicación posteriormente autorizada](PUBLICACION.md). La aprobación posterior del titular autorizó la publicación. Se creó Production sin dominios y se promovió **el mismo ID validado**, sin reconstrucción. Ambos alias públicos sirven ese ID; los siete Functions, configuración, SSO y reglas automáticas permanecen intactos. No se fusionó el PR ni se modificó main. [Verificación independiente final](publication/production-after.json).

## Pendientes y seguimiento

Solo quedan obtener datos de motores/IA con procedencia y observar resultados posteriores. La publicación y su validación técnica están completas. Los límites de fuentes/fuentes tipográficas de la QA local están indicados en el informe de navegador; no se amplía el alcance para corregir comportamientos anteriores.

[Plan reproducible](measurement-plan.json): `Sollams` a secas prioritaria, seguida por Sollahms, Solams, Solamp y Solamps por separado; cinco consultas de servicios idénticas a las observadas. Mantener herramienta, hora, país y contexto geográfico disponible. Distinguir mención, enlace y uso como fuente. Concepción, Chillán y Puerto Montt están respaldadas como ubicaciones publicadas, sin implicar oficinas; San Pedro de la Paz y Los Ángeles quedan pendientes de cobertura verificable.

Para GSC/Bing usar los últimos 28 días completos disponibles frente a los 28 anteriores, con idéntico filtro positivo v3 y zona nativa. No sustituir métricas ausentes por cero ni atribuir al corporativo tráfico del catálogo. Registrar la activación real T0 y separar las páginas nuevas con ventanas cortas. Después de publicar, revisar únicamente las cuatro URL públicas del plan; nunca las previews ni el Centro documental. No se prometen posiciones, citas o plazos de aparición.
