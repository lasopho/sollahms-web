# Publicación controlada de integración tributaria — PR21

**PUBLICADA Y VERIFICADA.**

- Fecha: 14/11/2026 23:24:35.656 America/Santiago; 15/11/2026 02:24:35.656 UTC. Fuente: updatedAt de sollahms.cl = 1794709475656.
- Deployment publicado: dpl_6ittTviwNMv8RyaKvYLdTiPdZu2L.
- SHA de código: 9182da81a75a6ce1b026b67736291ebef3e4ac2f.
- Anterior: dpl_A6HxKsPgvbfDTaHqUHqSgaBbegPM; SHA 72ceaa022fa3c9bd8db90c07a2aa6656ec9c1025.
- Candidato preview aprobado: dpl_HG7VQ6dFH57XnnqXf1SWjzMPaLMy.

## Alcance y comprobaciones previas
Se volvió a consultar producción al inicio y justo antes de la asignación: sin cambios posteriores. Se preparó un deployment target production independiente, sin promover preview. Auto-assign Custom Production Domains comprobado Disabled en la interfaz; no se cambió ningún ajuste global. Build READY antes de asignar exclusivamente sollahms.cl.

El manifiesto de producción coincide con SHA-1 960bcb9f4b8f507c5e1088d93297faf36ea2e6b5 previamente corroborado con Vercel. Se compararon nuevamente las 1.659 entradas y los cinco HTML finales. Build valida árbol completo, hashes y tamaños disponibles: **1.654 archivos idénticos, cinco HTML modificados**. Sin adiciones ni eliminaciones de runtime. Subsiste la limitación histórica del tamaño no registrado de una función, íntegra por hash; no afecta a los cinco HTML.

Los únicos cambios publicados son los bloques data-tax-context aprobados en centro-orientacion.html, guia-hipotecaria.html, comparador-hipotecario.html, inversion-inmobiliaria-empresas.html e index.html. Al retirarlos se restauran exactamente los bytes anteriores. Ninguna variación respecto al candidato aprobado.

## Evidencia pública
PUBLICACION-HTTP.json: 11 HTTP 200 con tamaño, SHA-1 y URL final; todos coinciden con el artefacto. Incluye cinco páginas modificadas, guía tributaria y sus tres recursos, sitemap y robots. Head completo de los cinco HTML coincide con el aprobado; title, descripción, canonical, Open Graph y JSON-LD no cambiaron. H1 y contenido editorial previo preservados por comparación exacta del diff.

| Página | SHA-1 publicado | Enlace nuevo |
|---|---|---|
| index.html | d6c0b9853396655eb3262173f18f93bd2b8fc28c | /beneficios-tributarios-inmobiliarios.html |
| centro-orientacion.html | a97ea1daf01beab3e6764a5e867ed16ae91625f8 | /beneficios-tributarios-inmobiliarios.html |
| guia-hipotecaria.html | ff9cefe830c88c506eaad88b715b815cc9a17d9b | /beneficios-tributarios-inmobiliarios.html#intereses |
| comparador-hipotecario.html | 90de7bfd0e62ecc7b6d1ba39dc295af919262bfd | /beneficios-tributarios-inmobiliarios.html |
| inversion-inmobiliaria-empresas.html | b7919024c69365d549d440fbbe3aac199860d6c0 | /beneficios-tributarios-inmobiliarios.html |

Chrome público: diez recorridos de teclado, cinco en 390 px y cinco en 1440 px, terminan en la guía correcta, incluyendo #intereses. Sin desbordamiento (scrollWidth 375 y 1425 respectivamente). Menú móvil Centro abre/cierra, aria-expanded true al abrir. Consola consultada: cero errores/advertencias observados. Se reutilizan las 20 comprobaciones previas en 320/390/768/1440 y las 18 pruebas de orientación porque el HTML y los recursos publicados coinciden con el candidato. No se enviaron formularios reales.

Capturas: publicado-escritorio.jpg y publicado-movil.jpg. Recorridos: PUBLICACION-BROWSER.json.

## Preservación y cierre
La guía tributaria conserva SHA-1 6808be8c8dcdc7def23527402fc66779dfafd06e y 43.024 bytes; sus tres recursos mantienen sus hashes certificados. **Su T0 14/11/2026 23:00:14.697 America/Santiago no cambia.** Esta fecha registra únicamente la intervención de enlaces, sin reiniciar baselines SEO/GEO. Sitemap bfa42b14ed615e3658436925f7dc8982badde28a y robots a2697d8941e99c14c517ce1da5eafc25ae4953b1 idénticos.

No se modificaron formularios, integraciones, CRM360, AI Lab, PR18/19/20 ni fichas inmobiliarias. PR21 permanece abierto y en borrador, sin merge. Sin indexación ni reenvío de sitemap. No se incorporan materias tributarias pendientes. Sin incidencias críticas observadas; no se necesitó reversión. La documentación posterior no reconstruye ni modifica el deployment publicado.
