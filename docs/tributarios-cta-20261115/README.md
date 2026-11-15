# CTA inmobiliario propio — candidato privado PR #22

Estado: READY, QA aprobado para revisión. **No publicado; no fusionar.**

- Base productiva comprobada al inicio y al cierre: dpl_9wtwmxsxawGBf9XGb6yK1hWKUuqC, código 4bea6abcb3fbc663c0f3a559e0086d70a5b977a2.
- SHA de código candidato: f0e8bd59a9589e7d1b5a737778c6bf4783e89e88.
- Preview: dpl_8cFdafYsRvinjVBtA6sLyvfkkH5P, target staging (VERCEL_ENV=preview), READY.
- [Vista previa privada](https://project-wrapp-cku9mdbu9-lsandoval2-8260s-projects.vercel.app/beneficios-tributarios-inmobiliarios.html#tax-advisory-title).
- [PR #22 en borrador](https://github.com/lasopho/sollahms-web/pull/22).
- Rama independiente codex/tributarios-cta-sollahms-20261115; comparación contra la rama de la producción vigente, no contra una base histórica.
- Fecha de preparación: 14–15/11/2026 America/Santiago (cruce de medianoche). Directorio fechado 20261115 para la evidencia final. T0 de guía e integración sin alteración.

## Antes y después
Antes:
> Antes de decidir, solicita una evaluación individual a un contador o asesor tributario competente. Se deben revisar documentos, fechas, régimen y uso efectivo del inmueble.

Después:
> **¿Estás pensando en invertir en una propiedad?**
>
> En Soll ahms te acompañamos a evaluar alternativas inmobiliarias según tus objetivos, capacidad de inversión y opciones de financiamiento.
>
> **Solicitar asesoría inmobiliaria** → /agenda-asesoria.html

Se conserva literalmente «Soll ahms», como fue solicitado. Se reemplaza únicamente el párrafo indicado después de las doce fichas. Los demás avisos, incluido el aviso independiente de evaluación tributaria individual en otra sección, permanecen íntegros.

## Archivos y preservación
Único archivo runtime modificado: beneficios-tributarios-inmobiliarios.html. No se modifica CSS ni JavaScript: reutiliza tax-note, tax-cta y tax-button. Se agrega un identificador único y región accesible para el CTA.

Al reemplazar el nuevo bloque por el anterior, el HTML vuelve exactamente a los bytes públicos: **fuera del bloque, identidad byte a byte**. Head completo, title, description, canonical, OG, JSON-LD, doce fichas, orientador, FAQ, fuentes, referencias legales y fechas intactos. Sin cambios en las cinco páginas de origen, sitemap, robots, formularios o integraciones. PR #19, #20 y #21 no modificados.

| Artefacto HTML | Bytes | SHA-1 |
|---|---:|---|
| Producción | 43024 | 6808be8c8dcdc7def23527402fc66779dfafd06e |
| Candidato | 43228 | 871f1e31e65ed96564ef47df492335f9925f6301 |

El manifiesto productivo reconstruido se corroboró contra el identificador SHA-1 obtenido de Vercel: c50ab75b818c5786d08dc1d44d737cc2b13184a6. El build verificó las 1659 rutas y hashes, tamaños donde estaban registrados, ningún archivo extra o faltante, y exactamente un HTML distinto. **1658 archivos productivos preservados**. La limitación histórica de tamaño no registrado en una entrada no impide su validación por hash.

Cuatro archivos auxiliares de empaquetado (script, configuración aislada y dos manifiestos) no se incorporan al runtime público. No se cambiaron ajustes globales. La protección SSO del proyecto permanece activa para previews. No se asignó sollahms.cl ni se promovió el candidato; el alias público continúa en el deployment base.

## QA dirigido
| Comprobación | Resultado |
|---|---|
| 320 × 850 | CTA completo, botón en dos líneas, sin desbordamiento |
| 390 × 844 | CTA completo, foco visible, sin desbordamiento |
| 768 × 1024 | Presentación tablet correcta, sin desbordamiento |
| 1440 × 900 | Presentación escritorio correcta, sin desbordamiento |
| Navegación CTA | Abre /agenda-asesoria.html en el mismo entorno, título «Solicitar asesoría inmobiliaria en Chile \| Sollahms» |
| Teclado | Enlace enfocable, foco visible y activación con Enter |
| Semántica | Región con aria-labelledby; encabezado H2; enlace con nombre descriptivo; IDs únicos |
| Contraste | Blanco/verde 14,11:1; verde/dorado 8,30:1 |
| Consola | Sin errores ni advertencias observados durante el recorrido |
| Orientador | Filtra 4 temas con configuración inicial y restaura los temas generales |
| HTTP público | Guía y agenda HTTP 200; guía pública conserva hash anterior |
| Preservación | HTML fuera del bloque idéntico; 12 tarjetas conservadas; recursos intactos |
| Build | READY; comprobación fail-closed de entorno preview y manifiesto completo |

Capturas: [320](cta-320.jpg), [390](cta-390.jpg), [768](cta-768.jpg), [1440](cta-1440.jpg). Evidencia estática: preservation.json. Build: build-logs.json. Manifiestos: production-manifest.json y candidate-manifest.json. El QA de accesibilidad es dirigido al bloque, no una certificación integral WCAG del sitio.

## Incidencias resueltas y límites
La primera solicitud API rechazó el valor target=preview antes de crear un deployment; se corrigió al valor staging exigido por la API. El build verifica VERCEL_ENV=preview. El push HTTPS local carecía de credencial; se guardó el mismo árbol mediante el conector autorizado de GitHub. Ninguna de estas incidencias modificó producción.

No hay hallazgos críticos en el cambio. No se revalidó normativa tributaria ni se alteró ninguna ficha. Se requiere autorización expresa antes de una publicación controlada, con nueva comprobación de producción. No se ejecutará merge.
