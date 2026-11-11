# Atribución mínima first-party — 2026-11-11

Implementación de desarrollo y candidato privado preparados. **No publicado en producción.**

Preview con autenticación de Vercel: https://project-wrapp-kfp307bu9-lsandoval2-8260s-projects.vercel.app/

Despliegue: `dpl_47hdEYK2Gz7Z9qLaE3ahoAwR4yPa`, READY, entorno preview. No se asignaron los dominios corporativos. La consulta sin sesión devuelve 302 hacia Vercel SSO; no se generó un enlace que evite la autenticación.

## Base y alcance

Se leyó [Commercial attribution baseline](../../seo-measurement/runs/2026-11-11-commercial-attribution-baseline/report.html). Producción continúa en `dpl_3LEibLxqAhX4bgak99HKNXNyhXuW`, con `CONTACT_DELIVERY_MODE=resend`. CRM preparado no acredita operación real. Los gaps anteriores de UTM, referencia externa, landing y atribución SEO/IA → lead siguen siendo históricos de producción: este candidato aún no los corrige en el sitio público.

La rama de origen fue `codex/seo-medicion-20261108`, commit `6d8cc937bbf62cd72f6286ed0288df7ce14b86b4`, no `main`. Producción procede de un artefacto congelado con transformaciones, no de un checkout completo. Se reconstruyó el registro anterior de 1.648 archivos con coincidencia exacta del UID `724094619180f7e3afac95bb96f4dffae1e2d495`; se aplicaron las cuatro páginas publicadas, el sitemap vigente y la configuración compilada exacta `04e9bcfbdaedafe692af92f3409844151fd82ab3`. Las cuatro páginas se contrastaron por HTTP y 747 referencias disponibles en el árbol actual coincidieron directamente con los UID del proveedor. Los demás archivos se conservan por la cadena documental y el registro congelado; no se presenta la tabla truncada del proveedor como un inventario íntegro descargado hoy.

El commit base `6b2aabc1e80f09f850850d8458cfe0ab67a2a1a2` alinea los dos fragmentos de `entorno-desarrollo-urbano.html` que ya diferían en Git respecto del sitio publicado y deshabilita el despliegue automático de la nueva rama. Esa alineación **no cambia el SEO ni el texto de producción**. La rama nueva es `codex/attribution-first-party-20261111`; las configuraciones de despliegue automático de main y de la rama de medición se preservan.

El preview identifica el commit local `83cdce6` usado al ensamblarlo. La publicación mediante el conector GitHub usa otra identidad de commit; el ensamblador se actualizó a la referencia base remota y se comprobó que genera **exactamente las mismas 1.661 referencias fuente** que el preview. Las adiciones posteriores son documentación, pruebas y decodificador offline, sin diferencias de runtime.

Evidencia: [base-proof.json](base-proof.json), [production-runtime-hashes.json](production-runtime-hashes.json), [production-output-config.json](production-output-config.json), [package-proof.json](package-proof.json).

## Arquitectura y contrato

Un módulo de captura compartido, un normalizador compartido entre navegador y servidor, y una adaptación pequeña del gestor de operaciones existente. No hay plataforma analítica, base de visitantes, endpoint de eventos ni nuevos proveedores.

```json
{
  "acquisition": {
    "request_id": "UUID v4 de la operación",
    "landing_path": "/guia-hipotecaria.html",
    "submission_path": "/contacto.html",
    "referrer_origin": "https://chatgpt.com",
    "utm_source": "chatgpt",
    "utm_medium": "referral",
    "utm_campaign": null,
    "utm_content": null,
    "utm_term": null,
    "gclid": null,
    "msclkid": null,
    "captured_at": "2026-11-11T19:00:00.000Z"
  }
}
```

Ejemplo ilustrativo, no una observación ni un identificador real. Campos ausentes o inválidos se normalizan a `null`. Campos desconocidos se descartan. La versión 1 está en el envoltorio de sesión y en las etiquetas Resend.

| Campo | Regla |
| --- | --- |
| request_id | UUID v4; nunca correo, RUT ni teléfono. |
| landing_path / submission_path | `/` o página `.html` de slug simple, máximo 180 caracteres; sin query ni fragmento; `/index.html` se normaliza a `/`. |
| referrer_origin | Solo origen HTTP(S), máximo 180 caracteres; se eliminan ruta/query/fragmento; se excluyen origen propio y los dos dominios Sollahms. No hay conversión a «direct». |
| UTM | Cinco nombres autorizados, máximo 96 caracteres por valor, Unicode NFC, letras/números y separadores acotados. Se descartan markup, controles, URLs y patrones obvios de correo/teléfono/RUT. Parámetros duplicados no se aceptan. |
| gclid / msclkid | Opcionales: gclid ASCII acotado a 160; msclkid hexadecimal de 32. No se envían a plataformas publicitarias. |
| captured_at | ISO UTC válido; representa el reloj declarado por el navegador, no una certificación temporal del servidor. |

La normalización reduce datos arbitrarios; no puede demostrar que una etiqueta de campaña nunca contenga información personal ni que el origen declarado sea auténtico. Estos campos no deciden la aceptación comercial ni acreditan SEO/IA → lead causalmente.

## Sesión, landing, referrer y UTM

Se carga `acquisition.mjs` en las 11 entradas corporativas. Guarda el primer contexto en `sessionStorage`, clave `sollahms:acquisition:v1`. Solo guarda pathname normalizado; las UTM permitidas van en campos separados. No se guarda la URL completa, parámetros arbitrarios ni fragmentos. La navegación interna y una segunda campaña en la misma sesión no sobrescriben el primer contexto, incluso si al comienzo no había referencia externa.

Los formularios de fichas incorporan la misma lógica mediante su dependencia compartida `form-operation.mjs`. No se cambió ningún HTML de ficha ni se incorporaron sus resultados al segmento estratégico `corporate-education-v2`.

Si el acceso a almacenamiento falla, se usa memoria en la página y el formulario puede enviarse. En ese caso no se promete conservar landing o reintentos después de recargar/navegar. Un registro de operación ya existente pero corrupto no se sustituye silenciosamente por otra solicitud. Una sesión independiente comienza sin adquisición anterior. Las restauraciones o duplicaciones de pestañas dependen del comportamiento de `sessionStorage` del navegador y pueden conservar su contexto; no existe identificación entre navegadores ni dispositivos.

## Request ID, backend y Resend

El UUID se genera una vez al preparar la operación, reutilizando la identidad criptográfica del token `sollahms-v1-<tiempo>-<uuid>`. Ese UUID se incluye en `acquisition.request_id`. Los reintentos conservan la clave, cuerpo y contexto originales. Completar/descartar permite una nueva operación con otro UUID.

El backend vuelve a normalizar y acotar todos los campos. La identidad de la operación validada prevalece sobre un UUID contradictorio del payload. El recibo técnico de aceptación incluye `X-Sollahms-Request-Id`; el mismo UUID figura en la etiqueta Resend `request_id`. Los guardas actuales de consentimiento, datos comerciales, origen, tiempo, tamaño y preview permanecen. La ausencia o malformación de adquisición dentro de un body admitido no rechaza un contacto válido. Los límites generales del body siguen vigentes, también ante un payload enorme disfrazado de adquisición.

Los clientes legacy de `/api/contact` sin clave reciben un UUID generado en servidor. Si necesitan reintentar la misma operación deben reutilizar `acquisition.request_id`; dos POST sin ninguna identidad no pueden probar que sean una sola solicitud. Ya no se obtiene un identificador de atribución a partir del contenido personal del contacto. Los formularios actuales siempre usan la clave de operación.

Resend recibe `request_id`, `acquisition_version=1` y los demás campos no nulos en `acq_<campo>_<índice>`. Se usa UTF-8/base64url reversible, fragmentado a 240 caracteres, para cumplir los caracteres permitidos y el límite de 256 por etiqueta. El máximo del contrato queda por debajo de las 75 etiquetas por correo. No se añade contexto técnico al asunto ni al cuerpo visible del correo.

La documentación oficial permite etiquetas estructuradas y devuelve `tags` en `GET /emails/:id`. Para recuperar el contexto de una exportación autorizada:

```sh
node scripts/decode-acquisition-tags.mjs < email-resend.json
```

El decodificador es offline y no contacta proveedores. No se añadieron webhooks ni procesos de extracción. Se conserva `providerAccepted=true` / `deliveryConfirmed=false`; aceptación de API no equivale a entrega al buzón. Esta ronda **no envió correos reales ni probó aceptación real de Resend**.

Fuentes consultadas: [etiquetas Resend](https://resend.com/docs/dashboard/emails/tags), [envío](https://resend.com/docs/api-reference/emails/send-email), [recuperación del correo](https://resend.com/docs/api-reference/emails/retrieve-email).

## Compatibilidad CRM

Se revisaron `lib/crm-lead-client.mjs` de esta base y `lib/crm-form-event.mjs` / `docs/crm360/OPERACION_INTEGRACION.md` de `codex/crm360-integracion-2026-11-02`. El evento preparado ya extrae el UUID del mismo token como `requestId`; conserva esa semántica.

`crmAcquisitionContext()` prepara `{requestId: acquisition.request_id, acquisition}` sin cambiar significados ni habilitar un transporte. El antiguo bloque `attribution.page/utmSource` obtenido del Referer HTTP no representa la primera landing: no se reutiliza con ese significado incorrecto. La incorporación del objeto común al evento/outbox y al esquema receptor debe hacerse conjuntamente cuando se active aquella integración. **CRM-ready significa contrato y helper probados, no receptor ya compatible, persistencia real ni CRM activado.** El transporte legacy existente no se migra ni se activa en esta tarea.

## Pruebas y matriz de aceptación

**73 pruebas automatizadas aprobadas; 0 fallos.** Incluyen ausencia de señales, Google/Bing/ChatGPT/Perplexity/Gemini, las cinco UTM, navegación interna, sesión nueva, duplicados, datos maliciosos, fallo de captura/almacenamiento, UUID único y estable, reintentos, validación backend, round-trip de etiquetas y contratos comerciales existentes. Se ejecutó la prueba obligatoria `orientation-20261031.mjs`. Los transportes son sintéticos y están inyectados; ninguna prueba puede enviar correo real. [Resultado](tests.txt) y [validación](validation.json).

| Señal | Browser | Form | Backend | Resend | CRM-ready |
| --- | --- | --- | --- | --- | --- |
| request_id | Implementado; U | U | U | Tags; U | Contrato; U |
| landing_path | Implementado; U | U | U | Tags; U | Contrato; U |
| submission_path | Implementado; U | U | U | Tags; U | Contrato; U |
| referrer_origin | Implementado; U | U | U | Tags; U | Contrato; U |
| utm_source | Implementado; U | U | U | Tags; U | Contrato; U |
| utm_medium | Implementado; U | U | U | Tags; U | Contrato; U |
| utm_campaign | Implementado; U | U | U | Tags; U | Contrato; U |
| utm_content | Implementado; U | U | U | Tags; U | Contrato; U |
| utm_term | Implementado; U | U | U | Tags; U | Contrato; U |

**U:** prueba automatizada aislada de los módulos y contratos. La lógica de navegador se ejecutó con ubicación/referrer/almacenamiento controlados. No representa captura de una visita real ni operación de proveedores externos.

El ensayo automático integral `tests/acquisition-browser.mjs` se preparó sobre el paquete real, pero Chromium local no pudo iniciarse (`process_singleton: socket Operation not permitted`). No se cuenta como aprobado. Como comprobación adicional, Chrome conectado cargó el preview protegido y permitió completar los siete formularios con datos sintéticos: portada, contacto, agenda, centro, comparador y las dos variantes de colaboración. Cinco devolvieron la guarda de preview; centro/comparador devolvieron indisponibilidad de configuración del canal en preview. No se cambió esa configuración para forzar envíos. No se inspeccionó directamente el almacenamiento de adquisición en Chrome. [Captura móvil del candidato](preview-mobile.jpg).

## Archivos y preservación

| Archivos | Cambio |
| --- | --- |
| `assets/js/acquisition-contract.mjs`, `assets/js/acquisition.mjs` | Validación compartida y primera captura de sesión. |
| `assets/js/form-operation.mjs` | UUID compartido, contexto congelado y recuperación de reintentos; fallback en memoria. |
| `lib/acquisition-server.mjs` | Normalización servidor, etiquetas Resend y contrato CRM futuro. |
| `api/advisory.mjs`, `api/collaboration.mjs`, `api/contact.mjs` | Admisión opcional de acquisition, tags y recibo técnico. Orientation reutiliza contact. |
| Las 11 páginas corporativas | Únicamente una carga de módulo en head respecto de la base certificada. |
| `scripts/prepare-attribution-local.py`, `scripts/prepare-attribution-preview.mjs` | Superposición congelada; verificación por hashes; constructor exclusivo de preview. |
| `scripts/decode-acquisition-tags.mjs` | Recuperación offline de las etiquetas estructuradas. |
| `tests/acquisition.test.mjs`, `tests/acquisition-browser.mjs` | Pruebas unitarias/integradas y ensayo de navegador reproducible. |
| `docs/attribution/2026-11-11/` | Contrato, base, pruebas, hashes y límites de verificación. |
| `vercel.json` en commit base | Solo deshabilitar el despliegue automático de esta nueva rama. |

El paquete tiene **16 archivos runtime modificados, 10 añadidos y 1.632 sin cambios**. La diferencia de las 11 páginas es exactamente la etiqueta de carga; títulos, metas, canonical, contenido, formularios y consentimiento son idénticos a producción. Los HTML de las 131 fichas, sitemap, robots, catálogos públicos, reservas, UF, rutas y salvaguardas 410 se preservan. Vercel verificó los 1.658 hashes antes de construir el preview. No se empaquetaron docs, pruebas, sesiones, cookies ni credenciales.

## Privacidad y pendientes antes de publicar

La finalidad implementada se limita a contexto técnico de la solicitud (A). No se implementó analítica opcional de audiencia (B) ni campañas/perfiles publicitarios (C). No hay cookies nuevas, identificador de visitante, fingerprinting, localización precisa, tracker de terceros, GA4, GTM, Web Analytics ni activación de CRM. No se cambiaron la política ni el consentimiento; su único cambio HTML es cargar el módulo común.

Quedan para revisión previa a una eventual publicación:

1. Transparencia y base jurídica del almacenamiento de adquisición, especialmente UTM/identificadores de clic, y retención/acceso de ese contexto en Resend. La ausencia de cookies no resuelve por sí sola todos los requisitos de tecnologías de almacenamiento. No se improvisó texto legal ni se considera esta clasificación técnica un dictamen jurídico.
2. Completar el ensayo automático integral de navegador en un entorno que permita Chromium y verificar recuperación real de etiquetas con un ensayo autorizado del proveedor. Las pruebas actuales no certifican entrega de correo.
3. Aceptar la pérdida de contexto al navegar si el almacenamiento está bloqueado y la dependencia del navegador en restauraciones de sesión. No se añade persistencia permanente para resolverla.
4. Migrar de forma conjunta el receptor/evento CRM cuando corresponda; hoy está preparado el contrato, no la operación.

Producción intacta en ambos dominios. SEO editorial intacto respecto del artefacto certificado. Fichas sin cambios editoriales. Sin tracking de terceros añadido. Sin cookies de marketing añadidas. **Detenido antes de publicar; este preview no autoriza promoción.**
