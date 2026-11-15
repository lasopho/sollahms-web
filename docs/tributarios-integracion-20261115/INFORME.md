# Integración contextual de la guía tributaria

**Lista para revisión; NO PUBLICADA.** Registro separado de preparación: 14/11/2026 23:17:54 America/Santiago. No modifica ningún T0 editorial ni baseline histórico.

## Base y candidato
- Producción vigente comprobada antes/después: dpl_A6HxKsPgvbfDTaHqUHqSgaBbegPM, SHA 72ceaa022fa3c9bd8db90c07a2aa6656ec9c1025. Se conserva la navegación Expertise publicada después de la guía.
- Rama: codex/tributarios-integracion-20261115.
- PR #21 en borrador: https://github.com/lasopho/sollahms-web/pull/21. Base independiente: codex/expertise-release-20261115.
- SHA de código: 9182da81a75a6ce1b026b67736291ebef3e4ac2f.
- Preview READY: dpl_HG7VQ6dFH57XnnqXf1SWjzMPaLMy.
- URL: https://project-wrapp-ihfvnyigt-lsandoval2-8260s-projects.vercel.app/centro-orientacion.html#ruta
- Entorno staging/preview con protección Vercel existente. No se asignó dominio público ni se modificaron settings.

## Mapa antes/después y justificación
Antes no existía un enlace a la guía tributaria en estas cinco páginas. La guía ya contiene los cinco destinos de retorno, incluida portada mediante marca, y se conserva sin cambios.

| Página modificada | Ubicación | Después / destino | Justificación |
|---|---|---|---|
| Centro de Orientación | ¿Qué necesitas resolver hoy? | Tarjeta → /beneficios-tributarios-inmobiliarios.html | Agrupa la guía con herramientas educativas existentes. Título y descripción solicitados literalmente. |
| Guía hipotecaria | Tu siguiente paso | Enlace → /beneficios-tributarios-inmobiliarios.html#intereses | Conecta compra financiada con revisión tributaria; aclara que el dividendo completo no equivale a deducción. |
| Inversión inmobiliaria para empresas | Comparación de titularidad | Enlace → /beneficios-tributarios-inmobiliarios.html | Amplía adquisición, gastos, depreciación, arriendos y uso personal/empresarial sin duplicar fichas ni asesoría individual. |
| Comparador hipotecario | Bloque educativo al final | Enlace → /beneficios-tributarios-inmobiliarios.html | Aclara que comparar dividendos y tasas no determina ahorro tributario. |
| Portada | Cómo empezar con Sollahms | Enlace → /beneficios-tributarios-inmobiliarios.html | Referencia discreta junto a recursos existentes, fuera del hero. |

No se añadió la guía a todos los menús: se utiliza el Centro como agrupación educativa. Cada página recibe una sola adición. La cuarta tarjeta utiliza la grilla existente (tres columnas en escritorio y apilado móvil); no se añadió CSS.

## Auditoría pública
Portada, Centro, Guía, Comparador, Empresas, Cuándo comprar, Entorno, Catálogo, Agenda, Contacto y Trabaja con nosotros respondieron HTTP 200; también la guía tributaria. Hash de cada HTML público contrastado con el artefacto de producción. Evidencia: audit.json. Las seis páginas restantes de esa lista no reciben cambios por no necesitar un enlace contextual adicional.

## Preservación y SEO/GEO
Paquete de 1.659 archivos: **1.654 idénticos, cinco HTML modificados**, sin adiciones/eliminaciones de runtime. Base completa corroborada mediante SHA-1 de manifiesto 960bcb9f4b8f507c5e1088d93297faf36ea2e6b5, coincidente con el archivo fuente del deployment actual. Build verifica árbol completo, hashes y tamaños disponibles; reutiliza los objetos originales de funciones y recursos.

Eliminar únicamente cada bloque data-tax-context restaura byte a byte el HTML anterior. Head completo, titles, meta descriptions, H1, canonical, Open Graph, JSON-LD, formularios, scripts, navegación y texto anterior son idénticos. Evidencias: changes.json y seo-preservation.json; se registra individualmente cada página intervenida. No se ejecutaron generadores ni se alteraron datos editoriales o mediciones.

La guía tributaria conserva SHA-1 6808be8c8dcdc7def23527402fc66779dfafd06e; CSS 4f9cbb249ff49dc3476fabf660c5e7722432a320; controlador 9c836cea0c924bdfb6c319e411654615ab2ab5e8; motor 36cf2a497a877fc7f3cad868114894da8beb27cc. Su T0 14/11/2026 23:00:14.697 America/Santiago permanece intacto. Sitemap, robots, fichas individuales, integraciones y PR18/19/20 no se modificaron. No se incorporaron materias tributarias pendientes.

## QA
- Build completo READY; sin error de compilación. Guarda: 1.654 preservados y cinco cambios permitidos.
- 18 pruebas de tests/orientation-20261031.mjs aprobadas.
- Chrome: cinco páginas × 320, 390, 768 y 1440 = 20 comprobaciones; scrollWidth 305, 375, 753 y 1425. Sin desbordamiento horizontal de página ni IDs duplicados. Un enlace nuevo por página, destino exacto.
- Cinco recorridos nuevos por teclado hacia la guía; #intereses resuelve a la ficha existente. Foco visible de tarjeta documentado en captura móvil.
- Menú móvil del Centro abre/cierra correctamente; navegación original preservada en las cinco páginas. Se reutiliza QA previo de Expertise para la lógica sin cambios.
- Consola consultada tras recorridos: cero errores/advertencias observados.
- Enlaces recíprocos existentes comprobados en HTML tributario. No se crean destinos inexistentes.
- Capturas escritorio.jpg y movil.jpg. Registro responsive y recorridos: browser-qa.json.
- No se enviaron formularios ni se repitió integración comercial externa. No se afirma certificación WCAG integral.

## Hallazgos y decisión
Sin hallazgos críticos, altos o medios atribuibles a estos cambios. Observación baja: la nueva cuarta tarjeta ocupa otra fila en escritorio al reutilizar la grilla original; lectura y navegación correctas. Se conserva la limitación histórica del manifiesto: una función carece de tamaño explícito, pero su objeto/hash permanece idéntico; no se toca esa función.

Lista para solicitar autorización expresa de publicación. Antes de publicar se debe volver a comprobar producción y conservar cualquier cambio posterior. Esta preview no se promueve automáticamente. No hubo publicación, merge, solicitud de indexación ni cambios al baseline de medición.
