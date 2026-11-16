# Smoke del Production aislado — PASS 24/24

Deployment exacto: **`dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`**.

Origen comprobado: https://project-wrapp-jteux3lm5-lsandoval2-8260s-projects.vercel.app

Se validaron previamente el ID, proyecto `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, target `production`, estado `READY` y hostname mediante metadata de Vercel. La autorización y creación del deployment corresponden al agente principal.

**Seis fichas prioritarias × 1440/768/390/320 px = 24 parejas únicas, todas aprobadas:** INN Puerto Chico, Plaza Las Condes, B.Come, Núcleo Costanera, Borde Vivo y Distrito Centro. Este smoke conserva los 524 controles de Preview ya certificados y se une a la verificación independiente del artefacto y de HTTP/funciones de Production.

| Control | Resultado |
| --- | --- |
| HTTP 200 y ficha real | 24/24 |
| Incidencias pendientes | 0 |
| Excepciones JavaScript, recursos HTTP fallidos o imágenes rotas | 0 |
| Overflow horizontal, secciones vacías o imágenes visibles ocultas | 0 |
| Contenido residual de recorridos | 0 |
| Campos comerciales visibles/habilitados | 96 comprobaciones correctas |
| Mapas presentes y renderizados | 20 inspecciones; coincide con la fuente de las seis fichas |
| Métodos comerciales enviados | 0 |
| Respuestas de Preview reutilizadas | 0 |

El transporte usó **un worker Chrome**, CLI nativa autenticada, directorio CLI sin vinculación y watchdog por grupo de procesos. Se mantuvo el origen HTTPS exacto y CSP. La caché de Production está separada por deployment; se comprobaron **122 entradas**, sus bytes, SHA256, `meta.deployment` y origen: **0 entradas inválidas**. No se copiaron respuestas de Preview. La prueba de acceso HTTP está en [access-proof.json](access-proof.json).

Se conservaron SSO y las protecciones. Las acciones comerciales estuvieron bloqueadas; no hubo formularios enviados, reservas, correos, CRM o Resend. Las únicas consultas POST permitidas fueron las lecturas públicas de Google Maps previamente autorizadas. El proceso terminó con **exit 0**, navegador y transporte cerrados; [runner-closed.json](runner-closed.json) registra el cierre.

Informes: [smoke-summary.json](smoke-summary.json), [responsive-qa.json](responsive-qa.json), [target.json](target.json) y [provenance.json](provenance.json). Se incluyen **24 capturas de galería y 20 capturas de mapas** en [screenshots](screenshots/), junto con los scripts ejecutados.

El inventario esperado sigue siendo `f98c6494c31f2174a016d58d7e2e4bd9a512aea1b5448bba4f790c14a06206d0`; el runtime declarado es `c97bfa5aba80329f18e3db8058ec5c3fada80cc4`. La comparación íntegra de 1.660 fuentes, siete lambdas y solicitudes HTTP seguras se documenta en el informe independiente. Este navegador no reconstruyó, promovió, asignó dominios ni modificó configuración.

No se incluyen cachés HTTP, perfiles, `node_modules`, cookies, cabeceras de autenticación ni valores secretos. El manifiesto SHA256 cubre los archivos de esta entrega, excluyendo el propio manifiesto y `SHA256SUMS`.
