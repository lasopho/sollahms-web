# Verificación remota de la Preview privada

Resultado: **26/26 controles aprobados**, completados el 16/11/2026 a las 12:05:09 de America/Santiago. No se repitieron pruebas de navegador. [Resumen ejecutable](verification-summary.json).

- Deployment `dpl_33R4uenGQAt2cSVUGEJC7VsoF9yS`, READY, prebuilt, entorno Preview (`target: null` en la API), source commit `e9d7393148bf1e209f6a8e2210ed4c5a973ceb41`.
- Inventario candidato SHA256 `ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05`: **1.660/1.660 rutas y SHA1 remotos idénticos**. Tres cambios autorizados y 1.657 entradas preservadas contra B9HL. [Comparación completa](source-comparison.json).
- Siete funciones registradas: advisory, booking-availability, booking-create, collaboration, contact, orientation-contact y uf. Sus 57 archivos de fuente conservan el inventario certificado. [Registro](registered-functions.json).
- GET anónimo al hostname privado: HTTP 302 hacia `vercel.com`, TLS válido (`ssl_verify_result: 0`), sin seguir redirecciones y sin cookies, autenticación ni bypass. [Recibo](anonymous-https-sso.json).
- Los dos aliases productivos siguen en B9HL con sus timestamps originales; www mantiene el 308 a `sollahms.cl`. [Antes](production-aliases-before.json) y [después](production-aliases-after.json).
- SSO `all_except_custom_domains`, autoasignación de dominios `false` y previews automáticas deshabilitadas. Proyecto, integración Git, runtime y reglas de despliegue automático permanecen iguales a los certificados de producción; la nueva rama tiene su regla `false`. [Antes](project-before.json) y [después](project-after.json).
- Se ejecutó **un único GET `/api/uf`**, sin query ni valores de simulación: HTTP 200, fecha oficial y de verificación `2026-11-16`, UF utilizable. La respuesta incluye fuente SII. [Recibo público](uf-get.json). No repetir esta consulta por rutina.

El cotejo remoto usa las direcciones de contenido SHA1 devueltas por la API de fuentes de Vercel y los tamaños explícitos cuando existen. Los tamaños no expuestos quedan vinculados al contenido idéntico del inventario local SHA1/SHA256; no se descargaron cuerpos de fuentes. Los archivos públicos servidos y la experiencia de navegador tienen evidencia independiente a cargo del harness de Preview.

`verify-remote.py` contiene únicamente operaciones de lectura. No hubo formularios, POST, leads, correos, reservas, escrituras CRM/Resend, cambios de configuración o credenciales, nuevos deployments, promociones ni bypasses. Todos los procesos propios finalizaron. La única interacción con un proveedor fue la consulta UF pública de la Preview.

Este certificado corresponde a ese ID, commit y manifiesto exactos. Una eventual publicación productiva continúa pendiente de autorización expresa; requiere comprobar de nuevo concurrencia y producción antes de preparar su fase específica.
