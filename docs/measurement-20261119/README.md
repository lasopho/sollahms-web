# Medición opcional de Sollahms — candidato sin publicar

Estado del 19/11/2026, America/Santiago: las cuentas de Google Analytics y Microsoft Clarity están creadas y sus ajustes remotos están verificados. El candidato del sitio sigue en revisión y **no está publicado**. La creación de cuentas no acredita instalación, visitas recibidas ni resultados comerciales.

Se conserva [STRATEGY-v3](../seo-measurement/STRATEGY-v3.md), el estudio del [25/10](../home-seo-20261025/research-and-decisions.md), su ampliación del [29/10](../seo-corporate-20261029/README.md) y la lista positiva de doce páginas corporativas. La [comparación semanal](../seo-measurement/runs/2026-11-19-weekly-comparison/report.md) distingue Google, Bing/Microsoft y ChatGPT Search. GA4 y Clarity añaden observación del uso consentido dentro del sitio; no acreditan indexación, posiciones, citas ni ventas.

El [informe privado guardado en OpenSEO](https://app.openseo.so/p/64b885cc-5756-4b4e-8e38-22007051cf16/reports/59099ba6-7381-4b11-a53e-45eac7c605fa) presenta la comparación y el orden de trabajo. No se habilitó un enlace público de ese informe.

## Candidato corregido y comprobado

El ensayo inicial del SDK real detectó un `page_view` automático adicional y URL/referrer completos (`dl`/`dr`) antes del evento limitado, aunque el flujo mostraba Enhanced Measurement global OFF. Se corrigió aplicando los parámetros globales de privacidad antes de inicializar el SDK y se añadió Secure a las cookies GA. La [prueba del artefacto definitivo con SDK reales en caché](sdk-correction-receipt.json) pasó en contextos limpios y con URL/referrer sintéticos: exactamente un page_view, direcciones saneadas, ningún marcador personal/financiero observado y cookies GA host-only, Secure, Lax y 60 días. Clarity aplicó consentimiento separado y máscara raíz; sus cargas gzip observadas no contenían los marcadores sintéticos. **Cero beacons y contactos enviados**: todos los collect se interceptaron localmente.

La configuración del panel y las pruebas con mocks no sustituyen el ensayo del SDK real. La prueba finita no demuestra anonimización absoluta, recepción real o comportamiento de una versión futura. Los detectores globales seguían ON en el SDK cacheado; no se observaron envíos automáticos adicionales en la muestra con Enhanced Measurement del flujo OFF y no se presenta esa observación como desactivación de sus flags. Las cookies de Clarity conservan valores del proveedor: `_clck` aproximadamente un año y `_clsk` un día, SameSite Lax y sin Secure en esa versión; no se les atribuye el plazo de 60 días de GA.

La revisión de etiqueta encontró seis detectores automáticos y detección automática de datos propios activados en el contenedor asociado, además de cookies predeterminadas de 24 meses renovables. Se guardó un [borrador GTM de tres ajustes](gtm-privacy-draft-receipt.json): detectores OFF, funciones/detección de datos propios OFF y cookies de dos meses desde la primera visita. **El borrador no está publicado**. Su publicación debe formar parte de la aprobación concreta; después se obtendrá un SDK nuevo y se repetirá la prueba interceptada antes de publicar el sitio. La duración exacta de 60 días debe verificarse en el SDK, pues la UI expresa meses.

## Cuentas y configuración acreditada

| Servicio | Identificadores públicos | Configuración comprobada |
|---|---|---|
| GA4 | Propiedad `565158660`, flujo `16375742230`, medición `G-LTFBQKVNY2` | Dominio principal, Chile/Santiago, CLP; Enhanced Measurement global, Signals, datos proporcionados por usuarios, publicidad y ubicación/dispositivo granulares OFF. Conservación de eventos y usuarios de dos meses, sin reinicio por actividad. Cuatro opciones de compartir datos OFF. |
| Clarity | Proyecto `zg5i98wnxm` | Sollahms, `https://sollahms.cl/`, máscara Strict y Cookies OFF. Detección de bots ON. Integraciones Microsoft Ads, Google Ads y GA sin conectar. |

Los [ajustes GA4](ga4-settings-receipt.json), las [definiciones para informes](ga4-reporting-receipt.json) y los [ajustes Clarity](clarity-settings-receipt.json) son recibos saneados sin datos de la cuenta personal, credenciales ni tokens. La API independiente confirma el flujo, el ID de medición y Enhanced Measurement global OFF; sus subopciones internas conservan valores latentes y no constituyen una garantía del SDK.

Clarity [documenta Cookies OFF como Consent Mode](https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode): espera una señal válida antes de establecer cookies. El candidato debe enviar [Consent V2](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2), con publicidad denegada, únicamente tras el permiso correspondiente. La máscara Strict puede tardar hasta una hora en aplicarse; la conservación de GA4 puede tardar 24 horas. Estos ajustes no son retroactivos.

## Qué se podrá medir

Se crearon seis dimensiones de alcance de evento: `source_group`, `form_kind`, `acceptance_kind`, `cta_kind`, `placement` y `tool_kind`. Sus valores deben provenir de categorías cerradas; no admiten texto libre ni contenido de formularios.

`contact_request_accepted` está marcado como evento clave, una vez por evento, sin valor monetario predeterminado y excluido de personalización publicitaria (ANP). Representa el acuse técnico admitido por la aplicación; **no es una solicitud cualificada, entrega al buzón, asesoría realizada ni venta**. El evento predeterminado `purchase` se conserva, sin emitirlo ni usarlo como resultado del piloto. Los eventos no se crean a partir de vistas de página.

Los clics de contacto, la primera interacción con herramientas y el comienzo del formulario ayudan a localizar fricción. El permiso comercial para responder una solicitud permanece separado del permiso de medición. Colaboraciones y postulaciones se distinguen de compradores e inversionistas; la recepción y calificación comercial requieren su propia evidencia.

## Alcance y consentimiento del candidato

GA4 se limita a las doce rutas corporativas canónicas. Replay de Clarity se limita a seis rutas sin simuladores ni filtros de URL: portada, asesoría, contacto, privacidad, colaboración e inversión empresarial. Catálogo, fichas, Centro documental, perfiles externos, Preview, alias, HTTP e iframes permanecen fuera de la carga de SDK. Los detalles y las exclusiones completas están en [implementation.md](implementation.md).

La aceptación es independiente para Analytics y replay, sin casillas premarcadas. Antes del permiso no deben descargarse SDK ni transmitirse eventos. Rechazar o retirar el permiso debe conservar navegación, herramientas y formularios, detener la medición propia y aplicar la retirada descrita en la implementación. No se envían datos personales, valores financieros, identificadores de CRM ni claves de idempotencia.

## Evidencia y siguiente comprobación

- [Recibo estático](static-receipt.json) y [pruebas del navegador](browser-receipt.json): comprobaciones locales; no acreditan por sí solas el comportamiento del proveedor.
- [Ensayo inicial del SDK real](sdk-smoke-receipt.json): conserva el hallazgo original; no acredita el artefacto final ni se sustituye por una afirmación de éxito sin su recibo correspondiente.
- [Ensayo corregido del SDK real](sdk-correction-receipt.json): bytes exactos del candidato final, beacons bloqueados; separado de una prueba de recepción en los servicios.
- [Preview privada](https://project-wrapp-7ukmzmy6h-lsandoval2-8260s-projects.vercel.app): `dpl_HS99vSe1dgeQrqzyXLYtiNoEtCvz`, READY, protegida por SSO. [HTTP](preview-http-verification.json): 14/14; [recursos](preview-assets-verification.json): 4/4, MIME y bytes exactos. En Preview el módulo no solicita configuración ni carga SDK.
- [Inventario remoto](preview-remote-integrity.json): 1.727/1.727 UIDs exactos, siete funciones/57 archivos y configuración preservados. [Producción después del preview](production-after-preview.json): ambos alias conservan 86B, SSO y configuración automática intactos. [Simulación de publicación/reversión](release-simulation.json): 10/10, sin red ni cambios reales.
- UI del consentimiento en pruebas aisladas: [aviso móvil](browser-verified-banner-390.png) y [preferencias a 320 px](browser-verified-dialog-320.png). El último ajuste Secure no cambia esa interfaz; su comprobación focalizada está en [browser-release-receipt.json](browser-release-receipt.json).
- [Prueba de artefacto](artifact-proof.json): conservación del material publicado fuera del overlay autorizado.
- [Implementación y fuentes](implementation.md): contrato técnico, privacidad y límites de conservación.

Código del candidato: `f914590010cf0b4ac930c41a59b648da3be1ab31`; inventario completo: `0348f6339b2fe315afb94076abdcca7cc0791a663c5fe639457ec5791040c1fe`, 1.727 archivos (1.706 idénticos a producción, 17 modificados y cuatro añadidos). La base hereda el candidato de apariencia PR38, aún sin publicar. El pie del comparador recuperado de producción aparece como diferencia Git histórica; la comparación de artefactos acredita que no se rediseñó.

El siguiente paso es aprobar el [candidato concreto](candidate.json) y su [procedimiento de publicación](PUBLICACION.md), incluido el borrador GTM de tres ajustes. Tras publicar ese borrador aprobado, comprobar su SDK público nuevo con beacons interceptados **antes** de crear Production sin dominios. Promover sólo el mismo ID Production validado; registrar su T0 y comprobar alias/bytes/directivas. Producción sigue en `dpl_86Bv4RiDeSNxuRarAqn8kkyN4rrH`. GA4 y Clarity no reconstruyen navegación anterior a su instalación; un acuse no acredita resultado comercial.
