# SOLLAHMS — Centro de Orientación publicado y verificado

Objetivo completado el **16/11/2026 a las 12:29:56.873, America/Santiago**. El [Centro de Orientación público](https://sollahms.cl/centro-orientacion.html) ya sirve el candidato certificado. No crear, reconstruir ni promover otro deployment por el solo hecho de retomar este chat.

- Production definitivo: `dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR`, READY, prebuilt.
- [Hostname inmutable protegido](https://project-wrapp-4tb7ztjjc-lsandoval2-8260s-projects.vercel.app/centro-orientacion.html).
- Ambos aliases apuntan a HWs; www conserva 308 hacia `sollahms.cl`.
- Source SHA declarado: `42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9`. Implementación: `e9d7393148bf1e209f6a8e2210ed4c5a973ceb41`. Los commits posteriores sólo documentan el cierre: consultar el HEAD remoto real y conservarlos.
- Rama: `codex/centro-auditoria-integral-20261116`; [PR #30](https://github.com/lasopho/sollahms-web/pull/30) sigue abierto en Draft, sin merge.
- Anterior conservado: `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`. Preview histórica: `dpl_33R4uenGQAt2cSVUGEJC7VsoF9yS`.

Leer `AGENTS.md`, [informe productivo](docs/centro-auditoria-20261116/production-release-20261116/INFORME-PUBLICACION.md), [cierre verificable](docs/centro-auditoria-20261116/production-release-20261116/publication-closure.json) y [prompt completo de continuidad](docs/centro-auditoria-20261116/production-release-20261116/SIGUIENTE-PROMPT.md).

## Integridad y certificados

Inventario publicado SHA256 `ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05`: 1.660 archivos, exactamente tres cambios runtime (HTML/CSS/controlador del Centro), otros 1.657 idénticos a B9HL. Contacto mantiene SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1`. Se conservaron las 131 fichas, recorridos eliminados, siete funciones/57 archivos y configuración v3. No se ejecutaron builders, instalación, generadores ni empaquetadores históricos. Se promovió el mismo Production comprobado antes de asignar dominios.

- Preflight 28/28; integridad del Production aislado 33/33; Chrome aislado 48/48 en cinco anchos.
- Público: 190/190 URL, 218 GET, 204 transacciones TLS verificadas y 28 redirecciones 308. Las 131 fichas idénticas y sin recorridos; Contacto, tres overlays, 21 recursos, 23 destinos/fragmentos y Patio Brasil 410 aprobados.
- Chrome público real: 48/48 en 1440/1024/768/390/320 px, 20 capturas; cero errores inesperados, overflow o recursos fallidos.
- Postpromoción: 36/36; 1.660 rutas/SHA1, siete funciones, ambos aliases, SSO/configuración y un único Production nuevo.
- Cero envíos comerciales, eventos submit de Contacto, POST, leads, correos, reservas o escrituras CRM/Resend. UF del navegador utiliza fixtures 503 explícitas; no se hicieron lookups UF reales en esta fase. No se afirma una nueva cifra UF ni entrega real de proveedores.

No repetir los 53 tests financieros, 80 contrastes de Preview ni matrices certificadas por rutina. Repetir sólo ante cambios, discrepancias o un nuevo artefacto/deployment que lo justifique. Los registros originales de Preview son históricos del commit 42ee1d1; el manifiesto vigente de esta fase está en `production-release-20261116/`.

## Continuidad

La autorización expresa quedó ejecutada completamente; recibos en `authorization.json`, `created.json` y `promotion-confirmed.json` dentro de esa carpeta. No reutilizarla para cambios nuevos o fusiones. El prompt que pedía autorización y el cierre de Preview se conservan en `history/`; no son estado pendiente.

SSO `all_except_custom_domains`, autoasignación false, previews automáticas deshabilitadas y reglas manuales false intactas. No se crearon sharelinks/bypasses ni se cambiaron secretos, integraciones o DNS. El hostname inmutable conserva 302 hacia SSO con TLS válido. Los procesos de QA propios se cerraron.

Trabajar sólo en `/private/tmp/sollahms-centro-audit-20261116` o en un checkout nuevo e independiente si falta; no tocar checkouts ajenos. El output publicado está en `.vercel/centro-production-release-20261116/stage/.vercel/output`. Si falta, recuperar los mismos bytes autenticados de HWs y cotejar el manifiesto completo; no reconstruir desde main histórico ni restaurar paquetes B9HL/ByUhr/9zz que reemplacen el Centro publicado.

Para cualquier trabajo futuro, reconsultar producción real, aliases y HEAD remotos, conciliar cambios posteriores y preservar Centro, Contacto y recorridos eliminados. Sin encargo nuevo, informar el cierre y mantener el sitio intacto. Las reglas de beneficios conservan revisión al 30/11/2026 y suspensión automática posterior; no inferir tasas, valores UF o elegibilidad.
