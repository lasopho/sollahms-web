# Eliminación global de frase corporativa — lista para revisión

Cierre del **16/11/2026**, America/Santiago. Se eliminó el eslogan y su bloque visual exclusivo en las dos únicas páginas activas que lo contenían: portada y Asset Portafolio. Se revisaron 147 HTML y las fuentes; no se modificó ninguna ficha de proyecto.

- [Preview privada SSO](https://project-wrapp-b4lw8u26z-lsandoval2-8260s-projects.vercel.app/): `dpl_8Jtg46E1zuPUUd1fhEdcKTu6GUAF`, READY, prebuilt, entorno Preview.
- [Asset Portafolio en Preview](https://project-wrapp-b4lw8u26z-lsandoval2-8260s-projects.vercel.app/proyectos.html).
- [PR #31 en Draft](https://github.com/lasopho/sollahms-web/pull/31), abierto y sin merge; base `codex/centro-auditoria-integral-20261116`.
- Rama `codex/footer-sin-frase-20261116`; implementación `d4d67bc298bbb8e78e7ba91867b49c1e4fd09772`. Los commits posteriores solo cierran documentación/evidencias.
- Producción intacta: `dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR`. `sollahms.cl`, `www.sollahms.cl` y `sollhams.cl` siguen en ese deployment; los dos últimos conservan 308 al dominio canónico.

## Resultado y preservación

Dos apariciones eliminadas, cero residuales en contenido publicado o fuentes runtime. No hay componente compartido ni generador que recree la frase. Se retiraron seis líneas de HTML, incluidos los dos contenedores con su margen, padding y divisor exclusivos. La altura de ambos pies disminuye exactamente 112 px en todos los anchos; no quedan contenedores vacíos ni separadores del eslogan.

Artefacto de 1.660 archivos: dos HTML modificados y otros 1.658 idénticos a producción. Permanecen exactos Contacto, Centro de Orientación, 131 fichas, siete funciones/57 archivos, configuración v3, scripts de desvanecimiento, recursos, formularios e información comercial. Logo, texto restante y los 11 enlaces de portada y 9 de Asset Portafolio se comparan exactamente con el DOM anterior. No se modifica CRM 360 ni Sollahms AI Lab.

SHA256 del inventario candidato: `aabc92d6a5c7c8d345d9a3cc7dd4f45a7fd11c8385c752ddf45e5a2d0f649549`.

Los hashes anteriores/posteriores, rutas y archivos idénticos están en [candidate-manifest.json](candidate-manifest.json) y [source-preservation.json](source-preservation.json). La única modificación de configuración fuente añade `false` para la nueva rama; no cambia la configuración runtime ni otras reglas.

## Pruebas finales

| Comprobación | Resultado |
|---|---|
| Inventario global | 147 HTML; 2 páginas afectadas; 131 fichas intactas; cero frase activa |
| Chrome local | 20/20 casos, antes/después, ambas páginas en 1440/1024/768/390/320 |
| Chrome Preview autenticada | 20/20 casos; 10 candidatos remotos y 10 controles anteriores locales |
| Integridad producción previa | 9/9 comprobaciones; 1.660 rutas/SHA1 coincidentes |
| Integridad Preview | 11/11 comprobaciones; 1.660 rutas/SHA1 coincidentes; siete funciones |
| Acceso privado | HTTPS/TLS válido; anónimo 302 a Vercel SSO |
| Diseño y enlaces | Sin overflow, vacíos nuevos o recursos fallidos; DOM/logo/enlaces/estilos conservados |
| Motion | Lectura opaca, borde atenuado, movimiento reducido respetado; pies estáticos |
| JavaScript | Cero errores inesperados; fixtures UF 503 documentadas |
| WhatsApp | Deep link y activación por clic correctos; navegación externa interceptada |
| Envíos o escrituras | Cero formularios, mensajes, reservas, correos, POST o escrituras CRM |

[QA local](local/results.json) · [QA remota](remote/results.json) · [Integridad remota](verification/preview-summary.json) · [Inventario](inventario.json) · [Capturas finales](remote/after/).

Se revisaron visualmente las capturas de ambos pies en los cinco anchos. Las diferencias de contenido que ya existían entre los pies se conservan. La prueba de WhatsApp comprueba enlace y clic, sin enviar un mensaje ni probar entrega del proveedor. Las APIs financieras usan una fixture 503 explícita; no se realiza una nueva auditoría financiera ni una consulta UF real. Las fuentes externas declaradas por el catálogo se cargan mediante GET de Google Fonts. La barra administrativa inyectada por Vercel se excluye del navegador de QA mediante una respuesta 204 al único script de feedback; no se cambia ninguna configuración o recurso del sitio. Los datos publicados no cambian.

Los diagnósticos iniciales de medición del fade y exclusión de la barra administrativa se conservan en `attempts/`; no representan fallos del sitio. La matriz final usa un nodo estable y geometría verificada, y comprueba motion antes/después. Los certificados finales son los JSON de `local/`, `remote/` y `verification/`.

## Continuidad

No se creó ni promovió Production, no se asignaron dominios y no se fusionó ningún PR. La publicación sigue pendiente de autorización expresa posterior. Se conserva SSO `all_except_custom_domains`, autoasignación desactivada y previews automáticas desactivadas. La Preview se verificó con autenticación existente; no se crearon sharelinks ni se cambiaron protecciones o secretos.

Output verificado: `/private/tmp/sollahms-footer-review-20261116/.vercel/footer-sin-frase-20261116/stage/.vercel/output`. No reconstruir desde main histórico ni ejecutar generadores generales. Si falta el output, recuperar los mismos bytes autenticados de la Preview y cotejar el manifiesto completo. El [siguiente prompt completo](SIGUIENTE-PROMPT.md) permite continuar cuando el propietario decida autorizar la publicación.
