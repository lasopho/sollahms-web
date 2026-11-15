# Medición independiente del CTA de asesoría — diagnóstico inicial

## Resultado y fecha
Revisión de solo lectura: 15/11/2026, 00:17–00:20:47 America/Santiago (UTC−03:00). Corte de consultas de métricas: **15/11/2026 00:18:00 America/Santiago / 03:18:00 UTC**.
**No existe evidencia suficiente para calcular visitas humanas, clics del CTA, solicitudes atribuidas o conversión. NO DISPONIBLE no significa cero.**
Se identificaron conteos técnicos de requests HTTP; no representan rendimiento comercial.

## Registro de intervenciones (sin reinicios)
| Hito | America/Santiago | UTC |
|---|---|---|
| Baseline corporativo | 09/11/2026 20:11:23 | 09/11/2026 23:11:23Z |
| T0 editorial guía | 14/11/2026 23:00:14.697 | 15/11/2026 02:00:14.697Z |
| Integración de enlaces | 14/11/2026 23:24:35.656 | 15/11/2026 02:24:35.656Z |
| Intervención CTA | 15/11/2026 00:10:57.260 | 15/11/2026 03:10:57.260Z |

Producción comprobada por alias: `dpl_GqikSrihY6ETwsVJtkF6uB6y4Dsw`.
Código publicado: `f0e8bd59a9589e7d1b5a737778c6bf4783e89e88`.
La publicación del CTA es una intervención, no un nuevo T0 de la guía.
Fuentes: [guía](https://sollahms.cl/beneficios-tributarios-inmobiliarios.html), [agenda](https://sollahms.cl/agenda-asesoria.html), [publicación certificada](https://github.com/lasopho/sollahms-web/blob/3eca9a9874bc97a7dfca28bc84170545760ec961/docs/tributarios-cta-20261115/PUBLICACION.md).

## Auditoría de instrumentación
| Elemento | Evidencia | Diagnóstico |
|---|---|---|
| Página origen y destino | HTML público: CTA /beneficios-tributarios-inmobiliarios.html → /agenda-asesoria.html | Ruta prevista confirmada; no acredita un recorrido real |
| Clic específico | Enlace normal sin identificador de evento ni registro de clic en los scripts revisados | NO DISPONIBLE |
| Referente interno | No se conserva document.referrer en los módulos revisados ni se envía en el contrato de asesoría | NO DISPONIBLE como dato persistente atribuible |
| Sesión comercial | sessionStorage contiene clave de operación, huella y tiempos para idempotencia del formulario | No es sesión de navegación ni identificador para unir visitas y clics |
| Inicio de formulario | startedAt se fija al inicializar el script; no al primer uso del formulario, y solo viaja al enviar | No equivale a evento form_start; NO DISPONIBLE |
| Envío aceptado | Frontend exige ok=true, providerAccepted=true, deliveryConfirmed=false | Existe señal operacional por intento; no se encontró agregado persistente atribuido al CTA |
| Entrega efectiva | Handler no confirma llegada al buzón; respuesta de proveedor no equivale a entrega o cita | NO DISPONIBLE en esta revisión |
| CRM 360 | Handler advisory solo admite canal Resend; no activa CRM | No se acredita conversión CRM ni vínculo con la guía |
| Web Analytics | Consultas de pageviews y custom events devuelven data y summary vacíos | NO DISPONIBLE; no inferir cero ni desactivación global solo por respuesta vacía |
| Observability | Requests por requestPath y environment=production disponibles | Métrica técnica parcial, sin personas/sesiones/referente/CTA |

Se verificaron bytes públicos de guía, agenda, advisory.mjs, form-operation.mjs, beneficios-tributarios.mjs, scroll-presence.js y expertise-navigation.js. Los módulos relevantes coinciden con el código revisado. El handler api/advisory.mjs coincide por SHA-1 con el manifiesto productivo: 9a0222e072b125eebfbfcb536e35871384653ff0.
No hay identificador de adquisición en el cuerpo admitido por ese handler. Origin valida el origen de seguridad, no conserva la página anterior.
El HTML de la guía contiene **tres** enlaces a la agenda: cabecera («Solicitar asesoría»), CTA nuevo («Solicitar asesoría inmobiliaria») y cierre («Solicitar orientación inmobiliaria»). Un referente de página por sí solo no distingue cuál se pulsó.
No se inspeccionaron datos personales de clientes ni se enviaron formularios de prueba.

## Resultados comerciales
| Métrica | Antes del CTA | Después del CTA |
|---|---|---|
| Visitas humanas a la guía | NO DISPONIBLE | NO DISPONIBLE |
| Clics específicos en el nuevo CTA | NO APLICA: CTA aún no existía | NO DISPONIBLE |
| Visitas a agenda procedentes de la guía | NO DISPONIBLE | NO DISPONIBLE |
| Formularios iniciados por esos visitantes | NO DISPONIBLE | NO DISPONIBLE |
| Solicitudes aceptadas atribuidas al CTA | NO DISPONIBLE | NO DISPONIBLE |
| Solicitudes efectivamente recibidas atribuidas al CTA | NO DISPONIBLE | NO DISPONIBLE |
| Conversión visita → solicitud | NO DISPONIBLE | NO DISPONIBLE |

No se accedió a un registro de recibos de Resend o solicitudes CRM que permita contabilizar o atribuir resultados. El contrato de envío está auditado; los resultados comerciales reales no están acreditados.

## Señales técnicas, separadas de visitas
Fuente: Vercel Observability, métrica vercel.request.count, sum, agrupación requestPath, proyecto project-wrapp, filtro environment=production; consultas sin modificación de configuración. Esta consulta no se filtró por hostname y puede incluir otros accesos al entorno production.

| Ventana efectiva America/Santiago | Guía: requests | Agenda: requests | Interpretación |
|---|---:|---:|---|
| 14/11 23:01:00 → 15/11 00:10:00 | 20 | 7 | Antes del CTA; incluye período anterior y posterior a la integración |
| 15/11 00:11:00 → 00:18:00 | 4 | 2 | Después del CTA; ventana parcial de siete minutos |

Los resúmenes anteriores son los devueltos por el proveedor. La serie anterior está truncada (no se reconstruyó sumando puntos incompletos); el resumen agregado se conserva. No apareció grupo /api/advisory: **no convertirlo en cero solicitudes verificadas**.
Se excluyeron los minutos que cruzan T0 (23:00 y 00:10), porque Vercel redondea los límites a buckets. La consulta exploratoria total 23:00–00:18 devolvió 27 requests de guía y 10 de agenda, pero no sirve como comparación estricta antes/después.
No se calculan porcentajes ni tasas entre ventanas de distinta duración.
Las comprobaciones de publicación, teclado, agenda y las lecturas GET de esta auditoría contaminan el conteo; no se pueden separar con fiabilidad de usuarios, bots, recargas o pruebas. Los 4/2 requests posteriores **no son cuatro visitantes ni dos conversiones**.
Web Analytics consultado desde 03:10:57.260Z hasta 03:18:00Z: el proveedor redondeó inicio a 03:10:50Z; resumen vacío para pageviews y eventos. No se usa para una comparación exacta.
Último día calendario completo: 14/11/2026 America/Santiago; **ningún día completo posterior al CTA** disponible en este corte. Latencia, retención y completitud comercial del proveedor no certificadas.

## Comparación documental
El baseline comercial del 11/11 ya describía atribución insuficiente y requests distintos de leads:
[Informe anterior](../seo-measurement/runs/2026-11-11-commercial-attribution-baseline/report.html).
Su respuesta histórica web_analytics_not_enabled no se presenta como estado actual: ahora la API respondió con arrays vacíos.
La rama experimental first-party mencionada en trabajos previos no acredita publicación. Esta auditoría se basa en los bytes efectivamente servidos y el manifiesto vigente, no en funcionalidad preparada en otra rama.
No se alteran los informes anteriores ni sus datos.

## Protocolo de seguimiento sin cambios del sitio
1. Mantener estos cuatro hitos y un registro de despliegues posteriores. Conservar consulta solicitada, consulta efectiva, zona horaria, hash de evidencia y fecha de extracción.
2. Separar período pre-CTA del posterior con el instante exacto. Cuando solo existan buckets, excluir el bucket que cruza la intervención. No reconstruir eventos retroactivamente.
3. Revisiones sugeridas: 18/11 (primera señal), 22/11 (primera semana), 29/11 (dos semanas) y 15/12 (30 días). Fechas de protocolo, no automatizaciones creadas. Elegir el último día completo con cobertura confirmada; excluir siempre el día en curso.
4. Con instrumentación actual, reportar únicamente requests como diagnóstico técnico y los campos comerciales como NO DISPONIBLE. No usar clics de Search Console como visitas a esta guía ni como clics internos.
5. Si se habilita una fuente de solicitudes en solo lectura, distinguir intento, aceptación de proveedor, entrega confirmada y solicitud comercial cualificada. Deduplicar por operación; no publicar datos personales.
6. Registrar las pruebas propias. No descontarlas a partir de conjeturas. Excluirlas solo con evidencia identificable; si no, declarar contaminación.
7. No atribuir variaciones al CTA de forma causal: influyen integración, indexación, fuentes de tráfico, día y hora, otros enlaces y muestra reducida. Comparar períodos equivalentes solo con cobertura y métricas homogéneas.
8. Si más adelante se aprueba instrumentación, registrar su propia fecha de inicio de medición (sin reiniciar T0) y declarar irrecuperable la información no registrada previamente.

## Decisión
Registro de intervención completado. Medición comercial **no habilitada de manera verificable** para este CTA. Sin tasa de conversión calculable.
Propuesta separada en PROPUESTA-INSTRUMENTACION.md; pendiente de autorización. No implementada.
No se modificó producción, código, scripts, cookies, Resend, CRM, SEO/GEO, sitemap, robots o T0. PR #22 no fusionado ni modificado por este informe.
