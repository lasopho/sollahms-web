# Centro de Orientación — publicación productiva completada

El Centro de Orientación quedó publicado el **16 de noviembre de 2026 a las 12:29:56.873, America/Santiago**. Se promovió exactamente el Production aislado verificado, sin reconstrucción ni generadores. El QA público y la verificación posterior aprobaron todos sus controles.

- Deployment definitivo: `dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR`, READY, Production.
- [Centro de Orientación público](https://sollahms.cl/centro-orientacion.html).
- [Dominio www comprobado](https://www.sollahms.cl/centro-orientacion.html), redirección 308 al dominio canónico.
- [Hostname inmutable protegido por SSO](https://project-wrapp-4tb7ztjjc-lsandoval2-8260s-projects.vercel.app/centro-orientacion.html).
- Source SHA: `42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9`; implementación `e9d7393148bf1e209f6a8e2210ed4c5a973ceb41`.
- [PR #30](https://github.com/lasopho/sollahms-web/pull/30) permanece en Draft, abierto y sin merge.
- Rama: `codex/centro-auditoria-integral-20261116`. Los commits posteriores al source sólo documentan esta publicación.

## Autorización y conciliación

Se ejecutó la autorización expresa del propietario recibida después de la entrega de Preview. El permiso incluye Production aislado con Build Output API, verificación antes de dominios, promoción del mismo ID, QA público y documentación. [Recibo de autorización](authorization.json).

Antes de modificar los aliases se volvió a consultar producción: ambos dominios seguían en `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w`; www conservaba 308. Los HEAD remotos permanecían en `42ee1d1` para nuestra rama y `dffbd310` para la base publicada de Contacto. PR #30 estaba en Draft, sin merge. El preflight aprobó **28/28** controles.

Se verificó y copió el artefacto certificado a `.vercel/centro-production-release-20261116/stage/.vercel/output`. La copia preservó exactamente las 1.660 rutas, tamaños, SHA1 y SHA256. No se ejecutaron builders, instalación, empaquetador histórico ni generadores. [Verificación de la copia](local-artifact-verification.json).

## Integridad del artefacto

SHA256 del inventario publicado: `ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05`.

Contra el Production B9HL, el candidato contiene **exactamente tres archivos runtime modificados y 1.657 idénticos**:

| Archivo público | SHA256 publicado |
|---|---|
| `centro-orientacion.html` | `d9dff77fbbbb166abc11d0fd6b8ab13a2cb24ea7d10896259b799f6a7e64f585` |
| `assets/css/orientacion.css` | `39140c19c998dc9244c898ededfcf19364f71e4102357db5470943d6e7906ce0` |
| `assets/js/orientacion.mjs` | `2ea9526c043d044d3af8d9a4ebcde4d3809561b591e3a50cae891c9718eb6fee` |

Se conservaron Contacto, las 131 fichas, la eliminación de recorridos virtuales, los 147 HTML salvo el Centro, las siete funciones/57 archivos y la configuración v3. Contacto mantiene SHA256 `02036adfd6b1cc9a8093e8e94b9e19abf4f7e882d3fe4d5214a661f4829705e1`. Motores financieros, tasas, fuentes, vigencias y protecciones permanecen intactos.

Las funciones registradas son advisory, booking-availability, booking-create, collaboration, contact, orientation-contact y uf. No se probaron mediante envíos comerciales ni se modificaron sus bytes o configuración.

## Production aislado y promoción

Se creó **un único Production nuevo**, con `--prebuilt --environment=production --skip-domain`, a partir de esos bytes. Quedó READY a las 12:25:37 de Santiago. Los dominios aún servían B9HL durante su verificación.

- **33/33 controles remotos previos**: ID, entorno, prebuilt, source, pin, 1.660/1.660 rutas/SHA1, siete funciones, configuración, SSO/TLS y aliases sin mover. [Certificado](verification/isolated-summary.json).
- **48/48 controles Chrome previos**, cinco anchos: 1440/1024/768/390/320 px, resultados, seis etapas adelante/atrás con conservación de valores, reinicios, cotizaciones, checklist, menú, foco y recursos. Cero errores inesperados ni envíos comerciales. [Certificado](browser/isolated/results.json).
- La consulta final de configuración usó la API nativa porque el conector resumido omite los campos de despliegue automático. El gate se detuvo antes de llamar a promoción al detectar esos campos ausentes; la API nativa confirmó el estado intacto. No fue un fallo de hash, ruta, función o control. [Gate final](promotion-preflight-connected.json).

Tras aprobar todo, se solicitó la promoción de **ese mismo ID HWs**, sin crear otro deployment ni promover/reconstruir la Preview. [Solicitud](promotion-request.json), [respuesta](promotion-response.json) y [confirmación](promotion-confirmed.json).

Vercel registró la asignación canónica a las **12:29:56.857** y la de www a las **12:29:56.873** de Santiago (15:29:56.873 UTC para la finalización conjunta). Ambos aliases apuntan a HWs; www mantiene 308 hacia `sollahms.cl`. El deployment previo B9HL queda conservado.

## QA público

Se comprobó el nuevo sitio público con tráfico real de lectura y TLS validado:

- **190/190 URL aprobadas**, 218 transacciones GET, 204 transacciones HTTPS con TLS verificado y 28 redirecciones 308. Cero bloqueos o casos omitidos. [Resumen HTTP](public-http/summary.json), [detalle](public-http/results.json).
- Las **131 fichas** respondieron con bytes idénticos al artefacto y sin interfaz de recorridos virtuales. Contacto y los tres archivos modificados coincidieron con sus hashes; 21 recursos propios y 23 destinos/fragmentos aprobaron. Patio Brasil conserva 410 y noindex en sus variantes/orígenes.
- **48/48 controles en Chrome público**, cinco anchos y 20 capturas. Las respuestas públicas se cargaron por red real; no se sustituyeron los archivos por bytes locales. Cero overflow, errores JavaScript, recursos fallidos o consola inesperada. [Certificado](browser/public/results.json).
- La revisión visual de capturas públicas de escritorio y móvil aprobó panel, resultado calculado y estado terminal de navegación. [Revisión](browser/visual-review.json).

Las simulaciones usaron valores sintéticos exclusivamente en memoria del navegador. No hubo formularios comerciales enviados, eventos de envío de Contacto, POST, leads, correos, reservas ni escrituras CRM/Resend. El harness del navegador interceptó únicamente `/api/uf` con cinco fixtures 503 explícitas en cada fase, para probar orientación manual sin consultar proveedores. Estas fixtures no son fallos del endpoint real. La fase productiva no realizó lookups UF ni afirma una nueva cifra oficial; el servicio queda preservado por hashes/configuración. Los 53 tests financieros/UF y 80 contrastes de Preview siguen certificados y no se repitieron.

## Protección y verificación final

La verificación posterior aprobó **36/36** controles: mismo ID/source/pin antes y después, las 1.660 rutas remotas exactas, siete funciones, ambos aliases, www 308 y un único Production nuevo desde el preflight. [Certificado posterior](verification/postpromotion-summary.json).

SSO permanece `all_except_custom_domains`; el hostname inmutable responde 302 hacia Vercel con TLS válido. `autoAssignCustomDomains:false`, `previewDeploymentsDisabled:true` y las reglas manuales de main, Contacto, Recorridos y nuestra rama permanecen intactas. No se cambiaron secretos, integraciones, DNS, redirecciones, protecciones, sharelinks ni bypasses. Los cambios de aliases corresponden exclusivamente a la promoción autorizada.

La autorización quedó ejecutada completamente. No existen fallos funcionales o visuales bloqueantes, etapas de publicación pendientes ni procesos de QA propios abiertos. PR #30 continúa Draft y sin merge.

## Evidencias y continuidad

[Cierre verificable](publication-closure.json) · [Manifiesto de entrega](modified-files.json) · [Hashes](SHA256SUMS) · [Siguiente prompt completo](SIGUIENTE-PROMPT.md).

La documentación anterior de Preview se conserva en `history/` y en el commit `42ee1d1`. Sus manifiestos describen aquella entrega; el manifiesto de esta carpeta corresponde al estado publicado. No ejecutar los helpers de creación/promoción otra vez al reanudar.
