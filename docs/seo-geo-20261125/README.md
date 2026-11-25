# Optimización SEO/GEO ejecutada — 25/11/2026

Estado: implementada, probada y publicada el 25/11/2026 a las 18:11:35.881 America/Santiago. [Cierre de publicación](publication.json), Production dpl_4tBq9YFz3BKoiXiJE5G5hBjPXMwW, fuente 3f02788b. La creación Production sin dominios y la promoción del mismo ID están verificadas. La instrucción expresa del titular autoriza editar, probar, integrar y publicar esta iteración sin aprobaciones por etapas. [Autorización](authorization.json).

## Cambios concretos

- Entorno incorpora una secuencia propia para comparar ubicaciones e interpretar los campos reales del registro: ubicación/recorrido, información/revisión y estado/pendientes. Su explicación y los enlaces a Guía, Comparador y Asesoría se leen sin JavaScript. El listado de obras y el mapa siguen usando su implementación existente.
- Centro enlaza contextualmente a Entorno en «¿Qué necesitas resolver hoy?». Ambos recorridos usan «Solicitar asesoría», coherente con el formulario que recibe una solicitud y no confirma una cita.
- Se añaden únicamente dos fechas lastmod del 25/11 a las entradas existentes de Entorno y Centro. Se conservan las 144 URL del sitemap, su orden y todas las entradas excluidas.
- IndexNow usa un archivo público de prueba de propiedad y un notificador de publicación limitado a esas dos URL. Reutiliza el registro exacto v3 mediante seo_scope; el modo predeterminado no hace red. No lee cuentas privadas ni usa datos de visitantes. La notificación real se ejecuta sólo después de validar los bytes públicos.

No se ejecutan constructores generales: se conserva íntegro el Build Output certificado del pie y se superponen exclusivamente dos HTML, una CSS local, el sitemap y el nuevo recurso técnico. [Prueba del artefacto](artifact-proof.json). Funciones, catálogo, 152 fichas, Centro documental, pie global, datos de obras, controles financieros, privacidad, consentimiento y medición permanecen intactos. No se introducen nuevas páginas por ciudad, variantes de marca, schema especial, responsables ni credenciales sin respaldo.

## Criterio del estudio y evidencia

La estrategia v3 y los estudios del 25/29 de octubre priorizan contenido útil propio, enlaces comprensibles y recorrido educativo hacia la asesoría. La medición actual identifica Entorno como rastreada sin indexar, con último rastreo del 11/11; su HTML tiene una lista dinámica vacía y el cuerpo no enlazaba a las herramientas o asesoría. Centro tampoco enlazaba a Entorno. Esto justifica mejorar utilidad y descubrimiento, sin atribuir a JavaScript la exclusión de Google.

Beneficios ya está indexada y la cobertura de 34 comunas está publicada: no se repiten esas mejoras. No hay respaldo nuevo del responsable de la asesoría y no se inventa. La comparación de resultados se conserva en el [registro del ciclo](../seo-measurement/runs/2026-11-25-autonomous-improvements/report.md).

| Plataforma | Aplicación y comprobación | Límite |
| --- | --- | --- |
| Google | Texto y enlaces HTML; prueba en vivo y solicitud individual de las dos URL después de publicar, si la sesión existente lo permite | Una solicitud no acredita rastreo ni indexación; la causa de la exclusión no se demuestra |
| OpenAI / ChatGPT Search | HTML público útil y permiso OAI-SearchBot conservado; observación real separada | No se modifica entrenamiento ni se promete una cita; la muestra actual tiene condiciones distintas |
| Bing / Copilot | Aviso público IndexNow de las dos actualizaciones y registro del acuse | La recepción no acredita indexación, citas, posición o acceso a métricas privadas |
| Negocio | GA4 consentido y evento clave existente contact_request_accepted conservados | Acuse técnico, recepción, cualificación y venta siguen siendo etapas distintas |

## Validación y publicación

Se verificaron 19 pruebas de orientación y 11 de obras/cobertura. La comprobación antigua de scripts rechazaba el JSON-LD ya presente antes del cambio; ahora permite únicamente datos JSON-LD válidos y sigue rechazando scripts ejecutables o bloques malformados. Hay 12 casos de navegador con/sin JavaScript, tres anchos y dos páginas, y 18 casos del notificador bajo Python optimizado sin red. Las capturas usan fuentes de sustitución porque las fuentes remotas se interceptan; mapas y APIs están simulados. No se envían formularios reales ni eventos a SDK de proveedores.

Se incorporó la republicación concurrente del pie del 25/11 antes de preparar esta publicación: fuente 15c07de8, cierre Git e00707c8, Production 8Dn, con los mismos 1729 archivos del inventario fdc28233. La salida nueva tiene 1730 archivos: 1725 idénticos, cuatro modificados y una prueba técnica de propiedad añadida. Se crea Production con --prebuilt y --skip-domain, se verifican inventario, funciones, entorno y HTTP y se promueve ese mismo ID sin reconstruir. Se revalidan los cinco alias, bytes públicos, canonical, sitemap y directivas; T0 se toma del updatedAt del alias en America/Santiago. Se conserva 8Dn como reversión, con rol OWNER/elegibilidad comprobados y ensayo de diez escenarios sólo en memoria.

## Fuentes primarias revisadas el 25/11

- [Google: optimización para funciones generativas](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide): contenido útil propio, enlaces y requisitos habituales; Google puede procesar JavaScript y no garantiza indexación.
- [OpenAI: agentes y sus usos](https://developers.openai.com/api/docs/bots): búsqueda y entrenamiento son controles independientes; el permiso de búsqueda ya existe.
- [Microsoft: AI Performance](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/): citas distintas de ranking; el aviso IndexNow ayuda al descubrimiento y no certifica inclusión.
- [IndexNow: protocolo](https://www.indexnow.org/documentation) y [FAQ oficial](https://www.indexnow.org/faq): archivo de propiedad, dos URL públicas, 200 recibido o 202 recibido con validación pendiente. No se cambia una cuenta de Bing.

No hay un cambio de guías que justifique añadir marcado exclusivo para IA o alterar entrenamiento. La restricción de IndexNow en la fase de lectura de noviembre era específica de aquella tarea; la instrucción actual autoriza esta implementación acotada. El seguimiento semanal existente conserva su función de comparación: este documento no autoriza reenvíos o publicaciones automáticas fuera de su encargo.

## Cierre operativo del ciclo

Pasaron el inventario remoto completo de 1730 archivos, las 16 respuestas HTTP del candidato y las 16 públicas, las 12 canonical y los cinco alias, manteniendo redirecciones y fechas de creación. Durante la preparación, el trabajo paralelo del panel privado añadió cuatro metadatos de entorno; se preservaron junto a los siete anteriores, sin consultar valores. La [diferencia explícita](concurrent-environment-additions.json) se fijó antes de promover; no se incluyó código del panel en esta mejora corporativa.

IndexNow recibió el único aviso de las dos URL con HTTP 202: la validación de propiedad está pendiente en el motor. No se reenvió y no se considera indexación. Google completó las dos pruebas en vivo y aceptó exactamente una solicitud de indexación por URL; los [acuses](google-indexing-requests.json) no confirman aún una indexación posterior a T0. La [comparación visible del ciclo](../seo-measurement/runs/2026-11-25-autonomous-improvements/report.html) conserva períodos previos a T0 y no mide el efecto del cambio recién publicado.
