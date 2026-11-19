# Medición opcional de Sollahms — publicada el 19/11/2026

**T0: 19/11/2026, 14:07:21.935 America/Santiago.** Se promovió el mismo Production `dpl_Dbd8TFEozqMgfFZ7DsGwq4efWKXC` validado sin dominios, sin reconstruirlo. Ambos alias apuntan a esa versión. [Registro de publicación](publication/publication.json).

Se mantienen [STRATEGY-v3](../seo-measurement/STRATEGY-v3.md), el [estudio del 25/10](../home-seo-20261025/research-and-decisions.md), su [ampliación del 29/10](../seo-corporate-20261029/README.md) y la lista positiva de doce URL. El objetivo es observar el recorrido desde contenido útil hasta una solicitud pertinente. GA4 y Clarity miden uso consentido y fricción dentro del sitio; posiciones, indexación y citas de Google, Bing/Microsoft y ChatGPT Search requieren sus propias fuentes.

La [comparación semanal](../seo-measurement/runs/2026-11-19-weekly-comparison/report.md) y el [informe privado en OpenSEO](https://app.openseo.so/p/64b885cc-5756-4b4e-8e38-22007051cf16/reports/59099ba6-7381-4b11-a53e-45eac7c605fa) conservan periodos y límites. El rendimiento Google/Bing termina el 17/11, antes de esta publicación; una prueba de ChatGPT no acredita tendencia histórica. GA4 y Clarity no reconstruyen navegación anterior a su instalación.

## Publicación y preservación

El titular aprobó `f914590010cf0b4ac930c41a59b648da3be1ab31` y tres ajustes de privacidad GTM. El SDK fresco exigió precisar una frase de la sección 5 de privacidad. Se ejecutó el commit `b56fa12771a824dd8a4d581dc0c9c81e0938f71a`; JavaScript, configuración, datos, finalidades, alcance y elecciones permanecen idénticos. [Precisión](publication/privacy-clarification.json) y [revisión independiente](publication/privacy-delta-peer-review.json).

El inventario final `e12408412891bcf181380717ceecf56fc97067f0ff06a7aba25d26f95f12bc72` contiene 1.727 archivos: 1.706 idénticos, 17 modificados y cuatro añadidos frente a 86B. Se preservan catálogo, 152 fichas, Centro documental, recursos, siete funciones y sus 57 archivos. El sitemap sólo cambia la fecha real de privacidad. Se incorporan los metadatos/favicon preparados en PR38; PR38 y PR39 permanecen sin fusionar.

- [Inventario Production](publication/staged-remote-integrity.json): 1.727/1.727 UIDs, configuración y funciones correctos.
- [HTTP público](publication/public-http-verification.json): 14/14; [recursos públicos](publication/public-assets-verification.json): 4/4, MIME y bytes exactos.
- [Alias y protección](publication/public-alias-verification.json): www/308 y SSO técnico/302. [Configuración posterior](publication/production-after.json): autoasignación false y opciones previas conservadas; sin escrituras de entorno.
- [Gate previo](publication/peer-review.json), [simulación](release-simulation.json) y [recuperación](publication/recovery-readiness.json): sin ensayos de rollback sobre tráfico real. 86B es la recuperación anterior; comprobar de nuevo antes de usarla.

## Cuentas y permisos

| Servicio | Identificadores públicos | Configuración |
|---|---|---|
| GA4 | Propiedad `565158660`, flujo `16375742230`, medición `G-LTFBQKVNY2` | Chile/Santiago, CLP; Enhanced Measurement global, Signals, datos proporcionados por usuarios, publicidad y ubicación/dispositivo granulares OFF. Retención individual de dos meses sin reinicio; compartir datos OFF. |
| Clarity | Proyecto `zg5i98wnxm` | Dominio principal, máscara Strict; Cookies OFF exige Consent V2 válido. Detección de bots ON. Integraciones nativas Ads y GA desconectadas. |

[Ajustes GA4](ga4-settings-receipt.json), [dimensiones/evento clave](ga4-reporting-receipt.json), [Clarity](clarity-settings-receipt.json) y [GTM versión 2](publication/gtm-publication.json) no contienen secretos ni datos de la cuenta personal. El SDK fresco confirma detectores automáticos y capacidades/detección de datos propios OFF, y el límite efectivo de 60 días del código.

GA4 sólo carga en doce rutas corporativas canónicas tras el permiso de Analytics. Clarity usa un permiso independiente y sólo seis rutas sin simuladores ni filtros de URL. Catálogo, fichas, Centro documental, Preview, alias técnicos, HTTP e iframes quedan fuera de la carga de SDK. Rechazar conserva navegación, herramientas y formularios. [Contrato y fuentes](implementation.md).

## Cookies y límites comprobados

El [SDK fresco posterior a GTM versión 2](publication/sdk-fresh-verification.json) confirma un page_view por documento, URL/referrer saneados y ausencia de marcadores personales/financieros en las muestras interceptadas. Las cookies GA son host-only, Secure y SameSite Lax, hasta 60 días desde cada escritura. `_ga` conserva su vencimiento; la cookie de estado de sesión `_ga_…` puede actualizarlo con actividad o navegación. No se afirma que ambas tengan vencimiento fijo.

Clarity aplica máscara raíz y Consent V2 independiente con publicidad denegada. Sus cargas gzip observadas no contienen marcadores sintéticos. Sus cookies conservan valores del proveedor: `_clck` aproximadamente un año y `_clsk` un día, SameSite Lax y sin Secure en la versión ensayada. Las pruebas finitas y el enmascaramiento no acreditan anonimización absoluta ni versiones futuras.

Todas las pruebas bloquean beacons y usan acuses simulados: **cero contactos, registros CRM, reservas o envíos de medición reales del agente**. No demuestran recepción real en GA4/Clarity. `contact_request_accepted` acredita un acuse técnico sin valor monetario; no entrega al buzón, lead cualificado ni venta. Colaboraciones/postulaciones se distinguen de compradores.

## Evidencia y seguimiento

Se conservan 20 pruebas unitarias, 130 comprobaciones estáticas, ocho casos de navegador y un smoke de flags, 17 comprobaciones de funciones con proveedores simulados y diez escenarios de publicación/reversión local. Los recibos anteriores son históricos; el ensayo fresco amplía la observación a actividad y revisita.

La [preview histórica](https://project-wrapp-7ukmzmy6h-lsandoval2-8260s-projects.vercel.app) conserva SSO y bloquea configuración/SDK. [Aviso móvil](browser-verified-banner-390.png) y [preferencias a 320 px](browser-verified-dialog-320.png) proceden de pruebas aisladas. El [plan posterior a T0](publication/measurement-plan.json) se limita a doce URL y separa publicación, rastreo/indexación, búsquedas, citas IA, uso y captación.

[Comprobación final en la portada pública](publication/public-consent-verification.json): aviso inicial y rechazo sin SDK/cookies; Analytics sola con un page_view saneado; Clarity sola con máscara y publicidad denegada; retirada y recarga sin reinicio. Sin errores CSP observados. HTML/CSS/JS/config reales del sitio y SDK servidos desde caché validada; todos los collect se cumplieron localmente, sin beacons ni contactos reales. Esto acredita instalación y consentimiento, no recepción en paneles.
