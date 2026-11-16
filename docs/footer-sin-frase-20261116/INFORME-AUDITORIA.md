# Eliminación de frase corporativa — auditoría del 16/11/2026

## Base y alcance

Producción consultada antes de intervenir: `dpl_HWsHLascmRPtGsgJZ8BbGZ5fX4VR`, proyecto `project-wrapp`, equipo `lsandoval2-8260s-projects`. Source declarado `42ee1d1b9b4794af5be1a3b81be5efe8cfd3dcb9`; HEAD remoto de continuidad `67a57b142dd2170c678e75c4c425aabd16579339`. Se leyeron `AGENTS.md` y `NEXT-PROMPT.md`. El estado remoto de `main` es histórico respecto del sitio publicado y no se usa para reconstruirlo.

Checkout independiente `/private/tmp/sollahms-footer-review-20261116`, rama `codex/footer-sin-frase-20261116`. No se modifica el checkout original con trabajo pendiente. La base del PR es `codex/centro-auditoria-integral-20261116`; se conservan sus commits de cierre y todos los PR abiertos. Véanse [preflight](preflight.json), [ramas remotas](remote-branches.tsv) y [verificación completa del artefacto productivo](verification/production-summary.json).

Los aliases `sollahms.cl`, `www.sollahms.cl` y `sollhams.cl` apuntan a HWs; www y el dominio alternativo redirigen 308 a `sollahms.cl`. SSO `all_except_custom_domains`, autoasignación desactivada y previews automáticas desactivadas se preservan. Se añade exclusivamente la regla `false` de la nueva rama en `vercel.json`; no cambia el artefacto de rutas publicado.

## Inventario y origen

Se revisan 147 HTML activos y las fuentes runtime, generadores, componentes, fragmentos, plantillas, CSS y JS. La búsqueda normaliza entidades HTML, escapes Unicode, mayúsculas, separadores y espacios. [Inventario reproducible](inventario.json).

| Página | Apariciones | Origen | Implementación |
|---|---:|---|---|
| `/index.html` y alias `/` | 1 | HTML de portada | Bloque independiente al final del footer |
| `/proyectos.html` | 1 | HTML de Asset Portafolio | Bloque independiente al final del footer |

No hay componente compartido que origine la frase, ni generador o fuente que la vuelva a introducir. Los generadores existentes modifican otras secciones o toman pies sin la frase. Ninguna de las 131 fichas contiene el eslogan; todas permanecen intactas. Las demás apariciones en `docs/` son historial, snapshots y evidencia: no forman parte del contenido publicado y se conservan.

## Intervención exacta y preservación

Se eliminan únicamente tres líneas por página: el párrafo del eslogan y el contenedor que solo lo alojaba. Ese contenedor aportaba margen superior, padding y un divisor; se elimina completo para que no queden restos. No se usa CSS para ocultarlo ni se introduce otro eslogan.

Logotipo, descripción, copyright, correo, teléfono, WhatsApp, navegación, legales, redes, colores, tipografía y motion conservan exactamente sus bytes originales. El artefacto candidato deriva de una copia verificada del output productivo congelado: 1.660 archivos, solo dos cambios y otros 1.658 idénticos. Permanecen idénticos las 131 fichas, Contacto, Centro de Orientación, los siete bundles de funciones/57 archivos, la configuración v3, scripts de formularios y desvanecimiento. No se ejecutan builders ni generadores generales, ni se toca CRM 360 o Sollahms AI Lab.

Manifiesto base SHA256: `ad66cd90d194f7990f48405283b6282704cb959ae677cbf166c04bd135b82a05`.

Manifiesto candidato SHA256: `aabc92d6a5c7c8d345d9a3cc7dd4f45a7fd11c8385c752ddf45e5a2d0f649549`.

El [manifiesto completo](candidate-manifest.json) contiene rutas, tamaños, SHA1 y SHA256 anteriores y posteriores, las dos apariciones eliminadas y los archivos idénticos. La [preservación de fuentes](source-preservation.json) certifica también el checkout contra el HEAD base.

## Validación y entrega

La matriz de navegador cubre ambas páginas en 1440, 1024, 768, 390 y 320 px, con evidencia antes/después. Comprueba ausencia de frase, contenedor y divisor, enlaces y logotipo conservados, destino WhatsApp, alineación, overflow, recursos, consola y motion normal/reducido. La Preview se verifica con lecturas autenticadas reales y cotejo completo de sus 1.660 rutas/SHA1. El acceso anónimo debe redirigir a SSO con TLS válido.

Los resultados definitivos y límites de QA constan en el [informe de cierre](INFORME-CIERRE.md), junto con los informes JSON y las capturas. No se envían formularios o mensajes durante las pruebas. La producción requiere autorización expresa posterior; esta intervención termina en Preview privada y PR Draft.

## Certificación final

Preview `dpl_8Jtg46E1zuPUUd1fhEdcKTu6GUAF` READY y SSO, artefacto remoto 1.660/1.660 exacto, matriz local 20/20 y comparación remota 20/20 aprobadas. No se modificó producción ni se fusionó ningún PR. [Cierre verificable](completion.json) y [siguiente prompt](SIGUIENTE-PROMPT.md).
