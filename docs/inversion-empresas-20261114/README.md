# Inversión inmobiliaria para empresas — candidato privado

Ejecución: 14/11/2026, America/Santiago. Alcance: ampliación independiente de corporate-education-v2. No modifica su registro ni T0.

## Implementación

Nueva ruta `/inversion-inmobiliaria-empresas.html`: hero, modalidades de compra, cuatro alternativas de financiamiento, tabla persona/sociedad, impuestos, riesgos, calculadora conceptual, nueve preguntas frecuentes, propuesta de captación y fuentes oficiales. Sin imágenes nuevas ni dependencias. Estilos aislados y tema compartido al final. Cabecera copiada del referente aprobado; pie conserva estructura/CSS y adapta únicamente el mensaje WhatsApp al contexto empresarial. Número único.

Base de fuentes: `07f6dcd14e01c206990928191fad30636dbca9c6`, rama publicada `codex/trabaja-footer-20261114`. El dominio se comprobó en `dpl_3vucDR26iHaZbcrW7uXoFcxLtK14`. Durante la tarea se publicó la corrección del PR17: se actualizó la base a `9afbd74cd1793533aed8f96de34d273f1ea19cd8`, producción `dpl_AZw6TnXFbk8P3DdGPqvo8YGrzrB9`, conservando esa corrección sin editarla. No se usa main como supuesto de producción.

Rama de esta tarea: `codex/inversion-empresas-20261114`.

## Vista previa

https://project-wrapp-f7diozzsb-lsandoval2-8260s-projects.vercel.app/inversion-inmobiliaria-empresas.html

Deployment `dpl_D6B5zzfG4iGPFucd1xki2BTdviaa`, staging/preview, READY, protección Vercel Authentication del proyecto. HTTP autenticado 200. El acceso puede requerir iniciar sesión en Vercel. El fetch de QA genera un acceso temporal de 23 horas; ese enlace no se publica.

Ensamblado manual a partir del manifiesto runtime preservado, sin regenerar el sitio histórico. 1.649 archivos existentes más cuatro recursos nuevos; el build verificó los 1.653 hashes SHA-1 y tamaños cuando estaban informados. El ensamblador rechaza VERCEL_ENV distinto de preview. Ningún dominio de producción asignado por esta tarea. El alias automático de preview del proyecto se actualizó por Vercel; no se cambiaron configuraciones del proyecto.

## Captación: desactivada de forma deliberada

La propuesta no contiene un elemento `form`, destino de envío, fetch ni controlador de entrega; utiliza un grupo accesible y fieldset disabled. Así tampoco puede enviar por Enter ni sin JavaScript. Contiene nombre, correo, teléfono, tipo de empresa, objetivo, rango opcional, región, comentarios opcionales y consentimiento. No solicita RUT ni documentos. El aviso expresa que no recibe solicitudes. No hay estados de éxito ficticios ni persistencia de datos.

Hallazgo: `api/advisory.mjs` valida una lista cerrada, exige RUT a través de commercial-fields, admite `objetivo` enumerado y `mensaje` hasta 2.000 caracteres. El transporte de esta base es Resend y prohíbe activar CRM por efecto lateral. No se incorpora el trabajo del PR13 ni se afirma que CRM esté activo.

Propuesta compatible pendiente de aprobación independiente: reutilizar la fábrica/protecciones de contacto existente y su transporte autorizado; mapear objetivo a patrimonio/diversificar/orientacion, solicitud a asesoria y componer tipo/rango/región/comentarios como texto limitado dentro de `mensaje`, sin añadir campos al contrato CRM. La ausencia de RUT requiere una variante validada de contacto inicial: no inventar RUT, no vaciar requisitos del endpoint existente. Debe revisarse aparte el contrato de entrada y consentimiento antes de activar. Hasta entonces solo queda disponible el enlace empresarial de WhatsApp; no se envió ningún mensaje.

## Fuentes y decisiones editoriales

Ver `sources.json`, con nueve referencias oficiales consultadas el 14/11/2026. Bci respalda modalidad para personas jurídicas y sociedades de inversión y ejemplos de documentación; BancoEstado respalda leasing. SII respalda DFL2, IVA de arriendos amoblados y requisitos de gastos; oficio 5/2018 junto con LIR respalda distinción terreno/construcción. BCN respalda marco SpA y LIR, incluida versión del 01/11/2026. La guía SII Renta 2026 complementa DFL2 y venta.

Se omiten tasas, porcentajes y plazos comerciales como condiciones generales. No se certifica una antigüedad universal ni aprobación para empresas nuevas. No se usan requisitos de hipotecarios personales para sociedades. Las pautas de vacancia, liquidez, concentración, escenario de caja y reserva operacional son criterios educativos de Sollahms, no obligaciones legales ni recomendaciones personalizadas. No se reproduce como universal la afirmación comercial de que toda cuota leasing es gasto: requiere evaluación tributaria particular.

## QA ejecutado y límites

- 17 pruebas Node del motor: fórmulas, casos 0%/100%, decimales, conservación de precio, negativos, límites, NaN, infinito y tipos inválidos: PASS.
- Tres pruebas adicionales del controlador con DOM simulado: estado inicial, porcentaje vacío frente a cero, eliminación de resultados inválidos y recuperación: PASS.
- Python estándar sin dependencias: un H1, IDs únicos, destinos locales y anclas existentes, JSON-LD parseable, WhatsApp único, consulta desactivada, orden de tema y conservación de fuentes: PASS.
- Build staging: PASS, 1.653 archivos comprobados y cuatro añadidos.
- HTTP autenticado de la página: 200.
- Formularios existentes, APIs, CRM, AI Lab, metadatos previos, sitemap y robots: sin cambios de archivos. No se enviaron formularios. La conservación byte a byte no equivale a repetir sus recorridos completos.
- No se ejecutó Lighthouse ni una evaluación legal/tributaria profesional.
- QA real Chrome: PASS a 1440×1000, 768×1024, 390×844 y 320×800; sin overflow de página. Tablas con scroll propio, menú abre/cierra y Escape devuelve foco; FAQ abre con Enter; CTA llega a consulta; campos y envío desactivados; teléfono único; consola sin errores/avisos. Capturas adjuntas. No sustituye auditoría WCAG completa ni prueba táctil física.
- Calculadora real en Chrome: 5.800 UF/80% → 1.160 UF aporte y 4.640 UF deuda; vacío produce error; 0% y 100% correctos; recuperación correcta.
- Primer intento de Chrome: timeout MCP; reintento exitoso. La incidencia quedó resuelta.

Las dos tablas tienen desplazamiento horizontal contenido y foco de teclado. La calculadora no usa almacenamiento, red ni conversiones UF/pesos; presenta errores y elimina resultados anteriores ante entradas inválidas. Los cuatro tamaños indicados se comprobaron en Chrome.

## SEO/GEO y siguiente publicación

Title, description, H1, canonical futuro, Open Graph y WebPage con IDs corporativos existentes. No FAQPage ni promesas de posicionamiento. Noindex/nofollow permanece explícito mientras sea candidato. No se cambian las 11 páginas ni sus metadatos, sitemap, robots, redirecciones, registros de medición, GSC o Bing.

Propuesta posterior, separada y NO ejecutada: aprobar contenido/diseño y resolver QA pendiente; aprobar cambio de noindex al preparar producción; comprobar de nuevo el deployment real y superponer únicamente los cuatro nuevos archivos. Las correcciones posteriores de otras páginas deben preservarse por hash. Navegación propuesta: un enlace desde Centro de Orientación, sujeto a su propio diff y aprobación. Sitemap propuesto: una URL canónica nueva, sujeto a aprobación y fecha real. Indexación será otra acción explícita. Activar captación requiere la evaluación independiente descrita arriba. Publicación no autorizada ni ejecutada; integración y eventual QA adicional del formulario activo permanecen separados.

## Historial de candidatos

El primer candidato `dpl_EfA4F6Ya5CTpn8QjK44FEQdEhC7Q` se construyó sobre la base inicial. Tras detectar la publicación concurrente de Guía se generó el candidato final indicado arriba. Los cuatro nuevos archivos permanecieron idénticos; se reutilizó su QA y se comprobó nuevamente el CTA y pie en el candidato final. Las capturas de hero a 1440/390/320 corresponden al contenido idéntico del primer candidato; la captura de pie a 390 corresponde al final.
