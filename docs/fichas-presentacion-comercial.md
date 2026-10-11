# Presentación comercial de fichas e información inmobiliaria

Actualización: 10/10/2026. Rama: `codex/integracion-financiera-sollahms`.

## Criterio de presentación

Las 148 fichas presentan el proyecto, su material gráfico y las alternativas de consulta. La información de investigación, las fechas de comprobación de la ficha, los hashes, el canal contractual de los brochures y los registros de auditoría se conservan para trabajo interno; no forman parte de la experiencia comercial ni de la traducción futura de estas fichas.

La centralización del aviso general en `/privacidad.html#informacion-inmobiliaria-material-grafico` no cambia el precio, la identidad, la disponibilidad ni los permisos de ningún recurso. Tampoco confirma una cobertura contractual que siga pendiente. No incorpora documentos contractuales ni condiciones comerciales confidenciales al sitio.

## Aviso general en español

**Información inmobiliaria y material gráfico**

Las fichas de proyectos pueden incluir material promocional facilitado por inmobiliarias y canales de comercialización autorizados, para presentar las características de cada proyecto.

Las fotografías, renders y planos pueden ser referenciales. El mobiliario, la decoración, las vistas y los elementos ilustrados no necesariamente forman parte de la unidad ofrecida. Las superficies, distribuciones, terminaciones, equipamiento y áreas comunes pueden variar según la unidad y la etapa del proyecto; confirma sus características al consultar.

Los precios indicados como «Desde UF» son valores de referencia y están sujetos a disponibilidad y a las condiciones vigentes de la inmobiliaria. Antes de tomar una decisión, confirma el precio de la unidad, su disponibilidad, las condiciones del pie y la entrega con nuestro equipo. Cuando no existe un precio vigente confirmado, la ficha indica «Consultar precio».

La información de brochures de otras fechas no constituye por sí sola una oferta comercial vigente. Los avisos específicos junto a imágenes, planos, precios y simulaciones complementan este apartado y deben considerarse al evaluar cada alternativa.

## Avisos que deben permanecer junto al contenido

- Las fotografías y renders referenciales, y los elementos ilustrados que no se incluyan necesariamente en la unidad.
- Las superficies aproximadas, diferencias documentales relevantes, límites de disponibilidad y condiciones de la unidad o etapa que correspondan a modelos y planos. Se conservan los planos ampliables y la identificación de cada modelo.
- Los precios «Desde UF», su sujeción a disponibilidad y condiciones comerciales, y «Consultar precio» cuando falta un precio vigente confirmado.
- Las referencias históricas que puedan inducir a interpretar modelos o características de un brochure como stock u oferta vigente.
- Las restricciones de acceso exacto que correspondan a mapas de búsqueda y el enlace para consultar la ubicación original. No se sustituyen por coordenadas aproximadas.
- El carácter referencial de las simulaciones, su alcance y gastos no incluidos, la ausencia de aprobación bancaria y la fecha y fuente oficial indispensable de la UF. El comparador hipotecario conserva fechas, fuentes y contexto de sus referencias financieras.

El objetivo es comunicar límites que ayuden al visitante a evaluar el contenido, sin publicar el proceso interno mediante el cual se comprobó.

## Trazabilidad interna conservada

| Recurso interno | Información que conserva |
| --- | --- |
| `data/fichas-proyectos.json` | Identidad, evidencias por campo, fuentes, fechas, comprobaciones, discrepancias y datos pendientes. |
| `data/fuentes-imagenes.json` | Correspondencia de cada imagen con su proyecto, URL de origen, dimensiones y hashes. |
| `data/registro-fichas.json` y `docs/registro-fichas-proyectos.md` | Inventario de las 148 fichas y estado de sus datos. |
| `data/brochures-aj-urbana.json` y `data/brochures-ingevec.json` | Modelos, superficies, páginas originales, revisión de imágenes y control de alcance contractual. |
| `docs/brochures-yapo-iris-publicacion.md` | Estado real de la procedencia declarada y del alcance contractual pendiente, exclusiones y preparación reproducible. |
| `.vercel/brochure-build-inventory.json` y paquete privado de revisión | Recursos seleccionados, hashes y evidencia de reproducción del despliegue. |
| Registros de QA internos | Pruebas de navegación, medios, planos, mapas, recorridos, formularios y escenarios financieros. |

Estos recursos no se convierten en secciones comerciales públicas. La salida web se limita a los recursos permitidos por el empaquetador; los contratos, originales PDF, datos comerciales internos, candidatos y archivos de auditoría quedan excluidos. La investigación previa se conserva en su registro original, aunque su texto ya no aparezca en una ficha.

## Integración de la futura versión en inglés

La revisión del código fuente actual encontró **155 páginas HTML de primer nivel, todas con `lang="es"`**, sin páginas inglesas, enlaces `hreflang` ni controles de idioma. No se crea una ruta inglesa vacía ni un selector sin contenido.

Al incorporar la versión inglesa se aplicará la misma política de presentación a todas sus fichas, tanto a contenido visible como a navegación, etiquetas, pies de imágenes y planos y metadatos comerciales. La traducción no debe reintroducir «Sources», «Official sources», «Verification date», «Document provenance», hashes, registros de investigación ni la procedencia contractual. Las fuentes y fechas financieras necesarias sí se mantienen en el comparador y la referencia de UF.

El aviso de privacidad se traducirá con el título y texto siguientes, conservando un identificador de apartado estable para sus enlaces. No se declarará una ruta ni un `hreflang` inglés hasta que la página exista y esté verificada.

**Property information and visual material**

Project listings may include promotional material supplied by property developers and authorized marketing channels to present each project's features.

Photographs, architectural renders and floor plans may be illustrative. Furniture, decoration, views and other illustrated elements are not necessarily included in the unit offered. Areas, layouts, finishes, amenities and shared facilities may vary by unit and project phase; confirm their details when making an enquiry.

Prices shown as “From UF” are reference values and are subject to availability and the developer's current terms. Before making a decision, confirm the unit's price and availability, down payment terms and handover details with our team. When no current price has been confirmed, the listing shows “Enquire about price”.

Information in brochures from earlier dates does not, by itself, constitute a current commercial offer. Specific notices alongside images, floor plans, prices and simulations supplement this section and should be considered when assessing each option.

Las pruebas de aceptación de la versión inglesa deben cubrir las mismas 148 fichas, medios y acciones contextuales que las páginas españolas, con avisos comerciales equivalentes y sin traducción de contenido privado.

## Comprobación del apartado y regresión

El apartado nuevo utiliza la jerarquía, colores, tipografía, espacios y clases responsive que ya usa `privacidad.html`; no añade JavaScript, dependencias externas, formularios ni tratamiento de datos. Conserva el título, descripción SEO, canonical, política de datos, navegación y enlaces existentes.

La revisión de integración debe comprobar:

1. El título y ancla del aviso en escritorio, tablet y móvil, sin desbordamiento ni IDs repetidos.
2. La conservación de los nueve apartados previos, sus enlaces y sus párrafos.
3. La ausencia de auditoría/procedencia contractual en las 148 fichas y el mantenimiento de advertencias comerciales relevantes.
4. Fotografías, portadas, galerías, planos ampliables, modelos, precios, mapas, recorridos y enlaces a contacto/agenda.
5. SEO y enlaces del catálogo, formularios, buscador de renta y pie, comparador y fuentes/fechas oficiales de la UF.
6. Exclusión de registros y documentos internos de la salida de Preview.

Los resultados de la ejecución completa y la nueva Preview se incorporarán al informe final de revisión; esta lista no los da por ejecutados.

## Resultados de esta revisión

- 204/204 pruebas Node y 22/22 pruebas Python de materialización aprobadas, sin pruebas omitidas.
- Tres validadores de fichas, ajustes e integración financiera y el validador hipotecario aprobados.
- 148 fichas comprobadas en escritorio, tablet y móvil: 444 comprobaciones sin fallos; el aviso de Privacidad también se revisó en los tres tamaños.
- 808 rutas y recursos locales, 140 hashes de medios y ocho rutas internas excluidas: sin fallos y sin solicitudes a proveedores externos.
- SEO, scripts, mapas, recorridos, datos comerciales, lógica financiera y contextos de formularios conservados. No se enviaron mensajes ni reservas reales.
- 144 fichas regeneradas en memoria conservan los 92 modelos sin reintroducir auditoría y sin escribir los registros internos. Las cuatro destacadas usan la misma política al actualizarse.
- Fixture inglés aprobado: elimina etiquetas de auditoría y páginas documentales, conserva SEO, imágenes, plano ampliable y avisos comerciales; la transformación es idempotente.
- Dos paquetes privados reproducen exactamente 842 archivos fuente, 831 archivos de salida y 140 medios. Archivo SHA256: `41ed5d3300a9c1b54d179a37dc6b3fb29f4cf0c607238ee7e2b8e15eb0413036`.

La Preview protegida y la comprobación remota se registran en el informe de entrega privado. Los datos y el estado contractual real no se modificaron. Esta revisión no autoriza ni ejecuta merge o publicación en Production.
