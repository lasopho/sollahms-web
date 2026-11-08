# Accesos y exportaciones

## Estado observado el 8/11/2026

Se buscaron herramientas disponibles: no hay conector específico de Google Search Console ni Bing Webmaster Tools. El entorno informa cero secretos y cero identidades salientes configuradas. Esto demuestra falta de integración utilizable **en esta sesión**, no inexistencia de propiedades del propietario. No se buscaron ni copiaron contraseñas.

Las solicitudes a `search.google.com`, `www.bing.com`, `chatgpt.com`, `gemini.google.com`, `www.perplexity.ai` y la búsqueda de Google fallaron en el túnel del proxy con 403. No son bloqueos del dominio Sollahms. La ausencia de un controlador de navegador conectado utilizable impide reutilizar sesiones personales; no se afirma haber entrado en las cuentas.

Vercel sí está conectado para leer proyecto/deployment. Dos intentos de consulta de `vercel.analytics_pageview.count` devolvieron 400; la CLI no está instalada. Son un fallo de consulta, no prueba de Analytics desactivado ni de tráfico cero. La evidencia del 29/10 informaba `web_analytics_not_enabled`; no se presenta ese antecedente como estado confirmado hoy. No se activó rastreo.

## Vía mínima recomendada: exportaciones desde una cuenta existente

El propietario u operador que ya tenga acceso puede exportar los informes. No se necesita crear otra propiedad, verificar dominio, enviar sitemap, configurar IndexNow, dar acceso de administrador ni compartir credenciales para esta vía.

### Google Search Console

1. Seleccionar la propiedad de dominio que cubra Sollahms o, si ya existe, la propiedad de prefijo exacto `https://sollahms.cl/`. Registrar cuál; no mezclar propiedades.
2. Rendimiento → resultados de búsqueda: tipo Web; últimos 180 días completos disponibles como mínimo, finalizando en el último día consolidado. Si los datos todavía no están completos, retroceder el cierre. Registrar filtros, tipo de búsqueda, zona del informe y fecha de extracción. GSC usa su propia zona de informe, habitualmente Pacific Time; no convertir filas diarias a hora chilena.
3. Exportar CSV de Fechas, Consultas, Páginas, Países y Dispositivos con clics, impresiones, CTR y posición media. Conservar el paquete completo. Exportar total y Chile por separado si se necesitan ambos; nunca sumarlos. No sumar tablas de dimensiones entre sí.
4. Indexación → Páginas: exportar totales, evolución y motivos de no indexación; conservar listas de ejemplos identificadas como parciales. Sitemaps: registrar la entrada existente, último procesamiento, estado y URL descubiertas. No volver a enviarla sin evidencia de necesidad.
5. Inspección de URL de portada, catálogo, guías, orientación y ocho candidatas: guardar veredicto, rastreo, canonical declarado/seleccionado y motivo si existe. No solicitar indexación en esta fase.
6. Registrar limitaciones: consultas anonimizadas, filas truncadas, muestreo/ejemplos y retardo. Menos historia significa comparación no disponible; no rellenar ceros anteriores al alta de la propiedad.

### Bing Webmaster Tools

1. Seleccionar el sitio existente `https://sollahms.cl/`. No importarlo de Google otra vez.
2. Exportar Search Performance por fecha, consulta y página para los mismos periodos completos que Bing permita; guardar país/dispositivo si el informe los expone.
3. Registrar definición de posición, cobertura y filtros. No sustituir posición de clic por posición de impresión ni comparar ambas como si fueran la misma serie.
4. Exportar Site Explorer/URL Inspection e informe de sitemap existente: estado, último rastreo, exclusiones y canonical cuando esté informado.
5. Revisar IndexNow existente y sus envíos solo si la interfaz los muestra. Hoy su configuración queda **no verificada**, no se instala ni envía nada.
6. Si la cuenta ofrece AI Performance, exportar citas, páginas y consultas de fundamentación con las definiciones mostradas. Mantenerlo separado de rendimiento orgánico, visitas y de pruebas manuales en otras IA. Su disponibilidad no se presupone.

## Vía interactiva o API, si se elige después

- Sesión del propietario ya autorizada o identidad designada por él con lectura en la propiedad existente. Para GSC, informes con usuario restringido donde esté permitido; para operaciones de inspección, la cuenta debe tener el permiso que esa propiedad/API exija. La alternativa de exportar desde la cuenta actual evita elevar permisos.
- API GSC: OAuth autorizado por esa cuenta con alcance `https://www.googleapis.com/auth/webmasters.readonly`; no se configura aquí ni se solicita una contraseña. Credenciales únicamente en el gestor seguro del entorno, nunca GitHub/chat. Bing: sesión o API de lectura autorizada según el mecanismo ya existente; no generar nuevas claves sin necesidad.
- El entorno requeriría acceso de red aditivo a los hosts del servicio elegido: `search.google.com` y sus hosts de autenticación para interfaz, `searchconsole.googleapis.com`/`www.googleapis.com` y OAuth si se usa API; `www.bing.com` y los hosts de inicio de sesión que realmente utilice la cuenta. La lista actual debe preservarse. No se amplió la red en esta fase porque las exportaciones son una alternativa suficiente.
- Para las pruebas IA se necesitan interfaces accesibles y sesiones válidas cuando sean requeridas. Tener una API de generación no acredita acceso a ChatGPT Search, Gemini de consumo o sus resultados de búsqueda.

## Archivos mínimos para desbloquear la medición

Por motor: serie diaria de hasta 180 días completos, tabla de páginas, tabla de consultas y registro de filtros/periodo/propiedad. Para confirmar indexación: exportaciones de cobertura y evidencia de inspección por URL. Para medir negocio: totales agregados de contactos aceptados/cualificados por origen y periodo desde la herramienta ya existente; sin nombres, RUT, email o teléfonos.

La falta de estos recursos bloquea cifras verificadas y prioridad por demanda, pero no bloquea el importador, las propuestas ni el protocolo preparados.
