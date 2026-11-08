# Alcance estratégico SEO/GEO vigente — versión 2

La instrucción del propietario del 8/11/2026 excluye todas las fichas individuales de proyectos. Su exclusión es **del trabajo estratégico y de los indicadores**, no del sitio ni de los índices de Google/Bing. No se eliminan, desindexan, modifican o perjudican técnicamente. No se cambian robots, sitemap, canonical, navegación ni enlaces para aplicar la política.

## Páginas incluidas conocidas

| URL canónica | Área |
|---|---|
| `/` | Identidad, servicios y asesoría; incluye sus secciones como Expertise |
| `/centro-orientacion.html` | Orientación y herramientas educativas |
| `/guia-hipotecaria.html` | Pie, dividendo, costos, tasas, subsidios y FOGAES |
| `/comparador-hipotecario.html` | Comparación educativa de escenarios |
| `/cuando-comprar-propiedad.html` | Decisiones de compra, etapas e inversión |
| `/entorno-desarrollo-urbano.html` | Conectividad, infraestructura y desarrollo urbano |
| `/proyectos.html` | Catálogo general y navegación |
| `/contacto.html` | Contacto corporativo |
| `/agenda-asesoria.html` | Solicitud de asesoría |
| `/trabaja-con-nosotros.html` | Colaboración corporativa |
| `/privacidad.html` | Información corporativa y consentimiento |

Todas bajo `https://sollahms.cl`. Las anclas no crean páginas nuevas. `index.html` no es una duodécima página: la evidencia anterior lo sitúa como alias de `/`. Las variantes se revisan antes de asignarlas al segmento; no se suponen equivalencias de URL desconocidas.

## Exclusiones y elementos preservados

- Todas las fichas individuales, actuales/futuras, sus alias y rutas retiradas. Hay 131 canonical conocidas en el catálogo conservado, pero la regla es más amplia que esa lista.
- Las ocho candidatas históricas quedan marcadas en [previous-candidates-disposition.json](runs/2026-11-08-scope-v2/previous-candidates-disposition.json). Ninguna se optimiza, puntúa ni transfiere al Lab.
- Las páginas técnicas `404.html` y `410.html` se conservan y se separan de las páginas de contenido: no son objetivos estratégicos de adquisición.
- Precios, disponibilidad e inventario dejan de ser dependencias para las prioridades de este trabajo. No se solicitan confirmaciones de stock para continuar SEO/GEO.
- Si una respuesta de IA menciona únicamente un proyecto o cita una ficha, no recibe crédito como resultado del nuevo alcance. La respuesta original se conserva como evidencia privada sin producir análisis del posicionamiento del proyecto.

El catálogo general sí está incluido, aunque enlace fichas. Medir o mejorar el catálogo no habilita evaluar las fichas de destino. Los contactos se atribuyen únicamente a páginas incluidas cuando exista evidencia; una conversión de origen desconocido o de otra página no se asigna por suposición.

## Procedencia y actualización

La lista deriva del sitemap ya conservado, las identidades `detalleUrl` del catálogo y el manifiesto publicado congelado `docs/centro-orientacion-20261031/deployment-files.json`. Este registra 144 HTML: 131 fichas, 11 páginas de contenido incluidas y dos errores. Diez páginas incluidas aparecen en el sitemap histórico; Entorno figura en el paquete publicado y tiene evidencia HTTP previa. No se repitió una auditoría técnica ni se acredita indexación por leer esos archivos.

La política ejecutable está en [scope-v2.json](scope-v2.json). Para una URL nueva: comprobar que es contenido público corporativo/educativo/navegación, que no es ficha y que corresponde a una identidad canónica; registrar evidencia y crear una revisión/versionado del alcance antes de incluirla. Desconocido nunca significa incluido por descarte. Comparaciones con listas distintas deben identificarse como series diferentes o rehacerse con un filtro común documentado.

Las fases 1, 2 y 3 permanecen intactas en sus directorios. Esta política prevalece sobre sus recomendaciones de fichas y no autoriza publicación de sus propuestas antiguas.
