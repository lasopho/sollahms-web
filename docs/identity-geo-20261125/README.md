# Identidad institucional y dominio oficial — 25/11/2026

Estado inicial de este registro: candidato implementado y validado; la publicación y sus acuses se registran por separado al ejecutarlos. Autorización expresa del titular en [authorization.json](authorization.json). Alcance: Inicio, Agenda y Contacto dentro de las doce URL v3; sitemap limitado a sus tres entradas existentes.

## Diagnóstico demostrado y límites

La [prueba real por marca](../seo-measurement/runs/2026-11-25-autonomous-improvements/chatgpt-brand-observation.json), del25/11 a las22:04–22:07 deSantiago, menciona Sollahms desde fuentes externas, remite a un perfil personal y dice «No encontré uno verificable» respecto del sitio oficial. No enlaza al dominio propio. Es un diagnóstico con marca suministrada: no demuestra descubrimiento neutral, recomendación espontánea ni un cambio causado por las publicaciones anteriores. El inventario completo de citas no quedó acreditado; ese indicador permanece null.

La fuente productiva14d99d8 ya usa el nombre Sollahms, canonical correcto e identificadores estables Organization/WebSite/WebPage/Service. No hay un error deIDs que reconstruir. La deficiencia verificable es editorial: los cuerpos de estas tres páginas no identifican explícitamente el dominio oficial. Además, Service describía exclusivamente inversión aunque elHTML ofrece compra para vivir o invertir. La [revisión independiente](independent-review.json) y la [verificación de contenido](content-verification.json) documentan ambos puntos.

La disponibilidad pública, HTML, canonicals, robots y sitemap no muestran un bloqueo técnico demostrado. Robots ya permite OAI-SearchBot; su permiso y las preferencias de entrenamiento se conservan. Una hora sin coincidencias de eseUser-Agent enCDN no establece ausencia histórica de rastreo ni acredita origenOpenAI. El fallo del lector de investigación frente aGET200 es una limitación del lector, no una causa demostrada de la respuesta deChatGPT. La influencia concreta de selección de fuentes, índices y entidad personal permanece como hipótesis no confirmada.

## Correcciones y criterio del estudio

| Objetivo y hallazgo | Corrección ejecutada | Criterio y comprobación |
| --- | --- | --- |
| Identificar marca, servicio y dominio en contenido verificable | LaFAQ existente deInicio define Sollahms, enlaza sollahms.cl como web oficial, diferencia exploración del catálogo y asesoría, y conserva elCTA existente | Estudio25/10: definición de empresa y preguntas útiles; HTML visible con/sinJS, enlaces y semántica |
| Identificación coherente al solicitar contacto | Primer párrafo deAgenda yContacto con nombre corporativo, servicio y enlace al dominio oficial | Estudio29/10: distinguir las dos intenciones; todos losH1, formularios, controles y consentimiento preservados |
| Alinear schema con servicio visible | Sólo descripciones deOrganization/WebSite y serviceType/description deService; mismosIDs, nombre, URL, logo y contactos | Contenido real, sin personas/credenciales/sameAs inventados; validaciónJSON y campos estables |
| Conservar la corrección tras regenerar | Configuración central y helper corporativo reaplican únicamente esos tres fragmentos | Generación idempotente desde la fuente productiva; rechazo de catálogo/fichas y propiedades no admitidas |

Archivos de implementación: index.html, agenda-asesoria.html, contacto.html, scripts/corporate_seo.py, data/corporate-seo.json, sitemap.xml y data/indexnow-corporate.json. Este último reutiliza el notificador existente con las tres URL efectivamente cambiadas; no crea otra integración. No se añade contenido por variante de marca, comuna, archivoIA o perfil externo. No se completa identidad profesional ni se prometen entregables sin respaldo del titular.

ParaGoogle, Organization puede ayudar a desambiguar la organización según su [documentación oficial](https://developers.google.com/search/docs/appearance/structured-data/organization). ParaChatGPT, el cambio aporta texto propio inequívoco y mantiene el acceso de búsqueda; la [guía deOpenAI](https://developers.openai.com/api/docs/bots) no garantiza aparición, recomendación ni un plazo de inclusión. Sus24h de actualización de robots no son un plazo para aparecer. ParaBing/Copilot se comprueban entrega, avisoIndexNow y después su índice/menciones: no se atribuye un beneficio específico a schema sin medirlo. No hay cambio de guías que justifique alterar entrenamiento o instalar un marcado exclusivo deIA.

## Integridad, validación y publicación

La primera base fueAra/runtime14d99d8. La guarda previa detectó la publicación posterior dpl_9M5yUF3GzFK2aWy34Qn4en7y8tA7/runtime2327ed4 y detuvo la creación antes de emitir un deployment. Se incorporó íntegra esta nueva producción de planes privados de pago antes de reaplicar los cuatro archivos. Se conserva íntegro su artefacto completo certificado:1741archivos, ocho funciones y68archivos de función, incluido el panel privado. No se reconstruye desde el checkout ajeno modificado. [Prueba del artefacto](artifact-proof.json), [producción anterior](production-before.json) y [reversión](recovery-readiness.json).

Sólo cambian cuatro salidas: tresHTML y el sitemap. Los otros1737archivos, configuración de rutas, funciones, catálogo,152fichas, Centro documental, privacidad,GA4,Clarity,CRM,SSO,dominios y panel privado conservan exactamente sus bytes. Las144URL del sitemap y las entradas excluidas se preservan. Ninguna prueba envía formularios, correos, reservas ni eventos aSDK reales.

Se ejecutan verificaciones de contenido/preservación y18casos de navegador aislado (trespáginas,1440/390/320px,JSactivo/inactivo), revisión visual, mismo inventario remoto y pruebasHTTP del candidato. Production se crea prebuilt con--skip-domain; sólo tras superar esas comprobaciones se promueve el mismoID. Las lecturas frescas deben rechazar publicaciones concurrentes. Reversión dirigida a9M, con rol/elegibilidad comprobados y simulaciónsinred; no se ejecuta un rollback real para probarlo.

El cierre posterior contendrá SHA completo,ID, T0America/Santiago, comparación de cincoalias y bytes públicos, canonical, sitemap/directivas e indexación. Publicar es distinto de ser rastreado o recomendado.

## Indexación y medición

Después de publicar: revalidar los bytes públicos y prueba de propiedadIndexNow; emitir una única notificación de estas tresURL mediante el notificador existente, registrar200/202/rechazo sin convertirlo en indexación. Google se solicita sólo mediante la sesión autorizada disponible, una vezporURL, registrando aceptación o bloqueo real. No hay endpoint de registro de sitios enChatGPT usado por este encargo.

La línea base Google/Bing y el test neutral deConcepción conservan sus fechas y alcance en el [mismo informe del ciclo](../seo-measurement/runs/2026-11-25-autonomous-improvements/report.md). La nueva muestra por marca se mantiene aparte; no se comparan como una mejora. Pruebas posteriores se registrarán con fecha, condiciones y fuentes; no rellenan los doce espacios nuevos ni atribuyen causalidad inmediata.

La automatización existente seguimiento-semanal-seo-geo-de-sollahms se actualizó, sin duplicarla, para los jueves10:00America/Santiago. [Doce consultas exactas](identity-query-plan.json) separan identificación institucional y recomendación espontánea; se conserva también el control neutral19/11. Medir dominiooficial, perfilpersonal/confusión, mención, enlace ordinario, cita, recomendación y prominencia descriptiva por plataforma. Las variantes son consultas, no aliascorporativos verificados. Lo no ejecutado permanece no realizado; no se habilitanAPIpagadas ni tracker nuevo.

La [conciliación concurrente](baseline-reconciliation.json) preserva el intento detenido y la publicaciónposterior; no se descartó código delpanel ni se reutilizó elcandidatoAra obsoleto. Los1672estáticos públicos de9M sonidénticos aAra: laQA deidentidad mantiene validez, con inventario remotonuevo y reversión nueva.
