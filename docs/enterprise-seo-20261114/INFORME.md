# Integración SEO/GEO empresarial — propuesta privada

**APTO PARA SOLICITAR AUTORIZACIÓN.** No se ha publicado ni intervenido en buscadores.

## Referencias

- Producción comprobada: `dpl_CDJGxa1Y2irRKJ9TJWR2emSJEvjy`, commit `0e750eb3afe7424726ea770a3963e324bd1d8339`.
- Rama independiente: `codex/enterprise-seo-integration-20261114`, creada desde la evidencia de publicación `f5deeb7e0f4ca5d5028278294d3599bd25c528b5`. No se modifica la rama del PR #18.
- Commit del candidato: `dab84b38ebe13a3f02c5d1a1ad298e4bf1d3c949`.
- Deployment privado READY, entorno preview/staging: `dpl_28ydhVWXofGntvHXMNXRhxYKXBQv`.
- [Vista previa del enlace](https://project-wrapp-jwv7f3dud-lsandoval2-8260s-projects.vercel.app/centro-orientacion.html#ruta).

No se creó un deployment de producción. El ensamblador exige VERCEL_ENV=preview. El paquete reutiliza el artefacto público completo, no una reconstrucción desde una versión antigua del repositorio.

## Descubrimiento e indexabilidad actuales

La página pública responde HTTP 200 y coincide por hash con el contenido aprobado. Conserva canonical propio, metadatos y JSON-LD WebPage válido. No contiene noindex en HTML ni cabeceras públicas; robots permite acceso. La página es técnicamente indexable. **Descubrimiento e indexación reales en Google y Bing: desconocidos**, ya que no se consultaron sus plataformas ni se infirieron estados a partir del HTTP.

El sitemap público respondió HTTP 200, XML válido, **142 URL únicas**, cero duplicados y las once URL de corporate-education-v2 presentes. La URL empresarial está ausente. No hubo cambios productivos posteriores a la publicación certificada en los archivos revisados ni en el deployment del dominio.

No se encontraron enlaces hacia la nueva página en las **once páginas corporativas públicas** examinadas. El rastreo textual del HTML del repositorio solo encontró la propia página empresarial. No se volvió a rastrear el catálogo de fichas de proyectos; no se afirma haber auditado todos los posibles enlaces entrantes del sitio o de terceros.

No se detectaron errores de rastreo técnico en las respuestas comprobadas. Esto no equivale a un informe de cobertura de buscadores.

## Dos diferencias runtime propuestas

| Archivo | Cambio exacto | Protección |
|---|---|---|
| `sitemap.xml` | Una entrada adicional con la URL definitiva; 142 → 143 únicas | Conserva las 142 entradas, orden y lastmod; no inventa lastmod nuevo |
| `centro-orientacion.html` | Un párrafo contextual después de la introducción de «¿Qué necesitas resolver hoy?» | Única página del baseline con cambio propuesto; requiere autorización expresa |

Párrafo propuesto:

```html
<p>¿Evalúas comprar a nombre de una empresa? Consulta <a href="/inversion-inmobiliaria-empresas.html">Inversión inmobiliaria para empresas</a>.</p>
```

Entrada propuesta:

```xml
  <url>
    <loc>https://sollahms.cl/inversion-inmobiliaria-empresas.html</loc>
  </url>
```

Los parches completos están en `centro-orientacion.html.patch` y `sitemap.xml.patch`. Retirar esos dos fragmentos reconstruye exactamente los bytes productivos de ambos archivos.

El Centro es el punto educativo más pertinente: ofrece rutas según la necesidad del visitante. No se agregan enlaces a todas las páginas ni se sobrecarga el menú. No se propone modificar Guía Hipotecaria, portada, agenda ni las otras ocho páginas protegidas. Una futura página tributaria no publicada queda fuera de esta integración.

## Preservación y QA

El artefacto tiene **1.653 archivos**, con **1.651 idénticos y dos cambios propuestos**; no añade ni elimina archivos runtime. El build verificó todos los hashes y la lista cerrada de cambios. Se conservan configuración de rutas, funciones, recursos compartidos, robots, página empresarial y sus tres recursos.

Las diez páginas protegidas restantes son idénticas por hash. En Centro de Orientación se verifica igualdad completa al retirar el único párrafo añadido: metadatos, canonical, datos estructurados, cabecera, menú, pie, formularios, scripts y contenido previo permanecen iguales. **Las once páginas públicas siguen intactas; el cambio al Centro existe solo en la rama y vista previa.**

| Prueba realizada | Resultado |
|---|---|
| Auditoría pública de once páginas, sitemap, robots y empresarial | 14 HTTP 200, hashes coincidentes con producción certificada |
| Preview Centro, sitemap y empresarial | 3 HTTP 200, bytes coincidentes con el manifiesto candidato |
| Protección preview | Cabecera noindex en las tres respuestas; producción no alterada |
| Sitemap candidato | XML válido, 143 únicas, ninguna eliminada y 142 entradas conservadas |
| Enlace descriptivo | Un enlace nuevo, destino exacto, elemento a nativo con tabIndex 0 |
| Teclado | Enter abre la página empresarial y se comprueba la URL final |
| Móvil / escritorio | 320, 390 y 1440 px sin desbordamiento; capturas 320 y 1440 adjuntas |
| Consola | Sin errores ni advertencias registrados durante el recorrido |
| Calculadora empresarial | Archivos idénticos; salida inicial comprobada: 1.500 UF / 3.500 UF |
| Formulario empresarial | Sin elemento form, todos los campos desactivados |

Se reutiliza el QA certificado de 28 pruebas Node, 13 casos Chrome y publicación empresarial para límites y cálculos: su código no cambió. No se enviaron formularios ni correos. No se declara certificación WCAG ni compatibilidad con lector de pantalla real. No se ejecutó una nueva auditoría de rendimiento o de entrega de leads.

Evidencia: `discovery.json`, `qa.json`, `build-events.json`, manifiestos y capturas. La primera comparación XML de verificación incluyó por error el espacio entre nodos como parte de la última entrada; se ajustó la comparación para separar ese espacio y se confirmó además la identidad byte a byte al retirar exclusivamente la nueva entrada. No requirió cambiar el candidato.

## Segmentación independiente y GEO

`corporate-enterprise-v1.json` registra exclusivamente la nueva URL. T0 de publicación: **14/11/2026 21:03:45.065 America/Santiago**. Incorporación al sitemap, publicación del enlace, descubrimiento e indexación se mantienen separados y sin fecha hasta contar con eventos reales.

Las métricas quedan null, no cero. No se cambia active-policy.json, scope-v2.json, mediciones, informes históricos ni el T0 de **09/11/2026 20:11:23 America/Santiago** de corporate-education-v2. Este registro documental independiente no altera automáticamente importadores o tareas existentes. Cuando se mida, deberá usarse el filtro de URL exacta del nuevo segmento y conservar zonas/fechas nativas.

La revisión editorial cubre las seis consultas solicitadas mediante contenido ya presente y fuentes oficiales auditadas; el detalle está en `GEO-COBERTURA.md`. No se detectó necesidad de alterar afirmaciones financieras o tributarias. No se añadieron datos estructurados artificiales ni promesas de citas en motores de IA. Cobertura editorial no demuestra visibilidad real.

## Procedimiento posterior y riesgos

`PLAN-INDEXACION.md` prepara la inspección de URL exacta en GSC y Bing, registro de sus estados reales, y una única solicitud de indexación si procede y se autoriza expresamente. No se ha ejecutado. El plan distingue prueba en vivo de indexación y no autoriza reenvío de sitemap ni validaciones globales.

Riesgos y límites: todavía no se conoce el estado real en buscadores; añadir enlace y sitemap facilita descubrimiento, pero no garantiza indexación, posición o citas. La futura modificación del Centro deberá registrarse como evento de enlazado dentro de su historial sin reescribir su baseline. La vista previa no debe promoverse directamente: tras autorización se debe preparar un artefacto production con los mismos dos cambios sobre la producción que esté vigente, revisar hashes antes de asignar dominio y verificar después HTTP, canonical, robots y sitemap. Si producción cambia, conservar todos los cambios posteriores.

## Autorización solicitada

Autorizar exclusivamente la preparación final y publicación controlada de **sitemap.xml y el párrafo señalado en centro-orientacion.html**, manteniendo la página empresarial y los demás recursos intactos. No incluye indexación, reenvío de sitemap, modificaciones de plataformas de búsqueda, activación del formulario, CRM, AI Lab, variables, fusiones de PR ni cambios al registro histórico corporate-education-v2.

**Dictamen: APTO PARA SOLICITAR AUTORIZACIÓN.**
