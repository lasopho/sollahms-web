# SOLLAHMS — Centro de Orientación publicado y verificado

La autorización expresa del propietario ya se ejecutó por completo el **16/11/2026**. La publicación terminó a las **12:29:56.873, America/Santiago**, con QA público aprobado. Al retomar, confirma este cierre y conserva el estado; no hay otra publicación pendiente ni permiso residual para nuevos deployments, promociones o fusiones.

## Estado vigente al cierre

- Repositorio: `https://github.com/lasopho/sollahms-web`.
- Checkout: `/private/tmp/sollahms-centro-audit-20261116`.
- Rama: `codex/centro-auditoria-integral-20261116`.
- [PR #30](https://github.com/lasopho/sollahms-web/pull/30): abierto, Draft, sin merge. Base `codex/contacto-baseline-productivo-20261116` (`dffbd310` al publicar).
- Production definitivo: `dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR`, READY, prebuilt, entorno Production.
- [Centro público](https://sollahms.cl/centro-orientacion.html). www conserva 308 hacia `sollahms.cl`; ambos aliases están en HWs.
- [Hostname inmutable con SSO](https://project-wrapp-4tb7ztjjc-lsandoval2-8260s-projects.vercel.app/centro-orientacion.html).
- Source SHA declarado: `42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9`. Implementación: `e9d7393148bf1e209f6a8e2210ed4c5a973ceb41`. Los commits posteriores sólo documentan el cierre: consultar el HEAD remoto real y conservarlos.
- Baseline anterior conservado: `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`.
- Preview histórica conservada: `dpl_33R4uenGQAt2cSVUGEJC7VsoF9yS`.
- Vercel proyecto `prj_URomRRU0MAy4etGKP5gWv3Qv4DGH`, equipo `team_A9VNIW2f2K1IJpd2pGdvDmEN`, scope `lsandoval2-8260s-projects`.

Lee `AGENTS.md`, `NEXT-PROMPT.md` y estos archivos bajo `docs/centro-auditoria-20261116/production-release-20261116/`: `INFORME-PUBLICACION.md`, `publication-closure.json`, `authorization.json`, `created.json`, `promotion-confirmed.json`, `verification/postpromotion-summary.json`, `browser/public/results.json` y `public-http/summary.json`.

## Artefacto publicado y preservación

Inventario SHA256 **`ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05`**: 1.660 archivos, exactamente tres cambios runtime contra B9HL y 1.657 idénticos. Los tres son HTML, CSS y controlador aislados del Centro; no existen cambios nuevos de runtime durante esta fase de publicación.

El manifiesto completo está en `docs/centro-auditoria-20261116/candidate-manifest.json`; la comparación remota posterior, en `verification/postpromotion-source-comparison.json`. Contacto conserva SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1`. Se mantienen las 131 fichas, recorridos eliminados, 147 HTML salvo el Centro, siete funciones/57 archivos, config v3, CRM 360, Resend, fórmulas, tasas, fuentes y protecciones.

Stage publicado: `.vercel/centro-production-release-20261116/stage/.vercel/output`. No se ejecutaron builders, instalación, generadores ni empaquetadores históricos. Se copió/verificó el artefacto certificado, se creó un único Production aislado y se promovió exactamente ese ID después de aprobar todos los gates.

## Certificados que no deben repetirse por rutina

- Preflight: **28/28**; Production aislado remoto: **33/33**; navegador aislado: **48/48**, cinco anchos.
- Público: **190/190 URL**, 218 GET, 204 transacciones TLS verificadas y 28 redirects 308. 131 fichas idénticas/sin recorridos, Contacto exacto, 23 destinos/fragmentos, 21 recursos, tres overlays exactos y Patio Brasil 410.
- Chrome público real: **48/48**, anchos 1440/1024/768/390/320; 20 capturas. Resultados, seis etapas adelante/atrás, valores conservados, reinicios, cotizaciones, checklist, menú, foco y consola aprobados. Cero overflow o recursos propios fallidos.
- Postpromoción: **36/36**, mismo deployment/source/pin, 1.660/1.660 rutas/SHA1, siete funciones/configuración, aliases, protección y un único Production nuevo.
- La etapa Preview ya certificó 78 casos, 53 pruebas financieras/UF y 80 contrastes. Esos certificados no se repitieron innecesariamente.
- Cero formularios comerciales enviados, eventos de envío de Contacto, POST, leads, correos, reservas o escrituras CRM/Resend. UF del navegador se interceptó con fixtures 503 explícitas; la publicación no consultó el proveedor ni certifica una nueva cifra UF real.

Las capturas aisladas/públicas están en `browser/isolated/` y `browser/public/`. Cada certificado corresponde a su deployment y fecha. Repite sólo controles afectados por un encargo nuevo, discrepancia o nuevo artefacto/deployment. No presentar fixtures como respuestas reales ni como fallos del endpoint.

## Protección y límites de continuidad

SSO `all_except_custom_domains`, autoasignación false, previews automáticas deshabilitadas y reglas de ramas manuales permanecen intactas. No se crearon sharelinks/bypasses ni se cambiaron secretos, DNS o integraciones. PR #30 sigue Draft y no debe fusionarse automáticamente.

La instrucción previa que pedía autorización y los informes de Preview se conservan en `history/`. Son antecedentes, no trabajo pendiente. Los recibos de autorización/creación/promoción y la confirmación de aliases acreditan que el permiso se consumió completamente. No ejecutar otra vez `create-preview.py`, `create-isolated-production.py`, `check-promotion-gate.py` ni el helper histórico de finalización de Preview al reanudar: ya existe el resultado certificado.

No tocar los checkouts ajenos `/Users/luissandoval/Documents/sollahms-web`, `/Users/luissandoval/Projects/sollahms-publicacion` ni el checkout certificado de Contacto. No modificar fichas ni Contacto para resolver cambios del Centro.

Si se pierde el temporal, clonar la rama remota vigente y recuperar los mismos bytes autenticados de HWs comprobando las 1.660 rutas/hashes del manifiesto. No reconstruir desde main histórico, ni usar paquetes B9HL/ByUhr/9zz que sustituyan este Centro ya publicado.

Para cualquier intervención nueva, reconsultar producción real, aliases, PR y HEAD remotos antes de actuar; conciliar cambios posteriores y preservar Centro, Contacto y recorridos eliminados. No reutilizar esta autorización para publicar cambios nuevos. Sin un nuevo encargo, informar el cierre y dejar el sitio intacto.

Las reglas de beneficios conservan revisión al 30/11/2026 y su suspensión automática posterior. No inventar tasas, valores UF, beneficios o elegibilidad; no ampliar el alcance SEO/GEO ni programar trabajo futuro sin solicitud.
