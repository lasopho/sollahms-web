# Publicación productiva — eliminación del eslogan en los pies

Publicación autorizada y promovida el **16/11/2026 a las 14:26:18.266, America/Santiago**. Se promovió exactamente el mismo Production aislado que superó la verificación previa, y después se completó el QA público. No queda una publicación pendiente. El QA posterior y su cierre se completaron a las **14:37:08.909, America/Santiago**.

- Deployment definitivo: `dpl_9b2Fp33LqsL5NuB2p7JLdxx9t9gu`, READY, Production, prebuilt.
- [Portada pública](https://sollahms.cl/) · [Asset Portafolio público](https://sollahms.cl/proyectos.html).
- Hostname inmutable protegido: `https://project-wrapp-fzatwpfta-lsandoval2-8260s-projects.vercel.app`.
- Source SHA declarado: `b761ddeaea2fa526870e6af25658046e31b571d7`. Implementación: `d4d67bc298bbb8e78e7ba91867b49c1e4fd09772`. Los commits posteriores solo documentan el cierre; conservar el HEAD remoto real.
- Rama `codex/footer-sin-frase-20261116`; [PR #31](https://github.com/lasopho/sollahms-web/pull/31) abierto en Draft, sin merge.
- Anterior conservado para recuperación: `dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR`. Preview histórica: `dpl_8Jtg46E1zuPUUd1fhEdcKTu6GUAF`.

## Intervención exacta e integridad

El inventario publicado SHA256 es `aabc92d6a5c7c8d345d9a3cc7dd4f45a7fd11c8385c752ddf45e5a2d0f649549`. Contiene 1.660 archivos: únicamente `static/index.html` y `static/proyectos.html` cambian respecto de HWs; otros 1.658 permanecen idénticos. Se retiran seis líneas de HTML que contenían las dos apariciones y sus contenedores exclusivos, sin reemplazar la frase. Ambos pies reducen su altura en 112 px en los cinco anchos.

Las 131 fichas, los 66 cambios anteriores de eliminación de recorridos, Contacto, Centro de Orientación, siete funciones/57 archivos, configuración v3, datos comerciales, recursos, logo y motion se conservan. CRM 360, Sollahms AI Lab, Resend, credenciales, variables, DNS y ajustes de seguridad no se modifican. No se ejecutan builders, generadores históricos ni reconstrucciones; Vercel confirma `Using prebuilt build artifacts from .vercel/output`.

La autorización y el texto original están en [authorization.json](authorization.json) y [authorization-request.txt](authorization-request.txt). [created.json](created.json), [promotion-request.json](promotion-request.json), [promotion-confirmed.json](promotion-confirmed.json) y [deployment-events.json](deployment-events.json) documentan la única creación y promoción. Los hashes completos originales se conservan en `../candidate-manifest.json`; esta fase añade [preservación final](final-runtime-preservation.json), [archivos documentales](modified-files.json) y `SHA256SUMS`.

## Gates y QA

| Evidencia | Resultado |
|---|---|
| Preflight conectado | 14/14; HEAD, PR Draft, producción, cuatro dominios, SSO y concurrencia |
| Artefacto local | 16/16; 1.660 archivos, 131 fichas, 66 cambios de recorridos y 89 checksums previos |
| Preflight nativo | 21/21; producción y Preview completas contra manifiestos originales |
| Production aislado | 24/24; 1.660 rutas/SHA1, siete funciones, SSO y aliases todavía en HWs |
| Chrome aislado | 10/10 y 10 capturas; ambas páginas a 1440/1024/768/390/320 |
| Gate inmediato | Aliases y concurrencia reconsultados antes de promover; un solo Production nuevo |
| Postpromoción nativa | 25/25; mismo ID, artefacto exacto, cuatro dominios y protecciones |
| QA HTTP público | 210/210 URL; 222/222 transacciones TLS; 12 redirecciones 308 |
| Fichas públicas | 131/131 byte por byte, sin recorridos |
| Enlaces y recursos | 36/36 destinos/fragmentos y 54 recursos aprobados |
| Retiro Patio Brasil | 12/12 casos con 410 y redirecciones existentes |
| Chrome público | 10/10 en cinco anchos; TLS 1.3, 10 capturas revisadas visualmente |
| Postflight conectado | 17/17; cuatro dominios en el nuevo ID y PR aún Draft, sin merge |

Se comprobaron las cuatro URL expresas: `/` y `/proyectos.html` en `sollahms.cl` y `www.sollahms.cl`. También se conservan el 308 de `sollhams.cl` y el dominio predeterminado `project-wrapp.vercel.app`. Las 210 respuestas públicas coinciden exactamente con sus fuentes certificadas, sin excepción por toolbar. El hostname inmutable mantiene 302 a SSO con TLS válido. SSO `all_except_custom_domains`, autoasignación false y previews automáticas deshabilitadas permanecen intactos.

Los pies conservan DOM, logo, texto, enlaces, estilos y geometría del candidato; no quedan contenedores del eslogan, separadores residuales ni overflow. Se comprueban lectura opaca, borde atenuado y movimiento reducido. Cero errores JavaScript inesperados o recursos propios fallidos. WhatsApp se verifica por destino y clic interceptado, sin enviar mensajes. No se envían formularios, correos, reservas, leads, POST ni escrituras CRM. La única API financiera del navegador usa una fixture UF 503 explícita; no se realiza una consulta UF real ni una nueva auditoría financiera.

### Trazabilidad de los verificadores

El primer verificador de anclas usaba `/index.html` como base en lugar de la URL canónica `/`; se corrigió exclusivamente el harness y se conservó el diagnóstico. En la primera matriz pública, nueve casos se completaron y el registro del grupo de desvanecimiento agotó la espera en proyectos a 320 px, después de aprobar footer/TLS/recursos. Ese único caso se repitió completo con traza de media query: aprobó lectura 1, borde 0.055 y movimiento reducido, con el mismo deployment, origen, pin y hash del pie. `browser/public/results.json` conserva los nueve certificados originales y esa repetición; su campo `aggregation` enlaza ambos recibos originales. No se alteró el sitio para conseguir esos resultados. Los diagnósticos permanecen en `browser/attempts/`.

## Continuidad y recuperación

Esta autorización quedó ejecutada completamente. No reutilizarla para crear deployments, publicar cambios nuevos o fusionar PR. El anterior prompt de autorización y el cierre de Preview están archivados en `history/`. Los certificados de Preview siguen siendo evidencia histórica del mismo candidato; el estado publicado vigente está en [publication-closure.json](publication-closure.json).

El output exacto permanece en `.vercel/footer-sin-frase-20261116/stage/.vercel/output`, dentro de `/private/tmp/sollahms-footer-review-20261116`. Si falta en una tarea futura, recuperar los bytes autenticados del Production definitivo y cotejar los 1.660 archivos; no reconstruir desde main ni restaurar paquetes anteriores que sustituyan Contacto o Centro. HWs se conserva como referencia de recuperación. Para cambios nuevos, reconsultar producción, dominios y HEAD antes de actuar. Sin nuevo encargo, informar el cierre y mantener el sitio intacto.
