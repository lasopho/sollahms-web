# QA final de Preview privada — eliminación de recorridos

Fecha: **15/11/2026, 17:37–17:45, America/Santiago (UTC−03:00)**.

**Resultado: auditoría técnica de fuentes desplegadas aprobada; QA visual y funcional remoto pendiente por acceso del entorno.** No se declara una aprobación visual. Las autorizaciones anteriores para crear PR y Preview están resueltas.

1. **Objetivo y alcance.** Revisar el deployment existente `dpl_Fyu39RK4drsHA7tqs8brGRHqTtxF` sin repetir la eliminación ni reconstruir el paquete. Se verificaron las fuentes de las 131 fichas, incluidas las 49 con secciones eliminadas y las 64 modificadas. Todas coinciden byte por byte con la rama. No se cambió contenido funcional.

2. **Actividades completadas.** Se leyeron las instrucciones y la continuidad actualizada; se incorporaron por fast-forward los tres commits documentales remotos posteriores a `c97bfa5`, hasta `03cc6e9c3cf6152abd54ae138282bb8655946ddb`. Se confirmaron PR Draft, deployment READY, SSO configurado y aliases de producción.

   La API autenticada entregó el árbol completo, sin truncación: **1.660/1.660 hashes SHA-1 coinciden con el candidato**; 1.594 archivos son iguales a producción y exactamente 66 tienen los cambios permitidos. Las 131 fichas descargadas no contienen secciones, tarjetas, iframes, enlaces ni textos de recorridos. Conservan galería, encabezado, pie, navegación con destinos existentes e IDs únicos.

   Ninguna de las **1.119 rutas únicas de recursos locales** referenciados falta en las fuentes desplegadas: 1.489 referencias a imágenes, 1.775 cargas CSS y 969 scripts. Se cuentan 367 imágenes en planos/modelos, 131 formularios con Nombre/RUT/Correo/Teléfono, 131 enlaces WhatsApp y 119 iframes de mapas. Esto comprueba estructura y presencia de fuentes, no entrega HTTP ni interactividad. No se enviaron formularios ni se invocaron funciones comerciales.

3. **Pendientes.** QA visual remoto de las 131 fichas, responsive a 1440/768/390/320 px, galerías, planos, reproducción de medios existentes, navegación interactiva, consola, recursos HTTP y mapas. La nueva comprobación de 320 px no pudo ejecutarse. Se requiere acceso de red y autenticación permitidos para el hostname exacto.

4. **Incidencias y bloqueos.** El hostname de Preview no figura en la allowlist del entorno. HTTPS devuelve `Tunnel connection failed: 403 Forbidden`; Chromium reproduce `ERR_TUNNEL_CONNECTION_FAILED` antes de renderizar INN Puerto Chico. **Fichas inspeccionadas visualmente en remoto: 0; controles responsive remotos: 0.** No se generaron capturas nuevas atribuidas a la Preview.

   La credencial de automatización disponible está limitada a otros dos hostnames; no se envió fuera de su alcance. No hay herramientas de navegador conectado/escritorio expuestas para usar una sesión SSO existente. No se crearon enlaces públicos de acceso ni se cambiaron red, SSO, credenciales o proveedores. Una petición separada al iframe conservado de Google Maps también recibe CONNECT 403 del proxy: se documenta un bloqueo del entorno, no un defecto confirmado del deployment. La carga del mapa dentro de la Preview sigue pendiente.

5. **Archivos modificados.** Sólo documentos: este directorio de QA, un addendum del informe principal y `NEXT-PROMPT.md`. Aquí se conservan el auditor, manifiestos, resultados por ficha, comprobación de recursos/formularios, metadatos y probes de acceso. [Prompt anterior archivado](NEXT-PROMPT-anterior.md). No se alteraron HTML, CSS, JS, datos, funciones ni configuración del sitio; no se sobrescribió evidencia histórica.

6. **Rama, commits y SHA.** Rama `codex/eliminar-recorridos-global-20261115`. Base del PR `codex/agenda-regions-responsive-20261115`, SHA `c2e1965ced736d46917a1bee286456cb937d58fe`. Runtime del deployment `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`. HEAD remoto recibido `03cc6e9c3cf6152abd54ae138282bb8655946ddb`. Nuevas evidencias: `1933a086f29086fa45883b18176fdb2fe88fdf30`. El commit documental final se identifica en la entrega y el historial de este archivo. No se fusionó el PR.

7. **Pruebas y resultados.** Auditoría de 1.660 hashes, análisis de 131 HTML, navegación local y presencia de 1.119 recursos: aprobados. Formulario con cuatro campos en 131/131 fuentes. HTTPS/Chromium y Google Maps: bloqueados por proxy. Envíos comerciales y funciones invocadas: cero.

   | Ancho | Evidencia histórica local reutilizada | Nueva revisión visual remota |
   | --- | --- | --- |
   | 1440 px | 131 fichas | Pendiente por acceso |
   | 768 px | 131 fichas | Pendiente por acceso |
   | 390 px | 131 fichas | Pendiente por acceso |
   | 320 px | Sin comprobación anterior | Pendiente por acceso |

   Las 393 comprobaciones y ocho pruebas anteriores se mantienen como **históricas**, sin reejecutarlas. Las 27 capturas anteriores tampoco se atribuyen a este deployment. Comparación histórica de INN Puerto Chico: [antes 1440](../antes-inn-puerto-chico-1440.png) / [después 1440](../inn-puerto-chico-1440.png), [antes 768](../antes-inn-puerto-chico-768.png) / [después 768](../inn-puerto-chico-768.png), [antes 390](../antes-inn-puerto-chico-390.png) / [después 390](../inn-puerto-chico-390.png). La coincidencia de fuentes mantiene aplicable la evidencia de preservación anterior, pero no sustituye la inspección remota solicitada.

   Evidencias nuevas: [fuentes por ficha](fuentes-fichas.json), [manifiesto verificado](manifiesto-fuentes-verificado.json), [recursos/formularios](referencias-y-formularios.json), [estado remoto](estado-remoto-inicial.json), [Chromium](acceso-browser.json), [Google Maps](acceso-google-maps.json), [auditor de sólo lectura](auditar-fuentes.py).

8. **PR, deployment y producción.** [PR #27](https://github.com/lasopho/sollahms-web/pull/27) abierto en Draft. Preview READY, target staging, runtime `c97bfa5`. SSO configurado `all_except_custom_domains`; enforcement HTTP sin comprobar por el bloqueo previo de red. No hubo rebuild, promoción ni deployment nuevo.

   Corrección respecto del addendum anterior: hay **57 archivos de funciones distribuidos en 7 bundles `.func`**, no 57 bundles o funciones independientes. Todos coinciden con el candidato. Los aliases `sollahms.cl` y `www.sollahms.cl` permanecen asociados a `dpl_9zzSj2BRu8pSyW8Wc9aPtYawcRtN`. No se escribió en producción, dominios, CRM 360, Resend ni AI Lab.

9. **URL.** [Preview privada existente](https://project-wrapp-b1aszxxoe-lsandoval2-8260s-projects.vercel.app/). Se conserva su protección y no se ofrece un enlace que evada SSO.

10. **Próxima acción.** Disponer de acceso HTTPS del entorno y una sesión o autenticación de pruebas válida para esa URL, sin cambiar la protección del sitio ni compartir secretos en chat. Completar el QA remoto pendiente, priorizando INN Puerto Chico, Bcome, Núcleo Costanera, Plaza Las Condes, Bordevivo y Distrito Centro y cubriendo las 131 fichas y cuatro anchos. Mantener el PR Draft. No solicitar nuevamente las autorizaciones históricas de PR/Preview; merge, promoción y producción siguen prohibidos.
