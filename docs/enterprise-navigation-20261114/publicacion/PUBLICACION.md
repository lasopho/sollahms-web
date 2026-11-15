# Publicación controlada de enlaces empresariales

**PUBLICADO Y VERIFICADO.**

- Fecha/hora: 2026-11-15T01:23:09.853Z UTC; **14/11/2026 22:23:09.853 America/Santiago**. Fuente: updatedAt del alias.
- Deployment anterior: `dpl_5XmA5bbvmsDyttpgwC3sZf8jKtFk`.
- Deployment publicado y confirmado en sollahms.cl: **`dpl_MnEt1RLpezr7atjVvYrehaGcE69D`**.
- Commit publicado remoto: `941051c69d23c1069b68200b019fb020dbf2c722`.
- Rama remota: `codex/enterprise-links-release-20261114`.
- Preview aprobado: `dpl_H2fT1GRTYMEWWgK5B83ae6zUwcuk`, commit local `53fe1259a17419c1c17c19f024982f42b2421d2b`.

## Autenticación y preservación

El conector autenticado de GitHub resolvió la publicación de una rama nueva sin tokens, contraseñas, cambios de permisos ni push forzado. El SHA remoto difiere del local porque se registraron los dos HTML idénticos al aprobado sobre el commit productivo real; el diff remoto contiene exclusivamente las dos adiciones autorizadas. No se transfirieron otros cambios locales ni se fusionó ninguna rama. PR #18 comprobado abierto, en borrador y sin fusionar; no fue modificado.

Producción seguía en la referencia al inicio y justo antes de asignar el dominio. Se preparó un artefacto target production completo, comprobado antes de asignar sollahms.cl; no se promovió Preview. Build con guarda VERCEL_ENV y manifiestos validó **1.653 archivos: 1.651 intactos y dos modificados**. No se cambiaron settings ni se activaron despliegues automáticos. El hostname de proyecto asignado por Vercel al artefacto no cambió sollahms.cl antes de la asignación controlada.

| Archivo | SHA-1 anterior | SHA-1 publicado |
|---|---|---|
| index.html | 11eeffc16bdcc8608fdcb9597d6d15611f6f8d32 | a1fefcab2a2f94012e1c768eac6b9244f2ed6499 |
| guia-hipotecaria.html | 917b0696a1eed2cf09db68394931da17cc17d654 | c930e41b708cfd7e0c534f05e1fa3d1c31cf35ea |

Eliminar cada párrafo data-enterprise-context restaura los bytes anteriores. Hero, menú, metadatos, canonical, JSON-LD, Open Graph, fuentes, cálculos, formularios y pies permanecen iguales. Se conservaron las otras nueve páginas del baseline, empresarial y sus recursos, agenda, Centro, funciones, CRM360, AI Lab y todas las fichas.

## QA previo y público

Se reutilizó la revisión de Preview a 320/390/768/1440 y sus pruebas funcionales. El candidato production respondió 200 y coincidió en hashes para portada, guía, empresarial, sitemap y robots, descontando únicamente la barra de revisión de Vercel. Su hostname vercel.app mantiene noindex propio del entorno; el dominio público no lo hereda.

Después de asignar el dominio: **17 HTTP 200**, hashes exactos del artefacto y ausencia de noindex en cabeceras: once páginas corporativas, página empresarial, sitemap, robots y tres recursos empresariales. Evidencia completa en http-qa.json. HTML empresarial sin meta noindex y canonical público exacto.

- Portada y Guía: enlace visible, único nuevo enlace contextual por página; foco por teclado y Enter llegan a https://sollahms.cl/inversion-inmobiliaria-empresas.html.
- Ambas páginas comprobadas a 320, 390, 768 y 1440 px; scrollWidth 305, 375, 753 y 1425 respectivamente. Sin desbordamientos horizontales; capturas móviles y escritorio adjuntas.
- Sin errores o advertencias de consola observados en los recorridos de portada y guía.
- Empresarial: 5.000 UF al 80% muestra aporte 1.000 UF y financiamiento 4.000 UF. El rechazo del 81% se reutiliza del QA privado de los módulos idénticos.
- Formulario empresarial: sin elemento form, fieldset disabled. WhatsApp único correcto 56948502440. Sin envíos comerciales reales.
- Sitemap y robots idénticos; sitemap conserva 143 URL únicas y lastmod sin alteraciones. Herramientas y formularios existentes preservados por HTML/scripts/funciones idénticos; no se afirma una prueba nueva de envío real ni certificación WCAG.

## Trazabilidad y cierre

Nueva intervención de enlaces: 14/11/2026 22:23:09.853 America/Santiago. No reemplaza corporate-education-v2 T0 editorial 09/11/2026 20:11:23 ni corporate-enterprise-v1 T0 publicación 14/11/2026 21:03:45.065 / descubrimiento inicial 21:39:51.812. No se atribuyen resultados de posicionamiento ni indexación.

Sin solicitudes de indexación ni reenvío de sitemap; sin cambios en Google o Bing. Sin incidencias críticas ni reversión necesaria. El deployment anterior se conservó. Estado final confirmado por API: **sollahms.cl sirve dpl_MnEt1RLpezr7atjVvYrehaGcE69D**.
