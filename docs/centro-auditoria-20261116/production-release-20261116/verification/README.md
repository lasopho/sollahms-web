# Preflight, aislamiento y verificación posterior a promoción

Esta fase corresponde a la autorización posterior del propietario para publicar el Centro. Los certificados históricos de Preview permanecen intactos. Las comprobaciones de este directorio son exclusivamente de lectura y no crean ni promueven deployments.

## Preflight

**28/28 controles aprobados**, 16/11/2026 a las 12:24:18 de America/Santiago. [Recibo para el gate](preflight.json), [detalle](preflight-summary.json).

- GitHub confirmó HEAD remoto/local `42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9`, base `dffbd310fe0cb34d952bda493140504ec4e1241c` y PR #30 abierto en Draft sin merge. [Lectura conectada](preflight-github.json).
- Ambos aliases continuaban en `dpl_B9HL4hR66iRc5vwzh3Ykk25vLe9w` y éste era el último Production. www conservaba el 308 a `sollahms.cl`.
- Inventario local de 1.660 archivos, con tamaños/SHA1/SHA256 exactos y pin `ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05`.
- Exactamente tres archivos del Centro cambian frente a B9HL; los otros 1.657 permanecen idénticos. Contacto, config v3, siete funciones/57 archivos y motor financiero permanecen intactos.
- Proyecto, SSO, runtime, integración Git, autoasignación de dominios y reglas de despliegue automático preservados antes y después de la lectura.

## Production aislado

**33/33 controles aprobados**, 16/11/2026 a las 12:26:22 de America/Santiago. [Resultado](isolated-summary.json).

- Único candidato verificado: `dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR`, READY, target `production`, prebuilt, source `42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9`.
- [Hostname privado](https://project-wrapp-4tb7ztjjc-lsandoval2-8260s-projects.vercel.app/). Metadatos y manifiesto corresponden al mismo pin certificado. [Identidad](isolated-deployment.json).
- **1.660/1.660 rutas y SHA1 remotos coinciden**. No se descargaron cuerpos de fuentes. Se contrastaron tamaños explícitos cuando la API los expone; los demás quedan vinculados a las direcciones de contenido SHA1 exactas del manifiesto local SHA256. [Cotejo completo](isolated-source-comparison.json).
- Siete funciones registradas, con sus 57 archivos preservados. [Registro](isolated-functions.json).
- `autoAssignCustomDomains:false`, lista de aliases vacía en metadatos y endpoint específico. [Aislamiento](isolated-aliases.json).
- GET HTTPS anónimo sin credenciales, cookies ni bypass: HTTP 302 hacia `vercel.com`, TLS válido (`sslVerifyResult:0`), sin seguir redirecciones. [SSO](isolated-anonymous-sso.json).
- Ambos dominios seguían en B9HL antes y después; sus timestamps no cambiaron. www 308 intacto. Ajustes del proyecto idénticos a los de Preview. [Aliases finales anteriores a promoción](isolated-aliases-after.json), [ajustes](isolated-project-after.json).

El gate anterior certifica ese ID aislado antes de promoción. Las pruebas reales de navegador y HTTP tienen certificados independientes. No se repitieron matrices históricas ni se consultó nuevamente el proveedor UF.

## Verificación posterior a promoción

**36/36 controles aprobados**, 16/11/2026 a las 12:32:13 de America/Santiago. [Resultado final](postpromotion-summary.json).

- El ID promovido es exactamente el ya certificado `dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR`. Sus metadatos de identidad, source commit, manifiesto, tipo Production, prebuilt, proyecto y propietario coinciden con el aislado; no hubo reconstrucción.
- Los dos dominios productivos apuntan a HWs: `sollahms.cl` con `updatedAt:1794842996857`, www con `updatedAt:1794842996873`. www conserva 308 hacia `sollahms.cl`. [Aliases finales](postpromotion-aliases-after.json).
- **1.660/1.660 rutas y SHA1 remotos exactos**, config v3, siete funciones registradas y 57 archivos preservados. Los tres cambios y 1.657 entradas idénticas conservan el mismo pin candidato. [Inventario](postpromotion-source-comparison.json), [funciones](postpromotion-functions.json).
- Hostname inmutable con SSO 302 y TLS válido; `all_except_custom_domains`, autoasignación false, previews automáticas deshabilitadas e integración/runtime/reglas manuales permanecen iguales. [SSO](postpromotion-anonymous-sso.json), [ajustes finales nativos](postpromotion-project-after.json).
- La API de deployments consultada desde el timestamp de preflight devuelve exactamente **un** Production nuevo, HWs, sin paginación pendiente. [Recibo](postpromotion-new-productions.json).
- PR #30 continúa abierto en Draft, sin merge, con HEAD `42ee1d1` al comprobar esta fase. Los commits documentales posteriores de cierre no cambian el artefacto publicado. [Lectura GitHub](postpromotion-github.json).

Los controles anteriores y posteriores a promoción se conservan separados: B9HL era el baseline observado en preflight y aislamiento; HWs es el publicado observado en esta última fase. Las pruebas públicas HTTP/navegador pertenecen a sus certificados independientes.

`verify.py` sólo utiliza GET y lecturas locales. Cero formularios, POST, leads, correos, reservas, consultas de proveedores, cambios de credenciales o protección, nuevas publicaciones o promociones desde este verificador. Los procesos propios finalizaron. El agente principal ejecutó la publicación autorizada y conserva su recibo específico de promoción; este directorio certifica sus resultados observados.
