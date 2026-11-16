# SOLLAHMS — Contacto publicado y verificado

Objetivo completado el **16/11/2026 a las 10:54:49.885, America/Santiago**. [Contacto público](https://sollahms.cl/contacto.html) ya incorpora el pie corporativo y el selector responsive aprobados. No quedan etapas de publicación pendientes. No crear, reconstruir ni promover otro deployment por el solo hecho de retomar esta conversación.

- Production vigente: `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`.
- [Hostname inmutable protegido](https://project-wrapp-4l11wr2s0-lsandoval2-8260s-projects.vercel.app/).
- Ambos aliases apuntan a B9HL; www conserva 308 hacia `sollahms.cl`. Confirmación API a las 10:55:29 Santiago.
- Source SHA declarado por Production: `534bf362b8960e275f5b8b42b5c786027906a4cb`.
- Checkpoint QA anterior a promoción: `41577c1fae2f8c10e577a8af5c68d277c515f6bc`.
- Rama: `codex/contacto-baseline-productivo-20261116`; [PR #29](https://github.com/lasopho/sollahms-web/pull/29) abierto en Draft, sin merge. El HEAD documental final se consulta en GitHub y con `git log -1 --format=%H -- NEXT-PROMPT.md`; conservar cualquier commit posterior.
- Anterior conservado para recuperación: `dpl_ByUhr1dgqeJhw9Yj1zY4WbBFRcY5`.

Leer `AGENTS.md`, [informe final](docs/contacto-baseline-20261116/INFORME-CIERRE.md), [cierre verificable](docs/contacto-baseline-20261116/production-release-20261116/publication-closure.json) y [prompt completo de continuidad](docs/contacto-baseline-20261116/SIGUIENTE-PROMPT-PUBLICACION.md).

## Integridad y resultados

Inventario publicado: `de0b2ba4cb81678a710605f829c0ba8fe0470a81c28959099dc0605e8a3c6fb0`. Contiene 1.660 archivos, un único cambio en `static/contacto.html` y 1.659 idénticos al baseline ByUhr/f98. Permanecen 147 HTML, 131 fichas, 66 cambios de eliminación de recorridos, siete bundles con 57 archivos y config v3. No hubo builders, generadores ni reconstrucción al promover.

Contacto conserva 18.655 bytes y SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1`. El HTML aprobado es `967d556` de #26/#28, integrado en `e95357f`; `a1f2930` añadió el control manual de esta rama. Encabezado, cuerpo, cuatro campos, RUT, consentimiento, scripts, CRM/Resend, antiabuso, idempotencia, metadatos, WhatsApp y legales están preservados. No se integró cobertura territorial del PR #25.

- Production aislado: 1.660 rutas/SHA1, siete lambdas, 32/32 HTTP y cinco anchos aprobados antes de asignar dominios.
- Público: **648/648 HTTP PASS**, 1.246 transacciones, 972 TLS válidos, 598 redirects 308, 131 fichas sin recorridos y Patio Brasil 410.
- Navegador público: **5/5 PASS** en 1440/1024/768/390/320 px, 15 capturas nuevas, teclado por letra/Tab, RUT inválido/válido y consentimiento.
- Cero formularios enviados, eventos submit, leads, correos, reservas, escrituras CRM/Resend o lookup UF en las fases productivas. No se afirma entrega real de proveedores.
- Procesos y perfiles propios cerrados; manifiestos verificados. El intento DNS del sandbox no obtuvo ninguna respuesta HTTP y está archivado como problema del harness; la única pasada pública efectiva aprobó todos los casos.

Las 524 comprobaciones públicas de fichas son 131 × cuatro orígenes HTTP/HTTPS, no una nueva matriz responsive. No repetir los 524 controles responsive históricos, las 1.485 rutas o las 202 pruebas funcionales por rutina. Los certificados originales de Preview y sus diagnósticos quedan intactos; un evento DOM vacío de aquella fase histórica no se presenta como un envío productivo.

## Límites y reanudación

La autorización expresa de Contacto quedó ejecutada completamente. Sus recibos están en `production-release-20261116/authorization.json` y `promotion-confirmed.json`; no reutilizar esta autorización para cambios nuevos o trabajos ajenos. La continuidad anterior y el prompt que pedía autorización están preservados bajo `production-release-20261116/history/` como antecedentes, no como estado vigente.

SSO continúa `all_except_custom_domains`. El hostname privado fue comprobado con 302 hacia SSO y TLS válido antes de promover; los ajustes se confirmaron iguales después. Autoasignación automática false, previews automáticas deshabilitadas y reglas de main/nuestra rama/Recorridos false. No se cambiaron secretos, variables, proveedores, protecciones o configuración de otras ramas; no se crearon bypasses ni sharelinks.

CLI de publicación: Node 24.22.3 y Vercel 65.16.0. El harness aislado registró Node 24.22.1 y el público Node 24.22.3; las versiones reales se conservaron en sus resúmenes. El runtime de funciones permanece nodejs24.x.

Trabajar solo en `/private/tmp/sollahms-contacto-baseline-20261116` o en otro checkout nuevo e independiente si desaparece. No tocar ni cambiar de rama `/Users/luissandoval/Documents/sollahms-web` o `/Users/luissandoval/Projects/sollahms-publicacion`. Mantener PR #29/#26/#28/#27 en Draft y #25 intacto, sin fusiones por iniciativa propia.

El output publicado está en `.vercel/contacto-production-release-20261116/stage/.vercel/output`; la Preview y el baseline previo siguen bajo `.vercel/contacto-baseline-20261116/`. Si faltan los temporales, clonar la rama remota real y recuperar los mismos bytes mediante API autenticada de fuentes de B9HL, comprobando `candidate-manifest.json` completo. No reconstruir desde main ni publicar paquetes antiguos de 9zz, 6bc o ByUhr que reemplacen el nuevo Contacto.

Cualquier futura intervención debe conciliarse con la producción real del momento y conservar tanto Recorridos como Contacto. Sin un encargo nuevo, informar el cierre y preservar este estado; no hay una publicación adicional que ejecutar.
